from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.license import License, LicenseCreate, LicenseRead, LicenseStatusUpdate
from app.models.user import User
from app.models.enums import LicenseStatus
from app.core.deps import get_current_user
from app.routers.audit_logs import log_action

router = APIRouter(prefix="/licenses", tags=["IP Licensing"])


@router.get("", response_model=List[LicenseRead])
def list_licenses(
    status: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(License)
    if status:
        query = query.where(License.status == status)
    query = query.order_by(License.created_at.desc())
    return session.exec(query).all()


@router.post("", response_model=LicenseRead)
def create_license(
    payload: LicenseCreate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else None
    license_item = License(**payload.dict(), created_by_id=user_id)
    session.add(license_item)
    
    log_action(
        session, current_user,
        action="created",
        entity_type="license",
        entity_title=payload.title,
        details=f"Licensee: {payload.licensee_name}, Type: {payload.license_type or 'N/A'}"
    )
    
    session.commit()
    session.refresh(license_item)
    return license_item


@router.get("/{license_id}", response_model=LicenseRead)
def get_license(license_id: int, session: Session = Depends(get_session)):
    license_item = session.get(License, license_id)
    if not license_item:
        raise HTTPException(status_code=404, detail="License not found")
    return license_item


@router.put("/{license_id}", response_model=LicenseRead)
def update_license(
    license_id: int,
    payload: LicenseCreate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    license_item = session.get(License, license_id)
    if not license_item:
        raise HTTPException(status_code=404, detail="License not found")
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(license_item, key, value)
    
    license_item.updated_at = datetime.utcnow()
    session.add(license_item)
    
    log_action(
        session, current_user,
        action="updated",
        entity_type="license",
        entity_id=license_id,
        entity_title=license_item.title,
    )
    
    session.commit()
    session.refresh(license_item)
    return license_item


@router.patch("/{license_id}/status", response_model=LicenseRead)
def update_license_status(
    license_id: int,
    payload: LicenseStatusUpdate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    license_item = session.get(License, license_id)
    if not license_item:
        raise HTTPException(status_code=404, detail="License not found")
    if license_item.status == LicenseStatus.terminated and payload.status == LicenseStatus.active:
        raise HTTPException(status_code=400, detail="Terminated licenses cannot be reactivated")
    
    old_status = license_item.status
    license_item.status = payload.status
    license_item.updated_at = datetime.utcnow()
    session.add(license_item)
    
    log_action(
        session, current_user,
        action="status_changed",
        entity_type="license",
        entity_id=license_id,
        entity_title=license_item.title,
        details=f"Status: {old_status} → {payload.status}"
    )
    
    session.commit()
    session.refresh(license_item)
    return license_item


@router.get("/summary/revenue")
def get_revenue_summary(session: Session = Depends(get_session)):
    """Aggregated revenue summary across all active licenses."""
    licenses = session.exec(select(License).where(License.status == LicenseStatus.active)).all()
    total_ytd = sum(l.revenue_ytd or 0 for l in licenses)
    total_all_time = sum(l.total_revenue or 0 for l in licenses)
    total_upfront = sum(l.upfront_fee or 0 for l in licenses)
    active_count = len(licenses)
    
    return {
        "active_licenses": active_count,
        "total_ytd_revenue": total_ytd,
        "total_all_time_revenue": total_all_time,
        "total_upfront_fees": total_upfront,
    }
