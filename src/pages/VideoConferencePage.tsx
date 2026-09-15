import { useState, useEffect, useRef } from 'react';
import {
  Video, Plus, Calendar, Clock, Users, Link, Mail, Search, X,
  Check, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Loader2,
  Gavel, Briefcase, User, AlertCircle, Phone, Bell, Trash2,
  PlayCircle, StopCircle, Edit3, Send, CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { meetingsService, Meeting, UserSearchResult } from '../services/meetingsService';

// ── Role badge styling ────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Judge:   { icon: Gavel,     color: 'text-gold-400',    bg: 'bg-gold-500/15 border-gold-500/30'    },
  Lawyer:  { icon: Briefcase, color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30'    },
  Citizen: { icon: User,      color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  Admin:   { icon: Users,     color: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/30'  },
};

const STATUS_CONFIG = {
  Scheduled: { label: 'Scheduled',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'    },
  Active:    { label: 'Live Now',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Completed: { label: 'Completed',  color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20'    },
  Cancelled: { label: 'Cancelled',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'      },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG['Citizen'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.color}`}>
      <Icon size={9} /> {role}
    </span>
  );
}

function ParticipantStatusIcon({ status }: { status: string }) {
  if (status === 'accepted')  return <CheckCircle2 size={12} className="text-emerald-400" />;
  if (status === 'declined')  return <XCircle      size={12} className="text-red-400"     />;
  if (status === 'attended')  return <CheckCircle2 size={12} className="text-gold-400"    />;
  return <Clock size={12} className="text-gray-500" />;
}

// ── Schedule Meeting Modal ────────────────────────────────────────────────────
function ScheduleMeetingModal({ onClose, onCreated }: { onClose: () => void; onCreated: (m: Meeting) => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    agenda: '',
    caseNumber: '',
    scheduledAt: '',
    duration: '60',
    platform: 'jitsi',
    meetingLink: '',
  });
  const [searchQ, setSearchQ] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default datetime = 1 hour from now
  useEffect(() => {
    const d = new Date(Date.now() + 3600000);
    const pad = (n: number) => String(n).padStart(2, '0');
    setForm(f => ({
      ...f,
      scheduledAt: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    }));
  }, []);

  const doSearch = async (q: string, role: string) => {
    if (!q.trim() && !role) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await meetingsService.searchUsers(q, role || undefined);
      setSearchResults(res.users.filter(u =>
        !selectedUsers.find(s => s._id === u._id) && u._id !== user?._id
      ));
    } catch {}
    setSearching(false);
  };

  const handleSearchChange = (v: string) => {
    setSearchQ(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(v, searchRole), 350);
  };

  const handleRoleFilter = (r: string) => {
    setSearchRole(r);
    doSearch(searchQ, r);
  };

  const addUser = (u: UserSearchResult) => {
    setSelectedUsers(prev => [...prev, u]);
    setSearchResults(prev => prev.filter(r => r._id !== u._id));
    setSearchQ('');
  };

  const removeUser = (id: string) => setSelectedUsers(prev => prev.filter(u => u._id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim())      return setError('Meeting title is required');
    if (!form.scheduledAt)       return setError('Date and time are required');
    if (new Date(form.scheduledAt) < new Date()) return setError('Scheduled time must be in the future');
    setSaving(true);
    try {
      const res = await meetingsService.createMeeting({
        ...form,
        duration: parseInt(form.duration),
        participantIds: selectedUsers.map(u => u._id),
      });
      onCreated(res.meeting);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create meeting');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-navy-950 border border-navy-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-navy-800 sticky top-0 bg-navy-950 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Video size={18} className="text-navy-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">Schedule Video Conference</h2>
              <p className="text-xs text-gray-500">Invites will be sent by email to all participants</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Meeting Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Case Hearing – State vs Rajan Kumar"
              className="input-field w-full text-sm"
              required
            />
          </div>

          {/* Case Number + Date/Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Case Number (optional)</label>
              <input
                type="text"
                value={form.caseNumber}
                onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))}
                placeholder="CASE-2024-000001"
                className="input-field w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (minutes)</label>
              <select
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="input-field w-full text-sm"
              >
                {[15,30,45,60,90,120,180,240].map(d => (
                  <option key={d} value={d}>{d} min{d >= 60 ? ` (${d/60}h)` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Date & Time *</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="input-field w-full text-sm"
              required
            />
            <p className="text-[10px] text-gray-600 mt-1">Indian Standard Time (IST)</p>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Meeting Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'jitsi', label: 'Jitsi Meet', note: 'Free, No account' },
                { id: 'google-meet', label: 'Google Meet', note: 'Paste link below' },
                { id: 'zoom', label: 'Zoom', note: 'Paste link below' },
              ].map(p => (
                <button
                  key={p.id} type="button"
                  onClick={() => setForm(f => ({ ...f, platform: p.id }))}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    form.platform === p.id
                      ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                      : 'border-navy-700 text-gray-500 hover:border-navy-600 hover:text-gray-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{p.label}</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">{p.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* External meeting link (non-jitsi) */}
          {form.platform !== 'jitsi' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Meeting Link <span className="text-gray-600">(paste from {form.platform})</span>
              </label>
              <input
                type="url"
                value={form.meetingLink}
                onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="input-field w-full text-sm"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the meeting purpose..."
              rows={2}
              className="input-field w-full text-sm resize-none"
            />
          </div>

          {/* Agenda */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Agenda (optional)</label>
            <textarea
              value={form.agenda}
              onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
              placeholder="1. Opening statements&#10;2. Evidence review&#10;3. Arguments..."
              rows={3}
              className="input-field w-full text-sm resize-none"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Invite Participants <span className="text-gray-600">(email invites sent automatically)</span>
            </label>

            {/* Search */}
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search by name or email..."
                  className="input-field w-full pl-8 text-sm py-2"
                />
              </div>
              <select
                value={searchRole}
                onChange={e => handleRoleFilter(e.target.value)}
                className="input-field text-sm py-2 min-w-[90px]"
              >
                <option value="">All roles</option>
                <option value="Judge">Judge</option>
                <option value="Lawyer">Lawyer</option>
                <option value="Citizen">Citizen</option>
              </select>
            </div>

            {/* Search results */}
            {(searching || searchResults.length > 0) && (
              <div className="border border-navy-700 rounded-lg overflow-hidden mb-2 max-h-40 overflow-y-auto">
                {searching && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                    <Loader2 size={12} className="animate-spin" /> Searching...
                  </div>
                )}
                {searchResults.map(u => (
                  <button
                    key={u._id} type="button"
                    onClick={() => addUser(u)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-navy-800/50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-[10px] flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                    <Plus size={13} className="text-gold-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Selected participants */}
            {selectedUsers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">Selected ({selectedUsers.length})</p>
                {selectedUsers.map(u => (
                  <div key={u._id} className="flex items-center gap-2.5 px-3 py-2 bg-navy-800/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-[9px] flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200 truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                        <Mail size={9} /> {u.email}
                      </p>
                    </div>
                    <RoleBadge role={u.role} />
                    <button type="button" onClick={() => removeUser(u._id)} className="text-gray-600 hover:text-red-400">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length === 0 && (
              <p className="text-[10px] text-gray-600 text-center py-3 border border-dashed border-navy-700 rounded-lg">
                Search and add participants. They will receive email invitations.
              </p>
            )}
          </div>

          {/* Jitsi note */}
          {form.platform === 'jitsi' && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Video size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-300 leading-relaxed">
                Using <strong>Jitsi Meet</strong> — a free, open-source video conferencing platform. No account required. A unique meeting room will be created automatically.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {saving ? 'Creating...' : `Schedule & Send Invites${selectedUsers.length > 0 ? ` (${selectedUsers.length + 1})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Meeting Card ──────────────────────────────────────────────────────────────
function MeetingCard({
  meeting, currentUserId, currentUserRole, onJoin, onRespond, onRefresh
}: {
  meeting: Meeting;
  currentUserId: string;
  currentUserRole: string;
  onJoin: (m: Meeting) => void;
  onRespond: (meetingId: string, userId: string, status: 'accepted' | 'declined') => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [joining, setJoining]   = useState(false);

  const status     = STATUS_CONFIG[meeting.status] || STATUS_CONFIG['Scheduled'];
  const isCreator  = meeting.createdBy._id === currentUserId;
  const myStatus   = meeting.participants.find(p => p.user?._id === currentUserId)?.status;
  const scheduled  = new Date(meeting.scheduledAt);
  const isPast     = scheduled < new Date() && meeting.status !== 'Active';
  const isUpcoming = meeting.status === 'Scheduled' || meeting.status === 'Active';

  const timeStr = scheduled.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) + ' IST';

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await meetingsService.joinMeeting(meeting._id);
      window.open(res.joinLink, '_blank', 'noopener,noreferrer');
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to join meeting');
    }
    setJoining(false);
  };

  return (
    <div className={`rounded-xl border transition-all ${
      meeting.status === 'Active'
        ? 'border-emerald-500/40 bg-emerald-500/5'
        : meeting.status === 'Cancelled'
        ? 'border-red-500/20 bg-red-500/5 opacity-60'
        : 'border-navy-700/60 bg-navy-900/40 hover:border-navy-600/60'
    }`}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            meeting.status === 'Active' ? 'bg-emerald-500/20' : 'bg-navy-800'
          }`}>
            {meeting.status === 'Active' ? (
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <Video size={18} className="text-gold-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-100 leading-snug">{meeting.title}</h3>
                {meeting.caseNumber && (
                  <p className="text-[10px] text-gray-500 mt-0.5">📁 {meeting.caseNumber}</p>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0 ${status.bg} ${status.color}`}>
                {meeting.status === 'Active' && <span className="mr-1">●</span>}
                {status.label}
              </span>
            </div>

            {/* Time + duration */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={11} />{timeStr}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{meeting.duration} min</span>
              <span className="flex items-center gap-1"><Users size={11} />{meeting.participants.length} participants</span>
            </div>

            {/* Organiser */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-gray-600">Organised by:</span>
              <span className="text-[10px] text-gray-400 font-medium">{meeting.createdBy.name}</span>
              <RoleBadge role={meeting.createdBy.role} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {/* Join button */}
          {isUpcoming && meeting.status !== 'Cancelled' && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                meeting.status === 'Active'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'btn-primary'
              } disabled:opacity-50`}
            >
              {joining ? <Loader2 size={13} className="animate-spin" /> : <PlayCircle size={13} />}
              {joining ? 'Opening...' : meeting.status === 'Active' ? 'Join Now' : 'Join Meeting'}
            </button>
          )}

          {/* Accept / Decline (if invited and not creator) */}
          {!isCreator && myStatus === 'invited' && isUpcoming && (
            <>
              <button
                onClick={() => onRespond(meeting._id, currentUserId, 'accepted')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all"
              >
                <Check size={12} /> Accept
              </button>
              <button
                onClick={() => onRespond(meeting._id, currentUserId, 'declined')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all"
              >
                <X size={12} /> Decline
              </button>
            </>
          )}

          {/* My response status */}
          {!isCreator && myStatus && myStatus !== 'invited' && (
            <span className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${
              myStatus === 'accepted' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
              myStatus === 'declined' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
              'text-gray-400 border-gray-600/30 bg-gray-500/10'
            }`}>
              <ParticipantStatusIcon status={myStatus} />
              {myStatus.charAt(0).toUpperCase() + myStatus.slice(1)}
            </span>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="ml-auto text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 text-[11px]"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Less' : 'Details'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-navy-700/40 p-4 space-y-4">
          {/* Description */}
          {meeting.description && (
            <p className="text-xs text-gray-400 leading-relaxed">{meeting.description}</p>
          )}

          {/* Agenda */}
          {meeting.agenda && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1.5">Agenda</p>
              <pre className="text-xs text-gray-400 font-sans whitespace-pre-wrap bg-navy-800/40 rounded-lg p-3 border border-navy-700/30">
                {meeting.agenda}
              </pre>
            </div>
          )}

          {/* Participants */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Participants ({meeting.participants.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {meeting.participants.map((p, i) => p.user && (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-navy-800/40 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-[9px] flex-shrink-0">
                    {p.user.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-200 truncate">{p.user.name}</p>
                    <p className="text-[9px] text-gray-600 truncate flex items-center gap-0.5">
                      <Mail size={8} /> {p.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <RoleBadge role={p.role} />
                    <ParticipantStatusIcon status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting link */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1.5">Meeting Link</p>
            <div className="flex items-center gap-2 p-2.5 bg-navy-800/40 rounded-lg border border-navy-700/30">
              <Link size={12} className="text-gray-500 flex-shrink-0" />
              <span className="text-[11px] text-blue-400 truncate flex-1">
                {meeting.platform === 'jitsi'
                  ? `https://meet.jit.si/legalassistant-${meeting.roomId}`
                  : (meeting.meetingLink || `https://meet.jit.si/legalassistant-${meeting.roomId}`)}
              </span>
              <a
                href={meeting.platform === 'jitsi'
                  ? `https://meet.jit.si/legalassistant-${meeting.roomId}`
                  : (meeting.meetingLink || '#')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gold-400 flex-shrink-0"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main VideoConferencePage ──────────────────────────────────────────────────
export default function VideoConferencePage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'upcoming' | 'past'>('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [error,    setError]    = useState('');

  const canSchedule = user?.role === 'Judge' || user?.role === 'Lawyer' || user?.role === 'Admin';

  const fetchMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await meetingsService.getMeetings();
      setMeetings(res.meetings || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load meetings');
    }
    setLoading(false);
  };

  useEffect(() => { fetchMeetings(); }, []);

  const handleCreated = (m: Meeting) => {
    setMeetings(prev => [m, ...prev]);
    setTab('upcoming');
  };

  const handleRespond = async (meetingId: string, userId: string, status: 'accepted' | 'declined') => {
    try {
      await meetingsService.respondToInvite(meetingId, userId, status);
      await fetchMeetings();
    } catch (err: any) {
      alert(err?.message || 'Failed to respond');
    }
  };

  const now = new Date();
  const upcoming = meetings.filter(m =>
    (m.status === 'Scheduled' || m.status === 'Active') && new Date(m.scheduledAt) >= new Date(now.getTime() - 3600000)
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = meetings.filter(m =>
    m.status === 'Completed' || m.status === 'Cancelled' ||
    (m.status === 'Scheduled' && new Date(m.scheduledAt) < new Date(now.getTime() - 3600000))
  ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const pendingInvites = meetings.filter(m =>
    m.status !== 'Cancelled' &&
    m.createdBy._id !== user?._id &&
    m.participants.find(p => p.user?._id === user?._id && p.status === 'invited')
  );

  const displayList = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium mb-3">
            <Video size={12} /> Video Conference
          </div>
          <h1 className="section-heading text-2xl">Legal Video Meetings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Schedule and join secure video conferences. Participants receive email invitations automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMeetings}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          {canSchedule && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary py-2.5 px-4 text-sm flex items-center gap-2"
            >
              <Plus size={15} /> Schedule Meeting
            </button>
          )}
        </div>
      </div>

      {/* ── Pending invite banner ─────────────────────────────────────────── */}
      {pendingInvites.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">
              {pendingInvites.length} Pending Meeting Invitation{pendingInvites.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {pendingInvites.map(m => (
              <div key={m._id} className="flex items-center justify-between gap-3 bg-navy-900/60 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-gray-200">{m.title}</p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(m.scheduledAt).toLocaleString('en-IN', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Kolkata' })} IST
                    {' '} · by {m.createdBy.name}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleRespond(m._id, user!._id, 'accepted')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                  >
                    <Check size={11} /> Accept
                  </button>
                  <button
                    onClick={() => handleRespond(m._id, user!._id, 'declined')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                  >
                    <X size={11} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
        {[
          { label: 'Upcoming',  value: upcoming.length, color: 'text-blue-400',    icon: Calendar },
          { label: 'Pending Invites', value: pendingInvites.length, color: 'text-amber-400', icon: Bell },
          { label: 'Total',     value: meetings.length, color: 'text-gold-400',    icon: Video },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card-gold flex items-center gap-3 py-3 px-4">
            <Icon size={20} className={color} />
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-navy-900/60 rounded-xl border border-navy-800 w-fit">
        {[
          { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { id: 'past',     label: 'Past',     count: past.length     },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-navy-700 text-gray-100 shadow-md'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              tab === t.id ? 'bg-gold-500/20 text-gold-400' : 'bg-navy-700/50 text-gray-600'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Meeting list ──────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin text-gold-500" />
          <span className="text-sm">Loading meetings...</span>
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-navy-800/60 flex items-center justify-center mb-4">
            <Video size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">
            {tab === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {tab === 'upcoming' && canSchedule
              ? 'Click "Schedule Meeting" to create one and send email invitations.'
              : tab === 'upcoming'
              ? 'Your upcoming meetings will appear here when someone invites you.'
              : 'Your completed meetings will appear here.'}
          </p>
          {tab === 'upcoming' && canSchedule && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm flex items-center gap-2">
              <Plus size={14} /> Schedule First Meeting
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map(m => (
            <MeetingCard
              key={m._id}
              meeting={m}
              currentUserId={user?._id || ''}
              currentUserRole={user?.role || ''}
              onJoin={() => {}}
              onRespond={handleRespond}
              onRefresh={fetchMeetings}
            />
          ))}
        </div>
      )}

      {/* ── Role info footer ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-navy-700/40 bg-navy-900/30 p-4">
        <p className="text-xs font-semibold text-gray-400 mb-3">Role Permissions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { role: 'Judge',   icon: Gavel,     perms: ['Schedule meetings', 'Invite participants', 'Cancel meetings', 'Join any assigned meeting'] },
            { role: 'Lawyer',  icon: Briefcase, perms: ['Schedule meetings', 'Invite participants', 'Cancel own meetings', 'Join assigned meetings'] },
            { role: 'Citizen', icon: User,      perms: ['Accept/decline invites', 'Join meetings when invited', 'View meeting details'] },
          ].map(({ role, icon: Icon, perms }) => (
            <div key={role} className="p-3 bg-navy-800/40 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={ROLE_CONFIG[role]?.color || 'text-gray-400'} />
                <span className="text-xs font-semibold text-gray-300">{role}</span>
              </div>
              <ul className="space-y-1">
                {perms.map(p => (
                  <li key={p} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <Check size={9} className="text-emerald-500 flex-shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && <ScheduleMeetingModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}
