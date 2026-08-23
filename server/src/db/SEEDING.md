# Database Seeding

Run these commands from the `server/` folder.

> **Seeding no longer runs automatically on startup.** It used to, which meant a
> production boot wrote demo schools into the live database. Set
> `SEED_DEMO_DATA=true` in `server/.env` to re-enable startup seeding locally; it
> is ignored entirely when `NODE_ENV=production`. Against the Firestore emulator
> it always runs, because an emulator starts empty.

## Demo notification and user seed

```bash
npm run seed:demo
```

Seeds:

- Firestore `schools` (from `fixtures/demoSchools.json`)
- demo Firebase Auth users + Firestore `users` (from `fixtures/demoUsers.json`)
- `notificationRecipients` and `notificationRouting` generated **per school**,
  for every school in the database

Recipients and routing rules are built for each school rather than pinned to one.
Before this, only the first school had any routing, so alerts raised at any other
school matched no rules and notified nobody.

Document IDs are namespaced `{schoolId}__{key}`, so re-running overwrites rather
than duplicating. The seed also deletes the older unnamespaced records
(`principal`, `emergency-fire`, ...) leaving them in place alongside the new
ones would double-notify whoever belonged to the school they were pinned to.

## Company Admin

```bash
npm run seed:company-admin
```

Creates the Company Admin Auth account and its Firestore `users` document, using
`COMPANY_ADMIN_EMAIL` / `COMPANY_ADMIN_PASSWORD` from `server/.env`. No other
seed script creates this role, so a fresh project has no Company Admin without it.

## Alert configuration seed

```bash
npm run seed:alert-config
npm run migrate:alert-types
```

Seeds `alertTypes` and `locations`, then backfills the `category` field.

> `seed:alert-config` uses auto-generated IDs and is **not** idempotent — running
> it twice creates duplicates. `migrate:alert-types` matches on label and is safe
> to re-run.

## Emulator seed

```bash
npm run seed:emulator
```

## Fixtures

Demo data lives in `fixtures/` and is read **only** by these seed scripts.
Application code reads schools from Firestore. `tests/no-hardcoded-schools.test.js`
fails the build if a school name or ID appears in application source.
