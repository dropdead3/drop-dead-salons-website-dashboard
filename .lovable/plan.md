

# Connect Kiosk Theme to Dashboard Brand Colors

## Problem

The kiosk currently uses hardcoded default colors that don't match your elegant cream/oat dashboard theme:

| Element | Current Default | Desired (Cream Theme) |
|---------|----------------|----------------------|
| Background | `#000000` (black) | Warm cream (`hsl(40, 30%, 96%)`) |
| Text | `#FFFFFF` (white) | Charcoal (`hsl(0, 0%, 8%)`) |
| Accent | `#8B5CF6` (violet) | Gold/Oat (`hsl(38, 70%, 38%)` or `hsl(35, 35%, 82%)`) |

## Solution

Add a "Sync with Brand Theme" option that automatically pulls colors from your dashboard's active theme (cream), while still allowing manual overrides.

## Proposed Changes

### 1. Update Default Kiosk Settings

**File: `src/hooks/useKioskSettings.ts`**

Update `DEFAULT_KIOSK_SETTINGS` to use the elegant cream palette by default:

```typescript
export const DEFAULT_KIOSK_SETTINGS = {
  // ... other fields
  background_color: '#F5F0E8',   // Warm cream (hsl 40, 30%, 96% → hex)
  accent_color: '#9A7B4F',       // Gold (hsl 38, 70%, 38% → hex)
  text_color: '#141414',         // Charcoal (hsl 0, 0%, 8% → hex)
  theme_mode: 'light',           // Light mode to match cream aesthetic
  // ...
};
```

### 2. Add Theme Sync Toggle to Kiosk Settings UI

**File: `src/components/dashboard/settings/KioskSettingsContent.tsx`**

Add a "Use Brand Theme" toggle at the top of the Appearance tab:

```typescript
// Add state for sync mode
const [useBrandTheme, setUseBrandTheme] = useState(true);

// Brand theme preset colors (cream palette)
const BRAND_THEME = {
  background_color: '#F5F0E8',  // Cream background
  text_color: '#141414',        // Charcoal text
  accent_color: '#9A7B4F',      // Gold accent
};

// When toggle is enabled, apply brand colors
const handleBrandThemeToggle = (enabled: boolean) => {
  setUseBrandTheme(enabled);
  if (enabled) {
    setLocalSettings(prev => ({
      ...prev,
      ...BRAND_THEME,
    }));
  }
};
```

Add toggle UI above the color pickers:

```tsx
<div className="bg-muted/50 rounded-lg p-4 mb-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Use Brand Theme</p>
      <p className="text-xs text-muted-foreground">
        Sync kiosk colors with your organization's cream & oat palette
      </p>
    </div>
    <Switch
      checked={useBrandTheme}
      onCheckedChange={handleBrandThemeToggle}
    />
  </div>
</div>

{/* Color pickers become disabled/dimmed when brand theme is active */}
<div className={cn(
  "grid grid-cols-2 gap-4",
  useBrandTheme && "opacity-50 pointer-events-none"
)}>
  {/* existing color picker inputs */}
</div>
```

### 3. Add Theme Presets Dropdown

Provide quick preset options for different looks:

| Preset | Background | Text | Accent | Best For |
|--------|-----------|------|--------|----------|
| Cream (Default) | `#F5F0E8` | `#141414` | `#9A7B4F` | Light, elegant daytime |
| Dark Luxury | `#0A0A0A` | `#F5F0E8` | `#C9A962` | Evening/night mode |
| Oat Minimal | `#E8E0D5` | `#2D2D2D` | `#8B7355` | Soft, subtle warmth |

```tsx
<Select 
  value={themePreset} 
  onValueChange={applyPreset}
>
  <SelectTrigger>
    <SelectValue placeholder="Choose a theme preset" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="cream">Cream (Light)</SelectItem>
    <SelectItem value="dark-luxury">Dark Luxury</SelectItem>
    <SelectItem value="oat-minimal">Oat Minimal</SelectItem>
    <SelectItem value="custom">Custom Colors</SelectItem>
  </SelectContent>
</Select>
```

## Visual Result

The kiosk will transform from the current dark/violet look to:

```text
┌──────────────────────────────────────────┐
│                                          │
│           [LOGO]                         │  ← Logo on cream bg
│                                          │
│           10:28 PM                       │  ← Charcoal text
│       Sunday, February 8                 │
│                                          │
│           Welcome                        │  ← Warm, inviting
│                                          │
│   ┌─────────────────────────────────┐    │
│   │    Tap anywhere to check in     │    │  ← Gold accent glow
│   └─────────────────────────────────┘    │
│                                          │
│              • • •                       │  ← Gold pulse dots
│                                          │
└──────────────────────────────────────────┘
     Warm Cream Background (#F5F0E8)
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useKioskSettings.ts` | Update default colors to cream/oat palette |
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Add "Use Brand Theme" toggle and preset selector |

## Technical Notes

- The cream palette hex values are derived from the CSS HSL variables in `index.css`
- Manual color overrides remain available when "Use Brand Theme" is off
- The kiosk will immediately reflect changes in the preview panel

