

## Move Knowledge Base to Standalone Platform Page

This plan will extract the Knowledge Base management from the Settings tabs and make it a first-class page in the Platform navigation.

---

### Overview

The Knowledge Base content management will become its own dedicated page accessible directly from the sidebar, rather than being nested inside Platform Settings. This makes it easier to access and visually elevates its importance as a core platform feature.

---

### Changes Summary

| File | Action |
|------|--------|
| `src/pages/dashboard/platform/KnowledgeBase.tsx` | **Create** - New standalone page |
| `src/components/platform/layout/PlatformSidebar.tsx` | **Edit** - Add nav link with BookOpen icon |
| `src/pages/dashboard/platform/PlatformSettings.tsx` | **Edit** - Remove Knowledge Base tab |
| `src/App.tsx` | **Edit** - Add route for new page |

---

### Implementation Details

#### 1. Create New Knowledge Base Page

Create `src/pages/dashboard/platform/KnowledgeBase.tsx` that wraps the existing Knowledge Base content with proper platform page layout components:

- Uses `PlatformPageContainer` for consistent padding and max-width
- Uses `PlatformPageHeader` with "Back to Overview" navigation
- Imports and renders the existing article/category management components
- Includes the "New Article" button in the header

#### 2. Add Sidebar Navigation Link

Add a new nav item in `PlatformSidebar.tsx`:

```text
Current nav order:
├── Overview
├── Accounts
├── Migrations
├── Revenue (admin+)
├── Permissions (admin+)
└── Settings (admin+)

New nav order:
├── Overview
├── Accounts
├── Migrations
├── Knowledge Base (admin+)  ← NEW
├── Revenue (admin+)
├── Permissions (admin+)
└── Settings (admin+)
```

- Icon: `BookOpen` (already in use in the tab)
- Route: `/dashboard/platform/knowledge-base`
- Role restriction: Same as Settings (`platform_owner`, `platform_admin`)

#### 3. Remove Tab from Settings

Edit `PlatformSettings.tsx` to:
- Remove the "Knowledge Base" TabsTrigger
- Remove the "Knowledge Base" TabsContent
- Remove the `KnowledgeBaseTab` import

#### 4. Add Route

In `App.tsx`, add the new route under the platform layout:

```
/dashboard/platform/knowledge-base → PlatformKnowledgeBase
```

With the same protection as Settings (`requirePlatformRole="platform_admin"`).

---

### Technical Notes

- The existing `KBCategoryManager`, `KBArticlesList`, and `KBArticleEditor` components will be reused directly in the new page
- No database or hook changes required - all existing functionality remains intact
- The change is purely structural (routing and navigation)

