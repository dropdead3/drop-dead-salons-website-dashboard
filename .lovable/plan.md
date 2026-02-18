

# Decouple Sidebar Selection from Iframe Preview -- Scroll to Section

## Problem
When selecting sections in the Website Editor sidebar, the iframe preview should stay stable on the full homepage. Currently the iframe uses a `key={refreshKey}` pattern that could cause reloads. Selecting a section should scroll the iframe to that section and briefly highlight it -- not reload or change the iframe URL.

## Changes Overview

### 1. Add Section Anchors to Homepage (Index.tsx)

Every homepage section gets a stable `id` attribute so we can scroll to it.

- Change `<React.Fragment key={key}>` to `<div id={\`section-\${key}\`} key={key}>`
- This adds anchors like `section-hero`, `section-brand_statement`, etc.

### 2. Add PostMessage Listener to Homepage (Index.tsx)

A `useEffect` that listens for messages from the parent editor window:

- `PREVIEW_SCROLL_TO_SECTION` -- scrolls to `#section-{sectionId}` smoothly
- `PREVIEW_HIGHLIGHT_SECTION` -- adds a temporary highlight outline for ~1 second
- Origin validation: only responds to `window.location.origin` (same-origin, safe in both dev and prod)

### 3. Add Highlight CSS (index.css)

A `.preview-highlight` class with a subtle primary-color outline that transitions in/out:

```css
.preview-highlight {
  outline: 2px solid hsl(var(--primary));
  outline-offset: -2px;
  transition: outline-color 0.3s ease;
}
```

### 4. Update LivePreviewPanel.tsx

- Add `useRef<HTMLIFrameElement>` to hold a stable reference to the iframe
- Accept new prop: `activeSectionId?: string`
- Add a `useEffect` watching `activeSectionId`:
  - Queues the scroll message until the iframe is loaded (tracks load state via `onLoad`)
  - Sends `PREVIEW_SCROLL_TO_SECTION` then `PREVIEW_HIGHLIGHT_SECTION` via `postMessage`
  - Uses `window.location.origin` as `targetOrigin` (same-origin)
- The `refreshKey` remains only for manual refresh button and data-save events -- never tied to section selection
- The iframe `src` stays `/?preview=true` always

### 5. Wire ActiveSectionId from Hub (WebsiteSectionsHub.tsx)

- Add a `TAB_TO_SECTION` mapping that converts editor tab names to homepage section keys
- Derive `activeSectionId` from `activeTab` using this map
- Pass it to `<LivePreviewPanel activeSectionId={activeSectionId} />`

Tab-to-Section mapping:

| Editor Tab | Section ID |
|---|---|
| `hero` | `hero` |
| `brand` | `brand_statement` |
| `testimonials-section` | `testimonials` |
| `services-preview` | `services_preview` |
| `popular-services` | `popular_services` |
| `gallery-section` | `gallery` |
| `new-client` | `new_client` |
| `stylists-section` | `stylists` |
| `locations-section` | `locations` |
| `faq` | `faq` |
| `extensions` | `extensions` |
| `brands` | `brands` |
| `drinks` | `drink_menu` |
| Site Content tabs (services, testimonials, gallery, stylists, locations, banner, footer-cta, footer) | `undefined` (no scroll) |

## Message Queuing Strategy

To handle the case where a section is selected before the iframe finishes loading:
- Track iframe ready state with a ref (`iframeReadyRef`)
- Set it to `true` on iframe `onLoad`
- If `activeSectionId` changes while iframe is not ready, store a pending section ID
- On iframe load, flush the pending scroll message

## Files Modified

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Add `id` anchors to section wrappers, add `postMessage` listener |
| `src/index.css` | Add `.preview-highlight` class |
| `src/components/dashboard/website-editor/LivePreviewPanel.tsx` | Add `iframeRef`, `activeSectionId` prop, `postMessage` on change, message queuing |
| `src/pages/dashboard/admin/WebsiteSectionsHub.tsx` | Add `TAB_TO_SECTION` map, derive and pass `activeSectionId` |

## What Does NOT Change

- Iframe `src` stays `/?preview=true` always
- `triggerPreviewRefresh()` continues working for data-save refreshes
- Sidebar drag-and-drop, toggles, and dirty-state logic are untouched
- Inline section previews (scaled `div` in `SectionPreviewWrapper`) are unchanged
- Mobile behavior unchanged (preview panel is desktop-only)

## Acceptance Criteria

- Clicking sections in the left sidebar never changes the iframe URL and never collapses the iframe to a single section view
- Clicking "Brand Statement" scrolls the iframe to that section on the full homepage
- No iframe flicker or reload on selection
- Inline section previews continue to work as-is
