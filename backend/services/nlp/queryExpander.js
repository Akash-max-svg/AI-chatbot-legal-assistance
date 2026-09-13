/**
 * queryExpander.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Legal query expansion using:
 *  1. Curated Indian-law synonym thesaurus
 *  2. Act-specific section alias expansion
 *  3. Legal concept normalisation (e.g. "first information report" → "FIR")
 *  4. Bi-gram & tri-gram legal phrase detection
 *
 * No external API calls — fully in-process.
 */

'use strict';

// ── Legal synonym thesaurus ───────────────────────────────────────────────────
// Each entry: canonical term → array of synonyms/related terms
const LEGAL_THESAURUS = {
  // Crime & Violence
  'murder':           ['homicide', 'killing', 'culpable homicide', 'death', 'manslaughter', 'S302', 'S300', 'S101 BNS'],
  'rape':             ['sexual assault', 'molestation', 'outraging modesty', 'S375', 'S376', 'S63 BNS', 'S64 BNS'],
  'theft':            ['stealing', 'larceny', 'shoplifting', 'S378', 'S379', 'pilferage'],
  'robbery':          ['snatching', 'mugging', 'dacoity', 'S390', 'S392'],
  'assault':          ['battery', 'hurt', 'grievous hurt', 'bodily harm', 'S319', 'S320', 'S323', 'S325'],
  'kidnapping':       ['abduction', 'missing person', 'child trafficking', 'S360', 'S362', 'S363'],
  'fraud':            ['cheating', 'scam', 'deception', 'misrepresentation', 'S415', 'S420', 'S17 ICA'],
  'forgery':          ['fake document', 'counterfeit', 'false document', 'S463', 'S465', 'S471'],
  'bribery':          ['corruption', 'gratification', 'kickback', 'S7 PCA', 'S8 PCA', 'S13 PCA'],
  'extortion':        ['blackmail', 'threat', 'ransom', 'S383', 'S384', 'S386'],
  'dowry':            ['stridhan', 'bridal gift', 'S498A', 'S304B', 'Dowry Prohibition Act'],
  'domestic violence':['cruelty', 'wife beating', 'S498A', 'PWDVA', 'Protection of Women'],
  'stalking':         ['following', 'harassing', 'S354D', 'S79 BNS'],
  'drug':             ['narcotic', 'psychotropic', 'controlled substance', 'NDPS', 'S8 NDPS', 'cocaine', 'heroin', 'cannabis'],

  // Property
  'sale deed':        ['conveyance deed', 'transfer deed', 'registered document', 'S54 TPA'],
  'mortgage':         ['hypothecation', 'charge', 'encumbrance', 'S58 TPA', 'security interest'],
  'lease':            ['rental agreement', 'tenancy', 'rent agreement', 'S105 TPA'],
  'eviction':         ['dispossession', 'ejectment', 'possession recovery', 'S6 SRA', 'unlawful entry'],
  'partition':        ['division', 'share', 'family settlement', 'S54 CPC', 'coparcenary'],
  'will':             ['testament', 'last will', 'S63 ISA', 'probate', 'S222 ISA'],
  'land':             ['immovable property', 'plot', 'khasra', 'patta', 'khata', 'title deed'],
  'adverse possession':['limitation', '12 years possession', 'S65 LA', 'S27 LA'],

  // Family
  'divorce':          ['dissolution of marriage', 'judicial separation', 'S13 HMA', 'S13B HMA', 'S10 IDA'],
  'maintenance':      ['alimony', 'financial support', 'S125 CrPC', 'S24 HMA', 'S25 HMA'],
  'custody':          ['guardianship', 'child care', 'S26 HMA', 'GWA', 'best interest of child'],
  'adoption':         ['CARA', 'HAMA', 'JJA S56', 'adoptive parent'],
  'inheritance':      ['succession', 'heir', 'legal heir', 'HSA', 'ISA', 'intestate'],

  // Procedure
  'fir':              ['first information report', 'police complaint', 'S154 CrPC', 'S173 BNSS', 'lodging complaint'],
  'bail':             ['anticipatory bail', 'regular bail', 'S437 CrPC', 'S438 CrPC', 'S439 CrPC', 'release'],
  'arrest':           ['detention', 'custody', 'taken into custody', 'S41 CrPC', 'S35 BNSS'],
  'chargesheet':      ['charge sheet', 'challan', 'S173 CrPC', 'final report', 'police report'],
  'remand':           ['judicial custody', 'police custody', 'S167 CrPC', 'S187 BNSS'],
  'appeal':           ['revision', 'challenge', 'S374 CrPC', 'S96 CPC', 'S100 CPC'],
  'notice':           ['legal notice', 'demand notice', 'show cause', 'summons', 'S80 CPC'],
  'injunction':       ['stay order', 'restraint', 'Order 39 CPC', 'S37 SRA', 'S38 SRA'],
  'contempt':         ['disobedience', 'non-compliance', 'S345 CrPC', 'Contempt of Courts Act'],

  // Constitutional
  'fundamental rights':['basic rights', 'constitutional rights', 'Part III', 'Article 12-35'],
  'writ':             ['habeas corpus', 'mandamus', 'certiorari', 'prohibition', 'quo warranto', 'Article 226', 'Article 32'],
  'pil':              ['public interest litigation', 'suo motu', 'pro bono', 'collective rights'],
  'reservation':      ['quota', 'SC ST OBC reservation', 'Article 16(4)', 'Indra Sawhney'],

  // Labour
  'retrenchment':     ['layoff', 'termination', 'redundancy', 'S25F Industrial Disputes', 'S55 IRC'],
  'provident fund':   ['pf', 'epf', 'EPFO', 'S6 EPF', 'retirement benefit'],
  'gratuity':         ['retirement gratuity', 'S4 Gratuity Act', 'S50 SSC', 'long service benefit'],
  'maternity leave':  ['maternity benefit', 'S5A MBA', 'pregnancy leave', 'twenty-six weeks'],
  'sexual harassment':['posh', 'ICC', 'Internal Committee', 'S4 POSH', 'workplace harassment'],

  // Tax
  'income tax':       ['IT Act', 'ITR', 'I-T return', 'S4 ITA', 'direct tax'],
  'gst':              ['goods and services tax', 'S9 CGST', 'indirect tax', 'input tax credit', 'ITC'],
  'tds':              ['tax deducted at source', 'S192', 'S194A', 'withholding tax'],

  // Consumer
  'consumer complaint':['deficiency of service', 'consumer forum', 'NCDRC', 'S34 CPA', 'S58 CPA'],
  'product liability':['defective product', 'manufacturing defect', 'S83 CPA', 'recall'],

  // Corporate
  'company':          ['corporation', 'private limited', 'public limited', 'Companies Act 2013', 'MCA'],
  'insolvency':       ['bankruptcy', 'IBC', 'NCLT', 'S7 IBC', 'CIRP', 'resolution plan'],
  'cheque bounce':    ['dishonour of cheque', 'S138 NIA', 'insufficient funds', 'cheque return'],
};

