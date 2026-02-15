# Apply the SEO Workshop migration — simple steps

Do these in order. One step at a time.

---

## Part 1: Check your database

**Step 1.** Open your web browser.

**Step 2.** Go to: **https://supabase.com/dashboard**

**Step 3.** Log in if it asks you.

**Step 4.** Click on **your project** (the one your app uses).  
If you only have one project, click that one.

**Step 5.** On the left side of the screen, click **“Table Editor”**.

**Step 6.** Look at the list of tables.  
Do you see a table named **“organizations”** in the list?

- **If YES** → Your database is set up. Go to **Part 2** below.
- **If NO** → Your database is missing the main tables. Go to **Part 3** below.

---

## Part 2: You SAW “organizations” — run only the SEO migration

**Step 1.** Still in Supabase, on the left side click **“SQL Editor”**.

**Step 2.** Click **“New query”** (or the + to start a new query).

**Step 3.** On your computer, open this file in your Zura project folder:  
`supabase/migrations/20260213140000_seo_workshop_completions.sql`

**Step 4.** Select **all** the text in that file (Ctrl+A or Cmd+A) and **copy** it (Ctrl+C or Cmd+C).

**Step 5.** Go back to the browser. Click inside the big empty box where you type SQL.

**Step 6.** **Paste** the text you copied (Ctrl+V or Cmd+V).

**Step 7.** Click the green **“Run”** button (or press Ctrl+Enter / Cmd+Enter).

**Step 8.** Look at the result.  
- If it says something like “Success” or shows no error → you’re done.  
- If it says **“organizations does not exist”** → you’re probably in the wrong project. Go back to Part 1, Step 4, and make sure you picked the project your app actually uses. If you’re sure it’s the right project, use **Part 3** instead.

---

## Part 3: You did NOT see “organizations” — run everything from your computer

Your database hasn’t had the full setup run yet. We’ll run it from the Terminal so that every step (including creating `organizations` and then the SEO table) runs in the right order.

**Step 1.** Open **Terminal** on your computer.  
(Mac: press Cmd+Space, type “Terminal”, press Enter.)

**Step 2.** Go to your Zura project folder. Type this and press Enter (use your real folder path if it’s different):

```bash
cd "/Users/ericday/Library/Mobile Documents/com~apple~CloudDocs/Zura"
```

**Step 3.** Log in to Supabase. Type this and press Enter:

```bash
npx supabase login
```

A browser window will open. Log in there if it asks. When it says you’re logged in, you can close that tab and go back to Terminal.

**Step 4.** Connect Terminal to your Supabase project. Type this and press Enter (use your project ref from the `.env` file if it’s different):

```bash
npx supabase link --project-ref vciqmwzgfjxtzagaxgnh
```

It will ask for your **database password**.  
- To find it: Supabase Dashboard → left side click **Settings** → click **Database** → look for **“Database password”**.  
- If you don’t know it, you may need to reset it there, then type the new one in Terminal.

**Step 5.** Apply all setup steps (including the SEO one). Type this and press Enter:

```bash
npx supabase db push
```

Wait until it finishes. If it says something like “Applying migration…” and then finishes with no error, you’re done.

**Step 6.** Check in the Supabase Dashboard: go to **Table Editor** and look for a table named **“seo_workshop_completions”**. If you see it, the migration worked.

---

## If something doesn’t work

- **“command not found: npx”**  
  You need Node.js. Install it from https://nodejs.org (use the “LTS” version), then try again from Step 3.

- **“Access token not provided”**  
  Run Step 3 again (`npx supabase login`) and finish logging in in the browser.

- **“Cannot find project ref”**  
  In your Zura folder, open the `.env` file. Find the line that has `VITE_SUPABASE_PROJECT_ID=`. The value in quotes (e.g. `vciqmwzgfjxtzagaxgnh`) is your project ref. Use that in the command in Step 4 instead of `vciqmwzgfjxtzagaxgnh`.

- **Still stuck**  
  Say which step you’re on and what the screen or Terminal says (the exact message), and we can fix it from there.
