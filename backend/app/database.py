from datetime import date
from sqlmodel import SQLModel, create_engine, Session, select
from app.config import settings

engine = create_engine(settings.database_url, echo=False)


def get_session():
    """Dependency generator to provide a database session for requests."""
    with Session(engine) as session:
        yield session


def init_db():
    # import models so SQLModel metadata is aware of every table
    from app.models import (  # noqa: F401
        user, project, agreement, mou, innovation_club, noticeboard, ipr_violation,
        disclosure, patent, prosecution, deadline, license, audit_log
    )
    SQLModel.metadata.create_all(engine)
    
    # Run column migrations for existing tables
    _run_migrations()
    
    # Seed data if tables are empty
    with Session(engine) as session:
        seed_data(session)


def _run_migrations():
    """Add new columns to existing tables without dropping data."""
    from sqlmodel import text
    with Session(engine) as session:
        migrations = [
            # Patent table migrations
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS patent_type VARCHAR DEFAULT 'Utility Patent';",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS applicant_name VARCHAR;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS applicant_email VARCHAR;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS address VARCHAR;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS nationality VARCHAR;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS short_description TEXT;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS detailed_description TEXT;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS problem_solved TEXT;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS benefits TEXT;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS inventors_json TEXT;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS documents_json TEXT;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'unpaid';",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS payment_amount FLOAT DEFAULT 0.0;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;",
            
            # Disclosure table new column migrations
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS co_inventors_json TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS technical_field VARCHAR;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS keywords VARCHAR;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS problem_statement TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS novelty_description TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS prior_art_known TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS development_stage VARCHAR;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS funding_source VARCHAR;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS grant_contract_number VARCHAR;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS university_resources_used BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS prior_public_disclosure BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS public_disclosure_details TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS publication_planned BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS publication_date_planned DATE;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS potential_applications TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS potential_licensees TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS market_size_estimate TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS evaluation_decision VARCHAR;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS evaluation_notes TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS evaluation_date DATE;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS evaluated_by VARCHAR;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS documents_json TEXT;",
            "ALTER TABLE invention_disclosures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            
            # License table new column migrations
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS licensee_contact VARCHAR;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS licensee_address VARCHAR;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS license_type VARCHAR DEFAULT 'non_exclusive';",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS upfront_fee FLOAT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS minimum_annual_royalty FLOAT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS total_revenue FLOAT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS effective_date DATE;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS territory VARCHAR;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS field_of_use VARCHAR;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS milestone_notes TEXT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS next_milestone_date DATE;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS next_milestone_description TEXT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS inventor_share_percent FLOAT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS department_share_percent FLOAT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS university_share_percent FLOAT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS notes TEXT;",
            "ALTER TABLE licenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            
            # Deadline table new column migrations
            "ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS deadline_type VARCHAR DEFAULT 'other';",
            "ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR;",
            "ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS notes TEXT;",
            "ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS completed_date DATE;",
            "ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;",
        ]
        for query in migrations:
            try:
                session.exec(text(query))
            except Exception:
                pass
        session.commit()


