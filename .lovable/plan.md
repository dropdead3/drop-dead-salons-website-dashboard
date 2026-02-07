

# Widen Dashboard Sidebar

## Problem

The current sidebar width of 256px (`w-64`) is too narrow to display longer navigation labels like "Meetings & Accountability" without the text wrapping to two lines, as shown in the screenshot.

## Solution

Increase the sidebar width from `w-64` (256px) to `w-72` (288px) to accommodate longer navigation labels on a single line.

## Changes Required

### File: `src/components/dashboard/DashboardLayout.tsx`

Update all width references from `w-64` / `pl-64` to `w-72` / `pl-72`:

| Line | Current | Updated | Purpose |
|------|---------|---------|---------|
| 791 | `lg:w-64` | `lg:w-72` | Desktop sidebar expanded width |
| 825 | `w-64` | `w-72` | Mobile sheet sidebar width |
| 904 | `lg:pl-64` | `lg:pl-72` | View-as banner left padding |
| 984 | `lg:pl-64` | `lg:pl-72` | Platform context banner left padding |
| 995 | `lg:pl-64` | `lg:pl-72` | Desktop top bar left padding |

There are likely additional `pl-64` references in the main content area that also need updating:

| Location | Current | Updated | Purpose |
|----------|---------|---------|---------|
| Main content wrapper | `lg:pl-64` | `lg:pl-72` | Main content left margin for sidebar |

## Result

After this change:
- Sidebar will be 288px wide (32px wider)
- All navigation labels including "Meetings & Accountability" will fit on a single line
- No text wrapping in sidebar navigation items
- Content area will shift accordingly to maintain proper alignment

