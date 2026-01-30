
# Add More Kerning to Termina Font

## Summary

Increase the letter-spacing (kerning) for the Termina display font from `0.05em` to `0.08em` for better visual rhythm and brand consistency. This change will apply globally to all elements using the `font-display` class.

---

## Current State

| Setting | Value | Tailwind Equivalent |
|---------|-------|---------------------|
| `letter-spacing` | `0.05em` | `tracking-wider` |

The Termina font rules are defined in `src/index.css` (lines 610-617):

```css
.font-display {
  text-transform: uppercase;
  letter-spacing: 0.05em;  /* Current value */
  font-style: normal !important;
  font-weight: 500 !important;
}
```

---

## Proposed Change

Increase letter-spacing to `0.08em` (between `tracking-wider` and `tracking-widest`):

| Setting | Old Value | New Value |
|---------|-----------|-----------|
| `letter-spacing` | `0.05em` | `0.08em` |

This provides noticeably more breathing room between characters while staying below the more dramatic `0.1em` used in specialty components like the brands marquee.

---

## Implementation

### Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Update `.font-display` letter-spacing to `0.08em` |
| `src/index.css` | Update `--tracking-display` CSS variable to `0.08em` |
| `src/pages/dashboard/DesignSystem.tsx` | Update documentation to reflect new tracking value |

### Code Changes

**1. Update CSS utility (src/index.css, line 614)**

```css
/* Before */
letter-spacing: 0.05em;

/* After */
letter-spacing: 0.08em;
```

**2. Update CSS variable (src/index.css, line 170)**

```css
/* Before */
--tracking-display: 0.05em;

/* After */
--tracking-display: 0.08em;
```

**3. Update Design System documentation (src/pages/dashboard/DesignSystem.tsx)**

Update the typography table to reflect the new tracking value:

```tsx
/* Before */
{ class: "font-display", font: "Termina", weight: "Medium (500 only)", transform: "UPPERCASE, tracking-wide", ... }

/* After */
{ class: "font-display", font: "Termina", weight: "Medium (500 only)", transform: "UPPERCASE, tracking-wider (0.08em)", ... }
```

---

## Visual Impact

Elements affected by this change:
- Navigation menu links
- Page headings using `font-display`
- Button text with `font-display`
- Card titles and section headers
- Platform admin interface headers

The increased kerning will give Termina a more refined, editorial appearance consistent with luxury branding.

---

## Alternative Values

If `0.08em` feels too tight or too loose:

| Value | Effect |
|-------|--------|
| `0.06em` | Subtle increase |
| `0.08em` | Recommended (balanced) |
| `0.1em` | Maximum (matches brands marquee) |
