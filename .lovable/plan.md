

## Change Control Center Collapsed Icon to Settings

### What Changes
The collapsed sidebar icon for the "Control Center" section currently shows a Shield icon. It will be updated to show the Settings (gear) icon instead, matching what the screenshot shows as the desired look.

### Technical Detail

**File: `src/hooks/useSidebarLayout.ts`**
- Change the `adminOnly` entry in the `SECTION_ICONS` map from `Shield` to `Settings`
- Update the import to include `Settings` from `lucide-react`

This is a single-line change in the icon mapping. The `SECTION_ICONS` record is consumed by `SidebarNavContent.tsx` to render the collapsed-state icon for each section.

