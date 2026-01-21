import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RotateCcw,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DD75Logo from '@/assets/dd75-logo.svg';

interface ProgramLogoEditorProps {
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

export function ProgramLogoEditor({ currentLogoUrl, onLogoChange }: ProgramLogoEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `program-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('email-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
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

  const handleRemoveLogo = async () => {
    if (previewUrl && previewUrl.includes('email-assets')) {
      // Try to delete from storage
      try {
        const path = previewUrl.split('email-assets/')[1];
        if (path) {
          await supabase.storage.from('email-assets').remove([path]);
        }
      } catch (error) {
        console.error('Error deleting logo:', error);
      }
    }
    
    setPreviewUrl(null);
    onLogoChange(null);
    toast.success('Logo removed');
  };

  const displayLogo = previewUrl || DD75Logo;
  const isCustomLogo = !!previewUrl;

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

      {/* Current Logo Preview */}
      <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-64 h-24 flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-border/50 p-4">
              <img 
                src={displayLogo} 
                alt="Program Logo" 
                className="max-h-full max-w-full object-contain"
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

          <div className="flex flex-wrap gap-3 justify-center">
            {/* Upload Button */}
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

            {/* Reset to Default */}
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
            <span>Transparent background works best</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
