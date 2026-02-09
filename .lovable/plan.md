

# Remove Notifications from System Settings

## The Issue

The Notifications card in **Settings > System** is misplaced. "System" should be focused on personal/technical settings (Appearance, Security, Quick Login PIN), while the notification settings shown are **organization-wide business settings** like:
- Staffing Capacity Alerts
- Daily Check-in Reminders
- Weekly Wins Reminders
- Birthday Reminders

## Recommendation

**Option A: Remove from System only** (simpler)
- Remove the `<NotificationsCard />` from the System tab
- These settings can be added as a dedicated "Notifications" category later if needed

**Option B: Create a dedicated Notifications category** (more complete)
- Add a new settings category called "Notifications" to the main settings grid
- Move the `NotificationsCard` content there
- Remove from System tab

## Proposed Solution (Option A)

For now, simply remove the Notifications card from System settings. This cleans up the System category to focus on what it should: Appearance, Security, and Quick Login PIN.

## File to Modify

### `src/pages/dashboard/admin/Settings.tsx`

**Change**: Remove line 1220 (`<NotificationsCard />`) from the System tab content.

```typescript
// Before (lines 1217-1221):
</Card>

{/* Notifications */}
<NotificationsCard />

{/* Security */}

// After:
</Card>

{/* Security */}
```

**Optional cleanup**: The `NotificationsCard` function (lines 241-380) can also be removed if no longer used anywhere else, along with the related imports.

## After This Change

The **System** tab will show:
1. **Appearance** - Color themes, dark mode
2. **Security** - Email verification, signup restrictions  
3. **Quick Login PIN** - Personal PIN for quick dashboard access

## Future Consideration

If organization-wide notification settings are needed, create a dedicated "Notifications" category in the main settings grid with a Bell icon.

