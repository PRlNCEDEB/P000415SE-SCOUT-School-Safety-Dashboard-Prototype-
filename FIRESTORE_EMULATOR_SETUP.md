# Firestore Emulator Setup

This guide explains how to run the project with the local Firestore Emulator, seed the required demo data, and test database-related features safely without using the live Firebase database.

## Purpose

The Firestore Emulator is used for local testing. It allows the backend to read and write data into a local Firestore instance instead of the real Firebase project.

This is useful for:
- testing database changes safely
- checking notification routing and recipients
- testing alert creation and acknowledgement flow
- avoiding changes to the live database during development

## Project Structure

Run Firebase emulator commands from the project root.

- project root: Firebase emulator commands
- `server/`: backend commands
- `client/`: frontend commands

## 1. Start the Firestore Emulator

From the project root:

```powershell
firebase emulators:start
```

Default ports:
- Firestore Emulator: `127.0.0.1:8080`
- Emulator UI: `127.0.0.1:4000`

If port `8080` is already in use, update `firebase.json` with a different Firestore port.

Example:

```json
{
  "emulators": {
    "singleProjectMode": true,
    "firestore": {
      "port": 9090
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

If you change the port, also change the backend environment variable in the next step.

## 2. Start the Backend with Emulator Support

Open a new terminal and go to the `server` folder.

If Firestore is using the default emulator port:

```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
npm run dev
```

If Firestore is using a custom port such as `9090`:

```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:9090"
npm run dev
```

When `FIRESTORE_EMULATOR_HOST` is set, the backend will automatically seed emulator data on startup.

## 3. Start the Frontend

Open another terminal and go to the `client` folder:

```powershell
npm run dev
```

## 4. Emulator Seed Data

When the backend starts with `FIRESTORE_EMULATOR_HOST` set, it seeds the emulator automatically.

The emulator seed includes:
- `users`
- `notificationRecipients`
- `notificationRouting`
- demo `incidents`

Collections do not need to be created manually. Firestore creates them automatically when the first document is written.

## 5. Manual Reseed

If you want to seed the emulator manually again, run this from the `server` folder:

```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
npm run seed:emulator
```

If using another port, replace `8080` with that port.

## 6. View Emulator Data

Once the emulator is running, open the Emulator UI in your browser:

[http://127.0.0.1:4000](http://127.0.0.1:4000)

You can inspect collections such as:
- `users`
- `incidents`
- `notifications`
- `notificationRecipients`
- `notificationRouting`

## 7. Testing Email Acknowledge Links Locally

The Firestore Emulator only replaces the database.

The email acknowledgement link still needs to point to the backend server, not the Firestore Emulator.

Important:
- Firestore Emulator port `8080` is not the backend API port
- email links should point to the backend, for example:
  - `http://localhost:5000`

In `server/.env`, make sure:

```env
BACKEND_URL=http://localhost:5000
```

Then restart the backend and generate a new email.

Notes:
- old emails keep the old link
- changing `.env` does not update links in emails that were already sent

## 8. What to Test

Recommended manual checks:

### Seed data
- confirm `users` exists
- confirm `notificationRecipients` exists
- confirm `notificationRouting` exists
- confirm demo `incidents` exist

### Submit alert
- create an alert from the frontend
- check that a new document appears in `incidents`

### Notification flow
- confirm related documents are created in `notifications`
- confirm routing uses the correct seeded recipients

### Acknowledge flow
- click a fresh acknowledgement link from a newly generated email
- confirm related fields update in the emulator database

## 9. Common Mistakes

### Mistake 1: Using port 8080 as the email link
Do not use Firestore Emulator port `8080` for email acknowledgement links.

Wrong:

```txt
http://localhost:8080/api/notifications/acknowledge/...
```

Correct:

```txt
http://localhost:5000/api/notifications/acknowledge/...
```

### Mistake 2: Clicking an old email link
Old emails keep the URL that existed when they were generated. If `BACKEND_URL` changes, send a fresh email.

### Mistake 3: Creating collections manually
This is not required. Firestore creates collections automatically when documents are written.

## 10. Summary

Normal local emulator workflow:

Terminal 1, project root:

```powershell
firebase emulators:start
```

Terminal 2, `server`:

```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
npm run dev
```

Terminal 3, `client`:

```powershell
npm run dev
```

Optional manual reseed in `server`:

```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
npm run seed:emulator
```
