import os
import re
import json
from pathlib import Path
from typing import List
from collections import defaultdict
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.vectorstores.utils import DistanceStrategy
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_tavily import TavilySearch


# ============================================================
# Component 1: Environment & Path Initialization
# ============================================================

load_dotenv()
tavily_api_key = os.getenv("TAVILY_API_KEY")
if not tavily_api_key:
    raise ValueError("System Error: TAVILY_API_KEY is missing.")

_groq_keys: list[str] = []
i = 1
while True:
    key = os.getenv(f"GROQ_API_KEY_{i}")
    if not key:
        break
    _groq_keys.append(key)
    i += 1

if not _groq_keys:
    raise ValueError(
        "No GROQ_API_KEY_* found. "
        "Add GROQ_API_KEY_1, GROQ_API_KEY_2, etc. to your .env file."
    )

SCRIPT_DIR      = Path(__file__).parent
DATA_DIR        = SCRIPT_DIR / "data"
FAISS_INDEX_DIR = SCRIPT_DIR / "faiss_index_cache"


# ============================================================
# Component 2: Technical Pattern Extraction
# ============================================================

TECHNICAL_KEYWORDS = [
    "machine learning", "deep learning", "neural network", "classification",
    "object detection", "nlp", "natural language processing", "computer vision",
    "transformer", "fine-tun", "training", "dataset", "model", "pipeline",
    "iot", "embedded", "raspberry", "arduino", "sensor", "hardware",
    "distributed", "microservices", "concurrency", "fault tolerance",
    "recommendation", "clustering", "regression", "reinforcement",
    "optimization", "algorithm", "graph neural", "simulation",
    "real-time", "edge computing", "federated", "generative",
    "api", "crud", "database", "portal", "management system"
]

COMPLEXITY_NEGATIVE_SIGNALS = [
    "crud", "management system", "portal", "simple api", "basic website",
    "information system", "booking system", "inventory system"
]

def extract_technical_patterns(text: str) -> dict:
    text_lower = text.lower()
    positive = [kw for kw in TECHNICAL_KEYWORDS
                if kw in text_lower and kw not in COMPLEXITY_NEGATIVE_SIGNALS]
    negative = [kw for kw in COMPLEXITY_NEGATIVE_SIGNALS if kw in text_lower]
    return {"positive": positive, "negative": negative}


# ============================================================
# Component 3: Vector Store
# ============================================================

embedding_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-base-en-v1.5",
    encode_kwargs={"normalize_embeddings": True}
)


def initialize_persistent_vectorstore() -> FAISS:
    if FAISS_INDEX_DIR.exists():
        print("System Log: Persistent FAISS index found. Loading...")
        return FAISS.load_local(
            str(FAISS_INDEX_DIR),
            embedding_model,
            allow_dangerous_deserialization=True
        )

    print("System Log: No index found. Building from documents...")
    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Critical Error: Data directory not found at {DATA_DIR}")

    documents: List[Document] = []
    for filename in sorted(os.listdir(DATA_DIR)):
        if not filename.endswith(".json"):
            continue
        filepath = DATA_DIR / filename
        try:
            with open(filepath, encoding="utf-8") as f:
                projects = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"System Log: Skipping {filename} — {e}")
            continue

        if not isinstance(projects, list):
            continue

        for project in projects:
            title       = project.get("title", "").strip()
            description = project.get("description", "").strip()
            if not title or not description:
                continue

            semantic_content = (
                f"Project Title: {title}\n"
                f"Advisor: {project.get('advisor', 'Unknown')}\n"
                f"Batch: {project.get('batch', 'N/A')}\n"
                f"Students: {', '.join(project.get('team_members', []))}\n"
                f"Description: {description}"
            )
            structured_metadata = {
                "title":        title,
                "advisor":      project.get("advisor", "Unknown"),
                "team_members": project.get("team_members", []),
                "batch":        project.get("batch", "N/A"),
                "source_file":  filename
            }
            documents.append(Document(
                page_content=semantic_content,
                metadata=structured_metadata
            ))

    if not documents:
        raise RuntimeError("Critical Error: No valid project records found.")

    print(f"System Log: Building FAISS index from {len(documents)} documents...")
    vectorstore = FAISS.from_documents(
        documents, embedding_model,
        distance_strategy=DistanceStrategy.MAX_INNER_PRODUCT
    )
    vectorstore.save_local(str(FAISS_INDEX_DIR))
    print(f"System Log: Index saved. {len(documents)} documents indexed.")
    return vectorstore


persistent_vectorstore = initialize_persistent_vectorstore()


# ============================================================
# Component 4: Helpers
# ============================================================

def score_to_label(score: float) -> str:
    if score >= 0.75:   return "STRONG MATCH"
    elif score >= 0.45: return "MODERATE MATCH"
    else:               return "WEAK MATCH"

def score_to_stars(score: float) -> str:
    """Convert similarity score to a human-readable star rating."""
    if score >= 0.80:   return "★★★★★"
    elif score >= 0.70: return "★★★★☆"
    elif score >= 0.60: return "★★★☆☆"
    elif score >= 0.45: return "★★☆☆☆"
    else:               return "★☆☆☆☆"

