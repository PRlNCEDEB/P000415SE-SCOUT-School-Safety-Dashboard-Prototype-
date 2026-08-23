# Seed fixtures

Demo data used **only** by the seed scripts in `server/src/db/`. Nothing under
`src/routes`, `src/services` or `src/index.js` may import from this folder —
application code reads schools from Firestore, never from a file.

`server/tests/no-hardcoded-schools.test.js` enforces that: it fails if a school
name appears anywhere in `server/src` outside this directory.

## Files

| File | Seeded by | Into |
|---|---|---|
| `demoSchools.json` | `seedDemoData.js` | `schools` |
| `demoUsers.json` | `seedDemoUsers.js` | Firebase Auth + `users` |

`demoUsers.json` stores only `schoolId`. The matching `schoolName` is resolved
from the `schools` collection at seed time rather than duplicated here, so the
two can never drift apart.

Notification recipients and routing rules are **not** fixtures: they are
generated per school by `demoSeedData_notification.js`, so every school in the
database gets a full set of routing rules instead of only the first one.
