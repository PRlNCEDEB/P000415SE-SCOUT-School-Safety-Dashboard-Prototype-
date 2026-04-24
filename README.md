# SCOUT School Safety Dashboard Prototype

## Environment Setup

This project has two parts:

- Frontend: `client/`
- Backend: `server/`

### Default Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Backend health check: `http://localhost:5000/api/health`

### Setup Steps

1. Install dependencies in both apps.

```bash
cd client
npm install

cd ../server
npm install
```

2. Copy the example env files and fill in your own values.

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

3. Add the Firebase service account file to the `server/` folder, or update the path in `server/.env`.

4. Start the backend first, then the frontend.

```bash
cd server
npm run dev

cd ../client
npm run dev
```

### Environment Variables

#### Frontend

The frontend uses:

- `VITE_API_BASE_URL`

Recommended local value:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Backend

The backend uses:

- `PORT`
- `JWT_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `FIREBASE_PROJECT_ID`
- `SENDGRID_API_KEY`
- `FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID`

### Important Notes

- If you change the backend port, update the frontend API base URL too.
- Do not commit real secrets or real `.env` files to the repo.
- Use the `.env.example` files as the shared template for the team.
- Make sure your backend routes are enabled before testing frontend integration.
- If you see `Failed to fetch`, first check that the backend is running and that the API port matches the frontend config.

## Git Workflow

Use this workflow so we can develop in separate branches and merge more safely.

1. Always start from the latest `main`.

```bash
git checkout main
git pull
```

2. Create a new feature branch from `main`.

```bash
git checkout -b your-branch-name
```

3. Work only on files related to your user story unless the team agrees on a shared change.

4. Before opening a pull request or merging, update your branch with the latest `main`.

```bash
git checkout main
git pull
git checkout your-branch-name
git merge main
```

5. Fix merge conflicts in your own branch before asking others to review or before merging.

6. Do not delete, revert, or overwrite teammates' work unless you have checked with them first.

7. If a change touches another teammate's scope, discuss it in the group before merging.

## Notes

- The safest habit is: `pull main` first, then create or update your feature branch.
- Merge `main` into your branch before merging to `main`, not after.
- Keep commits focused so conflicts are easier to resolve.