def score_to_pct(score: float) -> str:
    """Round score to a clean percentage string."""
    return f"{round(score * 100)}%"

def batch_sort_key(doc: Document) -> int:
    batch = doc.metadata.get("batch", "0000")
    m = re.search(r"\d{4}", str(batch))
    return int(m.group()) if m else 0

def extract_description(content: str) -> str:
    lines = content.split("\n")
    desc_lines = []
    capturing = False
    for line in lines:
        if line.startswith("Description:"):
            capturing = True
            rest = line.replace("Description:", "").strip()
            if rest:
                desc_lines.append(rest)
        elif capturing:
            desc_lines.append(line)
    return "\n".join(desc_lines).strip() if desc_lines else content


# ============================================================
# Component 5: Tools
# ============================================================

@tool
def archive_search(query: str) -> str:
    """
    Search the university FYDP archive for past projects.

    Use for ALL internal queries: project lookups, novelty checks,
    domain saturation analysis, and related-work identification.

    CRITICAL RULES for calling this tool:
    - query must be 2–5 keywords ONLY. Never a full sentence.
      CORRECT:   "drowsiness detection eye blink"
      INCORRECT: "Are there any past projects on drowsiness detection?"
    - Never call this tool for advisor lookups — use advisor_portfolio instead.
    - If zero results: report HIGHLY_NOVEL, then call web_search next.

    Args:
        query: 2–5 keywords. E.g., "sign language recognition CNN".
    """
    HARD_SCORE_CUTOFF = 0.45
    seen_titles: set  = set()
    all_matches: list = []

    try:
        primary = persistent_vectorstore.similarity_search_with_score(query, k=6)
        for doc, score in primary:
            if score < HARD_SCORE_CUTOFF:
                continue
            title = doc.metadata.get("title", "N/A")
            if title not in seen_titles:
                seen_titles.add(title)
                all_matches.append((doc, score))
    except Exception as e:
        return f"ARCHIVE ERROR: {e}"

    if not all_matches:
        for variant in [f"{query} system", f"{query} detection", f"{query} model"]:
            try:
                for doc, score in persistent_vectorstore.similarity_search_with_score(variant, k=3):
                    if score < HARD_SCORE_CUTOFF:
                        continue
                    title = doc.metadata.get("title", "N/A")
                    if title not in seen_titles:
                        seen_titles.add(title)
                        all_matches.append((doc, score))
            except Exception:
                continue

    if not all_matches:
        return (
            "ARCHIVE RESULT: HIGHLY_NOVEL\n"
            "Zero overlapping projects found in the university database.\n"
            "This topic appears completely unexplored here.\n"
            "ACTION REQUIRED: call web_search next for global novelty check."
        )

    all_matches.sort(key=lambda x: x[1], reverse=True)

    advisor_counts: dict = {}
    batch_dist: dict     = {}
    for doc, _ in all_matches:
        a = doc.metadata.get("advisor", "Unknown")
        b = doc.metadata.get("batch", "N/A")
        advisor_counts[a] = advisor_counts.get(a, 0) + 1
        batch_dist[b]     = batch_dist.get(b, 0) + 1

    total   = len(all_matches)
    strong  = sum(1 for _, s in all_matches if s >= 0.75)

    if total >= 6 or strong >= 3:
        saturation  = "HIGH — domain heavily explored, strong differentiator mandatory"
        novelty     = "LOW_NOVELTY"
    elif total >= 3:
        saturation  = "MODERATE — related work exists, clear novelty angle needed"
        novelty     = "MODERATE_NOVELTY"
    else:
        saturation  = "LOW — relatively unexplored, good opportunity"
        novelty     = "GOOD_NOVELTY"

    lines = [
        "UNIVERSITY ARCHIVE SEARCH RESULTS",
        f'Query: "{query}"',
        f"NOVELTY_STATUS    : {novelty}",
        f"TOTAL_MATCHES     : {total}",
        f"STRONG_MATCHES    : {strong}  (score >= 0.75)",
        f"SATURATION        : {saturation}",
        f"ACTIVE_ADVISORS   : {', '.join(advisor_counts.keys())}",
        f"BATCH_SPREAD      : {dict(sorted(batch_dist.items()))}",
        "",
        "MATCHED PROJECTS (read every description carefully)",
        ""
    ]

    for i, (doc, score) in enumerate(all_matches, start=1):
        label    = score_to_label(score)
        stars    = score_to_stars(score)
        pct      = score_to_pct(score)
        members  = doc.metadata.get("team_members", [])
        team_str = ", ".join(members) if isinstance(members, list) else str(members)
        pat      = extract_technical_patterns(doc.page_content)
        pos_str  = ", ".join(pat["positive"])  if pat["positive"]  else "none"
        neg_str  = ", ".join(pat["negative"])  if pat["negative"]  else "none"
        desc     = extract_description(doc.page_content)

        lines += [
            f"MATCH #{i} | {stars} {pct} similarity | {label}",
            f"  Title   : {doc.metadata.get('title', 'N/A')}",
            f"  Advisor : {doc.metadata.get('advisor', 'N/A')}",
            f"  Batch   : {doc.metadata.get('batch', 'N/A')}",
            f"  Team    : {team_str}",
            f"  Tech+   : {pos_str}",
            f"  Tech-   : {neg_str}",
            f"  Description: {desc}",
            ""
        ]

    return "\n".join(lines)


