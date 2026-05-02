"""
User request / response schemas (Pydantic v2).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    uid: UUID
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    role: Optional[str] = Field(None, pattern="^(admin|member)$")
    is_active: Optional[bool] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
