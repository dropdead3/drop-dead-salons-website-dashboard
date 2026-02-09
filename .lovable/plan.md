
# Add Organization Logo to Kiosk Check-In Screen

## Overview

Display the organization's logo on the kiosk idle screen, positioned above the time/date. The logo will use the kiosk-specific logo if configured, otherwise fall back to the organization's business logo with theme-aware selection.

## Current State

| Element | Current Behavior |
|---------|-----------------|
| Logo display | Already supported at lines 162-177 |
| Logo source | Uses `settings?.logo_url` from kiosk settings only |
| Fallback | No fallback if kiosk logo not configured |
| Theme awareness | Not currently considered |

## Proposed Solution

Implement a smart logo fallback hierarchy:

```text
Priority 1: Kiosk-specific logo (organization_kiosk_settings.logo_url)
    ↓ (if null)
Priority 2: Business logo based on theme
    - Dark theme → business_settings.logo_light_url (light logo for dark bg)
    - Light theme → business_settings.logo_dark_url (dark logo for light bg)
    ↓ (if null)
Priority 3: Business name as text fallback
```

## Technical Implementation

### 1. Update KioskProvider to Include Business Settings

**File: `src/components/kiosk/KioskProvider.tsx`**

Add business settings fetch:

```typescript
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

// Inside KioskProvider function:
const { data: businessSettings } = useBusinessSettings();

// Add to context type and provider value:
businessSettings: BusinessSettings | null;
```

### 2. Update KioskIdleScreen for Logo Fallback

**File: `src/components/kiosk/KioskIdleScreen.tsx`**

Add logic to determine the best logo:

```typescript
const { settings, businessSettings } = useKiosk();

// Determine which logo to display with fallback chain
const themeMode = settings?.theme_mode || 'dark';
const isDarkTheme = themeMode === 'dark' || 
  (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

// Smart logo selection:
// 1. Kiosk-specific logo (if configured)
// 2. Business logo (theme-aware: light logo for dark bg, dark logo for light bg)
const logoUrl = settings?.logo_url 
  || (isDarkTheme ? businessSettings?.logo_light_url : businessSettings?.logo_dark_url)
  || null;

const businessName = businessSettings?.business_name;
```

### 3. Enhanced Logo Display with Text Fallback

If no logo is available, show the business name as a styled text logo:

```typescript
{/* Logo with floating animation */}
{logoUrl ? (
  <motion.img
    src={logoUrl}
    alt={businessName || 'Logo'}
    className="h-20 md:h-28 mb-12 object-contain"
    initial={{ y: -30, opacity: 0 }}
    animate={{ 
      y: [0, -8, 0],
      opacity: 1,
    }}
    transition={{ 
      y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      opacity: { duration: 0.5 },
    }}
  />
) : businessName ? (
  <motion.h2
    className="text-3xl md:text-4xl font-light tracking-widest uppercase mb-12"
    style={{ color: textColor }}
    initial={{ y: -30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {businessName}
  </motion.h2>
) : null}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/kiosk/KioskProvider.tsx` | Add `useBusinessSettings` hook and expose via context |
| `src/components/kiosk/KioskIdleScreen.tsx` | Add theme-aware logo fallback logic and text fallback |

## Visual Result

```text
┌──────────────────────────────────┐
│                                  │
│       [ORGANIZATION LOGO]        │  ← Logo with subtle float animation
│                                  │
│          10:28 PM                │
│      Sunday, February 8          │
│                                  │
│          Welcome                 │
│                                  │
│    [Tap anywhere to check in]    │
│                                  │
│            • • •                 │
└──────────────────────────────────┘
```

## Benefits

1. Shows organization branding without requiring separate kiosk logo upload
2. Theme-aware logo selection (light logo on dark background, vice versa)
3. Graceful text fallback if no logos are configured
4. Maintains existing kiosk-specific logo override capability
