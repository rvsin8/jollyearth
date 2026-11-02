# Living Collection — museum discovery upgrade

Built from original Earthbound v27 source `8677bc4eac0a3a9861793446d46219a4fa0cdc84`. The current Site, audience and source repository are retained.

## Delivered

- A new `/collection` destination: editorial introduction, featured specimen selector, five ready interactive exhibits, searchable index of 38 existing illustrated animals, 3D/all filters and profile links. Counts come from the registry. No organism, photograph or illustration was generated or replaced.
- Global atlas search from desktop/mobile navigation and the keyboard (`Command/Ctrl K`, or `/` outside text fields). It searches common/scientific names and all 36 places, handles accents and missing model records, and opens the existing full-screen species exhibit. Place results use real URLs. Escape closes the accessible dialog. Search does not activate over an existing exhibit or welcome dialog.
- Updated welcome masthead and a direct collection entry, with a multi-link focus trap and Escape-to-enter behavior. The same globe remains in place; there is no second renderer or replacement hero image.
- Three editorial pathways below the globe connect the collection, Jersey City and Plant lab. Shared navigation includes the collection; mobile More is derived from remaining routes so no section disappears or repeats.
- The four newer exhibits gain Three-quarter / Front / Side camera presets, 0.5× / 1× / 1.5× playback and expandable mouse/touch/keyboard instructions. Controls use existing species-specific framing and 44px or larger target declarations. Reduced motion freezes animation and disables speed controls.
- Original fox rendering/controls remain on the previous path. All 50 SVG/GLB asset hashes match v27. No biological data, conservation assessments, models, rigging, attribution or licenses changed.

## Verification

- TypeScript and source diff checks passed.
- Search tests execute the actual pure search functions against the actual species/hotspot files, covering scientific/common name, case/accent, category, limited results vs totals, no match, null models, all five canonical share links and asset preservation.
- Thirteen component lifecycle checks passed. New checks use real Three camera/mixer math for preset position, default reset, speed ratios, reduced motion and exclusion from fox. Existing failure/disposal checks remain covered. DOM/WebGL interfaces are mocked.
- Existing animal-registry checks passed: 44 records and canonical URL behavior retained.

A final independent source review identified and repaired the search-overlay/exhibit z-index conflict, modified-click propagation from welcome links, and short-height welcome layout risk. These were source-derived findings, not browser observations.

## Browser limitation

The supported managed preview initially failed because its checkout-local execution profile was absent. Configuring the managed profile repaired preview startup at the daemon-provided URL. Cloud Browser then explicitly rejected that origin under a saved user permission policy. No alternate browser, raw CDP, renderer or permission workaround was attempted. Preview was stopped afterwards.

Actual browser rendering, touchscreen gestures, clipboard permission, focus restoration, Back/Close, GPU performance and screenshots remain unverified. Source CSS target sizes and semantic dialog controls are implementation evidence, not device acceptance results. No new browser screenshots or frame-rate claims are supplied.

## Evidence and scope

`reports/living-collection-discovery-checks.json` and `reports/phase2-control-lifecycle.json` contain executable check results. Existing v27 model and visual evidence remains in the prior reports; it is not presented as fresh browser evidence. This release is an interface/discovery improvement and does not claim the site is fully browser-certified or anatomically expert-validated.
