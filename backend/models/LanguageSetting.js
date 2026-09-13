const mongoose = require('mongoose');

const languageSettingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  primaryLanguage: {
    type: String,
    default: 'en'
  },
  secondaryLanguages: [String],
  voiceLanguage: {
    type: String,
    default: 'en-IN'
  },
  textLanguage: {
    type: String,
    default: 'en'
  },
  autoDetectLanguage: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LanguageSetting', languageSettingSchema);
