import { apiClient } from './apiClient';

// ── Unified law entry (works for all acts) ────────────────────────────────────
export interface LawSection {
  id?:           string;
  act:           string;
  act_short:     string;
  section:       string | number;
  section_title: string;
  section_desc:  string;
  chapter:       string | number;
  chapter_title: string;
  category:      string;
  keywords?:     string[];
}

// Backward-compat alias
export type IPCSection = LawSection;

export interface LawListResponse {
  laws:    LawSection[];
  total:   number;
  skip?:   number;
  limit?:  number;
  query?:  string;
}

export interface LawSingleResponse {
  law: LawSection;
}

// Legacy IPC response shapes (still used by ipcController /api/ipc)
export interface IPCListResponse  { sections: LawSection[]; total: number; skip?: number; limit?: number; query?: string; }
export interface IPCSingleResponse { section: LawSection; }

export interface LawAct      { act_short: string; act: string; category: string; }
export interface LawChapter  { act_short?: string; chapter: number | string; title: string; }

// ── /api/laws — unified all-acts endpoints ────────────────────────────────────
export const lawService = {
  async search(query: string, opts?: { act?: string; category?: string; limit?: number }): Promise<LawListResponse> {
    const params = new URLSearchParams({ q: query });
    if (opts?.act)      params.set('act',      opts.act);
    if (opts?.category) params.set('category', opts.category);
    if (opts?.limit)    params.set('limit',    String(opts.limit));
    return apiClient.get<LawListResponse>(`/laws?${params}`);
  },

  async getByAct(actShort: string, skip = 0, limit = 20): Promise<LawListResponse> {
    return apiClient.get<LawListResponse>(`/laws?act=${actShort}&skip=${skip}&limit=${limit}`);
  },

  async getSection(actShort: string, section: string | number): Promise<LawSingleResponse> {
    return apiClient.get<LawSingleResponse>(`/laws/${actShort}/${section}`);
  },

  async getActsList(): Promise<{ acts: LawAct[] }> {
    return apiClient.get('/laws/acts');
  },

  async getCategoriesList(): Promise<{ categories: string[] }> {
    return apiClient.get('/laws/categories');
  },

  async listAll(skip = 0, limit = 20): Promise<LawListResponse> {
    return apiClient.get<LawListResponse>(`/laws?skip=${skip}&limit=${limit}`);
  },
};

// ── /api/ipc — backward-compat IPC-only endpoints ────────────────────────────
export const ipcApiService = {
  async search(query: string, limit = 10): Promise<IPCListResponse> {
    return apiClient.get<IPCListResponse>(`/ipc?q=${encodeURIComponent(query)}&limit=${limit}`);
  },
  async getSection(sectionNo: string | number): Promise<IPCSingleResponse> {
    return apiClient.get<IPCSingleResponse>(`/ipc/${sectionNo}`);
  },
  async listAll(skip = 0, limit = 20): Promise<IPCListResponse> {
    return apiClient.get<IPCListResponse>(`/ipc?skip=${skip}&limit=${limit}`);
  },
  async getChapters(): Promise<{ chapters: LawChapter[] }> {
    return apiClient.get('/ipc/chapters');
  },
};

// ── Act badge colors ───────────────────────────────────────────────────────────
const ACT_COLORS: Record<string, string> = {
  IPC:    'border-red-500/40 bg-red-500/5 text-red-400',
  CrPC:   'border-orange-500/40 bg-orange-500/5 text-orange-400',
  CPC:    'border-blue-500/40 bg-blue-500/5 text-blue-400',
  IEA:    'border-yellow-500/40 bg-yellow-500/5 text-yellow-400',
  HMA:    'border-pink-500/40 bg-pink-500/5 text-pink-400',
  NIA:    'border-purple-500/40 bg-purple-500/5 text-purple-400',
  MVA:    'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
  IDA:    'border-rose-500/40 bg-rose-500/5 text-rose-400',
  COI:    'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
  ITA:    'border-sky-500/40 bg-sky-500/5 text-sky-400',
  CPA:    'border-lime-500/40 bg-lime-500/5 text-lime-400',
  ICA:    'border-indigo-500/40 bg-indigo-500/5 text-indigo-400',
  TPA:    'border-amber-500/40 bg-amber-500/5 text-amber-400',
  POCSO:  'border-fuchsia-500/40 bg-fuchsia-500/5 text-fuchsia-400',
  PWDVA:  'border-rose-600/40 bg-rose-600/5 text-rose-400',
  NDPS:   'border-red-700/40 bg-red-700/5 text-red-500',
  UAPA:   'border-red-900/40 bg-red-900/5 text-red-600',
  PMLA:   'border-violet-500/40 bg-violet-500/5 text-violet-400',
  GST:    'border-teal-500/40 bg-teal-500/5 text-teal-400',
  CA2013: 'border-blue-700/40 bg-blue-700/5 text-blue-400',
  IBC:    'border-orange-700/40 bg-orange-700/5 text-orange-500',
  RERA:   'border-green-500/40 bg-green-500/5 text-green-400',
  RTI:    'border-sky-600/40 bg-sky-600/5 text-sky-400',
  PCA:    'border-red-600/40 bg-red-600/5 text-red-400',
  HSA:    'border-pink-600/40 bg-pink-600/5 text-pink-400',
  POSH:   'border-purple-600/40 bg-purple-600/5 text-purple-400',
  FRA:    'border-green-700/40 bg-green-700/5 text-green-500',
  NGT:    'border-emerald-600/40 bg-emerald-600/5 text-emerald-400',
};

