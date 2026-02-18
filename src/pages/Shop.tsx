import { useState, useMemo } from 'react';
import { usePublicOrg } from '@/contexts/PublicOrgContext';
import { usePublicProducts, usePublicProductCategories, usePublicProductBrands } from '@/hooks/usePublicProducts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { ShopLayout } from '@/components/shop/ShopLayout';
import { ProductCard } from '@/components/shop/ProductCard';
import { ProductFilters } from '@/components/shop/ProductFilters';
import { ProductDetailModal } from '@/components/shop/ProductDetailModal';
import { Layout } from '@/components/layout/Layout';
import { Loader2, ShoppingBag, StoreIcon } from 'lucide-react';
import type { Product } from '@/hooks/useProducts';

interface RetailSettings {
  enabled: boolean;
  [key: string]: unknown;
}

export default function Shop() {
  const { organization } = usePublicOrg();
  const { data: retailSettings, isLoading: loadingSettings } = useSiteSettings<RetailSettings>('website_retail');
  
  // TODO: detect full website enabled. For now check if homepage sections exist.
  // Simple heuristic: if the org has a website_url or site settings homepage enabled
  const [fullWebsiteEnabled] = useState(false); // Phase 1: always standalone mode
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading: loadingProducts } = usePublicProducts({
    organizationId: organization.id,
    search,
    category,
    brand,
  });
  const { data: categories = [] } = usePublicProductCategories(organization.id);
  const { data: brands = [] } = usePublicProductBrands(organization.id);

  const isLoading = loadingSettings || loadingProducts;
  const storeEnabled = retailSettings?.enabled ?? false;

  const content = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Store header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-medium mb-4">
          <ShoppingBag className="w-3.5 h-3.5" />
          Online Store
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">
          Shop Our Products
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Browse our curated selection of professional products, handpicked by our team.
        </p>
      </div>

      {/* Store unavailable */}
      {!isLoading && !storeEnabled && (
        <div className="text-center py-16">
          <StoreIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Store Unavailable</h2>
          <p className="text-sm text-muted-foreground">This salon's online store is not currently active.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Store content */}
      {!isLoading && storeEnabled && (
        <>
          {/* Filters */}
          <ProductFilters
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            selectedCategory={category}
            onCategoryChange={setCategory}
            brands={brands}
            selectedBrand={brand}
            onBrandChange={setBrand}
          />

          {/* Product grid */}
          {products && products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={setSelectedProduct} 
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-6">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <div className="text-center py-16 mt-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-foreground mb-2">No Products Available</h2>
              <p className="text-sm text-muted-foreground">
                {search || category !== 'all' || brand !== 'all'
                  ? 'No products match your filters. Try adjusting your search.'
                  : 'Check back soon — new products are on the way.'}
              </p>
            </div>
          )}

          {/* Detail modal */}
          <ProductDetailModal
            product={selectedProduct}
            open={!!selectedProduct}
            onOpenChange={(open) => !open && setSelectedProduct(null)}
          />
        </>
      )}
    </div>
  );

  // If full website is enabled, wrap with full Layout; otherwise use standalone ShopLayout
  if (fullWebsiteEnabled) {
    return <Layout>{content}</Layout>;
  }

  return <ShopLayout fullWebsiteEnabled={false}>{content}</ShopLayout>;
}
