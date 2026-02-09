
# Kiosk Client Check-In System - Comprehensive Implementation Plan

## Executive Summary

A dedicated iPad-optimized kiosk application for client self-check-in at reception. When clients check in, the system automatically sends push notifications to their assigned stylists, integrates with the existing form-signing workflow, and provides organizations with full branding customization.

---

## System Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KIOSK CHECK-IN SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌───────────────┐      ┌──────────────────────────┐  │
│  │   CLIENT     │ ──▶  │   KIOSK APP   │ ──▶  │   BACKEND SERVICES       │  │
│  │  (iPad/Web)  │      │  (React SPA)  │      │  (Edge Functions)        │  │
│  └──────────────┘      └───────────────┘      └──────────────────────────┘  │
│                               │                         │                    │
│                               ▼                         ▼                    │
│                     ┌─────────────────┐       ┌─────────────────┐           │
│                     │  APPOINTMENT    │       │  PUSH NOTIF     │           │
│                     │  LOOKUP         │       │  TO STYLIST     │           │
│                     └─────────────────┘       └─────────────────┘           │
│                               │                         │                    │
│                               ▼                         ▼                    │
│                     ┌─────────────────┐       ┌─────────────────┐           │
│                     │  FORM SIGNING   │       │  REAL-TIME      │           │
│                     │  (if required)  │       │  QUEUE UPDATE   │           │
│                     └─────────────────┘       └─────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature 1: Kiosk Mode & Client Lookup

### Client Identification Methods

| Method | UX Flow | Implementation |
|--------|---------|----------------|
| **Phone Number** | Client enters last 4-10 digits | Query `phorest_clients.phone` with LIKE match |
| **Last Name + First Initial** | Type last name, pick from matches | Query `phorest_clients` with name filter |
| **QR Code Scan** | Scan code from booking confirmation | Decode `appointment_id` from QR |
| **Appointment Confirmation Code** | Enter 6-digit code | Query `phorest_appointments.confirmation_code` |

### Appointment Matching Logic

```typescript
// Find today's appointments for matched client
const appointments = await supabase
  .from('phorest_appointments')
  .select(`
    *,
    stylist_profile:employee_profiles!phorest_appointments_stylist_user_id_fkey(
      display_name, full_name, photo_url
    )
  `)
  .eq('phorest_client_id', clientId)
  .eq('appointment_date', today)
  .in('status', ['booked', 'confirmed'])
  .order('start_time');
```

### Walk-In Support

If no appointment found:
1. Show "Walk-In Check-In" option
2. Allow client to select service category
3. Add to walk-in queue (new table: `walk_in_queue`)
4. Notify receptionist/manager

---

## Feature 2: Push Notifications to Stylists

### Leveraging Existing Infrastructure

The project already has a robust push notification system:
- `usePushNotifications` hook for subscription management
- `send-push-notification` edge function with VAPID authentication
- `push_subscriptions` table storing user endpoints
- Service worker (`/sw.js`) for receiving notifications

### New Edge Function: `notify-stylist-checkin`

```typescript
// supabase/functions/notify-stylist-checkin/index.ts

interface CheckinNotificationRequest {
  appointment_id: string;
  client_name: string;
  stylist_user_id: string;
  service_name: string;
  scheduled_time: string;
  location_name: string;
  is_walk_in?: boolean;
}

// Send notification payload:
{
  title: "📍 Client Checked In",
  body: "${clientName} is here for their ${time} ${serviceName}",
  url: "/dashboard/schedule",
  tag: "checkin-${appointmentId}",
  icon: "/icons/checkin-bell.png",
}
```

### Notification Triggers

| Event | Recipients | Priority |
|-------|------------|----------|
| Client check-in | Assigned stylist | High |
| Walk-in arrival | Location manager + available stylists | Medium |
| Client 5 min late | Assigned stylist (reminder) | Low |
| Client no-show (15 min) | Stylist + manager | Medium |

---

## Feature 3: Organization Kiosk Branding

### New Database Table: `organization_kiosk_settings`

