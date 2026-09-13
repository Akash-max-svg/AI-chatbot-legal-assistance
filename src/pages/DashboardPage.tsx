import { useState, useEffect } from 'react';
import {
  Scale, CheckCircle2, Clock, Brain, Activity, Server, Zap,
  FileText, Gavel, Users, Search, MessageSquare,
  AlertCircle, ArrowUpRight, ArrowDownRight, BarChart3, PieChart,
  LineChart, FilePlus, Briefcase, Calendar, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: string;
  up?: boolean;
  color: string;
}

function StatCard({ icon: Icon, label, value, change, up, color }: StatCardProps) {
  return (
    <div className="card-gold group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

const monthlyData = [
  { month: 'Jan', resolved: 420, pending: 180 },
  { month: 'Feb', resolved: 480, pending: 160 },
  { month: 'Mar', resolved: 550, pending: 200 },
  { month: 'Apr', resolved: 610, pending: 170 },
  { month: 'May', resolved: 720, pending: 190 },
  { month: 'Jun', resolved: 890, pending: 210 },
];

const categoryData = [
  { name: 'Criminal', count: 3420, color: 'bg-red-500' },
  { name: 'Civil', count: 2850, color: 'bg-blue-500' },
  { name: 'Constitutional', count: 1240, color: 'bg-gold-500' },
  { name: 'Service', count: 980, color: 'bg-emerald-500' },
  { name: 'Consumer', count: 760, color: 'bg-purple-500' },
  { name: 'IPR', count: 420, color: 'bg-cyan-500' },
  { name: 'Cyber', count: 310, color: 'bg-orange-500' },
  { name: 'Environmental', count: 180, color: 'bg-teal-500' },
];

const recentActivities = [
  { action: 'Case Search', detail: 'Searched case W.P. (C) 1234/2024', time: '2 min ago', role: 'Lawyer', icon: Search },
  { action: 'Chat Query', detail: 'Asked about Section 498A IPC', time: '5 min ago', role: 'Citizen', icon: MessageSquare },
  { action: 'Judgment Upload', detail: 'Uploaded judgment FAO 567/2024', time: '12 min ago', role: 'Lawyer', icon: FileText },
  { action: 'Case Filing', detail: 'Generated Consumer Complaint draft', time: '18 min ago', role: 'Citizen', icon: FilePlus },
  { action: 'Document Gen', detail: 'Generated Legal Notice', time: '25 min ago', role: 'Lawyer', icon: Briefcase },
  { action: 'Chat Query', detail: 'Asked about divorce under Hindu Marriage Act', time: '30 min ago', role: 'Citizen', icon: MessageSquare },
  { action: 'Knowledge Base', detail: 'Viewed Article 21 — Right to Life', time: '32 min ago', role: 'Student', icon: Brain },
  { action: 'Voice Query', detail: 'Asked about RTI filing via voice', time: '45 min ago', role: 'Citizen', icon: MessageSquare },
  { action: 'Judgment Upload', detail: 'Uploaded Supreme Court judgment', time: '1 hr ago', role: 'Lawyer', icon: FileText },
  { action: 'Case Search', detail: 'Searched cyber crime case', time: '1 hr ago', role: 'Citizen', icon: Search },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_cases: 12458, resolved_cases: 8932, pending_cases: 3526, ai_queries_processed: 87654 });
  const [systemHealth, setSystemHealth] = useState('Healthy');
  const [backendStatus, setBackendStatus] = useState('Connected');
  const [aiStatus, setAiStatus] = useState('Active');
  const [activities] = useState(recentActivities);
  const [roleView, setRoleView] = useState<'Citizen' | 'Lawyer' | 'Judge'>((user?.role as any) || 'Citizen');

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ stats }, { status }] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getSystemStatus()
        ]);
        setStats({
          total_cases: stats.totalCases || 12458,
          resolved_cases: stats.resolvedCases || 8932,
          pending_cases: stats.pendingCases || 3526,
          ai_queries_processed: stats.aiQueriesProcessed || 87654
        });
        setSystemHealth(status.systemHealth);
        setBackendStatus(status.backendStatus);
        setAiStatus(status.aiStatus);
      } catch {}
    }
    fetchData();
  }, []);

  const role = user?.role || 'Citizen';
  const viewRole = user?.role === 'Admin' ? roleView : role;

  const citizenStats = [
    { icon: FileText, label: 'My Cases', value: 4, color: 'bg-blue-600' },
    { icon: Clock, label: 'Pending', value: 2, color: 'bg-amber-600' },
    { icon: CheckCircle2, label: 'Resolved', value: 2, color: 'bg-emerald-600' },
    { icon: Calendar, label: 'Upcoming Hearings', value: 3, color: 'bg-purple-600' },
  ];

  const lawyerStats = [
    { icon: Users, label: 'Clients', value: 12, color: 'bg-blue-600' },
    { icon: FileText, label: 'Case List', value: 28, color: 'bg-emerald-600' },
    { icon: Brain, label: 'Research', value: 156, color: 'bg-purple-600' },
    { icon: Clock, label: 'Pending Hearings', value: 8, color: 'bg-amber-600' },
  ];

  const judgeStats = [
    { icon: Gavel, label: 'Assigned Cases', value: 42, color: 'bg-blue-600' },
    { icon: Clock, label: 'Pending Judgments', value: 7, color: 'bg-amber-600' },
    { icon: FileText, label: 'AI Summaries', value: 23, color: 'bg-emerald-600' },
    { icon: Calendar, label: 'Recent Hearings', value: 5, color: 'bg-purple-600' },
  ];

  const currentRoleStats = role === 'Citizen' ? citizenStats : role === 'Lawyer' ? lawyerStats : judgeStats;

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <LayoutDashboardIcon /> Legal Analytics Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time insights into Indian E-Courts and AI Legal Assistant usage</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'Admin' && (
            <div className="relative">
              <select value={roleView} onChange={(e) => setRoleView(e.target.value as any)} className="input-field text-xs py-1.5 pr-6 pl-2 appearance-none cursor-pointer">
                <option value="Citizen">Citizen View</option>
                <option value="Lawyer">Lawyer View</option>
                <option value="Judge">Judge View</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">System Online</span>
          </div>
        </div>
      </div>

      {/* Role-specific Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">{viewRole} Dashboard</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {currentRoleStats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} />
          ))}
        </div>
      </div>

      {/* Global Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Platform Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Scale} label="Total Cases" value={stats.total_cases.toLocaleString()} change="+12.5%" up color="bg-blue-600" />
          <StatCard icon={CheckCircle2} label="Resolved Cases" value={stats.resolved_cases.toLocaleString()} change="+8.3%" up color="bg-emerald-600" />
          <StatCard icon={Clock} label="Pending Cases" value={stats.pending_cases.toLocaleString()} change="-2.1%" up={false} color="bg-amber-600" />
          <StatCard icon={Brain} label="AI Queries" value={stats.ai_queries_processed.toLocaleString()} change="+24.7%" up color="bg-purple-600" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <BarChart3 size={18} className="text-gold-500" /> Monthly Case Trends
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Resolved</span>
              <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Pending</span>
            </div>
          </div>
          <div className="space-y-3">
            {monthlyData.map((d) => {
              const total = d.resolved + d.pending;
              const resolvedPct = (d.resolved / total) * 100;
              return (
                <div key={d.month}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400 w-8">{d.month}</span>
                    <span className="text-gray-500">{total} cases</span>
                  </div>
                  <div className="h-3 bg-navy-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${resolvedPct}%` }} />
                    <div className="h-full bg-amber-500 rounded-r-full transition-all duration-500" style={{ width: `${100 - resolvedPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-gold-500" /> Cases by Category
          </h2>
          <div className="space-y-3">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-24 truncate">{cat.name}</span>
                <div className="flex-1 h-2.5 bg-navy-800 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full transition-all duration-700`} style={{ width: `${(cat.count / 3420) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-300 w-10 text-right">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Chart Area */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <LineChart size={18} className="text-gold-500" /> AI Query Growth Trend
        </h2>
        <div className="flex items-end gap-2 h-40 px-2">
          {[12, 18, 24, 35, 42, 58, 72, 85, 98, 112, 135, 156].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gradient-to-t from-gold-500/60 to-gold-400 rounded-t-sm transition-all duration-500 hover:from-gold-400 hover:to-gold-300" style={{ height: `${(val / 156) * 100}%` }} />
              <span className="text-[9px] text-gray-500">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-gold-500" /> Recent Legal Activities
          </h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {activities.map((act, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/40 hover:bg-navy-800/70 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0">
                  <act.icon size={16} className="text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate">{act.action}</p>
                  <p className="text-xs text-gray-500 truncate">{act.detail}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="badge-gold text-[10px]">{act.role}</span>
                  <p className="text-[10px] text-gray-500 mt-1">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Server size={18} className="text-gold-500" /> System Status
          </h2>
          <div className="space-y-4">
            {[
              { label: 'System Health', value: systemHealth, icon: Activity, color: 'text-emerald-400', badge: 'badge-success' },
              { label: 'Flask Backend', value: backendStatus, icon: Server, color: 'text-blue-400', badge: 'badge-success' },
              { label: 'AI Engine (Gemini)', value: aiStatus, icon: Zap, color: 'text-purple-400', badge: 'badge-success' },
              { label: 'Database (MongoDB)', value: 'Connected', icon: DatabaseIcon, color: 'text-amber-400', badge: 'badge-success' },
              { label: 'Active Users', value: '1,247', icon: Users, color: 'text-gold-400', badge: '' },
              { label: 'Avg Response Time', value: '1.2s', icon: Brain, color: 'text-cyan-400', badge: '' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-navy-800/40">
                <div className="flex items-center gap-2">
                  <item.icon size={16} className={item.color} />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`${item.badge} text-[10px]`}>{item.value}</span>
                ) : (
                  <span className="text-sm text-gray-200 font-medium">{item.value}</span>
                )}
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-navy-700/40">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500">All systems operational. Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}

function DatabaseIcon({ size, className }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
