
## Move Schedule Out of Team Tools

### Problem
Schedule currently appears in two places in the sidebar:
1. As a standalone link in the Main section (Command Center, Schedule, Team Chat)
2. Duplicated inside the Team Tools popover group under Management

The user wants Schedule removed from the Team Tools group so it only appears as a standalone important link right below Command Center.

### Changes

**File: `src/config/dashboardNav.ts` (line 91)**
- Remove the Schedule entry from `managerNavItems` (the one with `managerGroup: 'teamTools'`)
- This eliminates the duplicate from the Team Tools popover
- Schedule will continue to render as a standalone sidebar icon (collapsed) or link (expanded) in the Main section, directly below Command Center and above Team Chat

### What stays the same
- The Main section already has the correct order: Command Center -> Schedule -> Team Chat
- No sidebar rendering logic changes needed
- Schedule permissions and routing remain unchanged

### Technical detail
One line removal in `src/config/dashboardNav.ts`:
```
// Remove this line from managerNavItems:
{ href: '/dashboard/schedule', label: 'Schedule', ..., managerGroup: 'teamTools' }
```
