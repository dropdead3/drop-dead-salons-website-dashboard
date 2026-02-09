

# Renter Onboard Wizard -- Consolidation Plan

## The Problem

Booth renters are independent 1099 contractors, not employees. Right now:

- The New Hire Wizard incorrectly lists "Booth Rent" as a pay type, mixing employee and contractor concepts
- Adding a renter requires clicking "Add Renter" in the Renter Hub, which opens a basic dialog that only creates a profile
- After that, you must separately: issue a contract, set up insurance, assign a station, and track onboarding tasks -- all through different buttons and dialogs
- There is no single guided flow that walks an admin through the full renter onboarding

## The Solution

1. **Remove "Booth Rent" from the New Hire Wizard** -- it does not belong there
2. **Replace the AddRenterDialog with a full-page Renter Onboard Wizard** that consolidates the scattered steps into one guided flow
3. **Keep all existing components** (IssueContractDialog, InsuranceCard, StationAssignmentManager, onboarding tasks) working as standalone tools in the Renter Hub for day-to-day management -- the wizard simply calls into the same hooks

## Renter Onboard Wizard Steps

**Step 1: Renter Identity**
- Option A: Select an existing person in the system (like today's AddRenterDialog)
- Option B: Create a brand new account (name, email) -- this creates an auth user + employee profile + booth_renter role, similar to how the hire wizard works but framed as a contractor setup
- Collect: business name, EIN, start date

**Step 2: Licensing & Insurance**
- License number, license state, expiration date
- Insurance provider, policy number, expiration date
- These fields already exist on `booth_renter_profiles` and insurance tables

**Step 3: Rental Terms**
- Inline version of the IssueContractDialog fields: rent amount, frequency, due day, security deposit, included amenities (utilities, WiFi, products), retail commission settings
- This creates the first `booth_rental_contracts` record

**Step 4: Station Assignment**
- Show available stations/chairs for the organization
- Let admin pick one (or skip if none are set up yet)

**Step 5: Onboarding Checklist & Docs**
- Show the organization's renter onboarding tasks (from `renter_onboarding_tasks`)
- Toggle PandaDoc for the rental agreement (uses same integration as hire wizard)
- Summary of what will be created

On submit, the wizard creates everything in one backend call, then shows a success screen with the renter's login credentials (if a new account was created) or a confirmation (if existing person).

## What Changes

### Remove from New Hire Wizard
- Remove the "Booth Rent" option from the pay type dropdown in `NewHireWizard.tsx`

### New Files
- **`src/pages/dashboard/admin/RenterOnboardWizard.tsx`** -- full-page multi-step wizard (follows the same pattern as NewHireWizard)
- **`supabase/functions/onboard-renter/index.ts`** -- edge function that handles account creation (optional), booth_renter_profiles, booth_rental_contracts, station assignment, insurance record, and onboarding task seeding in one transaction

### Modified Files
- **`src/App.tsx`** -- add route `/dashboard/admin/onboard-renter`
- **`src/pages/dashboard/admin/ManagementHub.tsx`** -- add "Renter Onboard Wizard" card in the appropriate section
- **`src/pages/dashboard/admin/BoothRenters.tsx`** or **`RentersTabContent.tsx`** -- change "Add Renter" button to navigate to the wizard instead of opening AddRenterDialog
- **`src/hooks/useHireEmployee.ts`** -- no changes needed (separate concern)

### Unchanged (No Redundancy)
- `AddRenterDialog.tsx` -- can be deprecated or kept as a quick-add shortcut; the wizard replaces its primary use case
- `IssueContractDialog.tsx` -- stays for issuing additional contracts to existing renters
- `InsuranceCard.tsx` -- stays for updating insurance after onboarding
- `StationAssignmentManager.tsx` -- stays for reassigning stations
- `useRenterOnboarding.ts` -- stays for tracking ongoing task completion
- `useBoothRenters.ts` -- stays as the data layer

## Technical Details

### Edge Function: `onboard-renter`
Accepts:
- `createNewAccount` (boolean) -- if true, creates auth user
- `email`, `fullName` -- for new account creation
- `userId` -- for existing person selection (mutually exclusive with createNewAccount)
- `organizationId`
- Business fields: `businessName`, `ein`, `licenseNumber`, `licenseState`, `licenseExpiry`
- Insurance fields: `insuranceProvider`, `insurancePolicyNumber`, `insuranceExpiryDate`
- Contract fields: `rentAmount`, `rentFrequency`, `dueDay`, `securityDeposit`, `startDate`, `endDate`, amenity toggles, retail commission settings
- `stationId` (optional) -- station to assign
- `generateRentalAgreement` (boolean) -- PandaDoc trigger

Returns:
- `success`, `boothRenterId`, credentials (if new account), `contractId`, `stationAssigned`

### Routing
- `/dashboard/admin/onboard-renter` -- new wizard page
- Can be reached from Management Hub card and from "Add Renter" button in Renter Hub

