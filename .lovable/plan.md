

# Phase 2: Complete Team Challenges & Shift Swap System

## Summary

This plan completes the remaining UI pages and components for **Team Challenges** and **Shift Swap System**. The database tables, hooks, and some components were created in the previous implementation phase. Now we need to build the actual pages and remaining components.

---

## Current State

### Already Implemented
| Feature | Component | Status |
|---------|-----------|--------|
| Team Challenges | Database tables (`team_challenges`, `challenge_participants`, `challenge_progress_snapshots`) | Done |
| Team Challenges | Hooks (`useChallenges.ts`) | Done |
| Team Challenges | `ChallengeCard.tsx` | Done |
| Team Challenges | `ChallengeLeaderboard.tsx` | Done |
| Team Challenges | `CreateChallengeWizard.tsx` | Done |
| Team Challenges | ManagementHub navigation card | Done |
| Shift Swaps | Database tables (`shift_swaps`, `shift_swap_messages`) | Done |
| Shift Swaps | Hooks (`useShiftSwaps.ts`) | Done |
| Shift Swaps | ManagementHub navigation card | Done |

### Missing (To Build Now)
| Feature | Component | Description |
|---------|-----------|-------------|
| Team Challenges | `ChallengesDashboard.tsx` | Main admin page at `/dashboard/admin/challenges` |
| Team Challenges | `ChallengeDetail.tsx` | Single challenge view at `/dashboard/admin/challenges/:id` |
| Team Challenges | Command Center widget | Active challenges preview for participants |
| Team Challenges | Route registration | Add to App.tsx |
| Shift Swaps | `ShiftSwapMarketplace.tsx` | Team member marketplace at `/dashboard/shift-swaps` |
| Shift Swaps | `SwapCard.tsx` | Individual swap listing display |
| Shift Swaps | `PostSwapDialog.tsx` | Create new swap request |
| Shift Swaps | `ClaimSwapDialog.tsx` | Claim an available swap |
| Shift Swaps | `SwapApprovalQueue.tsx` | Manager approval interface at `/dashboard/admin/shift-swaps` |
| Shift Swaps | `MySwapsPanel.tsx` | User's swap requests and claims |
| Shift Swaps | Route registration | Add to App.tsx |
| Shift Swaps | Sidebar navigation | Add shift swaps link for team members |

---

## Implementation Details

### Part A: Team Challenges Pages

#### 1. ChallengesDashboard.tsx (`/dashboard/admin/challenges`)

Admin interface to manage all challenges with:
- Grid of active/draft/completed challenges using `ChallengeCard`
- Status filter tabs (All, Active, Draft, Completed)
- "Create Challenge" button opens `CreateChallengeWizard`
- Quick actions: Start, End, Delete challenges
- Stats overview (total participants, active challenges count)

```text
Layout:
┌────────────────────────────────────────────┐
│ ← Back    Team Challenges                  │
│           Create and manage competitions   │
├────────────────────────────────────────────┤
│ [All] [Active] [Draft] [Completed]  + New  │
├────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Challenge│ │ Challenge│ │ Challenge│    │
│ │ Card     │ │ Card     │ │ Card     │    │
│ └──────────┘ └──────────┘ └──────────┘    │
└────────────────────────────────────────────┘
```

#### 2. ChallengeDetail.tsx (`/dashboard/admin/challenges/:id`)

Single challenge view with:
- Challenge header (title, status, dates, metric)
- Full leaderboard using `ChallengeLeaderboard`
- Participant management (add/remove)
- Edit challenge settings
- Progress chart over time
- Actions: Start challenge, End challenge, Cancel

#### 3. Active Challenges Widget

A compact widget for the dashboard showing:
- User's active challenges (max 3)
- Current rank and progress
- Click to view full leaderboard

---

### Part B: Shift Swap System Pages & Components

#### 1. ShiftSwapMarketplace.tsx (`/dashboard/shift-swaps`)

Main marketplace for all team members:

