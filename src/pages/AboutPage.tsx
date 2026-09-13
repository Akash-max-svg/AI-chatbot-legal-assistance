import {
  Scale,
  Shield,
  BookOpen,
  Users,
  Mail,
  ExternalLink,
  Code2,
  Database,
  Server,
  Brain,
  Target,
  Eye,
  Lightbulb,
  FileCode2,
  Search,
  Cpu,
} from 'lucide-react';

const objectives = [
  {
    icon: Target,
    title: "Primary Objective",
    desc: "Develop an AI-powered Legal Assistant using Large Language Models, Conversational AI, Retrieval-Augmented Generation (RAG), and Semantic Search to support the Indian Digital Judiciary.",
  },
  {
    icon: Eye,
    title: "Project Scope",
    desc: "Provide intelligent legal research, judgment summarization, case search, multilingual legal assistance, document generation, and judicial analytics for Citizens, Lawyers, Judges, and Administrators.",
  },
  {
    icon: Lightbulb,
    title: "Expected Outcome",
    desc: "Improve access to justice, reduce legal research time, and demonstrate the practical application of Generative AI in the Indian E-Court ecosystem.",
  },
];
const techStack = [
  {
    icon: Code2,
    title: "React + TypeScript",
    desc: "Modern component-based frontend developed using React and TypeScript for building scalable, secure, and responsive legal web applications.",
  },
  {
    icon: FileCode2,
    title: "Tailwind CSS + Vite",
    desc: "Professional dark-themed responsive UI built with Tailwind CSS and Vite for high performance, fast development, and optimized production builds.",
  },
  {
    icon: Server,
    title: "Node.js + Express.js",
    desc: "Robust RESTful backend architecture handling authentication, legal research, AI services, case management, document generation, and business logic.",
  },
  {
    icon: Database,
    title: "MongoDB Atlas",
    desc: "Cloud-hosted NoSQL database storing users, legal documents, case records, knowledge base, AI logs, and optimized indexes for enterprise-scale retrieval.",
  },
  {
    icon: Shield,
    title: "JWT Authentication",
    desc: "Secure authentication and role-based authorization supporting Citizens, Lawyers, Judges, and Administrators with protected API endpoints.",
  },
  {
    icon: Brain,
    title: "Google Gemini AI",
    desc: "Large Language Model powering conversational legal assistance, legal reasoning, judgment summarization, document generation, and intelligent legal guidance.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    desc: "AI-powered semantic retrieval enables users to discover relevant legal information based on meaning rather than simple keyword matching.",
  },
  {
    icon: Database,
    title: "Retrieval-Augmented Generation (RAG)",
    desc: "Combines verified legal knowledge with Google Gemini AI to generate accurate, context-aware, and trustworthy legal responses.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    desc: "Comprehensive legal repository supporting Constitution of India, BNS, BNSS, BSA, Supreme Court judgments, Acts, Rules, Notifications, and legal references.",
  },
  {
    icon: Scale,
    title: "Legal Analytics",
    desc: "Advanced legal research tools including judgment summarization, legal document generation, case search, citation retrieval, and judicial analytics.",
  },
  {
    icon: Cpu,
    title: "Vector Embeddings",
    desc: "Vector-ready architecture designed for large-scale semantic indexing and intelligent retrieval across more than 100,000 legal documents.",
  },
  {
    icon: Mail,
    title: "External Services & APIs",
    desc: "Integrated with REST APIs, Google Translate, Speech Recognition, PDF generation, and multilingual legal assistance services.",
  },
];
{
  /* Project Statistics */
}
<div>
  <h2 className="section-heading mb-6">Project Statistics</h2>

  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <div className="card-gold text-center">
      <h3 className="text-3xl font-bold text-gold-400">100K+</h3>
      <p className="text-sm text-gray-300 mt-2">Legal Documents Ready</p>
    </div>

    <div className="card-gold text-center">
      <h3 className="text-3xl font-bold text-gold-400">12+</h3>
      <p className="text-sm text-gray-300 mt-2">AI Modules</p>
    </div>

    <div className="card-gold text-center">
      <h3 className="text-3xl font-bold text-gold-400">9+</h3>
      <p className="text-sm text-gray-300 mt-2">Legal Resources</p>
    </div>

    <div className="card-gold text-center">
      <h3 className="text-3xl font-bold text-gold-400">4</h3>
      <p className="text-sm text-gray-300 mt-2">User Roles</p>
    </div>
  </div>
</div>;

