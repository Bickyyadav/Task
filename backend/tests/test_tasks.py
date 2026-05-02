"""
Task route tests — CRUD, RBAC enforcement, filtering.
"""

import pytest
from httpx import AsyncClient

from app.models.project import Project
from app.models.user import User
from tests.conftest import auth_header


async def _create_project(admin: User) -> Project:
    """Helper to create a test project."""
    project = Project(
        name="Test Project",
        description="A test project",
        owner_id=admin.uid,
        member_ids=[],
    )
    await project.insert()
    return project


@pytest.mark.asyncio
async def test_create_task_admin(client: AsyncClient, admin_user, admin_token):
    project = await _create_project(admin_user)

    resp = await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={"title": "First Task", "description": "Do something", "priority": "high"},
        headers=auth_header(admin_token),
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["title"] == "First Task"
    assert data["priority"] == "high"
    assert data["status"] == "todo"


@pytest.mark.asyncio
async def test_create_task_member_forbidden(
    client: AsyncClient, admin_user, member_user, member_token
):
    project = await _create_project(admin_user)
    # Add member to project
    project.member_ids.append(member_user.uid)
    await project.save()

    resp = await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={"title": "Blocked Task"},
        headers=auth_header(member_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_member_can_update_status_of_assigned_task(
    client: AsyncClient, admin_user, member_user, admin_token, member_token
):
    project = await _create_project(admin_user)
    project.member_ids.append(member_user.uid)
    await project.save()

    # Admin creates task assigned to member
    create_resp = await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={
            "title": "Member Task",
            "assignee_id": str(member_user.uid),
        },
        headers=auth_header(admin_token),
    )
    task_id = create_resp.json()["data"]["uid"]

    # Member updates status
    resp = await client.put(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=auth_header(member_token),
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "in_progress"


@pytest.mark.asyncio
async def test_member_cannot_update_title(
    client: AsyncClient, admin_user, member_user, admin_token, member_token
):
    project = await _create_project(admin_user)
    project.member_ids.append(member_user.uid)
    await project.save()

    create_resp = await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={
            "title": "Restricted Task",
            "assignee_id": str(member_user.uid),
        },
        headers=auth_header(admin_token),
    )
    task_id = create_resp.json()["data"]["uid"]

    # Member tries to update title — should be blocked
    resp = await client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Hacked Title"},
        headers=auth_header(member_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_tasks_with_filters(
    client: AsyncClient, admin_user, admin_token
):
    project = await _create_project(admin_user)

    # Create two tasks with different priorities
    await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={"title": "Low Task", "priority": "low"},
        headers=auth_header(admin_token),
    )
    await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={"title": "High Task", "priority": "high"},
        headers=auth_header(admin_token),
    )

    # Filter by priority=high
    resp = await client.get(
        f"/api/projects/{project.uid}/tasks?priority=high",
        headers=auth_header(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total"] == 1
    assert data["items"][0]["priority"] == "high"


@pytest.mark.asyncio
async def test_delete_task_admin(client: AsyncClient, admin_user, admin_token):
    project = await _create_project(admin_user)

    create_resp = await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={"title": "To Delete"},
        headers=auth_header(admin_token),
    )
    task_id = create_resp.json()["data"]["uid"]

    resp = await client.delete(
        f"/api/tasks/{task_id}",
        headers=auth_header(admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Verify deleted
    get_resp = await client.get(
        f"/api/tasks/{task_id}",
        headers=auth_header(admin_token),
    )
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_member_forbidden(
    client: AsyncClient, admin_user, member_user, admin_token, member_token
):
    project = await _create_project(admin_user)

    create_resp = await client.post(
        f"/api/projects/{project.uid}/tasks",
        json={"title": "Cannot Delete"},
        headers=auth_header(admin_token),
    )
    task_id = create_resp.json()["data"]["uid"]

    resp = await client.delete(
        f"/api/tasks/{task_id}",
        headers=auth_header(member_token),
    )
    assert resp.status_code == 403
