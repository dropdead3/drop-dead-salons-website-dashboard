
# Service Communication Flows Configuration

## Overview

This implementation adds the ability to configure custom communication flows (email and SMS) for each service offered. Admins can define which templates are sent at specific trigger points (booking confirmation, reminder, follow-up) per service, with the option to use default templates or service-specific overrides.

## Architecture

The system follows a **junction table pattern** (consistent with `phorest_staff_services` and `role_permissions`) to link services to communication templates with trigger-based configuration.

```text
+-------------------+       +---------------------------+       +------------------+
| phorest_services  |       | service_communication_    |       | email_templates  |
|-------------------|       |      flows                |       |------------------|
| id (PK)           |<----->| service_id (FK)           |------>| id (PK)          |
| name              |       | email_template_id (FK)    |       | template_key     |
| category          |       | sms_template_id (FK)      |       | name             |
+-------------------+       | trigger_type              |       +------------------+
                            | timing_offset_minutes     |
                            | is_active                 |       +------------------+
                            +---------------------------+       | sms_templates    |
                                                                |------------------|
                                                                | id (PK)          |
                                                                | template_key     |
                                                                | name             |
                                                                +------------------+
```

## Database Schema

### New Table: `service_communication_flows`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| service_id | uuid | NOT NULL | FK to phorest_services.id |
| trigger_type | text | NOT NULL | Event type: `booking_confirmed`, `reminder_24h`, `reminder_2h`, `follow_up_24h`, `follow_up_7d` |
| email_template_id | uuid | NULL | FK to email_templates.id (optional) |
| sms_template_id | uuid | NULL | FK to sms_templates.id (optional) |
| timing_offset_minutes | integer | 0 | Minutes before/after trigger (negative = before) |
| is_active | boolean | true | Enable/disable this flow |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last modified |

### Trigger Types (Enum)

| Value | Description |
|-------|-------------|
| `booking_confirmed` | Sent immediately when appointment is booked |
| `reminder_24h` | Sent 24 hours before appointment |
| `reminder_2h` | Sent 2 hours before appointment |
| `follow_up_24h` | Sent 24 hours after appointment |
| `follow_up_7d` | Sent 7 days after appointment |

### RLS Policies

```sql
-- Authenticated users can read flows (needed for booking confirmations)
CREATE POLICY "Allow read for authenticated" ON service_communication_flows
  FOR SELECT TO authenticated USING (true);

-- Admins can manage flows
CREATE POLICY "Allow admin full access" ON service_communication_flows
  FOR ALL TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));
```

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useServiceCommunicationFlows.ts` | Create | CRUD hooks for managing flows |
| `src/components/dashboard/ServiceCommunicationFlowEditor.tsx` | Create | Dialog for configuring flows per service |
| `src/components/dashboard/ServiceCommunicationFlowsList.tsx` | Create | Display configured flows in a table |
| `src/pages/dashboard/admin/ServicesManager.tsx` | Modify | Add "Configure Communications" action to each service |
| `src/hooks/useSettingsLayout.ts` | Modify | Add 'service-flows' as subcategory under Communications |
| `src/pages/dashboard/admin/Settings.tsx` | Modify | Add Communications Flows overview card |

## Component Design

### 1. Service Row Enhancement (ServicesManager.tsx)

Each service row in the accordion gains a new action button:

```text
+-------------------------------------------+
| Haircut & Blowout                    [★] [✎] [📧] |
|                                           |
| "Classic cut with styling"                |
+-------------------------------------------+
         ↑ New icon button opens communication flow dialog
