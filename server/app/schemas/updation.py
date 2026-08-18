from pydantic import BaseModel

from app.models.enrollment import EnrollmentStatus


class UpdationRequest(BaseModel):
    slot_id: str
    roll_numbers: list[str]
    status: EnrollmentStatus
    message: str | None = None  # optional note, not persisted yet — see README


class UpdationResponse(BaseModel):
    updated: list[str]
    not_found: list[str]