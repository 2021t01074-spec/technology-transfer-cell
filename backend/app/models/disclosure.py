from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.models.enums import DisclosureStatus

class DisclosureBase(SQLModel):
    title: str
    description: Optional[str] = None
    department: str
    primary_inventor: str
    reviewer: Optional[str] = None
    status: DisclosureStatus = Field(default=DisclosureStatus.under_review)
    due_date: Optional[date] = None

class InventionDisclosure(DisclosureBase, table=True):
    __tablename__ = "invention_disclosures"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DisclosureCreate(DisclosureBase):
    pass

class DisclosureRead(DisclosureBase):
    id: int
    created_by_id: Optional[int]
    created_at: datetime

class DisclosureStatusUpdate(SQLModel):
    status: DisclosureStatus
