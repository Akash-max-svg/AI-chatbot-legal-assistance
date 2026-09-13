const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
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
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['Document', 'Image', 'Video', 'Audio', 'Physical', 'Digital', 'Witness Statement', 'Other'],
    required: true
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
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
  dateCollected: {
    type: Date
  },
  source: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationNotes: {
    type: String
  },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Evidence', evidenceSchema);
