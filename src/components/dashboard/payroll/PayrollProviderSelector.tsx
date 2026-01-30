import { DollarSign, Calculator, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePayrollConnection, PayrollProvider } from '@/hooks/usePayrollConnection';

interface ProviderOption {
  id: PayrollProvider;
  name: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  color: string;
}

const providers: ProviderOption[] = [
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Full-service payroll with tax compliance, benefits, and HR.',
    icon: DollarSign,
    features: ['Automated Tax Filing', 'Direct Deposit', 'W-2s & 1099s', 'Benefits Administration'],
    color: 'text-orange-500 bg-orange-500/10',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Payroll',
    description: 'Payroll integrated with QuickBooks accounting ecosystem.',
    icon: Calculator,
    features: ['QuickBooks Sync', 'Direct Deposit', 'Tax Filing', 'Accounting Integration'],
    color: 'text-green-500 bg-green-500/10',
  },
];

export function PayrollProviderSelector() {
  const { 
    providerStatus, 
    initiateConnection, 
    isConnecting 
  } = usePayrollConnection();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Choose Your Payroll Provider</h2>
        <p className="text-muted-foreground mt-2">
          Connect your preferred payroll service to manage employee payments, taxes, and compliance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isConfigured = providerStatus[provider.id];
          
          return (
            <Card 
              key={provider.id}
              className={cn(
                'relative overflow-hidden transition-all hover:shadow-lg',
                !isConfigured && 'opacity-60'
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn('p-3 rounded-xl', provider.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      {isConfigured ? (
                        <Badge variant="outline" className="text-green-600 border-green-600/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600/30">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Configured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {provider.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() => initiateConnection(provider.id)}
                  disabled={!isConfigured || isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : isConfigured ? (
                    `Connect ${provider.name}`
                  ) : (
                    'API Keys Required'
                  )}
                </Button>

                {!isConfigured && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Contact your administrator to configure {provider.name} credentials
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
        <p>
          <strong>Note:</strong> Only one payroll provider can be active at a time. 
          You can switch providers later, but existing payroll history will be preserved.
        </p>
      </div>
    </div>
  );
}
