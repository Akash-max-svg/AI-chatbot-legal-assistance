import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Scale, RotateCcw, History, X, Globe, Loader2, Trash2, MessageSquare, Download, Copy, Check, Share2, Mic, MicOff, AlertCircle, FileText, BookOpen, ChevronDown, ChevronUp, ExternalLink, Tag, Languages, Keyboard } from 'lucide-react';
import { chatService, sampleQuestions } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { languageService } from '../services/languageService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Recommendations, { RecommendationData } from '../components/Recommendations';
import { generateLegalPDF, downloadTextFile, shareText } from '../utils/pdfExport';
import type { LawSection } from '../services/ipcService';
import { getActColor, getActFullName, getChapterLabel } from '../services/ipcService';

// ── Indian Language configs with native names and placeholders ────────────────
const INDIAN_LANGUAGES = [
  { code: 'en',  label: 'English',    native: 'English',    flag: '🇮🇳', placeholder: 'Ask a legal question in English...',     script: 'latin'     },
  { code: 'hi',  label: 'Hindi',      native: 'हिंदी',       flag: '🇮🇳', placeholder: 'कानूनी सवाल पूछें...',                    script: 'devanagari'},
  { code: 'te',  label: 'Telugu',     native: 'తెలుగు',      flag: '🇮🇳', placeholder: 'చట్టపరమైన ప్రశ్న అడగండి...',             script: 'telugu'    },
  { code: 'ta',  label: 'Tamil',      native: 'தமிழ்',       flag: '🇮🇳', placeholder: 'சட்ட கேள்வி கேளுங்கள்...',              script: 'tamil'     },
  { code: 'kn',  label: 'Kannada',    native: 'ಕನ್ನಡ',       flag: '🇮🇳', placeholder: 'ಕಾನೂನು ಪ್ರಶ್ನೆ ಕೇಳಿ...',                 script: 'kannada'   },
  { code: 'ml',  label: 'Malayalam',  native: 'മലയാളം',     flag: '🇮🇳', placeholder: 'നിയമ ചോദ്യം ചോദിക്കൂ...',              script: 'malayalam' },
  { code: 'mr',  label: 'Marathi',    native: 'मराठी',       flag: '🇮🇳', placeholder: 'कायदेशीर प्रश्न विचारा...',              script: 'devanagari'},
  { code: 'pa',  label: 'Punjabi',    native: 'ਪੰਜਾਬੀ',      flag: '🇮🇳', placeholder: 'ਕਾਨੂੰਨੀ ਸਵਾਲ ਪੁੱਛੋ...',               script: 'gurmukhi'  },
  { code: 'bn',  label: 'Bengali',    native: 'বাংলা',       flag: '🇮🇳', placeholder: 'আইনি প্রশ্ন করুন...',                   script: 'bengali'   },
  { code: 'or',  label: 'Odia',       native: 'ଓଡ଼ିଆ',       flag: '🇮🇳', placeholder: 'ଆଇନ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ...',              script: 'odia'      },
  { code: 'as',  label: 'Assamese',   native: 'অসমীয়া',     flag: '🇮🇳', placeholder: 'আইনী প্ৰশ্ন সোধক...',                   script: 'bengali'   },
  { code: 'gu',  label: 'Gujarati',   native: 'ગુજરાતી',     flag: '🇮🇳', placeholder: 'કાનૂની પ્રશ્ન પૂછો...',                  script: 'gujarati'  },
];

// ── Script detection patterns ─────────────────────────────────────────────────
const SCRIPT_PATTERNS: Array<{ code: string; regex: RegExp }> = [
  { code: 'hi', regex: /[\u0900-\u097F]/ },       // Devanagari (Hindi/Marathi)
  { code: 'te', regex: /[\u0C00-\u0C7F]/ },       // Telugu
  { code: 'ta', regex: /[\u0B80-\u0BFF]/ },       // Tamil
  { code: 'kn', regex: /[\u0C80-\u0CFF]/ },       // Kannada
  { code: 'ml', regex: /[\u0D00-\u0D7F]/ },       // Malayalam
  { code: 'pa', regex: /[\u0A00-\u0A7F]/ },       // Gurmukhi (Punjabi)
  { code: 'bn', regex: /[\u0980-\u09FF]/ },       // Bengali/Assamese
  { code: 'gu', regex: /[\u0A80-\u0AFF]/ },       // Gujarati
  { code: 'or', regex: /[\u0B00-\u0B7F]/ },       // Odia
];

