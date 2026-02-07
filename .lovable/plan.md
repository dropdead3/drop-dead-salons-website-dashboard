

# Add Full-Screen QR Code View for In-Person Onboarding

## Overview

Add an "Open on Screen" button to the Staff Signup QR Code card that opens a full-screen, distraction-free view of the QR code. This is designed for in-person onboarding scenarios where a new staff member is sitting next to you and can scan the code directly from your screen.

---

## Design

The full-screen view will:
- Cover the entire viewport with a clean, branded background
- Display a large, easy-to-scan QR code in the center
- Include minimal branding (Drop Dead logo, "Staff Portal" text)
- Show a close button (X) in the corner to exit
- Support keyboard escape to close
- Animate in smoothly using framer-motion

---

## Changes

### 1. Create Full-Screen QR Component

**File: `src/components/dashboard/QRCodeFullScreen.tsx`** (new file)

A new component that renders a full-screen overlay with:

| Element | Description |
|---------|-------------|
| Overlay | Dark semi-transparent backdrop with blur |
| Container | Centered card with branded styling |
| QR Code | Large 300px QR code (easily scannable from ~2-3 feet) |
| Branding | Drop Dead logo and "Staff Portal" text |
| Instructions | "Scan to create your staff account" |
| URL fallback | Small text showing the URL for manual entry |
| Close button | X button in top-right corner |
| Keyboard support | ESC key to close |

```tsx
interface QRCodeFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}
```

---

### 2. Update QRCodeCard Component

**File: `src/pages/dashboard/admin/AccountManagement.tsx`**

Add a new "Open on Screen" button alongside Preview and Download:

| Current | New |
|---------|-----|
| Preview, Download | Open on Screen, Preview, Download |

Changes:
- Import the new `QRCodeFullScreen` component
- Add state: `const [fullscreenOpen, setFullscreenOpen] = useState(false)`
- Add new button with `Monitor` or `Maximize2` icon
- Render `QRCodeFullScreen` component conditionally

The button layout will become a 3-column grid:
```tsx
<div className="grid grid-cols-3 gap-2">
  <Button onClick={() => setFullscreenOpen(true)}>
    <Maximize2 /> Open on Screen
  </Button>
  <Button onClick={() => setPreviewOpen(true)}>
    <Eye /> Preview
  </Button>
  <Button onClick={downloadQRCode}>
    <Download /> Download
  </Button>
</div>
```

---

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/QRCodeFullScreen.tsx` | Create new full-screen QR overlay component |
| `src/pages/dashboard/admin/AccountManagement.tsx` | Add "Open on Screen" button and integrate full-screen component |

---

## Visual Result

When clicking "Open on Screen":

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                          [X]   │
│                                                                 │
│                         DROP DEAD®                              │
│                        Staff Portal                             │
│                                                                 │
│                     ┌─────────────────┐                         │
│                     │                 │                         │
│                     │   [QR CODE]     │                         │
│                     │   300 x 300     │                         │
│                     │                 │                         │
│                     └─────────────────┘                         │
│                                                                 │
│               Scan to create your staff account                 │
│                                                                 │
│              Or visit: yoursite.com/staff-login                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

The QR code will be large enough to scan from 2-3 feet away, making it perfect for in-person onboarding scenarios.

