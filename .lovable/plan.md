

# Remove Base Price References from Pricing Tabs

## Problem

The Level Pricing and Location Pricing tabs show the base price as placeholder text in every input field and reference it in the helper copy ("Leave blank to use the base price ($15.00)"). This creates a misleading impression that there is a standard default price pre-set, when there is not.

## Changes

### 1. `src/components/dashboard/settings/LevelPricingContent.tsx`

- Change helper text from "Set pricing by stylist level. Leave blank to use the base price ($15.00)." to "Set pricing by stylist level. Leave blank if no level-specific price applies."
- Change input placeholder from the base price value (e.g. "15.00") to a neutral "0.00"

### 2. `src/components/dashboard/settings/LocationPricingContent.tsx`

- Change helper text from "Set a location-specific base price. Leave blank to use the default ($15.00)." to "Set a location-specific price. Leave blank if no location-specific price applies."
- Change input placeholder from the base price value to a neutral "0.00"

### 3. `src/components/dashboard/settings/LevelPricingDialog.tsx` (backward compat wrapper)

- Same changes: remove base price from description text and input placeholder

## No structural or data changes -- copy and placeholder only.

