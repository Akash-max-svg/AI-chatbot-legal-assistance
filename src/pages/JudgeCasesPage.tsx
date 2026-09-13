import { useState } from 'react';
import { Scale, Search, Filter, Calendar, ChevronRight, Gavel, Clock } from 'lucide-react';

const cases = [
  { _id: '1', caseNumber: 'CIV/2024/1234', title: 'Sharma vs. State of Maharashtra', court: 'Bombay High Court', status: 'Hearing Scheduled', nextHearingDate: '2024-08-15', category: 'Civil', priority: 'High' },
  { _id: '2', caseNumber: 'CRM/2024/567', title: 'State vs. Gupta', court: 'Delhi District Court', status: 'Under Review', nextHearingDate: '2024-08-18', category: 'Criminal', priority: 'Medium' },
  { _id: '3', caseNumber: 'WP/2024/890', title: 'RTI Appeal — Ministry of Finance', court: 'Delhi High Court', status: 'Arguments Heard', nextHearingDate: '2024-08-20', category: 'Writ Petition', priority: 'High' },
  { _id: '4', caseNumber: 'FAM/2024/321', title: 'Mehta vs. Mehta (Divorce)', court: 'Family Court Mumbai', status: 'Awaiting Documents', nextHearingDate: '2024-08-22', category: 'Family', priority: 'Low' },
  { _id: '5', caseNumber: 'CON/2024/654', title: 'Consumer Complaint — XYZ Electronics', court: 'Consumer Forum Delhi', status: 'Order Reserved', nextHearingDate: '2024-09-01', category: 'Consumer', priority: 'Medium' },
  { _id: '6', caseNumber: 'LAB/2024/987', title: 'Labour Dispute — Factory Workers', court: 'Labour Court Chennai', status: 'Mediation Ordered', nextHearingDate: '2024-09-05', category: 'Labour', priority: 'High' },
];

const statusColors: Record<string, string> = {
  'Hearing Scheduled': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Under Review': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Arguments Heard': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Awaiting Documents': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Order Reserved': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Mediation Ordered': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const types = ['All', 'Civil', 'Criminal', 'Writ Petition', 'Family', 'Consumer', 'Labour'];

export default function JudgeCasesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'All' || c.category === filter);
  });

  const totalCases = cases.length;
  const highPriority = cases.filter((c) => c.priority === 'High').length;
  const upcoming = cases.filter((c) => c.nextHearingDate).length;

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <Gavel size={24} className="text-gold-500" /> My Cases
        </h1>
        <p className="text-gray-400 text-sm mt-1">All cases assigned to your court</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <Scale size={18} className="text-gold-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-100">{totalCases}</p>
          <p className="text-xs text-gray-500">Total Cases</p>
        </div>
        <div className="card text-center">
          <Clock size={18} className="text-red-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-100">{highPriority}</p>
          <p className="text-xs text-gray-500">High Priority</p>
        </div>
        <div className="card text-center">
          <Calendar size={18} className="text-blue-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-100">{upcoming}</p>
          <p className="text-xs text-gray-500">Upcoming Hearings</p>
        </div>
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
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === t
                  ? 'bg-gold-500 text-navy-950'
                  : 'bg-navy-800 text-gray-400 border border-navy-700 hover:text-gold-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c._id} className="card group cursor-pointer hover:border-navy-600/80 transition-all">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-xs font-mono text-gold-400">{c.caseNumber}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${priorityColors[c.priority]}`}>
                    {c.priority} Priority
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.court} · {c.category}</p>
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
            <p className="text-gray-400">No cases found</p>
          </div>
        )}
      </div>
    </div>
  );
}
