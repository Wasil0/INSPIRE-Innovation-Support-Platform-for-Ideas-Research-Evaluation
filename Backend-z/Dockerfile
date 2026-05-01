# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.11.1-slim

# ── System dependencies ───────────────────────────────────────────────────────
# Required by torch, faiss-cpu, scipy, Pillow, and other compiled packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Install dependencies (cached layer — only re-runs if requirements.txt changes) ──
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Copy application source ───────────────────────────────────────────────────
# .dockerignore excludes: venv/, __pycache__/, .env, *.pyc
COPY . .

# ── Expose the port Hugging Face Spaces expects ───────────────────────────────
EXPOSE 7860

# ── Run the FastAPI app ───────────────────────────────────────────────────────
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
