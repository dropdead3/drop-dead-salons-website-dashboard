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
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

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

// QR Code Card Component
function QRCodeCard() {
  const qrRef = useRef<HTMLDivElement>(null);
  const staffLoginUrl = getStaffLoginUrl();

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create a new canvas with padding and branding
    const paddedCanvas = document.createElement('canvas');
    const ctx = paddedCanvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const textHeight = 80;
    paddedCanvas.width = canvas.width + padding * 2;
    paddedCanvas.height = canvas.height + padding * 2 + textHeight;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);

    // Draw QR code
    ctx.drawImage(canvas, padding, padding);

    // Add title text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Create Your Staff Account', paddedCanvas.width / 2, canvas.height + padding + 35);
    
    // Add URL text
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('Scan to get started', paddedCanvas.width / 2, canvas.height + padding + 60);

    // Download
    const link = document.createElement('a');
    link.download = 'staff-signup-qr-code.png';
    link.href = paddedCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Staff Signup QR Code
        </CardTitle>
        <CardDescription>
          Print this for your handbook or post in the break room
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={qrRef}
          className="flex justify-center p-4 bg-white rounded-lg"
        >
          <QRCodeCanvas 
            value={staffLoginUrl} 
            size={160}
            level="H"
            marginSize={2}
          />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Create Your Staff Account</p>
          <p className="text-xs mt-1 break-all">{staffLoginUrl}</p>
        </div>
        <Button 
          onClick={downloadQRCode} 
          variant="outline" 
          className="w-full gap-2"
        >
          <Download className="w-4 h-4" />
          Download for Print
        </Button>
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
            <h1 className="text-2xl font-display font-bold">Staff Invitations</h1>
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
