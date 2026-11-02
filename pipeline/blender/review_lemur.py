"""Deterministic review views of original ring-tailed lemur; not included in GLBs."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
R=Path.cwd();OUT=R/'pipeline/assets/ring-tailed-lemur';D=R/'pipeline/reports/ring-tailed-lemur-render'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'ring-tailed-lemur.blend'));scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE')
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Review paper world');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.85,.83,.79,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55;scene.view_settings.view_transform='Standard'
for name,pos,power,size in [('Key',(2,-3,4),130,3),('Fill',(-3,-1,2),80,3),('Rim',(0,3,3),100,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.002));ground=bpy.context.object;m=bpy.data.materials.new('Review paper');m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.90,.88,.83,1);ground.data.materials.append(m)
d=bpy.data.cameras.new('Review');cam=bpy.data.objects.new('Review',d);scene.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=1.12
views=[('three-quarter',(1.3,-1.7,.85)),('side',(1.8,0,.7)),('front',(0,-2,.65)),('rear',(0,2,.65))]
rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(0)
for name,pos in ([] if '--poses-only' in sys.argv else views):
 cam.location=pos;cam.rotation_euler=(Vector((0,.05,.43))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(D/(name+'-refined.png'));bpy.ops.render.render(write_still=True)
if '--views-only' not in sys.argv:
 scene.render.resolution_x=500;scene.render.resolution_y=500;d.ortho_scale=1.30
 cam.location=(1.3,-1.7,.85);cam.rotation_euler=(Vector((0,.05,.43))-cam.location).to_track_quat('-Z','Y').to_euler()
 for clip,duration in [('Idle',96),('Walk',48),('Leap',48),('Climb',64)]:
  if '--clip' in sys.argv and clip!=sys.argv[sys.argv.index('--clip')+1]:continue
  d.ortho_scale=1.50 if clip=='Climb' else 1.30
  rig.animation_data.action=bpy.data.actions[clip]
  for f in [0,int(duration*.25),int(duration*.5),int(duration*.75)]:
   scene.frame_set(f);scene.render.filepath=str(D/(clip.lower()+'-pose-'+str(f)+'.png'));bpy.ops.render.render(write_still=True)
print('LEMUR_REVIEW_COMPLETE')
