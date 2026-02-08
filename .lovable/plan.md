
# Update Sidebar Navigation Editor to Match Current Navigation

## Problem
The Sidebar Navigation Editor (Role Access Configurator) displays outdated navigation items that don't match the current sidebar structure. The editor shows old routes and is missing newer hub pages and consolidated navigation items.

## Current vs Expected Navigation Structure

### Main Section
| Current Editor | Actual Sidebar |
|----------------|----------------|
| Command Center ✓ | Command Center |
| Schedule ✓ | Schedule |

### Growth Section
| Current Editor | Actual Sidebar |
|----------------|----------------|
| Training ✓ | Training |
| New-Client Engine Program ✓ | New-Client Engine Program |
| Program Team Overview ✓ | Program Team Overview |
| Ring the Bell ✓ | Ring the Bell |
| My Graduation ✓ | My Graduation |

### Stats & Leaderboard Section
| Current Editor | Actual Sidebar | Status |
|----------------|----------------|--------|
| Stats ✓ | Stats (My Stats/Team Stats) | ✓ |
| My Clients ❌ | — | Remove |
| Team Leaderboard ✓ | Team Leaderboard | ✓ |
| Sales Dashboard ❌ | — | Remove (now in Analytics Hub) |
| Operational Analytics ❌ | — | Remove (now in Analytics Hub) |
| — | My Pay | **ADD** |

### Team Tools Section
| Current Editor | Actual Sidebar |
|----------------|----------------|
| Shift Swaps ✓ | Shift Swaps |
| Rewards ✓ | Rewards |
| Assistant Schedule ✓ | Assistant Schedule |
| Meetings & Accountability ✓ | Meetings & Accountability |

### Housekeeping Section  
| Current Editor | Actual Sidebar | Status |
|----------------|----------------|--------|
| Onboarding ✓ | Onboarding | ✓ |
| Handbooks ✓ | Handbooks | ✓ |
| — | What's New | **ADD** |
| — | Help Center | **ADD** |

### Management Section
| Current Editor | Actual Sidebar | Status |
|----------------|----------------|--------|
| — | Management Hub | **ADD** |
| — | Analytics Hub | **ADD** |
| Stats ✓ | Team Stats | ✓ |
| Team Leaderboard ✓ | Team Leaderboard | ✓ |
| Team Directory ✓ | Team Directory | ✓ |
| — | Client Directory | **ADD** |
| — | Payroll Hub | **ADD** |
| — | Renter Hub | **ADD** |

### Website Section
| Current Editor | Actual Sidebar | Status |
|----------------|----------------|--------|
| Homepage Stylists ❌ | — | Remove |
| Testimonials ❌ | — | Remove |
| Gallery ❌ | — | Remove |
| Services ❌ | — | Remove |
| Locations ❌ | — | Remove |
| — | Website Editor | **ADD** |

