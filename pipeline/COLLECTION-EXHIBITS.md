# Living Collection expansion

This work extends the current editable Earthbound site, baseline `ff1020346ef7df619299abc93ff7e76755e5611e`. It does not replace the collection or reconstruct an older GitHub version.

## Release status

**Unpublished.** All four original animal assets pass technical validation and sampled Blender visual review, including optimized desktop and mobile exports. They are integrated into the existing viewer in the saved source. Their finish and motion are simplified educational artwork; this is not a claim of photorealism or expert validation of biomechanics.

The required browser interaction and mobile checks could not run: this managed Sites environment has no `control-browser` capability. The Sites skill expressly disallows an alternative browser-control path in that situation. Because this request requires interaction testing before publishing, the live site remains on its existing release.

## Implemented

- Existing `AnimalViewer`, accessible dialog, original cards and illustrations retained.
- Canonical share links: `?exhibit=bornean-orangutan`, `?exhibit=green-sea-turtle`, `?exhibit=gopher-tortoise`, `?exhibit=ring-tailed-lemur`. Legacy slugs remain aliases.
- Species-specific initial clip, available clip order, camera, contact-shadow and one-shot settings in the registry. Turtle fills the frame more fully; orangutan camera padding accommodates overhead Climb poses. Fox defaults are unchanged.
- Turtle starts in Float; its swimming animation is distinct from terrestrial locomotion. Lemur Leap plays once and returns to Idle.
- On-demand desktop/mobile assets, existing drag/zoom/reset, play/pause, Share and Close architecture preserved.
- Sourced size, habitat, diet, distribution, status and field notes; existing conservation actions retained. No population trend inferred.
- Original 38 illustrations, fox illustration, both fox GLBs and editable fox Blend checked by SHA256 (42 protected files).

## Assets and licenses

| Species | Asset result | Clips | License |
| --- | --- | --- | --- |
| Red fox | Existing, unchanged | Idle, Walk, Trot, Run | Existing CC BY 4.0 attribution |
| Green sea turtle | Original Earthbound geometry, textures and 12-bone rig; reviewed | Float, Swim, Glide, Turn | CC0-1.0 |
| Gopher tortoise | Original Earthbound mesh, textures and skeletal rig; reviewed | Idle, Walk, Turn, Dig | CC0-1.0 |
| Bornean orangutan | Original continuous sculpt, textured russet groom and 38-bone rig; reviewed | Idle, Walk, Climb, Reach | Original Earthbound, CC0-1.0 |
| Ring-tailed lemur | Original continuous sculpt, short textured groom and 27-bone rig; reviewed | Idle, Walk, Leap, Climb | Original Earthbound, CC0-1.0 |

The green sea turtle is now entirely authored in Blender: custom surfaces, UV pigment/normal textures, skeleton and four marine-motion clips. The previous external specimen is archived outside `public/` and is not used by the authoring script or the viewer. No marketplace geometry is used by these four new animals.

Blender 4.2 ran locally. Official Scenario expert, sculpting, hair, rigging, shading and lighting guidance was inspected from `scenario-labs/skills` at commit `dc592af7139ffacfe8fdae7dc7efa80f4dd09be3`; the scripts adapt that guidance to Blender 4.2. Scenario MCP was not connected and no paid generation API was called. All new authored animations are educational interpretations, not motion capture or expert validation of biomechanics. These are authored anatomical models, not photogrammetric scans.

## Measured asset budgets

These values come from the final optimized GLBs. CPU parse times are local GLTFLoader measurements with image decoding stubbed; they are **not** browser load times or GPU frame rates.

| Species | Desktop bytes / triangles | Mobile bytes / triangles | CPU parse, desktop / mobile |
| --- | ---: | ---: | ---: |
| Gopher tortoise | 805,528 / 37,278 | 473,268 / 19,911 | 27 / 15 ms |
| Green sea turtle | 270,060 / 19,812 | 253,260 / 18,996 | 5 / 6 ms |
| Ring-tailed lemur | 1,878,972 / 55,047 | 561,108 / 19,411 | 20 / 8 ms |
| Bornean orangutan | 1,208,524 / 52,636 | 671,216 / 18,558 | 13 / 9 ms |

The current original turtle exports have zero glTF Validator errors or warnings. Gopher exports have zero errors and eight inherited skin-transform warnings; the common grounding transform was checked through Blender and Three.js roundtrips. Both use WebP and Meshopt. Maximum sampled optimized/source bounds deviation is 0.973 mm for the gopher and 0.879 mm for the turtle, and 1.497 mm for the lemur. The lemur and orangutan exports also have zero validator errors or warnings. Orangutan optimized/source bounds differ by at most 1.522 mm. These measurements validate export fidelity, not biological accuracy.

