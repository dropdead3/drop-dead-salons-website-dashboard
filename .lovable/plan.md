
# Training Hub Configurator Implementation Plan

## Summary

Create a comprehensive **Training Hub** administrative interface that allows super admins and managers to:
1. Upload and manage training videos
2. Assign videos to specific roles
3. Assign videos to individual team members
4. Track team completion progress
5. Send training reminders

This follows the established pattern from `Handbooks.tsx` and integrates into the Management Hub.

---

## Current State Analysis

### Existing Infrastructure
| Component | Status |
|-----------|--------|
| `training_videos` table | Exists with `required_for_roles` array column |
| `training_progress` table | Exists with `user_id`, `video_id`, `completed_at` |
| `training-videos` storage bucket | Exists (private) |
| Role-based filtering | Implemented in `Training.tsx` |
| Individual assignments | Not implemented |

### Database Tables Available
```text
training_videos:
├── id, title, description
├── video_url, storage_path, thumbnail_url
├── category, order_index, duration_minutes
├── required_for_roles (app_role[])
└── is_active, created_at

training_progress:
├── id, user_id, video_id
├── completed_at, watch_progress
└── notes, created_at
```

---

## Implementation Approach

### Phase 1: Database Schema Update

**New table: `training_assignments`**
For individual training assignments beyond role-based visibility:

```sql
CREATE TABLE training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES training_videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  due_date TIMESTAMPTZ,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);
```

### Phase 2: Training Hub Admin Page

Create `/dashboard/admin/training-hub` with three tabs:

**Tab 1: Video Library**
- Upload new videos to storage bucket
- Edit video metadata (title, description, category)
- Set role visibility (`required_for_roles`)
- Drag-and-drop reordering
- Toggle active/inactive status
- Delete videos

**Tab 2: Individual Assignments**
- Search/select team members
- Assign specific videos with optional due dates
- View pending assignments by person
- Bulk assignment to multiple users

**Tab 3: Team Progress**
- View completion rates by role
- View completion rates by individual
- Filter by category/video
- Export progress reports
- Send reminder notifications

---

## File Structure

```text
src/pages/dashboard/admin/
├── TrainingHub.tsx              # Main hub page with tabs

src/components/training/
├── VideoLibraryManager.tsx      # CRUD for videos
├── VideoUploadDialog.tsx        # Upload/edit dialog
├── IndividualAssignments.tsx    # Assign to individuals
├── TeamProgressDashboard.tsx    # Progress tracking
├── TrainingAssignmentCard.tsx   # Display assignment
└── TrainingProgressTable.tsx    # Progress table component
```

---

## Detailed Component Specifications

### 1. TrainingHub.tsx (Main Container)

```typescript
// Layout with 3 tabs: Library, Assignments, Progress
const tabs = [
  { value: 'library', label: 'Video Library', icon: Video },
  { value: 'assignments', label: 'Assignments', icon: UserPlus },
  { value: 'progress', label: 'Team Progress', icon: BarChart3 },
];
```

### 2. VideoLibraryManager.tsx

Features:
- Grid/list view toggle for existing videos
- "Add Video" button opens `VideoUploadDialog`
- Each video card shows:
  - Thumbnail (or placeholder)
  - Title, category, duration
  - Role badges (who can see)
  - Active/inactive toggle
  - Edit/Delete actions
- Drag-and-drop for `order_index` reordering

### 3. VideoUploadDialog.tsx

Form fields:
- **Title** (required)
- **Description** (textarea)
- **Category** (select from predefined list)
- **Duration** (auto-calculated or manual entry in minutes)
- **Video Upload** (to storage bucket or external URL)
- **Thumbnail Upload** (optional)
- **Role Visibility** (multi-select role chips)
- **Active Status** (toggle)

Upload flow:
1. User selects video file
2. Upload to `training-videos` bucket
3. Generate signed URL or use `storage_path`
4. Save metadata to `training_videos` table

### 4. IndividualAssignments.tsx

