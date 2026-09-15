const Meeting = require('../models/Meeting');
const User    = require('../models/User');
const { createNotification } = require('./notificationController');
const {
  sendMeetingInviteEmail,
  sendMeetingCancelEmail,
  sendMeetingUpdateEmail,
} = require('../config/email');

// ── Helper: send invite emails to all participants ────────────────────────────
async function dispatchInvites(meeting, populatedParticipants) {
  const createdByUser = await User.findById(meeting.createdBy).lean();
  const creatorName   = createdByUser?.name || 'Legal Professional';

  const jitsiLink = `https://meet.jit.si/legalassistant-${meeting.roomId}`;
  const meetingData = {
    _id:          meeting._id,
    title:        meeting.title,
    description:  meeting.description,
    agenda:       meeting.agenda,
    scheduledAt:  meeting.scheduledAt,
    duration:     meeting.duration,
    platform:     meeting.platform,
    jitsiLink,
    meetingLink:  meeting.meetingLink || jitsiLink,
    caseNumber:   meeting.caseNumber,
    createdByName: creatorName,
    participants:  populatedParticipants.map(p => ({
      name: p.user?.name || 'Participant',
      role: p.role,
    })),
  };

  const emailPromises = populatedParticipants.map(async (p) => {
    if (!p.user?.email) return;
    try {
      await sendMeetingInviteEmail(p.user.email, p.user.name, p.role, meetingData);
    } catch (err) {
      console.error(`[Meeting] Email failed for ${p.user.email}:`, err.message);
    }
    try {
      await createNotification(
        p.user._id,
        'info',
        '📅 Meeting Invitation',
        `You have been invited to: "${meeting.title}" on ${new Date(meeting.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        { actionUrl: `/meetings/${meeting._id}`, priority: 'high' }
      );
    } catch {}
  });

  await Promise.allSettled(emailPromises);
}

// ── Populate participants with user details ────────────────────────────────────
async function populateParticipants(meeting) {
  const populated = [];
  for (const p of meeting.participants) {
    const user = await User.findById(p.user).select('name email role').lean();
    populated.push({ ...p.toObject(), user });
  }
  return populated;
}

// ── POST /api/meetings — Create meeting (Judge/Lawyer only) ───────────────────
const createMeeting = async (req, res) => {
  try {
    const {
      title, description, agenda, caseId, caseNumber,
      scheduledAt, duration, platform, meetingLink,
      participantIds,   // array of user _id strings
      timezone,
    } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({ error: 'Title and scheduled date/time are required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Resolve participant users
    const ids = Array.isArray(participantIds) ? participantIds : [];
    const uniqueIds = [...new Set([...ids, req.user._id.toString()])];
    const users = await User.find({ _id: { $in: uniqueIds }, isActive: true })
                            .select('name email role')
                            .lean();

    const participants = users.map(u => ({
      user:   u._id,
      role:   u.role,
      status: u._id.toString() === req.user._id.toString() ? 'accepted' : 'invited',
    }));

    const meeting = new Meeting({
      title: title.trim(),
      description: description?.trim(),
      agenda: agenda?.trim(),
      caseId: caseId || null,
      caseNumber: caseNumber?.trim() || '',
      scheduledAt: scheduledDate,
      duration: duration || 60,
      platform: platform || 'jitsi',
      meetingLink: meetingLink?.trim() || '',
      timezone: timezone || 'Asia/Kolkata',
      createdBy: req.user._id,
      participants,
    });

    await meeting.save();

    // Send invites in background
    const populatedPs = await populateParticipants(meeting);
    dispatchInvites(meeting, populatedPs).catch(err =>
      console.error('[Meeting] Invite dispatch error:', err.message)
    );

    await meeting.updateOne({ invitesSent: true, lastInviteSent: new Date() });

    const populated = await Meeting.findById(meeting._id)
      .populate('createdBy', 'name email role')
      .populate('participants.user', 'name email role')
      .lean();

    res.status(201).json({ meeting: { ...populated, jitsiLink: meeting.jitsiLink }, message: 'Meeting created and invitations sent' });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: error.message || 'Failed to create meeting' });
  }
};

// ── GET /api/meetings — List meetings for current user ────────────────────────
const getMeetings = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const query = {
      isDeleted: false,
      $or: [
        { createdBy: req.user._id },
        { 'participants.user': req.user._id },
      ],
    };
    if (status)   query.status = status;
    if (upcoming === 'true') {
      query.scheduledAt = { $gte: new Date() };
      query.status = { $in: ['Scheduled', 'Active'] };
    }

    const meetings = await Meeting.find(query)
      .populate('createdBy', 'name email role')
      .populate('participants.user', 'name email role')
      .sort({ scheduledAt: 1 })
      .lean();

    // Attach virtual jitsiLink
    const withLinks = meetings.map(m => ({
      ...m,
      jitsiLink: `https://meet.jit.si/legalassistant-${m.roomId}`,
    }));

    res.json({ meetings: withLinks, total: withLinks.length });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch meetings' });
  }
};