// ── Legal phrase normaliser (bi-gram and tri-gram) ───────────────────────────
const PHRASE_NORMALISERS = [
  // Expand abbreviations
  [/\bfir\b/gi,               'FIR first information report'],
  [/\bipc\b/gi,               'IPC Indian Penal Code'],
  [/\bcrpc\b/gi,              'CrPC Code of Criminal Procedure'],
  [/\bbns\b/gi,               'BNS Bharatiya Nyaya Sanhita'],
  [/\bbnss\b/gi,              'BNSS Bharatiya Nagarik Suraksha Sanhita'],
  [/\biea\b/gi,               'IEA Indian Evidence Act'],
  [/\bcpc\b/gi,               'CPC Code of Civil Procedure'],
  [/\bhma\b/gi,               'HMA Hindu Marriage Act'],
  [/\bhsa\b/gi,               'HSA Hindu Succession Act'],
  [/\bndps\b/gi,              'NDPS Narcotic Drugs Psychotropic Substances'],
  [/\buapa\b/gi,              'UAPA Unlawful Activities Prevention Act terrorism'],
  [/\bpmla\b/gi,              'PMLA Prevention of Money Laundering Act'],
  [/\bposh\b/gi,              'POSH Sexual Harassment Women Workplace Act'],
  [/\bpocso\b/gi,             'POCSO Protection of Children Sexual Offences Act'],
  [/\brera\b/gi,              'RERA Real Estate Regulation Development Act property'],
  [/\brti\b/gi,               'RTI Right to Information Act'],
  [/\bpil\b/gi,               'PIL public interest litigation'],
  [/\bgst\b/gi,               'GST goods services tax'],
  [/\btds\b/gi,               'TDS tax deducted source income'],
  [/\bibc\b/gi,               'IBC Insolvency Bankruptcy Code CIRP'],
  [/\bnclt\b/gi,              'NCLT National Company Law Tribunal'],
  [/\bngt\b/gi,               'NGT National Green Tribunal environment'],
  // Common misspellings / colloquial
  [/\bkidnap(p?ing)?\b/gi,    'kidnapping abduction S360 S362'],
  [/\bhit and run\b/gi,       'accident negligence S304A IPC S106(2) BNS MVA'],
  [/\band run\b/gi,           'accident motor vehicle S279 IPC hit run'],
  [/\bblack ?mail\b/gi,       'blackmail extortion S383 S384 IPC'],
  [/\bon ?line (fraud|scam)\b/gi, 'cyber fraud cheating S66D IT Act S420 IPC'],
  [/\bwill(s)? (dispute|fight)\b/gi, 'succession will probate ISA S63'],
  [/\bproperty dispute\b/gi,  'civil suit TPA registration title immovable'],
  [/\blabour problem\b/gi,    'industrial dispute retrenchment wages employee employer'],
  [/\bcompany problem\b/gi,   'Companies Act 2013 NCLT director shareholder'],
];

