import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Apple,
  Globe,
  Copy,
  RefreshCw,
  CheckCircle2,
  Link2,
  Trash2,
} from 'lucide-react';
import { useCalendarFeedToken } from '@/hooks/useCalendarFeedToken';
import { toast } from 'sonner';

interface CalendarSubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarSubscribeModal({ open, onOpenChange }: CalendarSubscribeModalProps) {
  const {
    token,
    loading,
    generateToken,
    revokeToken,
    getFeedUrl,
    getWebcalUrl,
    getGoogleSubscribeUrl,
  } = useCalendarFeedToken();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(getFeedUrl(token));
    setCopied(true);
    toast.success('Feed URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApple = () => {
    if (!token) return;
    window.location.href = getWebcalUrl(token);
  };

  const handleGoogle = () => {
    if (!token) return;
    window.open(getGoogleSubscribeUrl(token), '_blank');
  };

  const handleOutlook = () => {
    if (!token) return;
    const feedUrl = getFeedUrl(token);
    window.open(`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Subscribe to Calendar
          </DialogTitle>
          <DialogDescription>
            Your Zura appointments will appear in your personal calendar. This is one-way and read-only — your personal events stay private.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!token ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Generate a private feed link to subscribe from any calendar app.
              </p>
              <Button onClick={generateToken} disabled={loading}>
                <Link2 className="w-4 h-4 mr-2" />
                Generate Calendar Link
              </Button>
            </div>
          ) : (
            <>
              {/* Subscribe buttons */}
              <div className="grid gap-3">
                <Card
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleApple}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Apple className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Apple Calendar</p>
                      <p className="text-sm text-muted-foreground">One-click subscribe via webcal://</p>
                    </div>
                  </div>
                </Card>

                <Card
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleGoogle}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Google Calendar</p>
                      <p className="text-sm text-muted-foreground">Opens Google Calendar subscription page</p>
                    </div>
                  </div>
                </Card>

                <Card
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleOutlook}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Outlook</p>
                      <p className="text-sm text-muted-foreground">Subscribe via Outlook on the web</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Copy URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Feed URL</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={getFeedUrl(token)}
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* What syncs */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">What gets synced</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {['Date & time', 'Client name', 'Service name', 'Status'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      {item}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Updates automatically every 15–60 minutes depending on your calendar app.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={generateToken}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Regenerate
                </Button>
                <Button variant="destructive" size="sm" onClick={revokeToken}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Revoke
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
