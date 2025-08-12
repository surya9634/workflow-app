import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { createError } from '../utils/error.js';
import config from '../config/config.js';

/**
 * Middleware to authenticate requests using JWT
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'No token provided'));
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'No token provided'));
    }

    // Verify token
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(createError(StatusCodes.UNAUTHORIZED, 'Token expired'));
        }
        return next(createError(StatusCodes.UNAUTHORIZED, 'Invalid token'));
      }

      // Add user ID to request object
      req.userId = decoded.userId;
      next();
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required roles
 * @param {...string} roles - Roles that are allowed to access the route
 * @returns {import('express').RequestHandler} Express middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // This is a placeholder - in a real app, you would check the user's roles
    // against the required roles passed to this middleware
    // For now, we'll just check if the user is authenticated
    if (!req.userId) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Not authorized to access this route'));
    }
    
    // In a real app, you would do something like:
    // if (!roles.includes(req.user.role)) {
    //   return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to access this route'));
    // }
    
    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource
 * @param {string} resourceIdParam - Name of the parameter containing the resource ID
 * @returns {import('express').RequestHandler} Express middleware function
 */
export const isOwner = (resourceIdParam) => {
  return (req, res, next) => {
    // This is a placeholder - in a real app, you would check if the user ID
    // from the token matches the user ID associated with the resource
    // For now, we'll just check if the user is authenticated
    if (!req.userId) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Not authorized to access this resource'));
    }
    
    // In a real app, you would do something like:
    // const resource = await Resource.findById(req.params[resourceIdParam]);
    // if (!resource) {
    //   return next(createError(StatusCodes.NOT_FOUND, 'Resource not found'));
    // }
    // if (resource.userId.toString() !== req.userId) {
    //   return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to access this resource'));
    // }
    
    next();
  };
};
