const User = require('../models/User');
const Case = require('../models/Case');
const Document = require('../models/Document');
const ChatSession = require('../models/ChatHistory').ChatSession;
const Notification = require('../models/Notification');

async function getDashboardStats(req, res) {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    let stats = {};

    // Global stats (Admin only)
    if (role === 'Admin') {
      stats.totalUsers = await User.countDocuments({ isActive: true });
      stats.totalCases = await Case.countDocuments();
      stats.resolvedCases = await Case.countDocuments({ status: 'Resolved' });
      stats.pendingCases = await Case.countDocuments({ status: { $in: ['Pending', 'Under Review', 'Hearing'] } });
      stats.aiQueriesProcessed = await ChatSession.countDocuments();
      stats.activeUsersToday = await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
    }

    // Role-specific stats
    if (role === 'Citizen') {
      stats.myCases = await Case.countDocuments({ filedBy: userId });
      stats.pendingCases = await Case.countDocuments({ filedBy: userId, status: 'Pending' });
      stats.resolvedCases = await Case.countDocuments({ filedBy: userId, status: 'Resolved' });
      stats.upcomingHearings = await Case.countDocuments({
        filedBy: userId,
        nextHearingDate: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      });
    }

    if (role === 'Lawyer') {
      stats.clients = await User.countDocuments({
        _id: { $in: await Case.distinct('filedBy', { assignedLawyer: userId }) }
      });
      stats.assignedCases = await Case.countDocuments({ assignedLawyer: userId });
      stats.researchQueries = await ChatSession.countDocuments({ user: userId });
      stats.pendingHearings = await Case.countDocuments({
        assignedLawyer: userId,
        nextHearingDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      });
    }

    if (role === 'Judge') {
      stats.assignedCases = await Case.countDocuments({ assignedJudge: userId });
      stats.pendingJudgments = await Case.countDocuments({
        assignedJudge: userId,
        status: { $in: ['Hearing', 'Under Review'] }
      });
      stats.completedCases = await Case.countDocuments({
        assignedJudge: userId,
        status: 'Resolved'
      });
      stats.recentHearings = await Case.countDocuments({
        assignedJudge: userId,
        'hearingDates.date': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
}

async function getSystemStatus(req, res) {
  try {
    const status = {
      systemHealth: 'Healthy',
      backendStatus: 'Connected',
      aiStatus: 'Active',
      databaseStatus: 'Connected',
      lastUpdated: new Date().toISOString()
    };

    res.json({ status });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
}

async function getRecentActivity(req, res) {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let activities = [];

    // Get recent chat sessions
    const chats = await ChatSession.find({ user: userId })
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .lean();
    chats.forEach(chat => {
      activities.push({
        action: 'Chat Query',
        detail: chat.title,
        time: chat.lastMessageAt,
        type: 'chat'
      });
    });

    // Get recent documents
    const docs = await Document.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    docs.forEach(doc => {
      activities.push({
        action: 'Document Generated',
        detail: doc.title,
        time: doc.createdAt,
        type: 'document'
      });
    });

    // Get recent cases
    const cases = await Case.find({
      $or: [{ filedBy: userId }, { assignedLawyer: userId }, { assignedJudge: userId }]
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();
    cases.forEach(c => {
      activities.push({
        action: 'Case Update',
        detail: c.title,
        time: c.updatedAt,
        type: 'case'
      });
    });

    // Sort by time
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.json({ activities: activities.slice(0, 10) });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Failed to get recent activity' });
  }
}

module.exports = {
  getDashboardStats,
  getSystemStatus,
  getRecentActivity
};
