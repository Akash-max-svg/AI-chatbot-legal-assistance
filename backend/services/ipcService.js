const ipcData = require('../data/ipc.json');

// Build a quick lookup map: "302" -> section object, "302A" -> section object
const sectionMap = {};
ipcData.forEach((s) => {
  const key = String(s.Section).toLowerCase();
  sectionMap[key] = s;
});

/**
 * Look up a single section by number (e.g. "302", "498A").
 */
function getSection(sectionNo) {
  return sectionMap[String(sectionNo).toLowerCase()] || null;
}

/**
 * Look up multiple sections by array of section strings.
 * Tolerates "Section 302", "IPC 302", "s.302", "302 IPC", plain "302".
 */
function getSections(sectionNumbers) {
  return sectionNumbers
    .map((raw) => {
      const clean = String(raw)
        .replace(/ipc/gi, '')
        .replace(/section/gi, '')
        .replace(/s\./gi, '')
        .replace(/\s+/g, '')
        .trim();
      return getSection(clean);
    })
    .filter(Boolean);
}

/**
 * Full-text search across title + description.
 * Returns up to `limit` results.
 */
function searchSections(query, limit = 10) {
  if (!query) return [];
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);

  const scored = ipcData
    .map((s) => {
      const text = `${s.section_title} ${s.section_desc}`.toLowerCase();
      // Score: number of tokens that appear in the text
      const score = tokens.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
      return { score, section: s };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ section }) => section);

  return scored;
}

/**
 * Extract IPC section references from free text.
 * Finds patterns like "Section 302", "s.498A", "IPC 420", "302 IPC" etc.
 * Returns resolved section objects (deduped).
 */
function extractAndResolveSections(text) {
  const patterns = [
    /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z]*)/gi,
    /(?:ipc|i\.p\.c\.?)\s*(\d+[A-Za-z]*)/gi,
    /(\d+[A-Za-z]*)\s*(?:ipc|i\.p\.c\.?)/gi,
  ];

  const found = new Set();
  patterns.forEach((re) => {
    let m;
    while ((m = re.exec(text)) !== null) {
      found.add(m[1].trim());
    }
  });

  return getSections([...found]);
}

/**
 * Get all sections in a chapter.
 */
function getSectionsByChapter(chapterNo) {
  return ipcData.filter((s) => s.chapter === chapterNo);
}

/**
 * Get all unique chapter titles.
 */
function getChapters() {
  const seen = new Set();
  return ipcData
    .filter((s) => {
      const key = `${s.chapter}|${s.chapter_title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s) => ({ chapter: s.chapter, title: s.chapter_title }));
}

/**
 * Given a list of keyword strings (e.g. from AI's relevantSections array),
 * try to resolve each as a section number first, then fall back to text search.
 * Returns deduped resolved sections.
 */
function resolveFromAIList(aiSectionStrings, maxPerItem = 2) {
  const results = new Map();

  aiSectionStrings.forEach((raw) => {
    // Try direct lookup first
    const clean = String(raw)
      .replace(/ipc/gi, '')
      .replace(/section/gi, '')
      .replace(/s\./gi, '')
      .replace(/\s+/g, '')
      .trim();

    const direct = getSection(clean);
    if (direct) {
      results.set(String(direct.Section), direct);
      return;
    }

    // Fall back to text search
    const hits = searchSections(raw, maxPerItem);
    hits.forEach((h) => results.set(String(h.Section), h));
  });

  return [...results.values()];
}

module.exports = {
  getSection,
  getSections,
  searchSections,
  extractAndResolveSections,
  getSectionsByChapter,
  getChapters,
  resolveFromAIList,
  allSections: ipcData,
};
