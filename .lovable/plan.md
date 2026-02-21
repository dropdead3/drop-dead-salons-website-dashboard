
## Enhance "Add Level" with Service and Retail Commission Inputs

### What Changes

The current "Add Level" inline form only captures a name. When a new level is created, `serviceCommissionRate` and `retailCommissionRate` default to empty strings, meaning the user must then find and edit the level to set rates. This should all happen at creation time.

### Plan

**File: `src/components/dashboard/settings/StylistLevelsContent.tsx`**

**1. Add state for new level rates**

Add two new state variables alongside `newLevelName`:
- `newServiceRate` (string, default `''`)
- `newRetailRate` (string, default `''`)

**2. Replace the single-input inline form with a multi-field row**

Transform the current add form (lines 453-468) from a single name input + buttons into a structured row with three inputs:

```
[Name input (flex-1)] [Svc % input (w-20)] [Retail % input (w-20)] [Add] [Cancel]
```

- Name: text input, placeholder "Level name...", flex-1
- Svc %: number input, placeholder "Svc %", small fixed width (~w-20)
- Retail %: number input, placeholder "Retail %", small fixed width (~w-20)
- Add button: enabled when name is non-empty (rates can be optional/default to 0)
- Cancel button: resets all three fields

**3. Update `handleAddNew` to use the new rate fields**

Pass `newServiceRate` and `newRetailRate` into the new `LocalStylistLevel` object instead of empty strings:

```typescript
const handleAddNew = () => {
  if (!newLevelName.trim()) return;
  const newSlug = newLevelName.toLowerCase().replace(/\s+/g, '-');
  const newLevel: LocalStylistLevel = {
    id: newSlug,
    slug: newSlug,
    label: newLevelName.trim(),
    clientLabel: `Level ${levels.length + 1}`,
    description: '',
    serviceCommissionRate: newServiceRate || '',
    retailCommissionRate: newRetailRate || '',
  };
  setLevels([...levels, newLevel]);
  setNewLevelName('');
  setNewServiceRate('');
  setNewRetailRate('');
  setIsAddingNew(false);
  setHasChanges(true);
};
```

**4. Reset all fields on Cancel and Escape**

Update the cancel handler and Escape keydown to also clear `newServiceRate` and `newRetailRate`.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Add rate state vars, expand inline form to 3 inputs, update handleAddNew and cancel/reset logic |
