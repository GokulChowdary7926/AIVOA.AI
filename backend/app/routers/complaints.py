from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from pypdf import PdfReader
import io

from app.database import get_db
from app import models, schemas
from app.ai.workflow import run_complaint_pipeline

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


def _existing_complaints_for_context(db: Session, limit: int = 25):
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


def _process_and_save(db: Session, raw_text: str, source_type: str) -> models.Complaint:
    existing = _existing_complaints_for_context(db)
    result = run_complaint_pipeline(raw_text, existing)

    complaint = models.Complaint(
        source_type=source_type,
        raw_text=raw_text,
        customer_name=result.get("customer_name"),
        product_name=result.get("product_name"),
        batch_number=result.get("batch_number"),
        complaint_type=result.get("complaint_type"),
        complaint_description=result.get("complaint_description"),
        completeness_score=result.get("completeness_score"),
        risk_classification=result.get("risk_classification"),
        root_cause_suggestion=result.get("root_cause_suggestion"),
        capa_suggestion=result.get("capa_suggestion"),
        duplicate_matches=result.get("duplicate_matches"),
        ai_summary=result.get("ai_summary"),
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/from-text", response_model=schemas.ComplaintOut)
def create_from_text(payload: schemas.ComplaintTextIn, db: Session = Depends(get_db)):
    if not payload.text.strip():
        raise HTTPException(400, "Complaint text cannot be empty")
    return _process_and_save(db, payload.text, source_type="text")


@router.post("/from-file", response_model=schemas.ComplaintOut)
async def create_from_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()

    if file.filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        raw_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        source_type = "pdf"
    else:
        # treat as plain text / email export
        raw_text = content.decode("utf-8", errors="ignore")
        source_type = "email"

    if not raw_text.strip():
        raise HTTPException(400, "Could not extract any text from the uploaded file")

    return _process_and_save(db, raw_text, source_type=source_type)


@router.get("", response_model=List[schemas.ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).order_by(desc(models.Complaint.created_at)).all()


@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")
    return complaint
