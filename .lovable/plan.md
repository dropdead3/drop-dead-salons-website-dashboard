

## Tokenize Card Header Action Buttons

### What You Like

The "Add Add-On" button on the Service Add-Ons card -- a compact, dark-filled pill with a subtle border and white text. The other two card header buttons ("Add Category" and "Add Service") currently use the default gradient-purple variant which looks heavier and inconsistent.

### Changes

**1. Add `cardAction` token to `src/lib/design-tokens.ts`**

Add a new token under `tokens.button`:

```
cardAction: 'h-9 px-4 rounded-full text-sm font-sans font-medium'
```

This encodes the pill shape, sizing, and typography. Paired with `variant="outline"` on the Button component, it produces the exact look of the Add Add-On button in both light and dark mode.

**2. Update `ServicesSettingsContent.tsx` -- two buttons**

- **"Add Category" button** (line ~329): Change from `size={tokens.button.card}` (default variant) to `variant="outline"` with `className={tokens.button.cardAction}`
- **"Add Service" button** (line ~456): Same change -- `variant="outline"` with `className={tokens.button.cardAction}`

**3. Update `ServiceAddonsLibrary.tsx` -- one button**

- **"Add Add-On" button** (line ~431): Currently `size="sm" variant="outline"` -- add `className={tokens.button.cardAction}` so it uses the tokenized pill shape (currently close but not using the token)

### Result

All three card header CTA buttons will render as identical dark outline pills with rounded-full corners, matching the Add Add-On style you like. The token is reusable across any future card header actions.

### Files Modified

| File | Change |
|------|--------|
| `src/lib/design-tokens.ts` | Add `cardAction` to `tokens.button` |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | Update "Add Category" and "Add Service" buttons |
| `src/components/dashboard/settings/ServiceAddonsLibrary.tsx` | Update "Add Add-On" button to use new token |

