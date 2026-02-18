

## Add Spacing Between Tab Buttons

### Problem

The current `gap-0.5` (2px) between tab triggers is too tight. When hovering an inactive tab next to the active one, their ring strokes nearly touch or overlap, creating a cramped feel.

### Solution

Increase the gap from `gap-0.5` to `gap-1` (4px) across all pill-style tab list variants. This gives each button breathing room so the hover ring and active ring never collide visually.

### Changes

**File: `src/components/ui/tabs.tokens.ts`**

1. **`list`** (line 2): Change `gap-0.5` to `gap-1`
2. **`filterList`** (line 16): Change `gap-0.5` to `gap-1`

**File: `src/components/ui/tabs.tsx`**

3. **`TabsList`** (line 19): Change the inline `gap-0.5` to `gap-1` to stay in sync with the token

**File: `src/components/ui/tabs.tokens.ts`**

4. **`RESPONSIVE_TABS_LAYOUT.listToOverflowGapPx`** (line 27): Update from `2` to `4` so the responsive overflow measurement math stays accurate with the new gap

These are four single-token edits across two files. No structural or behavioral changes -- just visual breathing room.

