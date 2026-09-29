from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models.audit_log import AuditLog, AuditLogRead
from app.models.user import User
from app.models.enums import UserRole
from app.core.deps import require_roles

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])


@router.get("", response_model=List[AuditLogRead])
def list_audit_logs(
    entity_type: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    session: Session = Depends(get_session),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.ttc_staff)),
):
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    query = query.limit(limit)
    return session.exec(query).all()


def log_action(
    session: Session,
    user: Optional[User],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    entity_title: Optional[str] = None,
    details: Optional[str] = None,
):
    """Utility function to create an audit log entry."""
    log = AuditLog(
        user_id=user.id if user else None,
        user_name=user.full_name if user else "System",
        user_role=user.role if user else "system",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_title=entity_title,
        details=details,
    )
    session.add(log)
