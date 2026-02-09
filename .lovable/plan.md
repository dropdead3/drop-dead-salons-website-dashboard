
# Fix Kiosk Settings Dialog Timeout for Subsequent Attempts

## Problem

The 10-second inactivity timeout works on the first attempt but fails on subsequent attempts. This is a **stale closure issue** where the timeout callback captures old values of state variables.

## Root Cause

When the dialog closes and reopens:
1. The `resetTimeout` callback is memoized with `useCallback` and dependencies `[isOpen, isAuthenticated, onClose]`
2. Inside the timeout callback, `onClose()` is called which changes `isOpen` to `false`
3. On subsequent opens, the refs and closures don't properly reinitialize because React's reconciliation sees it as the same component

## Solution

Use `refs` to track the latest values instead of relying on closures. This ensures the timeout callback always accesses current state.

### Technical Changes

**File: `src/components/kiosk/KioskSettingsDialog.tsx`**

1. Add refs to track latest `isOpen` and `isAuthenticated` values:

```typescript
const isOpenRef = useRef(isOpen);
const isAuthenticatedRef = useRef(isAuthenticated);

// Keep refs in sync
useEffect(() => {
  isOpenRef.current = isOpen;
}, [isOpen]);

useEffect(() => {
  isAuthenticatedRef.current = isAuthenticated;
}, [isAuthenticated]);
```

2. Update `resetTimeout` to use refs instead of closure values:

```typescript
const resetTimeout = useCallback(() => {
  // Clear existing timers
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  if (countdownRef.current) clearInterval(countdownRef.current);
  
  // Use refs for current values (avoids stale closures)
  if (!isOpenRef.current || isAuthenticatedRef.current) return;
  
  // Reset countdown
  setTimeRemaining(PIN_TIMEOUT_SECONDS);
  
  // Start countdown interval
  countdownRef.current = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 1) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  // Set timeout to close dialog
  timeoutRef.current = setTimeout(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Check refs before closing (ensures we're still in valid state)
    if (isOpenRef.current && !isAuthenticatedRef.current) {
      setIsAuthenticated(false);
      setPinInput('');
      setPinError(false);
      setTimeRemaining(PIN_TIMEOUT_SECONDS);
      onClose();
    }
  }, PIN_TIMEOUT_SECONDS * 1000);
}, [onClose]); // Reduced dependencies - refs handle the rest
```

3. Ensure proper cleanup and reinitialization on open:

```typescript
useEffect(() => {
  if (isOpen && !isAuthenticated) {
    // Small delay to ensure clean state after previous close
    const initTimer = setTimeout(() => {
      resetTimeout();
    }, 50);
    return () => clearTimeout(initTimer);
  } else {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }
  
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };
}, [isOpen, isAuthenticated, resetTimeout]);
```

## Why This Works

| Before (Stale Closure) | After (Refs) |
|------------------------|--------------|
| `isOpen` captured at callback creation time | `isOpenRef.current` always has latest value |
| Subsequent opens reuse old callback | Callback reads fresh values from refs |
| Timer fires with outdated state | Timer checks current state before acting |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/kiosk/KioskSettingsDialog.tsx` | Add refs for tracking state, update `resetTimeout` to use refs |

## Visual Behavior

```text
First open:   Dialog → 10s countdown → Auto-close ✓
Second open:  Dialog → 10s countdown → Auto-close ✓ (now works!)
Third open:   Dialog → 10s countdown → Auto-close ✓ (continues working)
```
