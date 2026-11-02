"""Audit saved editable animals in Blender 4.2; does not confer visual approval.
blender --factory-startup --python-exit-code 1 -b -t 4 -P \
  pipeline/blender/audit_authored_asset.py -- <animal.blend> <report.json>
"""
import bpy, sys, json, math, hashlib
from pathlib import Path
from mathutils import Vector


def bounds(objects):
    deps = bpy.context.evaluated_depsgraph_get()
    points = []
    triangles = 0
    for obj in objects:
        evaluated = obj.evaluated_get(deps)
        mesh = evaluated.to_mesh()
        try:
            mesh.calc_loop_triangles()
            triangles += len(mesh.loop_triangles)
            points.extend(evaluated.matrix_world @ vertex.co for vertex in mesh.vertices)
        finally:
            evaluated.to_mesh_clear()
    assert points and all(math.isfinite(c) for p in points for c in p), 'Invalid evaluated geometry'
    low = [min(p[k] for p in points) for k in range(3)]
    high = [max(p[k] for p in points) for k in range(3)]
    return {'min':low, 'max':high, 'dimensions':[b-a for a,b in zip(low, high)], 'triangles':triangles}


def main():
    source, destination = map(Path, sys.argv[sys.argv.index('--')+1:])
    bpy.ops.wm.open_mainfile(filepath=str(source.resolve()))
    rigs = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    assert len(rigs) == 1, 'Expected one animal rig'
    rig = rigs[0]
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' and m.object == rig for m in o.modifiers)]
    assert meshes, 'No skinned geometry'
    errors = []
    weights = []
    bone_names = set(rig.data.bones.keys())
    for obj in meshes:
        groups = {g.index:g.name for g in obj.vertex_groups}
        sums = [sum(g.weight for g in v.groups if groups[g.group] in bone_names) for v in obj.data.vertices]
        influences = [sum(g.weight > 1e-6 for g in v.groups if groups[g.group] in bone_names) for v in obj.data.vertices]
        bad = sum(abs(s-1) > .002 for s in sums)
        if bad: errors.append(f'{obj.name}: {bad} vertices have non-unit skin weights')
        if max(influences, default=0)>4: errors.append(f'{obj.name}: more than four bone influences')
        weights.append({'mesh':obj.name,'vertices':len(sums),'maxInfluences':max(influences, default=0),'nonUnitWeights':bad})
    rig.animation_data_create()
    for track in rig.animation_data.nla_tracks: track.mute=True
    clips = []
    for action in bpy.data.actions:
        if not any(fc.data_path.startswith('pose.bones[') for fc in action.fcurves): continue
        rig.animation_data.action=action
        poses = []
        for k in range(9):
            for bone in rig.pose.bones: bone.matrix_basis.identity()
            frame = action.frame_range[0]+(action.frame_range[1]-action.frame_range[0])*k/8
            bpy.context.scene.frame_set(int(frame), subframe=frame-int(frame))
            bpy.context.view_layer.update()
            poses.append({'frame':frame,**bounds(meshes)})
        clips.append({'name':action.name,'frameRange':list(action.frame_range),'poses':poses})
    assert len(clips)>=3, 'Expected at least three skeletal animation clips'
    report = {'source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'blender':bpy.app.version_string,'boneCount':len(rig.data.bones),'skinWeights':weights,'clips':clips,'errors':errors,'limitations':'Numeric skin and sampled bounds audit only. Ground contact, self-intersection, anatomical fidelity and motion quality require visual review.'}
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps(report,indent=2)+'\n')
    print('RESULT '+json.dumps({'report':str(destination),'clips':[c['name'] for c in clips],'errors':errors}))
    assert not errors, 'Skin audit failed'

if __name__ == '__main__': main()
