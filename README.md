# Telehealth Platform

Telemedicine product backed by Node.js/Express with MongoDB persistence and a pre-built static frontend bundle (`/static`). Includes health check, messaging routes, and connection pooling/retry logic for MongoDB.

## Project Layout
- `server/` – Express API (entry: `server.js`), MongoDB connection with retry + pooling, message routes.
- `static/` – Built frontend assets (served by hosting layer).
- `tests/` and `server/tests/` – MongoDB connectivity checks (use your own `MONGODB_URI`).
- `index.html`, `.htaccess` – Frontend entry and server config.
- `TELEHEALTH_BRD.md` – Business requirements document.

## Prerequisites
- Node.js 18+ recommended
- MongoDB connection string

## Setup
1) Clone the repo
2) Create `.env` in the repo root:

```
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
```

3) Install dependencies and run the API:

```
cd server
npm install
npm run dev   # or: npm start
```

## Health Check
- `GET /api/health` returns DB status, uptime, and pool settings

## Mongo Connectivity Tests
Two lightweight scripts (require `MONGODB_URI`):

```
node tests/testMongo.js
node server/tests/testMongo.js
```

## Deployment Notes
- `.env` and other secrets are git-ignored; provide them at deploy time.
- `static/` is already built; keep it synced with the backend host or serve via CDN.
- For graceful shutdowns, the server listens for SIGINT/SIGTERM and closes the Mongo connection cleanly.
