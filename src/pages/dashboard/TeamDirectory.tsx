import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MapPin, Phone, Mail, Instagram, User, Calendar } from 'lucide-react';
import { useTeamDirectory } from '@/hooks/useEmployeeProfile';
import { locations, getLocationName } from '@/data/stylists';
import type { Location } from '@/data/stylists';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  stylist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  receptionist: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  assistant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  stylist_assistant: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  admin_assistant: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  operations_assistant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

// Role priority for sorting (lower = higher priority)
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

export default function TeamDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const { data: team = [], isLoading } = useTeamDirectory(locationFilter === 'all' ? undefined : locationFilter);

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

  // Sort by highest role priority
  const sortByRole = (members: typeof team) => {
    return [...members].sort((a, b) => {
      const aHighestRole = Math.min(...a.roles.map(r => rolePriority[r] ?? 99));
      const bHighestRole = Math.min(...b.roles.map(r => rolePriority[r] ?? 99));
      return aHighestRole - bHighestRole;
    });
  };

  // Group by location, then sort by role within each group
  const teamByLocation = filteredTeam.reduce((acc, member) => {
    const loc = member.location_id || 'unassigned';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(member);
    return acc;
  }, {} as Record<string, typeof team>);

  // Sort each location group by role
  Object.keys(teamByLocation).forEach(loc => {
    teamByLocation[loc] = sortByRole(teamByLocation[loc]);
  });

  // Sort locations: assigned first (alphabetically), then unassigned last
  const sortedLocationIds = Object.keys(teamByLocation).sort((a, b) => {
    if (a === 'unassigned') return 1;
    if (b === 'unassigned') return -1;
    const nameA = getLocationName(a as Location);
    const nameB = getLocationName(b as Location);
    return nameA.localeCompare(nameB);
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

        {/* Filters */}
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
                    {locationId === 'unassigned' ? 'No Location Assigned' : getLocationName(locationId as Location)}
                    <Badge variant="secondary" className="ml-2">{members.length}</Badge>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map(member => (
                      <TeamMemberCard key={member.id} member={member} />
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
  };
}

function TeamMemberCard({ member }: TeamMemberCardProps) {
  const workDays = member.work_days || [];
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
            <AvatarFallback className="bg-muted text-lg">
              {member.full_name?.charAt(0) || <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium truncate">
                {member.display_name || member.full_name}
              </h3>
              {/* Work Days Quick View */}
              {workDays.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 hover:bg-muted rounded transition-colors shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="p-3">
                      <p className="text-xs font-medium mb-2">Work Days</p>
                      <div className="flex gap-1">
                        {DAYS_OF_WEEK.map(day => (
                          <span
                            key={day}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              workDays.includes(day)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {day.charAt(0)}
                          </span>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {member.roles.map(role => (
                <Badge 
                  key={role} 
                  variant="secondary" 
                  className={`text-xs ${roleColors[role] || ''}`}
                >
                  {roleLabels[role] || role}
                </Badge>
              ))}
            </div>
            {member.stylist_level && (
              <p className="text-xs text-muted-foreground mt-1">{member.stylist_level}</p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-2 text-sm">
          {member.phone && (
            <a 
              href={`tel:${member.phone}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>{member.phone}</span>
            </a>
          )}
          {member.instagram && (
            <a 
              href={`https://instagram.com/${member.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="w-4 h-4" />
              <span>{member.instagram}</span>
            </a>
          )}
          {member.tiktok && (
            <a 
              href={`https://tiktok.com/@${member.tiktok.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              <span>{member.tiktok}</span>
            </a>
          )}
          {member.email && (
            <a 
              href={`mailto:${member.email}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="truncate">{member.email}</span>
            </a>
          )}
        </div>

        {/* Specialties */}
        {member.specialties && member.specialties.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {member.specialties.slice(0, 3).map(specialty => (
              <Badge key={specialty} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {member.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{member.specialties.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