// ── Section reference expander ────────────────────────────────────────────────
// When user says "Section 302" — add related sections automatically
const SECTION_NEIGHBOURS = {
  '302':  ['299', '300', '301', '304', '307'],   // Murder neighbours
  '376':  ['375', '376A', '376B', '376D', '354'], // Rape neighbours
  '420':  ['415', '417', '418', '419', '463'],    // Cheating neighbours
  '498A': ['304B', '306', 'DPA'],                 // Dowry cruelty neighbours
  '138':  ['139', '140', '141', '142', '143'],    // NIA cheque bounce
  '125':  ['126', '127', '128', 'S24 HMA'],       // Maintenance
  '34':   ['107', '109', '120A', '120B', '149'],  // Joint liability
  '307':  ['302', '304', '308', '511'],           // Attempt murder
  '436':  ['437', '438', '439', '436A'],          // Bail
  '154':  ['155', '156', '161', '164', '173'],    // FIR investigation
};

// ── Main expander function ────────────────────────────────────────────────────
/**
 * @param {string} query  — original user query
 * @param {object} intentResult — from intentClassifier
 * @returns {{ expandedQuery: string, addedTerms: string[], sectionHints: string[] }}
 */
function expandQuery(query, intentResult = {}) {
  let expanded = query;
  const addedTerms = new Set();
  const sectionHints = new Set();

  // ── Step 1: Apply phrase normalisers ──────────────────────────────────────
  for (const [pattern, replacement] of PHRASE_NORMALISERS) {
    if (pattern.test(expanded)) {
      expanded = expanded.replace(pattern, `$& ${replacement}`);
      // Extract any section hints from replacement
      replacement.split(' ').filter(t => /^S\d/.test(t)).forEach(s => sectionHints.add(s));
    }
  }

  // ── Step 2: Synonym expansion via thesaurus ───────────────────────────────
  const lowerQuery = query.toLowerCase();
  for (const [canonical, synonyms] of Object.entries(LEGAL_THESAURUS)) {
    if (lowerQuery.includes(canonical)) {
      const newTerms = synonyms.filter(s => !lowerQuery.includes(s.toLowerCase()));
      newTerms.slice(0, 4).forEach(t => {
        addedTerms.add(t);
        if (/^S\d|^Article/.test(t)) sectionHints.add(t);
      });
    }
  }

  // ── Step 3: Section neighbour expansion ───────────────────────────────────
  const sectionMatches = query.match(/\b(?:section|s\.?)\s*(\d+[A-Za-z]*)/gi) || [];
  sectionMatches.forEach(m => {
    const num = m.replace(/(?:section|s\.?)\s*/i, '').trim();
    const neighbours = SECTION_NEIGHBOURS[num];
    if (neighbours) neighbours.forEach(n => sectionHints.add(n));
  });

  // ── Step 4: Intent-based act injection ────────────────────────────────────
  const intentActs = intentResult.primaryActs || [];
  const actTerms = intentActs.slice(0, 2).map(a => a.toLowerCase());
  actTerms.forEach(a => {
    if (!lowerQuery.includes(a)) addedTerms.add(a);
  });

  // Build final expanded query
  const allAdded = [...addedTerms].slice(0, 12);
  const expandedQuery = [expanded, ...allAdded].join(' ');

  return {
    expandedQuery,
    addedTerms:   [...addedTerms],
    sectionHints: [...sectionHints],
    originalQuery: query,
  };
}

module.exports = { expandQuery, LEGAL_THESAURUS };
