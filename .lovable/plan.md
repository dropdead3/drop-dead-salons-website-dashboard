
## Add-On Configurator: Fix, Elevate, and Wire Correctly

### What's Already Built

The foundation exists end-to-end: the `service_category_addons` database table, the `useCategoryAddons` hook, the `CategoryAddonManager` component, the `ServiceAddonToast`, and the wizard integration are all present. The table has no data yet because the admin UI is hard to discover and use.

---

### What Needs Fixing

**Problem 1: The manager is buried in the wrong place.**
`CategoryAddonManager` is rendered inside the `flex-1 min-w-0` name div of a horizontal drag-and-drop row. It competes with the row layout, gets truncated, and is invisible unless you know to look for it. The small chevron toggle is easy to miss completely.

**Fix:** Move the `CategoryAddonManager` *outside* the `SortableCategoryRow` horizontal flex container, rendering it as a full-width expansion panel *beneath* each category row. This gives the add-on form proper horizontal space.

**Problem 2: No at-a-glance indicator.**
Admins cannot see which categories have add-ons configured without clicking into each one. There is no badge or count.

**Fix:** Fetch the add-on count for each category inline and show a small pill badge ("2 add-ons") next to the service count.

**Problem 3: Admin selects from native services, wizard matches Phorest services.**
`availableServiceNames` is populated from `useServicesData` (native `services` table). But the booking wizard's add-on matching logic searches `phorest_services` by name. If a native service name doesn't exactly match a Phorest service name, the recommendation never fires. This is the most critical data integrity gap.

**Fix:** In `ServicesSettingsContent`, swap the source of `availableServiceNames` to pull from the Phorest services list via `useAllServicesByCategory` (which is already imported in the wizard). This ensures what admins configure maps exactly to what the wizard can find.

**Problem 4: Toast auto-dismiss bug.**
In the wizard's `onAdd` handler, `remaining` filters from `addonSuggestions` (a stale memoized snapshot), not from the live post-add state. If the last item is added, `remaining.length` may still show 1 instead of 0 because React state hasn't flushed yet.

**Fix:** Compare against the current length of `addonSuggestions` minus the just-added item. If `addonSuggestions.length === 1`, it means this is the last one — auto-dismiss immediately.

---

### Enhancements

**Enhancement 1: Dedicated Add-On section card on Services Settings.**
Rather than hiding the manager inside the category row, add a second collapsible panel card called "BOOKING ADD-ON RECOMMENDATIONS" beneath the Service Categories card. It lists each category with its configured add-ons and a clear "+ Configure" CTA. The existing `CategoryAddonManager` becomes the body of each row in this new card.

**Enhancement 2: Add-on count badge on the category row.**
Each category row gets a small secondary badge showing "N add-on(s)" when configured, so admins can see the setup state at a glance without expanding anything.

**Enhancement 3: Use Phorest service names in the admin form.**
When an admin picks "By Service," the dropdown must show Phorest service names (what the wizard actually searches). Pull these from `useAllServicesByCategory` and flatten them. This closes the name-mismatch gap.

**Enhancement 4: Empty state with onboarding guidance.**
When the add-on recommendations section has no data at all, show a calm empty state with an explanation of how the feature works and what it does for revenue.

---

### Files to Change

| File | Change |
|---|---|
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Move `CategoryAddonManager` outside the row, add add-on count badge, swap `availableServiceNames` to use Phorest services, add new "Booking Add-On Recommendations" card section |
| `src/components/dashboard/settings/CategoryAddonManager.tsx` | Accept and pass Phorest service names (already the right prop type), polish empty state, add add-on count display |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` | Fix the `onAdd` auto-dismiss logic (last-item detection) |

---

### Data Flow (After Fix)

```text
Admin (Settings):
  Selects "By Service" → picks from Phorest service names
  Saves → service_category_addons row: addon_service_name = "Olaplex Treatment"
                                        source_category_id = <Color category UUID>

Booking Wizard:
  Admin taps "Color" category
  → useAllCategoryAddons returns { [colorCategoryId]: [{ addon_service_name: "Olaplex Treatment" }] }
  → addonSuggestions matches phorest_services WHERE name = "Olaplex Treatment"
  → ServiceAddonToast slides up showing "Olaplex Treatment"
  → Admin clicks "+ Add" → service added to booking
```

---

### Technical Notes

- No database migration needed. The `service_category_addons` table and all RLS policies are already in place.
- The `useAllServicesByCategory` hook is already imported in the wizard — we can import it in `ServicesSettingsContent` as well to get the flat list of Phorest service names for the admin form.
- The fix to `CategoryAddonManager` position is purely structural (moving a JSX block out of a nested div into a sibling position in the list), not a data or logic change.
