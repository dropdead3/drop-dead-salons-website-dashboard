# How to Apply the SEO Workshop Migration

## What this migration does

The migration creates the table and security rules for the **SEO Workshop Hub** feature:

- **Table:** `seo_workshop_completions`  
  Stores which SEO actions your organization has marked complete (one row per org + action key, with optional notes).

- **RLS (Row Level Security):**  
  Only users who are members of the organization can read or change that org’s completions. No cross-org access.

- **Unique constraint:**  
  One completion per `(organization_id, action_key)` so the same action can’t be “completed” twice.

Until this migration is applied, the SEO Workshop page will error when loading or updating progress.

---

## Important: this migration depends on `public.organizations`

The SEO workshop migration creates a table that **references `public.organizations`**. If you see:

```text
ERROR: 42P01: relation "public.organizations" does not exist
```

it means the database you’re running against doesn’t have the core Zura schema yet. This migration is not the first one—it expects earlier migrations (including the one that creates `organizations`) to already be applied.

**Before running the SEO workshop migration:**

1. **Confirm you’re in the right project**  
   In the Supabase Dashboard, make sure you’re in the same project your app uses (the one in `.env`).

2. **Check that `organizations` exists**  
   In the left sidebar, open **Table Editor**. If you see a table named **organizations**, the base schema is there and you can run the SEO workshop migration (Option A below).  
   Or run this in the SQL Editor:
   ```sql
   SELECT EXISTS (
     SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'organizations'
   );
   ```
   If the result is `false`, this database has not had the full migration history applied. Use **Option B** (CLI) so that all migrations run in order, including the one that creates `organizations` and the SEO workshop one.

---

## Option A: Supabase Dashboard (recommended if you’re not using the CLI)

Use this when you want to run the SQL once, by hand, in the Supabase web UI. **Only use this if `public.organizations` already exists** (see above).

1. **Open your project in Supabase**  
   Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and open the project that matches your app (e.g. the one whose URL is in `.env` as `VITE_SUPABASE_URL`).

2. **Open the SQL Editor**  
   In the left sidebar: **SQL Editor** → **New query**.

3. **Paste the migration SQL**  
   Copy the entire contents of:
   ```
   supabase/migrations/20260213140000_seo_workshop_completions.sql
   ```
   and paste it into the query box.

4. **Run it**  
   Click **Run** (or use the keyboard shortcut). You should see a success message and no errors.

5. **Confirm the table exists**  
   In the left sidebar: **Table Editor**. You should see a table named `seo_workshop_completions`. Opening it will show it’s empty until users start using the SEO Workshop.

---

## Option B: Supabase CLI (for linked projects or local dev)

Use this when you manage migrations with the Supabase CLI and want this migration applied the same way as the rest.

### Remote (hosted) database

1. **Log in (once)**  
   In your project directory:
   ```bash
   npx supabase login
   ```
   Complete the browser login if prompted.

2. **Link the project (once per machine)**  
   Use the project reference from your `.env` (e.g. `VITE_SUPABASE_PROJECT_ID`):
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
   Example, if your ref is `vciqmwzgfjxtzagaxgnh`:
   ```bash
   npx supabase link --project-ref vciqmwzgfjxtzagaxgnh
   ```
   Enter the database password when asked (from Supabase Dashboard → **Settings** → **Database** → **Database password**).

3. **Apply pending migrations**  
   ```bash
   npx supabase db push
   ```
   This applies any new migrations under `supabase/migrations/`, including the SEO workshop one.

### Local database (e.g. `supabase start`)

1. **Start Supabase locally (if it’s not already running)**  
   ```bash
   npx supabase start
   ```

2. **Apply all migrations**  
   ```bash
   npx supabase db reset
   ```
   This recreates the local database and runs every migration in `supabase/migrations/`, including the new one.

   To only run new migrations without wiping data, use:
   ```bash
   npx supabase migration up
   ```
   (Requires the local Supabase stack to be running.)

---

## Verifying it worked

- **Dashboard:** In **Table Editor**, the table `seo_workshop_completions` exists and has columns: `id`, `organization_id`, `action_key`, `completed_at`, `notes`.
- **App:** Open the SEO Workshop in your app (e.g. Management Hub → SEO Workshop). The Overview and Action items tabs should load without errors, and checking/unchecking actions should work.

---

## If something goes wrong

- **“relation \"public.organizations\" does not exist”**  
  The database doesn’t have the core Zura schema. This migration is not the first one—it depends on an earlier migration that creates `organizations`. Use **Option B** (Supabase CLI): link your project and run `npx supabase db push` so all migrations run in order. Do not run only this migration file against an empty or partially migrated database.

- **“relation already exists”**  
  The table was created earlier. You can leave it as is, or drop the table (and its policies) and run the migration again if you need a clean slate.

- **“function is_org_member does not exist”**  
  Your database doesn’t have the shared helper used by RLS. Other migrations in this project should have created it. Run migrations in order (e.g. use **Option B** so the CLI applies all of them), or fix the missing function before re-running this migration.

- **CLI: “Cannot find project ref” / “Access token not provided”**  
  Run `npx supabase login` and then `npx supabase link --project-ref YOUR_REF` so the CLI knows which project and that you’re authenticated.
