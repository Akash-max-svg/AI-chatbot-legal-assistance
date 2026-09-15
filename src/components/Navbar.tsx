import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Scale, LayoutDashboard, MessageSquare, FileText, Search, BookOpen,
  Mic, Info, LogIn, Menu, X, ChevronDown, Bell, User, FilePlus,
  Briefcase, HelpCircle, Settings, LogOut, Gavel, Brain, Clock, Video,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

// ─── Role-specific nav definitions ───────────────────────────────────────────

const citizenNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chatbot',     icon: MessageSquare,   label: 'AI Chatbot' },
  { to: '/case-filing', icon: FilePlus,        label: 'Case Filing' },
  { to: '/meetings',    icon: Video,           label: 'Meetings' },
  { to: '/search',      icon: Search,          label: 'Case Search' },
  { to: '/documents',   icon: Briefcase,       label: 'Documents' },
  { to: '/knowledge',   icon: BookOpen,        label: 'Knowledge Base' },
  { to: '/research',    icon: Brain,           label: 'Legal Research' },
  { to: '/summarizer',  icon: FileText,        label: 'Summarizer' },
  { to: '/voice',       icon: Mic,             label: 'Voice Assistant' },
  { to: '/about',       icon: Info,            label: 'About' },
];

const lawyerNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chatbot',     icon: MessageSquare,   label: 'AI Chatbot' },
  { to: '/case-filing', icon: FilePlus,        label: 'Case Filing' },
  { to: '/meetings',    icon: Video,           label: 'Meetings' },
  { to: '/documents',   icon: Briefcase,       label: 'Documents' },
  { to: '/knowledge',   icon: BookOpen,        label: 'Knowledge Base' },
  { to: '/search',      icon: Search,          label: 'Case Search' },
  { to: '/research',    icon: Brain,           label: 'Legal Research' },
  { to: '/summarizer',  icon: FileText,        label: 'Summarizer' },
  { to: '/voice',       icon: Mic,             label: 'Voice Assistant' },
  { to: '/about',       icon: Info,            label: 'About' },
];

const judgeNav = [
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/judge/assigned-cases', icon: Scale,           label: 'Assigned Cases' },
  { to: '/judge/pending',        icon: Clock,           label: 'Pending Judgments' },
  { to: '/judge/ai-summaries',   icon: Brain,           label: 'AI Summaries' },
  { to: '/meetings',             icon: Video,           label: 'Meetings' },
  { to: '/research',             icon: Brain,           label: 'Legal Research' },
  { to: '/knowledge',            icon: BookOpen,        label: 'Knowledge Base' },
  { to: '/search',               icon: Search,          label: 'Case Search' },
  { to: '/voice',                icon: Mic,             label: 'Voice Assistant' },
  { to: '/notifications',        icon: Bell,            label: 'Notifications' },
  { to: '/about',                icon: Info,            label: 'About' },
];

// ─── Role-specific dropdown routes ───────────────────────────────────────────

