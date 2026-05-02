"""
FastAPI application entry point.
Handles lifespan events (DB init), middleware, and router registration.
"""

from contextlib import asynccontextmanager

from beanie import init_beanie
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.security import hash_password
from app.models import AuditLog, Project, Task, User
from app.models.user import UserRole

# Import routers
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.projects import router as projects_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.dashboard import router as dashboard_router


# ── Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # ── Startup ──────────────────────────────────────────────────
    # MongoDB
    motor_client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=motor_client[settings.MONGODB_DB_NAME],
        document_models=[User, Project, Task, AuditLog],
    )


    # Seed superuser if DB is empty
    user_count = await User.find_all().count()
    if user_count == 0:
        superuser = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=hash_password(settings.FIRST_SUPERUSER_PASSWORD),
            full_name=settings.FIRST_SUPERUSER_FULL_NAME,
            role=UserRole.ADMIN,
        )
        await superuser.insert()
        print(f"[SEED] Created superuser: {settings.FIRST_SUPERUSER_EMAIL}")

    print(f"[STARTUP] {settings.APP_NAME} v{settings.APP_VERSION} is ready")

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    motor_client.close()
    print("[SHUTDOWN] Cleaned up connections")


# ── App Factory ──────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print(f"[DEBUG] CORS Origins: {settings.CORS_ORIGINS}")


# ── Global Exception Handlers ───────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"success": False, "data": None, "message": "Resource not found"},
    )


@app.exception_handler(422)
async def validation_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": exc.errors() if hasattr(exc, "errors") else str(exc),
            "message": "Validation error",
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": "Internal server error",
        },
    )


# ── Register Routers ────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(dashboard_router)


# ── Health Check ─────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"success": True, "data": None, "message": "OK"}
