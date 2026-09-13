/**
 * fixHMA.js — Rebuilds a proper hma_fixed.json from the CSV-packed hma.json
 * Run: node backend/data/fixHMA.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const DIR  = __dirname;

const raw = fs.readFileSync(path.join(DIR,'hma.json'),'utf8').replace(/^\uFEFF/,'');
const arr = JSON.parse(raw);

// The HMA JSON has a single key per object: "chapter,section,section_title,section_desc"
// Values are CSV rows but some rows span multiple objects (multi-line values).
// Strategy: join all non-empty values, then parse as one CSV stream.

const KEY = Object.keys(arr[0])[0]; // "chapter,section,section_title,section_desc"
const headers = KEY.split(',').map(h=>h.trim());

// Collect all value lines (skip empty)
const lines = arr.map(o=>(o[KEY]||'').trim()).filter(l=>l.length>0);

// Now parse the combined CSV block properly
// Each record starts with a number (chapter number like "1,1," or "1,2,")
const records = [];
let current = '';
for (const line of lines) {
  // A new record starts when the line begins with a digit followed by comma
  // (i.e., chapter number) AND there's a section number after it
  if (/^\d+,\d/.test(line) && current.length > 0) {
    records.push(current);
    current = line;
  } else {
    current = current ? current + ' ' + line : line;
  }
}
if (current) records.push(current);

// Parse each record as CSV
function parseCSV(line) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c==='"') { if(line[i+1]==='"'){cur+='"';i++;}else{inQ=false;} }
      else cur += c;
    } else {
      if (c==='"') inQ=true;
      else if(c===','){result.push(cur);cur='';}
      else cur+=c;
    }
  }
  result.push(cur);
  return result;
}

const out = [];
let goodCount = 0;
for (const rec of records) {
  const vals = parseCSV(rec);
  if (vals.length < 3) continue;
  const obj = {};
  headers.forEach((h,i)=>{ obj[h]=(vals[i]||'').trim(); });
  if (!obj.section || !obj.section_title) continue;
  out.push({
    act:           'Hindu Marriage Act, 1955',
    act_short:     'HMA',
    section:       obj.section,
    section_title: obj.section_title,
    section_desc:  obj.section_desc || '',
    chapter:       obj.chapter || '',
    chapter_title: '',
    category:      'Family Law',
    keywords:      [],
  });
  goodCount++;
}

fs.writeFileSync(path.join(DIR,'hma_fixed.json'), JSON.stringify(out,null,1),'utf8');
console.log(`✓ hma_fixed.json — ${out.length} entries (from ${records.length} records)`);
