"""
AIVOA Copilot Agent Tool Orchestrator.

Manages autonomous tool selection & execution for complaint lifecycle:
- log_complaint: Extracts fields, populates form, runs 7-stage QMS risk pipeline, logs to DB.
- document_extraction: Extracts plain text from uploaded PDF/email/docx/txt documents.
- edit_complaint: Patches only mentioned fields on existing complaint, leaving unmentioned fields intact.
"""

import io
import re
import uuid
import logging
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pypdf import PdfReader

from app import models, schemas
from app.ai.workflow import run_complaint_pipeline, completeness_check
from app.ai.groq_client import call_llm_json

logger = logging.getLogger(__name__)


def document_extraction(file_bytes: bytes, filename: str) -> Tuple[str, str]:
    """
    Tool: document_extraction
    Extracts text content from uploaded document file (PDF, EML, TXT, etc.).
    Returns (raw_text, source_type).
    """
    filename_lower = filename.lower()
    raw_text = ""
    if filename_lower.endswith(".pdf"):
        source_type = "pdf"
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            raw_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            logger.warning(f"PDF extraction error for {filename}: {e}")

        if not raw_text or len(raw_text.strip()) < 10:
            decoded = file_bytes.decode("utf-8", errors="ignore")
            tj_matches = re.findall(r'\((.*?)\)\s*(?:Tj|\)|\])', decoded, re.DOTALL)
            if tj_matches:
                raw_text = "\n".join(m.strip() for m in tj_matches if len(m.strip()) > 5)
            if not raw_text:
                raw_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', ' ', decoded)
    else:
        source_type = "email" if filename_lower.endswith((".eml", ".msg")) else "text"
        raw_text = file_bytes.decode("utf-8", errors="ignore")

    return raw_text.strip(), source_type


