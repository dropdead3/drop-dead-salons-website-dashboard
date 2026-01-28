

# Add "Create Announcement" Link Icon to Announcements Card

## Overview

Add a link/plus icon next to the existing pencil icon in the Announcements bento card header. This icon will provide permissioned users with a quick way to create a new announcement by linking directly to the announcements page with a "create" parameter.

---

## Current vs New Layout

```text
CURRENT (Right side of header):
┌─────────────────────────────────────────────────────────┐
│  ANNOUNCEMENTS ∧         [✏️ Pencil] [📢 Megaphone]    │
└─────────────────────────────────────────────────────────┘

NEW (Right side of header):
┌─────────────────────────────────────────────────────────┐
│  ANNOUNCEMENTS ∧    [✏️ Pencil] [🔗 Link/Plus]         │
└─────────────────────────────────────────────────────────┘
```

---

## Changes Required

### File: `src/components/dashboard/AnnouncementsBento.tsx`

1. **Import the `Link2` or `Plus` icon** from lucide-react
2. **Add a new Link component** next to the pencil icon that navigates to `/dashboard/admin/announcements?create=true`
3. **Gate the icon** behind the same `isLeadership` permission check

---

## Code Changes

### Update imports (line 6-12)

Add the `Link2` icon (chain link icon) for the "create announcement" action:

```tsx
import { 
  Megaphone, 
  Pin, 
  Pencil, 
  ChevronDown,
  ExternalLink,
  Link2,  // NEW: for create announcement link
} from 'lucide-react';
```

### Update header icons section (lines 72-89)

Add the new link icon alongside the pencil:

```tsx
<div className="flex items-center gap-3">
  {isLeadership && (
    <>
      <Link 
        to="/dashboard/admin/announcements" 
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Manage announcements"
      >
        <Pencil className="w-4 h-4" />
      </Link>
      <Link 
        to="/dashboard/admin/announcements?create=true" 
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Create new announcement"
      >
        <Link2 className="w-4 h-4" />
      </Link>
    </>
  )}
  {totalCount > 3 && (
    <Button variant="ghost" size="sm" asChild className="text-xs h-7">
      <Link to="/dashboard/admin/announcements">
        View All ({totalCount})
      </Link>
    </Button>
  )}
</div>
```

**Note:** The Megaphone icon is removed since it was just decorative and having pencil + link icons is cleaner.

---

## Icon Choice

Using **Link2** (chain link icon) as shown in the screenshot reference. This icon represents:
- Sharing/linking announcements
- Quick access to create/add functionality

Alternative: Could use `Plus` or `PlusCircle` if the intent is more clearly "create new".

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/AnnouncementsBento.tsx` | Add `Link2` import and new icon link for creating announcements |

