

# Hide Numbers - Default Hidden on Login with Confirmation Dialog

## Overview

Implement two changes to the Hide Numbers privacy feature:
1. **Default to hidden on login** - Numbers should always start hidden when a user logs in
2. **Confirmation dialog when clicking blurred numbers** - When clicking any blurred number, show a confirmation prompt before revealing all numbers

---

## Current Behavior vs New Behavior

```text
CURRENT:
┌─────────────────────────────────────────────────────────────────┐
│  Login → Load preference from database (could be shown/hidden)  │
│  Click blurred number → Just shows tooltip: "Click eye icon"    │
└─────────────────────────────────────────────────────────────────┘

NEW:
┌─────────────────────────────────────────────────────────────────┐
│  Login → Always start with numbers HIDDEN (regardless of DB)    │
│  Click blurred number → Opens confirmation dialog:              │
│    ┌─────────────────────────────────────────────────────┐     │
│    │  "Reveal Financial Data?"                            │     │
│    │                                                      │     │
│    │  Are you sure you want to show numbers?              │     │
│    │                                                      │     │
│    │  ⚠️ This is to prevent sensitive data from being     │     │
│    │  displayed when staff log in at the front desk.      │     │
│    │                                                      │     │
│    │         [Cancel]    [Yes, Show Numbers]              │     │
│    └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Update HideNumbersContext - Default to Hidden

**File:** `src/contexts/HideNumbersContext.tsx`

Change the initial state and login behavior:

```typescript
export function HideNumbersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Start hidden by default (changed from false to true)
  const [hideNumbers, setHideNumbers] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // On login/mount, always start hidden (ignore database preference)
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    // Always hide on login - this is the security feature
    setHideNumbers(true);
    setIsLoading(false);
  }, [user]);

  // New function to request unhide (shows confirmation)
  const requestUnhide = () => {
    if (hideNumbers) {
      setShowConfirmDialog(true);
    }
  };

  // Called when user confirms in dialog
  const confirmUnhide = async () => {
    setHideNumbers(false);
    setShowConfirmDialog(false);
    
    // Optionally persist to database
    if (user) {
      try {
        await supabase
          .from('employee_profiles')
          .update({ hide_numbers: false })
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error saving preference:', err);
      }
    }
  };

  // ...rest of component with dialog state in context
}
```

### 2. Update Context Interface

Add new methods for the confirmation flow:

```typescript
interface HideNumbersContextType {
  hideNumbers: boolean;
  toggleHideNumbers: () => void;
  requestUnhide: () => void;  // NEW: Request to unhide (triggers dialog)
  showConfirmDialog: boolean;  // NEW: Dialog visibility state
  setShowConfirmDialog: (show: boolean) => void;  // NEW: Control dialog
  confirmUnhide: () => void;  // NEW: Confirm unhide action
  isLoading: boolean;
}
```

### 3. Add Confirmation Dialog to BlurredAmount

**File:** `src/contexts/HideNumbersContext.tsx`

Update the `BlurredAmount` component to trigger confirmation on click:

```tsx
export function BlurredAmount({ 
  children, 
  className,
  as: Component = 'span'
}: BlurredAmountProps) {
  const { hideNumbers, requestUnhide } = useHideNumbers();
  
  if (!hideNumbers) {
    return <Component className={className}>{children}</Component>;
  }
  
  return (
    <Component 
      className={cn(className, 'blur-md select-none cursor-pointer')} 
      tabIndex={0}
      onClick={requestUnhide}
      onKeyDown={(e) => e.key === 'Enter' && requestUnhide()}
      title="Click to reveal"
    >
      {children}
    </Component>
  );
}
```

### 4. Add Global Confirmation Dialog Component

Create a new component or add to the context file:

```tsx
export function HideNumbersConfirmDialog() {
  const { showConfirmDialog, setShowConfirmDialog, confirmUnhide } = useHideNumbers();
  
  return (
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Reveal Financial Data?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to show all numbers?</p>
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This is to prevent sensitive financial data from being displayed 
                when staff log in at the front desk or shared workstations.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmUnhide}>
            Yes, Show Numbers
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 5. Render Dialog in Provider

Add the dialog to the provider so it's globally available:

```tsx
return (
  <HideNumbersContext.Provider value={{ ... }}>
    {children}
    <HideNumbersConfirmDialog />
  </HideNumbersContext.Provider>
);
```

### 6. Update Header Toggle (Optional Enhancement)

The header eye icon can still toggle directly OR also show confirmation when revealing. For simplicity, the header toggle can bypass confirmation (trusted action) since the user is explicitly clicking the reveal icon.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/contexts/HideNumbersContext.tsx` | Default to hidden, add confirmation dialog state and component, update BlurredAmount click handler |
| `src/components/ui/AnimatedBlurredAmount.tsx` | Update to use `requestUnhide` on click instead of just showing tooltip |

---

## User Flow

1. **Login** → Numbers are automatically hidden (blurred)
2. **See blurred number** → User clicks on any blurred value
3. **Confirmation dialog appears** → Shows warning about front desk visibility
4. **User confirms** → All numbers become visible
5. **User cancels** → Numbers stay hidden

The header eye icon remains as a quick toggle for trusted users who understand they're revealing data.

---

## Security Benefit

This prevents the scenario where:
- A manager logs in at the front desk to check something
- Walks away momentarily
- Other staff or clients can see sensitive revenue/commission data on screen

By always starting hidden and requiring confirmation, there's an intentional "speed bump" before exposing financial data.