@tool
def advisor_portfolio(advisor_name: str) -> str:
    """
    Retrieve all FYDP projects supervised by a specific faculty member,
    sorted most-recent-first.

    CRITICAL RULES:
    - advisor_name must be a name with title ONLY. E.g., "Dr. Ali Ismail"
    - Never pass a project idea to this tool — use rank_advisors for that.

    Args:
        advisor_name: Name with title. E.g., "Dr. Majida Kazmi".
    """
    all_docs = list(persistent_vectorstore.docstore._dict.values())

    search_name = (
        advisor_name
        .replace("Dr.", "").replace("Mr.", "").replace("Ms.", "").replace("Prof.", "")
        .strip().lower()
    )

    matched = [
        doc for doc in all_docs
        if search_name in doc.metadata.get("advisor", "").lower()
    ]

    if not matched:
        return (
            f"PORTFOLIO RESULT: No records found for '{advisor_name}'.\n"
            "Check spelling or try a shorter name fragment."
        )

    matched.sort(key=batch_sort_key, reverse=True)
    total = len(matched)

    all_patterns: list = []
    for doc in matched:
        pat = extract_technical_patterns(doc.page_content)
        all_patterns.extend(pat["positive"])

    pattern_freq: dict = {}
    for p in all_patterns:
        pattern_freq[p] = pattern_freq.get(p, 0) + 1
    top_patterns = sorted(pattern_freq, key=pattern_freq.get, reverse=True)[:8]

    SHOW_CAP     = 6
    DESC_CAP     = 450
    show_docs    = matched[:SHOW_CAP]
    hidden_count = total - SHOW_CAP

    lines = [
        f"ADVISOR PORTFOLIO: {advisor_name}",
        f"Total projects in archive: {total}",
        f"RECURRING RESEARCH THEMES (across all {total} projects):",
        f"  {', '.join(top_patterns) if top_patterns else 'none identified'}",
        "",
        f"MOST RECENT {min(SHOW_CAP, total)} PROJECTS (detailed)",
        ""
    ]

    for doc in show_docs:
        title    = doc.metadata.get("title", "N/A")
        batch    = doc.metadata.get("batch", "N/A")
        members  = doc.metadata.get("team_members", [])
        team_str = ", ".join(members) if isinstance(members, list) else str(members)
        desc     = extract_description(doc.page_content)[:DESC_CAP]
        pat      = extract_technical_patterns(doc.page_content)
        pos_str  = ", ".join(pat["positive"]) if pat["positive"] else "none"

        lines += [
            f"[{batch}] {title}",
            f"  Team    : {team_str}",
            f"  Tech+   : {pos_str}",
            f"  Summary : {desc}",
            ""
        ]

    if hidden_count > 0:
        lines.append(
            f"Note: {hidden_count} older project(s) exist in archive but are not "
            f"shown here. The recurring themes above reflect ALL {total} projects."
        )

    return "\n".join(lines)


