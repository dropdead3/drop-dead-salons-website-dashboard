

# Redesign ErrorBoundary to Match Zura Brand

## Overview

Rebuild the ErrorBoundary screen to feel like a Zura-branded, advisory-tone experience instead of a generic "Something broke" page. It will mirror the existing 404 page's visual language (PixelZMark, dark-ready theming, font-display typography) and use calm, structured copy aligned with the brand voice.

## What Changes

### File: `src/components/ErrorBoundary.tsx`

1. **Replace the DD75 logo** with the `PixelZMark` component (the animated pixel "Z" grid already used on the 404 page). Since ErrorBoundary is a class component and PixelZMark uses hooks (framer-motion), we'll extract the render into a functional `ErrorFallback` component and keep the class component as a thin wrapper.

2. **Update the copy** from generic "Something broke" to advisory Zura tone:
   - Headline: "Unexpected interruption" (not shame language, not hype)
   - Subtext: "Zura encountered a rendering issue. Your data is safe. Reload to resume, or return to your dashboard."
   - Error detail label: small "DETAIL" tracking text above the error message

3. **Match the 404 page's visual structure**:
   - Same layout: centered column, `max-w-3xl`, rounded card housing the PixelZMark
   - Same typography: `font-display`, `tracking-[0.16em]`, uppercase headlines
   - Same button pattern: outline "Go back" + primary "Reload"
   - Dev-only stack trace stays, styled consistently

4. **Component architecture**:
   - `ErrorBoundary` class component stays (React requires class for error boundaries)
   - New inner `ErrorFallback` functional component receives `error` and action handlers as props
   - `PixelZMark` is extracted to a shared file (`src/components/ui/PixelZMark.tsx`) so both the 404 page and ErrorBoundary can import it without duplication

### New File: `src/components/ui/PixelZMark.tsx`

Extract the existing `PixelZMark` component from `src/pages/NotFound.tsx` into its own shared file. Both `NotFound.tsx` and `ErrorBoundary.tsx` will import from here.

### File: `src/pages/NotFound.tsx`

Update to import `PixelZMark` from the new shared location instead of defining it inline. No visual changes.

## Visual Layout

```text
+------------------------------------------+
|                                          |
|          [  Pixel Z Mark card  ]         |
|                                          |
|         UNEXPECTED INTERRUPTION          |
|                                          |
|   Zura encountered a rendering issue.    |
|   Your data is safe.                     |
|                                          |
|   DETAIL                                 |
|   A rendering error occurred.            |
|                                          |
|       [ Go home ]   [ Reload ]           |
|                                          |
|   (dev only: stack trace below)          |
+------------------------------------------+
```

## Technical Details

### Files to Create

| File | Purpose |
|---|---|
| `src/components/ui/PixelZMark.tsx` | Shared animated pixel Z mark component extracted from NotFound |

### Files to Modify

| File | Change |
|---|---|
| `src/components/ErrorBoundary.tsx` | Full redesign: use PixelZMark, advisory copy, font-display typography, functional ErrorFallback inner component |
| `src/pages/NotFound.tsx` | Import PixelZMark from shared location, remove inline definition |

### Design Rules Followed
- No `font-bold` or `font-semibold` (max `font-medium`)
- `font-display` for headlines with uppercase + wide tracking
- `font-sans` for body text, normal case
- Advisory tone: no shame, explains what happened and what to do
- Semantic theme colors (`bg-background`, `text-foreground`, `text-muted-foreground`)
