import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { createError } from '../utils/error.js';

// In-memory storage for users (replace with database in production)
const users = [];

/**
 * Get current user's profile
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const getCurrentUser = (req, res, next) => {
  try {
    // In a real app, you would fetch the user from the database
    const user = users.find(u => u.id === req.userId);
    
    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, 'User not found'));
    }
    
    // Remove sensitive data before sending response
    const { password, ...userWithoutPassword } = user;
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's profile
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateCurrentUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // In a real app, you would update the user in the database
    const userIndex = users.findIndex(u => u.id === req.userId);
    
    if (userIndex === -1) {
      return next(createError(StatusCodes.NOT_FOUND, 'User not found'));
    }
    
    // Check if email is already in use by another user
    if (email && email !== users[userIndex].email) {
      const emailExists = users.some(u => u.email === email && u.id !== req.userId);
      if (emailExists) {
        return next(createError(StatusCodes.CONFLICT, 'Email already in use'));
      }
    }
    
    // Update user
    const updatedUser = {
      ...users[userIndex],
      name: name || users[userIndex].name,
      email: email || users[userIndex].email,
      updatedAt: new Date().toISOString(),
    };
    
    users[userIndex] = updatedUser;
    
    // Remove sensitive data before sending response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete current user's account
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const deleteCurrentUser = async (req, res, next) => {
  try {
    // In a real app, you would soft delete the user in the database
    const userIndex = users.findIndex(u => u.id === req.userId);
    
    if (userIndex === -1) {
      return next(createError(StatusCodes.NOT_FOUND, 'User not found'));
    }
    
    // Remove user from the array
    users.splice(userIndex, 1);
    
    // In a real app, you might want to invalidate the user's token here
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change current user's password
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // In a real app, you would fetch the user from the database
    const userIndex = users.findIndex(u => u.id === req.userId);
    
    if (userIndex === -1) {
      return next(createError(StatusCodes.NOT_FOUND, 'User not found'));
    }
    
    const user = users[userIndex];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect'));
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user's password
    user.password = hashedPassword;
    user.updatedAt = new Date().toISOString();
    
    // In a real app, you would save the updated user to the database
    users[userIndex] = user;
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
