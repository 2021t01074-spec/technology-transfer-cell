from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.disclosure import (
    InventionDisclosure, DisclosureCreate, DisclosureRead,
    DisclosureStatusUpdate, DisclosureUpdate,
)
from app.models.user import User
from app.models.enums import DisclosureStatus
from app.core.deps import get_current_user
from app.routers.audit_logs import log_action

router = APIRouter(prefix="/disclosures", tags=["Invention Disclosures"])


@router.get("", response_model=List[DisclosureRead])
def list_disclosures(
    status: Optional[str] = None,
    department: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(InventionDisclosure)
    if status:
        query = query.where(InventionDisclosure.status == status)
    if department:
        query = query.where(InventionDisclosure.department == department)
    query = query.order_by(InventionDisclosure.created_at.desc())
    return session.exec(query).all()


@router.post("", response_model=DisclosureRead)
def create_disclosure(
    payload: DisclosureCreate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else None
    disclosure = InventionDisclosure(**payload.dict(), created_by_id=user_id)
    session.add(disclosure)
    
    # Log the action
    log_action(
        session, current_user,
        action="created",
        entity_type="disclosure",
        entity_title=payload.title,
        details=f"Submitted by {payload.primary_inventor}, Dept: {payload.department}"
    )
    
    session.commit()
    session.refresh(disclosure)
    return disclosure


@router.get("/{disclosure_id}", response_model=DisclosureRead)
def get_disclosure(disclosure_id: int, session: Session = Depends(get_session)):
    disclosure = session.get(InventionDisclosure, disclosure_id)
    if not disclosure:
        raise HTTPException(status_code=404, detail="Disclosure not found")
    return disclosure


@router.put("/{disclosure_id}", response_model=DisclosureRead)
def update_disclosure(
    disclosure_id: int,
    payload: DisclosureUpdate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Update disclosure fields (not just status). Supports partial updates."""
    disclosure = session.get(InventionDisclosure, disclosure_id)
    if not disclosure:
        raise HTTPException(status_code=404, detail="Disclosure not found")
    
    update_data = payload.dict(exclude_unset=True)
    changed_fields = []
    for key, value in update_data.items():
        if value is not None:
            setattr(disclosure, key, value)
            changed_fields.append(key)
    
    disclosure.updated_at = datetime.utcnow()
    session.add(disclosure)
    
    log_action(
        session, current_user,
        action="updated",
        entity_type="disclosure",
        entity_id=disclosure_id,
        entity_title=disclosure.title,
        details=f"Updated fields: {', '.join(changed_fields)}"
    )
    
    session.commit()
    session.refresh(disclosure)
    return disclosure


@router.patch("/{disclosure_id}/status", response_model=DisclosureRead)
def update_disclosure_status(
    disclosure_id: int,
    payload: DisclosureStatusUpdate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    disclosure = session.get(InventionDisclosure, disclosure_id)
    if not disclosure:
        raise HTTPException(status_code=404, detail="Disclosure not found")
    
    old_status = disclosure.status
    
    # Validate status transitions
    if disclosure.status == DisclosureStatus.ready_for_filing and payload.status == DisclosureStatus.needs_revision:
        raise HTTPException(status_code=400, detail="Ready-for-filing disclosures cannot regress to needs_revision")
    
    disclosure.status = payload.status
    
    # Store evaluation notes if provided
    if payload.evaluation_notes:
        disclosure.evaluation_notes = payload.evaluation_notes
    
    disclosure.updated_at = datetime.utcnow()
    session.add(disclosure)
    
    log_action(
        session, current_user,
        action="status_changed",
        entity_type="disclosure",
        entity_id=disclosure_id,
        entity_title=disclosure.title,
        details=f"Status: {old_status} → {payload.status}"
    )
    
    session.commit()
    session.refresh(disclosure)
    return disclosure


@router.patch("/{disclosure_id}/evaluate", response_model=DisclosureRead)
def evaluate_disclosure(
    disclosure_id: int,
    payload: DisclosureUpdate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """TTC staff evaluates a disclosure - sets evaluation decision and notes."""
    disclosure = session.get(InventionDisclosure, disclosure_id)
    if not disclosure:
        raise HTTPException(status_code=404, detail="Disclosure not found")
    
    if payload.evaluation_decision:
        disclosure.evaluation_decision = payload.evaluation_decision
    if payload.evaluation_notes:
        disclosure.evaluation_notes = payload.evaluation_notes
    if payload.evaluation_date:
        disclosure.evaluation_date = payload.evaluation_date
    
    disclosure.evaluated_by = current_user.full_name if current_user else "Unknown"
    disclosure.status = DisclosureStatus.evaluation
    disclosure.updated_at = datetime.utcnow()
    session.add(disclosure)
    
    log_action(
        session, current_user,
        action="evaluated",
        entity_type="disclosure",
        entity_id=disclosure_id,
        entity_title=disclosure.title,
        details=f"Decision: {payload.evaluation_decision}, Notes: {payload.evaluation_notes or 'N/A'}"
    )
    
    session.commit()
    session.refresh(disclosure)
    return disclosure
