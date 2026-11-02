# Hotspot traits and migration audit

Reviewed 13 October 2026. Covers all 36 hotspot records and every Key traits row in the detail panel, hotspot list, and comparison view.

| Field | Finding | Change |
| --- | --- | --- |
| Endemic plants | 13 records substituted the ≥1,500 admission threshold; 23 used other sources or older baselines | 34 region-specific counts from CEPF's 18 July 2007 information matrix, explicitly dated; North American Coastal Plain 1,816 from CEPF's profile; Forests of East Australia “Not available” because the consulted CEPF page supplies rounded totals and percentages, not an explicit endemic count |
| Species at risk | 35 absent; Madagascar's “98% of lemurs” was taxon-specific, not a hotspot total | All unverified hotspot-wide totals read “Not available”; no extrapolation from lemurs to all species |
| Habitat remaining | 13 absent values displayed the ≤30% qualifying criterion | Missing records read “Not available”; 23 historical 2000 baselines retain their dates and citations |
| Estimated mapped area | Values calculated from simplified CI 2016.1 hotspot polygons; not a habitat measurement | Retained with derivation and boundary source; repeated rounded values are not automatically criteria |
| Refuge / Frontier / Remnant | No stated classification rule | Removed from hotspot data and the strip; cards show region or scientific name |
| Biome counts | Current file has 96 overlapping memberships, not 96 distinct hotspots | Explanation added; “Coral reef” renamed “Coastal & reef”, with terrestrial/coastal scope stated; legacy incoming biome links still resolve |

CEPF table: https://d29l0tur8ol1gj.cloudfront.net/sites/default/files/11_10.settingprioritiesforfutureinvestment_1.pdf (Table 1, printed pages 7–9). The table reports 1,500 for Wallacea and Mountains of Central Asia as regional estimates. Those two equal values are not generic threshold substitutions. Values in an archival table must not be presented as current censuses. CEPF's profile pages may offer later regional estimates; this atlas makes the historical date visible instead of mixing unspecified census years.

Historical habitat figures also use the regional definitions available in 2000. Some boundaries were revised afterward, so they are archival context, not a recalculation over the displayed 2016 polygons. No conversion to today's remaining area is made. The splash mean is still an unweighted mean across 23 available historical records, not global remaining habitat.

## Migration decisions

Three records only. Every record includes local occurrence/season evidence, destination/range evidence, threats, and map methods. Full citations live in `public/data/migrations.json` and render in the route panel and Sources page.

- Monarch: Liberty State Park → central Mexico, within Madrean Pine-Oak Woodlands; approximately 3,400 km between representative centers.
- Semipalmated sandpiper: Hudson/Hackensack harbor shorelines → Suriname coast, approximately 4,300 km. No terrestrial hotspot contains the illustrated endpoint. `destinationHotspot` is deliberately null; the globe opens a migration detail panel instead of inventing hotspot membership.
- Osprey: Upper New York Bay → the Caribbean, represented by Cuba, approximately 2,200 km. Cuba is a documented passage hub; many East Coast birds continue to winter farther south. The caption explicitly distinguishes passage from a specific wintering destination.

All three arcs are schematic great-circle connections, not tracks or actual distance flown. Endpoints are approximate park/region centers, never individual wildlife locations. Distance is rounded to 100 km using a spherical Earth radius of 6,371 km. The old unverified local red-knot record is removed.

Thumbnails are original compact SVG identification symbols, not evidence photographs. The osprey observation photograph is cited, not reproduced. Great-circle paths are prepared once per module and progressively drawn over 1.2 seconds. Reduced motion draws immediately. The route link supplies keyboard access to the same description, threat, and sources; the canvas has an associated screen-reader description. Mobile route activation opens and focuses the bottom sheet.

## Validation scope

Automated data checks cover all trait source references, missing-value semantics, destination polygon containment, coordinate order, great-circle endpoints and distances, image existence, and source metadata. Type checking, typography/asset checks, navigation structure checks, worker-failure regression tests, and production asset validation are run before publication.

An authorized browser testing interface is unavailable in this session. These checks do not establish live click, touch, visual, or browser-console results.
