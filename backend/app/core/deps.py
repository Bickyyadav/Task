"""
FastAPI dependency injection chain:
  get_current_user()  →  require_admin()
                      →  require_project_member()
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.models.project import Project
from app.models.user import User, UserRole

security_scheme = HTTPBearer()


# ── Get Current User ─────────────────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> User:
    """Extract and validate the JWT, then return the User document."""
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )

    user = await User.find_one(User.uid == UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


# ── Require Admin ────────────────────────────────────────────────
async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Raise 403 if the authenticated user is not an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ── Require Project Member ──────────────────────────────────────
async def require_project_member(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
) -> Project:
    """
    Verify the project exists and that the user has access.
    Admins always have access; members must be in member_ids.
    Returns the Project document.
    """
    project = await Project.find_one(Project.uid == project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if current_user.role == UserRole.ADMIN:
        return project

    if current_user.uid not in project.member_ids and current_user.uid != project.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project",
        )

    return project