@tool
def rank_advisors(project_idea: str) -> str:
    """
    Rank the top 3 advisors for a proposed FYDP project by domain alignment.

    CRITICAL RULES:
    - project_idea must be MAX 15 WORDS. No punctuation. No full sentences.
      CORRECT:   "real-time drowsiness detection eye blink CNN"
      INCORRECT: "I want to build a system that detects drowsiness in drivers."
    - Never pass an advisor name to this tool — use advisor_portfolio for that.

    Args:
        project_idea: Max 15 words. E.g., "federated learning edge IoT privacy".
    """
    SIMILARITY_CUTOFF = 0.35

    try:
        docs_scores = persistent_vectorstore.similarity_search_with_score(project_idea, k=12)
    except Exception as e:
        return f"ADVISOR SEARCH ERROR: {e}"

    docs_scores = [(d, s) for d, s in docs_scores if s >= SIMILARITY_CUTOFF]

    if not docs_scores:
        return (
            "ADVISOR SEARCH: No relevant projects found above threshold.\n"
            "Cannot make a data-grounded recommendation.\n"
            "Try broadening the project description."
        )

    all_docs = list(persistent_vectorstore.docstore._dict.values())
    advisor_totals: dict = {}
    for doc in all_docs:
        a = doc.metadata.get("advisor", "Unknown")
        advisor_totals[a] = advisor_totals.get(a, 0) + 1

    STOPWORDS = {
        "a","an","the","and","or","of","in","to","for","with","on","at","by","from",
        "this","that","is","are","was","were","be","been","being","have","has","had",
        "do","does","did","will","would","could","should","may","might","shall",
        "project","title","advisor","batch","students","description","using","based",
        "system","which","their","into","also","such","these","those","its","our",
        "can","been","about","more","than","through","after","during","between",
        "also","first","second","third","well","then","when","where","while"
    }

    advisor_data: dict = defaultdict(lambda: {
        "scores": [], "evidence": [], "word_freq": {}
    })

    for doc, score in docs_scores:
        adv   = doc.metadata.get("advisor", "Unknown")
        title = doc.metadata.get("title", "N/A")
        batch = doc.metadata.get("batch", "N/A")
        desc  = extract_description(doc.page_content)[:350]

        advisor_data[adv]["scores"].append(score)
        advisor_data[adv]["evidence"].append({
            "title": title,
            "batch": batch,
            "score": score,   # keep raw for formatting in system prompt
            "desc":  desc
        })
        for w in doc.page_content.lower().split():
            w = w.strip(".,()[]:")
            if len(w) > 4 and w not in STOPWORDS:
                advisor_data[adv]["word_freq"][w] = \
                    advisor_data[adv]["word_freq"].get(w, 0) + 1

    ranked = []
    for adv, data in advisor_data.items():
        mean_score = sum(data["scores"]) / len(data["scores"])
        top_themes = sorted(
            data["word_freq"], key=data["word_freq"].get, reverse=True
        )[:6]
        ranked.append((adv, {
            "mean_score":  mean_score,   # raw float — LLM will format via prompt
            "match_count": len(data["scores"]),
            "total":       advisor_totals.get(adv, 1),
            "evidence":    data["evidence"],
            "themes":      top_themes
        }))

    ranked.sort(key=lambda x: (x[1]["mean_score"], x[1]["match_count"]), reverse=True)
    ranked = ranked[:3]

    lines = [
        "ADVISOR RECOMMENDATIONS",
        f'For project idea: "{project_idea}"',
        "Ranking criterion: mean similarity score (higher = stronger domain alignment).",
        ""
    ]

    medals = ["#1 BEST MATCH", "#2 STRONG FIT", "#3 GOOD FIT"]
    for rank, (adv, data) in enumerate(ranked):
        mean_pct   = score_to_pct(data["mean_score"])
        mean_stars = score_to_stars(data["mean_score"])
        lines += [
            f"RANK {medals[rank]}: {adv}",
            f"  Overall Match      : {mean_stars} {mean_pct}",
            f"  Matched Projects   : {data['match_count']} of {data['total']} supervised",
            f"  Domain Keywords    : {', '.join(data['themes'])}",
            f"  Supporting Evidence:"
        ]
        for ev in data["evidence"]:
            ev_pct   = score_to_pct(ev["score"])
            ev_stars = score_to_stars(ev["score"])
            ev_label = score_to_label(ev["score"])
            lines += [
                f"    [{ev['batch']}] {ev['title']}",
                f"    Similarity: {ev_stars} {ev_pct} | {ev_label}",
                f"    → {ev['desc']}",
                ""
            ]
        lines.append("")

    lines.append(
        "DISCLAIMER: Rankings are based on archived project data only. "
        "Confirm advisor availability directly before approaching."
    )
    return "\n".join(lines)


_tavily_search = TavilySearch(max_results=4)

@tool
def web_search(query: str) -> str:
    """
    Search the internet for global novelty context, state-of-the-art benchmarks,
    and commercial/research alternatives to a proposed project.

    CRITICAL RULES:
    - query must be under 10 words.
    - When writing your response, cite the URL after every factual claim.
    - Never invent publication years.

    Args:
        query: Under 10 words. E.g., "sign language recognition transformer 2024".
    """
    try:
        results = _tavily_search.invoke(query)

        if isinstance(results, dict):
            results = results.get("results", [])

        if not isinstance(results, list) or not results:
            return "GLOBAL SEARCH: No results returned."

        formatted = []
        for r in results:
            url = (
                r.get("url") or
                r.get("link") or
                (r.get("metadata") or {}).get("source") or
                None
            )
            if not url:
                continue

            content = (r.get("content") or r.get("snippet") or "").strip()[:600]
            formatted.append(
                f"TITLE  : {r.get('title', 'N/A')}\n"
                f"URL    : {url}\n"
                f"CONTENT: {content}\n"
                f"CITE AS: [Source: {url}]"
            )

        if not formatted:
            return "GLOBAL SEARCH: Results returned but none had a valid URL. Try a different query."

        return (
            "GLOBAL WEB SEARCH RESULTS\n\n"
            + "\n\n---\n\n".join(formatted)
        )

    except Exception as e:
        return f"TAVILY ERROR: {e}. Try a shorter query."


agent_tools = [archive_search, advisor_portfolio, rank_advisors, web_search]
TOOL_MAP: dict = {t.name: t for t in agent_tools}


# ============================================================
# Component 6: System Prompt
# ============================================================


