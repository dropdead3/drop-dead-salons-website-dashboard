
# Add Multi-Level Filters to Platform Accounts

## Summary

Add cascading filters to the Accounts page allowing filtering by Country, State/Province, Account Type (subscription tier), and Business Type. The filters will be dynamic - the State/Province dropdown will only show options relevant to the selected Country.

---

## Current State

The Accounts page currently has:
- Search input (name/slug)
- Status filter dropdown (all/pending/active/suspended/churned)

The data is already available:
- `primaryLocation.country` and `primaryLocation.state_province` from aggregated location data
- `subscription_tier` on organization
- `business_type` on organization

---

## Filter Design

### Filter Hierarchy

```text
+-------------+  +-----------------+  +--------------+  +---------------+
|   Country   |  | State/Province  |  | Account Type |  | Business Type |
|   (US, CA)  |  | (AZ, CA, TX...) |  | (Starter...) |  | (Salon, Spa)  |
+-------------+  +-----------------+  +--------------+  +---------------+
       |                 |
       +-----------------+
       Cascading: State options
       filtered by Country
```

### Filter Options

| Filter | Options | Source |
|--------|---------|--------|
| Country | Dynamic from data + "All Countries" | `primaryLocation.country` |
| State/Province | Dynamic, filtered by country + "All States" | `primaryLocation.state_province` |
| Account Type | Starter, Standard, Professional, Enterprise | `subscription_tier` |
| Business Type | Salon, Spa, Esthetics, Barbershop, Med Spa, Wellness, Other | `business_type` |

---

## Implementation

### 1. Add Filter State Variables

```typescript
const [countryFilter, setCountryFilter] = useState<string>('all');
const [stateFilter, setStateFilter] = useState<string>('all');
const [planFilter, setPlanFilter] = useState<string>('all');
const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
```

### 2. Extract Unique Values from Data

```typescript
// Get unique countries and states from the data
const { countries, statesByCountry } = useMemo(() => {
  const countrySet = new Set<string>();
  const stateMap = new Map<string, Set<string>>();
  
  organizations?.forEach(org => {
    const country = org.primaryLocation?.country || 'US';
    const state = org.primaryLocation?.state_province;
    
    countrySet.add(country);
    if (state) {
      if (!stateMap.has(country)) stateMap.set(country, new Set());
      stateMap.get(country)!.add(state);
    }
  });
  
  return {
    countries: Array.from(countrySet).sort(),
    statesByCountry: stateMap,
  };
}, [organizations]);

// Get states for selected country
const availableStates = useMemo(() => {
  if (countryFilter === 'all') {
    // Show all states across all countries
    const allStates = new Set<string>();
    statesByCountry.forEach(states => states.forEach(s => allStates.add(s)));
    return Array.from(allStates).sort();
  }
  return Array.from(statesByCountry.get(countryFilter) || []).sort();
}, [countryFilter, statesByCountry]);
```

### 3. Update Filter Logic

```typescript
const filteredOrganizations = organizations?.filter(org => {
  const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
  const matchesCountry = countryFilter === 'all' || 
    (org.primaryLocation?.country || 'US') === countryFilter;
  const matchesState = stateFilter === 'all' || 
    org.primaryLocation?.state_province === stateFilter;
  const matchesPlan = planFilter === 'all' || org.subscription_tier === planFilter;
  const matchesBusinessType = businessTypeFilter === 'all' || 
    org.business_type === businessTypeFilter;
  
  return matchesSearch && matchesStatus && matchesCountry && 
         matchesState && matchesPlan && matchesBusinessType;
});
```

### 4. Reset State When Country Changes

```typescript
// Reset state filter when country changes
useEffect(() => {
  setStateFilter('all');
}, [countryFilter]);
```

### 5. Add Filter UI Components

Add four new Select dropdowns in the filter section, arranged in a responsive grid:

```tsx
<div className="flex flex-col gap-4">
  {/* Row 1: Search + Status */}
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="relative flex-1">
      <PlatformInput ... />
    </div>
    <Select value={statusFilter} ...>
      {/* Status options */}
    </Select>
  </div>
  
  {/* Row 2: Geography + Type filters */}
  <div className="flex flex-wrap gap-4">
    {/* Country Filter */}
    <Select value={countryFilter} onValueChange={setCountryFilter}>
      <SelectTrigger className="w-[160px] ...">
        <SelectValue placeholder="Country" />
      </SelectTrigger>
      <SelectContent ...>
        <SelectItem value="all">All Countries</SelectItem>
        {countries.map(country => (
          <SelectItem key={country} value={country}>{country}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    
    {/* State/Province Filter */}
    <Select value={stateFilter} onValueChange={setStateFilter}>
      <SelectTrigger className="w-[160px] ...">
        <SelectValue placeholder="State" />
      </SelectTrigger>
      <SelectContent ...>
        <SelectItem value="all">All States</SelectItem>
        {availableStates.map(state => (
          <SelectItem key={state} value={state}>{state}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    
    {/* Account Type (Plan) Filter */}
    <Select value={planFilter} onValueChange={setPlanFilter}>
      <SelectTrigger className="w-[160px] ...">
        <SelectValue placeholder="Plan" />
      </SelectTrigger>
      <SelectContent ...>
        <SelectItem value="all">All Plans</SelectItem>
        <SelectItem value="starter">Starter</SelectItem>
        <SelectItem value="standard">Standard</SelectItem>
        <SelectItem value="professional">Professional</SelectItem>
        <SelectItem value="enterprise">Enterprise</SelectItem>
      </SelectContent>
    </Select>
    
    {/* Business Type Filter */}
    <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
      <SelectTrigger className="w-[160px] ...">
        <SelectValue placeholder="Business Type" />
      </SelectTrigger>
      <SelectContent ...>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="salon">Salon</SelectItem>
        <SelectItem value="spa">Spa</SelectItem>
        <SelectItem value="esthetics">Esthetics</SelectItem>
        <SelectItem value="barbershop">Barbershop</SelectItem>
        <SelectItem value="med_spa">Med Spa</SelectItem>
        <SelectItem value="wellness">Wellness</SelectItem>
        <SelectItem value="other">Other</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

---

## Visual Layout

```text
+--------------------------------------------------+
| [Search by name or slug...        ] [Status  v]  |
+--------------------------------------------------+
| [Country v] [State v] [Plan v] [Business Type v] |
+--------------------------------------------------+
```

The filters use the same dark styling as the existing Status filter for consistency.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/Accounts.tsx` | Add filter state, dynamic option extraction, filter logic, and UI dropdowns |

---

## Edge Cases

- **No locations**: Organizations without location data default to country `'US'` in the filter
- **Country change**: Resets state filter to 'all' to prevent invalid selections
- **Empty states**: If a country has no state data, the state dropdown shows only "All States"
- **URL query params**: The `?status=onboarding` from the Overview cards will continue to work

---

## Future Enhancement

Consider adding URL query param support for all filters so links can be shared with pre-applied filters (e.g., `/accounts?country=US&state=AZ&type=salon`).
