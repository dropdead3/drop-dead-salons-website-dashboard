import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface QuarterData {
  quarter: string; // e.g. "Q1 2025"
  year: number;
  q: number; // 1-4
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  transactions: number;
  months: MonthData[];
}

interface MonthData {
  month: string; // "2025-01"
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  transactions: number;
  dayCount: number;
}

function getQuarterLabel(year: number, q: number): string {
  return `Q${q} ${year}`;
}

function getQuarterFromDate(date: string): { year: number; q: number } {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const q = Math.floor(month / 3) + 1;
  return { year, q };
}

// Simple linear regression
function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; r2: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0, r2: 0 };

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  const ssRes = ys.reduce((a, y, i) => a + Math.pow(y - (slope * xs[i] + intercept), 2), 0);
  const ssTot = ys.reduce((a, y) => a + Math.pow(y - meanY, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

// Calculate seasonal indices (average ratio of each quarter to overall trend)
function calculateSeasonalIndices(quarters: QuarterData[]): Record<number, number> {
  const indices: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
  const avgRevenue = quarters.reduce((s, q) => s + q.totalRevenue, 0) / quarters.length;

  if (avgRevenue === 0) return { 1: 1, 2: 1, 3: 1, 4: 1 };

  quarters.forEach((q) => {
    indices[q.q].push(q.totalRevenue / avgRevenue);
  });

  const result: Record<number, number> = {};
  for (let i = 1; i <= 4; i++) {
    const vals = indices[i];
    result[i] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
  }
  return result;
}

// Determine momentum from recent growth rates
function determineMomentum(growthRates: number[]): string {
  if (growthRates.length < 2) return "steady";
  const recent = growthRates.slice(-3);
  if (recent.length < 2) return "steady";

  const diffs = [];
  for (let i = 1; i < recent.length; i++) {
    diffs.push(recent[i] - recent[i - 1]);
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  if (avgDiff > 2) return "accelerating";
  if (avgDiff < -2) return "decelerating";
  return "steady";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, locationId } = await req.json();

    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("growth_forecasts")
      .select("*")
      .eq("organization_id", organizationId)
      .gt("expires_at", new Date().toISOString())
      .order("generated_at", { ascending: false })
      .limit(20);

    if (cached && cached.length > 0) {
      // Group cached data by scenario
      const scenarios: Record<string, any[]> = {};
      cached.forEach((row: any) => {
        if (!scenarios[row.scenario]) scenarios[row.scenario] = [];
        scenarios[row.scenario].push(row);
      });

      return new Response(
        JSON.stringify({ source: "cache", forecasts: cached, scenarios }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pull all historical daily sales data
    let query = supabase
      .from("phorest_daily_sales_summary")
      .select("summary_date, total_revenue, service_revenue, product_revenue, total_transactions, location_id")
      .order("summary_date", { ascending: true });

    // We can't filter by org directly on this table, so we pull all and handle
    if (locationId && locationId !== "all") {
      query = query.eq("location_id", locationId);
    }

    const { data: dailyData, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching sales data:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch sales data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!dailyData || dailyData.length === 0) {
      return new Response(
        JSON.stringify({
          source: "computed",
          forecasts: [],
          scenarios: {},
          actuals: [],
          insights: ["Not enough historical data to generate growth forecasts. Revenue data will be analyzed once available."],
          summary: {
            momentum: "steady",
            dataPoints: 0,
            quartersAvailable: 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate into months
    const monthMap = new Map<string, MonthData>();
    dailyData.forEach((d: any) => {
      const monthKey = d.summary_date.substring(0, 7); // "YYYY-MM"
      const existing = monthMap.get(monthKey);
      if (existing) {
        existing.totalRevenue += Number(d.total_revenue) || 0;
        existing.serviceRevenue += Number(d.service_revenue) || 0;
        existing.productRevenue += Number(d.product_revenue) || 0;
        existing.transactions += Number(d.total_transactions) || 0;
        existing.dayCount += 1;
      } else {
        monthMap.set(monthKey, {
          month: monthKey,
          totalRevenue: Number(d.total_revenue) || 0,
          serviceRevenue: Number(d.service_revenue) || 0,
          productRevenue: Number(d.product_revenue) || 0,
          transactions: Number(d.total_transactions) || 0,
          dayCount: 1,
        });
      }
    });

    // Aggregate into quarters
    const quarterMap = new Map<string, QuarterData>();
    monthMap.forEach((m) => {
      const { year, q } = getQuarterFromDate(m.month + "-01");
      const label = getQuarterLabel(year, q);
      const existing = quarterMap.get(label);
      if (existing) {
        existing.totalRevenue += m.totalRevenue;
        existing.serviceRevenue += m.serviceRevenue;
        existing.productRevenue += m.productRevenue;
        existing.transactions += m.transactions;
        existing.months.push(m);
      } else {
        quarterMap.set(label, {
          quarter: label,
          year,
          q,
          totalRevenue: m.totalRevenue,
          serviceRevenue: m.serviceRevenue,
          productRevenue: m.productRevenue,
          transactions: m.transactions,
          months: [m],
        });
      }
    });

    const quarters = Array.from(quarterMap.values()).sort(
      (a, b) => a.year * 10 + a.q - (b.year * 10 + b.q)
    );

    // Calculate growth rates
    const growthRates: number[] = [];
    for (let i = 1; i < quarters.length; i++) {
      const prev = quarters[i - 1].totalRevenue;
      const curr = quarters[i].totalRevenue;
      if (prev > 0) {
        growthRates.push(((curr - prev) / prev) * 100);
      }
    }

    // Linear regression on quarterly revenue
    const xs = quarters.map((_, i) => i);
    const ys = quarters.map((q) => q.totalRevenue);
    const regression = linearRegression(xs, ys);

    // Seasonal indices
    const seasonalIndices = calculateSeasonalIndices(quarters);

    // Momentum
    const momentum = determineMomentum(growthRates);

    // YoY growth
    const lastQuarter = quarters[quarters.length - 1];
    const sameQuarterLastYear = quarters.find(
      (q) => q.q === lastQuarter?.q && q.year === (lastQuarter?.year || 0) - 1
    );
    const yoyGrowth =
      sameQuarterLastYear && sameQuarterLastYear.totalRevenue > 0
        ? ((lastQuarter.totalRevenue - sameQuarterLastYear.totalRevenue) / sameQuarterLastYear.totalRevenue) * 100
        : null;

    // Generate projections for next 4 quarters
    const now = new Date();
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();

    const projections: any[] = [];
    const scenarioMultipliers = {
      conservative: 0.85,
      baseline: 1.0,
      optimistic: 1.15,
    };

    for (let i = 1; i <= 4; i++) {
      let futureQ = currentQ + i;
      let futureYear = currentYear;
      while (futureQ > 4) {
        futureQ -= 4;
        futureYear += 1;
      }

      const trendValue = regression.slope * (quarters.length + i - 1) + regression.intercept;
      const seasonalAdj = seasonalIndices[futureQ] || 1;
      const baseProjection = Math.max(0, trendValue * seasonalAdj);

      for (const [scenario, multiplier] of Object.entries(scenarioMultipliers)) {
        const projected = baseProjection * multiplier;
        const qLabel = getQuarterLabel(futureYear, futureQ);
        const periodStart = `${futureYear}-${String((futureQ - 1) * 3 + 1).padStart(2, "0")}-01`;
        const endMonth = futureQ * 3;
        const periodEnd = `${futureYear}-${String(endMonth).padStart(2, "0")}-${endMonth === 2 ? "28" : ["04", "06", "09", "11"].includes(String(endMonth).padStart(2, "0")) ? "30" : "31"}`;

        const lastGrowthRate = growthRates.length > 0 ? growthRates[growthRates.length - 1] : 0;

        projections.push({
          organization_id: organizationId,
          location_id: locationId || null,
          forecast_type: "quarterly",
          period_label: qLabel,
          period_start: periodStart,
          period_end: periodEnd,
          scenario,
          projected_revenue: Math.round(projected * 100) / 100,
          projected_service_revenue: Math.round(projected * 0.7 * 100) / 100,
          projected_product_revenue: Math.round(projected * 0.3 * 100) / 100,
          growth_rate_qoq: lastGrowthRate * multiplier,
          growth_rate_yoy: yoyGrowth !== null ? yoyGrowth * multiplier : null,
          confidence_lower: Math.round(projected * 0.85 * 100) / 100,
          confidence_upper: Math.round(projected * 1.15 * 100) / 100,
          momentum,
          seasonality_index: seasonalAdj,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // Generate AI insights
    let insights: string[] = [];
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY && quarters.length >= 2) {
        const context = `Historical quarterly revenue data for a salon/beauty business:
${quarters.map((q) => `${q.quarter}: $${q.totalRevenue.toLocaleString()} (services: $${q.serviceRevenue.toLocaleString()}, products: $${q.productRevenue.toLocaleString()})`).join("\n")}

QoQ growth rates: ${growthRates.map((r) => `${r.toFixed(1)}%`).join(", ")}
YoY growth: ${yoyGrowth !== null ? `${yoyGrowth.toFixed(1)}%` : "N/A"}
Momentum: ${momentum}
Seasonal indices: ${Object.entries(seasonalIndices).map(([q, idx]) => `Q${q}: ${idx.toFixed(2)}`).join(", ")}
Trend R²: ${regression.r2.toFixed(3)}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content:
                  "You are a business analytics advisor for salon/beauty businesses. Given revenue data, provide 3-4 concise, actionable insights about growth trends, seasonality, and recommendations. Each insight should be 1-2 sentences. Return ONLY a JSON array of strings. No markdown.",
              },
              { role: "user", content: context },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            // Try parsing as JSON array
            const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
            if (Array.isArray(parsed)) {
              insights = parsed;
            }
          } catch {
            // If not valid JSON, split by newlines
            insights = content
              .split("\n")
              .map((l: string) => l.replace(/^[-*•]\s*/, "").trim())
              .filter((l: string) => l.length > 10);
          }
        }
      }
    } catch (e) {
      console.error("AI insights error:", e);
    }

    // Fallback insights if AI failed
    if (insights.length === 0 && quarters.length >= 2) {
      const lastQ = quarters[quarters.length - 1];
      const prevQ = quarters[quarters.length - 2];
      const qoqChange = prevQ.totalRevenue > 0 ? ((lastQ.totalRevenue - prevQ.totalRevenue) / prevQ.totalRevenue) * 100 : 0;

      insights = [
        `Revenue ${qoqChange >= 0 ? "grew" : "declined"} ${Math.abs(qoqChange).toFixed(1)}% last quarter (${lastQ.quarter}).`,
        `Revenue momentum is ${momentum} based on recent quarter trends.`,
        `${getQuarterLabel(currentYear, seasonalIndices[1] > seasonalIndices[3] ? 1 : 3)} tends to be your strongest quarter historically.`,
      ];
    }

    // Store projections with insights
    const projectionsWithInsights = projections.map((p) => ({
      ...p,
      insights: p.scenario === "baseline" ? insights : null,
    }));

    // Delete old forecasts and insert new ones
    await supabase
      .from("growth_forecasts")
      .delete()
      .eq("organization_id", organizationId)
      .lt("expires_at", new Date().toISOString());

    if (projectionsWithInsights.length > 0) {
      const { error: insertError } = await supabase
        .from("growth_forecasts")
        .insert(projectionsWithInsights);

      if (insertError) {
        console.error("Error caching forecasts:", insertError);
      }
    }

    // Build actuals for the chart (past quarters)
    const actuals = quarters.map((q) => ({
      period: q.quarter,
      revenue: q.totalRevenue,
      serviceRevenue: q.serviceRevenue,
      productRevenue: q.productRevenue,
      type: "actual" as const,
    }));

    // Build response grouped by scenario
    const scenarios: Record<string, any[]> = {};
    projectionsWithInsights.forEach((p) => {
      if (!scenarios[p.scenario]) scenarios[p.scenario] = [];
      scenarios[p.scenario].push({
        period: p.period_label,
        revenue: p.projected_revenue,
        serviceRevenue: p.projected_service_revenue,
        productRevenue: p.projected_product_revenue,
        confidenceLower: p.confidence_lower,
        confidenceUpper: p.confidence_upper,
        type: "projected" as const,
      });
    });

    return new Response(
      JSON.stringify({
        source: "computed",
        actuals,
        scenarios,
        insights,
        summary: {
          momentum,
          lastQoQGrowth: growthRates.length > 0 ? growthRates[growthRates.length - 1] : null,
          yoyGrowth,
          seasonalIndices,
          trendR2: regression.r2,
          dataPoints: dailyData.length,
          quartersAvailable: quarters.length,
          nextQuarterBaseline: projections.find((p) => p.scenario === "baseline")?.projected_revenue || 0,
          nextQuarterLabel: projections.find((p) => p.scenario === "baseline")?.period_label || "",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("growth-forecasting error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
