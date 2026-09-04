const execFileAsyncMock = jest.fn();

jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: () => execFileAsyncMock,
}));

import { extractPDFText } from '../../src/worker/pdfExtractor';

describe('extractPDFText', () => {
  beforeEach(() => {
    execFileAsyncMock.mockReset();
  });

  it('returns null for an empty buffer', async () => {
    await expect(extractPDFText(Buffer.alloc(0))).resolves.toBeNull();
    expect(execFileAsyncMock).not.toHaveBeenCalled();
  });

  it('returns null when pypdf cannot read the buffer', async () => {
    execFileAsyncMock.mockRejectedValueOnce(new Error('bad pdf'));
    await expect(extractPDFText(Buffer.from('not a pdf'))).resolves.toBeNull();
  });

  it('returns null for a very short PDF-like buffer', async () => {
    execFileAsyncMock.mockResolvedValueOnce({ stdout: 'too short' });
    const shortPdf = Buffer.from('%PDF-1.1\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF');
    await expect(extractPDFText(shortPdf)).resolves.toBeNull();
  });

  it('returns text for readable PDF content longer than 50 chars when parser succeeds', async () => {
    execFileAsyncMock.mockResolvedValueOnce({
      stdout: 'This is a readable resume with more than fifty characters of text for testing.',
    });
    await expect(extractPDFText(Buffer.from('%PDF-1.7 readable'))).resolves.toContain('readable resume');
  });
});
