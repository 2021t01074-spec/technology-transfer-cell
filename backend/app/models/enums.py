from enum import Enum


class UserRole(str, Enum):
    super_admin = "super_admin"
    ttc_staff = "ttc_staff"
    faculty = "faculty"
    industry_partner = "industry_partner"
    club_member = "club_member"


class ProjectStatus(str, Enum):
    proposed = "proposed"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class AgreementType(str, Enum):
    nda = "nda"
    licensing = "licensing"
    consultancy = "consultancy"
    other = "other"


class AgreementStatus(str, Enum):
    draft = "draft"
    active = "active"
    expired = "expired"
    terminated = "terminated"


class MouStatus(str, Enum):
    draft = "draft"
    pending_signature = "pending_signature"
    signed = "signed"
    expired = "expired"


class ApplicationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ViolationStatus(str, Enum):
    reported = "reported"
    investigating = "investigating"
    resolved = "resolved"
    dismissed = "dismissed"


class ViolationSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class PatentStatus(str, Enum):
    drafting = "drafting"
    under_review = "under_review"
    filed = "filed"
    office_action = "office_action"
    granted = "granted"
    rejected = "rejected"
    abandoned = "abandoned"


class DisclosureStatus(str, Enum):
    under_review = "under_review"
    needs_revision = "needs_revision"
    ready_for_filing = "ready_for_filing"
    approved = "approved"
    rejected = "rejected"


class DeadlineStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    overdue = "overdue"


class LicenseStatus(str, Enum):
    active = "active"
    pending = "pending"
    expired = "expired"
    terminated = "terminated"
