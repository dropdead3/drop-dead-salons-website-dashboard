

## Add Missing Import Data Categories

This plan expands the data migration system to include **Staff**, **Locations**, and **Products** import categories, with the Products category requiring a new database table.

---

### Overview

The current import system supports 3 categories: Clients, Services, and Appointments. Based on the analysis of existing tables and common migration needs, we'll add:

| Category | Database Table | Status |
|----------|---------------|--------|
| Staff/Stylists | `employee_profiles` | Table exists - add import support |
| Locations | `locations` | Table exists - add import support |
| Products | `products` | New table required |

---

### Visual Changes

The Platform Import page will show 6 import options instead of 3:

```text
+-------------+  +-------------+  +-------------+
|   Clients   |  |   Services  |  |Appointments |
| [Start]     |  | [Start]     |  | [Start]     |
+-------------+  +-------------+  +-------------+
|    Staff    |  |  Locations  |  |  Products   |
| [Start]     |  | [Start]     |  | [Start]     |
+-------------+  +-------------+  +-------------+
```

---

### Implementation

#### 1. Create Products Table (Database Migration)

A new `products` table for retail inventory:

```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  location_id TEXT REFERENCES locations(id),
  
  -- Core product info
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  brand TEXT,
  description TEXT,
  
  -- Pricing
  retail_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  
  -- Inventory
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_level INTEGER,
  
  -- Import tracking
  external_id TEXT,
  import_source TEXT,
  imported_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for platform admins
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

---

#### 2. Update Import Types Array
**File:** `src/pages/dashboard/platform/PlatformImport.tsx`

Expand the `importTypes` array to include the new categories:

```typescript
const importTypes = [
  { value: 'clients', label: 'Clients', description: 'Import customer data', icon: Users },
  { value: 'services', label: 'Services', description: 'Import service catalog', icon: Scissors },
  { value: 'appointments', label: 'Appointments', description: 'Import booking history', icon: Calendar },
  { value: 'staff', label: 'Staff', description: 'Import team members', icon: UserCog },
  { value: 'locations', label: 'Locations', description: 'Import salon branches', icon: MapPin },
  { value: 'products', label: 'Products', description: 'Import retail inventory', icon: Package },
];
```

---

#### 3. Add Field Definitions to Import Wizard
**File:** `src/components/admin/DataImportWizard.tsx`

Add field mappings for the new entity types:

```typescript
const FIELD_DEFINITIONS = {
  // ... existing clients, services, appointments ...
  
  staff: [
    { field: 'full_name', label: 'Full Name', required: true },
    { field: 'email', label: 'Email', required: false },
    { field: 'phone', label: 'Phone', required: false },
    { field: 'hire_date', label: 'Hire Date', required: false },
    { field: 'stylist_level', label: 'Level/Tier', required: false },
    { field: 'specialties', label: 'Specialties', required: false },
    { field: 'bio', label: 'Bio', required: false },
    { field: 'external_id', label: 'External ID', required: false },
  ],
  
  locations: [
    { field: 'name', label: 'Location Name', required: true },
    { field: 'address', label: 'Address', required: true },
    { field: 'city', label: 'City', required: true },
    { field: 'state_province', label: 'State/Province', required: false },
    { field: 'phone', label: 'Phone', required: true },
    { field: 'hours', label: 'Hours', required: false },
    { field: 'store_number', label: 'Store Number', required: false },
  ],
  
  products: [
    { field: 'name', label: 'Product Name', required: true },
    { field: 'sku', label: 'SKU', required: false },
    { field: 'barcode', label: 'Barcode', required: false },
    { field: 'category', label: 'Category', required: false },
    { field: 'brand', label: 'Brand', required: false },
    { field: 'retail_price', label: 'Retail Price', required: false },
    { field: 'cost_price', label: 'Cost Price', required: false },
    { field: 'quantity_on_hand', label: 'Quantity', required: false },
    { field: 'external_id', label: 'External ID', required: false },
  ],
};
```

---

#### 4. Update Edge Function
**File:** `supabase/functions/import-data/index.ts`

Extend the entity type and add validation for new categories:

```typescript
interface ImportRequest {
  // Update type to include new entities
  entity_type: 'clients' | 'appointments' | 'services' | 'staff' | 'locations' | 'products';
  // ... rest unchanged
}

