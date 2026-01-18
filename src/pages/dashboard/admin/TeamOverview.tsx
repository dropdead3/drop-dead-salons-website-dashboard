import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Pause,
  RefreshCw,
  Flame,
  Loader2
} from 'lucide-react';

interface TeamMember {
  user_id: string;
  full_name: string;
  display_name: string | null;
  location_id: string | null;
  current_day: number;
  streak_count: number;
  status: string;
  restart_count: number;
}

type FilterStatus = 'all' | 'active' | 'paused' | 'at-risk' | 'restarted';

export default function TeamOverview() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    // Get all enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('stylist_program_enrollment')
      .select('*');

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      setLoading(false);
      return;
    }

    // Get profiles
    const userIds = enrollments?.map(e => e.user_id) || [];
    
    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('employee_profiles')
      .select('user_id, full_name, display_name, location_id')
      .in('user_id', userIds);

    // Combine data
    const team: TeamMember[] = (enrollments || []).map(enrollment => {
      const profile = profiles?.find(p => p.user_id === enrollment.user_id);
      return {
        user_id: enrollment.user_id,
        full_name: profile?.full_name || 'Unknown',
        display_name: profile?.display_name,
        location_id: profile?.location_id,
        current_day: enrollment.current_day,
        streak_count: enrollment.streak_count,
        status: enrollment.status,
        restart_count: enrollment.restart_count,
      };
    });

    setMembers(team);
    setLoading(false);
  };

  const getStatusBadge = (member: TeamMember) => {
    if (member.status === 'paused') {
      return (
        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 text-xs font-display tracking-wide flex items-center gap-1">
          <Pause className="w-3 h-3" />
          PAUSED
        </span>
      );
    }
    if (member.restart_count > 0) {
      return (
        <span className="px-2 py-1 bg-orange-500/10 text-orange-600 text-xs font-display tracking-wide flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          RESTARTED {member.restart_count}x
        </span>
      );
    }
    if (member.streak_count >= 7) {
      return (
        <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-display tracking-wide flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          ON TRACK
        </span>
      );
    }
    if (member.streak_count < 3 && member.current_day > 3) {
      return (
        <span className="px-2 py-1 bg-red-500/10 text-red-600 text-xs font-display tracking-wide flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          AT RISK
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-foreground/5 text-foreground text-xs font-display tracking-wide">
        ACTIVE
      </span>
    );
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(search.toLowerCase()) ||
      member.display_name?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (statusFilter) {
      case 'active':
        return member.status === 'active';
      case 'paused':
        return member.status === 'paused';
      case 'at-risk':
        return member.streak_count < 3 && member.current_day > 3;
      case 'restarted':
        return member.restart_count > 0;
      default:
        return true;
    }
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl mb-2">
            TEAM OVERVIEW
          </h1>
          <p className="text-muted-foreground font-sans">
            Monitor stylist progress and compliance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stylists</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="restarted">Restarted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wide mb-1">
              TOTAL ENROLLED
            </p>
            <p className="font-display text-2xl">{members.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wide mb-1">
              ACTIVE
            </p>
            <p className="font-display text-2xl text-green-600">
              {members.filter(m => m.status === 'active').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wide mb-1">
              AT RISK
            </p>
            <p className="font-display text-2xl text-red-600">
              {members.filter(m => m.streak_count < 3 && m.current_day > 3).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-display tracking-wide mb-1">
              PAUSED
            </p>
            <p className="font-display text-2xl text-yellow-600">
              {members.filter(m => m.status === 'paused').length}
            </p>
          </Card>
        </div>

        {/* Team List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-sans">
              No team members found.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <Card key={member.user_id} className="p-4 lg:p-6">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-muted flex items-center justify-center font-display text-lg">
                    {member.full_name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium truncate">
                      {member.display_name || member.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans">
                      {member.location_id === 'north-mesa' ? 'North Mesa' : 'Val Vista Lakes'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden lg:flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground font-display tracking-wide">DAY</p>
                      <p className="font-display text-lg">{member.current_day}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground font-display tracking-wide">STREAK</p>
                      <p className="font-display text-lg flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {member.streak_count}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  {getStatusBadge(member)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
