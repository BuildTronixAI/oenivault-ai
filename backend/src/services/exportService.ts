import PDFDocument from 'pdfkit';
import { AuthUser } from '../middleware/auth';
import * as inventoryService from './inventoryService';
import * as reportService from './reportService';
import { WineFilters } from '../utils/wineFilters';

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportInventoryCsv(user: AuthUser, filters: WineFilters = {}) {
  const wines = await inventoryService.listWines(user, filters);
  const headers = [
    'name',
    'vintage',
    'region',
    'varietal',
    'quantity',
    'location_code',
    'estimated_value',
    'line_value',
    'collection_name',
    'customer_name',
    'notes',
  ];

  const rows = wines.map((w) => {
    const value = Number(w.estimated_value ?? 0);
    const line = value * w.quantity;
    return [
      w.name,
      w.vintage,
      w.region,
      w.varietal,
      w.quantity,
      w.location_code,
      w.estimated_value,
      line.toFixed(2),
      (w as { collection_name?: string }).collection_name,
      (w as { customer_name?: string }).customer_name,
      w.notes,
    ]
      .map(csvEscape)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n') + '\n';
}

export async function exportInventoryPdf(user: AuthUser, filters: WineFilters = {}): Promise<Buffer> {
  const wines = await inventoryService.listWines(user, filters);
  const valueReport = await reportService.valueReport(user);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#5c1529').fontSize(22).text('OeniVault AI', { continued: false });
    doc.fillColor('#333').fontSize(12).text('Collection Inventory Report', { continued: false });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Generated ${new Date().toLocaleString()}`);
    doc.text(`Total estimated value: $${Number(valueReport.grandTotal).toFixed(2)}`);
    doc.text(`Wines listed: ${wines.length}`);
    doc.moveDown();

    doc.fillColor('#000').fontSize(11);
    for (const w of wines.slice(0, 80)) {
      const lineValue = Number(w.estimated_value ?? 0) * w.quantity;
      const meta = [w.vintage, w.region, w.varietal].filter(Boolean).join(' · ');
      doc.font('Helvetica-Bold').text(w.name, { continued: false });
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#444')
        .text(
          `${meta || '—'}  |  qty ${w.quantity}  |  ${w.location_code ?? 'no loc'}  |  $${lineValue.toFixed(2)}`
        );
      doc.moveDown(0.35);
      doc.fillColor('#000').fontSize(11);
      if (doc.y > 720) doc.addPage();
    }

    if (wines.length > 80) {
      doc.moveDown().fontSize(9).fillColor('#666').text(`…and ${wines.length - 80} more wines (see CSV export for full list).`);
    }

    doc.end();
  });
}
