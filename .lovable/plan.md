
# Add Back Navigation to Platform Pages

## Design Rule: Platform Page Headers with Navigation

Establish a consistent header pattern for all platform pages that includes contextual back navigation.

---

## Navigation Hierarchy

```text
Platform Overview (hub/home - no back button needed)
    │
    ├── Salon Accounts ← Back to Overview
    │       └── Account Detail ← Back to Accounts (already implemented)
    │
    ├── Migrations ← Back to Overview
    │
    └── Platform Settings ← Back to Overview
```

---

## Header Component Pattern

Create a reusable `PlatformPageHeader` component that standardizes:
- Back button placement (left-aligned, before title)
- Page title and description
- Optional right-side action buttons

### Component Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│ [←]  Page Title                                    [+ Action]   │
│      Description text                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### 1. Create PlatformPageHeader Component

**File**: `src/components/platform/ui/PlatformPageHeader.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Page heading |
| `description` | string (optional) | Subtext below title |
| `backTo` | string (optional) | Route to navigate back to |
| `backLabel` | string (optional) | Accessible label (default: "Go back") |
| `actions` | ReactNode (optional) | Right-side buttons/actions |

The back button uses the existing `PlatformButton` ghost variant with `ArrowLeft` icon.

### 2. Update Platform Pages

| Page | Back Target | Back Label |
|------|-------------|------------|
| **Overview** | None (hub page) | - |
| **Accounts** | `/dashboard/platform/overview` | "Back to Overview" |
| **AccountDetail** | `/dashboard/platform/accounts` | Already implemented |
| **PlatformImport** | `/dashboard/platform/overview` | "Back to Overview" |
| **PlatformSettings** | `/dashboard/platform/overview` | "Back to Overview" |

### 3. Export from UI Index

Add `PlatformPageHeader` to the platform UI component exports.

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/platform/ui/PlatformPageHeader.tsx` | **Create** - New reusable header component |
| `src/components/platform/ui/index.ts` | Add export |
| `src/pages/dashboard/platform/Accounts.tsx` | Replace header with `PlatformPageHeader` |
| `src/pages/dashboard/platform/PlatformImport.tsx` | Replace header with `PlatformPageHeader` |
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Replace header with `PlatformPageHeader` |
| `src/pages/dashboard/platform/AccountDetail.tsx` | Refactor to use `PlatformPageHeader` for consistency |

---

## Design Details

### Back Button Styling
- Uses `PlatformButton` with `variant="ghost"` and `size="icon"`
- `ArrowLeft` icon at 16x16 (h-4 w-4)
- Positioned inline with title, gap of 12px (gap-3)
- Hover state: subtle background highlight per ghost button style

### Responsive Behavior
- On mobile: back button + title remain inline
- Action buttons stack below title on very small screens if needed

---

## Component Preview

```tsx
<PlatformPageHeader
  title="Salon Accounts"
  description="Manage all salon organizations on the platform"
  backTo="/dashboard/platform/overview"
  actions={
    <PlatformButton onClick={handleCreate}>
      <Plus className="h-4 w-4" />
      New Account
    </PlatformButton>
  }
/>
```
