import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  useStaffInvitations, 
  usePendingInvitations,
  useCancelInvitation,
  useResendInvitation
} from '@/hooks/useStaffInvitations';
import { InviteStaffDialog } from '@/components/dashboard/InviteStaffDialog';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { 
  Search, 
  Loader2, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  Send,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  QrCode,
  Download,
  Eye,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import DropDeadLogo from '@/assets/drop-dead-logo.svg';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  stylist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  assistant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  receptionist: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', label: 'Pending' },
  accepted: { icon: CheckCircle, color: 'text-green-600', label: 'Accepted' },
  expired: { icon: AlertTriangle, color: 'text-gray-500', label: 'Expired' },
  cancelled: { icon: XCircle, color: 'text-red-600', label: 'Cancelled' },
};

// Get the base URL for the staff login page
const getStaffLoginUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/staff-login`;
  }
  return '/staff-login';
};

// Premium PDF Preview Component - 8.5x11 ratio
function QRCodePDFPreview({ staffLoginUrl }: { staffLoginUrl: string }) {
  return (
    <div className="bg-gradient-to-b from-[hsl(40,30%,96%)] to-[hsl(35,25%,92%)] rounded-xl p-6 shadow-inner">
      {/* Premium PDF Preview - 8.5:11 aspect ratio */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden mx-auto relative" style={{ aspectRatio: '8.5/11', maxWidth: '340px' }}>
        {/* Header with gradient - small logo */}
        <div className="bg-gradient-to-r from-[hsl(0,0%,8%)] to-[hsl(0,0%,15%)] py-3 px-4 text-center">
          <img 
            src={DropDeadLogo} 
            alt="Drop Dead" 
            className="h-3 mx-auto invert"
          />
          <p className="text-[hsl(40,30%,70%)] text-[7px] mt-0.5 tracking-[0.2em] uppercase">
            Staff Portal
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center px-6 py-4">
          {/* Welcome message */}
          <div className="text-center mb-3">
            <p className="text-base text-foreground font-display tracking-wide">Welcome to the team!</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] mx-auto">
              You need to create your profile on our software system.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[hsl(35,30%,88%)] shadow-md">
            <QRCodeCanvas 
              value={staffLoginUrl} 
              size={140}
              level="H"
              marginSize={1}
              fgColor="hsl(0, 0%, 8%)"
            />
          </div>
          
          <div className="mt-3 text-center">
            <h3 className="font-display text-sm tracking-[0.15em] uppercase text-foreground">
              Create Your Account
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scan this QR code to get started
            </p>
          </div>

          {/* URL Section - smaller and narrower */}
          <div className="pt-3 text-center max-w-[180px]">
            <p className="text-[8px] text-muted-foreground">
              Or visit: <span className="text-foreground break-all">{staffLoginUrl.replace('https://', '')}</span>
            </p>
          </div>
        </div>

        {/* Powered By Footer - absolutely positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-[hsl(0,0%,8%)] px-4 py-1.5 flex items-center justify-center">
          <p className="text-[7px] text-[hsl(40,30%,55%)] tracking-wide">
            Powered by Drop Dead Salon Software
          </p>
        </div>
      </div>
    </div>
  );
}

// QR Code Card Component
function QRCodeCard() {
  const qrRef = useRef<HTMLDivElement>(null);
  const staffLoginUrl = getStaffLoginUrl();
  const [previewOpen, setPreviewOpen] = useState(false);

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create a premium branded canvas - 8.5x11 inches at 300ppi
    const pdfCanvas = document.createElement('canvas');
    const ctx = pdfCanvas.getContext('2d');
    if (!ctx) return;

    const width = 2550; // 8.5 inches * 300ppi
    const height = 3300; // 11 inches * 300ppi
    pdfCanvas.width = width;
    pdfCanvas.height = height;

    // Background gradient (cream to oat)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#f8f6f1');
    bgGradient.addColorStop(1, '#ede9e0');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Header background (dark) - small header
    const headerHeight = 200;
    const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
    headerGradient.addColorStop(0, '#141414');
    headerGradient.addColorStop(1, '#262626');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);

    // Header text - small logo
    ctx.fillStyle = '#f8f6f1';
    ctx.font = 'bold 72px Termina, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DROP DEAD®', width / 2, 110);
    ctx.font = '36px sans-serif';
    ctx.letterSpacing = '0.2em';
    ctx.fillStyle = '#a8a090';
    ctx.fillText('STAFF PORTAL', width / 2, 165);

    // Welcome message - constrained width
    const welcomeY = headerHeight + 180;
    ctx.fillStyle = '#141414';
    ctx.font = '500 84px Termina, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME TO THE TEAM!', width / 2, welcomeY);
    
    // Subtitle - narrower (simulating max-width)
    ctx.fillStyle = '#666666';
    ctx.font = '48px sans-serif';
    ctx.fillText('You need to create your profile on', width / 2, welcomeY + 80);
    ctx.fillText('our software system.', width / 2, welcomeY + 140);

    // QR Code container
    const qrSize = 800;
    const qrX = (width - qrSize) / 2;
    const qrY = welcomeY + 220;
    
    // QR border with shadow
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 15;
    ctx.beginPath();
    ctx.roundRect(qrX - 60, qrY - 60, qrSize + 120, qrSize + 120, 48);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw QR code
    ctx.drawImage(canvas, qrX, qrY, qrSize, qrSize);

    // Title text
    const titleY = qrY + qrSize + 200;
    ctx.fillStyle = '#141414';
    ctx.font = '500 72px Termina, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CREATE YOUR ACCOUNT', width / 2, titleY);

    // Subtitle
    ctx.fillStyle = '#666666';
    ctx.font = '48px sans-serif';
    ctx.fillText('Scan this QR code to get started', width / 2, titleY + 80);

    // URL text - smaller and narrower
    const urlY = titleY + 180;
    ctx.fillStyle = '#888888';
    ctx.font = '36px sans-serif';
    ctx.fillText('Or visit:', width / 2, urlY);
    ctx.fillStyle = '#141414';
    const urlText = staffLoginUrl.replace('https://', '').replace('http://', '');
    ctx.fillText(urlText, width / 2, urlY + 50);

    // Powered by footer (dark bar at bottom) - small
    const footerHeight = 100;
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, height - footerHeight, width, footerHeight);
    
    ctx.fillStyle = '#8a8070';
    ctx.font = '32px sans-serif';
    ctx.fillText('Powered by Drop Dead Salon Software', width / 2, height - 35);

    // Download
    const link = document.createElement('a');
    link.download = 'drop-dead-staff-signup-qr.png';
    link.href = pdfCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Staff Signup QR Code
          <Sparkles className="w-3 h-3 text-amber-500" />
        </CardTitle>
        <CardDescription>
          Print this for your handbook or post in the break room
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden QR canvas for export */}
        <div ref={qrRef} className="hidden">
          <QRCodeCanvas 
            value={staffLoginUrl} 
            size={180}
            level="H"
            marginSize={0}
            fgColor="#141414"
          />
        </div>

        {/* Preview thumbnail - matches preview exactly */}
        <div className="flex justify-center p-4 bg-gradient-to-b from-[hsl(40,30%,96%)] to-[hsl(35,25%,92%)] rounded-xl">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden relative" style={{ width: '110px', aspectRatio: '8.5/11' }}>
            {/* Header - small */}
            <div className="bg-gradient-to-r from-[hsl(0,0%,8%)] to-[hsl(0,0%,15%)] py-1 px-2 text-center">
              <span className="text-[4px] text-[hsl(40,30%,95%)] font-display tracking-wider block">DROP DEAD®</span>
              <span className="text-[2.5px] text-[hsl(40,30%,70%)] tracking-[0.15em] uppercase block">Staff Portal</span>
            </div>
            
            {/* Main content */}
            <div className="flex flex-col items-center px-2 py-2">
              {/* Welcome message */}
              <div className="text-center mb-1.5">
                <p className="text-[4px] font-display tracking-wide text-foreground">WELCOME TO THE TEAM!</p>
                <p className="text-[3px] text-muted-foreground leading-tight max-w-[70px] mx-auto">
                  You need to create your profile on our software system.
                </p>
              </div>
              
              {/* QR Code */}
              <div className="p-1.5 bg-white rounded border border-[hsl(35,30%,88%)] shadow-sm">
                <QRCodeCanvas 
                  value={staffLoginUrl} 
                  size={50}
                  level="H"
                  marginSize={0}
                  fgColor="#141414"
                />
              </div>
              
              {/* Title */}
              <div className="mt-1.5 text-center">
                <p className="text-[4px] font-display tracking-[0.1em] uppercase">Create Your Account</p>
                <p className="text-[3px] text-muted-foreground">Scan this QR code to get started</p>
              </div>
              
              {/* URL - smaller */}
              <div className="mt-1 text-center max-w-[65px]">
                <p className="text-[2.5px] text-muted-foreground">
                  Or visit: <span className="text-foreground break-all">{staffLoginUrl.replace('https://', '')}</span>
                </p>
              </div>
            </div>
            
            {/* Footer - absolutely positioned */}
            <div className="absolute bottom-0 left-0 right-0 bg-[hsl(0,0%,8%)] py-0.5 flex items-center justify-center">
              <span className="text-[2.5px] text-[hsl(40,30%,55%)]">Powered by Drop Dead Salon Software</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Create Your Staff Account</p>
          <p className="text-xs mt-1 break-all">{staffLoginUrl}</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  QR Code Preview
                </DialogTitle>
              </DialogHeader>
              <QRCodePDFPreview staffLoginUrl={staffLoginUrl} />
              <div className="flex justify-end">
                <Button onClick={() => { downloadQRCode(); setPreviewOpen(false); }} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={downloadQRCode} 
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffInvitations() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allInvitations, isLoading: loadingAll } = useStaffInvitations();
  const { data: pendingInvitations, isLoading: loadingPending } = usePendingInvitations();
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();

  const filteredInvitations = allInvitations?.filter(invitation => {
    const searchLower = searchQuery.toLowerCase();
    return (
      invitation.email.toLowerCase().includes(searchLower) ||
      invitation.role.toLowerCase().includes(searchLower) ||
      invitation.inviter_name?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = pendingInvitations?.length || 0;
  const acceptedCount = allInvitations?.filter(i => i.status === 'accepted').length || 0;
  const expiredCount = allInvitations?.filter(i => 
    i.status === 'pending' && isPast(new Date(i.expires_at))
  ).length || 0;

  const getActualStatus = (invitation: typeof allInvitations extends (infer T)[] | undefined ? T : never) => {
    if (invitation.status === 'pending' && isPast(new Date(invitation.expires_at))) {
      return 'expired';
    }
    return invitation.status;
  };

  const InvitationCard = ({ invitation }: { invitation: typeof allInvitations extends (infer T)[] | undefined ? T : never }) => {
    const actualStatus = getActualStatus(invitation);
    const statusConfig = STATUS_CONFIG[actualStatus] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;
    const isExpired = actualStatus === 'expired';
    const isPending = actualStatus === 'pending';

    return (
      <Card className={cn(
        "transition-all",
        isPending && "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
        isExpired && "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20 opacity-75"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{invitation.email}</span>
                <Badge className={cn("text-xs", ROLE_COLORS[invitation.role])}>
                  {invitation.role}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <StatusIcon className={cn("h-3.5 w-3.5", statusConfig.color)} />
                  {statusConfig.label}
                </span>
                <span>
                  Invited by {invitation.inviter_name}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(new Date(invitation.created_at), 'PPpp')}
                  </TooltipContent>
                </Tooltip>
              </div>

              {isPending && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                </p>
              )}

              {actualStatus === 'accepted' && invitation.accepted_at && (
                <p className="text-xs text-green-600 mt-1">
                  Accepted {format(new Date(invitation.accepted_at), 'PPp')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(isPending || isExpired) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resendInvitation.mutate({ 
                    email: invitation.email, 
                    role: invitation.role 
                  })}
                  disabled={resendInvitation.isPending}
                  className="gap-1"
                >
                  <RefreshCw className={cn(
                    "h-3.5 w-3.5",
                    resendInvitation.isPending && "animate-spin"
                  )} />
                  Resend
                </Button>
              )}
              
              {isPending && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel the invitation for {invitation.email}. 
                        They will no longer be able to use it to create an account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelInvitation.mutate(invitation.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Invitation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display">Staff Invitations</h1>
            <p className="text-muted-foreground">
              Invite new team members to create their accounts
            </p>
          </div>
          <InviteStaffDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Send className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedCount}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/30">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, role, or inviter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1">
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 text-xs px-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {loadingPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingInvitations?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No pending invitations</p>
                  <InviteStaffDialog />
                </CardContent>
              </Card>
            ) : (
              pendingInvitations?.map(invitation => (
                <InvitationCard key={invitation.id} invitation={invitation} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 mt-4">
            {loadingAll ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredInvitations?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {searchQuery ? 'No invitations found matching your search' : 'No invitations yet'}
                </CardContent>
              </Card>
            ) : (
              filteredInvitations?.map(invitation => (
                <InvitationCard key={invitation.id} invitation={invitation} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* QR Code and Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Card */}
          <QRCodeCard />

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="w-4 h-4" />
                How Invitations Work
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong className="text-foreground">Sending:</strong> When you invite someone, they receive an invitation to create their account.
              </p>
              <p>
                <strong className="text-foreground">Expiration:</strong> Invitations expire after 7 days. You can resend expired invitations.
              </p>
              <p>
                <strong className="text-foreground">Auto-approval:</strong> Users who sign up with a valid invitation are automatically approved with their assigned role.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
