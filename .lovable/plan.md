

# Add Pagination and Alphabetical Filter to Client Directory

## Problem

The client list renders all filtered clients at once (potentially 3,500+), causing a very long scrollable page. There is no way to jump between pages or filter alphabetically.

## Changes

### 1. Pagination -- 50 clients per page

**File: `src/pages/dashboard/ClientDirectory.tsx`**

Add pagination state and logic:
- New state: `currentPage` (default: 1), reset to 1 whenever filters, search, sort, or tabs change
- Derive `totalPages` from `Math.ceil(filteredClients.length / 50)`
- Slice `filteredClients` to show only `(currentPage - 1) * 50` through `currentPage * 50`
- Add pagination controls at the bottom of the client list card using the existing `Pagination` component from `@/components/ui/pagination`

Pagination UI (below the client list, inside the Card):
- Previous / Next buttons
- Page number indicators with ellipsis for large page counts (e.g., 1 2 3 ... 68 69 70)
- "Showing 1-50 of 3,530 clients" summary text above the controls

### 2. Alphabetical Filter

Add a letter bar (A-Z + "All") in the filter row:
- New state: `selectedLetter` (default: `'all'`)
- When a letter is clicked, filter `filteredClients` to only show clients whose name starts with that letter
- Resets `currentPage` to 1 when letter changes
- Styled as a horizontal row of small pill buttons, fitting the existing rounded UI aesthetic
- Letters with no matching clients are shown as muted/disabled

### 3. Sort by Name button

Add a "Name" sort button alongside the existing Spend/Visits/Recent sort buttons:
- Clicking it sorts alphabetically A-Z (asc) or Z-A (desc)
- Uses the existing `handleSort('name')` which already exists in the code

## Technical Details

### State additions (around line 62):
```
const [currentPage, setCurrentPage] = useState(1);
const [selectedLetter, setSelectedLetter] = useState<string>('all');
```

### Reset page on filter changes:
Add a `useEffect` that resets `currentPage` to 1 whenever `searchQuery`, `activeTab`, `selectedLocation`, `selectedStylist`, `selectedSource`, `selectedLetter`, `sortField`, or `sortDirection` changes.

### Alphabetical filtering (in `filteredClients` memo):
After all existing filters, add:
```
if (selectedLetter !== 'all') {
  filtered = filtered.filter(c => 
    c.name.toUpperCase().startsWith(selectedLetter)
  );
}
```

### Paginated slice (new memo):
```
const paginatedClients = useMemo(() => {
  const start = (currentPage - 1) * PAGE_SIZE;
  return filteredClients.slice(start, start + PAGE_SIZE);
}, [filteredClients, currentPage]);
```

### Alphabet bar:
Render between the filter row and the client list Card. Each letter is a small `Button` (variant ghost or outline when active). Letters with zero matching clients get `disabled` styling.

### Pagination controls:
Render at the bottom of CardContent, after the client list. Uses `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationNext`, `PaginationLink`, and `PaginationEllipsis` from `@/components/ui/pagination`.

### Name sort button:
Add alongside existing sort buttons (Spend, Visits, Recent) in the CardHeader.

## Files Modified
- **Edit**: `src/pages/dashboard/ClientDirectory.tsx` (pagination state, alphabetical filter, paginated rendering, pagination controls, name sort button)

## Result
The client list is broken into pages of 50, with intuitive navigation. Users can quickly jump to clients by first letter and sort alphabetically -- making a 3,500+ client directory manageable and fast.

