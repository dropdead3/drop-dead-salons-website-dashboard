
# Fix Team Chat Bottom Gap

## Problem

The Team Chat page shows a visible gap at the bottom where the dashboard footer is appearing. This breaks the full-height immersive chat experience.

### Root Cause

Multiple conflicting height calculations:

| Component | Current Height | Issue |
|-----------|----------------|-------|
| `TeamChat.tsx` wrapper | `h-[calc(100vh-4rem)]` | Subtracts header height |
| `TeamChatContainer` | `h-[calc(100vh-8rem)]` | Different calculation, creates gap |
| `DashboardLayout` footer | Always visible | Should be hidden for full-height pages |

---

## Solution

### Option A: Hide Footer for Team Chat (Recommended)

Pass a prop to indicate the page should be full-height without footer.

| File | Change |
|------|--------|
| `DashboardLayout.tsx` | Add `hideFooter` prop support |
| `TeamChat.tsx` | Pass `hideFooter` to layout |
| `TeamChatContainer.tsx` | Use `h-full` instead of fixed calc |

### Option B: Simpler Fix - CSS Only

Make the chat fill the remaining space properly using flexbox.

| File | Change |
|------|--------|
| `TeamChat.tsx` | Use `flex-1` and `min-h-0` |
| `TeamChatContainer.tsx` | Use `h-full` instead of fixed viewport calc |

---

## Recommended Changes

### 1. Update TeamChat.tsx

Change the wrapper from fixed calc to flex-based filling:

```tsx
<div className="flex-1 min-h-0 overflow-hidden">
  <TeamChatContainer />
</div>
```

### 2. Update TeamChatContainer.tsx

Change from viewport-based height to container-filling:

```tsx
<div className="flex h-full bg-background">
```

### 3. Update DashboardLayout.tsx (Optional Enhancement)

Add support for hiding footer on full-height pages like Team Chat.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/TeamChat.tsx` | Use flex-based height filling |
| `src/components/team-chat/TeamChatContainer.tsx` | Use `h-full` instead of `calc` |

---

## Result

| Before | After |
|--------|-------|
| Footer visible below chat | Chat fills entire available space |
| Fixed viewport calculations conflict | Flexbox properly fills container |
| Gap at bottom | Seamless full-height chat |
