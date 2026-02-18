
# Settings Enhancements: Color Picker, QR Code, Deep Linking, Product Images, Social Footer

## Overview

Five improvements to close the gaps identified in the settings and shop pages. These span the Store Appearance Configurator, Retail tab, Retail Products settings navigation, product data model, and standalone shop footer.

---

## 1. Replace HSL Text Inputs with Native Color Pickers

**File:** `src/components/dashboard/settings/StoreAppearanceConfigurator.tsx`
**File (new):** `src/lib/colorUtils.ts` (already exists -- add `hexToHsl`)

The current "Custom Brand Colors" section forces users to type raw HSL strings like `40 60% 40%`. Replace each text input with a native HTML `<input type="color">` that shows a visual picker. The hex value is converted to/from HSL behind the scenes.

- Add a `hexToHsl` utility to `src/lib/colorUtils.ts` (inverse of existing `hslToHex`)
- Replace each color row: show the native color picker (styled as a small swatch button) alongside a read-only HSL display
- When the user picks a color via the native picker, convert hex to HSL and update state
- The existing HSL swatch preview stays as a visual indicator

---

## 2. Add QR Code to Store Link Card

**File:** `src/components/dashboard/settings/WebsiteSettingsContent.tsx` (RetailTab)

Add a QR code display and download button to the existing "STORE LINK" card. The project already has `qrcode.react` installed.

- Import `QRCodeCanvas` from `qrcode.react`
- Render a small QR code (128x128) below the store URL input
- Add a "Download QR" button that converts the canvas to PNG and triggers a download
- Wrap in a collapsible or always-visible section within the existing card

---

## 3. Handle `?category=website` Deep Link in Settings

**File:** `src/pages/dashboard/admin/Settings.tsx`

The "Manage Store Settings" / "Activate Online Store" buttons in Retail Products navigate to `/dashboard/admin/settings?category=website`, but the Settings page ignores query params entirely.

- Import `useSearchParams` from `react-router-dom`
- On mount, read `searchParams.get('category')` -- if it matches a valid `SettingsCategory`, set `activeCategory` to that value
- This makes the deep link work: clicking the button navigates to Settings and auto-opens the Website category, which then shows the Retail tab

---

## 4. Add Product Image Support

**Database migration:** Add `image_url TEXT` column to `products` table
**Files modified:**
- `src/hooks/useProducts.ts` -- add `image_url` to the `Product` interface and queries
- `src/components/dashboard/settings/RetailProductsSettingsContent.tsx` -- add image upload field in ProductFormDialog
- `src/components/shop/ProductCard.tsx` -- show actual product image when `image_url` exists, fall back to Package icon
- `src/components/shop/ProductDetailModal.tsx` -- show image in detail view

Implementation:
- Use the existing `product-images` or a new public storage bucket for uploads
- In the ProductFormDialog, add an image upload area (file input + preview)
- Upload to storage, save the public URL to `image_url`
- ProductCard renders `<img>` when image_url is present

---

## 5. Add Social Links to Standalone Shop Footer

**File:** `src/components/shop/ShopLayout.tsx`

The standalone shop footer only shows a copyright line. Add social media icons that read from the existing `website_social_links` site setting.

- Import `useSiteSettings` and read `website_social_links`
- Render social icons (Instagram, Facebook, X, YouTube, LinkedIn, TikTok) in the footer for any non-empty URLs
- Style them as small muted icon links, consistent with the minimal shop aesthetic

---

## Technical Details

### Database Migration
```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');
```

### Color Conversion (hexToHsl)
Added to `src/lib/colorUtils.ts`:
- Input: `#FF6B35` -> Output: `20 100% 60%`
- Used by the color picker to convert native hex values to the HSL format stored in theme settings

### File Change Summary

| File | Action |
|------|--------|
| `src/lib/colorUtils.ts` | Edit: add `hexToHsl` function |
| `src/components/dashboard/settings/StoreAppearanceConfigurator.tsx` | Edit: replace HSL text inputs with native color pickers |
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Edit: add QR code to Store Link card |
| `src/pages/dashboard/admin/Settings.tsx` | Edit: handle `?category` query param on mount |
| `src/hooks/useProducts.ts` | Edit: add `image_url` to Product interface |
| `src/components/dashboard/settings/RetailProductsSettingsContent.tsx` | Edit: add image upload to ProductFormDialog |
| `src/components/shop/ProductCard.tsx` | Edit: render product image when available |
| `src/components/shop/ProductDetailModal.tsx` | Edit: show image in modal |
| `src/components/shop/ShopLayout.tsx` | Edit: add social links to footer |
| Database migration | Add `image_url` column + `product-images` storage bucket |
