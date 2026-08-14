from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime


class ComplaintTextIn(BaseModel):
    text: str


class ComplaintOut(BaseModel):
    id: str
    source_type: Optional[str]
    customer_name: Optional[str]
    product_name: Optional[str]
    batch_number: Optional[str]
    complaint_type: Optional[str]
    complaint_description: Optional[str]
    date_received: Optional[datetime.datetime]

    completeness_score: Optional[Dict[str, Any]]
    risk_classification: Optional[Dict[str, Any]]
    root_cause_suggestion: Optional[Dict[str, Any]]
    capa_suggestion: Optional[Dict[str, Any]]
    duplicate_matches: Optional[List[Dict[str, Any]]]
    ai_summary: Optional[str]
    status: str

    class Config:
        from_attributes = True
