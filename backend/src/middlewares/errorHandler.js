/**
 * Centralized Error Handler Middleware
 * 
 * Provides consistent error responses across the API
 * Format: { error: string, code: number }
 */

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper for async route handlers to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Centralized error handling middleware
 * Must be placed after all routes
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('[Error Handler]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    statusCode: err.statusCode || 500,
    code: err.code,
    path: req.path,
    method: req.method,
  });

  // Handle known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this value already exists',
      code: 409,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      code: 404,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 401,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 401,
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message || 'Validation error',
      code: 400,
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    code: statusCode,
  });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: 404,
  });
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
};
