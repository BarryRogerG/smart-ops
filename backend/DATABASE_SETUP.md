# Database Setup Guide

This guide will help you set up PostgreSQL for SmartOps.

## Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:

### Windows
1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user

### macOS
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create the Database

Open a terminal/command prompt and connect to PostgreSQL:

```bash
# Windows (if PostgreSQL is in your PATH)
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

Then create the database:

```sql
CREATE DATABASE smartops;
\q
```

Or from command line directly:
```bash
# Windows
psql -U postgres -c "CREATE DATABASE smartops;"

# macOS/Linux
sudo -u postgres createdb smartops
```

## Step 3: Create .env File

In the `backend` directory, create a `.env` file:

```bash
cd backend
```

Create `.env` file with the following content:

```env
# Database Connection
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/smartops?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Port
PORT=3001

# OpenAI API Key (Optional - only needed for AI features)
OPENAI_API_KEY=your-openai-api-key-here
```

**Important:** Replace:
- `your_password` with your PostgreSQL password
- `your-super-secret-jwt-key-change-this-in-production` with a secure random string
- `your-openai-api-key-here` with your OpenAI API key (or leave empty if not using AI)

### Quick .env Template

If you're using the default PostgreSQL setup (user: `postgres`, port: `5432`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartops?schema=public"
JWT_SECRET=change-this-to-a-random-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
```

## Step 4: Install Dependencies

Make sure you're in the `backend` directory:

```bash
cd backend
npm install
```

## Step 5: Generate Prisma Client

```bash
npx prisma generate
```

This creates the Prisma Client based on your schema.

## Step 6: Run Database Migrations

This will create all the tables in your database:

```bash
npx prisma migrate dev --name init
```

You'll be prompted to create a new migration. Type `y` and press Enter.

This will:
- Create a migration file
- Apply it to your database
- Create all tables (users, projects, work_items, ai_summaries)

## Step 7: Verify Setup (Optional)

You can open Prisma Studio to view your database:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can browse your database.

## Troubleshooting

### Connection Error: "password authentication failed"
- Make sure your password in `.env` matches your PostgreSQL password
- Try resetting the postgres password:
  ```sql
  ALTER USER postgres PASSWORD 'new_password';
  ```

### Connection Error: "database does not exist"
- Make sure you created the `smartops` database (Step 2)
- Check the database name in your `DATABASE_URL`

### Port Already in Use
- If port 5432 is in use, change the port in your `DATABASE_URL`
- Or stop the service using that port

### Prisma Client Not Generated
- Make sure you ran `npx prisma generate`
- Check that `node_modules/@prisma/client` exists

## Next Steps

Once the database is set up:
1. Start the backend server: `npm run dev`
2. The API will be available at `http://localhost:3001`
3. You can now register users and start using the app!
