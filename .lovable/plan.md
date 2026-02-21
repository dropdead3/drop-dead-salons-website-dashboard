

## Fix Contextual Direction Text for Bento Layout

### Change

Update the helper text in `ServiceAddonAssignmentsCard.tsx` to be responsive-aware:
- **Desktop (lg+)**: The add-ons library is to the **left**, not above
- **Mobile**: The add-ons library is **above** (stacked layout)

### Implementation

**File:** `src/components/dashboard/settings/ServiceAddonAssignmentsCard.tsx` (line 151)

Replace the static string with a responsive approach using the `useIsMobile` hook:

```tsx
// Import useIsMobile
import { useIsMobile } from '@/hooks/use-mobile';

// Inside component
const isMobile = useIsMobile();

// Updated text
<p className="text-sm text-muted-foreground">
  Create add-ons in the library to the {isMobile ? 'above' : 'left'} first, then assign them to categories and services here.
</p>
```

This keeps the directional context accurate regardless of viewport.

