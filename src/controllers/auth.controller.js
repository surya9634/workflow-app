import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import config from '../config/config.js';
import { createError } from '../utils/error.js';

// Mock database - replace with actual database calls
const users = [];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Sign up a new user
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return next(createError(StatusCodes.CONFLICT, 'Email already in use'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save user to database (in-memory for now)
    users.push(newUser);

    // Generate tokens
    const token = generateToken(newUser.id);
    const refreshToken = jwt.sign({ userId: newUser.id }, config.jwt.secret, {
      expiresIn: '30d',
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Sign in a user
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = users.find(u => u.email === email);
    if (!user) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Invalid credentials'));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(createError(StatusCodes.FORBIDDEN, 'Account is deactivated'));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Invalid credentials'));
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: '30d',
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Update last login
    user.lastLogin = new Date().toISOString();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
export const refreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(createError(StatusCodes.BAD_REQUEST, 'Refresh token is required'));
    }

    // Verify refresh token
    jwt.verify(refreshToken, config.jwt.secret, (err, decoded) => {
      if (err) {
        return next(createError(StatusCodes.FORBIDDEN, 'Invalid refresh token'));
      }

      // Generate new access token
      const token = generateToken(decoded.userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          token,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = (req, res, next) => {
  // Implementation for forgot password
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    success: false,
    message: 'Forgot password functionality not implemented yet',
  });
};

// Reset password
export const resetPassword = (req, res, next) => {
  // Implementation for reset password
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    success: false,
    message: 'Reset password functionality not implemented yet',
  });
};

// Sign out
export const signout = (req, res) => {
  // In a real app, you might want to blacklist the token
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Successfully logged out',
  });
};

// Social authentication - Facebook
export const facebookLogin = (req, res) => {
  // Implementation for Facebook login
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    success: false,
    message: 'Facebook login not implemented yet',
  });
};

export const facebookCallback = (req, res) => {
  // Implementation for Facebook callback
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    success: false,
    message: 'Facebook callback not implemented yet',
  });
};

// Social authentication - Google
export const googleLogin = (req, res) => {
  // Implementation for Google login
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    success: false,
    message: 'Google login not implemented yet',
  });
};

export const googleCallback = (req, res) => {
  // Implementation for Google callback
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    success: false,
    message: 'Google callback not implemented yet',
  });
};