const team = [
  {
    name: "Dr. Usha Rani",
    role: "Project Guide",
    specialty:
      " HOD of CSE Department",
  },
  {
    name: "Manyam Jagadeeswari",
    role: "Team Lead",
    specialty: "Full Stack Development, AI Integration & Project Coordination",
  },
  {
    name: "M.Akash",
    role: "Backend & API Developer",
    specialty: "Node.js, Express.js & REST API Development",
  },
  {
    name: "L. L. V. Parameswari",
    role: "Database & Knowledge Base Developer",
    specialty: "MongoDB Atlas, Data Management & Knowledge Base",
  },
  {
    name: "K. Yohan",
    role: "Testing & Documentation",
    specialty: "System Testing, Validation & Technical Documentation",
  },
];

const partners = [
  "Supreme Court of India",
  "e-Courts Mission Mode Project",
  "National Judicial Data Grid",
  "India Code",
  "National Legal Services Authority (NALSA)",
  "Constitution of India",
  "Bharatiya Nyaya Sanhita (BNS)",
  "Bharatiya Nagarik Suraksha Sanhita (BNSS)",
  "Bharatiya Sakshya Adhiniyam (BSA)",
];

export default function AboutPage() {
  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-12">
      <div>
        <h1 className="section-heading">About</h1>
        <p className="text-gray-400 text-sm mt-1">
          Advancing Digital Judiciary in India: A Hybrid Framework Leveraging
          Large Language Models and Conversational Intelligence for E-Court
          System
        </p>
      </div>

      {/* Project Overview */}
      <div className="card-gold flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-gold-500/20">
          <Scale size={28} className="text-navy-950" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-semibold text-gray-100 mb-3">
            Project Overview
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              <strong>
                Advancing Digital Judiciary in India: A Hybrid Framework
                Leveraging Large Language Models and Conversational Intelligence
                for E-Court System
              </strong>{" "}
              This  is an AI-powered legal assistance platform developed to modernize
              legal research and judicial support in India. The system
              integrates conversational AI, Retrieval-Augmented Generation
              (RAG), Semantic Search, and intelligent legal analytics to provide
              fast, accurate, and context-aware legal assistance for Citizens,
              Lawyers, Judges, and Administrators.
            </p>
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            The platform is developed using React, TypeScript, Tailwind CSS,
            Vite, Node.js, Express.js and MongoDB Atlas. It integrates Google
            Gemini AI, Retrieval-Augmented Generation (RAG), Semantic Search and
            Vector Embeddings to provide intelligent legal assistance, case
            research, judgment summarization, multilingual translation, voice
            interaction, document generation and legal analytics. The system is
            designed as a modern AI-powered digital judicial platform capable of
            supporting large volumes of Indian legal documents while providing
            fast, accurate and context-aware legal information.
          </p>
        </div>
      </div>

      {/* Project Objectives */}
      <div>
        <h2 className="section-heading mb-6">Project Objectives</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {objectives.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-gold">
              <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center text-gold-400 mb-3">
                <Icon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-gray-200 mb-2">
                {title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div>
        <h2 className="section-heading mb-6">Technology Stack</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {techStack.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-gold">
              <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center text-gold-400 mb-3">
                <Icon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-gray-200 mb-1.5">
                {title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        <h2 className="section-heading mb-6">Research Team</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((m) => (
            <div key={m.name} className="card text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy-700 to-navy-600 flex items-center justify-center mx-auto mb-3 text-gold-400 text-lg font-serif font-bold">
                {m.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <h3 className="text-sm font-semibold text-gray-200">{m.name}</h3>
              <p className="text-xs text-gold-500 mt-0.5">{m.role}</p>
              <p className="text-xs text-gray-500 mt-1">{m.specialty}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partners */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <Users size={18} className="text-gold-500" /> Integrated With
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {partners.map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/50 hover:bg-navy-800 transition-colors"
            >
              <ExternalLink size={14} className="text-gold-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer & Contact */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
            <Shield size={14} /> Disclaimer
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            This AI Legal Assistant has been developed for educational, academic
            research, and legal information purposes. Responses are generated
            using Google Gemini AI together with Retrieval-Augmented Generation
            (RAG) from verified Indian legal resources. The platform assists
            legal research and judicial analytics but should not replace
            professional legal advice or official judicial interpretation.
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
            <Mail size={14} className="text-gold-500" /> Contact
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            For research collaboration, data access, or technical inquiries
            regarding the LLM and AI chatbot integration.
          </p>
          <p className="text-xs text-gold-400">
            Dr. Usha Rani Project Guide Department of Computer Science &
            Engineering Vignan's Lara Institute of Technology & Science
          </p>
        </div>
      </div>
    </div>
  );
}
