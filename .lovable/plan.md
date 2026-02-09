
# Fix Kiosk Settings Integration Issues

## Problems Identified

1. **Logo input asks for URL** - The kiosk settings have a text field for logo URL instead of using the organization logos already uploaded in business settings
2. **Not using global color themes** - The kiosk has its own separate theme presets (`KIOSK_THEME_PRESETS`) instead of using the global `colorThemes` from `useColorTheme`
3. **Missing light/dark mode toggle** - The kiosk has a `theme_mode` field in the database but no UI to configure it, and it doesn't sync with the dashboard's `useDashboardTheme`
4. **Live preview doesn't match actual kiosk** - The `KioskPreviewPanel` component is a simplified static mockup that differs significantly from the actual `KioskIdleScreen` appearance

---

## Solution Overview

### 1. Logo Selection from Business Settings

**Current state**: Text input for `logo_url`

**Solution**: Replace with a dropdown that lists:
- "Organization Logo (Light)" - `businessSettings.logo_light_url`
- "Organization Logo (Dark)" - `businessSettings.logo_dark_url`
- "Custom URL" - Only then show text input

**Files affected**:
- `src/components/dashboard/settings/KioskSettingsContent.tsx`
- `src/components/kiosk/KioskSettingsDialog.tsx`

---

### 2. Integrate Global Color Themes

**Current state**: Kiosk uses hardcoded `KIOSK_THEME_PRESETS` (cream, dark-luxury, oat-minimal)

**Solution**: 
- Import and use `colorThemes` from `useColorTheme` as the primary theme options
- Map the global theme HSL values to hex colors for kiosk settings
- Keep "Custom" option for manual color overrides
- Add a "Use Dashboard Theme" toggle that auto-syncs with the user's selected color theme

**Files affected**:
- `src/hooks/useKioskSettings.ts` - Update presets to derive from global themes
- `src/components/dashboard/settings/KioskSettingsContent.tsx`
- `src/components/kiosk/KioskSettingsDialog.tsx`

---

### 3. Add Light/Dark Mode Toggle

**Current state**: `theme_mode` field exists in database (`'dark' | 'light' | 'auto'`) but no UI to set it

**Solution**:
- Add a "Mode" selector in the Appearance tab with Light/Dark/Auto options
- Default to the dashboard's current `resolvedTheme` from `useDashboardTheme`
- The kiosk uses this to:
  - Select appropriate logo variant (light logo for dark mode, dark logo for light mode)
  - Apply appropriate color scheme

**Files affected**:
- `src/components/dashboard/settings/KioskSettingsContent.tsx` - Add mode selector
- `src/components/kiosk/KioskSettingsDialog.tsx` - Add mode selector
- Update `localSettings` to include `theme_mode`

---

### 4. Fix Live Preview to Match Actual Kiosk

**Current state**: `KioskPreviewPanel` is a simplified static mockup with different structure

**Solution**: Rewrite `KioskPreviewPanel` to use the same visual structure as `KioskIdleScreen`:
- Add floating animation for logo
- Add time/date display
- Add ambient gradient overlay
- Add pulsing "Tap to check in" button with glow effect
- Add bottom pulse indicators
- Match the exact typography and spacing

**Files affected**:
- `src/components/dashboard/settings/KioskPreviewPanel.tsx` - Complete rewrite

---

## Detailed Implementation

### Part 1: Update KioskSettings Interface

Add `theme_mode` to the local settings and save/load:

```typescript
// In both KioskSettingsContent and KioskSettingsDialog
const [localSettings, setLocalSettings] = useState({
  // ...existing fields
  theme_mode: settings?.theme_mode || DEFAULT_KIOSK_SETTINGS.theme_mode,
  // ...
});
```

### Part 2: Create Logo Source Selector Component

Replace the Logo URL text input with a selector:

```typescript
// New component in settings
type LogoSource = 'org-light' | 'org-dark' | 'auto' | 'custom';

<Select value={logoSource} onValueChange={handleLogoSourceChange}>
  <SelectItem value="auto">Auto (based on mode)</SelectItem>
  <SelectItem value="org-light">Organization Logo (Light)</SelectItem>
  <SelectItem value="org-dark">Organization Logo (Dark)</SelectItem>
  <SelectItem value="custom">Custom URL</SelectItem>
</Select>

{logoSource === 'custom' && (
  <Input 
    value={customLogoUrl} 
    onChange={...} 
    placeholder="https://..." 
  />
)}
```

The "Auto" option means:
- In dark mode: use `logo_light_url`
- In light mode: use `logo_dark_url`
- This matches the existing logic in `KioskIdleScreen`

### Part 3: Add Theme Mode Selector

Add to Appearance tab in both settings UIs:

```typescript
<SettingGroup title="Mode">
  <div className="flex gap-2">
    {(['light', 'dark', 'auto'] as const).map((mode) => (
      <button
        key={mode}
        className={...}
        onClick={() => updateField('theme_mode', mode)}
      >
        {mode === 'light' && <Sun className="w-4 h-4" />}
        {mode === 'dark' && <Moon className="w-4 h-4" />}
        {mode === 'auto' && <Monitor className="w-4 h-4" />}
        <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
      </button>
    ))}
  </div>
</SettingGroup>
```

