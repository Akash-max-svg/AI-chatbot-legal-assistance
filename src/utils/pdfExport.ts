import { jsPDF } from 'jspdf';

const NAVY: [number, number, number] = [10, 16, 63];
const GOLD: [number, number, number] = [212, 160, 23];
const GRAY: [number, number, number] = [90, 100, 120];
const DARK: [number, number, number] = [30, 35, 60];

interface PdfOptions {
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
  sections: { heading: string; body: string }[];
  footer?: string;
}

export function generateLegalPDF(opts: PdfOptions): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin - 40) {
      addFooter();
      doc.addPage();
      y = margin;
    }
  };

  const addFooter = () => {
    const page = doc.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Page ${page}`, pageWidth - margin - 30, pageHeight - 24);
    doc.text('AI Legal Assistant for Indian E-Courts', margin, pageHeight - 24);
  };

  // Header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 70, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 70, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(opts.title, margin, 36);
  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 220);
    doc.text(opts.subtitle, margin, 54);
  }
  y = 100;

  // Meta block
  if (opts.meta && opts.meta.length > 0) {
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, opts.meta.length * 18 + 12, 4, 4, 'S');
    doc.setFontSize(9);
    opts.meta.forEach((m, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GOLD);
      doc.text(`${m.label}:`, margin + 10, y + 16 + i * 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      const wrapped = doc.splitTextToSize(m.value, contentWidth - 130);
      doc.text(wrapped, margin + 120, y + 16 + i * 18);
    });
    y += opts.meta.length * 18 + 24;
  }

  // Sections
  opts.sections.forEach((section) => {
    ensureSpace(40);
    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(section.heading.toUpperCase(), margin + 10, y + 16);
    y += 32;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(section.body, contentWidth - 16);
    const lineH = 14;
    lines.forEach((line: string) => {
      ensureSpace(lineH);
      doc.text(line, margin + 8, y);
      y += lineH;
    });
    y += 12;
  });

  if (opts.footer) {
    ensureSpace(40);
    doc.setFillColor(255, 248, 220);
    doc.roundedRect(margin, y, contentWidth, 40, 4, 4, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 90, 10);
    const footerLines = doc.splitTextToSize(opts.footer, contentWidth - 20);
    doc.text(footerLines, margin + 10, y + 16);
  }

  addFooter();
  const safeName = opts.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
  doc.save(`${safeName}.pdf`);
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function shareText(title: string, text: string): Promise<void> {
  if (navigator.share) {
    return navigator.share({ title, text }).catch(() => {});
  }
  return navigator.clipboard.writeText(text).then(() => {
    alert('Response copied to clipboard. You can paste it anywhere to share.');
  });
}
