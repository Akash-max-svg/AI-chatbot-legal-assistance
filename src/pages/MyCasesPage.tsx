import { useState, useEffect } from 'react';
import { Scale, Search, Filter, FilePlus, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { caseFilingService } from '../services/caseFilingService';

const mockCases = [
  { _id: '1', caseNumber: 'CIV/2024/1234', title: 'Property Boundary Dispute', court: 'Delhi District Court', status: 'Pending', nextHearingDate: '2024-08-15', category: 'Civil' },
  { _id: '2', caseNumber: 'CON/2024/567', title: 'Consumer Complaint — Defective Product', court: 'Consumer Forum Delhi', status: 'Under Review', nextHearingDate: '2024-08-22', category: 'Consumer' },
  { _id: '3', caseNumber: 'RTI/2024/890', title: 'RTI Application — Municipality', court: 'Information Commission', status: 'Resolved', nextHearingDate: null, category: 'RTI' },
  { _id: '4', caseNumber: 'LAB/2024/321', title: 'Wrongful Termination Claim', court: 'Labour Court Delhi', status: 'Hearing Scheduled', nextHearingDate: '2024-09-01', category: 'Labour' },
];

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Under Review': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Hearing Scheduled': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Dismissed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statuses = ['All', 'Pending', 'Under Review', 'Hearing Scheduled', 'Resolved'];

export default function MyCasesPage() {
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
      (c.caseNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <Scale size={24} className="text-gold-500" /> My Cases
          </h1>
          <p className="text-gray-400 text-sm mt-1">{cases.length} case{cases.length !== 1 ? 's' : ''} on record</p>
        </div>
        <button onClick={() => navigate('/case-filing')} className="btn-primary flex items-center gap-2 text-sm">
          <FilePlus size={15} /> File New Case
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case number or title..."
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
                  <h3 className="text-sm font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{c.court}</p>
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
              <button
                onClick={() => navigate('/case-filing')}
                className="mt-4 btn-primary text-sm flex items-center gap-2 mx-auto"
              >
                <FilePlus size={14} /> File Your First Case
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
