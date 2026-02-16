

# Email Branding Admin UI in Organization Settings

## Overview

Add a dashboard-themed "Email Branding" card as the first section in the Email settings category at `/dashboard/admin/settings`. This gives org admins a visual, intuitive way to configure how their outbound emails look -- sender name, reply-to address, logo, and accent color -- with a live preview.

## Current State

The Email settings page currently has three cards stacked vertically:
1. Email Templates
2. Email Variables
3. Signature Presets

A platform-themed `EmailBrandingSection` already exists at `src/components/platform/account/EmailBrandingSection.tsx`, but it uses `PlatformCard` / `PlatformButton` components which do not match the dashboard UI (which uses standard `Card`, `Button`, `Input` from shadcn).

## What Will Change

### 1. New Component: `EmailBrandingSettings.tsx`

**File:** `src/components/dashboard/settings/EmailBrandingSettings.tsx`

A dashboard-native email branding card that matches the existing settings aesthetic. Features:

- **Sender Display Name** -- text input, placeholder uses org name
- **Reply-To Email** -- email input
- **Email Logo** -- upload to `business-logos` bucket with preview, replace, and remove actions
- **Accent Color** -- native color picker + hex text input
- **Live Preview** -- togglable email preview showing header (with logo/name over accent color), accent bar, placeholder content area, and "Sent via Zura" footer
- **Save button** -- persists to `organizations` table columns (`email_sender_name`, `email_reply_to`, `email_logo_url`, `email_accent_color`)

Uses `useOrganizationContext()` to get the org ID. Built with standard dashboard components (`Card`, `Button`, `Input`, `Label`) for visual consistency.

### 2. Integration into Settings Page

**File:** `src/pages/dashboard/admin/Settings.tsx`

- Import `useOrganizationContext` and `EmailBrandingSettings`
- Add `EmailBrandingSettings` as the first card inside the `activeCategory === 'email'` block, above Email Templates
- Pass the org ID from context

## Visual Layout (Email Settings Page After Change)

```text
+------------------------------------------+
| < Back to Settings                       |
| EMAIL                                    |
|                                          |
| +--------------------------------------+ |
| | EMAIL BRANDING                       | |
| | Customize how outbound emails appear | |
| |                                      | |
| | [Sender Name]    [Reply-To Email]    | |
| | [Logo Upload]    [Accent Color]      | |
| |                                      | |
| | [Show Preview]              [Save]   | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | EMAIL TEMPLATES                      | |
| | ...                                  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | EMAIL VARIABLES                      | |
| | ...                                  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | SIGNATURE PRESETS                    | |
| | ...                                  | |
| +--------------------------------------+ |
+------------------------------------------+
```

## Technical Details

| Item | Detail |
|---|---|
| Database columns | `email_sender_name`, `email_reply_to`, `email_logo_url`, `email_accent_color` on `organizations` (already exist) |
| Storage bucket | `business-logos` (already exists, public) |
| Org context | `useOrganizationContext()` from `@/contexts/OrganizationContext` |
| UI components | Standard dashboard: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button`, `Input`, `Label` |
| No migrations needed | All database infrastructure is already in place |

### Files to create
| File | Purpose |
|---|---|
| `src/components/dashboard/settings/EmailBrandingSettings.tsx` | Dashboard-themed email branding configuration card |

### Files to modify
| File | Change |
|---|---|
| `src/pages/dashboard/admin/Settings.tsx` | Import org context + new component, add as first card in email section |

