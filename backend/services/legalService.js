/**
 * legalService.js
 * Unified legal database service — loads laws.json (5,000+ combined Indian law entries across major acts and department sources)
 * and exposes search, lookup, and AI-context helpers.
 */

const path = require('path');
const fs   = require('fs');

// ── Load the unified database ──────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, '../data/laws.json');
let lawsData = [];

try {
  const raw = fs.readFileSync(DATA_FILE, 'utf8').replace(/^\uFEFF/, '');
  lawsData = JSON.parse(raw);
  console.log(`[legalService] Loaded ${lawsData.length} law entries from laws.json`);
} catch (err) {
  console.error('[legalService] Failed to load laws.json:', err.message);
  // Fall back to ipc.json if laws.json not yet built
  try {
    const ipcRaw = fs.readFileSync(path.join(__dirname, '../data/ipc.json'), 'utf8').replace(/^\uFEFF/, '');
    const ipcData = JSON.parse(ipcRaw);
    lawsData = ipcData.map((s, i) => ({
      id: `IPC-${i + 1}`,
      act: 'Indian Penal Code, 1860', act_short: 'IPC',
      section: String(s.Section ?? ''),
      section_title: s.section_title ?? '',
      section_desc: s.section_desc ?? '',
      chapter: String(s.chapter ?? ''),
      chapter_title: s.chapter_title ?? '',
      category: 'Criminal Law', keywords: [],
    }));
    console.log(`[legalService] Fallback: loaded ${lawsData.length} IPC entries`);
  } catch { console.error('[legalService] Fallback to ipc.json also failed'); }
}

// ── Build lookup structures ────────────────────────────────────────────────────

// Map: "IPC-302" -> entry, "IPC-498A" -> entry
const sectionMap = new Map();
// Map: "IPC" -> [entries], "CrPC" -> [entries] …
const actMap     = new Map();
// Map: category -> [entries]
const catMap     = new Map();

for (const entry of lawsData) {
  // section lookup (act_short + section, and bare section for IPC backward compat)
  const fullKey = `${entry.act_short}-${String(entry.section).toLowerCase()}`;
  sectionMap.set(fullKey, entry);
  if (entry.act_short === 'IPC') {
    sectionMap.set(String(entry.section).toLowerCase(), entry);
  }

  if (!actMap.has(entry.act_short)) actMap.set(entry.act_short, []);
  actMap.get(entry.act_short).push(entry);

  const cat = entry.category || 'General Law';
  if (!catMap.has(cat)) catMap.set(cat, []);
  catMap.get(cat).push(entry);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Look up by act_short + section.  e.g. getSection('IPC','302')
 * If actShort is omitted, searches all acts (first match).
 */
function getSection(sectionNo, actShort) {
  const sec = String(sectionNo).toLowerCase();
  if (actShort) {
    return sectionMap.get(`${actShort.toUpperCase()}-${sec}`) || null;
  }
  // Bare lookup (backward compat for IPC)
  return sectionMap.get(sec) || null;
}

/**
 * Resolve an array of {actShort?, section} objects into full entries.
 */
function getSections(sectionRefs) {
  return sectionRefs
    .map(r => getSection(r.section, r.actShort))
    .filter(Boolean);
}

/** All entries for a given act (by act_short). */
function getByAct(actShort, skip = 0, limit = 50) {
  const entries = actMap.get(actShort.toUpperCase()) || [];
  return { entries: entries.slice(skip, skip + limit), total: entries.length };
}

/** All entries in a category. */
function getByCategory(cat, skip = 0, limit = 50) {
  const entries = catMap.get(cat) || [];
  return { entries: entries.slice(skip, skip + limit), total: entries.length };
}

/** Unique list of all acts in the database. */
function getActList() {
  const seen = new Set();
  const acts = [];
  for (const e of lawsData) {
    if (!seen.has(e.act_short)) {
      seen.add(e.act_short);
      acts.push({ act_short: e.act_short, act: e.act, category: e.category });
    }
  }
  return acts;
}

/** Unique list of all categories. */
function getCategoryList() {
  return [...catMap.keys()].sort();
}

/**
 * Full-text keyword search across title + desc + keywords array.
 * Returns up to `limit` best-scored results.
 */
function searchLaws(query, { actShort, category, limit = 20 } = {}) {
  if (!query && !actShort && !category) return [];

  let pool = lawsData;
  if (actShort)  pool = actMap.get(actShort.toUpperCase()) || [];
  if (category)  pool = pool.filter(e => e.category === category);

  if (!query) return pool.slice(0, limit);

  const q      = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(t => t.length > 2);

  const scored = pool
    .map(entry => {
      const blob = [
        entry.section_title,
        entry.section_desc,
        ...(entry.keywords || []),
        entry.act,
        entry.act_short,
        entry.category,
      ].join(' ').toLowerCase();

      let score = 0;
      // Exact phrase bonus
      if (blob.includes(q)) score += 10;
      // Token hits
      for (const t of tokens) {
        if (blob.includes(t)) score += 1;
        // Heavier weight for title hits
        if (entry.section_title.toLowerCase().includes(t)) score += 2;
      }
      return { score, entry };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => entry);

  return scored;
}

/**
 * Extract and resolve section references from free text.
 * Handles: "Section 302 IPC", "s.138 NIA", "Article 21", "Section 498-A", etc.
 */
function extractAndResolveSections(text) {
  const patterns = [
    // "Section 302 IPC" / "s.498A IPC"
    /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z-]*)\s+([A-Za-z]{2,6})/gi,
    // "IPC Section 302"
    /([A-Za-z]{2,6})\s+(?:section|sec\.?|s\.)\s*(\d+[A-Za-z-]*)/gi,
    // "Section 302" (no act — try all)
    /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z-]*)/gi,
    // "Article 21" → Constitution
    /article\s*(\d+[A-Za-z-]*)/gi,
    // bare "302 IPC"
    /(\d+[A-Za-z-]*)\s+([A-Za-z]{2,6})/gi,
  ];

  const found = new Map(); // key -> entry

  const tryResolve = (sec, act) => {
    const entry = act
      ? (sectionMap.get(`${act.toUpperCase()}-${sec.toLowerCase()}`) || null)
      : (sectionMap.get(sec.toLowerCase()) || null);
    if (entry) found.set(entry.id || `${entry.act_short}-${entry.section}`, entry);
  };

  // Pattern 1: section X ACT
  let m;
  const re1 = /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z-]*)\s+([A-Za-z]{2,6})/gi;
  while ((m = re1.exec(text)) !== null) tryResolve(m[1], m[2]);

  // Pattern 2: ACT section X
  const re2 = /([A-Za-z]{2,6})\s+(?:section|sec\.?|s\.)\s*(\d+[A-Za-z-]*)/gi;
  while ((m = re2.exec(text)) !== null) tryResolve(m[2], m[1]);

  // Pattern 3: Article X → COI
  const re3 = /article\s*(\d+[A-Za-z-]*)/gi;
  while ((m = re3.exec(text)) !== null) tryResolve(m[1], 'COI');

  // Pattern 4: bare section X
  const re4 = /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z-]*)/gi;
  while ((m = re4.exec(text)) !== null) tryResolve(m[1], null);

  // Pattern 5: bare 302 IPC
  const re5 = /(\d+[A-Za-z-]*)\s+(IPC|CrPC|CPC|IEA|HMA|NIA|MVA|IDA|COI|ITA|CPA|ICA|TPA|SRA|LA|ACA|NDPS|UAPA|JJA|RTI|PCA|POCSO|PWDVA|DPA|RERA|PMLA|FEMA|GST|CA2013|IBC|EPF|HSA|POSH|MBA|ERA|HAMA|HMGA|SMA|RTE|RPWD|FCA|FRA|NGT|EPA|IFA|SA|RA)/gi;
  while ((m = re5.exec(text)) !== null) tryResolve(m[1], m[2]);

  return [...found.values()];
}

