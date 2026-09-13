/**
 * legalNER.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Rule-based Named Entity Recognition for Indian legal text.
 * Extracts: section references, act names, court names, legal roles,
 * legal concepts, monetary amounts, dates, and punishments.
 *
 * Returns a structured entity map used to boost retrieval precision.
 */

'use strict';

// ── Entity patterns ───────────────────────────────────────────────────────────
const ENTITY_PATTERNS = {

  // Section references (IPC S302, Article 21, Section 498-A etc.)
  SECTION_REF: [
    /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z\-]*(?:\([a-z0-9]+\))?)\s+(?:of\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)*)?/gi,
    /(?:article|art\.?)\s*(\d+[A-Za-z\-]*(?:\([a-z0-9]+\))?)/gi,
    /([A-Z]{2,6})\s+(?:section|sec\.?|s\.)\s*(\d+[A-Za-z\-]*)/gi,
    /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z\-]*)/gi,
  ],

  // Act names
  ACT_NAME: [
    /(?:Indian\s+Penal\s+Code|IPC)/gi,
    /(?:Bharatiya\s+Nyaya\s+Sanhita|BNS)/gi,
    /(?:Code\s+of\s+Criminal\s+Procedure|CrPC)/gi,
    /(?:Bharatiya\s+Nagarik\s+Suraksha\s+Sanhita|BNSS)/gi,
    /(?:Indian\s+Evidence\s+Act|IEA|Bharatiya\s+Sakshya\s+Adhiniyam|BSA)/gi,
    /(?:Code\s+of\s+Civil\s+Procedure|CPC)/gi,
    /(?:Hindu\s+Marriage\s+Act|HMA)/gi,
    /(?:Hindu\s+Succession\s+Act|HSA)/gi,
    /(?:Consumer\s+Protection\s+Act|CPA)/gi,
    /(?:Information\s+Technology\s+Act|IT\s+Act|ITA)/gi,
    /(?:NDPS|Narcotic\s+Drugs)/gi,
    /(?:UAPA|Unlawful\s+Activities)/gi,
    /(?:PMLA|Money\s+Laundering)/gi,
    /(?:POCSO|Protection\s+of\s+Children)/gi,
    /(?:POSH|Sexual\s+Harassment\s+.*Workplace)/gi,
    /(?:RTI\s+Act|Right\s+to\s+Information)/gi,
    /(?:Companies\s+Act)/gi,
    /(?:IBC|Insolvency\s+and\s+Bankruptcy)/gi,
    /(?:RERA|Real\s+Estate\s+.*Regulation)/gi,
    /(?:Motor\s+Vehicles\s+Act|MVA)/gi,
    /(?:Domestic\s+Violence\s+Act|PWDVA)/gi,
    /(?:Dowry\s+Prohibition\s+Act)/gi,
    /(?:Arbitration\s+.*Conciliation\s+Act)/gi,
    /(?:Transfer\s+of\s+Property\s+Act|TPA)/gi,
    /(?:Indian\s+Contract\s+Act|ICA)/gi,
    /(?:Arms\s+Act)/gi,
    /(?:Explosives\s+Act)/gi,
    /(?:Prevention\s+of\s+Corruption\s+Act|PCA)/gi,
    /(?:Constitution\s+of\s+India|COI)/gi,
    /(?:NGT|National\s+Green\s+Tribunal)/gi,
    /(?:GST|Goods\s+and\s+Services\s+Tax)/gi,
    /(?:Income\s+Tax\s+Act)/gi,
  ],

  // Court names
  COURT: [
    /(?:Supreme\s+Court(?:\s+of\s+India)?)/gi,
    /(?:High\s+Court(?:\s+of\s+\w+)?)/gi,
    /(?:Sessions\s+(?:Court|Judge))/gi,
    /(?:District\s+Court|District\s+Judge)/gi,
    /(?:Magistrate(?:'s)?\s+Court|Judicial\s+Magistrate)/gi,
    /(?:Chief\s+Judicial\s+Magistrate|CJM)/gi,
    /(?:Metropolitan\s+Magistrate)/gi,
    /(?:Family\s+Court)/gi,
    /(?:Consumer\s+Forum|Consumer\s+Commission|NCDRC)/gi,
    /(?:Labour\s+Court|Industrial\s+Tribunal)/gi,
    /(?:National\s+Green\s+Tribunal|NGT)/gi,
    /(?:NCLT|NCLAT)/gi,
    /(?:Lok\s+Adalat)/gi,
    /(?:Debt\s+Recovery\s+Tribunal|DRT)/gi,
    /(?:Income\s+Tax\s+Appellate\s+Tribunal|ITAT)/gi,
    /(?:Special\s+Court)/gi,
  ],

  // Legal roles / parties
  LEGAL_ROLE: [
    /\b(accused|defendant|plaintiff|petitioner|respondent|complainant)\b/gi,
    /\b(appellant|applicant|informant|victim|witness|deponent)\b/gi,
    /\b(surety|guarantor|indemnifier|bailor|bailee|mortgagor|mortgagee)\b/gi,
    /\b(landlord|tenant|lessor|lessee|licensor|licensee)\b/gi,
    /\b(agent|principal|employer|employee|workman|worker)\b/gi,
    /\b(husband|wife|spouse|guardian|ward|minor)\b/gi,
    /\b(executor|administrator|trustee|beneficiary|heir|legatee)\b/gi,
    /\b(drawer|drawee|payee|endorser|endorsee)\b/gi,
    /\b(director|shareholder|promoter|auditor|company secretary)\b/gi,
    /\b(public prosecutor|advocate|vakil|pleader|amicus curiae)\b/gi,
    /\b(investigating officer|police officer|magistrate|judge)\b/gi,
  ],

  // Monetary amounts
  AMOUNT: [
    /(?:rs\.?|rupees?|inr)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|lakhs|crore|crores|thousand|million|billion))?/gi,
    /[\d,]+(?:\.\d+)?\s*(?:lakh|lakhs|crore|crores)\s+(?:rupees?)?/gi,
  ],

  // Punishments / reliefs
  PUNISHMENT: [
    /(?:death\s+penalty|capital\s+punishment|death\s+sentence)/gi,
    /(?:life\s+imprisonment|imprisonment\s+for\s+life)/gi,
    /(?:rigorous\s+imprisonment|RI)/gi,
    /(?:simple\s+imprisonment|SI)/gi,
    /\d+\s+years?(?:\s+(?:rigorous|simple))?\s+imprisonment/gi,
    /\d+\s+months?\s+imprisonment/gi,
    /(?:bail|anticipatory\s+bail|default\s+bail|interim\s+bail)/gi,
    /(?:injunction|stay\s+order|ex\s+parte\s+order)/gi,
    /(?:compensation|damages|costs|refund|restitution)/gi,
    /(?:acquittal|discharge|conviction)/gi,
  ],

  // Time periods
  TIME_PERIOD: [
    /\d+\s+(?:days?|months?|years?)\b/gi,
    /(?:within|before|after|during)\s+\d+\s+(?:days?|months?|years?)/gi,
    /(?:limitation\s+period|prescription|time\s+bar)/gi,
  ],
};

