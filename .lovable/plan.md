

# Standalone Salon Software Migration Plan

## ✅ Completed (Phase 1-3 Core)
- Schema normalization: `appointments`, `clients`, `services` tables created
- Data migrated from `phorest_*` tables with `external_id` and `import_source` tracking
- Internal booking engine: availability calculator, conflict detection, create/update functions
- Import system: `import_templates`, `import_jobs` tables + `import-data` edge function
- Data Import Wizard UI at `/dashboard/admin/import`
- New hooks: `useCalendar`, `useClientsData`, `useServicesData`

## 🔄 In Progress
- Refactoring existing components to use new normalized tables
- Analytics hooks migration

## 📋 Remaining Tasks
- Complete calendar component refactor
- Build manual checkout/sales recording flow
- Refactor analytics to use internal tables
- Service catalog management UI
- Phorest cleanup (after full migration)


## Executive Summary

Transform the current Phorest-dependent salon management system into a fully standalone platform with built-in data migration capabilities. This enables salons using any software (Phorest, Mindbody, Boulevard, Vagaro, Square, or custom systems) to migrate their historical data and begin using this platform independently.

---

## Current Phorest Dependency Scope

### Database Tables (10 tables)
| Table | Records | Purpose |
|-------|---------|---------|
| `phorest_appointments` | 127 | Booking calendar |
| `phorest_clients` | 504 | Client profiles & history |
| `phorest_services` | 66 | Service catalog |
| `phorest_staff_mapping` | 2 | Staff ID linking |
| `phorest_daily_sales_summary` | 0 | Revenue aggregation |
| `phorest_performance_metrics` | 0 | Staff analytics |
| `phorest_sales_transactions` | 0 | Transaction records |
| `phorest_transaction_items` | 0 | Line-item details |
| `phorest_staff_services` | - | Stylist qualifications |
| `phorest_sync_log` | - | Sync history |

### Edge Functions (12 Phorest-specific)
- `sync-phorest-data` - Main sync engine
- `sync-phorest-services` - Service catalog sync
- `create-phorest-booking` - Booking creation
- `create-phorest-client` - Client creation
- `update-phorest-appointment` - Status updates
- `update-phorest-appointment-time` - Rescheduling
- `check-phorest-availability` - Availability checks
- `test-phorest-connection` - Connection testing
- `calculate-preferred-stylists` - Client assignment

### Frontend Components (Key Phorest-dependent)
- Calendar views (Day/Week/Month/Agenda)
- Booking wizard & public booking
- Sales dashboard & analytics
- Client management (My Clients)
- Leaderboard & performance metrics
- Service catalog management

---

## Migration Strategy

### Phase 1: Schema Normalization

**Objective**: Rename `phorest_*` tables to generic names, remove Phorest-specific columns, and add import tracking fields.

| Current Table | New Table | Changes |
|---------------|-----------|---------|
| `phorest_appointments` | `appointments` | Remove `phorest_id`, `phorest_staff_id`, `phorest_client_id`; add `external_id`, `import_source` |
| `phorest_clients` | `clients` | Remove `phorest_client_id`, `phorest_branch_id`; add `external_id`, `import_source` |
| `phorest_services` | `services` | Remove `phorest_service_id`, `phorest_branch_id`; add `external_id`, `import_source` |
| `phorest_staff_mapping` | `staff_service_qualifications` | Restructure to link `user_id` to `service_id` directly |
| `phorest_daily_sales_summary` | `daily_sales_summary` | Keep structure, remove Phorest references |
| `phorest_sales_transactions` | `sales_transactions` | Remove Phorest IDs, add `external_id` |
| `phorest_transaction_items` | `transaction_items` | Remove Phorest IDs, add `external_id` |

**New Fields for Import Tracking**:
```
external_id TEXT        -- ID from source system
import_source TEXT      -- 'phorest', 'mindbody', 'boulevard', 'csv', 'manual'
imported_at TIMESTAMPTZ -- When record was imported
```

