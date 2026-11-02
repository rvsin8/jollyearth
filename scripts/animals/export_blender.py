"""Export an already repaired and animated Scenario animal. Never creates anatomy.
blender --background INPUT.blend --python scripts/animals/export_blender.py -- OUTPUT.glb
Requires authored Idle, Walk, Run actions/NLA tracks and packed textures.
"""
import bpy, json, sys
from pathlib import Path
from mathutils import Vector
MAX_TRIANGLES = 50000
MAX_TEXTURE_SIZE = 2048
REQUIRED_ANIMATIONS = {"Idle", "Walk", "Run"}

def export(destination):
    # A supplied asset must already be anatomically reviewed and rigged. No procedural substitute.
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render]
    rigs = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    if not meshes or not rigs:
        raise RuntimeError('A mesh and quadruped armature are required; repair the source in Blender')
    triangles = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        if not obj.data.uv_layers:
            raise RuntimeError('Missing UV map: ' + obj.name)
        if obj.data.validate(verbose=False):
            raise RuntimeError('Invalid topology found; review the repair before exporting')
    if triangles > MAX_TRIANGLES:
        raise RuntimeError('Retopology required: triangle budget exceeded')
    images = [i for i in bpy.data.images if i.type == 'IMAGE' and i.users > 0]
    if not images:
        raise RuntimeError('Textured materials are required')
    for image in images:
        if max(image.size) > MAX_TEXTURE_SIZE:
            raise RuntimeError('Resize texture before export: ' + image.name)
    # Track names are the web clip names; sampled gait work must already exist.
    tracks = {t.name for o in rigs if o.animation_data for t in o.animation_data.nla_tracks if t.strips}
    if not REQUIRED_ANIMATIONS.issubset(tracks):
        raise RuntimeError('Bake separate Idle, Walk and Run NLA tracks before export')
    roots = [o for o in meshes + rigs if o.parent is None]
    for root in roots:
        if root.scale.x <= 0 or root.scale.y <= 0 or root.scale.z <= 0:
            raise RuntimeError('Apply mirrored/negative scale in the reviewed source first')
    bounds = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    if not bounds or max(v.z for v in bounds) <= min(v.z for v in bounds):
        raise RuntimeError('Invalid animal bounds')
    # Work on a temporary scene wrapper; keep armature, bind pose and animation relationships intact.
    wrapper = bpy.data.objects.new('EarthboundExport', None)
    bpy.context.scene.collection.objects.link(wrapper)
    transforms = [(o, o.matrix_world.copy()) for o in roots]
    try:
        for obj, world in transforms:
            obj.parent = wrapper
            obj.matrix_world = world
        wrapper.location = (-(min(v.x for v in bounds) + max(v.x for v in bounds))/2,
                            -(min(v.y for v in bounds) + max(v.y for v in bounds))/2,
                            -min(v.z for v in bounds))
        for obj in bpy.context.selected_objects:
            obj.select_set(False)
        for obj in meshes + rigs + [wrapper]:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = rigs[0]
        params = dict(filepath=str(destination), export_format='GLB', use_selection=True,
                      export_animations=True, export_skins=True, export_yup=True)
        # Introspect the installed exporter, rather than guessing a Blender version's enum.
        props = bpy.ops.export_scene.gltf.get_rna_type().properties
        for key in params:
            if key not in props:
                raise RuntimeError('Installed glTF exporter lacks ' + key)
        if 'export_animation_mode' in props:
            modes = {x.identifier for x in props['export_animation_mode'].enum_items}
            if 'NLA_TRACKS' not in modes:
                raise RuntimeError('NLA track export is unsupported by this Blender version')
            params['export_animation_mode'] = 'NLA_TRACKS'
        else:
            raise RuntimeError('Inspect this Blender exporter before attempting animation export')
        bpy.ops.export_scene.gltf(**params)
        print(json.dumps({'output':str(destination),'blender':bpy.app.version_string,'triangles':triangles,'tracks':sorted(tracks)}))
    finally:
        for obj, world in transforms:
            obj.parent = None
            obj.matrix_world = world
        bpy.data.objects.remove(wrapper, do_unlink=True)

if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    if len(args) != 1:
        raise RuntimeError('Supply a new absolute output GLB path after --')
    destination = Path(args[0]).resolve()
    if destination.exists():
        raise RuntimeError('Output already exists; use a new reviewed revision')
    destination.parent.mkdir(parents=True, exist_ok=True)
    export(destination)
