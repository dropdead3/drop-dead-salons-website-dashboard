

# Add Check-In Kiosk Configurator to Settings Hub

## Overview

Add a new "Check-In Kiosk" category tile to the Settings Hub that provides centralized management of kiosk configurations for each location. This addresses the current gap where admins must access the physical kiosk device and enter a PIN just to change settings.

## Current State

| Aspect | Current Behavior |
|--------|-----------------|
| Settings access | Only via PIN-protected dialog on the actual kiosk (`/kiosk/:locationId`) |
| Location support | Settings can be per-location or org-wide defaults |
| Settings scope | Appearance (colors), Content (text prompts), Behavior (timeouts, features), Security (PIN) |
| Configuration file | `src/components/kiosk/KioskSettingsDialog.tsx` (519 lines) |

## Proposed Solution

Add a new settings category tile that opens a dedicated kiosk configuration page with:

1. **Location selector** - Choose which location to configure (or set org-wide defaults)
2. **Live preview panel** - Visual mockup showing how changes will look
3. **All current settings** - Appearance, Content, Behavior tabs
4. **QR code generator** - For easily deploying kiosk URL to devices

## Visual Design

```text
+------------------------------------------+
|  ← Back to Settings                      |
|                                          |
|  CHECK-IN KIOSK                          |
|  Configure kiosk appearance and behavior |
|                                          |
+------------------+-----------------------+
|  Location:       | [All Locations ▾]     |
+------------------+-----------------------+
|                                          |
|  +------------+  +---------------------+ |
|  |            |  | APPEARANCE          | |
|  |  [PHONE    |  | ○ Background Color  | |
|  |   MOCKUP   |  | ○ Accent Color      | |
|  |   WITH     |  | ○ Text Color        | |
|  |   LIVE     |  |                     | |
|  |  PREVIEW]  |  | CONTENT             | |
|  |            |  | ○ Welcome Title     | |
|  |            |  | ○ Welcome Subtitle  | |
|  |            |  | ...                 | |
|  +------------+  +---------------------+ |
|                                          |
|  +-------------------------------------+ |
|  | Deploy QR Code                      | |
|  | Scan to open kiosk on a device      | |
|  +-------------------------------------+ |
+------------------------------------------+
```

---

## Technical Implementation

### 1. Register New Settings Category

**File: `src/hooks/useSettingsLayout.ts`**

Add `kiosk` to the icon colors and section groups:

```typescript
// Add to DEFAULT_ICON_COLORS
kiosk: '#8B5CF6',  // Purple to match kiosk accent

// Add to SECTION_GROUPS under 'operations'
categories: ['business', 'locations', 'schedule', 'kiosk', ...],
```

### 2. Add Category to Settings Page

**File: `src/pages/dashboard/admin/Settings.tsx`**

Add kiosk to the `SettingsCategory` type and `categoriesMap`:

```typescript
// Update type (line ~124)
type SettingsCategory = '...' | 'kiosk' | null;

// Add to categoriesMap (around line ~799)
kiosk: {
  id: 'kiosk',
  label: 'Check-In Kiosk',
  description: 'Device appearance, branding & behavior',
  icon: TabletSmartphone, // from lucide-react
},
```

Add the content view when `activeCategory === 'kiosk'`:

```typescript
{activeCategory === 'kiosk' && (
  <KioskSettingsContent />
)}
```

### 3. Create Kiosk Settings Content Component

**New file: `src/components/dashboard/settings/KioskSettingsContent.tsx`**

Key features:
- Location selector dropdown (using existing `LocationSelect` component)
- Settings form with three tabs: Appearance, Content, Behavior
- Live preview panel showing a phone/tablet mockup
- QR code generation for deploying the kiosk URL to devices

```typescript
export function KioskSettingsContent() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const { data: locations } = useLocations();
  
  // For org-wide, pass locationId as null; for specific, pass the ID
  const organizationId = useOrganizationId();
  const locationId = selectedLocation === 'all' ? null : selectedLocation;
  
  const { data: settings } = useKioskSettings(organizationId, locationId);
  const updateSettings = useUpdateKioskSettings();
  
  // Local state for form
  const [localSettings, setLocalSettings] = useState({...});
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Live Preview */}
      <KioskPreviewPanel settings={localSettings} />
      
      {/* Right: Settings Form */}
      <Card>
        <CardHeader>
          <LocationSelect 
            value={selectedLocation} 
            onValueChange={setSelectedLocation}
            allLabel="Organization Defaults"
          />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance">
            <TabsList>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>
            {/* Tab contents with form fields */}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* QR Code Deploy Section */}
      <KioskDeployCard locationId={locationId} />
    </div>
  );
}
```

### 4. Create Live Preview Component

**New file: `src/components/dashboard/settings/KioskPreviewPanel.tsx`**

A visual phone/tablet mockup that updates in real-time as settings change:

```typescript
export function KioskPreviewPanel({ settings }: { settings: LocalKioskSettings }) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <CardDescription>See how your kiosk will appear</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="aspect-[3/4] rounded-2xl border-8 border-slate-800 overflow-hidden"
          style={{ backgroundColor: settings.background_color }}
        >
          {/* Simulated kiosk welcome screen */}
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <h1 style={{ color: settings.text_color }} className="text-2xl font-medium">
              {settings.welcome_title}
            </h1>
            {settings.welcome_subtitle && (
              <p style={{ color: settings.text_color }} className="opacity-70 mt-2">
                {settings.welcome_subtitle}
              </p>
            )}
            <button 
              className="mt-8 px-6 py-3 rounded-xl text-white font-medium"
              style={{ backgroundColor: settings.accent_color }}
            >
              Check In
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. Create QR Code Deploy Component

**New file: `src/components/dashboard/settings/KioskDeployCard.tsx`**

Generate and display a QR code for the kiosk URL:

```typescript
import { QRCodeSVG } from 'qrcode.react';

export function KioskDeployCard({ locationId }: { locationId: string | null }) {
  const kioskUrl = locationId 
    ? `${window.location.origin}/kiosk/${locationId}`
    : null;
    
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy to Device</CardTitle>
        <CardDescription>
          Scan this QR code on a tablet to launch the kiosk
        </CardDescription>
      </CardHeader>
      <CardContent>
        {kioskUrl ? (
          <div className="flex flex-col items-center gap-4">
            <QRCodeSVG value={kioskUrl} size={160} />
            <code className="text-sm text-muted-foreground">{kioskUrl}</code>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(kioskUrl)}>
              Copy URL
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Select a specific location to generate a deployment QR code
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Main settings page content |
| `src/components/dashboard/settings/KioskPreviewPanel.tsx` | Live preview mockup |
| `src/components/dashboard/settings/KioskDeployCard.tsx` | QR code deployment |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSettingsLayout.ts` | Add `kiosk` to DEFAULT_ICON_COLORS and SECTION_GROUPS |
| `src/pages/dashboard/admin/Settings.tsx` | Add `kiosk` to category type, categoriesMap, and render content |

---

## Benefits

1. **Remote management** - Configure kiosks without physical device access
2. **Live preview** - See changes before saving
3. **Multi-location support** - Set org-wide defaults or location-specific overrides
4. **Easy deployment** - QR code makes device setup seamless
5. **Consistent UX** - Follows existing Settings Hub patterns