### Phase 2: Internal Booking Engine

**Objective**: Replace Phorest API calls with internal database operations.

**Components to Build**:

1. **Availability Calculator** (Database Function)
   - Input: staff_id, date, service_ids
   - Logic: Check existing appointments, business hours, blocked time
   - Output: Array of available time slots

2. **Conflict Detection** (Database Function)
   - Check for double-bookings, client overlaps, blocked time
   - Return validation result with conflict details

3. **Booking Creation** (Edge Function: `create-booking`)
   - Validate availability
   - Create appointment record
   - Send confirmation notifications
   - Return booking confirmation

4. **Booking Modification** (Edge Function: `update-booking`)
   - Reschedule appointments
   - Cancel bookings
   - Update status (check-in, complete, no-show)

### Phase 3: Data Import Engine

**Objective**: Build a multi-source data migration system.

**Supported Import Sources**:
| Source | Format | Data Types |
|--------|--------|------------|
| Phorest | CSV Export | Clients, Appointments, Services, Transactions |
| Mindbody | CSV/API | Clients, Appointments, Sales |
| Boulevard | CSV | Clients, Appointments, Staff |
| Vagaro | CSV | Clients, Services |
| Square Appointments | CSV | All |
| Generic CSV | Custom Mapping | Flexible |

**Import System Architecture**:

1. **Import Templates** (Database Table: `import_templates`)
   - Pre-defined column mappings for each source
   - Field transformation rules
   - Validation rules

2. **Import Jobs** (Database Table: `import_jobs`)
   - Track import progress
   - Store errors/warnings
   - Support resume/retry

3. **Field Mapper UI** (Component: `DataImportWizard`)
   - Step 1: Select source type
   - Step 2: Upload file(s)
   - Step 3: Map columns to schema
   - Step 4: Preview & validate
   - Step 5: Execute import
   - Step 6: Review results

4. **Edge Function: `import-data`**
   - Parse uploaded CSV/JSON
   - Apply field mappings
   - Validate data integrity
   - Batch insert with conflict handling
   - Return import summary

### Phase 4: Native Features (Previously Phorest-Dependent)

**Objective**: Rebuild functionality that relied on Phorest sync.

1. **Sales Recording** (new workflow)
   - Manual checkout flow
   - POS integration option (Square, Stripe)
   - Tip recording
   - Payment method tracking

2. **Revenue Analytics** (rebuilt queries)
   - Use internal `sales_transactions` table
   - Daily/weekly/monthly aggregation
   - Staff performance metrics
   - Service category breakdown

3. **Client History** (enhanced)
   - Visit timeline
   - Service history
   - Spend tracking
   - Formula/notes storage

4. **Service Catalog Management** (admin UI)
   - Add/edit services
   - Category organization
   - Pricing tiers by stylist level
   - Duration settings

### Phase 5: Phorest Removal & Cleanup

**Objective**: Remove all Phorest-specific code and secrets.

**Files to Delete**:
- All edge functions in `supabase/functions/` with `phorest` in the name
- `src/hooks/usePhorestSync.ts`
- `src/hooks/usePhorestAvailability.ts`
- `src/hooks/usePhorestCalendar.ts` (refactor to use new tables)
- `src/components/dashboard/PhorestSyncButton.tsx`
- `src/components/dashboard/PhorestSyncPopout.tsx`
- `src/pages/dashboard/admin/PhorestSettings.tsx`

**Secrets to Remove**:
- PHOREST_USERNAME
- PHOREST_API_KEY
- PHOREST_BUSINESS_ID

**Code Updates Required**:
- All calendar components to use `appointments` table
- All client queries to use `clients` table
- All service queries to use `services` table
- Booking wizard to use internal edge functions
- Sales dashboard to use internal analytics

---

## Build Tasks for Dashboard Build Page

The following tasks should be added to the `build_tasks` table to track this migration:

