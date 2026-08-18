from datetime import date as date_type, datetime, timezone
from enum import Enum

from beanie import Document
from pydantic import Field


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    LEAVE = "leave"
    ABSENT = "absent"


# One record per (enrollment, date) — enforced in the router, not the DB,
# since Beanie doesn't support compound unique indexes as cleanly across
# non-ObjectId fields without extra setup.
class Attendance(Document):
    enrollment_id: str
    slot_id: str  # denormalized so we can query "everyone in this slot on this date" fast
    date: date_type
    status: AttendanceStatus
    marked_by: str  # user id of the admin/trainer who marked it
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "attendance"