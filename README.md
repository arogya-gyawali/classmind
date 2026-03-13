# ClassMind

**AI teaching assistant that answers student questions using only professor-approved course materials — no hallucinations, no off-topic responses.**

Built at the ThinkNext Hackathon 2026. ClassMind gives professors full control over what their students' AI assistant knows, by restricting all responses to uploaded lecture PDFs using Retrieval-Augmented Generation (RAG).

---

## The problem

General-purpose AI tools like ChatGPT hallucinate, go off-syllabus, and give students answers the professor never taught. Professors can't trust them in the classroom, and students can't verify whether the AI's response matches course content.

## What ClassMind does

- Professors upload course PDFs (lectures, readings, slides) — this becomes the AI's only source of truth
- Students ask questions and get answers grounded strictly in uploaded materials
- If a question falls outside the course content, the AI says so instead of guessing
- Two learning modes: **Guided (Socratic)** prompts students to think through the answer, **Direct** gives the answer with source references
- Role-based access: only professors can upload and ingest materials; students can only chat

## How it works

```
Professor uploads PDF
        ↓
Document chunked + embedded (Ollama)
        ↓
Vectors stored in ChromaDB
        ↓
Student asks a question
        ↓
Relevant chunks retrieved via similarity search
        ↓
Local LLM generates answer from retrieved context only
        ↓
Response returned with source grounding
```

The system enforces hallucination prevention at the retrieval layer — the LLM only sees relevant chunks from indexed PDFs, never its own parametric knowledge. If no relevant chunks are found, the system refuses to answer rather than fabricate.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, Tailwind CSS, TypeScript |
| Backend | FastAPI, Python |
| Auth | SQLite + JWT (role-based: student/teacher) |
| Vector DB | ChromaDB (persistent, local) |
| LLM | Ollama (runs locally — no API keys, no data leaves the machine) |
| Embedding | Ollama embedding models |

## Design decisions

**Why Ollama instead of OpenAI API?** Privacy-first. Course materials are intellectual property — they shouldn't be sent to third-party servers. Running the LLM locally means zero data leakage. This also makes ClassMind deployable in air-gapped university environments.

**Why ChromaDB instead of Pinecone/Weaviate?** Same reason — local-first. ChromaDB runs as a persistent local store with no cloud dependency. For a single-course deployment, it handles the scale easily and keeps the entire stack self-contained.

**Why enforce source-grounded responses?** The core design constraint is that the AI should never produce an answer it can't trace back to a specific uploaded document. This makes the system trustworthy for academic use — professors can verify that the AI is teaching what they taught.

## Project structure

```
classmind/
├── backend/
│   ├── app.py              # FastAPI application + routes
│   ├── ingest.py           # PDF chunking + embedding pipeline
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── pages/              # Next.js pages
│   ├── components/         # UI components
│   └── ...
├── db/                     # ChromaDB persistent storage
├── .gitignore
└── README.md
```

## Local setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/) installed and running

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set TEACHER_USER and TEACHER_PASS for bootstrap admin account
uvicorn app:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ingest course materials

```bash
# Start the ingestion watcher
python3 backend/ingest.py

# Upload a PDF (requires teacher auth token)
curl -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/lecture.pdf" \
  http://127.0.0.1:8000/admin/upload
```

## API overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | None | Register (student or teacher) |
| `/auth/login` | POST | None | Login, returns JWT |
| `/auth/me` | GET | Bearer | Get current user info |
| `/chat` | POST | Bearer | Ask a question (student or teacher) |
| `/admin/upload` | POST | Teacher | Upload course PDF |
| `/admin/ingest` | POST | Teacher | Trigger manual ingestion |

Teacher registration requires an invite code if `TEACHER_INVITE_CODE` is set in the backend `.env`.

## What I'd build next

- Citation highlighting: show which exact PDF passage the answer came from
- Multi-course support: one ClassMind instance serving multiple classes with isolated vector stores
- Confidence scoring: surface retrieval similarity scores so students know how well-matched the answer is
- Containerized deployment: Docker Compose for one-command university-wide setup
- Analytics dashboard: show professors which topics students ask about most

## Built by

**Aarogya Gyawali** — CS student at San Francisco Bay University
- [GitHub](https://github.com/arogya-gyawali)
- [LinkedIn](https://linkedin.com/in/aarogya-gyawali-8603b8210)

Built at ThinkNext Hackathon 2026.
