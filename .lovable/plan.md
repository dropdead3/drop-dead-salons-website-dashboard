

# Standalone Online Retail Store Page

## The Idea

Salons should be able to share a direct link to their online retail store (e.g., `/org/drop-dead/shop`) that works independently of whether they have a full salon website enabled. This lets salons with existing websites on other platforms (Wix, Squarespace, etc.) simply link to their retail store without needing to adopt the full Zura website.

## Current State

- Public org pages exist at `/org/:orgSlug/` with pages for home, about, services, booking, stylists, extensions, policies
- **No `/shop` or `/store` public page exists**
- The `products` table has `available_online` (just added) to control visibility
- The `website_retail` site setting controls whether the store is enabled
- No public-facing product browsing or cart experience exists yet

## What This Delivers

### 1. New Public Route: `/org/:orgSlug/shop`

A standalone, client-facing retail store page that:
- Loads the org context via `OrgPublicRoute` (same as all other public pages)
- Checks `website_retail.enabled` -- if disabled, shows a "Store unavailable" message
- Displays only products where `available_online = true` and `is_active = true`
- Works with the org's color theme (uses existing `Layout` component)
- Is fully functional whether or not the full website homepage is used

### 2. Store Page Features

**Product Grid:**
- Responsive grid of product cards (image placeholder, name, brand, price)
- Category/brand filter sidebar or dropdown
- Search bar
- "No products available" empty state

**Product Detail (inline or modal):**
- Product name, brand, description, price
- Stock availability indicator
- "Add to Cart" button (Phase 1: link to contact/booking; Phase 2: full cart)

**Store Header:**
- Salon logo + name (from org context)
- "Back to website" link (if full website is enabled) or standalone branding
- Minimal navigation (just the store)

### 3. Shareable Store Link

In the Retail tab of Website Settings, when the online store is enabled, display:
- The store URL: `yoursite.lovable.app/org/{slug}/shop`
- A "Copy Link" button
- Helper text: "Share this link on your existing website, social media, or anywhere clients can find you."
- If a custom domain is configured, show that URL instead

### 4. Standalone Mode Detection

The store page checks whether the full website is enabled:
- **Full website ON**: Store uses the full `Layout` with nav (Home, Services, etc.) + a Shop link in the nav
- **Full website OFF**: Store renders with a minimal layout -- just logo, store content, and footer. No nav links to pages that don't exist.

## File Summary

| File | Action |
|------|--------|
| `src/pages/Shop.tsx` | Create: public retail store page with product grid |
| `src/components/shop/ProductCard.tsx` | Create: individual product card component |
| `src/components/shop/ShopLayout.tsx` | Create: standalone layout wrapper for store-only mode |
| `src/components/shop/ProductFilters.tsx` | Create: category/brand filter bar |
| `src/hooks/usePublicProducts.ts` | Create: public query for online-available products (no auth required) |
| `src/App.tsx` | Update: add `/org/:orgSlug/shop` route |
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Update: add store link display + copy button in RetailTab |

## Technical Details

### Public Products Hook
A new hook that fetches products without requiring auth, filtered to `available_online = true` and `is_active = true`. This relies on an RLS policy allowing anonymous/public SELECT on products where `available_online = true`.

### RLS Policy for Public Products
```sql
CREATE POLICY "Public can view online products"
ON public.products FOR SELECT
USING (is_active = true AND available_online = true);
```

### Route Registration
```tsx
<Route path="/org/:orgSlug" element={<OrgPublicRoute />}>
  {/* ...existing routes... */}
  <Route path="shop" element={<Shop />} />
</Route>
```

### Store Link in Settings
When the store is enabled, the RetailTab shows a card with:
- The shareable URL
- Copy-to-clipboard button
- QR code option (uses existing `qrcode.react` dependency)
- Embed snippet for iframes (stretch goal)

### ShopLayout Component
Detects whether the full website is enabled via `website_retail` + checking if the org has homepage sections enabled. If full site is off, renders a minimal chrome: logo, store grid, footer with social links only.

## Phase Boundaries

**This implementation (Phase 1):**
- Product browsing grid with filters
- Standalone or integrated layout
- Shareable link with copy button
- Product detail modal with description and price
- "Inquire" / "Contact to purchase" CTA (no cart yet)

**Phase 2 (future):**
- Full shopping cart with quantity management
- Checkout flow with payment integration
- Order confirmation and email receipts
- Inventory deduction on purchase