## Evidence and remaining gates

- `pipeline/reports/collection-checks.json`: CPU loading, all four clips for each variant, finite deformation, loop endpoints, disposal events, file sizes and geometry counts.
- `pipeline/reports/collection-preservation-before.json` and `collection-preservation-after.json`: all 42 protected files unchanged.
- `pipeline/reports/*-visual.json`: explicit asset-quality decisions, image paths, limitations.
- `pipeline/reports/green-sea-turtle-authored-poses.png` and `gopher-tortoise-motion-review.png`: sampled Blender poses, **not website screenshots**.
- `tests/exhibits.spec.mjs`: browser acceptance tests for card activation, cold links, animation controls, camera controls, Share, Close/back, restored view and context disposal. **Not run here**. The browser acceptance gate remains unmet despite the completed asset checks.
- `pipeline/reports/collection-framing.json`: CPU projection at nine phases per clip, both variants and three stage aspect ratios; catches default-camera clipping, not responsive DOM or browser rendering.
- Browser console, touch rotation, mobile layout, actual WebGL context release, network load timing and FPS remain unverified. CPU disposal checks do not prove zero live browser contexts.

## Reproduction

Run from the project root with Blender 4.2 on PATH and the repository dependencies installed. The sculpting bridge requires an external Python with NumPy and scikit-image; set `EARTHBOUND_MESH_PYTHON` to that executable. The official MIT-licensed Scenario sculpting helper is pinned under `pipeline/vendor/scenario/`, so the authoring scripts do not depend on a temporary checkout or a paid API:

```bash
blender -b -t 4 -P pipeline/blender/create_gopher.py
blender -b -t 4 -P pipeline/blender/create_green_turtle.py
blender -b -t 4 -P pipeline/blender/create_lemur.py
blender -b -t 4 -P pipeline/blender/prepare_lemur_mobile.py
blender -b -t 4 -P pipeline/blender/create_orangutan.py
blender -b -t 4 -P pipeline/blender/prepare_orangutan_mobile.py

bash pipeline/optimize-collection.sh gopher-tortoise pipeline/assets/gopher-tortoise/gopher-tortoise-input.glb
bash pipeline/optimize-collection.sh green-sea-turtle pipeline/assets/green-sea-turtle/green-sea-turtle-input.glb
bash pipeline/optimize-collection.sh bornean-orangutan pipeline/assets/bornean-orangutan/bornean-orangutan.glb pipeline/assets/bornean-orangutan/bornean-orangutan.mobile.raw.glb
bash pipeline/optimize-collection.sh ring-tailed-lemur pipeline/assets/ring-tailed-lemur/ring-tailed-lemur.raw.glb pipeline/assets/ring-tailed-lemur/ring-tailed-lemur.mobile.raw.glb

node pipeline/validate-collection.mjs gopher-tortoise
node pipeline/validate-collection.mjs green-sea-turtle
node pipeline/validate-collection.mjs ring-tailed-lemur
node pipeline/validate-collection.mjs bornean-orangutan

node scripts/compile-model-registry.mjs
node scripts/compile-animal-exhibits.mjs
node scripts/checks/animal-exhibits.mjs
node scripts/checks/collection-models.mjs
node scripts/checks/fox-model.mjs
node node_modules/typescript/bin/tsc --noEmit
```

Both optimized variants of all four animals were additionally decompressed without geometry changes and rendered in Blender using their exported material pixels. See `*-desktop-runtime.png` and `*-mobile-runtime.png`; these are not website screenshots. The first mobile lemur render exposed decimation-induced atlas corruption, which was fixed by sampling coat pigment into vertex colors before reduction and retaining the full ringed tail mesh. The corrected mobile export was re-reviewed before approval.

The validation gate never upgrades a model with a failed visual review. A review must include four named views, all requested clips and SHA256 hashes matching both current optimized exports; rebuilding an asset invalidates stale approval. In a supported preview environment, run the Playwright acceptance suite with its desktop and iPhone 13 projects before publishing.

The final orangutan review corrected shoulder skinning spikes, hand contact and a Climb loop seam. Mobile reduction preserves the complete facial atlas and extremal fingers. All four source generators and the mobile preparation scripts reproduce these fixes without manual scene edits.
