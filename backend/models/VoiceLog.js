const mongoose = require('mongoose');

const voiceLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    default: 'en-IN'
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String
  },
  wasSpoken: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number
  },
  confidence: {
    type: Number
  },
  success: {
    type: Boolean,
    default: true
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VoiceLog', voiceLogSchema);
