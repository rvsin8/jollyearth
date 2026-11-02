# Mobile field-guide review

Baseline: authoritative Earthbound v32; commit `055b90dfc56a31dc6d86e0eebdf689d9c836d258`. Clean checkout confirmed against Sites. Branch `feature/mobile-field-guide`; checkpoint `recovery/pre-mobile-field-guide`. Existing learning activities, Jersey City, 38 illustrated species, five interactive exhibits, globe and procedural Plant Lab were present. No project AGENTS.md was found.

## Evidence and diagnosis

Inspected all nine supplied screenshots (IMG_8445 through IMG_8453) retrieved from their existing Library identities. The visible X/Share/ellipsis are outside Earthbound's DOM components and were not changed. Screenshot evidence shows the hotspot sheet following the reader over lower homepage content; source confirms `.mobile-detail` was viewport-fixed, mounted after the pathways, with no scroll-scope condition. This is source-backed diagnosis, not live reproduction.

Plant placement gave a new placement a null active selection, hiding contextual feedback. The renderer-construction catch was followed by an effect that cleared the error and left loading pending when no scene existed. Both have been corrected.

## Implemented

- In-flow hotspot disclosure immediately below the globe: accessible expand/collapse, Escape, named current hotspot and migration-open request. It cannot float over unrelated homepage content. Selected hotspot data still comes from the existing URL/state model.
- Hotspot-linked animal illustrations and exhibit/profile links from the existing registry.
- Illustrated featured-specimen selector, common/scientific names, explicit 3D exhibit actions; compact mobile introduction and stage. Original assets and overlay state restoration unchanged.
- Plant workflow: setting first, conditions, catalog, specimen, bed; jump links; compact optional filters; scrollable catalog; 64px thumbnails; textual Selected indication and existing light/moisture preferences.
- New placements select themselves and reveal actual rule feedback. Moving is explicit, so placing another plant does not silently move the previous one. Feedback distinguishes spatial problems from conditions that moving within the same bed cannot fix. Drag placement, keyboard arrows/delete, plan/foliage modes, scores and downloads remain.
- Development-only generation timings/leaf budget. Existing season notes and sources retained. Renderer failure stops loading and shows a species illustration plus sources and retry; retry reinitializes the renderer.
- Save confirmation now depends on a successful storage write. Failure offers a review link/download rather than claiming a device save.
- Scoped spacing, focus, touch-size and safe-area styles. No scientific records, legends, model geometry or plant generation parameters changed.

## Verification results

PASS: baseline production build; TypeScript; updated production build; navigation tests; Plant Lab compatibility/legacy sharing parser/warnings/duplicate-safe scores; learning model and storage checks; discovery search and all 50 original SVG/GLB SHA256 checks; existing exhibit lifecycle tests.

PASS: new component-handler test executes disclosure toggle/Escape/content update and specimen renderer-failure effects using mocked React hooks and WebGL. Loading ends, fallback remains, and generation is skipped without a renderer. This does not simulate a real browser.

FAIL: existing procedural-plant performance gate. Maximum measured Node generation time was 285.3ms against its 200ms ceiling. Geometry validity/determinism/season/LOD assertions preceding that gate passed. Generator source was not changed. The failure is retained, not replaced with a passing rerun. These CPU times are not phone frame-rate or browser-load measurements.

Journey A: data links and disclosure/exhibit handlers checked; end-to-end live acceptance unverified.
Journey B: conditions/sharing/warning rules checked; end-to-end touch placement and scrolling unverified.

Browser access remains denied by the environment's origin permission policy. No workaround was attempted. No actual iPhone, Safari, touchscreen, GPU, browser console, viewport simulation, before/after rendered screenshot or recording is claimed. The supplied screenshots are input evidence only. `tests/mobile-guide.spec.mjs` is prepared but unexecuted. No full accessibility or visual-fidelity compliance claim.

## Reproducible remaining acceptance

With authorized browser access, run `EARTHBOUND_TEST_URL=<authorized-url> npx playwright test -c tests/mobile-guide.config.mjs`, then the existing learning and exhibit suites. At 360×800, 393×852 and 852×393, capture globe/disclosure, collection, catalog/specimen and bed feedback. Repeat on actual iPhone Safari, not just a simulated viewport. Test enlarged text, screen rotation, keyboard focus, every season, rendering failure/retry, drag/tap/pinch, browser Back, exhibit close/scroll restoration and storage denied. Confirm the final controls and sources scroll above the bottom tabs. Do not interpret screenshot height/layout or contact quality without rendering.

Most valuable next improvement: perform these two complete journeys on an actual phone, then profile and optimize procedural generation against measured device behavior. No new species or speculative scientific content is needed.
