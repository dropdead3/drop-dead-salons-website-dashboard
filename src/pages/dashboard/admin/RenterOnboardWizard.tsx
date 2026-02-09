import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useRentalStations } from '@/hooks/useRentalStations';
import { useRenterOnboardingTasks } from '@/hooks/useRenterOnboarding';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, User, Building2, Shield, DollarSign,
  MapPin, ClipboardList, Loader2, Copy, CheckCircle, ChevronsUpDown,
  FileSignature, AlertTriangle, Store,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'identity', label: 'Renter Identity', icon: User },
  { id: 'license', label: 'License & Insurance', icon: Shield },
  { id: 'terms', label: 'Rental Terms', icon: DollarSign },
  { id: 'station', label: 'Station', icon: MapPin },
  { id: 'checklist', label: 'Checklist & Docs', icon: ClipboardList },
];

interface OnboardResult {
  success: boolean;
  boothRenterId: string;
  userId: string;
  contractId: string | null;
  stationAssigned: boolean;
  createdNewAccount: boolean;
  email?: string;
  password?: string;
  fullName?: string;
  message: string;
  rentalAgreementStatus?: string;
  rentalAgreementMessage?: string;
}

export default function RenterOnboardWizard() {
  const navigate = useNavigate();
  const { effectiveOrganization: organization } = useOrganizationContext();
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Identity mode
  const [identityMode, setIdentityMode] = useState<'existing' | 'new'>('existing');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [form, setForm] = useState({
    // Identity
    userId: '',
    fullName: '',
    email: '',
    businessName: '',
    ein: '',
    startDate: new Date().toISOString().split('T')[0],
    // License & Insurance
    licenseNumber: '',
    licenseState: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    // Contract
    rentAmount: '',
    rentFrequency: 'monthly',
    dueDay: '',
    securityDeposit: '',
    contractEndDate: '',
    includesUtilities: false,
    includesWifi: false,
    includesProducts: false,
    retailCommissionEnabled: false,
    retailCommissionRate: '',
    // Station
    stationId: '',
    // Docs
    generateRentalAgreement: false,
  });

  const updateField = (field: string, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  // Fetch available employees (not already booth renters)
  const { data: availableEmployees = [] } = useQuery({
    queryKey: ['available-booth-renter-employees', organization?.id, userSearch],
    queryFn: async () => {
      let query = supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, email, photo_url')
        .eq('organization_id', organization!.id)
        .order('full_name');

      if (userSearch) {
        query = query.or(`full_name.ilike.%${userSearch}%,email.ilike.%${userSearch}%`);
      }

      const { data: employees } = await query.limit(20);

      const { data: existingRenters } = await supabase
        .from('booth_renter_profiles' as any)
        .select('user_id')
        .eq('organization_id', organization!.id);

      const existingUserIds = new Set((existingRenters || []).map((r: any) => r.user_id));
      return (employees || []).filter(e => !existingUserIds.has(e.user_id));
    },
    enabled: !!organization?.id && identityMode === 'existing',
  });

  const selectedEmployee = availableEmployees.find(e => e.user_id === form.userId);

  // Fetch available stations
  const { data: stations } = useRentalStations(organization?.id);
  const availableStations = stations?.filter(s => s.is_available) || [];

  // Fetch onboarding tasks
  const { data: onboardingTasks } = useRenterOnboardingTasks(organization?.id);

  // Submit mutation
  const onboardMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        organizationId: organization?.id,
        createNewAccount: identityMode === 'new',
        businessName: form.businessName || undefined,
        ein: form.ein || undefined,
        startDate: form.startDate,
        licenseNumber: form.licenseNumber || undefined,
        licenseState: form.licenseState || undefined,
        insuranceProvider: form.insuranceProvider || undefined,
        insurancePolicyNumber: form.insurancePolicyNumber || undefined,
        insuranceExpiryDate: form.insuranceExpiryDate || undefined,
        stationId: form.stationId || undefined,
        generateRentalAgreement: form.generateRentalAgreement,
      };

      if (identityMode === 'new') {
        payload.email = form.email;
        payload.fullName = form.fullName;
      } else {
        payload.userId = form.userId;
      }

      // Contract fields
      if (form.rentAmount) {
        payload.rentAmount = parseFloat(form.rentAmount);
        payload.rentFrequency = form.rentFrequency;
        payload.dueDay = form.dueDay ? parseInt(form.dueDay) : undefined;
        payload.securityDeposit = form.securityDeposit ? parseFloat(form.securityDeposit) : undefined;
        payload.contractStartDate = form.startDate;
        payload.contractEndDate = form.contractEndDate || undefined;
        payload.includesUtilities = form.includesUtilities;
        payload.includesWifi = form.includesWifi;
        payload.includesProducts = form.includesProducts;
        payload.retailCommissionEnabled = form.retailCommissionEnabled;
        payload.retailCommissionRate = form.retailCommissionRate ? parseFloat(form.retailCommissionRate) : undefined;
      }

      const { data, error } = await supabase.functions.invoke('onboard-renter', {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as OnboardResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setShowResult(true);
      toast.success('Renter onboarded successfully');
    },
    onError: (error) => {
      toast.error('Failed to onboard renter', { description: error.message });
    },
  });

  const canProceed = () => {
    if (step === 0) {
      if (identityMode === 'existing') return !!form.userId;
      return !!form.fullName && !!form.email;
    }
    return true;
  };

  const copyCredentials = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Email: ${result.email}\nPassword: ${result.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link to="/dashboard/admin/booth-renters"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl lg:text-4xl">Renter Onboard Wizard</h1>
            <p className="text-muted-foreground mt-1">Set up a new booth renter with everything they need</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all text-xs font-medium w-full',
                    isActive && 'bg-primary text-primary-foreground',
                    isDone && 'bg-primary/10 text-primary cursor-pointer',
                    !isActive && !isDone && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden lg:inline truncate">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className="w-3 h-px bg-border hidden sm:block shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Step 0: Renter Identity */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg mb-1">Renter Identity</CardTitle>
                  <CardDescription>Select an existing person or create a new contractor account</CardDescription>
                </div>

                <RadioGroup
                  value={identityMode}
                  onValueChange={(v) => setIdentityMode(v as 'existing' | 'new')}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label htmlFor="mode-existing" className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    identityMode === 'existing' ? 'border-primary bg-primary/5' : 'border-border'
                  )}>
                    <RadioGroupItem value="existing" id="mode-existing" />
                    <div>
                      <p className="font-medium text-sm">Existing Person</p>
                      <p className="text-xs text-muted-foreground">Already in the system</p>
                    </div>
                  </Label>
                  <Label htmlFor="mode-new" className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    identityMode === 'new' ? 'border-primary bg-primary/5' : 'border-border'
                  )}>
                    <RadioGroupItem value="new" id="mode-new" />
                    <div>
                      <p className="font-medium text-sm">New Account</p>
                      <p className="text-xs text-muted-foreground">Create a fresh contractor account</p>
                    </div>
                  </Label>
                </RadioGroup>

                {identityMode === 'existing' ? (
                  <div className="space-y-2">
                    <Label>Select Person *</Label>
                    <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {selectedEmployee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={selectedEmployee.photo_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(selectedEmployee.display_name || selectedEmployee.full_name || 'U').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{selectedEmployee.display_name || selectedEmployee.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Search people...</span>
                          )}
                          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search..." value={userSearch} onValueChange={setUserSearch} />
                          <CommandList>
                            <CommandEmpty>No available people found.</CommandEmpty>
                            <CommandGroup>
                              {availableEmployees.map((emp) => (
                                <CommandItem
                                  key={emp.user_id}
                                  value={emp.user_id}
                                  onSelect={() => {
                                    updateField('userId', emp.user_id);
                                    setUserSearchOpen(false);
                                  }}
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={emp.photo_url || undefined} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span>{emp.display_name || emp.full_name}</span>
                                    <span className="text-xs text-muted-foreground">{emp.email}</span>
                                  </div>
                                  {form.userId === emp.user_id && <Check className="ml-auto h-4 w-4" />}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Full Name *</Label>
                      <Input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="Jane Smith" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Email *</Label>
                      <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="jane@studio.com" />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Business Name</Label>
                    <Input value={form.businessName} onChange={e => updateField('businessName', e.target.value)} placeholder="Jane's Hair Studio" />
                  </div>
                  <div>
                    <Label>EIN</Label>
                    <Input value={form.ein} onChange={e => updateField('ein', e.target.value)} placeholder="XX-XXXXXXX" />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={form.startDate} onChange={e => updateField('startDate', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: License & Insurance */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg mb-1">Licensing & Insurance</CardTitle>
                  <CardDescription>Cosmetology license and liability insurance details</CardDescription>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>License Number</Label>
                    <Input value={form.licenseNumber} onChange={e => updateField('licenseNumber', e.target.value)} placeholder="CO123456" />
                  </div>
                  <div>
                    <Label>License State</Label>
                    <Input value={form.licenseState} onChange={e => updateField('licenseState', e.target.value)} placeholder="CO" maxLength={2} />
                  </div>
                </div>
                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Liability Insurance</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Insurance Provider</Label>
                    <Input value={form.insuranceProvider} onChange={e => updateField('insuranceProvider', e.target.value)} placeholder="State Farm" />
                  </div>
                  <div>
                    <Label>Policy Number</Label>
                    <Input value={form.insurancePolicyNumber} onChange={e => updateField('insurancePolicyNumber', e.target.value)} placeholder="POL-12345" />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <Input type="date" value={form.insuranceExpiryDate} onChange={e => updateField('insuranceExpiryDate', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Rental Terms */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg mb-1">Rental Terms</CardTitle>
                  <CardDescription>Set up the first rental contract</CardDescription>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Rent Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" className="pl-7" value={form.rentAmount} onChange={e => updateField('rentAmount', e.target.value)} placeholder="1200" />
                    </div>
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select value={form.rentFrequency} onValueChange={v => updateField('rentFrequency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{form.rentFrequency === 'monthly' ? 'Due Day of Month' : 'Due Day of Week'}</Label>
                    {form.rentFrequency === 'monthly' ? (
                      <Input type="number" min="1" max="28" value={form.dueDay} onChange={e => updateField('dueDay', e.target.value)} placeholder="1" />
                    ) : (
                      <Select value={form.dueDay} onValueChange={v => updateField('dueDay', v)}>
                        <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                        <SelectContent>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                            <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label>Security Deposit</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" className="pl-7" value={form.securityDeposit} onChange={e => updateField('securityDeposit', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <Label>Contract End Date</Label>
                    <Input type="date" value={form.contractEndDate} onChange={e => updateField('contractEndDate', e.target.value)} />
                  </div>
                </div>

                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Included Amenities</h4>
                <div className="space-y-3">
                  {[
                    { key: 'includesUtilities', label: 'Utilities', desc: 'Electric, water, and HVAC' },
                    { key: 'includesWifi', label: 'WiFi', desc: 'Internet access included' },
                    { key: 'includesProducts', label: 'Back-bar Products', desc: 'Shampoo, conditioner, color' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch checked={form[key as keyof typeof form] as boolean} onCheckedChange={v => updateField(key, v)} />
                    </div>
                  ))}
                </div>

                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Retail Commission</h4>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Retail Commission</p>
                    <p className="text-xs text-muted-foreground">Renter earns commission on retail sales</p>
                  </div>
                  <Switch checked={form.retailCommissionEnabled} onCheckedChange={v => updateField('retailCommissionEnabled', v)} />
                </div>
                {form.retailCommissionEnabled && (
                  <div className="max-w-xs">
                    <Label>Commission Rate (%)</Label>
                    <Input type="number" min="0" max="100" value={form.retailCommissionRate} onChange={e => updateField('retailCommissionRate', e.target.value)} placeholder="10" />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Station Assignment */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg mb-1">Station Assignment</CardTitle>
                  <CardDescription>Assign a station or chair (optional — can be done later)</CardDescription>
                </div>
                {availableStations.length === 0 ? (
                  <div className="p-6 rounded-lg bg-muted/50 border border-dashed text-center">
                    <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No available stations. You can assign one later from the Renter Hub.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableStations.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => updateField('stationId', form.stationId === station.id ? '' : station.id)}
                        className={cn(
                          "p-4 rounded-lg border text-left transition-all",
                          form.stationId === station.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <p className="font-medium text-sm">{station.station_name}</p>
                          {form.stationId === station.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{station.station_type}</p>
                        {(station.monthly_rate || station.weekly_rate) && (
                          <p className="text-xs text-muted-foreground">
                            {station.monthly_rate ? `$${station.monthly_rate}/mo` : `$${station.weekly_rate}/wk`}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Checklist & Docs */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg mb-1">Onboarding Checklist & Documents</CardTitle>
                  <CardDescription>Review what will be set up for this renter</CardDescription>
                </div>

                {/* Onboarding Tasks Preview */}
                {onboardingTasks && onboardingTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Onboarding Tasks ({onboardingTasks.length})</h4>
                    <div className="space-y-1">
                      {onboardingTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 text-sm">
                          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{task.title}</span>
                          {task.required && <Badge variant="outline" className="text-[10px] ml-auto">Required</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PandaDoc toggle */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSignature className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">PandaDoc Rental Agreement</p>
                        <p className="text-xs text-muted-foreground">Generate and send a rental agreement for e-signature</p>
                      </div>
                    </div>
                    <Switch checked={form.generateRentalAgreement} onCheckedChange={v => updateField('generateRentalAgreement', v)} />
                  </div>
                </div>

                {/* Summary */}
                <Separator />
                <h4 className="text-sm font-medium text-muted-foreground">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">
                      {identityMode === 'new' ? `New: ${form.fullName}` : selectedEmployee?.display_name || selectedEmployee?.full_name || 'Selected'}
                    </span>
                  </div>
                  {form.businessName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business</span>
                      <span>{form.businessName}</span>
                    </div>
                  )}
                  {form.rentAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rent</span>
                      <span>${form.rentAmount}/{form.rentFrequency === 'monthly' ? 'mo' : 'wk'}</span>
                    </div>
                  )}
                  {form.stationId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Station</span>
                      <span>{availableStations.find(s => s.id === form.stationId)?.station_name || 'Assigned'}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <span>{form.startDate}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <Separator />
          <div className="flex items-center justify-between p-6">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                Next<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => onboardMutation.mutate()} disabled={onboardMutation.isPending || !canProceed()}>
                {onboardMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Onboarding...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" />Complete Onboarding</>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Renter Onboarded Successfully
            </DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{result.message}</p>

              {/* Credentials (new account only) */}
              {result.createdNewAccount && result.email && result.password && (
                <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Login Credentials</p>
                    <Button variant="ghost" size="sm" onClick={copyCredentials}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Email:</span> {result.email}</p>
                    <p><span className="text-muted-foreground">Password:</span> <code className="bg-background px-1.5 py-0.5 rounded text-xs">{result.password}</code></p>
                  </div>
                  <p className="text-xs text-amber-600">⚠️ Share these credentials securely. They won't be shown again.</p>
                </div>
              )}

              {/* Status items */}
              <div className="space-y-2 text-sm">
                {result.contractId && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Rental contract created</span>
                  </div>
                )}
                {result.stationAssigned && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Station assigned</span>
                  </div>
                )}
                {result.rentalAgreementStatus && (
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-primary" />
                    <span>{result.rentalAgreementMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => navigate('/dashboard/admin/booth-renters')} className="flex-1">
                  Back to Renter Hub
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowResult(false);
                  setStep(0);
                  setForm({
                    userId: '', fullName: '', email: '', businessName: '', ein: '',
                    startDate: new Date().toISOString().split('T')[0],
                    licenseNumber: '', licenseState: '', insuranceProvider: '',
                    insurancePolicyNumber: '', insuranceExpiryDate: '',
                    rentAmount: '', rentFrequency: 'monthly', dueDay: '', securityDeposit: '',
                    contractEndDate: '', includesUtilities: false, includesWifi: false,
                    includesProducts: false, retailCommissionEnabled: false, retailCommissionRate: '',
                    stationId: '', generateRentalAgreement: false,
                  });
                  setIdentityMode('existing');
                }}>
                  Onboard Another
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