### Super Admin Section
| Current Editor | Actual Sidebar |
|----------------|----------------|
| Invitations & Approvals ✓ | Invitations & Approvals |
| Manage Users & Roles ✓ | Manage Users & Roles |
| Settings ✓ | Settings |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSidebarLayout.ts` | Update `DEFAULT_LINK_ORDER` to match current navigation structure |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Update `LINK_CONFIG` with current routes and add new icons |

---

## Technical Implementation

### 1. Update `useSidebarLayout.ts` - DEFAULT_LINK_ORDER

```typescript
export const DEFAULT_LINK_ORDER: Record<string, string[]> = {
  main: [
    '/dashboard',
    '/dashboard/schedule',
  ],
  growth: [
    '/dashboard/training',
    '/dashboard/program',
    '/dashboard/admin/team',
    '/dashboard/ring-the-bell',
    '/dashboard/my-graduation',
  ],
  stats: [
    '/dashboard/stats',
    '/dashboard/leaderboard',
    '/dashboard/my-pay',
  ],
  teamTools: [
    '/dashboard/shift-swaps',
    '/dashboard/rewards',
    '/dashboard/assistant-schedule',
    '/dashboard/schedule-meeting',
  ],
  housekeeping: [
    '/dashboard/onboarding',
    '/dashboard/handbooks',
    '/dashboard/changelog',
    '/dashboard/help',
  ],
  manager: [
    '/dashboard/admin/management',
    '/dashboard/admin/analytics',
    '/dashboard/stats',
    '/dashboard/leaderboard',
    '/dashboard/directory',
    '/dashboard/clients',
    '/dashboard/admin/payroll',
    '/dashboard/admin/booth-renters',
  ],
  website: [
    '/dashboard/admin/website-sections',
  ],
  adminOnly: [
    '/dashboard/admin/accounts',
    '/dashboard/admin/roles',
    '/dashboard/admin/settings',
  ],
  platform: [
    '/dashboard/platform/overview',
    '/dashboard/platform/accounts',
    '/dashboard/platform/import',
    '/dashboard/platform/revenue',
    '/dashboard/platform/permissions',
    '/dashboard/platform/settings',
  ],
};
```

### 2. Update `SidebarLayoutEditor.tsx` - LINK_CONFIG

Add missing entries and update icons:

```typescript
const LINK_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  // Main
  '/dashboard': { label: 'Command Center', icon: LayoutDashboard },
  '/dashboard/schedule': { label: 'Schedule', icon: CalendarDays },
  
  // Growth
  '/dashboard/training': { label: 'Training', icon: Video },
  '/dashboard/program': { label: 'New-Client Engine Program', icon: Target },
  '/dashboard/admin/team': { label: 'Program Team Overview', icon: Users },
  '/dashboard/ring-the-bell': { label: 'Ring the Bell', icon: Bell },
  '/dashboard/my-graduation': { label: 'My Graduation', icon: GraduationCap },
  
  // Stats
  '/dashboard/stats': { label: 'Stats', icon: BarChart3 },
  '/dashboard/leaderboard': { label: 'Team Leaderboard', icon: Trophy },
  '/dashboard/my-pay': { label: 'My Pay', icon: Wallet },
  
  // Team Tools
  '/dashboard/shift-swaps': { label: 'Shift Swaps', icon: ArrowLeftRight },
  '/dashboard/rewards': { label: 'Rewards', icon: Gift },
  '/dashboard/assistant-schedule': { label: 'Assistant Schedule', icon: Users },
  '/dashboard/schedule-meeting': { label: 'Meetings & Accountability', icon: CalendarClock },
  
  // Housekeeping
  '/dashboard/onboarding': { label: 'Onboarding', icon: Users },
  '/dashboard/handbooks': { label: 'Handbooks', icon: FileText },
  '/dashboard/changelog': { label: "What's New", icon: Sparkles },
  '/dashboard/help': { label: 'Help Center', icon: HelpCircle },
  
  // Management
  '/dashboard/admin/management': { label: 'Management Hub', icon: LayoutGrid },
  '/dashboard/admin/analytics': { label: 'Analytics Hub', icon: TrendingUp },
  '/dashboard/directory': { label: 'Team Directory', icon: Contact },
  '/dashboard/clients': { label: 'Client Directory', icon: Users },
  '/dashboard/admin/payroll': { label: 'Payroll Hub', icon: DollarSign },
  '/dashboard/admin/booth-renters': { label: 'Renter Hub', icon: Store },
  
  // Website
  '/dashboard/admin/website-sections': { label: 'Website Editor', icon: LayoutGrid },
  
  // Super Admin
  '/dashboard/admin/accounts': { label: 'Invitations & Approvals', icon: UserPlus },
  '/dashboard/admin/roles': { label: 'Manage Users & Roles', icon: Shield },
  '/dashboard/admin/settings': { label: 'Settings', icon: Settings },
  
  // Platform (for completeness)
  '/dashboard/platform/overview': { label: 'Platform Overview', icon: Terminal },
  '/dashboard/platform/accounts': { label: 'Accounts', icon: Building2 },
  '/dashboard/platform/import': { label: 'Migrations', icon: Upload },
  '/dashboard/platform/revenue': { label: 'Revenue', icon: DollarSign },
  '/dashboard/platform/permissions': { label: 'Permissions', icon: Shield },
  '/dashboard/platform/settings': { label: 'Platform Settings', icon: Settings },
};
```

### 3. Add Missing Icon Imports in SidebarLayoutEditor.tsx

```typescript
import {
  // ... existing imports ...
  Sparkles,
  HelpCircle,
  LayoutGrid,
  TrendingUp,
  Store,
  Terminal,
  Building2,
  Upload,
} from 'lucide-react';
```

---

## Legacy Routes to Remove

The following routes in `LINK_CONFIG` are no longer in the main sidebar and can be kept for backward compatibility with any existing saved configurations, but should not appear in `DEFAULT_LINK_ORDER`:

- `/dashboard/my-clients` - Moved to Client Directory 
- `/dashboard/admin/sales` - Consolidated into Analytics Hub
- `/dashboard/admin/operational-analytics` - Consolidated into Analytics Hub
- `/dashboard/admin/homepage-stylists` - Consolidated into Website Editor
- `/dashboard/admin/testimonials` - Consolidated into Website Editor
- `/dashboard/admin/gallery` - Consolidated into Website Editor
- `/dashboard/admin/services` - Consolidated into Website Editor
- `/dashboard/admin/locations` - Consolidated into Website Editor
- Various admin hub sub-pages (birthdays, strikes, etc.) - Now accessed through Management Hub

---

## Outcome

After this update:
1. The Sidebar Navigation Editor will accurately reflect the current dashboard navigation
2. Roles can properly control visibility for all current navigation items
3. New items like Management Hub, Analytics Hub, and Website Editor will be configurable
4. Legacy routes remain in LINK_CONFIG for backward compatibility with existing saved layouts
