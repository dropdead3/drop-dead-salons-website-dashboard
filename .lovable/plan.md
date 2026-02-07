
# Role-Based Training Video Filtering

## Summary

Enable training videos to be filtered by user roles. Users with multiple roles (e.g., a Manager who is also a Stylist) will see videos targeted at **any** of their roles. The existing `required_for_roles` column on the `training_videos` table will be used to specify which roles should see each video.

---

## How It Works

| Video's `required_for_roles` | User's Roles | Video Visible? |
|------------------------------|--------------|----------------|
| `null` or `[]` | Any | Yes (universal) |
| `['stylist']` | `['manager']` | No |
| `['stylist']` | `['stylist', 'manager']` | Yes |
| `['manager', 'admin']` | `['manager']` | Yes |
| `['stylist', 'stylist_assistant']` | `['stylist_assistant']` | Yes |

---

## Implementation Approach

### 1. Update `TrainingVideo` Interface

Add the `required_for_roles` field to the TypeScript interface:

```typescript
interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  category: string;
  duration_minutes: number | null;
  order_index: number;
  required_for_roles: string[] | null;  // NEW
}
```

### 2. Import User Roles from AuthContext

The `Training.tsx` component already imports `useAuth`. Extract the user's roles:

```typescript
const { user, roles: userRoles } = useAuth();
```

### 3. Filter Videos by Role

After fetching videos, filter to only include those matching the user's roles:

```typescript
// Filter videos by user's roles
const roleFilteredVideos = videos.filter(video => {
  // If no roles specified, show to everyone
  if (!video.required_for_roles || video.required_for_roles.length === 0) {
    return true;
  }
  // Show if user has at least one matching role
  return video.required_for_roles.some(role => userRoles.includes(role));
});
```

### 4. Update Category Filtering

Apply category filter on top of role-filtered videos:

```typescript
const filteredVideos = selectedCategory === 'all' 
  ? roleFilteredVideos 
  : roleFilteredVideos.filter(v => v.category === selectedCategory);
```

### 5. Update Progress Calculation

Calculate progress based on role-filtered videos (not all videos):

```typescript
const completedCount = progress.filter(p => 
  p.completed_at && roleFilteredVideos.some(v => v.id === p.video_id)
).length;
const totalCount = roleFilteredVideos.length;
```

---

## User Experience

**For a Stylist:**
- Sees videos with `required_for_roles` containing `'stylist'` OR `null`/empty
- Progress shows X/Y where Y = stylist-relevant videos only

**For a Manager who is also a Stylist:**
- Sees videos for both `'manager'` AND `'stylist'` roles
- Sees universal videos (no role restriction)
- Progress reflects total relevant videos for both roles

**For a Super Admin:**
- Sees ALL videos regardless of role restrictions (has access to everything)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/Training.tsx` | Add role filtering, update interface, fix progress calculation |

---

## Code Changes

### Updated `Training.tsx` Component

```typescript
// 1. Update interface
interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  category: string;
  duration_minutes: number | null;
  order_index: number;
  required_for_roles: string[] | null;
}

// 2. Extract roles from auth context
const { user, roles: userRoles } = useAuth();

// 3. Memoize role-filtered videos
const roleFilteredVideos = useMemo(() => {
  return videos.filter(video => {
    // Super admins see everything
    if (userRoles.includes('super_admin')) return true;
    
    // If no roles specified, show to everyone
    if (!video.required_for_roles || video.required_for_roles.length === 0) {
      return true;
    }
    
    // Show if user has at least one matching role
    return video.required_for_roles.some(role => 
      userRoles.includes(role as any)
    );
  });
}, [videos, userRoles]);

// 4. Apply category filter on role-filtered videos
const filteredVideos = selectedCategory === 'all' 
  ? roleFilteredVideos 
  : roleFilteredVideos.filter(v => v.category === selectedCategory);

// 5. Fix progress calculation
const completedCount = progress.filter(p => 
  p.completed_at && roleFilteredVideos.some(v => v.id === p.video_id)
).length;
const totalCount = roleFilteredVideos.length;
```

---

## Technical Notes

1. **Super Admin Override**: Super admins will see all training videos regardless of role restrictions

2. **Null/Empty Handling**: Videos with `required_for_roles` set to `null` or empty array `[]` are treated as universal (visible to all)

3. **Progress Accuracy**: The progress bar only counts videos the user can see, so a Stylist with 5/10 completed reflects their 10 relevant videos, not the total 50 in the system

4. **Category + Role**: Both filters stack - a Stylist viewing "Technique" category only sees technique videos that are also role-visible to them

5. **No Database Changes**: This uses the existing `required_for_roles` column that's already in the database

---

## Setting Up Role-Specific Training

Admins can populate the `required_for_roles` field when adding/editing training videos:

- **Management Training**: `['super_admin', 'admin', 'manager']`
- **Stylist Training**: `['stylist']`
- **Assistant Training**: `['stylist_assistant']`
- **Universal (Everyone)**: Leave `null` or empty `[]`
- **Multiple Roles**: `['stylist', 'stylist_assistant']`
