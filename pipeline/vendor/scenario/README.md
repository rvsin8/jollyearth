# Scenario sculpting helper

Unmodified `bx_sculpt.py` from the pinned official Scenario skills repository. See `provenance.json` and `LICENSE`. This helper is MIT licensed; the separately authored animal assets use their own credits.

Blender 4.2 uses `pipeline/blender/scenario_compat.py` to mesh the helper's signed-distance field with scikit-image instead of unavailable OpenVDB. Set `EARTHBOUND_MESH_PYTHON` to a Python executable with NumPy and scikit-image installed. No network or Scenario API is required during model generation.
