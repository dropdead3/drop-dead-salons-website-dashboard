import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Download, TrendingUp, Clock } from 'lucide-react';
import { CampaignPerformance, formatSourceName, formatMediumName } from '@/hooks/useMarketingAnalytics';

interface CampaignPerformanceTableProps {
  campaigns: CampaignPerformance[];
  isLoading?: boolean;
}

type SortField = 'campaign' | 'totalLeads' | 'converted' | 'conversionRate' | 'totalRevenue';
type SortDirection = 'asc' | 'desc';

export function CampaignPerformanceTable({ campaigns, isLoading }: CampaignPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'campaign') {
      return multiplier * a.campaign.localeCompare(b.campaign);
    }
    return multiplier * (a[sortField] - b[sortField]);
  });

  const handleExport = () => {
    const headers = ['Campaign', 'Source', 'Medium', 'Leads', 'Conversions', 'Conv %', 'Revenue', 'Avg Response (hrs)'];
    const rows = sortedCampaigns.map(c => [
      c.campaign,
      c.source,
      c.medium,
      c.totalLeads,
      c.converted,
      `${c.conversionRate.toFixed(1)}%`,
      `$${c.totalRevenue.toLocaleString()}`,
      c.avgResponseTime.toFixed(1),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign-performance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 -ml-2"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (isLoading) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">CAMPAIGN PERFORMANCE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Loading campaigns...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">CAMPAIGN PERFORMANCE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No campaigns with UTM tracking found</p>
            <p className="text-xs mt-1">Add utm_campaign parameters to your marketing links</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg">CAMPAIGN PERFORMANCE</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="campaign">Campaign</SortButton>
                </TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Medium</TableHead>
                <TableHead className="text-right">
                  <SortButton field="totalLeads">Leads</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="converted">Conv.</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="conversionRate">Conv %</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="totalRevenue">Revenue</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3" />
                    Resp. Hrs
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.map((campaign) => (
                <TableRow key={campaign.campaign}>
                  <TableCell className="font-medium">{campaign.campaign}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {formatSourceName(campaign.source)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {formatMediumName(campaign.medium)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{campaign.totalLeads}</TableCell>
                  <TableCell className="text-right tabular-nums">{campaign.converted}</TableCell>
                  <TableCell className="text-right">
                    <span className={campaign.conversionRate >= 20 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                      {campaign.conversionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    ${campaign.totalRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {campaign.avgResponseTime > 0 ? campaign.avgResponseTime.toFixed(1) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
