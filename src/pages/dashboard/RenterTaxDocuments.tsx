import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, DollarSign, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useBoothRenter } from '@/hooks/useBoothRenters';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TaxDocument {
  year: number;
  total_earnings: number;
  total_payments: number;
  document_url: string | null;
  generated_at: string | null;
}

export default function RenterTaxDocuments() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear - 1); // Default to last year

  const { data: renterProfile } = useBoothRenter(undefined);

  // Fetch tax summary data
  const { data: taxDocuments, isLoading } = useQuery({
    queryKey: ['renter-tax-documents', renterProfile?.id],
    queryFn: async () => {
      if (!renterProfile?.id) return [];

      // Get commission statements grouped by year
      const { data: statements } = await supabase
        .from('renter_commission_statements' as any)
        .select('period_start, total_commission, net_payout, status')
        .eq('booth_renter_id', renterProfile.id)
        .eq('status', 'paid');

      // Group by year
      const yearlyTotals = new Map<number, TaxDocument>();
      
      ((statements || []) as any[]).forEach((stmt: any) => {
        const year = new Date(stmt.period_start).getFullYear();
        const existing = yearlyTotals.get(year) || {
          year,
          total_earnings: 0,
          total_payments: 0,
          document_url: null,
          generated_at: null,
        };
        existing.total_earnings += stmt.total_commission;
        existing.total_payments += stmt.net_payout;
        yearlyTotals.set(year, existing);
      });

      return Array.from(yearlyTotals.values()).sort((a, b) => b.year - a.year);
    },
    enabled: !!renterProfile?.id,
  });

  const selectedYearData = taxDocuments?.find(d => d.year === selectedYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i);

  const requires1099 = (selectedYearData?.total_payments || 0) >= 600;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Documents</h1>
          <p className="text-muted-foreground">Access your 1099 forms and earnings summaries</p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="flex gap-4 items-center">
        <Label className="text-sm font-medium">Tax Year</Label>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedYear} Earnings Summary</CardTitle>
          <CardDescription>
            Commission earnings reported for tax purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded" />
            </div>
          ) : selectedYearData ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Commissions Earned</p>
                  <p className="text-3xl font-bold">${selectedYearData.total_earnings.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Payments Received</p>
                  <p className="text-3xl font-bold">${selectedYearData.total_payments.toFixed(2)}</p>
                </div>
              </div>

              {requires1099 ? (
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        1099-NEC Form Required
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your earnings exceed $600, so you'll receive a 1099-NEC form for tax filing.
                        This will be available by January 31st of the following year.
                      </p>
                      {selectedYearData.document_url ? (
                        <Button size="sm" className="mt-3" asChild>
                          <a href={selectedYearData.document_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download 1099-NEC
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="mt-2">
                          Document not yet available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">No 1099 Required</p>
                      <p className="text-sm text-muted-foreground">
                        Your earnings are below $600, so a 1099-NEC form is not required.
                        However, you may still need to report this income on your taxes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No earnings data for {selectedYear}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Years Summary */}
      {taxDocuments && taxDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Tax Years</CardTitle>
            <CardDescription>Historical earnings by year</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Total Earnings</TableHead>
                  <TableHead className="text-right">Total Payments</TableHead>
                  <TableHead>1099 Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxDocuments.map((doc) => (
                  <TableRow key={doc.year}>
                    <TableCell className="font-medium">{doc.year}</TableCell>
                    <TableCell className="text-right">${doc.total_earnings.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${doc.total_payments.toFixed(2)}</TableCell>
                    <TableCell>
                      {doc.total_payments >= 600 ? (
                        doc.document_url ? (
                          <Badge className="bg-green-500">Available</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )
                      ) : (
                        <Badge variant="outline">Not Required</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.document_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          This information is provided for reference only. Please consult with a tax professional 
          for advice regarding your specific tax situation.
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
