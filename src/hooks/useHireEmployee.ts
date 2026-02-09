import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HireEmployeeData {
  email: string;
  fullName: string;
  role: string;
  organizationId?: string;
  locationId?: string;
  startDate?: string;
  payType?: string;
  payRate?: number;
  title?: string;
  assignOnboardingTasks?: boolean;
  generateOfferLetter?: boolean;
  triggerGusto?: boolean;
  applicantId?: string;
}

export interface HireResult {
  success: boolean;
  userId: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  organizationId: string;
  assignedTaskCount: number;
  message: string;
  gustoStatus?: string;
  gustoMessage?: string;
  offerLetterStatus?: string;
  offerLetterMessage?: string;
}

export function useHireEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HireEmployeeData): Promise<HireResult> => {
      const { data: result, error } = await supabase.functions.invoke('hire-employee', {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result as HireResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(`Failed to hire employee: ${error.message}`);
    },
  });
}
