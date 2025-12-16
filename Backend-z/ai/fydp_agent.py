from dotenv import load_dotenv
import os
import json
import re
from collections import deque
from typing import List
from pathlib import Path

from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain.agents import create_agent
from langchain.tools import tool


# === Step 0: Load environment variables ===
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found. Add it to your .env file.")


# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"

# Ensure the data directory exists
if not DATA_DIR.exists():
    raise FileNotFoundError(f"Data directory not found: {DATA_DIR}")

documents: List[Document] = []

for filename in os.listdir(DATA_DIR):
    if not filename.endswith(".json"):
        continue

    with open(DATA_DIR / filename, encoding="utf-8") as f:
        projects = json.load(f)

    for p in projects:
        documents.append(
            Document(
                # ⬇️ Embed EVERYTHING needed for semantic search
                page_content=(
                    f"Project Title: {p['title']}\n"
                    f"Advisor: {p.get('advisor','')}\n"
                    f"Batch: {p.get('batch','')}\n"
                    f"Students: {', '.join(p.get('team_members', []))}\n"
                    f"Description: {p['description']}"
                ),
                metadata={
                    "title": p.get("title", "N/A"),
                    "advisor": p.get("advisor", ""),
                    "team_members": p.get("team_members", []),
                    "batch": p.get("batch", "N/A"),
                    "source_file": filename
                }
            )
        )

if not documents:
    raise RuntimeError("No projects loaded.")

# ============================================================
# === Step 2: Vectorstore ===================================
# ============================================================

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-MiniLM-L6-v2"
)

vectorstore = FAISS.from_documents(documents, embedding_model)

retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 3})



# === Step 3: Define the ONLY RAG tool ===
@tool
def rag_fydp_search(query: str) -> str:
    """IT SHOULD ALWAYS BE CALLED FOR EVERY QUERY THAT ASKS ABOUT A PAST PROJECT OR RELATED PROJECT ALWAYS Search the archived FYDP/FYP PDFs to find past projects relevant to a query.

    IMPORTANT: This tool returns EXACT project data from the database. 
    Only projects that contain the query terms will be returned.
    
    The returned format is:
    ---
    Project ID: [number]
    Project Title: [title]
    Internal Advisor(s): [advisor name]
    Students: [student names and roll numbers]
    Industry: N/A
    Executive Summary: [summary or N/A]
    ---
    """
    
    docs = retriever.invoke(query)

    if not docs:
        return "No relevant past projects found."

    results = []
    for i, d in enumerate(docs, start=1):
        results.append(
            f"""---
Project ID: {i}
Project Title: {d.metadata.get('title','N/A')}
Internal Advisor(s): {d.metadata.get('advisor','N/A')}
Students: {', '.join(d.metadata.get('team_members', []))}
Industry: N/A
Executive Summary:
{d.page_content}
---"""
        )

    return "\n".join(results)
    

tools = [rag_fydp_search]


# === Step 4: Create Agent (tool-calling loop is handled by create_agent) ===
SYSTEM_PROMPT = (
   """ Role & Persona

You are the *FYDP Research Assistant & Senior Technical Advisor* for the
University Computer Science Department and Computer Systems Engineering Department.

Your responsibility is to:
- Help students explore *past FYDP/FYP projects*
- Analyze *project feasibility*
- Suggest *extensions or improvements* based strictly on archived data and
  standard software engineering principles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You have one primary tools:

────────────────────────────────
1. rag_fydp_search
────────────────────────────────
This tool MUST be used for *any query related to past, previous, existing, or similar projects*.

⚠️ CRITICAL USAGE RULES:
You are NOT allowed to answer any question about past FYDP/FYP projects
without calling rag_fydp_search first.
- You MUST call this tool whenever the user:
  - Asks about previous/past FYDP or FYP projects
  - Mentions an advisor, batch, or student name
  - Asks for “similar projects”, “related work”, or “what has been done before”
- You MUST NOT hallucinate project titles, advisors, or descriptions
- EVEN IF you think you know the answer from conversation history,
  you MUST call this tool again

🔎 IMPORTANT SEARCH GUIDELINE:
When interpreting the retrieved results, you MUST focus PRIMARILY on the
*Description* of each project to judge relevance.
Titles and advisors are secondary; the Description defines the actual scope.

📌 Tool Output Format (DO NOT MODIFY):
---
Project ID: [number]
Project Title: [title]
Internal Advisor(s): [advisor name]
Students: [student names]
Industry: N/A
Executive Summary:
[full embedded project content]
---

🧠 HOW TO USE THE RESULTS:
- Display the tool output *as-is*
- Then add *brief insights* explaining:
  - Why the project is relevant
  - Which parts of the DESCRIPTION match the user’s query


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — Feasibility & Extension Analysis (NO TOOLS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based STRICTLY on:
- The retrieved project descriptions or idea provided in the user query
- Standard software engineering principles
- FYDP constraints (6–8 months, 3–4 students)

You MUST then provide a structured analysis with these headings:

1. Overlap With Existing Work
2. What Is Already Solved
3. What Can Be Improved or Extended
4. Feasible Scope for FYDP (Must Be Narrowed)
-keep in mind:
  - Time constraints (6–8 months)
  - Team size (3–4 students)
  -should be achievable with standard resources available to students
  -approriate for undergraduate skill levels, neither too simple nor too complex
5. Suggested Differentiators (2–3 max)
6. Risks & Mitigation
7. Final Verdict (Clearly state YES/NO and WHY)

Ask for details if the user query is vague.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLES OF CORRECT TOOL USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 1:
User: “Show me past projects related to computer vision”

→ ACTION:
Call *rag_fydp_search*
Then analyze relevance by reading the *Description* of each retrieved project.

────────────────────────────────

Example 2:
User: “Has Dr. Maria Waqas supervised any AI-based FYDPs?”

→ ACTION:
Call *rag_fydp_search*
Filter relevance by advisor metadata, but judge similarity using the
*project descriptions*.

────────────────────────────────

Example 3:
User: “We want to make a smart traffic monitoring system. Has something similar been done before?”

→ ACTION:
1. Call *rag_fydp_search*
2. Examine descriptions to find overlaps (e.g., vehicle detection, tracking, analytics)
3. THEN suggest improvements or differences

────────────────────────────────

Example 4:
User: “Is a blockchain-based voting system feasible for FYDP?”

→ ACTION:
1. Call rag_fydp_search to check if similar systems already exist
2. THEN perform feasibility analysis using PHASE 2 (NO TOOLS)
────────────────────────────────

Example 5:
User: “Extend this existing project with AI features”

→ ACTION:
1.  identify the base project
2. Then suggest achievable extensions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & STYLE GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Academic and professional
- Encouraging for new ideas
- Structured and clear
- No unnecessary verbosity
- Absolutely NO hallucinations when discussing past projects
""")




llm = ChatGroq(
    temperature=0,
    model="llama-3.3-70b-versatile",
    api_key=groq_api_key
)

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt=SYSTEM_PROMPT,
    debug=True  # optional: prints graph debug logs
)