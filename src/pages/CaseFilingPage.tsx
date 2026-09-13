import { useState } from 'react';
import {
  FilePlus, Send, Bot, Scale, AlertCircle, Loader2, ChevronDown,
  Download, Check, FileText, Gavel, BookOpen,
  Building2, ClipboardList, FileCheck, Clock, Globe, Copy,
  Shield, ListChecks, MessageSquare, Coins, Route, Layers,
} from 'lucide-react';
import { caseFilingService } from '../services/caseFilingService';
import { useLanguage } from '../context/LanguageContext';
import { generateLegalPDF, downloadTextFile } from '../utils/pdfExport';
import Recommendations from '../components/Recommendations';

const categories = [
  'Consumer', 'Cyber Crime', 'Women Protection', 'Property', 'Family', 'Criminal',
  'Civil', 'Labour', 'Employment', 'RTI', 'Traffic', 'Senior Citizen',
  'Banking', 'Insurance', 'Education', 'Medical Negligence', 'Tenant Issues',
  'Environment',
];

export default function CaseFilingPage() {
  const { languages, currentLanguage, setCurrentLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Consumer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const steps = [
    { title: 'Describe Problem', icon: FilePlus },
    { title: 'AI Analysis', icon: Bot },
    { title: 'Detected Category', icon: ClipboardList },
    { title: 'Applicable Laws', icon: BookOpen },
    { title: 'Suggested Court', icon: Building2 },
    { title: 'Documents', icon: FileCheck },
    { title: 'Procedure', icon: Clock },
    { title: 'Draft', icon: FileText },
  ];

  const analyzeCase = async () => {
    if (!query.trim()) {
      setError('Please describe your legal problem');
      return;
    }
    setError('');
    setIsProcessing(true);
    setActiveStep(2);
    setResult(null);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 7 ? prev + 1 : prev));
    }, 800);

    try {
      const data = await caseFilingService.analyzeCase(query, category, currentLanguage);
      clearInterval(stepInterval);
      setActiveStep(8);
      setResult(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err?.message || 'Unable to analyze your case at the moment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadDraft = (title: string, body: string) => {
    downloadTextFile(`${title.replace(/\s+/g, '_')}.txt`, body);
  };

  const downloadDraftPDF = (title: string, body: string) => {
    generateLegalPDF({
      title,
      subtitle: 'AI Case Filing Assistant',
      meta: result ? [
        { label: 'Category', value: result.caseCategory || category },
        { label: 'Court', value: result.courtToApproach || 'N/A' },
        { label: 'Timeline', value: result.expectedTimeline || 'N/A' },
      ] : [],
      sections: [{ heading: title, body }],
      footer: result?.disclaimer || 'AI-generated draft for legal research only. Review with a qualified lawyer before filing.',
    });
  };

  const downloadFullReportPDF = () => {
    if (!result) return;
    generateLegalPDF({
      title: 'Case Filing Analysis',
      subtitle: 'AI Case Filing Assistant — Comprehensive Report',
      meta: [
        { label: 'Category', value: result.caseCategory || category },
        { label: 'Court', value: result.courtToApproach || 'N/A' },
        { label: 'Government Dept', value: result.governmentDepartment || 'N/A' },
        { label: 'Court Fees', value: result.courtFees || 'N/A' },
        { label: 'Timeline', value: result.expectedTimeline || 'N/A' },
      ],
      sections: [
        ...(result.applicableLaws?.length ? [{ heading: 'Applicable Laws', body: result.applicableLaws.join('\n') }] : []),
        ...(result.applicableActs?.length ? [{ heading: 'Applicable Acts', body: result.applicableActs.join('\n') }] : []),
        ...(result.applicableSections?.length ? [{ heading: 'Applicable Sections', body: result.applicableSections.join('\n') }] : []),
        ...(result.legalRights?.length ? [{ heading: 'Legal Rights', body: result.legalRights.join('\n') }] : []),
        ...(result.requiredDocuments?.length ? [{ heading: 'Required Documents', body: result.requiredDocuments.join('\n') }] : []),
        ...(result.evidenceRequired?.length ? [{ heading: 'Evidence Required', body: result.evidenceRequired.join('\n') }] : []),
        ...(result.filingProcedure?.length ? [{ heading: 'Filing Procedure', body: result.filingProcedure.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') }] : []),
        ...(result.alternativeRemedies?.length ? [{ heading: 'Alternative Remedies', body: result.alternativeRemedies.join('\n') }] : []),
        ...(result.mediationSuggestions ? [{ heading: 'Mediation Suggestions', body: result.mediationSuggestions }] : []),
        ...(result.checklistBeforeFiling?.length ? [{ heading: 'Checklist Before Filing', body: result.checklistBeforeFiling.map((c: string) => `[ ] ${c}`).join('\n') }] : []),
        ...(result.draftComplaint ? [{ heading: 'Draft Complaint', body: result.draftComplaint }] : []),
        ...(result.draftLegalNotice ? [{ heading: 'Draft Legal Notice', body: result.draftLegalNotice }] : []),
      ],
      footer: result.disclaimer || 'AI-generated legal information for research purposes only.',
    });
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <FilePlus size={24} className="text-gold-500" /> AI Case Filing Assistant
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Describe your legal problem and get AI-powered case analysis, applicable laws, court suggestions, and auto-generated draft documents.
        </p>
      </div>

      {/* Stepper */}
      <div className="card overflow-hidden">
        <div className="flex items-center overflow-x-auto gap-1 pb-2 px-1">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx < activeStep;
            const isCurrent = idx === activeStep - 1;
            return (
              <div key={step.title} className={`flex items-center gap-2 flex-shrink-0 px-3 py-2 rounded-lg ${isActive ? 'bg-emerald-500/10' : isCurrent ? 'bg-gold-500/10' : 'bg-navy-800/30'}`}>
                <Icon size={14} className={isActive ? 'text-emerald-400' : isCurrent ? 'text-gold-400' : 'text-gray-500'} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-400' : isCurrent ? 'text-gold-400' : 'text-gray-500'}`}>{step.title}</span>
                {isActive && <Check size={12} className="text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Section */}
      <div className="card">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Case Category</label>
            <div className="relative">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-full pr-8 appearance-none cursor-pointer">
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Language</label>
            <div className="relative">
              <select value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)} className="input-field w-full pr-8 appearance-none cursor-pointer">
                {languages.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
              </select>
              <Globe size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Action</label>
            <button
              onClick={analyzeCase}
              disabled={isProcessing}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isProcessing ? 'Analyzing...' : 'Analyze & Generate'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Describe your legal problem</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: My employer has not paid my salary for four months. What should I do?"
            rows={4}
            className="input-field w-full resize-none"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results */}
      {isProcessing && (
        <div className="card flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full border-4 border-gold-500/30 border-t-gold-400 animate-spin mb-4" />
          <h3 className="text-base font-semibold text-gray-200 mb-1">Gemini AI Analyzing your case</h3>
          <p className="text-sm text-gray-400">Detecting category, applicable laws, and generating drafts...</p>
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 flex-wrap justify-center">
            <span className={`px-2 py-1 rounded bg-navy-800 ${activeStep >= 2 ? 'text-emerald-400' : ''}`}>Detecting Category</span>
            <span className="text-gray-600">→</span>
            <span className={`px-2 py-1 rounded bg-navy-800 ${activeStep >= 3 ? 'text-emerald-400' : ''}`}>Finding Laws</span>
            <span className="text-gray-600">→</span>
            <span className={`px-2 py-1 rounded bg-navy-800 ${activeStep >= 4 ? 'text-emerald-400' : ''}`}>Suggesting Court</span>
            <span className="text-gray-600">→</span>
            <span className={`px-2 py-1 rounded bg-navy-800 ${activeStep >= 7 ? 'text-emerald-400' : ''}`}>Generating Draft</span>
          </div>
        </div>
      )}

      {result && !isProcessing && (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <div className="card border-gold-500/20">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check size={16} className="text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-100">AI Case Analysis Complete</h2>
              </div>
              <button onClick={downloadFullReportPDF} className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
                <Download size={12} /> Download Full Report (PDF)
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1"><ClipboardList size={10} /> Detected Category</p>
                <p className="text-gray-200 font-medium mt-0.5">{result.caseCategory || category}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1"><Building2 size={10} /> Suggested Court</p>
                <p className="text-gray-200 font-medium mt-0.5">{result.courtToApproach || 'N/A'}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1"><Coins size={10} /> Court Fees</p>
                <p className="text-gray-200 mt-0.5">{result.courtFees || 'N/A'}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1"><Clock size={10} /> Expected Timeline</p>
                <p className="text-gray-200 mt-0.5">{result.expectedTimeline || 'N/A'}</p>
              </div>
              <div className="bg-navy-800/50 rounded-lg p-3 sm:col-span-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1"><Shield size={10} /> Government Department</p>
                <p className="text-gray-200 mt-0.5">{result.governmentDepartment || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Applicable Laws */}
          {(result.applicableLaws?.length || result.applicableActs?.length) && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-gold-500" /> Applicable Laws & Acts
              </h2>
              <div className="space-y-2">
                {(result.applicableLaws || []).map((law: string, i: number) => (
                  <div key={`law-${i}`} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                    {law}
                  </div>
                ))}
                {(result.applicableActs || []).map((act: string, i: number) => (
                  <div key={`act-${i}`} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-[10px] font-bold"><Layers size={10} /></span>
                    {act}
                  </div>
                ))}
              </div>
              {result.applicableSections?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-navy-700/40">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Applicable Sections</p>
                  <div className="flex flex-wrap gap-2">
                    {result.applicableSections.map((s: string, i: number) => (
                      <span key={i} className="badge-gold text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Legal Rights */}
          {result.legalRights?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-gold-500" /> Your Legal Rights
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {result.legalRights.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-navy-800/40 text-sm text-gray-300">
                    <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Documents & Evidence */}
          {(result.requiredDocuments?.length || result.evidenceRequired?.length) && (
            <div className="grid lg:grid-cols-2 gap-6">
              {result.requiredDocuments?.length > 0 && (
                <div className="card">
                  <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <FileCheck size={16} className="text-gold-500" /> Required Documents
                  </h2>
                  <div className="space-y-2">
                    {result.requiredDocuments.map((doc: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-navy-800/40 text-sm text-gray-300">
                        <span className="text-gold-500">•</span>
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.evidenceRequired?.length > 0 && (
                <div className="card">
                  <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <Scale size={16} className="text-gold-500" /> Evidence Required
                  </h2>
                  <div className="space-y-2">
                    {result.evidenceRequired.map((ev: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-navy-800/40 text-sm text-gray-300">
                        <span className="text-gold-500">•</span>
                        {ev}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Procedure */}
          {result.filingProcedure?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Route size={16} className="text-gold-500" /> Step-by-Step Filing Procedure
              </h2>
              <div className="space-y-3">
                {result.filingProcedure.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Remedies & Mediation */}
          {(result.alternativeRemedies?.length || result.mediationSuggestions) && (
            <div className="grid lg:grid-cols-2 gap-6">
              {result.alternativeRemedies?.length > 0 && (
                <div className="card">
                  <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <Gavel size={16} className="text-gold-500" /> Alternative Remedies
                  </h2>
                  <div className="space-y-2">
                    {result.alternativeRemedies.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-navy-800/40 text-sm text-gray-300">
                        <span className="text-gold-500">•</span>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.mediationSuggestions && (
                <div className="card">
                  <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <MessageSquare size={16} className="text-gold-500" /> Mediation Suggestions
                  </h2>
                  <p className="text-sm text-gray-300 leading-relaxed">{result.mediationSuggestions}</p>
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {result.checklistBeforeFiling?.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <ListChecks size={16} className="text-gold-500" /> Checklist Before Filing
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {result.checklistBeforeFiling.map((c: string, i: number) => (
                  <label key={i} className="flex items-start gap-2 p-2 rounded-lg bg-navy-800/40 text-sm text-gray-300 cursor-pointer hover:bg-navy-800/60 transition-colors">
                    <input type="checkbox" className="mt-1 accent-gold-500" />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Generated Drafts */}
          {(result.draftComplaint || result.draftLegalNotice) && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-gold-500" /> Generated Documents
              </h2>
              <div className="space-y-4">
                {result.draftComplaint && (
                  <DraftBlock title="Draft Complaint" body={result.draftComplaint} id="complaint" copied={copied} onCopy={copyText} onDownload={downloadDraft} onDownloadPDF={downloadDraftPDF} />
                )}
                {result.draftLegalNotice && (
                  <DraftBlock title="Draft Legal Notice" body={result.draftLegalNotice} id="notice" copied={copied} onCopy={copyText} onDownload={downloadDraft} onDownloadPDF={downloadDraftPDF} />
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && (
            <Recommendations data={result.recommendations} />
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">{result.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftBlock({ title, body, id, copied, onCopy, onDownload, onDownloadPDF }: { title: string; body: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void; onDownload: (t: string, b: string) => void; onDownloadPDF: (t: string, b: string) => void; }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-sm font-medium text-gold-400">{title}</h3>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setExpanded(!expanded)} className="btn-secondary py-1 px-2 text-[10px]">
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button onClick={() => onCopy(body, id)} className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1">
            {copied === id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />} Copy
          </button>
          <button onClick={() => onDownload(title, body)} className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1">
            <Download size={10} /> TXT
          </button>
          <button onClick={() => onDownloadPDF(title, body)} className="btn-primary py-1 px-2 text-[10px] flex items-center gap-1">
            <Download size={10} /> PDF
          </button>
        </div>
      </div>
      {expanded && (
        <div className="bg-navy-800/50 rounded-lg p-3 max-h-[400px] overflow-y-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{body}</pre>
        </div>
      )}
    </div>
  );
}
