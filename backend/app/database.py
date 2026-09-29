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
        disclosure, patent, prosecution, deadline, license
    )
    SQLModel.metadata.create_all(engine)
    
    # Ensure column migrations for patents table
    from sqlmodel import text
    with Session(engine) as session:
        migrations = [
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
            "ALTER TABLE patents ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;"
        ]
        for query in migrations:
            try:
                session.exec(text(query))
            except Exception:
                pass
        session.commit()
    
    # Seed data if tables are empty
    with Session(engine) as session:
        seed_data(session)


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
    for email, role, name, pw in [
        ("admin@university.ac.lk", UserRole.super_admin, "TTC Administrator", "admin123"),
        ("staff@university.ac.lk", UserRole.ttc_staff, "Sarah Staff Liaison", "staff123"),
        ("user@university.ac.lk", UserRole.faculty, "Prof. Daniel Shaw", "user123"),
    ]:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            existing.hashed_password = hash_password(pw)
            existing.role = role
            existing.full_name = name
            session.add(existing)
        else:
            u = User(
                full_name=name,
                email=email,
                role=role,
                department="TTC Central" if "TTC" in name or "Sarah" in name else "Electrical & Info",
                phone="+94 (11) 234-5678" if "Admin" in name else "+94 (77) 123-4567",
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
            due_date=date(2026, 5, 27)
        )
        disc2 = InventionDisclosure(
            title="Bio-signal wearable calibration method",
            description="Improved drift correction for long duration readings",
            department="Electrical and Information Engineering",
            primary_inventor="Prof. Daniel Shaw",
            reviewer="Rohan Gupta",
            status="needs_revision",
            due_date=date(2026, 5, 24)
        )
        disc3 = InventionDisclosure(
            title="Secure federated model watermarking",
            description="Traceable ownership for distributed machine learning models",
            department="Computer Engineering",
            primary_inventor="Dr. Nabila Khan",
            reviewer="Elena Brooks",
            status="ready_for_filing",
            due_date=date(2026, 5, 22)
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
            assigned_to="Aisha Bennett"
        )
        dl2 = Deadline(
            record_id="LIC-233",
            title="LIC-233 milestone certification",
            due_date=date(2026, 5, 26),
            severity="high",
            status="pending",
            assigned_to="Elena Brooks"
        )
        dl3 = Deadline(
            record_id="PAT-8790",
            title="PAT-8790 annuity check",
            due_date=date(2026, 6, 18),
            severity="moderate",
            status="pending",
            assigned_to="Rohan Gupta"
        )
        dl4 = Deadline(
            record_id="DISC-1021",
            title="DISC-1021 review revision due",
            due_date=date(2026, 5, 24),
            severity="high",
            status="pending",
            assigned_to="Prof. Daniel Shaw"
        )
        session.add_all([dl1, dl2, dl3, dl4])
        session.commit()

    # 4. Seed Licenses
    if not session.exec(select(License)).first():
        lic1 = License(
            title="Edge Scheduler Licensing Agreement",
            licensee_name="Apple Inc.",
            royalty_rate=4.5,
            revenue_ytd=75000.0,
            status="active",
            signing_date=date(2026, 1, 15)
        )
        lic2 = License(
            title="Bio-Signal Calibration Tech Transfer",
            licensee_name="Medtronic",
            royalty_rate=3.5,
            revenue_ytd=53000.0,
            status="active",
            signing_date=date(2026, 3, 10)
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

