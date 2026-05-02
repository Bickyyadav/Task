"""
Audit logging service — creates AuditLog entries in the background.
"""

from uuid import UUID

from app.models.audit_log import AuditLog

async def log_action(
    user_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID,
    metadata: dict | None = None,
) -> None:
    """
    Persist an audit log entry.
    Designed to be called via FastAPI BackgroundTasks so it never
    blocks the request/response cycle.
    """
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata=metadata or {},
    )
    await entry.insert()

