import { useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { GiftCardSettings } from '@/hooks/useGiftCardSettings';
import { GiftCard } from '@/hooks/useGiftCards';

interface PrintableGiftCardProps {
  giftCard: GiftCard;
  settings: Partial<GiftCardSettings>;
  recipientName?: string;
  fromName?: string;
  message?: string;
}

export function PrintableGiftCard({ 
  giftCard, 
  settings,
  recipientName,
  fromName,
  message 
}: PrintableGiftCardProps) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  const generatePDF = useCallback(() => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [4, 8.5], // Certificate size
    });

    const bgColor = settings.card_background_color || '#1a1a1a';
    const textColor = settings.card_text_color || '#ffffff';
    const accentColor = settings.card_accent_color || '#d4af37';

    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const bg = hexToRgb(bgColor);
    const text = hexToRgb(textColor);
    const accent = hexToRgb(accentColor);

    // Background
    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.rect(0, 0, 8.5, 4, 'F');

    // Border
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.02);
    doc.rect(0.25, 0.25, 8, 3.5);

    // Header
    doc.setTextColor(text.r, text.g, text.b);
    doc.setFontSize(10);
    doc.text('GIFT CARD', 0.5, 0.6);

    // Amount
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.setFontSize(36);
    doc.text(`$${giftCard.current_balance.toFixed(0)}`, 0.5, 1.2);

    // Code
    doc.setTextColor(text.r, text.g, text.b);
    doc.setFontSize(14);
    doc.text(giftCard.code, 0.5, 1.8);

    // Recipient info
    if (recipientName || fromName || message) {
      doc.setFontSize(10);
      let yPos = 2.2;
      if (recipientName) {
        doc.text(`To: ${recipientName}`, 0.5, yPos);
        yPos += 0.25;
      }
      if (fromName) {
        doc.text(`From: ${fromName}`, 0.5, yPos);
        yPos += 0.25;
      }
      if (message) {
        doc.setFontSize(9);
        doc.text(`"${message}"`, 0.5, yPos);
      }
    }

    // QR Code
    if (settings.include_qr_code && qrRef.current) {
      const qrDataUrl = qrRef.current.toDataURL('image/png');
      doc.addImage(qrDataUrl, 'PNG', 6.5, 0.5, 1.5, 1.5);
    }

    // Terms
    if (settings.include_terms && settings.terms_text) {
      doc.setFontSize(7);
      doc.setTextColor(text.r * 0.7, text.g * 0.7, text.b * 0.7);
      const lines = doc.splitTextToSize(settings.terms_text, 5);
      doc.text(lines, 0.5, 3.4);
    }

    // Expiration
    if (giftCard.expires_at) {
      doc.setFontSize(8);
      doc.setTextColor(text.r, text.g, text.b);
      doc.text(`Expires: ${new Date(giftCard.expires_at).toLocaleDateString()}`, 0.5, 3.7);
    }

    return doc;
  }, [giftCard, settings, recipientName, fromName, message]);

  const handleDownload = () => {
    const doc = generatePDF();
    doc.save(`gift-card-${giftCard.code}.pdf`);
  };

  const handlePrint = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden QR Code for PDF generation */}
      <div className="hidden">
        <QRCodeCanvas
          ref={qrRef}
          value={`giftcard:${giftCard.code}`}
          size={200}
          level="M"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
