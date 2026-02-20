

# Fix: Create Client Edge Function Using Wrong Secret Name

## The Problem

The `create-phorest-client` edge function is failing because it looks for a secret called `PHOREST_PASSWORD`, which does not exist. The configured secret is `PHOREST_API_KEY`. This means the function immediately throws "Missing Phorest API credentials" before it even tries to call the Phorest API.

## Root Cause

An inconsistency across edge functions:
- `update-phorest-appointment` correctly uses `PHOREST_API_KEY`
- `create-phorest-client` incorrectly uses `PHOREST_PASSWORD`
- `update-phorest-appointment-time` also incorrectly uses `PHOREST_PASSWORD`

## The Fix

Update two edge functions to reference `PHOREST_API_KEY` instead of `PHOREST_PASSWORD`:

### File 1: `supabase/functions/create-phorest-client/index.ts`
- Change `Deno.env.get("PHOREST_PASSWORD")` to `Deno.env.get("PHOREST_API_KEY")`

### File 2: `supabase/functions/update-phorest-appointment-time/index.ts`
- Change all references from `PHOREST_PASSWORD` to `PHOREST_API_KEY`

## Impact

- No database changes needed
- No frontend changes needed
- Both functions will be redeployed automatically after the fix

