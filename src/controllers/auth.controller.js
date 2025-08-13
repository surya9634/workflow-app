import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
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
export const googleLogin = async (req, res) => {
  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.API_BASE_URL || 'http://localhost:5000'}/auth/google/callback`
    );

    // Generate the URL for Google's OAuth 2.0 server
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });

    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Google login error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error initiating Google authentication'
    });
  }
};

// Handle Google OAuth callback
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.API_BASE_URL || 'http://localhost:5000'}/auth/google/callback`
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user in your database
    let user = users.find(u => u.googleId === googleId || u.email === email);
    
    if (!user) {
      // Create new user
      user = {
        id: Date.now().toString(),
        googleId,
        email,
        name,
        avatar: picture,
        password: null, // No password for Google-authenticated users
        role: 'user',
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(user);
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.updatedAt = new Date().toISOString();
    }

    // Generate JWT token
    const token = generateToken(user.id);
    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: '30d',
    });

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    // Redirect to frontend with tokens
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('user', JSON.stringify(userWithoutPassword));

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google callback error:', error);
    
    // Redirect to frontend with error
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000/login');
    redirectUrl.searchParams.set('error', 'google_auth_failed');
    
    res.redirect(redirectUrl.toString());
  }
};

// Handle Google credential-based sign-in
export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return next(createError(StatusCodes.BAD_REQUEST, 'Credential is required'));
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user in your database
    let user = users.find(u => u.googleId === googleId || u.email === email);
    
    if (!user) {
      // Create new user
      user = {
        id: Date.now().toString(),
        googleId,
        email,
        name,
        avatar: picture,
        password: null, // No password for Google-authenticated users
        role: 'user',
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(user);
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.updatedAt = new Date().toISOString();
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: '30d',
    });

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    next(createError(StatusCodes.UNAUTHORIZED, 'Google authentication failed'));
  }
};
