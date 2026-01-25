import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, startOfMonth, subMonths } from 'date-fns';

export interface CampaignPerformance {
  campaign: string;
  source: string;
  medium: string;
  platform: string | null;
  totalLeads: number;
  converted: number;
  conversionRate: number;
  totalRevenue: number;
  avgResponseTime: number;
  // ROI Fields
  budget: number | null;
  spendToDate: number | null;
  costPerLead: number | null;
  roas: number | null;
  roiPercent: number | null;
}

export interface SourcePerformance {
  source: string;
  leads: number;
  conversions: number;
  revenue: number;
}

export interface MediumPerformance {
  medium: string;
  leads: number;
  conversions: number;
  revenue: number;
}

export interface MarketingAnalytics {
  campaigns: CampaignPerformance[];
  sources: SourcePerformance[];
  mediums: MediumPerformance[];
  summary: {
    totalCampaigns: number;
    totalLeads: number;
    totalRevenue: number;
    overallConversionRate: number;
    topCampaign: string | null;
    // ROI Summary
    totalBudget: number;
    totalSpend: number;
    avgCPL: number | null;
    overallROAS: number | null;
  };
}

interface DateFilter {
  startDate: Date;
  endDate: Date;
}

interface LeadData {
  id: string;
  status: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  first_service_revenue: number | null;
  response_time_seconds: number | null;
  preferred_location: string | null;
  created_at: string;
}

interface CampaignData {
  utm_campaign: string;
  campaign_name: string;
  platform: string | null;
  budget: number | null;
  spend_to_date: number | null;
}

function getDateFilter(range: 'week' | 'month' | '3months'): DateFilter {
  const now = new Date();
  switch (range) {
    case 'week':
      return { startDate: startOfWeek(now), endDate: now };
    case 'month':
      return { startDate: startOfMonth(now), endDate: now };
    case '3months':
      return { startDate: subMonths(now, 3), endDate: now };
  }
}

