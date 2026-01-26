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
import { FileText, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { useStaffKPIReport } from '@/hooks/useStaffKPIReport';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffKPIReportProps {
  reportType: string;
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  onClose: () => void;
}

export function StaffKPIReport({ 
  reportType, 
  dateFrom, 
  dateTo, 
  locationId,
  onClose 
}: StaffKPIReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  
  const { data: kpiData, isLoading } = useStaffKPIReport(dateFrom, dateTo, locationId);

  const getReportTitle = () => {
    switch (reportType) {
      case 'staff-kpi': return 'Staff KPI Report';
      case 'productivity': return 'Productivity Report';
      case 'rebooking': return 'Rebooking Analysis';
      case 'new-clients': return 'New Client Acquisition';
      default: return 'Staff Report';
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF('landscape');
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

      // KPI Table
      if (kpiData && kpiData.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Staff', 'Revenue', 'Services', 'Avg Ticket', 'Rebooking %', 'Retention %', 'New Clients']],
          body: kpiData.map(staff => [
            staff.staffName,
            `$${staff.totalRevenue.toLocaleString()}`,
            staff.totalServices.toString(),
            `$${Math.round(staff.averageTicket).toLocaleString()}`,
            `${staff.rebookingRate.toFixed(1)}%`,
            `${staff.retentionRate.toFixed(1)}%`,
            staff.newClients.toString(),
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
    if (!kpiData) return;
    
    let csvContent = 'Staff,Revenue,Services,Avg Ticket,Rebooking %,Retention %,New Clients\n';
    kpiData.forEach(staff => {
      csvContent += `"${staff.staffName}",${staff.totalRevenue},${staff.totalServices},${Math.round(staff.averageTicket)},${staff.rebookingRate.toFixed(1)},${staff.retentionRate.toFixed(1)},${staff.newClients}\n`;
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
      <CardContent>
        {kpiData && kpiData.length > 0 ? (
          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="text-right">Avg Ticket</TableHead>
                  <TableHead className="text-right">Rebooking %</TableHead>
                  <TableHead className="text-right">Retention %</TableHead>
                  <TableHead className="text-right">New Clients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpiData.map((staff) => (
                  <TableRow key={staff.staffId}>
                    <TableCell className="font-medium">{staff.staffName}</TableCell>
                    <TableCell className="text-right">${staff.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{staff.totalServices}</TableCell>
                    <TableCell className="text-right">${Math.round(staff.averageTicket).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{staff.rebookingRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{staff.retentionRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{staff.newClients}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No staff performance data available for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
