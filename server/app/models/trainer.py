from datetime import datetime, timezone

import pymongo
from beanie import Document, Indexed
from pydantic import Field


class Trainer(Document):
    user_id: str  # links to the User document used for trainer login
    employee_id: Indexed(str, unique=True)
    full_name: str
    full_name_urdu: str | None = None
    bio: str | None = None
    phone: str | None = None
    email: str
    hourly_rate: float | None = None
    photo_url: str | None = None
    social_links: list[str] = Field(default_factory=list)

    city: str | None = None
    campus: str | None = None
    courses: list[str] = Field(default_factory=list)  # free text until Course model exists

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "trainers"
        indexes = [[("employee_id", pymongo.ASCENDING)]]