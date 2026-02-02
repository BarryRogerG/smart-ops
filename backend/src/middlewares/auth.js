const { verifyToken } = require('../utils/jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Guest user configuration for public showcase mode
const GUEST_USER_CONFIG = {
  email: 'guest@smartops.demo',
  role: 'admin',
  name: 'Guest Admin',
};

// Ensure guest user exists in database (for foreign key constraints)
async function ensureGuestUser() {
  try {
    let guestUser = await prisma.user.findUnique({
      where: { email: GUEST_USER_CONFIG.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!guestUser) {
      // Create guest user if it doesn't exist
      // Use a simple password hash (won't be used for login)
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('guest-demo-account', 10);
      
      guestUser = await prisma.user.create({
        data: {
          name: GUEST_USER_CONFIG.name,
          email: GUEST_USER_CONFIG.email,
          passwordHash: passwordHash,
          role: GUEST_USER_CONFIG.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      console.log('[Auth] Guest user created in database');
    }

    return guestUser;
  } catch (error) {
    console.error('[Auth] Error ensuring guest user:', error);
    // Return a fallback guest user object if database operation fails
    return {
      id: 'guest-fallback',
      email: GUEST_USER_CONFIG.email,
      role: GUEST_USER_CONFIG.role,
      name: GUEST_USER_CONFIG.name,
    };
  }
}

// Middleware to verify JWT token or assign guest user
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    // If no token provided, assign guest user for public showcase
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No token provided - assigning guest user');
      req.user = await ensureGuestUser();
      return next();
    }

    // Try to verify token
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // If token is invalid, assign guest user instead of returning error
    if (!decoded) {
      console.log('[Auth] Invalid token - assigning guest user');
      req.user = await ensureGuestUser();
      return next();
    }

    // Try to find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // If user not found in database, assign guest user
    if (!user) {
      console.log('[Auth] User not found in database - assigning guest user');
      req.user = await ensureGuestUser();
      return next();
    }

    // Valid authenticated user
    req.user = user;
    next();
  } catch (error) {
    // On any error, assign guest user instead of returning error
    console.log('[Auth] Authentication error - assigning guest user:', error.message);
    try {
      req.user = await ensureGuestUser();
    } catch (guestError) {
      // Fallback if guest user creation fails
      req.user = {
        id: 'guest-fallback',
        email: GUEST_USER_CONFIG.email,
        role: GUEST_USER_CONFIG.role,
        name: GUEST_USER_CONFIG.name,
      };
    }
    next();
  }
}

// Middleware to check if user has required role
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
