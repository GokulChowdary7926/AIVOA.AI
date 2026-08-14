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


def _process_and_save(db: Session, raw_text: str, source_type: str, file_name: str = None) -> models.Complaint:
    existing = _existing_complaints_for_context(db)
    result = run_complaint_pipeline(raw_text, existing)

    complaint = models.Complaint(
        source_type=source_type,
        raw_text=raw_text,
        customer_name=result.get("customer_name"),
        product_name=result.get("product_name"),
        batch_number=result.get("batch_number"),
        complaint_type=result.get("complaint_type"),
        severity=result.get("severity"),
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


@router.post("/from-text", response_model=schemas.ComplaintOut)
def create_from_text(payload: schemas.ComplaintTextIn, db: Session = Depends(get_db)):
    if not payload.text.strip():
        raise HTTPException(400, "Complaint text cannot be empty")
    return _process_and_save(db, payload.text, source_type="text")


@router.post("/from-file", response_model=schemas.ComplaintOut)
async def create_from_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    file_name = file.filename

    if file_name.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            raw_text = "\n".join(page.extract_text() or "" for page in reader.pages)
            source_type = "pdf"
        except Exception as e:
            raw_text = content.decode("utf-8", errors="ignore")
            source_type = "pdf"
    else:
        # treat as plain text / email export
        raw_text = content.decode("utf-8", errors="ignore")
        source_type = "email"

    if not raw_text.strip():
        raise HTTPException(400, "Could not extract any text from the uploaded file")

    return _process_and_save(db, raw_text, source_type=source_type, file_name=file_name)


@router.get("", response_model=List[schemas.ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).order_by(desc(models.Complaint.created_at)).all()


@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")
    return complaint


@router.put("/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(complaint_id: str, payload: schemas.ComplaintUpdateIn, db: Session = Depends(get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(complaint, field, val)

    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/seed-samples", response_model=List[schemas.ComplaintOut])
def seed_samples(db: Session = Depends(get_db)):
    """Seed sample complaints into database for duplicate detection testing."""
    samples = [
        {
            "text": "CRITICAL QUALITY DEFECT: Hospital report from St. Jude Children's Hospital. Product: Paclitaxel Injection 6mg/mL (Batch #AZ-9041). Inspection revealed visible dark fibrous particulate matter floating inside sealed sterile glass vial prior to administration. Potential parenteral contamination hazard. Date: 2026-08-10.",
            "source": "pdf"
        },
        {
            "text": "OUT OF SPECIFICATION ASSAY: Quality Control notification from CVS Health Pharmacy. Product: Amoxicillin 500mg Capsules (Batch #TB-4412). Stability testing indicates potency assay at 82.4% (below USP specification 90.0-110.0%). Patient reported lack of therapeutic efficacy. Date: 2026-08-08.",
            "source": "email"
        },
        {
            "text": "PACKAGING SEAL DEFECT: Customer report from Apex Pharma Distributors. Product: Metformin ER 500mg Tablets (Batch #PK-8810). Incomplete heat seal observed on aluminium blister foil strips causing tablet exposure and moisture discoloration. Date: 2026-08-05.",
            "source": "text"
        }
    ]

    created = []
    for sample in samples:
        c = _process_and_save(db, sample["text"], source_type=sample["source"])
        created.append(c)

    return created
