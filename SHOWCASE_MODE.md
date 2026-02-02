# Public Showcase Mode

## Overview

The SmartOps application now supports **public showcase mode**, allowing visitors to explore all features without requiring authentication.

## How It Works

### Authentication Middleware Changes

The `authenticate` middleware has been modified to:

1. **Check for JWT token** in the `Authorization` header
2. **If token is present and valid**: Use the authenticated user
3. **If token is missing or invalid**: Assign a "Guest Admin" user instead of returning 401

### Guest User Details

- **Email**: `guest@smartops.demo`
- **Name**: `Guest Admin`
- **Role**: `admin` (full access to all features)
- **ID**: Real database UUID (created automatically on first use)

### Guest User Creation

The guest user is automatically created in the database on first use:
- Ensures foreign key constraints work correctly
- Allows guest users to create work items, projects, etc.
- Guest user has a real database ID (UUID)

## Features Available to Guests

With the guest admin role, visitors can:

✅ **View all work items** (not filtered by assignment)
✅ **Create work items** (assigned to guest user)
✅ **Update work items** (full edit access)
✅ **Delete work items** (admin permission)
✅ **View all projects**
✅ **Create and manage projects**
✅ **View dashboard** (all data visible)
✅ **Generate AI summaries** (admin/manager feature)
✅ **View user management** (admin feature)
✅ **Access all API endpoints**

## Implementation Details

### Middleware Flow

```
Request → authenticate middleware
  ├─ Has valid token? → Use authenticated user
  ├─ No token? → Assign guest user
  ├─ Invalid token? → Assign guest user
  └─ User not found? → Assign guest user
```

### Guest User Creation

The `ensureGuestUser()` function:
1. Checks if guest user exists in database
2. If not, creates it with:
   - Email: `guest@smartops.demo`
   - Role: `admin`
   - Name: `Guest Admin`
   - Password: Hashed (not used for login)
3. Returns the guest user object

### Error Handling

- If guest user creation fails, a fallback guest user object is used
- All authentication errors result in guest access (no 401 errors)
- Logs are written to help debug authentication flow

## Security Considerations

⚠️ **Important**: This mode is designed for **public showcase/demo purposes only**.

### What This Means:
- **No authentication required** - anyone can access all features
- **No data protection** - all data is publicly accessible
- **Guest can modify/delete** - full admin access
- **Not for production** - do not use for real applications with sensitive data

### For Production Use:
To disable showcase mode, revert the `authenticate` middleware to return 401 errors when no token is provided.

## Testing

### Test Guest Access

1. **Open the app** without logging in
2. **Check browser console** - should see: `[Auth] No token provided - assigning guest user`
3. **Verify guest user** - all features should be accessible
4. **Check database** - guest user should be created automatically

### Test Authenticated Access

1. **Register/Login** with a real account
2. **Check browser console** - should see authenticated user
3. **Verify access** - should work as normal

## Logs

The middleware logs authentication events:
- `[Auth] No token provided - assigning guest user`
- `[Auth] Invalid token - assigning guest user`
- `[Auth] User not found in database - assigning guest user`
- `[Auth] Guest user created in database`

## Database Impact

- Guest user is created in the `users` table
- Guest user can create work items (stored with guest user ID as `createdBy`)
- Guest user appears in user lists (can be filtered out if needed)

## Frontend Considerations

The frontend will work normally:
- If no token in localStorage, API calls will work (guest mode)
- If token exists, authenticated user is used
- Dashboard and all features remain functional

## Reverting to Authenticated-Only Mode

To require authentication:

1. Modify `backend/src/middlewares/auth.js`
2. Change the `authenticate` function to return 401 errors instead of assigning guest user
3. Remove or comment out the `ensureGuestUser()` calls
