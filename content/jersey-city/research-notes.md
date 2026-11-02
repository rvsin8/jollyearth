# Jersey City verification notes — 21 September 2026

Published numeric statements cite public/data/jersey-city/guide.json source IDs. Map geometry is a cached public GIS snapshot, with metadata and query URLs alongside it. Park-level restoration markers are calculated from Green Acres parcel centroids and do not imply surveyed project boundaries. Flood display includes A/V zones, not every hazard class. Shoreline is 2012; water polygons are 2020.

American eel status: exact GBIF taxonomic match and cached IUCN category in eel-status.json, EN. Do not call IUCN from the browser.

## Withheld pending evidence
- City canopy: the 2015 report author (Green Infrastructure Center) reports 17%; the city's PDF was identified but download was blocked. 2020 10.9% and universal 25–35% recommendation were not verified against city/state methodology. No current numeric canopy estimate published.
- Sewer coverage: ~60% found in Parks Coalition material; no corroborating municipal primary source obtained. No percent published.
- Birds: eBird hotspot pages blocked by robots policy. No species added from a candidate list or unsupported park observation. No fall-migration calendar cells inferred.
- Terrapin: USACE 2006 draft feasibility report documents a 2003 observation. Useful historic lead, not a recent sighting. Horseshoe crab source leads remain unconfirmed. Neither added to recent sightings.
- Hudson River water nymph is Najas muenscheri / N. guadalupensis subsp. muenscheri. Wider Hudson freshwater-tidal endemic, not a verified Jersey City occurrence. No substitute plant image.
- No licensed scientific marine-species 3D models verified. Local cards use photographs or a labeled USFWS eel illustration; no unrelated model is substituted.
- Same-view rail yard / fenced interior / completed restoration images unavailable. Timeline combines historical rail image and clearly labeled documented/planned textual stages. No planned rendering presented as completed restoration.
- No manually approved sightings have been seeded. Approved student entries and editor-created sightings are persistent and published only through authenticated review.
- Teacher review initially restricted to the verified site owner. External atlas viewers do not acquire publication rights.

## Access
Liberty State Park regular 2026 shuttle season ended September 6, per current NJDEP schedule. Do not show it as running today. Reservoir reopening/path accessibility supported by city September 2024 release. Lincoln wetland access uses county park guide; no unsupported claim that every trail is step-free. Hackensack waterfront access is described through Lincoln Park West, not as a continuous public riverwalk.

## 3D assets — 2026-09-22

- Added Smithsonian Open Access textured GLB for `Crassostrea virginica`, package `77be1e89-fef1-4774-a9e2-8e5b0c46d1de`, from the documented public 3D file-search API. Raw response retained in `models/smithsonian-api.json`. The original 7,191,756-byte GLB is unchanged; the viewer only centers and uniformly scales it. No collection locality or collection date is asserted. This is a museum specimen reference, never a local sighting.
- Digital Life's Atlantic sturgeon model 66B, `03ed5a07d6e647b586489c6ab383121d`, has confirmed CC BY-NC 4.0 metadata and is marked downloadable. The official download endpoint returned HTTP 401 (authentication required). No asset was retrieved or embedded. The project describes its scan/photo reconstruction at https://digitallife3d.org/3d-model . Await an authorized file download before integrating.
- Other local wildlife profiles retain their credited photographs or specimen records. No generic seal, fish, or whale model is substituted for a named species.
- The local viewer is lazy-loaded with the specimen profile, uses a same-origin GLB, supports reduced motion, keyboard buttons, drag orbit, zoom, reset, photo toggle, fullscreen, and a visible photo fallback on load/WebGL failure. Global atlas models are unchanged.
- Browser visual QA remains unavailable under the user's saved browser restriction. Type checking, GLB structure/assets, and production build were checked without changing that restriction.
