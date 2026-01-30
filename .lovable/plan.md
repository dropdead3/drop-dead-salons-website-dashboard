
# Platform Branding & Customization Settings

## Summary

Add a new "Branding" tab to Platform Settings exclusively for platform owners. This will allow customization of the platform's visual identity including:
- Primary and secondary logos for the platform navigation bar
- Theme color customization for the platform UI
- Typography/font settings for the platform interface

This is platform-level branding (for the admin interface), separate from organization-level branding managed via BusinessSettingsDialog.

---

## Current State Analysis

**What We Have:**
- Platform Settings page with tabs: Team, Security, Import Templates, Defaults
- `platform_owner` role check via `hasPlatformRoleOrHigher('platform_owner')`
- Existing Theme Editor and Typography Editor components (for organization dashboards)
- `business-logos` storage bucket for file uploads
- `site_settings` table as a key-value store for platform-wide configs
- `useCustomTheme` and `useTypographyTheme` hooks for CSS variable management
- Platform-specific CSS variables defined under `.platform-theme` class

**What's Missing:**
- No platform-level branding storage (separate from organization branding)
- No logo display in Platform Sidebar
- No owner-restricted branding tab in Platform Settings

---

## Key Features to Implement

### 1. Platform Branding Database Storage
Store platform-level branding in `site_settings` table with key `platform_branding`:
```json
{
  "primary_logo_url": "https://...",
  "secondary_logo_url": "https://...",
  "theme_colors": { "platform-accent": "...", ... },
  "typography": { "font-size-base": "16px", ... },
  "updated_at": "timestamp"
}
```

### 2. Logo Management
- Primary logo: Main logo displayed in platform sidebar header (expanded state)
- Secondary logo: Icon/mark displayed in collapsed sidebar state
- File upload to `business-logos` bucket with platform prefix

### 3. Platform Theme Colors
Subset of platform-specific CSS variables:
- `--platform-accent` (violet by default)
- `--platform-bg` variants
- `--platform-foreground`
- etc.

### 4. Typography Settings
- Font size adjustments for platform UI
- Reuse existing typography token structure

### 5. Owner-Only Access
- New tab only visible to `platform_owner` role
- RLS policy on site_settings for platform_branding key

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Platform Settings Page                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tabs: Team | Security | Templates | Defaults | Branding   │ │
│  │                                           ↑ OWNER ONLY      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Branding Tab Content                     │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Logo Management                                      │  │ │
│  │  │  ┌─────────────────────┐ ┌─────────────────────┐     │  │ │
│  │  │  │ Primary Logo        │ │ Secondary Logo      │     │  │ │
│  │  │  │ (Expanded Sidebar)  │ │ (Collapsed Icon)    │     │  │ │
│  │  │  │ [Upload Area]       │ │ [Upload Area]       │     │  │ │
│  │  │  └─────────────────────┘ └─────────────────────┘     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Platform Theme Colors                                │  │ │
│  │  │  • Accent Color (Violet)                              │  │ │
│  │  │  • Background variants                                │  │ │
│  │  │  • Text colors                                        │  │ │
│  │  │  [Color Pickers Grid]                                 │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Typography                                           │  │ │
│  │  │  • Base font sizes                                    │  │ │
│  │  │  • Header sizes                                       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Preview Sidebar                                      │  │ │
│  │  │  [Live preview of changes]                            │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │                        [Save Changes]                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### site_settings Entry
Add/update `platform_branding` key in site_settings:

```sql
INSERT INTO site_settings (id, value)
VALUES ('platform_branding', '{
  "primary_logo_url": null,
  "secondary_logo_url": null,
  "theme_colors": {},
  "typography": {}
}')
ON CONFLICT (id) DO NOTHING;
```

### RLS Policy for Platform Branding
Only platform owners can update this specific setting:

```sql
CREATE POLICY "Platform owners can update platform branding"
ON site_settings
FOR UPDATE
USING (
  id = 'platform_branding' AND
  public.has_platform_role(auth.uid(), 'platform_owner')
)
WITH CHECK (
  id = 'platform_branding' AND
  public.has_platform_role(auth.uid(), 'platform_owner')
);
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/platform/settings/PlatformBrandingTab.tsx` | Main branding configuration UI |
| `src/components/platform/settings/PlatformLogoUploader.tsx` | Logo upload cards for primary/secondary |
| `src/components/platform/settings/PlatformThemeEditor.tsx` | Platform-specific color editor |
| `src/hooks/usePlatformBranding.ts` | CRUD hook for platform branding settings |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Add "Branding" tab with owner-only visibility |
| `src/components/platform/layout/PlatformSidebar.tsx` | Display custom logos from platform branding |
| Database migration | Add platform_branding to site_settings, update RLS |

