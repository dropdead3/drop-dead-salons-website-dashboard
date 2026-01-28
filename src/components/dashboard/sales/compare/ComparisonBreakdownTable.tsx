import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ComparisonResult } from '@/hooks/useComparisonData';

interface ComparisonBreakdownTableProps {
  data: ComparisonResult | undefined;
  isLoading: boolean;
  periodALabel?: string;
  periodBLabel?: string;
}

export function ComparisonBreakdownTable({ 
  data, 
  isLoading,
  periodALabel = 'Period A',
  periodBLabel = 'Period B',
}: ComparisonBreakdownTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const rows = [
    {
      metric: 'Total Revenue',
      periodA: data.periodA.totalRevenue,
      periodB: data.periodB.totalRevenue,
      change: data.changes.totalRevenue,
      format: (v: number) => `$${v.toLocaleString()}`,
    },
    {
      metric: 'Service Revenue',
      periodA: data.periodA.serviceRevenue,
      periodB: data.periodB.serviceRevenue,
      change: data.changes.serviceRevenue,
      format: (v: number) => `$${v.toLocaleString()}`,
    },
    {
      metric: 'Product Revenue',
      periodA: data.periodA.productRevenue,
      periodB: data.periodB.productRevenue,
      change: data.changes.productRevenue,
      format: (v: number) => `$${v.toLocaleString()}`,
    },
    {
      metric: 'Transactions',
      periodA: data.periodA.totalTransactions,
      periodB: data.periodB.totalTransactions,
      change: data.changes.totalTransactions,
      format: (v: number) => v.toLocaleString(),
    },
    {
      metric: 'Avg Ticket',
      periodA: data.periodA.averageTicket,
      periodB: data.periodB.averageTicket,
      change: data.changes.averageTicket,
      format: (v: number) => `$${Math.round(v)}`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display">DETAILED BREAKDOWN</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">{periodALabel}</TableHead>
              <TableHead className="text-right">{periodBLabel}</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isPositive = row.change > 0;
              const isNeutral = row.change === 0;

              return (
                <TableRow key={row.metric}>
                  <TableCell className="font-medium">{row.metric}</TableCell>
                  <TableCell className="text-right font-display">{row.format(row.periodA)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.format(row.periodB)}</TableCell>
                  <TableCell className={cn(
                    'text-right font-medium',
                    isNeutral ? 'text-muted-foreground' : isPositive ? 'text-chart-2' : 'text-destructive'
                  )}>
                    {isPositive ? '+' : ''}{row.change.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    {isNeutral ? (
                      <Minus className="w-4 h-4 mx-auto text-muted-foreground" />
                    ) : isPositive ? (
                      <ArrowUpRight className="w-4 h-4 mx-auto text-chart-2" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 mx-auto text-destructive" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
