const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../config/email');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

async function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

async function registerUser(userData) {
  const { email, password, name, role, phone } = userData;

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('A user with this email already exists');
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password,
    name,
    role: role || 'Citizen',
    phone,
    verificationToken: crypto.randomBytes(32).toString('hex'),
    verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  await user.save();

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.verificationToken, user.name);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  // Save refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken
  };
}

async function loginUser(email, password, rememberMe = false) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  // Save refresh token (limit to 5 active sessions)
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift();
  }
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30 days or 7 days
  };
}

async function logoutUser(userId, token) {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== token);
    await user.save();
  }
}

async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      throw new Error('Refresh token not found');
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.map(rt =>
      rt.token === refreshToken ? { token: newRefreshToken, createdAt: new Date() } : rt
    );
    await user.save();

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal that user doesn't exist
    return { message: 'If an account exists, a reset email has been sent' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await user.save();

  await sendPasswordResetEmail(user.email, resetToken, user.name);

  return { message: 'If an account exists, a reset email has been sent' };
}

async function resetPassword(token, newPassword) {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Clear all refresh tokens for security
  user.refreshTokens = [];

  await user.save();

  const { accessToken, refreshToken } = await generateTokens(user);
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken
  };
}

async function verifyEmail(token) {
  const user = await User.findOne({
    verificationToken: token,
    verificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;

  await user.save();

  return { message: 'Email verified successfully' };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshTokens = []; // Clear all sessions
  await user.save();

  const { accessToken, refreshToken } = await generateTokens(user);
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken
  };
}

module.exports = {
  generateTokens,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  changePassword
};
