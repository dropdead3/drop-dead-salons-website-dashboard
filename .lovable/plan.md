
# Indent Channel Items Under Section Headers

## What Changes
Add left padding to the channel list area inside each sidebar section so that channel names, icons, and DM avatars appear visually nested beneath their section title — matching the Slack-style hierarchy shown in the reference screenshot.

## Technical Detail

**File: `src/components/team-chat/SortableSidebarSection.tsx`**
- Add `pl-4` to the `<CollapsibleContent>` wrapper so all child channel items are indented relative to the section header text.

This single class addition applies uniformly to Channels, Locations, Direct Messages, and any custom sections — no per-section or per-component changes needed.
