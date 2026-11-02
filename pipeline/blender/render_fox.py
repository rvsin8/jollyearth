"""Render asset QA plates, not browser screenshots. Run after prepare_fox.py."""
import bpy,sys,math
from pathlib import Path
from mathutils import Vector
root=Path.cwd();bpy.ops.wm.open_mainfile(filepath=str(root/'pipeline/assets/red-fox.blend'))
scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE')
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Paper');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.82,.80,.75,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
scene.view_settings.view_transform='Standard'
for name,pos,power,size in [('Key',(2,-3,4),160,4),('Fill',(-3,-1,2),80,3),('Rim',(0,3,3),110,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.25))-o.location).to_track_quat('-Z','Y').to_euler()
# The only primitive here is a paper ground plane, never animal anatomy.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005));ground=bpy.context.object
mat=bpy.data.materials.new('Paper ground');mat.diffuse_color=(.90,.88,.83,1);ground.data.materials.append(mat)
d=bpy.data.cameras.new('Review');cam=bpy.data.objects.new('Review',d);scene.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=1.5
out=root/'pipeline/reports/fox-render';out.mkdir(parents=True,exist_ok=True)
shots=[('Idle',0,'three-quarter',(1.1,-1.5,.7)),('Idle',0,'side',(1.8,.05,.55)),('Idle',0,'rear',(-1.2,1.5,.7)),('Walk',12,'walk',(1.3,-1.2,.7)),('Run',8,'run',(1.3,-1.2,.7))]
for clip,frame,label,pos in shots:
 rig.animation_data.action=bpy.data.actions[clip];scene.frame_set(frame);cam.location=pos;cam.rotation_euler=(Vector((0,.08,.25))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(label+'.png'));bpy.ops.render.render(write_still=True)
