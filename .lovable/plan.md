

# Tokenize Tab Bar Styling and Responsiveness

## Problem
There are 50+ files using `TabsList` with inconsistent styling -- custom classNames, varying radii, grid layouts, and different padding. Only one file (AnalyticsHub) uses the responsive `ResponsiveTabsList`. The tab bar look and responsive behavior needs to be unified.

## Approach

Rather than modifying all 50+ files at once (high risk, massive diff), we split tabs into two standardized variants and migrate in batches.

### Two Tab Bar Variants

1. **ResponsiveTabsList** (default for page-level navigation)
   - Left-anchored, auto-width, overflow into "more" menu
   - Used for page tabs with 3+ options (Analytics, Training, Settings, etc.)
   - Already built -- just needs wider adoption

2. **TabsList** (compact/inline)
   - For small toggles (list/card view), dialog tabs, and 2-option switchers
   - Keep the base styling (radius 9px outer / 6px inner, p-1.5, h-11) already defined

### Migration Categories

**Category A -- Page-level tabs (convert to ResponsiveTabsList):** ~25 files
These currently use `TabsList` with grid or overflow hacks. Examples:
- TrainingHub, ZuraConfigPage, DayRateSettings, PromotionsConfigurator
- AccessHub, LoyaltyProgram, ProgramEditor, LeadManagement
- SalesDashboard, PTOManager, AccountManagement, ReportsHub

**Category B -- Inline/compact tabs (standardize base TabsList):** ~15 files
These are small toggles or dialog-embedded tabs that just need className cleanup to match the tokenized base. Examples:
- ChallengeLeaderboard (list/cards toggle), ProductLeaderboard, StaffRevenueLeaderboard
- IssueContractDialog, RenterDetailSheet, KioskSettings, LocationSettings

**Category C -- Platform admin tabs (separate theme, skip for now):** ~8 files
Platform pages (Revenue, Analytics, Onboarding, PlatformSettings) use a slate/dark theme with custom borders. These should be standardized separately.

### Technical Steps

1. **Strip override classNames from Category A files**
   - Remove `grid`, `w-full`, `grid-cols-N`, `max-w-lg` from TabsList
   - Replace `TabsList` with `ResponsiveTabsList`
   - Add `onTabChange` prop wired to existing `setActiveTab` / `onValueChange` handlers

2. **Strip override classNames from Category B files**
   - Remove redundant `h-8`, `p-1`, custom radius classes
   - Keep only intentional size overrides for genuinely small inline toggles

3. **Ensure `ResponsiveTabsList` wrapper does not force full width on the inner list**
   - The wrapper div stays `w-full` (for measurement), but the inner `TabsList` stays `w-auto` (left-anchored)

4. **Export `ResponsiveTabsList` from the tabs barrel** so imports are cleaner:
   ```
   import { Tabs, TabsContent, TabsTrigger, ResponsiveTabsList } from '@/components/ui/tabs';
   ```

### File Changes Summary

| File | Change |
|------|--------|
| `src/components/ui/tabs.tsx` | Re-export `ResponsiveTabsList` |
| `src/components/ui/responsive-tabs-list.tsx` | No changes needed |
| ~25 Category A page files | Replace `TabsList` with `ResponsiveTabsList`, remove grid/width overrides |
| ~15 Category B inline files | Remove redundant className overrides to match base token |

### Risk Mitigation
- Each file change is a simple import swap + className removal
- No styling logic changes to the base components
- Radix context is preserved (already solved in previous fixes)
- Category C (platform admin) is excluded to avoid theme conflicts

