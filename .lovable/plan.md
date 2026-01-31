

## Import Error Recovery & Rollback System

This plan adds comprehensive error recovery capabilities to the data import system, allowing the platform team to safely re-import data after correcting mistakes.

---

### Current State Analysis

**What exists today:**
| Feature | Status |
|---------|--------|
| Import job tracking (`import_jobs` table) | Exists - records job status, errors, counts |
| Data lineage fields (`external_id`, `import_source`, `imported_at`) | Exists on all importable tables |
| Rollback/undo functionality | Does NOT exist |
| Dry run/preview mode | Does NOT exist |
| Re-import capability | Does NOT exist |

**The Problem:**
If an import has mapping mistakes or bad data, there's currently no way to:
1. Preview what will be imported before committing
2. Roll back/delete all records from a specific import
3. Re-run an import with corrected data

---

### Proposed Features

#### 1. Import Job ID Tracking (Critical Foundation)

Add an `import_job_id` column to all importable tables to enable precise rollback.

**Why needed:** Currently records only have `import_source` and `imported_at`, which isn't precise enough. Two imports on the same day would be indistinguishable.

**Tables to update:**
- `clients`
- `services`
- `appointments`
- `products`
- `locations`
- `imported_staff`

```sql
ALTER TABLE clients ADD COLUMN import_job_id UUID REFERENCES import_jobs(id);
ALTER TABLE services ADD COLUMN import_job_id UUID REFERENCES import_jobs(id);
-- etc.
```

---

#### 2. Dry Run / Preview Mode

Add a "Validate Only" option to the import wizard that:
- Runs all validation logic
- Returns counts and errors
- Does NOT insert any data

**Benefits:**
- Catch field mapping errors before importing
- See exactly what will be imported
- Identify validation failures upfront

**UI Addition:**
```text
┌─────────────────────────────────────┐
│ Import Options                      │
│                                     │
│ [●] Import data (live)              │
│ [○] Dry run (validate only)         │
│                                     │
│ Dry run will validate your data and │
│ show what would be imported without │
│ making any changes.                 │
└─────────────────────────────────────┘
```

---

#### 3. Rollback Functionality

Add ability to delete all records from a specific import job.

**New edge function: `rollback-import`**
```typescript
// DELETE FROM clients WHERE import_job_id = ?
// DELETE FROM services WHERE import_job_id = ?
// etc.
```

**Safety features:**
- Confirmation dialog with record counts
- Only allow rollback within 30 days
- Mark job as "rolled_back" status
- Log who performed the rollback

---

#### 4. Re-Import Workflow

Enable running a corrected import after rollback.

**Options:**
1. **Rollback + Re-import**: Delete old data, import fresh
2. **Upsert mode**: Update existing records by `external_id`, insert new ones

For upsert mode, the edge function would:
```typescript
// If external_id exists, UPDATE
// If external_id doesn't exist, INSERT
const { error } = await supabase
  .from(targetTable)
  .upsert(mapped, { onConflict: 'external_id,organization_id' });
```

---

### Visual Changes

#### Import History (Enhanced)

```text
┌────────────────────────────────────────────────────────────────────┐
│ Recent Imports                                                      │
├────────────────────────────────────────────────────────────────────┤
│ ● Clients from phorest          Jan 30, 2026 2:15 PM               │
│   ✓ 156 imported, 3 failed                   [View] [Rollback]     │
│                                                                     │
│ ● Services from csv             Jan 30, 2026 1:45 PM               │
│   ✓ 45 imported                              [View] [Rollback]     │
│                                                                     │
│ ○ Clients from phorest          Jan 29, 2026 10:00 AM              │
│   ↩ Rolled back by admin@...                 [View] [Re-import]    │
└────────────────────────────────────────────────────────────────────┘
```

#### Rollback Confirmation Dialog

```text
┌────────────────────────────────────────────────────────────┐
│ ⚠ Confirm Rollback                                          │
│                                                             │
│ This will permanently delete 156 client records that were  │
│ imported on Jan 30, 2026 at 2:15 PM.                        │
│                                                             │
│ Organization: Salon XYZ                                     │
│ Location: Downtown Branch                                   │
│                                                             │
│ This action cannot be undone.                               │
│                                                             │
│                    [Cancel]    [Confirm Rollback]           │
└────────────────────────────────────────────────────────────┘
```

---

### Implementation

#### Phase 1: Database Schema Updates

**File: Database Migration**

Add `import_job_id` to all importable tables:

