
## Add Account Number Identification to Organization Selectors

This plan will update organization selectors across the platform to display the unique account number alongside the organization name, making it easier to distinguish between accounts with similar or identical names.

---

### Problem

Organizations may have similar or identical names across different states/regions. Currently, the organization selectors show the slug as the differentiator, but the unique `account_number` (starting at 1000) provides a clearer, more consistent identifier.

---

### Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/dashboard/platform/PlatformImport.tsx` | **Edit** | Update Select dropdown to show `#account_number` instead of `(slug)` |
| `src/components/platform/OrganizationSwitcher.tsx` | **Edit** | Update CommandItem display to show `#account_number` as secondary identifier |

---

### Implementation Details

#### 1. Update Data Migration Selector (`PlatformImport.tsx`)

Change the organization display from:
```
[Icon] Organization Name (slug)
```

To:
```
[Icon] Organization Name  #1234
```

The account number will be displayed as a styled badge/tag to the right, providing clear visual differentiation.

#### 2. Update Organization Switcher (`OrganizationSwitcher.tsx`)

For both Active and Onboarding account groups, change from:
```
[Icon] Organization Name
       slug
```

To:
```
[Icon] Organization Name
       #1234
```

The account number replaces the slug as the secondary identifier since it's more unique and meaningful for differentiating similar accounts.

---

### Visual Design

The account number will be formatted consistently as `#XXXX` (e.g., `#1001`, `#1234`) matching the existing pattern used in:
- Accounts table: `#1234` in slate-500 text
- Account detail: `Account #1234`
- Edit dialog footer: `Account #1234`

---

### Technical Notes

- The `account_number` field is already available in the `Organization` type from `useOrganizations` hook
- No database or hook changes required
- Null safety: If `account_number` is null, fall back to displaying the slug
- The CommandInput search in OrganizationSwitcher will continue to work as it searches the entire item content
