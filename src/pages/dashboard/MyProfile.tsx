import { useState, useEffect, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Loader2, Save, User, Phone, Mail, Instagram, MapPin, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { useEmployeeProfile, useUpdateEmployeeProfile, useUploadProfilePhoto } from '@/hooks/useEmployeeProfile';
import { useAuth } from '@/contexts/AuthContext';
import { locations } from '@/data/stylists';
import { cn } from '@/lib/utils';

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
    location_id: '',
    stylist_level: '',
    specialties: [] as string[],
    emergency_contact: '',
    emergency_phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        instagram: profile.instagram || '',
        location_id: profile.location_id || '',
        stylist_level: profile.stylist_level || '',
        specialties: profile.specialties || [],
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
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
      { key: 'location_id', label: 'Location', filled: !!formData.location_id },
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
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
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
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                  >
                    <SelectTrigger>
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                  <Label>Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyOptions.map(specialty => (
                      <Badge
                        key={specialty}
                        variant={formData.specialties.includes(specialty) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
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
