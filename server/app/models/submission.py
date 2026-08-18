from datetime import datetime, timezone
from enum import Enum

from beanie import Document
from pydantic import Field


class SubmissionStatus(str, Enum):
    PENDING = "pending"  # submitted, not yet reviewed
    LATE = "late"
    APPROVED = "approved"
    NOT_APPROVED = "not_approved"


class Submission(Document):
    assignment_id: str
    student_id: str
    files: list[str] = Field(default_factory=list)  # links to uploaded work
    links: list[str] = Field(default_factory=list)
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: SubmissionStatus = SubmissionStatus.PENDING
    feedback: str | None = None

    class Settings:
        name = "submissions"