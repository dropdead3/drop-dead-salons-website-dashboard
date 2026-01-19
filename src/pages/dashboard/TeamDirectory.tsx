import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MapPin, Phone, Mail, Instagram, User, Calendar, Clock } from 'lucide-react';
import { useTeamDirectory } from '@/hooks/useEmployeeProfile';
import { useLocations } from '@/hooks/useLocations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { differenceInYears, differenceInMonths, parseISO, format } from 'date-fns';

const roleLabels: Record<string, string> = {
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

export default function TeamDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const { data: team = [], isLoading } = useTeamDirectory(locationFilter === 'all' ? undefined : locationFilter);
  const { data: locations = [] } = useLocations();

  const filteredTeam = team.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(query) ||
      member.display_name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.specialties?.some(s => s.toLowerCase().includes(query))
    );
  });

  const sortByRole = (members: typeof team) => {
    return [...members].sort((a, b) => {
      const aHighestRole = Math.min(...a.roles.map(r => rolePriority[r] ?? 99));
      const bHighestRole = Math.min(...b.roles.map(r => rolePriority[r] ?? 99));
      return aHighestRole - bHighestRole;
    });
  };

  const teamByLocation = filteredTeam.reduce((acc, member) => {
    const loc = member.location_id || 'unassigned';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(member);
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
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <h2 className="text-lg font-display font-medium mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {locationId === 'unassigned' ? 'No Location Assigned' : getLocationName(locationId)}
                    <Badge variant="secondary" className="ml-2">{members.length}</Badge>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {members.map(member => (
                      <TeamMemberCard key={member.id} member={member} locations={locations} />
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
  };
  locations: Array<{ id: string; name: string }>;
}

function TeamMemberCard({ member, locations }: TeamMemberCardProps) {
  const timeAtCompany = getTimeAtCompany(member.hire_date);
  const memberLocations = member.location_ids || [];
  const hasSchedules = Object.keys(member.location_schedules).length > 0;
  
  const getLocationName = (id: string) => {
    return locations.find(l => l.id === id)?.name || id;
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header: Avatar, Name, Roles, Calendar Icon */}
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
            <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
            <AvatarFallback className="bg-muted text-xl font-medium">
              {member.full_name?.charAt(0) || <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-medium text-lg leading-tight">
                  {member.display_name || member.full_name}
                </h3>
                {/* Time at company */}
                {timeAtCompany && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {timeAtCompany}
                  </p>
                )}
              </div>
              
              {/* Calendar Hover */}
              {hasSchedules && (
                <HoverCard openDelay={100} closeDelay={50}>
                  <HoverCardTrigger asChild>
                    <button className="p-1.5 hover:bg-muted rounded-md transition-colors shrink-0">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" align="start" className="w-64 p-4">
                    <p className="text-sm font-medium mb-3">Work Schedule</p>
                    <div className="space-y-3">
                      {memberLocations.map(locId => {
                        const schedule = member.location_schedules[locId] || [];
                        return (
                          <div key={locId}>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {getLocationName(locId)}
                            </p>
                            <div className="flex gap-1">
                              {DAYS_OF_WEEK.map(day => (
                                <span
                                  key={day}
                                  className={`text-xs px-1.5 py-1 rounded font-medium ${
                                    schedule.includes(day)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground/50'
                                  }`}
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
            
            {/* Role Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {member.roles.map(role => (
                <Badge 
                  key={role} 
                  variant="outline" 
                  className={`text-xs font-medium border ${roleColors[role] || ''}`}
                >
                  {roleLabels[role] || role}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-1.5 text-sm">
          {member.phone && (
            <a 
              href={`tel:${member.phone}`}
              className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors py-0.5"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>{member.phone}</span>
            </a>
          )}
          {member.instagram && (
            <a 
              href={`https://instagram.com/${member.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors py-0.5"
            >
              <Instagram className="w-4 h-4 shrink-0" />
              <span>{member.instagram}</span>
            </a>
          )}
          {member.email && (
            <a 
              href={`mailto:${member.email}`}
              className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors py-0.5"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{member.email}</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