```text
Layout:
┌────────────────────────────────────────────┐
│ ← Back    Shift Swap Marketplace           │
│           Trade, cover, or give away shifts│
├────────────────────────────────────────────┤
│ [Available] [My Requests] [My Claims]      │
├────────────────────────────────────────────┤
│ + Post a Shift          Filter: [All v]   │
├────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐  │
│ │ SwapCard: Jane needs cover for 2/10  │  │
│ │ 9am-5pm @ Main Location              │  │
│ │ [Claim This Shift]                   │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

Features:
- Three tabs: Available swaps, My posted requests, My claims
- Filter by swap type, date range, location
- "Post a Shift" button opens `PostSwapDialog`
- Each swap shows `SwapCard` with claim action

#### 2. SwapCard.tsx

Display component for individual swap listings:
- Requester avatar and name
- Shift date and time
- Location badge
- Swap type badge (Swap, Cover, Giveaway)
- Status indicator
- Claim button or status text
- Time remaining (if expires_at set)

#### 3. PostSwapDialog.tsx

Form dialog to create a swap request:
- Date picker for shift date
- Time inputs for start/end
- Location selector
- Swap type radio (Swap, Cover, Giveaway)
- Reason textarea (optional)
- Expiration date (optional)

#### 4. ClaimSwapDialog.tsx

Dialog when claiming a swap:
- Shows original shift details
- For "swap" type: date/time pickers for shift to offer in return
- For "cover/giveaway": confirmation only
- Optional message to requester
- Submit sends to pending_approval

#### 5. MySwapsPanel.tsx

Panel showing user's swap activity:
- Posted requests with status
- Claims in progress
- Cancel option for open requests
- View history toggle

#### 6. SwapApprovalQueue.tsx (`/dashboard/admin/shift-swaps`)

Manager interface for approvals:

```text
Layout:
┌────────────────────────────────────────────┐
│ ← Back    Shift Swap Approvals             │
│           Review and approve swap requests │
├────────────────────────────────────────────┤
│ [Pending (3)] [Approved] [Denied]          │
├────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐  │
│ │ Jane → Mike                          │  │
│ │ Swap: 2/10 9-5 ↔ 2/12 10-6          │  │
│ │ [Approve] [Deny]  Notes: [____]      │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

Features:
- List of pending approvals with details
- Quick approve/deny buttons
- Optional manager notes
- Bulk actions for multiple approvals
- History tabs for approved/denied

---

## Files to Create

| File | Description |
|------|-------------|
| `src/pages/dashboard/admin/ChallengesDashboard.tsx` | Main challenges management page |
| `src/pages/dashboard/admin/ChallengeDetail.tsx` | Single challenge view/edit |
| `src/components/challenges/ActiveChallengesWidget.tsx` | Dashboard widget |
| `src/pages/dashboard/ShiftSwapMarketplace.tsx` | Team member marketplace |
| `src/pages/dashboard/admin/ShiftSwapApprovals.tsx` | Manager approval page |
| `src/components/shifts/SwapCard.tsx` | Swap listing card |
| `src/components/shifts/PostSwapDialog.tsx` | Create swap form |
| `src/components/shifts/ClaimSwapDialog.tsx` | Claim swap form |
| `src/components/shifts/MySwapsPanel.tsx` | User's swaps list |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes for challenges and shift swaps |
| `src/lib/sidebarConfig.ts` | Add Shift Swaps nav item for team members |

---

## Route Configuration

```typescript
// Challenges routes
<Route path="/dashboard/admin/challenges" element={
  <ProtectedRoute requiredPermission="manage_team_challenges">
    <ChallengesDashboard />
  </ProtectedRoute>
} />
<Route path="/dashboard/admin/challenges/:challengeId" element={
  <ProtectedRoute requiredPermission="manage_team_challenges">
    <ChallengeDetail />
  </ProtectedRoute>
} />

// Shift Swap routes
<Route path="/dashboard/shift-swaps" element={
  <ProtectedRoute>
    <ShiftSwapMarketplace />
  </ProtectedRoute>
} />
<Route path="/dashboard/admin/shift-swaps" element={
  <ProtectedRoute requiredPermission="manage_schedule_requests">
    <ShiftSwapApprovals />
  </ProtectedRoute>
} />
```

---

## Navigation Updates

### Sidebar Addition
Add "Shift Swaps" to sidebar for stylist/assistant/receptionist roles:
- Icon: `ArrowLeftRight`
- Path: `/dashboard/shift-swaps`
- Position: Near Schedule section

---

## Technical Notes

### Permission Mapping
- `manage_team_challenges` - Required for admin challenge pages (may need to add to permissions if not exists)
- `manage_schedule_requests` - Required for swap approval (already exists)
- All authenticated users can access shift swap marketplace

### Component Reuse
- Uses existing `ChallengeCard`, `ChallengeLeaderboard`, `CreateChallengeWizard`
- Uses existing hooks from `useChallenges.ts` and `useShiftSwaps.ts`
- Follows established dialog patterns (Sheet for mobile, Dialog for desktop)

### Real-time Considerations
- Shift swaps will benefit from real-time updates (already enabled in previous migration)
- Challenge standings can update on page refresh for now

---

## Implementation Order

1. Create shift swap components (SwapCard, PostSwapDialog, ClaimSwapDialog, MySwapsPanel)
2. Create ShiftSwapMarketplace page
3. Create SwapApprovalQueue page (admin)
4. Create ChallengesDashboard page
5. Create ChallengeDetail page
6. Create ActiveChallengesWidget
7. Update App.tsx with all routes
8. Update sidebar config with Shift Swaps link
9. Test end-to-end flows

