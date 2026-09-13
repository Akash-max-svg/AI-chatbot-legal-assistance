const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const chatMessageSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  structured: {
    relevantActs: [String],
    relevantSections: [String],
    legalRights: [String],
    filingProcedure: [String],
    requiredDocuments: [String],
    courtToApproach: String,
    governmentDepartment: String,
    estimatedTimeline: String,
    suggestedNextSteps: [String],
    mediationPossibility: String,
    recommendations: {
      relatedActs: [String],
      relatedSections: [String],
      relatedLegalTopics: [String],
      relatedCourtProcedures: [String]
    },
    disclaimer: String
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

module.exports = {
  ChatSession: mongoose.model('ChatSession', chatSessionSchema),
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema)
};
