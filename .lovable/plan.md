

## Fix Configure Button Navigation Target

### The Problem

The Configure button on the STYLISTS BY LEVEL card navigates to `/dashboard/admin/settings` without specifying which settings category to open. The admin settings page uses a `?category=` query parameter to determine which section to display. Without it, the page defaults to the first category instead of jumping to the Experience Levels section.

### The Fix

**File: `src/components/dashboard/StylistsOverviewCard.tsx`**

Update the `onClick` handler to navigate to `/dashboard/admin/settings?category=levels` instead of passing state:

```typescript
// Before
onClick={() => navigate('/dashboard/admin/settings', { state: { scrollTo: 'levels' } })}

// After
onClick={() => navigate('/dashboard/admin/settings?category=levels')}
```

This matches how the settings page reads its active category from `searchParams.get('category')` (line 590-593 of Settings.tsx), ensuring the levels section opens directly.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/StylistsOverviewCard.tsx` | Fix navigate URL to include `?category=levels` query param |

