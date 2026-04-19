# API 404 Error - Root Cause Analysis

## Problem
You're getting **"API error: 404"** when trying to login on the SCOUT application.

## Root Cause
**The authentication route is commented out in the backend server.**

In `/server/src/index.js` (line 26):
```javascript
//app.use('/api/auth', authRoutes)  // ← THIS IS COMMENTED OUT!
app.use('/api/incidents', incidentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/action-logs', actionLogRoutes)
```

### What's Happening
1. **Frontend** (`client/src/api/client.js`) tries to call `/api/auth/login` endpoint
2. **Backend** (`server/src/index.js`) has the auth route commented out, so this endpoint doesn't exist
3. Express returns a **404 Not Found** error for the missing route
4. Frontend displays: "API error: 404"

## Solution
Uncomment the auth route in `/server/src/index.js`:

**Change line 26 from:**
```javascript
//app.use('/api/auth', authRoutes)
```

**To:**
```javascript
app.use('/api/auth', authRoutes)
```

## Steps to Fix

### 1. Edit the server file
Open `/server/src/index.js` and uncomment line 26.

### 2. Restart the backend server
```bash
# Kill the running server (if any)
# Then restart it:
npm start
# or
node server/src/index.js
```

### 3. Test the login
- The frontend login page should now work
- Use demo credentials: `admin@school.edu` / `password123`

## Additional Notes
- The auth route IS properly implemented in `/server/src/routes/auth.js` - it just isn't being used by the app
- All other routes (incidents, notifications, analytics, action-logs) are correctly registered
- Make sure your `.env` file has `JWT_SECRET` defined for JWT signing to work
