from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.deadline import Deadline, DeadlineCreate, DeadlineRead, DeadlineStatusUpdate
from app.models.user import User
from app.models.enums import DeadlineStatus
from app.core.deps import get_current_user

router = APIRouter(prefix="/deadlines", tags=["Deadlines & Renewals"])

@router.get("", response_model=List[DeadlineRead])
def list_deadlines(
    status: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(Deadline)
    if status:
        query = query.where(Deadline.status == status)
    return session.exec(query).all()

@router.post("", response_model=DeadlineRead)
def create_deadline(
    payload: DeadlineCreate,
    session: Session = Depends(get_session),
    _: Optional[User] = Depends(get_current_user)
):
    deadline = Deadline(**payload.dict())
    session.add(deadline)
    session.commit()
    session.refresh(deadline)
    return deadline

@router.patch("/{deadline_id}/status", response_model=DeadlineRead)
def update_deadline_status(
    deadline_id: int,
    payload: DeadlineStatusUpdate,
    session: Session = Depends(get_session),
    _: Optional[User] = Depends(get_current_user)
):
    deadline = session.get(Deadline, deadline_id)
    if not deadline:
        raise HTTPException(status_code=404, detail="Deadline not found")
    if deadline.status == DeadlineStatus.completed and payload.status == DeadlineStatus.pending:
        raise HTTPException(status_code=400, detail="Completed deadlines cannot return to pending")
    deadline.status = payload.status
    session.add(deadline)
    session.commit()
    session.refresh(deadline)
    return deadline
