import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StylistSales {
  user_id: string;
  name: string;
  totalRevenue: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current week's date range
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Fetch this week's sales by stylist
    const { data: salesData, error: salesError } = await supabase
      .from('phorest_daily_sales_summary')
      .select(`
        user_id,
        total_revenue,
        employee_profiles:user_id (
          full_name,
          display_name
        )
      `)
      .gte('summary_date', weekStartStr)
      .lte('summary_date', todayStr)
      .not('user_id', 'is', null);

    if (salesError) throw salesError;

    // Aggregate by stylist
    const byUser: Record<string, StylistSales> = {};
    salesData?.forEach((row: any) => {
      if (!row.user_id) return;
      if (!byUser[row.user_id]) {
        byUser[row.user_id] = {
          user_id: row.user_id,
          name: row.employee_profiles?.display_name || row.employee_profiles?.full_name || 'Unknown',
          totalRevenue: 0,
        };
      }
      byUser[row.user_id].totalRevenue += Number(row.total_revenue) || 0;
    });

    const rankings = Object.values(byUser)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    if (rankings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No sales data to update leaderboard' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get last stored rankings from site_settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'last_leaderboard_rankings')
      .maybeSingle();

    const lastRankings: StylistSales[] = settingsData?.value ? JSON.parse(settingsData.value) : [];
    
    // Check if there's a new leader
    const currentLeader = rankings[0];
    const previousLeader = lastRankings[0];
    
    let announcementContent = '';
    let shouldAnnounce = false;

    if (!previousLeader || previousLeader.user_id !== currentLeader.user_id) {
      // New leader!
      shouldAnnounce = true;
      announcementContent = `🏆 **${currentLeader.name}** has taken the lead on this week's sales leaderboard with $${currentLeader.totalRevenue.toLocaleString()} in revenue!`;
      
      if (previousLeader && previousLeader.user_id !== currentLeader.user_id) {
        announcementContent += ` Taking over from ${previousLeader.name}.`;
      }
    }

    // Check for significant position changes
    const positionChanges: string[] = [];
    rankings.forEach((stylist, newRank) => {
      const oldRank = lastRankings.findIndex(s => s.user_id === stylist.user_id);
      if (oldRank !== -1 && oldRank - newRank >= 2) {
        // Moved up 2+ positions
        positionChanges.push(`📈 ${stylist.name} climbed from #${oldRank + 1} to #${newRank + 1}`);
      }
    });

    if (positionChanges.length > 0 && !shouldAnnounce) {
      shouldAnnounce = true;
      announcementContent = `**Leaderboard Shake-up!** 🔥\n\n${positionChanges.join('\n')}`;
    }

    // Create announcement if needed
    if (shouldAnnounce && announcementContent) {
      // Get a super admin user to be the author
      const { data: adminUser } = await supabase
        .from('employee_profiles')
        .select('user_id')
        .eq('is_super_admin', true)
        .limit(1)
        .maybeSingle();

      if (adminUser) {
        await supabase.from('announcements').insert({
          title: 'Sales Leaderboard Update',
          content: announcementContent,
          author_id: adminUser.user_id,
          priority: 'normal',
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expires in 24 hours
        });
      }
    }

    // Store current rankings
    await supabase.from('site_settings').upsert({
      key: 'last_leaderboard_rankings',
      value: JSON.stringify(rankings),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        rankings: rankings.slice(0, 5),
        announced: shouldAnnounce,
        message: shouldAnnounce ? 'Leaderboard update announced' : 'No significant changes to announce'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating sales leaderboard:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
