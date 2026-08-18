from datetime import date, datetime

from pydantic import BaseModel


class QuizQuestionCreate(BaseModel):
    text: str
    options: list[str]
    correct_index: int


class QuizCreate(BaseModel):
    slot_id: str
    title: str
    questions: list[QuizQuestionCreate]
    expiry_date: date | None = None


class QuizQuestionFull(BaseModel):
    text: str
    options: list[str]
    correct_index: int


class QuizOut(BaseModel):
    id: str
    slot_id: str
    title: str
    questions: list[QuizQuestionFull]
    expiry_date: date | None = None
    already_attempted: bool | None = None


class QuizQuestionPublic(BaseModel):
    text: str
    options: list[str]


class QuizPublicOut(BaseModel):
    id: str
    slot_id: str
    title: str
    questions: list[QuizQuestionPublic]
    expiry_date: date | None = None
    already_attempted: bool


class QuizAttemptCreate(BaseModel):
    quiz_id: str
    answers: list[int]


class QuizAttemptOut(BaseModel):
    id: str
    quiz_id: str
    student_id: str
    student_name: str
    score: int
    total: int
    submitted_at: datetime