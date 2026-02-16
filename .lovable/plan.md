

# Service Communication Flows System

## The Core Design Decision: Independent Flows, Consolidated Delivery

After reviewing the appointments table (one service per row), the services table (7 categories: Blonding, Color, Extensions, Extras, Haircut, Consultation, Styling), and the existing automation infrastructure, here is the recommended approach:

**Each service defines its own communication flow independently, but emails scheduled for the same client on the same day are merged into a single combined email at send time.**

This is the best approach because:

- A client who gets Blonding + Extensions in one visit needs BOTH color aftercare AND extension maintenance instructions -- these are genuinely different content
- Blonding might need a "How's your color holding up?" check-in at 3 weeks, while Extensions need a "Time for a maintenance appointment" at 6 weeks -- these SHOULD be separate emails because they fire on different days
- The only real consolidation problem is same-day sends (e.g., day-of prep emails for 2 services, or day-after care instructions for 2 services booked together)
- Appointment reminders ("Your appointment is tomorrow at 2pm") are NOT service-specific and belong to a separate, simpler system

## How It Works

### Service Communication Flows

Salon owners/super admins configure flows per service (or per service category as a default). Each flow has ordered steps:

```text
Example: "Blonding" Flow
  Step 1: 2 days before  | "Prep for your color appointment"
  Step 2: 2 hours before | "See you soon! Quick reminders..."
  Step 3: 1 day after    | "Color aftercare instructions"
  Step 4: 21 days after  | "How's your color? Time for a refresh?"

Example: "Extensions" Flow
  Step 1: 3 days before  | "Prepare for your extension appointment"
  Step 2: 1 day after    | "Extension care guide"
  Step 3: 42 days after  | "Extension maintenance reminder"
```

### Same-Day Consolidation

When the processor runs, it groups all pending step emails for the same client + same day into one combined email:

```text
Subject: "Getting ready for your visit tomorrow"
Body:
  Section 1: "For your Blonding appointment..."
  Section 2: "For your Extensions appointment..."
```

If the steps fire on different days (e.g., 21-day color check-in vs 42-day extension reminder), they send as separate emails -- which is correct because they are genuinely different communications.

### Appointment Reminders (Separate System)

Appointment reminders are NOT part of service flows. They are a simple time-based system:

- 24 hours before: reminder with date, time, stylist, location, all services listed
- 2 hours before: "See you soon" with parking/directions (location-specific)

These always consolidate all services for that visit into one reminder. They pull location-specific content (address, parking notes, directions) automatically.

### Location-Specific Content

Each flow step can have location-specific overrides. For example, "Prep for your color appointment" might include different parking instructions or arrival procedures per location. The system uses a fallback chain:

1. Location-specific step content (if configured)
2. Organization-level step content (default)

## Database Schema

### Table: `service_email_flows`

Defines which services have communication flows.

```
service_email_flows
  id                UUID (PK)
  organization_id   UUID (FK -> organizations)
  service_id        UUID (FK -> services, nullable)
  service_category  TEXT (nullable) -- fallback: applies to all services in category
  name              TEXT -- e.g., "Blonding Care Flow"
  description       TEXT
  is_active         BOOLEAN DEFAULT true
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ
  UNIQUE(organization_id, service_id)
```

Logic: If a service has a direct flow (service_id match), use it. Otherwise fall back to a category-level flow (service_category match). This prevents owners from having to configure 30 individual services when most in a category share the same flow.

### Table: `service_email_flow_steps`

Individual communication steps within a flow.

```
service_email_flow_steps
  id                UUID (PK)
  flow_id           UUID (FK -> service_email_flows)
  step_order        INTEGER
  timing_type       TEXT -- 'before_appointment' | 'after_appointment'
  timing_value      INTEGER -- number of hours (e.g., 48 = 2 days before, 504 = 3 weeks after)
  subject           TEXT
  html_body         TEXT -- supports {{first_name}}, {{service_name}}, {{stylist_name}}, {{appointment_date}}, {{location_name}}
  email_template_id UUID (FK -> email_templates, nullable) -- optional: use managed template instead of inline
  is_active         BOOLEAN DEFAULT true
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ
```

### Table: `service_email_flow_step_overrides`

Location-specific content overrides for individual steps.

```
service_email_flow_step_overrides
  id           UUID (PK)
  step_id      UUID (FK -> service_email_flow_steps)
  location_id  TEXT (FK -> locations)
  subject      TEXT (nullable) -- override subject for this location
  html_body    TEXT (nullable) -- override body for this location
  created_at   TIMESTAMPTZ
  UNIQUE(step_id, location_id)
```

### Table: `service_email_queue`

Tracks scheduled and sent communications per appointment.

```
service_email_queue
  id               UUID (PK)
  organization_id  UUID (FK -> organizations)
  appointment_id   UUID (FK -> appointments)
  client_id        UUID (FK -> phorest_clients)
  step_id          UUID (FK -> service_email_flow_steps)
  scheduled_at     TIMESTAMPTZ -- when this email should fire
  status           TEXT -- 'pending' | 'sent' | 'skipped' | 'merged' | 'cancelled'
  merged_into_id   UUID (nullable, FK -> service_email_queue) -- if consolidated into another send
  sent_at          TIMESTAMPTZ
  message_id       TEXT -- from Resend
  created_at       TIMESTAMPTZ
  INDEX(organization_id, status, scheduled_at)
  INDEX(client_id, scheduled_at)
```

