
# Knowledge Base Configurator and Publisher

## Summary

Build a platform-wide Knowledge Base system that allows platform admins to create, manage, and publish help articles. Each organization (account) will have access to view these articles through their dashboard via a new "Help Center" section. The system follows the existing Handbook and Changelog patterns while adapting for multi-tenant access.

---

## Current State

**Existing Patterns to Follow:**
- `handbooks` table: Category-based documents with role visibility, versioning, and draft/publish states
- `changelog_entries` table: Rich content with status (draft/scheduled/published), author tracking, and read tracking
- Platform Settings tabs pattern: Used for PandaDoc integrations configurator
- VisibilityGate: Controls element visibility per role

**What Exists:**
- Multi-tenant architecture with `organizations` table
- Platform Settings page with tab-based layout
- Dashboard widget system with customizable sections
- Existing content management patterns (Changelog, Handbooks)

---

## Architecture

```text
Platform Settings
└── Knowledge Base Tab (NEW)
    ├── Article Categories Manager
    ├── Articles List (filterable by category/status)
    └── Article Editor Dialog
        ├── Title, Slug, Category
        ├── Rich Content (Markdown support)
        ├── Status (draft/published)
        ├── Featured/Pinned flag
        └── Target visibility (all accounts or specific)

Organization Dashboard
└── Help Center Page (NEW) - /dashboard/help
    ├── Search bar
    ├── Categories grid
    ├── Featured articles
    └── Article detail view

Dashboard Widgets
└── Help Center Widget (optional)
    └── Quick links to popular articles
```

---

## Database Schema

### kb_categories
Stores article categories for organization.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Category name (e.g., "Getting Started") |
| slug | text | URL-friendly identifier |
| description | text | Optional category description |
| icon | text | Lucide icon name |
| display_order | integer | Sort order |
| is_active | boolean | Whether category is visible |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

### kb_articles
Stores knowledge base articles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| category_id | uuid | FK to kb_categories |
| title | text | Article title |
| slug | text | URL-friendly identifier |
| summary | text | Short description for cards |
| content | text | Full article content (Markdown) |
| status | text | 'draft' or 'published' |
| is_featured | boolean | Show in featured section |
| is_pinned | boolean | Pin to top of category |
| view_count | integer | Analytics counter |
| author_id | uuid | FK to auth.users |
| published_at | timestamptz | When published |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update |

### kb_article_reads
Tracks which articles users have read (optional, for analytics).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| article_id | uuid | FK to kb_articles |
| user_id | uuid | FK to auth.users |
| organization_id | uuid | FK to organizations (for analytics) |
| read_at | timestamptz | When article was read |

---

## RLS Policies

### kb_categories
- SELECT: All authenticated users can read active categories
- INSERT/UPDATE/DELETE: Platform users only (`is_platform_user(auth.uid())`)

### kb_articles
- SELECT: Published articles visible to all authenticated users; Drafts visible to platform users only
- INSERT/UPDATE/DELETE: Platform users only

### kb_article_reads
- SELECT: Users can see their own reads; Platform users can see all for analytics
- INSERT: Authenticated users can insert their own reads

---

## Files to Create

