

# Rewards, Gift Cards & Loyalty Program Configurator

## Overview
Build a comprehensive configuration system for organizations to manage client loyalty programs, gift card design customization, physical card ordering, and printable gift card certificates. This system will integrate with the existing gift card infrastructure and follow established configurator patterns.

---

## System Architecture

### Database Schema

#### 1. Loyalty Program Settings Table
Stores organization-level loyalty program configuration.
```sql
CREATE TABLE public.loyalty_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  
  -- Program Status
  is_enabled BOOLEAN DEFAULT false,
  program_name TEXT DEFAULT 'Rewards Program',
  
  -- Points Earning Rules
  points_per_dollar DECIMAL(10,2) DEFAULT 1.0,
  service_multiplier DECIMAL(10,2) DEFAULT 1.0,
  product_multiplier DECIMAL(10,2) DEFAULT 1.0,
  
  -- Redemption Rules  
  points_to_dollar_ratio DECIMAL(10,4) DEFAULT 0.01, -- 100 pts = $1
  minimum_redemption_points INTEGER DEFAULT 100,
  
  -- Expiration
  points_expire BOOLEAN DEFAULT false,
  points_expiration_days INTEGER DEFAULT 365,
  
  -- Bonus Rules (JSONB for flexibility)
  bonus_rules JSONB DEFAULT '[]',
  -- e.g., [{"type": "birthday", "bonus_points": 100}, {"type": "first_visit", "multiplier": 2}]
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Client Loyalty Points Table
Tracks individual client point balances.
```sql
CREATE TABLE public.client_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES phorest_clients(id),
  current_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, client_id)
);
```

#### 3. Points Transaction Ledger
Audit trail for all points activity.
```sql
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES phorest_clients(id),
  transaction_type TEXT NOT NULL, 
  -- 'earned', 'redeemed', 'bonus', 'expired', 'adjustment'
  points INTEGER NOT NULL,
  reference_type TEXT, -- 'appointment', 'retail_sale', 'manual', 'birthday'
  reference_id TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. Loyalty Tiers Configuration
```sql
CREATE TABLE public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  tier_name TEXT NOT NULL,
  tier_key TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  minimum_lifetime_points INTEGER NOT NULL DEFAULT 0,
  points_multiplier DECIMAL(10,2) DEFAULT 1.0,
  perks TEXT[], -- Array of perk descriptions
  sort_order INTEGER DEFAULT 0,
  color TEXT DEFAULT '#cd7f32',
  icon TEXT DEFAULT 'star',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. Gift Card Design Settings
Organization branding for gift cards.
```sql
CREATE TABLE public.gift_card_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  
  -- Digital Card Design
  card_background_color TEXT DEFAULT '#1a1a1a',
  card_text_color TEXT DEFAULT '#ffffff',
  card_accent_color TEXT DEFAULT '#d4af37',
  card_logo_url TEXT,
  
  -- Print Settings
  print_template TEXT DEFAULT 'elegant', -- elegant, modern, minimal
  include_qr_code BOOLEAN DEFAULT true,
  include_terms BOOLEAN DEFAULT true,
  terms_text TEXT,
  
  -- Default Values
  default_expiration_months INTEGER DEFAULT 12,
  suggested_amounts INTEGER[] DEFAULT ARRAY[25, 50, 100, 150, 200],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6. Physical Card Orders
Track orders for custom printed gift cards.
```sql
CREATE TABLE public.gift_card_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Order Details
  quantity INTEGER NOT NULL,
  card_design TEXT NOT NULL, -- design template name
  card_stock TEXT DEFAULT 'standard', -- standard, premium, plastic
  
  -- Customization
  custom_logo_url TEXT,
  custom_message TEXT,
  card_number_prefix TEXT, -- e.g., "DD-" for Drop Dead
  
  -- Shipping
  shipping_address JSONB NOT NULL,
  shipping_method TEXT DEFAULT 'standard', -- standard, express, overnight
  
  -- Status & Pricing
  status TEXT DEFAULT 'pending', 
  -- pending, confirmed, printing, shipped, delivered, cancelled
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  tracking_number TEXT,
  estimated_delivery DATE,
  
  -- Timestamps
  ordered_by UUID NOT NULL REFERENCES auth.users(id),
  ordered_at TIMESTAMPTZ DEFAULT now(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT
);
```

### Add New Fields to Gift Cards Table
```sql
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS 
  card_type TEXT DEFAULT 'digital', -- 'digital', 'physical'
  design_template TEXT,
  custom_message TEXT,
  qr_code_url TEXT,
  printed_at TIMESTAMPTZ,
  physical_card_id TEXT; -- For tracking physical card stock
```

---

## File Structure

