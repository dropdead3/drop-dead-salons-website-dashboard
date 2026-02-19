

## Move "Assisted by" Badge Inline with Stylist Name

Currently, "Assisted by [Name.]" sits on its own line below the service. The change moves it to the same row as the stylist name, anchored to the right side, styled as a subtle badge.

### Layout Change

Current:
```
Sarah M.
Balayage & Tone on Jessica Smith
Assisted by Jamie R.
Appointment 3 of 5
```

After:
```
Sarah M.                    [Assisted by Jamie R.]
Balayage & Tone on Jessica Smith
Appointment 3 of 5
```

### Technical Details

**File: `src/components/dashboard/LiveSessionDrilldown.tsx`**

1. Wrap the stylist name line (line 117) in a flex row with `items-center justify-between`
2. Move the "Assisted by" block (lines 123-126) inside that same flex row, to the right
3. Restyle it as a badge: small rounded pill with `bg-muted/60 text-muted-foreground/80 text-[10px] px-2 py-0.5 rounded-full italic whitespace-nowrap`
4. Remove the old standalone "Assisted by" paragraph

Single file change, ~10 lines modified.
