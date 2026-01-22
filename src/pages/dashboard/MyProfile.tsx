import { useState, useEffect, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Camera, Loader2, Save, User, Phone, Mail, Instagram, MapPin, AlertCircle, CheckCircle2, Circle, Globe, Clock, FileText, Calendar, Undo2, Cake, Star, X, ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useEmployeeProfile, useUpdateEmployeeProfile, useUploadProfilePhoto } from '@/hooks/useEmployeeProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useLocations, getClosedDaysArray } from '@/hooks/useLocations';
import { useLocationSchedules, useUpsertLocationSchedule } from '@/hooks/useLocationSchedules';
import { useSpecialtyOptions } from '@/hooks/useSpecialtyOptions';
import { locations as staticLocations } from '@/data/stylists';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
  { key: 'Fri', label: 'Friday' },
  { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];
const stylistLevels = ['LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'LEVEL 4'];

// Format phone number as XXX-XXX-XXXX
const formatPhoneNumber = (value: string) => {
  // Remove all non-numeric characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format with dashes
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

// Ensure social handle starts with @
const formatSocialHandle = (value: string) => {
  // Remove any existing @ symbols and trim
  const clean = value.replace(/@/g, '').trim();
  
  // Return empty if nothing left
  if (!clean) return '';
  
  // Add @ prefix
  return `@${clean}`;
};

export default function MyProfile() {
  const { user, roles: authRoles } = useAuth();
  const { viewAsUser, isViewingAsUser } = useViewAs();
  
  // Use effective roles: if impersonating a user, use their roles; otherwise use the logged-in user's roles
  const roles = isViewingAsUser && viewAsUser?.roles ? viewAsUser.roles : authRoles;
  
  const { data: profile, isLoading } = useEmployeeProfile();
  const { data: locations = [] } = useLocations();
  const { data: existingSchedules } = useLocationSchedules();
  const { data: specialtyOptions = [] } = useSpecialtyOptions();
  const upsertSchedule = useUpsertLocationSchedule();
  const updateProfile = useUpdateEmployeeProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedToast, setShowUnsavedToast] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    email: '',
    phone: '',
    instagram: '',
    tiktok: '',
    birthday: '',
    hire_date: '',
    location_id: '',
    location_ids: [] as string[],
    stylist_level: '',
    specialties: [] as string[],
    highlighted_services: [] as string[],
    dd_certified: false,
    emergency_contact: '',
    emergency_phone: '',
    bio: '',
    work_days: [] as string[],
    // Location-specific schedules: { locationId: ['Mon', 'Tue', ...] }
    location_schedules: {} as Record<string, string[]>,
  });

  const [initialFormData, setInitialFormData] = useState(formData);

  // Combined effect to load profile and schedules together
  useEffect(() => {
    if (profile) {
      // Support both old location_id and new location_ids
      const locationIds = profile.location_ids?.length 
        ? profile.location_ids 
        : profile.location_id 
          ? [profile.location_id] 
          : [];
      
      // Build location schedules from existing data
      const schedules: Record<string, string[]> = {};
      if (existingSchedules && existingSchedules.length > 0) {
        existingSchedules.forEach(schedule => {
          schedules[schedule.location_id] = schedule.work_days || [];
        });
      }
      
      const newFormData = {
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        instagram: profile.instagram || '',
        tiktok: profile.tiktok || '',
        birthday: (profile as any).birthday || '',
        hire_date: profile.hire_date || '',
        location_id: profile.location_id || '',
        location_ids: locationIds,
        stylist_level: profile.stylist_level || '',
        specialties: profile.specialties || [],
        highlighted_services: (profile as any).highlighted_services || [],
        dd_certified: profile.dd_certified || false,
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
        bio: (profile as any).bio || '',
        work_days: profile.work_days || [],
        location_schedules: schedules,
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
      setHasUnsavedChanges(false);
    }
  }, [profile, existingSchedules]);

  // Track changes and show toast
  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(isChanged);
    
    if (isChanged && !showUnsavedToast) {
      setShowUnsavedToast(true);
      toast.info('You have unsaved changes', {
        description: 'Remember to save your profile when you\'re done editing.',
        duration: 4000,
        id: 'unsaved-changes',
      });
    }
  }, [formData, initialFormData, showUnsavedToast]);

  // Calculate profile completion
  const profileFields = useMemo(() => {
    const isStylist = roles.includes('stylist') || roles.includes('stylist_assistant');
    
    const fields = [
      { key: 'photo', label: 'Profile Photo', filled: !!profile?.photo_url },
      { key: 'full_name', label: 'Full Name', filled: !!formData.full_name },
      { key: 'display_name', label: 'Display Name', filled: !!formData.display_name },
      { key: 'email', label: 'Email', filled: !!formData.email },
      { key: 'phone', label: 'Phone', filled: !!formData.phone },
      { key: 'instagram', label: 'Instagram', filled: !!formData.instagram },
      { key: 'location_ids', label: 'Location', filled: formData.location_ids.length > 0 },
      { key: 'work_days', label: 'Work Days', filled: formData.work_days.length > 0 },
      { key: 'emergency_contact', label: 'Emergency Contact', filled: !!formData.emergency_contact },
      { key: 'emergency_phone', label: 'Emergency Phone', filled: !!formData.emergency_phone },
    ];

    if (isStylist) {
      fields.push(
        { key: 'stylist_level', label: 'Stylist Level', filled: !!formData.stylist_level },
        { key: 'specialties', label: 'Specialties', filled: formData.specialties.length > 0 }
      );
    }

    return fields;
  }, [formData, profile?.photo_url, roles]);

  const completionPercentage = useMemo(() => {
    const filledCount = profileFields.filter(f => f.filled).length;
    return Math.round((filledCount / profileFields.length) * 100);
  }, [profileFields]);

  const missingFields = profileFields.filter(f => !f.filled);

  const isStylistRole = roles.includes('stylist') || roles.includes('stylist_assistant');

  // Validation for required fields
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (!formData.full_name.trim()) errors.push('Full Name is required');
    if (!formData.display_name.trim()) errors.push('Display Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phone.trim()) errors.push('Phone is required');
    if (!formData.instagram.trim()) errors.push('Instagram is required');
    if (formData.location_ids.length === 0) errors.push('At least one location is required');
    if (!formData.emergency_contact.trim()) errors.push('Emergency Contact is required');
    if (!formData.emergency_phone.trim()) errors.push('Emergency Phone is required');
    
    // Stylist-specific validation
    if (isStylistRole) {
      if (!formData.stylist_level) errors.push('Stylist Level is required');
      if (formData.specialties.length < 2) errors.push('At least 2 specialties are required');
      if (formData.specialties.length > 3) errors.push('Maximum 3 specialties allowed');
    }
    
    return errors;
  }, [formData, isStylistRole]);

  const isFormValid = validationErrors.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!isFormValid) {
      toast.error('Please fill in all required fields', {
        description: validationErrors.slice(0, 3).join(', ') + (validationErrors.length > 3 ? '...' : ''),
      });
      return;
    }
    
    // Save location schedules to the database - only for selected locations
    const schedulePromises = formData.location_ids
      .filter(locationId => formData.location_schedules[locationId] !== undefined)
      .map(locationId => 
        upsertSchedule.mutateAsync({ 
          locationId, 
          workDays: formData.location_schedules[locationId] || [] 
        })
      );
    
    try {
      if (schedulePromises.length > 0) {
        await Promise.all(schedulePromises);
      }
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast.error('Failed to save work schedule');
      return; // Stop if schedules fail - they're important
    }
    
    // Build profile update object with ONLY valid database columns
    // Explicitly exclude location_schedules which is NOT a database column
    const profileUpdate = {
      full_name: formData.full_name,
      display_name: formData.display_name,
      email: formData.email,
      phone: formData.phone,
      instagram: formData.instagram,
      tiktok: formData.tiktok,
      birthday: formData.birthday,
      hire_date: formData.hire_date || null,
      location_id: formData.location_id,
      location_ids: formData.location_ids,
      stylist_level: formData.stylist_level,
      specialties: formData.specialties,
      highlighted_services: formData.highlighted_services,
      dd_certified: formData.dd_certified,
      emergency_contact: formData.emergency_contact,
      emergency_phone: formData.emergency_phone,
      bio: formData.bio,
    };
    
    updateProfile.mutate(profileUpdate as any, {
      onSuccess: () => {
        setInitialFormData(formData);
        setHasUnsavedChanges(false);
        setShowUnsavedToast(false);
        toast.success('Profile saved successfully!');
      },
      onError: (error) => {
        console.error('Profile update error:', error);
        // Toast is already shown by the hook
      }
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto.mutate(file);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => {
      const isSelected = prev.specialties.includes(specialty);
      if (isSelected) {
        // Also remove from highlighted services if it was highlighted
        return { 
          ...prev, 
          specialties: prev.specialties.filter(s => s !== specialty),
          highlighted_services: prev.highlighted_services.filter(s => s !== specialty)
        };
      }
      // Limit to 3 specialties
      if (prev.specialties.length >= 3) {
        toast.error('You can select up to 3 specialties');
        return prev;
      }
      return { ...prev, specialties: [...prev.specialties, specialty] };
    });
  };

  const toggleHighlightedService = (service: string) => {
    setFormData(prev => {
      const isSelected = prev.highlighted_services.includes(service);
      if (isSelected) {
        return { ...prev, highlighted_services: prev.highlighted_services.filter(s => s !== service) };
      }
      // Limit to 3 highlighted services
      if (prev.highlighted_services.length >= 3) {
        toast.error('You can select up to 3 highlighted services');
        return prev;
      }
      return { ...prev, highlighted_services: [...prev.highlighted_services, service] };
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-medium mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your contact information and profile details.
          </p>
        </div>

        {/* Profile Completion Card */}
        <Card className={cn(
          "mb-6 border-2",
          completionPercentage === 100 
            ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
            : "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/30"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(completionPercentage / 100) * 176} 176`}
                    className={completionPercentage === 100 ? "text-green-500" : "text-amber-500"}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {completionPercentage}%
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium flex items-center gap-2">
                  {completionPercentage === 100 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Profile Complete!
                    </>
                  ) : (
                    <>
                      Profile {completionPercentage}% Complete
                    </>
                  )}
                </h3>
                {missingFields.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Missing fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {missingFields.slice(0, 5).map(field => (
                        <Badge key={field.key} variant="outline" className="text-xs">
                          <Circle className="w-2 h-2 mr-1" />
                          {field.label}
                        </Badge>
                      ))}
                      {missingFields.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{missingFields.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Photo</CardTitle>
              <CardDescription>Your photo will be visible to the team.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile?.photo_url || undefined} alt={profile?.full_name} />
                    <AvatarFallback className="text-2xl bg-muted">
                      {formData.full_name?.charAt(0) || <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    disabled={uploadPhoto.isPending}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  >
                    {uploadPhoto.isPending ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <Button type="button" variant="outline" onClick={handlePhotoClick} disabled={uploadPhoto.isPending}>
                    {uploadPhoto.isPending ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG. Max 5MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={cn("pl-10", !formData.full_name.trim() && "border-destructive/50")}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    className={cn(!formData.display_name.trim() && "border-destructive/50")}
                    placeholder="How you'd like to be called"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={cn("pl-10", !formData.email.trim() && "border-destructive/50")}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                      className={cn("pl-10", !formData.phone.trim() && "border-destructive/50")}
                      placeholder="480-555-1234"
                      maxLength={12}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: formatSocialHandle(e.target.value) }))}
                      onBlur={(e) => {
                        if (e.target.value && !e.target.value.startsWith('@')) {
                          setFormData(prev => ({ ...prev, instagram: formatSocialHandle(prev.instagram) }));
                        }
                      }}
                      className={cn("pl-10", !formData.instagram.trim() && "border-destructive/50")}
                      placeholder="@yourhandle"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <div className="relative">
                    <svg 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                    <Input
                      id="tiktok"
                      value={formData.tiktok}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiktok: formatSocialHandle(e.target.value) }))}
                      onBlur={(e) => {
                        if (e.target.value && !e.target.value.startsWith('@')) {
                          setFormData(prev => ({ ...prev, tiktok: formatSocialHandle(prev.tiktok) }));
                        }
                      }}
                      className="pl-10"
                      placeholder="@yourhandle"
                    />
                  </div>
                </div>
              </div>

              {/* Birthday & Start Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday" className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-pink-500" />
                    Birthday
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your birthday appears on the team calendar.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Start Date
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    When you joined the team.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Locations <span className="text-destructive">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {locations.map(loc => {
                    const isSelected = formData.location_ids.includes(loc.id);
                    return (
                      <Badge
                        key={loc.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer transition-all"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            location_ids: isSelected
                              ? prev.location_ids.filter(id => id !== loc.id)
                              : [...prev.location_ids, loc.id],
                            // Keep location_id in sync with first selected location
                            location_id: isSelected 
                              ? prev.location_ids.filter(id => id !== loc.id)[0] || ''
                              : prev.location_id || loc.id,
                          }));
                        }}
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        {loc.name}
                      </Badge>
                    );
                  })}
                </div>
                {formData.location_ids.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Working at {formData.location_ids.length} locations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Days Selection - Per Location */}
          {formData.location_ids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Preferred Work Schedule
                </CardTitle>
                <CardDescription>
                  Select the days you typically work at each location. Days cannot overlap between locations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.location_ids.map(locationId => {
                  const location = locations.find(l => l.id === locationId);
                  if (!location) return null;

                  const currentSchedule = formData.location_schedules[locationId] || [];
                  
                  // Get all days used by OTHER locations
                  const usedByOtherLocations = Object.entries(formData.location_schedules)
                    .filter(([locId]) => locId !== locationId)
                    .flatMap(([, days]) => days);

                  // Get days when this location is closed
                  const closedDays = getClosedDaysArray(location.hours_json);

                  return (
                    <div key={locationId} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{location.name}</span>
                        {currentSchedule.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {currentSchedule.length} day{currentSchedule.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {closedDays.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Closed {closedDays.join(' & ')}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = currentSchedule.includes(day.key);
                          const isUsedElsewhere = usedByOtherLocations.includes(day.key);
                          const isLocationClosed = closedDays.includes(day.key);
                          const isDisabled = isUsedElsewhere || isLocationClosed;
                          
                          const otherLocation = isUsedElsewhere 
                            ? locations.find(l => 
                                l.id !== locationId && 
                                formData.location_schedules[l.id]?.includes(day.key)
                              )
                            : null;

                          // Build tooltip text
                          let tooltipText: string | undefined;
                          if (isLocationClosed) {
                            tooltipText = `${location.name} is closed on ${day.label}`;
                          } else if (isUsedElsewhere) {
                            tooltipText = `Already scheduled at ${otherLocation?.name}`;
                          }
                          
                          return (
                            <button
                              key={day.key}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return;
                                setFormData(prev => ({
                                  ...prev,
                                  location_schedules: {
                                    ...prev.location_schedules,
                                    [locationId]: isSelected
                                      ? currentSchedule.filter(d => d !== day.key)
                                      : [...currentSchedule, day.key],
                                  },
                                }));
                              }}
                              title={tooltipText}
                              className={cn(
                                "flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all text-xs",
                                isSelected && "border-primary bg-primary/10 text-primary font-medium",
                                !isSelected && !isDisabled && "border-border hover:border-primary/50",
                                isLocationClosed && "border-muted bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through",
                                isUsedElsewhere && !isLocationClosed && "border-muted bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"
                              )}
                            >
                              {day.key}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Total days summary */}
                {Object.values(formData.location_schedules).flat().length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Total: {Object.values(formData.location_schedules).flat().length} day{Object.values(formData.location_schedules).flat().length !== 1 ? 's' : ''} per week across all locations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Professional Info - For stylists and stylist assistants */}
          {(roles.includes('stylist') || roles.includes('stylist_assistant')) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stylist_level">Stylist Level <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.stylist_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stylist_level: value }))}
                  >
                    <SelectTrigger className={cn(!formData.stylist_level && "border-destructive/50")}>
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stylistLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Specialties <span className="text-destructive">*</span>
                    <span className="text-muted-foreground text-xs font-normal ml-1">(select 2-3 required)</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between h-auto min-h-10 py-2",
                          formData.specialties.length < 2 && "border-destructive/50"
                        )}
                      >
                        <div className="flex flex-wrap gap-1 flex-1">
                          {formData.specialties.length > 0 ? (
                            formData.specialties.map(specialty => (
                              <Badge key={specialty} variant="secondary" className="mr-1 mb-1">
                                {specialty}
                                <button
                                  type="button"
                                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSpecialty(specialty);
                                  }}
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Select specialties...</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search specialties..." />
                        <CommandList>
                          <CommandEmpty>No specialty found.</CommandEmpty>
                          <CommandGroup>
                            {specialtyOptions.map(option => {
                              const specialty = option.name;
                              const isSelected = formData.specialties.includes(specialty);
                              const isDisabled = !isSelected && formData.specialties.length >= 3;
                              return (
                                <CommandItem
                                  key={specialty}
                                  value={specialty}
                                  disabled={isDisabled}
                                  onSelect={() => {
                                    if (!isDisabled) {
                                      toggleSpecialty(specialty);
                                    }
                                  }}
                                  className={cn(isDisabled && "opacity-50")}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {specialty}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className={cn(
                    "text-xs",
                    formData.specialties.length < 2 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {formData.specialties.length}/3 selected
                    {formData.specialties.length < 2 && " — Please select at least 2 specialties"}
                  </p>
                </div>

                {/* Highlighted Services for Website Card - uses specialty options */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Highlighted Services
                    <span className="text-muted-foreground text-xs font-normal">(select 2-3 from your specialties)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    These will appear as badges on your stylist card on the website homepage. Choose from your specialties above.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map(specialty => {
                      const isSelected = formData.highlighted_services.includes(specialty);
                      const isDisabled = !isSelected && formData.highlighted_services.length >= 3;
                      return (
                        <Badge
                          key={specialty}
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn(
                            "cursor-pointer transition-all",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => !isDisabled && toggleHighlightedService(specialty)}
                        >
                          {isSelected && <Star className="w-3 h-3 mr-1 fill-current" />}
                          {specialty}
                        </Badge>
                      );
                    })}
                  </div>
                  {formData.specialties.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Select specialties above first, then choose which to highlight.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.highlighted_services.length}/3 highlighted
                  </p>
                </div>

                {/* Bio for Website Card */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Website Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
                    placeholder="A short bio that appears when clients tap your card on the website (max 200 characters)"
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/200 characters • This appears on the flip side of your stylist card on the website
                  </p>
                </div>

                {/* Drop Dead Certified */}
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Label htmlFor="dd_certified" className="flex items-center gap-2 cursor-pointer">
                        <img 
                          src="/assets/dd75-icon.svg" 
                          alt="Drop Dead" 
                          className="w-5 h-5"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        Drop Dead Certified
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        I have completed the Drop Dead Extensions training program.
                      </p>
                    </div>
                    <Switch
                      id="dd_certified"
                      checked={formData.dd_certified}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dd_certified: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Homepage Visibility - Only for stylists with complete profiles */}
          {roles.includes('stylist') && (
            <Card className={cn(
              "border-2",
              profile?.homepage_visible 
                ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20"
                : profile?.homepage_requested
                  ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20"
                  : ""
            )}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website Visibility
                </CardTitle>
                <CardDescription>
                  Request to have your stylist card displayed on the salon website homepage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completionPercentage < 100 ? (
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Complete your profile first</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your profile must be 100% complete before you can request homepage visibility. 
                        You're currently at {completionPercentage}%.
                      </p>
                    </div>
                  </div>
                ) : profile?.homepage_visible ? (
                  <div className="flex items-start gap-3 p-4 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-green-800 dark:text-green-400">
                        You're visible on the website!
                      </p>
                      <p className="text-sm text-green-700/80 dark:text-green-400/70 mt-1">
                        Your stylist card is now displayed on the salon homepage. Clients can see your profile and book consultations with you.
                      </p>
                    </div>
                  </div>
                ) : profile?.homepage_requested ? (
                  <div className="flex items-start gap-3 p-4 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-amber-800 dark:text-amber-400">
                        Pending admin approval
                      </p>
                      <p className="text-sm text-amber-700/80 dark:text-amber-400/70 mt-1">
                        Your request to be featured on the homepage is being reviewed. An admin will approve it soon.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Request Homepage Visibility</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Toggle this on to request that your stylist card be added to the website.
                      </p>
                    </div>
                    <Switch
                      checked={false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateProfile.mutate({
                            homepage_requested: true,
                            homepage_requested_at: new Date().toISOString(),
                          }, {
                            onSuccess: () => {
                              toast.success('Homepage visibility requested! An admin will review your request.');
                            }
                          });
                        }
                      }}
                    />
                  </div>
                )}

                {/* Booking Status Toggle - only show if visible on homepage */}
                {profile?.homepage_visible && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Currently Booking</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Toggle off if you're not accepting new clients right now.
                      </p>
                    </div>
                    <Switch
                      checked={profile?.is_booking ?? true}
                      onCheckedChange={(checked) => {
                        updateProfile.mutate({ is_booking: checked });
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                Emergency Contact
              </CardTitle>
              <CardDescription>Who should we contact in case of emergency?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Contact Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    className={cn(!formData.emergency_contact.trim() && "border-destructive/50")}
                    placeholder="Emergency contact name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Contact Phone <span className="text-destructive">*</span></Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_phone: formatPhoneNumber(e.target.value) }))}
                    className={cn(!formData.emergency_phone.trim() && "border-destructive/50")}
                    placeholder="480-555-1234"
                    maxLength={12}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </form>

        {/* Sticky Save Bar */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 p-4 md:pl-[280px]"
            >
              <div className="max-w-3xl mx-auto">
                <div className="bg-primary text-primary-foreground rounded-xl shadow-lg px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground/80 animate-pulse" />
                    <span className="text-sm font-medium">You have unsaved changes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      onClick={() => {
                        setFormData(initialFormData);
                        setHasUnsavedChanges(false);
                        setShowUnsavedToast(false);
                        toast.info('Changes discarded');
                      }}
                    >
                      <Undo2 className="w-4 h-4 mr-1" />
                      Discard
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      disabled={updateProfile.isPending || upsertSchedule.isPending}
                      onClick={(e) => handleSubmit(e as any)}
                    >
                      {(updateProfile.isPending || upsertSchedule.isPending) ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save Now
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