// ── Known landmark case references ───────────────────────────────────────────
const LANDMARK_CASES = [
  { pattern: /Bachan\s+Singh/gi,       topic: 'death penalty rarest of rare sentencing' },
  { pattern: /Maneka\s+Gandhi/gi,       topic: 'Article 21 liberty fair procedure golden triangle' },
  { pattern: /Kesavananda\s+Bharati/gi, topic: 'basic structure constitution amendment Parliament' },
  { pattern: /Vishaka/gi,              topic: 'sexual harassment workplace guidelines POSH' },
  { pattern: /Puttaswamy/gi,           topic: 'right to privacy Article 21 fundamental right' },
  { pattern: /Navtej\s+Johar/gi,       topic: 'Section 377 LGBTQ decriminalisation' },
  { pattern: /Indra\s+Sawhney/gi,      topic: 'OBC reservation 50 percent creamy layer' },
  { pattern: /Arnesh\s+Kumar/gi,       topic: 'arrest safeguards Section 498A Section 41A CrPC' },
  { pattern: /Gian\s+Singh/gi,         topic: 'quash FIR Section 482 CrPC non-compoundable settlement' },
  { pattern: /SR\s+Bommai/gi,          topic: "Article 356 President's Rule floor test secularism" },
  { pattern: /MC\s+Mehta/gi,           topic: 'absolute liability environment pollution hazardous' },
  { pattern: /Olga\s+Tellis/gi,        topic: 'right to livelihood Article 21 slum dwellers' },
  { pattern: /Hussainara\s+Khatoon/gi, topic: 'speedy trial undertrial legal aid fundamental right' },
  { pattern: /Joseph\s+Shine/gi,       topic: 'adultery Section 497 struck down unconstitutional' },
  { pattern: /Shayara\s+Bano/gi,       topic: 'triple talaq void Muslim women 2017' },
  { pattern: /Vineeta\s+Sharma/gi,     topic: 'daughter coparcener HSA 2005 amendment retroactive' },
  { pattern: /NALSA/gi,                topic: 'transgender third gender Article 21 identity' },
  { pattern: /Satender.*Antil/gi,      topic: 'bail guidelines prolonged custody half period' },
];

