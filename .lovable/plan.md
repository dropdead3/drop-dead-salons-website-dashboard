
# Tokenize Navigation Badge Style

## What We're Doing
Extracting the notification badge styling from the sidebar into a reusable, tokenized component so the pattern is consistent everywhere and easy to maintain.

## Changes

### 1. Create `src/components/dashboard/NavBadge.tsx`
A small, reusable badge component with two visual states:
- **Active (selected nav item, light background):** Solid red (`bg-destructive text-destructive-foreground border-destructive`)
- **Inactive (dark sidebar background):** Glass-morphism red (`bg-red-950/60 text-red-300 border-red-500/40` with glow shadow)

The component will accept `count` and `isActive` props and handle the `9+` overflow logic internally.

### 2. Update `src/components/dashboard/SidebarNavContent.tsx`
Replace the inline badge markup (both the expanded and collapsed versions) with the new `NavBadge` component.

### 3. Commit to Memory
Store the notification badge design tokens and usage rules so future work automatically follows this pattern:
- Active state: solid destructive fill for contrast on white/light backgrounds
- Inactive state: luxury glass-morphism with subtle glow for dark sidebar contexts
- Size: `h-5 min-w-5`, `text-[10px]`, `rounded-md`
- Overflow: counts above 9 display as "9+"

## Technical Details

```text
NavBadge Props:
  count: number
  isActive?: boolean
  className?: string

Styles (tokenized):
  Base:    h-5 min-w-5 px-1.5 text-[10px] font-medium rounded-md border shadow-sm
  Active:  bg-destructive text-destructive-foreground border-destructive
  Inactive: bg-red-950/60 text-red-300 border-red-500/40 shadow-[0_0_8px_rgba(220,38,38,0.15)]
```
