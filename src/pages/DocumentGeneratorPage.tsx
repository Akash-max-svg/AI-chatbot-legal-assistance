import { useState } from 'react';
import { Briefcase, FileText, Download, Copy, Check, FileCheck, AlertCircle, FilePlus, Loader2, Sparkles } from 'lucide-react';
import { documentService } from '../services/documentService';
import { generateLegalPDF, downloadTextFile } from '../utils/pdfExport';

interface DocumentTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
}

interface GeneratedDoc {
  title: string;
  content: string;
  type: string;
}

const templateData: DocumentTemplate[] = [
  { id: '1', type: 'complaint', name: 'Consumer Complaint', description: 'File under Consumer Protection Act 2019', category: 'Consumer', fields: ['complainantName', 'address', 'phone', 'oppositeParty', 'complaintDetails', 'reliefSought', 'claimAmount'] },
  { id: '2', type: 'legal-notice', name: 'Legal Notice', description: 'Send before filing suit', category: 'General', fields: ['senderName', 'senderAddress', 'recipientName', 'recipientAddress', 'subject', 'noticeBody', 'demand'] },
  { id: '3', type: 'rti', name: 'RTI Application', description: 'Right to Information request', category: 'Governance', fields: ['applicantName', 'address', 'phone', 'informationRequired', 'department'] },
  { id: '4', type: 'fir', name: 'FIR Draft', description: 'Police complaint', category: 'Criminal', fields: ['complainantName', 'address', 'incidentDate', 'incidentPlace', 'accusedDetails', 'offenceDescription', 'witnesses'] },
  { id: '5', type: 'affidavit', name: 'General Affidavit', description: 'Sworn affidavit template', category: 'General', fields: ['deponentName', 'address', 'affidavitContent', 'purpose'] },
  { id: '6', type: 'rental-agreement', name: 'Rental Agreement', description: 'Residential lease', category: 'Property', fields: ['landlordName', 'tenantName', 'propertyAddress', 'rentAmount', 'duration', 'securityDeposit', 'startDate'] },
  { id: '7', type: 'employment-complaint', name: 'Employment Complaint', description: 'Against employer', category: 'Labour', fields: ['employeeName', 'employerName', 'designation', 'complaintDetails', 'reliefSought'] },
];

export default function DocumentGeneratorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectTemplate = (t: DocumentTemplate) => {
    setSelectedTemplate(t);
    setFormData({});
    setGeneratedDoc(null);
    setError('');
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    setError('');
    setGeneratedDoc(null);
    try {
      const result = await documentService.generateDocument(selectedTemplate.name, formData);
      setGeneratedDoc({ title: selectedTemplate.name, content: result.document.content || '', type: selectedTemplate.type });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate document.');
    } finally {
      setLoading(false);
    }
  };

  const downloadDoc = () => {
    if (!generatedDoc) return;
    downloadTextFile(`${generatedDoc.title.replace(/\s+/g, '_')}.txt`, generatedDoc.content);
  };

  const downloadDocPDF = () => {
    if (!generatedDoc) return;
    generateLegalPDF({
      title: generatedDoc.title,
      subtitle: 'AI Legal Document Generator',
      sections: [{ heading: generatedDoc.title, body: generatedDoc.content }],
      footer: 'AI-generated document template. Review with a qualified legal practitioner before official use.',
    });
  };

  const copyDoc = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading flex items-center gap-3">
          <Briefcase size={24} className="text-gold-500" /> AI Document Generator
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Generate legal documents with Gemini AI — complaints, notices, RTI applications, affidavits, rental agreements, and more.
        </p>
      </div>

      {/* Templates Grid */}
      {!selectedTemplate && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templateData.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t)}
              className="card-gold text-left group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center">
                  <FileText size={18} className="text-gold-400" />
                </div>
                <div>
                  <span className="badge-gold text-[9px] mb-1 inline-block">{t.category}</span>
                  <h3 className="text-sm font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">{t.name}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">{t.description}</p>
              <div className="flex items-center gap-1 text-xs text-gold-400">
                <FilePlus size={12} /> Generate with Gemini AI
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      {selectedTemplate && !generatedDoc && (
        <div className="card max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <FileText size={18} className="text-gold-500" /> {selectedTemplate.name}
            </h2>
            <button onClick={() => setSelectedTemplate(null)} className="text-gray-500 hover:text-gray-300 text-xs">
              Change Template
            </button>
          </div>
          <div className="space-y-4">
            {selectedTemplate.fields.map((field) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1.5 block capitalize">
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                {field.toLowerCase().includes('details') || field.toLowerCase().includes('body') || field.toLowerCase().includes('description') || field.toLowerCase().includes('content') || field.toLowerCase().includes('required') ? (
                  <textarea
                    value={formData[field] || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    rows={4}
                    className="input-field w-full resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field] || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    className="input-field w-full"
                  />
                )}
              </div>
            ))}
            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? 'Gemini generating...' : 'Generate with Gemini AI'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card flex flex-col items-center justify-center py-12">
          <div className="w-14 h-14 rounded-full border-4 border-gold-500/30 border-t-gold-400 animate-spin mb-3" />
          <h3 className="text-base font-semibold text-gray-200 mb-1">Gemini AI is drafting your document</h3>
          <p className="text-sm text-gray-400">Applying Indian legal formatting and relevant provisions...</p>
        </div>
      )}

      {/* Generated Document */}
      {generatedDoc && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <FileCheck size={18} className="text-gold-500" /> {generatedDoc.title}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={copyDoc} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={downloadDoc} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
                <Download size={14} /> TXT
              </button>
              <button onClick={downloadDocPDF} className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
                <Download size={14} /> PDF
              </button>
              <button onClick={() => { setGeneratedDoc(null); setFormData({}); }} className="btn-secondary py-2 px-3 text-xs">
                Edit
              </button>
            </div>
          </div>
          <div className="bg-navy-800/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{generatedDoc.content}</pre>
          </div>
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">
              This is an AI-generated document. Please review and consult a legal practitioner before using it for official purposes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
