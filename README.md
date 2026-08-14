# AIVOA.AI — AI-Powered Customer Complaint Management System (Starter Scaffold)

This is a **starter scaffold**, not the finished assignment. It implements the
full end-to-end skeleton — frontend, API, DB models, and a real LangGraph +
Groq AI workflow — so the actual functional details can be built out on top
of it (e.g. in Google Antigravity / Claude Code) to match the demo video
exactly.

## What's already wired up

- **Frontend**: React 18 + Redux Toolkit (Vite), Google Inter font, a
  "Log Customer Complaint" form and an "AI Copilot — Risk Assessment" panel
  that read from Redux state.
- **Backend**: FastAPI with SQLAlchemy models (Postgres by default, swap
  connection string for MySQL), endpoints to submit a complaint as raw text
  or as a PDF/email file upload.
- **AI Agent**: A real LangGraph `StateGraph` (`backend/app/ai/workflow.py`)
  with 7 sequential nodes, each calling Groq:
  1. `extract_fields` — pulls customer, product, batch, complaint type/desc
  2. `completeness_check` — scores the record + lists missing fields
  3. `duplicate_detection` — compares against recent complaints in DB
  4. `risk_classification` — Low/Medium/High/Critical + justification
  5. `root_cause_recommendation` — QMS root-cause categories (Man/Machine/...)
  6. `capa_recommendation` — draft corrective/preventive actions
  7. `summary` — short executive summary
- Uses `gemma2-9b-it` for lighter extraction/summary nodes and
  `llama-3.3-70b-versatile` for the reasoning-heavy nodes (risk, root cause,
  CAPA), per the assignment's suggestion.

## What YOU still need to do to match the demo

1. **Watch the demo video and reference screenshot again** and adjust the
   exact fields on the "Log Customer Complaint" form to match (there may be
   more fields than this scaffold has — e.g. complaint date, severity,
   attachments, regulatory reportability, etc.).
2. **Refine the LangGraph prompts** in `workflow.py` to match how the demo
   actually classifies risk / suggests root cause / etc. Watch closely for
   exact wording, categories, and scoring scales used in the demo.
3. **Add a proper complaint list / detail view** (`ComplaintList.jsx` is not
   yet built) so reviewers can browse past complaints, not just the last one.
4. **Add auth/session handling** if the demo shows a login flow.
5. **Wire up sample PDFs/emails** — create a few realistic pharma complaint
   PDFs/emails (see assignment: "you may create your own realistic
   pharmaceutical complaint PDFs, emails, or images for demonstration").
6. **Add loading/error states, form validation, and polish** to match the UI
   screenshot style.
7. Optional bonus features not yet stubbed out: Complaint Summary is done;
   consider adding richer duplicate detection (vector similarity instead of
   just LLM comparison over the last N complaints) if you want to go further.

## Running locally

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY and DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

Create the Postgres DB first, e.g.:
```bash
createdb aivoa_complaints
```
(Tables are auto-created on startup via SQLAlchemy `create_all`.)

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173. Set `VITE_API_BASE` in a `.env` file if your
backend isn't on `http://localhost:8000`.

## API endpoints

| Method | Path                          | Description                          |
|--------|-------------------------------|---------------------------------------|
| POST   | `/api/complaints/from-text`   | Submit raw complaint text for AI processing |
| POST   | `/api/complaints/from-file`   | Upload a PDF/text/email file for AI processing |
| GET    | `/api/complaints`             | List all processed complaints         |
| GET    | `/api/complaints/{id}`        | Get one complaint + AI results        |

## Suggested repo structure for your submission

```
aivoa-complaint-system/
├── backend/
│   └── app/ (config, database, models, schemas, routers, ai/)
├── frontend/
│   └── src/ (store, api, components, App.jsx)
└── README.md
```

## Notes for your demo video

Per the assignment, walk through: frontend input → API call → FastAPI route
→ LangGraph node-by-node execution (show each node's JSON output) → how the
final state populates both the "Log Customer Complaint" form fields and the
"AI Copilot Risk Assessment" panel. The clean separation between
`extract_fields` (form data) and the later nodes (copilot panel) in
`workflow.py` maps directly to that explanation.
