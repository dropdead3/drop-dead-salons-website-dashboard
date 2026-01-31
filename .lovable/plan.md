
# Embed Loyalty Configurator in Settings Page

## Overview
Move the full Loyalty & Rewards configurator (tabs for Program, Tiers, Design, Print, Order) directly into the Admin Settings page under the `loyalty` category. This eliminates the unnecessary extra click required by the current "Open Loyalty & Rewards" button.

## Current State
- The `loyalty` category in Settings shows a placeholder card with a button that redirects to `/dashboard/settings/loyalty`
- The actual configurator lives in `src/pages/dashboard/settings/LoyaltyProgram.tsx` as a standalone page
- Components (`LoyaltyProgramConfigurator`, `LoyaltyTiersEditor`, etc.) accept `organizationId` as a prop

## Implementation

### 1. Create `LoyaltySettingsContent.tsx` Component
Following the pattern of `DayRateSettingsContent.tsx`, create a new wrapper component that embeds all loyalty tabs:

**File**: `src/components/dashboard/settings/LoyaltySettingsContent.tsx`

```typescript
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Crown, Sparkles, CreditCard, Package } from 'lucide-react';
import { LoyaltyProgramConfigurator } from '@/components/dashboard/loyalty/LoyaltyProgramConfigurator';
import { LoyaltyTiersEditor } from '@/components/dashboard/loyalty/LoyaltyTiersEditor';
import { GiftCardDesignEditor } from '@/components/dashboard/loyalty/GiftCardDesignEditor';
import { PhysicalCardOrderForm } from '@/components/dashboard/loyalty/PhysicalCardOrderForm';
import { PhysicalCardOrderHistory } from '@/components/dashboard/loyalty/PhysicalCardOrderHistory';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export function LoyaltySettingsContent() {
  const [activeTab, setActiveTab] = useState('program');
  const { effectiveOrganization } = useOrganizationContext();
  const organizationId = effectiveOrganization?.id;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="program" className="gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Program</span>
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Tiers</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Design</span>
          </TabsTrigger>
          <TabsTrigger value="print" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </TabsTrigger>
          <TabsTrigger value="order" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Order</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="mt-6">
          <LoyaltyProgramConfigurator organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="tiers" className="mt-6">
          <LoyaltyTiersEditor organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="design" className="mt-6">
          <GiftCardDesignEditor organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="print" className="mt-6">
          <PhysicalCardOrderForm organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="order" className="mt-6">
          <PhysicalCardOrderHistory organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2. Update Settings.tsx
Replace the placeholder card with the new component:

**File**: `src/pages/dashboard/admin/Settings.tsx`

**Changes**:
1. Add import for `LoyaltySettingsContent`
2. Replace the loyalty category content (lines 1279-1291)

```typescript
// Add import at top
import { LoyaltySettingsContent } from '@/components/dashboard/settings/LoyaltySettingsContent';

// Replace existing loyalty section
{activeCategory === 'loyalty' && <LoyaltySettingsContent />}
```

### 3. Optional Cleanup
The standalone page at `/dashboard/settings/loyalty` can be kept for direct access or removed if no longer needed. For now, keeping it provides flexibility.

## Files to Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/components/dashboard/settings/LoyaltySettingsContent.tsx` | New wrapper component with all loyalty tabs |
| Modify | `src/pages/dashboard/admin/Settings.tsx` | Import and render `LoyaltySettingsContent` instead of button |

## Result
When clicking "Loyalty & Rewards" in Admin Settings, users will immediately see the full tabbed configurator (Program, Tiers, Design, Print, Order) instead of a redirect button.