### Part 4: Integrate Global Color Themes

Replace kiosk-specific presets with global themes:

```typescript
// Create a helper to convert global themes to kiosk colors
function convertGlobalThemeToKioskColors(
  theme: ColorTheme, 
  isDark: boolean
): { background_color: string; text_color: string; accent_color: string } {
  const themeData = colorThemes.find(t => t.id === theme);
  const preview = isDark ? themeData?.darkPreview : themeData?.lightPreview;
  
  return {
    background_color: hslToHex(preview?.bg || '40 30% 96%'),
    text_color: hslToHex(preview?.primary || '0 0% 8%'),
    accent_color: hslToHex(preview?.accent || '35 35% 82%'),
  };
}
```

Theme selector options:
- Cream (from global)
- Rose (from global)
- Sage (from global)
- Ocean (from global)
- Custom

### Part 5: Rewrite KioskPreviewPanel

Create a mini version of `KioskIdleScreen` that accurately reflects the kiosk appearance:

```typescript
export function KioskPreviewPanel({ settings, businessSettings, className }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Determine theme mode
  const isDarkMode = settings.theme_mode === 'dark' || 
    (settings.theme_mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Logo selection logic (same as KioskIdleScreen)
  const logoUrl = settings.logo_url 
    || (isDarkMode ? businessSettings?.logo_light_url : businessSettings?.logo_dark_url)
    || null;
  
  return (
    <Card className={cn("sticky top-6", className)}>
      <CardHeader>...</CardHeader>
      <CardContent>
        <div className="relative mx-auto max-w-[280px]">
          {/* Device frame */}
          <div className="rounded-[2rem] border-[8px] border-slate-800 bg-slate-800 p-1">
            {/* Screen - matching actual kiosk structure */}
            <div 
              className="aspect-[3/4] rounded-[1.5rem] overflow-hidden relative"
              style={{ backgroundColor: settings.background_color }}
            >
              {/* Ambient gradient overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, ${settings.accent_color}15 0%, transparent 60%)` }}
              />
              
              {/* Content - centered like actual kiosk */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
                {/* Logo with float animation */}
                {logoUrl && (
                  <motion.img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="h-8 w-auto mb-4 object-contain"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                {/* Time display */}
                <div 
                  className="text-2xl font-extralight mb-4"
                  style={{ color: settings.text_color }}
                >
                  {formatTime(currentTime)}
                </div>
                
                {/* Welcome text */}
                <h1 style={{ color: settings.text_color }} className="text-base font-medium mb-1">
                  {settings.welcome_title || 'Welcome'}
                </h1>
                
                {settings.welcome_subtitle && (
                  <p style={{ color: settings.text_color }} className="text-xs opacity-70 mb-4">
                    {settings.welcome_subtitle}
                  </p>
                )}
                
                {/* Tap to check in - with glow */}
                <div className="relative mt-4">
                  <div 
                    className="absolute inset-0 rounded-full blur-md"
                    style={{ backgroundColor: settings.accent_color, opacity: 0.3 }}
                  />
                  <div 
                    className={cn("relative px-4 py-2 backdrop-blur-sm", buttonRadiusClass)}
                    style={{ 
                      backgroundColor: `${settings.accent_color}20`,
                      border: `1px solid ${settings.accent_color}60`,
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: settings.text_color }}>
                      Tap to check in
                    </span>
                  </div>
                </div>
                
                {/* Bottom pulse indicators */}
                <div className="absolute bottom-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: settings.accent_color }}
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Home indicator */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useKioskSettings.ts` | Replace `KIOSK_THEME_PRESETS` with global theme integration; add HSL-to-hex helper |
| `src/components/dashboard/settings/KioskSettingsContent.tsx` | Add theme mode selector, logo source selector, integrate global themes |
| `src/components/dashboard/settings/KioskPreviewPanel.tsx` | Complete rewrite to match actual kiosk appearance |
| `src/components/kiosk/KioskSettingsDialog.tsx` | Add theme mode selector, logo source selector (using businessSettings from context) |

---

## Additional Helper: HSL to Hex Conversion

Since global themes use HSL strings and kiosk settings store hex colors, we need a converter:

```typescript
// In a utils file or inline
function hslToHex(hslString: string): string {
  // Parse "40 30% 96%" format
  const [h, s, l] = hslString.split(' ').map(v => parseFloat(v));
  
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
```

---

## Expected Outcome

1. **Logo**: Users select from organization logos or enter custom URL - no more manual URL entry for existing logos
2. **Themes**: Kiosk themes match the global color themes used across the dashboard
3. **Mode**: Explicit light/dark/auto toggle that affects logo selection and overall appearance
4. **Preview**: Live preview accurately shows how the kiosk will look, including animations and layout