```

### 2. Communication Flow Editor Dialog

```text
+--------------------------------------------------+
| 📧 Communication Flows: Haircut & Blowout         |
|--------------------------------------------------|
| Trigger Point         | Email        | SMS      |
|--------------------------------------------------|
| ☑ Booking Confirmed   | [Confirm ▼]  | [Confirm ▼] |
| ☑ Reminder (24h)      | [Reminder ▼] | [Reminder ▼] |
| ☐ Reminder (2h)       | [None ▼]     | [Running ▼]  |
| ☐ Follow-up (24h)     | [None ▼]     | [None ▼]     |
| ☐ Follow-up (7d)      | [None ▼]     | [None ▼]     |
|--------------------------------------------------|
| [Preview Email] [Preview SMS]      [Cancel] [Save] |
+--------------------------------------------------+
```

**Features:**
- Checkbox to enable/disable each trigger point
- Dropdown selects from existing email/SMS templates
- "None" option skips that channel for the trigger
- Preview buttons show the selected template with sample data
- Changes saved per-service

### 3. Communications Settings Card

A new card in Communications section showing an overview of all service flows:

```text
+--------------------------------------------------+
| SERVICE COMMUNICATION FLOWS                       |
| Configure automated messages per service          |
|--------------------------------------------------|
| 12 services with custom flows                    |
| 8 using default templates                        |
|                                                  |
| [View All Services →]                            |
+--------------------------------------------------+
```

Clicking "View All Services" navigates to `/dashboard/admin/services`.

## Hook Design

### `useServiceCommunicationFlows.ts`

```typescript
// Types
interface ServiceCommunicationFlow {
  id: string;
  service_id: string;
  trigger_type: 'booking_confirmed' | 'reminder_24h' | 'reminder_2h' | 'follow_up_24h' | 'follow_up_7d';
  email_template_id: string | null;
  sms_template_id: string | null;
  timing_offset_minutes: number;
  is_active: boolean;
  // Joined data
  email_template?: { id: string; name: string; template_key: string };
  sms_template?: { id: string; name: string; template_key: string };
}

// Exports
export function useServiceCommunicationFlows(serviceId?: string)
export function useUpsertServiceFlow()
export function useDeleteServiceFlow()
export function useServicesWithFlowsCount()
```

## Integration with ServicesManager

The existing ServicesManager displays services from the static `servicePricing.ts` file. To properly integrate:

1. **Match by name**: Link `phorest_services` entries to their flows using service name matching (since ServicesManager uses static data)
2. **Add action button**: Each service item gets a mail icon that opens the flow editor
3. **Badge indicator**: Services with custom flows show a small badge

```typescript
// In service item row
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  onClick={(e) => {
    e.stopPropagation();
    setConfigureFlowsService(item);
  }}
>
  <Mail className={cn(
    "w-4 h-4",
    hasCustomFlows && "text-primary"
  )} />
</Button>
```

## Default Flow Configuration

To simplify setup, the system provides "smart defaults":

| Trigger | Default Email | Default SMS |
|---------|---------------|-------------|
| booking_confirmed | appointment_confirmation | appointment_confirmation |
| reminder_24h | (none) | appointment_reminder |
| reminder_2h | (none) | (none) |
| follow_up_24h | (none) | (none) |
| follow_up_7d | (none) | (none) |

Services without explicit flow configuration inherit these defaults. Custom flows override defaults.

## Technical Notes

### Service ID Resolution

Since `ServicesManager` uses static data from `servicePricing.ts`, we need to resolve to `phorest_services.id`:

```typescript
// Look up the phorest_services entry by name
const { data: phorestService } = await supabase
  .from('phorest_services')
  .select('id')
  .eq('name', serviceName)
  .maybeSingle();
```

This allows flows to work with the Phorest-synced services.

### Future Integration Points

The database structure supports future automation:
- Cron job fetches upcoming appointments, checks for flows, and triggers edge functions
- Edge functions send emails/SMS using the configured templates
- Delivery tracking via additional status columns

## Execution Order

1. **Database Migration**: Create `service_communication_flows` table with constraints
2. **Create Hook**: `useServiceCommunicationFlows.ts`
3. **Create Flow Editor**: `ServiceCommunicationFlowEditor.tsx`
4. **Update ServicesManager**: Add configuration button per service
5. **Update Settings**: Add overview card in Communications section
6. **Seed Default Flows**: (Optional) Pre-configure common services with defaults
