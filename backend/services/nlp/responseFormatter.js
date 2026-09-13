/**
 * responseFormatter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Transforms the raw Gemini structured response + NLP metadata into a
 * polished, well-organised reply with:
 *   • Confidence badge
 *   • Clear answer paragraphs
 *   • Numbered step-by-step procedure
 *   • Summary table of applicable sections
 *   • Key rights / deadlines callout
 */

'use strict';

/**
 * Format a structured AI response into enhanced markdown output
 * @param {object} structured  — AI structured response object
 * @param {object} nlpMeta     — {intent, confidence, nerResult, retrievedSections}
 * @returns {string}           — Enhanced markdown string
 */
function formatEnhancedResponse(structured, nlpMeta = {}) {
  if (!structured || typeof structured !== 'object') return '';

  const {
    relevantActs = [],
    relevantSections = [],
    legalRights = [],
    filingProcedure = [],
    requiredDocuments = [],
    courtToApproach = '',
    governmentDepartment = '',
    estimatedTimeline = '',
    suggestedNextSteps = [],
    mediationPossibility = '',
    disclaimer = '',
    ipcSections = [],
  } = structured;

  const {
    intent,
    confidence = 0,
    nerResult = {},
  } = nlpMeta;

  const parts = [];

  // ── 1. Confidence & intent header ──────────────────────────────────────────
  if (intent && confidence > 0) {
    const bar = buildConfidenceBar(confidence);
    parts.push(
      `> **${intent.primaryIcon || '⚖️'} ${intent.primaryLabel || 'Legal Query'}** — ` +
      `Confidence: ${bar} **${confidence}%**\n`
    );
  }

  // ── 2. Applicable laws table ───────────────────────────────────────────────
  const allSectionRefs = [
    ...relevantSections,
    ...(nerResult.sections || []).map(s => s.replace('-', ' §')),
  ].filter(Boolean);

  if (allSectionRefs.length > 0 || relevantActs.length > 0) {
    parts.push('### 📋 Applicable Laws & Sections\n');
    if (relevantActs.length > 0) {
      parts.push('**Acts:** ' + relevantActs.join(' • ') + '\n');
    }
    if (allSectionRefs.length > 0) {
      const uniqueSecs = [...new Set(allSectionRefs)].slice(0, 8);
      parts.push('**Sections:** ' + uniqueSecs.map(s => `\`${s}\``).join(' • ') + '\n');
    }
  }

  // ── 3. Legal rights ────────────────────────────────────────────────────────
  if (legalRights.length > 0) {
    parts.push('\n### ✅ Your Legal Rights\n');
    legalRights.slice(0, 6).forEach(r => {
      parts.push(`- ${r}`);
    });
    parts.push('');
  }

  // ── 4. Step-by-step procedure ──────────────────────────────────────────────
  if (filingProcedure.length > 0) {
    parts.push('\n### 🪜 Step-by-Step Procedure\n');
    filingProcedure.forEach((step, i) => {
      parts.push(`**${i + 1}.** ${step}`);
    });
    parts.push('');
  }

  // ── 5. Documents required ─────────────────────────────────────────────────
  if (requiredDocuments.length > 0) {
    parts.push('\n### 📄 Required Documents\n');
    requiredDocuments.slice(0, 8).forEach(d => {
      parts.push(`- ${d}`);
    });
    parts.push('');
  }

  // ── 6. Court / authority & timeline ──────────────────────────────────────
  const details = [];
  if (courtToApproach)     details.push(`**🏛️ Court/Authority:** ${courtToApproach}`);
  if (governmentDepartment) details.push(`**🏢 Department:** ${governmentDepartment}`);
  if (estimatedTimeline)   details.push(`**⏱️ Timeline:** ${estimatedTimeline}`);
  if (mediationPossibility && mediationPossibility.toLowerCase() !== 'n/a') {
    details.push(`**🤝 Mediation:** ${mediationPossibility}`);
  }
  if (details.length > 0) {
    parts.push('\n### 🔎 Key Details\n');
    parts.push(details.join('\n') + '\n');
  }

  // ── 7. Suggested next steps ────────────────────────────────────────────────
  if (suggestedNextSteps.length > 0) {
    parts.push('\n### 🚀 Recommended Next Steps\n');
    suggestedNextSteps.slice(0, 5).forEach((s, i) => {
      parts.push(`${i + 1}. ${s}`);
    });
    parts.push('');
  }

  // ── 8. Disclaimer ─────────────────────────────────────────────────────────
  if (disclaimer) {
    parts.push(`\n---\n> ⚠️ *${disclaimer}*`);
  }

  return parts.join('\n');
}

/**
 * Build a Unicode progress bar for confidence display
 */
function buildConfidenceBar(pct) {
  const filled = Math.round((pct / 100) * 5);
  return '█'.repeat(filled) + '░'.repeat(5 - filled);
}

/**
 * Build a concise summary when the full response is too long
 */
function buildShortSummary(answer, lawSections = []) {
  const maxLen = 600;
  const trimmed = answer.length > maxLen
    ? answer.substring(0, maxLen) + '…'
    : answer;

  if (lawSections.length === 0) return trimmed;

  const secList = lawSections
    .slice(0, 4)
    .map(s => `${s.act_short} §${s.section} (${s.section_title})`)
    .join('; ');

  return `${trimmed}\n\n**Applicable sections:** ${secList}`;
}

/**
 * Validate and clean AI response — ensure minimum quality
 */
function validateAnswer(answer, lawSections = [], query = '') {
  if (!answer || typeof answer !== 'string') return null;

  // Too short — likely a failed generation
  if (answer.trim().length < 80) return null;

  // Mostly URL-only response
  if (/^https?:\/\/\S+$/.test(answer.trim())) return null;

  return answer;
}

/**
 * Build fallback answer when Gemini fails entirely
 */
function buildFallbackAnswer(query, lawSections = [], intent = null) {
  const secLine = lawSections.length > 0
    ? `\n\nBased on your query, the following laws appear relevant:\n` +
      lawSections.slice(0, 5).map(s =>
        `- **${s.act_short} §${s.section}** — ${s.section_title}`
      ).join('\n')
    : '';

  const intentLine = intent
    ? `\n\nYour question appears to relate to **${intent.primaryLabel}**.`
    : '';

  return (
    `I understand you have a legal question about: *"${query}"*${intentLine}` +
    secLine +
    `\n\nFor a complete legal answer, please consult a qualified advocate. ` +
    `You can also file a complaint or seek information at your nearest **District Legal Services Authority (DLSA)** or **Lok Adalat**.`
  );
}

module.exports = {
  formatEnhancedResponse,
  buildShortSummary,
  validateAnswer,
  buildFallbackAnswer,
};
