

# Add Zura Avatar to Replace Generic Icons

## Overview
Create a dedicated Zura avatar component and use it across all AI panels to give Zura a consistent, branded visual identity -- replacing the generic Sparkles and Bot icons.

## Design
The Zura avatar will be a small circular badge with a "Z" letter mark in the primary brand color, styled consistently across all placements. This keeps things lightweight (no external image dependency) while giving Zura a distinct personality.

## Changes

### 1. Create `src/components/ui/ZuraAvatar.tsx`
A reusable component that renders a circular avatar with a stylized "Z" letter:
- Accepts `size` prop ("sm" | "md" | "lg") for different contexts
- Uses primary brand color with a soft background glow
- Clean, modern look with rounded-full styling

### 2. Update `src/components/dashboard/help-fab/AIHelpTab.tsx`
- Replace the `Sparkles` icon in the empty state with the new `ZuraAvatar` (medium size)

### 3. Update `src/components/team-chat/AIChatPanel.tsx`
- Replace the `Bot` icon in the sheet header with `ZuraAvatar` (small size)
- Replace the `Sparkles` icon in the empty state with `ZuraAvatar` (medium size)

### 4. Update `src/components/dashboard/AIInsightsCard.tsx`
- Replace the "Powered by Zura AI" `Sparkles` icon with `ZuraAvatar` (small size)
- Replace the "No insights yet" `Sparkles` icon with `ZuraAvatar` (medium size)

### 5. Update `src/components/dashboard/AIInsightsDrawer.tsx`
- Same replacements as the Card variant above

## Technical Details

The `ZuraAvatar` component structure:
```tsx
// Sizes: sm (h-6 w-6), md (h-10 w-10), lg (h-12 w-12)
<div className="rounded-full bg-primary/10 flex items-center justify-center">
  <span className="font-bold text-primary">Z</span>
</div>
```

No new dependencies required. The FAB button icon (MessageCircleQuestion) stays as-is since it serves a different UX purpose (general help trigger, not Zura-specific).

### Files Created
- `src/components/ui/ZuraAvatar.tsx`

### Files Modified
- `src/components/dashboard/help-fab/AIHelpTab.tsx`
- `src/components/team-chat/AIChatPanel.tsx`
- `src/components/dashboard/AIInsightsCard.tsx`
- `src/components/dashboard/AIInsightsDrawer.tsx`
