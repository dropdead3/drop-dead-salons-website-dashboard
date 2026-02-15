import type { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface ReportHeaderOptions {
  orgName: string;
  /** Data URL (e.g. from fetchLogoAsDataUrl) to embed logo in PDF */
  logoDataUrl?: string | null;
  reportTitle: string;
  dateFrom: string;
  dateTo: string;
  /** Optional; defaults to now */
  generatedAt?: Date;
}

const HEADER_TOP = 14;
const LOGO_MAX_WIDTH = 36;
const LOGO_MAX_HEIGHT = 20;
const HEADER_FONT_SIZE_TITLE = 16;
const HEADER_FONT_SIZE_SUBTITLE = 10;
const FOOTER_FONT_SIZE = 8;
const FOOTER_BOTTOM = 10;

/** Body content should start below this Y to avoid overlapping the header on any page. */
export const REPORT_BODY_START_Y = 72;

function getImageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | undefined {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  return undefined;
}

/**
 * Fetches an image URL and returns a data URL for embedding in jsPDF.
 * Returns null on CORS or network errors so reports still generate without logo.
 */
export async function fetchLogoAsDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Adds a branded header to the first page: optional logo, org name, report title, date range, generated date.
 * Returns the Y position after the header (use as startY for body content).
 */
export function addReportHeader(
  doc: jsPDF,
  opts: ReportHeaderOptions
): number {
  const generatedAt = opts.generatedAt ?? new Date();
  const pageWidth = (doc as unknown as { internal: { pageSize: { getWidth: () => number } } }).internal.pageSize.getWidth();
  let y = HEADER_TOP;

  // Clear any lingering styles from prior draws
  doc.setTextColor(0, 0, 0);

  if (opts.logoDataUrl) {
    const imageFormat = getImageFormatFromDataUrl(opts.logoDataUrl) ?? 'PNG';
    try {
      doc.addImage(
        opts.logoDataUrl,
        imageFormat,
        14,
        y,
        LOGO_MAX_WIDTH,
        LOGO_MAX_HEIGHT,
        undefined,
        'FAST'
      );
      y += LOGO_MAX_HEIGHT + 4;
    } catch {
      // If image fails (unsupported format, corrupted data URL), skip logo
    }
  }

  doc.setFontSize(HEADER_FONT_SIZE_SUBTITLE);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(opts.orgName, 14, y);
  y += 6;

  doc.setFontSize(HEADER_FONT_SIZE_TITLE);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.reportTitle, 14, y);
  y += 6;

  doc.setFontSize(HEADER_FONT_SIZE_SUBTITLE);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const dateRange = `${format(new Date(opts.dateFrom), 'MMM d, yyyy')} – ${format(new Date(opts.dateTo), 'MMM d, yyyy')}`;
  doc.text(dateRange, 14, y);
  y += 5;
  doc.text(`Generated on ${format(generatedAt, 'MMM d, yyyy h:mm a')}`, 14, y);

  // Divider line under header
  doc.setDrawColor(220);
  doc.line(14, REPORT_BODY_START_Y - 10, pageWidth - 14, REPORT_BODY_START_Y - 10);
  doc.setDrawColor(0);

  doc.setTextColor(0, 0, 0);
  return REPORT_BODY_START_Y;
}

/**
 * Common jsPDF-AutoTable settings for branded reports:
 * - Reserves header space on each page
 * - Redraws header on each page
 */
export function getReportAutoTableBranding(doc: jsPDF, opts: ReportHeaderOptions): {
  margin: { top: number };
  didDrawPage: () => void;
} {
  return {
    margin: { top: REPORT_BODY_START_Y },
    didDrawPage: () => addReportHeader(doc, opts),
  };
}

/**
 * Adds footer to every page: "Page n of N" centered at the bottom.
 * Call after all body content is added (so page count is final).
 */
export function addReportFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = (doc as unknown as { internal: { pageSize: { getWidth: () => number } } }).internal.pageSize.getWidth();
  const pageHeight = (doc as unknown as { internal: { pageSize: { getHeight: () => number } } }).internal.pageSize.getHeight();
  doc.setFontSize(FOOTER_FONT_SIZE);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - FOOTER_BOTTOM,
      { align: 'center' }
    );
  }
  doc.setTextColor(0, 0, 0);
}
