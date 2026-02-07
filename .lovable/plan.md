
# Double-Click to Hide Numbers Feature

## Overview

Add a "double-click to hide" interaction to all financial amounts. When numbers are **visible** (not blurred), double-clicking any sales/financial number will immediately blur all numbers across the dashboard. This provides a quick privacy mode for when someone walks up to your screen.

---

## How It Works

| Current State | User Action | Result |
|---------------|-------------|--------|
| Numbers visible | Double-click any amount | All numbers blur immediately |
| Numbers blurred | Single-click any amount | Confirmation dialog to reveal |
| Numbers blurred | Double-click any amount | No action (already hidden) |

---

## Implementation Approach

### 1. Add `quickHide()` Function to Context

Add a new function to `HideNumbersContext` that immediately hides numbers without confirmation (since hiding is the "safe" action):

```typescript
interface HideNumbersContextType {
  hideNumbers: boolean;
  toggleHideNumbers: () => void;
  requestUnhide: () => void;
  quickHide: () => void;  // NEW - instant hide on double-click
  isLoading: boolean;
}
```

### 2. Update `BlurredAmount` Component

Add `onDoubleClick` handler that calls `quickHide()` when numbers are visible:

```typescript
<Component 
  className={className}
  onDoubleClick={() => !hideNumbers && quickHide()}
  title={!hideNumbers ? 'Double-click to hide' : 'Click to reveal'}
>
  {children}
</Component>
```

### 3. Update `AnimatedBlurredAmount` Component

Same pattern - add double-click handler:

```typescript
<span
  ref={elementRef}
  onDoubleClick={() => !hideNumbers && quickHide()}
  title={hideNumbers ? 'Click to reveal' : 'Double-click to hide'}
>
  {prefix}{formattedValue}{suffix}
</span>
```

---

## User Experience

**When numbers are visible:**
- Hovering over amounts shows tooltip: "Double-click to hide"
- Double-clicking instantly blurs all financial data
- Single-click does nothing (no accidental triggers)

**When numbers are hidden:**
- Hovering shows tooltip: "Click to reveal"
- Single-click opens confirmation dialog
- Double-click has no effect

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/HideNumbersContext.tsx` | Add `quickHide()` function to context; update `BlurredAmount` component with `onDoubleClick` |
| `src/components/ui/AnimatedBlurredAmount.tsx` | Add `onDoubleClick` handler for quick hide |

---

## Technical Details

### `quickHide()` Function

```typescript
// Called on double-click - immediately hides without confirmation
const quickHide = async () => {
  if (!user || hideNumbers) return; // Already hidden or not logged in
  
  setHideNumbers(true);
  
  // Persist to database
  try {
    await supabase
      .from('employee_profiles')
      .update({ hide_numbers: true })
      .eq('user_id', user.id);
  } catch (err) {
    console.error('Error saving hide_numbers preference:', err);
  }
};
```

### Updated `BlurredAmount` Component

```typescript
export function BlurredAmount({ 
  children, 
  className,
  as: Component = 'span'
}: BlurredAmountProps) {
  const { hideNumbers, requestUnhide, quickHide } = useHideNumbers();
  
  const handleDoubleClick = () => {
    if (!hideNumbers) {
      quickHide();
    }
  };
  
  if (!hideNumbers) {
    return (
      <Component 
        className={cn(className, 'cursor-pointer')} 
        onDoubleClick={handleDoubleClick}
        title="Double-click to hide"
      >
        {children}
      </Component>
    );
  }
  
  return (
    <Component 
      className={cn(className, 'blur-md select-none cursor-pointer transition-all duration-200')} 
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

---

## Benefits

1. **Quick Privacy**: Instantly hide sensitive data when someone approaches
2. **Intuitive**: Double-click is a natural "toggle" gesture
3. **No Confirmation Needed**: Hiding is the safe/secure action
4. **Reversible**: Click the eye icon in header or click blurred amount to reveal

---

## Implementation Steps

| Step | Task |
|------|------|
| 1 | Add `quickHide` function to `HideNumbersContextType` interface |
| 2 | Implement `quickHide` in `HideNumbersProvider` |
| 3 | Export `quickHide` in context value |
| 4 | Update `BlurredAmount` to handle double-click when visible |
| 5 | Update `AnimatedBlurredAmount` to handle double-click when visible |
| 6 | Add cursor and title hints for discoverability |