```sql
CREATE TABLE organization_kiosk_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL, -- Optional per-location override
  
  -- Branding
  logo_url TEXT,
  background_image_url TEXT,
  background_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#8B5CF6',
  text_color TEXT DEFAULT '#FFFFFF',
  
  -- Theme
  theme_mode TEXT DEFAULT 'dark', -- 'dark', 'light', 'auto'
  font_family TEXT DEFAULT 'system',
  button_style TEXT DEFAULT 'rounded', -- 'rounded', 'pill', 'square'
  
  -- Content
  welcome_title TEXT DEFAULT 'Welcome',
  welcome_subtitle TEXT,
  check_in_prompt TEXT DEFAULT 'Please enter your phone number to check in',
  success_message TEXT DEFAULT 'You are checked in! Your stylist has been notified.',
  
  -- Behavior
  idle_timeout_seconds INTEGER DEFAULT 60,
  enable_walk_ins BOOLEAN DEFAULT true,
  require_confirmation_tap BOOLEAN DEFAULT true,
  show_wait_time_estimate BOOLEAN DEFAULT true,
  show_stylist_photo BOOLEAN DEFAULT true,
  enable_feedback_prompt BOOLEAN DEFAULT false,
  
  -- Form Requirements
  require_form_signing BOOLEAN DEFAULT true,
  
  -- Media
  idle_slideshow_images TEXT[], -- Array of image URLs for screensaver
  idle_video_url TEXT, -- Optional video for idle state
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Org admins can manage
ALTER TABLE organization_kiosk_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage kiosk settings" ON organization_kiosk_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_admins
      WHERE user_id = auth.uid() AND organization_id = organization_kiosk_settings.organization_id
    )
    OR public.is_platform_user(auth.uid())
  );
```

### Storage Bucket for Kiosk Assets

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kiosk-assets', 'kiosk-assets', true);

-- Allow authenticated users to upload to their org's folder
CREATE POLICY "Org admins upload kiosk assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kiosk-assets' 
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM organizations 
      WHERE id IN (SELECT organization_id FROM organization_admins WHERE user_id = auth.uid())
    )
  );
```

---

## Feature 4: Kiosk Admin Settings UI

### New Settings Page: `/dashboard/settings/kiosk`

Located under Settings → Business Operations → Kiosk

**Tabs:**
1. **Appearance** - Logo, colors, backgrounds, fonts
2. **Content** - Welcome messages, prompts, success screens
3. **Behavior** - Timeouts, walk-ins, form requirements
4. **Media** - Slideshow images, idle video
5. **Preview** - Live preview of kiosk appearance

### Branding Editor Features

| Setting | Type | Description |
|---------|------|-------------|
| Logo | Image upload | Organization logo for kiosk header |
| Background | Image/Color | Full-screen background for kiosk |
| Accent Color | Color picker | Buttons, highlights, active states |
| Text Color | Color picker | Primary text on background |
| Theme Mode | Toggle | Dark/Light/Auto based on time |
| Button Style | Select | Rounded corners, pill, square |
| Font | Select | System, Termina, Aeonik Pro |

### Preview Component

```typescript
// src/components/dashboard/settings/KioskPreviewPanel.tsx
// Live preview that updates as admin changes settings
// Shows both idle state and check-in flow
```

---

## Feature 5: Kiosk Application (Public Route)

### Route: `/kiosk/:locationId`

Completely standalone React route optimized for:
- iPad (1024×768, 1366×1024)
- Touch interactions only
- Full-screen mode
- No navigation or browser chrome

### Kiosk State Machine

```text
┌─────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  IDLE   │ ──▶ │   LOOKUP   │ ──▶ │  CONFIRM   │ ──▶ │  SIGNING   │
│(screen- │     │ (enter     │     │ (show      │     │ (forms if  │
│ saver)  │     │  phone)    │     │  appt)     │     │  required) │
└─────────┘     └────────────┘     └────────────┘     └────────────┘
     ▲                                                       │
     │                  ┌────────────┐                       │
     └───────────────── │  SUCCESS   │ ◀─────────────────────┘
                        │ (checked   │
                        │  in!)      │
                        └────────────┘
```

### Kiosk Pages/Components

| Component | Purpose |
|-----------|---------|
| `KioskIdleScreen` | Screensaver with branding, slideshow, tap to start |
| `KioskLookupScreen` | Phone/name entry with large touch keyboard |
| `KioskAppointmentConfirm` | Show matched appointment(s), stylist info |
| `KioskFormSigning` | Reuse `FormSigningDialog` in kiosk-optimized layout |
| `KioskSuccessScreen` | Animated confirmation, wait time estimate |
| `KioskWalkInFlow` | Walk-in registration for clients without appointments |
| `KioskErrorScreen` | Friendly error handling, call for help |

### Touch-Optimized UI Patterns

- **Large touch targets**: Minimum 60×60px buttons
- **On-screen keyboard**: Custom number pad for phone entry
- **Swipe gestures**: Navigate between screens
- **Haptic feedback**: Visual pulse on tap (CSS animation)
- **Auto-focus**: Always ready for input
- **Voice over support**: Accessibility compliance

---

## Feature 6: Check-In Workflow Integration

### Database Updates on Check-In

```typescript
// 1. Update appointment status
await supabase.rpc('update_booking_status', {
  p_appointment_id: appointmentId,
  p_status: 'checked_in',
});

