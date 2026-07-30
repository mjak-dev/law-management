# Aegis Practice Management ⚖️

A premium, modern Law Practice Management System designed for law firms and solo practitioners to organize clients, legal matters, project tasks, and invoices. 

This repository contains a lightweight, zero-dependency **Go API Backend** utilizing a pure-Go SQLite driver, combined with a highly responsive, custom-styled **React + Vite Frontend** featuring both dark and light modes.

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Go (1.22+)**: Using standard library `net/http` for API routing.
- **SQLite3**: Pure-Go zero-dependency driver via `modernc.org/sqlite` (no CGO compiler required).
- **CORS**: Fully configured middleware for API interactions during development.

### Frontend
- **React (18.3+)**: Component architecture for managing complex client-side state.
- **Vite**: Rapid hot module replacement (HMR) bundler.
- **CSS**: Custom-styled Zinc/Indigo design system variables, built-in dark/light mode toggle, glassmorphic modals, and micro-animations.
- **Lucide Icons**: Crisp SVG legal and navigation icons.

---

## 🚀 How to Run Locally

### 1. Run the Backend API
Start by running the Go backend server. It automatically generates and seeds a SQLite file (`law_management.db`) in the root directory.

```bash
# From the project root
go mod tidy
go run backend/main.go backend/database.go
```
*The backend API will start listening on **`http://localhost:8080`**.*

### 2. Run the React Frontend
Open a new terminal window to start the Vite developer client.

```bash
# Navigate to the frontend directory
cd frontend

# Install packages
npm install

# Start Vite
npm run dev
```
*The React client will launch on **`http://localhost:3000`**.*

### 3. Verify Endpoints
We have provided an automated test script to check database connectivity and API health.

```bash
# From the project root
python3 scripts/test_api.py
```

---

## 🌐 Production Deployment Guide

Deploying a Go + React stack is highly efficient due to Go's ability to compile into a single static binary, and React's build assets compiles to lightweight static HTML/CSS/JS.

### Option A: Combined Docker Deployment (Recommended)
You can containerize both parts or host them separately. For a single VM deployment, you can build a Dockerfile that serves the React frontend statically from the Go backend.

Here is a recommended production setup:

#### 1. Build the Frontend Assets
Before deployment, compile the React source files into optimized HTML/CSS/JS bundles:
```bash
cd frontend
npm run build
```
This outputs a production-ready `./dist` folder.

#### 2. Configure Go to Serve Static Files
Add a handler in `main.go` to serve the static frontend bundle:
```go
// In main.go
fs := http.FileServer(http.Dir("./frontend/dist"))
mux.Handle("/", fs)
```

#### 3. Containerize with a Dockerfile
```dockerfile
# Build Go Binary
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main backend/main.go backend/database.go

# Production Environment
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /app/main .
COPY --from=backend-builder /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./main"]
```

### Option B: Decoupled Cloud Deployment (Most Scalable)
For professional workflows, split the frontend and backend deployments.

#### 1. Frontend (Static Hosting)
Deploy the React `./dist` bundle to a specialized static host:
- **Platforms**: Vercel, Netlify, or Cloudflare Pages.
- **CDN**: Cloud Storage Buckets (GCP Cloud Storage / AWS S3) served through a Content Delivery Network (CDN) for maximum global speeds.
- *Remember to update the `BASE_URL` in `frontend/src/utils/api.js` to point to your live backend domain.*

#### 2. Backend (Serverless/Containers)
Deploy the Go Docker container:
- **Platforms**: Google Cloud Run, AWS App Runner, or Render.
- **Server State**: Since SQLite resides in the container filesystem, it will reset on cold-starts. For production:
  - Mount a **Persistent Volume Claim (PVC)** to the server to store `law_management.db` safely, or:
  - Migrate the SQL queries to a hosted database (like PostgreSQL or Cloud Spanner) by changing the DB driver connection string in `database.go`.
