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
import { Camera, Loader2, Save, User, Phone, Mail, Instagram, MapPin, AlertCircle, CheckCircle2, Circle, Globe, Clock, FileText, Calendar } from 'lucide-react';
import { useEmployeeProfile, useUpdateEmployeeProfile, useUploadProfilePhoto } from '@/hooks/useEmployeeProfile';
import { useAuth } from '@/contexts/AuthContext';
import { locations } from '@/data/stylists';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const specialtyOptions = [
  'EXTENSIONS', 'BLONDING', 'CREATIVE COLOR', 'AIRTOUCH', 
  'COLOR BLOCKING', 'LAYERED CUTS', 'CUSTOM CUTS', 'BALAYAGE',
  'VIVIDS', 'CORRECTIVE COLOR', 'KERATIN', 'BRIDAL'
];

export default function MyProfile() {
  const { user, roles } = useAuth();
  const { data: profile, isLoading } = useEmployeeProfile();
  const updateProfile = useUpdateEmployeeProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    email: '',
    phone: '',
    instagram: '',
    tiktok: '',
    location_id: '',
    location_ids: [] as string[],
    stylist_level: '',
    specialties: [] as string[],
    dd_certified: false,
    emergency_contact: '',
    emergency_phone: '',
    bio: '',
    work_days: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      // Support both old location_id and new location_ids
      const locationIds = profile.location_ids?.length 
        ? profile.location_ids 
        : profile.location_id 
          ? [profile.location_id] 
          : [];
      
      setFormData({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        instagram: profile.instagram || '',
        tiktok: profile.tiktok || '',
        location_id: profile.location_id || '',
        location_ids: locationIds,
        stylist_level: profile.stylist_level || '',
        specialties: profile.specialties || [],
        dd_certified: profile.dd_certified || false,
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
        bio: (profile as any).bio || '',
        work_days: profile.work_days || [],
      });
    }
  }, [profile]);

  // Calculate profile completion
  const profileFields = useMemo(() => {
    const isStylist = roles.includes('stylist');
    
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
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
        return { ...prev, specialties: prev.specialties.filter(s => s !== specialty) };
      }
      // Limit to 4 specialties
      if (prev.specialties.length >= 4) {
        toast.error('You can select up to 4 specialties');
        return prev;
      }
      return { ...prev, specialties: [...prev.specialties, specialty] };
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
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="pl-10"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="How you'd like to be called"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10"
                      placeholder="(480) 555-1234"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      className="pl-10"
                      placeholder="@yourhandle"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                      className="pl-10"
                      placeholder="@yourhandle"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Locations</Label>
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

          {/* Work Days Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Work Schedule
              </CardTitle>
              <CardDescription>
                Select the days you typically work. This helps the team know when you're available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => {
                  const isSelected = formData.work_days.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          work_days: isSelected
                            ? prev.work_days.filter(d => d !== day.key)
                            : [...prev.work_days, day.key],
                        }));
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-xs font-medium">{day.key}</span>
                    </button>
                  );
                })}
              </div>
              {formData.work_days.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Working {formData.work_days.length} day{formData.work_days.length !== 1 ? 's' : ''} per week
                </p>
              )}
            </CardContent>
          </Card>

          {/* Professional Info - Only for stylists */}
          {roles.includes('stylist') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stylist_level">Stylist Level</Label>
                  <Select
                    value={formData.stylist_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stylist_level: value }))}
                  >
                    <SelectTrigger>
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
                  <Label>Specialties <span className="text-muted-foreground text-xs font-normal">(select up to 4)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyOptions.map(specialty => {
                      const isSelected = formData.specialties.includes(specialty);
                      const isDisabled = !isSelected && formData.specialties.length >= 4;
                      return (
                        <Badge
                          key={specialty}
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn(
                            "cursor-pointer transition-all",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => !isDisabled && toggleSpecialty(specialty)}
                        >
                          {specialty}
                        </Badge>
                      );
                    })}
                  </div>
                  {formData.specialties.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.specialties.length}/4 selected
                    </p>
                  )}
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
                  <Label htmlFor="emergency_contact">Contact Name</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Contact Phone</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_phone: e.target.value }))}
                    placeholder="(480) 555-1234"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
