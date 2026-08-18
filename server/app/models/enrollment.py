from datetime import datetime, timezone
from enum import Enum

from beanie import Document
from pydantic import Field


class EnrollmentStatus(str, Enum):
    ENROLLED = "enrolled"
    DROPOUT = "dropout"
    FAILED = "failed"
    PASSED = "passed"
    COMPLETED = "completed"


class Enrollment(Document):
    student_id: str
    slot_id: str
    roll_number: str  # unique within a slot, assigned sequentially on enroll
    status: EnrollmentStatus = EnrollmentStatus.ENROLLED
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "enrollments"