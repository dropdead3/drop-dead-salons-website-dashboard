import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  Plus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useProducts, useProductCategories } from '@/hooks/useProducts';
import { useLocations } from '@/hooks/useLocations';
import { ProductTable } from '@/components/dashboard/inventory/ProductTable';
import { ProductEditDialog } from '@/components/dashboard/inventory/ProductEditDialog';
import { cn } from '@/lib/utils';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [locationId, setLocationId] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: products = [], isLoading, refetch } = useProducts({
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    locationId: locationId !== 'all' ? locationId : undefined,
    lowStockOnly,
  });

  const { data: categories = [] } = useProductCategories();
  const { data: locations = [] } = useLocations();

  const lowStockCount = products.filter(
    p => p.reorder_level && p.quantity_on_hand !== null && p.quantity_on_hand < p.reorder_level
  ).length;

  const totalValue = products.reduce(
    (sum, p) => sum + (p.retail_price || 0) * (p.quantity_on_hand || 0),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Inventory
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage retail products, SKUs, and stock levels
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-display font-semibold">{products.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Inventory Value</p>
            <p className="text-2xl font-display font-semibold">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-2xl font-display font-semibold">{categories.length}</p>
          </Card>
          <Card className="p-4 cursor-pointer" onClick={() => setLowStockOnly(!lowStockOnly)}>
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className={cn(
              "text-2xl font-display font-semibold flex items-center gap-2",
              lowStockCount > 0 && "text-amber-600"
            )}>
              {lowStockCount}
              {lowStockCount > 0 && <AlertTriangle className="w-5 h-5" />}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  autoCapitalize="none"
                />
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {lowStockOnly && (
                <Badge variant="secondary" className="h-10 px-4 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Low Stock Only
                  <button onClick={() => setLowStockOnly(false)} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Table */}
        <ProductTable 
          products={products}
          isLoading={isLoading}
          onEdit={(id) => setEditingProduct(id)}
        />

        {/* Edit Dialog */}
        <ProductEditDialog
          productId={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />

        {/* Add Dialog */}
        <ProductEditDialog
          productId={null}
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      </div>
    </DashboardLayout>
  );
}
