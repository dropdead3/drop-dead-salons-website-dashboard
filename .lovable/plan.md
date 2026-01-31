
# Promotions, Vouchers & Enhanced Rewards Analytics System

## Overview
Build a comprehensive promotions and voucher management system that allows organizations to create time-limited promotional offers, discount vouchers, and temporary promotional services. The system will integrate with existing analytics to provide clear separation between promotional and standard sales, plus dedicated loyalty/rewards analytics.

---

## System Architecture

### Database Schema

#### 1. Promotions Table
Core table for managing promotional campaigns.

```sql
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Promotion Details
  name TEXT NOT NULL,
  description TEXT,
  promo_code TEXT, -- Optional redemption code
  promotion_type TEXT NOT NULL CHECK (promotion_type IN (
    'percentage_discount',    -- e.g., 20% off
    'fixed_discount',         -- e.g., $25 off
    'bogo',                   -- Buy one get one
    'bundle',                 -- Package deal
    'new_client',             -- First-time visitor special
    'loyalty_bonus',          -- Extra points/rewards
    'referral'                -- Referral rewards
  )),
  
  -- Discount Configuration
  discount_value DECIMAL(10,2), -- Amount or percentage
  discount_max_amount DECIMAL(10,2), -- Cap for percentage discounts
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  
  -- Applicability
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'services', 'products', 'specific')),
  applicable_service_ids UUID[], -- Specific services if applies_to = 'specific'
  applicable_category TEXT[], -- Service categories
  excluded_service_ids UUID[], -- Exclusions
  
  -- Limits
  usage_limit INTEGER, -- Total redemptions allowed (null = unlimited)
  usage_per_client INTEGER DEFAULT 1, -- Per-client limit
  current_usage_count INTEGER DEFAULT 0,
  
  -- Validity
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Targeting
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN (
    'all', 'new_clients', 'existing_clients', 'loyalty_tier', 'specific_clients'
  )),
  target_loyalty_tiers TEXT[], -- For tier-specific promos
  target_client_ids UUID[], -- For specific client promos
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Vouchers Table
Individual voucher codes that can be gifted or distributed.

```sql
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  promotion_id UUID REFERENCES promotions(id), -- Can link to parent promotion
  
  -- Voucher Details
  code TEXT NOT NULL UNIQUE,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN (
    'discount',        -- Service/product discount
    'free_service',    -- Complimentary service
    'credit',          -- Salon credit
    'upgrade'          -- Service upgrade
  )),
  
  -- Value
  value DECIMAL(10,2), -- Discount amount or credit value
  value_type TEXT DEFAULT 'fixed' CHECK (value_type IN ('fixed', 'percentage')),
  free_service_id UUID REFERENCES services(id), -- For free service vouchers
  
  -- Assignment
  issued_to_client_id UUID REFERENCES phorest_clients(id),
  issued_to_email TEXT,
  issued_to_name TEXT,
  
  -- Usage
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_client_id UUID REFERENCES phorest_clients(id),
  redeemed_transaction_id TEXT, -- Link to sales transaction
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Meta
  notes TEXT,
  issued_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. Promotional Services Table
Temporary services created specifically for promotions.

```sql
CREATE TABLE public.promotional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  service_id UUID NOT NULL REFERENCES services(id), -- Link to created service
  promotion_id UUID REFERENCES promotions(id),
  
  -- Original Service Reference (if this is a discounted version)
  original_service_id UUID REFERENCES services(id),
  original_price DECIMAL(10,2),
  promotional_price DECIMAL(10,2),
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  auto_deactivate BOOLEAN DEFAULT true, -- Auto-disable when expired
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);
```

#### 4. Promotion Redemptions Table
Tracks each use of a promotion or voucher.

```sql
CREATE TABLE public.promotion_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Source
  promotion_id UUID REFERENCES promotions(id),
  voucher_id UUID REFERENCES vouchers(id),
  promo_code_used TEXT,
  
  -- Transaction Details
  client_id UUID REFERENCES phorest_clients(id),
  transaction_id TEXT, -- phorest_transaction_id or internal
  transaction_date TIMESTAMPTZ DEFAULT now(),
  
  -- Value
  original_amount DECIMAL(10,2),
  discount_applied DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  
  -- Items Discounted
  items_discounted JSONB, -- [{item_name, original_price, discount}]
  
  -- Meta
  location_id TEXT,
  staff_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. Add Sale Type Classification Column
Extend transaction tracking to classify sale types.

```sql
-- Add to phorest_transaction_items (or create view)
ALTER TABLE phorest_transaction_items 
ADD COLUMN IF NOT EXISTS sale_classification TEXT DEFAULT 'standard' 
  CHECK (sale_classification IN ('standard', 'promotional', 'voucher', 'loyalty_redemption', 'gift_card'));

