
# Multi-Integration Hub for Platform Settings

## Summary

Redesign the Platform Integrations tab to display multiple integrations as clickable cards in a grid layout. Each card shows the integration status, key stats, and navigates to a dedicated integration overview page when clicked. This follows the existing pattern from the salon-level IntegrationsTab while adapting it for the platform admin dark theme.

---

## Current State

**What Exists:**
- `PlatformIntegrationsTab` directly renders PandaDoc components inline
- `PandaDocStatusCard` and `PandaDocFieldMappingEditor` are embedded in the tab
- No routing structure for individual integration detail pages
- The salon-level `IntegrationsTab` has a good pattern with `Integration` interface and grid layout

**What's Needed:**
- Grid of integration cards (connected, available, coming soon)
- Clickable cards that navigate to `/dashboard/platform/settings/integrations/:id`
- New route for integration detail pages
- PandaDoc detail page that contains the current status card and field mapping editor
- Extensible structure for future integrations (Stripe, Twilio, etc.)

---

## Architecture

```text
Platform Settings → Integrations Tab
│
├── Integration Cards Grid
│   ├── PandaDoc Card (connected) → Click → /dashboard/platform/settings/integrations/pandadoc
│   ├── Stripe Card (coming soon)
│   ├── Twilio Card (coming soon)
│   └── + Request Integration
│
└── Integration Detail Pages
    └── /dashboard/platform/settings/integrations/:integrationId
        ├── PandaDoc Overview
        │   ├── PandaDocStatusCard
        │   └── PandaDocFieldMappingEditor
        ├── Stripe Overview (future)
        └── Twilio Overview (future)
```

---

## UI Design

### Integrations Tab - Card Grid View

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Integrations                                                             │
│  Connect and manage third-party services for platform operations          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Active Integrations                                                      │
│  ─────────────────────────────────────────────────────────────────────   │
│  ┌─────────────────────────────────┐                                     │
│  │ 📄 PandaDoc              ●Ready │  ← Clickable card                   │
│  │                                  │                                     │
│  │ Contract signing and billing     │                                     │
│  │ automation                       │                                     │
│  │                                  │                                     │
│  │ 12 documents  │  3 pending       │  ← Quick stats                     │
│  │                                  │                                     │
│  │ [Configure →]                    │  ← Subtle action indicator         │
│  └─────────────────────────────────┘                                     │
│                                                                           │
│  Coming Soon                                                              │
│  ─────────────────────────────────────────────────────────────────────   │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐│
│  │ 💳 Stripe            Coming Soon│  │ 📱 Twilio           Coming Soon ││
│  │                                  │  │                                  ││
│  │ Payment processing and           │  │ SMS notifications and            ││
│  │ subscription billing             │  │ communication                    ││
│  └─────────────────────────────────┘  └─────────────────────────────────┘│
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Integration Detail Page (PandaDoc)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to Integrations                                                   │
│                                                                           │
│  📄 PandaDoc Integration                                                 │
│  Automate contract signing and billing configuration                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [PandaDocStatusCard - webhook URL, config, stats]                       │
│                                                                           │
│  [PandaDocFieldMappingEditor - mapping configuration]                    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Platform Integration Interface

Define a consistent structure for all platform integrations:

```typescript
interface PlatformIntegration {
  id: string;                    // 'pandadoc', 'stripe', 'twilio'
  name: string;                  // 'PandaDoc'
  description: string;           // Short description
  icon: React.ComponentType;     // Lucide icon
  status: 'connected' | 'not_configured' | 'coming_soon';
  category: 'documents' | 'payments' | 'communication' | 'analytics';
  features: string[];            // Key features list
  configPath: string;            // '/dashboard/platform/settings/integrations/pandadoc'
  statsComponent?: React.ComponentType; // Optional inline stats
}
```

---

## Integration Cards Design

Each card follows the platform dark theme with interactive hover states:

**Connected Integration Card:**
- Glass variant with violet accent border when connected
- Status badge (top-right): "Ready" (emerald), "Issues" (amber), "Not Configured" (slate)
- Quick stats row at bottom (documents count, pending, etc.)
- Entire card is clickable, navigates to detail page
- Subtle "Configure →" text as affordance