def seed_data(session: Session):
    from app.models.user import User
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.patent import Patent
    from app.models.disclosure import InventionDisclosure
    from app.models.deadline import Deadline
    from app.models.license import License
    from app.models.prosecution import ProsecutionEvent
    
    # 0. Seed Users
    for email, role, name, pw, dept, phone in [
        ("admin@university.ac.lk", UserRole.super_admin, "TTC Administrator", "admin123", "TTC Central", "+94 (11) 234-5678"),
        ("staff@university.ac.lk", UserRole.ttc_staff, "Sarah Staff Liaison", "staff123", "TTC Central", "+94 (77) 123-4567"),
        ("user@university.ac.lk", UserRole.faculty, "Prof. Daniel Shaw", "user123", "Electrical & Info Engineering", "+94 (77) 987-6543"),
    ]:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            existing.hashed_password = hash_password(pw)
            existing.role = role
            existing.full_name = name
            existing.department = dept
            existing.phone = phone
            session.add(existing)
        else:
            u = User(
                full_name=name,
                email=email,
                role=role,
                department=dept,
                phone=phone,
                hashed_password=hash_password(pw)
            )
            session.add(u)
    session.commit()

    if not session.exec(select(Patent)).first():
        pat1 = Patent(
            title="Adaptive edge AI scheduler",
            patent_number="PAT-8841",
            jurisdiction="US / PCT",
            assignee="Technology Transfer Cell",
            attorney="Aisha Bennett",
            filing_date=date(2026, 2, 17),
            next_due_date=date(2026, 6, 3),
            status="office_action",
            budget=50000.0,
            claims_text="Claims set includes scheduler fairness, distributed energy allocation, and verification signals.",
            legal_notes="Legal notes cover prior art summary, inventorship sign-off, and continuation options."
        )
        pat2 = Patent(
            title="Bio-signal wearable calibration method",
            patent_number="PAT-8790",
            jurisdiction="US / PCT",
            assignee="Technology Transfer Cell",
            attorney="Rohan Gupta",
            filing_date=date(2026, 4, 12),
            next_due_date=date(2026, 8, 15),
            status="filed",
            budget=35000.0,
            claims_text="Claims cover signal calibration on localized wearable hardware interfaces.",
            legal_notes="Prior art search completed. Continuation strategy pending review."
        )
        pat3 = Patent(
            title="Secure federated model watermarking",
            patent_number="PAT-8612",
            jurisdiction="US / PCT",
            assignee="Technology Transfer Cell",
            attorney="Elena Brooks",
            filing_date=date(2025, 11, 1),
            next_due_date=date(2026, 11, 1),
            status="granted",
            budget=62000.0,
            claims_text="Federated neural network protection, ownership tracking, watermark extraction.",
            legal_notes="Granted on publication sync."
        )
        pat4 = Patent(
            title="Autonomous materials inspection pipeline",
            patent_number="PAT-8540",
            jurisdiction="EP",
            assignee="Technology Transfer Cell",
            attorney="Aisha Bennett",
            filing_date=date(2026, 3, 20),
            next_due_date=date(2026, 5, 29),
            status="drafting",
            budget=28000.0,
            claims_text="Visual defect scanning and localized materials stress evaluation.",
            legal_notes="Drafting specifications under internal review."
        )
        session.add_all([pat1, pat2, pat3, pat4])
        session.commit()
        session.refresh(pat1)
        session.refresh(pat2)
        session.refresh(pat3)
        session.refresh(pat4)
        
        # Add Timeline events
        evt1 = ProsecutionEvent(
            patent_id=pat1.id,
            event_title="Provisional filing converted to PCT pathway",
            event_date=date(2026, 2, 17),
            notes="Filing completed under expedited review."
        )
        evt2 = ProsecutionEvent(
            patent_id=pat2.id,
            event_title="Claims drafted for continuation strategy",
            event_date=date(2026, 4, 12),
            notes="Draft claims synced with external IP office."
        )
        evt3 = ProsecutionEvent(
            patent_id=pat3.id,
            event_title="Grant notice received and publication synced",
            event_date=date(2025, 11, 1),
            notes="Formal grant certificate issued."
        )
        evt4 = ProsecutionEvent(
            patent_id=pat4.id,
            event_title="Specification under internal review",
            event_date=date(2026, 3, 20),
            notes="Awaiting feedback from Lead Researcher."
        )
        session.add_all([evt1, evt2, evt3, evt4])
        session.commit()

    # 2. Seed Disclosures
    if not session.exec(select(InventionDisclosure)).first():
        disc1 = InventionDisclosure(
            title="Adaptive edge AI scheduler",
            description="Energy-aware orchestration for campus devices",
            department="Computer Engineering",
            primary_inventor="Dr. Meera Patel",
            reviewer="Aisha Bennett",
            status="under_review",
            due_date=date(2026, 5, 27),
            technical_field="Machine Learning / IoT",
            keywords="edge computing, AI scheduling, energy optimization",
            problem_statement="Existing schedulers waste energy on campus IoT infrastructure",
            novelty_description="Novel fairness-aware multi-objective scheduling with energy constraints",
            development_stage="Prototype",
            funding_source="government_grant",
            grant_contract_number="NRC-2025-AI-042",
            university_resources_used=True,
            potential_applications="Smart campus management, industrial IoT, data center optimization",
        )
        disc2 = InventionDisclosure(
            title="Bio-signal wearable calibration method",
            description="Improved drift correction for long duration readings",
            department="Electrical and Information Engineering",
            primary_inventor="Prof. Daniel Shaw",
            reviewer="Rohan Gupta",
            status="needs_revision",
            due_date=date(2026, 5, 24),
            technical_field="Biomedical Engineering",
            keywords="wearable sensors, signal calibration, drift correction",
            problem_statement="Long-duration wearable biosignal readings degrade due to sensor drift",
            novelty_description="Adaptive real-time calibration using physiological baseline tracking",
            development_stage="Tested",
            funding_source="industry_sponsored",
            university_resources_used=True,
            prior_public_disclosure=True,
            public_disclosure_details="Partial results presented at IEEE BioSensors 2026 conference",
            potential_applications="Healthcare monitoring, sports analytics, clinical trials",
            potential_licensees="Medtronic, Fitbit, Apple Health",
        )
        disc3 = InventionDisclosure(
            title="Secure federated model watermarking",
            description="Traceable ownership for distributed machine learning models",
            department="Computer Engineering",
            primary_inventor="Dr. Nabila Khan",
            reviewer="Elena Brooks",
            status="ready_for_filing",
            due_date=date(2026, 5, 22),
            technical_field="Cybersecurity / Machine Learning",
            keywords="federated learning, watermarking, IP protection, neural networks",
            problem_statement="No reliable way to prove ownership of federated ML models",
            novelty_description="Embedding verifiable watermarks into federated model weight distributions",
            development_stage="Concept",
            funding_source="university",
            university_resources_used=True,
            evaluation_decision="proceed_to_patent",
            evaluation_notes="Strong commercial potential. No prior art conflicts identified.",
            evaluation_date=date(2026, 5, 20),
            evaluated_by="TTC IP Evaluation Committee",
            potential_applications="Enterprise AI security, banking ML models, healthcare AI",
            potential_licensees="Virtusa Corp, WSO2",
            market_size_estimate="USD 2.1B (AI Security market by 2028)",
        )
        session.add_all([disc1, disc2, disc3])
        session.commit()

    # 3. Seed Deadlines
    if not session.exec(select(Deadline)).first():
        dl1 = Deadline(
            record_id="PAT-8841",
            title="PAT-8841 office action response",
            due_date=date(2026, 6, 3),
            severity="critical",
            status="pending",
            assigned_to="Aisha Bennett",
            deadline_type="office_action",
            jurisdiction="US / PCT",
            notes="90-day statutory response window. Non-final office action received.",
        )
        dl2 = Deadline(
            record_id="LIC-233",
            title="LIC-233 milestone certification",
            due_date=date(2026, 5, 26),
            severity="high",
            status="pending",
            assigned_to="Elena Brooks",
            deadline_type="other",
            notes="Annual milestone certification required per license agreement.",
        )
        dl3 = Deadline(
            record_id="PAT-8790",
            title="PAT-8790 annuity payment",
            due_date=date(2026, 6, 18),
            severity="moderate",
            status="pending",
            assigned_to="Rohan Gupta",
            deadline_type="annuity",
            jurisdiction="US / PCT",
            notes="Year 3 annuity payment due. Grace period: 6 months with surcharge.",
        )
        dl4 = Deadline(
            record_id="DISC-1021",
            title="DISC-1021 review revision due",
            due_date=date(2026, 5, 24),
            severity="high",
            status="pending",
            assigned_to="Prof. Daniel Shaw",
            deadline_type="review",
            notes="Inventor must respond to revision request with additional technical details.",
        )
        session.add_all([dl1, dl2, dl3, dl4])
        session.commit()

    # 4. Seed Licenses
    if not session.exec(select(License)).first():
        lic1 = License(
            title="Edge Scheduler Licensing Agreement",
            licensee_name="Apple Inc.",
            license_type="non_exclusive",
            royalty_rate=4.5,
            upfront_fee=25000.0,
            revenue_ytd=75000.0,
            total_revenue=75000.0,
            status="active",
            signing_date=date(2026, 1, 15),
            territory="Worldwide",
            field_of_use="Consumer electronics and smart home devices",
            inventor_share_percent=40.0,
            department_share_percent=20.0,
            university_share_percent=40.0,
            next_milestone_date=date(2026, 7, 15),
            next_milestone_description="First commercial product incorporating licensed technology",
        )
        lic2 = License(
            title="Bio-Signal Calibration Tech Transfer",
            licensee_name="Medtronic",
            license_type="exclusive",
            royalty_rate=3.5,
            upfront_fee=50000.0,
            minimum_annual_royalty=15000.0,
            revenue_ytd=53000.0,
            total_revenue=103000.0,
            status="active",
            signing_date=date(2026, 3, 10),
            territory="APAC Region",
            field_of_use="Medical devices and clinical monitoring",
            inventor_share_percent=35.0,
            department_share_percent=25.0,
            university_share_percent=40.0,
        )
        session.add_all([lic1, lic2])
        session.commit()

    # 5. Seed Projects
    from app.models.project import IndustryProject
    from app.models.enums import ProjectStatus
    from app.models.user import User

    if not session.exec(select(IndustryProject)).first():
        user_shaw = session.exec(select(User).where(User.email == "user@university.ac.lk")).first()
        admin_user = session.exec(select(User).where(User.email == "admin@university.ac.lk")).first()

        proj1 = IndustryProject(
            title="IoT-Enabled Campus Smart Grid Optimization",
            description="Developing energy-efficient load balancing for local microgrids.",
            industry_partner_name="Lanka Electricity Company (LECO)",
            faculty_lead_id=user_shaw.id if user_shaw else None,
            status=ProjectStatus.ongoing,
            start_date=date(2026, 1, 10),
            end_date=date(2026, 12, 20),
            budget=4500000.0,
            created_by_id=admin_user.id if admin_user else None
        )
        proj2 = IndustryProject(
            title="Wearable Health Monitoring Fabric Calibration",
            description="Fabrication of smart sensors using graphene composite materials.",
            industry_partner_name="Medtronic Sri Lanka",
            faculty_lead_id=user_shaw.id if user_shaw else None,
            status=ProjectStatus.proposed,
            start_date=date(2026, 6, 1),
            end_date=date(2027, 6, 1),
            budget=2800000.0,
            created_by_id=admin_user.id if admin_user else None
        )
        proj3 = IndustryProject(
            title="Enterprise Threat Watermarking Core",
            description="Zero-trust authentication and neural network watermarking for banking models.",
            industry_partner_name="Virtusa Corp",
            faculty_lead_id=None,
            status=ProjectStatus.completed,
            start_date=date(2025, 3, 1),
            end_date=date(2026, 3, 1),
            budget=6500000.0,
            created_by_id=admin_user.id if admin_user else None
        )
        session.add_all([proj1, proj2, proj3])
        session.commit()
