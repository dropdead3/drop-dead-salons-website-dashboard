

# Add Announcement Filtering & Audience Display

## Overview

Add filtering controls to view announcements by location (company-wide, or specific locations), and display an audience badge on each announcement card showing who it applies to.

---

## Current State

- Announcements already have a `location_id` column (nullable - `NULL` = company-wide)
- The admin page already shows location badges on announcement cards via `DraggableAnnouncementCard`
- The dashboard `AnnouncementsBento` component fetches announcements based on user's location access but doesn't have user-facing filter controls
- No audience badge is displayed on the dashboard announcement cards

---

## Changes Required

### 1. Add Filter Dropdown to AnnouncementsBento Header

Add a small filter dropdown next to the "ANNOUNCEMENTS" title that allows filtering:
- **All** (default) - shows company-wide + user's location-specific
- **Company-Wide** - shows only company-wide announcements (where `location_id` is null)
- **[Location Name]** - shows only that location's announcements

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ANNOUNCEMENTS ∧   [All ▼]                        [✏️] [+]  View All│
└─────────────────────────────────────────────────────────────────────┘
                      ↓
                   ┌──────────────────┐
                   │ All              │
                   │ Company-Wide     │
                   │ ──────────────── │
                   │ Mesa             │
                   │ Gilbert          │
                   └──────────────────┘
```

### 2. Add Audience Badge to Each Announcement Card

Display a small badge on each announcement card showing its audience:
- **Globe icon + "All"** for company-wide announcements
- **MapPin icon + Location Name** for location-specific announcements

The badge will appear near the date at the bottom of each card.

```text
┌─────────────────────────────────────────────────┐
│  📌 Dead Fest! October 13                       │
│  Get your tickets!                              │
│                                                 │
│  Jan 23           🌐 All        [Get Tickets →] │
└─────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File: `src/components/dashboard/AnnouncementsBento.tsx`

**1. Add imports:**
- Import `Globe`, `MapPin` from lucide-react
- Import `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from UI components
- Import `useActiveLocations` from hooks

**2. Add filter state and location data:**
```typescript
const [locationFilter, setLocationFilter] = useState<string>('all');
const { data: locations = [] } = useActiveLocations();
```

**3. Add props for location resolution:**
```typescript
interface AnnouncementsBentoProps {
  announcements: Announcement[] | undefined;
  isLeadership: boolean;
  locations?: { id: string; name: string }[]; // For resolving location names
}
```

**4. Filter announcements client-side based on selection:**
```typescript
const filteredAnnouncements = useMemo(() => {
  if (!announcements) return [];
  if (locationFilter === 'all') return announcements;
  if (locationFilter === 'company-wide') {
    return announcements.filter(a => a.location_id === null);
  }
  return announcements.filter(a => a.location_id === locationFilter);
}, [announcements, locationFilter]);
```

**5. Add filter dropdown in header (before leadership icons):**
```tsx
<Select value={locationFilter} onValueChange={setLocationFilter}>
  <SelectTrigger className="h-7 w-[120px] text-xs">
    <SelectValue placeholder="All" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All</SelectItem>
    <SelectItem value="company-wide">Company-Wide</SelectItem>
    {locations.map(loc => (
      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**6. Add audience badge to each announcement card:**
```tsx
<div className="flex items-center gap-2 text-xs text-muted-foreground/60">
  <span>{format(new Date(announcement.created_at), 'MMM d')}</span>
  <span>·</span>
  <span className="flex items-center gap-1">
    {announcement.location_id ? (
      <>
        <MapPin className="w-3 h-3" />
        {locations?.find(l => l.id === announcement.location_id)?.name || 'Location'}
      </>
    ) : (
      <>
        <Globe className="w-3 h-3" />
        All
      </>
    )}
  </span>
</div>
```

### File: `src/pages/dashboard/DashboardHome.tsx`

Pass locations data to `AnnouncementsBento`:
```tsx
<AnnouncementsBento 
  announcements={announcements} 
  isLeadership={isLeadership}
  locations={accessibleLocations}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AnnouncementsBento.tsx` | Add filter dropdown, add audience badge to cards, accept locations prop |
| `src/pages/dashboard/DashboardHome.tsx` | Pass locations to AnnouncementsBento |

---

## User Experience

| Filter Selection | What User Sees |
|------------------|----------------|
| **All** (default) | All announcements the user has access to (company-wide + their locations) |
| **Company-Wide** | Only announcements with no location restriction |
| **Mesa** | Only announcements targeted specifically to Mesa |

Each announcement card displays a small badge showing:
- 🌐 **All** - for company-wide announcements
- 📍 **Mesa** - for Mesa-specific announcements

This makes it immediately clear who each announcement is intended for.

