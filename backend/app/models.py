import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, Boolean
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=gen_uuid)

    # Raw input
    source_type = Column(String(20))       # "text" | "pdf" | "email"
    raw_text = Column(Text)

    # Extracted / logged fields (populate "Log Customer Complaint" form)
    customer_name = Column(String(255))
    product_name = Column(String(255))
    batch_number = Column(String(100))
    complaint_type = Column(String(100))   # Quality Defect, Packaging, Adverse Event, etc.
    severity = Column(String(50))           # Low, Medium, High, Critical
    complaint_description = Column(Text)
    complaint_date = Column(String(50))     # Date of event/occurrence
    regulatory_reportable = Column(Boolean, default=False)
    attachments = Column(String(255))
    assigned_owner = Column(String(100))
    date_received = Column(DateTime, default=datetime.datetime.utcnow)

    # AI Copilot outputs
    completeness_score = Column(JSON)      # {"score": 80, "missing_fields": [...], "notes": "..."}
    risk_classification = Column(JSON)     # {"level": "High", "justification": "...", "requires_field_alert": true}
    root_cause_suggestion = Column(JSON)   # {"likely_categories": [...], "reasoning": "...", "recommended_investigation_steps": [...]}
    capa_suggestion = Column(JSON)         # {"corrective_actions": [...], "preventive_actions": [...], "suggested_owner": "...", "target_closure_days": 30}
    duplicate_matches = Column(JSON)       # list of similar complaint ids + reason
    ai_summary = Column(Text)

    status = Column(String(50), default="Open")  # Open | Under Investigation | CAPA In Progress | Closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

