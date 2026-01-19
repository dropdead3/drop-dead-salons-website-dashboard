import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDate, getMonth } from 'date-fns';

export interface TeamMemberBirthday {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  photo_url: string | null;
  birthday: string;
}

export function useTodaysBirthdays() {
  return useQuery({
    queryKey: ['todays-birthdays'],
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
      });
      
      return todaysBirthdays as TeamMemberBirthday[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpcomingBirthdays(daysAhead: number = 30) {
  return useQuery({
    queryKey: ['upcoming-birthdays', daysAhead],
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
  const monthEnd = endOfMonth(date);
  
  return useQuery({
    queryKey: ['monthly-birthdays', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, birthday')
        .eq('is_active', true)
        .not('birthday', 'is', null);
      
      if (error) throw error;
      
      // Group by day of month
      const birthdaysByDay: Record<number, TeamMemberBirthday[]> = {};
      const targetMonth = getMonth(date);
      
      (data || []).forEach(person => {
        if (!person.birthday) return;
        const bday = parseISO(person.birthday);
        if (getMonth(bday) === targetMonth) {
          const day = getDate(bday);
          if (!birthdaysByDay[day]) birthdaysByDay[day] = [];
          birthdaysByDay[day].push(person as TeamMemberBirthday);
        }
      });
      
      return birthdaysByDay;
    },
    staleTime: 1000 * 60 * 5,
  });
}