```sql
-- Add import_job_id to enable precise rollback
ALTER TABLE clients ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES import_jobs(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES import_jobs(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES import_jobs(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES import_jobs(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES import_jobs(id);
ALTER TABLE imported_staff ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES import_jobs(id);

-- Add rollback tracking to import_jobs
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMPTZ;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS rolled_back_by UUID REFERENCES auth.users(id);

-- Create indexes for efficient rollback queries
CREATE INDEX IF NOT EXISTS idx_clients_import_job ON clients(import_job_id);
CREATE INDEX IF NOT EXISTS idx_services_import_job ON services(import_job_id);
CREATE INDEX IF NOT EXISTS idx_appointments_import_job ON appointments(import_job_id);
CREATE INDEX IF NOT EXISTS idx_products_import_job ON products(import_job_id);
CREATE INDEX IF NOT EXISTS idx_locations_import_job ON locations(import_job_id);
CREATE INDEX IF NOT EXISTS idx_imported_staff_import_job ON imported_staff(import_job_id);
```

---

#### Phase 2: Update Import Edge Function

**File: `supabase/functions/import-data/index.ts`**

Add dry run mode and include job ID in records:

```typescript
interface ImportRequest {
  // ... existing fields
  dry_run?: boolean;  // NEW: validate only, don't insert
}

// In the processing loop:
mapped.import_job_id = jobId;  // NEW: link record to job

// NEW: Skip actual insert if dry run
if (dry_run) {
  // Just validate, don't insert
  successCount++;
  continue;
}
```

---

#### Phase 3: Create Rollback Edge Function

**File: `supabase/functions/rollback-import/index.ts`**

New edge function to delete records by job ID:

```typescript
interface RollbackRequest {
  job_id: string;
}

// 1. Verify job exists and is eligible for rollback
// 2. Delete records from appropriate table based on entity_type
// 3. Update job status to 'rolled_back'
// 4. Return summary of deleted records
```

---

#### Phase 4: Update DataImportWizard

**File: `src/components/admin/DataImportWizard.tsx`**

Add dry run toggle and result preview:

```typescript
const [isDryRun, setIsDryRun] = useState(false);

// In upload step, add toggle:
<div className="flex items-center gap-2">
  <Switch checked={isDryRun} onCheckedChange={setIsDryRun} />
  <Label>Dry run (validate only)</Label>
</div>

// In API call:
body: {
  ...existing,
  dry_run: isDryRun,
}
```

---

#### Phase 5: Add Rollback UI to Import History

**Files:**
- `src/pages/dashboard/platform/PlatformImport.tsx` (add history section)
- `src/pages/dashboard/admin/DataImport.tsx` (enhance history)

Add rollback button to each job with confirmation dialog:

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Undo className="w-4 h-4 mr-1" />
      Rollback
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    {/* Confirmation with record count */}
  </AlertDialogContent>
</AlertDialog>
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| Database Migration | **Create** | Add `import_job_id` to tables, rollback tracking to jobs |
| `supabase/functions/import-data/index.ts` | **Edit** | Add dry_run mode, include job_id in records |
| `supabase/functions/rollback-import/index.ts` | **Create** | New edge function for rollback |
| `src/components/admin/DataImportWizard.tsx` | **Edit** | Add dry run toggle |
| `src/pages/dashboard/platform/PlatformImport.tsx` | **Edit** | Add import history with rollback buttons |
| `src/pages/dashboard/admin/DataImport.tsx` | **Edit** | Add rollback buttons to history |

---

### Data Flow for Rollback

```text
User clicks "Rollback"
        │
        ▼
┌─────────────────────┐
│ Confirmation Dialog │
│ "Delete 156 clients │
│  from this import?" │
└─────────────────────┘
        │ Confirm
        ▼
┌─────────────────────────────────────┐
│ Edge Function: rollback-import      │
│                                     │
│ 1. Fetch job (verify exists)        │
│ 2. Check job.entity_type            │
│ 3. DELETE FROM clients              │
│    WHERE import_job_id = job.id     │
│ 4. UPDATE import_jobs               │
│    SET status = 'rolled_back',      │
│        rolled_back_at = now()       │
│ 5. Return { deleted_count: 156 }    │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────┐
│ Success Toast       │
│ "156 records deleted│
│  Import rolled back"│
└─────────────────────┘
```

---

### Technical Considerations

#### Rollback Eligibility Rules
- Only allow rollback for jobs with status `completed` or `failed`
- Consider time limit (e.g., 30 days) to prevent accidental deletion of old data
- Platform admins only (not salon admins)

#### Upsert Mode Considerations
For re-imports where you want to UPDATE existing + INSERT new:
- Requires unique constraint on `(external_id, organization_id)`
- More complex but avoids needing rollback first
- Can be added as Phase 2 enhancement

#### Foreign Key Constraints
When rolling back appointments, check for related records:
- Appointment → Client relationship
- Consider CASCADE or preventing rollback if dependencies exist

---

### Implementation Priority

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Add `import_job_id` tracking | Low |
| 2 | Dry run / preview mode | Medium |
| 3 | Rollback functionality | Medium |
| 4 | Rollback UI + confirmation | Medium |
| 5 | Upsert mode for re-imports | Higher (optional) |

This provides a complete error recovery system while maintaining data integrity and audit trails.

