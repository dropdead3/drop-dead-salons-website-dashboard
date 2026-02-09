

# Build HR Tools Suite for Salon Teams

## Overview

Build a comprehensive set of HR management tools that integrate with the existing Management Hub, grouping Staff Strikes under a new "Performance and Compliance" category alongside new features. The build will add 4 new feature areas while reorganizing existing tools.

---

## What Already Exists

| Tool | Status |
|------|--------|
| Staff Strikes (write-ups, warnings, complaints) | Built |
| Time-Off Requests (PTO with approval workflow) | Built |
| Schedule Change Requests | Built |
| Shift Swap Marketplace | Built |
| Payroll Hub (with commission tiers) | Built |
| Onboarding Tracker | Built |
| Training Hub | Built |
| Team Challenges | Built |

---

## What We Will Build

### 1. Document and License Tracker
Track cosmetology licenses, certifications, and compliance documents with expiration alerts.

- Table: `staff_documents` (user_id, organization_id, document_type, document_name, license_number, issued_date, expiration_date, status, file_url, notes, reminded_at)
- Document types: cosmetology_license, continuing_education, health_certificate, insurance, other
- Auto-calculated status: valid, expiring_soon (within 30 days), expired
- Manager dashboard view showing all team documents with expiration timeline
- Individual staff can upload/view their own documents

### 2. Performance Reviews
Structured review system with rating criteria, goal tracking, and review history.

- Table: `performance_reviews` (user_id, organization_id, reviewer_id, review_period_start, review_period_end, review_type, status, overall_rating, strengths, areas_for_improvement, goals, reviewer_notes, employee_notes, acknowledged_at, completed_at)
- Table: `review_goals` (review_id, goal_text, target_date, status, progress_notes)
- Review types: annual, semi_annual, quarterly, probationary, improvement_plan
- Ratings: 1-5 scale
- Workflow: draft -> submitted -> acknowledged
- Employees can view and acknowledge their reviews

### 3. PTO Accrual and Balance Tracking
Extend the existing `time_off_requests` with balance tracking and accrual rules.

- Table: `pto_policies` (organization_id, name, accrual_rate, accrual_period, max_balance, carry_over_limit, is_default)
- Table: `employee_pto_balances` (user_id, organization_id, policy_id, current_balance, accrued_ytd, used_ytd, carried_over)
- Accrual periods: per_pay_period, monthly, annually
- Manager view: team PTO calendar showing who is out when
- Blackout date management tied to organization calendar

### 4. Incident and Safety Log
General workplace incident documentation (separate from disciplinary strikes).

- Table: `incident_reports` (organization_id, reported_by, involved_user_id, incident_type, incident_date, location_id, description, severity, witnesses, corrective_action, status, resolved_at)
- Incident types: workplace_injury, equipment_damage, client_complaint, safety_hazard, chemical_exposure, slip_fall, other
- Tracks witnesses, corrective actions taken
- Required for OSHA-style compliance documentation

---

## Management Hub Reorganization

The Management Hub page categories will be updated to:

| Category | Tools |
|----------|-------|
| Team Development | Onboarding Hub, Graduation Tracker, Client Engine Tracker, Training Hub, Team Challenges |
| Scheduling and Requests | Assistant Requests, Schedule Requests, Shift Swap Approvals |
| **Performance and Compliance** (new) | **Staff Strikes** (moved here), **Performance Reviews** (new), **Document Tracker** (new), **Incident Reports** (new) |
| Team Invitations | Invite, Manage Invitations |
| Recruiting and Hiring | Lead Management, Recruiting Pipeline |
| PTO and Leave | **PTO Balances** (new), Time-Off Requests (link to existing) |
| Team Operations | Birthdays, Business Cards, Headshots |
| Communications | Announcements, Changelog, Daily Huddle |
| Points and Rewards | Points and Rewards Config |
| Client Experience | Feedback Hub, Re-engagement |

---

## New Pages and Routes

