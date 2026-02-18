

## Add Hover States to All Tab Triggers

### What Changes

Add a subtle hover interaction to inactive tab triggers across all three pill-style variants (main tabs, filter tabs, and the responsive overflow trigger). When hovering an inactive tab, a faint ring/stroke appears along with a text color shift, signaling clickability without competing with the active state.

### Hover Treatment

- **Inactive hover**: `hover:ring-1 hover:ring-black/[0.06] dark:hover:ring-white/[0.08] hover:text-foreground/80`
- **Active tabs already have their own ring**, so the hover ring is scoped to inactive only via `data-[state=inactive]:hover:...`
- This creates a gentle "ghost outline" effect on hover that disappears when the tab becomes active

### File Changed

**`src/components/ui/tabs.tokens.ts`** (single file, all token definitions)

1. **`trigger`** (line 4-6) — Add inactive hover classes:
   ```
   data-[state=inactive]:hover:ring-1 data-[state=inactive]:hover:ring-black/[0.06] dark:data-[state=inactive]:hover:ring-white/[0.08] data-[state=inactive]:hover:text-foreground/80
   ```

2. **`filterTrigger`** (line 17-19) — Same hover classes scaled to the compact variant:
   ```
   data-[state=inactive]:hover:ring-1 data-[state=inactive]:hover:ring-black/[0.06] dark:data-[state=inactive]:hover:ring-white/[0.08] data-[state=inactive]:hover:text-foreground/80
   ```

3. **`tabs.tsx`** — The inline classes on `TabsTrigger` (which duplicate the token instead of using it) also need the same hover addition to stay in sync.

### Why This Approach

- Uses `data-[state=inactive]` so the hover ring never conflicts with the active state's stronger ring
- Matches the existing dual-mode light/dark pattern (black tints in light, white tints in dark)
- The `subTrigger` already has hover states (`hover:text-foreground hover:bg-muted/50`) so it needs no changes
- Single token file change propagates everywhere these tabs are used

