from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.patent import Patent, PatentCreate, PatentRead, PatentStatusUpdate
from app.models.prosecution import ProsecutionEvent, ProsecutionEventCreate, ProsecutionEventRead
from app.models.user import User
from app.models.enums import PatentStatus
from app.core.deps import get_current_user

router = APIRouter(prefix="/patents", tags=["Patent Portfolio"])


def _generate_patent_number(session: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"PAT-{year}-"
    existing_numbers = session.exec(select(Patent.patent_number).where(Patent.patent_number.like(f"{prefix}%"))).all()
    max_sequence = 0
    for number in existing_numbers:
        try:
            max_sequence = max(max_sequence, int(number.split("-")[-1]))
        except (ValueError, IndexError):
            continue
    return f"{prefix}{max_sequence + 1:04d}"

@router.get("", response_model=List[PatentRead])
def list_patents(
    status: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(Patent)
    if status:
        query = query.where(Patent.status == status)
    return session.exec(query).all()

@router.post("", response_model=PatentRead)
def create_patent(
    payload: PatentCreate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else None
    data = payload.dict()
    if not data.get("patent_number"):
        data["patent_number"] = _generate_patent_number(session)
    data.setdefault("status", PatentStatus.drafting)
    patent = Patent(**data, created_by_id=user_id)
    session.add(patent)
    session.commit()
    session.refresh(patent)
    return patent

@router.get("/{patent_id}", response_model=PatentRead)
def get_patent(patent_id: int, session: Session = Depends(get_session)):
    patent = session.get(Patent, patent_id)
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    return patent

@router.patch("/{patent_id}/status", response_model=PatentRead)
def update_patent_status(
    patent_id: int,
    payload: PatentStatusUpdate,
    session: Session = Depends(get_session),
    _: Optional[User] = Depends(get_current_user)
):
    patent = session.get(Patent, patent_id)
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    if patent.status == PatentStatus.granted and payload.status != PatentStatus.granted:
        raise HTTPException(status_code=400, detail="Granted patents cannot be moved back to a non-granted status")
    patent.status = payload.status
    session.add(patent)
    session.commit()
    session.refresh(patent)
    return patent

# Prosecution Timeline Events nested under Patents or stand-alone
@router.get("/{patent_id}/timeline", response_model=List[ProsecutionEventRead])
def get_patent_timeline(patent_id: int, session: Session = Depends(get_session)):
    query = select(ProsecutionEvent).where(ProsecutionEvent.patent_id == patent_id).order_by(ProsecutionEvent.event_date.asc())
    return session.exec(query).all()

@router.post("/{patent_id}/timeline", response_model=ProsecutionEventRead)
def add_patent_timeline_event(
    patent_id: int,
    payload: ProsecutionEventCreate,
    session: Session = Depends(get_session),
    _: Optional[User] = Depends(get_current_user)
):
    patent = session.get(Patent, patent_id)
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    if not payload.event_title.strip():
        raise HTTPException(status_code=400, detail="Event title is required")
    event = ProsecutionEvent(**payload.dict())
    event.patent_id = patent_id
    session.add(event)
    session.commit()
    session.refresh(event)
    return event

@router.put("/{patent_id}", response_model=PatentRead)
def update_patent(
    patent_id: int,
    payload: PatentCreate,
    session: Session = Depends(get_session),
    _: Optional[User] = Depends(get_current_user)
):
    patent = session.get(Patent, patent_id)
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    update_data = payload.dict(exclude_unset=True)
    if "patent_number" in update_data:
        duplicate = session.exec(
            select(Patent).where(Patent.patent_number == update_data["patent_number"], Patent.id != patent_id)
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Patent number already exists")
    for key, value in update_data.items():
        setattr(patent, key, value)
        
    session.add(patent)
    session.commit()
    session.refresh(patent)
    return patent
