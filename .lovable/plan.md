
# Make Platform Overview Stat Cards Clickable

## Summary

Convert the four stat cards on the Platform Overview page into clickable links that navigate to their respective detail pages. This improves UX by making the cards actionable entry points to related views.

---

## Card-to-Route Mapping

| Card | Route | Notes |
|------|-------|-------|
| Total Accounts | `/dashboard/platform/accounts` | View all accounts |
| In Onboarding | `/dashboard/platform/accounts?status=onboarding` | Accounts filtered by onboarding status |
| Pending Migrations | `/dashboard/platform/import` | Migration/import tool |
| Total Locations | `/dashboard/platform/accounts` | Locations are scoped to accounts |

---

## Implementation

### 1. Update StatCard Interface

Add an optional `href` prop to the StatCard component:

```typescript
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  variant?: 'default' | 'warning' | 'success';
  href?: string;  // NEW: optional link destination
}
```

### 2. Modify StatCard Component

Wrap the card content in a `Link` component when `href` is provided. Add visual affordances (cursor pointer, subtle arrow indicator):

```tsx
import { Link } from 'react-router-dom';

function StatCard({ title, value, icon: Icon, description, variant = 'default', href }: StatCardProps) {
  // ... existing styles ...
  
  const content = (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl ${iconStyles[variant]} transition-colors`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={`text-4xl font-bold ${valueStyles[variant]} mb-1`}>{value}</div>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
  
  const cardClasses = "group relative rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6 transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600/50";
  
  if (href) {
    return (
      <Link to={href} className={cn(cardClasses, "cursor-pointer block")}>
        {/* glow effect */}
        {content}
      </Link>
    );
  }
  
  return (
    <div className={cardClasses}>
      {/* glow effect */}
      {content}
    </div>
  );
}
```

### 3. Add href Props to StatCard Usage

Update the stat card instances to include their destination routes:

```tsx
<StatCard
  title="Total Accounts"
  value={stats?.totalOrganizations || 0}
  icon={Building2}
  description="Active accounts"
  href="/dashboard/platform/accounts"
/>
<StatCard
  title="In Onboarding"
  value={stats?.onboardingOrganizations || 0}
  icon={Clock}
  description="Accounts being set up"
  variant="warning"
  href="/dashboard/platform/accounts?status=onboarding"
/>
<StatCard
  title="Pending Migrations"
  value={stats?.pendingMigrations || 0}
  icon={Upload}
  description="Data imports in progress"
  variant={stats?.pendingMigrations ? 'warning' : 'default'}
  href="/dashboard/platform/import"
/>
<StatCard
  title="Total Locations"
  value={stats?.totalLocations || 0}
  icon={MapPin}
  description="Across all accounts"
  href="/dashboard/platform/accounts"
/>
```

---

## Visual Enhancements

The existing hover styles (glow effect, border brightening) already provide good feedback. Adding `cursor-pointer` ensures the cards feel clickable.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/Overview.tsx` | Add `href` prop to StatCard interface, wrap in Link when href provided, add routes to each card instance |

---

## Import Requirements

Add `Link` from react-router-dom (already imported as `useNavigate` is used) and `cn` utility for class merging.
