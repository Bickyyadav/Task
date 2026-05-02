"""
User management routes — admin only.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import require_admin
from app.models.user import User, UserRole
from app.schemas.user import UserListResponse, UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["Users"])


# ── List Users (paginated) ───────────────────────────────────────
@router.get("", response_model=dict)
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _admin: User = Depends(require_admin),
):
    skip = (page - 1) * limit
    total = await User.find_all().count()
    users = await User.find_all().skip(skip).limit(limit).to_list()

    items = [
        UserOut(
            uid=u.uid,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value,
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]

    return {
        "success": True,
        "data": UserListResponse(items=items, total=total).model_dump(),
        "message": "Users retrieved",
    }


# ── Get User Detail ──────────────────────────────────────────────
@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: UUID, _admin: User = Depends(require_admin)):
    user = await User.find_one(User.uid == user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {
        "success": True,
        "data": UserOut(
            uid=user.uid,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
        ).model_dump(),
        "message": "User detail",
    }


# ── Update User (role / status / name) ───────────────────────────
@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    _admin: User = Depends(require_admin),
):
    user = await User.find_one(User.uid == user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_data = body.model_dump(exclude_unset=True)

    if "role" in update_data:
        update_data["role"] = UserRole(update_data["role"])

    for field, value in update_data.items():
        setattr(user, field, value)

    await user.save()

    return {
        "success": True,
        "data": UserOut(
            uid=user.uid,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
        ).model_dump(),
        "message": "User updated",
    }
