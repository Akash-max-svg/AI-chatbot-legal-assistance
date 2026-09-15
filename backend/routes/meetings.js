const express = require('express');
const router  = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  updateParticipantStatus,
  resendInvites,
  searchUsers,
} = require('../controllers/meetingController');

// Search users to invite (all authenticated users)
router.get('/users/search', auth, searchUsers);

// Create a meeting — only Judge or Lawyer can schedule
router.post('/', auth, requireRole('Judge', 'Lawyer', 'Admin'), createMeeting);

// List meetings for current user
router.get('/', auth, getMeetings);

// Get single meeting
router.get('/:id', auth, getMeeting);

// Update meeting (creator only — controller enforces ownership)
router.put('/:id', auth, updateMeeting);

// Cancel meeting (creator only)
router.delete('/:id', auth, deleteMeeting);

// Join meeting — get the join link
router.post('/:id/join', auth, joinMeeting);

// Accept / Decline invitation
router.put('/:id/participants/:userId', auth, updateParticipantStatus);

// Resend invitations (creator only)
router.post('/:id/resend-invites', auth, requireRole('Judge', 'Lawyer', 'Admin'), resendInvites);

module.exports = router;
