import { useState, useEffect } from 'react';
import { Loader2, Save, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationSelect } from '@/components/ui/location-select';
import { KioskPreviewPanel } from './KioskPreviewPanel';
import { KioskDeployCard } from './KioskDeployCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLocations } from '@/hooks/useLocations';
import { useKioskSettings, useUpdateKioskSettings, DEFAULT_KIOSK_SETTINGS, KIOSK_THEME_PRESETS, KioskThemePreset } from '@/hooks/useKioskSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface LocalSettings {
  background_color: string;
  accent_color: string;
  text_color: string;
  welcome_title: string;
  welcome_subtitle: string | null;
  check_in_prompt: string;
  success_message: string;
  button_style: 'rounded' | 'pill' | 'square';
  logo_url: string | null;
  idle_timeout_seconds: number;
  enable_walk_ins: boolean;
  require_confirmation_tap: boolean;
  show_wait_time_estimate: boolean;
  show_stylist_photo: boolean;
  enable_feedback_prompt: boolean;
  require_form_signing: boolean;
  exit_pin: string;
}

export function KioskSettingsContent() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [themePreset, setThemePreset] = useState<KioskThemePreset | 'custom'>('cream');
  const { data: locations = [] } = useLocations();

  // Get organization ID
  const { data: orgId } = useQuery({
    queryKey: ['user-org-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('employee_profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      return data?.organization_id || null;
    },
    enabled: !!user?.id,
  });

  const locationId = selectedLocation === 'all' ? null : selectedLocation;
  const selectedLocationData = locations.find(l => l.id === locationId);

  const { data: kioskSettings, isLoading } = useKioskSettings(orgId || undefined, locationId || undefined);
  const updateSettings = useUpdateKioskSettings();

  // Detect current preset based on colors
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

  // Apply a theme preset
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

  const [localSettings, setLocalSettings] = useState<LocalSettings>({
    background_color: DEFAULT_KIOSK_SETTINGS.background_color,
    accent_color: DEFAULT_KIOSK_SETTINGS.accent_color,
    text_color: DEFAULT_KIOSK_SETTINGS.text_color,
    welcome_title: DEFAULT_KIOSK_SETTINGS.welcome_title,
    welcome_subtitle: DEFAULT_KIOSK_SETTINGS.welcome_subtitle,
    check_in_prompt: DEFAULT_KIOSK_SETTINGS.check_in_prompt,
    success_message: DEFAULT_KIOSK_SETTINGS.success_message,
    button_style: DEFAULT_KIOSK_SETTINGS.button_style,
    logo_url: DEFAULT_KIOSK_SETTINGS.logo_url,
    idle_timeout_seconds: DEFAULT_KIOSK_SETTINGS.idle_timeout_seconds,
    enable_walk_ins: DEFAULT_KIOSK_SETTINGS.enable_walk_ins,
    require_confirmation_tap: DEFAULT_KIOSK_SETTINGS.require_confirmation_tap,
    show_wait_time_estimate: DEFAULT_KIOSK_SETTINGS.show_wait_time_estimate,
    show_stylist_photo: DEFAULT_KIOSK_SETTINGS.show_stylist_photo,
    enable_feedback_prompt: DEFAULT_KIOSK_SETTINGS.enable_feedback_prompt,
    require_form_signing: DEFAULT_KIOSK_SETTINGS.require_form_signing,
    exit_pin: DEFAULT_KIOSK_SETTINGS.exit_pin,
  });

  // Sync local state with fetched settings
  useEffect(() => {
    if (kioskSettings) {
      setLocalSettings({
        background_color: kioskSettings.background_color,
        accent_color: kioskSettings.accent_color,
        text_color: kioskSettings.text_color,
        welcome_title: kioskSettings.welcome_title,
        welcome_subtitle: kioskSettings.welcome_subtitle,
        check_in_prompt: kioskSettings.check_in_prompt,
        success_message: kioskSettings.success_message,
        button_style: kioskSettings.button_style,
        logo_url: kioskSettings.logo_url,
        idle_timeout_seconds: kioskSettings.idle_timeout_seconds,
        enable_walk_ins: kioskSettings.enable_walk_ins,
        require_confirmation_tap: kioskSettings.require_confirmation_tap,
        show_wait_time_estimate: kioskSettings.show_wait_time_estimate,
        show_stylist_photo: kioskSettings.show_stylist_photo,
        enable_feedback_prompt: kioskSettings.enable_feedback_prompt,
        require_form_signing: kioskSettings.require_form_signing,
        exit_pin: kioskSettings.exit_pin,
      });
      // Detect which preset matches
      setThemePreset(detectPreset(
        kioskSettings.background_color,
        kioskSettings.text_color,
        kioskSettings.accent_color
      ));
    } else {
      // Reset to defaults when no settings found
      setLocalSettings({
        background_color: DEFAULT_KIOSK_SETTINGS.background_color,
        accent_color: DEFAULT_KIOSK_SETTINGS.accent_color,
        text_color: DEFAULT_KIOSK_SETTINGS.text_color,
        welcome_title: DEFAULT_KIOSK_SETTINGS.welcome_title,
        welcome_subtitle: DEFAULT_KIOSK_SETTINGS.welcome_subtitle,
        check_in_prompt: DEFAULT_KIOSK_SETTINGS.check_in_prompt,
        success_message: DEFAULT_KIOSK_SETTINGS.success_message,
        button_style: DEFAULT_KIOSK_SETTINGS.button_style,
        logo_url: DEFAULT_KIOSK_SETTINGS.logo_url,
        idle_timeout_seconds: DEFAULT_KIOSK_SETTINGS.idle_timeout_seconds,
        enable_walk_ins: DEFAULT_KIOSK_SETTINGS.enable_walk_ins,
        require_confirmation_tap: DEFAULT_KIOSK_SETTINGS.require_confirmation_tap,
        show_wait_time_estimate: DEFAULT_KIOSK_SETTINGS.show_wait_time_estimate,
        show_stylist_photo: DEFAULT_KIOSK_SETTINGS.show_stylist_photo,
        enable_feedback_prompt: DEFAULT_KIOSK_SETTINGS.enable_feedback_prompt,
        require_form_signing: DEFAULT_KIOSK_SETTINGS.require_form_signing,
        exit_pin: DEFAULT_KIOSK_SETTINGS.exit_pin,
      });
      setThemePreset('cream');
    }
  }, [kioskSettings]);

  const handleSave = () => {
    if (!orgId) return;
    
    updateSettings.mutate({
      organizationId: orgId,
      locationId,
      settings: localSettings,
    });
  };

  const updateField = <K extends keyof LocalSettings>(field: K, value: LocalSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg">CONFIGURE LOCATION</CardTitle>
          <CardDescription>
            Select a location to customize its kiosk, or set organization-wide defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationSelect
            value={selectedLocation}
            onValueChange={setSelectedLocation}
            includeAll
            allLabel="Organization Defaults"
            triggerClassName="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Preview */}
        <KioskPreviewPanel settings={localSettings} />

        {/* Right: Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              {selectedLocation === 'all' ? 'DEFAULT SETTINGS' : 'LOCATION SETTINGS'}
            </CardTitle>
            <CardDescription>
              {selectedLocation === 'all' 
                ? 'These settings apply to all locations without custom configuration'
                : `Custom settings for ${selectedLocationData?.name || 'this location'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
              </TabsList>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4">
                {/* Theme Preset Selector */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Theme Preset</Label>
                  </div>
                  <Select 
                    value={themePreset} 
                    onValueChange={(v) => applyPreset(v as KioskThemePreset | 'custom')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a theme preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cream">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F5F0E8' }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9A7B4F' }} />
                          </div>
                          Cream (Light)
                        </div>
                      </SelectItem>
                      <SelectItem value="dark-luxury">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0A0A0A' }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C9A962' }} />
                          </div>
                          Dark Luxury
                        </div>
                      </SelectItem>
                      <SelectItem value="oat-minimal">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E8E0D5' }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B7355' }} />
                          </div>
                          Oat Minimal
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">Custom Colors</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a brand-aligned preset or choose custom to define your own colors
                  </p>
                </div>

                {/* Color Pickers - dimmed when using preset */}
                <div className={cn(
                  "grid grid-cols-2 gap-4 transition-opacity",
                  themePreset !== 'custom' && "opacity-50"
                )}>
                  <div className="space-y-2">
                    <Label htmlFor="bg-color">Background Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="bg-color"
                        value={localSettings.background_color}
                        onChange={(e) => {
                          updateField('background_color', e.target.value);
                          setThemePreset('custom');
                        }}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={localSettings.background_color}
                        onChange={(e) => {
                          updateField('background_color', e.target.value);
                          setThemePreset('custom');
                        }}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="accent-color"
                        value={localSettings.accent_color}
                        onChange={(e) => {
                          updateField('accent_color', e.target.value);
                          setThemePreset('custom');
                        }}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={localSettings.accent_color}
                        onChange={(e) => {
                          updateField('accent_color', e.target.value);
                          setThemePreset('custom');
                        }}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-color">Text Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="text-color"
                        value={localSettings.text_color}
                        onChange={(e) => {
                          updateField('text_color', e.target.value);
                          setThemePreset('custom');
                        }}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={localSettings.text_color}
                        onChange={(e) => {
                          updateField('text_color', e.target.value);
                          setThemePreset('custom');
                        }}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="button-style">Button Style</Label>
                    <Select 
                      value={localSettings.button_style} 
                      onValueChange={(v) => updateField('button_style', v as 'rounded' | 'pill' | 'square')}
                    >
                      <SelectTrigger id="button-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="pill">Pill</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    value={localSettings.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value || null)}
                    placeholder="https://..."
                  />
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-title">Welcome Title</Label>
                  <Input
                    id="welcome-title"
                    value={localSettings.welcome_title}
                    onChange={(e) => updateField('welcome_title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-subtitle">Welcome Subtitle</Label>
                  <Input
                    id="welcome-subtitle"
                    value={localSettings.welcome_subtitle || ''}
                    onChange={(e) => updateField('welcome_subtitle', e.target.value || null)}
                    placeholder="Optional tagline or instructions"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkin-prompt">Check-In Prompt</Label>
                  <Input
                    id="checkin-prompt"
                    value={localSettings.check_in_prompt}
                    onChange={(e) => updateField('check_in_prompt', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="success-message">Success Message</Label>
                  <Input
                    id="success-message"
                    value={localSettings.success_message}
                    onChange={(e) => updateField('success_message', e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* Behavior Tab */}
              <TabsContent value="behavior" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idle-timeout">Idle Timeout (seconds)</Label>
                  <Input
                    id="idle-timeout"
                    type="number"
                    min={30}
                    max={300}
                    value={localSettings.idle_timeout_seconds}
                    onChange={(e) => updateField('idle_timeout_seconds', parseInt(e.target.value) || 60)}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Allow Walk-Ins</p>
                      <p className="text-xs text-muted-foreground">Let clients check in without an appointment</p>
                    </div>
                    <Switch
                      checked={localSettings.enable_walk_ins}
                      onCheckedChange={(v) => updateField('enable_walk_ins', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Require Confirmation Tap</p>
                      <p className="text-xs text-muted-foreground">Ask client to confirm before check-in</p>
                    </div>
                    <Switch
                      checked={localSettings.require_confirmation_tap}
                      onCheckedChange={(v) => updateField('require_confirmation_tap', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Wait Time Estimate</p>
                      <p className="text-xs text-muted-foreground">Display estimated wait after check-in</p>
                    </div>
                    <Switch
                      checked={localSettings.show_wait_time_estimate}
                      onCheckedChange={(v) => updateField('show_wait_time_estimate', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Stylist Photo</p>
                      <p className="text-xs text-muted-foreground">Display stylist avatar on confirmation</p>
                    </div>
                    <Switch
                      checked={localSettings.show_stylist_photo}
                      onCheckedChange={(v) => updateField('show_stylist_photo', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Require Form Signing</p>
                      <p className="text-xs text-muted-foreground">Prompt new clients to sign intake forms</p>
                    </div>
                    <Switch
                      checked={localSettings.require_form_signing}
                      onCheckedChange={(v) => updateField('require_form_signing', v)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Label htmlFor="exit-pin">Exit PIN (4 digits)</Label>
                  <Input
                    id="exit-pin"
                    value={localSettings.exit_pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      updateField('exit_pin', val);
                    }}
                    maxLength={4}
                    className="font-mono max-w-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required to access settings from the kiosk device
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Save button */}
            <div className="pt-6 border-t mt-6">
              <Button 
                onClick={handleSave} 
                disabled={updateSettings.isPending}
                className="w-full"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Kiosk Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Deploy Section - only for specific locations */}
      {locationId && (
        <KioskDeployCard 
          locationId={locationId} 
          locationName={selectedLocationData?.name}
        />
      )}
    </div>
  );
}