SYSTEM_STATE_MODIFIER = """
You are Research Architect — a senior engineering advisor for Final Year Design
Projects (FYDPs) at a university CS/CSE department. Give students rigorous,
technically grounded analysis. Every sentence must reference a concrete technical
decision. A student must be able to take direct action from your response.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 0 — BEFORE WRITING ANYTHING, SELECT YOUR FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the student's intent. Pick exactly one row. Use ONLY that format.

| Student intent                                      | Tool               | Format       |
|-----------------------------------------------------|--------------------|--------------|
| Past project lookup / novelty / similar projects    | archive_search     | PROSE        |
| Global research / state of the art / web search     | web_search         | PROSE        |
| Tell me about [Advisor Name]'s projects             | advisor_portfolio  | FORMAT B     |
| Which advisor / who should I approach               | rank_advisors      | FORMAT A     |
| Explicit feasibility / complexity / full breakdown  | archive_search     | FORMAT C     |
|                                                     |   + web_search     |              |

⚠️ FORMAT C is triggered ONLY by explicit words: "feasibility analysis",
"complexity audit", "full breakdown", "analyse my project/idea".
"Is it novel?" → PROSE only. Never emit FORMAT C headers for novelty checks.

DISAMBIGUATION:
- rank_advisors     → takes a PROJECT IDEA (≤15 words). Never a name.
- advisor_portfolio → takes a NAME WITH TITLE. Never an idea.

KEYWORD EXTRACTION: Before calling archive_search or rank_advisors, extract
2–5 keywords. Never pass a full sentence. No identifiable topic → ask one
clarifying question first.

COMPOUND QUERIES ("search X AND run feasibility"):
archive_search → web_search → FORMAT C response.

CONVERSATION MEMORY: Scan history before every tool call.
Same subject already retrieved → reuse results, no new tool call.
Follow-up questions (related to prev query) → answer from prior results without calling any tool.

KEYWORD EXTRACTION: Before calling archive_search or rank_advisors...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — SCORE CONVERSION  (apply everywhere, no exceptions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tool outputs raw decimals. NEVER show them. Always convert:

  80%+   → ★★★★★  Very Strong Match
  70–79% → ★★★★☆  Strong Match
  60–69% → ★★★☆☆  Moderate Match
  45–59% → ★★☆☆☆  Weak Match
  <45%   → ★☆☆☆☆  Very Weak Match

Always write: ★★★☆☆ 66% (Moderate Match). Never: 0.6578.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SPECIFICITY RULES  (apply to every format)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ VAGUE: "The archive has computer vision projects."
✓ REQUIRED: "'PPE Compliance Monitoring' (Batch 2021, Dr. XYZ — ★★★☆☆ 61%)
   used YOLOv5 on a 4,000-image dataset, achieving 89% mAP on helmet detection
   but without temporal tracking across frames."

RULES — enforced in every response:
1. Name every matched project with batch, advisor, and converted score.
2. State the specific technique (model name, dataset, metric) per project.
3. Every web result claim → append [Source: <URL>] immediately after the
   sentence. No URL = delete the claim. Never invent URLs.
4. No filler: "demonstrates expertise", "it appears that", "great idea".
5. Never invent projects, scores, or techniques not in tool output.

CONVERSATION MEMORY: Scan history before every tool call.
Same subject already retrieved → reuse, no new tool call.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — HARD CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEAM: 3–4 undergraduates | TIMELINE: 7–8 months

MCT — project must satisfy AT LEAST ONE:
  ✦ Custom algorithm or non-trivial optimization (not just API calls)
  ✦ Full ML pipeline: data collection → preprocessing → training → eval → tuning
  ✦ Hardware–software integration with real embedded constraints
  ✦ Distributed system with concurrency, fault tolerance, or consensus
  ✦ Mathematical model with formal derivation and empirical validation

AUTO-DISQUALIFIERS:
  ✗ Basic CRUD / static dashboards / informational portals
  ✗ ≥95% configuration of off-the-shelf tools
  ✗ Completable by one developer in under 6 weeks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT A — rank_advisors output
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRE-WRITE CHECKLIST — confirm before generating:
  □ Starts with "### 🥇 Rank #1 —" not a numbered list or prose paragraph
  □ Each advisor block has the 3-row summary table
  □ Each advisor has a "Why this advisor fits:" paragraph
  □ Each project has Match / Technique / Why it's relevant
  □ Ends with the ⚠️ disclaimer blockquote
  □ No plain prose summaries. No "1. Dr. X (72%)" shorthand.

TEMPLATE (use exactly — all 3 advisors, medals 🥇 🥈 🥉):

---
### 🥇 Rank #1 — [Full Name with Title]

| Field | Details |
|---|---|
| **Overall Match** | ★★★★☆ 72% (Strong Match) |
| **Matched Projects** | 3 of 9 supervised |
| **Domain Keywords** | keyword1, keyword2, keyword3 |

**Why this advisor fits:**
[One paragraph. Domain alignment in plain English. No filler.]

**Supporting Projects:**

**1. [Exact Project Title]** *(Batch YYYY)*
- Match: ★★★☆☆ 63% (Moderate Match)
- Technique: [model / algorithm / approach]
- Why it's relevant: [one sentence]

**2. [Exact Project Title]** *(Batch YYYY)*
- Match: ★★★★☆ 71% (Strong Match)
- Technique: [...]
- Why it's relevant: [...]

---
(Repeat structure for 🥈 Rank #2 and 🥉 Rank #3)

> ⚠️ **Note:** Rankings based on archived data only.
> Confirm advisor availability directly before approaching.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT B — advisor_portfolio output
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRE-WRITE CHECKLIST:
  □ Starts with "## 📋 Advisor Portfolio —"
  □ Total count and recurring themes listed before projects
  □ Each project has Team / Technique / Summary

TEMPLATE:

## 📋 Advisor Portfolio — [Name]

**Total Projects Supervised:** N
**Recurring Research Themes:** theme1, theme2, theme3

---
### [Exact Title] *(Batch YYYY)*
- **Team:** name1, name2, name3
- **Technique:** [specific model or approach]
- **Summary:** [2–3 sentences: what was built, how, what it achieved]

(Repeat for each project)

---
> 📁 *[N] older project(s) in archive. Themes above reflect all [total].*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT C — Feasibility & Complexity Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRE-WRITE CHECKLIST:
  □ All 7 headers present with correct emoji
  □ Section 1 names every matched project with score, batch, advisor, technique
  □ Section 3 quotes or paraphrases the exact description sentence for each gap
  □ Section 4 has the MCT table with ✓/✗ per row
  □ Section 5 present ONLY if MCT is 0/5
  □ Section 6 has minimum 3 risk rows
  □ Section 7 is the last line — no text after the verdict

TEMPLATE:

---
## 🔍 Feasibility & Complexity Analysis

### 1. 📚 Overlap With Existing Work
[Each match: title, batch, advisor, score, technique, methodology overlap vs domain match]

### 2. ✅ What Is Already Solved
[Specific sub-problems solved. Technique names, not domain names.]

### 3. 🔓 Unsolved Gaps & Extension Surface
[Each gap must quote or paraphrase the exact description sentence revealing the omission.
No sentence found → write: "Description insufficient to confirm gap — verify with advisor."]

### 4. ⚙️ Complexity Audit (Against MCT)

| Criterion | Met? | Reason |
|---|---|---|
| Custom algorithm / optimization | ✓ / ✗ | [why] |
| Full ML pipeline | ✓ / ✗ | [stages present] |
| Hardware–software integration | ✓ / ✗ | [constraints] |
| Distributed system | ✓ / ✗ | [mechanism] |
| Mathematical model | ✓ / ✗ | [derivation] |

### 5. 🚀 Technical Differentiators *(omit this section if any MCT row is ✓)*
[ONE differentiator: algorithm name, dataset, integration point, effort in weeks]

### 6. ⚠️ Risks & Mitigations

| Risk | Probability | Root Cause | Mitigation |
|---|---|---|---|
| [failure mode] | LOW/MEDIUM/HIGH | [why it breaks] | [specific fix] |

### 7. 🏁 Final Verdict

> **[YES / NO / CONDITIONAL YES]** — [one sentence tied to a specific MCT criterion]

--- 
"""


