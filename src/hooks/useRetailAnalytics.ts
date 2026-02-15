import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, subDays, format } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetailSummary {
  totalRevenue: number;
  priorRevenue: number;
  revenueChange: number;
  totalUnits: number;
  priorUnits: number;
  unitsChange: number;
  uniqueProducts: number;
  avgProductTicket: number;
  totalDiscount: number;
  discountRate: number;
  attachmentRate: number;
}

export interface ProductRow {
  name: string;
  category: string | null;
  unitsSold: number;
  revenue: number;
  avgPrice: number;
  discount: number;
  priorRevenue: number;
  revenueTrend: number; // % change vs prior
}

export interface RedFlag {
  product: string;
  type: 'declining' | 'heavy_discount' | 'slow_mover';
  label: string;
  severity: 'warning' | 'danger';
  detail: string;
}

export interface CategoryRow {
  category: string;
  revenue: number;
  units: number;
  productCount: number;
  avgPrice: number;
  pctOfTotal: number;
}

export interface DailyTrend {
  date: string;
  revenue: number;
  units: number;
}

export interface StaffRetailRow {
  userId: string | null;
  name: string;
  photoUrl: string | null;
  productRevenue: number;
  unitsSold: number;
  attachmentRate: number;
  avgTicket: number;
}

export interface MarginRow {
  name: string;
  revenue: number;
  cost: number;
  margin: number;
  profit: number;
}

export interface MarginData {
  grossMarginPct: number;
  estimatedProfit: number;
  products: MarginRow[];
}

export interface RetailAnalyticsResult {
  summary: RetailSummary;
  products: ProductRow[];
  redFlags: RedFlag[];
  categories: CategoryRow[];
  dailyTrend: DailyTrend[];
  staffRetail: StaffRetailRow[];
  marginData: MarginData | null;
}

