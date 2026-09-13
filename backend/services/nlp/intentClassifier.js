/**
 * intentClassifier.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TF-IDF based multi-label legal intent classification.
 * Classifies a user query into one or more of 10 legal intent categories
 * without any external API call. Pure in-process computation.
 *
 * Technique: cosine similarity between the query's TF vector and each
 * category's IDF-weighted centroid vector.
 *
 * Returns: { primary, secondary[], confidence, allScores }
 */

'use strict';

// ── Category keyword vocabularies ─────────────────────────────────────────────
const INTENT_VOCAB = {
  criminal: {
    label: 'Criminal Law',
    icon: '⚖️',
    acts: ['IPC', 'BNS', 'CrPC', 'BNSS', 'NDPS', 'UAPA', 'PMLA'],
    keywords: [
      'murder', 'rape', 'theft', 'robbery', 'dacoity', 'assault', 'hurt',
      'fraud', 'cheating', 'forgery', 'kidnapping', 'abduction', 'extortion',
      'bribery', 'corruption', 'criminal', 'offence', 'accused', 'bail',
      'arrest', 'fir', 'police', 'trial', 'conviction', 'acquittal',
      'sentence', 'imprisonment', 'fine', 'cognizable', 'non-bailable',
      'chargesheet', 'challan', 'ipc', 'bns', 'crpc', 'bnss', 'penal',
      'punishment', 'abetment', 'conspiracy', 'attempt', 'culpable', 'homicide',
      'dowry', 'domestic', 'violence', 'stalking', 'voyeurism', 'cybercrime',
      'hacking', 'defamation', 'sedition', 'terrorism', 'uapa', 'ndps', 'drug',
      'narcotic', 'witness', 'evidence', 'confession', 'dying declaration',
    ],
  },

  civil: {
    label: 'Civil Law',
    icon: '📜',
    acts: ['CPC', 'CrPC', 'SRA', 'LA', 'ACA'],
    keywords: [
      'civil suit', 'plaint', 'defendant', 'plaintiff', 'decree', 'injunction',
      'attachment', 'execution', 'appeal', 'revision', 'limitation', 'summons',
      'warrant', 'partition', 'specific performance', 'damages', 'compensation',
      'arbitration', 'mediation', 'lok adalat', 'settlement', 'cpc', 'order',
      'judgment', 'stay', 'interlocutory', 'res judicata', 'restitution',
      'contempt', 'objection', 'written statement', 'amendment', 'discovery',
      'commission', 'receiver', 'interim', 'permanent injunction', 'mandatory',
    ],
  },

  property: {
    label: 'Property Law',
    icon: '🏠',
    acts: ['TPA', 'RA', 'SA', 'RERA'],
    keywords: [
      'property', 'land', 'house', 'flat', 'apartment', 'plot', 'building',
      'sale', 'purchase', 'mortgage', 'lease', 'rent', 'tenancy', 'landlord',
      'tenant', 'transfer', 'gift', 'inheritance', 'will', 'succession',
      'registration', 'stamp duty', 'tpa', 'rera', 'title', 'ownership',
      'possession', 'encroachment', 'trespass', 'easement', 'adverse',
      'mutation', 'khata', 'patta', 'deed', 'sale deed', 'gift deed',
      'power of attorney', 'foreclosure', 'redemption', 'eviction',
    ],
  },

  family: {
    label: 'Family Law',
    icon: '👨‍👩‍👧',
    acts: ['HMA', 'HSA', 'HAMA', 'MPLSA', 'IDA', 'GWA', 'ISA'],
    keywords: [
      'marriage', 'divorce', 'separation', 'maintenance', 'alimony', 'custody',
      'guardianship', 'adoption', 'inheritance', 'succession', 'will',
      'dowry', 'stridhan', 'mehr', 'dower', 'bigamy', 'child', 'minor',
      'legitimate', 'illegitimate', 'matrimonial', 'cruelty', 'husband',
      'wife', 'spouse', 'hindu', 'muslim', 'christian', 'parsi',
      'restitution', 'conjugal', 'desertion', 'adultery', 'nullity', 'void',
      'voidable', 'hma', 'hsa', 'family court', 'divorce petition',
    ],
  },

  contract: {
    label: 'Contract & Commercial Law',
    icon: '📋',
    acts: ['ICA', 'NIA', 'SEBI', 'CA2013', 'IBC'],
    keywords: [
      'contract', 'agreement', 'offer', 'acceptance', 'consideration',
      'breach', 'performance', 'indemnity', 'guarantee', 'surety', 'agency',
      'bailment', 'pledge', 'sale of goods', 'cheque', 'promissory note',
      'bill of exchange', 'dishonour', 'npa', 'insolvency', 'bankruptcy',
      'company', 'director', 'shareholder', 'sebi', 'stocks', 'shares',
      'debenture', 'ibc', 'nclt', 'winding up', 'merger', 'acquisition',
      'arbitration', 'void', 'voidable', 'misrepresentation', 'fraud',
      'coercion', 'undue influence', 'frustrated', 'novation', 'ica',
    ],
  },

  constitutional: {
    label: 'Constitutional Law',
    icon: '🇮🇳',
    acts: ['COI'],
    keywords: [
      'constitution', 'fundamental rights', 'article', 'directive principles',
      'basic structure', 'amendment', 'parliament', 'supreme court',
      'high court', 'writ', 'habeas corpus', 'mandamus', 'certiorari',
      'prohibition', 'quo warranto', 'judicial review', 'pil', 'public interest',
      'fundamental duty', 'citizenship', 'president', 'governor', 'election',
      'federalism', 'emergency', 'reserved', 'scheduled caste', 'scheduled tribe',
      'reservation', 'minority', 'secularism', 'right to life', 'free speech',
      'privacy', 'equality', 'discrimination', 'article 14', 'article 19',
      'article 21', 'article 32', 'article 226', 'coi',
    ],
  },

  evidence: {
    label: 'Evidence Law',
    icon: '🔍',
    acts: ['IEA', 'BSA'],
    keywords: [
      'evidence', 'witness', 'testimony', 'confession', 'admission',
      'document', 'electronic', 'oral', 'hearsay', 'dying declaration',
      'expert opinion', 'burden of proof', 'presumption', 'estoppel',
      'examination', 'cross-examination', 're-examination', 'leading question',
      'hostile witness', 'privileged', 'admissible', 'inadmissible',
      'primary evidence', 'secondary evidence', 'certified copy',
      'fingerprint', 'dna', 'forensic', 'iea', 'bsa', 'sakshya', 'proved',
    ],
  },

  tax: {
    label: 'Tax Law',
    icon: '💰',
    acts: ['ITA61', 'GST', 'CUSTOMS'],
    keywords: [
      'income tax', 'tax', 'gst', 'tds', 'advance tax', 'return', 'itr',
      'assessment', 'deduction', 'exemption', 'capital gains', 'salary',
      'business income', 'property income', 'customs duty', 'excise',
      'assessment officer', 'commissioner', 'appeal', 'tribunal', 'itat',
      'penalty', 'notice', 'scrutiny', 'refund', 'input tax credit',
      'e-filing', 'pan', 'tan', 'surcharge', 'cess', 'gst council',
      'cgst', 'sgst', 'igst', 'composition scheme', 'invoice', 'e-way bill',
    ],
  },

  labour: {
    label: 'Labour & Employment Law',
    icon: '👷',
    acts: ['COW', 'IRC', 'OSHWCC', 'SSC', 'EPF', 'ESI', 'POSH'],
    keywords: [
      'employee', 'employer', 'salary', 'wages', 'minimum wages', 'workman',
      'worker', 'dismissal', 'retrenchment', 'termination', 'layoff',
      'provident fund', 'pf', 'epf', 'esi', 'gratuity', 'bonus',
      'leave', 'maternity', 'paternity', 'industrial dispute', 'strike',
      'lockout', 'labour court', 'labour tribunal', 'sexual harassment',
      'posh', 'workplace', 'factory', 'contract labour', 'apprentice',
      'gig worker', 'platform worker', 'unfair labour practice',
    ],
  },

  environment: {
    label: 'Environmental Law',
    icon: '🌿',
    acts: ['EPA', 'WPCPA', 'APCPA', 'NGT', 'WPA', 'FRA', 'FCA1980'],
    keywords: [
      'environment', 'pollution', 'air', 'water', 'noise', 'soil',
      'forest', 'wildlife', 'biodiversity', 'ngt', 'green tribunal',
      'polluter pays', 'precautionary principle', 'sustainable development',
      'environmental clearance', 'eia', 'carbon', 'climate', 'factory',
      'effluent', 'emission', 'hazardous waste', 'solid waste', 'plastic',
      'coastal regulation', 'crz', 'national park', 'sanctuary', 'tiger',
      'elephant', 'species', 'public trust', 'ecology', 'tree felling',
    ],
  },
};

