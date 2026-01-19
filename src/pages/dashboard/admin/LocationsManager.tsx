import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Plus, 
  Pencil, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  MapPin,
  Phone,
  Clock,
  Calendar,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useLocations, 
  useCreateLocation, 
  useUpdateLocation, 
  useDeleteLocation,
  formatHoursForDisplay,
  type Location,
  type HoursJson,
  type DayHours,
  type HolidayClosure,
} from '@/hooks/useLocations';
import { format } from 'date-fns';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const defaultHours: HoursJson = {
  monday: { closed: true },
  tuesday: { open: '10:00', close: '18:00' },
  wednesday: { open: '10:00', close: '18:00' },
  thursday: { open: '10:00', close: '18:00' },
  friday: { open: '10:00', close: '18:00' },
  saturday: { open: '10:00', close: '18:00' },
  sunday: { closed: true },
};

type LocationFormData = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  booking_url: string;
  google_maps_url: string;
  hours: string;
  hours_json: HoursJson;
  holiday_closures: HolidayClosure[];
  is_active: boolean;
  display_order: number;
};

const emptyForm: LocationFormData = {
  id: '',
  name: '',
  address: '',
  city: '',
  phone: '',
  booking_url: '',
  google_maps_url: '',
  hours: '',
  hours_json: defaultHours,
  holiday_closures: [],
  is_active: true,
  display_order: 0,
};

