
# Fix Team Chat to Fill Full Window Height

## Problem

The Team Chat has a large gap at the bottom because:
1. The `DashboardLayout` always renders a footer
2. The parent container uses `min-h-screen flex flex-col` which doesn't properly constrain height
3. The `flex-1` on the children wrapper doesn't fill remaining space correctly in this context

### Current Structure
```
DashboardLayout
├── <main> (with padding for sidebar)
│   └── <div class="min-h-screen flex flex-col">
│       ├── <div class="flex-1">{children}</div>  ← Chat here, not filling space
│       └── <footer>                              ← Always visible, causing gap
```

---

## Solution

Add a `hideFooter` prop to `DashboardLayout` and use proper height constraints for full-screen pages like Team Chat.

### Changes

| File | Change |
|------|--------|
| `DashboardLayout.tsx` | Add `hideFooter` prop, conditionally render footer |
| `DashboardLayout.tsx` | Use `h-screen` with `overflow-hidden` when footer is hidden |
| `TeamChat.tsx` | Pass `hideFooter` to layout |

### 1. Update DashboardLayout.tsx

**Add prop to interface:**
```tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean; // For full-screen pages like Team Chat
}
```

**Update main content area (lines 1074-1090):**
```tsx
<main className={cn(
  "transition-[padding-left] duration-200 ease-in-out",
  sidebarCollapsed ? "lg:pl-16" : "lg:pl-72",
  hideFooter && "h-screen overflow-hidden"
)}>
  <div className={cn(
    hideFooter ? "h-full flex flex-col" : "min-h-screen flex flex-col",
    isAdmin && "lg:pt-0"
  )}>
    <div className={cn("flex-1", hideFooter && "min-h-0 overflow-hidden")}>
      {children}
    </div>
    {/* Dashboard Footer - hidden for full-screen pages */}
    {!hideFooter && (
      <footer className="py-6 text-center border-t border-border mt-auto">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Drop Dead · Powered by Drop Dead Salon Software
        </p>
      </footer>
    )}
  </div>
</main>
```

### 2. Update TeamChat.tsx

```tsx
<DashboardLayout hideFooter>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Add `hideFooter` prop support |
| `src/pages/dashboard/TeamChat.tsx` | Pass `hideFooter` to layout |

---

## Result

| Before | After |
|--------|-------|
| Footer visible below chat | Footer hidden on Team Chat |
| Chat doesn't fill space | Chat fills entire available height |
| Gap at bottom | Full-screen immersive chat experience |
