import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Upload, 
  Image as ImageIcon, 
  RotateCcw,
  Check,
  Loader2,
  Sparkles,
  Palette,
  Maximize2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DD75Logo from '@/assets/dd75-logo.svg';

interface ProgramLogoEditorProps {
  currentLogoUrl: string | null;
  logoSize: number;
  logoBackgroundColor: string | null;
  onLogoChange: (url: string | null) => void;
  onSizeChange: (size: number) => void;
  onBackgroundColorChange: (color: string | null) => void;
}

const SIZE_PRESETS = [
  { label: 'XS', value: 40 },
  { label: 'S', value: 56 },
  { label: 'M', value: 64 },
  { label: 'L', value: 80 },
  { label: 'XL', value: 100 },
  { label: '2XL', value: 120 },
];

const COLOR_PRESETS = [
  { label: 'None', value: null },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Cream', value: '#FAF8F5' },
  { label: 'Light Gray', value: '#F5F5F5' },
  { label: 'Black', value: '#1A1A1A' },
  { label: 'Charcoal', value: '#2D2D2D' },
  { label: 'Primary', value: 'hsl(var(--primary))' },
];

export function ProgramLogoEditor({ 
  currentLogoUrl, 
  logoSize,
  logoBackgroundColor,
  onLogoChange, 
  onSizeChange,
  onBackgroundColorChange 
}: ProgramLogoEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const [size, setSize] = useState(logoSize || 64);
  const [bgColor, setBgColor] = useState<string | null>(logoBackgroundColor);
  const [customColor, setCustomColor] = useState('#FAF8F5');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  useEffect(() => {
    setSize(logoSize || 64);
  }, [logoSize]);

  useEffect(() => {
    setBgColor(logoBackgroundColor);
  }, [logoBackgroundColor]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `program-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('email-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('email-assets')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onLogoChange(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetToDefault = () => {
    setPreviewUrl(null);
    onLogoChange(null);
    toast.success('Logo reset to default');
  };

  const handleSizeChange = (value: number[]) => {
    const newSize = value[0];
    setSize(newSize);
    onSizeChange(newSize);
  };

  const handleColorSelect = (color: string | null) => {
    setBgColor(color);
    onBackgroundColorChange(color);
  };

  const handleCustomColorApply = () => {
    setBgColor(customColor);
    onBackgroundColorChange(customColor);
  };

  const displayLogo = previewUrl || DD75Logo;
  const isCustomLogo = !!previewUrl;

  const getBackgroundStyle = () => {
    if (!bgColor) return {};
    if (bgColor.startsWith('hsl')) {
      return { backgroundColor: bgColor };
    }
    return { backgroundColor: bgColor };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg tracking-wide">Program Logo</h2>
          <p className="text-sm text-muted-foreground">Customize the logo shown on the welcome page</p>
        </div>
      </div>

      {/* Live Preview */}
      <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div 
              className="w-80 flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-6 transition-all duration-300"
              style={{
                ...getBackgroundStyle(),
                minHeight: size + 48,
              }}
            >
              <img 
                src={displayLogo} 
                alt="Program Logo" 
                className="object-contain transition-all duration-300"
                style={{ height: size }}
              />
            </div>
            {isCustomLogo && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Custom
              </Badge>
            )}
          </div>

          {/* Upload Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload New Logo'}
            </Button>

            {isCustomLogo && (
              <Button
                variant="outline"
                onClick={handleResetToDefault}
                disabled={uploading}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </Card>

      {/* Size & Color Controls */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Size Control */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Maximize2 className="w-4 h-4 text-primary" />
            <Label className="font-display text-sm tracking-wide">LOGO SIZE</Label>
            <Badge variant="outline" className="ml-auto text-xs">
              {size}px
            </Badge>
          </div>
          
          <div className="space-y-4">
            <Slider
              value={[size]}
              onValueChange={handleSizeChange}
              min={40}
              max={120}
              step={4}
              className="w-full"
            />
            
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant={size === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSize(preset.value);
                    onSizeChange(preset.value);
                  }}
                  className="text-xs px-3"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Background Color Control */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-primary" />
            <Label className="font-display text-sm tracking-wide">BACKGROUND</Label>
            {bgColor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleColorSelect(null)}
                className="ml-auto h-6 px-2 text-xs text-muted-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Preset Colors */}
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleColorSelect(preset.value)}
                  className={`
                    w-9 h-9 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                    ${bgColor === preset.value 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  style={preset.value ? { backgroundColor: preset.value.startsWith('hsl') ? 'hsl(var(--primary))' : preset.value } : undefined}
                  title={preset.label}
                >
                  {!preset.value && (
                    <X className="w-4 h-4 text-muted-foreground" />
                  )}
                  {bgColor === preset.value && preset.value && (
                    <Check className={`w-4 h-4 ${preset.value === '#FFFFFF' || preset.value === '#FAF8F5' || preset.value === '#F5F5F5' ? 'text-foreground' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Label className="text-xs text-muted-foreground shrink-0">Custom:</Label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1 h-9 px-3 text-sm border border-border rounded-lg bg-background font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCustomColorApply}
                  className="h-9"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Guidelines */}
      <Card className="p-5 bg-muted/30 border-border/50">
        <h3 className="font-display text-sm tracking-wide mb-3">LOGO GUIDELINES</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Recommended size: 400x120 pixels or similar aspect ratio</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Supported formats: PNG, SVG, JPG, WebP</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Maximum file size: 2MB</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Transparent background works best with color overlays</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
