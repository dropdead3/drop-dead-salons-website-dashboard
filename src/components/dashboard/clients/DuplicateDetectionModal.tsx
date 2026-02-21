import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, ExternalLink, GitMerge, UserPlus } from 'lucide-react';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

interface DuplicateMatch {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  last_visit_date: string | null;
  total_spend: number | null;
  match_type: string;
}

interface DuplicateDetectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateMatch[];
  onOpenExisting: (clientId: string) => void;
  onStartMerge: (clientId: string) => void;
  onCreateAnyway: () => void;
  canCreateAnyway?: boolean;
}

export function DuplicateDetectionModal({
  open,
  onOpenChange,
  duplicates,
  onOpenExisting,
  onStartMerge,
  onCreateAnyway,
  canCreateAnyway = true,
}: DuplicateDetectionModalProps) {
  const { formatCurrencyWhole } = useFormatCurrency();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Possible Duplicate Found
          </DialogTitle>
          <DialogDescription>
            A client with matching contact information already exists. Review before creating a new profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {duplicates.map(dup => (
            <div key={dup.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="font-display text-xs bg-primary/10">
                  {dup.first_name?.[0]}{dup.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-sm">{dup.first_name} {dup.last_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {dup.email && <span className="truncate">{dup.email}</span>}
                  {dup.mobile && <span>{dup.mobile}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatCurrencyWhole(Number(dup.total_spend || 0))} spend</span>
                  <Badge variant="outline" className="text-[10px]">
                    Match: {dup.match_type}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="outline" onClick={() => onOpenExisting(dup.id)} className="text-xs gap-1">
                  <ExternalLink className="w-3 h-3" /> Open
                </Button>
                <Button size="sm" variant="outline" onClick={() => onStartMerge(dup.id)} className="text-xs gap-1">
                  <GitMerge className="w-3 h-3" /> Merge
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          {canCreateAnyway && (
            <Button variant="outline" onClick={onCreateAnyway} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Create Anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
