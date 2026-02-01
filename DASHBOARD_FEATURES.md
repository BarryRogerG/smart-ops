# Dashboard Features by Role

## Role-Based Feature Visibility

### Regular User ('user' role)
- ✅ View "My Work" dashboard
- ✅ See open work items assigned to them
- ✅ See high priority items assigned to them
- ✅ See on hold items assigned to them
- ❌ AI Summary button (hidden)
- ❌ Items Per User section (hidden)
- ❌ Manage Team section (hidden)
- ❌ Quick action buttons (On Hold) (hidden)

### Manager ('manager' role)
- ✅ View "Team Overview" dashboard
- ✅ See all open work items
- ✅ See all high priority items
- ✅ See all on hold items
- ✅ **AI Summary button** (visible)
- ✅ **Items Per User section** (visible)
- ✅ Quick action buttons (On Hold) (visible)
- ❌ Manage Team section (hidden - admin only)

### Admin ('admin' role)
- ✅ View "Team Overview" dashboard
- ✅ See all open work items
- ✅ See all high priority items
- ✅ See all on hold items
- ✅ **AI Summary button** (visible)
- ✅ **Items Per User section** (visible)
- ✅ **Manage Team section** (visible)
- ✅ Quick action buttons (On Hold) (visible)
- ✅ Access to User Management page

## Current User Status

You are logged in as: **Barry Goldberg (user)**

This means you have the 'user' role, which is why you don't see:
- AI Summary button
- Items Per User section
- Manage Team section

## Solutions

### Option 1: Use Development Role Toggle (Local Development Only)
If you're running locally in development mode, you should see a yellow button in the bottom-right corner that says "DEV: USER → ADMIN". Click it to toggle your role.

### Option 2: Check if You Should Be Admin
If you were the **first user** to register, you should have been automatically assigned the 'admin' role. Check:
1. Open browser console (F12)
2. Check the user object: `localStorage.getItem('user')`
3. Verify the role field

### Option 3: Have an Admin Change Your Role
If there's already an admin user, they can:
1. Go to the Users page
2. Edit your user
3. Change your role to 'admin' or 'manager'

### Option 4: Delete All Users and Re-register
If you want to become the first user (admin):
1. Delete all users from the database
2. Register a new account
3. The first user will automatically get 'admin' role

## Debugging

After the latest deployment, check the browser console for:
- `[Dashboard] Loading dashboard data...`
- `[Dashboard] Dashboard data loaded:`
- `[Dashboard] User role:`
- Any error messages

This will help identify if:
- The API call is failing
- The data is loading correctly
- The role is being read correctly
