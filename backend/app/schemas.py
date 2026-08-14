from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime


class ComplaintTextIn(BaseModel):
    text: str


class ComplaintUpdateIn(BaseModel):
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    complaint_type: Optional[str] = None
    severity: Optional[str] = None
    complaint_description: Optional[str] = None
    complaint_date: Optional[str] = None
    regulatory_reportable: Optional[bool] = None
    assigned_owner: Optional[str] = None
    status: Optional[str] = None


class ComplaintOut(BaseModel):
    id: str
    source_type: Optional[str]
    raw_text: Optional[str]
    customer_name: Optional[str]
    product_name: Optional[str]
    batch_number: Optional[str]
    complaint_type: Optional[str]
    severity: Optional[str]
    complaint_description: Optional[str]
    complaint_date: Optional[str]
    regulatory_reportable: Optional[bool]
    attachments: Optional[str]
    assigned_owner: Optional[str]
    date_received: Optional[datetime.datetime]

    completeness_score: Optional[Dict[str, Any]]
    risk_classification: Optional[Dict[str, Any]]
    root_cause_suggestion: Optional[Dict[str, Any]]
    capa_suggestion: Optional[Dict[str, Any]]
    duplicate_matches: Optional[List[Dict[str, Any]]]
    ai_summary: Optional[str]
    status: str
    created_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True

