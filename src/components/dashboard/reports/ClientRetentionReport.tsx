import { useState } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useClientRetentionReport } from '@/hooks/useClientRetentionReport';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientRetentionReportProps {
  reportType: string;
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  onClose: () => void;
}

export function ClientRetentionReport({ 
  reportType, 
  dateFrom, 
  dateTo, 
  locationId,
  onClose 
}: ClientRetentionReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  
  const { data: retentionData, isLoading } = useClientRetentionReport(dateFrom, dateTo, locationId);

  const getReportTitle = () => {
    switch (reportType) {
      case 'retention': return 'Client Retention Report';
      case 'lifetime-value': return 'Client Lifetime Value';
      case 'new-vs-returning': return 'New vs Returning Clients';
      case 'visit-frequency': return 'Visit Frequency Analysis';
      default: return 'Client Report';
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
      
      doc.setTextColor(0);
      y += 15;

      // Summary
      if (retentionData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: [
            ['Total Clients', retentionData.totalClients.toLocaleString()],
            ['New Clients', retentionData.newClients.toLocaleString()],
            ['Returning Clients', retentionData.returningClients.toLocaleString()],
            ['Retention Rate', `${retentionData.retentionRate.toFixed(1)}%`],
            ['At-Risk Clients', retentionData.atRiskClients.toLocaleString()],
            ['Average LTV', `$${Math.round(retentionData.averageLTV).toLocaleString()}`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [51, 51, 51] },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 15;

        // At-Risk Clients Table
        if (retentionData.atRiskClientsList && retentionData.atRiskClientsList.length > 0) {
          if (y > 220) {
            doc.addPage();
            y = 20;
          }

          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('At-Risk Clients', 14, y);
          y += 8;

          autoTable(doc, {
            startY: y,
            head: [['Client', 'Last Visit', 'Days Since', 'Total Spend']],
            body: retentionData.atRiskClientsList.slice(0, 20).map(client => [
              client.name,
              format(new Date(client.lastVisit), 'MMM d, yyyy'),
              client.daysSinceVisit.toString(),
              `$${client.totalSpend.toLocaleString()}`,
            ]),
            theme: 'striped',
            headStyles: { fillColor: [51, 51, 51] },
            margin: { left: 14, right: 14 },
          });
        }
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
    if (!retentionData?.atRiskClientsList) return;
    
    let csvContent = 'Client,Last Visit,Days Since,Total Spend\n';
    retentionData.atRiskClientsList.forEach(client => {
      csvContent += `"${client.name}","${format(new Date(client.lastVisit), 'yyyy-MM-dd')}",${client.daysSinceVisit},${client.totalSpend}\n`;
    });

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
        {retentionData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-semibold">{retentionData.totalClients.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-semibold">{retentionData.retentionRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">New Clients</p>
                <p className="text-2xl font-semibold">{retentionData.newClients.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Average LTV</p>
                <p className="text-2xl font-semibold">${Math.round(retentionData.averageLTV).toLocaleString()}</p>
              </div>
            </div>

            {/* At-Risk Clients */}
            {retentionData.atRiskClientsList && retentionData.atRiskClientsList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-medium">At-Risk Clients ({retentionData.atRiskClients})</h3>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Last Visit</TableHead>
                        <TableHead className="text-right">Days Since</TableHead>
                        <TableHead className="text-right">Total Spend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retentionData.atRiskClientsList.slice(0, 10).map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{format(new Date(client.lastVisit), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <span className={client.daysSinceVisit > 90 ? 'text-red-500' : 'text-amber-500'}>
                              {client.daysSinceVisit} days
                            </span>
                          </TableCell>
                          <TableCell className="text-right">${client.totalSpend.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No client data available for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
