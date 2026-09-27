// Pulls plain text out of an uploaded call-script file (.docx, .pdf, .txt or .md).
import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

export async function extractScriptText(file: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'docx') return (await mammoth.extractRawText({ buffer: file })).value;
  if (ext === 'pdf') {
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(file)), { mergePages: true });
    return text;
  }
  if (ext === 'txt' || ext === 'md') return file.toString('utf8');
  throw new Error('Upload a .docx, .pdf, .txt or .md file');
}