export function useMarketingAnalytics(
  dateRange: 'week' | 'month' | '3months' = 'month',
  locationId?: string
) {
  return useQuery({
    queryKey: ['marketing-analytics', dateRange, locationId],
    queryFn: async (): Promise<MarketingAnalytics> => {
      const { startDate, endDate } = getDateFilter(dateRange);

      // Fetch leads and campaigns in parallel
      const [leadsResponse, campaignsResponse] = await Promise.all([
        supabase
          .from('salon_inquiries')
          .select('id, status, utm_source, utm_medium, utm_campaign, first_service_revenue, response_time_seconds, preferred_location, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .not('utm_campaign', 'is', null),
        supabase
          .from('marketing_campaigns')
          .select('utm_campaign, campaign_name, platform, budget, spend_to_date')
      ]);

      if (leadsResponse.error) throw leadsResponse.error;
      if (campaignsResponse.error) throw campaignsResponse.error;

      // Create campaign lookup map
      const campaignLookup = new Map<string, CampaignData>();
      ((campaignsResponse.data || []) as CampaignData[]).forEach(c => {
        campaignLookup.set(c.utm_campaign, c);
      });

      // Filter by location if specified
      let leads = (leadsResponse.data || []) as unknown as LeadData[];
      if (locationId) {
        leads = leads.filter(l => l.preferred_location === locationId);
      }

      // Group by campaign
      const campaignMap = new Map<string, {
        source: string;
        medium: string;
        leads: number;
        converted: number;
        revenue: number;
        responseTimes: number[];
      }>();

      // Group by source
      const sourceMap = new Map<string, {
        leads: number;
        conversions: number;
        revenue: number;
      }>();

      // Group by medium
      const mediumMap = new Map<string, {
        leads: number;
        conversions: number;
        revenue: number;
      }>();

      leads.forEach((lead) => {
        const campaign = lead.utm_campaign || 'Unknown';
        const source = lead.utm_source || 'Direct';
        const medium = lead.utm_medium || 'None';
        const isConverted = lead.status === 'converted';
        const revenue = isConverted ? (lead.first_service_revenue || 0) : 0;
        const responseTime = lead.response_time_seconds || 0;

        // Campaign aggregation
        const existing = campaignMap.get(campaign) || {
          source,
          medium,
          leads: 0,
          converted: 0,
          revenue: 0,
          responseTimes: [],
        };
        existing.leads++;
        if (isConverted) existing.converted++;
        existing.revenue += revenue;
        if (responseTime > 0) existing.responseTimes.push(responseTime);
        campaignMap.set(campaign, existing);

        // Source aggregation
        const sourceData = sourceMap.get(source) || {
          leads: 0,
          conversions: 0,
          revenue: 0,
        };
        sourceData.leads++;
        if (isConverted) sourceData.conversions++;
        sourceData.revenue += revenue;
        sourceMap.set(source, sourceData);

        // Medium aggregation
        const mediumData = mediumMap.get(medium) || {
          leads: 0,
          conversions: 0,
          revenue: 0,
        };
        mediumData.leads++;
        if (isConverted) mediumData.conversions++;
        mediumData.revenue += revenue;
        mediumMap.set(medium, mediumData);
      });

      // Convert maps to arrays with ROI calculations
      const campaigns: CampaignPerformance[] = Array.from(campaignMap.entries())
        .map(([campaign, data]) => {
          const campaignInfo = campaignLookup.get(campaign);
          const budget = campaignInfo?.budget ?? null;
          const spendToDate = campaignInfo?.spend_to_date ?? null;
          const platform = campaignInfo?.platform ?? null;

          // Calculate ROI metrics
          const costPerLead = spendToDate && data.leads > 0 
            ? spendToDate / data.leads 
            : null;
          const roas = spendToDate && spendToDate > 0 
            ? data.revenue / spendToDate 
            : null;
          const roiPercent = spendToDate && spendToDate > 0 
            ? ((data.revenue - spendToDate) / spendToDate) * 100 
            : null;

          return {
            campaign,
            source: data.source,
            medium: data.medium,
            platform,
            totalLeads: data.leads,
            converted: data.converted,
            conversionRate: data.leads > 0 ? (data.converted / data.leads) * 100 : 0,
            totalRevenue: data.revenue,
            avgResponseTime: data.responseTimes.length > 0
              ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length / 3600
              : 0,
            budget,
            spendToDate,
            costPerLead,
            roas,
            roiPercent,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      const sources: SourcePerformance[] = Array.from(sourceMap.entries())
        .map(([source, data]) => ({
          source,
          leads: data.leads,
          conversions: data.conversions,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.leads - a.leads);

      const mediums: MediumPerformance[] = Array.from(mediumMap.entries())
        .map(([medium, data]) => ({
          medium,
          leads: data.leads,
          conversions: data.conversions,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.leads - a.leads);

      // Calculate summary with ROI
      const totalLeads = leads.length;
      const totalConverted = campaigns.reduce((sum, c) => sum + c.converted, 0);
      const totalRevenue = campaigns.reduce((sum, c) => sum + c.totalRevenue, 0);
      const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
      const totalSpend = campaigns.reduce((sum, c) => sum + (c.spendToDate || 0), 0);
      const topCampaign = campaigns.length > 0 
        ? campaigns.reduce((top, c) => c.conversionRate > top.conversionRate ? c : top).campaign
        : null;

      const avgCPL = totalSpend > 0 && totalLeads > 0 ? totalSpend / totalLeads : null;
      const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : null;

      return {
        campaigns,
        sources,
        mediums,
        summary: {
          totalCampaigns: campaigns.length,
          totalLeads,
          totalRevenue,
          overallConversionRate: totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0,
          topCampaign,
          totalBudget,
          totalSpend,
          avgCPL,
          overallROAS,
        },
      };
    },
  });
}

export function formatSourceName(source: string): string {
  const sourceNames: Record<string, string> = {
    google: 'Google Ads',
    meta: 'Meta (FB/IG)',
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    yelp: 'Yelp',
    direct: 'Direct',
    email: 'Email',
    referral: 'Referral',
  };
  return sourceNames[source.toLowerCase()] || source;
}

export function formatMediumName(medium: string): string {
  const mediumNames: Record<string, string> = {
    cpc: 'Paid Search (CPC)',
    social: 'Organic Social',
    email: 'Email',
    display: 'Display Ads',
    referral: 'Referral',
    organic: 'Organic',
    none: 'None',
  };
  return mediumNames[medium.toLowerCase()] || medium;
}

export function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    google: 'hsl(var(--chart-1))',
    meta: 'hsl(var(--chart-2))',
    facebook: 'hsl(var(--chart-2))',
    instagram: 'hsl(var(--chart-3))',
    tiktok: 'hsl(var(--chart-4))',
    yelp: 'hsl(var(--chart-5))',
    direct: 'hsl(var(--muted-foreground))',
    email: 'hsl(var(--primary))',
  };
  return colors[source.toLowerCase()] || 'hsl(var(--muted-foreground))';
}

export function getMediumColor(medium: string): string {
  const colors: Record<string, string> = {
    cpc: 'hsl(var(--chart-1))',
    social: 'hsl(var(--chart-2))',
    email: 'hsl(var(--chart-3))',
    display: 'hsl(var(--chart-4))',
    referral: 'hsl(var(--chart-5))',
    organic: 'hsl(var(--primary))',
    none: 'hsl(var(--muted-foreground))',
  };
  return colors[medium.toLowerCase()] || 'hsl(var(--muted-foreground))';
}
