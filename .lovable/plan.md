

## Add Configure Button to STYLISTS BY LEVEL Card

### What Changes

Add a small configure/settings button to the top-right area of the STYLISTS BY LEVEL card header that navigates the user to the Experience Levels settings page. This follows the same card header action pattern used elsewhere (icon + title on left, action button on right).

### Plan

**File: `src/components/dashboard/StylistsOverviewCard.tsx`**

1. **Import dependencies**: Add `Settings` icon from `lucide-react`, `Button` from UI, `useNavigate` from `react-router-dom`, and `tokens` from design tokens.

2. **Restructure the header** to use `justify-between` so the left side (icon + title) and right side (configure button) are separated:

```
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <!-- existing icon box + title/description -->
  </div>
  <Button
    variant="outline"
    size="sm"
    className={tokens.button.cardAction}
    onClick={() => navigate('/dashboard/admin/settings', { state: { scrollTo: 'levels' } })}
  >
    <Settings className="w-4 h-4" /> Configure
  </Button>
</div>
```

The button uses `tokens.button.cardAction` for the pill styling consistent with other card header actions. It navigates to the admin settings page where Experience Levels are configured.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/StylistsOverviewCard.tsx` | Add Configure button to card header with navigation to settings |
