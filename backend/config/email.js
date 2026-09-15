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

// ── Video Conference Meeting Invite ───────────────────────────────────────────
const ROLE_ICONS = { Judge: '⚖️', Lawyer: '👨‍⚖️', Citizen: '👤', Admin: '🛡️' };

const formatMeetingDate = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) + ' IST';
};

/**
 * Send meeting invitation email
 * @param {string} toEmail
 * @param {string} toName
 * @param {string} toRole
 * @param {object} meeting  — { _id, title, description, agenda, scheduledAt, duration, jitsiLink, meetingLink, platform, caseNumber, createdByName, participants[] }
 */
const sendMeetingInviteEmail = async (toEmail, toName, toRole, meeting) => {
  const transporter = createTransporter();
  const joinUrl = meeting.platform === 'jitsi'
    ? meeting.jitsiLink
    : (meeting.meetingLink || meeting.jitsiLink);
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/meetings`;
  const meetingUrl   = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/meetings/${meeting._id}`;

  const participantList = (meeting.participants || [])
    .map(p => `<li style="padding:4px 0;color:#d1d5db;">${ROLE_ICONS[p.role] || '👤'} ${p.name || 'Participant'} <span style="color:#9ca3af;font-size:12px;">(${p.role})</span></li>`)
    .join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || 'AI Legal Assistant <noreply@legalassistant.com>',
    to: toEmail,
    subject: `📅 Meeting Invitation: ${meeting.title} — AI Legal Assistant`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0d1426;border:1px solid #1e2d4a;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d1426 0%,#1a2540 100%);padding:32px 32px 24px;border-bottom:2px solid #c9a227;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#c9a227,#e4b94a);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;">⚖️</div>
        <div>
          <h1 style="margin:0;color:#c9a227;font-size:18px;font-weight:700;">AI Legal Assistant</h1>
          <p style="margin:0;color:#6b7280;font-size:12px;">Indian E-Courts Platform</p>
        </div>
      </div>
      <h2 style="margin:0;color:#f9fafb;font-size:22px;font-weight:700;">📅 Video Conference Invitation</h2>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">You have been invited to a legal video conference meeting.</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#d1d5db;font-size:15px;margin:0 0 24px;">Hello <strong style="color:#c9a227;">${ROLE_ICONS[toRole] || '👤'} ${toName}</strong>,</p>

      <!-- Meeting Card -->
      <div style="background:#111827;border:1px solid #1f2d44;border-left:4px solid #c9a227;border-radius:8px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 16px;color:#f9fafb;font-size:18px;">${meeting.title}</h3>
        ${meeting.caseNumber ? `<p style="margin:0 0 12px;color:#6b7280;font-size:13px;">📁 Case: <span style="color:#c9a227;">${meeting.caseNumber}</span></p>` : ''}
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%;">📅 Date &amp; Time</td>
            <td style="padding:8px 0;color:#d1d5db;font-size:13px;font-weight:600;">${formatMeetingDate(meeting.scheduledAt)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">⏱️ Duration</td>
            <td style="padding:8px 0;color:#d1d5db;font-size:13px;">${meeting.duration || 60} minutes</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">📹 Platform</td>
            <td style="padding:8px 0;color:#d1d5db;font-size:13px;text-transform:capitalize;">${meeting.platform || 'Jitsi Meet'}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">👤 Organised by</td>
            <td style="padding:8px 0;color:#d1d5db;font-size:13px;">${meeting.createdByName || 'Legal Professional'}</td>
          </tr>
        </table>
        ${meeting.description ? `<p style="margin:16px 0 0;color:#9ca3af;font-size:13px;line-height:1.6;border-top:1px solid #1f2d44;padding-top:12px;">${meeting.description}</p>` : ''}
        ${meeting.agenda ? `<div style="margin-top:12px;padding:12px;background:#0d1426;border-radius:6px;"><p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Agenda</p><p style="margin:0;color:#d1d5db;font-size:13px;line-height:1.6;">${meeting.agenda}</p></div>` : ''}
      </div>

      <!-- Participants -->
      ${participantList ? `
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 10px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Participants</p>
        <ul style="margin:0;padding:0 0 0 16px;list-style:none;">${participantList}</ul>
      </div>` : ''}

      <!-- Join Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${joinUrl}" target="_blank"
           style="display:inline-block;background:linear-gradient(135deg,#c9a227,#e4b94a);color:#0a0f1e;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.5px;">
          📹 Join Meeting
        </a>
      </div>

      <!-- View in App -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${meetingUrl}"
           style="display:inline-block;background:transparent;color:#c9a227;padding:10px 24px;text-decoration:none;border:1px solid #c9a227;border-radius:8px;font-size:14px;">
          View Meeting Details →
        </a>
      </div>

      <!-- Meeting Link text -->
      <div style="background:#0d1426;border:1px solid #1f2d44;border-radius:6px;padding:12px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Meeting Link (copy &amp; paste if button doesn't work):</p>
        <p style="margin:0;color:#60a5fa;font-size:12px;word-break:break-all;">${joinUrl}</p>
      </div>

      <!-- Accept / Decline note -->
      <div style="background:#111827;border:1px solid #1f2d44;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#9ca3af;font-size:13px;">Please log in to your dashboard to <strong style="color:#22c55e;">✓ Accept</strong> or <strong style="color:#ef4444;">✕ Decline</strong> this invitation.</p>
        <a href="${dashboardUrl}" style="display:inline-block;margin-top:8px;color:#c9a227;font-size:13px;">Go to Meetings Dashboard →</a>
      </div>

      <!-- Instructions -->
      <div style="margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">How to Join</p>
        <ol style="margin:0;padding-left:20px;color:#9ca3af;font-size:13px;line-height:2;">
          <li>Click the <strong style="color:#c9a227;">Join Meeting</strong> button above at the scheduled time</li>
          <li>Allow camera and microphone access when prompted</li>
          <li>Enter your name as shown in your profile</li>
          <li>Wait for the host to admit you into the meeting</li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#060c18;padding:20px 32px;border-top:1px solid #1e2d4a;text-align:center;">
      <p style="margin:0 0 4px;color:#374151;font-size:12px;">AI Legal Assistant — Indian E-Courts Platform</p>
      <p style="margin:0;color:#374151;font-size:11px;">This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
  };

  await transporter.sendMail(mailOptions);
};