// ── Pre-compute IDF weights ───────────────────────────────────────────────────
const TOTAL_CATEGORIES = Object.keys(INTENT_VOCAB).length;

// Build global vocabulary with IDF weight (log(N/df) where df = categories containing term)
function buildIDF() {
  const df = {};
  for (const cat of Object.values(INTENT_VOCAB)) {
    const seen = new Set(cat.keywords.map(w => w.toLowerCase()));
    seen.forEach(w => { df[w] = (df[w] || 0) + 1; });
  }
  const idf = {};
  Object.entries(df).forEach(([w, freq]) => {
    idf[w] = Math.log((TOTAL_CATEGORIES + 1) / (freq + 1)) + 1;
  });
  return idf;
}

const IDF = buildIDF();

// Build TF-IDF centroid vector per category
function buildCategoryVectors() {
  const vectors = {};
  for (const [key, cat] of Object.entries(INTENT_VOCAB)) {
    const vec = {};
    const tf = {};
    cat.keywords.forEach(w => { tf[w.toLowerCase()] = (tf[w.toLowerCase()] || 0) + 1; });
    Object.entries(tf).forEach(([w, freq]) => {
      const tfNorm = freq / cat.keywords.length;
      vec[w] = tfNorm * (IDF[w] || 1);
    });
    vectors[key] = vec;
  }
  return vectors;
}

