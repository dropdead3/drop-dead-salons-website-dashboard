import { useState } from 'react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { Copy, CreditCard, Info, Receipt, Download, Eye, DollarSign, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import type { PhorestAppointment } from '@/hooks/usePhorestCalendar';
import type { BusinessSettings } from '@/hooks/useBusinessSettings';

interface CheckoutSummarySheetProps {
  appointment: PhorestAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tipAmount: number, rebooked: boolean) => void;
  isUpdating?: boolean;
  taxRate: number;
  businessSettings: BusinessSettings | null;
  locationName: string;
  locationAddress?: string;
  locationPhone?: string;
}

const TIP_PRESETS = [
  { label: '15%', multiplier: 0.15 },
  { label: '18%', multiplier: 0.18 },
  { label: '20%', multiplier: 0.20 },
  { label: '25%', multiplier: 0.25 },
];

export function CheckoutSummarySheet({
  appointment,
  open,
  onOpenChange,
  onConfirm,
  isUpdating = false,
  taxRate,
  businessSettings,
  locationName,
  locationAddress,
  locationPhone,
}: CheckoutSummarySheetProps) {
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [rebooked, setRebooked] = useState<boolean>(false);

  if (!appointment) return null;

  const subtotal = appointment.total_price || 0;
  const tax = subtotal * taxRate;
  const checkoutTotal = subtotal + tax;
  const grandTotal = checkoutTotal + tipAmount;

  // Calculate duration
  const getDuration = () => {
    try {
      const start = parseISO(`${appointment.appointment_date}T${appointment.start_time}`);
      const end = parseISO(`${appointment.appointment_date}T${appointment.end_time}`);
      const mins = differenceInMinutes(end, start);
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (hours > 0 && remainingMins > 0) {
        return `${hours}h ${remainingMins}min`;
      } else if (hours > 0) {
        return `${hours}h`;
      }
      return `${mins} min`;
    } catch {
      return '';
    }
  };

  const copyPhone = () => {
    if (appointment.client_phone) {
      navigator.clipboard.writeText(appointment.client_phone);
      toast.success('Phone copied');
    }
  };

  const formatDate = () => {
    try {
      return format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy');
    } catch {
      return appointment.appointment_date;
    }
  };

  const formatTime = () => {
    try {
      const start = parseISO(`${appointment.appointment_date}T${appointment.start_time}`);
      return format(start, 'h:mm a');
    } catch {
      return appointment.start_time;
    }
  };

  const stylistName = appointment.stylist_profile?.display_name || 
                      appointment.stylist_profile?.full_name || 
                      'Staff';

  const handleTipPreset = (multiplier: number) => {
    const calculatedTip = Math.round(subtotal * multiplier * 100) / 100;
    setTipAmount(calculatedTip);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setTipAmount(Math.round(parsed * 100) / 100);
    } else if (value === '') {
      setTipAmount(0);
    }
  };

  const generateReceiptPDF = (preview: boolean = false) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200], // Receipt paper width
    });

    const pageWidth = 80;
    const margin = 5;
    let y = 10;

    // Business name
    const businessName = businessSettings?.business_name || 'Drop Dead';
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(businessName, pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Location info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    if (locationName) {
      doc.text(locationName, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }
    if (locationAddress) {
      doc.text(locationAddress, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }
    if (locationPhone) {
      doc.text(locationPhone, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }
    y += 2;

    // Dashed line using small dots
    doc.setDrawColor(150);
    for (let x = margin; x < pageWidth - margin; x += 2) {
      doc.line(x, y, x + 1, y);
    }
    doc.setDrawColor(0);
    y += 6;

    // Date and time
    doc.setFontSize(8);
    doc.text(`Date: ${formatDate()}`, margin, y);
    y += 4;
    doc.text(`Time: ${formatTime()}`, margin, y);
    y += 4;
    doc.text(`Receipt #: ${appointment.id.slice(-8).toUpperCase()}`, margin, y);
    y += 6;

    // Dashed line
    doc.setDrawColor(150);
    for (let x = margin; x < pageWidth - margin; x += 2) {
      doc.line(x, y, x + 1, y);
    }
    doc.setDrawColor(0);
    y += 6;

    // Client and stylist
    doc.text(`Client: ${appointment.client_name || 'Walk-in'}`, margin, y);
    y += 4;
    doc.text(`Stylist: ${stylistName}`, margin, y);
    y += 6;

    // Dashed line
    doc.setDrawColor(150);
    for (let x = margin; x < pageWidth - margin; x += 2) {
      doc.line(x, y, x + 1, y);
    }
    doc.setDrawColor(0);
    y += 6;

    // Service
    doc.setFont('helvetica', 'bold');
    doc.text('Service', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    
    const serviceName = appointment.service_name || 'Service';
    const serviceLines = doc.splitTextToSize(serviceName, pageWidth - margin * 2 - 20);
    doc.text(serviceLines, margin, y);
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
    y += 4 * serviceLines.length + 4;

    // Dashed line
    doc.setDrawColor(150);
    for (let x = margin; x < pageWidth - margin; x += 2) {
      doc.line(x, y, x + 1, y);
    }
    doc.setDrawColor(0);
    y += 6;

    // Totals
    doc.text('Subtotal', margin, y);
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
    y += 4;

    doc.text(`Tax (${(taxRate * 100).toFixed(1)}%)`, margin, y);
    doc.text(`$${tax.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
    y += 4;

    // Solid line before total
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Checkout Total', margin, y);
    doc.text(`$${checkoutTotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
    y += 5;

    if (tipAmount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Tip', margin, y);
      doc.text(`$${tipAmount.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
      y += 4;

      doc.line(margin, y, pageWidth - margin, y);
      y += 4;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('GRAND TOTAL', margin, y);
      doc.text(`$${grandTotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
      y += 6;
    }

    // Footer
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for visiting!', pageWidth / 2, y, { align: 'center' });
    y += 4;
    if (businessSettings?.website) {
      doc.text(businessSettings.website, pageWidth / 2, y, { align: 'center' });
    }

    if (preview) {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } else {
      doc.save(`receipt-${appointment.id.slice(-8)}.pdf`);
      toast.success('Receipt downloaded');
    }
  };

  const handleConfirm = () => {
    onConfirm(tipAmount, rebooked);
    // Reset state for next use
    setTipAmount(0);
    setCustomTip('');
    setRebooked(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout Summary
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-lg">
                {appointment.client_name || 'Walk-in'}
              </p>
              {appointment.client_phone && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {appointment.client_phone}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyPhone}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Service Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Service Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-right max-w-[60%]">
                  {appointment.service_name || 'Service'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stylist</span>
                <span className="font-medium">{stylistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{formatDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{formatTime()}</span>
              </div>
              {getDuration() && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{getDuration()}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Checkout Total</span>
                <span className="font-bold">${checkoutTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tip Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Record Tip
            </h3>
            <p className="text-xs text-muted-foreground">
              Enter the tip amount from the PhorestPay terminal receipt
            </p>
            
            {/* Quick select buttons */}
            <div className="flex gap-2">
              {TIP_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant={tipAmount === Math.round(subtotal * preset.multiplier * 100) / 100 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleTipPreset(preset.multiplier)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom tip input */}
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-tip" className="text-sm whitespace-nowrap">
                Custom:
              </Label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="custom-tip"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={customTip}
                  onChange={(e) => handleCustomTipChange(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {tipAmount > 0 && (
              <div className="flex justify-between text-sm bg-muted/50 p-3 rounded-lg">
                <span>Tip Amount</span>
                <span className="font-semibold">${tipAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Grand Total with Tip */}
          {tipAmount > 0 && (
            <>
              <Separator />
              <div className="flex justify-between text-lg bg-primary/5 p-4 rounded-lg border border-primary/20">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold text-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </>
          )}

          <Separator />

          {/* Rebook Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Client Rebooked?</p>
                <p className="text-xs text-muted-foreground">Did client book their next appointment?</p>
              </div>
            </div>
            <Switch
              checked={rebooked}
              onCheckedChange={setRebooked}
              aria-label="Client rebooked"
            />
          </div>

          <Separator />

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg border">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Process payment on PhorestPay terminal, then confirm below.
            </p>
          </div>

          {/* Receipt Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => generateReceiptPDF(true)}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => generateReceiptPDF(false)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          {/* Confirm Button */}
          <Button
            className="w-full gap-2"
            variant="default"
            size="lg"
            onClick={handleConfirm}
            disabled={isUpdating}
          >
            <Receipt className="h-4 w-4" />
            {isUpdating ? 'Processing...' : 'Mark as Paid'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}