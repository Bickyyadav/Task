"""
Project request / response schemas (Pydantic v2).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.user import UserOut


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|archived)$")
    stage: Optional[str] = Field(None, pattern="^(planning|development|testing|deployment|completed)$")


class ProjectOut(BaseModel):
    uid: UUID
    name: str
    description: str
    owner_id: UUID
    member_ids: list[UUID]
    status: str
    stage: str
    stage_updated_by: Optional[UUID] = None
    created_at: datetime


class ProjectDetailOut(ProjectOut):
    """Extended response including resolved member details."""
    members: list[UserOut] = []


class ProjectListResponse(BaseModel):
    items: list[ProjectOut]
    total: int


class AddMemberRequest(BaseModel):
    user_id: UUID

