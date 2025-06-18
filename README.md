# 🚀 Project Manager App

A simple web application to **manage projects and users**, built with:

* ⚙️ Backend: NestJS (TypeScript)
* 🌐 Frontend: HTML, CSS, TypeScript (Vanilla)
* 🐳 Docker: For containerized development and deployment
* 📬 Email integration: Send emails on project assignment and completion

---

## 📁 Project Structure

```
project-manager/
│
├── frontend/         # Static frontend with HTML/CSS/TS
│   ├── assets/
│   │   ├── main.ts
│   │   └── style.css
│   ├── pages/
│   │   ├── login.html
│   │   └── register.html
│   ├── index.html
│   ├── tsconfig.json
│   └── Dockerfile
│
├── backend/          # NestJS backend
│   ├── src/
│   ├── test/
│   ├── Dockerfile
│   └── ...
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 👥 Team Roles (Group 5)

| Name                | Role & Branch               | Task Description                                     |
| ------------------- | --------------------------- | ---------------------------------------------------- |
| **Nick Munene**     | `feature/nick-backend` | Docker (frontend + backend), Authorization & Authentication |
| **Claude Nyongesa** | `feature/claude-frontend`   | Static frontend development, HTML/CSS/TS setup       |
| **Alex Muhoro**     | `feature/alex-backend`      | NestJS backend, user/project controller setup        |

---

## 🐳 Docker Setup Guide (Frontend + Backend)

Ensure you have Docker installed:
👉 [Download Docker](https://www.docker.com/products/docker-desktop)

### ⚡ Backend (NestJS)

```bash
# Navigate to backend directory
cd backend

# Build backend image
docker build -t project-backend .

# Run backend container
docker run -p 3000:3000 project-backend
```

Then visit: [http://localhost:3000](http://localhost:3000)

### 🌐 Frontend (Static via Nginx)

```bash
# Navigate to frontend directory
cd frontend

# Build frontend image
docker build -t project-frontend .

# Run frontend container
docker run -p 8080:80 project-frontend
```

Visit: [http://localhost:8080](http://localhost:8080)

### 🧩 Run Both with Docker Compose
```bash
# Navigate to project directory
cd project-management-app

docker-compose up --build                                              
```


### 💡 Summary

* TypeScript is compiled to JS during build
* Frontend is served via Nginx from `dist/`
* Backend runs using Node/NestJS

---

## 🔧 Git Workflow Guide

### 📌 1. Clone the Repository

```bash
git clone <REPO_URL>
cd project-manager
```

### 📌 2. Checkout Your Branch

```bash
git checkout -b feature/<your-name>-<your-area> origin/feature/<your-name>-<your-area>
```

Examples:

```bash
git checkout -b feature/claude-frontend origin/feature/claude-frontend
git checkout -b feature/alex-backend origin/feature/alex-backend
```

### 📌 3. Daily Workflow

```bash
# Pull latest changes
git pull origin dev

# Stage changes
git add .

# Commit
git commit -m "Add login page UI"

# Push your branch
git push origin feature/<your-name>-<your-area>
```

### 📌 4. Create Pull Request

1. Go to GitHub repo
2. Open PR: Your branch ➔ `dev`
3. Request review

---

## 💡 Tips for Team Members

* **Ask Questions**: If you're stuck, ask.
* **Commit Often**: Prevent data loss.
* **Pull Regularly**: Avoid conflicts.
* **Use Clear Branch Names**: For clarity (e.g. `feature/john-auth`)

---

## 📩 Communication & Coordination

* Daily progress updates
* Work in branches
* Pull Requests review by team

---

> 🧠 “Teamwork begins by building trust.” – Patrick Lencioni
#