### Platform Admin Components
| File | Purpose |
|------|---------|
| `src/components/platform/settings/KnowledgeBaseTab.tsx` | Main KB management tab |
| `src/components/platform/settings/KBCategoryManager.tsx` | CRUD for categories |
| `src/components/platform/settings/KBArticleEditor.tsx` | Article create/edit dialog |
| `src/components/platform/settings/KBArticlesList.tsx` | Articles table with filters |

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/useKnowledgeBase.ts` | CRUD hooks for categories and articles |
| `src/hooks/useKBArticleReads.ts` | Track article reads |

### Organization Dashboard Components
| File | Purpose |
|------|---------|
| `src/pages/dashboard/HelpCenter.tsx` | Main help center page |
| `src/components/dashboard/help/HelpCategoryCard.tsx` | Category display card |
| `src/components/dashboard/help/HelpArticleCard.tsx` | Article preview card |
| `src/components/dashboard/help/HelpArticleView.tsx` | Full article viewer |
| `src/components/dashboard/help/HelpSearchBar.tsx` | Search functionality |
| `src/components/dashboard/HelpCenterWidget.tsx` | Dashboard widget (optional) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/platform/PlatformSettings.tsx` | Add "Knowledge Base" tab |
| `src/App.tsx` | Add `/dashboard/help` and `/dashboard/help/:slug` routes |
| `src/components/dashboard/SidebarNavContent.tsx` | Add Help Center nav item |
| `src/components/dashboard/WidgetsSection.tsx` | Add Help Center widget option |

---

## UI Design

### Platform KB Configurator Tab

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Knowledge Base                                           [+ New Article] │
│  Manage help articles for all accounts                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Categories                                              [+ Add Category] │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                │
│  │ 📚 Getting     │ │ 💼 Account     │ │ 📊 Analytics   │                │
│  │    Started     │ │    Settings    │ │    & Reports   │                │
│  │    4 articles  │ │    6 articles  │ │    3 articles  │                │
│  │    [Edit]      │ │    [Edit]      │ │    [Edit]      │                │
│  └────────────────┘ └────────────────┘ └────────────────┘                │
│                                                                           │
│  Articles                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Status ▼ │ Category ▼ │ Search...                                   │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ● Published │ Getting Started │ How to Add Your First Location     │ │
│  │   ⭐ Featured              │ 234 views │ [Edit] [Unpublish]         │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ○ Draft     │ Account Settings │ Setting Up Billing Preferences    │ │
│  │                           │ — views  │ [Edit] [Publish] [Delete]    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Article Editor Dialog

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  New Article                                                       [×]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Title                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ How to Add Your First Location                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Category                           Slug (auto-generated)                 │
│  ┌─────────────────────┐           ┌──────────────────────────────────┐  │
│  │ Getting Started   ▼ │           │ how-to-add-your-first-location   │  │
│  └─────────────────────┘           └──────────────────────────────────┘  │
│                                                                           │
│  Summary (shown in article cards)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Learn how to create and configure your first location in minutes.  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Content (Markdown supported)                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ## Getting Started                                                  │ │
│  │                                                                     │ │
│  │ To add your first location, follow these steps:                     │ │
│  │                                                                     │ │
│  │ 1. Navigate to **Settings > Locations**                             │ │
│  │ 2. Click the **Add Location** button                                │ │
│  │ ...                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Options                                                                  │
│  ☐ Featured article (show prominently)                                   │
│  ☐ Pinned (show at top of category)                                      │
│                                                                           │
│                                              [Save as Draft] [Publish]    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Organization Help Center Page

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Help Center                                                              │
│  Find answers to common questions                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Search articles...                                               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  Featured Articles                                                        │
│  ┌────────────────────────────┐ ┌────────────────────────────┐           │
│  │ ⭐ Getting Started Guide   │ │ ⭐ Understanding Analytics │           │
│  │    Everything you need...  │ │    Learn to read your...   │           │
│  │    [Read →]                │ │    [Read →]                │           │
│  └────────────────────────────┘ └────────────────────────────┘           │
│                                                                           │
│  Browse by Category                                                       │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────┐ │
│  │ 📚 Getting     │ │ 💼 Account     │ │ 📊 Analytics   │ │ 🔧 Settings│ │
│  │    Started     │ │    Management  │ │    & Reports   │ │            │ │
│  │    4 articles  │ │    6 articles  │ │    3 articles  │ │ 5 articles │ │
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Routing Structure

Add to App.tsx:
```typescript
// Inside protected dashboard routes
<Route path="/dashboard/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
<Route path="/dashboard/help/:categorySlug" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
<Route path="/dashboard/help/:categorySlug/:articleSlug" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
```

