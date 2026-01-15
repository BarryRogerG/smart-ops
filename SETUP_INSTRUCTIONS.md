# SmartOps Setup Instructions

## Step 1: Install PostgreSQL

1. **Download PostgreSQL**:
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer" (or use EnterpriseDB's installer)
   - Choose PostgreSQL version **16** or **17** (both work fine)
   - Download the Windows x86-64 installer

2. **Install PostgreSQL**:
   - Run the installer
   - Click "Next" through the setup wizard
   - **Important**: When asked for a password, set a password for the `postgres` user
     - Remember this password! You'll need it for the `.env` file
   - Keep the default port (5432) unless you have a conflict
   - Complete the installation

3. **Verify Installation**:
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see a version number

## Step 2: Create the Database

1. **Open PostgreSQL Command Line**:
   - Press `Win + R`
   - Type: `psql -U postgres`
   - Press Enter
   - Enter the password you set during installation

2. **Create the Database**:
   ```sql
   CREATE DATABASE smartops;
   ```
   Press Enter

3. **Exit PostgreSQL**:
   ```sql
   \q
   ```
   Press Enter

## Step 3: Set Up Backend Environment

1. **Navigate to Backend Folder**:
   ```bash
   cd backend
   ```

2. **Create `.env` File**:
   - Create a new file named `.env` in the `backend` folder
   - Copy this content (replace `YOUR_PASSWORD` with your PostgreSQL password):
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/smartops?schema=public"
   JWT_SECRET=change-this-to-a-random-secret-key-min-32-characters
   JWT_EXPIRES_IN=7d
   PORT=3001
   OPENAI_API_KEY=
   ```

3. **Install Backend Dependencies**:
   ```bash
   npm install
   ```

4. **Set Up Database Tables**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
   - When prompted, type `y` and press Enter

## Step 4: Set Up Frontend

1. **Navigate to Frontend Folder**:
   ```bash
   cd ../frontend
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

## Step 5: Start the Application

1. **Start Backend** (in one terminal):
   ```bash
   cd backend
   npm run dev
   ```
   You should see: `🚀 Server running on port 3001`

2. **Start Frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   You should see a local URL like: `http://localhost:5173`

3. **Open in Browser**:
   - Go to the frontend URL (usually `http://localhost:5173`)
   - You'll see the login page
   - Click "Register" or use the API to create your first user

## Quick Test

Once everything is running, you can test the API:

```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","password":"password123"}'
```

Then login at `http://localhost:5173` with those credentials!

## Troubleshooting

**"psql: command not found"**
- PostgreSQL might not be in your PATH
- Try using pgAdmin (installed with PostgreSQL) instead
- Or add PostgreSQL bin folder to your PATH

**"password authentication failed"**
- Check your `.env` file - make sure the password matches
- Try resetting: `psql -U postgres` then `ALTER USER postgres PASSWORD 'newpassword';`

**"database smartops does not exist"**
- Make sure you ran `CREATE DATABASE smartops;` in Step 2

**Port 3001 already in use**
- Change `PORT=3001` to another port (e.g., `3002`) in `.env`
- Update frontend `.env` if you created one: `VITE_API_URL=http://localhost:3002/api`
