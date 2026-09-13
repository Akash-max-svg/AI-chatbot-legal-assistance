const { supportedLanguages } = require('../services/aiService');

function getLanguages(req, res) {
  res.json({ languages: supportedLanguages });
}

module.exports = { getLanguages };
