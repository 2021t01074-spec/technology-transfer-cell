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
    published = "published"
    office_action = "office_action"
    granted = "granted"
    rejected = "rejected"
    abandoned = "abandoned"
    lapsed = "lapsed"


class DisclosureStatus(str, Enum):
    submitted = "submitted"
    under_review = "under_review"
    evaluation = "evaluation"
    needs_revision = "needs_revision"
    approved = "approved"
    ready_for_filing = "ready_for_filing"
    rejected = "rejected"
    withdrawn = "withdrawn"


class DeadlineStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    overdue = "overdue"


class LicenseStatus(str, Enum):
    active = "active"
    pending = "pending"
    negotiation = "negotiation"
    expired = "expired"
    terminated = "terminated"


class LicenseType(str, Enum):
    exclusive = "exclusive"
    non_exclusive = "non_exclusive"
    field_of_use = "field_of_use"
    territory_limited = "territory_limited"
    option = "option"
    research = "research"


class DeadlineType(str, Enum):
    office_action = "office_action"
    renewal = "renewal"
    annuity = "annuity"
    pct_national_phase = "pct_national_phase"
    response = "response"
    review = "review"
    filing = "filing"
    other = "other"


class EvaluationDecision(str, Enum):
    proceed_to_patent = "proceed_to_patent"
    seek_more_info = "seek_more_info"
    defer = "defer"
    decline = "decline"
    license_only = "license_only"


class IPType(str, Enum):
    utility_patent = "utility_patent"
    design_patent = "design_patent"
    plant_patent = "plant_patent"
    copyright = "copyright"
    trade_secret = "trade_secret"
    trademark = "trademark"


class FundingSource(str, Enum):
    university = "university"
    government_grant = "government_grant"
    industry_sponsored = "industry_sponsored"
    self_funded = "self_funded"
    mixed = "mixed"
