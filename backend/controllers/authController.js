const { body, validationResult } = require('express-validator');
const authService = require('../services/documentService');
const { authLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');

async function register(req, res) {
  try {
    const { email, password, name, role, phone } = req.body;

    const result = await authService.registerUser({
      email,
      password,
      name,
      role,
      phone
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification.',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    const result = await authService.loginUser(email, password, rememberMe);

    res.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
}

async function logout(req, res) {
  try {
    const token = req.body.refreshToken || req.token;
    await authService.logoutUser(req.user._id, token);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.json({
      message: 'Password reset successfully',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    res.json({
      message: 'Password changed successfully',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function getMe(req, res) {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
}

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  getMe
};
