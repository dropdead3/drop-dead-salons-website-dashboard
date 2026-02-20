
## Add-On Configurator: Gap Fixes + Enhancements

### What Was Found

The configurator UI is fully rendered and structurally correct. The add-on card, per-category expand rows, Phorest service dropdown, and wizard toast are all wired. However, there are **two critical bugs** that prevent the configurator from functioning for the current user type (Super Admin / platform user), plus several UX gaps.

---

### Bug 1 (Critical) — Expand Panel Never Renders for Platform/Super Admin Users

**Root cause:**
The expand guard on line 454:
```tsx
{isExpanded && effectiveOrganization?.id && (
  <CategoryAddonManager ... organizationId={effectiveOrganization.id} />
)}
```
`effectiveOrganization` is `null` for platform users (Super Admins) unless they have explicitly selected an org via the org switcher. So the panel's condition always evaluates to false — the expand works (chevron toggles) but nothing renders beneath it.

**Fix:**
Resolve a local `resolvedOrgId` that falls back to `userOrganizations[0]?.id` — exactly the same pattern used in `TeamChat.tsx`. Use `resolvedOrgId` for both the `CategoryAddonManager` guard and the `useAllCategoryAddons` hook call.

```tsx
// Resolved org ID: effective org first, fall back to first accessible org (for platform users)
const resolvedOrgId = effectiveOrganization?.id || userOrganizations[0]?.id;
```

Then use `resolvedOrgId` in:
- `useAllCategoryAddons(resolvedOrgId)` — so the badge counts populate
- The expand guard: `{isExpanded && resolvedOrgId && ...}`
- `organizationId={resolvedOrgId}` passed to `CategoryAddonManager`

---

### Bug 2 (Critical) — Add-On Count Badges Always Show 0 / Empty State Always Shows

Same root cause as Bug 1. `useAllCategoryAddons(effectiveOrganization?.id)` is called with `undefined` for platform users → the hook is disabled (its `enabled: !!organizationId` guard), so `addonMap` is always `{}`. This means:
- The "✦ 2 add-ons" badges in the Service Categories card never appear
- The "NO ADD-ONS CONFIGURED" empty state shows even if add-ons exist
- `totalAddonCount` is always 0

**Fix:** Same `resolvedOrgId` fix above resolves this automatically.

---

### Bug 3 — No Feedback When Phorest Services Are Empty in "By Service" Mode

In `CategoryAddonManager`, the "Specific Service" select only renders when `availableServiceNames.length > 0`:
```tsx
{linkMode === 'service' && availableServiceNames.length > 0 && (
  <Select ...>
```
If the list is empty, nothing shows — the admin clicks "Specific Service", the select disappears, and there's no explanation. They can still save with just a label (which is valid), but the UX is confusing.

**Fix:** Show a muted helper note when in "service" mode but no names are available:
```tsx
{linkMode === 'service' && availableServiceNames.length === 0 && (
  <p className="text-[11px] text-muted-foreground">
    No Phorest services synced yet. You can still save a label-only recommendation.
  </p>
)}
```

---

### Enhancement 1 — "By Service" Dropdown Needs a Clear Value Option

Once an admin selects a service from the dropdown, there's no way to deselect it (to save a label-only recommendation instead). The Select has no "None / label only" option.

**Fix:** Add a sentinel "Label only (no service link)" option as the first item:
```tsx
<SelectItem value="" className="text-xs text-muted-foreground">
  Label only — no specific service
</SelectItem>
```
And handle `selectedService === ''` as `null` in the `handleCreate` payload (already done: `selectedService || null`).

---

### Enhancement 2 — "By Category" Dropdown Should Exclude Self-Referencing

Currently `availableCategories` is passed as all categories except the current one. This is correct. However, "Block" and "Break" categories are filtered from `localOrder` in `serviceCategories` but the `availableCategories` list in the expand still comes from `localOrder` which may include them.

**Fix:** In the `CategoryAddonManager` props, filter `availableCategories` to exclude Block/Break:
```tsx
availableCategories={localOrder
  .filter(c => c.id !== cat.id && !['Block', 'Break'].includes(c.category_name))
  .map(c => c.category_name)}
```

---

### Enhancement 3 — Link Type Indicator on Saved Add-On Badges

Currently saved add-on badges show:
```
[Scalp Treatment · K18 Treatment Add-On ×]
```
The `·` separator is generic. A small icon would make it instantly clear what type of link it is:

- Service link: `🔗 K18 Treatment Add-On`
- Category link: `📁 Extras`

Use Lucide `Link2` and `FolderOpen` icons instead of `·` to visually distinguish the link type.

---

### Enhancement 4 — Auto-Open First Category When Empty State Exists

When total add-ons = 0, the empty state says "Expand any category below to configure." But the categories are all collapsed. One good UX nudge: when there are no add-ons configured at all, auto-expand the first category row so admins immediately see the `CategoryAddonManager` and know what to do.

**Fix:** In `useEffect` or initial state, if `totalAddonCount === 0 && localOrder.length > 0`, pre-seed `expandedAddonRows` with `localOrder[0].id`.

---

### Files to Change

| File | Change |
|---|---|
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Pull `userOrganizations` from context; compute `resolvedOrgId`; pass to `useAllCategoryAddons` and `CategoryAddonManager`; fix `availableCategories` to exclude Block/Break; auto-expand first row when empty |
| `src/components/dashboard/settings/CategoryAddonManager.tsx` | Add "no services" fallback note in service link mode; add "Label only" sentinel select item; swap `·` for `Link2`/`FolderOpen` icons on saved badges |

No database migrations or RLS changes needed. The table and policies are fully correct.

---

### Priority Order

1. **Bug 1 + 2** — `resolvedOrgId` fix (unblocks all configuration for Super Admin users) — highest priority, one change, immediate unblock
2. **Bug 3** — Empty service list feedback
3. **Enhancement 1** — "Label only" deselect in dropdown
4. **Enhancement 2** — Block/Break filter in category list
5. **Enhancement 3** — Link type icons on badges
6. **Enhancement 4** — Auto-expand first row when empty
