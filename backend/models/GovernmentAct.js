const mongoose = require('mongoose');

const governmentActSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  shortTitle: {
    type: String
  },
  year: {
    type: Number
  },
  ministry: {
    type: String
  },
  category: {
    type: String,
    enum: ['Central', 'State', 'Constitutional', 'Other']
  },
  description: {
    type: String
  },
  fullText: {
    type: String
  },
  sections: [{
    number: String,
    title: String,
    content: String
  }],
  amendments: [{
    year: Number,
    description: String,
    actNumber: String
  }],
  schedules: [String],
  effectiveDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  officialUrl: {
    type: String
  },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('GovernmentAct', governmentActSchema);
