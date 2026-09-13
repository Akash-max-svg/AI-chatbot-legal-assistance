export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt') || file.type === 'text/plain') {
    return await file.text();
  }
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return await extractPdfText(file);
  }
  if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await extractDocxText(file);
  }
  try {
    return await file.text();
  } catch {
    throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
  }
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const text = decodePdfText(bytes);
    if (text && text.trim().length > 50) return text;
    throw new Error('Could not extract text from PDF. The PDF may be scanned (image-based).');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to read PDF file.');
  }
}

function decodePdfText(bytes: Uint8Array): string {
  let raw = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    raw += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as any);
  }
  const textParts: string[] = [];
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(raw)) !== null) {
    const stream = match[1];
    const textInParentheses = stream.match(/\((?:[^()\\]|\\.)*\)/g) || [];
    textInParentheses.forEach((t) => {
      textParts.push(t.slice(1, -1).replace(/\\([nrtbf()\\])/g, (_, c) => {
        switch (c) {
          case 'n': return '\n';
          case 'r': return '\r';
          case 't': return '\t';
          case 'b': return '\b';
          case 'f': return '\f';
          default: return c;
        }
      }));
    });
    const tjs = stream.match(/\[(?:[^\]]*)\]\s*TJ/g) || [];
    tjs.forEach((tj) => {
      const inner = tj.match(/\((?:[^()\\]|\\.)*\)/g) || [];
      inner.forEach((t) => textParts.push(t.slice(1, -1)));
    });
  }
  const extracted = textParts.join(' ').replace(/\s+/g, ' ').trim();
  return extracted;
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decompressed = await inflateDocx(arrayBuffer);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decompressed, 'application/xml');
    const paragraphs = doc.getElementsByTagName('w:p');
    const lines: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const texts = paragraphs[i].getElementsByTagName('w:t');
      let line = '';
      for (let j = 0; j < texts.length; j++) line += texts[j].textContent || '';
      if (line.trim()) lines.push(line);
    }
    return lines.join('\n');
  } catch {
    throw new Error('Could not extract text from DOCX file.');
  }
}

async function inflateDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const cs = new Blob([arrayBuffer]).stream().pipeThrough(ds);
      const decompressed = await new Response(cs).text();
      return decompressed;
    } catch {}
  }
  throw new Error('DOCX decompression is not supported in this browser.');
}
