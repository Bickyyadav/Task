ProjectHub: Application Flow & Architecture Guide
=================================================

This document outlines the complete workflow of the ProjectHub application, covering the flow from user login, project creation, developer assignment, and project updates across both the Frontend (Next.js) and Backend (FastAPI).

---

1. Authentication & Login
-------------------------
**Frontend (Next.js):**
- Users access the application via the `/login` or `/register` pages.
- The UI is built using React components with Shadcn UI, featuring a modern, gradient-rich aesthetic.
- The `LoginForm` component captures credentials and uses the `useAuthStore` (Zustand) to manage the session state.
- Upon successful login, the frontend stores the JWT token and redirects the user to the dashboard `/projects`.

**Backend (FastAPI):**
- **Endpoints:** `POST /api/auth/register` and `POST /api/auth/login`.
- **Logic:** The backend validates credentials against MongoDB (using Beanie ODM). It issues a JWT (JSON Web Token) containing the user's ID and role (Admin or Developer).
- Passwords are securely hashed. All login/registration events are logged via the audit service.

---

2. Project Creation (Admin Role)
--------------------------------
**Frontend (Next.js):**
- Admin users navigate to the `/projects` page.
- A "New Project" button is visible to Admins, which triggers a modal Dialog containing the `ProjectForm`.
- Admins enter the project name and description, and submit the form. The UI optimistically updates or re-fetches the project list to display the new project as a `ProjectCard`.

**Backend (FastAPI):**
- **Endpoint:** `POST /api/projects`
- **Logic:** Validates the `ProjectCreate` schema and checks if the requesting user has the `Admin` role (`require_admin` dependency).
- Creates a new Project document in MongoDB with the Admin as the `owner_id`.
- Triggers a background task to log the `project.created` event in the audit trail.

---

3. Adding Developers to a Project (Admin Role)
----------------------------------------------
**Frontend (Next.js):**
- From the project view, Admins can access the member management interface.
- Admins can search for registered developers and add them to the project.
- The UI sends a request to add the user and dynamically updates the project's member list.

**Backend (FastAPI):**
- **Endpoint:** `POST /api/projects/{project_id}/members`
- **Logic:** Validates Admin privileges. Checks if the `user_id` exists, then appends it to the project's `member_ids` array in the database.
- An audit log event `project.member_added` is generated.

---

4. Developer Interactions & Project Updates
-------------------------------------------
**Frontend (Next.js):**
- Developers log in and are redirected to `/projects`.
- The `useProjects` hook fetches only the projects where the developer is listed in the `member_ids` or is the owner.
- Developers click on a project to view its details (e.g., Kanban board, Tasks).
- Developers can update the "Project Stage" (e.g., from 'Planning' to 'In Progress') or add tasks to the project.
- The UI sends the update request and reflects changes immediately.

**Backend (FastAPI):**
- **Endpoints:** `PUT /api/projects/{project_id}` and `POST /api/tasks` (or task endpoints).
- **Logic for Project Updates:**
  - The API checks if the user is a valid member of the project (`require_project_member`).
  - **RBAC Enforcement:** While Admins can update any project field, Developers (Members) are strictly restricted to updating ONLY the `stage` field (e.g., moving it along the workflow). Attempting to modify other fields like `name` or `owner` throws a `403 Forbidden` error.
  - Changes are saved to MongoDB, and the `stage_updated_by` field is updated with the developer's ID.
  - Background audit tasks log the `project.updated` event, detailing what was changed.

---

5. Task Management within Projects
----------------------------------
**Frontend (Next.js):**
- Users access tasks inside the project details page (visualized as a Kanban board or list).
- Developers can create tasks, assign them to members, update task status (e.g., Todo, In Progress, Done), and add comments or descriptions.
- Forms use Shadcn UI components for a seamless experience.

**Backend (FastAPI):**
- **Endpoints:** `POST /api/tasks`, `PUT /api/tasks/{task_id}`, `DELETE /api/tasks/{task_id}`.
- **Logic:** Validates task data and project membership.
- Tasks are stored in MongoDB, referencing both the Project and assigned User.
- Action logs are captured for all task modifications via the background audit service.

6. Dashboard Analytics & Data Visualization
-------------------------------------------
**Frontend (Next.js):**
- The main dashboard provides an overview of project health and activity.
- Uses Recharts to render interactive charts (e.g., project stages distribution, task completion rates).
- Statistics like total projects, active tasks, and team members are aggregated and displayed using Shadcn UI Cards.

**Backend (FastAPI):**
- **Endpoints:** `/api/dashboard/stats`
- **Logic:** Aggregates data from MongoDB using Beanie's aggregation capabilities. Returns compiled metrics specific to the user's role (Admins see system-wide stats; Developers see stats relevant to their assigned projects).

7. Audit Logging (Admin Visibility)
-----------------------------------
**Frontend (Next.js):**
- Admins have access to an `/audit` section.
- Displays a chronological feed of all system actions (user registrations, project creations, stage updates, member additions).

**Backend (FastAPI):**
- **Endpoints:** `GET /api/audit`
- **Logic:** Retrieves logs stored in the MongoDB `AuditLog` collection. Requires Admin authorization.

---

Technology Stack Details
------------------------
**Frontend:**
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Shadcn UI (Radix UI primitives)
- **State Management:** Zustand (for Auth) + React Hook Form (with Zod for validation)
- **Icons:** Lucide React
- **Charts:** Recharts

**Backend:**
- **Framework:** FastAPI (Python 3.10+)
- **Database:** MongoDB (via Beanie ODM & Motor async driver)
- **Authentication:** JWT (PyJWT) with Passlib (bcrypt) for password hashing
- **Task Queue:** FastAPI BackgroundTasks (for non-blocking audit logging)

---

How to Run Locally
------------------
1. **Backend:**
   - Navigate to the `backend` directory.
   - Install dependencies: `pip install -r requirements.txt`
   - Set up `.env` file with `MONGODB_URI` and `SECRET_KEY`.
   - Run the server: `uvicorn app.main:app --reload` (Runs on http://localhost:8000)

2. **Frontend:**
   - Navigate to the `frontend` directory.
   - Install dependencies: `npm install`
   - Set up `.env.local` if needed.
   - Run the development server: `npm run dev` (Runs on http://localhost:3000)

---

Summary of Architecture Highlights:
- **Separation of Concerns:** Strict division between Next.js UI rendering and FastAPI business logic.
- **Security:** Robust JWT-based Authentication and Role-Based Access Control (RBAC) ensuring only Admins can create projects and add members, while developers can only modify specific operational fields like the project stage.
- **Auditing:** Every critical action (login, project creation, member addition, updates) is logged asynchronously via FastAPI BackgroundTasks to ensure traceability without impacting performance.
