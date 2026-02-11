

# Increase Dark Mode Border Brightness

## Change

Bump `--border` and `--sidebar-border` lightness by another 4% across all dark theme variants in `src/index.css`.

| Dark Theme | Current | New |
|---|---|---|
| Cream | 22% | 26% |
| Rose | 24% | 28% |
| Sage | 24% | 28% |
| Ocean | 24% | 28% |

This will make the Services/Products sub-cards and other internal card boundaries clearly visible while still keeping borders subtle and premium.

## File
`src/index.css` -- update 8 CSS variable values (4 `--border` + 4 `--sidebar-border`).

