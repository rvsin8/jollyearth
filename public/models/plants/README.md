# Plant asset contract

The published model manifest is `public/data/models.json`, served at `/data/models.json`.
Each GLB entry has slug, commonName, scientificName, kind (`plant` or `animal`), file,
creator, creatorUrl, license, licenseUrl, sourceUrl, hasAnimation, and hasLOD.
Use `/models/plants/{slug}.glb` and `/models/animals/{slug}.glb` as browser paths.

The current checkout contains only the Eastern oyster animal model. Add the actual
plant GLBs and licensed manifest records; do not add placeholder organism geometry.

When hasLOD is true, the renderer supports embedded MSFT_lod node references and
sibling groups/meshes named `Plant_LOD0`, `Plant_LOD1`, etc. The lowest numbered
level is used on the specimen stage and the highest numbered level in the bed.
Keep each level in the same local coordinates and scale. The bed uses one shared
WebGL renderer and the plant record's mature spread in real bed units.

The base manifest fields identify models, but cannot identify botanical parts.
Store this optional information in the manifest or the GLB scene extras.earthbound:

- seasonal: { foliageNodes: string[], flowerNodes: string[], fruitNodes: string[],
  colors: { spring: string, summer: string, autumn: string, winter: string },
  flowers: string[], fruit: string[], leafless: string[] }
- individuals: browser paths of two or more authored GLBs of the same species

Node names must match the GLB exactly. Colors tint existing textured materials;
flower, fruit and leaf visibility uses authored geometry. Wind gently moves only
named foliage. Individual selection uses actual authored specimens, never a
randomly distorted mesh or primitive replacement. Controls activate after the
model loads and the relevant capabilities are found. Missing capabilities remain
explicit, with seasonal field notes still available. Reduced motion suppresses
wind, idle animation and automatic rotation, not direct user rotation.
