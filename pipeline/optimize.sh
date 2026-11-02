#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
input="${1:-pipeline/work/red-fox.glb}"
[[ -f "$input" ]] || { echo "Missing normalized input: $input" >&2; exit 1; }
mkdir -p pipeline/work public/models/animals
cli=./node_modules/.bin/gltf-transform
[[ -x "$cli" ]] || { echo 'Install project dependencies first (pnpm install)' >&2; exit 1; }
# Ratios adapt to the source. Validation remains authoritative if topology cannot simplify enough.
triangles=$(node --input-type=module -e "import {inspectGLB} from './scripts/animals/inspect-glb.mjs';console.log(inspectGLB(process.argv[1]).triangles)" "$input")
for variant in desktop mobile; do
  if [[ "$variant" == desktop ]]; then budget=60000; texture=2048; target=public/models/animals/red-fox.glb; else budget=20000; texture=1024; target=public/models/animals/red-fox.mobile.glb; fi
  ratio=$(node -e 'console.log(Math.min(1,Number(process.argv[1])/Number(process.argv[2])*.98))' "$budget" "$triangles")
  "$cli" optimize "$input" "pipeline/work/$variant.glb" --compress meshopt --texture-compress webp --texture-size "$texture" --simplify-ratio "$ratio" --simplify-error 0.001
  cp "pipeline/work/$variant.glb" "$target"
done
printf '%s\n' 'Optimized candidates written. They remain pending until pipeline/validate.mjs passes.'
