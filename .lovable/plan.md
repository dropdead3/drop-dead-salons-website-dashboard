

## Location Comparison Card Enhancements

Three targeted upgrades to the location comparison cards, aligned with the luxury aesthetic.

---

### 1. Colored Share Progress Bars

The "Share of total" progress bar currently uses the default `bg-primary` fill. We will tint it to match each location's assigned chart color, creating visual continuity between the donut/bar chart and the cards.

**What changes:**
- Pass the location `color` prop into the `Progress` component via `indicatorClassName` using an inline style approach, or wrap it with a styled div.
- Since `Progress` already supports `indicatorClassName`, we will use a small wrapper approach: set the indicator background to the location's color using a style override.

---

### 2. Staggered Card Entrance Animation

Cards will fade-in and slide-up sequentially when the section mounts, creating a cascading reveal that complements the donut's clockwise sweep.

**What changes:**
- In `LocationComparison.tsx`, wrap the card grid with `framer-motion` and apply staggered `variants` to each `LocationComparisonCard`.
- Each card gets a `motion.div` wrapper with a delay based on its index (e.g., `i * 0.08s`).
- Animation: fade from 0 + translateY(12px) to full opacity and y=0, with spring easing.

---

### 3. Service-to-Product Ratio Mini Bar

A thin inline split bar showing the revenue mix between services and products at a glance, placed between the share bar and the metric grid.

**What changes:**
- Add a new section in `LocationComparisonCard` below the share progress bar.
- Render a thin (h-1.5) rounded bar split into two segments: services (primary color) and products (muted/secondary color).
- Label it with "Services vs Products" and show percentages on hover via tooltips.
- Uses the existing `serviceRevenue` and `productRevenue` fields already available on the card data.

---

### Technical Details

**Files modified:**
- `src/components/dashboard/sales/location-comparison/LocationComparisonCard.tsx` — colored progress bar indicator, service/product ratio mini bar
- `src/components/dashboard/sales/LocationComparison.tsx` — staggered motion wrapper around card grid items

**No new dependencies required.** Uses existing `framer-motion`, `Progress` component, and `Tooltip` components.

