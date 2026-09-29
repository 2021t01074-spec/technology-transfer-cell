from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.models.enums import PatentStatus

class PatentBase(SQLModel):
    title: str
    patent_number: Optional[str] = Field(default=None, index=True, unique=True) # e.g. PAT-8841
    jurisdiction: str = Field(default="US / PCT") # e.g. US / PCT, EP, IN
    assignee: str = Field(default="Technology Transfer Cell") # e.g. Technology Transfer Cell
    attorney: str = Field(default="TTC Legal Office")
    filing_date: Optional[date] = None
    next_due_date: Optional[date] = None
    status: PatentStatus = Field(default=PatentStatus.drafting)
    budget: Optional[float] = None
    claims_text: Optional[str] = None
    legal_notes: Optional[str] = None
    
    # Real Patent Portal Extended Fields
    patent_type: Optional[str] = "Utility Patent" # Utility Patent, Design Patent, Plant Patent
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    applicant_phone: Optional[str] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    short_description: Optional[str] = None
    detailed_description: Optional[str] = None
    problem_solved: Optional[str] = None
    benefits: Optional[str] = None
    inventors_json: Optional[str] = None
    documents_json: Optional[str] = None
    payment_status: Optional[str] = "unpaid"
    payment_amount: Optional[float] = 0.0
    declaration_accepted: bool = False
    is_draft: bool = False

class Patent(PatentBase, table=True):
    __tablename__ = "patents"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PatentCreate(PatentBase):
    pass

class PatentRead(PatentBase):
    id: int
    created_by_id: Optional[int]
    created_at: datetime

class PatentStatusUpdate(SQLModel):
    status: PatentStatus
