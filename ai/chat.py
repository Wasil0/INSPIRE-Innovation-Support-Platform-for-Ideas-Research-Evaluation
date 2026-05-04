from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime
import asyncio

from langchain_core.messages import HumanMessage, AIMessage

from dependencies.auth import get_current_user
from db.db import db

router = APIRouter(prefix="/chat", tags=["chat"])

sessions_col = db["chat_sessions"]
messages_col = db["chat_messages"]


# ============================================================
# Lazy Loaders
# ============================================================

_run_agent        = None
_preprocess_query = None

def get_run_agent():
    global _run_agent
    if _run_agent is None:
        print("🔄 Loading AI agent...")
        from ai.fydp_agent import run_agent
        _run_agent = run_agent
        print("✅ AI agent loaded")
    return _run_agent

def get_preprocess_query():
    global _preprocess_query
    if _preprocess_query is None:
        from ai.fydp_agent import preprocess_query
        _preprocess_query = preprocess_query
    return _preprocess_query


# ============================================================
# Constants
# ============================================================

HISTORY_WINDOW       = 6
ANALYSIS_MARKER  = "## 🔍 Feasibility & Complexity Analysis"
ADVISOR_MARKER   = "### 🥇 Rank #1"
PORTFOLIO_MARKER = "## 📋 Advisor Portfolio"

FEASIBILITY_SYSTEM_NOTE = (
    "\n\n[SYSTEM NOTE: The student wants a full feasibility analysis. "
    "Step 1: Extract 2-5 keywords for the archive_search tool. "
    "Step 2: Use web_search for external validation. "
    "Step 3: Output exactly '## 🔍 Feasibility & Complexity Analysis' followed by 7 sections. "
    "STRICT RULES: "
    "1. For 'Overlap With Existing Work', specify if it is a true methodology overlap or just a domain match. "
    "2. For 'Unsolved Gaps', you MUST quote/paraphrase the exact sentence revealing the gap. If impossible, write EXACTLY: 'Description insufficient to confirm gap — verify with advisor.' "
    "3. Use the Markdown table format for 'Complexity Audit (Against MCT)' and 'Risks & Mitigations'. "
    "4. ONLY include '### 5. 🚀 Technical Differentiators' IF the MCT score is 0/5. Otherwise, skip section 5 entirely. "
    "5. For 'Final Verdict', write EXACTLY ONE sentence tying the YES/NO/CONDITIONAL YES to a specific MCT criterion. "
    "Reference matches by name, batch, advisor, stars + %%, and technique. No raw decimals.]"
)


# ============================================================
# Helpers
# ============================================================

def get_window_size(message: str) -> int:
    return HISTORY_WINDOW


def detect_response_type(text: str) -> str:
    if ANALYSIS_MARKER  in text: return "analysis"
    if ADVISOR_MARKER   in text: return "advisor_ranking"
    if PORTFOLIO_MARKER in text: return "portfolio"
    return "chat"


