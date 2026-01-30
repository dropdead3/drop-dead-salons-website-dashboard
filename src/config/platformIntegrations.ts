import { FileText, CreditCard, MessageSquare, LucideIcon } from 'lucide-react';

export interface PlatformIntegration {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: 'connected' | 'not_configured' | 'coming_soon';
  category: 'documents' | 'payments' | 'communication' | 'analytics';
  features: string[];
  configPath: string;
}

export const PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  {
    id: 'pandadoc',
    name: 'PandaDoc',
    description: 'Contract signing and billing automation',
    icon: FileText,
    status: 'connected', // Dynamic based on stats in component
    category: 'documents',
    features: ['Contract Signing', 'Field Extraction', 'Billing Auto-populate'],
    configPath: '/dashboard/platform/settings/integrations/pandadoc',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription billing',
    icon: CreditCard,
    status: 'coming_soon',
    category: 'payments',
    features: ['Payment Processing', 'Subscriptions', 'Invoicing'],
    configPath: '/dashboard/platform/settings/integrations/stripe',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS notifications and communication',
    icon: MessageSquare,
    status: 'coming_soon',
    category: 'communication',
    features: ['SMS Alerts', 'Two-Factor Auth', 'Appointment Reminders'],
    configPath: '/dashboard/platform/settings/integrations/twilio',
  },
];
