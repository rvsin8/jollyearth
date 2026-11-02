# Earthbound navigation and control audit

Date: 4 October 2026

## Finding before changes

The persistent Jersey City/Plant lab failure has **not been reproduced in a browser**, so its exact runtime cause remains unconfirmed. The prior claim that missed custom events explained it was stronger than the evidence supported.

Source evidence:

- The old navigation used `next/link`, which renders anchors but calls `preventDefault()` before client routing. `site-shell.tsx` and `NavLinks` did not contain a parent `preventDefault` or `stopPropagation` specific to Jersey City or Plant lab.
- The splash ground/screen returned no DOM once closed. They were not deliberately left permanently mounted with opacity zero. The globe was separately kept `position:fixed; z-index:91` for 650 ms after entry. Its pointer events became active immediately when `splash` became false, creating a transient click-interception window. This does not establish a permanent overlay failure.
- The navigation watchdog treated URL changes as success, even though that does not prove destination content rendered. Its tests therefore could not validate page navigation.
- “Back to the globe” was absent from the Jersey City sub-navigation.
- Plant wind and variation are disabled because the manifest contains only an Eastern oyster model and no plants. Their disabled state is not a navigation bug.
- Map zoom buttons had 40px minimum widths. Eight planting-bed columns could become narrower than 44px. Existing plant movement relied on drag; selection supported placement/removal but not keyboard movement.

## Changes

- Removed `navigation-guard.tsx`, `navigation-recovery.ts`, their watchdog tests, and `atlas-shell-state.tsx`.
- All application navigation now uses native `<a href>` elements without framework click interception. This deliberately uses document navigation: it does not preserve the mounted sidebar across routes. Native routing is the baseline while client navigation remains unverified.
- Current section is derived from the pathname. Biome links carry URL query parameters; no custom navigation events or shared navigation-lock flags remain.
- Splash is conditionally mounted only while open. Entry closes it immediately, removes its background and input layer, restores body scrolling, and removes the globe's fixed positioning in the same state update. There is no closing timer or hidden fullscreen layer.
- The mobile biome picker uses a GET form. A no-script navigation list exposes all sections if JavaScript is disabled.
- Added the Jersey City return link, keyboard map pan/zoom, and a native map feature selector.
- Added keyboard/tap movement of existing bed plants, a scrollable bed with minimum 44px cells, broader focus-visible rules, and 44px minimum sizes for mobile HTML controls and links.
- Source links retain native HTTPS destinations; only ordinary clicks with an available interstitial provider are intercepted. New-tab modifier clicks retain browser behavior.

## Verification boundary

No browser clicks, keyboard traversal, touch actions, `elementFromPoint` hit tests, screenshot inspection, or measured mobile target checks were performed. The Sites managed-preview workflow requires the `control-browser` skill, which is absent from the available skills and filesystem. The workflow explicitly prohibits substituting another browser-control path when it is absent. A prior preview access restriction is also recorded in this session. No workaround was attempted.

**“Not run” is not a pass.** The source findings below describe handlers and markup, not observed behavior. Wind and variation fail the requested interactive behavior because their required assets do not exist.

## Per-control results

