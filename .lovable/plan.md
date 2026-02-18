

## Apply Glassmorphism to Help FAB

### What's Changing

The Help FAB button (bottom-right corner) currently uses a solid `bg-primary` fill. It will be updated to match the top bar's glass treatment: translucent background, heavy backdrop blur, and a subtle border for that frosted glass edge.

### Visual Effect

```text
Before:  Solid black circle, opaque fill
After:   Translucent bg-card/50, backdrop-blur-2xl, 
         1px border-border/15 glass edge, 
         shadow retained for floating depth
```

### Technical Details

**File:** `src/components/dashboard/HelpFAB.tsx`

Two Button instances need updating (schedule page button at line 41-44, and main popover button at lines 68-71):

| Location | Current Classes | New Classes |
|----------|----------------|-------------|
| Schedule FAB (line 43) | `h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow` | `h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-2xl border border-border/15 text-foreground hover:bg-card/60` |
| Main FAB (line 70) | `h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow` | `h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-2xl border border-border/15 text-foreground hover:bg-card/60` |

Both buttons also need `variant="ghost"` added to prevent the default primary background from overriding the glass styles.