// ── GET /api/meetings/:id — Single meeting ────────────────────────────────────
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { createdBy: req.user._id },
        { 'participants.user': req.user._id },
      ],
    })
      .populate('createdBy', 'name email role')
      .populate('participants.user', 'name email role')
      .lean();

    if (!meeting) return res.status(404).json({ error: 'Meeting not found or access denied' });

    res.json({
      meeting: {
        ...meeting,
        jitsiLink: `https://meet.jit.si/legalassistant-${meeting.roomId}`,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch meeting' });
  }
};

// ── PUT /api/meetings/:id — Update meeting (creator only) ─────────────────────
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id,
    }).populate('participants.user', 'name email role');

    if (!meeting) return res.status(404).json({ error: 'Meeting not found or not authorised' });
    if (meeting.status === 'Completed' || meeting.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot update a completed or cancelled meeting' });
    }

    const changedFields = [];
    const allowed = ['title', 'description', 'agenda', 'scheduledAt', 'duration', 'platform', 'meetingLink', 'timezone'];
    for (const field of allowed) {
      if (req.body[field] !== undefined && String(meeting[field]) !== String(req.body[field])) {
        if (field === 'scheduledAt') changedFields.push(`Date/Time changed to: ${new Date(req.body[field]).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        else changedFields.push(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
        meeting[field] = req.body[field];
      }
    }

    // Add new participants
    if (Array.isArray(req.body.addParticipantIds)) {
      const newUsers = await User.find({ _id: { $in: req.body.addParticipantIds }, isActive: true }).lean();
      for (const u of newUsers) {
        const alreadyIn = meeting.participants.some(p => p.user._id.toString() === u._id.toString());
        if (!alreadyIn) {
          meeting.participants.push({ user: u._id, role: u.role, status: 'invited' });
          changedFields.push(`${u.name} added as participant`);
        }
      }
    }

    await meeting.save();

    if (changedFields.length > 0) {
      // Notify & email all participants
      const populatedPs = await populateParticipants(meeting);
      for (const p of populatedPs) {
        if (!p.user?.email) continue;
        try { await sendMeetingUpdateEmail(p.user.email, p.user.name, meeting, changedFields); } catch {}
        try {
          await createNotification(p.user._id, 'info', '🔄 Meeting Updated',
            `Meeting "${meeting.title}" has been updated.`,
            { actionUrl: `/meetings/${meeting._id}` });
        } catch {}
      }
    }

    res.json({ meeting, changedFields, message: 'Meeting updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update meeting' });
  }
};

// ── DELETE /api/meetings/:id — Cancel meeting ─────────────────────────────────
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id,
    }).populate('participants.user', 'name email role');

    if (!meeting) return res.status(404).json({ error: 'Meeting not found or not authorised' });

    meeting.status    = 'Cancelled';
    meeting.isDeleted = true;
    await meeting.save();

    // Send cancellation emails
    const populatedPs = await populateParticipants(meeting);
    for (const p of populatedPs) {
      if (!p.user?.email) continue;
      try { await sendMeetingCancelEmail(p.user.email, p.user.name, { ...meeting.toObject(), cancelReason: req.body.reason }); } catch {}
      try {
        await createNotification(p.user._id, 'warning', '❌ Meeting Cancelled',
          `Meeting "${meeting.title}" has been cancelled.`,
          { priority: 'high' });
      } catch {}
    }

    res.json({ message: 'Meeting cancelled and participants notified' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to cancel meeting' });
  }
};

// ── POST /api/meetings/:id/join — Get join link ───────────────────────────────
const joinMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { createdBy: req.user._id },
        { 'participants.user': req.user._id },
      ],
    });

    if (!meeting) return res.status(404).json({ error: 'Meeting not found or access denied' });
    if (meeting.status === 'Cancelled') return res.status(400).json({ error: 'This meeting has been cancelled' });

    // Update participant status to attended if joining for first time
    const participantIdx = meeting.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );
    if (participantIdx >= 0) {
      meeting.participants[participantIdx].status   = 'accepted';
      meeting.participants[participantIdx].joinedAt = new Date();
    }
    if (meeting.status === 'Scheduled') {
      const now = new Date();
      const scheduled = new Date(meeting.scheduledAt);
      const diffMins = (scheduled - now) / 60000;
      if (diffMins <= 15) meeting.status = 'Active'; // mark active 15 mins before
    }
    await meeting.save();

    const jitsiLink = `https://meet.jit.si/legalassistant-${meeting.roomId}`;
    const joinLink  = meeting.platform === 'jitsi' ? jitsiLink : (meeting.meetingLink || jitsiLink);

    res.json({
      joinLink,
      jitsiLink,
      roomId:   meeting.roomId,
      platform: meeting.platform,
      meetingId: meeting._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to join meeting' });
  }
};

// ── PUT /api/meetings/:id/participants/:userId — Accept / Decline ──────────────
const updateParticipantStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' | 'declined'
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined' });
    }

    const meeting = await Meeting.findOne({ _id: req.params.id, isDeleted: false });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const idx = meeting.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );
    if (idx === -1) return res.status(403).json({ error: 'You are not a participant in this meeting' });

    meeting.participants[idx].status = status;
    await meeting.save();

    // Notify creator
    if (status === 'declined') {
      try {
        await createNotification(meeting.createdBy, 'warning',
          `Participant declined meeting`,
          `${req.user.name} has declined the meeting "${meeting.title}"`,
          { actionUrl: `/meetings/${meeting._id}` });
      } catch {}
    }

    res.json({ message: `Meeting ${status} successfully`, status });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update status' });
  }
};

// ── POST /api/meetings/:id/resend-invites — Resend emails ─────────────────────
const resendInvites = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id,
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found or not authorised' });
    const populatedPs = await populateParticipants(meeting);
    await dispatchInvites(meeting, populatedPs);
    await meeting.updateOne({ lastInviteSent: new Date() });
    res.json({ message: `Invitations resent to ${populatedPs.length} participants` });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to resend invites' });
  }
};

// ── GET /api/meetings/users/search — Search users to invite ───────────────────
const searchUsers = async (req, res) => {
  try {
    const { q, role } = req.query;
    const filter = { isActive: true, _id: { $ne: req.user._id } };
    if (role) filter.role = role;
    if (q) filter.$or = [
      { name:  { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
    const users = await User.find(filter).select('name email role').limit(20).lean();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to search users' });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  updateParticipantStatus,
  resendInvites,
  searchUsers,
};
