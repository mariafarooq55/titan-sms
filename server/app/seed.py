"""
Run this once to create one test login for each role, so you can test the
whole auth + permission flow before any real features exist.

Usage:
    cd server
    python -m app.seed
"""

import asyncio

from app.core.database import init_db
from app.core.security import hash_password
from app.models.user import User, Role, Permission, Module

SEED_USERS = [
    dict(
        login_id="superadmin@titan.com",
        password="Passw0rd!",
        role=Role.SUPER_ADMIN,
        full_name="Super Admin",
        campus_id=None,
        permissions=[],  # Super Admin bypasses permission checks entirely
    ),
    dict(
        login_id="reception@titan.com",
        password="Passw0rd!",
        role=Role.SUB_ADMIN,
        full_name="Sukkur Receptionist",
        campus_id="sukkur-campus",
        # Example of a limited admin: can only mark attendance, nothing else
        permissions=[
            Permission(module=Module.DASHBOARD, can_read=True),
            Permission(module=Module.ATTENDANCE_MARK, can_write=True),
            Permission(module=Module.ATTENDANCE_VIEW, can_read=True),
        ],
    ),
    dict(
        login_id="trainer@titan.com",
        password="Passw0rd!",
        role=Role.TRAINER,
        full_name="Ali Trainer",
        campus_id="sukkur-campus",
        permissions=[],
    ),
    dict(
        login_id="4230112223334",  # CNIC, no dashes, matches student login pattern
        password="Passw0rd!",
        role=Role.STUDENT,
        full_name="Ahmed Student",
        campus_id="sukkur-campus",
        permissions=[],
    ),
]


async def run():
    await init_db()

    for seed in SEED_USERS:
        existing = await User.find_one(User.login_id == seed["login_id"])
        if existing:
            print(f"Skipping (already exists): {seed['login_id']}")
            continue

        user = User(
            login_id=seed["login_id"],
            password_hash=hash_password(seed["password"]),
            role=seed["role"],
            full_name=seed["full_name"],
            campus_id=seed["campus_id"],
            permissions=seed["permissions"],
        )
        await user.insert()
        print(f"Created {seed['role'].value}: {seed['login_id']} / {seed['password']}")


if __name__ == "__main__":
    asyncio.run(run())