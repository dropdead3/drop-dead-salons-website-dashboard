
# Fix: Dotted Line Flush Connection to Daily/Weekly Average Badge

## Problem
The dotted reference line does not connect flush to the badge because `estimatedBadgeWidth = avgText.length * 8 + 20` is a rough guess that doesn't match the actual rendered width. Character widths vary (e.g., "$" vs "i"), making any per-character multiplier unreliable.

## Solution
Replace the `foreignObject` + HTML `div` badge with a native **SVG `<text>` + `<rect>`** approach. Use a `ref` callback on the `<text>` element to call `getComputedTextLength()`, which gives the **exact pixel width** of the rendered text. Then position the dotted line's `x1` precisely at `chartLeft + measuredTextWidth + padding`.

Since we're inside a Recharts `<Customized>` render function (not a React component), we'll use the SVG text element's `ref` to imperatively update the sibling `<line>` and `<rect>` positions on mount.

## Technical Changes

### File: `src/components/dashboard/sales/ForecastingCard.tsx`

**For both Daily and Weekly average reference lines:**

Replace the `foreignObject` + HTML div with:
```tsx
<rect> // background rectangle, positioned after text measurement
<text> // the label text, with ref callback that measures and updates rect + line
<line> // dotted reference line, x1 set by measurement
```

The ref callback on `<text>` will:
1. Call `getComputedTextLength()` to get exact text width
2. Set the `<rect>` width to `textWidth + horizontal padding`
3. Set the `<line>` x1 to `chartLeft + textWidth + total padding`

This eliminates the guesswork entirely -- the line will always start exactly where the badge ends, regardless of font rendering differences.

### Specific implementation
- Use a self-contained render function that returns a `<g>` group
- The `<text>` ref callback uses `parentElement.querySelector` to find and update the sibling `<line>` and `<rect>` x/width attributes imperatively
- Badge styling (background blur, border, rounded corners) will be replicated with SVG `<rect>` with `rx` for rounded corners, `fill` with opacity, and `stroke`
- Font styling matches current: 12px, weight 600, orange color
