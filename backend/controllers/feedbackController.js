const Feedback = require('../models/Feedback');

async function submitFeedback(req, res) {
  try {
    const { type, subject, message, rating, category } = req.body;

    const feedback = new Feedback({
      user: req.user._id,
      type: type || 'general',
      subject,
      message,
      rating,
      category
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
}

async function getFeedback(req, res) {
  try {
    const { status, type, limit = 20, skip = 0 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('user', 'name email role')
      .lean();

    const total = await Feedback.countDocuments(query);

    res.json({ feedbacks, total });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
}

async function updateFeedbackStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (status) feedback.status = status;
    if (response) {
      feedback.response = {
        message: response,
        respondedBy: req.user._id,
        respondedAt: new Date()
      };
    }

    await feedback.save();

    res.json({ feedback });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
}

async function getMyFeedback(req, res) {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ feedbacks });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
}

module.exports = {
  submitFeedback,
  getFeedback,
  updateFeedbackStatus,
  getMyFeedback
};