def build_lc_history(session_id: ObjectId, message: str, window: int) -> list:
    """
    Fetch the last (window-1) stored messages, convert to LangChain
    message objects, then append the new user message (with feasibility
    injection if needed).
    """
    past_docs = list(messages_col.find(
        {"session_id": session_id},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", -1).limit(window - 1))
    past_docs.reverse()

    lc_history = []
    for msg in past_docs:
        if msg["role"] == "user":
            lc_history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_history.append(AIMessage(content=msg["content"]))

    preprocess_fn       = get_preprocess_query()
    _, needs_analysis   = preprocess_fn(message)

    final_message = message + FEASIBILITY_SYSTEM_NOTE if needs_analysis else message
    lc_history.append(HumanMessage(content=final_message))

    return lc_history


def persist_messages(session_id: ObjectId, user_id, message: str, reply: str):
    now = datetime.utcnow()
    messages_col.insert_many([
        {
            "session_id": session_id,
            "user_id":    user_id,
            "role":       "user",
            "content":    message,
            "created_at": now
        },
        {
            "session_id": session_id,
            "user_id":    user_id,
            "role":       "assistant",
            "content":    reply,
            "created_at": now
        }
    ])


# ============================================================
# Create or Resume Chat Session
# ============================================================

@router.post("/session")
def create_or_resume_session(
    session_id: str | None = None,
    current_user=Depends(get_current_user)
):
    user_id = current_user["_id"]

    if session_id:
        session = sessions_col.find_one({
            "_id": ObjectId(session_id),
            "user_id": user_id
        })
        if not session:
            raise HTTPException(404, "Session not found")

        all_msgs = list(messages_col.find(
            {"session_id": ObjectId(session_id)},
            {"_id": 0, "role": 1, "content": 1}
        ).sort("created_at", 1))

        return {"session_id": session_id, "history": all_msgs}

    result = sessions_col.insert_one({
        "user_id":    user_id,
        "created_at": datetime.utcnow()
    })
    return {"session_id": str(result.inserted_id), "history": []}


# ============================================================
# Send Message — Standard (waits for full reply)
# ============================================================

@router.post("/message")
def chat_message(
    session_id: str,
    message: str,
    current_user=Depends(get_current_user)
):
    user_id = current_user["_id"]
    try:
        sid = ObjectId(session_id)
    except Exception:
        raise HTTPException(400, "Invalid session ID format")

    if not sessions_col.find_one({"_id": sid, "user_id": user_id}):
        raise HTTPException(403, "Invalid session")

    lc_history   = build_lc_history(sid, message, get_window_size(message))
    run_agent_fn = get_run_agent()

    try:
        assistant_reply = run_agent_fn(lc_history)
    except Exception as e:
        raise HTTPException(500, f"Agent error: {e}")

    persist_messages(sid, user_id, message, assistant_reply)

    return {
        "assistant": assistant_reply,
        "type":      detect_response_type(assistant_reply)
    }


# ============================================================
# Send Message — Streaming (SSE, word-by-word)
# ============================================================

@router.post("/message/stream")
async def chat_message_stream(
    session_id: str,
    message: str,
    current_user=Depends(get_current_user)
):
    """
    Identical logic to /message but streams the reply as Server-Sent Events.

    Event format:
      data: <word or token>          — during generation
      event: done\ndata: <type>      — final event, carries response type

    Frontend usage (fetch):
      const res  = await fetch("/chat/message/stream?session_id=...&message=...", { method: "POST" })
      const reader = res.body.getReader()
      // read chunks and append to UI
    """
    user_id = current_user["_id"]
    try:
        sid = ObjectId(session_id)
    except Exception:
        raise HTTPException(400, "Invalid session ID format")

    if not sessions_col.find_one({"_id": sid, "user_id": user_id}):
        raise HTTPException(403, "Invalid session")

    lc_history = build_lc_history(sid, message, get_window_size(message))

    async def event_generator():
        loop         = asyncio.get_event_loop()
        run_agent_fn = get_run_agent()

        try:
            reply = await loop.run_in_executor(None, run_agent_fn, lc_history)
        except Exception as e:
            yield f"data: ERROR: {e}\n\n"
            return

        # Stream word-by-word so the frontend can render progressively
        words = reply.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {chunk}\n\n"
            await asyncio.sleep(0.01)

        # Final event carries the response type for the frontend to act on
        yield f"event: done\ndata: {detect_response_type(reply)}\n\n"

        # Persist only after streaming is complete
        persist_messages(sid, user_id, message, reply)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ============================================================
# Fetch Full Chat History
# ============================================================

@router.get("/history/{session_id}")
def get_chat_history(
    session_id: str,
    current_user=Depends(get_current_user)
):
    user_id = current_user["_id"]
    try:
        sid = ObjectId(session_id)
    except Exception:
        raise HTTPException(400, "Invalid session ID format")

    if not sessions_col.find_one({"_id": sid, "user_id": user_id}):
        raise HTTPException(403, "Invalid session")

    history = list(messages_col.find(
        {"session_id": sid},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", 1))

    return {"history": history}


# ============================================================
# List All Sessions (with first message as title)
# ============================================================

@router.get("/sessions")
def list_user_sessions(current_user=Depends(get_current_user)):
    user_id = current_user["_id"]

    sessions = list(sessions_col.find(
        {"user_id": user_id},
        {"_id": 1, "created_at": 1}
    ).sort("created_at", -1))

    session_ids = [s["_id"] for s in sessions]

    first_messages = messages_col.aggregate([
        {"$match": {"session_id": {"$in": session_ids}, "role": "user"}},
        {"$sort":  {"created_at": 1}},
        {"$group": {"_id": "$session_id", "first_message": {"$first": "$content"}}}
    ])

    first_map = {m["_id"]: m["first_message"] for m in first_messages}

    return [
        {
            "session_id": str(s["_id"]),
            "created_at": s["created_at"],
            "title":      first_map.get(s["_id"], "New Chat")
        }
        for s in sessions
    ]


# ============================================================
# Delete a Session and its Messages
# ============================================================

@router.delete("/session/{session_id}")
def delete_session(
    session_id: str,
    current_user=Depends(get_current_user)
):
    user_id = current_user["_id"]
    try:
        sid = ObjectId(session_id)
    except Exception:
        raise HTTPException(400, "Invalid session ID format")

    result = sessions_col.delete_one({"_id": sid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Session not found")

    messages_col.delete_many({"session_id": sid})
    return {"deleted": session_id}



# CHANGES FORM ORIGINAL

# build_lc_history — single helper that fetches history, runs preprocess_query, and injects the feasibility note in one place instead of duplicating that logic
# persist_messages — extracted so both /message and /message/stream share identical DB writes
# detect_response_type — added to both endpoints so the frontend knows whether to render a plain chat bubble, a full analysis report, advisor cards, or a proposal
# /message/stream — new SSE endpoint; runs the blocking agent in a thread executor so FastAPI stays non-blocking, then streams word-by-word with a done event at the end carrying the response type
# DELETE /session/{session_id} — bonus endpoint that cleans up both the session document and all its messages, which you'll need for a sidebar "delete chat" button
