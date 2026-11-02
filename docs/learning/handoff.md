# Earthbound learning implementation

Baseline: Site v31, commit `6f57263f583ffd4ec0188524881384936f47e8bd`.
Working branch: `feature/learning-experiences`.
Recovery tag: `recovery/pre-learning-20261101` (tag name retained).

## Delivered routes

- `/learn`: Challenges hub, linked from Tools and Jersey City Challenges.
- `/learn/detective`: unanswered start, inference feedback, retry, evidence explanation, transfer to a second archival image, reflection handoff.
- `/learn/rain`: predictions, deterministic four-condition qualitative model, previous/current results, stale-result warning, fair-comparison guidance, source dialog and journal handoff.
- `/learn/journal`: practice placeholders distinct from saved work; create, edit, delete, example dialog, image choice and local drafts.
- `/jersey-city`: Discover, with approved sunrise photograph.
- `/jersey-city/map`: existing geographic datasets, compact layer dialog, persistent session settings, park detail.
- `/jersey-city/stories?stage=0|1|2`: history, cleanup and planned habitat. URL history controls stage.

## Architecture

Lesson content: `app/learn/content.ts`. Qualitative model: `model.ts`. Versioned state contract and validation: `storage.ts`. Persistence and recovery: `provider.tsx`. Reusable radios, photo expansion, dialogs, buttons and guidance: `components.tsx`. Route components own activity behavior. Scoped CSS and local font faces avoid restyling the collection and animal viewers.

Local storage key `earthbound-learning-v1` is separate from existing site data. It retains all three activity drafts, last 20 rain runs and journal entries. Corrupt data is not overwritten automatically; explicit recovery backs it up before starting fresh. Failed writes leave text in memory and report failure. No cloud synchronization or automatic grading is implied. Map settings use session storage `earthbound-jc-map-v1` and persist only in that browser tab/session.

## Scientific model

Runoff is an ordinal teaching assumption: light+pavement = moderate; light+garden = low; heavy+pavement = high; heavy+garden = moderate. Identical inputs reproduce identical outputs. There are no calibrated volumes, percentages, local flood predictions or thresholds. The garden is assumed to have some available capacity. Soil, saturation, design and maintenance can alter real behavior. Wastewater and stormwater share combined sewers; overflow is possible when capacity is exceeded, never asserted inevitable.

Sources: EPA Combined Sewer Overflow Basics and Types of Green Infrastructure, linked in the interface and Sources page. No new species status claims.

## Verification

Passed: baseline build, TypeScript, production build, deterministic model/storage checks, navigation checks, discovery-search checks, 50 original SVG/GLB SHA256 checks, existing exhibit lifecycle suite using mocked DOM/WebGL and real Three mathematics.

Not performed: browser execution, rendered screenshots, screenshot overlays, touch, clipboard, console, GPU, accessibility tree inspection, participant usability testing. Browser origin access was denied by the environment's permission policy; no alternate browser route was used. `tests/learning.spec.mjs` and its four-width config are prepared but unexecuted.

Run after browser permission is available:

```sh
node scripts/checks/learning.mjs
node scripts/checks/navigation.mjs
node scripts/checks/discovery-search.mjs
node scripts/checks/exhibit-control-lifecycle.mjs
EARTHBOUND_TEST_URL=<authorized-preview-url> npx playwright test -c tests/learning.config.mjs
```

A successful build does not establish visual fidelity. See `design-qa.md` for reference coverage and outstanding comparisons.
