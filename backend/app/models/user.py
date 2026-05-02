"""
User document — MongoDB collection: users
"""

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from beanie import Document
from pydantic import EmailStr, Field
from pymongo import IndexModel


class UserRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"


class User(Document):
    uid: UUID = Field(default_factory=uuid4, description="Public user ID")
    email: EmailStr
    hashed_password: str
    full_name: str
    role: UserRole = UserRole.MEMBER
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            IndexModel("email", unique=True),
            IndexModel("uid", unique=True),
        ]