---

## Implementation Details

### usePlatformBranding Hook
```typescript
interface PlatformBranding {
  primary_logo_url: string | null;
  secondary_logo_url: string | null;
  theme_colors: Record<string, string>;
  typography: Record<string, string>;
}

function usePlatformBranding() {
  // Fetch from site_settings where id = 'platform_branding'
  // Return query + mutation for updating
}
```

### PlatformBrandingTab Component
- Uses PlatformCard components for consistent styling
- Logo upload section with drag-and-drop
- Color picker grid for theme colors
- Typography sliders (similar to existing TypographyEditor)
- Live preview mini-sidebar
- Save/Cancel/Reset buttons

### PlatformSidebar Logo Integration
Modify header section:
```tsx
// Current: Static Sparkles icon + "Platform" text
// New: Check for custom logos from usePlatformBranding

const { data: branding } = usePlatformBranding();

// Expanded state: Show primary logo or fallback to Sparkles + "Platform"
// Collapsed state: Show secondary logo or fallback to Sparkles icon
```

### Platform Theme Application
On load, apply saved platform theme colors:
```typescript
// In PlatformLayout or a PlatformThemeInitializer
useEffect(() => {
  if (branding?.theme_colors) {
    Object.entries(branding.theme_colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  }
}, [branding]);
```

---

## Logo Upload Flow

1. User clicks upload area or drops file
2. Validate file (SVG/PNG preferred, max 2MB)
3. Upload to `business-logos` bucket with prefix `platform-`
4. Get public URL
5. Update local state for preview
6. On save, persist to site_settings

---

## Platform Theme Color Tokens

Editable platform-specific tokens:

| Token | Label | Default |
|-------|-------|---------|
| platform-accent | Accent Color | violet-500 |
| platform-accent-hover | Accent Hover | violet-600 |
| platform-bg | Background | slate-950 |
| platform-bg-elevated | Elevated BG | slate-900 |
| platform-bg-card | Card BG | slate-800 |
| platform-foreground | Text | white |
| platform-muted | Muted Text | slate-400 |
| platform-border | Border | slate-700 |

---

## Security & Permissions

- **Tab Visibility**: Only shown when `hasPlatformRoleOrHigher('platform_owner')` returns true
- **API Protection**: RLS policy restricts updates to platform_owner role
- **Storage**: Reuses existing public `business-logos` bucket
- **Audit**: Consider logging branding changes to `platform_audit_log`

---

## Implementation Phases

### Phase 1: Database & Hook
1. Create migration to add `platform_branding` to site_settings
2. Add RLS policy for platform_owner-only updates
3. Build `usePlatformBranding` hook

### Phase 2: Logo Management
1. Create `PlatformLogoUploader` component
2. Implement upload logic to storage bucket
3. Add logo preview functionality

### Phase 3: Branding Tab UI
1. Create `PlatformBrandingTab` component
2. Add Branding tab to PlatformSettings (owner-restricted)
3. Integrate logo uploader

### Phase 4: Theme & Typography
1. Create `PlatformThemeEditor` component with color pickers
2. Add typography section
3. Implement live preview mini-sidebar

### Phase 5: Apply Branding
1. Modify PlatformSidebar to use custom logos
2. Create PlatformBrandingInitializer for theme colors
3. Integrate into PlatformLayout

---

## Visual Design

**Tab Badge**: Crown icon to indicate owner-only access

**Logo Upload Cards**:
- Dark slate background (`slate-800/50`)
- Dashed border for empty state
- Image preview with remove button when uploaded
- Upload progress indicator

**Color Editor**:
- Grid of color swatches
- ColorWheelPicker component (already exists)
- "Modified" dot indicator for changed values

**Live Preview**:
- Mini version of PlatformSidebar (scaled down)
- Shows logo and accent color changes in real-time
- Collapsed/expanded toggle for preview

---

## Fallback Behavior

When no custom branding is set:
- **Primary Logo**: Shows Sparkles icon + "Platform" text
- **Secondary Logo**: Shows Sparkles icon only
- **Theme Colors**: Uses default violet/slate theme from CSS
- **Typography**: Uses default platform font sizes