// 2. Record check-in timestamp and method
await supabase
  .from('appointment_check_ins')
  .insert({
    appointment_id: appointmentId,
    checked_in_at: new Date().toISOString(),
    check_in_method: 'kiosk', // 'kiosk' | 'receptionist' | 'walk_in'
    location_id: locationId,
    kiosk_session_id: sessionId, // For analytics
  });

// 3. Trigger push notification
await supabase.functions.invoke('notify-stylist-checkin', {
  body: { appointment_id: appointmentId },
});
```

### Form Signing Integration

Reuse the existing `FormSigningDialog` component with kiosk-specific styling:

```typescript
// Check if forms are required before check-in completes
const { data: requiredForms } = await checkRequiredForms(
  clientId, 
  appointmentId, 
  serviceId
);

if (requiredForms.length > 0) {
  // Transition to form signing step
  setKioskState('signing');
} else {
  // Complete check-in
  completeCheckIn();
}
```

---

## Feature 7: Real-Time Queue Updates

### Receptionist Dashboard Integration

When a client checks in via kiosk:

1. **Today's Queue** (`TodaysQueueSection.tsx`) updates in real-time via existing Realtime subscription
2. **Appointment card** moves from "Upcoming" to "Waiting" column
3. **Check-in indicator** shows kiosk icon with timestamp

### Stylist Dashboard Notification

In addition to push notification:
- **Toast notification** appears if stylist has dashboard open
- **Next client indicator** updates with "Checked In" badge
- **Schedule view** highlights checked-in appointments

---

## Feature 8: Analytics & Reporting

### New Table: `kiosk_analytics`

```sql
CREATE TABLE kiosk_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  location_id TEXT REFERENCES locations(id),
  
  -- Session tracking
  session_id UUID NOT NULL,
  session_started_at TIMESTAMPTZ NOT NULL,
  session_ended_at TIMESTAMPTZ,
  session_completed BOOLEAN DEFAULT false,
  
  -- Check-in details
  client_id UUID,
  appointment_id UUID,
  check_in_method TEXT, -- 'phone', 'name', 'qr', 'code'
  is_walk_in BOOLEAN DEFAULT false,
  
  -- Timing metrics
  lookup_duration_seconds INTEGER,
  confirmation_duration_seconds INTEGER,
  form_signing_duration_seconds INTEGER,
  total_duration_seconds INTEGER,
  
  -- Issues
  lookup_attempts INTEGER DEFAULT 1,
  error_occurred BOOLEAN DEFAULT false,
  error_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for reporting
CREATE INDEX idx_kiosk_analytics_org_date ON kiosk_analytics(organization_id, created_at);
CREATE INDEX idx_kiosk_analytics_location ON kiosk_analytics(location_id, created_at);
```

### Kiosk Metrics Dashboard

Add to existing Analytics section:
- **Daily check-in volume** by kiosk vs receptionist
- **Average check-in time** (lookup → complete)
- **Walk-in percentage**
- **Form completion rates**
- **Error/abandonment rates**
- **Peak check-in hours**

---

## Feature 9: Kiosk Security & Management

### Kiosk Mode Authentication

```typescript
// Special "kiosk" role with limited permissions
// Configured via Settings → Kiosk → Device Management

interface KioskDevice {
  id: string;
  device_name: string;
  location_id: string;
  pin_code: string; // 4-6 digit PIN to exit kiosk mode
  last_active: string;
  is_active: boolean;
}
```

### Admin Controls

| Feature | Description |
|---------|-------------|
| **Exit PIN** | 4-6 digit code to exit kiosk mode |
| **Remote Disable** | Disable kiosk from admin panel |
| **Session Monitoring** | View active kiosk sessions |
| **Screensaver Lock** | Prevent tampering during idle |
| **Auto-Recovery** | Reload on error/crash |

### Lock Screen Implementation

```typescript
// Exit kiosk mode requires PIN
const handleExitAttempt = () => {
  setShowPinDialog(true);
};

