

# Add Feedback Hub to Management Hub & Quick Links

## Overview
Add the **Feedback Hub** to two locations for easier access:
1. **Management Hub** - Under a new "Client Experience" section
2. **Hub Quick Links** - On the main dashboard

Access will be controlled by the `manage_settings` permission, which super admins and account owners already have.

---

## Current State

| Location | Has Feedback Hub? |
|----------|-------------------|
| Management Hub | No |
| Hub Quick Links | No |
| Direct URL | Yes (`/dashboard/admin/feedback`) |

---

## Changes

### 1. Management Hub - Add "Client Experience" Section

Add a new category section with Feedback Hub and Re-engagement Hub cards:

```text
┌─────────────────────────────────────────────────────────────┐
│  CLIENT EXPERIENCE                                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ 💬 Feedback Hub │  │ 🔄 Re-engagement│                  │
│  │ Client surveys  │  │ Win-back        │                  │
│  │ and NPS tracking│  │ campaigns       │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Hub Quick Links - Add Feedback Hub

Add a Feedback Hub tile after Website Editor:

```text
[Analytics] [Management] [Payroll] [Renter] [Website] [Feedback*] [Onboarding] [Schedule 1:1]
                                                       ↑ NEW
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/ManagementHub.tsx` | Add "Client Experience" section with Feedback Hub and Re-engagement Hub cards |
| `src/components/dashboard/HubQuickLinks.tsx` | Add Feedback Hub link with `manage_settings` permission |

---

## Implementation Details

### ManagementHub.tsx Changes

Add new imports:
- `MessageSquarePlus` icon for Feedback Hub
- `UserCheck` icon for Re-engagement Hub

Add new section after "Points & Rewards":
```tsx
{/* Client Experience */}
<CategorySection title="Client Experience">
  <ManagementCard
    href="/dashboard/admin/feedback"
    icon={MessageSquarePlus}
    title="Feedback Hub"
    description="Client surveys, reviews, and NPS tracking"
    colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  />
  <ManagementCard
    href="/dashboard/admin/reengagement"
    icon={UserCheck}
    title="Re-engagement"
    description="Win-back campaigns for inactive clients"
    colorClass="bg-teal-500/10 text-teal-600 dark:text-teal-400"
  />
</CategorySection>
```

### HubQuickLinks.tsx Changes

Add new link entry:
```tsx
{
  href: '/dashboard/admin/feedback',
  icon: MessageSquarePlus,
  label: 'Feedback Hub',
  colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
  permission: 'manage_settings',
}
```

---

## Access Control

The `manage_settings` permission is already assigned to:
- Super Admin role
- Admin role
- Manager role (typically)

Account owners are super admins, so they automatically have this permission.

No database changes needed - existing permission structure handles access.

