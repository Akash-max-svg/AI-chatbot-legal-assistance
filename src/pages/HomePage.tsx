import { Link } from 'react-router-dom';
import {
  Scale,
  MessageSquare,
  Search,
  FileText,
  LayoutDashboard,
  ArrowRight,
  Shield,
  BookOpen,
  Gavel,
  Landmark,
  Brain,
  Cpu,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Legal Chatbot',
    desc: 'AI-powered assistant for Indian legal queries, case law references, and procedural guidance across all courts.',
    to: '/chatbot',
    gradient: 'from-gold-400 to-gold-600',
  },
  {
    icon: Search,
    title: 'Case Search',
    desc: 'Search across Indian court databases — Supreme Court, High Courts, and District Courts with real-time status.',
    to: '/search',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    icon: FileText,
    title: 'Judgment Summarizer',
    desc: 'Upload judgments and get concise, structured summaries with key holdings, reasoning, and citations.',
    to: '/summarizer',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'Track case statistics, recent judgments, and legal trends across the Indian E-Courts ecosystem.',
    to: '/dashboard',
    gradient: 'from-cyan-400 to-cyan-600',
  },
];

const highlights = [
  { icon: Shield, label: 'Verified Legal Data' },
  { icon: BookOpen, label: '1M+ Judgments Indexed' },
  { icon: Gavel, label: 'All Major Courts' },
  { icon: Landmark, label: 'Constitution Compliant' },
];

const techStack = [
  { icon: Brain, label: 'Large Language Models' },
  { icon: Cpu, label: 'AI Chatbot Engine' },
  { icon: FileText, label: 'NLP Summarization' },
  { icon: Search, label: 'Semantic Search' },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-500 rounded-full blur-[128px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a017' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12 pt-24 pb-16 w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-8 shadow-lg shadow-gold-500/25 animate-float">
              <Scale size={32} className="text-navy-950" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-50 leading-tight mb-6">
              Advancing Digital Judiciary in India:
              <br />
              <span className="text-gradient-gold">
                A Hybrid Framework Leveraging Large Language Models and
                Conversational Intelligence for E-Court System
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
              Harnessing Large Language Models and AI-powered chatbots to
              transform India's E-Courts — enabling smarter case search, legal
              guidance, and judgment analysis across the judicial system.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                to="/chatbot"
                className="btn-primary text-base flex items-center gap-2"
              >
                Start Legal Query <ArrowRight size={18} />
              </Link>
              <Link to="/dashboard" className="btn-secondary text-base">
                Explore Dashboard
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {highlights.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm text-gray-400"
                >
                  <Icon size={16} className="text-gold-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Project Description */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-20">
        <div className="card-gold flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-gold-500/20">
            <Brain size={24} className="text-navy-950" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-semibold text-gray-100 mb-3">
              About This Project
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              This research project investigates the application of Large
              Language Models (LLMs) and AI chatbots within the Indian legal
              system and E-Courts framework. It explores how natural language
              processing can assist legal professionals, judges, and citizens in
              navigating the complexities of Indian jurisprudence — from case
              law retrieval and statutory interpretation to judgment
              summarization and procedural guidance.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              The platform integrates with the e-Courts Mission Mode Project,
              National Judicial Data Grid, and verified legal databases to
              provide accurate, real-time legal assistance while maintaining the
              highest standards of data privacy and judicial integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-3">Platform Features</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Four AI-powered tools designed for the Indian legal ecosystem.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc, to, gradient }) => (
            <Link
              key={to}
              to={to}
              className="card-gold group flex flex-col gap-4 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
              >
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-1 group-hover:text-gold-400 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
              <span className="text-gold-500 text-sm font-medium flex items-center gap-1 mt-auto">
                Explore{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        <div className="card bg-gradient-to-br from-navy-900 to-navy-800">
          <h2 className="section-heading text-center mb-8">Core Technology</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {techStack.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="w-14 h-14 rounded-xl bg-navy-800 border border-navy-600/50 flex items-center justify-center text-gold-400">
                  <Icon size={24} />
                </div>
                <span className="text-sm text-gray-300 font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        <div className="card-gold text-center py-12 px-8 bg-gradient-to-br from-navy-900 to-navy-800">
          <h2 className="section-heading mb-3">Ready to Get Started?</h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Access comprehensive Indian legal data and AI assistance in one
            platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/chatbot"
              className="btn-primary text-base inline-flex items-center gap-2"
            >
              Try the Chatbot <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="btn-secondary text-base">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-8">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Scale size={16} className="text-gold-600" />
            <span>AI Legal Assistant for Indian E-Courts</span>
          </div>
          <p className="text-xs text-gray-600">
            For legal research purposes only. Not a substitute for professional
            legal advice.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