### Table: `appointment_reminders_config`

Simple org-level config for appointment reminders (separate from service flows).

```
appointment_reminders_config
  id               UUID (PK)
  organization_id  UUID (FK -> organizations)
  reminder_type    TEXT -- '24_hours' | '2_hours' | '48_hours'
  is_active        BOOLEAN DEFAULT true
  subject          TEXT
  html_body        TEXT
  created_at       TIMESTAMPTZ
  updated_at       TIMESTAMPTZ
  UNIQUE(organization_id, reminder_type)
```

### Table: `appointment_reminder_overrides`

Location-specific reminder content.

```
appointment_reminder_overrides
  id               UUID (PK)
  config_id        UUID (FK -> appointment_reminders_config)
  location_id      TEXT (FK -> locations)
  subject          TEXT
  html_body        TEXT
  created_at       TIMESTAMPTZ
  UNIQUE(config_id, location_id)
```

## Edge Functions

### 1. `enqueue-service-emails` (triggered when appointment is created/confirmed)

When an appointment is booked or confirmed:
- Look up the service's flow (direct match, then category fallback)
- Calculate all step send times relative to the appointment date/time
- Insert rows into `service_email_queue` with status 'pending'
- If appointment is cancelled, mark all pending queue entries as 'cancelled'

### 2. `process-service-email-queue` (runs on cron, e.g., every 15 minutes)

- Query `service_email_queue` for rows where `scheduled_at <= now()` and `status = 'pending'`
- Group by (client_id, DATE(scheduled_at)) to find same-day sends
- For groups with multiple items: merge content into a single email, mark extras as 'merged'
- For singles: send as-is
- Resolve location overrides for each step
- Use `sendOrgEmail` with `clientId` (respects opt-out, rate limiting, unsubscribe link)
- Update status to 'sent' with message_id

### 3. `process-appointment-reminders` (runs on cron, e.g., every 15 minutes)

- Separate from service flows
- Find appointments in the next 24h / 2h that haven't had reminders sent
- Group all services for that client's visit into one reminder email
- Include location-specific details (address, parking, arrival notes)
- These are transactional emails (no unsubscribe required, but still respect global email preferences)

## Frontend: Admin Configuration UI

### New Page: Service Communication Flows (under Settings or a dedicated section)

**Flow List View:**
- Shows all configured service flows
- Grouped by service category
- Toggle active/inactive
- Services without a flow show "No flow configured" with a quick-setup button

**Flow Editor:**
- Select a service (or "All services in [Category]" for category-level defaults)
- Add/remove/reorder steps on a visual timeline
- Each step shows: timing (e.g., "2 days before"), subject, preview of body
- Rich text editor for step content with variable insertion ({{first_name}}, {{service_name}}, etc.)
- Location override tab: per-location content variants

**Appointment Reminders Tab:**
- Configure 24-hour and 2-hour reminder templates
- Per-location overrides for directions/parking
- Toggle each reminder type on/off

### Where It Lives

Add a new "Service Emails" or "Client Communication Flows" section to the admin settings area, accessible to owners and super admins. This is separate from the existing "Automated Client Follow-ups" (re-engagement/win-back rules) since those are behavior-based, while these are appointment/service-based.

## Implementation Priority

1. Database tables and migration (all 6 tables)
2. `enqueue-service-emails` edge function (queue population on booking)
3. `process-service-email-queue` edge function (send processor with consolidation)
4. Admin UI: Flow list and step editor
5. `process-appointment-reminders` edge function
6. Admin UI: Appointment reminder config
7. Location override UI
8. Cron job setup for both processors

## How the Consolidation Prevents "Poor Flow"

To address the concern directly: a client who books Blonding + Extensions will experience:

- **Same-day sends consolidate**: Pre-visit prep, day-after care -- these merge into one email with sections per service
- **Different-day sends stay separate**: 3-week color check-in and 6-week extension reminder are genuinely different moments, different calls to action, and different rebooking timelines -- they SHOULD be separate emails
- **Appointment reminders are always one email**: "Your appointment tomorrow at 2pm includes: Blonding, Extensions" with one set of location directions

This means no client ever gets 3 emails on the same day for the same visit, but they do get appropriately timed follow-ups that match each service's actual care timeline.

## Technical Notes

- The `service_email_queue` table allows full visibility into what was sent, when, and whether it was merged -- useful for debugging and client dispute resolution
- Timing is stored in hours rather than days to support "2 hours before" type steps alongside "3 weeks after" steps (504 hours = 21 days)
- Category-level flows with service-level overrides follows the same inheritance pattern used elsewhere in the platform (e.g., location settings fallback to org settings)
- The queue-based architecture decouples "what should be sent" from "when it actually sends," making it resilient to downtime and easy to audit
- All client emails route through `sendOrgEmail`, inheriting opt-out checks, rate limiting, unsubscribe links, and send logging automatically
