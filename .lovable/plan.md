

# Add PIN Settings Hint for Account Owners in Team PIN Management

## Overview

When an account owner (primary owner) views the Team PIN Management tab, they'll see a helpful hint explaining that they can manage their own PIN in their personal settings, with a direct navigation link.

## Current State

The Team PIN Management tab has:
- An info banner stating "You cannot reset the Account Owner's PIN. Only they can change their own PIN." (lines 121-127)
- Primary owners see their entry but cannot have their PIN reset by others

## Proposed Enhancement

Add a contextual hint specifically for primary owners that:
1. Acknowledges they're the account owner
2. Provides a direct link to their PIN settings page (`/dashboard/admin/settings?category=system`)
3. Uses consistent styling with the existing info banners

## File to Modify

### `src/components/access-hub/TeamPinManagementTab.tsx`

**Change 1: Import the `useIsPrimaryOwner` hook and `Link` component**

Add to the imports:
```typescript
import { useIsPrimaryOwner } from '@/hooks/useIsPrimaryOwner';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
```

**Change 2: Use the hook in the component**

After the existing hooks (around line 38):
```typescript
const { data: isPrimaryOwner } = useIsPrimaryOwner();
```

**Change 3: Add a conditional hint after the existing info banner**

After the existing info banner (line 127), add:
```typescript
{/* Primary Owner Self-Edit Hint */}
{isPrimaryOwner && (
  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
    <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">
        <strong>Your PIN:</strong> As the Account Owner, you can manage your own PIN in your personal settings.
      </p>
      <Link 
        to="/dashboard/admin/settings?category=system"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
      >
        Go to PIN Settings
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  </div>
)}
```

## Visual Result

For account owners, they'll see two informational boxes:
1. **Warning (amber):** The existing note about not being able to reset other owners' PINs
2. **Info (primary):** A new hint specifically for them with a link to manage their own PIN

## Technical Notes

- The `useIsPrimaryOwner` hook already exists and checks if the current user is the primary owner of their organization
- The Settings page route `/dashboard/admin/settings?category=system` will scroll to the System Settings section which contains the UserPinSettings component
- The styling follows the existing pattern used in UserPinSettings.tsx (lines 77-82) for admin-specific hints

