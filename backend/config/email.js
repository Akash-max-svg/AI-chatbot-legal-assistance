const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'AI Legal Assistant <noreply@legalassistant.com>',
    to: email,
    subject: 'Password Reset - AI Legal Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You have requested to reset your password for your AI Legal Assistant account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #c9a227; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>AI Legal Assistant Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, verificationToken, userName) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'AI Legal Assistant <noreply@legalassistant.com>',
    to: email,
    subject: 'Verify Your Email - AI Legal Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Email Verification</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with AI Legal Assistant.</p>
        <p>Click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; background: #c9a227; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>AI Legal Assistant Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail
};
