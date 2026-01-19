import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  ExternalLink,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useLocations, 
  useCreateLocation, 
  useUpdateLocation, 
  useDeleteLocation,
  type Location 
} from '@/hooks/useLocations';

type LocationFormData = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  booking_url: string;
  google_maps_url: string;
  hours: string;
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
  hours: 'Tue–Sat: 10am–6pm',
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
      hours: location.hours || 'Tue–Sat: 10am–6pm',
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
      hours: formData.hours || null,
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
                      {location.hours && (
                        <p className="flex items-center gap-2">
                          <Clock className="w-3 h-3 shrink-0" />
                          {location.hours}
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
          <DialogContent className="max-w-lg">
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
            
            <div className="space-y-4 py-4">
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
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    value={formData.hours}
                    onChange={(e) => setFormData(f => ({ ...f, hours: e.target.value }))}
                    placeholder="e.g., Tue–Sat: 10am–6pm"
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
            </div>
            
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
