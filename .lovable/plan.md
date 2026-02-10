

## Insights Nudge Banner -- Luxury Button Refinement

**What changes:**
The "View Insights" button on the nudge banner will switch from a solid filled style to an elegant outline/stroke style with matching text color, aligned with the premium aesthetic.

**Details:**
- Change the `Button` variant from `default` to `outline` in `InsightsNudgeBanner.tsx`
- Add `border-primary/30 text-primary hover:bg-primary/5` classes for a refined, luxury feel that matches the banner's gradient tones
- Keep the rounded-full shape from the base button styles

**Technical change:**
In `src/components/dashboard/InsightsNudgeBanner.tsx`, update the Button from:
```tsx
<Button size="sm" className="flex-shrink-0">
```
to:
```tsx
<Button size="sm" variant="outline" className="flex-shrink-0 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50">
```

This gives a subtle stroke border with the primary color text, and a delicate hover state -- consistent with the Drop Dead Premium luxury aesthetic.

