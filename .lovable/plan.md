

## Fix: Replace Grayed-Out Avatar with Urgent "No Services" Badge

### Problem
Empty categories (like Vivids) apply `opacity-50` to the avatar, making it look washed out and breaking the gradient visual. The user wants the avatar at full opacity with an urgent badge instead.

### Changes

**File: `src/components/dashboard/settings/ServicesSettingsContent.tsx`**

1. **Remove `opacity-50`** from the avatar button className (line 341) -- the avatar will always render at full color regardless of service count.

2. **Replace the "Empty" italic text** (line 390-391) with an urgent-style badge. Instead of showing muted italic "Empty", render a small red badge reading "No services" using the same visual language as `NavBadge` (destructive background, small text, rounded).

The badge will be inline next to the category name subtext area:
```
Vivids
[No services]   <-- small red/destructive badge
```

### Technical Detail

- Line 341: Remove `isEmpty && "opacity-50"` from the `cn()` call
- Lines 390-392: Replace the empty-state text with a small inline badge:
  ```tsx
  {isEmpty 
    ? <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-destructive/15 text-destructive border border-destructive/25">No services</span>
    : <p className={tokens.body.muted}>{serviceCount} service{serviceCount !== 1 ? 's' : ''}</p>
  }
  ```

This keeps the avatar vibrant and shifts the "empty" signal to a clear, urgent badge that matches the platform's alert styling conventions.