**Coming Soon Card:**
- Reduced opacity (60%)
- "Coming Soon" badge
- Not clickable
- Brief description only

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/platform/settings/PlatformIntegrationCard.tsx` | Reusable clickable card component |
| `src/components/platform/settings/integrations/PandaDocIntegrationPage.tsx` | PandaDoc detail page |
| `src/pages/dashboard/platform/PlatformIntegrationDetail.tsx` | Router wrapper for integration detail pages |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/platform/settings/PlatformIntegrationsTab.tsx` | Replace inline components with card grid |
| `src/App.tsx` | Add route for `/dashboard/platform/settings/integrations/:integrationId` |
| `src/hooks/usePandaDocStats.ts` | Ensure it's usable in card preview |

---

## Routing Structure

Add nested route under platform settings:

```typescript
// In App.tsx, add inside the platform routes:
<Route path="settings/integrations/:integrationId" element={
  <ProtectedRoute requirePlatformRole="platform_admin">
    <PlatformIntegrationDetail />
  </ProtectedRoute>
} />
```

The `PlatformIntegrationDetail` component will:
1. Read `integrationId` from URL params
2. Render the appropriate integration page component
3. Handle "not found" for unknown integrations

---

## Integration Registry

Create a central registry for all platform integrations:

```typescript
// src/config/platformIntegrations.ts

import { FileText, CreditCard, MessageSquare, BarChart3 } from 'lucide-react';

export const PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  {
    id: 'pandadoc',
    name: 'PandaDoc',
    description: 'Contract signing and billing automation',
    icon: FileText,
    status: 'connected', // Will be dynamic based on stats
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
```

---

## PandaDoc Status Detection

Determine PandaDoc connection status dynamically:

```typescript
function usePandaDocStatus(): 'connected' | 'not_configured' | 'error' {
  const { data: stats } = usePandaDocStats();
  const { data: mapping } = usePandaDocFieldMapping();
  
  // Has received documents = connected and working
  if (stats && stats.totalDocuments > 0) return 'connected';
  
  // Has mapping configured but no documents yet
  if (mapping && Object.keys(mapping).length > 0) return 'not_configured';
  
  return 'not_configured';
}
```

---

## Component Details

### PlatformIntegrationCard

```typescript
interface PlatformIntegrationCardProps {
  integration: PlatformIntegration;
  stats?: {
    primary: { label: string; value: number };
    secondary?: { label: string; value: number };
  };
  onClick?: () => void;
}
```

Features:
- Uses `PlatformCard` with `variant="interactive"` for hover effects
- Displays icon, name, description, status badge
- Shows quick stats for connected integrations
- Full card is clickable (uses `useNavigate`)
- "Coming Soon" cards are not clickable and have reduced opacity

### PandaDocIntegrationPage

Wraps the existing components:
- `PlatformPageHeader` with back navigation to integrations tab
- `PandaDocStatusCard`
- `PandaDocFieldMappingEditor`

### PlatformIntegrationDetail

Router component that:
- Reads `integrationId` from params
- Switches to render correct integration page
- Shows 404 for unknown integrations

---

## Implementation Phases

### Phase 1: Infrastructure
1. Create `platformIntegrations.ts` config registry
2. Create `PlatformIntegrationCard` component
3. Add route for integration detail pages

### Phase 2: Integrations Tab Redesign
1. Refactor `PlatformIntegrationsTab` to use card grid
2. Group cards by status (Active, Coming Soon)
3. Wire up navigation on card click

### Phase 3: PandaDoc Detail Page
1. Create `PandaDocIntegrationPage` component
2. Create `PlatformIntegrationDetail` router wrapper
3. Move existing components into detail page

### Phase 4: Polish
1. Add quick stats preview on PandaDoc card
2. Add status detection hook
3. Test navigation flow

---

## Navigation Flow

1. User lands on Platform Settings
2. Clicks "Integrations" tab
3. Sees grid of integration cards
4. Clicks PandaDoc card
5. Navigates to `/dashboard/platform/settings/integrations/pandadoc`
6. Sees full PandaDoc configuration (status card + field mapping)
7. "Back to Integrations" returns to the tab view

---

## Future Extensibility

When adding a new integration (e.g., Stripe):
1. Add entry to `PLATFORM_INTEGRATIONS` registry
2. Create `StripeIntegrationPage` component
3. Add case in `PlatformIntegrationDetail` switch
4. Update status from 'coming_soon' to 'connected'

No changes needed to the integrations tab itself - it automatically renders from the registry.
