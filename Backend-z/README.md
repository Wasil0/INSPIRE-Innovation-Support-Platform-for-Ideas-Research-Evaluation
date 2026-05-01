---
title: INSPIRE
emoji: 🎓
colorFrom: red
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# Hugging Face Spaces — INSPIRE Backend
# INSPIRE — Backend API

FastAPI backend for the INSPIRE Innovation Support Platform.

## Environment Variables

Set these as **Secrets** in your Hugging Face Space settings:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `SECRET_KEY` | JWT signing secret key |
| `ALGORITHM` | JWT algorithm (e.g. `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (e.g. `30`) |
| `GROQ_API_KEY_1` … `GROQ_API_KEY_7` | Groq API keys for AI features |
| `TAVILY_API_KEY` | Tavily API key for web search |

## API Docs

Once deployed, visit `https://<your-space>.hf.space/docs` for the interactive Swagger UI.
