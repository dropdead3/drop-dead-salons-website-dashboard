
# Kiosk Background Media & Location Badge Enhancement

## Overview

This plan upgrades the kiosk background experience with:
1. **Direct file upload** for background images (replacing URL input)
2. **Tablet-optimized sizing guidance** with proper aspect ratios
3. **Video background support** with auto-loop functionality
4. **Location badge overlay** option to display the current branch name

---

## Current State

| Feature | Current Implementation |
|---------|----------------------|
| Background Image | URL text input only |
| Video Support | `idle_video_url` field exists in DB but unused |
| Location Badge | Not implemented |
| Upload Pattern | `PlatformLogoUploader` exists as reference |

---

## Implementation Plan

### Part 1: Database Migration

Add new columns for location badge configuration:

```sql
ALTER TABLE organization_kiosk_settings 
ADD COLUMN show_location_badge boolean DEFAULT false,
ADD COLUMN location_badge_position text DEFAULT 'bottom-left' 
  CHECK (location_badge_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
ADD COLUMN location_badge_style text DEFAULT 'glass'
  CHECK (location_badge_style IN ('glass', 'solid', 'outline'));
```

### Part 2: Update Settings Interface

Update `useKioskSettings.ts`:

```typescript
interface KioskSettings {
  // ... existing fields
  
  // Background Video (already exists)
  idle_video_url: string | null;
  
  // Location Badge (new)
  show_location_badge: boolean;
  location_badge_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  location_badge_style: 'glass' | 'solid' | 'outline';
}
```

### Part 3: Create Kiosk Media Uploader Component

New component: `src/components/dashboard/settings/KioskMediaUploader.tsx`

**Features:**
- Drag-and-drop upload zone
- Accepts images (PNG, JPG, WebP) and videos (MP4, WebM)
- Shows size recommendations for tablets
- Preview with overlay
- Remove button

**Recommended Sizes (displayed in UI):**

| Orientation | Recommended Size | Aspect Ratio |
|-------------|-----------------|--------------|
| Portrait | 1536 × 2048 px | 3:4 |
| Landscape | 2048 × 1536 px | 4:3 |

```text
+--------------------------------------------------+
| 🖼️ Background Media                              |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │                                              │ |
| │    📷 Drop image or video here               │ |
| │    or click to upload                        │ |
| │                                              │ |
| │    Recommended: 1536×2048px (Portrait)       │ |
| │    or 2048×1536px (Landscape)                │ |
| │    Formats: PNG, JPG, WebP, MP4, WebM        │ |
| │                                              │ |
| └──────────────────────────────────────────────┘ |
|                                                  |
| [Preview with overlay shown here]                |
+--------------------------------------------------+
```

### Part 4: Update Settings UI

Replace the current URL input in `KioskSettingsContent.tsx` with:

1. **Media Uploader** - Direct file upload for images/videos
2. **Media Type Indicator** - Shows whether current media is image or video
3. **Video Loop Toggle** - Always enabled (auto-loop by default)
4. **Location Badge Section**:
   - Toggle: Show Location Badge
   - Position selector: 4 corners
   - Style selector: Glass / Solid / Outline

**Settings UI Layout:**

```text
Background Media
┌─────────────────────────────────────┐
│ [Uploaded preview or upload zone]   │
│                                     │
│ ✓ Auto-loop video (if video)        │
│                                     │
│ Overlay Darkness: [====|====] 50%   │
└─────────────────────────────────────┘

Location Badge
┌─────────────────────────────────────┐
│ Show Location Badge    [Toggle: ON] │
│                                     │
│ Position:  ◉ Top-Left  ○ Top-Right  │
│            ○ Bottom-Left ○ Bottom-Rt│
│                                     │
│ Style:     [Glass ▼]                │
└─────────────────────────────────────┘
```

### Part 5: Update Kiosk Screens

#### KioskIdleScreen.tsx Changes:

