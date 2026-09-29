from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.license import License, LicenseCreate, LicenseRead, LicenseStatusUpdate
from app.models.user import User
from app.models.enums import LicenseStatus
from app.core.deps import get_current_user

router = APIRouter(prefix="/licenses", tags=["IP Licensing"])

@router.get("", response_model=List[LicenseRead])
def list_licenses(
    status: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(License)
    if status:
        query = query.where(License.status == status)
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
    session.commit()
    session.refresh(license_item)
    return license_item

@router.get("/{license_id}", response_model=LicenseRead)
def get_license(license_id: int, session: Session = Depends(get_session)):
    license_item = session.get(License, license_id)
    if not license_item:
        raise HTTPException(status_code=404, detail="License not found")
    return license_item

@router.patch("/{license_id}/status", response_model=LicenseRead)
def update_license_status(
    license_id: int,
    payload: LicenseStatusUpdate,
    session: Session = Depends(get_session),
    _: Optional[User] = Depends(get_current_user)
):
    license_item = session.get(License, license_id)
    if not license_item:
        raise HTTPException(status_code=404, detail="License not found")
    if license_item.status == LicenseStatus.terminated and payload.status == LicenseStatus.active:
        raise HTTPException(status_code=400, detail="Terminated licenses cannot be reactivated")
    license_item.status = payload.status
    session.add(license_item)
    session.commit()
    session.refresh(license_item)
    return license_item
