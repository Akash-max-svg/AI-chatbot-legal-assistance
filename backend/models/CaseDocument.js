const mongoose = require('mongoose');

const caseDocumentSchema = new mongoose.Schema({
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  uploadedBy: {
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
    enum: ['Petition', 'Response', 'Evidence', 'Affidavit', 'Judgment', 'Notice', 'Order', 'Other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  extractedText: {
    type: String
  },
  summary: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CaseDocument', caseDocumentSchema);
