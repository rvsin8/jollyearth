# Earthbound source export

- Source: Earthbound / jollyearth, Sites version 33.
- Source commit: `9e481f42c6efbbbbe7dc6966758583ba520c4c2a`.
- Original complete source tree: `9551eeba7c97674a5162291d7368c6f29c9c2fd7`.
- Export date: 2026-11-02.
- Complete owner archive: `jollyearth-source-v33-2026-11-02.zip`.

## Scope of this GitHub import

This import preserves the application code, runtime assets, data, dependency lockfile, configuration, source credits, validation reports, and other tracked files from the source commit. It adds this export note and omits only the nine large authoring/input assets listed below. It is a filtered source snapshot, not the exact original source tree. Existing GitHub history is preserved as the parent of the import commit; Sites Git history is not imported.

The transfer service rejects request bodies above 16 MiB. Base64 encoding expands binary files, so these files exceed the conservative 11.5 MiB raw-file transfer threshold. They remain intact in the complete owner ZIP named above. No application code or runtime asset was changed to accommodate this export, and no file was split.

## Assets retained in the complete ZIP

| Path | Bytes | Git blob SHA-1 |
| --- | ---: | --- |
| `pipeline/assets/bornean-orangutan/bornean-orangutan.blend` | 16899544 | `aee3c9c568ee1241e203e6da381728c01a76996d` |
| `pipeline/assets/gopher-tortoise/gopher-tortoise-input.glb` | 19146476 | `3e2c817870f1b529f24c317b7bc39af688658a14` |
| `pipeline/assets/gopher-tortoise/gopher-tortoise.blend` | 23526464 | `7bb2cf1f0933ec14af34141e0f6972568f9ae8ad` |
| `pipeline/assets/green-sea-turtle/archived-external-predecessor/green-sea-turtle.blend` | 24466001 | `15691c3c9741480cb3007b4c4f0a432523f32260` |
| `pipeline/assets/green-sea-turtle/green-sea-turtle-input.glb` | 23433452 | `b9bf7f3fc230ce66729e7135752cd035bf6cc92c` |
| `pipeline/assets/green-sea-turtle/green-sea-turtle.blend` | 26489960 | `823e642797a0fe5619cd9540aacb81dd2b918950` |
| `pipeline/assets/red-fox.blend` | 17966454 | `20271d8426cf5b381c9c011cf2adff9d2d4729a3` |
| `pipeline/assets/ring-tailed-lemur/ring-tailed-lemur.blend` | 18620564 | `ed92b54ceceb02f23559d224e9d9adeb6b8c3b61` |
| `pipeline/assets/ring-tailed-lemur/ring-tailed-lemur.raw.glb` | 15919716 | `e9b45f52cd17d5664095fbd7bc94be28634cc6db` |

## Building and regenerating models

Source inspection of the default `package.json` build chain found no dependency on the nine omitted authoring/input files. `scripts/compile-model-registry.mjs` reads the retained animal registry, `pipeline/reports/` validation reports, and the prepared models under `public/`; the remaining default compilation steps read retained content/data and build the application. A mention of `pipeline/assets/red-fox.blend` remains in the authoring provenance record `content/animals/red-fox-pilot.json`.

All prepared public/runtime models remain included. Regenerating or editing models that use an omitted master/input requires the complete ZIP and the applicable authoring tools. Existing authoring scripts and provenance records are retained so those inputs can be restored at their original paths. This export check was read-only source inspection; no new application build or model-regeneration run was performed for the import.
