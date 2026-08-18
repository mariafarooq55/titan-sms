from datetime import datetime, timezone
from enum import Enum

import pymongo
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class Role(str, Enum):
    SUPER_ADMIN = "super_admin"
    SUB_ADMIN = "sub_admin"
    TRAINER = "trainer"
    STUDENT = "student"


# Every permission-gated area of the system. Add new modules here as you build features.
class Module(str, Enum):
    DASHBOARD = "dashboard"
    STUDENTS = "students"
    ATTENDANCE_VIEW = "attendance_view"
    ATTENDANCE_MARK = "attendance_mark"
    ATTENDANCE_MULTI = "attendance_multi"
    SLOTS = "slots"
    TRAINERS = "trainers"
    TRAINER_ATTENDANCE = "trainer_attendance"
    UPDATION = "updation"


class Permission(BaseModel):
    module: Module
    can_read: bool = False
    can_write: bool = False
    can_update: bool = False
    can_export: bool = False


class User(Document):
    # Admins/trainers log in with email, students log in with CNIC.
    # Both are stored here and both are unique login identifiers.
    login_id: Indexed(str, unique=True)  # email OR cnic
    password_hash: str
    role: Role
    full_name: str
    campus_id: str | None = None  # null for Super Admin (all campuses)
    permissions: list[Permission] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            [("login_id", pymongo.ASCENDING)],
        ]

    def has_permission(self, module: Module, action: str) -> bool:
        """action is one of: read, write, update, export"""
        if self.role == Role.SUPER_ADMIN:
            return True
        for perm in self.permissions:
            if perm.module == module:
                return getattr(perm, f"can_{action}", False)
        return False
