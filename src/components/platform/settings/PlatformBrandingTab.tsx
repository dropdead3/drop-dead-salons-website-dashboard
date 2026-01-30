import { useState, useEffect } from 'react';
import { Crown, Save, RotateCcw, Sparkles } from 'lucide-react';
import { usePlatformBranding, PlatformBranding } from '@/hooks/usePlatformBranding';
import { PlatformLogoUploader } from './PlatformLogoUploader';
import { PlatformThemeEditor } from './PlatformThemeEditor';
import { PlatformButton } from '../ui/PlatformButton';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
  PlatformCardDescription,
} from '../ui/PlatformCard';
import { cn } from '@/lib/utils';

export function PlatformBrandingTab() {
  const { branding, isLoading, isSaving, saveBranding } = usePlatformBranding();
  const [localBranding, setLocalBranding] = useState<PlatformBranding>(branding);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync local state when branding loads
  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(localBranding) !== JSON.stringify(branding);
    setHasUnsavedChanges(hasChanges);
  }, [localBranding, branding]);

  const handleSave = () => {
    saveBranding(localBranding);
  };

  const handleDiscard = () => {
    setLocalBranding(branding);
    
    // Reset CSS variables to original values
    if (branding.theme_colors) {
      Object.entries(branding.theme_colors).forEach(([key, value]) => {
        if (value) {
          document.documentElement.style.setProperty(`--${key}`, value);
        } else {
          document.documentElement.style.removeProperty(`--${key}`);
        }
      });
    }
  };

  const handleLogoChange = (type: 'primary' | 'secondary', url: string | null) => {
    setLocalBranding((prev) => ({
      ...prev,
      [`${type}_logo_url`]: url,
    }));
  };

  const handleThemeColorsChange = (colors: Record<string, string>) => {
    setLocalBranding((prev) => ({
      ...prev,
      theme_colors: colors,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-400" />
          <span className="text-sm text-amber-400 font-medium">Owner Only</span>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <PlatformButton
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Discard
            </PlatformButton>
            <PlatformButton
              variant="glow"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </PlatformButton>
          </div>
        )}
      </div>

      {/* Logo Management */}
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <PlatformCardTitle>Platform Logos</PlatformCardTitle>
          <PlatformCardDescription>
            Customize logos displayed in the platform navigation
          </PlatformCardDescription>
        </PlatformCardHeader>
        <PlatformCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PlatformLogoUploader
              label="Primary Logo"
              description="Shown in expanded sidebar (recommended: 180x48px)"
              value={localBranding.primary_logo_url}
              onChange={(url) => handleLogoChange('primary', url)}
              aspectRatio="wide"
            />
            <PlatformLogoUploader
              label="Secondary Logo"
              description="Icon for collapsed sidebar (recommended: 32x32px)"
              value={localBranding.secondary_logo_url}
              onChange={(url) => handleLogoChange('secondary', url)}
              aspectRatio="square"
            />
          </div>
        </PlatformCardContent>
      </PlatformCard>

      {/* Theme Colors */}
      <PlatformThemeEditor
        themeColors={localBranding.theme_colors}
        onChange={handleThemeColorsChange}
      />

      {/* Live Preview */}
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <PlatformCardTitle>Live Preview</PlatformCardTitle>
          <PlatformCardDescription>
            Preview how your branding changes will look
          </PlatformCardDescription>
        </PlatformCardHeader>
        <PlatformCardContent>
          <div className="flex gap-4">
            {/* Expanded Sidebar Preview */}
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2">Expanded State</p>
              <div
                className="rounded-lg border border-slate-700/50 p-4"
                style={{ backgroundColor: 'hsl(var(--platform-bg-elevated, 222 47% 8%))' }}
              >
                <div className="flex items-center gap-2">
                  {localBranding.primary_logo_url ? (
                    <img
                      src={localBranding.primary_logo_url}
                      alt="Primary logo preview"
                      className="h-8 object-contain"
                    />
                  ) : (
                    <>
                      <div
                        className="p-1.5 rounded-lg shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, hsl(var(--platform-accent, 262 83% 58%)), hsl(var(--platform-accent-hover, 262 83% 48%)))`,
                        }}
                      >
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-display font-semibold text-white">Platform</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsed Sidebar Preview */}
            <div className="w-24">
              <p className="text-xs text-slate-500 mb-2">Collapsed</p>
              <div
                className="rounded-lg border border-slate-700/50 p-4 flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--platform-bg-elevated, 222 47% 8%))' }}
              >
                {localBranding.secondary_logo_url ? (
                  <img
                    src={localBranding.secondary_logo_url}
                    alt="Secondary logo preview"
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <div
                    className="p-1.5 rounded-lg shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--platform-accent, 262 83% 58%)), hsl(var(--platform-accent-hover, 262 83% 48%)))`,
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </PlatformCardContent>
      </PlatformCard>
    </div>
  );
}