-- Also update retail_sale_items
ALTER TABLE retail_sale_items
ADD COLUMN IF NOT EXISTS sale_classification TEXT DEFAULT 'standard';
```

#### 6. Loyalty Analytics Aggregation Table
Pre-aggregated loyalty metrics for performance.

```sql
CREATE TABLE public.loyalty_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  analytics_date DATE NOT NULL,
  
  -- Points Activity
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  points_expired INTEGER DEFAULT 0,
  
  -- Member Activity
  active_members INTEGER DEFAULT 0, -- Members with activity
  new_enrollments INTEGER DEFAULT 0,
  tier_upgrades INTEGER DEFAULT 0,
  
  -- Revenue Attribution
  loyalty_attributed_revenue DECIMAL(10,2) DEFAULT 0,
  redemption_value DECIMAL(10,2) DEFAULT 0,
  
  UNIQUE(organization_id, analytics_date)
);
```

---

## File Structure

```
src/
├── components/dashboard/promotions/
│   ├── PromotionsConfigurator.tsx        # Main configurator (tabbed)
│   ├── PromotionsList.tsx                # All promotions table
│   ├── PromotionForm.tsx                 # Create/edit promotion dialog
│   ├── PromotionCard.tsx                 # Summary card with actions
│   ├── VoucherGenerator.tsx              # Bulk voucher creation
│   ├── VouchersList.tsx                  # Voucher management table
│   ├── VoucherRedemption.tsx             # Redemption interface
│   ├── PromotionalServiceForm.tsx        # Create promotional service
│   ├── PromotionalServicesManager.tsx    # List with expiration status
│   ├── PromoAnalyticsSummary.tsx         # Promo performance overview
│   └── LoyaltyAnalyticsPanel.tsx         # Loyalty program analytics
├── components/dashboard/analytics/
│   ├── SalesTypeFilter.tsx               # Filter toggle (all/standard/promo)
│   ├── PromoSalesBreakdown.tsx           # Promo vs standard pie chart
│   └── LoyaltyMetricsCard.tsx            # Points/tier summary
├── hooks/
│   ├── usePromotions.ts                  # Promotion CRUD
│   ├── useVouchers.ts                    # Voucher management
│   ├── usePromotionalServices.ts         # Auto-expiring services
│   ├── usePromotionRedemptions.ts        # Redemption tracking
│   └── useLoyaltyAnalytics.ts            # Loyalty program metrics
├── pages/dashboard/settings/
│   └── (integrate via LoyaltySettingsContent)
```

---

## Implementation Phases

### Phase 1: Database & Core Infrastructure

1. **Migration**: Create all new tables with RLS policies
2. **Permissions**: Add `manage_promotions`, `view_promotion_analytics`
3. **Edge Function**: `expire-promotional-services` - Daily cron to auto-deactivate expired promo services
4. **Core Hooks**:
   - `usePromotions` - CRUD for promotions
   - `useVouchers` - Voucher generation/redemption
   - `usePromotionalServices` - Service lifecycle management

### Phase 2: Promotions Configurator UI

**Location**: New tab in Loyalty Settings or dedicated Settings category

**Tabs**:
1. **Active Promotions** - Current promos with quick actions
2. **Create Promotion** - Full form with targeting options
3. **Vouchers** - Generate/manage individual codes
4. **Promo Services** - Temporary service management
5. **Analytics** - Performance dashboard

**UI Mockup - Create Promotion**:
```
┌─────────────────────────────────────────────────────────────────┐
│ CREATE NEW PROMOTION                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Promotion Name *                                                │
│ [Spring Refresh Special                                    ]    │
│                                                                 │
│ Description                                                     │
│ [20% off all color services for the month of April       ]     │
│                                                                 │
│ ───────────────────────────────────────────────────────────    │
│                                                                 │
│ DISCOUNT TYPE                                                   │
│ (•) Percentage    [$20 ] %                                     │
│ ( ) Fixed Amount  [$   ]                                       │
│ ( ) Free Service  [Select service ▼]                           │
│                                                                 │
│ APPLIES TO                                                      │
│ ( ) All Services & Products                                    │
│ (•) Service Categories  [☑ Color] [☑ Blonding] [☐ Haircut]    │
│ ( ) Specific Services   [Select... ▼]                          │
│                                                                 │
│ ───────────────────────────────────────────────────────────    │
│                                                                 │
│ VALIDITY                                                        │
│ Start Date: [Apr 1, 2026 ▼]    End Date: [Apr 30, 2026 ▼]     │
│                                                                 │
│ PROMO CODE (Optional)                                           │
│ [SPRING20     ]  [Generate Random]                              │
│                                                                 │
│ ───────────────────────────────────────────────────────────    │
│                                                                 │
│ LIMITS                                                          │
│ Total Uses: [100  ] (leave blank for unlimited)                │
│ Per Client: [1    ]                                             │
│ Min Purchase: [$0  ]                                            │
│                                                                 │
│ TARGET AUDIENCE                                                 │
│ ( ) All Clients                                                │
│ ( ) New Clients Only                                           │
│ (•) Loyalty Members  [☑ Gold] [☑ Platinum]                    │
│                                                                 │
│                               [Cancel]   [Create Promotion →]   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Promotional Services Feature

