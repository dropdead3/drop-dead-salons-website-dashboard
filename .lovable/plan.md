

## Reorder Badge and Fix Width

### File: `src/components/dashboard/analytics/BookingPipelineContent.tsx`

### Changes

1. **Move badge before location name** (lines 263-271): Swap the order so the badge `span` comes first, then the location name.

2. **Add fixed width to badge**: Add `w-[4.5rem] justify-center` to the badge span so all badges ("Critical", "Slowing", "Healthy") render at the same width regardless of label length.

### Result

```text
[Critical]  NORTH MESA                    v
[Slowing ]  VAL VISTA LAKES               v
```

All badges left-aligned, same width, clean visual alignment of location names.

