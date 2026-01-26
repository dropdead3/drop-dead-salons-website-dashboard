import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface ReportCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  onSelect: (id: string) => void;
}

export function ReportCard({ id, name, description, icon: Icon, onSelect }: ReportCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onSelect(id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardTitle className="text-base font-medium mt-3">{name}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button variant="ghost" size="sm" className="w-full justify-center">
          Generate Report
        </Button>
      </CardContent>
    </Card>
  );
}
