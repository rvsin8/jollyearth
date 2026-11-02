# Living Collection — Phase 2 QA and polish

Date: 17 October 2026. Scope: Gopher tortoise, Green sea turtle, Ring-tailed lemur and Bornean orangutan. No new species or model replacements.

## Verification limits

The supported browser-control capability is unavailable in this execution environment. No browser, touchscreen, clipboard-permission, console, screenshot, GPU or frame-rate result is claimed. Playwright coverage has been extended but not executed. This is a partial QA pass, not complete live acceptance.

## Live and software checks

| Requirement | Result and evidence |
| --- | --- |
| Exhibit URLs load | PASS at HTTP level for all four and fox; not JavaScript execution |
| Models and illustrations available | PASS: all ten desktop/mobile GLBs and five SVGs return 200 and match source SHA256 |
| Species identity, facts and credits | PASS in deployed registry; common/scientific names, species-specific facts, model credit and license present |
| Correct model and animation data | PASS: actual GLTFLoader/AnimationMixer CPU checks, valid assets and four species-specific clips each; live rendered appearance not tested |
| Camera framing | PASS for CPU projection at nine phases per clip, desktop/mobile variants and three aspect ratios; live visual framing remains unverified |
| Rotate, zoom, reset | Existing handlers and camera bounds retained; actual browser gestures unverified |
| Clip selection and Play/pause | PASS component lifecycle test with real Three animation math and mocked browser interfaces; live buttons unverified |
| Share | Link disclosure can now be dismissed and returns focus; clipboard and real browser sharing unverified |
| Close and browser Back | Existing URL/scroll restoration retained, browser acceptance unverified |
| Failure cleanup | PASS injected error/context-loss unit checks; renderer released, no visibility restart, idempotent close |
| Console-breaking issues | Not tested in a live browser |
| Mobile touch and layout | Larger scoped controls, 16px share input and facts shortcut added; physical/device-browser testing outstanding |
| Fox and illustrations preserved | PASS SHA256 preservation reports; fox registry unchanged; four-only controlsVersion opt-in |

Evidence: `reports/phase2-live-http-before.json`, `reports/phase2-control-lifecycle.json`, `reports/phase2-preservation-before.json`, `reports/phase2-preservation-after.json`, `reports/collection-checks.json`, `reports/collection-framing.json`. HTTP request durations are diagnostic network timings, not browser load benchmarks.

## Fixes

- Explicit Play or animation selection now immediately overrides the three-second gesture pause. Selecting an animation restarts that clip.
- An obsolete one-shot clip finishing during a cross-fade cannot reset the newer selection.
- Failed viewers release GPU resources and event listeners immediately. Returning to the tab cannot restart a failed renderer.
- Mobile animation controls have 48px minimum height and more spacing. Species facts have a keyboard-focusable jump target; source links have 44px minimum height.
- The share disclosure has a Hide link control and a 16px input to avoid small-input zoom on iOS.
- Removed a stale assertion that the newly authored turtle model is a juvenile. Adult size information is unchanged.
- These changes are enabled only for the four new exhibits. No original illustration, GLB, collection card layout, fox registry entry or fox interaction timing was changed. No lighting or camera changes were made without live visual evidence.

## Conservation review

Existing statuses match the following authoritative sources; no guessed population trends were added:

- Gopher tortoise — Critically Endangered: [IUCN accepted 2026 assessment](https://nc.iucnredlist.org/redlist/content/attachment_files/Gopherus_polyphemus_Accepted_Pre-Publication_Assessment_2026-1_RLTS_T9403A3151418_en.pdf). The primary assessment was readable through indexed text; direct PDF retrieval returned 403.
- Green sea turtle — global Least Concern, 2025; regional assessments differ: [IUCN Marine Turtle Specialist Group](https://www.iucn-mtsg.org/statuses).
- Ring-tailed lemur — Endangered: [IUCN lemur assessment announcement](https://iucn.org/news/eastern-and-southern-africa/202007/almost-a-third-lemurs-now-critically-endangered-iucn-red-list).
- Bornean orangutan — Critically Endangered: [IUCN assessment announcement](https://www.iucn.org/news/secretariat/201607/whale-sharks-winghead-sharks-and-bornean-orangutans-slide-towards-extinction).

## Remaining work and weakest exhibit

Run the desktop/iPhone Playwright suite and manual touch/pinch, keyboard, clipboard, back/close/scroll and console checks in a supported browser. Inspect the actual rendered stage for framing, contrast and animation contact. Do not treat CPU checks as substitutes.

The Bornean orangutan is the weakest visual exhibit based on the saved render: the coat and facial surfaces remain simplified, and climbing/walking need better weight transfer and hand contact. Improve those before adding species. This is an assessment of saved asset renders, not a newly captured live screenshot.

## Changed application files

`app/animal-viewer.tsx`, `app/animal-exhibit.tsx`, `app/animal-exhibit.css`, `app/model-records.ts`, `content/animals/registry.json`, and compiled `public/data/models.json` / `public/data/animal-exhibits.json`. Tests and audit reports accompany the changes.
