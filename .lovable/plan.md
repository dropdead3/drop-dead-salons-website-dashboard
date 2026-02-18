

# Match Live Previews to Actual Website Styling

## Problem
The live previews in the settings cards don't match how these components actually render on the live website. The announcement banner uses wrong text sizes, banned font weights (`font-semibold`), and different layout. The social links preview shows abstract icon circles instead of the actual footer "Connect" section format.

## Changes (single file: WebsiteSettingsContent.tsx)

### 1. Announcement Banner Preview (lines 238-262)
Replace the current preview with markup that mirrors `Header.tsx` lines 202-218:

- Layout: `bg-secondary py-2.5 px-4` with `flex items-center justify-between` (matching the desktop view)
- Text: `text-sm text-foreground/80` for the message (not `text-xs`)
- Highlight: `font-medium` only (remove `font-semibold` which is a banned class, remove underline)
- CTA: `uppercase tracking-wider text-sm font-sans font-medium text-foreground` with a proper `ArrowRight` icon from lucide-react (not raw SVG)
- Remove centered layout, use `justify-between` to match the live site's desktop rendering

### 2. Social Links Preview (lines 292-317)
Replace the icon circles with markup that mirrors `Footer.tsx` lines 117-140:

- "Connect" heading: `text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans`
- Show each social platform as a text link (like the footer does with Instagram), using `text-sm font-sans font-light text-foreground/50` for filled URLs
- Dim/hide platforms without URLs
- Include the platform icon at `size={18}` alongside the URL or handle text, matching the footer's `inline-flex items-center gap-2` pattern

### Summary of Visual Fixes
| Element | Current (Wrong) | Fixed (Matches Live) |
|---------|-----------------|---------------------|
| Banner text size | `text-xs` | `text-sm` |
| Highlight weight | `font-semibold underline` | `font-medium` (no underline) |
| CTA style | Colored, inline | Uppercase, tracking-wider, ArrowRight icon |
| Banner layout | Centered, all inline | Flex justify-between |
| Social preview | Abstract circles | Text links with icons, matching footer |