// ── Meeting Cancellation Email ────────────────────────────────────────────────
const sendMeetingCancelEmail = async (toEmail, toName, meeting) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || 'AI Legal Assistant <noreply@legalassistant.com>',
    to: toEmail,
    subject: `❌ Meeting Cancelled: ${meeting.title} — AI Legal Assistant`,
    html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1426;border:1px solid #1e2d4a;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#0d1426,#1a2540);padding:28px 32px;border-bottom:2px solid #ef4444;">
    <h2 style="margin:0;color:#ef4444;font-size:20px;">❌ Meeting Cancelled</h2>
  </div>
  <div style="padding:28px 32px;">
    <p style="color:#d1d5db;font-size:15px;">Hello <strong style="color:#c9a227;">${toName}</strong>,</p>
    <p style="color:#9ca3af;">The following meeting has been <strong style="color:#ef4444;">cancelled</strong>:</p>
    <div style="background:#111827;border:1px solid #1f2d44;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;">
      <h3 style="margin:0 0 8px;color:#f9fafb;">${meeting.title}</h3>
      <p style="margin:0;color:#6b7280;font-size:13px;">Scheduled: ${formatMeetingDate(meeting.scheduledAt)}</p>
    </div>
    ${meeting.cancelReason ? `<p style="color:#9ca3af;font-size:13px;"><strong>Reason:</strong> ${meeting.cancelReason}</p>` : ''}
    <p style="color:#6b7280;font-size:13px;">If you have questions, please contact the meeting organiser.</p>
  </div>
  <div style="background:#060c18;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#374151;font-size:11px;">AI Legal Assistant — Automated Notification</p>
  </div>
</div>`,
  };
  await transporter.sendMail(mailOptions);
};

// ── Meeting Update Email ──────────────────────────────────────────────────────
const sendMeetingUpdateEmail = async (toEmail, toName, meeting, changedFields) => {
  const transporter = createTransporter();
  const joinUrl = meeting.platform === 'jitsi' ? meeting.jitsiLink : (meeting.meetingLink || meeting.jitsiLink);
  const changes = changedFields.map(f => `<li style="color:#d1d5db;padding:3px 0;">${f}</li>`).join('');
  const mailOptions = {
    from: process.env.SMTP_FROM || 'AI Legal Assistant <noreply@legalassistant.com>',
    to: toEmail,
    subject: `🔄 Meeting Updated: ${meeting.title} — AI Legal Assistant`,
    html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1426;border:1px solid #1e2d4a;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#0d1426,#1a2540);padding:28px 32px;border-bottom:2px solid #3b82f6;">
    <h2 style="margin:0;color:#3b82f6;font-size:20px;">🔄 Meeting Updated</h2>
  </div>
  <div style="padding:28px 32px;">
    <p style="color:#d1d5db;font-size:15px;">Hello <strong style="color:#c9a227;">${toName}</strong>,</p>
    <p style="color:#9ca3af;">The meeting <strong style="color:#f9fafb;">${meeting.title}</strong> has been updated.</p>
    <div style="background:#111827;border:1px solid #1f2d44;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;">What changed:</p>
      <ul style="margin:0;padding-left:16px;">${changes}</ul>
    </div>
    <div style="margin:0 0 8px;color:#9ca3af;font-size:13px;">
      <strong>New Date/Time:</strong> ${formatMeetingDate(meeting.scheduledAt)}<br>
      <strong>Duration:</strong> ${meeting.duration} minutes
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="${joinUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#c9a227,#e4b94a);color:#0a0f1e;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;">Join Updated Meeting</a>
    </div>
  </div>
  <div style="background:#060c18;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#374151;font-size:11px;">AI Legal Assistant — Automated Notification</p>
  </div>
</div>`,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendMeetingInviteEmail,
  sendMeetingCancelEmail,
  sendMeetingUpdateEmail,
};
