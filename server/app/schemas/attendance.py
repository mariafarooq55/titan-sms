from datetime import date

from pydantic import BaseModel

from app.models.attendance import AttendanceStatus


class MarkAttendanceRequest(BaseModel):
    slot_id: str
    roll_number: str
    date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT


class MarkAttendanceResponse(BaseModel):
    student_name: str
    roll_number: str
    status: AttendanceStatus
    payment_warning: bool  # True if student's payment_status isn't "paid"
    was_updated: bool = False  # True if this changed an existing mark rather than creating new


class MultiMarkRequest(BaseModel):
    slot_id: str
    date: date
    roll_numbers: list[str]
    status: AttendanceStatus = AttendanceStatus.PRESENT


class MultiMarkResponse(BaseModel):
    marked: list[str]
    updated: list[str]
    already_marked: list[str]
    not_found: list[str]


class AttendanceRecordOut(BaseModel):
    date: date
    status: AttendanceStatus
    student_name: str
    roll_number: str


class ViewAttendanceResponse(BaseModel):
    student_name: str
    roll_number: str
    present_count: int
    leave_count: int
    absent_count: int
    total: int
    percentage: float
    records: list[AttendanceRecordOut]