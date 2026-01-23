import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Scissors, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign,
  Loader2,
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';
import { PhorestClient } from './BookingWizard';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
}

interface ConfirmStepProps {
  client: PhorestClient | null;
  services: Service[];
  stylistName: string;
  date: Date;
  time: string;
  totalDuration: number;
  totalPrice: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
  locationName: string;
}

export function ConfirmStep({
  client,
  services,
  stylistName,
  date,
  time,
  totalDuration,
  totalPrice,
  notes,
  onNotesChange,
  onConfirm,
  isLoading,
  locationName,
}: ConfirmStepProps) {
  const formatTime12h = (t: string) => {
    const [hours, minutes] = t.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Client Card */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {client?.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{client?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {client?.phone || client?.email || 'No contact info'}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Appointment Details
            </h3>

            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {/* Location */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-medium text-sm">{locationName}</div>
                </div>
              </div>

              {/* Stylist */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Stylist</div>
                  <div className="font-medium text-sm">{stylistName}</div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date & Time</div>
                  <div className="font-medium text-sm">
                    {format(date, 'EEEE, MMMM d, yyyy')} at {formatTime12h(time)}
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="font-medium text-sm">
                    {totalDuration >= 60 
                      ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60 > 0 ? `${totalDuration % 60}m` : ''}`
                      : `${totalDuration}m`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Services
            </h3>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-xs text-muted-foreground">{service.duration_minutes} min</div>
                    </div>
                  </div>
                  {service.price !== null && (
                    <span className="font-semibold text-sm">${service.price.toFixed(0)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes (optional)
              </h3>
            </div>
            <Textarea
              placeholder="Add any special requests or notes..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="min-h-[80px] resize-none bg-muted/50 border-0"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer with total and confirm */}
      <div className="p-4 border-t border-border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Estimated Total</span>
          <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
        </div>
        <Button
          className="w-full h-12 text-base font-semibold"
          disabled={isLoading}
          onClick={onConfirm}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Booking...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
}
