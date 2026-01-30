import { Moon, Sun, Monitor, Check, Palette, Upload, ImageIcon } from 'lucide-react';
import { usePlatformTheme } from '@/contexts/PlatformThemeContext';
import { usePlatformBranding, PlatformBranding } from '@/hooks/usePlatformBranding';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
  PlatformCardDescription,
} from '../ui/PlatformCard';
import { PlatformButton } from '../ui/PlatformButton';
import { Label } from '@/components/ui/label';

type ThemeOption = 'light' | 'dark' | 'system';

const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun; description: string }[] = [
  { 
    value: 'light', 
    label: 'Light', 
    icon: Sun, 
    description: 'Soft lavender with purple accents' 
  },
  { 
    value: 'dark', 
    label: 'Dark', 
    icon: Moon, 
    description: 'Deep slate with violet glow' 
  },
  { 
    value: 'system', 
    label: 'System', 
    icon: Monitor, 
    description: 'Follow your device settings' 
  },
];

interface LogoUploadProps {
  label: string;
  description: string;
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  variant: 'light' | 'dark';
}

function LogoUpload({ label, description, currentUrl, onUpload, onRemove, variant }: LogoUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, SVG, or WebP)',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `platform-logo-${variant}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      onUpload(publicUrl);
      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const bgClass = variant === 'light' 
    ? 'bg-white border-slate-200' 
    : 'bg-slate-900 border-slate-700';

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium text-slate-200">{label}</Label>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      
      <div className={cn(
        'relative flex items-center justify-center h-24 rounded-lg border-2 border-dashed transition-colors',
        bgClass,
        !currentUrl && 'hover:border-violet-400/50'
      )}>
        {currentUrl ? (
          <div className="flex items-center gap-4">
            <img
              src={currentUrl}
              alt={label}
              className="h-12 object-contain"
            />
            <PlatformButton
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-slate-400 hover:text-red-400"
            >
              Remove
            </PlatformButton>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 cursor-pointer p-4">
            <div className="p-2 rounded-lg bg-slate-800/50">
              {isUploading ? (
                <Upload className="h-5 w-5 text-violet-400 animate-pulse" />
              ) : (
                <ImageIcon className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <span className="text-xs text-slate-400">
              {isUploading ? 'Uploading...' : 'Click to upload'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}

export function PlatformAppearanceTab() {
  const { theme, setTheme, resolvedTheme } = usePlatformTheme();
  const { branding, saveBranding, isSaving } = usePlatformBranding();
  const [localBranding, setLocalBranding] = useState<PlatformBranding>(branding);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  useEffect(() => {
    const isChanged = JSON.stringify(localBranding) !== JSON.stringify(branding);
    setHasChanges(isChanged);
  }, [localBranding, branding]);

  const handleLogoUpdate = (key: keyof PlatformBranding, value: string | null) => {
    setLocalBranding(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveBranding(localBranding);
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection Card */}
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <PlatformCardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-violet-400" />
            Theme Mode
          </PlatformCardTitle>
          <PlatformCardDescription>
            Choose how the platform admin interface appears
          </PlatformCardDescription>
        </PlatformCardHeader>
        <PlatformCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              const isResolved = resolvedTheme === option.value || 
                (option.value === 'system' && theme === 'system');
              
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                  )}
                >
                  {/* Preview Box */}
                  <div className={cn(
                    'w-full aspect-video rounded-lg overflow-hidden border',
                    option.value === 'dark' || (option.value === 'system' && resolvedTheme === 'dark')
                      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900/30 border-slate-700'
                      : 'bg-gradient-to-br from-violet-50 via-purple-50 to-lavender-100 border-violet-200'
                  )}>
                    <div className="p-2 h-full flex flex-col gap-1">
                      {/* Mini sidebar */}
                      <div className={cn(
                        'w-1/4 h-full rounded',
                        option.value === 'dark' || (option.value === 'system' && resolvedTheme === 'dark')
                          ? 'bg-slate-800'
                          : 'bg-white/80'
                      )} />
                    </div>
                  </div>

                  {/* Icon and Label */}
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      'h-4 w-4',
                      isSelected ? 'text-violet-400' : 'text-slate-400'
                    )} />
                    <span className={cn(
                      'font-medium',
                      isSelected ? 'text-white' : 'text-slate-300'
                    )}>
                      {option.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 text-center">
                    {option.description}
                  </p>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 p-1 rounded-full bg-violet-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </PlatformCardContent>
      </PlatformCard>

      {/* Logo Configuration Card */}
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <PlatformCardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-violet-400" />
                Platform Logos
              </PlatformCardTitle>
              <PlatformCardDescription>
                Upload different logos for light and dark themes
              </PlatformCardDescription>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2">
                <PlatformButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalBranding(branding)}
                >
                  Discard
                </PlatformButton>
                <PlatformButton
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </PlatformButton>
              </div>
            )}
          </div>
        </PlatformCardHeader>
        <PlatformCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dark Mode Logo (Light/White logo for dark backgrounds) */}
            <LogoUpload
              label="Dark Mode Logo"
              description="Light/white logo for dark backgrounds"
              currentUrl={localBranding.primary_logo_url}
              onUpload={(url) => handleLogoUpdate('primary_logo_url', url)}
              onRemove={() => handleLogoUpdate('primary_logo_url', null)}
              variant="dark"
            />

            {/* Light Mode Logo (Dark logo for light backgrounds) */}
            <LogoUpload
              label="Light Mode Logo"
              description="Dark/colored logo for light backgrounds"
              currentUrl={localBranding.secondary_logo_url}
              onUpload={(url) => handleLogoUpdate('secondary_logo_url', url)}
              onRemove={() => handleLogoUpdate('secondary_logo_url', null)}
              variant="light"
            />
          </div>

          <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-200 mb-2">Logo Guidelines</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• <strong>Dark Mode:</strong> Use white or light-colored logos that contrast well against dark backgrounds</li>
              <li>• <strong>Light Mode:</strong> Use dark or colored logos that contrast well against light backgrounds</li>
              <li>• Recommended formats: SVG (best), PNG with transparency, or WebP</li>
              <li>• Maximum recommended height: 48px for optimal display</li>
            </ul>
          </div>
        </PlatformCardContent>
      </PlatformCard>
    </div>
  );
}
