import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { HealthLog } from '../types/family';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

function summariseEntry(log: HealthLog): string {
  const d = log.data_json;
  switch (log.log_type) {
    case 'medicine':
      return `Medicine: ${str(d.name)}${d.dose ? ` — ${str(d.dose)}` : ''}${d.reason ? ` (${str(d.reason)})` : ''}`;
    case 'temperature':
      return `Temperature: ${str(d.value)}°${String(d.unit ?? 'c').toUpperCase()}`;
    case 'symptom':
      return `Symptom: ${str(d.text)}`;
    case 'vaccination':
      return `Vaccination: ${str(d.name)}${d.lot_number ? ` (lot ${str(d.lot_number)})` : ''}`;
    case 'mood':
      return `Mood: ${str(d.score)}${d.note ? ` — ${str(d.note)}` : ''}`;
    default:
      return `${log.log_type}: ${JSON.stringify(d)}`;
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function renderHealthPdf(
  entries: HealthLog[],
  profileName: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const MARGIN = 50;
  const LINE_HEIGHT = 18;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawText = (text: string, x: number, size: number, useBold = false) => {
    page.drawText(text, { x, y, size, font: useBold ? bold : font, color: rgb(0, 0, 0) });
    y -= LINE_HEIGHT;
  };

  drawText(`Health Log — ${profileName}`, MARGIN, 14, true);
  drawText(`Exported: ${formatDate(Date.now())} — Last 30 days`, MARGIN, 10);
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 14;

  if (entries.length === 0) {
    drawText('No entries in the last 30 days.', MARGIN, 10);
  }

  entries.forEach((entry) => {
    if (y < MARGIN + LINE_HEIGHT * 2) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    drawText(formatDate(entry.logged_at), MARGIN, 9);
    y += LINE_HEIGHT;
    drawText(summariseEntry(entry), MARGIN + 12, 9);
    y -= 4;
  });

  return doc.save();
}
