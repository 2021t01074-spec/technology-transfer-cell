from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from app.models.enums import DisclosureStatus, FundingSource, EvaluationDecision


class DisclosureBase(SQLModel):
    title: str
    description: Optional[str] = None
    department: str
    primary_inventor: str
    co_inventors_json: Optional[str] = None  # JSON array of co-inventor names, affiliations, contribution %
    reviewer: Optional[str] = None
    status: DisclosureStatus = Field(default=DisclosureStatus.submitted)
    due_date: Optional[date] = None

    # Technical Details
    technical_field: Optional[str] = None  # e.g. "Machine Learning", "Biomedical"
    keywords: Optional[str] = None  # Comma-separated keywords for search
    problem_statement: Optional[str] = None  # What problem does this solve?
    novelty_description: Optional[str] = None  # What is new/different?
    prior_art_known: Optional[str] = None  # Known prior art references
    development_stage: Optional[str] = None  # Concept / Prototype / Tested / Ready

    # Funding & IP Ownership Determination
    funding_source: Optional[FundingSource] = None
    grant_contract_number: Optional[str] = None  # Research grant reference
    university_resources_used: bool = False  # Whether university labs/equipment used

    # Public Disclosure Risk
    prior_public_disclosure: bool = False
    public_disclosure_details: Optional[str] = None  # Where/when was it publicly disclosed
    publication_planned: bool = False
    publication_date_planned: Optional[date] = None

    # Commercial Potential
    potential_applications: Optional[str] = None
    potential_licensees: Optional[str] = None  # Known interested industry partners
    market_size_estimate: Optional[str] = None

    # Evaluation
    evaluation_decision: Optional[EvaluationDecision] = None
    evaluation_notes: Optional[str] = None
    evaluation_date: Optional[date] = None
    evaluated_by: Optional[str] = None  # Committee member / TTC staff

    # Supporting documents reference
    documents_json: Optional[str] = None  # JSON array of document references


class InventionDisclosure(DisclosureBase, table=True):
    __tablename__ = "invention_disclosures"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DisclosureCreate(DisclosureBase):
    pass


class DisclosureRead(DisclosureBase):
    id: int
    created_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class DisclosureUpdate(SQLModel):
    """For partial updates to disclosure fields (not just status)."""
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    primary_inventor: Optional[str] = None
    co_inventors_json: Optional[str] = None
    reviewer: Optional[str] = None
    technical_field: Optional[str] = None
    keywords: Optional[str] = None
    problem_statement: Optional[str] = None
    novelty_description: Optional[str] = None
    prior_art_known: Optional[str] = None
    development_stage: Optional[str] = None
    funding_source: Optional[FundingSource] = None
    grant_contract_number: Optional[str] = None
    university_resources_used: Optional[bool] = None
    prior_public_disclosure: Optional[bool] = None
    public_disclosure_details: Optional[str] = None
    publication_planned: Optional[bool] = None
    publication_date_planned: Optional[date] = None
    potential_applications: Optional[str] = None
    potential_licensees: Optional[str] = None
    market_size_estimate: Optional[str] = None
    evaluation_decision: Optional[EvaluationDecision] = None
    evaluation_notes: Optional[str] = None
    evaluation_date: Optional[date] = None
    evaluated_by: Optional[str] = None
    documents_json: Optional[str] = None
    due_date: Optional[date] = None


class DisclosureStatusUpdate(SQLModel):
    status: DisclosureStatus
    evaluation_notes: Optional[str] = None
