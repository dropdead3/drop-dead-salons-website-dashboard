import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { subDays, format } from 'date-fns';

export interface RedoByStylists {
  staffUserId: string;
  staffName: string;
  redoCount: number;
  totalCount: number;
  redoRate: number;
}

export interface RedoByReason {
  reason: string;
  count: number;
}

export interface RedoAnalytics {
  totalRedos: number;
  totalAppointments: number;
  redoRate: number;
  financialImpact: number;
  byStylist: RedoByStylists[];
  byReason: RedoByReason[];
  weeklyTrend: number[];
  repeatRedoClients: number;
}

export function useRedoAnalytics(days: number = 30) {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;
  const dateFrom = format(subDays(new Date(), days), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['redo-analytics', orgId, days],
    queryFn: async (): Promise<RedoAnalytics> => {
      if (!orgId) return { totalRedos: 0, totalAppointments: 0, redoRate: 0, financialImpact: 0, byStylist: [], byReason: [], weeklyTrend: [], repeatRedoClients: 0 };

      // Fetch all appointments in the period
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, staff_user_id, staff_name, is_redo, redo_reason, original_appointment_id, total_price, original_price, client_id, appointment_date')
        .eq('organization_id', orgId)
        .gte('appointment_date', dateFrom)
        .not('status', 'in', '("cancelled")');

      if (error || !appointments) {
        return { totalRedos: 0, totalAppointments: 0, redoRate: 0, financialImpact: 0, byStylist: [], byReason: [], weeklyTrend: [], repeatRedoClients: 0 };
      }

      const totalAppointments = appointments.length;
      const redos = appointments.filter(a => a.is_redo);
      const totalRedos = redos.length;
      const redoRate = totalAppointments > 0 ? (totalRedos / totalAppointments) * 100 : 0;

      // Financial impact: sum of (original_price - redo_price) for redos
      let financialImpact = 0;
      for (const redo of redos) {
        const redoPrice = redo.total_price ?? 0;
        const origPrice = redo.original_price ?? redoPrice;
        financialImpact += Math.max(0, origPrice - redoPrice);
      }

      // By stylist — attribute redo to the original stylist if linked, otherwise to the redo appointment's stylist
      const stylistMap = new Map<string, { name: string; redoCount: number; totalCount: number }>();
      
      // Count all appointments per stylist
      for (const a of appointments) {
        const sid = a.staff_user_id;
        if (!sid) continue;
        if (!stylistMap.has(sid)) {
          stylistMap.set(sid, { name: a.staff_name || 'Unknown', redoCount: 0, totalCount: 0 });
        }
        stylistMap.get(sid)!.totalCount++;
      }

      // For redos, try to attribute to original stylist
      for (const redo of redos) {
        let targetStaffId = redo.staff_user_id;
        if (redo.original_appointment_id) {
          const original = appointments.find(a => a.id === redo.original_appointment_id);
          if (original?.staff_user_id) {
            targetStaffId = original.staff_user_id;
          }
        }
        if (targetStaffId && stylistMap.has(targetStaffId)) {
          stylistMap.get(targetStaffId)!.redoCount++;
        }
      }

      const byStylist: RedoByStylists[] = Array.from(stylistMap.entries())
        .filter(([, v]) => v.redoCount > 0)
        .map(([id, v]) => ({
          staffUserId: id,
          staffName: v.name,
          redoCount: v.redoCount,
          totalCount: v.totalCount,
          redoRate: v.totalCount > 0 ? (v.redoCount / v.totalCount) * 100 : 0,
        }))
        .sort((a, b) => b.redoCount - a.redoCount);

      // By reason
      const reasonMap = new Map<string, number>();
      for (const redo of redos) {
        const reason = redo.redo_reason || 'Unspecified';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      }
      const byReason: RedoByReason[] = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      // Weekly trend (last 12 weeks)
      const weeklyTrend: number[] = [];
      const now = new Date();
      for (let w = 11; w >= 0; w--) {
        const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
        const weekRedos = redos.filter(r => r.appointment_date >= weekStartStr && r.appointment_date < weekEndStr).length;
        weeklyTrend.push(weekRedos);
      }

      // Repeat redo clients (clients with 2+ redos)
      const clientRedoCount = new Map<string, number>();
      for (const redo of redos) {
        const cid = (redo as any).client_id;
        if (cid) clientRedoCount.set(cid, (clientRedoCount.get(cid) || 0) + 1);
      }
      const repeatRedoClients = Array.from(clientRedoCount.values()).filter(c => c >= 2).length;

      return { totalRedos, totalAppointments, redoRate, financialImpact, byStylist, byReason, weeklyTrend, repeatRedoClients };
    },
    enabled: !!orgId,
  });
}