# ============================================================
# Component 7: LLM + Key Rotation
# ============================================================

MAX_TOOL_ROUNDS       = 6
MAX_TOOL_OUTPUT_CHARS = 8000

_RATE_LIMIT_SIGNALS = (
    "rate_limit_exceeded", "rate limit", "429",
    "quota", "tokens per day", "requests per day",
)

def _is_rate_limit(e: Exception) -> bool:
    return any(sig in str(e).lower() for sig in _RATE_LIMIT_SIGNALS)

def _make_engine_forced(api_key: str):
    return ChatGroq(
        temperature=0.0,
        model="llama-3.3-70b-versatile",
        api_key=api_key
    ).bind_tools(agent_tools, tool_choice="any")

def _make_engine_free(api_key: str):
    return ChatGroq(
        temperature=0.0,
        model="llama-3.3-70b-versatile",
        api_key=api_key
    ).bind_tools(agent_tools)


# ============================================================
# Component 8: Compound Query Preprocessor
# ============================================================

_ANALYSIS_TRIGGERS = re.compile(
    r"(run|do|perform|give|provide)\s+(a\s+)?(full\s+|complete\s+|detailed\s+)?"
    r"(feasibility|complexity)\s+anal(ysis|yse|yze)"          # ← removed "novelty" here
    r"|run a full\s+(feasibility|complexity|analysis)"         # ← narrowed: must say what kind of "full"
    r"|feasibility (check|report|analysis)"                    # ← kept, but removed bare "feasibility check"
    r"|give.{0,20}(full|complete|detailed).{0,20}(breakdown|analysis|review)"
    r"|anal(yse|yze)\s+my\s+(project|idea|proposal)",         # ← must reference project/idea explicitly
    re.IGNORECASE
)


def preprocess_query(raw: str) -> tuple[str, bool]:
    needs_analysis = bool(_ANALYSIS_TRIGGERS.search(raw))
    # Return the ORIGINAL query untouched — no stripping
    return raw, needs_analysis


