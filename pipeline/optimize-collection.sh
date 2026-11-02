#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
slug="${1:?Usage: optimize-collection.sh species-slug input.glb}"
input="${2:?Supply normalized input GLB}"
case "$slug" in bornean-orangutan|green-sea-turtle|gopher-tortoise|ring-tailed-lemur) ;; *) echo 'Not a collection species' >&2; exit 1;; esac
[[ -f "$input" ]] || { echo "Missing input: $input" >&2; exit 1; }
mobile_input="${3:-$input}"
cli=./node_modules/.bin/gltf-transform
mkdir -p pipeline/work public/models/animals
triangles=$(node --input-type=module -e "import {inspectGLB} from './scripts/animals/inspect-glb.mjs';console.log(inspectGLB(process.argv[1]).triangles)" "$input")
for variant in desktop mobile; do
  if [[ "$variant" == desktop ]]; then budget=59000; texture=2048; target="public/models/animals/$slug.glb"; else budget=19000; texture=1024; target="public/models/animals/$slug.mobile.glb"; fi
  source="$input"
  [[ "$variant" == mobile ]] && source="$mobile_input"
  triangles=$(node --input-type=module -e "import {inspectGLB} from './scripts/animals/inspect-glb.mjs';console.log(inspectGLB(process.argv[1]).triangles)" "$source")
  ratio=$(node -e 'console.log(Math.min(1,Number(process.argv[1])/Number(process.argv[2])))' "$budget" "$triangles")
  "$cli" optimize "$source" "$target" --compress meshopt --texture-compress webp --texture-size "$texture" --simplify-ratio "$ratio" --simplify-error 0.001
done
printf '%s\n' 'Candidates optimized. Validation and visual review are still required.'