const CATEGORY_VECTORS = buildCategoryVectors();

// ── Query vectoriser ──────────────────────────────────────────────────────────
function tokenise(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function vectoriseQuery(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const vec = {};
  const len = tokens.length || 1;
  Object.entries(tf).forEach(([t, freq]) => {
    const idfVal = IDF[t] || Math.log((TOTAL_CATEGORIES + 1) / 1) + 1;
    vec[t] = (freq / len) * idfVal;
  });
  return vec;
}

// ── Cosine similarity ─────────────────────────────────────────────────────────
function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  const keysA = Object.keys(a);
  keysA.forEach(k => {
    normA += a[k] * a[k];
    if (b[k]) dot += a[k] * b[k];
  });
  Object.values(b).forEach(v => { normB += v * v; });
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Keyword boost (exact match in query) ─────────────────────────────────────
function keywordBoost(tokens, category) {
  const tokenSet = new Set(tokens);
  let boost = 0;
  for (const kw of INTENT_VOCAB[category].keywords) {
    const kwTokens = kw.toLowerCase().split(/\s+/);
    // Multi-word match
    if (kwTokens.length > 1) {
      const joined = tokens.join(' ');
      if (joined.includes(kw.toLowerCase())) boost += 0.15 * kwTokens.length;
    } else {
      if (tokenSet.has(kw.toLowerCase())) boost += 0.1;
    }
  }
  // Act name match
  for (const act of INTENT_VOCAB[category].acts) {
    if (tokens.join(' ').includes(act.toLowerCase())) boost += 0.2;
  }
  return Math.min(boost, 0.5); // cap
}

// ── Main classifier ───────────────────────────────────────────────────────────
/**
 * @param {string} query — raw user question
 * @returns {{ primary: string, primaryLabel: string, primaryIcon: string,
 *             secondary: string[], confidence: number,
 *             allScores: Record<string, number> }}
 */
function classifyIntent(query) {
  const tokens = tokenise(query);
  if (tokens.length === 0) {
    return {
      primary: 'criminal',
      primaryLabel: 'Criminal Law',
      primaryIcon: '⚖️',
      secondary: [],
      confidence: 0,
      allScores: {},
    };
  }

  const queryVec = vectoriseQuery(tokens);
  const scores = {};

  for (const [key, catVec] of Object.entries(CATEGORY_VECTORS)) {
    const cosine = cosineSim(queryVec, catVec);
    const boost  = keywordBoost(tokens, key);
    scores[key] = Math.min(cosine + boost, 1.0);
  }

  // Sort by score descending
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryKey, primaryScore] = sorted[0];
  const topThreshold = Math.max(primaryScore * 0.6, 0.05);
  const secondary = sorted
    .slice(1)
    .filter(([, s]) => s >= topThreshold)
    .slice(0, 2)
    .map(([k]) => k);

  // Normalise confidence to 0-100%
  const confidence = Math.round(
    ((primaryScore - 0) / (sorted[0][1] > 0 ? sorted[0][1] : 1)) * 100
  );

  return {
    primary:       primaryKey,
    primaryLabel:  INTENT_VOCAB[primaryKey].label,
    primaryIcon:   INTENT_VOCAB[primaryKey].icon,
    primaryActs:   INTENT_VOCAB[primaryKey].acts,
    secondary,
    secondaryLabels: secondary.map(k => INTENT_VOCAB[k].label),
    confidence:    Math.min(confidence, 98),
    allScores:     Object.fromEntries(sorted),
  };
}

// ── Utility: get all acts associated with detected intents ────────────────────
function getIntentActs(intentResult) {
  const acts = new Set(intentResult.primaryActs || []);
  intentResult.secondary.forEach(k => {
    (INTENT_VOCAB[k]?.acts || []).forEach(a => acts.add(a));
  });
  return [...acts];
}

module.exports = { classifyIntent, getIntentActs, INTENT_VOCAB };
