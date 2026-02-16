import { useState, useEffect } from 'react';
import { Loader2, Save, Palette, Sun, Moon, Monitor, Image, Smartphone, Tablet, Upload, RotateCcw, Pencil, ImageIcon, MapPin as MapPinIcon, UserCheck, CalendarPlus, ClipboardCheck, FileSignature, MessageSquare, Lock, ChevronDown, Info, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { KioskPreviewPanel } from './KioskPreviewPanel';
import { KioskDeployCard } from './KioskDeployCard';
import { KioskMediaUploader } from './KioskMediaUploader';
import { useAuth } from '@/contexts/AuthContext';
import { useLocations } from '@/hooks/useLocations';
import { 
  useKioskSettings, 
  useUpdateKioskSettings, 
  useLocationKioskOverrides,
  usePushDefaultsToAllLocations,
  useResetLocationToDefaults,
  usePushLocationSettingsToAll,
  DEFAULT_KIOSK_SETTINGS 
} from '@/hooks/useKioskSettings';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import { colorThemes, ColorTheme } from '@/hooks/useColorTheme';
import { hslToHex } from '@/lib/colorUtils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Logo source options
type LogoSource = 'auto' | 'org-light' | 'org-dark' | 'custom';

interface LocalSettings {
  background_color: string;
  accent_color: string;
  text_color: string;
  background_image_url: string | null;
  background_overlay_opacity: number;
  welcome_title: string;
  welcome_subtitle: string | null;
  check_in_prompt: string;
  success_message: string;
  button_style: 'rounded' | 'pill' | 'square';
  logo_url: string | null;
  logo_color: string | null;
  logo_size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme_mode: 'dark' | 'light' | 'auto';
  display_orientation: 'portrait' | 'landscape';
  idle_timeout_seconds: number;
  enable_walk_ins: boolean;
  enable_self_booking: boolean;
  self_booking_allow_future: boolean;
  self_booking_show_stylists: boolean;
  require_confirmation_tap: boolean;
  show_wait_time_estimate: boolean;
  show_stylist_photo: boolean;
  enable_feedback_prompt: boolean;
  enable_glow_effects: boolean;
  require_form_signing: boolean;
  exit_pin: string;
  idle_video_url: string | null;
  show_location_badge: boolean;
  location_badge_position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  location_badge_style: 'glass' | 'solid' | 'outline';
}

// Convert global theme to kiosk colors
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

// Detect which global theme matches the current colors
function detectGlobalTheme(
  bg: string, 
  text: string, 
  accent: string
): ColorTheme | 'custom' {
  for (const theme of colorThemes) {
    // Check light preview
    const lightColors = {
      background_color: hslToHex(theme.lightPreview.bg),
      text_color: hslToHex(theme.lightPreview.primary),
      accent_color: hslToHex(theme.lightPreview.accent),
    };
    if (
      lightColors.background_color.toLowerCase() === bg.toLowerCase() &&
      lightColors.text_color.toLowerCase() === text.toLowerCase() &&
      lightColors.accent_color.toLowerCase() === accent.toLowerCase()
    ) {
      return theme.id;
    }
    
    // Check dark preview
    const darkColors = {
      background_color: hslToHex(theme.darkPreview.bg),
      text_color: hslToHex(theme.darkPreview.primary),
      accent_color: hslToHex(theme.darkPreview.accent),
    };
    if (
      darkColors.background_color.toLowerCase() === bg.toLowerCase() &&
      darkColors.text_color.toLowerCase() === text.toLowerCase() &&
      darkColors.accent_color.toLowerCase() === accent.toLowerCase()
    ) {
      return theme.id;
    }
  }
  return 'custom';
}

export function KioskSettingsContent() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [themePreset, setThemePreset] = useState<ColorTheme | 'custom'>('cream');
  const [logoSource, setLogoSource] = useState<LogoSource>('auto');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const { data: locations = [] } = useLocations();
  const { data: businessSettings } = useBusinessSettings();
  const { resolvedTheme } = useDashboardTheme();

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
  const { data: locationOverrides = [] } = useLocationKioskOverrides(orgId || undefined);
  const pushToAll = usePushDefaultsToAllLocations();
  const resetToDefaults = useResetLocationToDefaults();
  const pushLocationToAll = usePushLocationSettingsToAll();

  // Check if current location has custom override
  const hasCustomOverride = locationId ? locationOverrides.includes(locationId) : false;

  // Apply a theme preset
  const applyPreset = (preset: ColorTheme | 'custom') => {
    setThemePreset(preset);
    if (preset !== 'custom') {
      const isDark = localSettings.theme_mode === 'dark' || 
        (localSettings.theme_mode === 'auto' && resolvedTheme === 'dark');
      const colors = convertGlobalThemeToKioskColors(preset, isDark);
      setLocalSettings(prev => ({
        ...prev,
        ...colors,
      }));
    }
  };

  const [localSettings, setLocalSettings] = useState<LocalSettings>({
    background_color: DEFAULT_KIOSK_SETTINGS.background_color,
    accent_color: DEFAULT_KIOSK_SETTINGS.accent_color,
    text_color: DEFAULT_KIOSK_SETTINGS.text_color,
    background_image_url: DEFAULT_KIOSK_SETTINGS.background_image_url,
    background_overlay_opacity: DEFAULT_KIOSK_SETTINGS.background_overlay_opacity,
    welcome_title: DEFAULT_KIOSK_SETTINGS.welcome_title,
    welcome_subtitle: DEFAULT_KIOSK_SETTINGS.welcome_subtitle,
    check_in_prompt: DEFAULT_KIOSK_SETTINGS.check_in_prompt,
    success_message: DEFAULT_KIOSK_SETTINGS.success_message,
    button_style: DEFAULT_KIOSK_SETTINGS.button_style,
    logo_url: DEFAULT_KIOSK_SETTINGS.logo_url,
    logo_color: DEFAULT_KIOSK_SETTINGS.logo_color,
    logo_size: DEFAULT_KIOSK_SETTINGS.logo_size,
    theme_mode: DEFAULT_KIOSK_SETTINGS.theme_mode,
    display_orientation: DEFAULT_KIOSK_SETTINGS.display_orientation,
    idle_timeout_seconds: DEFAULT_KIOSK_SETTINGS.idle_timeout_seconds,
    enable_walk_ins: DEFAULT_KIOSK_SETTINGS.enable_walk_ins,
    enable_self_booking: DEFAULT_KIOSK_SETTINGS.enable_self_booking,
    self_booking_allow_future: DEFAULT_KIOSK_SETTINGS.self_booking_allow_future,
    self_booking_show_stylists: DEFAULT_KIOSK_SETTINGS.self_booking_show_stylists,
    require_confirmation_tap: DEFAULT_KIOSK_SETTINGS.require_confirmation_tap,
    show_wait_time_estimate: DEFAULT_KIOSK_SETTINGS.show_wait_time_estimate,
    show_stylist_photo: DEFAULT_KIOSK_SETTINGS.show_stylist_photo,
    enable_feedback_prompt: DEFAULT_KIOSK_SETTINGS.enable_feedback_prompt,
    enable_glow_effects: DEFAULT_KIOSK_SETTINGS.enable_glow_effects,
    require_form_signing: DEFAULT_KIOSK_SETTINGS.require_form_signing,
    exit_pin: DEFAULT_KIOSK_SETTINGS.exit_pin,
    idle_video_url: DEFAULT_KIOSK_SETTINGS.idle_video_url,
    show_location_badge: DEFAULT_KIOSK_SETTINGS.show_location_badge,
    location_badge_position: DEFAULT_KIOSK_SETTINGS.location_badge_position,
    location_badge_style: DEFAULT_KIOSK_SETTINGS.location_badge_style,
  });

  // Detect logo source from logo_url
  const detectLogoSource = (logoUrl: string | null): LogoSource => {
    if (!logoUrl) return 'auto';
    if (businessSettings?.logo_light_url && logoUrl === businessSettings.logo_light_url) return 'org-light';
    if (businessSettings?.logo_dark_url && logoUrl === businessSettings.logo_dark_url) return 'org-dark';
    if (logoUrl) return 'custom';
    return 'auto';
  };

  // Handle logo source change
  const handleLogoSourceChange = (source: LogoSource) => {
    setLogoSource(source);
    switch (source) {
      case 'auto':
        setLocalSettings(prev => ({ ...prev, logo_url: null }));
        break;
      case 'org-light':
        setLocalSettings(prev => ({ ...prev, logo_url: businessSettings?.logo_light_url || null }));
        break;
      case 'org-dark':
        setLocalSettings(prev => ({ ...prev, logo_url: businessSettings?.logo_dark_url || null }));
        break;
      case 'custom':
        setLocalSettings(prev => ({ ...prev, logo_url: customLogoUrl || null }));
        break;
    }
  };

  // Sync local state with fetched settings
  useEffect(() => {
    if (kioskSettings) {
      setLocalSettings({
        background_color: kioskSettings.background_color,
        accent_color: kioskSettings.accent_color,
        text_color: kioskSettings.text_color,
        background_image_url: kioskSettings.background_image_url,
        background_overlay_opacity: kioskSettings.background_overlay_opacity ?? DEFAULT_KIOSK_SETTINGS.background_overlay_opacity,
        welcome_title: kioskSettings.welcome_title,
        welcome_subtitle: kioskSettings.welcome_subtitle,
        check_in_prompt: kioskSettings.check_in_prompt,
        success_message: kioskSettings.success_message,
        button_style: kioskSettings.button_style,
        logo_url: kioskSettings.logo_url,
        logo_color: kioskSettings.logo_color,
        logo_size: kioskSettings.logo_size,
        theme_mode: kioskSettings.theme_mode,
        display_orientation: kioskSettings.display_orientation,
        idle_timeout_seconds: kioskSettings.idle_timeout_seconds,
        enable_walk_ins: kioskSettings.enable_walk_ins,
        enable_self_booking: kioskSettings.enable_self_booking ?? DEFAULT_KIOSK_SETTINGS.enable_self_booking,
        self_booking_allow_future: kioskSettings.self_booking_allow_future ?? DEFAULT_KIOSK_SETTINGS.self_booking_allow_future,
        self_booking_show_stylists: kioskSettings.self_booking_show_stylists ?? DEFAULT_KIOSK_SETTINGS.self_booking_show_stylists,
        require_confirmation_tap: kioskSettings.require_confirmation_tap,
        show_wait_time_estimate: kioskSettings.show_wait_time_estimate,
        show_stylist_photo: kioskSettings.show_stylist_photo,
        enable_feedback_prompt: kioskSettings.enable_feedback_prompt,
        enable_glow_effects: kioskSettings.enable_glow_effects ?? DEFAULT_KIOSK_SETTINGS.enable_glow_effects,
        require_form_signing: kioskSettings.require_form_signing,
        exit_pin: kioskSettings.exit_pin,
        idle_video_url: kioskSettings.idle_video_url ?? null,
        show_location_badge: kioskSettings.show_location_badge ?? DEFAULT_KIOSK_SETTINGS.show_location_badge,
        location_badge_position: kioskSettings.location_badge_position ?? DEFAULT_KIOSK_SETTINGS.location_badge_position,
        location_badge_style: kioskSettings.location_badge_style ?? DEFAULT_KIOSK_SETTINGS.location_badge_style,
      });
      // Detect which preset matches
      setThemePreset(detectGlobalTheme(
        kioskSettings.background_color,
        kioskSettings.text_color,
        kioskSettings.accent_color
      ));
      // Detect logo source
      const source = detectLogoSource(kioskSettings.logo_url);
      setLogoSource(source);
      if (source === 'custom' && kioskSettings.logo_url) {
        setCustomLogoUrl(kioskSettings.logo_url);
      }
    } else {
      // Reset to defaults when no settings found
      setLocalSettings({
        background_color: DEFAULT_KIOSK_SETTINGS.background_color,
        accent_color: DEFAULT_KIOSK_SETTINGS.accent_color,
        text_color: DEFAULT_KIOSK_SETTINGS.text_color,
        background_image_url: DEFAULT_KIOSK_SETTINGS.background_image_url,
        background_overlay_opacity: DEFAULT_KIOSK_SETTINGS.background_overlay_opacity,
        welcome_title: DEFAULT_KIOSK_SETTINGS.welcome_title,
        welcome_subtitle: DEFAULT_KIOSK_SETTINGS.welcome_subtitle,
        check_in_prompt: DEFAULT_KIOSK_SETTINGS.check_in_prompt,
        success_message: DEFAULT_KIOSK_SETTINGS.success_message,
        button_style: DEFAULT_KIOSK_SETTINGS.button_style,
        logo_url: DEFAULT_KIOSK_SETTINGS.logo_url,
        logo_color: DEFAULT_KIOSK_SETTINGS.logo_color,
        logo_size: DEFAULT_KIOSK_SETTINGS.logo_size,
        theme_mode: DEFAULT_KIOSK_SETTINGS.theme_mode,
        display_orientation: DEFAULT_KIOSK_SETTINGS.display_orientation,
        idle_timeout_seconds: DEFAULT_KIOSK_SETTINGS.idle_timeout_seconds,
        enable_walk_ins: DEFAULT_KIOSK_SETTINGS.enable_walk_ins,
        enable_self_booking: DEFAULT_KIOSK_SETTINGS.enable_self_booking,
        self_booking_allow_future: DEFAULT_KIOSK_SETTINGS.self_booking_allow_future,
        self_booking_show_stylists: DEFAULT_KIOSK_SETTINGS.self_booking_show_stylists,
        require_confirmation_tap: DEFAULT_KIOSK_SETTINGS.require_confirmation_tap,
        show_wait_time_estimate: DEFAULT_KIOSK_SETTINGS.show_wait_time_estimate,
        show_stylist_photo: DEFAULT_KIOSK_SETTINGS.show_stylist_photo,
        enable_feedback_prompt: DEFAULT_KIOSK_SETTINGS.enable_feedback_prompt,
        enable_glow_effects: DEFAULT_KIOSK_SETTINGS.enable_glow_effects,
        require_form_signing: DEFAULT_KIOSK_SETTINGS.require_form_signing,
        exit_pin: DEFAULT_KIOSK_SETTINGS.exit_pin,
        idle_video_url: DEFAULT_KIOSK_SETTINGS.idle_video_url,
        show_location_badge: DEFAULT_KIOSK_SETTINGS.show_location_badge,
        location_badge_position: DEFAULT_KIOSK_SETTINGS.location_badge_position,
        location_badge_style: DEFAULT_KIOSK_SETTINGS.location_badge_style,
      });
      setThemePreset('cream');
      setLogoSource('auto');
    }
  }, [kioskSettings, businessSettings]);

  // Update colors when theme_mode changes and using a preset
  useEffect(() => {
    if (themePreset !== 'custom') {
      const isDark = localSettings.theme_mode === 'dark' || 
        (localSettings.theme_mode === 'auto' && resolvedTheme === 'dark');
      const colors = convertGlobalThemeToKioskColors(themePreset, isDark);
      setLocalSettings(prev => ({
        ...prev,
        ...colors,
      }));
    }
  }, [localSettings.theme_mode, themePreset, resolvedTheme]);

  // Auto-fallback: When switching to landscape, center positions are invalid
  useEffect(() => {
    if (localSettings.display_orientation === 'landscape') {
      if (localSettings.location_badge_position === 'top-center') {
        setLocalSettings(prev => ({ ...prev, location_badge_position: 'top-left' }));
      } else if (localSettings.location_badge_position === 'bottom-center') {
        setLocalSettings(prev => ({ ...prev, location_badge_position: 'bottom-left' }));
      }
    }
  }, [localSettings.display_orientation]);

  // Derived: Available badge positions based on orientation
  const availableBadgePositions = localSettings.display_orientation === 'landscape'
    ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
    : ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const;

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

  const handlePushToAll = () => {
    if (!orgId) return;
    pushToAll.mutate(orgId);
  };

  const handleResetToDefaults = () => {
    if (!orgId || !locationId) return;
    resetToDefaults.mutate({ organizationId: orgId, locationId });
  };

  const handlePushLocationToAll = () => {
    if (!orgId || !locationId) return;
    pushLocationToAll.mutate({ 
      organizationId: orgId, 
      sourceLocationId: locationId,
      settings: localSettings 
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Location Selector — First card, establishes context */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">CONFIGURE LOCATION</CardTitle>
              <CardDescription>
                Select a location to customize its kiosk, or set organization-wide defaults
              </CardDescription>
            </div>
            {/* Apply to All button — right-aligned in header */}
            {selectedLocation === 'all' && locationOverrides.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pushToAll.isPending}
                  >
                    {pushToAll.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Apply Defaults to All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apply Defaults to All Locations?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {locationOverrides.length} location-specific customization{locationOverrides.length > 1 ? 's' : ''}. 
                      All locations will inherit from the organization defaults.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePushToAll}>
                      Yes, Apply to All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {locationId && locations.length > 1 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pushLocationToAll.isPending}
                  >
                    {pushLocationToAll.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Apply to All Locations
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apply to All Locations?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will copy "{selectedLocationData?.name}" settings to all other {locations.length - 1} location{locations.length > 2 ? 's' : ''}.
                      Existing settings at other locations will be overwritten.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePushLocationToAll}>
                      Yes, Apply to All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="max-w-sm">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <span>Organization Defaults</span>
                </span>
              </SelectItem>
              {locations.map(loc => {
                const hasOverride = locationOverrides.includes(loc.id);
                return (
                  <SelectItem key={loc.id} value={loc.id}>
                    <span className="flex items-center gap-2">
                      <span>{loc.name}</span>
                      {hasOverride && (
                        <span className="inline-flex items-center gap-1 text-xs text-warning">
                          <Pencil className="w-3 h-3" />
                          Customized
                        </span>
                      )}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* Editing context badge */}
          {locationId && selectedLocationData && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Editing:</span>
              <span className="text-xs font-medium">{selectedLocationData.name}</span>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                hasCustomOverride
                  ? "bg-warning/10 text-warning border border-warning/20"
                  : "bg-muted text-muted-foreground border border-border"
              )}>
                {hasCustomOverride ? 'Custom Overrides' : 'Using Defaults'}
              </span>
            </div>
          )}

          {locationOverrides.length > 0 && !locationId && (
            <p className="text-xs text-muted-foreground mt-2">
              {locationOverrides.length} location{locationOverrides.length > 1 ? 's have' : ' has'} custom settings
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. Kiosk Features - Independent Toggles */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg">KIOSK FEATURES</CardTitle>
          <CardDescription>
            Enable the capabilities your kiosk offers — features work independently
          </CardDescription>
          {/* Location context banner */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Configuring:</span>
            <span className="text-xs font-medium">
              {locationId ? selectedLocationData?.name : 'Organization Defaults'}
            </span>
            {locationId && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                hasCustomOverride
                  ? "bg-warning/10 text-warning border border-warning/20"
                  : "bg-muted text-muted-foreground border border-border"
              )}>
                {hasCustomOverride ? 'Custom overrides' : 'Using org defaults'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Check-In — Core, always on */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Check-In</p>
                  <p className="text-xs text-muted-foreground">Clients look up and check in for existing appointments</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Always on</span>
              </div>
            </div>
            {/* Check-in sub-settings */}
            <div className="pl-[52px] space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Require Confirmation Tap</p>
                  <p className="text-xs text-muted-foreground">Ask client to confirm before check-in</p>
                </div>
                <Switch
                  checked={localSettings.require_confirmation_tap}
                  onCheckedChange={(v) => updateField('require_confirmation_tap', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Show Wait Time Estimate</p>
                  <p className="text-xs text-muted-foreground">Display estimated wait after check-in</p>
                </div>
                <Switch
                  checked={localSettings.show_wait_time_estimate}
                  onCheckedChange={(v) => updateField('show_wait_time_estimate', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Show Stylist Photo</p>
                  <p className="text-xs text-muted-foreground">Display stylist avatar on confirmation</p>
                </div>
                <Switch
                  checked={localSettings.show_stylist_photo}
                  onCheckedChange={(v) => updateField('show_stylist_photo', v)}
                />
              </div>
            </div>
          </div>

          {/* Walk-In Registration */}
          <div className={cn(
            "rounded-xl border p-4 transition-all",
            localSettings.enable_walk_ins
              ? "border-border bg-card"
              : "border-muted bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  localSettings.enable_walk_ins ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Walk-In Registration</p>
                  <p className="text-xs text-muted-foreground">Let clients register without an appointment</p>
                </div>
              </div>
              <Switch
                checked={localSettings.enable_walk_ins}
                onCheckedChange={(v) => updateField('enable_walk_ins', v)}
              />
            </div>
          </div>

          {/* Self-Service Booking */}
          <div className={cn(
            "rounded-xl border p-4 transition-all",
            localSettings.enable_self_booking
              ? "border-border bg-card"
              : "border-muted bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  localSettings.enable_self_booking ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Self-Service Booking</p>
                  <p className="text-xs text-muted-foreground">Walk-in clients can browse services and book appointments</p>
                </div>
              </div>
              <Switch
                checked={localSettings.enable_self_booking}
                onCheckedChange={(v) => updateField('enable_self_booking', v)}
              />
            </div>
            <AnimatePresence>
              {localSettings.enable_self_booking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-[52px] space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Allow Future Bookings</p>
                        <p className="text-xs text-muted-foreground">Let clients book for dates beyond today</p>
                      </div>
                      <Switch
                        checked={localSettings.self_booking_allow_future}
                        onCheckedChange={(v) => updateField('self_booking_allow_future', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Show Stylist Selection</p>
                        <p className="text-xs text-muted-foreground">Let clients choose their stylist (otherwise first available)</p>
                      </div>
                      <Switch
                        checked={localSettings.self_booking_show_stylists}
                        onCheckedChange={(v) => updateField('self_booking_show_stylists', v)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form Signing */}
          <div className={cn(
            "rounded-xl border p-4 transition-all",
            localSettings.require_form_signing
              ? "border-border bg-card"
              : "border-muted bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  localSettings.require_form_signing ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Form Signing</p>
                  <p className="text-xs text-muted-foreground">Prompt new clients to sign intake forms during check-in</p>
                </div>
              </div>
              <Switch
                checked={localSettings.require_form_signing}
                onCheckedChange={(v) => updateField('require_form_signing', v)}
              />
            </div>
          </div>

          {/* Feedback Prompt */}
          <div className={cn(
            "rounded-xl border p-4 transition-all",
            localSettings.enable_feedback_prompt
              ? "border-border bg-card"
              : "border-muted bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  localSettings.enable_feedback_prompt ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Feedback Prompt</p>
                  <p className="text-xs text-muted-foreground">Ask clients for feedback after check-in</p>
                </div>
              </div>
              <Switch
                checked={localSettings.enable_feedback_prompt}
                onCheckedChange={(v) => updateField('enable_feedback_prompt', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Settings Form */}
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
                {/* Mode Selector */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Display Mode</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'dark', 'auto'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors",
                          localSettings.theme_mode === mode 
                            ? "border-primary bg-primary/10 text-foreground" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => updateField('theme_mode', mode)}
                      >
                        {mode === 'light' && <Sun className="w-4 h-4" />}
                        {mode === 'dark' && <Moon className="w-4 h-4" />}
                        {mode === 'auto' && <Monitor className="w-4 h-4" />}
                        <span className="text-sm capitalize">{mode}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {localSettings.theme_mode === 'auto' 
                      ? 'Follows the device system preference' 
                      : localSettings.theme_mode === 'dark'
                      ? 'Always display in dark mode'
                      : 'Always display in light mode'}
                  </p>
                </div>

                {/* Display Orientation */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tablet className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Display Orientation</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['portrait', 'landscape'] as const).map((orientation) => (
                      <button
                        key={orientation}
                        type="button"
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors",
                          localSettings.display_orientation === orientation 
                            ? "border-primary bg-primary/10 text-foreground" 
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => updateField('display_orientation', orientation)}
                      >
                        {orientation === 'portrait' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4 rotate-90" />
                        )}
                        <span className="text-sm capitalize">{orientation}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {localSettings.display_orientation === 'portrait' 
                      ? 'Vertical tablet placement (taller than wide)' 
                      : 'Horizontal tablet placement (wider than tall)'}
                  </p>
                </div>

                {/* Theme Preset Selector */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Color Theme</Label>
                  </div>
                  <Select 
                    value={themePreset} 
                    onValueChange={(v) => applyPreset(v as ColorTheme | 'custom')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a color theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorThemes.map((theme) => {
                        const isDark = localSettings.theme_mode === 'dark' || 
                          (localSettings.theme_mode === 'auto' && resolvedTheme === 'dark');
                        const preview = isDark ? theme.darkPreview : theme.lightPreview;
                        return (
                          <SelectItem key={theme.id} value={theme.id}>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                <div 
                                  className="w-3 h-3 rounded-full border border-border/50" 
                                  style={{ backgroundColor: `hsl(${preview.bg})` }} 
                                />
                                <div 
                                  className="w-3 h-3 rounded-full border border-border/50" 
                                  style={{ backgroundColor: `hsl(${preview.accent})` }} 
                                />
                              </div>
                              {theme.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                      <SelectItem value="custom">Custom Colors</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Uses the same themes as your dashboard
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

                </div>

                {/* Button Style — standalone, outside color grid */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <Label htmlFor="button-style" className="text-sm font-medium">Button Style</Label>
                  <Select 
                    value={localSettings.button_style} 
                    onValueChange={(v) => updateField('button_style', v as 'rounded' | 'pill' | 'square')}
                  >
                    <SelectTrigger id="button-style" className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="pill">Pill</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls the shape of all buttons on the kiosk
                  </p>

                  {/* Glow Effects Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-glow">Glow Effects</Label>
                      <p className="text-xs text-muted-foreground">
                        Add ambient glow to buttons and indicators
                      </p>
                    </div>
                    <Switch
                      id="enable-glow"
                      checked={localSettings.enable_glow_effects}
                      onCheckedChange={(v) => updateField('enable_glow_effects', v)}
                    />
                  </div>
                </div>

                {/* Logo Selector */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Logo</Label>
                  </div>
                  <Select 
                    value={logoSource} 
                    onValueChange={(v) => handleLogoSourceChange(v as LogoSource)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose logo source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex flex-col">
                          <span>Auto (based on mode)</span>
                        </div>
                      </SelectItem>
                      <SelectItem 
                        value="org-light" 
                        disabled={!businessSettings?.logo_light_url}
                      >
                        <div className="flex items-center gap-2">
                          <span>Organization Logo (Light)</span>
                          {!businessSettings?.logo_light_url && (
                            <span className="text-xs text-muted-foreground">(not uploaded)</span>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem 
                        value="org-dark" 
                        disabled={!businessSettings?.logo_dark_url}
                      >
                        <div className="flex items-center gap-2">
                          <span>Organization Logo (Dark)</span>
                          {!businessSettings?.logo_dark_url && (
                            <span className="text-xs text-muted-foreground">(not uploaded)</span>
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">Custom URL</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {logoSource === 'auto' && (
                    <p className="text-xs text-muted-foreground">
                      Uses light logo for dark mode, dark logo for light mode
                    </p>
                  )}

                  {logoSource === 'custom' && (
                    <Input
                      value={customLogoUrl}
                      onChange={(e) => {
                        setCustomLogoUrl(e.target.value);
                        setLocalSettings(prev => ({ ...prev, logo_url: e.target.value || null }));
                      }}
                      placeholder="https://..."
                    />
                  )}

                  {/* Logo preview */}
                  {localSettings.logo_url && (
                    <div className="flex justify-center p-4 rounded-xl bg-background border">
                      <img 
                        src={localSettings.logo_url} 
                        alt="Logo preview" 
                        className="h-12 w-auto object-contain"
                        onError={(e) => { 
                          (e.target as HTMLImageElement).style.display = 'none'; 
                        }}
                      />
                    </div>
                  )}

                  {/* Logo Size */}
                  <div className="space-y-2">
                    <Label className="text-sm">Logo Size</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={cn(
                            "flex items-center justify-center px-2 py-2 rounded-lg border transition-colors text-xs font-medium uppercase",
                            localSettings.logo_size === size 
                              ? "border-primary bg-primary/10 text-foreground" 
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => updateField('logo_size', size)}
                        >
                          {size === 'xs' ? 'XS' : size === 'sm' ? 'S' : size === 'md' ? 'M' : size === 'lg' ? 'L' : 'XL'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {localSettings.logo_size === 'xs' ? 'Extra small' : 
                       localSettings.logo_size === 'sm' ? 'Small' : 
                       localSettings.logo_size === 'md' ? 'Medium (default)' : 
                       localSettings.logo_size === 'lg' ? 'Large' : 'Extra large'}
                    </p>
                  </div>

                  {/* Logo Color Overlay */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Logo Color Overlay</Label>
                      {localSettings.logo_color && (
                        <button
                          type="button"
                          onClick={() => updateField('logo_color', null)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localSettings.logo_color || '#000000'}
                        onChange={(e) => updateField('logo_color', e.target.value)}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                      />
                      <Input
                        value={localSettings.logo_color || ''}
                        onChange={(e) => updateField('logo_color', e.target.value || null)}
                        placeholder="No color overlay"
                        className="font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Apply a color tint over the logo (works best with SVG or transparent PNG logos)
                    </p>
                  </div>
                </div>

                {/* Background Media Section */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <KioskMediaUploader
                    imageUrl={localSettings.background_image_url}
                    videoUrl={localSettings.idle_video_url}
                    overlayOpacity={localSettings.background_overlay_opacity}
                    onImageChange={(url) => updateField('background_image_url', url)}
                    onVideoChange={(url) => updateField('idle_video_url', url)}
                    organizationId={orgId || undefined}
                  />

                  {/* Overlay opacity slider */}
                  {(localSettings.background_image_url || localSettings.idle_video_url) && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Overlay Darkness</Label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(localSettings.background_overlay_opacity * 100)}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[localSettings.background_overlay_opacity * 100]}
                        onValueChange={([v]) => updateField('background_overlay_opacity', v / 100)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {localSettings.background_overlay_opacity < 0.3 ? 'Minimal darkening - ensure text is readable' : 
                         localSettings.background_overlay_opacity < 0.6 ? 'Balanced contrast' : 
                         'Strong darkening for readability'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Location Badge Section */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Location Badge</Label>
                    </div>
                    <Switch
                      checked={localSettings.show_location_badge}
                      onCheckedChange={(v) => updateField('show_location_badge', v)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display the location name on the kiosk screen
                  </p>

                  {localSettings.show_location_badge && (
                    <>
                      {/* Position selector - dynamic grid based on orientation */}
                      <div className="space-y-2">
                        <Label className="text-sm">Position</Label>
                        <div className={cn(
                          "grid gap-2",
                          localSettings.display_orientation === 'landscape' ? "grid-cols-2" : "grid-cols-3"
                        )}>
                          {availableBadgePositions.map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              className={cn(
                                "px-2 py-2 rounded-lg border text-xs font-medium transition-colors text-center",
                                localSettings.location_badge_position === pos
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border hover:border-primary/50"
                              )}
                              onClick={() => updateField('location_badge_position', pos)}
                            >
                              {pos.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Style selector */}
                      <div className="space-y-2">
                        <Label className="text-sm">Style</Label>
                        <Select 
                          value={localSettings.location_badge_style} 
                          onValueChange={(v) => updateField('location_badge_style', v as 'glass' | 'solid' | 'outline')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="glass">Glass (blur effect)</SelectItem>
                            <SelectItem value="solid">Solid (accent color)</SelectItem>
                            <SelectItem value="outline">Outline (transparent)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
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
                {/* Info note */}
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-3">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Feature-specific settings (check-in, booking, forms) are configured in the <strong>Kiosk Features</strong> section above.
                  </p>
                </div>

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
                  <p className="text-xs text-muted-foreground">
                    How long before the kiosk returns to the idle screen
                  </p>
                </div>

                {/* Security sub-section */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Security</Label>
                  </div>
                  <div className="space-y-2">
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
                </div>
              </TabsContent>
            </Tabs>

            {/* Save button */}
            <div className="pt-6 border-t mt-6 space-y-3">
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
                Save {selectedLocation === 'all' ? 'Organization Defaults' : 'Location Settings'}
              </Button>

              {/* "Apply to All" buttons moved to Location Selector card header */}

              {/* Reset to Defaults - only show when editing a specific location with overrides */}
              {locationId && hasCustomOverride && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      disabled={resetToDefaults.isPending}
                    >
                      {resetToDefaults.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-2" />
                      )}
                      Reset to Organization Defaults
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove custom settings for "{selectedLocationData?.name}". 
                        This location will inherit from the organization defaults.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetToDefaults}>
                        Yes, Reset to Defaults
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Preview (sticky) */}
        <div className="lg:self-start lg:sticky lg:top-6">
          <KioskPreviewPanel 
            settings={localSettings} 
            businessSettings={businessSettings}
          />
        </div>
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
