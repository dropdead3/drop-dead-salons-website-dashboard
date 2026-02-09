
# Fix Preview Button Not Opening Kiosk

## Problem

The Preview button in the Deploy to Device card doesn't work. Clicking it does nothing - no new tab opens.

## Root Cause

The `window.open(kioskUrl, '_blank')` call is being blocked by the browser's popup blocker. Even though it's in an onClick handler, some browsers are stricter about this when:
- The code runs inside an iframe (Lovable's preview)
- There's any indirection between user action and the open call

## Solution

Replace `window.open()` with a native `<a>` tag using the Button's `asChild` prop. Browsers inherently trust anchor tags with `target="_blank"` for opening new tabs.

### Current Code (not working)
```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={handleOpenKiosk}
  className="gap-2"
>
  <ExternalLink className="w-4 h-4" />
  Preview
</Button>
```

### Fixed Code
```tsx
<Button 
  variant="outline" 
  size="sm"
  asChild
  className="gap-2"
>
  <a 
    href={kioskUrl} 
    target="_blank" 
    rel="noopener noreferrer"
  >
    <ExternalLink className="w-4 h-4" />
    Preview
  </a>
</Button>
```

## Changes

**File: `src/components/dashboard/settings/KioskDeployCard.tsx`**

1. Remove the `handleOpenKiosk` function (lines 33-37)
2. Replace Button with anchor tag using `asChild` pattern (lines 88-96)

## Why This Works

- Native `<a>` tags with `target="_blank"` are trusted by browsers
- The `asChild` prop from Radix Slot renders the Button styles onto the anchor
- `rel="noopener noreferrer"` ensures proper security

## File to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/settings/KioskDeployCard.tsx` | Replace Button onClick with anchor tag |
