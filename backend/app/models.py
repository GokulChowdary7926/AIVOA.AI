import uuid
import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
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
    complaint_type = Column(String(100))   # e.g. Quality, Packaging, Adverse Event
    complaint_description = Column(Text)
    date_received = Column(DateTime, default=datetime.datetime.utcnow)

    # AI Copilot outputs
    completeness_score = Column(JSON)      # {"score": 80, "missing_fields": [...]}
    risk_classification = Column(JSON)     # {"level": "High", "justification": "..."}
    root_cause_suggestion = Column(JSON)
    capa_suggestion = Column(JSON)
    duplicate_matches = Column(JSON)       # list of similar complaint ids + reason
    ai_summary = Column(Text)

    status = Column(String(50), default="Open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
