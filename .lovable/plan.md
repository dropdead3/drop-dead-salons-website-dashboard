
# Enlarge Chat Message and Staff Name Font Sizes

## Problem

Current font sizes are too small and difficult to read:
- Staff names use `text-sm` (14px)
- Message content uses `text-sm` (14px)
- Thread timestamps use `text-[10px]` (10px)

## Proposed Changes

Increase font sizes from `text-sm` (14px) to `text-base` (16px) for primary content to improve readability.

### Font Size Comparison

| Element | Current | Proposed |
|---------|---------|----------|
| Sender name | `text-sm` (14px) | `text-base` (16px) |
| Message content | `text-sm` (14px) | `text-base` (16px) |
| Timestamp | `text-xs` (12px) | `text-xs` (12px) - keep small |
| Thread timestamp | `text-[10px]` (10px) | `text-xs` (12px) |

## Files to Modify

### 1. `MessageItem.tsx` (Main Chat)

**Line 106** - Sender name:
```tsx
// Before
<span className="font-semibold text-sm">{senderName}</span>

// After  
<span className="font-semibold text-base">{senderName}</span>
```

**Line 114** - Message content:
```tsx
// Before
<div className="text-sm whitespace-pre-wrap break-words">

// After
<div className="text-base whitespace-pre-wrap break-words">
```

### 2. `ThreadMessageItem.tsx` (Thread Panel)

**Line 136** - Sender name:
```tsx
// Before
<span className="font-semibold text-sm">{senderName}</span>

// After
<span className="font-semibold text-base">{senderName}</span>
```

**Line 137** - Timestamp (slightly larger):
```tsx
// Before
<span className="text-[10px] text-muted-foreground">{timestamp}</span>

// After
<span className="text-xs text-muted-foreground">{timestamp}</span>
```

**Line 143** - Message content:
```tsx
// Before
<div className="text-sm whitespace-pre-wrap break-words">

// After
<div className="text-base whitespace-pre-wrap break-words">
```

## Summary

| File | Changes |
|------|---------|
| `src/components/team-chat/MessageItem.tsx` | Increase sender name and message content to `text-base` |
| `src/components/team-chat/ThreadMessageItem.tsx` | Increase sender name, message content to `text-base`, timestamp to `text-xs` |

This will make chat messages significantly more readable while maintaining visual hierarchy (timestamps remain smaller than main content).
