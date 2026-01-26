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
import { FileText, Download, Loader2, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { useCapacityReport } from '@/hooks/useCapacityReport';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CapacityReportProps {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  onClose: () => void;
}

export function CapacityReport({ 
  dateFrom, 
  dateTo, 
  locationId,
  onClose 
}: CapacityReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  
  const { data: capacityData, isLoading } = useCapacityReport(dateFrom, dateTo, locationId);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Capacity Utilization Report', pageWidth / 2, y, { align: 'center' });
      
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
      if (capacityData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: [
            ['Total Appointments', capacityData.totalAppointments.toLocaleString()],
            ['Total Booked Hours', `${capacityData.totalBookedHours.toFixed(1)} hrs`],
            ['Average Utilization', `${capacityData.avgUtilization.toFixed(1)}%`],
            ['Peak Hour', capacityData.peakHour],
            ['Busiest Day', capacityData.busiestDay],
          ],
          theme: 'striped',
          headStyles: { fillColor: [51, 51, 51] },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 15;

        // By Hour
        if (capacityData.byHour && capacityData.byHour.length > 0) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Utilization by Hour', 14, y);
          y += 8;

          autoTable(doc, {
            startY: y,
            head: [['Hour', 'Appointments', 'Utilization']],
            body: capacityData.byHour.map(hour => [
              hour.hour,
              hour.appointments.toString(),
              `${hour.utilization.toFixed(1)}%`,
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

      const filename = `capacity-report-${dateFrom}-to-${dateTo}.pdf`;
      doc.save(filename);

      // Log to report history
      if (user) {
        await supabase.from('report_history').insert({
          report_type: 'capacity',
          report_name: 'Capacity Utilization Report',
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
    if (!capacityData?.byHour) return;
    
    let csvContent = 'Hour,Appointments,Utilization\n';
    capacityData.byHour.forEach(hour => {
      csvContent += `"${hour.hour}",${hour.appointments},${hour.utilization.toFixed(1)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `capacity-report-${dateFrom}-to-${dateTo}.csv`;
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
              Capacity Utilization Report
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
        {capacityData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-semibold">{capacityData.totalAppointments.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Avg Utilization</p>
                <p className="text-2xl font-semibold">{capacityData.avgUtilization.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-2xl font-semibold">{capacityData.peakHour}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Busiest Day</p>
                <p className="text-2xl font-semibold">{capacityData.busiestDay}</p>
              </div>
            </div>

            {/* By Hour */}
            {capacityData.byHour && capacityData.byHour.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-medium">Utilization by Hour</h3>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hour</TableHead>
                        <TableHead className="text-right">Appointments</TableHead>
                        <TableHead className="text-right">Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {capacityData.byHour.map((hour) => (
                        <TableRow key={hour.hour}>
                          <TableCell className="font-medium">{hour.hour}</TableCell>
                          <TableCell className="text-right">{hour.appointments}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(hour.utilization, 100)}%` }}
                                />
                              </div>
                              <span className="w-12 text-right">{hour.utilization.toFixed(0)}%</span>
                            </div>
                          </TableCell>
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
            <p>No capacity data available for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
