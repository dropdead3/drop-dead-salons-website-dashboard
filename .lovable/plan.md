
# Add Phone Input Formatting with Parentheses and Dashes

## Summary

Add automatic phone number formatting to force the `(XXX) XXX-XXXX` pattern when users type in phone fields. The formatting will be applied in real-time as the user types, matching the existing pattern used elsewhere in the codebase.

---

## Current State

The phone input in `EditOrganizationDialog.tsx` (line 480-484) accepts raw input without formatting:

```tsx
<PlatformInput 
  placeholder="(555) 123-4567" 
  {...field} 
  value={field.value || ''} 
/>
```

Result: Users can enter `4805430240` without any formatting applied.

---

## Solution

### Approach 1: Component-Level Fix (Immediate)

Add a `formatPhoneNumber` helper inside `EditOrganizationDialog.tsx` and use it in the phone field's `onChange` handler:

```tsx
// Add helper function
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

// Update the phone field
<PlatformInput 
  placeholder="(555) 123-4567" 
  value={field.value || ''} 
  onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
/>
```

### Approach 2: Centralized Utility (Best Practice)

Create a shared utility function for phone formatting to ensure consistency across all phone inputs:

**File**: `src/lib/utils.ts`

```typescript
/**
 * Formats a phone number as (XXX) XXX-XXXX
 * Strips non-digits and applies formatting progressively as user types
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
```

Then import and use across all phone input components.

---

## Implementation Plan

| Step | File | Change |
|------|------|--------|
| 1 | `src/lib/utils.ts` | Add centralized `formatPhoneNumber` utility |
| 2 | `src/components/platform/EditOrganizationDialog.tsx` | Import utility and apply to phone field onChange |
| 3 | `src/components/platform/CreateOrganizationDialog.tsx` | Apply same formatting to phone field (if exists) |

---

## Files to Modify

### 1. `src/lib/utils.ts`
Add the `formatPhoneNumber` function for reuse across the application.

### 2. `src/components/platform/EditOrganizationDialog.tsx`
Update the phone field (lines 473-489) to use the formatter:

```tsx
<FormField
  control={form.control}
  name="primary_contact_phone"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-slate-300">Contact Phone</FormLabel>
      <FormControl>
        <PlatformInput 
          placeholder="(555) 123-4567" 
          value={field.value || ''} 
          onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
        />
      </FormControl>
      <FormMessage className="text-red-400" />
    </FormItem>
  )}
/>
```

---

## Visual Result

**Before**: `4805430240`  
**After**: `(480) 543-0240`

The formatting applies progressively as the user types:
- Type `4` → `(4`
- Type `80` → `(480`
- Type `5` → `(480) 5`
- Type `43` → `(480) 543`
- Type `0` → `(480) 543-0`
- Type `240` → `(480) 543-0240`

---

## Edge Cases Handled

- **Pasting numbers**: Strips non-digits and reformats
- **Deleting characters**: Reformats remaining digits correctly
- **International numbers**: Limits to 10 digits (US format)
- **Existing data**: On form load, the value will be formatted when the user interacts with the field
