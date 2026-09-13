const legalService = require('../services/legalService');

// ── /api/ipc  (backward-compat — IPC only) ────────────────────────────────────

function listSections(req, res) {
  try {
    const { q, section, chapter, limit = '20', skip = '0' } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(skip, 10) || 0;

    if (section) {
      const found = legalService.getSection(section, 'IPC');
      if (!found) return res.status(404).json({ error: `IPC Section ${section} not found` });
      return res.json({ section: found });
    }

    if (chapter) {
      const all  = legalService.getSectionsByChapter(parseInt(chapter, 10));
      const ipc  = all.filter(e => e.act_short === 'IPC');
      const page = ipc.slice(off, off + lim);
      return res.json({ sections: page, total: ipc.length, skip: off, limit: lim });
    }

    if (q) {
      const results = legalService.searchLaws(q, { actShort: 'IPC', limit: lim });
      return res.json({ sections: results, total: results.length, query: q });
    }

    const { entries, total } = legalService.getByAct('IPC', off, lim);
    return res.json({ sections: entries, total, skip: off, limit: lim });
  } catch (err) {
    console.error('IPC list error:', err);
    res.status(500).json({ error: 'Failed to retrieve IPC sections' });
  }
}

function listChapters(req, res) {
  try {
    const chapters = legalService.getChapters().filter(c => c.act_short === 'IPC');
    res.json({ chapters });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve chapters' });
  }
}

function getSection(req, res) {
  try {
    const { section } = req.params;
    const found = legalService.getSection(section, 'IPC');
    if (!found) return res.status(404).json({ error: `IPC Section ${section} not found` });
    res.json({ section: found });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve section' });
  }
}

// ── /api/laws  (unified — all acts) ───────────────────────────────────────────

function listLaws(req, res) {
  try {
    const { q, act, category, limit = '20', skip = '0' } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 200);
    const off = parseInt(skip, 10) || 0;

    if (q) {
      const results = legalService.searchLaws(q, {
        actShort: act || undefined,
        category: category || undefined,
        limit: lim,
      });
      return res.json({ laws: results, total: results.length, query: q });
    }

    if (act) {
      const { entries, total } = legalService.getByAct(act, off, lim);
      return res.json({ laws: entries, total, skip: off, limit: lim });
    }

    if (category) {
      const { entries, total } = legalService.getByCategory(category, off, lim);
      return res.json({ laws: entries, total, skip: off, limit: lim });
    }

    // Paginated full list
    const page = legalService.allLaws.slice(off, off + lim);
    return res.json({ laws: page, total: legalService.allLaws.length, skip: off, limit: lim });
  } catch (err) {
    console.error('Laws list error:', err);
    res.status(500).json({ error: 'Failed to retrieve laws' });
  }
}

function getActsList(req, res) {
  try {
    res.json({ acts: legalService.getActList() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve acts list' });
  }
}

function getCategoriesList(req, res) {
  try {
    res.json({ categories: legalService.getCategoryList() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
}

function getLawByActSection(req, res) {
  try {
    const { act, section } = req.params;
    const found = legalService.getSection(section, act.toUpperCase());
    if (!found) return res.status(404).json({ error: `${act.toUpperCase()} Section ${section} not found` });
    res.json({ law: found });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve law section' });
  }
}

module.exports = {
  // IPC backward-compat
  listSections,
  listChapters,
  getSection,
  // Unified laws
  listLaws,
  getActsList,
  getCategoriesList,
  getLawByActSection,
};