**Concept**: Create a temporary service (e.g., "Spring Balayage Special - $199") that:
- Appears in booking/POS systems
- Has an automatic expiration date
- Gets soft-deleted/hidden when expired
- Is tagged for analytics exclusion if desired

**UI Mockup - Create Promotional Service**:
```
┌─────────────────────────────────────────────────────────────────┐
│ CREATE PROMOTIONAL SERVICE                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ☑ Base on Existing Service                                     │
│ [Signature Balayage ▼]                                         │
│                                                                 │
│ Original Price: $350                                            │
│ Promotional Price: [$199      ]                                │
│                                                                 │
│ Promotional Service Name                                        │
│ [Spring Balayage Special                                   ]    │
│                                                                 │
│ ───────────────────────────────────────────────────────────    │
│                                                                 │
│ EXPIRATION                                                      │
│ End Date: [Apr 30, 2026 ▼]                                     │
│                                                                 │
│ ☑ Automatically hide service after expiration                  │
│ ☐ Send notification 3 days before expiration                   │
│                                                                 │
│ Link to Promotion: [Spring Refresh Special ▼] (optional)       │
│                                                                 │
│                          [Cancel]   [Create Service →]          │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Analytics Integration

**Sales Dashboard Enhancements**:

1. **Sale Type Filter** - Toggle between:
   - All Sales
   - Standard Sales Only (exclude promos)
   - Promotional Sales Only
   - Loyalty Redemptions

2. **Revenue Breakdown Card** - Shows:
   ```
   ┌─────────────────────────────────┐
   │ REVENUE BREAKDOWN               │
   │                                 │
   │ ● Standard Revenue    $45,230  │
   │ ● Promotional Sales   $8,450   │
   │ ● Voucher Redemptions $2,100   │
   │ ● Loyalty Rewards     $1,890   │
   │ ─────────────────────────────  │
   │   Gross Revenue      $57,670   │
   │                                 │
   │ [View Details]                  │
   └─────────────────────────────────┘
   ```

3. **Promotion Performance Table**:
   ```
   | Promotion          | Uses | Revenue | Discount Given | Net Revenue |
   |--------------------|------|---------|----------------|-------------|
   | Spring Refresh 20% | 45   | $12,500 | -$2,500        | $10,000     |
   | New Client $25 Off | 12   | $1,800  | -$300          | $1,500      |
   ```

4. **Loyalty Analytics Tab**:
   - Points Earned vs Redeemed (trend line)
   - Active Members by Tier (pie chart)
   - Redemption Rate (points used / points available)
   - Top Loyalty Spenders
   - Points Liability (outstanding unredeemed points value)

**UI Mockup - Loyalty Analytics**:
```
┌────────────────────────────────────────────────────────────────────────┐
│ LOYALTY PROGRAM ANALYTICS                           [Last 30 Days ▼]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ │
│ │ 12,450      │ │ 3,200       │ │ 78%         │ │ $324             │ │
│ │ Points      │ │ Points      │ │ Active      │ │ Points           │ │
│ │ Earned      │ │ Redeemed    │ │ Members     │ │ Liability        │ │
│ │ ↑ 15%       │ │ ↑ 8%        │ │ 156 of 200  │ │ (9,250 pts)      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └──────────────────┘ │
│                                                                        │
│ TIER DISTRIBUTION              │ POINTS ACTIVITY (30 Days)            │
│ ┌─────────────────────────┐   │ ┌───────────────────────────────────┐│
│ │      Platinum 12%       │   │ │     ▲                             ││
│ │    ●━━━━●               │   │ │   ╱ ╲    ╱╲                      ││
│ │       Gold 28%          │   │ │  ╱   ╲  ╱  ╲  ━ Earned          ││
│ │   ●━━━━━━━●             │   │ │ ╱     ╲╱    ╲ ━ Redeemed        ││
│ │     Silver 35%          │   │ │╱             ╲                   ││
│ │   ●━━━━━━━━━●           │   │ └───────────────────────────────────┘│
│ │     Bronze 25%          │   │                                      │
│ │   ●━━━━━━━●             │   │                                      │
│ └─────────────────────────┘   │                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 5: Edge Functions

#### 1. `expire-promotional-services`
Scheduled daily to auto-deactivate expired promotional services.