1. **Video Background Support:**
```tsx
{backgroundVideoUrl ? (
  <video
    autoPlay
    loop
    muted
    playsInline
    className="absolute inset-0 w-full h-full object-cover"
    src={backgroundVideoUrl}
  />
) : backgroundImageUrl ? (
  <div 
    className="absolute inset-0"
    style={{
      backgroundImage: `url(${backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  />
) : null}
```

2. **Location Badge Component:**
```tsx
{showLocationBadge && locationName && (
  <motion.div
    className={cn(
      "absolute z-20 px-4 py-2 rounded-xl backdrop-blur-md",
      badgePositionClasses[badgePosition]
    )}
    style={getBadgeStyle(badgeStyle, textColor, accentColor)}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4" />
      <span className="text-sm font-medium">{locationName}</span>
    </div>
  </motion.div>
)}
```

Position classes:
```typescript
const badgePositionClasses = {
  'top-left': 'top-6 left-6',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-right': 'bottom-6 right-6',
};
```

### Part 6: Update KioskProvider

Add location name to context:

```typescript
// In KioskProvider, fetch location details
const { data: locationData } = useQuery({
  queryKey: ['location-details', locationId],
  queryFn: async () => {
    const { data } = await supabase
      .from('locations')
      .select('name')
      .eq('id', locationId)
      .single();
    return data;
  },
  enabled: !!locationId,
});

// Add to context
locationName: locationData?.name || null,
```

### Part 7: Update Preview Panel

Mirror all changes in `KioskPreviewPanel.tsx`:
- Show video preview (thumbnail or muted autoplay)
- Render location badge preview
- Match styling with actual kiosk screens

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `supabase/migrations/` | Create | Add location badge columns |
| `src/hooks/useKioskSettings.ts` | Modify | Add new fields to interface and defaults |
| `src/components/dashboard/settings/KioskMediaUploader.tsx` | Create | New drag-drop uploader for images/videos |
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Modify | Replace URL input with uploader, add location badge section |
| `src/components/kiosk/KioskProvider.tsx` | Modify | Add location name to context |
| `src/components/kiosk/KioskIdleScreen.tsx` | Modify | Add video support and location badge |
| `src/components/kiosk/KioskLookupScreen.tsx` | Modify | Add location badge (if applicable) |
| `src/components/dashboard/settings/KioskPreviewPanel.tsx` | Modify | Preview video and location badge |

---

## Technical Details

### Video Background Implementation

```tsx
// Auto-looping muted video for background
<video
  autoPlay
  loop
  muted
  playsInline
  className="absolute inset-0 w-full h-full object-cover"
  poster={backgroundImageUrl} // Fallback while loading
>
  <source src={backgroundVideoUrl} type="video/mp4" />
  <source src={backgroundVideoUrl} type="video/webm" />
</video>
```

**Key attributes:**
- `autoPlay` - Starts immediately
- `loop` - Continuous playback
- `muted` - Required for autoplay in most browsers
- `playsInline` - Prevents fullscreen on iOS
- `object-cover` - Fills container without distortion

### Storage Bucket

Upload to existing `business-logos` bucket (or create `kiosk-media` bucket if preferred):

```typescript
const fileName = `kiosk-bg-${organizationId}-${Date.now()}.${ext}`;
await supabase.storage
  .from('business-logos')
  .upload(fileName, file, { cacheControl: '3600', upsert: true });
```

### Tablet Size Recommendations

Common tablet resolutions the UI will recommend:

| Device | Portrait | Landscape |
|--------|----------|-----------|
| iPad Pro 12.9" | 2048×2732 | 2732×2048 |
| iPad Pro 11" | 1668×2388 | 2388×1668 |
| iPad Air/10.9" | 1640×2360 | 2360×1640 |
| Samsung Tab S8 | 1600×2560 | 2560×1600 |
| **Recommended** | **1536×2048** | **2048×1536** |

Using 1536×2048 as the recommended size provides a good balance that scales well across most tablets while keeping file sizes reasonable.

---

## Summary

This enhancement transforms the kiosk background experience:

1. **Direct upload** replaces manual URL entry
2. **Smart sizing guidance** helps users upload tablet-optimized media
3. **Video backgrounds** with seamless looping create dynamic environments
4. **Location badges** help multi-location businesses brand each kiosk

The implementation follows existing patterns (PlatformLogoUploader) and leverages the already-defined `idle_video_url` database field.
