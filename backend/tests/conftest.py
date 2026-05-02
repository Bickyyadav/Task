"""
Shared test fixtures — async client, test database, and auth helpers.
"""

import asyncio
from uuid import uuid4

import pytest
import pytest_asyncio
from asgi_lifespan import LifespanManager
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models import AuditLog, Project, Task, User
from app.models.user import UserRole


# Use a separate test database
TEST_DB_NAME = f"{settings.MONGODB_DB_NAME}_test"


@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def motor_client():
    """Create a Motor client for tests."""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    yield client
    client.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db(motor_client):
    """Initialise Beanie with a test database and clean up after each test."""
    await init_beanie(
        database=motor_client[TEST_DB_NAME],
        document_models=[User, Project, Task, AuditLog],
    )
    yield
    # Drop all collections after each test
    db = motor_client[TEST_DB_NAME]
    for name in await db.list_collection_names():
        await db.drop_collection(name)


@pytest_asyncio.fixture
async def client():
    """Async HTTP client bound to the FastAPI app (no lifespan to avoid double init)."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_user() -> User:
    """Create and return an admin user."""
    user = User(
        email="admin@test.com",
        hashed_password=hash_password("admin12345"),
        full_name="Test Admin",
        role=UserRole.ADMIN,
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def member_user() -> User:
    """Create and return a member user."""
    user = User(
        email="member@test.com",
        hashed_password=hash_password("member12345"),
        full_name="Test Member",
        role=UserRole.MEMBER,
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
def admin_token(admin_user: User) -> str:
    """JWT access token for the admin user."""
    return create_access_token(admin_user.uid, admin_user.role.value)


@pytest_asyncio.fixture
def member_token(member_user: User) -> str:
    """JWT access token for the member user."""
    return create_access_token(member_user.uid, member_user.role.value)


def auth_header(token: str) -> dict:
    """Helper to build Authorization header."""
    return {"Authorization": f"Bearer {token}"}
