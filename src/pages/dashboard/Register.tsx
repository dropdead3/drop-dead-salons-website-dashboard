import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  CreditCard,
  Trash2,
  UserPlus,
  Receipt
} from 'lucide-react';
import { useProductLookup } from '@/hooks/useProductLookup';
import { useRegisterCart } from '@/hooks/useRegisterCart';
import { useCreateRetailSale } from '@/hooks/useRetailSales';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { RegisterCart } from '@/components/dashboard/register/RegisterCart';
import { RegisterTotals } from '@/components/dashboard/register/RegisterTotals';
import { RegisterClientSelect } from '@/components/dashboard/register/RegisterClientSelect';
import { PaymentMethodSelect } from '@/components/dashboard/register/PaymentMethodSelect';
import { ProductSearchResults } from '@/components/dashboard/register/ProductSearchResults';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Register() {
  const [scanInput, setScanInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const { effectiveOrganization } = useOrganizationContext();
  const productLookup = useProductLookup();
  const createSale = useCreateRetailSale();
  const {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    setClient,
    setStaff,
    setPaymentMethod,
    setAppliedCredit,
    clearCart,
    subtotal,
    taxAmount,
    total,
    itemCount,
  } = useRegisterCart();

  // Set current user as staff on mount
  useEffect(() => {
    if (user?.id) {
      setStaff(user.id);
    }
  }, [user?.id, setStaff]);

  // Barcode scanner detection - listens for rapid keystrokes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if typing in the input field
      if (document.activeElement === inputRef.current) return;
      
      const now = Date.now();
      
      if (now - lastKeyTimeRef.current < 50) {
        scanBufferRef.current += e.key;
      } else {
        scanBufferRef.current = e.key;
      }
      lastKeyTimeRef.current = now;

      // On Enter, trigger lookup if buffer has content
      if (e.key === 'Enter' && scanBufferRef.current.length > 5) {
        e.preventDefault();
        handleLookup(scanBufferRef.current.replace('Enter', ''));
        scanBufferRef.current = '';
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const handleLookup = async (query: string) => {
    if (!query.trim()) return;

    try {
      const result = await productLookup.mutateAsync(query);
      
      if (result.product) {
        addItem(result.product);
        setScanInput('');
        setShowResults(false);
        toast.success(`Added ${result.product.name}`);
      } else if (result.matches.length > 0) {
        setSearchResults(result.matches);
        setShowResults(true);
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Lookup failed');
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(scanInput);
  };

  const handleCompleteSale = async () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      await createSale.mutateAsync({
        organizationId: effectiveOrganization?.id || profile?.organization_id || '',
        locationId: profile?.location_id || '',
        cart,
        items: cart.items,
        subtotal,
        taxAmount,
        total,
      });
      clearCart();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Scanner & Cart */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Scanner Input */}
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleInputSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    placeholder="Scan barcode or enter SKU..."
                    value={scanInput}
                    onChange={(e) => {
                      setScanInput(e.target.value);
                      if (e.target.value.length > 2) {
                        handleLookup(e.target.value);
                      } else {
                        setShowResults(false);
                      }
                    }}
                    className="pr-20"
                    autoCapitalize="none"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Press Enter
                  </span>
                </div>
              </form>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <ProductSearchResults
                  results={searchResults}
                  onSelect={(product) => {
                    addItem(product);
                    setScanInput('');
                    setShowResults(false);
                    toast.success(`Added ${product.name}`);
                  }}
                  onClose={() => setShowResults(false)}
                />
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Cart ({itemCount} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[calc(100%-4rem)]">
              <RegisterCart
                items={cart.items}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Totals & Payment */}
        <div className="lg:w-80 flex flex-col gap-4">
          {/* Client Selection */}
          <RegisterClientSelect
            selectedClientId={cart.clientId}
            selectedClientName={cart.clientName}
            onSelect={setClient}
            onApplyCredit={setAppliedCredit}
            appliedCredit={cart.appliedCredit}
          />

          {/* Totals */}
          <RegisterTotals
            subtotal={subtotal}
            taxAmount={taxAmount}
            taxRate={cart.taxRate}
            appliedCredit={cart.appliedCredit}
            total={total}
          />

          {/* Payment Method */}
          <PaymentMethodSelect
            value={cart.paymentMethod}
            onChange={setPaymentMethod}
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            <Button
              size="lg"
              className="w-full"
              onClick={handleCompleteSale}
              disabled={cart.items.length === 0 || createSale.isPending}
            >
              <Receipt className="w-4 h-4 mr-2" />
              {createSale.isPending ? 'Processing...' : `Complete Sale - $${total.toFixed(2)}`}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={clearCart}
              disabled={cart.items.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
