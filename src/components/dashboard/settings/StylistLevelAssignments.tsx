import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTeamDirectory } from '@/hooks/useEmployeeProfile';
import { useAssignStylistLevel, useBulkAssignStylistLevel } from '@/hooks/useAssignStylistLevel';
import type { StylistLevel } from '@/hooks/useStylistLevels';

interface StylistLevelAssignmentsProps {
  orgId: string;
  levels: StylistLevel[];
}

export function StylistLevelAssignments({ orgId, levels }: StylistLevelAssignmentsProps) {
  const navigate = useNavigate();
  const { data: team, isLoading } = useTeamDirectory(undefined, { organizationId: orgId });
  const assignLevel = useAssignStylistLevel();
  const bulkAssign = useBulkAssignStylistLevel();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Get unique locations from team
  const locations = useMemo(() => {
    if (!team) return [];
    const locMap = new Map<string, string>();
    team.forEach(m => {
      if (m.location_id) {
        locMap.set(m.location_id, m.location_id);
      }
    });
    return Array.from(locMap.keys());
  }, [team]);

  // Filter team by location
  const filteredTeam = useMemo(() => {
    if (!team) return [];
    const stylists = team.filter(m => {
      // Only show stylists (not purely admin)
      const isAdmin = m.roles?.length === 1 && m.roles[0] === 'admin';
      if (isAdmin && !m.stylist_level) return false;
      return true;
    });
    if (locationFilter === 'all') return stylists;
    return stylists.filter(m => m.location_id === locationFilter);
  }, [team, locationFilter]);

  // Build slug-to-level map
  const slugToLevel = useMemo(() => {
    const map = new Map<string, StylistLevel>();
    levels.forEach(l => map.set(l.slug, l));
    return map;
  }, [levels]);

  // Group stylists by level
  const grouped = useMemo(() => {
    const groups: { slug: string | null; label: string; members: typeof filteredTeam }[] = [];
    const unassigned = filteredTeam.filter(m => !m.stylist_level || !slugToLevel.has(m.stylist_level));
    if (unassigned.length > 0) {
      groups.push({ slug: null, label: 'Unassigned', members: unassigned });
    }
    levels.forEach(level => {
      const members = filteredTeam.filter(m => m.stylist_level === level.slug);
      if (members.length > 0) {
        groups.push({ slug: level.slug, label: `${level.client_label} — ${level.label}`, members });
      }
    });
    // Add empty levels at end for reference
    levels.forEach(level => {
      if (!groups.find(g => g.slug === level.slug)) {
        groups.push({ slug: level.slug, label: `${level.client_label} — ${level.label}`, members: [] });
      }
    });
    return groups.filter(g => g.members.length > 0 || g.slug === null);
  }, [filteredTeam, levels, slugToLevel]);

  const handleAssign = (userId: string, displayName: string, slug: string) => {
    assignLevel.mutate({ userId, levelSlug: slug }, {
      onSuccess: () => {
        const level = slugToLevel.get(slug);
        toast.success(`${displayName} → ${level?.label || slug}`, {
          action: {
            label: 'Review Services & Overrides',
            onClick: () => navigate('/dashboard/admin/settings?category=services'),
          },
        });
      },
    });
  };

  const handleBulkAssign = (slug: string) => {
    const userIds = Array.from(selectedIds);
    if (userIds.length === 0) return;
    const level = slugToLevel.get(slug);
    bulkAssign.mutate({ userIds, levelSlug: slug }, {
      onSuccess: () => {
        setSelectedIds(new Set());
        toast.success(`${userIds.length} stylist${userIds.length > 1 ? 's' : ''} → ${level?.label || slug}`, {
          action: {
            label: 'Review Services & Overrides',
            onClick: () => navigate('/dashboard/admin/settings?category=services'),
          },
        });
      },
    });
  };

  const toggleSelected = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading team…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg">LEVEL ASSIGNMENTS</CardTitle>
            <CardDescription>
              Assign stylists to experience levels. Changing a level affects their default commission rates and level-based pricing.
            </CardDescription>
          </div>
          {locations.length > 1 && (
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {grouped.map((group) => (
          <div key={group.slug ?? '__unassigned'}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-xs font-medium uppercase tracking-wider",
                group.slug === null ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              )}>
                {group.label} ({group.members.length})
              </span>
            </div>
            <div className="space-y-1">
              {group.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(member.user_id)}
                    onCheckedChange={() => toggleSelected(member.user_id)}
                  />
                  <span className="flex-1 text-sm font-medium truncate">
                    {member.display_name || member.full_name}
                  </span>
                  <Select
                    value={member.stylist_level && slugToLevel.has(member.stylist_level) ? member.stylist_level : ''}
                    onValueChange={(val) => handleAssign(member.user_id, member.display_name || member.full_name || '', val)}
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map(level => (
                        <SelectItem key={level.slug} value={level.slug}>
                          {level.client_label} — {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredTeam.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Users className="w-8 h-8" />
            <p className="text-sm">No active stylists found.</p>
          </div>
        )}

        {/* Bulk action */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Select onValueChange={handleBulkAssign}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Set Level for Selected" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level.slug} value={level.slug}>
                    {level.client_label} — {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
