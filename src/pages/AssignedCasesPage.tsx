import { useState } from 'react';
import { Scale, Search, Filter, Calendar, User, ChevronRight, Gavel } from 'lucide-react';

const cases = [
  { id: 'CIV/2024/1234', title: 'Sharma vs. State of Maharashtra', type: 'Civil', status: 'Hearing Scheduled', petitioner: 'Raj Sharma', respondent: 'State of Maharashtra', nextHearing: '2024-08-15', court: 'Bombay High Court', priority: 'High' },
  { id: 'CRM/2024/567', title: 'State vs. Gupta', type: 'Criminal', status: 'Under Review', petitioner: 'State', respondent: 'Anil Gupta', nextHearing: '2024-08-18', court: 'Delhi District Court', priority: 'Medium' },
  { id: 'WP/2024/890', title: 'RTI Appeal — Ministry of Finance', type: 'Writ Petition', status: 'Arguments Heard', petitioner: 'Citizen Forum', respondent: 'Ministry of Finance', nextHearing: '2024-08-20', court: 'Delhi High Court', priority: 'High' },
  { id: 'FAM/2024/321', title: 'Mehta vs. Mehta (Divorce)', type: 'Family', status: 'Awaiting Documents', petitioner: 'Priya Mehta', respondent: 'Rohit Mehta', nextHearing: '2024-08-22', court: 'Family Court Mumbai', priority: 'Low' },
  { id: 'CON/2024/654', title: 'Consumer Complaint — XYZ Electronics', type: 'Consumer', status: 'Order Reserved', petitioner: 'Kumar Singh', respondent: 'XYZ Electronics', nextHearing: '2024-09-01', court: 'Consumer Forum Delhi', priority: 'Medium' },
  { id: 'LAB/2024/987', title: 'Labour Dispute — Factory Workers', type: 'Labour', status: 'Mediation Ordered', petitioner: 'Workers Union', respondent: 'ABC Textiles Ltd.', nextHearing: '2024-09-05', court: 'Labour Court Chennai', priority: 'High' },
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

export default function AssignedCasesPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || c.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <Scale size={24} className="text-gold-500" /> Assigned Cases
        </h1>
        <p className="text-gray-400 text-sm mt-1">{cases.length} cases currently assigned to your court</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID or title..."
            className="input-field w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500 flex-shrink-0" />
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === t
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
          <div key={c.id} className="card group cursor-pointer hover:border-navy-600/80 transition-all">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-xs font-mono text-gold-400">{c.id}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${priorityColors[c.priority]}`}>
                    {c.priority} Priority
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.court} · {c.type}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 justify-end">
                    <Calendar size={11} />
                    <span>
                      {new Date(c.nextHearing).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">Next Hearing</p>
                </div>
                <ChevronRight size={16} className="text-gray-600 group-hover:text-gold-400 transition-colors" />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-3 pt-3 border-t border-navy-700/40 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <User size={11} className="text-gray-600" />
                <span>Petitioner: <span className="text-gray-400">{c.petitioner}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Gavel size={11} className="text-gray-600" />
                <span>Respondent: <span className="text-gray-400">{c.respondent}</span></span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Scale size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No cases found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