---

## Hook Structure

### useKnowledgeBase.ts

```typescript
// Category hooks
export function useKBCategories() { /* fetch active categories */ }
export function useAdminKBCategories() { /* fetch all categories for admin */ }
export function useCreateKBCategory() { /* mutation */ }
export function useUpdateKBCategory() { /* mutation */ }
export function useDeleteKBCategory() { /* mutation */ }

// Article hooks  
export function useKBArticles(categorySlug?: string) { /* published articles */ }
export function useAdminKBArticles() { /* all articles for admin */ }
export function useKBArticle(slug: string) { /* single article */ }
export function useCreateKBArticle() { /* mutation */ }
export function useUpdateKBArticle() { /* mutation */ }
export function usePublishKBArticle() { /* mutation - set status=published */ }
export function useDeleteKBArticle() { /* mutation */ }

// Search
export function useKBSearch(query: string) { /* full-text search */ }
```

---

## Sidebar Navigation

Add Help Center to sidebar navigation content. Use the `HelpCircle` or `BookOpen` icon. Place it in the "Resources" or "Support" section of the sidebar.

```typescript
{
  key: 'help_center',
  name: 'Help Center',
  href: '/dashboard/help',
  icon: HelpCircle,
  permission: null, // Available to all authenticated users
}
```

---

## Dashboard Widget (Optional)

Add to WidgetsSection AVAILABLE_WIDGETS:

```typescript
{ 
  id: 'help', 
  label: 'Help Center', 
  icon: HelpCircle 
}
```

Widget displays:
- Quick search
- 3-4 popular/featured articles
- "View all" link to full Help Center

---

## Implementation Phases

### Phase 1: Database Schema
1. Create `kb_categories` table
2. Create `kb_articles` table  
3. Create `kb_article_reads` table
4. Set up RLS policies
5. Create storage bucket for article images (optional)

### Phase 2: Platform Admin Configurator
1. Create `useKnowledgeBase.ts` hooks
2. Create `KnowledgeBaseTab.tsx` main component
3. Create `KBCategoryManager.tsx` for category CRUD
4. Create `KBArticlesList.tsx` with filtering
5. Create `KBArticleEditor.tsx` dialog
6. Add "Knowledge Base" tab to PlatformSettings

### Phase 3: Organization Help Center
1. Create `HelpCenter.tsx` page
2. Create `HelpCategoryCard.tsx` component
3. Create `HelpArticleCard.tsx` component
4. Create `HelpArticleView.tsx` for full article
5. Create `HelpSearchBar.tsx` with search
6. Add routes to App.tsx
7. Add sidebar navigation item

### Phase 4: Widget & Polish
1. Create `HelpCenterWidget.tsx`
2. Add to WidgetsSection
3. Add article read tracking
4. Add view count analytics for platform admins

---

## Default Categories

Seed the database with these starter categories:

| Name | Slug | Icon | Description |
|------|------|------|-------------|
| Getting Started | getting-started | Rocket | Essential guides for new users |
| Account & Billing | account-billing | CreditCard | Manage your account settings |
| Team Management | team-management | Users | Add and manage team members |
| Analytics & Reports | analytics-reports | BarChart3 | Understand your data |
| Integrations | integrations | Plug | Connect third-party services |
| Troubleshooting | troubleshooting | HelpCircle | Common issues and solutions |

---

## Security Considerations

- All authenticated organization users can read published articles
- Only platform users can create/edit/delete articles and categories
- Article reads are tracked per user for analytics
- Drafts are only visible to platform users (useful for preview before publishing)
- Use existing `is_platform_user()` function for RLS

---

## Future Enhancements

- Article feedback (helpful/not helpful) with comments
- Related articles suggestions
- Article versioning and change history
- Video embedding support
- Localization/multi-language support
- AI-powered search and suggestions
