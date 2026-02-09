
# Enhance PIN Lock Screen UI with Profile Photo and Loader Animation

## Overview

Improve the PIN unlock screen with two key enhancements:
1. **Clean up profile photo display** - Add a more polished avatar presentation with subtle ring/glow effects
2. **High-end login loader** - Add an elegant loading animation with intentional lag for a premium feel

## Current Issues

From the screenshot:
- The profile photo appears but the presentation feels basic
- No smooth transition or loading state when unlocking
- The unlock happens too abruptly without the "premium" feel

## Changes

### File: `src/components/dashboard/DashboardLockScreen.tsx`

**Change 1: Enhance the validated user preview with a more polished avatar**

Update the validated user section (lines 166-184) with:
- Larger, more prominent avatar with a glowing ring effect
- Subtle pulse animation to indicate "unlocking" state
- Better visual hierarchy with the name

```typescript
{/* Validated User Preview - Enhanced */}
<AnimatePresence>
  {validatedUser && (
    <motion.div
      className="flex flex-col items-center gap-3 mb-6"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Avatar with glow ring */}
      <div className="relative">
        {/* Animated glow ring */}
        <motion.div
          className="absolute -inset-2 rounded-full bg-primary/30 blur-lg"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Avatar className="h-16 w-16 ring-2 ring-primary/50 ring-offset-2 ring-offset-background">
          <AvatarImage src={validatedUser.photo_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {validatedUser.display_name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className="font-medium text-lg">{validatedUser.display_name}</span>
    </motion.div>
  )}
</AnimatePresence>
```

**Change 2: Add a dedicated unlocking state with loading animation**

Add new state and update the validation flow:

```typescript
const [isUnlocking, setIsUnlocking] = useState(false);
```

Update the PIN validation effect to introduce an elegant delay:

```typescript
useEffect(() => {
  if (pin.length === 4 && !isValidating) {
    setIsValidating(true);
    
    validatePin.mutateAsync(pin)
      .then((result) => {
        if (result) {
          setValidatedUser({
            display_name: result.display_name,
            photo_url: result.photo_url,
          });
          setIsUnlocking(true);
          
          // Intentional delay for premium feel (1.5 seconds)
          setTimeout(() => {
            onUnlock({ user_id: result.user_id, display_name: result.display_name });
            navigate('/dashboard/schedule', { 
              state: { 
                quickLoginUserId: result.user_id,
                quickLoginUserName: result.display_name 
              } 
            });
          }, 1500);
        } else {
          setError(true);
          setPin('');
        }
      })
      .catch(() => {
        setError(true);
        setPin('');
      })
      .finally(() => {
        setIsValidating(false);
      });
  }
}, [pin, isValidating, validatePin, onUnlock, navigate]);
```

**Change 3: Add an unlocking overlay with elegant loader**

Add a new section that shows during the unlock process:

```typescript
{/* Unlocking Overlay */}
<AnimatePresence>
  {isUnlocking && (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Success avatar with glow */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Animated glow */}
        <motion.div
          className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Avatar className="h-24 w-24 ring-4 ring-primary/30 ring-offset-4 ring-offset-background">
          <AvatarImage src={validatedUser?.photo_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {validatedUser?.display_name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Checkmark overlay */}
        <motion.div
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
        >
          <Check className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>
      
      {/* Welcome text */}
      <motion.div
        className="text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-display font-medium mb-2">
          Welcome back
        </h2>
        <p className="text-lg text-primary font-medium">
          {validatedUser?.display_name}
        </p>
      </motion.div>
      
      {/* Loading dots */}
      <motion.div
        className="flex gap-1.5 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Change 4: Add Check icon import**

Update imports at the top:

```typescript
import { Lock, Delete, LogOut, Eye, EyeOff, Check } from 'lucide-react';
```

## Visual Flow

```text
1. User enters 4-digit PIN
   ├── PIN validates successfully
   │   ├── Show validated user preview (avatar + name)
   │   ├── Transition to unlocking overlay
   │   │   ├── Large avatar with glow effect
   │   │   ├── Checkmark animation
   │   │   ├── "Welcome back" + name
   │   │   └── Animated loading dots
   │   └── After 1.5s → Navigate to dashboard
   │
   └── PIN fails
       └── Shake animation + "Incorrect PIN"
```

## Benefits

1. **Premium Feel**: The intentional 1.5s delay with beautiful animations creates a high-end experience
2. **Clear Feedback**: User immediately sees their photo and name, confirming correct PIN
3. **Smooth Transitions**: Framer Motion animations throughout for polish
4. **Brand Alignment**: Uses existing design tokens (primary color, fonts)
