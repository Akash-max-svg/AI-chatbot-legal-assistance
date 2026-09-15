const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const participantSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:   { type: String, enum: ['Judge', 'Lawyer', 'Citizen', 'Admin'], required: true },
  status: { type: String, enum: ['invited', 'accepted', 'declined', 'attended'], default: 'invited' },
  joinedAt: Date,
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  agenda:      { type: String, trim: true, maxlength: 2000 },

  // Linked case (optional)
  caseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
  caseNumber:  { type: String, default: '' },

  // Scheduling
  scheduledAt: { type: Date, required: true },
  duration:    { type: Number, default: 60, min: 15, max: 480 }, // minutes
  timezone:    { type: String, default: 'Asia/Kolkata' },

  // Meeting room
  roomId:      { type: String, default: () => uuidv4(), unique: true },
  meetingLink: { type: String, default: '' }, // external link (Google Meet / Zoom)
  platform:    {
    type: String,
    enum: ['jitsi', 'google-meet', 'zoom', 'teams', 'custom'],
    default: 'jitsi',
  },

  // Status lifecycle
  status: {
    type: String,
    enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },

  // Who created it (Judge or Lawyer)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // All participants (including creator)
  participants: [participantSchema],

  // Email invites sent flag
  invitesSent:    { type: Boolean, default: false },
  lastInviteSent: Date,

  // Post-meeting
  minutes:    { type: String, default: '' },  // meeting notes / minutes
  recording:  { type: String, default: '' },  // URL to recording (future)

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// ── Virtuals ──────────────────────────────────────────────────────────────────
meetingSchema.virtual('jitsiLink').get(function () {
  // Jitsi Meet public server — no API key needed
  return `https://meet.jit.si/legalassistant-${this.roomId}`;
});

meetingSchema.virtual('isUpcoming').get(function () {
  return this.status === 'Scheduled' && this.scheduledAt > new Date();
});

meetingSchema.virtual('isPast').get(function () {
  return this.status === 'Completed' || this.scheduledAt < new Date();
});

meetingSchema.set('toJSON', { virtuals: true });
meetingSchema.set('toObject', { virtuals: true });

// ── Indexes ───────────────────────────────────────────────────────────────────
meetingSchema.index({ createdBy: 1, scheduledAt: -1 });
meetingSchema.index({ 'participants.user': 1, scheduledAt: -1 });
meetingSchema.index({ roomId: 1 }, { unique: true });
meetingSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
