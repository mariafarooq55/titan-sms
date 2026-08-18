from datetime import date

from pydantic import BaseModel

from app.models.voucher import VoucherStatus, VoucherType


class VoucherCreate(BaseModel):
    enrollment_id: str
    type: VoucherType
    month: str | None = None
    due_date: date
    amount: float


class VoucherUpdate(BaseModel):
    status: VoucherStatus
    payment_id: str | None = None


class VoucherOut(BaseModel):
    id: str
    enrollment_id: str
    invoice_number: str
    payment_id: str | None = None
    type: VoucherType
    month: str | None = None
    due_date: date
    amount: float
    status: VoucherStatus

    model_config = {"from_attributes": True}