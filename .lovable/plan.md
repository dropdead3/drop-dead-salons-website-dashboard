
# Wire Kiosk Settings Icon to Match Dashboard Settings

## Overview

The settings icon on the kiosk screen currently opens a limited settings dialog that is missing several options available in the organization dashboard. This plan will update the `KioskSettingsDialog` to include all the same settings as `KioskSettingsContent`, ensuring consistency between the two interfaces.

## Current Gap Analysis

| Setting | Dashboard | Kiosk Dialog |
|---------|-----------|--------------|
| Theme Presets | Yes | No |
| Background Color | Yes | Yes |
| Accent Color | Yes | Yes |
| Text Color | Yes | Yes |
| Button Style | Yes | No |
| Logo URL | Yes | No |
| Welcome Title | Yes | Yes |
| Welcome Subtitle | Yes | Yes |
| Check-in Prompt | Yes | Yes |
| Success Message | Yes | Yes |
| Idle Timeout | Yes | Yes |
| Enable Walk-Ins | Yes | Yes |
| Require Confirmation Tap | Yes | No |
| Show Wait Time Estimate | Yes | Yes |
| Show Stylist Photo | Yes | Yes |
| Enable Feedback Prompt | Yes | No |
| Require Form Signing | Yes | No |
| Exit PIN | Yes | No |

## Solution

Update the `KioskSettingsDialog` to include all missing settings, maintaining the same dark-themed UI style while adding feature parity with the dashboard.

---

## Technical Implementation

### File: `src/components/kiosk/KioskSettingsDialog.tsx`

#### 1. Update LocalSettings State

Add the missing fields to the `localSettings` state:

```typescript
const [localSettings, setLocalSettings] = useState({
  // Existing fields...
  welcome_title: settings?.welcome_title || DEFAULT_KIOSK_SETTINGS.welcome_title,
  welcome_subtitle: settings?.welcome_subtitle || '',
  check_in_prompt: settings?.check_in_prompt || DEFAULT_KIOSK_SETTINGS.check_in_prompt,
  success_message: settings?.success_message || DEFAULT_KIOSK_SETTINGS.success_message,
  background_color: settings?.background_color || DEFAULT_KIOSK_SETTINGS.background_color,
  accent_color: settings?.accent_color || DEFAULT_KIOSK_SETTINGS.accent_color,
  text_color: settings?.text_color || DEFAULT_KIOSK_SETTINGS.text_color,
  idle_timeout_seconds: settings?.idle_timeout_seconds || DEFAULT_KIOSK_SETTINGS.idle_timeout_seconds,
  enable_walk_ins: settings?.enable_walk_ins ?? DEFAULT_KIOSK_SETTINGS.enable_walk_ins,
  show_stylist_photo: settings?.show_stylist_photo ?? DEFAULT_KIOSK_SETTINGS.show_stylist_photo,
  show_wait_time_estimate: settings?.show_wait_time_estimate ?? DEFAULT_KIOSK_SETTINGS.show_wait_time_estimate,
  
  // NEW fields to add:
  button_style: settings?.button_style || DEFAULT_KIOSK_SETTINGS.button_style,
  logo_url: settings?.logo_url || DEFAULT_KIOSK_SETTINGS.logo_url,
  require_confirmation_tap: settings?.require_confirmation_tap ?? DEFAULT_KIOSK_SETTINGS.require_confirmation_tap,
  enable_feedback_prompt: settings?.enable_feedback_prompt ?? DEFAULT_KIOSK_SETTINGS.enable_feedback_prompt,
  require_form_signing: settings?.require_form_signing ?? DEFAULT_KIOSK_SETTINGS.require_form_signing,
  exit_pin: settings?.exit_pin || DEFAULT_KIOSK_SETTINGS.exit_pin,
});
```

#### 2. Add Theme Preset State and Logic

Import the theme presets and add detection/application logic:

```typescript
import { KIOSK_THEME_PRESETS, KioskThemePreset } from '@/hooks/useKioskSettings';

// Add state for theme preset
const [themePreset, setThemePreset] = useState<KioskThemePreset | 'custom'>('cream');

// Detect current preset function
const detectPreset = (bg: string, text: string, accent: string): KioskThemePreset | 'custom' => {
  for (const [key, preset] of Object.entries(KIOSK_THEME_PRESETS)) {
    if (
      preset.background_color.toLowerCase() === bg.toLowerCase() &&
      preset.text_color.toLowerCase() === text.toLowerCase() &&
      preset.accent_color.toLowerCase() === accent.toLowerCase()
    ) {
      return key as KioskThemePreset;
    }
  }
  return 'custom';
};

// Apply preset function
const applyPreset = (preset: KioskThemePreset | 'custom') => {
  setThemePreset(preset);
  if (preset !== 'custom' && KIOSK_THEME_PRESETS[preset]) {
    const { background_color, text_color, accent_color } = KIOSK_THEME_PRESETS[preset];
    setLocalSettings(prev => ({
      ...prev,
      background_color,
      text_color,
      accent_color,
    }));
  }
};
```

#### 3. Update Appearance Tab UI

Add theme preset selector and button style dropdown:

