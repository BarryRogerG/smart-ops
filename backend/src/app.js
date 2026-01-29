const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workItemRoutes = require('./routes/workItems');
const projectRoutes = require('./routes/projects');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');

const app = express();

// Root health check route (placed before other routes)
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SmartOps Backend is Live' });
});

// Middleware
// CORS configuration - allows requests from frontend
// Set FRONTEND_URL environment variable to your production frontend URL
// In development, allows localhost origins
// In production without FRONTEND_URL, uses wildcard (*) for testing
const corsOptions = process.env.FRONTEND_URL
  ? {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  : process.env.NODE_ENV === 'production'
  ? {
      origin: '*', // Wildcard for production testing - set FRONTEND_URL for specific domain
      credentials: false // Credentials not supported with wildcard
    }
  : {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
      credentials: true
    };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/work-items', workItemRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartOps API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
