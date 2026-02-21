
## Move "+ Add Level" Button to Card Header

### What Changes

The "+ Add Level" button is currently a full-width outline button at the bottom of the card content. Per the canonical card header pattern and `tokens.button.cardAction`, it should be a pill-shaped button in the top-right corner of the card header, next to the title.

### Plan

**File: `src/components/dashboard/settings/StylistLevelsContent.tsx`**

1. **Restructure CardHeader** to use `justify-between` so the left side (icon box + title) and right side (button) are separated:
   ```
   <CardHeader className="flex flex-row items-center justify-between space-y-0">
     <div className="flex items-center gap-3">
       <div className={tokens.card.iconBox}>...</div>
       <div>
         <CardTitle>...</CardTitle>
         <CardDescription>...</CardDescription>
       </div>
     </div>
     <Button
       variant="outline"
       size={tokens.button.card}
       className={tokens.button.cardAction}
       onClick={() => setIsAddingNew(true)}
     >
       <Plus className="w-4 h-4" /> Add Level
     </Button>
   </CardHeader>
   ```

2. **Remove the old full-width button** from the bottom of `CardContent` (the `!isAddingNew` branch around line 459-464). Keep the inline "add new" input row that appears when `isAddingNew` is true.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/settings/StylistLevelsContent.tsx` | Move button to header with `tokens.button.cardAction`, remove old bottom button |
