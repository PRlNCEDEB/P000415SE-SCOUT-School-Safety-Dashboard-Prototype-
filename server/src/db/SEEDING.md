# Database Seeding

Run these commands from the `server/` folder.

## Demo notification and user seed

```bash
npm run seed:demo
```

Seeds:

- demo Firebase Auth users
- Firestore `users`
- Firestore `schools`
- legacy/demo `notificationRecipients`
- `notificationRouting`

## Alert configuration seed

```bash
npm run seed:alert-config
```

Seeds:

- `alertTypes`
- `locations`

## Alert type migration

```bash
npm run migrate:alert-types
```

Adds missing alert type category fields where needed.

## Emulator seed

When `FIRESTORE_EMULATOR_HOST` is set, the backend seeds emulator data on startup. You can also run:

```bash
npm run seed:emulator
```
