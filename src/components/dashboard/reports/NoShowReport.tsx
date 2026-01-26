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
import { FileText, Download, Loader2, FileSpreadsheet, Clock } from 'lucide-react';
import { useNoShowReport } from '@/hooks/useNoShowReport';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NoShowReportProps {
  reportType: string;
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  onClose: () => void;
}

export function NoShowReport({ 
  reportType, 
  dateFrom, 
  dateTo, 
  locationId,
  onClose 
}: NoShowReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  
  const { data: noShowData, isLoading } = useNoShowReport(dateFrom, dateTo, locationId);

  const getReportTitle = () => {
    switch (reportType) {
      case 'no-show': return 'No-Show Report';
      case 'service-duration': return 'Service Duration Analysis';
      case 'lead-time': return 'Appointment Lead Time';
      default: return 'Operations Report';
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
      if (noShowData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: [
            ['Total Appointments', noShowData.totalAppointments.toLocaleString()],
            ['No-Shows', noShowData.noShows.toLocaleString()],
            ['No-Show Rate', `${noShowData.noShowRate.toFixed(1)}%`],
            ['Cancellations', noShowData.cancellations.toLocaleString()],
            ['Cancellation Rate', `${noShowData.cancellationRate.toFixed(1)}%`],
            ['Revenue Lost (Est.)', `$${noShowData.revenueLost.toLocaleString()}`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [51, 51, 51] },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 15;

        // By Day of Week
        if (noShowData.byDayOfWeek && noShowData.byDayOfWeek.length > 0) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('No-Shows by Day of Week', 14, y);
          y += 8;

          autoTable(doc, {
            startY: y,
            head: [['Day', 'Total Appts', 'No-Shows', 'No-Show Rate']],
            body: noShowData.byDayOfWeek.map(day => [
              day.dayName,
              day.total.toString(),
              day.noShows.toString(),
              `${day.rate.toFixed(1)}%`,
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
    if (!noShowData?.byDayOfWeek) return;
    
    let csvContent = 'Day,Total Appointments,No-Shows,No-Show Rate\n';
    noShowData.byDayOfWeek.forEach(day => {
      csvContent += `"${day.dayName}",${day.total},${day.noShows},${day.rate.toFixed(1)}\n`;
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
        {noShowData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-semibold">{noShowData.totalAppointments.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">No-Show Rate</p>
                <p className="text-2xl font-semibold text-red-500">{noShowData.noShowRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                <p className="text-2xl font-semibold text-amber-500">{noShowData.cancellationRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Est. Revenue Lost</p>
                <p className="text-2xl font-semibold text-red-500">${noShowData.revenueLost.toLocaleString()}</p>
              </div>
            </div>

            {/* By Day of Week */}
            {noShowData.byDayOfWeek && noShowData.byDayOfWeek.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-medium">No-Shows by Day of Week</h3>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead className="text-right">Total Appts</TableHead>
                        <TableHead className="text-right">No-Shows</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noShowData.byDayOfWeek.map((day) => (
                        <TableRow key={day.dayName}>
                          <TableCell className="font-medium">{day.dayName}</TableCell>
                          <TableCell className="text-right">{day.total}</TableCell>
                          <TableCell className="text-right">{day.noShows}</TableCell>
                          <TableCell className="text-right">
                            <span className={day.rate > 10 ? 'text-red-500' : day.rate > 5 ? 'text-amber-500' : ''}>
                              {day.rate.toFixed(1)}%
                            </span>
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
            <p>No appointment data available for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
