# SmartOps

SmartOps helps **small-mid sized teams** manage operational work in one place.

## Features

- **Authentication**: Email + password login with JWT-based sessions and role-based access
- **Work Item Management**: Create, edit, assign, and track work items (tasks, bugs, incidents, requests)
- **Dashboard**: View open items, high-priority issues, blocked items, and items per user
- **AI Assistance** (Optional): Generate summaries for managers using OpenAI API
- **User Management**: Admin can manage users, roles, and permissions

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **AI**: OpenAI API (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smartops?schema=public"
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3001
OPENAI_API_KEY=your-openai-api-key-here
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## User Roles

- **Regular User (Employee)**: Creates work items, updates status, sees their assigned items
- **Manager**: Sees team-wide overview, changes priority, assigns owners, views summaries
- **Admin**: Manages users, controls permissions, system configuration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Work Items
- `GET /api/work-items` - Get all work items (filtered by role)
- `GET /api/work-items/:id` - Get single work item
- `POST /api/work-items` - Create work item
- `PUT /api/work-items/:id` - Update work item
- `DELETE /api/work-items/:id` - Delete work item (admin only)

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### AI
- `POST /api/ai/summary` - Generate AI summary (manager/admin only)
- `GET /api/ai/summaries` - Get AI summaries (manager/admin only)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Notes

- The app works **without AI**. AI is an optional enhancement.
- Regular users can only see and update their assigned work items.
- Managers and admins can see all work items and manage priorities/assignments.
- Only admins can delete work items and manage users.

## License

ISC
