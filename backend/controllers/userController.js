const User = require('../models/User');
const Case = require('../models/Case');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

async function getProfile(req, res) {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone, address, preferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function deleteProfile(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ message: 'Account deactivated' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
}

async function getUsers(req, res) {
  try {
    const { role, search, limit = 50, skip = 0 } = req.query;

    let query = { isActive: true };

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name email role phone isActive lastLogin createdAt')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({ users, total });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
}

async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select('name email role phone address preferences isActive createdAt lastLogin');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

async function deactivateUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
}

async function getUserStats(req, res) {
  try {
    const userId = req.params.id || req.user._id;

    const stats = {
      cases: await Case.countDocuments({ filedBy: userId }),
      documents: await Document.countDocuments({ user: userId }),
      notifications: await Notification.countDocuments({ recipient: userId, isRead: false })
    };

    if (req.user.role === 'Lawyer' || req.user.role === 'Judge') {
      stats.assignedCases = await Case.countDocuments({
        $or: [
          { assignedLawyer: userId },
          { assignedJudge: userId }
        ]
      });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  getUsers,
  getUser,
  updateUserRole,
  deactivateUser,
  getUserStats
};
