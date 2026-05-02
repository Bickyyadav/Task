"""
Task document — MongoDB collection: tasks
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from beanie import Document
from pydantic import Field, model_validator
from pymongo import IndexModel


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(Document):
    uid: UUID = Field(default_factory=uuid4, description="Public task ID")
    title: str
    description: str = ""
    project_id: UUID  # ref to Project.uid
    assignee_id: Optional[UUID] = None  # ref to User.uid
    created_by: UUID  # ref to User.uid
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    is_overdue: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="after")
    def compute_overdue(self) -> "Task":
        """Recompute is_overdue based on due_date and current status."""
        if (
            self.due_date
            and self.status != TaskStatus.DONE
            and self.due_date < datetime.now(timezone.utc)
        ):
            self.is_overdue = True
        else:
            self.is_overdue = False
        return self

    class Settings:
        name = "tasks"
        indexes = [
            IndexModel("uid", unique=True),
            IndexModel([("project_id", 1), ("status", 1)]),
            IndexModel([("assignee_id", 1), ("is_overdue", 1)]),
        ]
