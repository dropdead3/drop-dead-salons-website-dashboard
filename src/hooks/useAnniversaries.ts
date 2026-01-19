import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseISO, differenceInYears, differenceInDays, setYear, isSameDay, addDays, isAfter, isBefore } from 'date-fns';

export interface TeamMemberAnniversary {
  id: string;
  user_id: string;
  full_name: string;
  display_name: string | null;
  photo_url: string | null;
  hire_date: string;
  years: number;
  daysUntil: number;
  anniversaryDate: Date;
}

// Milestone years that we celebrate
export const MILESTONE_YEARS = [1, 2, 3, 5, 7, 10, 15, 20, 25];

export function getAnniversaryMilestone(years: number): number | null {
  // Find the most recent milestone they've hit
  const milestones = MILESTONE_YEARS.filter(m => years >= m);
  return milestones.length > 0 ? Math.max(...milestones) : null;
}

export function getNextMilestone(years: number): number | null {
  const next = MILESTONE_YEARS.find(m => m > years);
  return next || null;
}

export function isUpcomingAnniversary(hireDate: string, withinDays: number = 30): { isUpcoming: boolean; years: number; daysUntil: number; anniversaryDate: Date } {
  const start = parseISO(hireDate);
  const today = new Date();
  const yearsCompleted = differenceInYears(today, start);
  
  // Calculate next anniversary date
  const nextAnniversaryYear = setYear(start, today.getFullYear());
  let anniversaryDate = nextAnniversaryYear;
  
  // If this year's anniversary has passed, look at next year's
  if (isBefore(nextAnniversaryYear, today) && !isSameDay(nextAnniversaryYear, today)) {
    anniversaryDate = setYear(start, today.getFullYear() + 1);
  }
  
  const daysUntil = differenceInDays(anniversaryDate, today);
  const yearsAtAnniversary = differenceInYears(anniversaryDate, start);
  
  // Check if anniversary falls within the window
  const isUpcoming = daysUntil >= 0 && daysUntil <= withinDays;
  
  return {
    isUpcoming,
    years: yearsAtAnniversary,
    daysUntil,
    anniversaryDate,
  };
}

export function isTodayAnniversary(hireDate: string): { isToday: boolean; years: number } {
  const start = parseISO(hireDate);
  const today = new Date();
  const thisYearAnniversary = setYear(start, today.getFullYear());
  const isToday = isSameDay(thisYearAnniversary, today);
  const years = differenceInYears(today, start);
  
  return { isToday, years };
}

export function useTodaysAnniversaries() {
  return useQuery({
    queryKey: ['todays-anniversaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, hire_date')
        .eq('is_active', true)
        .not('hire_date', 'is', null);

      if (error) throw error;

      const today = new Date();
      const anniversaries: TeamMemberAnniversary[] = [];

      (data || []).forEach(person => {
        if (!person.hire_date) return;
        const { isToday, years } = isTodayAnniversary(person.hire_date);
        
        if (isToday && years > 0) {
          anniversaries.push({
            id: person.id,
            user_id: person.user_id,
            full_name: person.full_name,
            display_name: person.display_name,
            photo_url: person.photo_url,
            hire_date: person.hire_date,
            years,
            daysUntil: 0,
            anniversaryDate: today,
          });
        }
      });

      return anniversaries;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpcomingAnniversaries(withinDays: number = 30) {
  return useQuery({
    queryKey: ['upcoming-anniversaries', withinDays],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, hire_date')
        .eq('is_active', true)
        .not('hire_date', 'is', null);

      if (error) throw error;

      const anniversaries: TeamMemberAnniversary[] = [];

      (data || []).forEach(person => {
        if (!person.hire_date) return;
        const { isUpcoming, years, daysUntil, anniversaryDate } = isUpcomingAnniversary(person.hire_date, withinDays);
        
        // Only include if upcoming and will be at least 1 year
        if (isUpcoming && years >= 1) {
          anniversaries.push({
            id: person.id,
            user_id: person.user_id,
            full_name: person.full_name,
            display_name: person.display_name,
            photo_url: person.photo_url,
            hire_date: person.hire_date,
            years,
            daysUntil,
            anniversaryDate,
          });
        }
      });

      // Sort by days until anniversary
      return anniversaries.sort((a, b) => a.daysUntil - b.daysUntil);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMilestoneAnniversaries() {
  return useQuery({
    queryKey: ['milestone-anniversaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('id, user_id, full_name, display_name, photo_url, hire_date')
        .eq('is_active', true)
        .not('hire_date', 'is', null);

      if (error) throw error;

      const anniversaries: (TeamMemberAnniversary & { isMilestone: boolean })[] = [];

      (data || []).forEach(person => {
        if (!person.hire_date) return;
        const { isUpcoming, years, daysUntil, anniversaryDate } = isUpcomingAnniversary(person.hire_date, 30);
        
        // Only include milestone years
        if (isUpcoming && years >= 1 && MILESTONE_YEARS.includes(years)) {
          anniversaries.push({
            id: person.id,
            user_id: person.user_id,
            full_name: person.full_name,
            display_name: person.display_name,
            photo_url: person.photo_url,
            hire_date: person.hire_date,
            years,
            daysUntil,
            anniversaryDate,
            isMilestone: true,
          });
        }
      });

      return anniversaries.sort((a, b) => a.daysUntil - b.daysUntil);
    },
    staleTime: 1000 * 60 * 5,
  });
}
