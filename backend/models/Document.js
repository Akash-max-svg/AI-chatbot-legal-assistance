const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['case-filing', 'legal-notice', 'complaint', 'petition', 'affidavit', 'contract', 'agreement', 'other'],
    required: true
  },
  content: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Review', 'Final', 'Filed'],
    default: 'Draft'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  metadata: {
    caseNumber: String,
    court: String,
    date: String,
    parties: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