// 5-tap gesture in corner to trigger exit
const handleSecretTap = () => {
  tapCount++;
  if (tapCount >= 5) {
    handleExitAttempt();
  }
  setTimeout(() => tapCount = 0, 3000);
};
```

---

## Implementation Phases

### Phase 1: Foundation (Core Check-In)
1. Create `organization_kiosk_settings` table with migration
2. Create `kiosk-assets` storage bucket
3. Build `useKioskSettings` hook
4. Create basic `/kiosk/:locationId` route
5. Implement phone lookup and appointment matching
6. Create `notify-stylist-checkin` edge function
7. Connect to existing push notification infrastructure

### Phase 2: Branding & Customization
1. Build Kiosk Settings admin page (`/dashboard/settings/kiosk`)
2. Implement appearance editor (colors, logo, background)
3. Create content editor (messages, prompts)
4. Add live preview component
5. Implement theme application on kiosk route

### Phase 3: Complete UX Flow
1. Build all kiosk screen components
2. Implement touch-optimized UI
3. Add on-screen keyboard for phone entry
4. Integrate form signing workflow
5. Add walk-in support flow
6. Implement idle screensaver with slideshow

### Phase 4: Real-Time Integration
1. Update `TodaysQueueSection` for kiosk check-ins
2. Add real-time notifications to stylist dashboard
3. Implement wait time estimation
4. Add check-in confirmation animations

### Phase 5: Analytics & Security
1. Create `kiosk_analytics` table
2. Implement session tracking
3. Add kiosk device management
4. Build PIN-protected exit flow
5. Create kiosk metrics dashboard

---

## Technical Specifications

### New Files to Create

```text
Database:
├── supabase/migrations/XXXX_kiosk_checkin_system.sql

Edge Functions:
├── supabase/functions/notify-stylist-checkin/index.ts
├── supabase/functions/kiosk-lookup/index.ts

Hooks:
├── src/hooks/useKioskSettings.ts
├── src/hooks/useKioskCheckin.ts
├── src/hooks/useKioskAnalytics.ts

Components:
├── src/pages/Kiosk.tsx (main route)
├── src/components/kiosk/
│   ├── KioskProvider.tsx (context for settings/state)
│   ├── KioskIdleScreen.tsx
│   ├── KioskLookupScreen.tsx
│   ├── KioskNumberPad.tsx
│   ├── KioskAppointmentConfirm.tsx
│   ├── KioskFormSigning.tsx
│   ├── KioskSuccessScreen.tsx
│   ├── KioskWalkInFlow.tsx
│   ├── KioskErrorScreen.tsx
│   └── KioskExitDialog.tsx

Admin Settings:
├── src/pages/dashboard/settings/KioskSettings.tsx
├── src/components/dashboard/settings/kiosk/
│   ├── KioskAppearanceTab.tsx
│   ├── KioskContentTab.tsx
│   ├── KioskBehaviorTab.tsx
│   ├── KioskMediaTab.tsx
│   ├── KioskPreviewPanel.tsx
│   └── KioskDeviceManager.tsx
```

### Modified Files

```text
src/App.tsx - Add /kiosk/:locationId route
src/components/dashboard/SidebarNavContent.tsx - Add Kiosk link in Settings
src/components/dashboard/TodaysQueueSection.tsx - Add kiosk check-in indicator
src/components/dashboard/schedule/* - Highlight kiosk check-ins
```

---

## UI/UX Enhancements

### Kiosk Visual Design

| Element | Specification |
|---------|--------------|
| **Screen Size** | Optimized for 1024×768 (iPad) and 1366×1024 (iPad Pro) |
| **Touch Targets** | Minimum 60×60px, recommended 80×80px |
| **Font Sizes** | Header: 48px, Body: 24px, Input: 32px |
| **Animations** | Smooth 300ms transitions, subtle pulse feedback |
| **Colors** | High contrast for accessibility, customizable accent |

### Accessibility Features

- **Large text** throughout
- **High contrast** color options
- **VoiceOver** compatibility
- **Simple language** in all prompts
- **Clear error messages** with recovery options

### Idle Screensaver Options

1. **Static logo** with subtle animation
2. **Image slideshow** (configurable interval)
3. **Video loop** (optional promotional video)
4. **Clock display** with "Tap to Check In" prompt

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Check-in completion rate | > 95% |
| Average check-in time | < 30 seconds |
| Push notification delivery | < 3 seconds |
| Kiosk uptime | > 99.5% |
| Client satisfaction | > 4.5/5 stars |

---

## Future Enhancements (Post-MVP)

1. **QR Code Check-In**: Generate unique QR in booking confirmation email
2. **Facial Recognition**: Optional AI-powered client identification
3. **Multi-Language Support**: Spanish, Portuguese, etc.
4. **Loyalty Points Display**: Show points balance on check-in
5. **Upsell Prompts**: "Add a conditioning treatment today?"
6. **Payment Pre-Auth**: Collect card on file during check-in
7. **Photo Check-In**: Take client photo for stylist reference
8. **SMS Confirmation**: Text "Reply 1 to confirm check-in"
9. **Apple/Google Wallet**: Check in with digital pass
10. **Wait Time Display**: Show estimated wait on public screen

