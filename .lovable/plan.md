

## Add Organization Context & Location Filtering to Import Flow

This plan ensures proper multi-tenant data isolation during imports by passing organization context through the import flow and filtering locations to only show those belonging to the selected organization.

---

### Overview

| Issue | Solution |
|-------|----------|
| Organization ID not passed to edge function | Add `organizationId` prop and include in API call |
| Locations show all orgs' locations | Filter `useLocations()` by `organizationId` |
| Location optional for client/appointment imports | Make location required for entity types needing isolation |

---

### Visual Changes

**Before:**
```text
Location Selection:
┌──────────────────────────────────────┐
│ Assign to Location (optional)        │
│ [Select a location...           ▼]   │
│ • No specific location               │
│ • Location A (Org 1)                 │
│ • Location B (Org 2) ← Wrong org!    │
└──────────────────────────────────────┘
```

**After:**
```text
Location Selection:
┌──────────────────────────────────────┐
│ ⚠ Assign to Location (required)      │
│ [Select a location...           ▼]   │
│ • Location A (Org 1 only)            │
│ • Location B (Org 1 only)            │
└──────────────────────────────────────┘
Note: Only shows locations for selected org
```

---

### Implementation

#### 1. Update Platform Import Page
**File:** `src/pages/dashboard/platform/PlatformImport.tsx`

Pass `organizationId` to the wizard when opened:

```typescript
<DataImportWizard
  open={wizardOpen}
  onOpenChange={setWizardOpen}
  sourceType={selectedOrg.source_software || 'csv'}
  dataType={selectedDataType}
  organizationId={selectedOrgId}  // NEW: Pass org ID
/>
```

---

#### 2. Update DataImportWizard Component
**File:** `src/components/admin/DataImportWizard.tsx`

**a) Add `organizationId` prop:**
```typescript
interface DataImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: string;
  dataType: string;
  organizationId?: string;  // NEW
}
```

**b) Filter locations by organization:**
```typescript
const { data: locations } = useLocations(organizationId);
```

**c) Define which entity types require location:**
```typescript
const LOCATION_REQUIRED_TYPES = ['clients', 'appointments', 'staff', 'products'];

const requiresLocation = LOCATION_REQUIRED_TYPES.includes(dataType);
```

**d) Update location selector UI:**
```typescript
<Label className="flex items-center gap-2">
  <MapPin className="w-4 h-4" />
  Assign to Location {requiresLocation ? '(required)' : '(optional)'}
  {requiresLocation && <span className="text-red-500">*</span>}
</Label>

<Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
  <SelectTrigger className={cn(
    requiresLocation && !selectedLocationId && "border-destructive"
  )}>
    <SelectValue placeholder="Select a location..." />
  </SelectTrigger>
  <SelectContent>
    {!requiresLocation && (
      <SelectItem value="">No specific location</SelectItem>
    )}
    {locations?.map(loc => (
      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
    ))}
  </SelectContent>
</Select>

{requiresLocation && !selectedLocationId && (
  <p className="text-xs text-destructive">
    Location is required for {dataType} imports to maintain data isolation
  </p>
)}
```

**e) Validate location before proceeding:**
```typescript
const canProceed = () => {
  if (requiresLocation && !selectedLocationId) return false;
  return file !== null;
};

// In upload step navigation:
<Button 
  onClick={() => setStep('mapping')} 
  disabled={!canProceed()}
>
  Continue
</Button>
```

**f) Include organizationId in edge function call:**
```typescript
const { data, error } = await supabase.functions.invoke('import-data', {
  body: {
    source_type: sourceType,
    entity_type: dataType,  // Fix: was data_type
    data: transformedData,   // Fix: was records
    location_id: selectedLocationId || undefined,
    organization_id: organizationId,  // NEW
    column_mappings: fieldMapping,     // Fix: was field_mapping
  },
});
```

---

#### 3. Edge Function Already Handles Organization
**File:** `supabase/functions/import-data/index.ts`

The edge function already accepts and uses `organization_id`:
```typescript
const { organization_id, location_id, data } = importData;

// Add organization if provided
if (organization_id) {
  mapped.organization_id = organization_id;
}
```

No changes needed to the edge function - it's already prepared for this.

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/dashboard/platform/PlatformImport.tsx` | **Edit** | Add `organizationId` prop to wizard |
| `src/components/admin/DataImportWizard.tsx` | **Edit** | Accept org prop, filter locations, require location for certain types, fix API payload keys |

---

### Data Flow Diagram

```text
PlatformImport.tsx                 DataImportWizard.tsx              Edge Function
      │                                    │                              │
      │ selectedOrgId ─────────────────────┤                              │
      │                                    │                              │
      │                                    │ useLocations(orgId)          │
      │                                    │──────────────────────────────│
      │                                    │ ← locations for this org     │
      │                                    │                              │
      │                                    │ User selects location        │
      │                                    │                              │
      │                                    │ invoke('import-data', {      │
      │                                    │   organization_id: orgId,    │──►│
      │                                    │   location_id: locId,        │   │
      │                                    │   data: [...],               │   │
      │                                    │ })                           │   │
      │                                    │                              │   │
      │                                    │                              │ INSERT INTO clients
      │                                    │                              │ (organization_id, location_id, ...)
```

---

### Technical Notes

**Entity types requiring location:**
- `clients` - Client base is per-location
- `appointments` - Appointments happen at a specific location
- `staff` - Staff assigned to locations
- `products` - Inventory tracked per-location

**Entity types where location is optional:**
- `services` - Service catalog is typically org-wide
- `locations` - You're importing the locations themselves

**API Payload Fix:**
The current wizard uses incorrect keys (`data_type`, `records`, `field_mapping`). The edge function expects (`entity_type`, `data`, `column_mappings`). This will be corrected as part of this implementation.

