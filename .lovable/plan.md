

## Add Migration Credentials Card to Account Overview

This plan adds a new editable card to the Account Detail Overview tab where the migration team can store the business's previous CRM login credentials, with a prominent 2FA warning reminder.

---

### Overview

The migration team needs a place to record login credentials for a business's previous CRM system (e.g., Phorest, Mindbody, Square) so they can access and export data. This card will:

1. Display the source software (already tracked)
2. Provide editable fields for CRM username and password
3. Show a warning alert reminding the team to have the business owner disable 2FA

---

### Visual Design

```text
MIGRATION ACCESS
+----------------------------------------------------------+
| [!] Reminder: Ask business owner to disable 2FA before   |
|     attempting to access their CRM account               |
+----------------------------------------------------------+
| Previous Software     Phorest              [Edit]        |
+----------------------------------------------------------+
| CRM Username          john@salon.com                     |
| CRM Password          ********** [Show/Hide]             |
+----------------------------------------------------------+
|                              [Save Changes]              |
+----------------------------------------------------------+
```

The card will:
- Use amber/warning styling for the 2FA reminder alert
- Show a masked password with toggle visibility
- Include inline editing with save functionality
- Match `PlatformCard variant="glass"` styling

---

### Database Approach

Store the credentials in the existing `organizations.settings` JSONB field. This keeps the schema unchanged while allowing flexible storage:

```json
{
  "migration_credentials": {
    "crm_username": "john@salon.com",
    "crm_password": "password123",
    "updated_at": "2026-01-30T22:30:00Z",
    "updated_by": "admin@platform.com"
  }
}
```

**Security Note**: These are temporary credentials for one-time migration use, stored in the platform admin's internal view. RLS policies already restrict access to platform admins only.

---

### Implementation

#### 1. New Component: `MigrationCredentialsCard`
**File:** `src/components/platform/account/MigrationCredentialsCard.tsx`

Features:
- Accepts `organizationId` and `organization` props (for source_software and settings)
- 2FA warning alert at top using amber/warning colors
- Displays source software (read-only, links to Edit Account dialog)
- Editable username and password fields
- Password visibility toggle (eye icon)
- Save button that updates organization settings
- Loading and success states
- Uses `useUpdateOrganization` hook for saving

Component structure:
```tsx
<PlatformCard variant="glass">
  <PlatformCardHeader>
    <PlatformCardTitle>Migration Access</PlatformCardTitle>
  </PlatformCardHeader>
  <PlatformCardContent>
    {/* 2FA Warning Alert */}
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
        <p className="text-sm text-amber-200">
          Reminder: Ask the business owner to disable 2FA before 
          attempting to access their CRM account
        </p>
      </div>
    </div>
    
    {/* Source Software Display */}
    <div className="space-y-4">
      <div>
        <label className="text-sm text-slate-400">Previous Software</label>
        <p className="text-slate-300 capitalize">
          {organization.source_software || 'Not specified'}
        </p>
      </div>
      
      {/* Username Input */}
      <div>
        <label className="text-sm text-slate-400">CRM Username</label>
        <PlatformInput 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter CRM username or email"
        />
      </div>
      
      {/* Password Input with Toggle */}
      <div>
        <label className="text-sm text-slate-400">CRM Password</label>
        <div className="relative">
          <PlatformInput 
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter CRM password"
          />
          <button onClick={togglePassword}>
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>
    </div>
    
    {/* Save Button */}
    <PlatformButton onClick={handleSave} disabled={!hasChanges}>
      Save Credentials
    </PlatformButton>
  </PlatformCardContent>
</PlatformCard>
```

---

#### 2. Update Account Detail Page
**File:** `src/pages/dashboard/platform/AccountDetail.tsx`

Add the new card to the Overview tab, after Contact Information and Account Details but before Business Integrations:

```tsx
<TabsContent value="overview" className="space-y-4">
  <div className="grid gap-4 lg:grid-cols-2">
    {/* Contact Info Card */}
    {/* Account Details Card */}
  </div>
  
  {/* Migration Credentials Card - NEW */}
  <MigrationCredentialsCard 
    organizationId={organization.id}
    organization={organization}
  />
  
  {/* Business Integrations Card */}
  <AccountIntegrationsCard organizationId={organization.id} />
</TabsContent>
```

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/platform/account/MigrationCredentialsCard.tsx` | **Create** | Editable card for CRM credentials with 2FA warning |
| `src/pages/dashboard/platform/AccountDetail.tsx` | **Edit** | Add migration card to Overview tab |

---

### Technical Details

#### Saving Credentials

Uses the existing `useUpdateOrganization` hook to update the settings JSONB:

```typescript
const handleSave = async () => {
  const currentSettings = organization.settings || {};
  const newSettings = {
    ...currentSettings,
    migration_credentials: {
      crm_username: username,
      crm_password: password,
      updated_at: new Date().toISOString(),
    },
  };
  
  await updateOrganization({
    id: organizationId,
    settings: newSettings,
  });
};
```

#### Reading Existing Credentials

On component mount, extract from settings:

```typescript
useEffect(() => {
  const settings = organization.settings as any;
  if (settings?.migration_credentials) {
    setUsername(settings.migration_credentials.crm_username || '');
    setPassword(settings.migration_credentials.crm_password || '');
  }
}, [organization.settings]);
```

#### Password Visibility Toggle

Simple state toggle with Eye/EyeOff icons:

```typescript
const [showPassword, setShowPassword] = useState(false);
// Button toggles between Eye and EyeOff icons
```

---

### Styling Notes

- 2FA warning uses `bg-amber-500/10 border-amber-500/30` for attention
- AlertTriangle icon in amber color
- Input fields use existing `PlatformInput` component
- Password toggle button positioned absolutely inside input container
- Save button disabled until changes are made
- Success toast on save via existing hook

