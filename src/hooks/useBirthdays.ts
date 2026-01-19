import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDate, getMonth } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { useEffectiveUserContext } from './useEffectiveUser';

type AppRole = Database['public']['Enums']['app_role'];

export interface TeamMemberBirthday {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  photo_url: string | null;
  birthday: string;
  roles?: AppRole[];
  isCurrentUser?: boolean;
}

export function useTodaysBirthdays() {
  const { effectiveUserId } = useEffectiveUserContext();
  return useQuery({
    queryKey: ['todays-birthdays', effectiveUserId],
    queryFn: async () => {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-indexed
      const day = today.getDate();
      
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, birthday')
        .eq('is_active', true)
        .not('birthday', 'is', null);
      
      if (error) throw error;
      
      // Filter for today's birthdays (matching month and day)
      const todaysBirthdays = (data || []).filter(person => {
        if (!person.birthday) return false;
        const bday = parseISO(person.birthday);
        return getMonth(bday) + 1 === month && getDate(bday) === day;
      }).map(person => ({
        ...person,
        isCurrentUser: person.user_id === effectiveUserId,
      }));
      
      return todaysBirthdays as TeamMemberBirthday[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpcomingBirthdays(daysAhead: number = 30) {
  const { effectiveUserId } = useEffectiveUserContext();
  
  return useQuery({
    queryKey: ['upcoming-birthdays', daysAhead, effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, birthday')
        .eq('is_active', true)
        .not('birthday', 'is', null);
      
      if (error) throw error;
      
      const today = new Date();
      const currentYear = today.getFullYear();
      
      // Map birthdays to this year and sort by upcoming date
      const withUpcoming = (data || [])
        .map(person => {
          if (!person.birthday) return null;
          const bday = parseISO(person.birthday);
          let thisYearBday = new Date(currentYear, getMonth(bday), getDate(bday));
          
          // If birthday already passed this year, use next year
          if (thisYearBday < today) {
            thisYearBday = new Date(currentYear + 1, getMonth(bday), getDate(bday));
          }
          
          const daysUntil = Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            ...person,
            nextBirthday: thisYearBday,
            daysUntil,
            isCurrentUser: person.user_id === effectiveUserId,
          };
        })
        .filter(p => p && p.daysUntil <= daysAhead && p.daysUntil >= 0)
        .sort((a, b) => (a?.daysUntil || 0) - (b?.daysUntil || 0));
      
      return withUpcoming as (TeamMemberBirthday & { nextBirthday: Date; daysUntil: number })[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMonthlyBirthdays(date: Date) {
  const monthStart = startOfMonth(date);
  const { effectiveUserId } = useEffectiveUserContext();
  
  return useQuery({
    queryKey: ['monthly-birthdays', format(monthStart, 'yyyy-MM'), effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, birthday')
        .eq('is_active', true)
        .not('birthday', 'is', null);
      
      if (error) throw error;

      // Get all user IDs to fetch their roles
      const userIds = (data || []).map(p => p.user_id);
      
      // Fetch roles for these users
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      // Create a map of user_id to roles
      const rolesMap: Record<string, AppRole[]> = {};
      (rolesData || []).forEach(r => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });
      
      // Group by day of month
      const birthdaysByDay: Record<number, TeamMemberBirthday[]> = {};
      const targetMonth = getMonth(date);
      
      (data || []).forEach(person => {
        if (!person.birthday) return;
        const bday = parseISO(person.birthday);
        if (getMonth(bday) === targetMonth) {
          const day = getDate(bday);
          if (!birthdaysByDay[day]) birthdaysByDay[day] = [];
          birthdaysByDay[day].push({
            ...person,
            roles: rolesMap[person.user_id] || [],
            isCurrentUser: person.user_id === effectiveUserId,
          } as TeamMemberBirthday);
        }
      });
      
      return birthdaysByDay;
    },
    staleTime: 1000 * 60 * 5,
  });
}
