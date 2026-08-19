from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db

from app.routers import (
    auth,
    attendance,
    dashboard,
    student_me,
    enrollments,
    me,
    slots,
    students,
    trainers,
    trainer,
    voucher,
    updation,
    setup,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Titan SMS API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication
app.include_router(auth.router)

# Admin APIs
app.include_router(dashboard.router)
app.include_router(students.router)
app.include_router(slots.router)
app.include_router(trainers.router)
app.include_router(attendance.router)
app.include_router(enrollments.router)
app.include_router(voucher.router)
app.include_router(updation.router)

# Student Portal APIs
app.include_router(me.router)

# Trainer Portal APIs
app.include_router(trainer.router)

# Coursework APIs (Assignments, Submissions, Quizzes) — shared by both portals
app.include_router(student_me.router)

app.include_router(setup.router)
@app.get("/api/health")
async def health():
    return {"status": "ok"}