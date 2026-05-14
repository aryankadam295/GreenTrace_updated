# Copilot instructions — GreenTrace repository

Purpose: quick reference for Copilot sessions to run, test, and reason about this repository.

---

Build, test, and lint commands

- Frontend (React + Vite) — folder: `frontend`
  - Install deps: `cd frontend && npm ci` (or `npm install`)
  - Dev server: `npm run dev` (Vite, default port 5173)
  - Build: `npm run build`
  - Lint: `npm run lint` (ESLint configured in devDependencies)
  - Tests: no test runner configured in frontend package.json

- Backend (Node/Express) — folder: `backend`
  - Install deps: `cd backend && npm ci`
  - Dev: `npm run dev` (nodemon server.js)
  - Start (production): `npm run start` (node server.js)
  - Tests: test script is a placeholder (no tests configured)

- ML service (Python + TensorFlow) — folder: `ml-service`
  - Run: `python ml-service/app.py` (the module starts a Waitress server on port 5001)
  - Required runtime: Python 3.10+ recommended; deps observed from imports: `tensorflow`, `flask`, `waitress`, `opencv-python` (cv2), `numpy`.
  - Model/data expectations (place in `ml-service/`): `crop_disease_model_best.h5` or `crop_disease_model.h5`, `class_indices.json`, `supplement_info.csv`.

---

High-level architecture (big picture)

- frontend/: React app built with Vite. UI uses Leaflet, Recharts, i18next. Runs independently (dev server, build output).
- backend/: Express REST API that connects to MongoDB via Mongoose. Routes are modularized under `backend/routes/*`. Serves uploads from `<repo-root>/uploads` and exposes API under `/api/*`. Uses `dotenv` for configuration.
- ml-service/: Independent Python service that loads a TensorFlow model and exposes prediction endpoints (`/api/predict-crop`, `/api/predict-video`) via Flask + Waitress. Intended to be started as a separate process and contacted by backend or frontend.

Data flow notes: frontend talks to backend (default backend port 4000); backend may call ML service at http://localhost:5001 when configured. Backend connects to MongoDB at the URL provided in environment variables.

---

Key conventions and repo-specific patterns

- Environment variables
  - backend uses `dotenv`; supply `.env` in `backend/` with DB URL, PORT, credentials, and `FRONTEND_URLS` (comma-separated list used to build CORS allowed origins).

- CORS and allowed frontend origins
  - Backend expects `FRONTEND_URLS` as a comma-separated string (e.g., `http://localhost:5173,http://localhost:5174`). The server also allows dev origins matching `localhost:PORT` regex.

- Uploads and payload sizes
  - Backend serves `/uploads` from process working dir. JSON/body parser limit = 12mb. Multer error handler included for file-size issues. ML service sets Waitress `max_request_body_size` to 50MB.

- ML model files & fallback
  - ML service will load `crop_disease_model_best.h5` if present, otherwise `crop_disease_model.h5`.
  - `class_indices.json` is used to map model outputs to labels when available.

- Project layout
  - No workspace-level package.json — frontend and backend are separate Node projects. Start them independently.

- Linting
  - ESLint configured in `frontend`. Run `npm run lint` from `frontend`.

- Tests
  - No automated tests or CI workflows detected in repository. Add tests in the appropriate subproject (frontend/backend) and update package.json scripts when added.

---

AI / assistant configs scanned

- No agent-specific files found (CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, AIDER_CONVENTIONS, etc.).
- No `.github/workflows` detected.

---

Summary / next steps

This file summarizes how to build and run each component, the high-level architecture, and conventions Copilot should assume when making changes or generating code. If additional specifics are needed (CI, Docker, tests, environment sample `.env`), indicate which area to cover next.
