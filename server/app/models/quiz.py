from datetime import date as date_type, datetime, timezone

from beanie import Document
from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    text: str
    options: list[str]
    correct_index: int  # index into options — never sent to students


class Quiz(Document):
    slot_id: str
    title: str
    questions: list[QuizQuestion] = Field(default_factory=list)
    expiry_date: date_type | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "quizzes"


class QuizAttempt(Document):
    quiz_id: str
    student_id: str
    answers: list[int] = Field(default_factory=list)
    score: int = 0
    total: int = 0
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "quiz_attempts"