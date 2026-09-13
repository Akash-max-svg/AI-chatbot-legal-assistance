const VoiceLog = require('../models/VoiceLog');
const legalAI = require('../services/legalAIService');
const ai = require('../services/aiService');

async function processVoiceQuery(req, res) {
  try {
    const { query, language, sessionId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Detect language if not provided
    const detectedLanguage = language || await ai.detectLanguage(query);
    const langCode = detectedLanguage.split('-')[0];

    const startTime = Date.now();

    // Process with AI
    const aiResponse = await legalAI.processChatQuery(query, langCode, []);

    const processingTime = Date.now() - startTime;

    // Log voice interaction
    const voiceLog = new VoiceLog({
      user: req.user._id,
      language: language || 'en-IN',
      query,
      response: aiResponse.answer,
      wasSpoken: req.body.speak !== false,
      duration: processingTime,
      success: true
    });
    await voiceLog.save();

    res.json({
      answer: aiResponse.answer,
      structured: aiResponse.structured,
      language: langCode,
      processingTime
    });
  } catch (error) {
    console.error('Voice query error:', error);

    // Log failed attempt
    if (req.user) {
      const voiceLog = new VoiceLog({
        user: req.user._id,
        language: req.body.language || 'en-IN',
        query: req.body.query,
        success: false,
        error: error.message
      });
      await voiceLog.save();
    }

    res.status(500).json({ error: error.message || 'Failed to process voice query' });
  }
}

async function getVoiceHistory(req, res) {
  try {
    const logs = await VoiceLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ logs });
  } catch (error) {
    console.error('Get voice history error:', error);
    res.status(500).json({ error: 'Failed to get voice history' });
  }
}

async function detectLanguage(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const language = await ai.detectLanguage(text);

    res.json({ language });
  } catch (error) {
    console.error('Detect language error:', error);
    res.status(500).json({ error: 'Failed to detect language' });
  }
}

module.exports = {
  processVoiceQuery,
  getVoiceHistory,
  detectLanguage
};
