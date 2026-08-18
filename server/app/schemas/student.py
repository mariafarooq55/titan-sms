import re
from datetime import date

from pydantic import BaseModel, EmailStr, field_validator

from app.models.student import PaymentStatus, StudentStatus

CNIC_RE = re.compile(r"^\d{13}$")  # 13 digits, no dashes (dashes stripped before validation)
PHONE_RE = re.compile(r"^03\d{9}$")  # Pakistani mobile format: 03XXXXXXXXX


class StudentCreate(BaseModel):
    full_name: str
    father_name: str
    cnic: str
    phone: str
    email: EmailStr | None = None
    father_cnic: str | None = None
    father_phone: str | None = None
    dob: date | None = None
    gender: str | None = None
    address: str | None = None
    last_qualification: str | None = None
    computer_level: str | None = None
    has_laptop: bool = False
    course: str | None = None
    campus: str | None = None
    batch: str | None = None

    @field_validator("cnic", "father_cnic")
    @classmethod
    def validate_cnic(cls, v: str | None) -> str | None:
        if v is None:
            return v
        cleaned = v.replace("-", "").strip()
        if not CNIC_RE.match(cleaned):
            raise ValueError("CNIC must be 13 digits (dashes optional)")
        return cleaned

    @field_validator("phone", "father_phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        cleaned = v.replace("-", "").replace(" ", "").strip()
        if not PHONE_RE.match(cleaned):
            raise ValueError("Phone must be an 11-digit number starting with 03 (e.g. 03001234567)")
        return cleaned


class StudentUpdate(BaseModel):
    full_name: str | None = None
    father_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    father_cnic: str | None = None
    father_phone: str | None = None
    dob: date | None = None
    gender: str | None = None
    address: str | None = None
    last_qualification: str | None = None
    computer_level: str | None = None
    has_laptop: bool | None = None
    course: str | None = None
    campus: str | None = None
    batch: str | None = None
    status: StudentStatus | None = None
    payment_status: PaymentStatus | None = None


class StudentOut(BaseModel):
    id: str
    full_name: str
    father_name: str
    cnic: str
    phone: str
    email: str | None = None
    father_cnic: str | None = None
    father_phone: str | None = None
    dob: date | None = None
    gender: str | None = None
    address: str | None = None
    last_qualification: str | None = None
    computer_level: str | None = None
    has_laptop: bool = False
    status: StudentStatus
    payment_status: PaymentStatus
    course: str | None = None
    campus: str | None = None
    batch: str | None = None

    model_config = {"from_attributes": True}


class StudentSelfUpdate(BaseModel):
    """Restricted subset a student can edit on their own profile —
    excludes status, payment_status, course, campus, batch which
    stay admin-controlled."""

    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    gender: str | None = None
    dob: date | None = None
    last_qualification: str | None = None
    computer_level: str | None = None
    has_laptop: bool | None = None