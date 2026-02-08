
# Unified Help FAB with AI Assistant + Support

## Overview
Create a floating action button (FAB) in the bottom-right corner of all dashboard pages that provides quick access to AI help and support ticket functionality via a tabbed popover interface.

## Components to Create

### 1. HelpFAB Component
**File:** `src/components/dashboard/HelpFAB.tsx`

A floating button with a help/message icon that:
- Shows on all screen sizes (not mobile-only like ChangelogFAB)
- Uses framer-motion for smooth animations
- Opens a popover with two tabs

### 2. HelpFABPanel Component  
**File:** `src/components/dashboard/HelpFABPanel.tsx`

A popover panel containing:
- **Tab 1: AI Help** - Chat interface using the existing `useAIAssistant` hook for quick questions
- **Tab 2: Support** - Form to submit support tickets + view recent tickets

## UI Design

```
┌─────────────────────────────────────────┐
│  [AI Help]  [Support]                   │
├─────────────────────────────────────────┤
│                                         │
│  (Content based on active tab)          │
│                                         │
│  AI Help: Chat interface with           │
│  example prompts                        │
│                                         │
│  Support: Submit ticket form +          │
│  list of recent tickets                 │
│                                         │
├─────────────────────────────────────────┤
│  [Input field]              [Send]      │
└─────────────────────────────────────────┘

        ┌──────┐
        │  ?   │  <-- FAB button (fixed bottom-right)
        └──────┘
```

## Technical Details

### AI Help Tab
- Reuse `useAIAssistant` hook for streaming responses
- Show example prompts when empty
- Render responses with markdown support
- Keep conversation history during session

### Support Tab
- Form with title, description, priority dropdown
- Submit to `support_tickets` table
- Show list of user's recent tickets with status badges
- Uses existing enums: `ticket_priority` and `ticket_status`

### FAB Positioning
- Fixed position: `bottom-6 right-6`
- Z-index: `z-50` to stay above content
- Higher than mobile nav (which uses `bottom-20`)
- Uses Popover for the panel (anchored to FAB)

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/HelpFAB.tsx` | Main FAB component with popover |
| `src/components/dashboard/help-fab/AIHelpTab.tsx` | AI chat interface tab |
| `src/components/dashboard/help-fab/SupportTab.tsx` | Support ticket form/list tab |
| `src/hooks/useSupportTickets.ts` | Hook for submitting/fetching tickets |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Add `<HelpFAB />` before closing `</div>` of layout |

## Implementation Notes

1. **Popover vs Sheet**: Using Popover (not Sheet) to keep it anchored to the FAB and allow users to reference content behind it
2. **Panel Size**: Approximately 380px wide, 480px tall - compact but functional
3. **State Persistence**: Chat history persists during session, clears on page refresh
4. **Hide on Team Chat**: Consider hiding the FAB on `/dashboard/team-chat` since that page has its own AI panel
