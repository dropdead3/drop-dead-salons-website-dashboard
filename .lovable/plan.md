
# Fix Kiosk Admin PIN Validation

## Problem

The kiosk settings dialog is checking the PIN against the wrong source:

| Current Behavior | Expected Behavior |
|-----------------|-------------------|
| Compares PIN to `organization_kiosk_settings.exit_pin` (static, defaults to `1234`) | Validates PIN against `employee_profiles.login_pin` via `validate_user_pin` RPC |
| Any matching PIN grants access | Only Primary Owners or Super Admins can access |

Your personal PIN is stored in `employee_profiles.login_pin`, but the kiosk is looking at the static `exit_pin` field in the kiosk settings table.

## Solution

Update `KioskSettingsDialog.tsx` to use the unified PIN validation system (`useValidatePin`) with admin role checking.

## Technical Changes

### File: `src/components/kiosk/KioskSettingsDialog.tsx`

**1. Add imports**

```typescript
import { useValidatePin } from '@/hooks/useUserPin';
```

**2. Add validation hook in component**

```typescript
const validatePin = useValidatePin();
const [isValidating, setIsValidating] = useState(false);
```

**3. Replace PIN validation logic**

Update `handlePinDigit` to use `validatePin.mutateAsync()` instead of comparing to `storedPin`:

```typescript
const handlePinDigit = async (digit: string) => {
  if (pinInput.length < 4) {
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError(false);
    
    // Auto-submit when 4 digits entered
    if (newPin.length === 4 && !isValidating) {
      setIsValidating(true);
      
      try {
        const result = await validatePin.mutateAsync(newPin);
        
        if (result && (result.is_super_admin || result.is_primary_owner)) {
          // Valid admin PIN
          setIsAuthenticated(true);
          setPinError(false);
          setPinInput('');
        } else if (result) {
          // Valid PIN but not an admin
          setPinError(true);
          setPinInput('');
          // Optionally show: "This account doesn't have admin access"
        } else {
          // No matching PIN
          setPinError(true);
          setPinInput('');
        }
      } catch (error) {
        setPinError(true);
        setPinInput('');
      } finally {
        setIsValidating(false);
      }
    }
  }
};
```

**4. Update "Unlock Settings" button handler**

Same pattern as above for the manual submit button:

```typescript
const handlePinSubmit = async () => {
  if (pinInput.length < 4 || isValidating) return;
  
  setIsValidating(true);
  
  try {
    const result = await validatePin.mutateAsync(pinInput);
    
    if (result && (result.is_super_admin || result.is_primary_owner)) {
      setIsAuthenticated(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  } catch (error) {
    setPinError(true);
    setPinInput('');
  } finally {
    setIsValidating(false);
  }
};
```

**5. Disable numpad during validation**

Add `disabled` state to buttons while validating:

```typescript
disabled={key === '' || isValidating}
```

**6. Optional: Remove `exit_pin` field from settings**

Since the PIN is now validated against personal PINs, the `exit_pin` field in kiosk settings is no longer needed for access control. It can be removed from the local settings state and the Behavior tab (or repurposed for something else like a simple "exit to close" PIN).

## Data Verification

Before testing, confirm your PIN is set in your employee profile:

```sql
SELECT user_id, display_name, login_pin, is_super_admin, is_primary_owner 
FROM employee_profiles 
WHERE login_pin IS NOT NULL;
```

## Summary

| Before | After |
|--------|-------|
| Static `exit_pin` from kiosk settings (defaults to `1234`) | Personal PIN from `employee_profiles.login_pin` |
| Any matching PIN works | Only Super Admins or Primary Owners can access |
| No validation feedback | Uses RPC with proper error handling |
