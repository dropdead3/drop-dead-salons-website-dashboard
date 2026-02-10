
# Brand the AI Assistant as "Zura"

## Overview
Rename all generic "AI Help Assistant" / "AI Assistant" references to "Zura" across the Help FAB and Team Chat AI panel, giving the assistant a consistent, branded identity.

## Changes

### 1. Help FAB Tab Label (`src/components/dashboard/HelpFAB.tsx`)
- Change tab trigger text from "AI Help" to "Zura"

### 2. Help FAB Empty State (`src/components/dashboard/help-fab/AIHelpTab.tsx`)
- Change heading from "AI Help Assistant" to "Zura"
- Update subtitle to introduce Zura by name, e.g., "I'm Zura, your AI assistant. Ask me anything about using the platform."

### 3. Team Chat AI Panel Header (`src/components/team-chat/AIChatPanel.tsx`)
- Change SheetTitle from "AI Assistant" to "Zura"
- Update subtitle to something like "Your AI-powered salon assistant"
- Change empty state heading from "How can I help?" to "Hi, I'm Zura!" with updated description

### Files Modified
- `src/components/dashboard/HelpFAB.tsx`
- `src/components/dashboard/help-fab/AIHelpTab.tsx`
- `src/components/team-chat/AIChatPanel.tsx`

### Technical Details
All changes are string-only updates to JSX text content. No logic, imports, or structural changes required.