function detectScriptLanguage(text: string): string | null {
  for (const { code, regex } of SCRIPT_PATTERNS) {
    if (regex.test(text)) return code;
  }
  return null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  structured?: any;
  recommendations?: RecommendationData;
  ipcSections?: LawSection[];
  error?: boolean;
  language?: string;
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

// ── Sample phrases per language for quick start ───────────────────────────────
function getSamplePhrases(langCode: string): string[] {
  const phrases: Record<string, string[]> = {
    hi: ['मुझे जमानत कैसे मिलेगी?', 'तलाक की प्रक्रिया क्या है?', 'FIR कैसे दर्ज करें?'],
    te: ['బెయిల్ ఎలా పొందాలి?', 'విడాకులు ఎలా తీసుకోవాలి?', 'FIR ఎలా దాఖలు చేయాలి?'],
    ta: ['ஜாமீன் எப்படி பெறுவது?', 'விவாகரத்து எப்படி செய்வது?', 'FIR எப்படி பதிவு செய்வது?'],
    kn: ['ಜಾಮೀನು ಹೇಗೆ ಪಡೆಯುವುದು?', 'ವಿಚ್ಛೇದನ ಹೇಗೆ ಪಡೆಯುವುದು?', 'FIR ಹೇಗೆ ದಾಖಲಿಸುವುದು?'],
    ml: ['ജാമ്യം എങ്ങനെ ലഭിക്കും?', 'വിവാഹമോചനം എങ്ങനെ?', 'FIR എങ്ങനെ നൽകാം?'],
    mr: ['जामीन कसा मिळेल?', 'घटस्फोट कसा घ्यावा?', 'FIR कसा दाखल करावा?'],
    pa: ['ਜ਼ਮਾਨਤ ਕਿਵੇਂ ਮਿਲੇਗੀ?', 'ਤਲਾਕ ਕਿਵੇਂ ਲੈਣਾ ਹੈ?', 'FIR ਕਿਵੇਂ ਦਰਜ ਕਰਾਈਏ?'],
    bn: ['জামিন কীভাবে পাবো?', 'বিবাহবিচ্ছেদ কীভাবে করবো?', 'FIR কীভাবে দায়ের করবো?'],
    or: ['ଜାମିନ କିପରି ପାଇବ?', 'ବିବାହ ବିଚ୍ଛେଦ କିପରି?', 'FIR କିପରି ଦାଖଲ କରିବ?'],
    as: ['জামিন কেনেকৈ পাব?', 'বিবাহ বিচ্ছেদ কেনেকৈ?', 'FIR কেনেকৈ দাখিল কৰিব?'],
    gu: ['જામીન કેવી રીતે મળશે?', 'છૂટાછેડા કેવી રીતે?', 'FIR કેવી રીতે દાખલ કરવી?'],
  };
  return phrases[langCode] || [];
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
  // ── New language + typing state ──────────────────────────────────────────
  const [showLangKeyboard, setShowLangKeyboard] = useState(false);
  const [userIsTyping, setUserIsTyping]         = useState(false);
  const [detectedLang, setDetectedLang]         = useState<string | null>(null);
  const [charCount, setCharCount]               = useState(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // ── Typing handler with language detection ─────────────────────────────────
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setCharCount(val.length);

    // Show "user is typing" indicator
    setUserIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setUserIsTyping(false), 1500);

    // Auto-detect script language
    if (val.length >= 2) {
      const detected = detectScriptLanguage(val);
      if (detected && detected !== currentLanguage) {
        setDetectedLang(detected);
      } else {
        setDetectedLang(null);
      }
    } else {
      setDetectedLang(null);
    }

    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [currentLanguage]);

  // Accept auto-detected language
  const acceptDetectedLang = () => {
    if (detectedLang) {
      setCurrentLanguage(detectedLang);
      setDetectedLang(null);
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
              <select
                value={currentLanguage}
                onChange={(e) => { setCurrentLanguage(e.target.value); setDetectedLang(null); }}
                className="input-field text-xs py-1.5 pr-6 pl-2 appearance-none cursor-pointer min-w-[110px]"
              >
                {INDIAN_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} ({l.label})
                  </option>
                ))}
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
                  Ask about Indian laws, case procedures, court rulings, or legal terminology. Currently set to <span className="text-gold-400">{INDIAN_LANGUAGES.find(l => l.code === currentLanguage)?.label || currentLang}</span>
                  {currentLanguage !== 'en' && (
                    <span className="text-gray-500"> — Type in {INDIAN_LANGUAGES.find(l => l.code === currentLanguage)?.native} or English</span>
                  )}.
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
                      <span className="text-xs text-gray-400 mr-1">
                        Analyzing in {INDIAN_LANGUAGES.find(l => l.code === currentLanguage)?.label || 'English'}
                      </span>
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

            {/* ── Language Keyboard Panel ─────────────────────────────────── */}
            {showLangKeyboard && (
              <div className="max-w-3xl mx-auto mb-3 rounded-xl border border-navy-700/60 bg-navy-900/80 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-navy-700/40">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gold-400">
                    <Languages size={13} />
                    Type in Indian Languages
                  </div>
                  <button onClick={() => setShowLangKeyboard(false)} className="text-gray-500 hover:text-gray-300">
                    <X size={13} />
                  </button>
                </div>
                <div className="p-2 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {INDIAN_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLanguage(lang.code);
                        setDetectedLang(null);
                        inputRef.current?.focus();
                      }}
                      className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-[10px] font-medium transition-all border ${
                        currentLanguage === lang.code
                          ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                          : 'bg-navy-800/50 border-navy-700/40 text-gray-400 hover:bg-navy-700/60 hover:text-gray-200'
                      }`}
                    >
                      <span className="text-sm leading-none">{lang.flag}</span>
                      <span className="text-[9px] text-gray-500 leading-none">{lang.native}</span>
                      <span className="leading-none">{lang.label}</span>
                    </button>
                  ))}
                </div>
                {/* Sample phrases for selected language */}
                {currentLanguage !== 'en' && (
                  <div className="px-3 pb-2 border-t border-navy-700/30 pt-2">
                    <p className="text-[9px] text-gray-600 mb-1">Sample phrases:</p>
                    <div className="flex flex-wrap gap-1">
                      {getSamplePhrases(currentLanguage).map((phrase, i) => (
                        <button
                          key={i}
                          onClick={() => { setInput(phrase); inputRef.current?.focus(); }}
                          className="text-[10px] px-2 py-1 rounded-full bg-navy-700/50 border border-navy-600/40 text-gray-400 hover:text-gold-400 hover:border-gold-500/30 transition-all"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Auto-language detection banner ────────────────────────────── */}
            {detectedLang && (
              <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px]">
                <Globe size={12} className="text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 flex-1">
                  Detected: <span className="text-blue-400 font-semibold">{INDIAN_LANGUAGES.find(l => l.code === detectedLang)?.label}</span> script
                </span>
                <button
                  onClick={acceptDetectedLang}
                  className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all font-medium"
                >
                  Switch →
                </button>
                <button onClick={() => setDetectedLang(null)} className="text-gray-600 hover:text-gray-400">
                  <X size={11} />
                </button>
              </div>
            )}

            {/* ── Main input row ────────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto">
              {/* Active language badge + char count shown above textarea while typing */}
              {(userIsTyping || input.length > 0) && (
                <div className="flex items-center justify-between mb-1 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border transition-all ${
                      currentLanguage !== 'en'
                        ? 'bg-gold-500/15 border-gold-500/30 text-gold-400'
                        : 'bg-navy-700/40 border-navy-600/30 text-gray-500'
                    }`}>
                      🇮🇳 {INDIAN_LANGUAGES.find(l => l.code === currentLanguage)?.native || 'English'}
                    </span>
                    {userIsTyping && (
                      <span className="flex items-center gap-0.5 text-[9px] text-gray-600">
                        <span className="w-1 h-1 bg-gold-500 rounded-full animate-pulse" />
                        <span className="w-1 h-1 bg-gold-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                        <span className="w-1 h-1 bg-gold-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                        <span className="ml-0.5 text-gray-600">typing</span>
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] ${charCount > 500 ? 'text-amber-400' : 'text-gray-700'}`}>
                    {charCount}/1000
                  </span>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Voice button */}
                {voiceSupported && (
                  <button
                    onClick={toggleVoice}
                    title={isListening ? 'Stop voice input' : `Voice input (${INDIAN_LANGUAGES.find(l => l.code === currentLanguage)?.label || 'English'})`}
                    className={`flex-shrink-0 btn-secondary py-2.5 px-3 transition-all ${
                      isListening
                        ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                        : ''
                    }`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}

                {/* Language keyboard toggle */}
                <button
                  onClick={() => setShowLangKeyboard(v => !v)}
                  title="Switch input language"
                  className={`flex-shrink-0 btn-secondary py-2.5 px-3 transition-all ${
                    showLangKeyboard || currentLanguage !== 'en'
                      ? 'border-gold-500/40 text-gold-400 bg-gold-500/10'
                      : ''
                  }`}
                >
                  <Keyboard size={18} />
                </button>

                {/* Textarea */}
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      INDIAN_LANGUAGES.find(l => l.code === currentLanguage)?.placeholder
                      || 'Ask a legal question...'
                    }
                    rows={1}
                    maxLength={1000}
                    className={`input-field w-full resize-none transition-all leading-relaxed ${
                      currentLanguage !== 'en' ? 'text-base' : 'text-sm'
                    }`}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    lang={currentLanguage}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || isTyping}
                  title="Send message"
                  className="flex-shrink-0 btn-primary py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>

              {/* Bottom bar: current language + disclaimer */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Globe size={10} className="text-gray-600" />
                  <span className="text-[10px] text-gray-600">
                    Responding in:{' '}
                    <button
                      onClick={() => setShowLangKeyboard(v => !v)}
                      className="text-gold-600 hover:text-gold-400 font-medium transition-colors"
                    >
                      {INDIAN_LANGUAGES.find(l => l.code === currentLanguage)?.label || currentLanguage}
                    </button>
                  </span>
                </div>
                <p className="text-[9px] text-gray-700">
                  For research only · Not legal advice
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-4px); }
        }
        .typing-dot { animation: typing-bounce 1.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
