import { useState } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { useSalesMetrics, useSalesByStylist, useSalesByLocation } from '@/hooks/useSalesData';
import { useProductSalesAnalytics } from '@/hooks/useProductSalesAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SalesReportGeneratorProps {
  reportType: string;
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  onClose: () => void;
}

export function SalesReportGenerator({ 
  reportType, 
  dateFrom, 
  dateTo, 
  locationId,
  onClose 
}: SalesReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics({
    dateFrom,
    dateTo,
    locationId,
  });

  const { data: stylistData, isLoading: stylistLoading } = useSalesByStylist(dateFrom, dateTo);
  const { data: locationData, isLoading: locationLoading } = useSalesByLocation(dateFrom, dateTo);
  const { data: productData, isLoading: productLoading } = useProductSalesAnalytics('month', locationId);

  const isLoading = metricsLoading || stylistLoading || locationLoading || productLoading;

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily-sales': return 'Daily Sales Summary';
      case 'stylist-sales': return 'Sales by Stylist';
      case 'location-sales': return 'Sales by Location';
      case 'product-sales': return 'Product Sales Report';
      default: return 'Sales Report';
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(getReportTitle(), pageWidth / 2, y, { align: 'center' });
      
      y += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(
        `${format(new Date(dateFrom), 'MMM d, yyyy')} - ${format(new Date(dateTo), 'MMM d, yyyy')}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      
      y += 5;
      doc.text(
        `Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      
      doc.setTextColor(0);
      y += 15;

      // Summary Section
      if (metrics) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: [
            ['Total Revenue', `$${metrics.totalRevenue.toLocaleString()}`],
            ['Service Revenue', `$${metrics.serviceRevenue.toLocaleString()}`],
            ['Product Revenue', `$${metrics.productRevenue.toLocaleString()}`],
            ['Total Services', metrics.totalServices.toLocaleString()],
            ['Total Products', metrics.totalProducts.toLocaleString()],
            ['Average Ticket', `$${Math.round(metrics.averageTicket).toLocaleString()}`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [51, 51, 51] },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 15;
      }

      // Report-specific content
      if (reportType === 'stylist-sales' && stylistData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales by Stylist', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Rank', 'Stylist', 'Total Revenue', 'Services', 'Avg Ticket']],
          body: stylistData.slice(0, 15).map((s, idx) => [
            `#${idx + 1}`,
            s.name,
            `$${s.totalRevenue.toLocaleString()}`,
            s.totalServices.toString(),
            `$${Math.round(s.totalRevenue / s.totalServices || 0).toLocaleString()}`,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [51, 51, 51] },
          margin: { left: 14, right: 14 },
        });
      }

      if (reportType === 'location-sales' && locationData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales by Location', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Location', 'Total Revenue', 'Services', 'Products', 'Transactions']],
          body: locationData.map(l => [
            l.name,
            `$${l.totalRevenue.toLocaleString()}`,
            l.totalServices.toLocaleString(),
            l.totalProducts.toLocaleString(),
            (l.totalServices + l.totalProducts).toLocaleString(),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [51, 51, 51] },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      const filename = `${reportType}-${dateFrom}-to-${dateTo}.pdf`;
      doc.save(filename);

      // Log to report history
      if (user) {
        await supabase.from('report_history').insert({
          report_type: reportType,
          report_name: getReportTitle(),
          date_from: dateFrom,
          date_to: dateTo,
          parameters: { locationId },
          generated_by: user.id,
        });
      }

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportCSV = () => {
    let csvContent = '';
    
    if (reportType === 'stylist-sales' && stylistData) {
      csvContent = 'Rank,Stylist,Total Revenue,Services,Avg Ticket\n';
      stylistData.forEach((s, idx) => {
        csvContent += `${idx + 1},"${s.name}",${s.totalRevenue},${s.totalServices},${Math.round(s.totalRevenue / s.totalServices || 0)}\n`;
      });
    } else if (reportType === 'location-sales' && locationData) {
      csvContent = 'Location,Total Revenue,Services,Products,Transactions\n';
      locationData.forEach(l => {
        csvContent += `"${l.name}",${l.totalRevenue},${l.totalServices},${l.totalProducts},${l.totalServices + l.totalProducts}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-${dateFrom}-to-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('CSV exported successfully');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {getReportTitle()}
            </CardTitle>
            <CardDescription>
              {format(new Date(dateFrom), 'MMM d, yyyy')} - {format(new Date(dateTo), 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-semibold">${metrics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Service Revenue</p>
              <p className="text-2xl font-semibold">${metrics.serviceRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-semibold">{metrics.totalServices.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Average Ticket</p>
              <p className="text-2xl font-semibold">${Math.round(metrics.averageTicket).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {reportType === 'stylist-sales' && stylistData && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Stylist</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="text-right">Avg Ticket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stylistData.slice(0, 15).map((s, idx) => (
                  <TableRow key={s.user_id}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-right">${s.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{s.totalServices}</TableCell>
                    <TableCell className="text-right">
                      ${Math.round(s.totalRevenue / s.totalServices || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {reportType === 'location-sales' && locationData && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationData.map((l) => (
                  <TableRow key={l.location_id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-right">${l.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{l.totalServices}</TableCell>
                    <TableCell className="text-right">{l.totalProducts}</TableCell>
                    <TableCell className="text-right">{l.totalServices + l.totalProducts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
