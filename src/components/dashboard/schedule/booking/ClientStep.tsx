import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { PhorestClient } from './BookingWizard';
import { cn } from '@/lib/utils';

interface ClientStepProps {
  clients: PhorestClient[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectClient: (client: PhorestClient) => void;
  onNewClient: () => void;
}

export function ClientStep({
  clients,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectClient,
  onNewClient,
}: ClientStepProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={onNewClient}
            title="Add new client"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Client list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                {searchQuery ? 'No clients found' : 'Start typing to search clients'}
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2 text-primary"
                onClick={onNewClient}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Add new client
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {clients.map((client) => (
                <button
                  key={client.id}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left',
                    'hover:bg-muted/70 active:bg-muted transition-colors'
                  )}
                  onClick={() => onSelectClient(client)}
                >
                  <Avatar className="h-10 w-10 bg-muted">
                    <AvatarFallback className="text-xs font-medium text-muted-foreground bg-muted">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{client.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {formatPhone(client.phone) || client.email || 'No contact info'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}
