from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.models.enums import DeadlineStatus, DeadlineType


class DeadlineBase(SQLModel):
    record_id: str  # e.g. PAT-8841, LIC-233, DISC-1021
    title: str
    due_date: date
    severity: str = Field(default="medium")  # low, moderate, high, critical
    status: DeadlineStatus = Field(default=DeadlineStatus.pending)
    assigned_to: Optional[str] = None
    deadline_type: Optional[DeadlineType] = Field(default=DeadlineType.other)
    jurisdiction: Optional[str] = None  # Jurisdiction-specific deadline context
    notes: Optional[str] = None
    completed_date: Optional[date] = None
    reminder_sent: bool = False


class Deadline(DeadlineBase, table=True):
    __tablename__ = "deadlines"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DeadlineCreate(DeadlineBase):
    pass


class DeadlineRead(DeadlineBase):
    id: int
    created_at: datetime


class DeadlineStatusUpdate(SQLModel):
    status: DeadlineStatus
    notes: Optional[str] = None
