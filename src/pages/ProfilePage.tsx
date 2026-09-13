import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Shield, Calendar, FileText, MessageSquare,
  Edit2, Check, X, Scale, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { caseFilingService } from '../services/caseFilingService';
import { documentService } from '../services/documentService';
import { chatService } from '../services/chatService';

interface UserCase {
  _id: string;
  caseNumber?: string;
  title: string;
  court?: string;
  status: string;
  nextHearingDate?: string;
  category: string;
}

interface UserDoc {
  _id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cases, setCases] = useState<UserCase[]>([]);
  const [docs, setDocs] = useState<UserDoc[]>([]);
  const [queries, setQueries] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setName(user.name);
    setPhone(user.phone || '');
    setAddress(user.address || '');
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      const [casesRes, docsRes, sessionsRes] = await Promise.all([
        caseFilingService.getCases().catch(() => ({ cases: [], total: 0 })),
        documentService.getDocuments().catch(() => ({ documents: [], total: 0 })),
        chatService.getSessions().catch(() => ({ sessions: [] }))
      ]);
      setCases(casesRes.cases || []);
      setDocs(docsRes.documents || []);
      setQueries((sessionsRes.sessions || []).length);
    } finally {
      setLoading(false);
    }
  }

  const saveProfile = async () => {
    if (!user) return;
    try {
      await userService.updateProfile({ name, phone, address });
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-6xl mx-auto space-y-6">
      <h1 className="section-heading">My Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card lg:col-span-1">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4 text-navy-950 font-bold text-2xl">
              {user.name.charAt(0)}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-field w-full text-center text-sm" placeholder="Name" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field w-full text-center text-sm" placeholder="Phone" />
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field w-full text-center text-sm" placeholder="Address" />
                <div className="flex gap-2 justify-center">
                  <button onClick={saveProfile} className="btn-primary py-2 px-3 text-xs flex items-center gap-1"><Check size={14} /> Save</button>
                  <button onClick={() => setIsEditing(false)} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1"><X size={14} /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-100">{user.name}</h2>
                <p className="text-sm text-gold-500 mt-1">{user.role}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  <p className="flex items-center justify-center gap-2"><Mail size={14} /> {user.email}</p>
                  <p className="flex items-center justify-center gap-2"><Phone size={14} /> {user.phone || '—'}</p>
                  <p className="flex items-center justify-center gap-2"><MapPin size={14} /> {user.address || '—'}</p>
                  <p className="flex items-center justify-center gap-2"><Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="mt-4 btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 mx-auto">
                  <Edit2 size={14} /> Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card text-center">
              <Scale size={20} className="text-gold-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-100">{cases.length}</p>
              <p className="text-xs text-gray-500">My Cases</p>
            </div>
            <div className="card text-center">
              <FileText size={20} className="text-gold-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-100">{docs.length}</p>
              <p className="text-xs text-gray-500">Documents</p>
            </div>
            <div className="card text-center">
              <MessageSquare size={20} className="text-gold-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-100">{queries}</p>
              <p className="text-xs text-gray-500">AI Queries</p>
            </div>
            <div className="card text-center">
              <Shield size={20} className="text-gold-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-100">{user.role}</p>
              <p className="text-xs text-gray-500">Role</p>
            </div>
          </div>

          {/* Recent Cases */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Scale size={16} className="text-gold-500" /> Recent Cases
            </h3>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-gold-500" /></div>
            ) : cases.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No cases yet. Use Case Filing to create cases.</p>
            ) : (
              <div className="space-y-3">
                {cases.slice(0, 5).map((c) => (
                  <div key={c._id} className="flex items-center justify-between p-3 rounded-lg bg-navy-800/40 hover:bg-navy-800/70 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.caseNumber || 'Draft'} · {c.court || '-'}</p>
                    </div>
                    <div className="text-right">
                      <span className={c.status === 'Resolved' ? 'badge-success' : 'badge-warning'}>{c.status}</span>
                      <p className="text-[10px] text-gray-500 mt-1">{c.nextHearingDate || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-gold-500" /> Recent Documents
            </h3>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-gold-500" /></div>
            ) : docs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No documents generated yet. Use the Document Generator.</p>
            ) : (
              <div className="space-y-3">
                {docs.slice(0, 5).map((d) => (
                  <div key={d._id} className="flex items-center justify-between p-3 rounded-lg bg-navy-800/40 hover:bg-navy-800/70 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{d.title}</p>
                      <p className="text-xs text-gray-500">{d.type} · {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="badge-gold text-[10px]">{d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
