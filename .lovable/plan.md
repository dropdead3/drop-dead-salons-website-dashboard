
# Product SKU Management & Register Scanning System

## Overview
Build a complete system for organizations to manage retail product SKUs/barcodes and scan products at a Point of Sale (POS) register. This includes a product inventory management page for assigning SKUs, a barcode scanning interface integrated into the checkout flow, and local retail sale recording.

## Current State
- **Database Ready**: The `products` table already has `sku` and `barcode` fields (currently populated via CSV import only)
- **No Product Management UI**: There's no dedicated page for viewing/editing products or assigning SKUs
- **Checkout is Service-Only**: `CheckoutSummarySheet` handles appointment finalization but doesn't support adding retail products
- **Transaction Recording**: Retail sales are synced from Phorest; no local retail sale recording exists

## System Architecture

### Database Changes

#### 1. Retail Sales Table (Local Sales Recording)
```sql
CREATE TABLE retail_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_id TEXT REFERENCES locations(id),
  client_id UUID REFERENCES phorest_clients(id),
  staff_id UUID REFERENCES auth.users(id),
  
  -- Totals
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method TEXT, -- 'card', 'cash', 'credit', 'giftcard'
  payment_status TEXT DEFAULT 'completed',
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Retail Sale Items Table
```sql
CREATE TABLE retail_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES retail_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. Add Index for SKU/Barcode Lookup
```sql
CREATE INDEX idx_products_sku ON products(organization_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_barcode ON products(organization_id, barcode) WHERE barcode IS NOT NULL;
```

### New Permissions
- `manage_inventory` - View and edit products, assign SKUs
- `process_retail_sales` - Use the register/POS to ring up products

---

## Implementation Phases

### Phase 1: Product Inventory Management Page

**New Route**: `/dashboard/inventory`

**Features**:
- Sortable/filterable product table with columns: Name, SKU, Barcode, Category, Brand, Price, Stock, Actions
- Inline editing of SKU and Barcode fields (quick-edit mode)
- Full product edit dialog for all fields
- Low stock warnings (highlight products below reorder level)
- Search by name, SKU, or barcode
- Filter by category, brand, location
- Bulk SKU assignment tool

**UI Mockup**:
```
+------------------------------------------------------------------+
| INVENTORY                                    [+ Add Product]      |
| Manage retail products and stock levels                           |
+------------------------------------------------------------------+
| [🔍 Search by name/SKU/barcode...]  [Category ▼] [Location ▼]    |
+------------------------------------------------------------------+
| NAME            SKU           BARCODE        PRICE    STOCK  ACT  |
|----------------------------------------------------------------------
| Olaplex No.3   OLAP-003     [Edit]          $28.00   12     [···] |
| K18 Mask       K18-MASK     8901234567890   $75.00   3 ⚠️   [···] |
| Purple Shampoo [+ Add SKU]  [+ Add Barcode] $24.00   8      [···] |
+------------------------------------------------------------------+
```

### Phase 2: Point of Sale / Register Page

**New Route**: `/dashboard/register`

