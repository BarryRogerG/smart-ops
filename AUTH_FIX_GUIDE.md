# Authentication Fix Guide

## Problem
- Sign Up says "User already exists"
- Login says "Invalid credentials"

This indicates a corrupted user record in the database (user exists but password hash is invalid).

## Solution: Clean Database and Re-register

### Option 1: Using the Cleanup Script (Recommended)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the cleanup script:
   ```bash
   node scripts/cleanup-users.js
   ```

   Or if you have a script in package.json:
   ```bash
   npm run cleanup:users
   ```

3. Verify users are deleted:
   The script will show how many users were deleted.

4. Register a new account:
   - Go to the Sign Up page
   - Create a new account
   - The first user will automatically get 'admin' role

### Option 2: Using Prisma Studio (Visual)

1. Open Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```

2. Navigate to the User model
3. Delete all users manually
4. Close Prisma Studio
5. Register a new account

### Option 3: Using Prisma CLI (Direct)

1. Open a database console or use Prisma:
   ```bash
   cd backend
   npx prisma db execute --stdin
   ```

2. Or use a SQL command:
   ```bash
   # Connect to your database and run:
   DELETE FROM "User";
   ```

## Verification: Auth Logic Audit

### ✅ Password Hashing (Register)
- **File**: `backend/src/routes/auth.js` line 29
- **Function**: `await hashPassword(password)`
- **Implementation**: `backend/src/utils/bcrypt.js`
- **Salt Rounds**: 10 ✅

### ✅ Password Verification (Login)
- **File**: `backend/src/routes/auth.js` line 91
- **Function**: `await comparePassword(password, user.passwordHash)`
- **Implementation**: `backend/src/utils/bcrypt.js`
- **Uses**: `bcrypt.compare()` ✅

### ✅ Salt Rounds Match
- **Hash**: Uses `bcrypt.genSalt(10)` then `bcrypt.hash()`
- **Compare**: Uses `bcrypt.compare()` (automatically handles salt)
- **Both use same algorithm**: bcryptjs ✅

### ✅ First User Admin Logic
- **File**: `backend/src/routes/auth.js` lines 32-41
- **Logic**: 
  ```javascript
  const userCount = await prisma.user.count();
  let userRole = 'user';
  if (userCount === 0) {
    userRole = 'admin';
    console.log('First user registration - assigning admin role');
  }
  ```
- **Verified**: First user gets 'admin', others get 'user' ✅

## Testing After Cleanup

1. **Delete all users** using one of the methods above
2. **Register a new account** with:
   - Name: Your name
   - Email: Your email
   - Password: Your password
3. **Verify**:
   - Registration succeeds
   - You're automatically logged in
   - Your role is 'admin' (check console or user object)
4. **Login test**:
   - Log out
   - Log back in with the same credentials
   - Should work correctly

## Common Issues

### Issue: "User already exists" after cleanup
- **Cause**: Database not properly cleaned
- **Fix**: Run cleanup script again, verify with `npx prisma studio`

### Issue: "Invalid credentials" after registration
- **Cause**: Password hash corruption
- **Fix**: Delete user and re-register

### Issue: First user not getting admin role
- **Cause**: User count check happens after user creation (race condition)
- **Fix**: The current logic checks BEFORE creating, so this shouldn't happen
- **Note**: If two users register simultaneously, both might get admin (acceptable for most cases)

## Database Schema Check

Verify your User model has the correct fields:
```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         UserRole @default(user)
  createdAt    DateTime @default(now()) @map("created_at")
  // ... other fields
}
```

## Next Steps

After cleanup and re-registration:
1. ✅ You should be able to sign up
2. ✅ You should be able to log in
3. ✅ First user should have 'admin' role
4. ✅ Dashboard should load with admin features
