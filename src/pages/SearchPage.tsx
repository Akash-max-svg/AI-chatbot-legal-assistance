import { useState, useEffect } from 'react';
import {
  Search, Filter, ChevronDown, Calendar, Building2, FileText, Clock,
  X, Gavel, Users, Scale, Loader2,
} from 'lucide-react';
import { searchCases, CaseResult } from '../services/caseService';

const courts = ['All Courts', 'Supreme Court of India', 'Delhi High Court', 'Bombay High Court', 'Madras High Court', 'Karnataka High Court', 'Calcutta High Court', 'Allahabad High Court', 'National Consumer Disputes Redressal Commission'];
const judges = ['All Judges', "Hon'ble CJI DY Chandrachud", "Hon'ble Justice Rajiv Shakdher", "Hon'ble Justice AS Gadkari", "Hon'ble Justice Krishna S. Dixit", "Hon'ble Justice S. Sounthararajan", "Hon'ble Justice BV Nagarathna", "Hon'ble Justice R.K. Agrawal"];
const statuses = ['All Status', 'Pending', 'Disposed', 'Reserved', 'Stayed'];
const caseCategories = ['All Categories', 'Constitutional Law', 'Civil Law', 'Criminal Law', 'Service Law', 'IPR', 'Environmental Law', 'Consumer Law', 'Cyber Law'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [court, setCourt] = useState('All Courts');
  const [judgeFilter, setJudgeFilter] = useState('All Judges');
  const [partyName, setPartyName] = useState('');
  const [status, setStatus] = useState('All Status');
  const [category, setCategory] = useState('All Categories');
  const [results, setResults] = useState<CaseResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseResult | null>(null);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchCases({ query, court, partyName, judge: judgeFilter, status: status !== 'All Status' ? status : undefined, category: category !== 'All Categories' ? category : undefined });
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setQuery(''); setCourt('All Courts'); setJudgeFilter('All Judges'); setPartyName(''); setStatus('All Status'); setCategory('All Categories');
    setResults([]); setSearched(false); setSelectedCase(null); setShowTimeline(null);
  };

  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      try {
        const data = await searchCases({});
        setResults(data);
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  const getTimeline = (_caseNo: string) => [
    { date: '15 Jan 2024', event: 'Case filed', status: 'completed' },
    { date: '01 Feb 2024', event: 'Notice issued to respondent', status: 'completed' },
    { date: '20 Feb 2024', event: 'First hearing', status: 'completed' },
    { date: '15 Mar 2024', event: 'Evidence stage', status: 'completed' },
    { date: '22 Jun 2026', event: 'Next hearing scheduled', status: 'pending' },
  ];

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Case Search</h1>
        <p className="text-gray-400 text-sm mt-1">Search across Indian E-Courts — Supreme Court, High Courts, and District Courts</p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} placeholder="Enter case number, title, or party name..." className="input-field w-full pl-10" />
          </div>
          <button onClick={doSearch} className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search
          </button>
          {searched && <button onClick={clear} className="btn-secondary py-2.5 px-3"><X size={16} /></button>}
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gold-400 mt-3 transition-colors">
          <Filter size={12} /> Advanced Filters
          <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-navy-700/50 grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Court</label>
              <select value={court} onChange={(e) => setCourt(e.target.value)} className="input-field w-full">{courts.map((c) => (<option key={c} value={c}>{c}</option>))}</select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Judge</label>
              <select value={judgeFilter} onChange={(e) => setJudgeFilter(e.target.value)} className="input-field w-full">{judges.map((j) => (<option key={j} value={j}>{j}</option>))}</select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-full">{caseCategories.map((c) => (<option key={c} value={c}>{c}</option>))}</select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-full">{statuses.map((s) => (<option key={s} value={s}>{s}</option>))}</select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Party Name</label>
              <div className="relative">
                <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Petitioner or Respondent name..." className="input-field w-full pl-10" />
              </div>
            </div>
          </div>
        )}
      </div>

      {searched && <p className="text-sm text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''} found</p>}

      <div className="space-y-4">
        {results.map((r) => (
          <div key={r.id} className="card-gold group">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-gold">{r.category}</span>
              <span className={r.status === 'Disposed' ? 'badge-success' : 'badge-warning'}>{r.status}</span>
            </div>
            <h3 className="text-base font-semibold text-gray-100 mb-1 group-hover:text-gold-400 transition-colors">{r.title}</h3>
            <p className="text-sm text-gray-500">{r.petitioner} v. {r.respondent}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-navy-700/40">
              {[
                { icon: FileText, label: 'Case Number', value: r.caseNo },
                { icon: Building2, label: 'Court', value: r.court },
                { icon: Calendar, label: 'Next Hearing', value: r.nextHearing },
                { icon: Gavel, label: 'Judge', value: r.judge },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                  <item.icon size={14} className="text-gold-500" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</p>
                    <p className="text-gray-300">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {r.caseSummary && (
              <div className="mt-3 pt-3 border-t border-navy-700/30">
                <button onClick={() => setSelectedCase(selectedCase?.id === r.id ? null : r)} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                  {selectedCase?.id === r.id ? 'Hide Summary' : 'View Case Summary'}
                  <ChevronDown size={12} className={`transition-transform ${selectedCase?.id === r.id ? 'rotate-180' : ''}`} />
                </button>
                {selectedCase?.id === r.id && <p className="text-sm text-gray-300 mt-2 leading-relaxed">{r.caseSummary}</p>}
              </div>
            )}
            {/* Timeline */}
            <div className="mt-3 pt-3 border-t border-navy-700/30">
              <button onClick={() => setShowTimeline(showTimeline === r.id ? null : r.id)} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                <Clock size={12} /> {showTimeline === r.id ? 'Hide Timeline' : 'View Timeline'}
                <ChevronDown size={12} className={`transition-transform ${showTimeline === r.id ? 'rotate-180' : ''}`} />
              </button>
              {showTimeline === r.id && (
                <div className="mt-3 space-y-2">
                  {getTimeline(r.caseNo).map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="text-[10px] text-gray-500 w-20">{t.date}</span>
                      <span className="text-xs text-gray-300">{t.event}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!searched && results.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-xl bg-navy-800 flex items-center justify-center mx-auto mb-4"><Clock size={24} className="text-gold-500" /></div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Search Indian Court Cases</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">Enter a case number, party name, or legal topic to search across Supreme Court, High Courts, and District Courts.</p>
        </div>
      )}
      {searched && results.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-xl bg-navy-800 flex items-center justify-center mx-auto mb-4"><Scale size={24} className="text-gray-500" /></div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">No results found</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}
