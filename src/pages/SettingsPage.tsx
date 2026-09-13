import { useState } from 'react';
import {
  User, Lock, Globe, Bell, Mail, Shield, Save, Check,
  Eye, EyeOff, Moon, Sun, ChevronRight,
} from 'lucide-react';

const languages = [
  'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu',
  'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi',
];

function Toggle({
  label, desc, checked, onChange,
}: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${
          checked ? 'bg-gold-500' : 'bg-navy-700 border border-navy-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [saved, setSaved] = useState(false);

  // Password
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Language & Theme
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Notification Prefs
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [notifCaseUpdates, setNotifCaseUpdates] = useState(true);
  const [notifHearings, setNotifHearings] = useState(true);
  const [notifDocuments, setNotifDocuments] = useState(true);
  const [notifSystem, setNotifSystem] = useState(false);

  // Email Prefs
  const [emailNewsletter, setEmailNewsletter] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Security
  const [twoFA, setTwoFA] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id: 'personal', icon: User, label: 'Personal Info' },
    { id: 'password', icon: Lock, label: 'Change Password' },
    { id: 'language', icon: Globe, label: 'Language & Theme' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'email', icon: Mail, label: 'Email Preferences' },
    { id: 'security', icon: Shield, label: 'Security' },
  ];

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account preferences and security</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-navy-700 text-gold-400 border border-navy-600'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-navy-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <tab.icon size={14} />
                  {tab.label}
                </div>
                <ChevronRight size={11} className="text-gray-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div className="lg:col-span-3">
          <div className="card space-y-6">

            {activeTab === 'personal' && (
              <>
                <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <User size={16} className="text-gold-500" /> Personal Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">First Name</label>
                    <input className="input-field w-full" placeholder="Enter first name" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Last Name</label>
                    <input className="input-field w-full" placeholder="Enter last name" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
                    <input type="email" className="input-field w-full" placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Phone Number</label>
                    <input className="input-field w-full" placeholder="+91 9XXXXXXXXX" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1.5">Address</label>
                    <textarea rows={3} className="input-field w-full resize-none" placeholder="Enter your address" />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'password' && (
              <>
                <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <Lock size={16} className="text-gold-500" /> Change Password
                </h2>
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input-field w-full pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field w-full pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field w-full"
                      placeholder="Confirm new password"
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'language' && (
              <>
                <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <Globe size={16} className="text-gold-500" /> Language & Theme
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Interface Language</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setLanguage(lang)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                            language === lang
                              ? 'bg-gold-500/20 text-gold-400 border-gold-500/40'
                              : 'bg-navy-800 text-gray-400 border-navy-700 hover:text-gray-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Theme</label>
                    <div className="flex gap-3">
                      {(['dark', 'light'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                            theme === t
                              ? 'bg-gold-500/20 text-gold-400 border-gold-500/40'
                              : 'bg-navy-800 text-gray-400 border-navy-700 hover:text-gray-200'
                          }`}
                        >
                          {t === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                          {t === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-2">Theme changes apply on next reload.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <Bell size={16} className="text-gold-500" /> Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700/50 space-y-3">
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Channels</p>
                    <Toggle label="Email Notifications" desc="Receive notifications via email" checked={notifEmail} onChange={setNotifEmail} />
                    <Toggle label="SMS Notifications" desc="Receive notifications via SMS" checked={notifSMS} onChange={setNotifSMS} />
                  </div>
                  <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700/50 space-y-3">
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Event Types</p>
                    <Toggle label="Case Updates" desc="When your case status changes" checked={notifCaseUpdates} onChange={setNotifCaseUpdates} />
                    <Toggle label="Hearing Reminders" desc="Reminders before upcoming hearings" checked={notifHearings} onChange={setNotifHearings} />
                    <Toggle label="Document Status" desc="When documents are approved or rejected" checked={notifDocuments} onChange={setNotifDocuments} />
                    <Toggle label="System Announcements" desc="Maintenance and platform updates" checked={notifSystem} onChange={setNotifSystem} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'email' && (
              <>
                <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <Mail size={16} className="text-gold-500" /> Email Preferences
                </h2>
                <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700/50 space-y-3">
                  <Toggle label="Newsletter" desc="Monthly newsletter with legal updates and platform news" checked={emailNewsletter} onChange={setEmailNewsletter} />
                  <Toggle label="Weekly Digest" desc="A weekly summary of your case activity and AI insights" checked={emailDigest} onChange={setEmailDigest} />
                  <Toggle label="Urgent Alerts" desc="Immediate email for critical deadlines and hearings" checked={emailAlerts} onChange={setEmailAlerts} />
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <Shield size={16} className="text-gold-500" /> Security Settings
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700/50 space-y-3">
                    <Toggle label="Two-Factor Authentication" desc="Add an extra layer of security to your account" checked={twoFA} onChange={setTwoFA} />
                    <Toggle label="Login Alerts" desc="Get notified when a new login is detected" checked={loginAlerts} onChange={setLoginAlerts} />
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Danger Zone</p>
                    <p className="text-xs text-gray-500">Deleting your account is permanent and cannot be undone.</p>
                    <button className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all">
                      Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-navy-700/50">
              <button
                onClick={handleSave}
                className={`btn-primary flex items-center gap-2 text-sm ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
              >
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? 'Saved Successfully!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