```typescript
{activeTab === 'appearance' && (
  <>
    {/* Theme Preset Selector */}
    <SettingGroup title="Theme Preset">
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(KIOSK_THEME_PRESETS).map(([key, preset]) => (
          <motion.button
            key={key}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              themePreset === key 
                ? 'border-2' 
                : 'border-white/10 hover:border-white/20'
            }`}
            style={themePreset === key ? { borderColor: accentColor } : undefined}
            onClick={() => applyPreset(key as KioskThemePreset)}
          >
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.background_color }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent_color }} />
            </div>
            <span className="text-sm text-white/80">{preset.name}</span>
          </motion.button>
        ))}
        <motion.button
          className={`px-4 py-3 rounded-xl border transition-colors ${
            themePreset === 'custom' 
              ? 'border-2' 
              : 'border-white/10 hover:border-white/20'
          }`}
          style={themePreset === 'custom' ? { borderColor: accentColor } : undefined}
          onClick={() => setThemePreset('custom')}
        >
          <span className="text-sm text-white/80">Custom</span>
        </motion.button>
      </div>
    </SettingGroup>

    {/* Existing color settings... */}
    
    {/* Button Style - NEW */}
    <SettingGroup title="Button Style">
      <div className="flex gap-2">
        {['rounded', 'pill', 'square'].map((style) => (
          <motion.button
            key={style}
            className={`flex-1 px-4 py-3 rounded-xl border transition-colors capitalize ${
              localSettings.button_style === style 
                ? 'border-2' 
                : 'border-white/10 hover:border-white/20'
            }`}
            style={localSettings.button_style === style ? { borderColor: accentColor } : undefined}
            onClick={() => updateLocalSetting('button_style', style as 'rounded' | 'pill' | 'square')}
          >
            <span className="text-sm text-white/80">{style}</span>
          </motion.button>
        ))}
      </div>
    </SettingGroup>

    {/* Logo URL - NEW */}
    <SettingGroup title="Logo">
      <TextSetting
        label="Logo URL"
        value={localSettings.logo_url || ''}
        onChange={(v) => updateLocalSetting('logo_url', v || null)}
        placeholder="https://..."
        accentColor={accentColor}
      />
    </SettingGroup>
  </>
)}
```

#### 4. Update Behavior Tab UI

Add the missing toggle settings:

```typescript
{activeTab === 'behavior' && (
  <>
    {/* Existing Timeouts group... */}
    
    <SettingGroup title="Features">
      <ToggleSetting
        label="Enable Walk-Ins"
        description="Allow clients without appointments"
        value={localSettings.enable_walk_ins}
        onChange={(v) => updateLocalSetting('enable_walk_ins', v)}
        accentColor={accentColor}
      />
      <ToggleSetting
        label="Require Confirmation Tap"
        description="Ask client to confirm before check-in"
        value={localSettings.require_confirmation_tap}
        onChange={(v) => updateLocalSetting('require_confirmation_tap', v)}
        accentColor={accentColor}
      />
      <ToggleSetting
        label="Show Stylist Photo"
        description="Display stylist photos on appointment cards"
        value={localSettings.show_stylist_photo}
        onChange={(v) => updateLocalSetting('show_stylist_photo', v)}
        accentColor={accentColor}
      />
      <ToggleSetting
        label="Show Wait Time Estimate"
        description="Display estimated wait time after check-in"
        value={localSettings.show_wait_time_estimate}
        onChange={(v) => updateLocalSetting('show_wait_time_estimate', v)}
        accentColor={accentColor}
      />
      <ToggleSetting
        label="Require Form Signing"
        description="Prompt new clients to sign intake forms"
        value={localSettings.require_form_signing}
        onChange={(v) => updateLocalSetting('require_form_signing', v)}
        accentColor={accentColor}
      />
      <ToggleSetting
        label="Enable Feedback Prompt"
        description="Ask for feedback after check-in"
        value={localSettings.enable_feedback_prompt}
        onChange={(v) => updateLocalSetting('enable_feedback_prompt', v)}
        accentColor={accentColor}
      />
    </SettingGroup>

    {/* Security - NEW */}
    <SettingGroup title="Security">
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-sm text-white/80">Exit PIN</div>
          <div className="text-xs text-white/40 mt-0.5">4-digit PIN to exit kiosk mode</div>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-center font-mono focus:outline-none focus:border-[color]"
          style={{ '--focus-color': accentColor } as any}
          value={localSettings.exit_pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            updateLocalSetting('exit_pin', val);
          }}
        />
      </div>
    </SettingGroup>
  </>
)}
```

#### 5. Sync Theme Preset on Settings Load

Add a `useEffect` to detect the current theme preset when settings load:

```typescript
useEffect(() => {
  if (settings) {
    setThemePreset(detectPreset(
      settings.background_color,
      settings.text_color,
      settings.accent_color
    ));
  }
}, [settings]);
```

---

## Summary

| Change | Purpose |
|--------|---------|
| Add 6 missing fields to localSettings | Feature parity with dashboard |
| Add theme preset selector | Allow quick theme switching like dashboard |
| Add button style selector | Match dashboard appearance options |
| Add logo URL field | Allow logo customization |
| Add require_confirmation_tap toggle | Match dashboard behavior option |
| Add require_form_signing toggle | Match dashboard behavior option |
| Add enable_feedback_prompt toggle | Match dashboard behavior option |
| Add exit_pin field | Allow changing the exit PIN from kiosk |

## Expected Outcome

After these changes, the settings dialog accessible via the gear icon on the kiosk screen will contain all the same configuration options as the organization dashboard's kiosk settings page. Both interfaces will update the same database records, ensuring changes made from either location are reflected immediately.
