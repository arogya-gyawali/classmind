# ClassMind

Local-first professor-controlled AI learning platform.

## 🚀 What It Does
- Professors upload PDFs (source of truth)
- AI answers using ONLY uploaded materials
- AI refuses questions outside course content
- Guided Learning (Socratic) or Direct Answer mode

## 🛠 Tech Stack
- Frontend: Next.js + Tailwind
- Backend: FastAPI + SQLite auth + JWT
- Vector DB: ChromaDB
- LLM runtime: Ollama (local)

## 🎯 Hackathon Goal
Build a controlled AI assistant that improves learning without hallucination.

## Local Setup
1. Backend setup:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

2. Start backend:
```bash
cd backend
uvicorn app:app --reload
```

3. Start frontend:
```bash
cd frontend
npm install
npm run dev
```

## Auth Endpoints
- `POST /auth/register` body: `{ "username", "password", "role", "invite_code?" }`
- `POST /auth/login` body: `{ "username", "password" }`
- `GET /auth/me` with `Authorization: Bearer <token>`

## Role Behavior
- Students and teachers can call `POST /chat` (token required).
- Only teachers can call `POST /admin/ingest`.
- If `TEACHER_INVITE_CODE` is set in backend `.env`, teacher registration requires it.

## Bootstrap Teacher
Set these in `backend/.env` and restart backend:
- `TEACHER_USER`
- `TEACHER_PASS`

On startup, backend creates the teacher account if it does not already exist.

## Upload + Ingest Verification
Run backend and watcher:

```bash
uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
python3 backend/ingest.py
```

Upload via curl (teacher token required):

```bash
curl -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/AI_Class_Sample_Material.pdf" \
  http://127.0.0.1:8000/admin/upload
```

Force manual ingest:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"path":"docs/AI_Class_Sample_Material.pdf","force":true}' \
  http://127.0.0.1:8000/admin/ingest
```

Check Chroma count:

```bash
python3 - <<'PY'
import chromadb, os
c = chromadb.PersistentClient(path=os.getenv("DB_DIR","db"))
print(c.get_or_create_collection("documents").count())
PY
```
