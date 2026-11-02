# Earthbound redesign — 3 October 2026

## What changed

- Self-hosted Bluu Next Bold/Bold Italic and Inter variable WOFF2, with licenses. All app typography uses the six requested size/line-height tokens and shared family variables. Sources includes font attribution. Legacy styles are layered beneath the new system to prevent route styles from overriding it.
- First-visit welcome globe with an asymmetric 72px heading, one entry link, calculated counters, a one-time scroll/tap entry, and a continuous 600ms transition of the same canvas into the atlas. Returning visitors skip it; the wordmark reopens it.
- Overlapping detail panel, horizontal snapping card strip, warm system dark mode, persistent desktop navigation, mobile bottom tabs and a draggable detail sheet. Mobile controls and credits reserve space above the collapsed sheet.
- Globe and model camera controls: damped orbit, clamped zoom, shift-drag pan, double-click/Home reset, 15-degree arrow-key and toolbar steps, and persistent manual pause of automatic rotation. The default turntable speed is approximately 20 seconds per turn. Reduced motion removes automatic movement and transitions.
- Model retention during loading and 300ms cross-fades, silhouette loaders, photo fallback, retry actions, neutral key/fill/rim lighting, contact shadows, cloned texture disposal, and a scale control. Three.js and its decoders load on demand.
- First-view trait counts and diagram staggering, cached GeoJSON, lazy below-fold diagrams, and compressed WebP imagery. 47 raster images: 24.77 MB to 5.43 MB (78% smaller). Credits and primary source links remain intact.

## Data and limitations

- Counters derive from local records: 36 hotspots, 42 unique scientific names across the atlas/Jersey City/Plant lab, and 15.1% mean historical habitat remaining across the 23 hotspots with numeric records. Missing records are excluded. This is not a global Earth land-cover estimate.
- The project still contains one GLB, Eastern oyster. Missing animal/plant GLBs continue to show photographs; no organism stand-ins were created.
- A model measurement bar needs verified `dimensions` in the model manifest. Plant records can show their sourced mature-height range. Missing dimensions are stated explicitly; no mesh units are presented as real-world measurements.
- Bluu Next upstream supplies Bold and Bold Italic, without a Regular 400 face. The original, unmodified supplied faces are used.
- Publication includes TypeScript, font/image/label/counter checks, existing GLB/LOD/bounds checks, Plant lab checks, and the production build. Browser visual/touch QA and the 150ms performance target could not be verified because of the existing session restriction.

## Changed application and check files

- `app/atlas-intro.tsx`
- `app/atlas-stats.ts`
- `app/fonts.css`
- `app/globals.css`
- `app/guide-views.tsx`
- `app/hotspot-diagrams.tsx`
- `app/jersey-city/jersey-city.css`
- `app/jersey-city/local-map.tsx`
- `app/jersey-city/model-viewer.tsx`
- `app/jersey-city/places/page.tsx`
- `app/jersey-city/restoration.tsx`
- `app/jersey-city/sewer.tsx`
- `app/jersey-city/wildlife-view.tsx`
- `app/layout.tsx`
- `app/mobile-detail.tsx`
- `app/model-loader.ts`
- `app/model-records.ts`
- `app/motion.tsx`
- `app/page.tsx`
- `app/plant-lab/bed-models.tsx`
- `app/plant-lab/page.tsx`
- `app/plant-lab/plant-lab.css`
- `app/redesign.css`
- `app/site-shell.tsx`
- `app/specimen-transition.tsx`
- `app/specimen.tsx`
- `app/style-system.css`
- `app/world.tsx`
- `scripts/checks/redesign.mjs`

## Data and documentation files

- `content/image-optimization.json`
- `content/redesign-report.md`
- `content/species-seed.json`
- `public/data/hotspots.json`
- `public/data/jersey-city/guide.json`
- `public/data/plants.json`
- `public/data/species.json`

## Asset changes

- `public/fonts/`: three WOFF2 files, upstream licenses, provenance, and the exported-card typography stylesheet; seven old TTF assets removed.
- `public/images/`: 47 JPEG/PNG images replaced by WebP equivalents. The exact old-to-new file mapping is in `content/image-optimization.json`.
