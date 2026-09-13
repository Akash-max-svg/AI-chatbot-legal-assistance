const Case = require('../models/Case');
const Document = require('../models/Document');
const legalAI = require('../services/legalAIService');

async function analyzeCase(req, res) {
  try {
    const { scenario, category, language } = req.body;

    if (!scenario || scenario.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a detailed scenario' });
    }

    const result = await legalAI.analyzeCaseFiling(scenario, category || 'Consumer', language || 'en', req.user?.name);

    // Save document reference
    const doc = new Document({
      user: req.user._id,
      title: `Case Filing — ${result.caseCategory || category}`,
      type: 'case-filing',
      content: JSON.stringify(result),
      status: 'Draft',
      aiGenerated: true,
      metadata: {
        caseNumber: result.courtToApproach,
        court: result.courtToApproach
      }
    });
    await doc.save();

    res.json({
      ...result,
      documentId: doc._id
    });
  } catch (error) {
    console.error('Case filing error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze case' });
  }
}

async function getCases(req, res) {
  try {
    const { status, category, limit = 20, skip = 0 } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'Citizen') {
      query.filedBy = req.user._id;
    } else if (req.user.role === 'Lawyer') {
      query.$or = [
        { assignedLawyer: req.user._id },
        { filedBy: req.user._id }
      ];
    } else if (req.user.role === 'Judge') {
      query.assignedJudge = req.user._id;
    }
    // Admin can see all

    if (status) query.status = status;
    if (category) query.category = category;

    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('filedBy', 'name email')
      .populate('assignedLawyer', 'name email')
      .populate('assignedJudge', 'name email')
      .lean();

    const total = await Case.countDocuments(query);

    res.json({ cases, total });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to get cases' });
  }
}

async function getCase(req, res) {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('filedBy', 'name email phone')
      .populate('assignedLawyer', 'name email')
      .populate('assignedJudge', 'name email');

    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check access
    const userId = req.user._id.toString();
    const hasAccess =
      req.user.role === 'Admin' ||
      caseDoc.filedBy?._id?.toString() === userId ||
      caseDoc.assignedLawyer?._id?.toString() === userId ||
      caseDoc.assignedJudge?._id?.toString() === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ case: caseDoc });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to get case' });
  }
}

async function createCase(req, res) {
  try {
    const { title, description, category, courtType, courtName, priority } = req.body;

    const caseDoc = new Case({
      title,
      description,
      category,
      courtType,
      courtName,
      priority,
      filedBy: req.user._id,
      status: 'Draft'
    });

    await caseDoc.save();

    res.status(201).json({ case: caseDoc });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
}

async function updateCase(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check permissions
    const userId = req.user._id.toString();
    const canUpdate =
      req.user.role === 'Admin' ||
      caseDoc.filedBy?.toString() === userId ||
      caseDoc.assignedLawyer?.toString() === userId ||
      caseDoc.assignedJudge?._id?.toString() === userId;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Restricted updates based on role
    if (req.user.role === 'Citizen') {
      delete updates.status;
      delete updates.assignedJudge;
      delete updates.assignedLawyer;
    }

    Object.assign(caseDoc, updates);
    await caseDoc.save();

    res.json({ case: caseDoc });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
}

async function addHearing(req, res) {
  try {
    const { id } = req.params;
    const { date, notes } = req.body;

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    caseDoc.hearingDates.push({
      date,
      notes,
      status: 'Scheduled'
    });

    caseDoc.nextHearingDate = date;
    await caseDoc.save();

    res.json({ case: caseDoc });
  } catch (error) {
    console.error('Add hearing error:', error);
    res.status(500).json({ error: 'Failed to add hearing' });
  }
}

async function deleteCase(req, res) {
  try {
    const { id } = req.params;

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Only allow deletion by owner or admin
    if (caseDoc.filedBy?.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Case.findByIdAndDelete(id);
    res.json({ message: 'Case deleted' });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
}

module.exports = {
  analyzeCase,
  getCases,
  getCase,
  createCase,
  updateCase,
  addHearing,
  deleteCase
};
