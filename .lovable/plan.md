

# Wire Email Logo to Business Settings Logos

## Overview

Replace the standalone email logo upload in the Email Branding tab with a selector that pulls from the logos already uploaded in Business Settings (`logo_light_url`, `logo_dark_url`). This eliminates duplicate uploads and ensures brand consistency across the platform and emails.

## What Changes

### File: `src/components/dashboard/settings/EmailBrandingSettings.tsx`

1. **Import `useBusinessSettings`** hook to access the existing business logos.

2. **Replace the logo upload section** (lines 259-311) with a logo source selector offering these options:
   - **Auto (from Business Settings)** -- uses `logo_light_url` (light/white logo, ideal for dark email headers) by default
   - **Light Logo** -- explicitly picks `logo_light_url`
   - **Dark Logo** -- explicitly picks `logo_dark_url`
   - **Custom URL** -- allows pasting a URL manually (keeps flexibility)
   - **None** -- no logo, falls back to text name in header

3. **Remove the file upload input and upload handler** (`handleLogoUpload`, `fileInputRef`, `uploading` state) since logos are now sourced from Business Settings.

4. **Update the preview** to resolve the logo URL from the selected source. The preview header already handles `logoUrl` -- this just changes where the URL comes from.

5. **Update the save mutation** to continue saving `email_logo_url` on the `organizations` table (stores the resolved URL so the backend email sender still works without needing to look up business settings).

6. **Add a helper note** below the selector: "Manage your logos in Business Settings" as a small link/text, so admins know where to update the actual logo files.

### UI Layout Change

```text
Before:
  Email Logo
  [Upload logo] button / [logo preview + Replace + X]
  PNG, JPG, SVG, or WebP. Max 2MB.

After:
  Email Logo
  [Select: Auto | Light Logo | Dark Logo | Custom | None]
  [Preview of selected logo if available]
  Manage your logos in Business Settings.
```

## Technical Details

- No new files, no database changes, no edge function changes
- Uses existing `useBusinessSettings()` hook already in the codebase
- The `email_logo_url` column on `organizations` continues to store the resolved URL for backend use
- When "Auto" is selected, it picks `logo_light_url` (white/light logo works best against the colored accent header background)
- The `hasChanges` detection updates to compare against the resolved URL

