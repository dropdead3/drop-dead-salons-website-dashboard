
# Complete Team Chat Sidebar Reorganization

## Overview

Finish the Team Chat sidebar reorganization feature by enabling:
1. **Channel reordering** - Users can drag channels within sections to customize their personal order
2. **Channel section assignment** - Admins can assign channels to custom sections via channel settings
3. **User-level section ordering** - Each user can drag sections to reorder their sidebar layout

## Current State Analysis

| Feature | Database | Hook | UI |
|---------|----------|------|-----|
| Custom sections | `chat_sections` table | `useChatSections` | Admin management UI |
| Section reordering | `sort_order` column | `reorderSections` | Admin drag-and-drop |
| Section collapse | `user_preferences.chat_layout` | `toggleSectionCollapsed` | Working |
| Channel ordering | `user_preferences.chat_layout.channels_order` | `setChannelsOrder` | **Not wired** |
| Channel-to-section assignment | `chat_channels.section_id` | Exists in schema | **No UI** |
| User section ordering | `user_preferences.chat_layout.sections_order` | `setSectionsOrder` | **Not wired** |

## Implementation Plan

### Part 1: Assign Channels to Sections

Add a section selector dropdown to `ChannelSettingsSheet.tsx`:

```text
┌─────────────────────────────────────────┐
│ Channel Settings                         │
├─────────────────────────────────────────┤
│ # announcements                          │
│ Public channel                           │
├─────────────────────────────────────────┤
│ Channel name                             │
│ ┌─────────────────────────────────────┐ │
│ │ announcements                       │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Section                                  │
│ ┌─────────────────────────────────────┐ │
│ │ Channels (default)              ▾ │ │
│ └─────────────────────────────────────┘ │
│   • Channels (default)                   │
│   • Projects                             │
│   • Teams                                │
│                                          │
│ Description...                           │
└─────────────────────────────────────────┘
```

**File changes:**
- `src/components/team-chat/ChannelSettingsSheet.tsx` - Add Select component for section assignment

### Part 2: Channel Drag-and-Drop in Sidebar

Enable users to drag channels within their sidebar sections to personalize order.

**Technical approach:**
- Wrap channel lists in `DndContext` + `SortableContext` (using existing `@dnd-kit` dependency)
- On drag end, call `setChannelsOrder(sectionId, orderedChannelIds)`
- Sort channels by user's preference order, falling back to default order

```text
┌──────────────────────────────────┐
│ CHANNELS                      +  │
│ ⠿ # general                      │  ← Drag handle appears on hover
│ ⠿ # announcements                │
│ ⠿ # random                       │
│                                  │
│ PROJECTS                         │
│ ⠿ # rebrand-2026                 │
│ ⠿ # new-location                 │
└──────────────────────────────────┘
```

**File changes:**
- `src/components/team-chat/ChannelSidebar.tsx` - Add DnD context and sortable channel items

### Part 3: User-Level Section Ordering

Allow each user to drag entire sections to reorder their personal sidebar layout.

**Technical approach:**
- Wrap all sidebar sections in a parent `DndContext`
- On drag end, call `setSectionsOrder(orderedSectionIds)`
- Merge user's section order preference with organization sections

**File changes:**
- `src/components/team-chat/ChannelSidebar.tsx` - Add section-level DnD

### Part 4: Permission Gating

Use existing permissions to control who can perform each action:

| Action | Permission Required |
|--------|---------------------|
| Reorder own channels | Everyone (personal preference) |
| Reorder own sections | Everyone (personal preference) |
| Assign channel to section | `CREATE_SECTION` or channel admin |
| Create new sections | `CREATE_SECTION` (configurable per role) |

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/team-chat/ChannelSidebar.tsx` | Add DnD for channels and sections, apply user preference ordering |
| `src/components/team-chat/ChannelSettingsSheet.tsx` | Add section assignment dropdown |
| `src/hooks/team-chat/useChatChannels.ts` | Add mutation for updating channel section |

## UI/UX Considerations

1. **Drag handles**: Show grip icon on hover to indicate draggability
2. **Visual feedback**: Reduce opacity of dragged item, show insertion line
3. **Persistence**: Save order changes immediately with optimistic updates
4. **Reset option**: Consider adding "Reset to default order" in preferences

## Technical Notes

- Uses existing `@dnd-kit/core` and `@dnd-kit/sortable` packages (already installed)
- Follows the same pattern used in Dashboard Customization System
- Per-user preferences don't affect organization-wide section structure
- Channel section assignment (`section_id`) is organization-wide and requires permissions
