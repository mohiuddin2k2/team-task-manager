# Team Task Manager

Full-stack assignment project built with Spring Boot, Java, React, and PostgreSQL. The repository is split into separate `backend` and `frontend` folders so you can open the backend in STS and the frontend in VS Code.

## Features

- Signup and signin with JWT authentication
- Role-based access using `PROJECT_MANAGER`, `TEAM_LEAD`, and `EMPLOYEE`
- Project creation and team member management
- Task planning, assignment, status updates, and overdue tracking
- Jira-inspired workspace with a guided tour
- Light and dark theme toggle
- Protected back navigation with a custom logout confirmation popup
- PostgreSQL-ready backend configuration

## Folder Structure

```text
.
|- backend
|- frontend
|- db
```

## Tech Stack

- Backend: Spring Boot 3, Java 21, Spring Security, Spring Data JPA
- Frontend: React 18, Vite, Axios, React Router
- Database: PostgreSQL
- Deployment target: Railway

## Backend Setup in STS

1. Open `backend` as a Maven project in Spring Tool Suite.
2. Create a PostgreSQL database in pgAdmin named `team_task_manager`.
3. Update credentials through environment variables or edit [application.properties](/C:/Users/mohi/Ethara.ai/backend/src/main/resources/application.properties).
4. Run the app as a Spring Boot application.

Recommended environment variables:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/team_task_manager
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
APP_JWT_SECRET=VGhpc0lzQVNlY3VyZUxvbmdCYXNlNjRLZXlGb3JKV1REZW1vMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=
APP_CORS_ALLOWED_ORIGIN=http://localhost:5173
```

## Frontend Setup in VS Code

1. Open `frontend` in VS Code.
2. Create `.env` from [frontend/.env.example](/C:/Users/mohi/Ethara.ai/frontend/.env.example).
3. Install packages with `npm install`.
4. Start the frontend with `npm start` or `npm run dev`.

Default frontend API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Important API Endpoints

- `POST /auth/signup`
- `POST /auth/signin`
- `GET /auth/profile`
- `GET /projects`
- `POST /projects`
- `POST /projects/{projectId}/team-members`
- `GET /projects/team-directory?term=...`
- `GET /projects/{projectId}/tasks`
- `POST /projects/{projectId}/tasks`
- `PUT /tasks/{taskId}`
- `GET /dashboard/overview`

## Suggested Demo Flow

1. Register a project manager.
2. Register a team lead and an employee.
3. Login as the project manager and create a project.
4. Add the team lead and employee to the project by email.
5. Create tasks and assign them from the planning panel.
6. Login as the employee and update assigned task status.
7. Show dashboard counts, theme toggle, guided tour, and back-button logout popup.

## Database Files

- [db/schema.sql](/C:/Users/mohi/Ethara.ai/db/schema.sql)
- [db/sample_data.sql](/C:/Users/mohi/Ethara.ai/db/sample_data.sql)
- [db/README.md](/C:/Users/mohi/Ethara.ai/db/README.md)

## Railway Deployment

You can deploy `backend` and `frontend` as two separate Railway services.

### Backend service

- Root directory: `backend`
- Build method: Dockerfile
- Required variables:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `APP_JWT_SECRET`
  - `APP_CORS_ALLOWED_ORIGIN`

Use Railway PostgreSQL or connect an external PostgreSQL database.

### Frontend service

- Root directory: `frontend`
- Build method: Dockerfile
- Variable:
  - `VITE_API_BASE_URL=https://your-backend-domain`

After backend deploys, update `APP_CORS_ALLOWED_ORIGIN` to your Railway frontend URL.

## Submission Checklist

- Live application URL
- GitHub repository URL
- README
- 2 to 5 minute demo video
