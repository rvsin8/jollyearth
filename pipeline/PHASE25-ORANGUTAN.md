# Phase 2.5 — focused orangutan refinement

18 October 2026. Built from original editable Earthbound v26, commit `8da5611bd86df7d7e2e0ef838ae3f6571c9d4132`. No reconstruction and no new species.

## Changes actually made

- Ran Blender 4.2 locally to rebuild the existing original female orangutan and its rig. The vendored Scenario Clay helper and its existing compatibility bridge generate the continuous facial surface; no paid API or third-party animal mesh was used.
- Reduced stray hair projection, made strand length depend on body region and tightened color variation. Refined nasal/brow contours and added subtle eyelid, cheek and forehead pigment folds to the facial atlas.
- Replaced sinusoidal walking foot paths with a 64% support / 36% recovery cycle, slowed Walk to four seconds and sampled keyframes every two frames. Idle and Reach remain four seconds.
- Replaced broad swinging Climb arms with alternating virtual grip targets. Re-solving after ground correction prevents supporting wrists from sliding with the root. Climb is five seconds. It remains an in-place grasp study: there is no tree, collision geometry or actual upward traversal.
- Reworked the mobile groom to retain half the strands using one triangle per ordinary strand. Complete cards are retained at sampled silhouette extrema. The mobile model remains below 20,000 triangles.
- Saved editable desktop/mobile `.blend` files and optimized Meshopt/WebP `.glb` exports. The existing viewer, 0.25-second cross-fades, controls, layout and cards were not changed.

## Verified

| Check | Result |
| --- | --- |
| Blender generation and export | Passed |
| Front, side, rear, three-quarter and face close-up | Visually inspected new renders |
| Four desktop clips | Inspected 16 pose samples; no sampled vertices below the ground tolerance of 5mm |
| Mobile poses | Inspected Walk, Climb and Reach samples; Idle inspected in the decoded export |
| Exact optimized GLBs | Decoded and rendered both variants with their exported material pixels |
| Virtual wrist targeting | 151 frames; maximum target error 0.792mm, maximum support-phase error 0.011mm |
| glTF validation | Zero errors and warnings on both exports |
| Animation decoding and loops | Four clips per variant; real Three.js GLTFLoader/AnimationMixer CPU tests passed |
| Camera projection | All 96 collection checks passed, including the new exports |
| Preservation | 48 of 50 tracked SVG/GLB assets unchanged; only the two orangutan GLBs changed. All other registry records and application source unchanged |

Contact measurements validate rig targeting only, not expert-reviewed biomechanics. Blender renders are not browser screenshots. CPU parse timings are not end-user load-time or GPU benchmarks.

## Still unverified

The supported browser-control capability remains unavailable in this managed environment. Desktop/iPhone browser acceptance, touchscreen pinch/drag, clipboard permissions, Back/Close/scroll restoration, browser console and frame rate have not been newly tested. No browser screenshots are claimed. The model remains stylized and its face, fur and locomotion still merit specialist review.

## Evidence

- `reports/bornean-orangutan-visual.json` binds visual review to exact export hashes.
- `reports/phase25-orangutan-views.png`: four views and facial close-up.
- `reports/bornean-orangutan-render/all-clips-contact-sheet.png`: desktop pose samples.
- `reports/phase25-orangutan-mobile-poses.png`: mobile pose samples.
- `reports/bornean-orangutan-desktop-runtime.png` and `reports/bornean-orangutan-mobile-runtime.png`: decoded export renders.
- `reports/phase25-orangutan-contact.json`, `reports/collection-checks.json`, `reports/collection-framing.json` and preservation reports contain measured results.

## Repeatable commands

Run from the repository root with Blender 4.2 and installed Node dependencies. Set `EARTHBOUND_MESH_PYTHON` to Python with NumPy and scikit-image.

```sh
blender -b -t 4 -P pipeline/blender/create_orangutan.py -- --save-only
blender -b -t 4 -P pipeline/blender/finalize_orangutan_weights.py
blender -b -t 4 -P pipeline/blender/check_orangutan_contacts.py
blender -b -t 4 -P pipeline/blender/prepare_orangutan_mobile.py
bash pipeline/optimize-collection.sh bornean-orangutan pipeline/assets/bornean-orangutan/bornean-orangutan.glb pipeline/assets/bornean-orangutan/bornean-orangutan.mobile.raw.glb
blender -b -t 4 -P pipeline/blender/review_orangutan.py
blender -b -t 4 -P pipeline/blender/review_orangutan.py -- --views
blender -b -t 4 -P pipeline/blender/review_orangutan.py -- --mobile --quick
```

After rendering, inspect current exports and update the hash-bound visual review before running `node pipeline/validate-collection.mjs bornean-orangutan`. Rebuilding invalidates the prior visual approval. Biological references remain Animal Diversity Web's *Pongo pygmaeus* account and San Diego Zoo Wildlife Alliance's orangutan account, checked 18 October 2026. No new population or conservation claims were added.
