import { useState } from 'react';
import {
  Brain, Search, Filter, ChevronDown, ChevronUp,
  Copy, Check, Sparkles, Scale, Calendar,
} from 'lucide-react';

const summaries = [
  {
    id: 'AI-SUM-001',
    caseId: 'CIV/2023/445',
    title: 'Verma vs. Verma — Property Division',
    type: 'Civil',
    date: '2024-07-18',
    confidence: 92,
    keyPoints: [
      'Ancestral property under Hindu Succession Act 1956 must be divided equally among Class I heirs.',
      'The Will produced by the eldest son has procedural irregularities — lacks attestation by two witnesses.',
      'Prescription period of 12 years under Limitation Act has not lapsed.',
      'Interim injunction on property sale should be maintained till final judgment.',
    ],
    summary: 'This case involves a dispute over ancestral property inherited from the late Ramesh Verma. Based on established jurisprudence under the Hindu Succession Act and Supreme Court precedents including Prakash vs. Phulavati (2016), equal division among all four siblings is warranted. The Will presented by Suresh Verma lacks attestation as required under Section 63 of the Indian Succession Act, rendering it legally deficient.',
    recommendation: 'Award equal shares (25% each) to all four heirs. Declare the Will void ab initio. Partition the property by metes and bounds.',
    precedents: ['Prakash vs. Phulavati (2016)', 'Danamma vs. Amar (2018)', 'Vineeta Sharma vs. Rakesh Sharma (2020)'],
  },
  {
    id: 'AI-SUM-002',
    caseId: 'CRM/2023/789',
    title: 'State vs. Pandey — Bank Fraud',
    type: 'Criminal',
    date: '2024-07-15',
    confidence: 87,
    keyPoints: [
      'Prima facie evidence of forged cheques under Section 420 and 467 IPC established.',
      'Accused has prior conviction for similar offence in 2019.',
      'Digital forensic evidence from bank servers is admissible under Section 65B Evidence Act.',
      'Prosecution has established mens rea beyond reasonable doubt.',
    ],
    summary: 'This criminal case involves alleged bank fraud of ₹2.4 Crore committed through forged cheques and fraudulent NEFT transfers over 14 months. The prosecution has presented strong digital forensic evidence corroborated by bank statements and CCTV footage. The accused\'s counsel has argued procedural irregularities in evidence collection, which the court finds insufficient to exclude evidence under Section 65B Certificate.',
    recommendation: 'Conviction under Section 420, 467, and 471 IPC is justified. Sentencing should consider the prior criminal record and the magnitude of the financial crime.',
    precedents: ['Anvar P.V. vs. P.K. Basheer (2014)', 'Arjun Panditrao vs. Kailash Kushare (2020)', 'Sonu @ Amar vs. State of Haryana (2017)'],
  },
  {
    id: 'AI-SUM-003',
    caseId: 'WP/2024/102',
    title: 'Environmental Writ — Yamuna Pollution',
    type: 'Writ Petition',
    date: '2024-07-10',
    confidence: 95,
    keyPoints: [
      'Right to clean environment is a Fundamental Right under Article 21.',
      'Polluter Pays Principle firmly established in Indian constitutional jurisprudence.',
      'CPCB reports confirm effluent levels 40x above permissible limits.',
      'Three industries continued operations despite prior show-cause notices.',
    ],
    summary: 'This PIL seeks immediate closure of five industrial units discharging untreated effluents into River Yamuna. The CPCB report is unequivocal about the severity and direct link to respondent industries. The Supreme Court\'s Green Bench has consistently held that environmental protection cannot be compromised for commercial interests.',
    recommendation: 'Issue immediate closure notice to non-compliant units. Direct CPCB monitoring for 90 days. Impose environmental compensation per NGT guidelines.',
    precedents: ['M.C. Mehta vs. Union of India (1987)', 'Vellore Citizens Forum vs. UOI (1996)', 'Indian Council for Enviro Legal Action vs. UOI (1996)'],
  },
];

const types = ['All', 'Civil', 'Criminal', 'Writ Petition', 'Family', 'Labour'];

export default function AIJudgmentSummariesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>('AI-SUM-001');
  const [copied, setCopied] = useState('');

  const filtered = summaries.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.caseId.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'All' || s.type === filter);
  });

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <Brain size={24} className="text-gold-500" /> AI Judgment Summaries
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          AI-generated case summaries and recommendations to assist judgment preparation
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-500/5 border border-gold-500/20">
        <Sparkles size={16} className="text-gold-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          These summaries are generated by Gemini AI to assist judicial decision-making. They are advisory only and do not replace judicial discretion.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID or title..."
            className="input-field w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500 flex-shrink-0" />
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === t
                  ? 'bg-gold-500 text-navy-950'
                  : 'bg-navy-800 text-gray-400 border border-navy-700 hover:text-gold-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((s) => (
          <div key={s.id} className="card p-0 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-navy-800/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-xs font-mono text-gold-400">{s.caseId}</span>
                  <span className="text-[10px] text-gray-500 bg-navy-800 border border-navy-700 px-2 py-0.5 rounded-full">
                    {s.type}
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Sparkles size={9} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">{s.confidence}% Confidence</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-100">{s.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar size={10} className="text-gray-600" />
                  <span className="text-[10px] text-gray-500">
                    Generated{' '}
                    {new Date(s.date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              {expanded === s.id ? (
                <ChevronUp size={16} className="text-gold-400 flex-shrink-0 mt-1" />
              ) : (
                <ChevronDown size={16} className="text-gray-500 flex-shrink-0 mt-1" />
              )}
            </button>

            {expanded === s.id && (
              <div className="border-t border-navy-700/50 p-5 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">Key Legal Points</h4>
                  <ul className="space-y-2">
                    {s.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                        <span className="w-5 h-5 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-[10px] font-bold text-gold-400 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-2">AI Analysis</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.summary}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Brain size={12} /> AI Recommendation
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{s.recommendation}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Scale size={12} /> Cited Precedents
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {s.precedents.map((p, i) => (
                      <span key={i} className="text-[11px] px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-gray-400">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-navy-700/40">
                  <button
                    onClick={() => copyText(`${s.title}\n\nAnalysis:\n${s.summary}\n\nRecommendation:\n${s.recommendation}`, s.id)}
                    className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                  >
                    {copied === s.id ? <Check size={13} /> : <Copy size={13} />}
                    {copied === s.id ? 'Copied!' : 'Copy Summary'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Brain size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No summaries found</p>
          </div>
        )}
      </div>
    </div>
  );
}