Features:
- Team member search/autocomplete
- Video multi-select dropdown
- Due date picker (optional)
- Required toggle
- Notes field
- View existing assignments grouped by:
  - By Person: "John has 3 incomplete trainings"
  - By Video: "Safety Training assigned to 12 people"
- Bulk actions:
  - Assign video to all stylists
  - Remove assignment
  - Update due date

### 5. TeamProgressDashboard.tsx

Displays:
- Overall completion percentage (progress bar)
- Breakdown by role (bar chart)
- Breakdown by category
- Individual leaderboard (who's completed most)
- Overdue assignments alert
- Filter by:
  - Date range
  - Role
  - Category
  - Completion status

Table columns:
- Team Member
- Total Videos (for their roles)
- Completed
- In Progress
- Not Started
- Last Activity

---

## Navigation Integration

### Add to Management Hub

Add a new card in the "Team Development" category:

```typescript
<ManagementCard
  href="/dashboard/admin/training-hub"
  icon={Video}
  title="Training Hub"
  description="Manage training library and track completions"
  stat={stats?.incompleteTrainings || null}
  statLabel="incomplete"
  colorClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
/>
```

### Add Route

```typescript
{ path: 'admin/training-hub', element: <TrainingHub /> }
```

---

## Video Visibility Logic Update

Modify `Training.tsx` to also include individually assigned videos:

```typescript
// Current: Role-based only
const roleFilteredVideos = videos.filter(v => 
  v.required_for_roles?.some(r => userRoles.includes(r))
);

// New: Role-based OR individually assigned
const visibleVideos = videos.filter(v => {
  // Check role-based visibility
  if (!v.required_for_roles?.length) return true;
  if (v.required_for_roles.some(r => userRoles.includes(r))) return true;
  
  // Check individual assignment
  return individualAssignments.some(a => a.video_id === v.id);
});
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/dashboard/admin/TrainingHub.tsx` | Create | Main hub page with tabs |
| `src/components/training/VideoLibraryManager.tsx` | Create | Video CRUD grid |
| `src/components/training/VideoUploadDialog.tsx` | Create | Upload/edit form |
| `src/components/training/IndividualAssignments.tsx` | Create | User assignment UI |
| `src/components/training/TeamProgressDashboard.tsx` | Create | Progress tracking |
| `src/pages/dashboard/Training.tsx` | Modify | Include individual assignments |
| `src/pages/dashboard/admin/ManagementHub.tsx` | Modify | Add Training Hub card |
| `src/App.tsx` | Modify | Add route |

---

## Database Migration

```sql
-- Create individual training assignments table
CREATE TABLE public.training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.training_videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  due_date TIMESTAMPTZ,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own assignments"
ON public.training_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all assignments"
ON public.training_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can manage assignments"
ON public.training_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);
```

---

## UI/UX Considerations

1. **Upload Progress**: Show progress bar during video upload
2. **Validation**: Prevent duplicate assignments
3. **Confirmation**: Confirm before deleting videos with progress data
4. **Bulk Actions**: Allow assigning videos to entire role groups
5. **Mobile**: Responsive design for tablet/phone access
6. **Toast Notifications**: Success/error feedback for all actions

---

## Technical Notes

1. **Storage Bucket**: The `training-videos` bucket is private - use signed URLs for playback
2. **File Size**: Consider adding file size limits and validation for uploads
3. **Video Formats**: Accept common formats (mp4, webm, mov)
4. **Thumbnail Generation**: Consider auto-generating thumbnails or requiring upload
5. **Progress Calculation**: Individual assignments count toward personal progress
6. **Super Admin Override**: Super admins always see all videos and all progress

---

## Implementation Order

1. Database migration (create `training_assignments` table)
2. Create component files structure
3. Build `VideoLibraryManager` with CRUD
4. Build `VideoUploadDialog` with storage integration
5. Build `IndividualAssignments` panel
6. Build `TeamProgressDashboard`
7. Assemble `TrainingHub.tsx` with tabs
8. Update `Training.tsx` to include individual assignments
9. Add to Management Hub and routing
10. Test end-to-end flow
