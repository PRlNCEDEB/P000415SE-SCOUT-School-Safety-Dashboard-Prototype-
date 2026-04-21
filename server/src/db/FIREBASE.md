## Firestore Database Structure

### users
Used for real system login accounts.

Fields:
- `name`
- `email`
- `passwordHash`
- `role`
- `createdAt`

### incidents
Stores submitted incident records.

Fields:
- `title`
- `description`
- `location`
- `type`
- `priority`
- `status`
- `triggeredById`
- `triggeredByName`
- `createdAt`
- `updatedAt`

### notifications
Stores notification delivery records linked to incidents.

Fields:
- `incidentId`
- `incidentTitle`
- `incidentType`
- `recipientName`
- `recipientEmail`
- `recipientPhone`
- `emailStatus`
- `smsStatus`
- `createdAt`

### notificationRecipients
Stores demo recipient contacts / school roles for routing.

Fields:
- `name`
- `email`
- `phone`
- `role`
- `active`
- `createdAt`
- `updatedAt`

### notificationRouting
Stores routing rules by alert category.

Fields:
- `alertScope`
- `alertType`
- `priority`
- `channels`
- `roles`
- `active`
- `createdAt`
- `updatedAt`

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