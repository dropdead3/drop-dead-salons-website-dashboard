

# Smart Hyperlinks in Zura AI Guidance

## Overview
Make Zura's guidance responses interactive by embedding hyperlinks that navigate directly to relevant pages within the platform. When Zura mentions analytics, reports, payroll, or other features, those references become clickable links that take the user straight there.

## How It Works

The approach has two parts:

**1. Teach Zura to include links** -- Update the AI system prompt so Zura embeds markdown links using a predefined route map. For example, instead of saying "check your Daily Revenue tab," Zura will output `check your [Daily Revenue](/dashboard/admin/analytics?tab=sales)` -- a clickable link right in the guidance text.

**2. Make those links work inside the app** -- Update the guidance panel's markdown renderer to detect internal links (starting with `/dashboard/`) and navigate within the app instead of doing a full page reload. External links still open normally in a new tab.

## What Gets Linked

Zura will know about all major platform routes and link to them contextually:

- **Analytics Hub** -- Sales, Operations, Marketing, Reports tabs
- **Leaderboard** -- Team performance comparisons
- **Payroll Hub** -- Commission insights, team breakdown
- **Client Directory** -- Client health and retention
- **Team Overview** -- Staff performance and utilization  
- **Schedule** -- Booking calendar and availability
- **Inventory** -- Product and retail management
- **Settings pages** -- Phorest connection, integrations, day rates
- **My Stats / My Pay** -- Individual performance views

## Technical Details

### Changes to `supabase/functions/ai-insight-guidance/index.ts`
Add a route reference map to the system prompt so the AI model knows which internal routes to link to. The prompt will instruct Zura to embed markdown-style links like `[Sales Analytics](/dashboard/admin/analytics?tab=sales)` naturally within guidance text. The route map will cover ~20 key destinations.

### Changes to `src/components/dashboard/GuidancePanel.tsx`
Update the ReactMarkdown `a` (anchor) component renderer to:
- Detect internal links (paths starting with `/dashboard/`)
- Use React Router's `useNavigate` to handle clicks without full page reloads
- Style internal links distinctly (primary color, underline) so they're clearly clickable
- Keep external links opening in new tabs as normal

### Changes to `supabase/functions/ai-business-insights/index.ts`
Update the main insights system prompt to also include route references, so that insight descriptions and action items can reference linkable areas when rendered in the guidance panel.

### Files Modified
- `supabase/functions/ai-insight-guidance/index.ts` -- Add route map to system prompt
- `supabase/functions/ai-business-insights/index.ts` -- Add route references to system prompt
- `src/components/dashboard/GuidancePanel.tsx` -- Add smart link rendering with React Router navigation

### No new dependencies needed
Uses existing `react-router-dom` (useNavigate) and `react-markdown` already in the project.
