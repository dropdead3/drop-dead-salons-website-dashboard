

# Add Time Allotments and Consultation Fields to Services

## Overview

Add four new fields to the service configuration: **Styling & Finishing Time**, **Content Creation Time**, **Processing Time**, and **Requires New-Client Consultation**. The first three are additional time allotments (in minutes) added on top of the service duration for scheduling purposes. The fourth is a toggle that flags whether a new client (no past visit history) must complete a consultation before booking online.

## Database Migration

Add 4 new columns to the `services` table:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `finishing_time_minutes` | INTEGER | 0 | Styling and finishing time added to schedule |
| `content_creation_time_minutes` | INTEGER | 0 | Photo/video time added to schedule |
| `processing_time_minutes` | INTEGER | 0 | Chemical processing time added to schedule |
| `requires_new_client_consultation` | BOOLEAN | false | Require consultation for clients with no visit history |

## Code Changes

### 1. Service Type (`src/hooks/useServicesData.ts`)
- Add the 4 new fields to the `Service` interface
- Add them to the `useCreateService` insert map

### 2. Service Form Dialog (`src/components/dashboard/settings/ServiceFormDialog.tsx`)
- Add state variables for the 4 new fields
- Populate from `initialData` on edit, reset on create
- Include in `handleSubmit` payload
- Add to the form UI:
  - Three time inputs (finishing, content creation, processing) in a row below the existing Duration/Price row, each with a "(min)" label
  - A "Requires New-Client Consultation" toggle at the bottom of the toggles section, with description: "Clients without past visit history must complete a consultation before booking online"

### 3. Service Editor Dialog (if it also has a Details tab with the same form)
- Verify the `ServiceEditorDialog.tsx` Details tab delegates to `ServiceFormDialog` or has its own fields, and update accordingly

## Build Order

1. Database migration -- add 4 columns
2. Update `Service` interface and create/update hooks
3. Update `ServiceFormDialog.tsx` with new fields in the form

