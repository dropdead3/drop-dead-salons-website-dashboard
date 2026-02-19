

## Add "Request a Feature" and "Report a Bug" Buttons to Sidebar Footer

Two bento-style buttons will be added above the Clock In / Lock Dashboard footer area. Each opens a submission dialog with image upload (screenshot prompted for bugs). Submissions go to the **platform admin** (Zura team), not the organization admin (Drop Dead Salons).

---

### 1. Database: New `platform_feedback` Table

A new table separate from the existing `feature_requests` (which is org-level). This one is platform-scoped -- no `organization_id`, submissions visible only to platform admins.

```sql
CREATE TABLE public.platform_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('feature_request', 'bug_report')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  screenshot_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'submitted',
  submitted_by UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  browser_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

-- Users can submit and view their own
CREATE POLICY "Users can insert own feedback"
  ON public.platform_feedback FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view own feedback"
  ON public.platform_feedback FOR SELECT
  USING (auth.uid() = submitted_by);

-- Platform admins can view all
CREATE POLICY "Platform admins can view all feedback"
  ON public.platform_feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Platform admins can update feedback"
  ON public.platform_feedback FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));
```

### 2. Storage: New `platform-feedback` Bucket

For screenshot/image uploads attached to feedback submissions.

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('platform-feedback', 'platform-feedback', true, 5242880, 
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
```

With storage policies for authenticated uploads and public reads.

### 3. New Hook: `src/hooks/usePlatformFeedback.ts`

- `useSubmitPlatformFeedback()` mutation -- handles inserting into `platform_feedback` and uploading screenshots to storage
- Auto-captures `navigator.userAgent` for bug reports

### 4. New Component: `src/components/dashboard/PlatformFeedbackDialog.tsx`

A dialog/sheet with:
- **Type toggle**: Feature Request vs Bug Report (pre-selected based on which button was clicked)
- **Title** field
- **Description** textarea
- **Category** dropdown (UI, Performance, Scheduling, Reporting, Other)
- **Image upload** area -- for bugs, shows a prompt: "Attach a screenshot to help us understand the issue"
- **Submit** button

The dialog uses the existing design system tokens (`bg-muted`, `border-border`, `font-sans`, etc.).

### 5. New Component: `src/components/dashboard/SidebarFeedbackButtons.tsx`

Two bento-style buttons rendered in the sidebar footer, above Clock In / Lock Dashboard:
- **Lightbulb icon** + "Request a Feature"
- **Bug icon** + "Report a Bug"

Styled as a 2-column grid with subtle borders, matching the existing footer card aesthetic. Each button opens the `PlatformFeedbackDialog` with the appropriate type pre-selected.

Supports `isCollapsed` prop -- when collapsed, shows icon-only with tooltips.

### 6. Update: `src/components/dashboard/SidebarNavContent.tsx`

Insert `<SidebarFeedbackButtons />` inside the footer `div`, above the `SidebarClockButton`.

---

### Visual Layout (expanded sidebar)

```text
+----------------------------------+
| [Lightbulb]        [Bug]         |
| Request a Feature  Report a Bug  |
+----------------------------------+
| [Clock] Clock In                 |
| [Lock]  Lock Dashboard           |
+----------------------------------+
```

### Key Decisions

- **Separate table from `feature_requests`**: The existing table is org-level feedback between staff and salon management. Platform feedback is a different data domain routed to the Zura team.
- **Organization ID captured but not scoped**: We store which org submitted it (for context), but RLS does not filter by org -- platform admins see all.
- **Bug reports auto-capture browser info**: `navigator.userAgent`, screen size, and current route for debugging context.
