"""
LangGraph workflow for the AI Copilot.

Flow:
  raw_text
     |
     v
  [extract_fields]  -> structured complaint fields (product, batch, customer, etc.)
     |
     v
  [completeness_check] -> is info sufficient? what's missing?
     |
     v
  [duplicate_detection] -> compares against existing complaints in DB
     |
     v
  [risk_classification] -> Low / Medium / High / Critical + justification
     |
     v
  [root_cause_recommendation]
     |
     v
  [capa_recommendation]
     |
     v
  [summary]
     |
     v
  END -> final state returned to FastAPI -> frontend

Each node calls Groq (gemma2-9b-it by default; llama-3.3-70b-versatile for
nodes that benefit from stronger reasoning) and merges structured JSON
output into shared graph state.
"""

from typing import TypedDict, List, Optional, Dict, Any
from langgraph.graph import StateGraph, END
from app.ai.groq_client import call_llm_json


class ComplaintState(TypedDict, total=False):
    raw_text: str
    existing_complaints: List[Dict[str, Any]]  # for duplicate detection

    customer_name: Optional[str]
    product_name: Optional[str]
    batch_number: Optional[str]
    complaint_type: Optional[str]
    complaint_description: Optional[str]

    completeness_score: Dict[str, Any]
    duplicate_matches: List[Dict[str, Any]]
    risk_classification: Dict[str, Any]
    root_cause_suggestion: Dict[str, Any]
    capa_suggestion: Dict[str, Any]
    ai_summary: str


def extract_fields(state: ComplaintState) -> ComplaintState:
    prompt = f"""
Extract structured fields from this pharmaceutical customer complaint text.

Complaint text:
\"\"\"{state['raw_text']}\"\"\"

Return JSON with exactly these keys:
- customer_name (string or null)
- product_name (string or null)
- batch_number (string or null)
- complaint_type (one of: "Quality Defect", "Packaging", "Adverse Event",
  "Delivery/Logistics", "Documentation", "Other")
- complaint_description (a clean 1-3 sentence restatement of the issue)
"""
    result = call_llm_json(prompt)
    return {
        "customer_name": result.get("customer_name"),
        "product_name": result.get("product_name"),
        "batch_number": result.get("batch_number"),
        "complaint_type": result.get("complaint_type"),
        "complaint_description": result.get("complaint_description"),
    }


def completeness_check(state: ComplaintState) -> ComplaintState:
    prompt = f"""
You are validating completeness of a pharma complaint record against QMS
requirements (customer identity, product name, batch/lot number, description
of the defect, and date of occurrence if mentioned).

Extracted fields:
{state}

Return JSON:
{{
  "score": <0-100 integer, how complete the record is>,
  "missing_fields": [list of field names that are missing or unclear],
  "notes": "short note on what additional info should be requested from the customer"
}}
"""
    result = call_llm_json(prompt)
    return {"completeness_score": result}


def duplicate_detection(state: ComplaintState) -> ComplaintState:
    existing = state.get("existing_complaints", [])
    if not existing:
        return {"duplicate_matches": []}

    prompt = f"""
New complaint:
- product: {state.get('product_name')}
- batch: {state.get('batch_number')}
- description: {state.get('complaint_description')}

Existing complaints (id, product, batch, description):
{existing}

Identify any existing complaints that are likely duplicates or closely
related (same batch + similar issue, or same product + same defect type).

Return JSON:
{{
  "matches": [
    {{"id": "...", "reason": "why this looks like a duplicate/related complaint", "confidence": "Low|Medium|High"}}
  ]
}}
If there are no likely matches, return {{"matches": []}}.
"""
    result = call_llm_json(prompt)
    return {"duplicate_matches": result.get("matches", [])}


def risk_classification(state: ComplaintState) -> ComplaintState:
    prompt = f"""
Classify the risk level of this pharmaceutical manufacturing complaint
(API/FDF context) per typical QMS severity criteria (patient safety impact,
GMP/regulatory impact, scale of the batch affected).

Complaint:
- product: {state.get('product_name')}
- batch: {state.get('batch_number')}
- type: {state.get('complaint_type')}
- description: {state.get('complaint_description')}

Return JSON:
{{
  "level": "Low|Medium|High|Critical",
  "justification": "1-2 sentence rationale",
  "requires_field_alert": true|false
}}
"""
    result = call_llm_json(prompt, use_large=True)
    return {"risk_classification": result}


def root_cause_recommendation(state: ComplaintState) -> ComplaintState:
    prompt = f"""
Suggest likely root cause categories for this pharma manufacturing complaint,
using standard QMS root cause categories (e.g. Man, Machine, Material,
Method, Environment, Measurement).

Complaint:
- type: {state.get('complaint_type')}
- description: {state.get('complaint_description')}
- risk: {state.get('risk_classification')}

Return JSON:
{{
  "likely_categories": ["Material", "Method", ...],
  "reasoning": "short explanation",
  "recommended_investigation_steps": ["step 1", "step 2", "step 3"]
}}
"""
    result = call_llm_json(prompt, use_large=True)
    return {"root_cause_suggestion": result}


def capa_recommendation(state: ComplaintState) -> ComplaintState:
    prompt = f"""
Based on this complaint and its likely root cause, propose a draft
CAPA (Corrective and Preventive Action) plan suitable for a pharma QMS.

Complaint: {state.get('complaint_description')}
Root cause analysis: {state.get('root_cause_suggestion')}
Risk level: {state.get('risk_classification', {}).get('level')}

Return JSON:
{{
  "corrective_actions": ["...", "..."],
  "preventive_actions": ["...", "..."],
  "suggested_owner": "e.g. QA / Production / Warehouse",
  "target_closure_days": <integer>
}}
"""
    result = call_llm_json(prompt, use_large=True)
    return {"capa_suggestion": result}


def summary(state: ComplaintState) -> ComplaintState:
    prompt = f"""
Write a concise 3-4 sentence executive summary of this complaint suitable
for a QMS dashboard, covering: what happened, risk level, and next step.

State: {state}
Return JSON: {{"summary": "..."}}
"""
    result = call_llm_json(prompt)
    return {"ai_summary": result.get("summary", "")}


def build_graph():
    graph = StateGraph(ComplaintState)

    graph.add_node("extract_fields", extract_fields)
    graph.add_node("completeness_check", completeness_check)
    graph.add_node("duplicate_detection", duplicate_detection)
    graph.add_node("risk_classification", risk_classification)
    graph.add_node("root_cause_recommendation", root_cause_recommendation)
    graph.add_node("capa_recommendation", capa_recommendation)
    graph.add_node("summary", summary)

    graph.set_entry_point("extract_fields")
    graph.add_edge("extract_fields", "completeness_check")
    graph.add_edge("completeness_check", "duplicate_detection")
    graph.add_edge("duplicate_detection", "risk_classification")
    graph.add_edge("risk_classification", "root_cause_recommendation")
    graph.add_edge("root_cause_recommendation", "capa_recommendation")
    graph.add_edge("capa_recommendation", "summary")
    graph.add_edge("summary", END)

    return graph.compile()


complaint_graph = build_graph()


def run_complaint_pipeline(raw_text: str, existing_complaints: List[Dict[str, Any]]) -> ComplaintState:
    initial_state: ComplaintState = {
        "raw_text": raw_text,
        "existing_complaints": existing_complaints,
    }
    return complaint_graph.invoke(initial_state)
