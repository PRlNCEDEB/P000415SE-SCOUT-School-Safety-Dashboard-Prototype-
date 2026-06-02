# SCOUT Frontend

React/Vite frontend for the SCOUT School Safety Dashboard prototype.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Default local URL:

```txt
http://localhost:5173
```

## Environment

The frontend reads all runtime config from `.env`.

Required values:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Use `.env.example` as the shared template. Do not commit real `.env` files.

## Commands

```bash
npm run dev
npm run build
npm run test:run
```
