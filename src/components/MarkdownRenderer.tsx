import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return <div className={`md-root ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');
  return out;
}

function renderMarkdown(src: string): string {
  if (!src) return '';
  const lines = src.split('\n');
  const out: string[] = [];
  let i = 0;
  let inList: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (inList === 'ul') out.push('</ul>');
    if (inList === 'ol') out.push('</ol>');
    inList = null;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      closeList();
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      closeList();
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        block.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(`<blockquote class="md-quote">${inline(block.join(' '))}</blockquote>`);
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level} class="md-h md-h${level}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    const ol = /^\s*(\d+)\.\s+(.*)$/.exec(trimmed);
    if (ol) {
      if (inList !== 'ol') { closeList(); out.push('<ol class="md-ol">'); inList = 'ol'; }
      out.push(`<li>${inline(ol[2])}</li>`);
      i++;
      continue;
    }

    const ul = /^\s*[-*]\s+(.*)$/.exec(trimmed);
    if (ul) {
      if (inList !== 'ul') { closeList(); out.push('<ul class="md-ul">'); inList = 'ul'; }
      out.push(`<li>${inline(ul[1])}</li>`);
      i++;
      continue;
    }

    closeList();
    out.push(`<p class="md-p">${inline(trimmed)}</p>`);
    i++;
  }
  closeList();
  return out.join('\n');
}
