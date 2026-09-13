const mongoose = require('mongoose');

const judgementSchema = new mongoose.Schema({
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  title: {
    type: String,
    required: true
  },
 citationNumber: {
    type: String,
    unique: true
  },
  court: {
    type: String,
    required: true
  },
  judge: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  caseNumber: {
    type: String
  },
  parties: {
    petitioner: String,
    respondent: String
  },
  category: {
    type: String
  },
  summary: {
    type: String
  },
  fullText: {
    type: String
  },
  importantPoints: [String],
  citedActs: [String],
  citedSections: [String],
  citedCases: [String],
  tags: [String],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Judgement', judgementSchema);
