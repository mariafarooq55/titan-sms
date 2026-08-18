from datetime import date, datetime, timezone

from beanie import Document
from pydantic import Field


# Simple flat fields for now — city/campus/course/trainer are free text until
# those modules exist. Swap to real references + cascading dropdowns then.
class Slot(Document):
    schedule: str  # e.g. "Mon/Wed/Fri 5:00 PM - 7:00 PM"
    city: str
    campus: str
    course: str
    trainer: str | None = None
    class_type: str | None = None  # e.g. "Physical", "Online"
    gender: str | None = None  # e.g. "Male", "Female", "Mixed"
    start_date: date | None = None
    end_date: date | None = None
    trainer_hourly_rate: float | None = None
    whatsapp_link: str | None = None
    capacity: int
    registration_open: bool = True

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "slots"