// Add validation cases in the switch statement:
case 'staff':
  if (!mapped.full_name) {
    isValid = false;
    validationError = 'Missing staff full_name';
  }
  // Staff imports need special handling - they go to employee_profiles
  // but require a user_id, so we may need to create placeholder users
  break;

case 'locations':
  if (!mapped.name || !mapped.address || !mapped.city || !mapped.phone) {
    isValid = false;
    validationError = 'Missing required location fields (name, address, city, phone)';
  }
  // Generate ID if not provided
  if (!mapped.id) {
    mapped.id = crypto.randomUUID();
  }
  break;

case 'products':
  if (!mapped.name) {
    isValid = false;
    validationError = 'Missing product name';
  }
  break;
```

**Note:** Staff import has a complexity - `employee_profiles` requires a `user_id` FK to `auth.users`. For migration purposes, we could:
- Create placeholder auth users, or
- Use a separate `imported_staff` staging table, or
- Skip direct employee_profiles import and document manual staff creation

The recommended approach is to import staff data to a staging area and have admins manually link or create user accounts.

---

#### 5. Add Default Import Templates (Database Migration)

Insert system templates for new categories:

```sql
INSERT INTO import_templates (name, description, source_type, entity_type, is_system_template, column_mappings) VALUES
-- Generic Staff
('Generic Staff CSV', 'Import staff from any CSV', 'generic', 'staff', true, '[
  {"source": "name", "target": "full_name", "required": true},
  {"source": "email", "target": "email", "required": false},
  {"source": "phone", "target": "phone", "required": false},
  {"source": "hire_date", "target": "hire_date", "required": false, "transform": "date"}
]'::JSONB),

-- Generic Locations
('Generic Locations CSV', 'Import locations from any CSV', 'generic', 'locations', true, '[
  {"source": "name", "target": "name", "required": true},
  {"source": "address", "target": "address", "required": true},
  {"source": "city", "target": "city", "required": true},
  {"source": "phone", "target": "phone", "required": true}
]'::JSONB),

-- Generic Products
('Generic Products CSV', 'Import products from any CSV', 'generic', 'products', true, '[
  {"source": "name", "target": "name", "required": true},
  {"source": "sku", "target": "sku", "required": false},
  {"source": "category", "target": "category", "required": false},
  {"source": "price", "target": "retail_price", "required": false, "transform": "decimal"},
  {"source": "quantity", "target": "quantity_on_hand", "required": false, "transform": "integer"}
]'::JSONB);
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| Database Migration | **Create** | Add `products` table with RLS policies |
| Database Migration | **Insert** | Add import templates for Staff, Locations, Products |
| `src/pages/dashboard/platform/PlatformImport.tsx` | **Edit** | Add 3 new import type cards with icons |
| `src/components/admin/DataImportWizard.tsx` | **Edit** | Add field definitions for staff, locations, products |
| `supabase/functions/import-data/index.ts` | **Edit** | Add validation and handling for new entity types |

---

### Technical Considerations

#### Staff Import Complexity
The `employee_profiles` table requires a `user_id` foreign key to `auth.users`. Since we cannot create auth users during CSV import, staff import will:
1. Target the `products` table (not `employee_profiles`)
2. For actual staff migration, recommend using the existing staff creation flow or a separate staging approach

Alternatively, we can create an `imported_staff` staging table that doesn't require auth.users, allowing the migration team to review and manually onboard staff.

#### Organization Scoping
All imports should include `organization_id` to ensure proper tenant isolation. The edge function will need to receive this from the wizard.

---

### UI Layout Update

The import cards will be displayed in a 2-row, 3-column grid:

```tsx
<div className="grid gap-4 md:grid-cols-3">
  {importTypes.map((type) => (
    <PlatformCard key={type.value} variant="interactive">
      {/* Card content with icon, label, description, and Start Import button */}
    </PlatformCard>
  ))}
</div>
```

