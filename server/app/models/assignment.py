from datetime import date as date_type, datetime, timezone

from beanie import Document
from pydantic import Field


class Assignment(Document):
    slot_id: str
    title: str
    instructions: str
    links: list[str] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)  # image URLs
    topics: list[str] = Field(default_factory=list)
    is_hackathon: bool = False  # approved students get a certificate
    due_date: date_type
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "assignments"