def _existing_complaints_for_context(db: Session, limit: int = 25) -> List[Dict[str, Any]]:
    rows = (
        db.query(models.Complaint)
        .order_by(desc(models.Complaint.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "product": r.product_name,
            "batch": r.batch_number,
            "description": r.complaint_description,
        }
        for r in rows
    ]


def log_complaint(
    raw_text: str,
    db: Session,
    source_type: str = "text",
    file_name: Optional[str] = None
) -> models.Complaint:
    """
    Tool: log_complaint
    Extracts fields from text, populates Log Customer Complaint form,
    runs full 7-stage risk assessment pipeline, and logs record in DB.
    """
    existing = _existing_complaints_for_context(db)
    result = run_complaint_pipeline(raw_text, existing)

    c_num = f"CMP-2026-{uuid.uuid4().hex[:4].upper()}"
    complaint = models.Complaint(
        complaint_number=c_num,
        source_type=source_type,
        raw_text=raw_text,
        customer_name=result.get("customer_name"),
        product_name=result.get("product_name"),
        product_strength=result.get("product_strength"),
        batch_number=result.get("batch_number"),
        mfg_date=result.get("mfg_date"),
        expiry_date=result.get("expiry_date"),
        quantity_affected=result.get("quantity_affected"),
        complaint_type=result.get("complaint_type"),
        severity=result.get("severity"),
        priority=result.get("priority"),
        complaint_description=result.get("complaint_description"),
        complaint_date=result.get("complaint_date"),
        regulatory_reportable=result.get("regulatory_reportable", False),
        attachments=file_name,
        assigned_owner=result.get("assigned_owner", "QA Compliance"),
        completeness_score=result.get("completeness_score"),
        risk_classification=result.get("risk_classification"),
        root_cause_suggestion=result.get("root_cause_suggestion"),
        capa_suggestion=result.get("capa_suggestion"),
        duplicate_matches=result.get("duplicate_matches"),
        ai_summary=result.get("ai_summary"),
        status="Open",
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


def _parse_edit_fields_llm_or_regex(user_message: str) -> Dict[str, Any]:
    """
    Parses user correction message to extract ONLY the mentioned fields to update.
    Returns dict of field_name -> new_value.
    """
    prompt = f"""
Analyze this user correction message for a pharmaceutical complaint record.
Identify ONLY the field(s) that the user wants to update or correct.
Do NOT invent or include fields that were not explicitly mentioned in the user message.

User message: \"\"\"{user_message}\"\"\"

Allowed field keys to patch (if mentioned):
customer_name, product_name, product_strength, batch_number, mfg_date, expiry_date, quantity_affected, complaint_type, severity, priority, complaint_description, complaint_date, regulatory_reportable, assigned_owner, status

Return JSON with ONLY the explicitly updated key-value pairs.
Example: if message is "Sorry, the batch number is actually AZ-9041", return {{"batch_number": "AZ-9041"}}.
"""
    result = call_llm_json(prompt)
    
    # Filter out fallback or invalid fields
    patched = {}
    valid_keys = {
        "customer_name", "product_name", "product_strength", "batch_number",
        "mfg_date", "expiry_date", "quantity_affected", "complaint_type",
        "severity", "priority", "complaint_description", "complaint_date",
        "regulatory_reportable", "assigned_owner", "status"
    }

    if not result.get("raw_fallback"):
        for k, v in result.items():
            if k in valid_keys and v is not None:
                patched[k] = v

    if not patched:
        # Regex heuristics fallback for common edit requests
        # Batch number edit: e.g. "batch number is actually X", "batch # X", "batch is X", "lot X"
        b_match = re.search(
            r'(?:batch|lot)(?:\s*#|\s*number)?(?:\s+(?:is|actually|changed\s+to|set\s+to|=|:))+\s*([A-Za-z0-9-]+)',
            user_message, re.IGNORECASE
        )
        if not b_match:
            b_match = re.search(r'(?:batch|lot)\s*#?\s*([A-Za-z0-9-]+)', user_message, re.IGNORECASE)

        if b_match:
            val = b_match.group(1).strip()
            if val.lower() in {"is", "actually", "number", "the", "batch", "lot"}:
                tokens = [t.strip(".,!#") for t in user_message.split() if t.lower().strip(".,!#") not in {"sorry,", "sorry", "the", "batch", "number", "is", "actually", "lot"}]
                if tokens:
                    val = tokens[-1]
            patched["batch_number"] = val

        # Customer name edit: e.g. "customer is actually X", "customer name is X"
        c_match = re.search(
            r'(?:customer|client|pharmacy|hospital)(?:\s*name)?(?:\s+(?:is|actually|=|:))+\s*([^\n,.]+)',
            user_message, re.IGNORECASE
        )
        if c_match:
            val = c_match.group(1).strip()
            if val.lower().startswith("actually "):
                val = val[9:].strip()
            patched["customer_name"] = val

        # Product name edit: e.g. "product is actually X"
        p_match = re.search(
            r'(?:product|drug)\s*(?:name)?(?:\s+(?:is|actually|=|:))+\s*([^\n,.]+)',
            user_message, re.IGNORECASE
        )
        if p_match:
            val = p_match.group(1).strip()
            if val.lower().startswith("actually "):
                val = val[9:].strip()
            if "batch" not in val.lower():
                patched["product_name"] = val

        # Severity edit
        s_match = re.search(r'severity\s*(?:is|actually|=|:)\s*(Low|Medium|High|Critical)', user_message, re.IGNORECASE)
        if s_match:
            patched["severity"] = s_match.group(1).capitalize()

        # Priority edit
        pr_match = re.search(r'priority\s*(?:is|actually|=|:)\s*(Low|Medium|High|Urgent)', user_message, re.IGNORECASE)
        if pr_match:
            patched["priority"] = pr_match.group(1).capitalize()

        # Status edit
        st_match = re.search(r'status\s*(?:is|actually|=|:)\s*(Open|Under Investigation|CAPA In Progress|Closed)', user_message, re.IGNORECASE)
        if st_match:
            patched["status"] = st_match.group(1)

        # Assigned owner edit
        ow_match = re.search(r'(?:assigned\s+owner|owner|assign\s+to)\s*(?:is|actually|=|:)?\s*([^\n,.]+)', user_message, re.IGNORECASE)
        if ow_match and ow_match.group(1).strip().lower() not in {"is", "to"}:
            patched["assigned_owner"] = ow_match.group(1).strip()

    return patched


def edit_complaint(
    complaint_id: Optional[str],
    user_message: str,
    db: Session
) -> Tuple[Optional[models.Complaint], List[str]]:
    """
    Tool: edit_complaint
    Patches ONLY the mentioned fields on an existing complaint record in DB.
    Leaves all unmentioned fields untouched.
    Returns (updated_complaint, list_of_patched_field_names).
    """
    complaint = None
    if complaint_id:
        complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()

    if not complaint:
        # Fall back to latest created complaint in DB
        complaint = db.query(models.Complaint).order_by(desc(models.Complaint.created_at)).first()

    if not complaint:
        return None, []

    fields_to_patch = _parse_edit_fields_llm_or_regex(user_message)
    if not fields_to_patch:
        return complaint, []

    patched_names = []
    for field, new_val in fields_to_patch.items():
        if hasattr(complaint, field):
            setattr(complaint, field, new_val)
            patched_names.append(field)

    # Re-evaluate completeness score if key fields updated
    state_dict = {
        "customer_name": complaint.customer_name,
        "product_name": complaint.product_name,
        "batch_number": complaint.batch_number,
        "complaint_description": complaint.complaint_description,
        "complaint_date": complaint.complaint_date,
        "complaint_type": complaint.complaint_type,
    }
    comp_res = completeness_check(state_dict)
    complaint.completeness_score = comp_res.get("completeness_score")

    db.commit()
    db.refresh(complaint)
    return complaint, patched_names


def process_copilot_request(
    message: str,
    db: Session,
    file_bytes: Optional[bytes] = None,
    filename: Optional[str] = None,
    active_complaint_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main Copilot Agent dispatcher.
    Analyzes user request and decides which tools to invoke:
    1. Uploaded file -> document_extraction → log_complaint
    2. Edit request -> edit_complaint
    3. Complaint text paste / log request -> log_complaint
    4. General query -> Q&A response
    """
    msg_strip = message.strip()
    msg_lower = msg_strip.lower()

    # SCENARIO 1: Document Upload (PDF/Email/DOCX/TXT)
    if file_bytes and filename:
        # Step 1: Tool document_extraction
        raw_text, source_type = document_extraction(file_bytes, filename)

        # Step 2: Tool log_complaint
        complaint = log_complaint(
            raw_text=raw_text,
            db=db,
            source_type=source_type,
            file_name=filename
        )

        reply = (
            f"📄 **Document Extracted & Logged**\n\n"
            f"Extracted content from file `{filename}`.\n"
            f"Logged new complaint **#{complaint.id[:8]}** for **{complaint.product_name or 'Drug Product'}** "
            f"(Batch **#{complaint.batch_number or 'N/A'}**).\n\n"
            f"**AI Risk Severity:** `{complaint.severity or 'Medium'}` | **Completeness Score:** `{complaint.completeness_score.get('score', 0)}/100`"
        )

        return {
            "tool_invoked": "document_extraction → log_complaint",
            "reply": reply,
            "active_complaint": schemas.ComplaintOut.from_orm(complaint).dict(),
            "patched_fields": []
        }

    # SCENARIO 2: Edit / Correction request ("Sorry, the batch number is actually X", "Update customer name to Y", etc.)
    has_active_match = bool(active_complaint_id) and any(f in msg_lower for f in ["batch number is", "customer is", "product is", "severity is"]) and not any(w in msg_lower for w in ["log this", "new complaint", "create complaint", "please log"])
    is_edit_trigger = any(kw in msg_lower for kw in [
        "sorry", "actually", "batch number is", "batch # is", "lot number is",
        "update", "change", "edit", "correct", "fix the", "change customer",
        "change product", "change severity"
    ]) or has_active_match

    if is_edit_trigger and not any(w in msg_lower for w in ["please log this complaint", "log new complaint", "please log"]):
        complaint, patched_fields = edit_complaint(active_complaint_id, msg_strip, db)
        if complaint and patched_fields:
            patch_details = ", ".join(f"`{f}` = **{getattr(complaint, f)}**" for f in patched_fields)
            reply = (
                f"✏️ **Complaint Updated via Tool `edit_complaint`**\n\n"
                f"Patched fields: {patch_details}.\n"
                f"All other fields for complaint **#{complaint.id[:8]}** remain unchanged."
            )
            return {
                "tool_invoked": "edit_complaint",
                "reply": reply,
                "active_complaint": schemas.ComplaintOut.from_orm(complaint).dict(),
                "patched_fields": patched_fields
            }

    # SCENARIO 3: Log complaint from text (Pastes text + "please log this into a complaint" / log request)
    clean_text = re.sub(
        r'\(?\s*please\s+log\s+(?:this\s+into\s+a\s+complaint|this\s+complaint|into\s+a\s+complaint|complaint)\s*\)?',
        '', msg_strip, flags=re.IGNORECASE
    ).strip()

    is_directive_only = len(clean_text) < 15 or clean_text.lower() in {
        "please log this into a complaint", "please log this complaint",
        "please log", "log this complaint", "log customer complaint"
    }

    is_log_trigger = is_directive_only or any(kw in msg_lower for kw in [
        "please log", "log this complaint", "log customer complaint",
        "register complaint", "submit complaint", "complaint regarding",
        "received complaint", "quality defect", "batch #"
    ]) or len(msg_strip) > 30

    if is_log_trigger:
        if is_directive_only:
            # User sent directive to log active or most recent complaint in context
            complaint = None
            if active_complaint_id:
                complaint = db.query(models.Complaint).filter(models.Complaint.id == active_complaint_id).first()
            if not complaint:
                complaint = db.query(models.Complaint).order_by(desc(models.Complaint.created_at)).first()

            if complaint:
                # If fields were missing, attempt re-pipeline on raw_text
                if (not complaint.product_name or not complaint.batch_number) and complaint.raw_text and len(complaint.raw_text) > 15:
                    existing = _existing_complaints_for_context(db)
                    pipeline_res = run_complaint_pipeline(complaint.raw_text, existing)
                    for k, v in pipeline_res.items():
                        if hasattr(complaint, k) and v is not None:
                            setattr(complaint, k, v)
                    db.commit()
                    db.refresh(complaint)

                score_val = complaint.completeness_score.get("score", 0) if isinstance(complaint.completeness_score, dict) else 0
                reply = (
                    f"📋 **Complaint Logged via Tool `log_complaint`**\n\n"
                    f"Extracted details and populated form for **{complaint.product_name or 'Drug Product'}** "
                    f"(Batch **#{complaint.batch_number or 'N/A'}**).\n"
                    f"Registered record **#{complaint.id[:8]}** in QMS database.\n\n"
                    f"**Risk Severity:** `{complaint.severity or 'Medium'}` | **Completeness Score:** `{score_val}/100`"
                )
                return {
                    "tool_invoked": "log_complaint",
                    "reply": reply,
                    "active_complaint": schemas.ComplaintOut.from_orm(complaint).dict(),
                    "patched_fields": []
                }

        # Otherwise extract from new text
        text_to_process = clean_text if len(clean_text) >= 15 else msg_strip
        complaint = log_complaint(
            raw_text=text_to_process,
            db=db,
            source_type="text"
        )
        score_val = complaint.completeness_score.get("score", 0) if isinstance(complaint.completeness_score, dict) else 0
        reply = (
            f"📋 **Complaint Logged via Tool `log_complaint`**\n\n"
            f"Extracted details and populated form for **{complaint.product_name or 'Drug Product'}** "
            f"(Batch **#{complaint.batch_number or 'N/A'}**).\n"
            f"Registered record **#{complaint.id[:8]}** in QMS database.\n\n"
            f"**Risk Severity:** `{complaint.severity or 'Medium'}` | **Completeness Score:** `{score_val}/100`"
        )
        return {
            "tool_invoked": "log_complaint",
            "reply": reply,
            "active_complaint": schemas.ComplaintOut.from_orm(complaint).dict(),
            "patched_fields": []
        }

    # SCENARIO 4: General Chat / Q&A on active complaint
    active_complaint = None
    if active_complaint_id:
        c_obj = db.query(models.Complaint).filter(models.Complaint.id == active_complaint_id).first()
        if c_obj:
            active_complaint = schemas.ComplaintOut.from_orm(c_obj).dict()

    reply = (
        "I have analyzed your message regarding the active complaint. "
        "You can ask me questions about risk severity, root causes, CAPA owners, "
        "or request edits (e.g. *'Sorry, the batch number is actually X'*)."
    )

    return {
        "tool_invoked": None,
        "reply": reply,
        "active_complaint": active_complaint,
        "patched_fields": []
    }
