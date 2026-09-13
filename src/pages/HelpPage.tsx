import { useState } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, FilePlus, MessageSquare,
  BookOpen, Mic, Phone, Mail, Send, Check, Search,
} from 'lucide-react';

const faqs = [
  {
    q: 'What is the AI Legal Assistant?',
    a: 'It is an AI-powered platform that helps citizens, lawyers, and judges navigate the Indian legal system. It uses Google Gemini AI to answer legal questions, summarize judgments, and assist in case filing.',
  },
  {
    q: 'Is the AI advice legally binding?',
    a: 'No. The AI provides general legal information and guidance only. It is not a substitute for professional legal advice from a qualified advocate. Always consult a licensed lawyer for serious legal matters.',
  },
  {
    q: 'Which courts and jurisdictions are covered?',
    a: 'The platform covers the Supreme Court of India, High Courts, District Courts, Consumer Forums, and various tribunals operating under the Indian E-Courts framework.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted at rest and in transit. We comply with Indian data protection regulations and do not share your information with third parties without consent.',
  },
  {
    q: 'Can I use this in regional languages?',
    a: 'Yes. The platform supports 10+ Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, and Malayalam.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Click the "Forgot Password" link on the login page. Enter your registered email address and you will receive a password reset link within a few minutes.',
  },
];

const guides = [
  {
    icon: FilePlus,
    title: 'How to File a Case',
    steps: [
      'Navigate to Case Filing from the sidebar.',
      'Select the type of case (Criminal, Civil, Consumer, etc.).',
      'Fill in the petitioner and respondent details.',
      'Describe the matter and attach supporting documents.',
      'Review the AI-generated draft and submit.',
    ],
  },
  {
    icon: MessageSquare,
    title: 'How AI Chatbot Works',
    steps: [
      'Click AI Chatbot in the navigation menu.',
      'Type your legal question in plain language or Hindi.',
      'Gemini AI processes your query against Indian law databases.',
      'Receive a detailed, citation-supported answer.',
      'Follow up with additional questions in the same session.',
    ],
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base Guide',
    steps: [
      'Navigate to Knowledge Base from the menu.',
      'Browse or search by category (Acts, Articles, IPC, CrPC, etc.).',
      'Click on any entry to read the full legal text.',
      'Use the AI Summary feature to get simplified explanations.',
      'Bookmark important entries for quick reference.',
    ],
  },
  {
    icon: Mic,
    title: 'Voice Assistant Guide',
    steps: [
      'Go to Voice Assistant from the navigation.',
      'Click the microphone button and allow browser access.',
      'Speak your legal question clearly in English or Hindi.',
      'The AI will transcribe and answer your query.',
      'View the text response and listen to the AI voice reply.',
    ],
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  const submitFeedback = () => {
    if (!feedbackName || !feedbackEmail || !feedbackMessage) return;
    setFeedbackSent(true);
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <HelpCircle size={24} className="text-gold-500" /> Help Center
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Find answers, guides, and support for the AI Legal Assistant
        </p>
      </div>

      {/* FAQ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <HelpCircle size={18} className="text-gold-500" /> Frequently Asked Questions
          </h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="input-field pl-8 text-sm py-2 w-64"
            />
          </div>
        </div>
        <div className="space-y-2">
          {filteredFaqs.map((faq, i) => (
            <div key={i} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-navy-800/30 transition-colors"
              >
                <span className="text-sm font-medium text-gray-200">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp size={16} className="text-gold-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 border-t border-navy-700/50">
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-6">No matching FAQs found.</p>
          )}
        </div>
      </section>

      {/* Guides */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-100">Step-by-Step Guides</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {guides.map((guide, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <guide.icon size={18} className="text-gold-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-100">{guide.title}</h3>
              </div>
              <ol className="space-y-2">
                {guide.steps.map((step, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-xs text-gray-400">
                    <span className="w-5 h-5 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-[10px] font-bold text-gold-400 flex-shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-100">Contact Support</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card flex items-center gap-4 hover:border-gold-600/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Mail size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200 group-hover:text-gold-400 transition-colors">
                Email Support
              </p>
              <p className="text-xs text-gray-500 mt-0.5">support@ailegalassistant.in</p>
              <p className="text-[10px] text-gray-600 mt-1">Response within 24 hours</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Phone size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Phone Support</p>
              <p className="text-xs text-gray-500 mt-0.5">1800-XXX-XXXX (Toll Free)</p>
              <p className="text-[10px] text-gray-600 mt-1">Mon – Sat, 9 AM – 6 PM IST</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Send size={18} className="text-gold-500" /> Send Feedback
        </h2>
        {feedbackSent ? (
          <div className="card text-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-emerald-400" />
            </div>
            <p className="text-gray-200 font-semibold">Thank you for your feedback!</p>
            <p className="text-gray-500 text-sm mt-1">We will review it and get back to you if needed.</p>
          </div>
        ) : (
          <div className="card space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Name</label>
                <input
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                <input
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  type="email"
                  className="input-field w-full"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Message</label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                rows={4}
                className="input-field w-full resize-none"
                placeholder="Describe your issue or suggestion..."
              />
            </div>
            <button
              onClick={submitFeedback}
              disabled={!feedbackName || !feedbackEmail || !feedbackMessage}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} /> Submit Feedback
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
