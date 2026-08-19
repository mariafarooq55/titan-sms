from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.models.user import User
from app.models.student import Student
from app.models.slot import Slot
from app.models.trainer import Trainer
from app.models.enrollment import Enrollment
from app.models.attendance import Attendance
from app.models.voucher import Voucher
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.quiz import Quiz, QuizAttempt
from app.models.setup import Country, City, Campus, Course


DOCUMENT_MODELS = [
    User,
    Student,
    Slot,
    Trainer,
    Enrollment,
    Attendance,
    Voucher,
    Assignment,
    Submission,
    Quiz,
    QuizAttempt,

    # Setup
    Country,
    City,
    Campus,
    Course,
]


async def init_db() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri)
    database = client[settings.mongo_db_name]

    await init_beanie(
        database=database,
        document_models=DOCUMENT_MODELS,
    )