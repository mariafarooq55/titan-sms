from datetime import datetime

from pydantic import BaseModel

from app.models.enrollment import EnrollmentStatus


class EnrollmentCreate(BaseModel):
    student_id: str
    slot_id: str


class EnrollmentUpdate(BaseModel):
    status: EnrollmentStatus


class EnrollmentOut(BaseModel):
    id: str
    student_id: str
    student_name: str
    slot_id: str
    slot_schedule: str
    course: str
    campus: str
    trainer: str | None = None
    roll_number: str
    status: EnrollmentStatus
    joined_at: datetime

    model_config = {"from_attributes": True}