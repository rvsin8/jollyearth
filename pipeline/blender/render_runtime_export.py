"""Render decoded optimized GLB geometry/materials in Blender, not browser evidence.
First run node pipeline/review-runtime-export.mjs <slug> <desktop|mobile>.
"""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]
slug,variant=sys.argv[sys.argv.index('--')+1:]
cfg=next(c for c in json.loads((root/'pipeline/collection.json').read_text()) if c['exhibitSlug']==slug)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/f'pipeline/work/runtime-review/{slug}/{variant}/model.gltf'))
scene=bpy.context.scene
for rig in [o for o in scene.objects if o.type=='ARMATURE']:
 if rig.animation_data:
  for track in rig.animation_data.nla_tracks:track.mute=True
  candidates=[a for a in bpy.data.actions if a.name.startswith(cfg['clips'][0])]
  if candidates:rig.animation_data.action=candidates[0]
scene.frame_set(0);bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get();points=[]
for ob in list(scene.objects):
 if ob.type!='MESH' or not any(m.type=='ARMATURE' for m in ob.modifiers):continue
 ev=ob.evaluated_get(deps);me=ev.to_mesh();points.extend(ev.matrix_world@v.co for v in me.vertices);ev.to_mesh_clear()
lo=Vector([min(p[k] for p in points) for k in range(3)]);hi=Vector([max(p[k] for p in points) for k in range(3)]);center=(lo+hi)/2;span=max(hi-lo)
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Neutral studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.7,.7,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
scene.view_settings.view_transform='AgX'
for name,offset,power in [('Key',(-2,-3,4),180),('Fill',(3,-1,2),90),('Rim',(0,3,3),110)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power*span*span;data.shape='DISK';data.size=span*3;ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=center+Vector(offset)*span;ob.rotation_euler=(center-ob.location).to_track_quat('-Z','Y').to_euler()
# Studio floor is a helper only, not an animal component.
bpy.ops.mesh.primitive_plane_add(size=span*200,location=(0,0,lo.z-.002*span));floor=bpy.context.object
mat=bpy.data.materials.new('Paper');mat.diffuse_color=(.7,.69,.66,1);floor.data.materials.append(mat)
data=bpy.data.cameras.new('Runtime asset review');cam=bpy.data.objects.new('Runtime asset review',data);scene.collection.objects.link(cam);scene.camera=cam;data.type='ORTHO';data.ortho_scale=span*1.38;cam.location=center+Vector((1.5,-2,1))*span;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
out=root/f'pipeline/reports/{slug}-{variant}-runtime.png';scene.render.filepath=str(out);bpy.ops.render.render(write_still=True)
print('RESULT '+json.dumps({'render':str(out),'kind':'Decoded optimized export in Blender; not browser verification','bounds':[list(lo),list(hi)]}))
