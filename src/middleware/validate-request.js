import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { createError } from '../utils/error.js';

/**
 * Middleware to validate request data against validation rules
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
    }));
    
    return next(createError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      'Validation failed',
      errorMessages
    ));
  }
  
  next();
};

/**
 * Middleware to validate required parameters
 * @param {string[]} params - Array of required parameter names
 * @returns {import('express').RequestHandler} Express middleware function
 */
export const requireParams = (params = []) => {
  return (req, res, next) => {
    const missingParams = [];
    
    params.forEach(param => {
      if (!(param in req.body)) {
        missingParams.push(param);
      }
    });
    
    if (missingParams.length > 0) {
      return next(createError(
        StatusCodes.BAD_REQUEST,
        `Missing required parameters: ${missingParams.join(', ')}`
      ));
    }
    
    next();
  };
};

/**
 * Middleware to validate required query parameters
 * @param {string[]} params - Array of required query parameter names
 * @returns {import('express').RequestHandler} Express middleware function
 */
export const requireQueryParams = (params = []) => {
  return (req, res, next) => {
    const missingParams = [];
    
    params.forEach(param => {
      if (!(param in req.query)) {
        missingParams.push(param);
      }
    });
    
    if (missingParams.length > 0) {
      return next(createError(
        StatusCodes.BAD_REQUEST,
        `Missing required query parameters: ${missingParams.join(', ')}`
      ));
    }
    
    next();
  };
};