# ============================================================
# Component 9: Agent Loop
# ============================================================

# ============================================================
# Component 9: Agent Loop (with forensic debug)
# ============================================================

def run_agent(user_messages: list) -> str:
    last_error = None

    for key_idx, api_key in enumerate(_groq_keys):
        engine_forced = _make_engine_forced(api_key)
        engine_free   = _make_engine_free(api_key)
        messages      = [SystemMessage(content=SYSTEM_STATE_MODIFIER)] + user_messages

        # ── Forensic trace ──────────────────────────────────────
        trace = []   # one dict per round

        try:
            for round_num in range(MAX_TOOL_ROUNDS):
                engine   = engine_forced if round_num == 0 else engine_free
                response = engine.invoke(messages)
                messages.append(response)

                round_record = {
                    "round":       round_num,
                    "tool_calls":  [],
                    "free_text":   not bool(response.tool_calls),
                    "content_len": len(response.content or ""),
                }

                if not response.tool_calls:
                    round_record["exit_reason"] = "no_tool_calls — LLM chose to respond"
                    trace.append(round_record)
                    _print_trace(trace)          # ← forensic dump

                    if response.content and response.content.strip().startswith("<function"):
                        return (
                            "System Error: Malformed tool call. "
                            "Please rephrase using shorter, simpler sentences."
                        )
                    return response.content or "(No response generated)"

                for tc in response.tool_calls:
                    tool_name = tc["name"]
                    tool_args = tc["args"]
                    tool_id   = tc["id"]

                    tool_fn    = TOOL_MAP.get(tool_name)
                    call_record = {
                        "tool":      tool_name,
                        "args":      tool_args,
                        "error":     None,
                        "output_len": 0,
                        "truncated": False,
                    }

                    if tool_fn is None:
                        result_str          = f"ERROR: Unknown tool '{tool_name}'."
                        call_record["error"] = "unknown_tool"
                    else:
                        try:
                            raw_result           = tool_fn.invoke(tool_args)
                            result_str           = str(raw_result)
                            call_record["output_len"] = len(result_str)

                            # Check for HIGHLY_NOVEL (zero archive hits)
                            if "HIGHLY_NOVEL" in result_str:
                                call_record["archive_result"] = "HIGHLY_NOVEL"
                            elif "NOVELTY_STATUS" in result_str:
                                # Extract the status line for the trace
                                for line in result_str.splitlines():
                                    if "NOVELTY_STATUS" in line:
                                        call_record["archive_result"] = line.strip()
                                        break

                        except Exception as e:
                            result_str           = f"TOOL ERROR [{tool_name}]: {type(e).__name__}: {e}"
                            call_record["error"] = f"{type(e).__name__}: {e}"

                    if len(result_str) > MAX_TOOL_OUTPUT_CHARS:
                        result_str             = result_str[:MAX_TOOL_OUTPUT_CHARS] + "\n...[output truncated at budget]"
                        call_record["truncated"] = True

                    round_record["tool_calls"].append(call_record)
                    messages.append(ToolMessage(content=result_str, tool_call_id=tool_id))

                trace.append(round_record)

            # Round limit hit
            messages.append(HumanMessage(content=(
                "Tool call limit reached. Summarise all retrieved results "
                "and give the best analysis possible from what was collected."
            )))
            final = engine_free.invoke(messages)

            # Mark trace as exhausted
            trace.append({
                "round":       MAX_TOOL_ROUNDS,
                "exit_reason": "ROUND_LIMIT_EXHAUSTED",
                "tool_calls":  [],
                "free_text":   True,
                "content_len": len(final.content or ""),
            })
            _print_trace(trace)

            return final.content or "(Round limit reached — no final response)"

        except Exception as e:
            if _is_rate_limit(e):
                print(f"[System] Key {key_idx + 1} rate-limited — trying next key...")
                last_error = e
                continue
            raise

    raise RuntimeError(
        f"All {len(_groq_keys)} Groq keys are rate-limited. Last error: {last_error}"
    )


