

# Website Editor: Gap Analysis — Status Update

## Completed ✅

1. **Standardized save button labels** — All editors now say "Save & Publish Changes"
2. **Added Footer CTA to sidebar** — Now accessible under Site Content
3. **Removed legacy BrandsEditor and DrinkMenuEditor** — Dead code deleted
4. **Created 5 dedicated section editors** — Services Preview, Popular Services, Gallery Display, Stylists Display, Locations Display now have their own config editors (headline, description, layout options) instead of falling through to CRUD managers
5. **Wired up Live Preview Panel** — Toggle button in header, resizable panel with desktop/mobile toggle and refresh
6. **Added section config types/defaults/hooks** — All 5 new section editors use `useSectionConfig` for persistence

## Remaining

- **Persist Services to database** — `ServicesContent.tsx` still uses local state from static data file. Hook (`useWebsiteServicesData`) is created but not yet wired into the component.
- **Footer editor** — No editor for footer links, copyright text, or social links management within the Website Editor hub
