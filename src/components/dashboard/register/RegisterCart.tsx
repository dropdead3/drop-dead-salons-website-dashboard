import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '@/hooks/useRegisterCart';

interface RegisterCartProps {
  items: CartItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function RegisterCart({ items, onRemove, onUpdateQuantity }: RegisterCartProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <p className="text-sm">Cart is empty</p>
        <p className="text-xs mt-1">Scan a product or search to add items</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.productId}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            {item.sku && (
              <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
            )}
            <p className="text-sm text-muted-foreground">
              ${item.unitPrice.toFixed(2)} each
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <p className="w-20 text-right font-semibold">
              ${(item.unitPrice * item.quantity - item.discount).toFixed(2)}
            </p>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onRemove(item.productId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
