# 🛡️ AIVOA.AI — AI-Powered Customer Complaint Management System

Production-ready, end-to-end AI-powered Customer Complaint Management System tailored for the pharmaceutical industry, complying with **GMP, 21 CFR Part 211, and ICH Q10 guidelines**.

The system features a **React / Redux Toolkit frontend**, **FastAPI backend**, **LangGraph 7-Node Agent Workflow**, **Groq LLM integration (`gemma2-9b-it`)**, and **SQLAlchemy (PostgreSQL / MySQL / SQLite)** database persistence.

---

## 🌟 Key Capabilities & Features

1. **Natural Language Complaint Intake & Copilot Agent**:
   - Accepts raw complaint text, customer emails, or uploaded documents (`.pdf`, `.eml`, `.docx`, `.txt`).
   - Automatically executes agent tools (`log_complaint`, `document_extraction`, `edit_complaint`) based on natural user intent.

2. **7-Node LangGraph Pipeline (`backend/app/ai/workflow.py`)**:
   - **Node 1: `extract_fields`** — Structured field extraction (customer, product, strength, batch #, mfg/exp date, quantity, type, severity, priority, description).
   - **Node 2: `completeness_check`** — Dynamically scores QMS completeness (0-100) and flags missing required fields.
   - **Node 3: `duplicate_detection`** — Compares incoming complaints against historical DB records to flag identical batch numbers or duplicate symptoms (returns `[]` on empty DB).
   - **Node 4: `risk_classification`** — Evaluates GMP/21 CFR patient safety impact strictly based on clinical defect type (ignores emotional tone). Flags mandatory 15-day FDA Field Alerts.
   - **Node 5: `root_cause_recommendation`** — Evaluates 5M QMS categories (*Man, Machine, Material, Method, Environment*) tailored specifically to defect type.
   - **Node 6: `capa_recommendation`** — Drafts immediate containment and long-term Corrective and Preventive Actions with suggested department owner and closure timelines.
   - **Node 7: `summary`** — Generates a 3-sentence executive summary suitable for QMS dashboards.

3. **Autonomous Agent Tool Orchestration (`backend/app/ai/agent.py`)**:
   - `log_complaint` — Triggered when user submits complaint text + *"please log this complaint"*.
   - `document_extraction → log_complaint` — Triggered when a PDF or email is uploaded.
   - `edit_complaint` — Triggered when user asks follow-up edits like *"Sorry, the batch number is actually AZ-9999"*. Patches **ONLY** mentioned fields while preserving all other complaint fields.

---

## 📁 Repository Structure

```
aivoa-complaint-system/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── agent.py            # Copilot Agent tool dispatcher & execution
│   │   │   ├── groq_client.py      # Groq LLM integration (gemma2-9b-it / llama-3.3-70b)
│   │   │   └── workflow.py         # 7-Node LangGraph StateGraph pipeline
│   │   ├── routers/
│   │   │   └── complaints.py       # FastAPI routes (/api/complaints, /upload, /copilot/chat)
│   │   ├── config.py               # Environment & CORS configuration
│   │   ├── database.py             # SQLAlchemy session & DB connection
│   │   ├── main.py                 # FastAPI application entrypoint
│   │   ├── models.py               # SQLAlchemy Complaint model
│   │   └── schemas.py              # Pydantic schemas (ComplaintOut, CopilotChatOut)
│   ├── requirements.txt            # Python backend dependencies
│   ├── .env.example                # Sample environment variables
│   └── aivoa_complaints.db         # Local SQLite storage fallback
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js              # Axios API client
│   │   ├── components/
│   │   │   ├── AICopilotPanel.jsx  # Interactive AI Copilot assistant panel
│   │   │   ├── ComplaintForm.jsx   # Log Customer Complaint form
│   │   │   ├── ComplaintList.jsx   # Past complaints audit trail & table
│   │   │   └── ComplaintDetailModal.jsx # Detailed complaint modal inspection
│   │   ├── data/
│   │   │   └── sampleData.js       # Pharmaceutical test scenario library
│   │   ├── store/
│   │   │   ├── complaintSlice.js   # Redux Toolkit state management
│   │   │   └── store.js            # Redux store configuration
│   │   ├── App.jsx                 # Top-level workspace layout & navigation
│   │   ├── main.jsx                # React root renderer
│   │   └── index.css               # Modern glassmorphism & responsive CSS
│   ├── package.json                # Frontend Vite + React dependencies
│   └── vite.config.js              # Vite server configuration
├── scripts/
│   ├── test_agent_tools.py        # Automated test suite for log_complaint, edit_complaint & extraction
│   └── test_correct_behavior.py   # 7-Node LangGraph QMS specification verification suite
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ & npm
- Groq API Key (Optional — fallback rule engine active if omitted)

### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
```

Set your `.env` variables:
```ini
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=gemma2-9b-it
GROQ_MODEL_LARGE=llama-3.3-70b-versatile
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/aivoa_complaints
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API Swagger Docs will be available at: **http://localhost:8000/docs**.

---

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🧪 Verification & Test Suite

Run the automated verification scripts inside the backend virtual environment:

```bash
source backend/venv/bin/activate

# Test 1: Agent Tool Orchestration (log_complaint, document_extraction, edit_complaint)
python3 scripts/test_agent_tools.py

# Test 2: LangGraph 7-Node QMS Compliance & Risk Assessment Suite
python3 scripts/test_correct_behavior.py
```

---

## 🔌 API Endpoints Summary

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/complaints/from-text` | Process raw text complaint & log to QMS |
| `POST` | `/api/complaints/from-file` | Extract PDF/email text & log complaint |
| `POST` | `/api/complaints/copilot/chat` | Copilot natural language agent & tool dispatcher |
| `POST` | `/api/complaints/copilot/chat-file` | Copilot file upload & tool pipeline |
| `POST` | `/api/complaints/upload` | Form file/text upload endpoint |
| `POST` | `/api/complaints/log-from-copilot` | Direct Copilot complaint logger endpoint |
| `POST` | `/api/complaints/{id}/risk-assessment` | Re-run risk assessment on existing record |
| `GET` | `/api/complaints` | Fetch list of all logged complaints |
| `GET` | `/api/complaints/{id}` | Fetch detailed complaint record by ID |
| `PUT` | `/api/complaints/{id}` | Update complaint fields |
| `POST` | `/api/complaints/seed-samples` | Seed database with sample pharmaceutical complaints |
