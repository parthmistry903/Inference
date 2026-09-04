import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger';
import { MAX_PDF_BYTES } from '../services/s3.service';

const execFileAsync = promisify(execFile);
const PDF_EXTRACTION_TIMEOUT_MS = 15_000;
const MAX_EXTRACTED_TEXT_CHARS = 20_000;

export async function extractPDFText(buffer: Buffer): Promise<string | null> {
  if (buffer.length === 0 || buffer.length > MAX_PDF_BYTES) return null;
  const tempFilePath = path.join(os.tmpdir(), `resume-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  
  try {
    fs.writeFileSync(tempFilePath, buffer);
    
    const { stdout } = await execFileAsync('python3', [
      '-c',
      [
        'import pypdf, sys',
        'reader = pypdf.PdfReader(sys.argv[1])',
        'texts = []',
        'limit = int(sys.argv[2])',
        'for page in reader.pages[:50]:',
        '    text = page.extract_text() or ""',
        '    texts.append(text)',
        '    if sum(len(t) for t in texts) >= limit:',
        '        break',
        'print("".join(texts)[:limit])',
      ].join('\n'),
      tempFilePath,
      String(MAX_EXTRACTED_TEXT_CHARS),
    ], {
      timeout: PDF_EXTRACTION_TIMEOUT_MS,
      maxBuffer: MAX_EXTRACTED_TEXT_CHARS * 4,
    });
    
    const text = stdout.trim().slice(0, MAX_EXTRACTED_TEXT_CHARS);
    return text.length > 50 ? text : null;
  } catch (error) {
    logger.warn('[PDF Extractor] PDF text extraction failed', {
      reason: error instanceof Error ? error.message : 'unknown',
      size: buffer.length,
    });
    return null;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}
