from datetime import date, datetime, timezone
from enum import Enum

import pymongo
from beanie import Document, Indexed
from pydantic import Field


class StudentStatus(str, Enum):
    PENDING = "pending"
    ENROLLED = "enrolled"
    ACTIVE = "active"
    DROPOUT = "dropout"
    FAILED = "failed"
    PASSED = "passed"
    COMPLETED = "completed"


class PaymentStatus(str, Enum):
    PAID = "paid"
    PENDING = "pending"
    NOT_GENERATED = "not_generated"


# Simple flat form for now (Pass 1). Once Country/City/Campus/Course/Slot
# exist, course/campus/batch/slot become real references picked via
# cascading dropdowns instead of free-text fields — see README notes.
class Student(Document):
    full_name: str
    father_name: str
    cnic: Indexed(str, unique=True)
    phone: str
    father_cnic: str | None = None
    father_phone: str | None = None
    dob: date | None = None
    gender: str | None = None
    address: str | None = None
    last_qualification: str | None = None
    computer_level: str | None = None
    has_laptop: bool = False
    photo_url: str | None = None
    email: Indexed(str, unique=True) | None = None

    # Free-text placeholders until Course/Campus/Slot models exist
    course: str | None = None
    campus: str | None = None
    batch: str | None = None

    status: StudentStatus = StudentStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.NOT_GENERATED

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "students"
        indexes = [
            [("cnic", pymongo.ASCENDING)],
            [("full_name", pymongo.TEXT), ("phone", pymongo.TEXT)],
        ]