const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = __dirname;
const OUTPUT = path.join(DATA_DIR, 'internet_supplement.json');
const REPO_BASE = 'https://raw.githubusercontent.com/cvignesh/Legal_Assistant/717bedaf480ceaa9eebc8c52c3813976b7302aa0';

const ACT_FILES = [
  '/_legacy_poc/poc_chunks/BNS_chunks.json',
  '/_legacy_poc/poc_chunks/BNSS_chunks.json',
  '/_legacy_poc/poc_chunks/BSA_chunks.json',
  '/_legacy_poc/poc_chunks/engaadhaar_Central_act_chunks.json',
  '/_legacy_poc/poc_chunks/indiantelegraphact_1885_chunks.json',
  '/_legacy_poc/poc_chunks/informatio_act_central_chunks.json',
  '/_legacy_poc/poc_chunks/it_act_2000_updated_chunks.json',
  '/_legacy_poc/poc_chunks/the_tamil_nadu_laws_(special_provisions)_act,_2007_chunks.json',
  '/_legacy_poc/poc_chunks/TN_money_lenders_act_state_chunks.json',
  'https://raw.githubusercontent.com/bugWeiser/chitragupt/718e13359934ebb2e02446e7ebeba52ccb818f84/frontend/data/legal/criminal/bns-sections.json',
  'https://raw.githubusercontent.com/bugWeiser/chitragupt/718e13359934ebb2e02446e7ebeba52ccb818f84/frontend/data/legal/civil/consumer-protection-act-2019.json',
  'https://raw.githubusercontent.com/bugWeiser/chitragupt/718e13359934ebb2e02446e7ebeba52ccb818f84/frontend/data/legal/civil/rent-control-acts.json'
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchText(res.headers.location));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function normalizeKeywords(text, title) {
  const source = `${title} ${text}`.toLowerCase();
  return [...new Set(source.match(/[a-z]{4,}/g) || [])].slice(0, 18);
}

function splitLongText(text, maxLength = 650) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length <= maxLength) return [normalized];
  const parts = [];
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  let current = '';
  for (const sentence of sentences) {
    if (!sentence) continue;
    if ((current + ' ' + sentence).trim().length <= maxLength) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) parts.push(current);
      current = sentence;
    }
  }
  if (current) parts.push(current);
  return parts.length ? parts : [normalized.slice(0, maxLength)];
}

function parseActChunkFile(payload) {
  if (!payload || !Array.isArray(payload.chunks)) return [];
  const actName = payload.act_name || 'Internet-sourced Act';
  const actShort = payload.act_short || 'ACT';
  const entries = [];
  for (const chunk of payload.chunks) {
    const chunkText = String(chunk.text_for_embedding || chunk.text || chunk.content || '');
    const sectionMatch = chunkText.match(/Section\s*[:#-]?\s*([A-Za-z0-9/-]+)/i) || chunkText.match(/section\s*([A-Za-z0-9/-]+)/i);
    const chapterMatch = chunkText.match(/Chapter\s+([A-Za-z0-9\s-]+)/i);
    const section = sectionMatch ? sectionMatch[1].trim() : (chunk.chunk_id || 'Section');
    const title = chunk.chunk_id || `${actShort} ${section}`;
    const descParts = splitLongText(chunkText);
    for (let i = 0; i < descParts.length; i++) {
      const desc = descParts[i];
      if (!desc) continue;
      entries.push({
        id: `${actShort}-${String(chunk.chunk_id || section).replace(/\s+/g, '-')}-${i + 1}`,
        act: actName,
        act_short: actShort,
        section: `${String(section)}${descParts.length > 1 ? `.${i + 1}` : ''}`,
        section_title: descParts.length > 1 ? `${title} (Part ${i + 1})` : title,
        section_desc: desc.substring(0, 2500),
        chapter: chapterMatch ? chapterMatch[1].trim() : '',
        chapter_title: chapterMatch ? chapterMatch[1].trim() : '',
        category: 'Internet-sourced Act',
        keywords: normalizeKeywords(desc, title),
      });
    }
  }
  return entries;
}

function parseStructuredSectionFile(payload) {
  if (!payload || !Array.isArray(payload.sections)) return [];
  const actName = payload.act || 'Internet-sourced Act';
  const actShort = payload.act_short || 'ACT';
  const entries = [];
  for (const section of payload.sections) {
    const num = String(section.section_number || section.sectionNo || section.number || '');
    const title = String(section.title || section.section_title || section.name || `${actShort} ${num}`);
    const descSources = [section.plain_language, section.description, section.content, section.summary].filter(Boolean);
    const text = descSources.join(' ');
    if (!text) continue;
    const descParts = splitLongText(text);
    for (let i = 0; i < descParts.length; i++) {
      const desc = descParts[i];
      entries.push({
        id: `${actShort}-${num || 'section'}-${i + 1}`,
        act: actName,
        act_short: actShort,
        section: `${num || 'section'}${descParts.length > 1 ? `.${i + 1}` : ''}`,
        section_title: descParts.length > 1 ? `${title} (Part ${i + 1})` : title,
        section_desc: desc.substring(0, 2500),
        chapter: payload.act || 'Internet-sourced Act',
        chapter_title: payload.act || 'Internet-sourced Act',
        category: 'Internet-sourced Act',
        keywords: normalizeKeywords(desc, title),
      });
    }
  }
  return entries;
}

function parseCaseLawEntries(payload) {
  const entries = Array.isArray(payload) ? payload : [];
  const result = [];
  for (let i = 0; i < Math.min(entries.length, 2500); i++) {
    const item = entries[i];
    const title = String(item.Titles || item.Title || item.title || '');
    const text = String(item.Text || item.text || item.summary || '').replace(/\s+/g, ' ').trim();
    if (!title || !text) continue;
    result.push({
      id: `CASE-${i + 1}`,
      act: 'Indian Case Law / Precedent',
      act_short: 'CASE',
      section: 'Judgment',
      section_title: title,
      section_desc: text.substring(0, 2500),
      chapter: 'Case Law',
      chapter_title: 'Case Law',
      category: 'Case Law',
      keywords: normalizeKeywords(text, title),
    });
  }
  return result;
}

(async () => {
  const all = [];
  const seen = new Set();
  const add = (entry) => {
    const key = `${entry.act_short}|${entry.section}|${entry.section_title}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    all.push(entry);
  };

  for (const filePath of ACT_FILES) {
    try {
      const url = filePath.startsWith('http') ? filePath : REPO_BASE + filePath;
      const raw = await fetchText(url);
      const data = JSON.parse(raw);
      const parsed = Array.isArray(data.sections)
        ? parseStructuredSectionFile(data)
        : parseActChunkFile(data);
      for (const entry of parsed) add(entry);
      console.log(`Fetched ${filePath} -> ${parsed.length} entries`);
    } catch (error) {
      console.warn(`Skipping ${filePath}: ${error.message}`);
    }
  }

  try {
    const rawCaseData = await fetchText('https://raw.githubusercontent.com/cvignesh/Legal_Assistant/717bedaf480ceaa9eebc8c52c3813976b7302aa0/_legacy_poc/legal_data_10k.json');
    const caseData = JSON.parse(rawCaseData);
    for (const entry of parseCaseLawEntries(caseData)) add(entry);
    console.log(`Fetched legal_data_10k.json -> ${parseCaseLawEntries(caseData).length} entries`);
  } catch (error) {
    console.warn(`Skipping legal data: ${error.message}`);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(all, null, 2), 'utf8');
  console.log(`\nSaved ${all.length} internet-supplement entries to ${OUTPUT}`);
})();
