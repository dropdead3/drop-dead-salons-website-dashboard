
# Staff Rewards Configurator

## Overview

Create a comprehensive **Rewards Configurator** in Settings for account owners to manage the staff points economy and rewards catalog. This will be a new settings category with tabbed sub-sections for managing rewards, point earning rules, redemption approvals, and analytics.

The configurator will include **default reward templates** that account owners can use immediately or customize, making it easy to implement a team engagement program.

---

## Feature Enhancements

To make this an attractive feature for teams, the configurator will include:

| Enhancement | Description |
|-------------|-------------|
| **Default Reward Templates** | Pre-built rewards like "Extra Break", "Casual Friday", "Priority Scheduling" with suggested point costs |
| **Category-Based Organization** | Rewards grouped by type: Time Off, Recognition, Merchandise, Experiences |
| **Visual Reward Cards** | Image upload support for rewards with branded visuals |
| **Inventory Management** | Track limited-quantity rewards with stock alerts |
| **Redemption Analytics** | See popular rewards, redemption trends, and point economy health |
| **Bulk Actions** | Enable/disable multiple rewards, duplicate templates |
| **Seasonal Rewards** | Start/end date scheduling for limited-time rewards |
| **Cost Preview** | Show estimated monthly point liability based on redemption rates |

---

## Architecture

### New Settings Category

Add a new `team-rewards` category to Settings that consolidates all staff rewards management:

```
Settings
  └── Team Rewards (new)
       ├── Catalog       → Manage reward items
       ├── Earning Rules → Configure point earning actions
       ├── Approvals     → Manage pending redemptions  
       └── Analytics     → Redemption trends & insights
```

### Database Changes

Extend the `rewards_catalog` table with new columns:

| Column | Type | Purpose |
|--------|------|---------|
| `icon` | text | Icon identifier for visual display |
| `start_date` | timestamptz | When reward becomes available |
| `end_date` | timestamptz | When reward expires |
| `organization_id` | uuid | Multi-tenancy support |
| `sort_order` | integer | Custom ordering |
| `is_featured` | boolean | Highlight on shop page |

---

## Component Structure

```
src/components/dashboard/settings/
  └── TeamRewardsConfigurator.tsx       (Main container with tabs)

src/components/rewards-config/
  ├── index.ts                          (Exports)
  ├── RewardsCatalogTab.tsx             (CRUD for rewards)
  ├── RewardFormDialog.tsx              (Create/edit reward form)
  ├── RewardCard.tsx                    (Display card in config view)
  ├── EarningRulesTab.tsx               (Manage point earning rules)
  ├── RedemptionApprovalsTab.tsx        (Admin approval queue)
  ├── RewardsAnalyticsTab.tsx           (Charts & insights)
  └── DefaultRewardTemplates.ts         (Pre-built reward data)
```

---

## Default Reward Templates

Pre-populated templates for easy setup:

### Time Off Category
| Reward | Points | Description |
|--------|--------|-------------|
| Extra 15-Min Break | 50 | Take an additional 15-minute break |
| Leave 30 Min Early | 100 | Leave 30 minutes before shift ends |
| Extended Lunch Hour | 75 | Extend lunch break to 1 hour |
| Half Day Off | 500 | Take a half day with pay |

### Recognition Category
| Reward | Points | Description |
|--------|--------|-------------|
| Parking Spot of the Week | 150 | Premium parking spot for one week |
| Team Shoutout | 25 | Featured on team announcements |
| Wall of Fame Feature | 200 | Featured on the Wall of Fame |

### Experiences Category
| Reward | Points | Description |
|--------|--------|-------------|
| Lunch with Leadership | 300 | Lunch with a manager of your choice |
| Training Choice | 250 | Pick your next training topic |
| Priority Scheduling | 400 | First choice on schedule requests |

### Merchandise Category
| Reward | Points | Description |
|--------|--------|-------------|
| Company Swag Item | 100 | T-shirt, mug, or branded item |
| Gift Card ($25) | 500 | $25 gift card to popular retailer |
| Premium Product Bundle | 750 | Salon products bundle |

---

## UI Design

