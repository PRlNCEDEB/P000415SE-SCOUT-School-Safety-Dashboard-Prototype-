## Firestore Database Structure

### users
Used for real system login accounts.

Fields:
- `name`
- `email`
- `role`
- `schoolId`
- `schoolName`
- `phone`
- `createdAt`
- `updatedAt`

Firebase Authentication stores the login password. Firestore stores the role and school profile used by the backend.

### schools
Stores school records used for role scoping and display.

Fields:
- `name`
- `createdAt`
- `updatedAt`

### incidents
Stores submitted incident records.

Fields:
- `title`
- `description`
- `location`
- `type`
- `priority`
- `status`
- `schoolId`
- `schoolName`
- `triggeredById`
- `triggeredByEmail`
- `triggeredByRole`
- `triggeredByName`
- `assignedUserIds`
- `assignedUserEmails`
- `acknowledgedBy`
- `inProgressBy`
- `reviewRequired`
- `reviewComment`
- `reviewComments`
- `createdAt`
- `updatedAt`

### archivedIncidents
Stores resolved incidents moved out of the live `incidents` collection by the archive job.

Fields:
- all incident fields
- `archivedAt`

### notifications
Stores notification delivery records linked to incidents.

Fields:
- `incidentId`
- `incidentTitle`
- `type`
- `schoolId`
- `schoolName`
- `recipientName`
- `recipientEmail`
- `recipientRole`
- `email`
- `sms`
- `token`
- `acknowledged`
- `acknowledgedAt`
- `timestamp`

### notificationRecipients
Stores legacy/demo recipient contacts and school roles for fallback routing.

School-specific routing can now store recipients directly in `notificationRouting.recipients`, so this collection is mainly used by older role-based routing rules and demo seed data.

Fields:
- `name`
- `email`
- `phone`
- `role`
- `schoolId`
- `schoolName`
- `active`
- `createdAt`
- `updatedAt`

### notificationRouting
Stores routing rules by alert category and school.

School Admin routing stores selected recipients directly in a `recipients` array. Legacy routing can still use `roles` to look up matching contacts from `notificationRecipients`.

Fields:
- `alertScope`
- `alertType`
- `priority`
- `channels`
- `roles`
- `recipients`
- `schoolId`
- `schoolName`
- `active`
- `createdAt`
- `updatedAt`

### alertTypes
Stores alert type configuration managed by Company Admin.

Fields:
- `label`
- `value`
- `emoji`
- `category`
- `active`
- `createdAt`
- `updatedAt`

### locations
Stores selectable alert locations managed by Company Admin.

Fields:
- `label`
- `active`
- `createdAt`
- `updatedAt`

### settings/global
Stores system-wide settings managed by Company Admin.

Fields:
- `overdueThresholdMinutes`
- `archiveRetentionDays`

### actionLogs
Stores dashboard quick action records and related actions taken.

Fields:
- `button`
- `actions`
- `title`
- `description`
- `location`
- `triggeredById`
- `emergencyType`
- `createdAt`