// ---------------------------------------------------------------------------
// Helper – product item_type variants
// ---------------------------------------------------------------------------
const PRODUCT_TYPES = ['Product', 'product', 'PRODUCT', 'Retail', 'retail', 'RETAIL'];
const SERVICE_TYPES = ['Service', 'service', 'SERVICE'];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRetailAnalytics(dateFrom?: string, dateTo?: string, locationId?: string) {
  return useQuery({
    queryKey: ['retail-analytics', dateFrom, dateTo, locationId || 'all'],
    queryFn: async (): Promise<RetailAnalyticsResult> => {
      if (!dateFrom || !dateTo) {
        return emptyResult();
      }

      const from = parseISO(dateFrom);
      const to = parseISO(dateTo);
      const span = differenceInDays(to, from) + 1;
      const priorFrom = format(subDays(from, span), 'yyyy-MM-dd');
      const priorTo = format(subDays(from, 1), 'yyyy-MM-dd');

      // ── Fetch current period transaction items ──
      let currentQ = supabase
        .from('phorest_transaction_items')
        .select('item_name, item_category, item_type, quantity, unit_price, discount, total_amount, transaction_date, transaction_id, phorest_staff_id')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo);
      if (locationId && locationId !== 'all') currentQ = currentQ.eq('location_id', locationId);

      // ── Fetch prior period transaction items ──
      let priorQ = supabase
        .from('phorest_transaction_items')
        .select('item_name, item_type, quantity, total_amount, transaction_id, phorest_staff_id')
        .gte('transaction_date', priorFrom)
        .lte('transaction_date', priorTo);
      if (locationId && locationId !== 'all') priorQ = priorQ.eq('location_id', locationId);

      // ── Fetch product catalog for margin data ──
      const catalogQ = supabase
        .from('products')
        .select('name, cost_price, retail_price')
        .eq('is_active', true);

      const [currentRes, priorRes, catalogRes] = await Promise.all([currentQ, priorQ, catalogQ]);

      if (currentRes.error) throw currentRes.error;
      if (priorRes.error) throw priorRes.error;

      const currentItems = currentRes.data || [];
      const priorItems = priorRes.data || [];
      const catalog = catalogRes.data || [];

      // Build cost lookup from products catalog
      const costMap = new Map<string, number>();
      let hasCostData = false;
      catalog.forEach((p: any) => {
        if (p.cost_price != null && p.cost_price > 0) {
          hasCostData = true;
          costMap.set(p.name?.toLowerCase(), Number(p.cost_price));
        }
      });

      // ── Aggregate current period products ──
      const prodMap = new Map<string, { name: string; category: string | null; units: number; revenue: number; discount: number; prices: number[] }>();
      const dailyMap = new Map<string, { revenue: number; units: number }>();
      const staffMap = new Map<string, { revenue: number; units: number; serviceTxs: Set<string>; productTxs: Set<string> }>();
      let totalProductRevenue = 0;
      let totalProductUnits = 0;
      let totalDiscount = 0;
      const allServiceTxs = new Set<string>();
      const allProductTxs = new Set<string>();

      currentItems.forEach((item: any) => {
        const isProduct = PRODUCT_TYPES.includes(item.item_type);
        const isService = SERVICE_TYPES.includes(item.item_type);
        const txId = item.transaction_id;

        // Track all service/product transactions for attachment rate
        if (isService && txId) allServiceTxs.add(txId);
        if (isProduct && txId) allProductTxs.add(txId);

        // Staff tracking (needs both service and product tx sets)
        if (item.phorest_staff_id) {
          if (!staffMap.has(item.phorest_staff_id)) {
            staffMap.set(item.phorest_staff_id, { revenue: 0, units: 0, serviceTxs: new Set(), productTxs: new Set() });
          }
          const s = staffMap.get(item.phorest_staff_id)!;
          if (isService && txId) s.serviceTxs.add(txId);
          if (isProduct) {
            s.revenue += Number(item.total_amount) || 0;
            s.units += item.quantity || 1;
            if (txId) s.productTxs.add(txId);
          }
        }

        if (!isProduct) return;

        const name = item.item_name || 'Unknown';
        const qty = item.quantity || 1;
        const rev = Number(item.total_amount) || 0;
        const disc = Number(item.discount) || 0;

        totalProductRevenue += rev;
        totalProductUnits += qty;
        totalDiscount += disc;

        // Product aggregation
        if (!prodMap.has(name)) {
          prodMap.set(name, { name, category: item.item_category, units: 0, revenue: 0, discount: 0, prices: [] });
        }
        const p = prodMap.get(name)!;
        p.units += qty;
        p.revenue += rev;
        p.discount += disc;
        p.prices.push(Number(item.unit_price) || rev / qty);

        // Daily trend
        const d = item.transaction_date;
        if (d) {
          if (!dailyMap.has(d)) dailyMap.set(d, { revenue: 0, units: 0 });
          const day = dailyMap.get(d)!;
          day.revenue += rev;
          day.units += qty;
        }
      });

      // ── Aggregate prior period for comparison ──
      const priorProdMap = new Map<string, { revenue: number; units: number }>();
      let priorTotalRevenue = 0;
      let priorTotalUnits = 0;

      priorItems.forEach((item: any) => {
        if (!PRODUCT_TYPES.includes(item.item_type)) return;
        const name = item.item_name || 'Unknown';
        const rev = Number(item.total_amount) || 0;
        const qty = item.quantity || 1;
        priorTotalRevenue += rev;
        priorTotalUnits += qty;
        if (!priorProdMap.has(name)) priorProdMap.set(name, { revenue: 0, units: 0 });
        const pp = priorProdMap.get(name)!;
        pp.revenue += rev;
        pp.units += qty;
      });

      // ── Build product rows ──
      const products: ProductRow[] = Array.from(prodMap.values()).map(p => {
        const prior = priorProdMap.get(p.name);
        const priorRev = prior?.revenue ?? 0;
        const trend = priorRev > 0 ? ((p.revenue - priorRev) / priorRev) * 100 : (p.revenue > 0 ? 100 : 0);
        return {
          name: p.name,
          category: p.category,
          unitsSold: p.units,
          revenue: p.revenue,
          avgPrice: p.units > 0 ? p.revenue / p.units : 0,
          discount: p.discount,
          priorRevenue: priorRev,
          revenueTrend: trend,
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // ── Red flags ──
      const redFlags: RedFlag[] = [];
      products.forEach(p => {
        // Declining: revenue down > 20% vs prior period
        if (p.priorRevenue > 0 && p.revenueTrend < -20) {
          redFlags.push({
            product: p.name,
            type: 'declining',
            label: 'Declining Sales',
            severity: p.revenueTrend < -50 ? 'danger' : 'warning',
            detail: `Revenue down ${Math.abs(Math.round(p.revenueTrend))}% vs prior period`,
          });
        }
        // Heavy discounting: discount > 15% of revenue + discount
        if (p.discount > 0 && p.revenue > 0) {
          const discPct = (p.discount / (p.revenue + p.discount)) * 100;
          if (discPct > 15) {
            redFlags.push({
              product: p.name,
              type: 'heavy_discount',
              label: 'Heavy Discounting',
              severity: discPct > 30 ? 'danger' : 'warning',
              detail: `${Math.round(discPct)}% of retail value discounted`,
            });
          }
        }
        // Slow mover: fewer than 3 units in the period
        if (p.unitsSold < 3 && span >= 14) {
          redFlags.push({
            product: p.name,
            type: 'slow_mover',
            label: 'Slow Mover',
            severity: p.unitsSold <= 1 ? 'danger' : 'warning',
            detail: `Only ${p.unitsSold} unit${p.unitsSold !== 1 ? 's' : ''} sold in ${span} days`,
          });
        }
      });

      // ── Category breakdown ──
      const catMap = new Map<string, { revenue: number; units: number; products: Set<string> }>();
      products.forEach(p => {
        const cat = p.category || 'Uncategorized';
        if (!catMap.has(cat)) catMap.set(cat, { revenue: 0, units: 0, products: new Set() });
        const c = catMap.get(cat)!;
        c.revenue += p.revenue;
        c.units += p.unitsSold;
        c.products.add(p.name);
      });
      const categories: CategoryRow[] = Array.from(catMap.entries())
        .map(([cat, d]) => ({
          category: cat,
          revenue: d.revenue,
          units: d.units,
          productCount: d.products.size,
          avgPrice: d.units > 0 ? d.revenue / d.units : 0,
          pctOfTotal: totalProductRevenue > 0 ? (d.revenue / totalProductRevenue) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // ── Daily trend (sorted by date) ──
      const dailyTrend: DailyTrend[] = Array.from(dailyMap.entries())
        .map(([date, d]) => ({ date, revenue: d.revenue, units: d.units }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ── Staff retail performance ──
      const staffIds = Array.from(staffMap.keys());
      let staffRetail: StaffRetailRow[] = [];
      if (staffIds.length > 0) {
        const { data: mappings } = await supabase
          .from('phorest_staff_mapping')
          .select('phorest_staff_id, user_id, phorest_staff_name')
          .in('phorest_staff_id', staffIds);

        const userIds = (mappings || []).map((m: any) => m.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('employee_profiles')
          .select('user_id, full_name, display_name, photo_url')
          .in('user_id', userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        const mappingMap = new Map((mappings || []).map((m: any) => [m.phorest_staff_id, m]));

        staffRetail = staffIds.map(sid => {
          const d = staffMap.get(sid)!;
          const mapping = mappingMap.get(sid) as any;
          const profile = mapping?.user_id ? profileMap.get(mapping.user_id) as any : null;

          let attached = 0;
          d.serviceTxs.forEach(tx => { if (d.productTxs.has(tx)) attached++; });
          const rate = d.serviceTxs.size > 0 ? (attached / d.serviceTxs.size) * 100 : 0;

          return {
            userId: mapping?.user_id || null,
            name: profile?.display_name || profile?.full_name || mapping?.phorest_staff_name || 'Unknown',
            photoUrl: profile?.photo_url || null,
            productRevenue: d.revenue,
            unitsSold: d.units,
            attachmentRate: Math.round(rate),
            avgTicket: d.units > 0 ? d.revenue / d.units : 0,
          };
        })
        .filter(s => s.productRevenue > 0)
        .sort((a, b) => b.productRevenue - a.productRevenue);
      }

      // ── Attachment rate ──
      let attachedCount = 0;
      allServiceTxs.forEach(tx => { if (allProductTxs.has(tx)) attachedCount++; });
      const attachmentRate = allServiceTxs.size > 0 ? Math.round((attachedCount / allServiceTxs.size) * 100) : 0;

      // ── Margin data (conditional) ──
      let marginData: MarginData | null = null;
      if (hasCostData) {
        let totalCost = 0;
        const marginProducts: MarginRow[] = [];
        products.forEach(p => {
          const cost = costMap.get(p.name.toLowerCase());
          if (cost != null) {
            const totalCostForProduct = cost * p.unitsSold;
            totalCost += totalCostForProduct;
            const profit = p.revenue - totalCostForProduct;
            const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
            marginProducts.push({ name: p.name, revenue: p.revenue, cost: totalCostForProduct, margin, profit });
          }
        });
        marginProducts.sort((a, b) => b.profit - a.profit);
        const totalMarginRevenue = marginProducts.reduce((s, m) => s + m.revenue, 0);
        const totalProfit = totalMarginRevenue - totalCost;
        marginData = {
          grossMarginPct: totalMarginRevenue > 0 ? (totalProfit / totalMarginRevenue) * 100 : 0,
          estimatedProfit: totalProfit,
          products: marginProducts,
        };
      }

      // ── Summary ──
      const revenueChange = priorTotalRevenue > 0
        ? ((totalProductRevenue - priorTotalRevenue) / priorTotalRevenue) * 100
        : (totalProductRevenue > 0 ? 100 : 0);
      const unitsChange = priorTotalUnits > 0
        ? ((totalProductUnits - priorTotalUnits) / priorTotalUnits) * 100
        : (totalProductUnits > 0 ? 100 : 0);

      const summary: RetailSummary = {
        totalRevenue: totalProductRevenue,
        priorRevenue: priorTotalRevenue,
        revenueChange,
        totalUnits: totalProductUnits,
        priorUnits: priorTotalUnits,
        unitsChange,
        uniqueProducts: prodMap.size,
        avgProductTicket: totalProductUnits > 0 ? totalProductRevenue / totalProductUnits : 0,
        totalDiscount,
        discountRate: totalProductRevenue + totalDiscount > 0
          ? (totalDiscount / (totalProductRevenue + totalDiscount)) * 100
          : 0,
        attachmentRate,
      };

      return { summary, products, redFlags, categories, dailyTrend, staffRetail, marginData };
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 5 * 60 * 1000,
  });
}

function emptyResult(): RetailAnalyticsResult {
  return {
    summary: { totalRevenue: 0, priorRevenue: 0, revenueChange: 0, totalUnits: 0, priorUnits: 0, unitsChange: 0, uniqueProducts: 0, avgProductTicket: 0, totalDiscount: 0, discountRate: 0, attachmentRate: 0 },
    products: [],
    redFlags: [],
    categories: [],
    dailyTrend: [],
    staffRetail: [],
    marginData: null,
  };
}
