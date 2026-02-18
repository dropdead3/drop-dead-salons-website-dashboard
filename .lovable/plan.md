

# Add Online Store Status Banner to Retail Products Settings

## What This Does

Adds a status banner at the top of the Retail Products settings page (Settings > Retail Products) that shows whether the online retail store is active or inactive. Includes a direct link to the Website Settings > Retail tab where users can activate it.

## Changes

### File: `src/components/dashboard/settings/RetailProductsSettingsContent.tsx`

Add a status banner between the "View Retail Analytics" button row and the Tabs component:

**When online store is ENABLED:**
- Green-tinted banner with a check icon
- Text: "Online Store is active" with count of products available online (e.g., "3 of 8 products visible")
- Link button: "Manage Store Settings" pointing to `/dashboard/admin/settings?category=website` (Retail tab)

**When online store is DISABLED:**
- Muted/amber banner with an info icon
- Text: "Online Store is not active. Clients cannot browse or purchase products online."
- Link button: "Activate Online Store" pointing to `/dashboard/admin/settings?category=website`

**Implementation:**
- Import and use the existing `useWebsiteRetailSettings` hook to check `enabled` status
- Use existing `useProducts` hook to get the count of `available_online` products vs total
- Simple `Card` or styled `div` banner -- no new components needed
- Uses `useNavigate` (already imported) for the settings link

### Technical Detail

The banner is a single conditional block (~30 lines) inserted into the `RetailProductsSettingsContent` component. It reads from the existing `website_retail` site setting and requires no database changes or new files.

