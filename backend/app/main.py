from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import (
    auth, users, projects, agreements, mous, innovation_club, noticeboard, ipr_violations,
    disclosures, patents, deadlines, licenses, audit_logs
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Technology Transfer Cell Intellectual Property Management System (TTC-IPMS)", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(agreements.router)
app.include_router(mous.router)
app.include_router(innovation_club.router)
app.include_router(noticeboard.router)
app.include_router(ipr_violations.router)

# Register IPMS Routers
app.include_router(disclosures.router)
app.include_router(patents.router)
app.include_router(deadlines.router)
app.include_router(licenses.router)
app.include_router(audit_logs.router)


@app.get("/health")
def health():
    return {"status": "ok"}