| Group | Control | Source inspection | Click/interaction result |
|---|---|---|---|
| Sidebar | Explore | Native anchor; matching route module exists | Not run |
| Sidebar | At risk | Native anchor; matching route module exists | Not run |
| Sidebar | Jersey City | Native anchor; matching route module exists | Not run |
| Sidebar | Plant lab | Native anchor; matching route module exists | Not run |
| Sidebar | Field notes | Native anchor; matching route module exists | Not run |
| Sidebar | Hotspot list | Native anchor; matching route module exists | Not run |
| Sidebar | Compare | Native anchor; matching route module exists | Not run |
| Sidebar | Sources | Native anchor; matching route module exists | Not run |
| Biomes | Tropical forest | Native anchor with biome query; atlas reads URL | Not run |
| Biomes | Coral reef | Native anchor with biome query; atlas reads URL | Not run |
| Biomes | Grassland | Native anchor with biome query; atlas reads URL | Not run |
| Biomes | Mangrove | Native anchor with biome query; atlas reads URL | Not run |
| Biomes | Alpine | Native anchor with biome query; atlas reads URL | Not run |
| Biomes | Desert | Native anchor with biome query; atlas reads URL | Not run |
| Jersey City sub-nav | Where we are | Native anchor; matching route module exists | Not run |
| Jersey City sub-nav | Who lives here | Native anchor; matching route module exists | Not run |
| Jersey City sub-nav | Where to go | Native anchor; matching route module exists | Not run |
| Jersey City sub-nav | Challenges & responses | Native anchor; matching route module exists | Not run |
| Jersey City sub-nav | Recent sightings | Native anchor; matching route module exists | Not run |
| Jersey City sub-nav | Student field station | Native anchor; matching route module exists | Not run |
| Jersey City sub-nav | Back to the globe | Native anchor; matching route module exists | Not run |
| Plant catalog | Swamp white oak | Button selects specimen; native draggable entry | Not run |
| Plant catalog | Canadian serviceberry | Button selects specimen; native draggable entry | Not run |
| Plant catalog | Virginia sweetspire | Button selects specimen; native draggable entry | Not run |
| Plant catalog | Switchgrass | Button selects specimen; native draggable entry | Not run |
| Plant catalog | Cinnamon fern | Button selects specimen; native draggable entry | Not run |
| Plant catalog | Swamp milkweed | Button selects specimen; native draggable entry | Not run |
| Plant filters | Sun | Button toggles filter; matching records recomputed | Not run |
| Plant filters | Part shade | Button toggles filter; matching records recomputed | Not run |
| Plant filters | Shade | Button toggles filter; matching records recomputed | Not run |
| Plant filters | Wet | Button toggles filter; matching records recomputed | Not run |
| Plant filters | Medium | Button toggles filter; matching records recomputed | Not run |
| Plant filters | Dry | Button toggles filter; matching records recomputed | Not run |
| Season | Spring | Updates sourced seasonal notes; no plant GLBs for a visual season change | Not run |
| Season | Summer | Updates sourced seasonal notes; no plant GLBs for a visual season change | Not run |
| Season | Autumn | Updates sourced seasonal notes; no plant GLBs for a visual season change | Not run |
| Season | Winter | Updates sourced seasonal notes; no plant GLBs for a visual season change | Not run |
| Plant stage | Wind | Disabled: no authored plant GLB/foliage animation | Fail — asset unavailable |
| Plant stage | Another individual | Disabled: no authored individual variants | Fail — asset unavailable |
| Plant bed | Site dropdown | Native select updates conditions and warnings | Not run |
| Plant bed | Drag and drop onto bed | dragstart / dragover / drop handlers; not browser tested | Not run |
| Plant bed | Place a plant by keyboard | Catalog button + empty cell activation | Not run |
| Plant bed | Move a plant by keyboard | Occupied cell + empty cell activation moves same placement | Not run |
| Plant bed | Remove a plant | Delete/Backspace or Remove selected plant button | Not run |
| Plant bed | Clear bed | Clears placements and selection | Not run |
| Plant bed | Save design | Creates review URL and download; does not publish student work | Not run |
| Stage | Rotate left | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Stage | Rotate right | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Stage | Reset | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Stage | Pause/resume | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Stage | Globe/species toggle | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Stage | Fullscreen | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Stage | Show/hide labels | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Stage | Scale toggle | Handler present; actual canvas/fullscreen behavior not exercised | Not run |
| Top strip | Every hotspot/species card | Button selects matching record; model preloads on hover/focus | Not run |
| Map layers | Green spaces | Label wraps checkbox; onCheckedChange updates layer list | Not run |
| Map layers | Waterfront | Label wraps checkbox; onCheckedChange updates layer list | Not run |
| Map layers | Reviewed sightings | Label wraps checkbox; onCheckedChange updates layer list | Not run |
| Map layers | Restoration projects | Label wraps checkbox; onCheckedChange updates layer list | Not run |
| Map layers | Flood zones | Label wraps checkbox; onCheckedChange updates layer list | Not run |
| Map layers | Combined sewer outfalls | Label wraps checkbox; onCheckedChange updates layer list | Not run |
| Map controls | Zoom in | Button changes zoom/offset; zoom bounds .7–4 | Not run |
| Map controls | Zoom out | Button changes zoom/offset; zoom bounds .7–4 | Not run |
| Map controls | Reset map | Button changes zoom/offset; zoom bounds .7–4 | Not run |
| Map controls | Map feature selector | Native select exposes parks, projects, reviewed sightings and outfalls | Not run |
| Map controls | Keyboard pan and zoom | SVG focus target: arrows pan, +/- zoom, Home resets | Not run |
| Source links | Every ↗ link | Native HTTPS href; normal click opens source interstitial; modified click preserves browser action | Not run |

## Automated checks

- TypeScript compilation: passed before production packaging.
- Native navigation/source audit: 13 route modules exist, 45 JSX anchor declarations all have href attributes, framework Link imports and watchdog files are absent, and 424 user-facing data source URL fields use HTTPS. This does not verify remote availability or browser activation.
- Plant-design checks: sharing validation, site mismatch warnings, bed boundaries, and duplicate-safe scoring pass.
- Typography/assets consistency checks pass.
- Build outcome: recorded in the publication result accompanying this report.

## Keyboard and mobile verdict

- **Whole-site keyboard operability: not confirmed.** Native links/buttons/selects, map keyboard handlers, model keyboard handlers, and bed movement/removal are present. A complete Tab/Shift+Tab/Enter/Space/Escape traversal still needs a browser.
- **44px minimum mobile targets: not fully confirmed.** CSS now enforces 44 × 44px minimums on HTML controls/links. Bed constraints are mathematically at least 44px in both axes for all three site aspect ratios. SVG marker/band hit areas, overlapping targets, clipping, and actual rendered sizes have not been measured. Equivalent map actions are available through the 44px native selector; diagram species actions also have HTML buttons.
- **Focus visibility: implemented, not visually confirmed.** A shared two-pixel focus-visible outline covers links, buttons, fields, summaries, tabindex elements, and ARIA controls; inset outlines protect canvas/grid focus from clipping.

Source URL inventory: `navigation-source-inventory.csv`. Each URL is explicitly marked untested for click-through and availability.