def _print_trace(trace: list) -> None:
    """Print a structured post-mortem of the agent's reasoning trace."""

    print("\n" + "╔" + "═" * 68 + "╗")
    print("║  AGENT FORENSIC TRACE" + " " * 46 + "║")
    print("╠" + "═" * 68 + "╣")

    tools_called   = []
    truncations    = []
    errors         = []
    skipped_round0 = False

    for record in trace:
        rn = record["round"]

        if record["free_text"] and rn == 0:
            skipped_round0 = True

        prefix = f"║  Round {rn}"

        if record.get("exit_reason") == "ROUND_LIMIT_EXHAUSTED":
            print(f"{prefix}  ⚠  ROUND LIMIT EXHAUSTED — LLM summarised from memory")

        elif record["free_text"]:
            reason = record.get("exit_reason", "free text response")
            print(f"{prefix}  →  No tool call. {reason}  (content: {record['content_len']} chars)")

        else:
            for tc in record["tool_calls"]:
                tools_called.append(tc["tool"])

                # Format the args cleanly
                args_str = ", ".join(
                    f'{k}="{v}"' if isinstance(v, str) else f"{k}={v}"
                    for k, v in tc["args"].items()
                )

                status = "✓"
                detail = f"{tc['output_len']} chars"

                if tc["error"]:
                    status = "✗"
                    detail = f"ERROR: {tc['error']}"
                    errors.append((rn, tc["tool"], tc["error"]))

                if tc["truncated"]:
                    detail += "  ⚠ TRUNCATED"
                    truncations.append((rn, tc["tool"]))

                archive_note = ""
                if "archive_result" in tc:
                    archive_note = f"  [{tc['archive_result']}]"

                print(f"{prefix}  {status}  {tc['tool']}({args_str})")
                print(f"║       └─ {detail}{archive_note}")

    print("╠" + "═" * 68 + "╣")
    print("║  SUMMARY" + " " * 59 + "║")
    print("╠" + "═" * 68 + "╣")

    # Tool call sequence
    seq = " → ".join(tools_called) if tools_called else "NONE"
    print(f"║  Tool sequence    : {seq[:50]}")

    # Hallucination risk flags
    print("║  Hallucination flags:")

    if skipped_round0:
        print("║    🔴  Round 0 had NO tool call — LLM responded from memory")
        print("║        This is the primary hallucination vector.")
    else:
        print("║    🟢  Round 0 called a tool (retrieval-first confirmed)")

    if "archive_search" not in tools_called:
        print("║    🔴  archive_search was NEVER called — any project names")
        print("║        in the response are hallucinated")
    else:
        print("║    🟢  archive_search was called")

    if "web_search" not in tools_called:
        print("║    🟡  web_search not called — no global novelty context")
    else:
        print("║    🟢  web_search was called")

    if truncations:
        for rn, tname in truncations:
            print(f"║    🟡  Round {rn} {tname} output truncated — LLM saw partial data")
    else:
        print("║    🟢  No truncations")

    if errors:
        for rn, tname, err in errors:
            print(f"║    🔴  Round {rn} {tname} errored: {err}")

    # Keyword quality check on archive_search args
    for record in trace:
        for tc in record["tool_calls"]:
            if tc["tool"] == "archive_search":
                q = tc["args"].get("query", "")
                word_count = len(q.split())
                if word_count > 6:
                    print(f"║    🟡  archive_search query has {word_count} words: \"{q}\"")
                    print("║        Expected 2–5 keywords. Retrieval quality may be degraded.")
                else:
                    print(f"║    🟢  archive_search query looks clean: \"{q}\"")

    print("╚" + "═" * 68 + "╝\n")


# ============================================================
# Component 10: Execution Loop
# ============================================================

if __name__ == "__main__":
    print("\nSystem Log: FYDP Research Architect online.")
    print("Type 'quit', 'exit', or 'q' to terminate.\n")
    print("=" * 70)

    chat_history: List[HumanMessage | AIMessage] = []

    while True:
        try:
            raw_query = input("\nStudent: ").strip()
            if not raw_query:
                continue
            if raw_query.lower() in {"quit", "exit", "q"}:
                print("System Log: Session terminated.")
                break

            _, needs_analysis = preprocess_query(raw_query)

            # NEW — passes original query, LLM extracts keywords itself
            if needs_analysis:
                injected = (
                    f"{raw_query}\n\n"
                    f"[SYSTEM NOTE: The student wants a full feasibility analysis. "
                    f"Step 1: Extract 2–5 keywords from the student's query to use as "
                    f"the archive_search argument. Do NOT pass the full sentence to the tool. "
                    f"Step 2: After archive_search, call web_search with a short query. "
                    f"Step 3: Produce a complete Phase 2 Feasibility & Complexity Analysis "
                    f"using all 7 required headings. Reference every matched project by name, "
                    f"batch, advisor, formatted score (stars + %%), and technique. "
                    f"Never show raw decimal scores.]"
                )
                chat_history.append(HumanMessage(content=injected))
            else:
                chat_history.append(HumanMessage(content=raw_query))

            windowed = chat_history[-10:]
            reply    = run_agent(windowed)
            chat_history.append(AIMessage(content=reply))

            print(f"\nResearch Architect:\n{reply}")
            print("\n" + "=" * 70)

        except KeyboardInterrupt:
            print("\nSystem Log: Interrupted.")
            break
        except KeyError as e:
            print(f"\nSystem Error [Parsing]: {e}\n")
        except RuntimeError as e:
            err = str(e)
            if "rate-limited" in err:
                print(f"\n{err}\nWait ~30 minutes before retrying.\n")
            else:
                print(f"\nRuntime Error: {e}\n")
        except Exception as e:
            err = str(e)
            if "APIConnectionError" in err or "Connection error" in err:
                print("\nConnection to Groq failed. Check network and API key.\n")
            elif "tool_use_failed" in err or "Failed to call a function" in err:
                print(
                    "\nMalformed tool call from LLM.\n"
                    "Rephrase using shorter, simpler sentences.\n"
                )
            else:
                print(f"\nError [{type(e).__name__}]: {e}\n")