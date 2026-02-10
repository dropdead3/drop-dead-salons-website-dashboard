

# Polish the Platform Sidebar Navigation

The current sidebar is a flat, unstructured list of 16+ items. This plan groups them into logical sections with refined visual hierarchy, better hover/active states, and subtle polish.

## Changes Overview

### 1. Grouped Navigation with Section Labels
Organize the flat list into logical groups with subtle section headers:
- **Core**: Overview, Accounts, Health Scores, Benchmarks
- **Operations**: Onboarding, Migrations, Scheduled Jobs
- **Monitoring**: Audit Log, System Health, Payments Health, Notifications
- **Intelligence**: Analytics, Knowledge Base, Revenue
- **Administration**: Permissions, Feature Flags, Settings

Each group gets a tiny, uppercase, muted label (hidden when collapsed).

### 2. Refined Active & Hover States
- Active item: add a 2px left accent bar (violet) instead of relying solely on background color
- Hover: subtle left-shift translation (`translateX(2px)`) for a tactile feel
- Smoother transitions (300ms ease-out)

### 3. Better Spacing & Scroll
- Add small gaps between groups (8px separator)
- Reduce item vertical padding slightly to fit more comfortably
- Add a subtle fade-out gradient at the bottom of the scroll area to hint at more content

### 4. Logo Area Enhancement
- Add a faint bottom gradient fade on the header divider instead of a hard border line
- Slightly increase logo area height for breathing room

### 5. Collapse Toggle Refinement
- Move the collapse button into the header area (next to logo) to save vertical space
- Remove the dedicated bottom section for collapse, freeing room

---

## Technical Details

### File: `src/components/platform/layout/PlatformSidebar.tsx`

**Navigation grouping**: Replace the flat `platformNavItems` array with a grouped structure:
```text
const navGroups = [
  { label: 'Core', items: [Overview, Accounts, Health Scores, Benchmarks] },
  { label: 'Operations', items: [Onboarding, Migrations, Scheduled Jobs] },
  { label: 'Monitoring', items: [Audit Log, System Health, Payments Health, Notifications] },
  { label: 'Intelligence', items: [Analytics, Knowledge Base, Revenue] },
  { label: 'Admin', items: [Permissions, Feature Flags, Settings] },
]
```

**Active indicator**: Add a pseudo-element style via a small `div` with `w-0.5 h-5 bg-violet-500 rounded-full` absolutely positioned on the left of active items.

**Hover micro-interaction**: Add `hover:translate-x-0.5 transition-all duration-200` to nav links.

**Scroll fade**: Add a gradient overlay `div` at the bottom of the `nav` area using `pointer-events-none` and a gradient from transparent to the sidebar background color.

**Header**: Move the collapse chevron button into the header row (right side), removing the separate bottom collapse section. This saves ~48px of vertical space.

**User profile section**: Keep as-is (already looks good), just ensure the border treatment matches the refined style.

### No Breaking Changes
- Same routes, same role filtering, same collapse behavior
- Purely visual restructuring of the same nav items
- LocalStorage key unchanged

