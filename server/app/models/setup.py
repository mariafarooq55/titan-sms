from datetime import datetime, timezone

from beanie import Document
from pydantic import Field


class Country(Document):
    name: str

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "countries"


class City(Document):
    name: str
    country_id: str

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "cities"


class Campus(Document):
    name: str
    city_id: str

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "campuses"


class Course(Document):
    name: str

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "courses"