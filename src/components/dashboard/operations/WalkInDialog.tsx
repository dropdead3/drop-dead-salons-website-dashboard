import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Loader2, Clock, Ban, Check, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useStylistAvailability, formatAvailability } from '@/hooks/useStylistAvailability';
import { getLevelSlug, findLevelBasedPrice, getLevelNumber } from '@/utils/levelPricing';
import { cn } from '@/lib/utils';

interface WalkInDialogProps {
  locationId?: string;
  onSuccess?: () => void;
}

interface ServiceWithRestrictions {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  price: number | null;
  allow_same_day_booking: boolean;
  lead_time_days: number;
  same_day_restriction_reason: string | null;
}

export function WalkInDialog({ locationId, onSuccess }: WalkInDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [stylistId, setStylistId] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch available services with same-day booking info
  const { data: services } = useQuery({
    queryKey: ['phorest-services-walkin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_services')
        .select('id, name, category, duration_minutes, price, allow_same_day_booking, lead_time_days, same_day_restriction_reason')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as ServiceWithRestrictions[];
    },
  });

  // Group services by category
  const servicesByCategory = useMemo(() => {
    if (!services) return {};
    return services.reduce((acc, service) => {
      const category = service.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {} as Record<string, ServiceWithRestrictions[]>);
  }, [services]);

  // Get category list with selection counts
  const categories = useMemo(() => {
    return Object.keys(servicesByCategory).map(category => {
      const categoryServices = servicesByCategory[category];
      const selectedCount = categoryServices.filter(s => selectedServiceIds.includes(s.id)).length;
      return { name: category, count: categoryServices.length, selectedCount };
    });
  }, [servicesByCategory, selectedServiceIds]);

  // Get selected service details
  const selectedServiceDetails = useMemo(() => {
    if (!services) return [];
    return services.filter(s => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  // Calculate total duration for availability filtering
  const totalDuration = useMemo(() => {
    return selectedServiceDetails.reduce((sum, s) => sum + (s.duration_minutes || 60), 0);
  }, [selectedServiceDetails]);

  // Fetch available stylists using the smart availability hook
  const { data: availableStylists, isLoading: stylistsLoading } = useStylistAvailability(
    locationId,
    totalDuration || 60
  );

  // Get selected stylist for level-based pricing
  const selectedStylist = availableStylists?.find(s => s.user_id === stylistId);
  const levelSlug = getLevelSlug(selectedStylist?.stylist_level);
  const levelNumber = getLevelNumber(selectedStylist?.stylist_level);

  // Calculate total price with level-based pricing
  const calculatedTotalPrice = useMemo(() => {
    return selectedServiceDetails.reduce((sum, service) => {
      if (levelSlug) {
        const levelPrice = findLevelBasedPrice(service.name, levelSlug);
        return sum + (levelPrice ?? service.price ?? 0);
      }
      return sum + (service.price ?? 0);
    }, 0);
  }, [selectedServiceDetails, levelSlug]);

  // Get price for a specific service based on stylist level
  const getServicePrice = (service: ServiceWithRestrictions): number => {
    if (levelSlug) {
      const levelPrice = findLevelBasedPrice(service.name, levelSlug);
      return levelPrice ?? service.price ?? 0;
    }
    return service.price ?? 0;
  };

  // Toggle service selection
  const toggleService = (serviceId: string, allowSameDay: boolean) => {
    if (!allowSameDay) return; // Don't allow selecting restricted services
    
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  // Create walk-in appointment
  const createWalkIn = useMutation({
    mutationFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = format(new Date(), 'HH:mm');
      
      // Combine service names
      const serviceNames = selectedServiceDetails.map(s => s.name).join(' + ');
      
      // Calculate end time
      const [hours, mins] = now.split(':').map(Number);
      const endMinutes = hours * 60 + mins + totalDuration;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('phorest_appointments')
        .insert({
          phorest_id: `walk-in-${Date.now()}`,
          appointment_date: today,
          start_time: now,
          end_time: endTime,
          client_name: clientName || 'Walk-in',
          client_phone: clientPhone || null,
          service_name: serviceNames,
          service_category: selectedServiceDetails[0]?.category || null,
          status: 'checked_in',
          total_price: calculatedTotalPrice,
          stylist_user_id: stylistId || null,
          location_id: locationId !== 'all' ? locationId : null,
          is_new_client: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Walk-in added to queue');
      queryClient.invalidateQueries({ queryKey: ['todays-queue'] });
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error('Failed to create walk-in', { description: error.message });
    },
  });

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setSelectedServiceIds([]);
    setStylistId('');
    setActiveCategory(null);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientPhone(formatPhoneNumber(e.target.value));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Quick Walk-In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col overflow-visible">
        <DialogHeader>
          <DialogTitle className="font-display">Add Walk-In Client</DialogTitle>
          <DialogDescription>
            Create a walk-in appointment and add them directly to the queue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-5 py-4 px-1">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-sm font-medium">Client Name</Label>
              <Input
                id="clientName"
                placeholder="Guest"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone" className="text-sm font-medium">Phone</Label>
              <Input
                id="clientPhone"
                placeholder="(555) 555-5555"
                value={clientPhone}
                onChange={handlePhoneChange}
                className="h-11"
              />
            </div>
          </div>
          
          {/* Service Selection - Category-first navigation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {activeCategory ? (
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {activeCategory}
                  </button>
                ) : (
                  'Pick a Service Category'
                )}
              </Label>
              {selectedServiceIds.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {selectedServiceIds.length} selected • {totalDuration} min
                </span>
              )}
            </div>
            <ScrollArea className="h-[240px] border rounded-lg bg-card">
              <div className="p-3 space-y-1">
                {!activeCategory ? (
                  // Category list view
                  categories.map((category) => (
                    <div
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className="flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{category.name}</span>
                        {category.selectedCount > 0 && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {category.selectedCount} selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">{category.count} services</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))
                ) : (
                  // Services list view for active category
                  servicesByCategory[activeCategory]?.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    const isDisabled = service.allow_same_day_booking === false;
                    const price = getServicePrice(service);
                    
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id, service.allow_same_day_booking !== false)}
                        className={cn(
                          "flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all",
                          isDisabled 
                            ? "opacity-40 cursor-not-allowed" 
                            : "cursor-pointer hover:bg-accent/50",
                          isSelected && !isDisabled && "bg-primary/10 ring-1 ring-primary/20"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                          isDisabled ? "border-muted-foreground/20 bg-muted/50" : "border-muted-foreground/40",
                          isSelected && !isDisabled && "bg-primary border-primary"
                        )}>
                          {isDisabled ? (
                            <Ban className="w-3 h-3 text-muted-foreground/50" />
                          ) : isSelected ? (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          ) : null}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-sm font-medium",
                            isDisabled && "text-muted-foreground"
                          )}>
                            {service.name}
                          </span>
                          {isDisabled && service.same_day_restriction_reason && (
                            <p className="text-xs text-destructive/70 mt-0.5">
                              {service.same_day_restriction_reason}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {service.duration_minutes}m
                          </span>
                          <span className={cn(
                            "text-sm font-semibold tabular-nums min-w-[52px]",
                            isDisabled ? "text-muted-foreground" : "text-foreground"
                          )}>
                            ${price}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Stylist Selection */}
          <div className="space-y-2">
            <Label htmlFor="stylist" className="text-sm font-medium">Assign to Stylist</Label>
            <Select value={stylistId} onValueChange={setStylistId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={stylistsLoading ? "Loading..." : "Select a stylist"} />
              </SelectTrigger>
              <SelectContent>
                {availableStylists?.length === 0 && !stylistsLoading && (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    No stylists available for this service duration today
                  </div>
                )}
                {availableStylists?.map((stylist) => (
                  <SelectItem key={stylist.user_id} value={stylist.user_id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{stylist.display_name || stylist.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatAvailability(stylist.availableMinutes)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Summary */}
          {selectedServiceDetails.length > 0 && (
            <div className="border rounded-xl p-4 bg-muted/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Price Summary
                </div>
                {levelNumber && (
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                    Level {levelNumber} pricing
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-sm">
                {selectedServiceDetails.map((service) => (
                  <div key={service.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-3">{service.name}</span>
                    <span className="font-mono tabular-nums">${getServicePrice(service)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t text-base">
                <span>Total</span>
                <span className="font-mono tabular-nums">${calculatedTotalPrice}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createWalkIn.mutate()}
            disabled={createWalkIn.isPending || selectedServiceIds.length === 0}
          >
            {createWalkIn.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Add to Queue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