### Rewards Catalog Tab

```
┌─────────────────────────────────────────────────────────────┐
│  [+ Add Reward]  [Use Template ▼]  [Filter ▼]  [Search...] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIME OFF                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ☕            │  │ 🚗            │  │ 🍽️            │      │
│  │ Extra Break   │  │ Leave Early   │  │ Long Lunch    │      │
│  │ 50 pts        │  │ 100 pts       │  │ 75 pts        │      │
│  │ [Edit] [•••]  │  │ [Edit] [•••]  │  │ [Edit] [•••]  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  RECOGNITION                                                │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 🏆            │  │ ⭐            │                        │
│  │ Parking Spot  │  │ Wall of Fame  │                        │
│  │ 150 pts       │  │ 200 pts       │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Reward Form Dialog

Fields:
- Name (required)
- Description (textarea)
- Category (select: Time Off, Recognition, Experience, Merchandise)
- Points Cost (number input with validation)
- Quantity (optional - leave blank for unlimited)
- Image URL (optional upload)
- Icon (icon picker from preset list)
- Featured (toggle)
- Active (toggle)
- Availability Dates (optional date range)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/settings/TeamRewardsConfigurator.tsx` | Main tabbed container |
| `src/components/rewards-config/RewardsCatalogTab.tsx` | Manage rewards CRUD |
| `src/components/rewards-config/RewardFormDialog.tsx` | Create/edit dialog |
| `src/components/rewards-config/RewardConfigCard.tsx` | Display card for config |
| `src/components/rewards-config/EarningRulesTab.tsx` | Manage earning rules |
| `src/components/rewards-config/RedemptionApprovalsTab.tsx` | Approval queue |
| `src/components/rewards-config/RewardsAnalyticsTab.tsx` | Analytics dashboard |
| `src/components/rewards-config/DefaultRewardTemplates.ts` | Template data |
| `src/components/rewards-config/index.ts` | Exports |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/admin/Settings.tsx` | Add `team-rewards` category and render TeamRewardsConfigurator |
| `src/hooks/useSettingsLayout.ts` | Add `team-rewards` to DEFAULT_ORDER and DEFAULT_ICON_COLORS |
| `src/hooks/usePoints.ts` | Add hooks for reward CRUD with templates |

---

## Database Migration

```sql
-- Add new columns to rewards_catalog for enhanced functionality
ALTER TABLE public.rewards_catalog 
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'gift',
ADD COLUMN IF NOT EXISTS start_date timestamptz,
ADD COLUMN IF NOT EXISTS end_date timestamptz,
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for organization-based queries
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_org 
ON public.rewards_catalog(organization_id);

-- Add RLS policy for organization isolation
CREATE POLICY "Users can view rewards for their organization"
ON public.rewards_catalog FOR SELECT
USING (
  organization_id IS NULL 
  OR organization_id = (SELECT get_user_organization(auth.uid()))
);

CREATE POLICY "Admins can manage rewards for their organization"
ON public.rewards_catalog FOR ALL
USING (
  public.is_coach_or_admin(auth.uid())
)
WITH CHECK (
  public.is_coach_or_admin(auth.uid())
);
```

---

## Implementation Steps

1. **Database Migration**: Add new columns to `rewards_catalog`
2. **Create Template Data**: Define default reward templates
3. **Build RewardsCatalogTab**: CRUD interface for rewards
4. **Build EarningRulesTab**: Point rules configuration (refactor from PointsConfig)
5. **Build RedemptionApprovalsTab**: Move approval queue (refactor from PointsConfig)
6. **Build RewardsAnalyticsTab**: Simple analytics dashboard
7. **Create TeamRewardsConfigurator**: Combine all tabs
8. **Add to Settings**: Register new category in Settings page
9. **Update Layout Config**: Add to DEFAULT_ORDER and icons

---

## Result

Account owners will have a centralized, intuitive interface to:
- Create and manage team rewards with visual previews
- Use pre-built templates for quick setup
- Configure point earning rules
- Approve redemption requests
- Track engagement analytics

This makes the rewards system easy to implement and maintains engagement through attractive, customizable rewards that staff can work toward.