**Features**:
- Barcode scanner input (auto-focus, listens for rapid keyboard input from USB scanner)
- Manual SKU/barcode search field
- Shopping cart with quantity adjustments
- Client selection (optional - for walk-ins)
- Staff attribution for commission tracking
- Tax calculation (uses location's tax rate)
- Payment method selection (Card, Cash, Salon Credit, Gift Card)
- Apply client credit/gift card balances
- Receipt generation (PDF)

**Barcode Scanner Logic**:
```typescript
// Detect barcode scanner input (rapid sequential keystrokes)
// USB scanners type very fast - detect 6+ chars within 50ms
const [scanBuffer, setScanBuffer] = useState('');
const [lastKeyTime, setLastKeyTime] = useState(0);

useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    const now = Date.now();
    if (now - lastKeyTime < 50) {
      setScanBuffer(prev => prev + e.key);
    } else {
      setScanBuffer(e.key);
    }
    setLastKeyTime(now);
    
    // On Enter, trigger lookup
    if (e.key === 'Enter' && scanBuffer.length > 5) {
      lookupProduct(scanBuffer);
      setScanBuffer('');
    }
  };
  window.addEventListener('keypress', handleKeyPress);
  return () => window.removeEventListener('keypress', handleKeyPress);
}, [scanBuffer, lastKeyTime]);
```

**UI Mockup**:
```
+------------------------------------------------------------------+
| REGISTER                                     Val Vista Location   |
+------------------------------------------------------------------+
| [🔍 Scan barcode or enter SKU...]              Staff: Jane Smith  |
+------------------------------------------------------------------+
|                                    |                              |
| CART (3 items)                     |  Client: Sarah Johnson       |
| ─────────────────────────────────  |  Credit Balance: $25.00      |
| Olaplex No.3        x2    $56.00   |                              |
|   [-] [2] [+]              [🗑️]    |  ─────────────────────────── |
|                                    |  Subtotal:        $131.00    |
| K18 Mask            x1    $75.00   |  Tax (8.5%):       $11.14    |
|   [-] [1] [+]              [🗑️]    |  Discount:          -$0.00   |
|                                    |  ─────────────────────────── |
|                                    |  TOTAL:           $142.14    |
|                                    |                              |
|                                    |  [Apply $25 Credit]          |
|                                    |                              |
|                                    |  Payment: [Card ▼]           |
|                                    |                              |
+------------------------------------------------------------------+
|              [Clear Cart]           [Complete Sale →]             |
+------------------------------------------------------------------+
```

### Phase 3: Checkout Integration

**Enhance `CheckoutSummarySheet`** to include retail add-ons:
- Add "Add Retail Products" section with scanner/search
- Show combined total (service + products + tax + tip)
- Record both appointment completion AND retail sale in single transaction

### Phase 4: Analytics Integration

- Update `ProductLeaderboard` to include local retail sales (not just Phorest sync)
- Add retail sales to Transactions page
- Show daily register sales in Command Center

---

## File Structure

```
src/
├── pages/dashboard/
│   ├── Inventory.tsx                      # Product management page
│   └── Register.tsx                       # POS/register page
├── components/dashboard/inventory/
│   ├── ProductTable.tsx                   # Sortable product table
│   ├── ProductEditDialog.tsx              # Full product editor
│   ├── SKUEditor.tsx                      # Inline SKU/barcode editor
│   ├── BulkSKUAssigner.tsx                # Bulk SKU assignment tool
│   └── LowStockAlert.tsx                  # Stock level warnings
├── components/dashboard/register/
│   ├── BarcodeScannerInput.tsx            # Scanner detection component
│   ├── ProductSearch.tsx                  # Manual product lookup
│   ├── RegisterCart.tsx                   # Shopping cart display
│   ├── CartItem.tsx                       # Individual cart item
│   ├── RegisterClientSelect.tsx           # Client picker
│   ├── PaymentMethodSelect.tsx            # Payment options
│   ├── RegisterTotals.tsx                 # Price summary
│   └── RegisterReceipt.tsx                # Receipt generation
├── hooks/
│   ├── useProducts.ts                     # Product CRUD operations
│   ├── useProductLookup.ts                # SKU/barcode search
│   ├── useRegisterCart.ts                 # Cart state management
│   └── useRetailSales.ts                  # Sale recording
```

---

## Technical Details

### Product Lookup Hook
```typescript
export function useProductLookup(organizationId: string) {
  return useMutation({
    mutationFn: async (query: string) => {
      // Try exact barcode match first
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('barcode', query)
        .eq('is_active', true)
        .maybeSingle();
      
      if (data) return data;
      
      // Try exact SKU match
      ({ data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('sku', query.toUpperCase())
        .eq('is_active', true)
        .maybeSingle());
      
      if (data) return data;
      
      // Fuzzy name search
      ({ data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(10));
      
      return data;
    }
  });
}
```

### Register Cart State
```typescript
interface CartItem {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface RegisterState {
  items: CartItem[];
  clientId: string | null;
  staffId: string;
  paymentMethod: 'card' | 'cash' | 'credit' | 'giftcard';
  discountAmount: number;
  appliedCredit: number;
}
```

### RLS Policies
```sql
-- Products: Staff can view, admin/manager can edit
CREATE POLICY "Staff can view products" ON products
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR 
         has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'stylist'));

CREATE POLICY "Admin/Manager can update products" ON products
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Retail sales: Staff can insert, admin can view all
CREATE POLICY "Staff can record sales" ON retail_sales
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR 
              has_role(auth.uid(), 'receptionist'));
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | Migration | New tables, indexes, permissions |
| Create | `src/pages/dashboard/Inventory.tsx` | Product management page |
| Create | `src/pages/dashboard/Register.tsx` | POS/register page |
| Create | `src/components/dashboard/inventory/*` | Inventory components |
| Create | `src/components/dashboard/register/*` | Register components |
| Create | `src/hooks/useProducts.ts` | Product CRUD hook |
| Create | `src/hooks/useProductLookup.ts` | SKU/barcode lookup hook |
| Create | `src/hooks/useRegisterCart.ts` | Cart state hook |
| Create | `src/hooks/useRetailSales.ts` | Sale recording hook |
| Modify | `src/App.tsx` | Add routes |
| Modify | `src/components/dashboard/DashboardLayout.tsx` | Add nav items |
| Modify | `src/components/dashboard/schedule/CheckoutSummarySheet.tsx` | Add retail products section |

---

## Edge Cases & Considerations

- **Duplicate SKUs**: Enforce unique SKU per organization with DB constraint
- **Barcode formats**: Support UPC-A, EAN-13, and custom codes
- **Inventory sync**: Flag locally-managed vs Phorest-synced products
- **Offline mode**: Consider localStorage cart persistence
- **Stock validation**: Warn if selling below available stock
- **Multi-location**: Products can be location-specific or organization-wide
- **Commission tracking**: Link sales to staff member for retail commission
