import { useState } from 'react';
import {
  Search, Loader2, AlertCircle, Download, Copy, Check,
  FileText, Sparkles, Brain, Globe,
} from 'lucide-react';
import { runLegalResearch } from '../services/legalResearchService';
import { useLanguage } from '../context/LanguageContext';
import { languageService } from '../services/languageService';
import Recommendations from '../components/Recommendations';
import { generateLegalPDF } from '../utils/pdfExport';

const sampleQueries = [
  'What laws apply to online financial fraud in India?',
  'What cases are similar to a disputed ancestral property partition?',
  'Explain the Right to Information Act, 2005 and its key provisions.',
  'What documents are required to file for mutual consent divorce?',
  'Explain the doctrine of basic structure in Indian constitutional law.',
  'What is the procedure for filing a Public Interest Litigation?',
];

export default function LegalResearchPage() {
  const { languages, currentLanguage, setCurrentLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const runResearch = async (q?: string) => {
    const question = (q || query).trim();
    if (!question) {
      setError('Please enter a research question.');
      return;
    }
    setError('');
    setLoading(true);
    setReport(null);
    if (q) setQuery(q);
    try {
      const result = await runLegalResearch(question, currentLanguage);
      setReport(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate research report.');
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (!report) return;
    const text = `# Legal Research Report\n\n## Summary\n${report.summary}\n\n## Applicable Laws\n${(report.applicableLaws || []).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    if (!report) return;
    generateLegalPDF({
      title: 'Legal Research Report',
      subtitle: 'AI Legal Research — Powered by Gemini',
      meta: [
        { label: 'Question', value: query },
        { label: 'Language', value: languageService.getLabel(currentLanguage) },
        { label: 'Generated', value: new Date().toLocaleString() },
      ],
      sections: [
        { heading: 'Summary', body: report.summary || '' },
        ...(report.applicableLaws?.length ? [{ heading: 'Applicable Laws', body: report.applicableLaws.join('\n') }] : []),
        ...(report.statutoryProvisions?.length ? [{ heading: 'Statutory Provisions', body: report.statutoryProvisions.join('\n') }] : []),
      ],
      footer: report.disclaimer || 'AI-generated legal research for research purposes only. Not legal advice.',
    });
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <Brain size={24} className="text-gold-500" /> AI Legal Research
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Ask Gemini AI to conduct detailed Indian legal research — applicable laws, similar cases, statutory provisions, and practical guidance.
        </p>
      </div>

      {/* Query Input */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runResearch()}
              placeholder="e.g. What laws apply to online fraud? What cases are similar to a property dispute?"
              className="input-field w-full pl-10"
            />
          </div>
          <div className="relative">
            <select value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)} className="input-field pr-8 appearance-none cursor-pointer">
              {languages.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
            </select>
            <Globe size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <button onClick={() => runResearch()} disabled={loading || !query.trim()} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Researching...' : 'Research'}
          </button>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Sample research questions</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => runResearch(q)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-navy-800 text-gray-300 hover:bg-gold-500/20 hover:text-gold-300 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full border-4 border-gold-500/30 border-t-gold-400 animate-spin mb-4" />
          <h3 className="text-base font-semibold text-gray-200 mb-1">Gemini is conducting legal research</h3>
          <p className="text-sm text-gray-400">Analyzing statutes, case law, and procedural aspects...</p>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card border-gold-500/20">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check size={16} className="text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-100">Research Report Ready</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyReport} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={downloadReport} className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
            <div className="bg-navy-800/50 rounded-lg p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><FileText size={10} /> Executive Summary</p>
              <p className="text-sm text-gray-200 leading-relaxed">{report.summary}</p>
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations && (
            <Recommendations data={report.recommendations} onTopicClick={(t) => setQuery(t)} />
          )}

          {/* Disclaimer */}
          {report.disclaimer && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">{report.disclaimer}</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && !error && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/20">
            <Brain size={28} className="text-navy-950" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">AI-Powered Legal Research</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Ask "What laws apply?", "What cases are similar?", "Explain this Act.", or "What documents are required?" — Gemini will generate a detailed research report.
          </p>
        </div>
      )}
    </div>
  );
}
