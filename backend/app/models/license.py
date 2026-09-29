from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.models.enums import LicenseStatus

class LicenseBase(SQLModel):
    title: str
    patent_id: Optional[int] = Field(default=None, foreign_key="patents.id")
    licensee_name: str
    royalty_rate: Optional[float] = None
    revenue_ytd: Optional[float] = None
    status: LicenseStatus = Field(default=LicenseStatus.active)
    signing_date: Optional[date] = None
    expiry_date: Optional[date] = None

class License(LicenseBase, table=True):
    __tablename__ = "licenses"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LicenseCreate(LicenseBase):
    pass

class LicenseRead(LicenseBase):
    id: int
    created_by_id: Optional[int]
    created_at: datetime

class LicenseStatusUpdate(SQLModel):
    status: LicenseStatus
