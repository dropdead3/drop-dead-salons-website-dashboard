

# Add Back Navigation to All Sub-Pages

## Overview
Add consistent back button navigation to all Settings sub-pages (back to Settings main) and all Management Hub sub-pages (back to Management Hub main). Many sub-pages currently lack this navigation.

## Scope

### Management Hub Sub-Pages Needing "Back to Management Hub" Button
These pages are accessed from `/dashboard/admin/management` but currently have NO back button:

1. **Announcements** (`Announcements.tsx`)
2. **Staff Strikes** (`StaffStrikes.tsx`)
3. **Onboarding Tracker** (`OnboardingTracker.tsx`)
4. **Graduation Tracker** (`GraduationTracker.tsx`)
5. **Client Engine Tracker** (`ClientEngineTracker.tsx`)
6. **Lead Management** (`LeadManagement.tsx`)
7. **Recruiting Pipeline** (`RecruitingPipeline.tsx`)
8. **Team Birthdays** (`TeamBirthdays.tsx`)
9. **Business Card Requests** (`BusinessCardRequests.tsx`)
10. **Headshot Requests** (`HeadshotRequests.tsx`)
11. **Feedback Hub** (`FeedbackHub.tsx`)
12. **Re-engagement Hub** (`ReengagementHub.tsx`)
13. **Schedule Requests** (`ScheduleRequests.tsx`)
14. **Changelog Manager** (`ChangelogManager.tsx`)
15. **Account Management** (`AccountManagement.tsx`)
16. **Sales Dashboard** (`SalesDashboard.tsx`)

Pages that already have correct back buttons (no changes needed): DocumentTracker, IncidentReports, PointsConfig, DailyHuddle, PTOManager, ShiftSwapApprovals, TrainingHub, PerformanceReviews, ChallengeDetail

### Settings Sub-Pages (Internal Navigation)
The Settings page uses an internal `activeCategory` state -- sub-views already have a "Back to Settings" button built in. No changes needed here since they are not separate routes.

### Top-Level Sidebar Pages (No Back Button Needed)
Per the memory constraint, top-level sidebar pages (Settings, Management Hub, Access Hub) should NOT have back buttons since they are primary navigation items.

## Implementation Pattern

Each affected page will get a back button added to its header area, following the existing pattern used by pages like DocumentTracker:

```tsx
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Inside the header section:
<div className="flex items-start gap-4">
  <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
    <Link to="/dashboard/admin/management">
      <ArrowLeft className="w-5 h-5" />
    </Link>
  </Button>
  <div>
    <h1>...</h1>
    <p>...</p>
  </div>
</div>
```

## Technical Details

- **16 files** will be modified in `src/pages/dashboard/admin/`
- Each file gets: `ArrowLeft` icon import, `Link` import (if not present), and a back button wrapping the existing header
- Back destination: `/dashboard/admin/management` for all Management Hub sub-pages
- The back button follows the exact same style and structure already used by DocumentTracker, IncidentReports, etc.
- No new components or dependencies needed

