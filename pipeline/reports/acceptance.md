# Artwork delivery update — version 22

Received `red-fox-illustration.zip` with the original SVG and PNG. Both have been imported. The SVG is unchanged except for removal of the explicitly permitted ground-shadow group; PNG is byte-identical. All 38 pre-existing illustrations still match their original SHA256 values. The registry now supplies the SVG to Jersey City, Grassland and the pending fox exhibit, with the PNG as an image-load fallback. See `fox-illustration-import.json` for hashes. Browser verification remains unavailable; the model and mockups have not been supplied.

The version 21 report below is retained as historical evidence; its missing-illustration findings are superseded by this update.

# Earthbound v21 acceptance evidence

## Verified

| Check | Result | Evidence |
|---|---|---|
| 38 original SVG files unchanged | PASS | `illustrations-before.sha256` and `illustrations-after.sha256`, compared byte-for-byte against v19/v20 source as well |
| Fox registry and route integration | PASS, source checks | Red fox entry, `?exhibit=red-fox`, Jersey City Wildlife and Grassland species-list links; 12 URL-preservation cases |
| Pending data and facts | PASS, data/source checks | Pending/null paths/empty clips, three sources, supplied size/habitat/diet/distribution/field note; no trend invented |
| Private fidelity records | PASS | 45 authoring entries; public model and exhibit JSON omit fidelity |
| Fixture | PASS | Two bones, Idle and Walk; Khronos Validator reports zero errors/warnings; Three GLTFLoader + AnimationMixer produced distinct bone poses |
| Optimizer smoke check | PASS | Meshopt output remains readable and retains both fixture clips |
| Validation rejection checks | PASS | Missing files/credits, primitive names, low vertices, out-of-range length, missing Idle and noncanonical clip rejected without changing registry |
| Resource disposal unit test | PASS | Shared geometry, materials, textures and image resources each released once |
| Existing interaction regression | PASS, unit/static checks | 135 globe drag cases, pole bounds and damping; navigation source audit |
| TypeScript and production build | PASS | `tsc --noEmit`; Sites production build and browser-asset manifest checks |
| Fixture/private data excluded from build | PASS | No animated-test, /__test__/ endpoint, diagnosticFeatures or needsReview in production output |

## Not passed / not verified

| Requested acceptance | Result | Reason |
|---|---|---|
| Fox illustration visible in both views | FAIL — missing supplied input | Upload directory contained only the prompt and fidelity Markdown, not red-fox.svg or red-fox.png. Text entry and import path are implemented; no illustration was invented. |
| Browser trigger and cold-load direct-link behavior | NOT VERIFIED | Playwright could not launch: browser download returned an invalid archive; executable absent. Routing/registry source checks passed. |
| Pending illustration-only appearance, facts/sources rendered and no animation bar | PARTIAL | Rendering branch and data implemented; missing original art and browser execution prevent visual acceptance. |
| Fixture rotate, zoom and clip controls | NOT VERIFIED in browser | Mixer/GLB checks passed; pointer/touch/keyboard tests written but could not execute. |
| Close restores position, zoom, biome, scroll | NOT VERIFIED in browser | Existing mounted-state preservation retained; URL tests passed; Playwright assertions included. |
| Zero live WebGL contexts after close | NOT VERIFIED in browser | Cleanup explicitly calls dispose and forceContextLoss; GPU context-count assertion included but not run. |
| 1440×900 and iPhone 13 screenshots | FAIL — unavailable | No browser executable, so no screenshots were captured or fabricated. Test suite is configured for both sizes. |
| Normalize supplied fox in Blender | NOT RUN | No fox model supplied; Blender was not invoked. Python syntax check passed. |
| Match five mockups | NOT VERIFIED | Mockups absent from the available upload directory. |

## Remaining inputs

- `red-fox.svg` master and optional `red-fox.png` fallback
- The five mockups, for visual comparison
- `models/source/red-fox.glb`, `.fbx` or `.blend`
- Actual creator/license metadata in `pipeline/credit.json`

No Scenario connection is required. See `pipeline/README.md` for exact model and illustration import commands. The technical validator prints the supplied hard fidelity checklist for human review; it never claims to have checked the animal's visual anatomy automatically.
