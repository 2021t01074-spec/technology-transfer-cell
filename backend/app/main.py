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

# Updated CORS to allow your live Vercel domain as well as localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ttc-fullstack.vercel.app", "http://localhost:5100", "http://127.0.0.1:5100"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Added prefix="/api" to all routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(agreements.router, prefix="/api")
app.include_router(mous.router, prefix="/api")
app.include_router(innovation_club.router, prefix="/api")
app.include_router(noticeboard.router, prefix="/api")
app.include_router(ipr_violations.router, prefix="/api")

# Register IPMS Routers
app.include_router(disclosures.router, prefix="/api")
app.include_router(patents.router, prefix="/api")
app.include_router(deadlines.router, prefix="/api")
app.include_router(licenses.router, prefix="/api")
app.include_router(audit_logs.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}