```typescript
// supabase/functions/expire-promotional-services/index.ts
// - Query promotional_services where expires_at < now() AND auto_deactivate = true
// - Set linked services.is_active = false
// - Update promotional_services.deactivated_at
// - Log to edge_function_logs
```

#### 2. `aggregate-loyalty-analytics`
Scheduled daily to pre-compute loyalty metrics.

```typescript
// supabase/functions/aggregate-loyalty-analytics/index.ts
// - Count points earned/redeemed from points_transactions
// - Count active members, tier changes
// - Insert into loyalty_analytics_daily
```

---

## Key Enhancements & Suggestions

### 1. Smart Voucher Generation
- Bulk generation with CSV export for email campaigns
- Unique codes with prefix support (e.g., "SPRING-XXXXX")
- QR codes for easy scanning at checkout

### 2. Promo Code Validation in Checkout
- Integrate with `CheckoutSummarySheet` to accept promo codes
- Real-time discount calculation
- Client eligibility checking (new/existing, tier)

### 3. Referral Program Integration
- Auto-generate referral vouchers for loyal clients
- Track referral chains (who referred whom)
- Commission both referrer and new client

### 4. Flash Sale Notifications
- Time-limited promos with countdown
- Push notification integration for mobile
- Homepage banner integration

### 5. Analytics Exclusions
- Toggle to exclude promo sales from KPIs
- "True revenue" vs "gross revenue" views
- Staff commission calculations with promo adjustments

### 6. A/B Testing Promos
- Create variants of same promotion
- Track performance by variant
- Statistical significance indicators

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | Migration | All new tables, RLS, permissions, cron job |
| Create | `src/hooks/usePromotions.ts` | Promotion CRUD operations |
| Create | `src/hooks/useVouchers.ts` | Voucher management |
| Create | `src/hooks/usePromotionalServices.ts` | Auto-expiring services |
| Create | `src/hooks/usePromotionRedemptions.ts` | Redemption tracking |
| Create | `src/hooks/useLoyaltyAnalytics.ts` | Loyalty metrics aggregation |
| Create | `src/components/dashboard/promotions/PromotionsConfigurator.tsx` | Main tabbed configurator |
| Create | `src/components/dashboard/promotions/PromotionForm.tsx` | Create/edit dialog |
| Create | `src/components/dashboard/promotions/PromotionsList.tsx` | Promotions table |
| Create | `src/components/dashboard/promotions/VoucherGenerator.tsx` | Bulk voucher creation |
| Create | `src/components/dashboard/promotions/VouchersList.tsx` | Voucher management |
| Create | `src/components/dashboard/promotions/PromotionalServiceForm.tsx` | Create promo service |
| Create | `src/components/dashboard/promotions/PromotionalServicesManager.tsx` | List with expiration |
| Create | `src/components/dashboard/promotions/PromoAnalyticsSummary.tsx` | Performance dashboard |
| Create | `src/components/dashboard/analytics/SalesTypeFilter.tsx` | Sale type toggle filter |
| Create | `src/components/dashboard/analytics/PromoSalesBreakdown.tsx` | Revenue breakdown chart |
| Create | `src/components/dashboard/analytics/LoyaltyMetricsCard.tsx` | Points summary card |
| Create | `src/components/dashboard/loyalty/LoyaltyAnalyticsPanel.tsx` | Full loyalty analytics |
| Create | `supabase/functions/expire-promotional-services/index.ts` | Auto-expire edge function |
| Create | `supabase/functions/aggregate-loyalty-analytics/index.ts` | Daily aggregation |
| Modify | `src/components/dashboard/settings/LoyaltySettingsContent.tsx` | Add Promotions & Analytics tabs |
| Modify | `src/hooks/useSalesData.ts` | Add sale_classification filter support |
| Modify | `src/pages/dashboard/admin/SalesDashboard.tsx` | Add sale type filter UI |
| Modify | `src/components/dashboard/schedule/CheckoutSummarySheet.tsx` | Promo code input |

---

## Technical Considerations

- **RLS Policies**: Organization-scoped access for all promo tables
- **Index Strategy**: Index on `expires_at`, `promo_code`, `organization_id`
- **Cron Scheduling**: Daily at 00:05 UTC for expiration checks
- **Voucher Codes**: 8-character alphanumeric, collision-resistant generation
- **Analytics Caching**: Pre-aggregate daily to avoid expensive queries
- **Points Liability**: Calculate unredeemed points × redemption value for financial reporting

---

## Edge Cases

- **Stackable Promos**: Define rules for combining multiple discounts
- **Partial Refunds**: How promo discounts apply to refunded items
- **Service Deletion**: Soft-delete only; preserve for historical analytics
- **Expired Vouchers**: Keep records, mark as expired, prevent redemption
- **Tier Changes**: Recalculate applicable promos when client tier changes
