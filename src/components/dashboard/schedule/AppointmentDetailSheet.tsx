import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  DollarSign,
  ChevronDown,
  Copy,
  CheckCircle,
  UserCheck,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Lock,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';
import { useAppointmentNotes } from '@/hooks/useAppointmentNotes';
import { useAuth } from '@/contexts/AuthContext';

interface AppointmentDetailSheetProps {
  appointment: PhorestAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
  isUpdating?: boolean;
}

const STATUS_CONFIG: Record<AppointmentStatus, { 
  bg: string; 
  text: string; 
  label: string;
  icon: React.ElementType;
}> = {
  booked: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Booked', icon: Calendar },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed', icon: CheckCircle },
  checked_in: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Checked In', icon: UserCheck },
  completed: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Completed', icon: CheckCircle },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled', icon: XCircle },
  no_show: { bg: 'bg-red-100', text: 'text-red-800', label: 'No Show', icon: AlertTriangle },
};

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  booked: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onOpenChange,
  onStatusChange,
  isUpdating = false,
}: AppointmentDetailSheetProps) {
  const { user, hasPermission } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [confirmAction, setConfirmAction] = useState<AppointmentStatus | null>(null);
  
  const { notes, addNote, deleteNote, isAdding } = useAppointmentNotes(appointment?.phorest_id || null);
  const canAddNotes = hasPermission('add_appointment_notes');

  if (!appointment) return null;

  const statusConfig = STATUS_CONFIG[appointment.status];
  const StatusIcon = statusConfig.icon;
  const availableTransitions = STATUS_TRANSITIONS[appointment.status];

  const handleCopyPhone = () => {
    if (appointment.client_phone) {
      navigator.clipboard.writeText(appointment.client_phone);
      toast.success('Phone number copied');
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote({ note: newNote.trim(), isPrivate: isPrivateNote });
    setNewNote('');
    setIsPrivateNote(false);
  };

  const handleStatusChange = (status: AppointmentStatus) => {
    if (status === 'cancelled' || status === 'no_show') {
      setConfirmAction(status);
    } else {
      onStatusChange(appointment.phorest_id, status);
    }
  };

  const confirmStatusChange = () => {
    if (confirmAction) {
      onStatusChange(appointment.phorest_id, confirmAction);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl">{appointment.client_name}</SheetTitle>
                <SheetDescription className="mt-1">
                  {appointment.service_name}
                </SheetDescription>
              </div>
              
              {/* Status Badge with Dropdown */}
              {availableTransitions.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn('gap-1.5', statusConfig.bg, statusConfig.text)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <StatusIcon className="h-3.5 w-3.5" />
                      )}
                      {statusConfig.label}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableTransitions.map((status) => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      return (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={cn(config.text)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          Mark as {config.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge className={cn(statusConfig.bg, statusConfig.text)}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1" />
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Appointment Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Appointment Details
                </h4>
                
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatTime12h(appointment.start_time)} - {formatTime12h(appointment.end_time)}
                    </span>
                  </div>

                  {appointment.total_price && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${appointment.total_price.toFixed(2)}</span>
                    </div>
                  )}

                  {appointment.stylist_profile && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={appointment.stylist_profile.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(appointment.stylist_profile.display_name || appointment.stylist_profile.full_name).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{appointment.stylist_profile.display_name || appointment.stylist_profile.full_name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Client Contact */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Client Contact
                </h4>
                
                <div className="grid gap-2">
                  {appointment.client_phone && (
                    <div className="flex items-center justify-between">
                      <a 
                        href={`tel:${appointment.client_phone}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.client_phone}</span>
                      </a>
                      <Button variant="ghost" size="icon" onClick={handleCopyPhone}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Notes Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Staff Notes
                </h4>

                {/* Existing Notes */}
                {notes.length > 0 && (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div 
                        key={note.id} 
                        className={cn(
                          'p-3 rounded-lg border',
                          note.is_private && 'bg-muted/50 border-dashed'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={note.author?.photo_url || undefined} />
                              <AvatarFallback className="text-[8px]">
                                {(note.author?.display_name || note.author?.full_name || '?').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {note.author?.display_name || note.author?.full_name}
                            </span>
                            {note.is_private && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {note.author_id === user?.id && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="mt-1 text-sm">{note.note}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(note.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Note Form */}
                {canAddNotes && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={2}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="private-note"
                          checked={isPrivateNote}
                          onCheckedChange={setIsPrivateNote}
                        />
                        <Label htmlFor="private-note" className="text-sm flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Private note
                        </Label>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || isAdding}
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4 mr-1" />
                        )}
                        Add Note
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Appointment Notes from Phorest */}
              {appointment.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Booking Notes
                    </h4>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions Footer */}
          {availableTransitions.length > 0 && (
            <div className="p-4 border-t bg-muted/30 flex gap-2 justify-end">
              {availableTransitions.includes('checked_in') && (
                <Button 
                  variant="default" 
                  onClick={() => handleStatusChange('checked_in')}
                  disabled={isUpdating}
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  Check In
                </Button>
              )}
              {availableTransitions.includes('completed') && (
                <Button 
                  variant="default" 
                  onClick={() => handleStatusChange('completed')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Complete
                </Button>
              )}
              {availableTransitions.includes('cancelled') && (
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'cancelled' ? 'Cancel Appointment?' : 'Mark as No Show?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'cancelled' 
                ? 'This will cancel the appointment. The client may need to be notified.'
                : 'This will mark the client as a no-show for this appointment.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              className={confirmAction === 'no_show' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
