"""
Task request / response schemas (Pydantic v2).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = ""
    assignee_id: Optional[UUID] = None
    priority: str = Field("medium", pattern="^(low|medium|high|critical)$")
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    assignee_id: Optional[UUID] = None
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|review|done)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    due_date: Optional[datetime] = None



class TaskStatusUpdate(BaseModel):
    """Members can only change the status field."""
    status: str = Field(pattern="^(todo|in_progress|review|done)$")


class TaskOut(BaseModel):
    uid: UUID
    title: str
    description: str
    project_id: UUID
    assignee_id: Optional[UUID]
    created_by: UUID
    status: str
    priority: str
    due_date: Optional[datetime]
    is_overdue: bool
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    items: list[TaskOut]
    total: int
