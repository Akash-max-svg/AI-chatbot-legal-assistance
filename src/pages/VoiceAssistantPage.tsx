import { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Send, Volume2, Loader2, AlertCircle, Bot, User,
  Globe, Volume, Headphones,
} from 'lucide-react';
import { voiceService } from '../services/voiceService';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
}

export default function VoiceAssistantPage() {
  const { languages, currentLanguage, setCurrentLanguage, voiceLocale } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = voiceLocale;

    rec.onstart = () => {
      setIsListening(true);
      setError('');
    };

    rec.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setRecognizedText(final);
      } else if (interim) {
        setRecognizedText(interim);
      }
    };

    rec.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permission.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else {
        setError('Speech recognition error: ' + event.error);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
    };
  }, [voiceLocale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setRecognizedText('');
      recognitionRef.current.lang = voiceLocale;
      recognitionRef.current.start();
    }
  };

  const sendVoiceQuery = async () => {
    const text = recognizedText.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setRecognizedText('');
    setIsProcessing(true);

    try {
      const response = await voiceService.processQuery(text, currentLanguage);
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: response.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (ttsEnabled) {
        speakText(response.answer);
      }
    } catch (err: any) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: err?.message || 'I apologize, but I am unable to process your request at the moment.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLocale;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/20 animate-float">
          <Mic size={28} className="text-navy-950" />
        </div>
        <h1 className="section-heading">Voice Assistant</h1>
        <p className="text-gray-400 text-sm mt-1">Speech-to-Text and Text-to-Speech powered legal assistant</p>
      </div>

      {/* Controls */}
      <div className="card flex flex-wrap items-center justify-center gap-3">
        <div className="relative">
          <select value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)} className="input-field text-xs py-1.5 pr-6 pl-2 appearance-none cursor-pointer">
            {languages.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
          <Globe size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <button
          onClick={() => {
            if (ttsEnabled) stopSpeaking();
            setTtsEnabled(!ttsEnabled);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            ttsEnabled ? 'bg-gold-500 text-navy-950' : 'bg-navy-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          <Headphones size={14} /> {ttsEnabled ? 'TTS ON' : 'TTS OFF'}
        </button>
      </div>

      {!supported && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300/80">{error}</p>
        </div>
      )}

      {/* Voice Interface */}
      <div className="card text-center py-10">
        <button
          onClick={toggleListening}
          disabled={!supported}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
            isListening
              ? 'bg-red-500/20 border-4 border-red-500/40 animate-pulse'
              : 'bg-gold-500/20 border-4 border-gold-500/40 hover:bg-gold-500/30'
          }`}
        >
          {isListening ? <MicOff size={36} className="text-red-400" /> : <Mic size={36} className="text-gold-400" />}
        </button>

        <p className="text-sm font-medium text-gray-200 mb-2">
          {isListening ? 'Listening... Speak now' : 'Tap the microphone to start'}
        </p>
        <p className="text-xs text-gray-500">Browser Speech-to-Text (Chrome/Edge recommended)</p>

        {error && supported && (
          <p className="text-xs text-red-400 mt-3">{error}</p>
        )}
      </div>

      {/* Recognized Text */}
      {recognizedText && (
        <div className="card">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Recognized Text</p>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Volume2 size={14} className="text-gold-400" />
            </div>
            <p className="text-sm text-gray-200 flex-1">{recognizedText}</p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3">
            <button onClick={() => setRecognizedText('')} className="btn-secondary py-2 px-3 text-xs">Clear</button>
            <button onClick={sendVoiceQuery} disabled={isProcessing} className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Query
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={16} className="text-gold-400" />
                </div>
              )}
              <div className={msg.role === 'user' ? 'bg-gold-500/20 border border-gold-500/30 text-gray-100 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]' : 'bg-navy-800 border border-navy-700 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]'}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.role === 'ai' && (
                    <button onClick={() => speakText(msg.text)} className="text-gray-500 hover:text-gold-400 flex-shrink-0 mt-1">
                      <Volume size={14} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">{msg.time}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={16} className="text-gray-300" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* TTS Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center gap-2 text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 rounded-lg p-3">
          <Volume2 size={14} className="animate-pulse" />
          <span>Speaking AI response... </span>
          <button onClick={stopSpeaking} className="text-red-400 hover:text-red-300 underline ml-1">Stop</button>
        </div>
      )}

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
