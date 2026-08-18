from pydantic import BaseModel, EmailStr


class TrainerCreate(BaseModel):
    employee_id: str
    full_name: str
    full_name_urdu: str | None = None
    bio: str | None = None
    phone: str | None = None
    email: EmailStr
    password: str  # used to create the trainer's login account
    hourly_rate: float | None = None
    social_links: list[str] = []
    city: str | None = None
    campus: str | None = None
    courses: list[str] = []


class TrainerUpdate(BaseModel):
    full_name: str | None = None
    full_name_urdu: str | None = None
    bio: str | None = None
    phone: str | None = None
    hourly_rate: float | None = None
    social_links: list[str] | None = None
    city: str | None = None
    campus: str | None = None
    courses: list[str] | None = None


class TrainerOut(BaseModel):
    id: str
    employee_id: str
    full_name: str
    full_name_urdu: str | None = None
    bio: str | None = None
    phone: str | None = None
    email: str
    hourly_rate: float | None = None
    photo_url: str | None = None
    social_links: list[str] = []
    city: str | None = None
    campus: str | None = None
    courses: list[str] = []

    model_config = {"from_attributes": True}


class TrainerSelfUpdate(BaseModel):
    """Restricted subset a trainer can edit on their own profile —
    excludes employee_id, hourly_rate, email, courses, campus/city
    which stay admin-controlled."""

    phone: str | None = None
    bio: str | None = None
    social_links: list[str] | None = None
    photo_url: str | None = None