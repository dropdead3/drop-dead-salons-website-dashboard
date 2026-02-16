

# Embed Live Preview Inside Each Location Drill-Down

## Current State

The preview works but requires clicking a "Preview" button to open a side Sheet. This means you can't see changes in real-time as you adjust settings.

## Proposed Change

Embed a compact, always-visible `KioskPreviewPanel` directly inside each expanded location row, positioned below the settings tabs and above the action buttons. This gives immediate visual feedback as settings are adjusted.

### Layout Change (inside each expanded drill-down)

```text
+--------------------------------------------------------------+
| FEATURES                                                      |
| [x] Walk-In   [x] Self-Booking   [ ] Forms   [ ] Feedback    |
+--------------------------------------------------------------+
| [Appearance] [Content] [Behavior]                             |
|   ... settings fields ...                                     |
+--------------------------------------------------------------+
| LIVE PREVIEW                              [Expand in Sheet]   |
| +----------------------------------------------------------+ |
| |  (compact KioskPreviewPanel, always visible)              | |
| |  Updates in real-time as you change settings above        | |
| +----------------------------------------------------------+ |
+--------------------------------------------------------------+
| [Save]  [Apply to All]  [Reset to Defaults]                  |
+--------------------------------------------------------------+
| Deploy QR Code                                                |
+--------------------------------------------------------------+
```

### Technical Changes

**File: `src/components/dashboard/settings/KioskLocationSettingsForm.tsx`**

1. Import `KioskPreviewPanel` and `useBusinessSettings`
2. Add an always-visible preview section between the tabs content and the action buttons
3. Keep the "Preview" button but relabel it "Expand Preview" -- it still opens the full-size Sheet for a closer look
4. Pass `localSettings` directly to the embedded `KioskPreviewPanel` so it reacts to every field change in real-time

The embedded preview will be wrapped in a collapsible section (default open) so users can collapse it if they want more vertical space for the form.

### What stays the same

- The Sheet-based full preview still works via "Expand Preview" button
- The `KioskPreviewPanel` component is unchanged
- The drill-down accordion layout is unchanged
- Organization Defaults preview Sheet is unchanged

### Benefit

Real-time visual feedback without any extra clicks. The preview is always contextually tied to the location being edited because it lives inside the drill-down.
