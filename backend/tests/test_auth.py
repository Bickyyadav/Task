"""
Auth route tests — register, login, refresh, logout, me.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post(
        "/api/auth/register",
        json={
            "email": "new@example.com",
            "password": "securepass123",
            "full_name": "New User",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "dup@example.com",
        "password": "securepass123",
        "full_name": "Dup User",
    }
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    await client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "securepass123",
            "full_name": "Login User",
        },
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "securepass123"},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={
            "email": "wrong@example.com",
            "password": "securepass123",
            "full_name": "Wrong User",
        },
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "badpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_profile(client: AsyncClient, admin_user, admin_token):
    resp = await client.get("/api/auth/me", headers=auth_header(admin_token))
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_me_unauthorized(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 403  # No Bearer token


@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient):
    # Register to get tokens
    reg = await client.post(
        "/api/auth/register",
        json={
            "email": "refresh@example.com",
            "password": "securepass123",
            "full_name": "Refresh User",
        },
    )
    refresh = reg.json()["data"]["refresh_token"]

    resp = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()["data"]


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin_user, admin_token):
    resp = await client.post("/api/auth/logout", headers=auth_header(admin_token))
    assert resp.status_code == 200
    assert resp.json()["success"] is True
