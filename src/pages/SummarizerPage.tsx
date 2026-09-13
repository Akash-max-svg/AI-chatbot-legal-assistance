import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, Download, Copy, Check, BookOpen, Scale,
  AlertCircle, Loader2, Trash2, ChevronDown, ChevronUp,
  Sparkles,
} from 'lucide-react';
import { summarizeService, exportSummaryAsPDF, type SummarySection } from '../services/summarizeService';
import { extractFileText } from '../utils/pdfExtract';
import Recommendations from '../components/Recommendations';

interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
}

export default function SummarizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadFile, setUploadFile] = useState<UploadFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<SummarySection[] | null>(null);
  const [caseTitle, setCaseTitle] = useState('');
  const [court, setCourt] = useState('');
  const [date, setDate] = useState('');
  const [recommendations, setRecommendations] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const onFile = async (f: File) => {
    setError('');
    if (f.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit');
      return;
    }
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type) &&
        !f.name.endsWith('.pdf') && !f.name.endsWith('.docx') && !f.name.endsWith('.txt')) {
      setError('Only PDF, DOCX, and TXT files are supported');
      return;
    }
    setFile(f);
    setSummary(null);
    setRecommendations(null);
    setExtractedText('');
    simulateUpload(f);
    try {
      const text = await extractFileText(f);
      setExtractedText(text);
      if (!text || text.trim().length < 20) {
        setError('Could not extract enough text from the document. If it is a scanned PDF, try a text-based PDF.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to extract text from file.');
      setUploadFile((prev) => (prev ? { ...prev, status: 'error' } : null));
    }
  };

  const simulateUpload = (f: File) => {
    setUploadFile({ file: f, progress: 0, status: 'uploading' });
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadFile((prev) => (prev ? { ...prev, progress: 100, status: 'done' } : null));
      } else {
        setUploadFile((prev) => (prev ? { ...prev, progress } : null));
      }
    }, 150);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.remove('border-gold-500/60', 'bg-gold-500/5');
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.add('border-gold-500/60', 'bg-gold-500/5');
  }, []);

  const handleDragLeave = useCallback(() => {
    dropRef.current?.classList.remove('border-gold-500/60', 'bg-gold-500/5');
  }, []);

  const processFile = async () => {
    if (!file) return;
    if (!extractedText || extractedText.trim().length < 20) {
      setError('No extractable text found in the document. Try a different file.');
      return;
    }
    setUploadFile((prev) => (prev ? { ...prev, status: 'processing' } : null));
    setIsProcessing(true);
    setError('');

    try {
      const result = await summarizeService.summarizeDocument(extractedText);
      setSummary(result.summary.sections);
      setCaseTitle(result.summary.caseTitle || '');
      setCourt(result.summary.court || '');
      setDate(result.summary.date || '');
      setRecommendations(result.summary.recommendations || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to summarize the document. Please try again.');
    } finally {
      setIsProcessing(false);
      setUploadFile((prev) => (prev ? { ...prev, status: 'done' } : null));
    }
  };

  const removeFile = () => {
    setFile(null);
    setSummary(null);
    setRecommendations(null);
    setUploadFile(null);
    setExtractedText('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const copySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.map((s) => `## ${s.heading}\n${s.content}`).join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSummary = () => {
    if (!summary) return;
    exportSummaryAsPDF(summary, caseTitle, court, date);
  };

  const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <BookOpen size={24} className="text-gold-500" /> AI Judgment Summarizer
        </h1>
        <p className="text-gray-400 text-sm mt-1">Upload court judgments and get structured AI-powered summaries using Google Gemini AI</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="card flex flex-col">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-gold-500" /> Upload Judgment
          </h2>

          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              file ? 'border-gold-500/40 bg-gold-500/5' : 'border-navy-600 hover:border-navy-500'
            }`}
          >
            {!file ? (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-navy-800 flex items-center justify-center mb-4">
                  <Upload size={24} className="text-gold-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Drag & Drop PDF Judgment</h3>
                <p className="text-sm text-gray-400 mb-4">or click to browse files</p>
                <p className="text-xs text-gray-500 mb-4">Supports PDF, DOCX, TXT — Max 10 MB</p>
                <button onClick={() => inputRef.current?.click()} className="btn-secondary text-sm">
                  Browse Files
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={22} className="text-gold-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-200">{file.name}</p>
                      <p className="text-xs text-gray-500">{fmtSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={removeFile} className="btn-secondary py-2 px-3 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>

                {uploadFile && uploadFile.status !== 'done' && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">
                        {uploadFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                      </span>
                      <span className="text-gray-500">{uploadFile.progress}%</span>
                    </div>
                    <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-500 rounded-full transition-all duration-200"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {extractedText && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <Check size={12} /> {extractedText.length.toLocaleString()} characters extracted
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {!summary && !isProcessing && (
                    <button onClick={processFile} disabled={!extractedText} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                      <Sparkles size={14} /> Summarize with Gemini AI
                    </button>
                  )}
                  {isProcessing && (
                    <button disabled className="btn-primary text-sm flex-1 flex items-center justify-center gap-2 opacity-60">
                      <Loader2 size={14} className="animate-spin" /> Gemini analyzing...
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Case Info */}
          {summary && (
            <div className="mt-4 p-4 rounded-lg bg-navy-800/40 border border-navy-700/40">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Case</p>
                  <p className="text-gray-200 font-medium">{caseTitle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Court</p>
                  <p className="text-gray-200 font-medium">{court || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Date</p>
                  <p className="text-gray-200 font-medium">{date || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Output */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <BookOpen size={18} className="text-gold-500" /> Structured Summary
            </h2>
            {summary && (
              <div className="flex items-center gap-2">
                <button onClick={copySummary} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={exportSummary} className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
                  <Download size={14} /> Export PDF
                </button>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="text-gold-500 animate-spin mb-4" />
              <h3 className="text-base font-semibold text-gray-200 mb-1">Gemini Analyzing Judgment</h3>
              <p className="text-sm text-gray-400">Extracting key holdings, issues, and reasoning...</p>
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <span className="px-2 py-1 rounded bg-navy-800">Extracting facts</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-1 rounded bg-navy-800">Framing issues</span>
                <span className="text-gray-600">→</span>
                <span className="px-2 py-1 rounded bg-navy-800">Analyzing reasoning</span>
              </div>
            </div>
          )}

          {!isProcessing && !summary && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Scale size={32} className="text-navy-700 mb-4" />
              <p className="text-sm text-gray-500">Upload a judgment PDF to generate a structured AI summary</p>
            </div>
          )}

          {summary && (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {summary.map((s, idx) => (
                <div key={idx} className="bg-navy-800/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-3 hover:bg-navy-800/70 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-gold-400 flex items-center gap-2">
                      <Scale size={14} /> {s.heading}
                    </h3>
                    {expandedSection === idx ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                  </button>
                  <div className={`px-3 pb-3 transition-all duration-200 ${expandedSection === idx || expandedSection === null ? 'block' : 'hidden'}`}>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{s.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && (
        <Recommendations data={recommendations} />
      )}

      {/* Disclaimer */}
      {summary && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            This is an AI-generated summary for legal research purposes. It may not capture all nuances of the original judgment. Always refer to the full text for official use.
          </p>
        </div>
      )}
    </div>
  );
}
