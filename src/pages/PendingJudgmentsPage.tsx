import { useState } from 'react';
import { Clock, Search, Filter, AlertCircle, Calendar, FileText, ChevronRight, Gavel, Flag } from 'lucide-react';

const judgments = [
  {
    id: 'CIV/2023/445', title: 'Property Dispute — Verma Estate', type: 'Civil',
    deadline: '2024-08-10', daysLeft: 3, evidenceComplete: true, hearingsCompleted: 8,
    summary: 'Dispute over ancestral property division among siblings. All arguments concluded.',
    priority: 'Urgent',
  },
  {
    id: 'CRM/2023/789', title: 'State vs. Pandey — Bank Fraud', type: 'Criminal',
    deadline: '2024-08-20', daysLeft: 13, evidenceComplete: true, hearingsCompleted: 12,
    summary: 'Bank fraud case worth ₹2.4 Cr. Prosecution and defense arguments completed.',
    priority: 'High',
  },
  {
    id: 'WP/2024/102', title: 'Environmental Writ — River Pollution', type: 'Writ Petition',
    deadline: '2024-09-01', daysLeft: 25, evidenceComplete: false, hearingsCompleted: 5,
    summary: 'PIL regarding industrial effluent discharge in River Yamuna.',
    priority: 'High',
  },
  {
    id: 'FAM/2023/655', title: 'Custody Battle — Singh Family', type: 'Family',
    deadline: '2024-09-05', daysLeft: 29, evidenceComplete: true, hearingsCompleted: 6,
    summary: 'Child custody and maintenance dispute. Child welfare report submitted.',
    priority: 'Medium',
  },
  {
    id: 'LAB/2024/200', title: 'Wrongful Termination — IT Sector', type: 'Labour',
    deadline: '2024-09-15', daysLeft: 39, evidenceComplete: true, hearingsCompleted: 4,
    summary: 'Employee terminated without due process. Company cites performance grounds.',
    priority: 'Medium',
  },
];

const priorityConfig: Record<string, { badge: string; dot: string }> = {
  Urgent: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
  High:   { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  Medium: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
};

const types = ['All', 'Civil', 'Criminal', 'Writ Petition', 'Family', 'Labour'];

export default function PendingJudgmentsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = judgments.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.id.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'All' || j.type === filter);
  });

  const urgentCount = judgments.filter((j) => j.priority === 'Urgent').length;
  const avgDays = Math.round(judgments.reduce((s, j) => s + j.daysLeft, 0) / judgments.length);

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <Clock size={24} className="text-gold-500" /> Pending Judgments
          </h1>
          <p className="text-gray-400 text-sm mt-1">Cases awaiting your judgment order</p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-sm text-red-400 font-medium">
              {urgentCount} urgent judgment{urgentCount > 1 ? 's' : ''} due soon
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-100">{judgments.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Pending</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-400">{urgentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Urgent</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-400">
            {judgments.filter((j) => j.priority === 'High').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">High Priority</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-100">{avgDays}</p>
          <p className="text-xs text-gray-500 mt-1">Avg. Days Left</p>
        </div>
      </div>

      {/* Filters */}
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
        {filtered.map((j) => {
          const pc = priorityConfig[j.priority];
          const isUrgent = j.daysLeft <= 5;
          return (
            <div
              key={j.id}
              className={`card group cursor-pointer transition-all hover:border-navy-600/80 ${isUrgent ? 'border-red-500/20 bg-red-500/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-mono text-gold-400">{j.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${pc.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                      {j.priority}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-navy-800 border border-navy-700 px-2 py-0.5 rounded-full">
                      {j.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">{j.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{j.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-navy-800 text-gray-400 border border-navy-700'}`}>
                    <Calendar size={11} />
                    <span>{j.daysLeft} days left</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-gold-400 transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-6 mt-3 pt-3 border-t border-navy-700/40 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Gavel size={11} className="text-gray-600" />
                  <span>{j.hearingsCompleted} hearings completed</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FileText size={11} className="text-gray-600" />
                  <span>Evidence: {j.evidenceComplete ? 'Complete' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Flag size={11} className="text-gray-600" />
                  <span>
                    Deadline:{' '}
                    {new Date(j.deadline).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Clock size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No pending judgments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
