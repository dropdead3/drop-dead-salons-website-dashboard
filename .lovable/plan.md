

# Template-Specific Preview Mode for Email Branding

## Overview

Add a template selector dropdown to the Email Branding preview so admins can see how real email templates (birthday reminder, strike alert, welcome email, etc.) look when wrapped in their current branding -- not just the generic sample content.

## What Changes

### 1. Template Selector in Preview Header (in `EmailBrandingSettings.tsx`)

Add a `Select` dropdown next to the Desktop/Mobile toggle in the preview header area. Options:

- **Sample Content** (default) -- the current generic preview
- **Birthday Reminder** -- renders the `birthday_reminder` template with placeholder variables filled
- **Strike Notification** -- renders `strike_notification` template
- **Welcome Email** -- renders `welcome_email` template
- **Handbook Reminder** -- renders `handbook_reminder` template
- **Training Reminder** -- renders `training_reminder` template
- Plus any other active templates found in the DB

The dropdown fetches templates via the existing `useEmailTemplates()` hook from `src/hooks/useEmailTemplates.ts`.

### 2. Variable Substitution for Preview

Each template uses `{{variable}}` placeholders. For preview purposes, these get replaced with realistic sample data:

| Variable | Sample Value |
|---|---|
| `{{stylist_name}}` / `{{employee_name}}` | "Sarah Johnson" |
| `{{birthday_date}}` / `{{date}}` | "Monday, March 15" |
| `{{birthday_count}}` / `{{count}}` | "2" |
| `{{birthday_list}}` | Sample HTML list with 2 names |
| `{{birthday_names}}` | "Emma Wilson, Alex Chen" |
| `{{days_until}}` | "3" |
| `{{handbook_title}}` / `{{training_title}}` | "Employee Handbook 2026" |
| `{{dashboard_url}}` / `{{link}}` | "#" |
| `{{plural}}` | "s" |
| `{{inactive_count}}` | "3" |
| `{{day_number}}` / `{{current_day}}` | "5" |

A helper function `fillSampleVariables()` maps known variable names to realistic preview values. Any unmatched `{{var}}` gets replaced with a styled placeholder badge so admins see what is dynamic.

### 3. Preview Content Swap

When a template is selected from the dropdown, the preview area renders the template's `html_body` (with variables filled) inside the same branded wrapper (header, accent bar, footer). This is the same content flow as the backend: `buildBrandedTemplate(branding, templateHtml)`.

When "Sample Content" is selected, it shows the current generic preview (greeting + paragraph + CTA button).

### 4. Updated Preview Layout

```text
EMAIL PREVIEW          [Template: v] [Desktop|Mobile]
+--------------------------------------------------+
|        [accent-color header with logo]            |
|        ==================================         |
|                                                   |
|  (selected template content with sample data)     |
|                                                   |
|        -------- footer --------                   |
|        Sent via Zura                              |
+--------------------------------------------------+
```

## Technical Details

### Files to Modify

| File | Change |
|---|---|
| `src/components/dashboard/settings/EmailBrandingSettings.tsx` | Add template selector dropdown using `Select` component, `useEmailTemplates()` hook, sample variable map, and conditional content rendering inside the preview |

### No New Files Needed

This is entirely a frontend preview enhancement. No edge functions or database changes required.

### Dependencies Used
- Existing `useEmailTemplates()` hook for fetching active templates
- Existing `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` UI components
- No new packages or migrations

### Key Implementation Details

1. The `useEmailTemplates()` query only fires when the preview is visible (`enabled: showPreview`) to avoid unnecessary DB calls.
2. The sample variable replacement is client-side only -- it never touches the real email sending flow.
3. Template HTML is rendered via `dangerouslySetInnerHTML` inside the branded wrapper, same as the current preview approach.
4. The template dropdown defaults to "sample" (generic content) so existing behavior is unchanged.

