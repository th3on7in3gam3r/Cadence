# Landing assets

## Hero screenshot

Drop a production dashboard capture here as `cadence-dashboard.webp`.

The landing page shows this image when present; otherwise it falls back to the animated in-app mock.

## Logo strip

Monochrome SVG wordmarks live in `public/landing/logos/`. Each file maps to a brand in `src/data/landingSocialProof.ts`:

| File | Brand |
|------|-------|
| `biblefunland.svg` | BibleFunLand Studios |
| `kerygma.svg` | Kerygma Social |
| `postwick.svg` | Postwick |
| `citepilot.svg` | CitePilot |
| `aegis-loop.svg` | Aegis Loop |

Use `currentColor` fill so logos inherit slate tones from the parent. Keep viewBox height ~24px for consistent sizing. If a logo fails to load, the UI falls back to a text pill with the brand name.
