

# Fix Kiosk Settings Dialog Timeout - Robust Solution

## Problem

The 10-second inactivity timeout works on the first attempt but fails on subsequent attempts. The current ref-based fix still has timing issues because:

1. The `KioskSettingsDialog` component stays mounted (it's always rendered, just hidden when `isOpen=false`)
2. When reopening, the `useRef(isOpen)` initialization already happened on first mount
3. The `useEffect` that syncs refs runs asynchronously after render
4. Even with a 50ms delay, there's a race condition between ref updates and `resetTimeout` execution

## Root Cause

The current flow on subsequent opens:

```text
1. isOpen changes: false → true
2. Component re-renders
3. useEffect for ref sync SCHEDULED (not yet run)
4. useEffect for timeout SCHEDULED (not yet run)
5. Effects run in order:
   a. isOpenRef.current = true
   b. setTimeout(resetTimeout, 50)
6. After 50ms, resetTimeout checks isOpenRef.current
```

The issue: The 50ms delay should work, but the interval/timeout from the previous session might not be fully cleared, or the refs are in an inconsistent state during the transition.

## Solution

Make the initialization more robust by:

1. **Update refs synchronously during render** (not just in useEffect)
2. **Use a mount key pattern** to force fresh state on each open
3. **Clear all timers comprehensively** when closing

### Technical Changes

**File: `src/components/kiosk/KioskSettingsDialog.tsx`**

1. Update refs synchronously during render (before effects run):

```typescript
// Refs to track latest state values
const isOpenRef = useRef(isOpen);
const isAuthenticatedRef = useRef(isAuthenticated);

// Sync refs SYNCHRONOUSLY on every render (not just in useEffect)
isOpenRef.current = isOpen;
isAuthenticatedRef.current = isAuthenticated;
```

2. Remove the redundant useEffect syncs for refs (lines 38-44)

3. Add a session key to force timer reset on each open:

```typescript
const [sessionKey, setSessionKey] = useState(0);

// When dialog opens, increment session key to force fresh timers
useEffect(() => {
  if (isOpen) {
    setSessionKey(prev => prev + 1);
  }
}, [isOpen]);
```

4. Update the timeout initialization effect to depend on sessionKey:

```typescript
useEffect(() => {
  if (isOpen && !isAuthenticated) {
    // Clear any existing timers first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    // Reset state
    setTimeRemaining(PIN_TIMEOUT_SECONDS);
    
    // Start fresh countdown
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start fresh timeout
    timeoutRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (isOpenRef.current && !isAuthenticatedRef.current) {
        setIsAuthenticated(false);
        setPinInput('');
        setPinError(false);
        setTimeRemaining(PIN_TIMEOUT_SECONDS);
        onClose();
      }
    }, PIN_TIMEOUT_SECONDS * 1000);
  }
  
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };
}, [sessionKey, isOpen, isAuthenticated, onClose]);
```

5. Simplify `resetTimeout` to just restart timers on user interaction:

```typescript
const resetTimeout = useCallback(() => {
  if (!isOpenRef.current || isAuthenticatedRef.current) return;
  
  // Clear and restart timers
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  if (countdownRef.current) clearInterval(countdownRef.current);
  
  setTimeRemaining(PIN_TIMEOUT_SECONDS);
  
  countdownRef.current = setInterval(() => {
    setTimeRemaining(prev => prev <= 1 ? 0 : prev - 1);
  }, 1000);
  
  timeoutRef.current = setTimeout(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (isOpenRef.current && !isAuthenticatedRef.current) {
      setIsAuthenticated(false);
      setPinInput('');
      setPinError(false);
      setTimeRemaining(PIN_TIMEOUT_SECONDS);
      onClose();
    }
  }, PIN_TIMEOUT_SECONDS * 1000);
}, [onClose]);
```

## Why This Works

| Issue | Solution |
|-------|----------|
| Refs synced async via useEffect | Sync refs directly on render |
| Stale timers from previous session | Session key forces fresh initialization |
| Race condition on reopen | Explicit cleanup before starting new timers |
| Timer refs not nulled after clear | Set refs to null after clearing |

## Execution Order After Fix

```text
1. isOpen changes: false → true
2. Component re-renders
3. isOpenRef.current = true (SYNCHRONOUS, during render)
4. useEffect cleanup runs (clears old timers)
5. sessionKey increments
6. New effect runs with fresh timers
7. All subsequent checks use current ref values ✓
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/kiosk/KioskSettingsDialog.tsx` | Sync refs on render, add session key, improve timer management |

