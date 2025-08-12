import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.js';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get current user's profile
router.get('/me', userController.getCurrentUser);

// Update current user's profile
router.put(
  '/me',
  [
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
  ],
  validateRequest,
  userController.updateCurrentUser
);

// Delete current user's account
router.delete('/me', userController.deleteCurrentUser);

// Change password
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
  ],
  validateRequest,
  userController.changePassword
);

export default router;
