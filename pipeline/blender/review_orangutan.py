"""Reproducible neutral and four-sample animation evidence for authored orangutan."""
import bpy,json,math,sys
from pathlib import Path
from mathutils import Vector
R=Path.cwd();A=R/'pipeline/assets/bornean-orangutan';OUT=R/'pipeline/reports/bornean-orangutan-render'
mobile='--mobile' in sys.argv
if mobile:OUT=R/'pipeline/reports/bornean-orangutan-mobile-render';OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(A/('bornean-orangutan.mobile.blend' if mobile else 'bornean-orangutan.blend')))
scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE');meshes=[o for o in scene.objects if o.type=='MESH']
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=500;scene.render.resolution_y=500;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('QA soft studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.65,.65,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
for name,pos,power,size in [('Key',(3,-4,5),450,4),('Fill',(-3,-2,3),250,3),('Rim',(0,3,4),400,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
me=bpy.data.meshes.new('QA ground');me.from_pydata([(-20,-20,0),(20,-20,0),(20,20,0),(-20,20,0)],[],[(0,1,2,3)]);g=bpy.data.objects.new('QA ground',me);scene.collection.objects.link(g)
m=bpy.data.materials.new('QA ivory');m.diffuse_color=(.65,.63,.59,1);g.data.materials.append(m)
d=bpy.data.cameras.new('QA Camera');camera=bpy.data.objects.new('QA Camera',d);scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO';d.ortho_scale=2.4
jobs=[]
if '--views' in sys.argv:
 for label,pos in [('front',(0,-4,1.15)),('side',(4,-.1,1.2)),('rear',(2.5,4,1.8)),('three-quarter',(2.7,-4,1.8))]:
  rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(0)
  d.ortho_scale=1.9;camera.location=pos;camera.rotation_euler=(Vector((0,0,.79))-camera.location).to_track_quat('-Z','Y').to_euler()
  scene.render.filepath=str(OUT/(label+'-final.png'));bpy.ops.render.render(write_still=True)
 # A close-up is review evidence only, not an exhibit layout change.
 d.ortho_scale=.43;camera.location=(.38,-1,1.4);camera.rotation_euler=(Vector((0,-.03,1.31))-camera.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(OUT/'face-detail.png');bpy.ops.render.render(write_still=True)
elif '--quick' in sys.argv:
 jobs=[('Walk',20),('Climb',25),('Reach',50)]
else:
 for clip in ['Idle','Walk','Climb','Reach']:
  duration=bpy.data.actions[clip].frame_range[1]
  jobs += [(clip,int(duration*t)) for t in [0,.25,.5,.75]]
report=[]
for clip,fr in jobs:
 rig.animation_data.action=bpy.data.actions[clip];scene.frame_set(fr);bpy.context.view_layer.update()
 dg=bpy.context.evaluated_depsgraph_get();bounds=[];floors=[]
 for ob in meshes:
  ev=ob.evaluated_get(dg);me=ev.to_mesh();zmin=min(v.co.z for v in me.vertices);zmax=max(v.co.z for v in me.vertices);bounds.append([ob.name,zmin,zmax]);ev.to_mesh_clear()
  if any(k in ob.name for k in ['foot','toe']):floors.append(zmin)
 row={'clip':clip,'frame':fr,'lowest_mesh_z':min(b[1] for b in bounds),'barefoot_z':min(floors),'highest_mesh_z':max(b[2] for b in bounds),'below_ground':[b for b in bounds if b[1]<-.005]};report.append(row)
 if '--bounds-only' in sys.argv:continue
 camera.location=(2.7,-4,1.8);camera.rotation_euler=(Vector((0,0,.98))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(clip.lower()+'-'+str(fr)+'.png'));bpy.ops.render.render(write_still=True)
if report:(R/('pipeline/reports/bornean-orangutan-mobile-pose-bounds.json' if mobile else 'pipeline/reports/bornean-orangutan-pose-bounds.json')).write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