| Route | Page | Permission |
|-------|------|------------|
| `/dashboard/admin/documents` | Document and License Tracker | `view_team_overview` |
| `/dashboard/admin/performance-reviews` | Performance Reviews | `view_team_overview` |
| `/dashboard/admin/pto` | PTO Balances and Policies | `view_team_overview` |
| `/dashboard/admin/incidents` | Incident Reports | `view_team_overview` |

---

## Technical Implementation

### Database (4 new tables + 2 supporting tables)

**staff_documents**
- Columns: id, organization_id, user_id, document_type (enum), document_name, license_number, issued_date, expiration_date, status (valid/expiring_soon/expired), file_url, notes, reminded_at, created_at, updated_at
- RLS: org members can view their own; managers/admins can view all in org

**performance_reviews**
- Columns: id, organization_id, user_id, reviewer_id, review_type (enum), review_period_start, review_period_end, status (draft/submitted/acknowledged), overall_rating (1-5), strengths, areas_for_improvement, goals_summary, reviewer_notes, employee_notes, acknowledged_at, completed_at, created_at, updated_at
- RLS: reviewer can CRUD their drafts; employee can view and acknowledge their own reviews; admins see all

**review_goals**
- Columns: id, review_id (FK), goal_text, target_date, status (pending/in_progress/completed/missed), progress_notes, created_at, updated_at
- RLS: inherits from parent review access

**pto_policies**
- Columns: id, organization_id, name, accrual_rate (numeric), accrual_period (enum), max_balance, carry_over_limit, is_default, is_active, created_at, updated_at
- RLS: org admins can manage; members can view

**employee_pto_balances**
- Columns: id, organization_id, user_id, policy_id (FK), current_balance, accrued_ytd, used_ytd, carried_over, last_accrual_date, created_at, updated_at
- RLS: employees see their own; managers see all in org

**incident_reports**
- Columns: id, organization_id, reported_by, involved_user_id (nullable), incident_type (enum), incident_date, location_id, description, severity (low/medium/high/critical), witnesses (text), corrective_action, status (open/investigating/resolved/closed), resolved_at, resolved_by, created_at, updated_at
- RLS: reporter can create and view their own; managers/admins see all in org

### Frontend Components (per feature)

Each feature follows the established pattern of:
- A page component in `src/pages/dashboard/admin/`
- Hook(s) in `src/hooks/` for data fetching/mutations
- Supporting dialog/card components in `src/components/dashboard/`
- Registration in `src/App.tsx` routes with `ProtectedRoute`

### Files to Create

1. **Database migration** - All 6 tables with RLS policies
2. `src/hooks/useStaffDocuments.ts` - CRUD hooks for document tracker
3. `src/hooks/usePerformanceReviews.ts` - CRUD hooks for reviews and goals
4. `src/hooks/usePTOBalances.ts` - Hooks for PTO policies and balances
5. `src/hooks/useIncidentReports.ts` - CRUD hooks for incident reports
6. `src/pages/dashboard/admin/DocumentTracker.tsx` - Document and license tracking page
7. `src/pages/dashboard/admin/PerformanceReviews.tsx` - Performance reviews page
8. `src/pages/dashboard/admin/PTOManager.tsx` - PTO balances and policy page
9. `src/pages/dashboard/admin/IncidentReports.tsx` - Incident reporting page

### Files to Modify

1. `src/App.tsx` - Add 4 new routes
2. `src/pages/dashboard/admin/ManagementHub.tsx` - Reorganize categories, add new cards, move Staff Strikes to Performance and Compliance
3. `src/hooks/useSidebarLayout.ts` - No sidebar changes needed (these tools are accessed via Management Hub)

---

## Build Order

1. Database migration (all tables at once)
2. Document and License Tracker (hooks + page)
3. Performance Reviews (hooks + page)
4. PTO Manager (hooks + page)
5. Incident Reports (hooks + page)
6. Management Hub reorganization (move Staff Strikes, add new cards)
7. Route registration in App.tsx

