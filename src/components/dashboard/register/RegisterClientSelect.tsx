import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, X, Search, DollarSign } from 'lucide-react';
import { useClientSearch } from '@/hooks/useClientsData';
import { useClientBalance } from '@/hooks/useClientBalances';
import { BannedClientBadge } from '@/components/dashboard/clients/BannedClientBadge';
import { BannedClientAlert } from '@/components/dashboard/clients/BannedClientAlert';

interface RegisterClientSelectProps {
  selectedClientId: string | null;
  selectedClientName: string | null;
  onSelect: (clientId: string | null, clientName: string | null) => void;
  onApplyCredit: (amount: number) => void;
  appliedCredit: number;
  selectedClientBanned?: boolean;
  selectedClientBanReason?: string | null;
}

export function RegisterClientSelect({ 
  selectedClientId, 
  selectedClientName,
  onSelect, 
  onApplyCredit,
  appliedCredit,
  selectedClientBanned,
  selectedClientBanReason
}: RegisterClientSelectProps) {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: clients = [] } = useClientSearch(search, 10);
  const { data: balance } = useClientBalance(selectedClientId || '');

  const handleSelectClient = (client: any) => {
    onSelect(client.id, `${client.first_name} ${client.last_name}`);
    setSearch('');
    setShowSearch(false);
  };

  const handleClearClient = () => {
    onSelect(null, null);
    onApplyCredit(0);
  };

  const handleApplyCredit = () => {
    if (balance?.salon_credit_balance && balance.salon_credit_balance > 0) {
      onApplyCredit(balance.salon_credit_balance);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedClientId ? (
          <div className="space-y-3">
            {/* Banned Client Alert */}
            {selectedClientBanned && (
              <BannedClientAlert reason={selectedClientBanReason} />
            )}
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedClientName}</span>
                {selectedClientBanned && <BannedClientBadge />}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClearClient}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {balance && (balance.salon_credit_balance > 0 || balance.gift_card_balance > 0) && (
              <div className="space-y-2">
                {balance.salon_credit_balance > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credit Balance</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-600">
                        ${balance.salon_credit_balance.toFixed(2)}
                      </span>
                      {appliedCredit === 0 && (
                        <Button size="sm" variant="outline" className="h-7" onClick={handleApplyCredit}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {balance.gift_card_balance > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gift Card Balance</span>
                    <span className="font-medium">${balance.gift_card_balance.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            {showSearch ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {search && clients.length > 0 && (
                  <div className="max-h-40 overflow-auto border rounded-lg divide-y">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left p-2 hover:bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{client.first_name} {client.last_name}</p>
                          {(client as any).is_banned && <BannedClientBadge />}
                        </div>
                        {client.email && (
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)} className="w-full">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowSearch(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Add Client (Optional)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
