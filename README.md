# INSPIRE — Innovation Support Platform for Ideas, Research & Evaluation

An AI-powered academic advising system that helps university students evaluate Final Year Design Project (FYDP) ideas. Students can check novelty against an archive of past projects, get feasibility analysis, and find the best-fit faculty advisor — all through a conversational chat interface.

---

## Project Structure

```
ai/
├── data/                  # JSON files containing past FYDP project records
├── chat.py                # FastAPI router — session management & message streaming
├── fydp_agent.py          # Core AI agent — tools, vector store, LLM loop
└── requirements.txt       # Python dependencies
```

---

## How It Works

### `fydp_agent.py` — The AI Agent

This is the brain of the system. It uses a **LangChain + Groq (LLaMA 3.3 70B)** agent loop with four custom tools and a FAISS vector store built from the project archive.

**Vector Store**
Past FYDP projects from the `data/` JSON files are embedded using `BAAI/bge-base-en-v1.5` (HuggingFace) and indexed into a FAISS store. The index is cached locally after the first build, so subsequent starts are instant.

**Tools**

| Tool | Purpose | Key Constraint |
|---|---|---|
| `archive_search` | Semantic search over the university FYDP archive | Query must be 2–5 keywords only |
| `advisor_portfolio` | Retrieve all projects supervised by a named faculty member | Pass a name with title, not a project idea |
| `rank_advisors` | Rank top 3 advisors by domain alignment to a project idea | Project idea must be ≤15 words |
| `web_search` | Global novelty check via Tavily API | Query must be under 10 words |

**Agent Loop**
The agent runs up to 6 tool-call rounds with automatic Groq API key rotation on rate limits. Round 0 always forces a tool call (retrieval-first). After each run, a forensic trace is printed to the console flagging hallucination risks (e.g., if `archive_search` was never called, or if Round 0 skipped tool use).

**Response Formats**
The system prompt defines three structured output formats the LLM is instructed to follow depending on intent:

- **FORMAT A** — Advisor ranking (triggered by "which advisor" / "who should I approach")
- **FORMAT B** — Advisor portfolio (triggered by naming a specific faculty member)
- **FORMAT C** — Full Feasibility & Complexity Analysis with 7 sections (triggered by explicit words like "feasibility analysis", "complexity audit", "analyse my idea")

Plain novelty or project lookup queries get a prose response.

**Complexity Criteria (MCT)**
Every project idea is evaluated against at least one Minimum Complexity Threshold:
- Custom algorithm or non-trivial optimization
- Full ML pipeline (data → preprocessing → training → evaluation → tuning)
- Hardware–software integration with real embedded constraints
- Distributed system with concurrency, fault tolerance, or consensus
- Mathematical model with formal derivation and empirical validation

Basic CRUD apps, static dashboards, and configurations of off-the-shelf tools are auto-disqualified.

---

### `chat.py` — The FastAPI Router

Handles all HTTP endpoints under `/chat`. Manages MongoDB-backed chat sessions and routes messages to the agent.

**Endpoints**

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat/session` | Create a new session or resume an existing one (returns full history) |
| `POST` | `/chat/message` | Send a message, wait for the full reply |
| `POST` | `/chat/message/stream` | Send a message, receive reply as Server-Sent Events (word-by-word) |
| `GET` | `/chat/history/{session_id}` | Fetch complete message history for a session |
| `GET` | `/chat/sessions` | List all sessions for the current user (with first message as title) |
| `DELETE` | `/chat/session/{session_id}` | Delete a session and all its messages |

**Streaming (`/chat/message/stream`)**
The agent runs in a thread executor to keep FastAPI non-blocking. The reply is streamed word-by-word as SSE `data:` events. The final event is `event: done` and carries the response type (`chat`, `analysis`, `advisor_ranking`, or `portfolio`) so the frontend can render the appropriate UI component.

**History Window**
Each request fetches the last 6 messages from the database to build the LangChain conversation history. The feasibility injection note is appended to the user message server-side when the query triggers a full analysis, keeping the stored message clean.

---

### `data/` — Project Archive

A directory of `.json` files, one per batch year. Each file is a list of project objects:

```json
[
  {
    "title": "Project Title",
    "description": "What was built and how.",
    "advisor": "Dr. Full Name",
    "batch": "2023",
    "team_members": ["Student A", "Student B", "Student C"]
  }
]
```

Files are loaded once at startup, embedded, and indexed. Malformed or empty files are skipped with a log warning.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Groq API keys — add as many as needed for key rotation
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...

# Tavily API key for web search
TAVILY_API_KEY=tvly-...
```

At least one `GROQ_API_KEY_*` and a `TAVILY_API_KEY` are required. The system will raise a `ValueError` at startup if either is missing.

---

## Setup & Running

```bash
# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server (from the project root, not the ai/ directory)
uvicorn main:app --reload

# Or run the agent standalone in the terminal (no server needed)
python ai/fydp_agent.py
```

The FAISS index is built automatically on first run and saved to `ai/faiss_index_cache/`. Subsequent starts load the cached index instead of rebuilding.

---

## Dependencies

Key packages (see `requirements.txt` for full list):

- `fastapi` + `uvicorn` — API server
- `langchain-groq` + `langchain-huggingface` + `langchain-community` — LLM and vector store
- `faiss-cpu` — Similarity search
- `langchain-tavily` — Web search tool
- `pymongo` — MongoDB session/message storage
- `python-dotenv` — Environment variable loading
