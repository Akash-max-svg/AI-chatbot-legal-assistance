const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'bug', 'feature-request', 'complaint', 'suggestion', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  category: {
    type: String,
    enum: ['chatbot', 'voice-assistant', 'document-summarizer', 'case-filing', 'knowledge-base', 'general', 'other']
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  response: {
    message: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  attachments: [{
    url: String,
    name: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
