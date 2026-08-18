from datetime import date

from pydantic import BaseModel, Field


class SlotCreate(BaseModel):
    schedule: str
    city: str
    campus: str
    course: str
    trainer: str | None = None
    class_type: str | None = None
    gender: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    trainer_hourly_rate: float | None = None
    whatsapp_link: str | None = None
    capacity: int = Field(gt=0, description="Total number of seats")


class SlotUpdate(BaseModel):
    schedule: str | None = None
    city: str | None = None
    campus: str | None = None
    course: str | None = None
    trainer: str | None = None
    class_type: str | None = None
    gender: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    trainer_hourly_rate: float | None = None
    whatsapp_link: str | None = None
    capacity: int | None = Field(default=None, gt=0)
    registration_open: bool | None = None


class SlotOut(BaseModel):
    id: str
    schedule: str
    city: str
    campus: str
    course: str
    trainer: str | None = None
    class_type: str | None = None
    gender: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    trainer_hourly_rate: float | None = None
    whatsapp_link: str | None = None
    capacity: int
    seats_used: int = 0
    registration_open: bool

    model_config = {"from_attributes": True}