export default function LocationsManager() {
  const { data: locations = [], isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(emptyForm);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setFormData({
      ...emptyForm,
      display_order: locations.length + 1,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      phone: location.phone,
      booking_url: location.booking_url || '',
      google_maps_url: location.google_maps_url || '',
      hours: location.hours || '',
      hours_json: location.hours_json || defaultHours,
      holiday_closures: location.holiday_closures || [],
      is_active: location.is_active,
      display_order: location.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const locationData = {
      id: formData.id || formData.name.toLowerCase().replace(/\s+/g, '-'),
      name: formData.name,
      address: formData.address,
      city: formData.city,
      phone: formData.phone,
      booking_url: formData.booking_url || null,
      google_maps_url: formData.google_maps_url || null,
      hours: formatHoursForDisplay(formData.hours_json),
      hours_json: formData.hours_json,
      holiday_closures: formData.holiday_closures,
      is_active: formData.is_active,
      display_order: formData.display_order,
    };

    if (editingLocation) {
      await updateLocation.mutateAsync({ id: editingLocation.id, ...locationData });
    } else {
      await createLocation.mutateAsync(locationData);
    }
    setIsDialogOpen(false);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const current = locations[index];
    const previous = locations[index - 1];
    
    await Promise.all([
      updateLocation.mutateAsync({ id: current.id, display_order: previous.display_order }),
      updateLocation.mutateAsync({ id: previous.id, display_order: current.display_order }),
    ]);
  };

  const handleMoveDown = async (index: number) => {
    if (index === locations.length - 1) return;
    const current = locations[index];
    const next = locations[index + 1];
    
    await Promise.all([
      updateLocation.mutateAsync({ id: current.id, display_order: next.display_order }),
      updateLocation.mutateAsync({ id: next.id, display_order: current.display_order }),
    ]);
  };

  const handleToggleActive = async (location: Location) => {
    await updateLocation.mutateAsync({ id: location.id, is_active: !location.is_active });
  };

  const updateDayHours = (day: typeof DAYS[number], field: keyof DayHours, value: string | boolean) => {
    setFormData(f => ({
      ...f,
      hours_json: {
        ...f.hours_json,
        [day]: {
          ...f.hours_json[day],
          [field]: value,
        },
      },
    }));
  };

  const addHoliday = () => {
    if (!newHolidayDate || !newHolidayName) return;
    setFormData(f => ({
      ...f,
      holiday_closures: [...f.holiday_closures, { date: newHolidayDate, name: newHolidayName }],
    }));
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  const removeHoliday = (index: number) => {
    setFormData(f => ({
      ...f,
      holiday_closures: f.holiday_closures.filter((_, i) => i !== index),
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Locations</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage salon locations displayed across the website
            </p>
          </div>
          
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Location
          </Button>
        </div>

        {/* Locations List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">
              Loading locations...
            </Card>
          ) : locations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No locations yet</p>
              <p className="text-sm mt-1">Add your first salon location above</p>
            </Card>
          ) : (
            locations.map((location, index) => (
              <Card
                key={location.id}
                className={cn(
                  "group transition-all duration-200 hover:shadow-sm",
                  !location.is_active && "opacity-60"
                )}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity pt-1">
                    <button
                      className="p-0.5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      className="p-0.5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === locations.length - 1}
                      onClick={() => handleMoveDown(index)}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Location info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-medium">{location.name}</h3>
                      {!location.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {location.address}, {location.city}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-3 h-3 shrink-0" />
                        {location.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatHoursForDisplay(location.hours_json) || location.hours || 'No hours set'}
                      </p>
                      {location.holiday_closures && location.holiday_closures.length > 0 && (
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {location.holiday_closures.length} holiday closure{location.holiday_closures.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={() => handleToggleActive(location)}
                    />
                    <button
                      className="p-2 rounded-md hover:bg-muted transition-colors"
                      onClick={() => handleOpenEdit(location)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 rounded-md hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{location.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this location. Staff assigned to this location will need to be reassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteLocation.mutate(location.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation 
                  ? 'Update the location details below'
                  : 'Enter the details for the new location'
                }
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="hours">Hours</TabsTrigger>
                <TabsTrigger value="holidays">Holidays</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Location Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., North Mesa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))}
                      placeholder="e.g., 2036 N Gilbert Rd Ste 1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City, State, ZIP</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))}
                      placeholder="e.g., Mesa, AZ 85203"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                      placeholder="e.g., (480) 548-1886"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="booking_url">Booking URL (optional)</Label>
                    <Input
                      id="booking_url"
                      value={formData.booking_url}
                      onChange={(e) => setFormData(f => ({ ...f, booking_url: e.target.value }))}
                      placeholder="e.g., /booking?location=north-mesa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="google_maps_url">Google Maps URL (optional)</Label>
                    <Input
                      id="google_maps_url"
                      value={formData.google_maps_url}
                      onChange={(e) => setFormData(f => ({ ...f, google_maps_url: e.target.value }))}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(f => ({ ...f, is_active: checked }))}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="hours" className="space-y-4 py-4">
                {/* Weekend Presets */}
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  <span className="text-sm text-muted-foreground mr-2">Quick presets:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set Sat & Sun to closed
                      setFormData(f => ({
                        ...f,
                        hours_json: {
                          ...f.hours_json,
                          saturday: { closed: true },
                          sunday: { closed: true },
                        },
                      }));
                    }}
                  >
                    Close Weekends
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set Sat to 9-3, Sun closed
                      setFormData(f => ({
                        ...f,
                        hours_json: {
                          ...f.hours_json,
                          saturday: { open: '09:00', close: '15:00', closed: false },
                          sunday: { closed: true },
                        },
                      }));
                    }}
                  >
                    Sat 9–3, Sun Closed
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set both Sat & Sun to reduced hours
                      setFormData(f => ({
                        ...f,
                        hours_json: {
                          ...f.hours_json,
                          saturday: { open: '10:00', close: '16:00', closed: false },
                          sunday: { open: '11:00', close: '15:00', closed: false },
                        },
                      }));
                    }}
                  >
                    Weekend Reduced Hours
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set Mon closed (common for salons)
                      setFormData(f => ({
                        ...f,
                        hours_json: {
                          ...f.hours_json,
                          monday: { closed: true },
                          sunday: { closed: true },
                        },
                      }));
                    }}
                  >
                    Mon & Sun Closed
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Set operating hours for each day of the week
                </p>
                <div className="space-y-3">
                  {DAYS.map(day => {
                    const dayHours = formData.hours_json[day];
                    const isClosed = dayHours?.closed;
                    
                    return (
                      <div key={day} className="flex items-center gap-4 py-2 border-b last:border-0">
                        <div className="w-24">
                          <span className="text-sm font-medium">{DAY_LABELS[day]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!isClosed}
                            onCheckedChange={(open) => {
                              if (open) {
                                updateDayHours(day, 'closed', false);
                                if (!dayHours?.open) updateDayHours(day, 'open', '10:00');
                                if (!dayHours?.close) updateDayHours(day, 'close', '18:00');
                              } else {
                                updateDayHours(day, 'closed', true);
                              }
                            }}
                          />
                          <span className="text-xs text-muted-foreground w-12">
                            {isClosed ? 'Closed' : 'Open'}
                          </span>
                        </div>
                        {!isClosed && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={dayHours?.open || '10:00'}
                              onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                              className="w-28 h-8 text-sm"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={dayHours?.close || '18:00'}
                              onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                              className="w-28 h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Preview: <span className="text-foreground">{formatHoursForDisplay(formData.hours_json)}</span>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="holidays" className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Add dates when this location will be closed
                </p>
                
                {/* Add new holiday */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Holiday Name</Label>
                    <Input
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      placeholder="e.g., Christmas Day"
                      className="h-9"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={addHoliday}
                    disabled={!newHolidayDate || !newHolidayName}
                  >
                    Add
                  </Button>
                </div>
                
                {/* Holiday list */}
                {formData.holiday_closures.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    {formData.holiday_closures
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((holiday, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">{holiday.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(holiday.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                            </p>
                          </div>
                          <button
                            onClick={() => removeHoliday(index)}
                            className="p-1 hover:bg-destructive/10 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No holiday closures scheduled
                  </p>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!formData.name || !formData.address || !formData.city || !formData.phone}
              >
                {editingLocation ? 'Save Changes' : 'Add Location'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
