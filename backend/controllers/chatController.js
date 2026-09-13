const { ChatSession, ChatMessage } = require('../models/ChatHistory');
const legalAI = require('../services/legalAIService');
const ai = require('../services/aiService');

async function sendMessage(req, res) {
  try {
    const { message, language, sessionId } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Detect language if not provided
    const detectedLanguage = language || await ai.detectLanguage(message);
    const langCode = detectedLanguage.split('-')[0];

    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: userId });
    }

    if (!session) {
      session = new ChatSession({
        user: userId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        language: langCode
      });
      await session.save();
    }

    // Save user message
    const userMsg = new ChatMessage({
      session: session._id,
      role: 'user',
      text: message
    });
    await userMsg.save();

    // Get recent conversation history
    const history = await ChatMessage.find({ session: session._id })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // Process with AI
    const aiResponse = await legalAI.processChatQuery(message, langCode, history);

    // Save AI response
    const aiMsg = new ChatMessage({
      session: session._id,
      role: 'ai',
      text: aiResponse.answer,
      structured: aiResponse.structured
    });
    await aiMsg.save();

    // Update session
    session.lastMessageAt = new Date();
    await session.save();

    res.json({
      sessionId: session._id,
      message: {
        id: aiMsg._id,
        role: 'ai',
        text: aiResponse.answer,
        structured: aiResponse.structured,
        time: aiMsg.createdAt
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process message' });
  }
}

async function getSessions(req, res) {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
}

async function getSessionMessages(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const messages = await ChatMessage.find({ session: sessionId })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
}

async function deleteSession(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    await ChatMessage.deleteMany({ session: sessionId });
    await ChatSession.findByIdAndDelete(sessionId);
    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
}

async function rateMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { rating, comment } = req.body;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.feedback = {
      rating,
      comment,
      createdAt: new Date()
    };
    await message.save();

    res.json({ message: 'Feedback saved' });
  } catch (error) {
    console.error('Rate message error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
}

module.exports = {
  sendMessage,
  getSessions,
  getSessionMessages,
  deleteSession,
  rateMessage
};
