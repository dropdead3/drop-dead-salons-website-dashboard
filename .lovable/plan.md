

# Fix Duplicate Channels in Team Chat

## Problem

Duplicate channels exist in the database and are being displayed:
- `company-wide` x2
- `general` x2
- `north-mesa` x2
- `val-vista-lakes` x2

### Root Cause

Race condition in channel initialization:
1. The `useEffect` in `ChannelSidebar` triggers `initializeChannels.mutate()` when `channels.length === 0`
2. React Strict Mode (or rapid re-renders) can call this effect multiple times
3. The mutex check (`existingChannels.length > 0`) happens too late - by the time the first call creates channels, the second call has already passed the check
4. No `useRef` guard to prevent duplicate mutation calls (unlike the auto-join hook which has one)

---

## Solution

### Part 1: Clean Up Existing Duplicates

Delete the duplicate channels from the database, keeping only the first-created instance of each:

```sql
-- Delete duplicate channels, keeping the oldest one for each name+organization+type
DELETE FROM chat_channels
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY organization_id, name, type 
             ORDER BY created_at ASC
           ) as rn
    FROM chat_channels
  ) ranked
  WHERE rn > 1
);
```

### Part 2: Prevent Future Duplicates

#### A. Add ref guard to initialization (like auto-join has)

```typescript
// In ChannelSidebar.tsx
const hasInitialized = useRef(false);

useEffect(() => {
  if (!isLoading && channels.length === 0 && !hasInitialized.current) {
    hasInitialized.current = true;
    initializeChannels.mutate();
  }
}, [isLoading, channels.length]);
```

#### B. Add database constraint to prevent duplicates at DB level

```sql
-- Add unique constraint on (organization_id, name, type) for system channels
CREATE UNIQUE INDEX chat_channels_org_name_type_unique 
ON chat_channels (organization_id, name, type) 
WHERE is_system = true;
```

This ensures that even if race conditions occur, the database will reject duplicate inserts.

#### C. Use upsert pattern in initialization

Change the INSERT logic to use conflict handling:

```typescript
const { data: newChannel, error } = await supabase
  .from('chat_channels')
  .upsert({
    ...channel,
    organization_id: effectiveOrganization.id,
    created_by: user.id,
    is_system: true,
  }, { 
    onConflict: 'organization_id,name,type',
    ignoreDuplicates: true 
  })
  .select()
  .single();
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/team-chat/ChannelSidebar.tsx` | Add `hasInitialized` ref guard |
| `src/hooks/team-chat/useChatChannels.ts` | Use upsert pattern in initialization |

## Database Changes

| Change | Purpose |
|--------|---------|
| Delete duplicate channels | Clean up existing data |
| Add partial unique index | Prevent future duplicates at DB level |

---

## Result

| Before | After |
|--------|-------|
| 2x company-wide, 2x general, etc. | 1 of each channel |
| Race condition can create duplicates | Database constraint prevents duplicates |
| No initialization guard | Ref prevents multiple mutation calls |

