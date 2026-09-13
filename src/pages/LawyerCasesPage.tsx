import { useState, useEffect } from 'react';
import { Scale, Search, Filter, FilePlus, Calendar, ChevronRight, Loader2, Users, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { caseFilingService } from '../services/caseFilingService';

const mockCases = [
  { _id: '1', caseNumber: 'CIV/2024/001', title: 'Kumar vs. State — Land Acquisition', court: 'Delhi High Court', status: 'Hearing Scheduled', nextHearingDate: '2024-08-14', category: 'Civil', client: 'Ramesh Kumar' },
  { _id: '2', caseNumber: 'CRM/2024/045', title: 'State vs. Singh — IPC 420', court: 'Sessions Court Pune', status: 'Arguments Ongoing', nextHearingDate: '2024-08-17', category: 'Criminal', client: 'Priya Singh' },
  { _id: '3', caseNumber: 'FAM/2024/110', title: 'Gupta Divorce Proceedings', court: 'Family Court Mumbai', status: 'Under Mediation', nextHearingDate: '2024-08-25', category: 'Family', client: 'Neha Gupta' },
  { _id: '4', caseNumber: 'CON/2024/067', title: 'Consumer Fraud — Insurance Denial', court: 'Consumer Forum', status: 'Pending', nextHearingDate: '2024-09-02', category: 'Consumer', client: 'Vikram Shah' },
  { _id: '5', caseNumber: 'LAB/2024/033', title: 'Wrongful Termination — IT Company', court: 'Labour Court Bengaluru', status: 'Resolved', nextHearingDate: null, category: 'Labour', client: 'Arjun Nair' },
  { _id: '6', caseNumber: 'WP/2024/009', title: 'Environmental PIL — Factory Pollution', court: 'Bombay High Court', status: 'Hearing Scheduled', nextHearingDate: '2024-09-10', category: 'Writ Petition', client: 'Citizen Forum' },
];

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Under Review': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Hearing Scheduled': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Arguments Ongoing': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Under Mediation': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const statuses = ['All', 'Pending', 'Hearing Scheduled', 'Arguments Ongoing', 'Resolved'];

export default function LawyerCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(mockCases as any[]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const res = await caseFilingService.getCases();
        if (res.cases?.length) setCases(res.cases);
      } catch {
        // keep mock data
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.caseNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.client || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const activeCount = cases.filter((c) => c.status !== 'Resolved').length;
  const resolvedCount = cases.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <Scale size={24} className="text-gold-500" /> Case List
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage all client cases from one place</p>
        </div>
        <button onClick={() => navigate('/case-filing')} className="btn-primary flex items-center gap-2 text-sm">
          <FilePlus size={15} /> New Case
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <Users size={18} className="text-gold-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-100">{cases.length}</p>
          <p className="text-xs text-gray-500">Total Cases</p>
        </div>
        <div className="card text-center">
          <Scale size={18} className="text-blue-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-100">{activeCount}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="card text-center">
          <Brain size={18} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-100">{resolvedCount}</p>
          <p className="text-xs text-gray-500">Resolved</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case, client, or court..."
            className="input-field w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === s
                  ? 'bg-gold-500 text-navy-950'
                  : 'bg-navy-800 text-gray-400 border border-navy-700 hover:text-gold-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gold-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c._id} className="card group cursor-pointer hover:border-navy-600/80 transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-mono text-gold-400">{c.caseNumber || 'Draft'}</span>
                    <span className="text-[10px] bg-navy-800 border border-navy-700 px-2 py-0.5 rounded-full text-gray-500">
                      {c.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[c.status] || statusColors['Pending']}`}>
                      {c.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">{c.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{c.court}</p>
                  {c.client && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Client: <span className="text-gray-400">{c.client}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {c.nextHearingDate ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar size={11} />
                      <span>
                        {new Date(c.nextHearingDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">No hearing set</span>
                  )}
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gold-400 transition-colors mt-1" />
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card text-center py-12">
              <Scale size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No cases found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