```
src/
├── pages/dashboard/settings/
│   └── LoyaltyProgram.tsx                    # Main configurator page
├── components/dashboard/loyalty/
│   ├── LoyaltyProgramConfigurator.tsx        # Program settings tab
│   ├── LoyaltyTiersEditor.tsx                # Tier configuration
│   ├── PointsRulesEditor.tsx                 # Earning/redemption rules
│   ├── BonusRulesEditor.tsx                  # Birthday/referral bonuses
│   ├── GiftCardDesignEditor.tsx              # Visual design customization
│   ├── GiftCardPreview.tsx                   # Live card preview
│   ├── PhysicalCardOrderForm.tsx             # Order custom printed cards
│   ├── PhysicalCardOrderHistory.tsx          # Past orders list
│   ├── PrintableGiftCard.tsx                 # Printable paper certificate
│   └── ClientLoyaltyCard.tsx                 # Client profile loyalty display
├── hooks/
│   ├── useLoyaltySettings.ts                 # Loyalty program CRUD
│   ├── useLoyaltyTiers.ts                    # Tier configuration
│   ├── useClientLoyaltyPoints.ts             # Client points management
│   ├── useGiftCardSettings.ts                # Gift card branding
│   └── useGiftCardOrders.ts                  # Physical card orders
```

---

## Implementation Phases

### Phase 1: Database & Core Hooks

1. Create migration with all new tables and RLS policies
2. Add permissions: `manage_loyalty_program`, `manage_gift_card_design`, `order_physical_cards`
3. Create hooks:
   - `useLoyaltySettings` - Fetch/update program configuration
   - `useLoyaltyTiers` - CRUD for reward tiers
   - `useClientLoyaltyPoints` - Client points queries
   - `useGiftCardSettings` - Organization card branding
   - `useGiftCardOrders` - Physical card order management

### Phase 2: Loyalty Program Configurator

**Route**: `/dashboard/settings/loyalty` (or integrated into Admin Settings)

**Tabs Structure**:
1. **Program Settings** - Enable/disable, naming, basic rules
2. **Points Rules** - Earning rates, multipliers, redemption ratios
3. **Reward Tiers** - Bronze/Silver/Gold/Platinum configuration
4. **Bonus Rules** - Birthday rewards, first-visit bonuses, referral points

**UI Mockup - Program Settings**:
```
+------------------------------------------------------------------+
| LOYALTY & REWARDS                                                 |
| Configure your client loyalty program                             |
+------------------------------------------------------------------+
| [Program] [Points Rules] [Tiers] [Bonuses] [Gift Cards]          |
+------------------------------------------------------------------+
|                                                                   |
| Enable Loyalty Program                              [Toggle ON]   |
|                                                                   |
| Program Name                                                      |
| [Drop Dead Rewards                                           ]    |
|                                                                   |
| ─────────────────────────────────────────────────────────────    |
|                                                                   |
| POINTS EARNING                                                    |
|                                                                   |
| Base Rate: [$1.00] spent = [1] point                             |
|                                                                   |
| Category Multipliers:                                             |
| • Services          [1.5x ▼]                                     |
| • Retail Products   [1.0x ▼]                                     |
| • Extensions        [2.0x ▼]                                     |
|                                                                   |
| ─────────────────────────────────────────────────────────────    |
|                                                                   |
| REDEMPTION                                                        |
|                                                                   |
| [100] points = $[1.00] off                                       |
| Minimum redemption: [500] points                                  |
|                                                                   |
+------------------------------------------------------------------+
```

**UI Mockup - Tiers Editor**:
```
+------------------------------------------------------------------+
| REWARD TIERS                           [+ Add Tier] [Reset]       |
+------------------------------------------------------------------+
|                                                                   |
| ┌─ Bronze ─────────────────────────────────────────────────────┐ |
| │ [🥉] Lifetime Points Required: [0]                           │ |
| │ Points Multiplier: [1.0x]                                     │ |
| │ Perks:                                                        │ |
| │ • [Birthday discount: 10%                              ] [×]  │ |
| │ • [+ Add perk]                                                │ |
| │ Color: [#CD7F32 ■]                                           │ |
| └───────────────────────────────────────────────────────────────┘ |
|                                                                   |
| ┌─ Silver ─────────────────────────────────────────────────────┐ |
| │ [🥈] Lifetime Points Required: [500]                         │ |
| │ Points Multiplier: [1.25x]                                    │ |
| │ Perks:                                                        │ |
| │ • [Birthday discount: 15%                              ] [×]  │ |
| │ • [Free product sample with visit                      ] [×]  │ |
| │ • [+ Add perk]                                                │ |
| └───────────────────────────────────────────────────────────────┘ |
|                                                                   |
+------------------------------------------------------------------+
```

### Phase 3: Gift Card Design Configurator

**Features**:
- Live preview of digital gift card appearance
- Color picker for background/text/accent
- Logo upload integration (uses existing storage bucket)
- Template selection (Elegant, Modern, Minimal)
- QR code toggle
- Terms & conditions editor
- Suggested denomination amounts

