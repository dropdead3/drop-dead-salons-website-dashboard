

# Platform Administration Design System

## Design Direction

Based on your reference images, the Platform Admin UI will feature a distinctive **fintech-inspired dark theme** with **purple/violet accents** and **modern glassmorphism effects**. This creates clear visual separation between:

- **Platform Admin** (your internal dev/support team): Dark, purple-accented, modern fintech aesthetic
- **Salon Dashboard** (customer-facing): Cream/pastel luxury editorial theme

---

## Design Language Summary

| Element | Platform Admin Style |
|---------|---------------------|
| **Background** | Dark slate (#0F172A to #1E293B gradients) |
| **Cards** | Glassmorphism with `backdrop-blur`, subtle borders |
| **Primary Accent** | Purple/Violet (#A855F7, #9333EA) |
| **Secondary** | Soft lavender, pink-purple gradients |
| **Buttons** | Gradient purple fills, soft glow on hover |
| **Typography** | Clean white/gray text, bold headings |
| **Border Radius** | Large (xl to 2xl) for friendly feel |
| **Shadows** | Purple-tinted glows on interactive elements |

---

## Implementation Plan

### Phase 1: Platform Theme CSS Variables

Create dedicated CSS variables for the platform admin context:

```css
/* Platform Admin Theme */
.platform-theme {
  --platform-bg: 222 47% 4%;          /* Deep slate */
  --platform-bg-card: 222 40% 8%;     /* Card background */
  --platform-bg-elevated: 222 35% 12%; /* Elevated surfaces */
  
  --platform-foreground: 210 40% 98%;  /* Primary text */
  --platform-muted: 215 20% 65%;       /* Secondary text */
  
  --platform-primary: 270 75% 60%;     /* Violet accent */
  --platform-primary-glow: 270 85% 65%; /* Button glow */
  
  --platform-border: 222 20% 18%;      /* Subtle borders */
  --platform-border-glow: 270 60% 50% / 0.2; /* Glow effect */
  
  --platform-gradient-start: 280 80% 55%;
  --platform-gradient-end: 320 70% 60%;
}
```

### Phase 2: Platform Layout Components

**PlatformLayout.tsx** - Dedicated wrapper for all `/platform-*` and `/dashboard/platform/*` routes:

- Dark gradient background
- Platform-specific navigation styling
- Glassmorphic sidebar with purple accents
- Purple glow effects on active nav items

**PlatformCard.tsx** - Glassmorphism card component:
```typescript
// Glass effect with backdrop blur and subtle border
className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 
           rounded-2xl shadow-xl shadow-purple-500/5"
```

**PlatformButton.tsx** - Gradient buttons with glow:
```typescript
// Primary action button with gradient and glow
className="bg-gradient-to-r from-violet-600 to-purple-600 
           hover:from-violet-500 hover:to-purple-500
           shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40
           transition-all duration-200"
```

### Phase 3: Login Page Redesign

Update `PlatformLogin.tsx` with the new design language:

- Gradient background from deep purple to slate
- Centered glassmorphic login card
- Purple gradient "Sign In" button
- Subtle animated background elements (optional)
- Platform logo with glow effect

**Visual structure:**
```text
┌─────────────────────────────────────────────────────────────┐
│                  (gradient background)                       │
│                                                              │
│            ┌────────────────────────────────┐               │
│            │     [Platform Logo + Glow]     │               │
│            │                                │               │
│            │     Platform Administration    │               │
│            │     Internal access portal     │               │
│            │                                │               │
│            │  ┌──────────────────────────┐  │               │
│            │  │  Email                   │  │               │
│            │  └──────────────────────────┘  │               │
│            │  ┌──────────────────────────┐  │               │
│            │  │  Password               │  │               │
│            │  └──────────────────────────┘  │               │
│            │                                │               │
│            │  [==== Sign In (gradient) ====]│               │
│            │                                │               │
│            │     Salon staff? Login here →  │               │
│            └────────────────────────────────┘               │
│                                                              │
│                 © Platform Admin • Internal                  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Platform Dashboard Pages

Apply the design system to all platform pages:

| Page | Key Updates |
|------|-------------|
| **PlatformOverview** | Glassmorphic stat cards with purple gradients, dark grid layout |
| **PlatformAccounts** | Dark table with hover glows, purple badges |
| **AccountDetail** | Dark tabs, glass cards, purple accent icons |
| **PlatformSettings** | Dark forms, purple toggle switches |
| **PlatformImport** | Dark wizard steps with purple progress indicators |

**Stat Card Example:**
```text
┌────────────────────────────────────────┐
│  [icon]  Total Salons                  │
│                                        │
│     42                                 │
│     ───── Active accounts ─────        │
│          ↑12% from last month          │
└────────────────────────────────────────┘
 (glass background, purple icon glow)
```

### Phase 5: Organization Switcher Redesign

Update the switcher in the platform header:
- Dark dropdown with glassmorphism
- Purple active state indicator
- Smooth animations
- Search input with purple focus ring

### Phase 6: Context Banner Update

Redesign `PlatformContextBanner.tsx`:
- Gradient purple background when impersonating
- Glassmorphic styling
- Smooth slide-in animation
- Clear "Exit View" button

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/styles/platform-theme.css` | Platform-specific CSS variables and utilities |
| `src/components/platform/ui/PlatformCard.tsx` | Glassmorphic card component |
| `src/components/platform/ui/PlatformButton.tsx` | Gradient button variants |
| `src/components/platform/ui/PlatformInput.tsx` | Dark input fields |
| `src/components/platform/ui/PlatformBadge.tsx` | Status badges with glow |
| `src/components/platform/PlatformLayout.tsx` | Wrapper layout for platform routes |

### Modified Files

| File | Changes |
|------|---------|
| `src/index.css` | Add platform theme variables |
| `src/pages/PlatformLogin.tsx` | Complete redesign with new styling |
| `src/pages/dashboard/platform/Overview.tsx` | Apply platform theme |
| `src/pages/dashboard/platform/Accounts.tsx` | Dark table, glass cards |
| `src/pages/dashboard/platform/AccountDetail.tsx` | Dark tabs, purple accents |
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Dark form styling |
| `src/pages/dashboard/platform/PlatformImport.tsx` | Dark wizard styling |
| `src/components/platform/OrganizationSwitcher.tsx` | Dark dropdown styling |
| `src/components/platform/PlatformContextBanner.tsx` | Gradient banner styling |
| `src/components/platform/CreateOrganizationDialog.tsx` | Dark dialog styling |
| `src/components/platform/PlatformTeamManager.tsx` | Dark team management UI |

---

## Component Examples

### Glassmorphic Card
```jsx
<div className="relative overflow-hidden rounded-2xl 
                bg-slate-800/50 backdrop-blur-xl 
                border border-slate-700/50
                shadow-xl shadow-purple-500/5">
  {/* Content */}
</div>
```

### Gradient Button
```jsx
<button className="px-6 py-3 rounded-xl font-medium
                   bg-gradient-to-r from-violet-600 to-purple-600
                   hover:from-violet-500 hover:to-purple-500
                   text-white shadow-lg shadow-violet-500/25
                   hover:shadow-violet-500/40
                   transition-all duration-200">
  Sign In
</button>
```

### Purple Glow Effect
```jsx
<div className="absolute inset-0 -z-10 
                bg-gradient-to-tr from-violet-500/10 via-transparent to-purple-500/10
                blur-3xl" />
```

---

## Implementation Order

1. **Platform theme CSS** - Add variables and utility classes
2. **Platform Login** - Redesign with new styling (most visible first)
3. **Platform UI components** - Build reusable glass/gradient components
4. **Platform Layout** - Create wrapper for consistent styling
5. **Dashboard pages** - Apply theme to Overview, Accounts, etc.
6. **Component updates** - Switcher, Banner, Dialogs

---

## Design Preview Concept

The Platform Admin will have a premium, modern feel that clearly distinguishes it from customer-facing salon dashboards:

- **Dark + Purple** = Internal platform tool
- **Cream + Pastel** = Salon customer experience

This visual separation helps platform users instantly recognize when they're in "admin mode" vs viewing a specific salon's dashboard.

