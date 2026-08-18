from pydantic import BaseModel, Field

from app.models.user import Permission, Role


class LoginRequest(BaseModel):
    login_id: str = Field(..., description="Email (staff/trainer) or CNIC (student)")
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    full_name: str


class UserOut(BaseModel):
    id: str
    login_id: str
    role: Role
    full_name: str
    campus_id: str | None
    permissions: list[Permission]

    model_config = {"from_attributes": True}


class CreateUserRequest(BaseModel):
    login_id: str
    password: str
    role: Role
    full_name: str
    campus_id: str | None = None
    permissions: list[Permission] = []


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str