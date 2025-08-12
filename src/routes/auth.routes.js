import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Validation rules for signup
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

// Validation rules for signin
const signinValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/signup', signupValidation, validateRequest, authController.signup);
router.post('/signin', signinValidation, validateRequest, authController.signin);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/signout', authController.signout);

// Social authentication routes
router.get('/facebook', authController.facebookLogin);
router.get('/facebook/callback', authController.facebookCallback);
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

export default router;
