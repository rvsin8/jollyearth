# Earthbound

Interactive natural-history atlas of the 36 Conservation International biodiversity hotspots.

- Local dataset: `public/data/hotspots.json`; every displayed statistic includes a source ID.
- Geographic boundaries: Conservation International 2016.1, distributed through ArcGIS; rings are normalized for spherical rendering. Base map: Natural Earth (public domain).
- Habitat remaining: historical Myers et al. (2000) baselines where available; these are not current land-cover measurements. Missing estimates remain explicit.
- Biome index: editorial habitat filters within terrestrial hotspots. Coral-reef entries describe reef-adjacent island/coastal regions, not formally designated marine hotspots.
- Specimens: original, interpretive procedural Three.js studies, not anatomical scans. Photographs have credits, original file links, and license links in the field notes.
- No browser requests to the IUCN Red List API.

Built with React, Vinext, d3-geo, Three.js and local fonts. Development and publication use the Sites workflow.
