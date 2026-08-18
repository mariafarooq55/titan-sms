from datetime import date, datetime

from pydantic import BaseModel

from app.models.submission import SubmissionStatus


class AssignmentCreate(BaseModel):
    slot_id: str
    title: str
    instructions: str
    links: list[str] = []
    images: list[str] = []
    topics: list[str] = []
    is_hackathon: bool = False
    due_date: date


class AssignmentUpdate(BaseModel):
    title: str
    instructions: str
    links: list[str] = []
    images: list[str] = []
    topics: list[str] = []
    is_hackathon: bool = False
    due_date: date


class AssignmentOut(BaseModel):
    id: str
    slot_id: str
    title: str
    instructions: str
    links: list[str]
    images: list[str]
    topics: list[str] = []
    is_hackathon: bool = False
    due_date: date
    my_submission_status: str | None = None


class SubmissionCreate(BaseModel):
    assignment_id: str
    files: list[str] = []
    links: list[str] = []


class SubmissionGrade(BaseModel):
    status: SubmissionStatus
    feedback: str | None = None


class SubmissionOut(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    student_name: str
    files: list[str]
    links: list[str]
    submitted_at: datetime
    status: SubmissionStatus
    feedback: str | None = None