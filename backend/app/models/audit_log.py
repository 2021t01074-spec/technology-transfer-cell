from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class AuditLogBase(SQLModel):
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    user_name: str
    user_role: str
    action: str  # e.g. "created", "updated_status", "deleted", "evaluated"
    entity_type: str  # e.g. "patent", "disclosure", "license", "deadline"
    entity_id: Optional[int] = None
    entity_title: Optional[str] = None
    details: Optional[str] = None  # JSON or text description of what changed
    ip_address: Optional[str] = None


class AuditLog(AuditLogBase, table=True):
    __tablename__ = "audit_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogRead(AuditLogBase):
    id: int
    created_at: datetime
