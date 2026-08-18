from datetime import date as date_type, datetime, timezone
from enum import Enum

from beanie import Document
from pydantic import Field


class VoucherType(str, Enum):
    REGISTRATION = "registration"
    MONTHLY = "monthly"


class VoucherStatus(str, Enum):
    PAID = "paid"
    PENDING = "pending"
    NOT_GENERATED = "not_generated"


class Voucher(Document):
    enrollment_id: str
    invoice_number: str
    payment_id: str | None = None  # filled in once paid (e.g. JazzCash transaction ID)
    type: VoucherType
    month: str | None = None  # e.g. "2026-08", only for monthly vouchers
    due_date: date_type
    amount: float
    status: VoucherStatus = VoucherStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "vouchers"