import { useState } from 'react';
import { parseISO } from 'date-fns';
import { useFormatDate } from '@/hooks/useFormatDate';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { tokens } from '@/lib/design-tokens';
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
  Loader2,
  UserPlus,
  X,
  Repeat,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import type { PhorestAppointment, AppointmentStatus } from '@/hooks/usePhorestCalendar';
import { useAppointmentNotes } from '@/hooks/useAppointmentNotes';
import { useAppointmentAssistants } from '@/hooks/useAppointmentAssistants';
import { useAssistantConflictCheck } from '@/hooks/useAssistantConflictCheck';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useTeamDirectory } from '@/hooks/useEmployeeProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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
  booked: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', label: 'Booked', icon: Calendar },
  confirmed: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', label: 'Confirmed', icon: CheckCircle },
  checked_in: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', label: 'Checked In', icon: UserCheck },
  completed: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-300', label: 'Completed', icon: CheckCircle },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'Cancelled', icon: XCircle },
  no_show: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', label: 'No Show', icon: AlertTriangle },
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
  const { effectiveOrganization } = useOrganizationContext();
  const { formatCurrency } = useFormatCurrency();
  const { formatDate } = useFormatDate();
  const [newNote, setNewNote] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [confirmAction, setConfirmAction] = useState<AppointmentStatus | null>(null);
  const [showAssistantPicker, setShowAssistantPicker] = useState(false);
  const [cancellingFuture, setCancellingFuture] = useState(false);
  const queryClient = useQueryClient();
  const { notes, addNote, deleteNote, isAdding } = useAppointmentNotes(appointment?.phorest_id || null);
  const { assistants, assignAssistant, removeAssistant, updateAssistDuration, isAssigning } = useAppointmentAssistants(appointment?.id || null);
  const canAddNotes = hasPermission('add_appointment_notes');
  const canManageAssistants = hasPermission('create_appointments') || hasPermission('view_team_appointments');

  // Fetch team for assistant picker
  const { data: teamMembers = [] } = useTeamDirectory(undefined, {
    organizationId: effectiveOrganization?.id,
  });

  // Conflict check for assistant picker
  const conflictMap = useAssistantConflictCheck(
    appointment?.appointment_date || null,
    appointment?.start_time || null,
    appointment?.end_time || null,
    appointment?.id || null,
    showAssistantPicker,
  );

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

  const handleCancelAllFuture = async () => {
    if (!appointment.recurrence_group_id) return;
    setCancellingFuture(true);
    try {
      const { error } = await supabase
        .from('phorest_appointments')
        .update({ status: 'cancelled' })
        .eq('recurrence_group_id', appointment.recurrence_group_id)
        .gte('appointment_date', appointment.appointment_date)
        .neq('status', 'cancelled');

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['phorest-appointments'] });
      toast.success('All future recurring appointments cancelled');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Failed to cancel future appointments', { description: err.message });
    } finally {
      setCancellingFuture(false);
    }
  };

  // Calculate recurrence info
  const recurrenceLabel = appointment.recurrence_group_id && appointment.recurrence_rule
    ? `Recurring (${(appointment.recurrence_index ?? 0) + 1} of ${(appointment.recurrence_rule as any)?.occurrences ?? '?'})`
    : null;

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
                      size={tokens.button.inline}
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
              {/* Redo Badge */}
              {(appointment as any).is_redo && (
                <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-sm">
                    <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-700 dark:text-amber-300">Redo / Adjustment</span>
                  </div>
                  {(appointment as any).redo_reason && (
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-300">
                      {(appointment as any).redo_reason}
                    </Badge>
                  )}
                </div>
              )}

              {/* Recurring Badge */}
              {recurrenceLabel && (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{recurrenceLabel}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleCancelAllFuture}
                    disabled={cancellingFuture}
                  >
                    {cancellingFuture ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    Cancel all future
                  </Button>
                </div>
              )}

              {/* Appointment Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Appointment Details
                </h4>
                
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}</span>
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
                      <span>{formatCurrency(appointment.total_price)}</span>
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

              {/* Assistant Stylists */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Assistant Stylists
                  </h4>
                  {canManageAssistants && (
                    <Button
                      variant="ghost"
                      size={tokens.button.inline}
                      className="h-7 gap-1 text-xs"
                      onClick={() => setShowAssistantPicker(!showAssistantPicker)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                  )}
                </div>

                {/* Current assistants */}
                {assistants.length > 0 ? (
                  <div className="space-y-2">
                    {assistants.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={a.assistant_profile?.photo_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(a.assistant_profile?.display_name || a.assistant_profile?.full_name || '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{a.assistant_profile?.display_name || a.assistant_profile?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {canManageAssistants && (
                            <input
                              type="number"
                              min={0}
                              max={480}
                              placeholder="min"
                              defaultValue={a.assist_duration_minutes ?? ''}
                              className="w-14 h-6 text-xs text-center border rounded bg-background px-1"
                              onBlur={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                if (val !== (a.assist_duration_minutes ?? null)) {
                                  updateAssistDuration({ assignmentId: a.id, minutes: val });
                                }
                              }}
                            />
                          )}
                          {canManageAssistants && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeAssistant(a.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No assistants assigned</p>
                )}

                {/* Assistant picker */}
                {showAssistantPicker && (
                  <div className="border rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
                    {teamMembers
                      .filter(m => 
                        m.user_id !== appointment.stylist_user_id &&
                        !assistants.some(a => a.assistant_user_id === m.user_id) &&
                        (m.roles?.includes('stylist_assistant') || m.roles?.includes('stylist') || m.roles?.includes('admin'))
                      )
                      .map(member => {
                        const conflicts = conflictMap.get(member.user_id) || [];
                        return (
                          <button
                            key={member.user_id}
                            className="flex flex-col w-full p-1.5 rounded hover:bg-muted text-left text-sm"
                            disabled={isAssigning}
                            onClick={() => {
                              if (effectiveOrganization?.id) {
                                assignAssistant({
                                  assistantUserId: member.user_id,
                                  organizationId: effectiveOrganization.id,
                                });
                                setShowAssistantPicker(false);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={member.photo_url || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {(member.display_name || member.full_name || '?').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.display_name || member.full_name}</span>
                              {conflicts.length > 0 && (
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 ml-auto" />
                              )}
                            </div>
                            {conflicts.map((c, i) => (
                              <span key={i} className="text-[11px] text-orange-600 dark:text-orange-400 pl-7 leading-tight">
                                {c.role === 'assistant' ? 'Assisting' : 'Busy'} {formatTime12h(c.startTime)}–{formatTime12h(c.endTime)} ({c.serviceName} for {c.clientName})
                              </span>
                            ))}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

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
                          {formatDate(new Date(note.created_at), 'MMM d, h:mm a')}
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
                        size={tokens.button.card} 
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
