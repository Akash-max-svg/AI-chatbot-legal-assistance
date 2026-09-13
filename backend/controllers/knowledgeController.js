const KnowledgeBase = require('../models/KnowledgeBase');
const GovernmentAct = require('../models/GovernmentAct');
const legalAI = require('../services/legalAIService');

async function searchKnowledge(req, res) {
  try {
    const { q, category, limit = 20, skip = 0 } = req.query;

    let query = { isPublished: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    let useTextScore = false;
    if (q) {
      // Use $text search alone so textScore metadata is available for sorting
      query.$text = { $search: q };
      useTextScore = true;
    }

    let findQuery = KnowledgeBase.find(query);
    if (useTextScore) {
      findQuery = findQuery.sort({ score: { $meta: 'textScore' }, createdAt: -1 });
    } else {
      findQuery = findQuery.sort({ createdAt: -1 });
    }

    const items = await findQuery
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await KnowledgeBase.countDocuments(query);

    res.json({ items, total });
  } catch (error) {
    console.error('Search knowledge error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
}

async function askAI(req, res) {
  try {
    const { question, language } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await legalAI.searchKnowledgeBase(question, language || 'en');

    res.json(response);
  } catch (error) {
    console.error('Ask AI error:', error);
    res.status(500).json({ error: error.message || 'Failed to get answer' });
  }
}

async function getItem(req, res) {
  try {
    const { id } = req.params;
    const item = await KnowledgeBase.findById(id);

    if (!item) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count
    item.viewCount = (item.viewCount || 0) + 1;
    await item.save();

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await KnowledgeBase.distinct('category', { isPublished: true });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
}

async function getActs(req, res) {
  try {
    const acts = await GovernmentAct.find({ isActive: true })
      .sort({ name: 1 })
      .select('name shortTitle year category')
      .lean();

    res.json({ acts });
  } catch (error) {
    console.error('Get acts error:', error);
    res.status(500).json({ error: 'Failed to get acts' });
  }
}

async function getActDetails(req, res) {
  try {
    const { id } = req.params;
    const act = await GovernmentAct.findById(id);

    if (!act) {
      return res.status(404).json({ error: 'Act not found' });
    }

    res.json({ act });
  } catch (error) {
    console.error('Get act error:', error);
    res.status(500).json({ error: 'Failed to get act' });
  }
}

async function createArticle(req, res) {
  try {
    const { title, category, content, summary, tags, importantActs, faqs } = req.body;

    const article = new KnowledgeBase({
      title,
      category,
      content,
      summary,
      tags: tags || [],
      importantActs: importantActs || [],
      faqs: faqs || [],
      author: req.user._id
    });

    await article.save();
    res.status(201).json({ article });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
}

module.exports = {
  searchKnowledge,
  askAI,
  getItem,
  getCategories,
  getActs,
  getActDetails,
  createArticle
};