/**
 * Resolve AI-generated section strings like "Section 302 IPC", "498A", "Article 21".
 * Returns up to maxPerItem matches per string, deduped.
 */
function resolveFromAIList(aiSectionStrings, maxPerItem = 2) {
  const results = new Map();

  for (const raw of aiSectionStrings) {
    // Try extracting from the string
    const extracted = extractAndResolveSections(raw);
    extracted.forEach(e => results.set(e.id || `${e.act_short}-${e.section}`, e));

    // Clean and try bare lookup
    const clean = String(raw)
      .replace(/\b(ipc|crpc|cpc|iea|hma|nia|mva|ida|section|sec|article|s\.)\b/gi, '')
      .replace(/\s+/g, '').trim();
    if (clean) {
      const direct = sectionMap.get(clean.toLowerCase());
      if (direct) results.set(direct.id || `${direct.act_short}-${direct.section}`, direct);
    }

    // Fallback: text search
    if (results.size === 0 || extracted.length === 0) {
      searchLaws(raw, { limit: maxPerItem }).forEach(e =>
        results.set(e.id || `${e.act_short}-${e.section}`, e)
      );
    }
  }

  return [...results.values()];
}

module.exports = {
  allLaws:      lawsData,
  getSection,
  getSections,
  getByAct,
  getByCategory,
  getActList,
  getCategoryList,
  searchLaws,
  extractAndResolveSections,
  resolveFromAIList,

  // Backward-compat aliases used by ipcController / legalAIService
  allSections:    lawsData,
  searchSections: (q, lim = 10) => searchLaws(q, { limit: lim }),
  getSectionsByChapter: (chapterNo) =>
    lawsData.filter(e => String(e.chapter) === String(chapterNo)),
  getChapters: () => {
    const seen = new Set();
    return lawsData
      .filter(e => {
        const k = `${e.act_short}|${e.chapter}|${e.chapter_title}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      })
      .map(e => ({ act_short: e.act_short, chapter: e.chapter, title: e.chapter_title }));
  },
};