### Category: Schema Migration
| Key | Title | Priority | Status |
|-----|-------|----------|--------|
| `schema-appointments` | Migrate phorest_appointments to appointments | High | Pending |
| `schema-clients` | Migrate phorest_clients to clients | High | Pending |
| `schema-services` | Migrate phorest_services to services | High | Pending |
| `schema-transactions` | Normalize sales transaction tables | Medium | Pending |
| `schema-staff-qualifications` | Restructure staff service mappings | Medium | Pending |

### Category: Internal Booking Engine
| Key | Title | Priority | Status |
|-----|-------|----------|--------|
| `booking-availability` | Build availability calculator function | High | Pending |
| `booking-conflicts` | Build conflict detection system | High | Pending |
| `booking-create` | Create internal booking edge function | High | Pending |
| `booking-update` | Create booking modification edge function | Medium | Pending |
| `booking-calendar-refactor` | Refactor calendar to use new tables | High | Pending |

### Category: Data Import System
| Key | Title | Priority | Status |
|-----|-------|----------|--------|
| `import-templates-table` | Create import templates database table | High | Pending |
| `import-jobs-table` | Create import jobs tracking table | High | Pending |
| `import-wizard-ui` | Build data import wizard component | High | Pending |
| `import-edge-function` | Create import-data edge function | High | Pending |
| `import-phorest-template` | Phorest CSV import template | Medium | Pending |
| `import-mindbody-template` | Mindbody import template | Medium | Pending |
| `import-boulevard-template` | Boulevard import template | Medium | Pending |
| `import-generic-csv` | Generic CSV import with custom mapping | Medium | Pending |

### Category: Native Features
| Key | Title | Priority | Status |
|-----|-------|----------|--------|
| `checkout-flow` | Build manual checkout/sales recording | High | Pending |
| `analytics-refactor` | Refactor analytics to use internal tables | High | Pending |
| `service-catalog-admin` | Service catalog management UI | Medium | Pending |
| `client-profile-enhance` | Enhanced client profile with internal history | Medium | Pending |

### Category: Phorest Removal
| Key | Title | Priority | Status |
|-----|-------|----------|--------|
| `cleanup-edge-functions` | Delete Phorest edge functions | Low | Blocked |
| `cleanup-hooks` | Remove Phorest-specific React hooks | Low | Blocked |
| `cleanup-components` | Remove Phorest UI components | Low | Blocked |
| `cleanup-secrets` | Remove Phorest API secrets | Low | Blocked |
| `cleanup-settings-page` | Remove Phorest settings page | Low | Blocked |

**Note**: Cleanup tasks are blocked by completion of all migration tasks.

---

## Implementation Sequence

```text
Week 1-2: Schema Migration
  ├─ Create new tables with updated schema
  ├─ Write data migration scripts
  ├─ Migrate existing data with import tracking
  └─ Update database functions (preferred stylist, etc.)

Week 3-4: Internal Booking Engine
  ├─ Build availability calculator
  ├─ Build conflict detection
  ├─ Create booking edge functions
  └─ Refactor calendar components

Week 5-6: Data Import System
  ├─ Design import template schema
  ├─ Build import wizard UI
  ├─ Create import edge function
  └─ Build source-specific templates

Week 7-8: Native Features & Polish
  ├─ Build checkout flow
  ├─ Refactor analytics
  ├─ Enhance client profiles
  └─ Complete service management

Week 9: Cleanup & Testing
  ├─ Remove Phorest code
  ├─ End-to-end testing
  ├─ Migration documentation
  └─ User training materials
```

---

## Technical Considerations

### Data Migration Safety
- Keep `phorest_*` tables during transition
- Use views to abstract table renames
- Implement soft-delete for rollback capability

### Multi-Salon Support
- All new tables include `location_id` for multi-location filtering
- Import system should support per-location imports

### External System IDs
- Store original IDs in `external_id` for reference
- Enables future re-sync or data reconciliation

### API Future-Proofing
- Design internal edge functions with same patterns
- Could add integrations later without refactoring

