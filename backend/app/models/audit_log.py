"""
AuditLog document — MongoDB collection: audit_logs
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class AuditLog(Document):
    uid: UUID = Field(default_factory=uuid4)
    user_id: UUID
    action: str  # e.g. "task.created", "project.member_added"
    entity_type: str  # e.g. "task", "project", "user"
    entity_id: UUID
    metadata: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"
        indexes = [
            IndexModel([("entity_id", 1), ("entity_type", 1)]),
        ]
