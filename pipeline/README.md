# Red fox authoring and drop-in workflow

The fox pilot now includes an editable Blender asset and working Idle, Walk, Trot and Run clips. The mesh and texture are a licensed Alexei Ostapenko fox, adapted in Blender for Earthbound. See `pipeline/assets/README.md` for provenance and reproducible authoring commands. No paid API calls or stand-in organisms are used. `content/animals/registry.json` is the authoring source. Its private `fidelity` field never enters public data. Builds project model and exhibit data into `public/data/`.

## Replacing the model with another supplied asset

From the repository root, using Node 22+ and Blender 4.2+:

```sh
pnpm install
mkdir -p pipeline/work
cp pipeline/credit.example.json pipeline/credit.json
# Fill pipeline/credit.json with the actual creator, license and HTTPS links.
blender -b -P pipeline/blender/normalize.py -- models/source/red-fox.glb pipeline/work/red-fox.glb
bash pipeline/optimize.sh pipeline/work/red-fox.glb
node pipeline/validate.mjs pipeline/credit.json
pnpm build
```

Use `red-fox.fbx` or `red-fox.blend` instead of the first `.glb` for those source formats. Do not change the output `.glb` extension. Validation exits nonzero on a failure and does not mark the model ready. A successful validation sets the ready model paths, actual clips, and credits atomically; the next build publishes them. Technical validation does not replace the printed ● anatomy checklist. Review it before publishing.

Blender's native axes are Z-up and -Y-forward; glTF export converts these to Y-up and +Z-forward. A source with another facing direction must declare `sourceForward` in `pipeline/source-settings.json` (`+X`, `-X`, `+Y`, or `-Y`, measured after import). The neutral pose should have its tail extended. Bounding-box length is an automated proxy for nose-to-tail distance, not landmark recognition. Root bones are detected; nonstandard rigs can provide `rootBones` in that same settings file. Check all clips in place and feet on the ground before release.

## Supplied illustration

```sh
node pipeline/import-illustration.mjs /path/to/red-fox.svg /path/to/red-fox.png
node scripts/compile-model-registry.mjs
node scripts/compile-animal-exhibits.mjs
```

The importer copies exact bytes, prints SHA256, and never edits another illustration. The PNG is optional. No substitute fox image is generated when inputs are absent. Before import, the new fox is a text entry and the exhibit explains that its illustration has not been supplied.

## Verification

`node scripts/checks/fox-model.mjs` loads both actual optimized GLBs through Three.js, tests their skinned animation loops and resource disposal, and writes the measured results. This is CPU validation, not a browser/GPU benchmark. `pipeline/reports/fox-render/` contains actual Blender QA renders.

```sh
node tests/make-fixture.mjs
node scripts/checks/v21.mjs
pnpm exec playwright install chromium
EARTHBOUND_FIXTURE=1 pnpm dev --port 4173
# In a second terminal:
EARTHBOUND_TEST_URL=http://localhost:4173 pnpm test:exhibits
```

The `?model=fixture` hook is development-only. Its endpoint exists only with `EARTHBOUND_FIXTURE=1`. The abstract two-bone test ribbon is never in `public/`, the registry, or the production output. It tests interaction and resource handling, not fox anatomy. Tests save 1440×900 and iPhone 13 viewport screenshots and check pending, failure/retry, animation, keyboard, URL and return-state behavior. iPhone tests emulate its viewport/touch settings in Chromium; they are not physical-device Safari certification.

## Current delivery inputs

The v21 prompt and fidelity Markdown were followed by red-fox-illustration.zip, containing the SVG and PNG. Both are now imported; only the explicitly permitted SVG ground-shadow group was removed. The five mockups remain absent. The fox model, editable Blender scene, creator/license metadata and source mesh are now included. The API could not return an IUCN trend, so none is displayed.
