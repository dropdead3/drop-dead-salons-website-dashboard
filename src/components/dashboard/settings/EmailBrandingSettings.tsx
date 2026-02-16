import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, X, Eye, EyeOff, Save, Mail } from 'lucide-react';

export function EmailBrandingSettings() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;
  const orgName = effectiveOrganization?.name || 'Your Organization';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [senderName, setSenderName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [accentColor, setAccentColor] = useState('#6366F1');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch current branding from org
  const { data: branding, isLoading } = useQuery({
    queryKey: ['email-branding', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('email_sender_name, email_reply_to, email_logo_url, email_accent_color')
        .eq('id', orgId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Seed local state from fetched data
  useEffect(() => {
    if (branding) {
      setSenderName(branding.email_sender_name || '');
      setReplyTo(branding.email_reply_to || '');
      setAccentColor(branding.email_accent_color || '#6366F1');
      setLogoUrl(branding.email_logo_url || null);
    }
  }, [branding]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase
        .from('organizations')
        .update({
          email_sender_name: senderName || null,
          email_reply_to: replyTo || null,
          email_accent_color: accentColor,
          email_logo_url: logoUrl,
        })
        .eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-branding', orgId] });
      toast({ title: 'Email branding saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save', variant: 'destructive' });
    },
  });

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${orgId}/email-logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('business-logos')
        .getPublicUrl(path);

      setLogoUrl(`${publicData.publicUrl}?t=${Date.now()}`);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeLogo = () => setLogoUrl(null);

  const hasChanges =
    senderName !== (branding?.email_sender_name || '') ||
    replyTo !== (branding?.email_reply_to || '') ||
    accentColor !== (branding?.email_accent_color || '#6366F1') ||
    logoUrl !== (branding?.email_logo_url || null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <CardTitle className="font-display text-lg">EMAIL BRANDING</CardTitle>
        </div>
        <CardDescription>Customize how your outbound emails appear to recipients.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sender & Reply-To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sender-name">Sender Display Name</Label>
            <Input
              id="sender-name"
              placeholder={orgName}
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              autoCapitalize="off"
            />
            <p className="text-xs text-muted-foreground">The "from" name in recipients' inboxes.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reply-to">Reply-To Email</Label>
            <Input
              id="reply-to"
              type="email"
              placeholder="hello@yoursalon.com"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Where replies are directed.</p>
          </div>
        </div>

        {/* Logo & Accent Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Email Logo</Label>
            {logoUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <img
                  src={logoUrl}
                  alt="Email logo"
                  className="h-10 w-auto max-w-[120px] object-contain rounded"
                />
                <div className="flex gap-1 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    Replace
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={removeLogo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload logo'}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-muted-foreground">PNG, JPG, SVG, or WebP. Max 2MB.</p>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <Label htmlFor="accent-color">Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5"
              />
              <Input
                id="accent-color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 font-mono text-sm"
                autoCapitalize="off"
                maxLength={7}
              />
            </div>
            <p className="text-xs text-muted-foreground">Used for email header background and accent bar.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            size="sm"
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Branding
          </Button>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="rounded-lg border overflow-hidden bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2">EMAIL PREVIEW</p>

            {/* Simulated email */}
            <div className="mx-4 mb-4 rounded-lg overflow-hidden border bg-background shadow-sm">
              {/* Header */}
              <div
                className="px-6 py-5 flex items-center gap-3"
                style={{ backgroundColor: accentColor }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded bg-white/20" />
                )}
                <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                  {senderName || orgName}
                </span>
              </div>

              {/* Accent bar */}
              <div className="h-1" style={{ backgroundColor: accentColor, opacity: 0.5 }} />

              {/* Body placeholder */}
              <div className="px-6 py-6 space-y-3">
                <div className="h-3 rounded-full bg-muted w-3/4" />
                <div className="h-3 rounded-full bg-muted w-full" />
                <div className="h-3 rounded-full bg-muted w-5/6" />
                <div className="h-3 rounded-full bg-muted w-2/3" />
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t text-center">
                <span className="text-[10px] text-muted-foreground">Sent via Zura</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
