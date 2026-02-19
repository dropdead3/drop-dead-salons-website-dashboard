

## Show User Profile Photo in Header Avatar

### What changes
Replace the static `UserCircle` icon in both the desktop and mobile header profile dropdown triggers with the user's actual profile photo when available, falling back to the `UserCircle` icon when no photo is set.

### File: `src/components/dashboard/DashboardLayout.tsx`

#### 1. Import the employee profile hook
Add `useEmployeeProfile` to the existing imports from `@/hooks/useEmployeeProfile`.

#### 2. Call the hook inside `DashboardLayoutInner`
Add near the other hooks at the top of the component:
```tsx
const { data: employeeProfile } = useEmployeeProfile();
```

#### 3. Replace the desktop header profile trigger (around line 948-951)
Replace the `UserCircle` icon button with a conditional avatar:
```tsx
<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
  {employeeProfile?.photo_url ? (
    <Avatar className="h-7 w-7">
      <AvatarImage src={employeeProfile.photo_url} alt="Profile" />
      <AvatarFallback><UserCircle className="w-4 h-4" /></AvatarFallback>
    </Avatar>
  ) : (
    <UserCircle className="w-4 h-4" />
  )}
</Button>
```

#### 4. Replace the mobile header profile trigger (around line 1215-1218)
Same change as above for the mobile layout's profile dropdown trigger.

### Why this works
- `useEmployeeProfile` is already used elsewhere and returns the current user's `photo_url` from their employee profile
- `Avatar`, `AvatarImage`, and `AvatarFallback` are already imported in this file
- When no photo is uploaded, `photo_url` is null, so the `UserCircle` icon continues to show
- Once a photo is added, it appears as a circular avatar in the header immediately
