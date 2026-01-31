import { Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ProductSearchResultsProps {
  results: Product[];
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export function ProductSearchResults({ results, onSelect, onClose }: ProductSearchResultsProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <span className="text-xs text-muted-foreground">{results.length} results</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="divide-y">
        {results.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            className="w-full text-left p-3 hover:bg-muted/50 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{product.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {product.sku && <span className="font-mono">{product.sku}</span>}
                {product.brand && <span>• {product.brand}</span>}
              </div>
            </div>
            <span className="font-semibold">
              ${product.retail_price?.toFixed(2) || '0.00'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
