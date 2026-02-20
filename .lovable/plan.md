
## Verification Report + Fix Plan: Add-On Configurator

### Current State

The Settings page is **crashing with an ErrorBoundary** on the Services tab. The configurator cannot be used at all in its current state.

---

### Bug 1 (P0 — Page Crash) — Empty String `value` on Radix `SelectItem`

**Error from console:**
```
Error: A <Select.Item /> must have a value prop that is not an empty string.
This is because the Select value can be set to an empty string to clear
the selection and show the placeholder.
```

**Root cause:** In `CategoryAddonManager.tsx` line 169, we added the "Label only" sentinel with `value=""`:
```tsx
<SelectItem value="" className="text-xs text-muted-foreground">
  Label only — no specific service
</SelectItem>
```

Radix UI's `Select` component explicitly prohibits empty string values on `SelectItem` — it uses `""` internally to represent "no selection / show placeholder." This causes a hard throw that React's ErrorBoundary catches, crashing the entire settings page.

**Fix:** Replace `value=""` with a non-empty sentinel string like `value="__none__"`, then handle it in `handleCreate`:
```tsx
<SelectItem value="__none__" className="text-xs text-muted-foreground italic">
  Label only — no specific service
</SelectItem>
```
And in `handleCreate`:
```tsx
addon_service_name: linkMode === 'service'
  ? (selectedService && selectedService !== '__none__' ? selectedService : null)
  : null,
```
And reset with `setSelectedService('__none__')` instead of `''`.

Same fix needed for the category picker — add a "No specific category" sentinel `value="__none__"` as the first item there too, so both dropdowns allow deselection.

---

### Bug 2 (P1) — Empty State Shows Simultaneously With Category List

In `ServicesSettingsContent.tsx` lines 405–416, the `EmptyState` for "No add-ons configured" renders even when `localOrder.length > 0`, because the condition is `totalAddonCount === 0` (not guarded by `localOrder.length === 0`). Then at line 418, the category list also renders. Both show at the same time when the org has categories but no add-ons yet. The empty state should be *replaced by* the category list, not stacked above it.

**Fix:** Change the conditional from `else if` / separate block to a single layout: show the guidance text *inside* the card content area above the list (as a quiet banner, not a full `EmptyState`) when `totalAddonCount === 0 && localOrder.length > 0`.

```tsx
{totalAddonCount === 0 && localOrder.length > 0 && (
  <div className="mb-3 px-3 py-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-start gap-2.5">
    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground leading-relaxed">
      Add-on recommendations surface high-margin services at exactly the right moment during booking.
      Expand a category below to configure its recommendations.
    </p>
  </div>
)}
```

---

### Bug 3 (P1) — Category Picker Has No "None" Option

The category `Select` (lines 187–200) lists categories but has no way to deselect once one is picked. If an admin accidentally selects a category, they must cancel the whole form. No sentinel item exists here (unlike the service picker which has the broken `""` sentinel). This is a form usability gap.

**Fix:** Add `value="__none__"` sentinel as the first item in the category picker with the same guard in `handleCreate`.

---

### Enhancement 1 — Form Validation: Require Label Before Showing Save

Currently `handleCreate` guards on `!addLabel.trim()`, but the Save button shows as disabled without any visual cue when the label is empty. The placeholder text "Label (e.g. Scalp Treatment)" disappears once you start typing, but there is no inline feedback if you try to save blank.

**Fix:** Add a red border state on the label `Input` when save is attempted with empty label:
```tsx
const [labelTouched, setLabelTouched] = useState(false);
// On input: setLabelTouched(true)
// className includes: labelTouched && !addLabel.trim() && 'border-destructive'
```

---

### Enhancement 2 — Add-On Row Should Show Current Add-Ons Count Inline (Not Just "N recommendations configured")

The row subtitle says "N recommendations configured" but doesn't name them. Admins can't see what's configured without clicking. A collapsed preview of the first 2–3 badge names would give at-a-glance visibility.

**Fix:** When `addonCount > 0 && !isExpanded`, show a muted inline chip list of the first 2 add-on labels followed by "..." if there are more:
```tsx
{!isExpanded && addonCount > 0 && (
  <p className="text-[11px] text-muted-foreground truncate">
    {addonMap[cat.id]?.slice(0, 2).map(a => a.addon_label).join(', ')}
    {addonCount > 2 ? ` +${addonCount - 2} more` : ''}
  </p>
)}
```

---

### Enhancement 3 — `useAllServices` May Return Empty Array If Phorest Not Connected

If Phorest sync hasn't run, `phorestServiceNames` is `[]`. The fallback message in `CategoryAddonManager` covers this case, but the message "No Phorest services synced yet" may alarm admins unnecessarily if they haven't set up Phorest. Change the copy to be softer:

**Fix:** Change the fallback text to:
> "No services loaded yet. You can still save a label-only recommendation, or sync your POS first."

---

### Files to Change

| File | Change |
|---|---|
| `src/components/dashboard/settings/CategoryAddonManager.tsx` | Replace empty-string `SelectItem` value with `"__none__"` sentinel in service picker; add same sentinel to category picker; update `handleCreate` to treat `"__none__"` as `null`; update `resetForm` to set `selectedService` and `selectedCategory` to `"__none__"`; soften empty services copy; add label validation visual feedback |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Replace stacked EmptyState + list pattern with inline guidance banner when `totalAddonCount === 0`; add collapsed preview of add-on names in each row subtitle |

### Priority Order

1. **Bug 1 (P0)** — Fix empty string `SelectItem` crash — page is completely broken without this
2. **Bug 2 (P1)** — Fix empty state / list stacking layout
3. **Bug 3 (P1)** — Add "None" sentinel to category picker
4. **Enhancement 2** — Collapsed add-on name preview in row
5. **Enhancement 1** — Label validation visual
6. **Enhancement 3** — Softer fallback copy

No database or RLS changes needed. The crash fix is one string change; everything else is UI polish.
