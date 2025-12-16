from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from collections import deque

from dependencies.auth import get_current_user
from db.db import db


router = APIRouter(prefix="/chat", tags=["chat"])

sessions_col = db["chat_sessions"]
messages_col = db["chat_messages"]

_agent = None

def get_agent():
    """
    Lazily loads the AI agent (fydp_agent) and caches it in memory.
    Ensures the vectorstore and LLM are loaded only once.
    """
    global _agent
    if _agent is None:
        print("🔄 Loading AI agent...")
        from ai.fydp_agent import agent  # lazy import
        _agent = agent
        print("✅ AI agent loaded")
    return _agent


# ==========================================
# Create or Resume Chat Session
# ==========================================
@router.post("/session")
def create_or_resume_session(
    session_id: str | None = None,
    current_user=Depends(get_current_user)
):
    """
    Purpose:
    - Create a new chat session for the logged-in user if no session_id is provided.
    - Resume an existing session if session_id is provided.
    - Returns the last few messages (full history) if resuming.

    Frontend Usage:
    - Call on page load or when user selects a session.
    - If no session_id, a new session is created and an empty history is returned.
    - If session_id exists, full message history is returned to populate the chat window.

    Example Response:
    {
        "session_id": "693da00065e317a325b54005",
        "history": [
            {"role": "user", "content": "Hello, bot!"},
            {"role": "assistant", "content": "Hi! How can I help you with FYDP projects?"}
        ]
    }
    """
    user_id = current_user["_id"]

    if session_id:
        session = sessions_col.find_one({
            "_id": ObjectId(session_id),
            "user_id": user_id
        })
        if not session:
            raise HTTPException(404, "Session not found")

        # Fetch all messages for FE display
        all_msgs = list(messages_col.find(
            {"session_id": ObjectId(session_id)},
            {"_id": 0, "role": 1, "content": 1}
        ).sort("created_at", 1))  # oldest first

        return {
            "session_id": session_id,
            "history": all_msgs
        }

    # Create new session
    result = sessions_col.insert_one({
        "user_id": user_id,
        "created_at": datetime.utcnow()
    })

    return {"session_id": str(result.inserted_id), "history": []}


# ==========================================
# Send User Message and Get Bot Response
# ==========================================
@router.post("/message")
def chat_message(
    session_id: str,
    message: str,
    current_user=Depends(get_current_user)
):
    """
    Purpose:
    - Sends a user message to the AI agent.
    - Retrieves the AI assistant response.
    - Stores both user and assistant messages in MongoDB.

    Frontend Usage:
    - Called whenever the user sends a message in the chat UI.
    - Frontend appends the user message locally and then appends the returned assistant message.
    - Does NOT return full chat history (frontend already has history).

    Example Response:
    {
        "assistant": "Here is the response from the AI assistant..."
    }
    """
    user_id = current_user["_id"]
    sid = ObjectId(session_id)

    if not sessions_col.find_one({"_id": sid, "user_id": user_id}):
        raise HTTPException(403, "Invalid session")

    # Fetch last 6 messages for AI context
    past = list(messages_col.find(
        {"session_id": sid},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", -1).limit(6))

    history = deque(reversed(past), maxlen=6)
    history.append({"role": "user", "content": message})

    agent = get_agent()
    result = agent.invoke({"messages": list(history)})

    assistant = next(
        m.content
        for m in reversed(result["messages"])
        if m.type in ("assistant", "ai")
    )

    now = datetime.utcnow()
    messages_col.insert_many([
        {
            "session_id": sid,
            "user_id": user_id,
            "role": "user",
            "content": message,
            "created_at": now
        },
        {
            "session_id": sid,
            "user_id": user_id,
            "role": "assistant",
            "content": assistant,
            "created_at": now
        }
    ])

    return {
        "assistant": assistant
    }


# ==========================================
# Fetch Full Chat History
# ==========================================
@router.get("/history/{session_id}")
def get_chat_history(
    session_id: str,
    current_user=Depends(get_current_user)
):
    """
    Purpose:
    - Retrieve the full message history of a specific chat session.
    - Useful for loading chat messages when opening or refreshing a session.

    Frontend Usage:
    - Called once when the chat window is opened.
    - Populates the chat window with all past messages.

    Example Response:
    {
        "history": [
            {"role": "user", "content": "Hello, bot!"},
            {"role": "assistant", "content": "Hi! How can I help you with FYDP projects?"}
        ]
    }
    """
    user_id = current_user["_id"]
    sid = ObjectId(session_id)

    if not sessions_col.find_one({"_id": sid, "user_id": user_id}):
        raise HTTPException(403, "Invalid session")

    history = list(messages_col.find(
        {"session_id": sid},
        {"_id": 0, "role": 1, "content": 1}
    ).sort("created_at", 1))

    return {"history": history}


# ==========================================
# List All User Sessions with First Message
# ==========================================
@router.get("/sessions")
def list_user_sessions(current_user=Depends(get_current_user)):
    """
    Purpose:
    - Retrieve all chat sessions for the logged-in user.
    - Returns session_id, created_at, and first user message (for sidebar display).

    Frontend Usage:
    - Populate the session sidebar with session list and preview.
    - First message serves as a "title" for each chat session.

    Example Response:
    [
        {
            "session_id": "693da00065e317a325b54005",
            "created_at": "2025-12-13T17:18:56.806Z",
            "title": "Hello, bot!"
        },
        {
            "session_id": "693da11165e317a325b54012",
            "created_at": "2025-12-14T10:00:21.123Z",
            "title": "New FYDP discussion"
        }
    ]
    """
    user_id = current_user["_id"]

    sessions = list(
        sessions_col.find(
            {"user_id": user_id},
            {"_id": 1, "created_at": 1}
        ).sort("created_at", -1)
    )

    session_ids = [s["_id"] for s in sessions]

    # Fetch first USER message per session
    first_messages = messages_col.aggregate([
        {
            "$match": {
                "session_id": {"$in": session_ids},
                "role": "user"
            }
        },
        {
            "$sort": {"created_at": 1}
        },
        {
            "$group": {
                "_id": "$session_id",
                "first_message": {"$first": "$content"}
            }
        }
    ])

    first_map = {
        m["_id"]: m["first_message"]
        for m in first_messages
    }

    response = []
    for s in sessions:
        response.append({
            "session_id": str(s["_id"]),
            "created_at": s["created_at"],
            "title": first_map.get(s["_id"], "New Chat")
        })

    return response