export function getActColor(act_short: string): string {
  return ACT_COLORS[act_short] ?? 'border-gold-500/30 bg-gold-500/5 text-gold-400';
}

// Category-based color (fallback for act color)
export function getChapterColor(chapter: number): string {
  const map: Record<number, string> = {
    6:  'border-red-500/40 bg-red-500/5',
    8:  'border-orange-500/40 bg-orange-500/5',
    11: 'border-yellow-500/40 bg-yellow-500/5',
    16: 'border-rose-500/40 bg-rose-500/5',
    17: 'border-amber-500/40 bg-amber-500/5',
    18: 'border-purple-500/40 bg-purple-500/5',
    20: 'border-pink-500/40 bg-pink-500/5',
    21: 'border-blue-500/40 bg-blue-500/5',
  };
  return map[chapter] ?? 'border-gold-500/30 bg-gold-500/5';
}

export function getChapterLabel(chapter_title: string): string {
  const t = (chapter_title || '').toLowerCase();
  if (t.includes('state'))         return 'Against State';
  if (t.includes('body') || t.includes('hurt') || t.includes('assault')) return 'Against Person';
  if (t.includes('property') || t.includes('theft') || t.includes('robbery')) return 'Property';
  if (t.includes('marriage'))      return 'Marriage';
  if (t.includes('defamation'))    return 'Defamation';
  if (t.includes('document') || t.includes('forgery')) return 'Documents';
  if (t.includes('evidence'))      return 'Evidence';
  if (t.includes('public servant')) return 'Public Servant';
  if (t.includes('religion'))      return 'Religion';
  if (t.includes('sexual'))        return 'Sexual Offences';
  if (t.includes('tranquillity'))  return 'Public Order';
  if (t.includes('fundamental'))   return 'Fundamental Rights';
  if (t.includes('directive'))     return 'DPSP';
  if (t.includes('consumer'))      return 'Consumer';
  if (t.includes('labour') || t.includes('employment')) return 'Labour';
  if (t.includes('cyber') || t.includes('electronic')) return 'Cyber';
  if (t.includes('tax'))           return 'Tax';
  if (t.includes('environment'))   return 'Environment';
  return 'Law';
}

// Friendly full name for an act_short code
export function getActFullName(act_short: string): string {
  const names: Record<string, string> = {
    IPC: 'Indian Penal Code, 1860',
    CrPC: 'CrPC, 1973',
    CPC: 'CPC, 1908',
    IEA: 'Indian Evidence Act, 1872',
    HMA: 'Hindu Marriage Act, 1955',
    NIA: 'Negotiable Instruments Act',
    MVA: 'Motor Vehicles Act, 1988',
    IDA: 'Indian Divorce Act, 1869',
    COI: 'Constitution of India',
    ITA: 'IT Act, 2000',
    CPA: 'Consumer Protection Act, 2019',
    ICA: 'Indian Contract Act, 1872',
    TPA: 'Transfer of Property Act',
    POCSO: 'POCSO Act, 2012',
    PWDVA: 'Domestic Violence Act, 2005',
    NDPS: 'NDPS Act, 1985',
    UAPA: 'UAPA, 1967',
    PMLA: 'PMLA, 2002',
    GST: 'GST Act, 2017',
    CA2013: 'Companies Act, 2013',
    IBC: 'Insolvency & Bankruptcy Code',
    RERA: 'RERA, 2016',
    RTI: 'RTI Act, 2005',
    PCA: 'Prevention of Corruption Act',
    HSA: 'Hindu Succession Act, 1956',
    POSH: 'POSH Act, 2013',
    FRA: 'Forest Rights Act, 2006',
    NGT: 'NGT Act, 2010',
    EPA: 'Environment Protection Act',
    ACA: 'Arbitration Act, 1996',
    SRA: 'Specific Relief Act, 1963',
    LA: 'Limitation Act, 1963',
  };
  return names[act_short] ?? act_short;
}
