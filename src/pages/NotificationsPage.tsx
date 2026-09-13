import { useState } from 'react';
import { Bell, Check, Search, CheckCheck, Clock, FileText, Scale, Gavel, AlertCircle, Filter } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  time: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'New Case Assigned', message: 'Case No. CIV/2024/1234 has been assigned to your court for hearing.', type: 'info', category: 'Case', time: '5 minutes ago', isRead: false },
  { id: '2', title: 'Upcoming Hearing', message: 'Hearing scheduled for W.P.(C) 5678/2024 tomorrow at 10:30 AM.', type: 'warning', category: 'Hearing', time: '2 hours ago', isRead: false },
  { id: '3', title: 'Document Approved', message: 'Your Legal Notice draft has been reviewed and approved.', type: 'success', category: 'Document', time: '1 day ago', isRead: false },
  { id: '4', title: 'Case Status Updated', message: 'Case CIV/2024/891 status changed to "Under Review".', type: 'info', category: 'Case', time: '2 days ago', isRead: true },
  { id: '5', title: 'AI Summary Ready', message: 'Judgment summary for FAO 123/2024 has been generated successfully.', type: 'success', category: 'AI', time: '3 days ago', isRead: true },
  { id: '6', title: 'Evidence Submission Deadline', message: 'Reminder: Evidence for Case No. CRM/2024/456 must be submitted by Friday.', type: 'warning', category: 'Deadline', time: '3 days ago', isRead: false },
  { id: '7', title: 'New Message from Lawyer', message: 'Your lawyer Adv. Sharma has sent a message regarding your pending case.', type: 'info', category: 'Message', time: '4 days ago', isRead: true },
  { id: '8', title: 'System Maintenance', message: 'Scheduled maintenance on Sunday 12:00 AM – 2:00 AM. Save your work.', type: 'warning', category: 'System', time: '5 days ago', isRead: true },
  { id: '9', title: 'Case Filing Confirmed', message: 'Your Consumer Complaint filing has been received and registered.', type: 'success', category: 'Case', time: '1 week ago', isRead: true },
  { id: '10', title: 'RTI Response Received', message: 'A response to your RTI application filed on 01/06/2024 is now available.', type: 'info', category: 'RTI', time: '1 week ago', isRead: true },
];

const typeColors = {
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const typeDots = {
  info: 'bg-blue-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
};

const categoryIconMap: Record<string, React.ElementType> = {
  Case: Scale,
  Hearing: Gavel,
  Document: FileText,
  AI: Bell,
  Deadline: Clock,
  Message: Bell,
  System: AlertCircle,
  RTI: FileText,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' || (filter === 'unread' && !n.isRead) || (filter === 'read' && n.isRead);
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-heading flex items-center gap-3">
            <Bell size={24} className="text-gold-500" /> Notifications
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
          >
            <CheckCheck size={14} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="input-field w-full pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500 flex-shrink-0" />
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-gold-500 text-navy-950'
                  : 'bg-navy-800 text-gray-400 hover:text-gold-400 border border-navy-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Bell size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No notifications found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filter or search</p>
          </div>
        )}
        {filtered.map((n) => {
          const CatIcon = categoryIconMap[n.category] || Bell;
          return (
            <div
              key={n.id}
              className={`card transition-all duration-200 ${!n.isRead ? 'border-navy-600/80' : 'opacity-70'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-navy-700' : 'bg-navy-800'}`}>
                  <CatIcon size={18} className={!n.isRead ? 'text-gold-400' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-semibold ${!n.isRead ? 'text-gray-100' : 'text-gray-400'}`}>
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDots[n.type]}`} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeColors[n.type]}`}>
                        {n.category}
                      </span>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">{n.time}</span>
                    </div>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${!n.isRead ? 'text-gray-400' : 'text-gray-500'}`}>
                    {n.message}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                    className="flex-shrink-0 p-1.5 rounded-lg bg-navy-800 text-gray-500 hover:text-gold-400 hover:bg-navy-700 transition-all"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
