import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LocationSelect } from '@/components/ui/location-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MapPin, Phone, Mail, Instagram, User, Calendar, Clock, Award, PartyPopper, Star, Building2, ExternalLink, Eye, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeamDirectory } from '@/hooks/useEmployeeProfile';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useLocations } from '@/hooks/useLocations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { differenceInYears, differenceInMonths, parseISO, format, setYear, isSameDay, differenceInDays, isBefore } from 'date-fns';
import { useUpcomingAnniversaries, useTodaysAnniversaries, MILESTONE_YEARS, getAnniversaryMilestone } from '@/hooks/useAnniversaries';
import { cn } from '@/lib/utils';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStrikeCounts } from '@/hooks/useStaffStrikes';
import { AddStrikeDialog } from '@/components/dashboard/AddStrikeDialog';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  stylist: 'Stylist',
  receptionist: 'Receptionist',
  assistant: 'Assistant',
  stylist_assistant: 'Stylist Assistant',
  admin_assistant: 'Admin Assistant',
  operations_assistant: 'Operations Assistant',
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border-amber-300 dark:from-amber-900/40 dark:to-yellow-900/40 dark:text-amber-300 dark:border-amber-700',
  admin: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  manager: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  stylist: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  receptionist: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  assistant: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  stylist_assistant: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
  admin_assistant: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  operations_assistant: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
};

