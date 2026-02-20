

# Fix: Phorest Client Sync Only Pulling First 500 Per Branch (No Pagination)

## Root Cause

The `syncClients` function in `supabase/functions/sync-phorest-data/index.ts` fetches clients with `?size=500` per branch but **never checks for or fetches additional pages**. The Phorest API returns paginated results, and since your salon has ~3,530 clients, the sync only captures the first 500 from each branch -- resulting in ~525 unique clients after deduplication.

## Fix

Add pagination logic to the client fetch loop so it continues requesting pages until all clients are retrieved.

### File: `supabase/functions/sync-phorest-data/index.ts`

**Lines 420-462** -- Replace the single fetch per branch with a pagination loop:

1. Start at `page=0` with `size=200` (smaller batches for reliability)
2. After each response, check the Phorest `_embedded` or `page` metadata for `totalPages` / `totalElements`
3. If `page.number < page.totalPages - 1`, increment page and fetch again
4. Continue until all pages are exhausted for each branch
5. Add a safety cap (e.g., 100 pages max) to prevent infinite loops

**Lines 466-474** -- Apply the same pagination to the fallback global endpoint

### Pseudocode for the pagination loop:

```text
let page = 0;
let hasMore = true;

while (hasMore) {
  fetch /branch/{id}/client?size=200&page={page}
  
  extract clients from response
  add to clientDataMap
  
  check response.page.totalPages or response._embedded length
  if (page + 1 >= totalPages OR clients.length === 0 OR page > 100) {
    hasMore = false
  } else {
    page++
  }
}
```

### Additional improvements:

- Log total expected clients from the API's `page.totalElements` field so you can verify completeness
- Log progress: "Fetched page X of Y for branch Z"
- After sync completes, log final count vs expected for visibility

## Technical Details

- The Phorest third-party API uses standard Spring-style pagination: `page.number`, `page.size`, `page.totalElements`, `page.totalPages`
- Using `size=200` instead of 500 reduces per-request payload and timeout risk
- The edge function timeout should be sufficient since this is a background sync, but pagination adds latency proportional to total clients
- No database schema changes needed -- the upsert logic remains the same

## Expected Result

After this fix, syncing clients will pull all ~3,530 clients across all pages and branches, fully populating the client directory.

