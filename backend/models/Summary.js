const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentTitle: {
    type: String,
    required: true
  },
  originalFileUrl: {
    type: String
  },
  originalFileName: {
    type: String
  },
  extractedText: {
    type: String
  },
  caseTitle: {
    type: String
  },
  court: {
    type: String
  },
  date: {
    type: String
  },
  summary: {
    facts: String,
    issues: String,
    arguments: String,
    evidence: String,
    reasoning: String,
    applicableLaws: [String],
    courtDecision: String,
    judgmentOutcome: String,
    importantCitations: [String]
  },
  structured: [{
    heading: String,
    content: String
  }],
  recommendations: {
    relatedActs: [String],
    relatedSections: [String],
    relatedLegalTopics: [String],
    relatedCourtProcedures: [String]
  },
  processingTime: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Summary', summarySchema);
