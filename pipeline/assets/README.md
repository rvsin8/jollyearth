# Fox authoring assets

`fox-original.glb`: **Fox** by Alexei Ostapenko, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
[Original source](https://sketchfab.com/3d-models/fox-4e37c303f8a241aaa2511bd9f3019273) · [Creator](https://sketchfab.com/alexanders823) · [Download distributor](https://aizity.com/assets/free-3d-model-download/fox-3d-model).
The distributor's attribution is preserved in `../reports/fox-source-credits.txt`; the original GLB also carries this provenance in its asset metadata.

`red-fox.blend` is the editable Earthbound adaptation under the same CC BY 4.0 license. Changes: standing bind pose, extended tail, white distal tail marking painted into the source UV atlas, surface refinement, clean rest rig retaining source skin weights, and new illustrative in-place Idle / Walk / Trot / Run actions. No motion capture or biological gait validation is claimed.

Build with Blender 4.2:

```sh
blender -b -t 4 -P pipeline/blender/prepare_fox.py
bash pipeline/optimize.sh pipeline/work/red-fox.glb
node pipeline/validate.mjs pipeline/assets/credit.json
blender -b -t 4 -P pipeline/blender/render_fox.py
```

These are authoring assets, not browser downloads. Only the optimized files in `public/models/animals/` are loaded by the exhibit, and only after opening it. No paid generation service is used.
