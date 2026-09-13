import { useEffect, useRef } from 'react';
import { User, Code2, Server, Brain, Database, Layers, ArrowDown, Shield, Zap, Globe, Cpu, Rss, HardDrive, FileSearch, Box } from 'lucide-react';

const flowSteps = [
  {
    icon: User,
    title: 'Citizen / Lawyer / Judge',
    desc: 'End users access the platform via web browser or mobile device. Role-based access controls (Citizen, Lawyer, Judge) ensure tailored functionality.',
    color: 'from-blue-400 to-blue-600',
  },
  {
    icon: Code2,
    title: 'React Frontend',
    desc: 'Modern SPA with React 18 + TypeScript + Tailwind CSS. Vite build tooling. Handles routing, auth context, state management, responsive UI, and protected routes.',
    color: 'from-cyan-400 to-cyan-600',
  },
  {
    icon: Server,
    title: 'Express.js Backend',
    desc: 'Node.js REST API with JWT authentication. Routes: /api/chat, /api/summarize, /api/cases, /api/documents. Orchestrates AI calls, database queries, and file processing.',
    color: 'from-emerald-400 to-emerald-600',
  },
  {
    icon: Brain,
    title: 'Gemini API',
    desc: 'Google Gemini large language model. Generates contextual legal responses, judgment summaries, structured legal analysis, and document drafting. Prepared for fine-tuning on Indian legal corpus.',
    color: 'from-purple-400 to-purple-600',
  },
  {
    icon: Layers,
    title: 'RAG Engine',
    desc: 'Retrieval-Augmented Generation. Vector database for semantic search. Chunks legal documents, embeddings via Gemini. Retrieves relevant context before generating responses. Architecture-ready for future integration.',
    color: 'from-rose-400 to-rose-600',
  },
  {
    icon: FileSearch,
    title: 'Legal Knowledge Base',
    desc: 'Structured legal database: Constitution Articles, Acts (BNS, BNSS, CPA, DPDP, IT Act), Court Judgments, Case Law, Templates, FAQs. Prepared for semantic search and RAG indexing.',
    color: 'from-amber-400 to-amber-600',
  },
  {
    icon: HardDrive,
    title: 'MongoDB',
    desc: 'NoSQL database with Mongoose ODM. Stores: user profiles, chat sessions, notifications, case records, user cases, generated documents, activity logs. Schema validation and indexes.',
    color: 'from-teal-400 to-teal-600',
  },
  {
    icon: Zap,
    title: 'AI Response',
    desc: 'Structured legal output: Issue, Applicable Act, Section, Case Law, Required Documents, Court Jurisdiction, Procedure, Timeline, Government Links, Disclaimer.',
    color: 'from-gold-400 to-gold-600',
  },
];

const techDetails = [
  { icon: Code2, label: 'React 18', value: 'Frontend', desc: 'Hooks, Context API, React Router v7, Tailwind CSS, Vite' },
  { icon: Server, label: 'Express.js', value: 'Backend API', desc: 'Node.js REST API, JWT auth, file upload handling, AI orchestration' },
  { icon: Brain, label: 'Gemini API', value: 'LLM Engine', desc: 'Google Gemini Pro for legal NLP, summarization, and drafting' },
  { icon: Layers, label: 'RAG Engine', value: 'Future Ready', desc: 'Vector DB + Semantic Search + Embeddings for legal documents' },
  { icon: Database, label: 'MongoDB', value: 'Database', desc: 'NoSQL database, Mongoose ODM, Schema validation, Indexes' },
  { icon: Shield, label: 'JWT Auth', value: 'Security', desc: 'Token-based auth with role-based access control (Citizen, Lawyer, Judge)' },
  { icon: Globe, label: 'REST API', value: 'Communication', desc: 'JSON API between frontend and backend with CORS' },
  { icon: Rss, label: 'Express.js', value: 'Backend', desc: 'Node.js REST API with JWT auth, middleware, route handlers' },
];

const futureFeatures = [
  { icon: Box, label: 'Vector Database', desc: 'Pinecone/Weaviate for legal document embeddings and semantic search' },
  { icon: FileSearch, label: 'OCR Pipeline', desc: 'Extract text from scanned court documents and judgments' },
  { icon: Rss, label: 'Court API Integration', desc: 'Connect with e-Courts API, NJDG, and case tracking systems' },
  { icon: Globe, label: 'Semantic Search', desc: 'Natural language query across legal documents with AI relevance scoring' },
];

