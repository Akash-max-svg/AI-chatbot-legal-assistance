const GovernmentAct = require('../models/GovernmentAct');
const Judgement = require('../models/Judgement');

async function getLatestJudgements(req, res) {
  try {
    const { limit = 10 } = req.query;

    const judgements = await Judgement.find({ isPublic: true })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .select('title court date caseNumber category summary')
      .lean();

    res.json({ judgements });
  } catch (error) {
    console.error('Get latest judgements error:', error);
    res.status(500).json({ error: 'Failed to get judgements' });
  }
}

async function getActsAndRules(req, res) {
  try {
    const { category, limit = 20, skip = 0 } = req.query;

    let query = { isActive: true };
    if (category) query.category = category;

    const acts = await GovernmentAct.find(query)
      .sort({ name: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .select('name shortTitle year ministry category description effectiveDate')
      .lean();

    const total = await GovernmentAct.countDocuments(query);

    res.json({ acts, total });
  } catch (error) {
    console.error('Get acts error:', error);
    res.status(500).json({ error: 'Failed to get acts' });
  }
}

async function getAct(req, res) {
  try {
    const act = await GovernmentAct.findById(req.params.id);
    if (!act) {
      return res.status(404).json({ error: 'Act not found' });
    }
    res.json({ act });
  } catch (error) {
    console.error('Get act error:', error);
    res.status(500).json({ error: 'Failed to get act' });
  }
}

async function searchJudgements(req, res) {
  try {
    const { q, court, year, limit = 20, skip = 0 } = req.query;

    let query = { isPublic: true };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { caseNumber: { $regex: q, $options: 'i' } }
      ];
    }

    if (court) query.court = { $regex: court, $options: 'i' };
    if (year) query.date = { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) };

    const judgements = await Judgement.find(query)
      .sort({ date: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await Judgement.countDocuments(query);

    res.json({ judgements, total });
  } catch (error) {
    console.error('Search judgements error:', error);
    res.status(500).json({ error: 'Failed to search judgements' });
  }
}

async function getNoticeBoard(req, res) {
  try {
    // This would typically come from a Notice model
    // For now, return sample notices
    const notices = [
      {
        id: '1',
        title: 'Supreme Court e-Filing Guidelines Updated',
        date: new Date().toISOString(),
        type: 'system'
      },
      {
        id: '2',
        title: 'New Bharatiya Nyaya Sanhita comes into effect',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'legal'
      }
    ];

    res.json({ notices });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ error: 'Failed to get notices' });
  }
}

async function getLegalFAQs(req, res) {
  try {
    const KnowledgeBase = require('../models/KnowledgeBase');
    const faqs = await KnowledgeBase.find({
      category: 'Frequently Asked Questions',
      isPublished: true
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ faqs });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: 'Failed to get FAQs' });
  }
}

module.exports = {
  getLatestJudgements,
  getActsAndRules,
  getAct,
  searchJudgements,
  getNoticeBoard,
  getLegalFAQs
};
