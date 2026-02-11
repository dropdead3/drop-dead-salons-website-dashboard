

## Upgrade Zura AI Insight to Premium Center-Screen Dialog

### Problem
The current Zura AI analysis uses a small `Popover` anchored to the card. It feels cramped, hard to read, and the positioning often overlaps other cards (as seen in the screenshot). The markdown typography lacks breathing room between sections.

### Solution
Replace the `Popover` with a `Dialog` component that opens center-screen with a backdrop blur overlay. Enhance the markdown rendering with premium typography spacing.

### Technical Approach

**File: `src/components/dashboard/ZuraCardInsight.tsx`**

1. Replace `Popover`/`PopoverTrigger`/`PopoverContent` with `Dialog`/`DialogTrigger`/`DialogContent`
2. Use custom `DialogOverlay` with `backdrop-blur-sm` for the frosted glass effect behind the modal
3. Widen the dialog to `max-w-lg` (512px) for comfortable reading
4. Set `max-h-[70vh]` with `overflow-y-auto` on the content body so long analyses scroll gracefully
5. Enhanced markdown styling via custom `ReactMarkdown` components:
   - `h1`/`h2`/`h3`: Add `mt-6 mb-2` spacing, `font-display`, `tracking-wide`
   - `p`: Add `mb-4 leading-relaxed` for paragraph breathing room
   - `ul`/`ol`: Add `mb-4 space-y-1` for list spacing
   - `strong`: Subtle `text-foreground` emphasis
6. Premium header with larger `ZuraAvatar`, card name subtitle, and bottom border
7. Refined footer with "Powered by Zura AI" branding

### Visual Result

```text
+--------------------------------------------------+
|          (blurred background)                     |
|                                                   |
|     +--------------------------------------+      |
|     |  [Z]  ZURA AI                        |      |
|     |       Sales Overview            [X]  |      |
|     |--------------------------------------|      |
|     |                                      |      |
|     |  Hello! I'm Zura, your AI advisor... |      |
|     |                                      |      |
|     |  WHAT THIS METRIC MEANS              |      |
|     |                                      |      |
|     |  The Sales Overview is the heartbeat  |      |
|     |  of your business...                 |      |
|     |                                      |      |
|     |  CURRENT PERFORMANCE                 |      |
|     |  ...                                 |      |
|     |                                      |      |
|     |--------------------------------------|      |
|     |       Powered by Zura AI             |      |
|     +--------------------------------------+      |
+--------------------------------------------------+
```

### Files Modified
1. `src/components/dashboard/ZuraCardInsight.tsx` -- replace Popover with Dialog, add backdrop blur, enhance markdown typography