export default function ArchitecturePage() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6');
          }
        });
      },
      { threshold: 0.15 }
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="section-heading">System Architecture</h1>
        <p className="text-gray-400 text-sm mt-2 max-w-2xl mx-auto">
          End-to-end architecture of the AI Legal Assistant for Indian E-Courts — AI-powered legal platform with RAG, LLM, and secure data management.
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 via-purple-500/30 via-rose-500/30 via-amber-500/30 via-teal-500/30 to-gold-500/30 hidden lg:block" />

        <div className="space-y-6">
          {flowSteps.map((step, idx) => {
            const Icon = step.icon;
            const isLeft = idx % 2 === 0;
            return (
              <div key={step.title}>
                <div
                  ref={(el) => { stepRefs.current[idx] = el; }}
                  className={`relative flex items-center gap-6 opacity-0 translate-y-6 transition-all duration-700 ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                  style={{ transitionDelay: `${idx * 120}ms` }}
                >
                  <div className={`flex-1 ${isLeft ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className="card-gold group hover:-translate-y-1">
                      <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'lg:flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">{step.title}</h3>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex w-10 h-10 rounded-full bg-navy-900 border-2 border-gold-500/50 items-center justify-center z-10 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-gold-400 animate-pulse" />
                  </div>
                  <div className="flex-1 hidden lg:block" />
                </div>
                {idx < flowSteps.length - 1 && (
                  <div className="flex justify-center py-2 lg:py-0">
                    <ArrowDown size={20} className="text-gold-500/40 lg:hidden" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Stack Grid */}
      <div>
        <h2 className="section-heading text-center mb-8">Technology Stack</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {techDetails.map((tech) => {
            const Icon = tech.icon;
            return (
              <div key={tech.label} className="card-gold">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center">
                    <Icon size={18} className="text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">{tech.label}</h3>
                    <p className="text-xs text-gold-500">{tech.value}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{tech.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Future Ready */}
      <div className="card bg-gradient-to-br from-navy-900 to-navy-800">
        <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-gold-500" /> Future-Ready Architecture
        </h2>
        <p className="text-sm text-gray-400 mb-6">The platform is architected for future enhancements without breaking existing functionality:</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {futureFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-navy-800/50">
                <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-gold-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">{f.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Flow Summary */}
      <div className="card bg-gradient-to-br from-navy-900 to-navy-800">
        <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-gold-500" /> Data Flow Summary
        </h2>
        <div className="space-y-3">
          {[
            { num: '1', color: 'bg-blue-500/20 text-blue-400', text: 'User (Citizen/Lawyer/Judge) submits a legal query via chat, voice, case filing, or case search.' },
            { num: '2', color: 'bg-cyan-500/20 text-cyan-400', text: 'React frontend validates input, checks JWT auth, and sends a POST request to the Flask backend API.' },
            { num: '3', color: 'bg-emerald-500/20 text-emerald-400', text: 'Express.js backend queries the MongoDB database for structured data and user context.' },
            { num: '4', color: 'bg-purple-500/20 text-purple-400', text: 'For complex queries, the backend forwards to the Gemini API with structured prompts including legal context.' },
            { num: '5', color: 'bg-rose-500/20 text-rose-400', text: 'RAG Engine (future-ready) retrieves relevant legal documents from the Vector Database for contextual grounding.' },
            { num: '6', color: 'bg-amber-500/20 text-amber-400', text: 'Legal Knowledge Base provides acts, sections, judgments, and case law as retrieval sources.' },
            { num: '7', color: 'bg-teal-500/20 text-teal-400', text: 'Gemini LLM generates structured AI response with citations, legal references, and procedural guidance.' },
            { num: '8', color: 'bg-gold-500/20 text-gold-400', text: 'Response enriched with metadata, saved to MongoDB chat history, and returned to the React frontend.' },
          ].map((item) => (
            <div key={item.num} className="flex items-center gap-3 text-sm text-gray-300">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${item.color}`}>{item.num}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
