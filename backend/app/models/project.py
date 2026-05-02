"""
Project document — MongoDB collection: projects
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class ProjectStage(str, Enum):
    PLANNING = "planning"
    DEVELOPMENT = "development"
    TESTING = "testing"
    DEPLOYMENT = "deployment"
    COMPLETED = "completed"


class Project(Document):
    uid: UUID = Field(default_factory=uuid4, description="Public project ID")
    name: str
    description: str = ""
    owner_id: UUID  # ref to User.uid
    member_ids: list[UUID] = Field(default_factory=list)
    status: ProjectStatus = ProjectStatus.ACTIVE
    stage: ProjectStage = ProjectStage.PLANNING
    stage_updated_by: Optional[UUID] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "projects"
        indexes = [
            IndexModel("uid", unique=True),
        ]