// ── Main NER function ─────────────────────────────────────────────────────────
/**
 * @param {string} text
 * @returns {{ sections: string[], acts: string[], courts: string[],
 *             roles: string[], amounts: string[], punishments: string[],
 *             timePeriods: string[], landmarkCases: string[],
 *             allEntities: string[], contextHints: string[] }}
 */
function extractEntities(text) {
  const entities = {
    sections:      new Set(),
    acts:          new Set(),
    courts:        new Set(),
    roles:         new Set(),
    amounts:       new Set(),
    punishments:   new Set(),
    timePeriods:   new Set(),
    landmarkCases: new Set(),
    contextHints:  new Set(),
  };

  // ── Section references ────────────────────────────────────────────────────
  // Pattern 1: "Section 302 IPC" or "s.498A"
  const secActPattern = /(?:section|sec\.?|s\.)\s*(\d+[A-Za-z\-]*)\s*(?:of\s+the\s+)?([A-Z]{2,6})?/gi;
  let m;
  while ((m = secActPattern.exec(text)) !== null) {
    const sec = m[1].replace(/-/g, '').toUpperCase();
    const act = m[2] || '';
    entities.sections.add(act ? `${act}-${sec}` : sec);
    if (act) entities.acts.add(act);
  }

  // Pattern 2: "IPC Section 302" or "BNS S.103"
  const actSecPattern = /([A-Z]{2,6})\s+(?:section|sec\.?|s\.)\s*(\d+[A-Za-z\-]*)/gi;
  while ((m = actSecPattern.exec(text)) !== null) {
    entities.sections.add(`${m[1]}-${m[2].replace(/-/g, '').toUpperCase()}`);
    entities.acts.add(m[1]);
  }

  // Pattern 3: "Article 21" → COI
  const articlePattern = /article\s*(\d+[A-Za-z\-]*(?:\([a-z0-9]+\))?)/gi;
  while ((m = articlePattern.exec(text)) !== null) {
    entities.sections.add(`COI-${m[1].toUpperCase()}`);
    entities.acts.add('COI');
    entities.contextHints.add('constitutional law fundamental rights');
  }

  // ── Act names ─────────────────────────────────────────────────────────────
  for (const pattern of ENTITY_PATTERNS.ACT_NAME) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) match.forEach(a => entities.acts.add(a.trim().replace(/\s+/g, ' ')));
    }
  }

  // ── Courts ────────────────────────────────────────────────────────────────
  for (const pattern of ENTITY_PATTERNS.COURT) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) matches.forEach(c => entities.courts.add(c.trim()));
  }

  // ── Legal roles ───────────────────────────────────────────────────────────
  for (const pattern of ENTITY_PATTERNS.LEGAL_ROLE) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) matches.forEach(r => entities.roles.add(r.toLowerCase()));
  }

  // ── Amounts ───────────────────────────────────────────────────────────────
  for (const pattern of ENTITY_PATTERNS.AMOUNT) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) matches.forEach(a => entities.amounts.add(a.trim()));
  }

  // ── Punishments ───────────────────────────────────────────────────────────
  for (const pattern of ENTITY_PATTERNS.PUNISHMENT) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) matches.forEach(p => entities.punishments.add(p.toLowerCase()));
  }

  // ── Time periods ──────────────────────────────────────────────────────────
  for (const pattern of ENTITY_PATTERNS.TIME_PERIOD) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) matches.forEach(t => entities.timePeriods.add(t.toLowerCase()));
  }

  // ── Landmark cases ────────────────────────────────────────────────────────
  for (const { pattern, topic } of LANDMARK_CASES) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      entities.landmarkCases.add(topic);
      topic.split(' ').forEach(t => entities.contextHints.add(t));
    }
  }

  // Build allEntities flat array (for prompt injection)
  const allEntities = [
    ...[...entities.sections].map(s => `§${s}`),
    ...[...entities.acts],
    ...[...entities.courts],
    ...[...entities.landmarkCases],
  ];

  return {
    sections:      [...entities.sections],
    acts:          [...entities.acts],
    courts:        [...entities.courts],
    roles:         [...entities.roles],
    amounts:       [...entities.amounts],
    punishments:   [...entities.punishments],
    timePeriods:   [...entities.timePeriods],
    landmarkCases: [...entities.landmarkCases],
    contextHints:  [...entities.contextHints],
    allEntities,
    hasEntities:   allEntities.length > 0,
  };
}

// ── Extract bare section numbers for database lookup ─────────────────────────
function extractSectionNumbers(nerResult) {
  return nerResult.sections.map(s => {
    const parts = s.split('-');
    return parts.length > 1
      ? { act: parts[0], section: parts.slice(1).join('') }
      : { act: null, section: s };
  });
}

module.exports = { extractEntities, extractSectionNumbers };