**UI Mockup - Design Editor**:
```
+------------------------------------------------------------------+
| GIFT CARD DESIGN                                                  |
+------------------------------------------------------------------+
|                                                                   |
| PREVIEW                          | SETTINGS                       |
| ┌─────────────────────────────┐  |                                |
| │  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  │  | Template: [Elegant ▼]          |
| │  █                        █  │  |                                |
| │  █   DROP DEAD®           █  │  | Background: [#1A1A1A ■]        |
| │  █                        █  │  | Text Color: [#FFFFFF ■]        |
| │  █   GIFT CARD            █  │  | Accent:     [#D4AF37 ■]        |
| │  █                        █  │  |                                |
| │  █   $100                 █  │  | [☑] Include QR Code            |
| │  █                        █  │  | [☑] Include Terms              |
| │  █  CODE: XXXX-XXXX-XXXX  █  │  |                                |
| │  █     [QR CODE]          █  │  | ─────────────────────────────  |
| │  █████████████████████████  │  |                                |
| └─────────────────────────────┘  | Suggested Amounts:              |
|                                  | [$25] [$50] [$100] [$150] [$200]|
| [Print Preview] [Download PDF]   | [+ Add Amount]                  |
|                                  |                                 |
+------------------------------------------------------------------+
```

### Phase 4: Printable Gift Card (Paper)

**Component**: `PrintableGiftCard.tsx`

Uses existing patterns from `Extensions.tsx` coupon printing and `jsPDF` for PDF generation:
- Generates a printable certificate-style gift card
- Includes QR code (using `qrcode.react`) for balance lookup
- Organization branding from `gift_card_settings`
- Unique gift card code prominently displayed
- Optional custom message from purchaser

**Print Layout (8.5" x 4" or standard gift card certificate)**:
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    [ORGANIZATION LOGO]                              │
│                                                                     │
│                        GIFT CARD                                    │
│                                                                     │
│                         $100                                        │
│                                                                     │
│    ┌──────────┐                                                     │
│    │ [QR CODE]│     Code: ABCD-1234-EFGH-5678                      │
│    └──────────┘                                                     │
│                                                                     │
│    To: Jane Doe                                                     │
│    From: John Smith                                                 │
│    Message: "Happy Birthday! Treat yourself!"                       │
│                                                                     │
│    ─────────────────────────────────────────────────────────────   │
│    Valid at all Drop Dead locations. No cash value.                 │
│    Expires: January 31, 2027                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 5: Physical Card Ordering System

**Route**: `/dashboard/settings/loyalty?tab=physical-cards`

**Features**:
- Order form for custom printed plastic/cardstock gift cards
- Quantity selection with tiered pricing display
- Design template preview
- Custom logo upload
- Shipping address form (pulls from organization defaults)
- Order history with status tracking
- Platform admin fulfillment dashboard (separate from org view)

**UI Mockup - Order Form**:
```
+------------------------------------------------------------------+
| ORDER PHYSICAL GIFT CARDS                                         |
+------------------------------------------------------------------+
|                                                                   |
| CARD DESIGN                                                       |
| ┌─────────┐ ┌─────────┐ ┌─────────┐                              |
| │ Elegant │ │ Modern  │ │ Minimal │                              |
| │  (•)    │ │  ( )    │ │  ( )    │                              |
| └─────────┘ └─────────┘ └─────────┘                              |
|                                                                   |
| CARD STOCK                                                        |
| ( ) Standard Cardstock    - $0.50/card                           |
| (•) Premium Matte         - $0.85/card                           |
| ( ) Plastic PVC           - $1.50/card                           |
|                                                                   |
| QUANTITY                                                          |
| [100 ▼] cards            Subtotal: $85.00                        |
|                                                                   |
| ─────────────────────────────────────────────────────────────    |
|                                                                   |
| CUSTOMIZATION                                                     |
| Upload Logo: [Choose File] business-logo.png                      |
| Card Prefix: [DD-     ] (e.g., DD-0001)                          |
|                                                                   |
| ─────────────────────────────────────────────────────────────    |
|                                                                   |
| SHIPPING ADDRESS                                                  |
| [Use default business address ▼]                                  |
|                                                                   |
| Shipping: ( ) Standard (5-7 days) FREE                           |
|           (•) Express (2-3 days) $15.00                          |
|                                                                   |
| ─────────────────────────────────────────────────────────────    |
|                                                                   |
|                     TOTAL: $100.00                                |
|                                                                   |
| [Cancel]                              [Submit Order →]            |
|                                                                   |
+------------------------------------------------------------------+
```