const rolePriority: Record<string, number> = {
  super_admin: 0,
  admin: 1,
  manager: 2,
  stylist: 3,
  receptionist: 4,
  stylist_assistant: 5,
  admin_assistant: 6,
  operations_assistant: 7,
  assistant: 8,
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTimeAtCompany(hireDate: string | null): string {
  if (!hireDate) return '';
  const start = parseISO(hireDate);
  const years = differenceInYears(new Date(), start);
  const months = differenceInMonths(new Date(), start) % 12;
  
  if (years > 0 && months > 0) {
    return `${years}y ${months}mo`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  return 'New';
}

function getAnniversaryInfo(hireDate: string | null): { isToday: boolean; isUpcoming: boolean; years: number; daysUntil: number } | null {
  if (!hireDate) return null;
  
  const start = parseISO(hireDate);
  const today = new Date();
  const thisYearAnniversary = setYear(start, today.getFullYear());
  
  // Check if today is anniversary
  if (isSameDay(thisYearAnniversary, today)) {
    const years = differenceInYears(today, start);
    if (years >= 1) {
      return { isToday: true, isUpcoming: false, years, daysUntil: 0 };
    }
  }
  
  // Check upcoming (within 7 days)
  let anniversaryDate = thisYearAnniversary;
  if (isBefore(thisYearAnniversary, today)) {
    anniversaryDate = setYear(start, today.getFullYear() + 1);
  }
  
  const daysUntil = differenceInDays(anniversaryDate, today);
  const yearsAtAnniversary = differenceInYears(anniversaryDate, start);
  
  if (daysUntil > 0 && daysUntil <= 7 && yearsAtAnniversary >= 1) {
    return { isToday: false, isUpcoming: true, years: yearsAtAnniversary, daysUntil };
  }
  
  return null;
}

export default function TeamDirectory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const { data: team = [], isLoading } = useTeamDirectory(locationFilter === 'all' ? undefined : locationFilter);
  const { data: locations = [] } = useLocations();
  const { data: currentUserProfile } = useEmployeeProfile();
  const { data: todaysAnniversaries = [] } = useTodaysAnniversaries();
  const { data: upcomingAnniversaries = [] } = useUpcomingAnniversaries(30);
  const { isViewingAsUser } = useViewAs();
  const { roles: actualRoles } = useAuth();
  
  const isSuperAdmin = currentUserProfile?.is_super_admin;
  const isAdmin = actualRoles.includes('admin');
  
  // Get strike counts for all team members (only for admins)
  const userIds = team.map(m => m.user_id);
  const { data: strikeCounts = {} } = useStrikeCounts(isAdmin ? userIds : []);

  // Get all unique roles from team members for filter dropdown
  const allRoles = [...new Set(team.flatMap(member => 
    member.is_super_admin ? ['super_admin', ...member.roles] : member.roles
  ))].sort((a, b) => (rolePriority[a] ?? 99) - (rolePriority[b] ?? 99));

  const filteredTeam = team.filter(member => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        member.full_name?.toLowerCase().includes(query) ||
        member.display_name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.specialties?.some(s => s.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'super_admin') {
        if (!member.is_super_admin) return false;
      } else {
        if (!member.roles.includes(roleFilter)) return false;
      }
    }
    
    return true;
  });

  const sortByRole = (members: typeof team) => {
    return [...members].sort((a, b) => {
      const aHighestRole = Math.min(...a.roles.map(r => rolePriority[r] ?? 99));
      const bHighestRole = Math.min(...b.roles.map(r => rolePriority[r] ?? 99));
      return aHighestRole - bHighestRole;
    });
  };

  // Group team members by location - members with multiple locations appear in all their locations
  const teamByLocation = filteredTeam.reduce((acc, member) => {
    const memberLocations = member.location_ids && member.location_ids.length > 0 
      ? member.location_ids 
      : [member.location_id || 'unassigned'];
    
    memberLocations.forEach(loc => {
      const locationKey = loc || 'unassigned';
      if (!acc[locationKey]) acc[locationKey] = [];
      // Avoid duplicates
      if (!acc[locationKey].some(m => m.id === member.id)) {
        acc[locationKey].push(member);
      }
    });
    
    return acc;
  }, {} as Record<string, typeof team>);

  Object.keys(teamByLocation).forEach(loc => {
    teamByLocation[loc] = sortByRole(teamByLocation[loc]);
  });

  const getLocationName = (id: string) => {
    return locations.find(l => l.id === id)?.name || id;
  };

  const sortedLocationIds = Object.keys(teamByLocation).sort((a, b) => {
    if (a === 'unassigned') return 1;
    if (b === 'unassigned') return -1;
    return getLocationName(a).localeCompare(getLocationName(b));
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-medium mb-2">Team Directory</h1>
          <p className="text-muted-foreground">
            View all team members across salon locations.
          </p>
        </div>

        {/* Today's Anniversaries Banner */}
        {todaysAnniversaries.length > 0 && (
          <Card className="mb-6 border-2 border-amber-400/50 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                  <PartyPopper className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    🎉 Work Anniversary Today!
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {todaysAnniversaries.map((a, i) => (
                      <span 
                        key={a.id}
                        className={cn(
                          isViewingAsUser && a.isCurrentUser && "bg-primary/20 px-1.5 py-0.5 rounded ring-1 ring-primary/30"
                        )}
                      >
                        {i > 0 && (i === todaysAnniversaries.length - 1 ? ' and ' : ', ')}
                        <strong className="inline-flex items-center gap-1">
                          {a.display_name || a.full_name}
                          {isViewingAsUser && a.isCurrentUser && <Eye className="w-3 h-3 text-primary" />}
                        </strong> ({a.years} year{a.years > 1 ? 's' : ''})
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Anniversaries */}
        {upcomingAnniversaries.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Upcoming Work Anniversaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {upcomingAnniversaries.slice(0, 5).map(anniversary => {
                  const isMilestone = MILESTONE_YEARS.includes(anniversary.years);
                  const isImpersonatedUser = isViewingAsUser && anniversary.isCurrentUser;
                  return (
                    <div
                      key={anniversary.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border",
                        isImpersonatedUser 
                          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/30"
                          : isMilestone
                            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                            : "bg-muted/50 border-border"
                      )}
                    >
                      <Avatar className={cn(
                        "w-8 h-8",
                        isImpersonatedUser && "ring-2 ring-primary"
                      )}>
                        <AvatarImage src={anniversary.photo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {anniversary.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium leading-tight flex items-center gap-1">
                          {anniversary.display_name || anniversary.full_name}
                          {isImpersonatedUser && <Eye className="w-3 h-3 text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {isMilestone && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          {anniversary.years} year{anniversary.years > 1 ? 's' : ''} • {format(anniversary.anniversaryDate, 'MMM d')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {allRoles.map(role => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role] || role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <LocationSelect
            value={locationFilter}
            onValueChange={setLocationFilter}
            triggerClassName="w-full sm:w-48"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTeam.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No team members found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedLocationIds.map(locationId => {
              const members = teamByLocation[locationId];
              return (
                <div key={locationId}>
                  <h2 className="text-lg font-display font-medium mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {locationId === 'unassigned' ? 'No Location Assigned' : getLocationName(locationId)}
                    <Badge variant="secondary" className="ml-2">{members.length}</Badge>
                  </h2>
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {members.map(member => (
                      <TeamMemberCard 
                        key={member.id} 
                        member={member} 
                        locations={locations}
                        isSuperAdmin={isSuperAdmin}
                        isAdmin={isAdmin}
                        strikeCount={strikeCounts[member.user_id] || 0}
                        onViewProfile={() => navigate(`/dashboard/profile/${member.user_id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface TeamMemberCardProps {
  member: {
    id: string;
    user_id: string;
    full_name: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    instagram: string | null;
    tiktok: string | null;
    stylist_level: string | null;
    specialties: string[] | null;
    roles: string[];
    work_days: string[] | null;
    hire_date: string | null;
    location_ids: string[] | null;
    location_schedules: Record<string, string[]>;
    is_super_admin: boolean | null;
  };
  locations: Array<{ id: string; name: string }>;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  strikeCount?: number;
  onViewProfile?: () => void;
}

function TeamMemberCard({ member, locations, isSuperAdmin, isAdmin, strikeCount = 0, onViewProfile }: TeamMemberCardProps) {
  const [strikeDialogOpen, setStrikeDialogOpen] = useState(false);
  const timeAtCompany = getTimeAtCompany(member.hire_date);
  const memberLocations = member.location_ids || [];
  const hasSchedules = Object.keys(member.location_schedules).length > 0;
  const anniversaryInfo = getAnniversaryInfo(member.hire_date);
  
  const getLocationName = (id: string) => {
    return locations.find(l => l.id === id)?.name || id;
  };

  // Get primary role to display
  const getPrimaryRole = () => {
    if (member.is_super_admin) return { key: 'super_admin', label: roleLabels['super_admin'], color: roleColors['super_admin'] };
    const sortedRoles = [...member.roles].sort((a, b) => (rolePriority[a] ?? 99) - (rolePriority[b] ?? 99));
    const primaryRole = sortedRoles[0];
    return primaryRole ? { key: primaryRole, label: roleLabels[primaryRole] || primaryRole, color: roleColors[primaryRole] || '' } : null;
  };

  const primaryRole = getPrimaryRole();

  // Format phone number for display
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };
  
  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 relative",
        anniversaryInfo?.isToday && "ring-2 ring-amber-400",
        isSuperAdmin && "cursor-pointer"
      )}
      onClick={isSuperAdmin ? onViewProfile : undefined}
    >
    <CardContent className="p-4">
        {/* Super admin edit indicator - bottom right */}
        {isSuperAdmin && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1.5 bg-primary/90 text-primary-foreground rounded-md shadow-sm">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">View/Edit Profile</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Strike indicator for admins - clickable to add strike */}
        {isAdmin && (
          <>
            <div className="absolute top-3 right-3 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStrikeDialogOpen(true);
                      }}
                      className={cn(
                        "p-1.5 rounded-full shadow-sm transition-all hover:scale-110",
                        strikeCount > 0
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    {strikeCount > 0
                      ? `${strikeCount} active strike${strikeCount > 1 ? 's' : ''} – Click to add`
                      : 'Add strike'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <AddStrikeDialog
              userId={member.user_id}
              userName={member.display_name || member.full_name}
              open={strikeDialogOpen}
              onOpenChange={setStrikeDialogOpen}
            />
          </>
        )}
        
        {/* Main content - horizontal layout */}
        <div className="flex gap-4">
          {/* Larger Avatar */}
          <div className="relative shrink-0">
            <Avatar className="w-16 h-16 ring-2 ring-background shadow-md">
              <AvatarImage src={member.photo_url || undefined} alt={member.full_name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-muted to-muted/50 text-lg font-semibold">
                {member.full_name?.charAt(0) || <User className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
            {/* Anniversary indicator */}
            {anniversaryInfo?.isToday && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                <PartyPopper className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Info column */}
          <div className="flex-1 min-w-0">
            {/* Name and actions row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-sm leading-tight truncate">
                  {member.display_name || member.full_name}
                </h3>
                {/* Meta info */}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {timeAtCompany && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAtCompany}
                    </span>
                  )}
                  {memberLocations.length > 1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-primary font-medium cursor-help">
                            <Building2 className="w-3 h-3" />
                            {memberLocations.length}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {memberLocations.map(id => getLocationName(id)).join(', ')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              
              {/* Role badge + Calendar on right side */}
              <div className="flex items-center gap-2 shrink-0">
                {primaryRole && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] font-medium h-5 px-2", primaryRole.color)}
                  >
                    {primaryRole.label}
                  </Badge>
                )}
                {hasSchedules && (
                  <HoverCard openDelay={100} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <button 
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors opacity-60 hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent side="left" align="start" className="w-56 p-3">
                      <p className="text-xs font-semibold mb-2">Schedule</p>
                      <div className="space-y-2">
                        {memberLocations.map(locId => {
                          const schedule = member.location_schedules[locId] || [];
                          return (
                            <div key={locId}>
                              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                {getLocationName(locId)}
                              </p>
                              <div className="flex gap-0.5">
                                {DAYS_OF_WEEK.map(day => (
                                  <span
                                    key={day}
                                    className={cn(
                                      "text-[10px] w-5 h-5 flex items-center justify-center rounded font-medium",
                                      schedule.includes(day)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/50 text-muted-foreground/40'
                                    )}
                                  >
                                    {day.charAt(0)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </div>
            
            {/* Phone number displayed */}
            {member.phone && (
              <a 
                href={`tel:${member.phone}`}
                className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3 h-3" />
                {formatPhone(member.phone)}
              </a>
            )}
            
            {/* Contact icons row */}
            <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
              {member.email && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={`mailto:${member.email}`}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs max-w-48 truncate">{member.email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {member.instagram && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">{member.instagram}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
