import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Scale, RotateCcw, History, X, Globe, Loader2, Trash2, MessageSquare, Download, Copy, Check, Share2, Mic, MicOff, AlertCircle, FileText, BookOpen, ChevronDown, ChevronUp, ExternalLink, Tag } from 'lucide-react';
import { chatService, sampleQuestions } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { languageService } from '../services/languageService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Recommendations, { RecommendationData } from '../components/Recommendations';
import { generateLegalPDF, downloadTextFile, shareText } from '../utils/pdfExport';
import type { LawSection } from '../services/ipcService';
import { getActColor, getActFullName, getChapterLabel } from '../services/ipcService';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  structured?: any;
  recommendations?: RecommendationData;
  ipcSections?: LawSection[];
  error?: boolean;
}

// ─── Law Section Card (works for all acts) ────────────────────────────────────
function LawSectionCard({ section }: { section: LawSection }) {
  const [expanded, setExpanded] = useState(false);
  const actColorClass = getActColor(String(section.act_short));
  const badge  = getChapterLabel(String(section.chapter_title || ''));
  const desc   = section.section_desc || '';
  const preview = desc.length > 200 ? desc.substring(0, 200) + '…' : desc;
  const actName = getActFullName(String(section.act_short));

  // Build devgan.in link for IPC; India Code for others
  const extLink = section.act_short === 'IPC'
    ? `https://devgan.in/ipc/section_${section.section}.php`
    : `https://www.indiacode.nic.in`;

  return (
    <div className={`rounded-xl border ${actColorClass} p-3 text-xs transition-all`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Act badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${actColorClass}`}>
            <Tag size={8} />
            {section.act_short}
          </span>
          <span className="font-bold text-[11px] text-gray-200 whitespace-nowrap">
            §&nbsp;{section.section}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-navy-700/80 text-gray-500 text-[9px] font-medium uppercase tracking-wide">
            {badge}
          </span>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-gray-500 hover:text-gold-400 flex-shrink-0 mt-0.5"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Title */}
      <p className="text-gray-200 font-semibold mt-1.5 leading-snug text-[11px]">
        {section.section_title}
      </p>

      {/* Description */}
      {desc && (
        <p className="text-gray-400 mt-1 leading-relaxed text-[10px]">
          {expanded ? desc : preview}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-navy-700/30">
        <span className="text-[9px] text-gray-600 truncate flex-1" title={actName}>
          {actName}
        </span>
        <a
          href={extLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-[9px] text-gold-600 hover:text-gold-400 flex-shrink-0"
        >
          Full text <ExternalLink size={9} />
        </a>
      </div>
    </div>
  );
}

// ─── Law Sections Panel ───────────────────────────────────────────────────────
function LawSectionsPanel({ sections }: { sections: LawSection[] }) {
  const [open, setOpen] = useState(true);
  if (!sections || sections.length === 0) return null;

  // Group by act_short for display
  const byAct: Record<string, LawSection[]> = {};
  sections.forEach(s => {
    const k = String(s.act_short);
    if (!byAct[k]) byAct[k] = [];
    byAct[k].push(s);
  });
  const actKeys = Object.keys(byAct);

  return (
    <div className="mt-3 rounded-xl border border-gold-500/20 bg-navy-900/60 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gold-400 hover:bg-navy-800/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen size={13} />
          Applicable Laws &amp; Sections ({sections.length} across {actKeys.length} act{actKeys.length !== 1 ? 's' : ''})
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="px-3 pb-3">
          {actKeys.map(actKey => (
            <div key={actKey} className="mb-3 last:mb-0">
              <p className="text-[9px] uppercase tracking-widest text-gray-600 font-semibold mb-1.5 pl-0.5">
                {getActFullName(actKey)}
              </p>
              <div className="space-y-2">
                {byAct[actKey].map(s => (
                  <LawSectionCard key={s.id || `${s.act_short}-${s.section}`} section={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const { languages, currentLanguage, setCurrentLanguage, voiceLocale } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (user) loadSessions();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = voiceLocale;
    rec.onstart = () => { setIsListening(true); setError(''); };
    rec.onresult = (e: any) => {
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      }
      if (finalText) setInput((prev) => (prev ? prev + ' ' : '') + finalText);
    };
    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed') setError('Microphone access denied. Please allow microphone permission.');
      else if (e.error === 'no-speech') setError('No speech detected. Please try again.');
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, [voiceLocale]);

  async function loadSessions() {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { sessions } = await chatService.getSessions();
      setChatSessions(sessions.map((s: any) => ({
        id: s._id,
        title: s.title,
        created_at: s.createdAt
      })));
    } catch {}
    setLoadingHistory(false);
  }

  async function loadSessionMessages(sid: string) {
    setSessionId(sid);
    try {
      const { messages } = await chatService.getSessionMessages(sid);
      setMessages(
        messages.map((m: any) => ({
          id: m._id,
          role: m.role,
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          structured: m.structured,
          recommendations: m.structured?.recommendations,
          ipcSections: m.structured?.ipcSections || [],
        }))
      );
    } catch {}
    setShowHistory(false);
  }

  const send = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || isTyping) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: userText, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const response = await chatService.sendMessage(userText, currentLanguage, sessionId || undefined);
      setSessionId(response.sessionId);
      const recs: RecommendationData = response.message.structured?.recommendations || {};
      const aiMsg: ChatMessage = {
        id: response.message.id,
        role: 'ai',
        text: response.message.text,
        time: response.message.time,
        structured: response.message.structured,
        recommendations: recs,
        ipcSections: response.message.structured?.ipcSections || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const msg = err?.message || 'Unable to process your request at the moment.';
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: msg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setError(msg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setError('');
    inputRef.current?.focus();
  };

  const deleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatService.deleteSession(sid);
    if (sid === sessionId) {
      setMessages([]);
      setSessionId(null);
    }
    await loadSessions();
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = voiceLocale;
      recognitionRef.current.start();
    }
  };

  const copyMessage = (msg: ChatMessage) => {
    const full = msg.structured ? `${msg.text}\n\n${JSON.stringify(msg.structured, null, 2)}` : msg.text;
    navigator.clipboard.writeText(full);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadMessage = (msg: ChatMessage) => {
    const content = msg.structured ? `${msg.text}\n\n---\nStructured Data:\n${JSON.stringify(msg.structured, null, 2)}` : msg.text;
    downloadTextFile(`Legal_Response_${msg.id.slice(0, 8)}.txt`, content);
  };

  const shareMessage = async (msg: ChatMessage) => {
    await shareText('AI Legal Assistant Response', msg.text);
  };

  const downloadMessagePDF = (msg: ChatMessage) => {
    const s = msg.structured || {};
    generateLegalPDF({
      title: 'AI Legal Response',
      subtitle: 'AI Legal Assistant for Indian E-Courts',
      meta: [
        { label: 'Language', value: languageService.getLabel(currentLanguage) },
        { label: 'Generated', value: new Date().toLocaleString() },
      ],
      sections: [
        { heading: 'Response', body: msg.text },
        ...(s.relevantActs?.length ? [{ heading: 'Relevant Acts', body: s.relevantActs.join('\n') }] : []),
        ...(s.relevantSections?.length ? [{ heading: 'Relevant Sections', body: s.relevantSections.join('\n') }] : []),
        ...(s.ipcSections?.length ? [{ heading: 'Applicable Laws & Sections', body: s.ipcSections.map((sec: any) => `${sec.act_short} §${sec.section} – ${sec.section_title}: ${(sec.section_desc || '').substring(0, 200)}`).join('\n\n') }] : []),
        ...(s.legalRights?.length ? [{ heading: 'Legal Rights', body: s.legalRights.join('\n') }] : []),
        ...(s.filingProcedure?.length ? [{ heading: 'Filing Procedure', body: s.filingProcedure.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') }] : []),
        ...(s.requiredDocuments?.length ? [{ heading: 'Required Documents', body: s.requiredDocuments.join('\n') }] : []),
        ...(s.courtToApproach ? [{ heading: 'Court to Approach', body: s.courtToApproach }] : []),
        ...(s.estimatedTimeline ? [{ heading: 'Estimated Timeline', body: s.estimatedTimeline }] : []),
      ],
      footer: s.disclaimer || 'AI-generated legal information for research purposes only. Not a substitute for professional legal advice.',
    });
  };

  const currentLang = languageService.getLabel(currentLanguage);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-6 lg:px-10 py-4 border-b border-navy-800 bg-navy-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Bot size={20} className="text-navy-950" />
            </div>
            <div>
              <h1 className="section-heading text-xl">AI Legal Chatbot</h1>
              <p className="text-xs text-gray-500">Powered by Google Gemini AI — Indian legal intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)} className="input-field text-xs py-1.5 pr-6 pl-2 appearance-none cursor-pointer">
                {languages.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
              </select>
              <Globe size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
              <History size={14} /> History
            </button>
            <button onClick={clearChat} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
              <RotateCcw size={14} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-5xl mx-auto w-full">
        {/* Chat History Panel */}
        {showHistory && (
          <div className="w-64 border-r border-navy-800 bg-navy-900/50 flex flex-col">
            <div className="p-3 border-b border-navy-800 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">Chat History</span>
              <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-300"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="text-gold-500 animate-spin" />
                </div>
              ) : chatSessions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No history yet</p>
              ) : (
                chatSessions.map((session) => (
                  <div key={session.id} className="group relative">
                    <button
                      onClick={() => loadSessionMessages(session.id)}
                      className={`w-full text-left p-2.5 rounded-lg bg-navy-800/40 hover:bg-navy-800 transition-colors ${session.id === sessionId ? 'border border-gold-500/30' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <MessageSquare size={10} className="text-gray-500" />
                        <p className="text-xs text-gray-200 font-medium truncate">{session.title}</p>
                      </div>
                      <p className="text-[10px] text-gray-500">{new Date(session.created_at).toLocaleDateString()}</p>
                    </button>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="absolute right-1 top-1 p-1 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-6 shadow-lg shadow-gold-500/20 animate-float">
                  <Scale size={28} className="text-navy-950" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-gray-100 mb-2">How can I assist you?</h2>
                <p className="text-sm text-gray-400 max-w-md mb-8">
                  Ask about Indian laws, case procedures, court rulings, or legal terminology. Currently set to <span className="text-gold-400">{currentLang}</span>.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {sampleQuestions.map((q) => (
                    <button key={q} onClick={() => send(q)} className="card text-left text-sm text-gray-300 hover:text-gold-400 hover:border-gold-600/30 py-3 px-4 flex items-start gap-2">
                      <Sparkles size={14} className="text-gold-500 mt-0.5 flex-shrink-0" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={16} className="text-gold-400" />
                    </div>
                  )}
                  <div className={msg.role === 'user' ? 'bg-gold-500/20 border border-gold-500/30 text-gray-100 rounded-2xl rounded-br-md px-4 py-3 max-w-[85%]' : `bg-navy-800 border ${msg.error ? 'border-red-500/40' : 'border-navy-700'} text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]`}>
                    {msg.role === 'ai' ? (
                      <div className="space-y-3">
                        {msg.error ? (
                          <div className="flex items-start gap-2 text-sm text-red-300">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{msg.text}</span>
                          </div>
                        ) : (
                          <>
                            <MarkdownRenderer content={msg.text} />
                            {msg.recommendations && (
                              <Recommendations
                                data={msg.recommendations}
                                onTopicClick={(t) => { setInput(t); inputRef.current?.focus(); }}
                                compact
                              />
                            )}
                            {msg.ipcSections && msg.ipcSections.length > 0 && (
                              <LawSectionsPanel sections={msg.ipcSections} />
                            )}
                            <div className="flex items-center gap-1 pt-2 border-t border-navy-700/40">
                              <button onClick={() => copyMessage(msg)} className="p-1.5 rounded-md text-gray-500 hover:text-gold-400 hover:bg-navy-700/50 transition-colors" title="Copy">
                                {copiedId === msg.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              </button>
                              <button onClick={() => downloadMessage(msg)} className="p-1.5 rounded-md text-gray-500 hover:text-gold-400 hover:bg-navy-700/50 transition-colors" title="Download as text">
                                <Download size={13} />
                              </button>
                              <button onClick={() => downloadMessagePDF(msg)} className="p-1.5 rounded-md text-gray-500 hover:text-gold-400 hover:bg-navy-700/50 transition-colors" title="Download as PDF">
                                <FileText size={13} />
                              </button>
                              <button onClick={() => shareMessage(msg)} className="p-1.5 rounded-md text-gray-500 hover:text-gold-400 hover:bg-navy-700/50 transition-colors" title="Share">
                                <Share2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                        <p className="text-[10px] text-gray-500">{msg.time}</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                        <p className="text-[10px] text-gray-500 mt-2">{msg.time}</p>
                      </>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={16} className="text-gray-300" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-gold-400" />
                  </div>
                  <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 mr-1">Gemini is analyzing</span>
                      <span className="w-2 h-2 bg-gold-400 rounded-full typing-dot" />
                      <span className="w-2 h-2 bg-gold-400 rounded-full typing-dot" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gold-400 rounded-full typing-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-navy-800 px-6 lg:px-10 py-4 bg-navy-950/80 backdrop-blur-sm">
            {error && (
              <div className="max-w-3xl mx-auto mb-2 flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              {voiceSupported && (
                <button
                  onClick={toggleVoice}
                  className={`btn-secondary py-2.5 px-3 ${isListening ? 'bg-red-500/20 border-red-500/40 text-red-400' : ''}`}
                  title={isListening ? 'Stop voice input' : 'Voice input'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a legal question..." rows={1} className="input-field flex-1 resize-none" />
              <button onClick={() => send()} disabled={!input.trim() || isTyping} className="btn-primary py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed">
                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-2 max-w-3xl mx-auto">AI-generated responses are for legal research only. Not a substitute for professional legal advice.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