**Order History Table**:
```
| Order #    | Date       | Qty  | Design  | Status    | Tracking        |
|------------|------------|------|---------|-----------|-----------------|
| ORD-001234 | Jan 15, 26 | 500  | Elegant | Shipped   | 1Z999AA10123... |
| ORD-001198 | Dec 20, 25 | 250  | Modern  | Delivered | —               |
```

### Phase 6: Integration with Existing Systems

1. **Client Profiles**: Add loyalty points display to `ClientDetailSheet` and `ClientBalanceCard`
2. **Checkout Flow**: Points earning calculation during `CheckoutSummarySheet`
3. **Register POS**: Points redemption option in payment methods
4. **Gift Card Manager**: Add "Print" and "Order Physical" actions to existing table
5. **Transactions Page**: Show loyalty points activity in client transaction history

---

## Technical Details

### RLS Policies
```sql
-- All loyalty tables: Org admins/managers can manage
CREATE POLICY "Org staff can manage loyalty settings" ON loyalty_program_settings
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- Points viewing: Any staff can view client points
CREATE POLICY "Staff can view client points" ON client_loyalty_points
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));
```

### Gift Card PDF Generation
```typescript
// Uses existing jsPDF pattern
const generatePrintableGiftCard = (giftCard: GiftCard, settings: GiftCardSettings) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [4, 8.5], // Certificate size
  });
  
  // Background color
  doc.setFillColor(settings.card_background_color);
  doc.rect(0, 0, 8.5, 4, 'F');
  
  // Add logo, text, QR code...
  // Use QRCodeCanvas.toDataURL() for embedding QR in PDF
  
  doc.save(`gift-card-${giftCard.code}.pdf`);
};
```

### Points Calculation Hook
```typescript
export function useCalculatePoints(transaction: { 
  type: 'service' | 'product'; 
  amount: number 
}) {
  const { data: settings } = useLoyaltySettings();
  
  const multiplier = transaction.type === 'service' 
    ? settings?.service_multiplier || 1 
    : settings?.product_multiplier || 1;
    
  const basePoints = Math.floor(transaction.amount * (settings?.points_per_dollar || 1));
  const earnedPoints = Math.floor(basePoints * multiplier);
  
  return { basePoints, earnedPoints, multiplier };
}
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | Migration | All new tables, RLS, permissions |
| Create | `src/pages/dashboard/settings/LoyaltyProgram.tsx` | Main configurator page |
| Create | `src/components/dashboard/loyalty/LoyaltyProgramConfigurator.tsx` | Program settings panel |
| Create | `src/components/dashboard/loyalty/LoyaltyTiersEditor.tsx` | Tier management UI |
| Create | `src/components/dashboard/loyalty/PointsRulesEditor.tsx` | Earning/redemption rules |
| Create | `src/components/dashboard/loyalty/BonusRulesEditor.tsx` | Special bonus configuration |
| Create | `src/components/dashboard/loyalty/GiftCardDesignEditor.tsx` | Visual design customizer |
| Create | `src/components/dashboard/loyalty/GiftCardPreview.tsx` | Live preview component |
| Create | `src/components/dashboard/loyalty/PhysicalCardOrderForm.tsx` | Order placement form |
| Create | `src/components/dashboard/loyalty/PhysicalCardOrderHistory.tsx` | Order tracking table |
| Create | `src/components/dashboard/loyalty/PrintableGiftCard.tsx` | PDF/print certificate |
| Create | `src/components/dashboard/loyalty/ClientLoyaltyCard.tsx` | Points display for profiles |
| Create | `src/hooks/useLoyaltySettings.ts` | Program config CRUD |
| Create | `src/hooks/useLoyaltyTiers.ts` | Tier management |
| Create | `src/hooks/useClientLoyaltyPoints.ts` | Client points operations |
| Create | `src/hooks/useGiftCardSettings.ts` | Design settings |
| Create | `src/hooks/useGiftCardOrders.ts` | Physical order management |
| Modify | `src/App.tsx` | Add route for loyalty settings |
| Modify | `src/pages/dashboard/admin/Settings.tsx` | Add Loyalty category card |
| Modify | `src/components/dashboard/transactions/GiftCardManager.tsx` | Add Print/Order actions |
| Modify | `src/components/dashboard/transactions/ClientBalanceCard.tsx` | Show loyalty points |
| Modify | `src/components/dashboard/schedule/CheckoutSummarySheet.tsx` | Points earning display |

---

## Edge Cases & Considerations

- **Multi-location**: Loyalty points are organization-wide, not location-specific
- **Point expiration**: Batch job or trigger needed for expiring old points
- **Physical card activation**: Cards ordered may need manual code assignment flow
- **Tier downgrades**: Decide if clients can drop tiers (typically no)
- **Migration**: Existing gift cards remain functional with default design
- **Printing costs**: Platform takes margin on physical card orders (revenue stream)
- **International**: Consider multi-currency for organizations outside US

