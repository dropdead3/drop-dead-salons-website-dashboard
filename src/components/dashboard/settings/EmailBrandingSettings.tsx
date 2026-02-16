import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, X, Eye, EyeOff, Save, Mail, Send, Monitor, Smartphone, Info } from 'lucide-react';

export function EmailBrandingSettings() {
  const { effectiveOrganization } = useOrganizationContext();
  const { user } = useAuth();
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [uploading, setUploading] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [sendingTest, setSendingTest] = useState(false);
  const [testPopoverOpen, setTestPopoverOpen] = useState(false);

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

  useEffect(() => {
    if (user?.email && !testEmail) {
      setTestEmail(user.email);
    }
  }, [user?.email]);

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

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('send-branding-test-email', {
        body: { recipient_email: testEmail },
      });

      if (res.error) throw res.error;
      const result = res.data;
      if (result?.success) {
        toast({ title: 'Test email sent', description: `Check ${testEmail}` });
        setTestPopoverOpen(false);
      } else {
        throw new Error(result?.error || 'Failed to send');
      }
    } catch (err: any) {
      toast({ title: 'Failed to send test email', description: err.message, variant: 'destructive' });
    } finally {
      setSendingTest(false);
    }
  };

  // Build preview HTML that mirrors buildBrandedTemplate exactly
  const displayName = senderName || orgName;
  const previewAccent = accentColor || '#6366F1';

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
        <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          <div className="flex items-center gap-2">
            {/* Send Test Email */}
            <Popover open={testPopoverOpen} onOpenChange={setTestPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Send className="w-4 h-4" />
                  Send Test
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Send Test Email</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sends a real email using your <span className="font-medium">saved</span> branding.
                    </p>
                  </div>
                  {hasChanges && (
                    <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <Info className="w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        You have unsaved changes. Save first to include them in the test email.
                      </p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="test-email" className="text-xs">Recipient</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest || !testEmail}
                  >
                    {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sendingTest ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

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
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="rounded-lg border overflow-hidden bg-muted/20">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <p className="text-xs font-medium text-muted-foreground tracking-wide">EMAIL PREVIEW</p>
              <div className="flex items-center gap-1 border rounded-full p-0.5">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-full transition-colors ${previewMode === 'desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Desktop (600px)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-full transition-colors ${previewMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Mobile (360px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Email preview container */}
            <div
              className="mx-auto mb-4 transition-all duration-300"
              style={{
                maxWidth: previewMode === 'desktop' ? 600 : 360,
                padding: '0 16px',
              }}
            >
              {/* Outer email body bg */}
              <div style={{ backgroundColor: '#f4f4f5', padding: '20px 16px', borderRadius: 8 }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                  {/* Header */}
                  <div
                    style={{
                      backgroundColor: previewAccent,
                      padding: '24px',
                      borderRadius: '12px 12px 0 0',
                      textAlign: 'center' as const,
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={displayName}
                        style={{ maxHeight: 48, maxWidth: 200, marginBottom: 8 }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#ffffff',
                          letterSpacing: '-0.025em',
                        }}
                      >
                        {displayName}
                      </span>
                    )}
                  </div>

                  {/* Accent bar */}
                  <div
                    style={{
                      height: 4,
                      background: `linear-gradient(90deg, ${previewAccent}, ${previewAccent}88)`,
                    }}
                  />

                  {/* Content */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '32px 24px',
                      borderLeft: '1px solid #e4e4e7',
                      borderRight: '1px solid #e4e4e7',
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    }}
                  >
                    <p style={{ fontSize: 16, color: '#18181b', margin: '0 0 16px' }}>
                      Hi there 👋
                    </p>
                    <p style={{ fontSize: 14, color: '#3f3f46', lineHeight: 1.6, margin: '0 0 16px' }}>
                      This is a preview of how your branded emails will appear to recipients.
                      The header, accent color, and footer below match the real template used
                      for all outbound emails from your organization.
                    </p>
                    <p style={{ fontSize: 14, color: '#3f3f46', lineHeight: 1.6, margin: '0 0 24px' }}>
                      You can adjust the sender name, reply-to address, logo, and accent color
                      above to see changes reflected here instantly.
                    </p>
                    {/* CTA Button */}
                    <div style={{ textAlign: 'center' as const }}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        style={{
                          display: 'inline-block',
                          backgroundColor: previewAccent,
                          color: '#ffffff',
                          padding: '12px 32px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        View Dashboard
                      </a>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      backgroundColor: '#fafafa',
                      padding: '20px 24px',
                      borderRadius: '0 0 12px 12px',
                      border: '1px solid #e4e4e7',
                      borderTop: 'none',
                      textAlign: 'center' as const,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: '#a1a1aa' }}>
                      Sent via{' '}
                      <a href="https://getzura.com" style={{ color: '#a1a1aa', textDecoration: 'underline' }} onClick={(e) => e.preventDefault()}>
                        Zura
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
