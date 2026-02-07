
# Add Help Center, Search & AI Assistant to Top Bar

## Overview

This plan adds three features to the dashboard top bar:
1. **Help Center Quick Access** - A help icon button that opens the Help Center
2. **Intelligent Search Bar** - A unified search for navigation, help articles, team members, and more
3. **AI Assistant** - An integrated AI chat capability within the search bar for asking questions

---

## Architecture

### Component Structure

```text
DashboardLayout.tsx
└── Desktop Top Bar (lines 992-1066)
    ├── TopBarSearch (new component)
    │   ├── Search input with AI toggle
    │   ├── Results dropdown
    │   │   ├── Navigation results
    │   │   ├── Help articles results
    │   │   ├── Team members results
    │   │   └── AI response section
    │   └── AI conversation mode
    └── Help Center button (new)
```

---

## Changes Required

### 1. Create Edge Function: `ai-assistant`

**File:** `supabase/functions/ai-assistant/index.ts`

Creates an edge function that connects to Lovable AI for answering user questions about the dashboard, salon operations, and general help queries.

- Uses Lovable AI gateway with `google/gemini-3-flash-preview` model
- System prompt tailored for salon software assistant context
- Supports streaming responses for real-time typing effect
- Uses the existing `LOVABLE_API_KEY` (auto-configured)

### 2. Update `supabase/config.toml`

Add the new edge function configuration with JWT verification disabled for public access.

### 3. Create `src/components/dashboard/TopBarSearch.tsx`

A comprehensive search component with:

**Features:**
- Global search across navigation items, help articles, and team members
- Keyboard shortcut (Cmd/Ctrl + K) to focus
- AI mode toggle - when enabled, queries are sent to the AI assistant
- Search results grouped by type with icons
- AI response displayed inline with streaming text
- Click-outside and Escape to close

**Search Sources:**
- **Navigation** - All sidebar navigation items
- **Help Articles** - Knowledge base articles via `useKBSearch` hook
- **Team Members** - Employee profiles for quick access
- **AI Assistant** - Natural language questions answered by AI

**UI Elements:**
- Search icon input field
- Sparkles icon to indicate AI mode
- Grouped results with type badges
- AI thinking/typing indicator
- Result cards with navigation on click

### 4. Update `src/components/dashboard/DashboardLayout.tsx`

**Desktop Top Bar Changes (lines 992-1066):**

- Add `TopBarSearch` component between sidebar toggle and right-side controls
- Add Help Center quick-access button (HelpCircle icon) to right-side controls
- Help button links directly to `/dashboard/help`

**Mobile Header Changes (lines 817-893):**

- Add condensed search trigger button
- Add Help Center button to mobile header actions

### 5. Create `src/hooks/useAIAssistant.ts`

A custom hook for managing AI assistant state and streaming:

- `sendMessage(query: string)` - Sends user query to AI
- `response` - Current AI response (streamed)
- `isLoading` - Loading state
- `error` - Error handling for rate limits (429) and payment (402)

---

## Technical Details

### AI Assistant Integration

The AI assistant uses Lovable AI with:
- **Model:** `google/gemini-3-flash-preview` (fast, balanced capability)
- **System Prompt:** Contextual for salon software, dashboard navigation, and help
- **Streaming:** Token-by-token rendering for responsive UX
- **Error Handling:** Graceful handling of rate limits with user-friendly messages

### Search Implementation

```text
User types query
    │
    ├─ If AI mode disabled:
    │   └─ Filter local data (nav items, cached help articles, team)
    │
    └─ If AI mode enabled:
        └─ Send to AI edge function
            └─ Stream response back to UI
```

### Keyboard Navigation

- `Cmd/Ctrl + K` - Open/focus search
- `Escape` - Close search
- `Tab` - Toggle AI mode when search is focused
- `Enter` on result - Navigate to that item
- Arrow keys - Navigate through results

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/ai-assistant/index.ts` | AI gateway edge function |
| `src/components/dashboard/TopBarSearch.tsx` | Search bar component with AI |
| `src/hooks/useAIAssistant.ts` | AI interaction hook |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add ai-assistant function config |
| `src/components/dashboard/DashboardLayout.tsx` | Add search bar and help button to top bar |

---

## User Experience Flow

1. **Help Center Access:**
   - Click HelpCircle icon in top bar → Opens `/dashboard/help`

2. **Regular Search:**
   - Click search bar or press Cmd+K
   - Type query → See filtered results from nav, help articles, team
   - Click result → Navigate to that page/section

3. **AI Assistant:**
   - Click sparkles icon or press Tab in search to enable AI mode
   - Type natural language question
   - See AI response stream in real-time
   - AI provides contextual answers about the dashboard and salon operations

---

## Example AI Prompts & Responses

| User Query | AI Response |
|------------|-------------|
| "How do I add a new team member?" | "To add a new team member, go to Management Hub → Invitations & Approvals. Click 'Invite Staff' and enter their email..." |
| "What's the leaderboard based on?" | "The team leaderboard ranks stylists based on weighted metrics including new clients, retail sales, and appointment bookings..." |
| "How do I request an assistant?" | "Navigate to Team Tools → Assistant Schedule. You'll see your upcoming appointments where you can request assistant support..." |
