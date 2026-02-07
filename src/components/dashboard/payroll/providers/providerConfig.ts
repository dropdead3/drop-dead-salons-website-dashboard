import { 
  DollarSign, 
  Calculator, 
  Square, 
  Building2, 
  ShieldCheck, 
  CircleDollarSign, 
  Home, 
  Waves,
  LucideIcon
} from 'lucide-react';

export type PayrollProvider = 
  | 'gusto' 
  | 'quickbooks' 
  | 'adp' 
  | 'paychex' 
  | 'square' 
  | 'onpay' 
  | 'homebase' 
  | 'rippling' 
  | 'wave';

export type ProviderTier = 'recommended' | 'enterprise' | 'budget';
export type ProviderStatus = 'available' | 'coming_soon' | 'request';

export interface PayrollProviderConfig {
  id: PayrollProvider;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  brandColor: string;
  gradientFrom: string;
  gradientTo: string;
  tier: ProviderTier;
  pricing: {
    basePrice: number | null;
    perEmployee: number | null;
    pricingModel: string;
  };
  features: string[];
  bestFor: string[];
  integrations: string[];
  status: ProviderStatus;
}

export const PAYROLL_PROVIDERS: PayrollProviderConfig[] = [
  // RECOMMENDED TIER
  {
    id: 'gusto',
    name: 'Gusto',
    tagline: 'Full-Service HR & Benefits',
    description: 'The #1 payroll for small businesses. Automated taxes, benefits, and HR tools all in one platform.',
    icon: DollarSign,
    brandColor: '#F45D22',
    gradientFrom: '#F45D22',
    gradientTo: '#FF8A50',
    tier: 'recommended',
    pricing: {
      basePrice: 40,
      perEmployee: 6,
      pricingModel: '$40/mo + $6/person',
    },
    features: [
      'Automated tax filing & payments',
      'Direct deposit (2-4 day)',
      'Employee self-onboarding',
      'W-2s, 1099s & new hire reporting',
      'Health insurance options',
      '401(k) retirement plans',
    ],
    bestFor: [
      'Salons with 5-50 employees',
      'Teams needing benefits',
      'Multi-location operations',
    ],
    integrations: ['QuickBooks', 'Xero', 'Time tracking apps'],
    status: 'available',
  },
  {
    id: 'square',
    name: 'Square Payroll',
    tagline: 'POS Integration Made Easy',
    description: 'Seamlessly sync payroll with Square POS. Perfect for salons already using Square for payments.',
    icon: Square,
    brandColor: '#000000',
    gradientFrom: '#1A1A1A',
    gradientTo: '#404040',
    tier: 'recommended',
    pricing: {
      basePrice: 35,
      perEmployee: 6,
      pricingModel: '$35/mo + $6/person',
    },
    features: [
      'Square POS sync',
      'Automatic tip import',
      'Next-day direct deposit',
      'Automated tax filing',
      'Timecard integration',
      'Commission tracking',
    ],
    bestFor: [
      'Square POS users',
      'Tip-heavy businesses',
      'Simple payroll needs',
    ],
    integrations: ['Square POS', 'Square Team', 'Square Appointments'],
    status: 'coming_soon',
  },
  {
    id: 'onpay',
    name: 'OnPay',
    tagline: 'Commission Pro for Services',
    description: 'Built for service businesses with complex commission structures. Unlimited payroll runs included.',
    icon: CircleDollarSign,
    brandColor: '#00A19A',
    gradientFrom: '#00A19A',
    gradientTo: '#00C9B7',
    tier: 'recommended',
    pricing: {
      basePrice: 40,
      perEmployee: 6,
      pricingModel: '$40/mo + $6/person',
    },
    features: [
      'Advanced tip tracking',
      'Commission calculations',
      'Unlimited payroll runs',
      'Multi-state support',
      'PTO management',
      'Workers comp integration',
    ],
    bestFor: [
      'Commission-based teams',
      'Multi-state operations',
      'High tip volume',
    ],
    integrations: ['QuickBooks', 'Xero', 'When I Work', 'Deputy'],
    status: 'coming_soon',
  },

  // ENTERPRISE TIER
  {
    id: 'quickbooks',
    name: 'QuickBooks Payroll',
    tagline: 'Accounting Integration',
    description: 'Payroll that syncs perfectly with QuickBooks. Ideal for salons with established accounting workflows.',
    icon: Calculator,
    brandColor: '#2CA01C',
    gradientFrom: '#2CA01C',
    gradientTo: '#4AC33A',
    tier: 'enterprise',
    pricing: {
      basePrice: 50,
      perEmployee: 6,
      pricingModel: '$50/mo + $6/person',
    },
    features: [
      'QuickBooks auto-sync',
      'Same-day direct deposit',
      'Tax penalty protection',
      '1099 e-filing',
      'HR support center',
      'Employee benefits',
    ],
    bestFor: [
      'QuickBooks users',
      'CPA-managed books',
      'Detailed reporting needs',
    ],
    integrations: ['QuickBooks Online', 'QuickBooks Desktop', 'TSheets'],
    status: 'available',
  },
  {
    id: 'adp',
    name: 'ADP',
    tagline: 'Enterprise-Grade Compliance',
    description: 'Industry-leading payroll for larger salon chains. Robust compliance and HR tools.',
    icon: Building2,
    brandColor: '#D0271D',
    gradientFrom: '#D0271D',
    gradientTo: '#FF4136',
    tier: 'enterprise',
    pricing: {
      basePrice: null,
      perEmployee: null,
      pricingModel: 'Custom pricing',
    },
    features: [
      'Enterprise compliance',
      'Multi-location payroll',
      'Advanced reporting',
      'Dedicated support',
      'Benefits administration',
      'Learning management',
    ],
    bestFor: [
      'Large salon chains (50+ employees)',
      'Franchise operations',
      'Complex compliance needs',
    ],
    integrations: ['SAP', 'Oracle', 'Workday', 'Major accounting systems'],
    status: 'coming_soon',
  },
  {
    id: 'paychex',
    name: 'Paychex',
    tagline: 'Full HR Bundle',
    description: 'Complete HR and payroll solution. Perfect for salons needing comprehensive HR support.',
    icon: ShieldCheck,
    brandColor: '#0033A0',
    gradientFrom: '#0033A0',
    gradientTo: '#0052CC',
    tier: 'enterprise',
    pricing: {
      basePrice: null,
      perEmployee: null,
      pricingModel: 'Custom pricing',
    },
    features: [
      'Full HR management',
      'Employee screening',
      'Retirement services',
      'Insurance options',
      'HR compliance',
      'Time & attendance',
    ],
    bestFor: [
      'HR-focused businesses',
      'Growing salon chains',
      'Compliance-heavy states',
    ],
    integrations: ['Major accounting platforms', 'Time tracking systems'],
    status: 'coming_soon',
  },
  {
    id: 'rippling',
    name: 'Rippling',
    tagline: 'All-in-One Modern Platform',
    description: 'Modern HR platform that connects payroll, benefits, devices, and apps in one system.',
    icon: Waves,
    brandColor: '#4F46E5',
    gradientFrom: '#4F46E5',
    gradientTo: '#7C3AED',
    tier: 'enterprise',
    pricing: {
      basePrice: 35,
      perEmployee: 8,
      pricingModel: '$35/mo + $8/person',
    },
    features: [
      'Unified HR platform',
      'Device management',
      'App provisioning',
      'Global payroll',
      'Spend management',
      'Workflow automation',
    ],
    bestFor: [
      'Tech-forward salons',
      'Fast-growing teams',
      'Multi-system consolidation',
    ],
    integrations: ['500+ apps', 'Slack', 'Google Workspace', 'Microsoft 365'],
    status: 'coming_soon',
  },

  // BUDGET TIER
  {
    id: 'homebase',
    name: 'Homebase',
    tagline: 'Free Scheduling + Payroll',
    description: 'Start free with scheduling and time tracking. Add payroll when you\'re ready.',
    icon: Home,
    brandColor: '#7C3AED',
    gradientFrom: '#7C3AED',
    gradientTo: '#A855F7',
    tier: 'budget',
    pricing: {
      basePrice: 0,
      perEmployee: 6,
      pricingModel: 'Free tier + $6/person for payroll',
    },
    features: [
      'Free scheduling',
      'Time clock app',
      'Team messaging',
      'Hiring tools',
      'Basic HR compliance',
      'Payroll add-on',
    ],
    bestFor: [
      'New salons',
      'Scheduling-first needs',
      'Budget-conscious teams',
    ],
    integrations: ['Square', 'Clover', 'Toast', 'QuickBooks'],
    status: 'coming_soon',
  },
  {
    id: 'wave',
    name: 'Wave Payroll',
    tagline: 'Free for Small Teams',
    description: 'Free accounting with affordable payroll add-on. Great for solo stylists and tiny teams.',
    icon: Waves,
    brandColor: '#2563EB',
    gradientFrom: '#2563EB',
    gradientTo: '#3B82F6',
    tier: 'budget',
    pricing: {
      basePrice: 20,
      perEmployee: 6,
      pricingModel: '$20/mo base (tax states) + $6/person',
    },
    features: [
      'Free accounting',
      'Free invoicing',
      'Direct deposit',
      'Tax service states only',
      'Employee portal',
      'Year-end tax forms',
    ],
    bestFor: [
      'Solo stylists',
      'Very small teams (1-5)',
      'Simple payroll needs',
    ],
    integrations: ['Wave Accounting', 'Wave Invoicing'],
    status: 'coming_soon',
  },
];

export const getProvidersByTier = (tier: ProviderTier): PayrollProviderConfig[] => {
  return PAYROLL_PROVIDERS.filter(p => p.tier === tier);
};

export const getProviderById = (id: PayrollProvider): PayrollProviderConfig | undefined => {
  return PAYROLL_PROVIDERS.find(p => p.id === id);
};
