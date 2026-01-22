import { useMemo } from 'react';
import { useRoles, Role } from './useRoles';
import * as LucideIcons from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

// Color mapping from role color name to Tailwind classes
const COLOR_CLASSES: Record<string, {
  badge: string;
  badgeBorder: string;
  text: string;
  bg: string;
  icon: string;
}> = {
  slate: {
    badge: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-900 dark:from-slate-900/40 dark:to-gray-900/40 dark:text-slate-300',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    icon: 'text-slate-600',
  },
  red: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    badgeBorder: 'border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-600',
  },
  orange: {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    badgeBorder: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'text-amber-600',
  },
  yellow: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    badgeBorder: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'text-yellow-600',
  },
  lime: {
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
    badgeBorder: 'border-lime-200 dark:border-lime-800',
    text: 'text-lime-600 dark:text-lime-400',
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    icon: 'text-lime-600',
  },
  green: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    badgeBorder: 'border-green-200 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: 'text-emerald-600',
  },
  teal: {
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    badgeBorder: 'border-teal-200 dark:border-teal-800',
    text: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    icon: 'text-teal-600',
  },
  cyan: {
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: 'text-cyan-600',
  },
  sky: {
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
    badgeBorder: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    icon: 'text-sky-600',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600',
  },
  indigo: {
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: 'text-indigo-600',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
    badgeBorder: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    icon: 'text-violet-600',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600',
  },
  fuchsia: {
    badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    badgeBorder: 'border-fuchsia-200 dark:border-fuchsia-800',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    icon: 'text-fuchsia-600',
  },
  pink: {
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    badgeBorder: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    icon: 'text-pink-600',
  },
  rose: {
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    icon: 'text-rose-600',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    badgeBorder: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    icon: 'text-gray-600',
  },
};

// Default fallback
const DEFAULT_CLASSES = COLOR_CLASSES.gray;

// Get icon component from string name
export function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const Icon = icons[iconName];
  return Icon || LucideIcons.User;
}

// Hook that provides all role utilities
export function useRoleUtils() {
  const { data: roles = [], isLoading } = useRoles();

  // Create lookup maps for quick access
  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    roles.forEach(role => map.set(role.name, role));
    return map;
  }, [roles]);

  // Get role names array - roles already includes super_admin from database, ordered by sort_order
  const roleNames = useMemo(() => roles.map(r => r.name), [roles]);

  // allRoleNames is same as roleNames since super_admin is now in database
  const allRoleNames = useMemo(() => roleNames, [roleNames]);

  // Get role label (display name) - now fully dynamic from database
  const getRoleLabel = (roleName: string): string => {
    const role = roleMap.get(roleName);
    return role?.display_name || roleName;
  };

  // Get role description - now fully dynamic from database
  const getRoleDescription = (roleName: string): string => {
    const role = roleMap.get(roleName);
    return role?.description || '';
  };

  // Get role color name - now fully dynamic from database
  const getRoleColor = (roleName: string): string => {
    const role = roleMap.get(roleName);
    return role?.color || 'gray';
  };

  // Get color classes for badges
  const getRoleBadgeClasses = (roleName: string): string => {
    const color = getRoleColor(roleName);
    return COLOR_CLASSES[color]?.badge || DEFAULT_CLASSES.badge;
  };

  // Get full badge classes with border
  const getRoleBadgeWithBorderClasses = (roleName: string): string => {
    const color = getRoleColor(roleName);
    const classes = COLOR_CLASSES[color] || DEFAULT_CLASSES;
    return `${classes.badge} ${classes.badgeBorder}`;
  };

  // Get text color classes
  const getRoleTextClasses = (roleName: string): string => {
    const color = getRoleColor(roleName);
    return COLOR_CLASSES[color]?.text || DEFAULT_CLASSES.text;
  };

  // Get background classes
  const getRoleBgClasses = (roleName: string): string => {
    const color = getRoleColor(roleName);
    return COLOR_CLASSES[color]?.bg || DEFAULT_CLASSES.bg;
  };

  // Get icon color classes
  const getRoleIconClasses = (roleName: string): string => {
    const color = getRoleColor(roleName);
    return COLOR_CLASSES[color]?.icon || DEFAULT_CLASSES.icon;
  };

  // Get icon name - now fully dynamic from database
  const getRoleIconName = (roleName: string): string => {
    const role = roleMap.get(roleName);
    return role?.icon || 'User';
  };

  // Get icon component
  const getRoleIcon = (roleName: string): React.ComponentType<{ className?: string }> => {
    const iconName = getRoleIconName(roleName);
    return getIconComponent(iconName);
  };

  // Get role options for selects (active roles only)
  const roleOptions = useMemo(() => {
    return roles.map(role => ({
      value: role.name as AppRole,
      label: role.display_name,
      description: role.description || '',
    }));
  }, [roles]);

  // Get role options including super admin - now same as roleOptions since super_admin is in database
  const roleOptionsWithSuper = useMemo(() => roleOptions, [roleOptions]);

  // Labels map for backward compatibility - now fully dynamic
  const roleLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    roles.forEach(role => {
      labels[role.name] = role.display_name;
    });
    return labels;
  }, [roles]);

  // Descriptions map for backward compatibility - now fully dynamic
  const roleDescriptions = useMemo(() => {
    const descriptions: Record<string, string> = {};
    roles.forEach(role => {
      descriptions[role.name] = role.description || '';
    });
    return descriptions;
  }, [roles]);

  return {
    roles,
    roleNames,
    allRoleNames,
    roleMap,
    isLoading,
    // Functions
    getRoleLabel,
    getRoleDescription,
    getRoleColor,
    getRoleBadgeClasses,
    getRoleBadgeWithBorderClasses,
    getRoleTextClasses,
    getRoleBgClasses,
    getRoleIconClasses,
    getRoleIconName,
    getRoleIcon,
    // For selects
    roleOptions,
    roleOptionsWithSuper,
    // Maps for backward compatibility
    roleLabels,
    roleDescriptions,
  };
}

// Static utility for getting icon (doesn't require hook)
export { getIconComponent as getRoleIconStatic };
