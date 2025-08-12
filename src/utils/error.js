import { StatusCodes } from 'http-status-codes';

/**
 * Custom error class for API errors
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * Create a new API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Array} errors - Array of error details
   * @param {string} stack - Stack trace
   */
  constructor(
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.success = false;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Creates a standardized error object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} errors - Array of error details
 * @returns {ApiError} New ApiError instance
 */
export const createError = (statusCode, message, errors = []) => {
  return new ApiError(statusCode, message, errors);
};

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Default to 500 (Internal Server Error) if status code not set
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];

  // Log the error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] Error:`, {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async handler to wrap async route handlers and catch errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped async function with error handling
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      if (!err.statusCode) {
        console.error('Unhandled error in async handler:', err);
      }
      next(err);
    });
  };
};

/**
 * Creates a 404 Not Found error
 * @param {string} resource - Name of the resource that was not found
 * @returns {ApiError} New ApiError instance with 404 status
 */
export const notFound = (resource = 'Resource') => {
  return createError(StatusCodes.NOT_FOUND, `${resource} not found`);
};

/**
 * Creates a 401 Unauthorized error
 * @param {string} message - Custom error message
 * @returns {ApiError} New ApiError instance with 401 status
 */
export const unauthorized = (message = 'Unauthorized') => {
  return createError(StatusCodes.UNAUTHORIZED, message);
};

/**
 * Creates a 403 Forbidden error
 * @param {string} message - Custom error message
 * @returns {ApiError} New ApiError instance with 403 status
 */
export const forbidden = (message = 'Forbidden') => {
  return createError(StatusCodes.FORBIDDEN, message);
};

/**
 * Creates a 400 Bad Request error
 * @param {string} message - Custom error message
 * @param {Array} errors - Array of error details
 * @returns {ApiError} New ApiError instance with 400 status
 */
export const badRequest = (message = 'Bad Request', errors = []) => {
  return createError(StatusCodes.BAD_REQUEST, message, errors);
};