function getMyCasesRoute(role: string) {
  if (role === 'Lawyer') return '/lawyer/cases';
  if (role === 'Judge')  return '/judge/cases';
  return '/my-cases';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isHome    = location.pathname === '/';

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  // scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // load notifications
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await notificationService.getNotifications(false);
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      } catch {
        // silent
      }
    })();
  }, [user]);

  const markRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  const goTo = (path: string) => { setUserMenuOpen(false); navigate(path); };

  // pick nav items based on role
  const role = user?.role || 'Citizen';
  const navItems =
    role === 'Judge'  ? judgeNav :
    role === 'Lawyer' ? lawyerNav :
    citizenNav;

  const myCasesRoute = getMyCasesRoute(role);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 ${
      isActive
        ? 'text-gold-400 bg-navy-800 shadow-md shadow-navy-950/50'
        : 'text-gray-400 hover:text-gold-400 hover:bg-navy-800/50'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive ? 'text-gold-400 bg-navy-800' : 'text-gray-400 hover:text-gold-400 hover:bg-navy-800/50'
    }`;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? 'bg-navy-950/95 backdrop-blur-md border-b border-navy-700/50 shadow-lg shadow-navy-950/30'
            : 'bg-navy-950/60 backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-gold-500/20 group-hover:shadow-gold-500/40 transition-shadow">
                <Scale size={20} className="text-navy-950" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gradient-gold leading-tight">AI Legal Assistant</h1>
                <p className="text-[9px] text-gray-500 font-medium tracking-wider uppercase">Indian E-Courts</p>
              </div>
            </NavLink>

            {/* Desktop nav */}
            <div className="hidden xl:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon size={14} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                      className="relative p-2 rounded-lg text-gray-400 hover:text-gold-400 hover:bg-navy-800/50 transition-all"
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-navy-900 border border-navy-700 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700">
                          <span className="text-sm font-semibold text-gray-200">Notifications</span>
                          <div className="flex items-center gap-3">
                            <button onClick={markAllRead} className="text-xs text-gold-400 hover:text-gold-300">
                              Mark all read
                            </button>
                            <button
                              onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                              className="text-xs text-gray-500 hover:text-gray-300"
                            >
                              View all
                            </button>
                          </div>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
                          ) : (
                            notifications.map((n) => (
                              <button
                                key={n._id}
                                onClick={() => markRead(n._id)}
                                className={`w-full text-left px-4 py-3 border-b border-navy-800/50 hover:bg-navy-800/50 transition-colors ${!n.isRead ? 'bg-navy-800/20' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    n.type === 'success' ? 'bg-emerald-400' : n.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                                  }`} />
                                  <div>
                                    <p className={`text-xs ${!n.isRead ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>{n.title}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{n.message}</p>
                                    <p className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-gray-300 hover:text-gold-400 text-xs transition-all"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-[10px]">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className="text-[10px] leading-tight font-medium">{user.name}</p>
                        <p className="text-[9px] text-gray-500 leading-tight capitalize">{user.role}</p>
                      </div>
                      <ChevronDown size={12} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-navy-900 border border-navy-700 rounded-xl shadow-xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-navy-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-sm">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm text-gray-200 font-medium">{user.name}</p>
                              <p className="text-[10px] text-gold-500">{user.email}</p>
                              <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="py-1">
                          <button
                            onClick={() => goTo('/profile')}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-navy-800 hover:text-gold-400 transition-colors"
                          >
                            <User size={14} /> My Profile
                          </button>
                          <button
                            onClick={() => goTo(myCasesRoute)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-navy-800 hover:text-gold-400 transition-colors"
                          >
                            <Gavel size={14} /> My Cases
                          </button>
                          <button
                            onClick={() => goTo('/notifications')}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-navy-800 hover:text-gold-400 transition-colors"
                          >
                            <Bell size={14} /> Notifications
                            {unreadCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => goTo('/settings')}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-navy-800 hover:text-gold-400 transition-colors"
                          >
                            <Settings size={14} /> Settings
                          </button>
                          <button
                            onClick={() => goTo('/help')}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:bg-navy-800 hover:text-gold-400 transition-colors"
                          >
                            <HelpCircle size={14} /> Help
                          </button>
                        </div>

                        <div className="border-t border-navy-700 py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-navy-800 transition-colors"
                          >
                            <LogOut size={14} /> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-navy-950 text-xs font-semibold transition-all"
                >
                  <LogIn size={14} /> Login
                </button>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden p-2 rounded-lg bg-navy-800 border border-navy-700 text-gray-300 hover:text-gold-400"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bg-navy-950 border-b border-navy-700/50 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <Icon size={18} /> <span>{label}</span>
                </NavLink>
              ))}
              {user && (
                <>
                  <div className="border-t border-navy-700/40 pt-2 mt-2 space-y-1">
                    <button
                      onClick={() => { setMobileOpen(false); navigate(myCasesRoute); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gold-400 hover:bg-navy-800/50 transition-all"
                    >
                      <Gavel size={18} /> My Cases
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/notifications'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gold-400 hover:bg-navy-800/50 transition-all"
                    >
                      <Bell size={18} /> Notifications
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gold-400 hover:bg-navy-800/50 transition-all"
                    >
                      <Settings size={18} /> Settings
                    </button>
                    <button
                      onClick={() => { setMobileOpen(false); navigate('/help'); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gold-400 hover:bg-navy-800/50 transition-all"
                    >
                      <HelpCircle size={18} /> Help
                    </button>
                  </div>
                  <div className="border-t border-navy-700/40 pt-2 mt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-navy-800/50 transition-all"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </>
              )}
              {!user && (
                <button
                  onClick={() => { setMobileOpen(false); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gold-400 bg-navy-800/50 hover:bg-navy-800 transition-all"
                >
                  <LogIn size={18} /> Login / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
