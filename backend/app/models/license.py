from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.models.enums import LicenseStatus, LicenseType


class LicenseBase(SQLModel):
    title: str
    patent_id: Optional[int] = Field(default=None, foreign_key="patents.id")
    licensee_name: str
    licensee_contact: Optional[str] = None
    licensee_address: Optional[str] = None
    license_type: Optional[LicenseType] = Field(default=LicenseType.non_exclusive)
    royalty_rate: Optional[float] = None
    upfront_fee: Optional[float] = None
    minimum_annual_royalty: Optional[float] = None
    revenue_ytd: Optional[float] = None
    total_revenue: Optional[float] = None
    status: LicenseStatus = Field(default=LicenseStatus.pending)
    signing_date: Optional[date] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None

    # Territory & Field
    territory: Optional[str] = None  # e.g. "Worldwide", "Sri Lanka", "APAC Region"
    field_of_use: Optional[str] = None  # Specific application domain

    # Milestone tracking
    milestone_notes: Optional[str] = None
    next_milestone_date: Optional[date] = None
    next_milestone_description: Optional[str] = None

    # Revenue sharing
    inventor_share_percent: Optional[float] = None
    department_share_percent: Optional[float] = None
    university_share_percent: Optional[float] = None

    # Notes
    notes: Optional[str] = None


class License(LicenseBase, table=True):
    __tablename__ = "licenses"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LicenseCreate(LicenseBase):
    pass


class LicenseRead(LicenseBase):
    id: int
    created_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class LicenseStatusUpdate(SQLModel):
    status: LicenseStatus
