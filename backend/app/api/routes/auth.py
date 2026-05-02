"""
Auth routes — register, login, refresh, logout, me.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserOut
from app.services.audit import log_action

router = APIRouter(prefix="/api/auth", tags=["Auth"])



# ── Register ─────────────────────────────────────────────────────
@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, bg: BackgroundTasks):
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
    )
    await user.insert()

    access = create_access_token(user.uid, user.role.value)
    refresh = create_refresh_token(user.uid)

    bg.add_task(log_action, user.uid, "user.registered", "user", user.uid)

    return {
        "success": True,
        "data": TokenResponse(
            access_token=access, refresh_token=refresh
        ).model_dump(),
        "message": "User registered successfully",
    }


@router.post("/login", response_model=dict)
async def login(body: LoginRequest, request: Request, bg: BackgroundTasks):
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access = create_access_token(user.uid, user.role.value)
    refresh = create_refresh_token(user.uid)

    bg.add_task(log_action, user.uid, "user.login", "user", user.uid)

    return {
        "success": True,
        "data": TokenResponse(
            access_token=access, refresh_token=refresh
        ).model_dump(),
        "message": "Login successful",
    }


# ── Refresh ──────────────────────────────────────────────────────
@router.post("/refresh", response_model=dict)
async def refresh_token(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Stateless refresh token validation (signature + type already checked)
    user_id = payload["sub"]

    user = await User.find_one(User.uid == user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    new_access = create_access_token(user.uid, user.role.value)

    return {
        "success": True,
        "data": AccessTokenResponse(access_token=new_access).model_dump(),
        "message": "Token refreshed",
    }


# ── Logout ───────────────────────────────────────────────────────
@router.post("/logout", response_model=dict)
async def logout(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": None,
        "message": "Logged out successfully",
    }


# ── Me ───────────────────────────────────────────────────────────
@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": UserOut(
            uid=current_user.uid,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role.value,
            is_active=current_user.is_active,
            created_at=current_user.created_at,
        ).model_dump(),
        "message": "Current user profile",
    }
