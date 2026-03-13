# Microservices Architecture — API Gateway & Dynamic Routing

A foundational microservices setup using Node.js + Express with an API Gateway and a Business Logic Service. The highlight is **Dynamic Route Registration** — services self-register their routes on startup, no hardcoded routing tables needed.

## Architecture

| Service | Port | Role |
| :--- | :--- | :--- |
| **Access Control Service (Gateway)** | 4000 | Single entry point, JWT auth, dynamic proxying |
| **Business Logic Service** | 5000 | CRUD for tasks, JWT issuance, SQLite DB |

## Quick Start

```bash
# Terminal 1 — Gateway
cd access-control-service && npm install && npm start

# Terminal 2 — Business Logic Service
cd business-logic-service && npm install && npm start
```
*After ~1.5s, the Business Logic Service auto-registers its routes with the gateway.*

---

## API Reference
*All requests go through the gateway at `http://localhost:4000`.*

### Public Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/routes` | View all dynamically registered routes |
| **POST** | `/login` | Get a JWT token |

**Login body (JSON):**
```json
{ 
  "username": "john", 
  "password": "password123" 
}
```
*(Default users: `john` and `admin`, both with password `password123`)*

### Protected Endpoints
Add `Authorization: Bearer <token>` to all requests below.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/tasks` | Create a task |
| **GET** | `/tasks` | Get all tasks |
| **GET** | `/tasks/:id` | Get a specific task |
| **PUT** | `/tasks/:id` | Update a task |
| **DELETE** | `/tasks/:id` | Delete a task |

---

## Tech Stack
Node.js · Express · JWT · bcryptjs · SQLite (`better-sqlite3`) · Axios · CORS · Morgan