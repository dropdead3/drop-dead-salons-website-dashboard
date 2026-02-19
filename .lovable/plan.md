

## Fix Sidebar Logo Size and Padding

### Problem
The logo in the expanded sidebar is too large and lacks adequate padding at the top and sides, making it feel cramped against the dark background.

### Changes

**`src/components/dashboard/SidebarNavContent.tsx`**

1. **Increase header padding** (line 311): Change the expanded padding from `px-4 py-3` to `px-5 py-4` for more breathing room on all sides.

2. **Reduce expanded logo size** (line 335): Change the custom logo from `h-4 w-auto` to `h-3 w-auto max-w-[120px]` so it sits more elegantly in the header area.

3. **Reduce collapsed icon size** (line 321): Change from `h-5 w-auto max-w-[40px]` to `h-4 w-auto max-w-[32px]` for proportional scaling.

4. **Reduce text logo size** (line 338): Change the fallback text from `text-base` to `text-sm` so the business name doesn't dominate the header.

### Result
- Logo sits with generous whitespace around it, feeling premium and intentional
- Proportional sizing between collapsed icon and expanded logo
- Matches the calm, executive aesthetic of the dark sidebar
