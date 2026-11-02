"""Earthbound fox adaptation. Blender 4.2; no generated stand-in geometry.

Source mesh, textures and skin weights: Alexei Ostapenko, CC BY 4.0.
Adaptation: standing bind pose, tail markings, smooth surface, in-place rig clips.
Run from repo root: blender -b -t 4 -P pipeline/blender/prepare_fox.py
"""
import bpy, math, json
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT=Path.cwd(); WORK=ROOT/'pipeline/work'; WORK.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'pipeline/assets/fox-original.glb'))
scene=bpy.context.scene;scene.render.fps=30
old=next(o for o in scene.objects if o.type=='ARMATURE')
scene.frame_set(250);bpy.context.view_layer.update()
old.animation_data_clear()
names={key:next(b.name for b in old.pose.bones if key in b.name) for key in ['Pelvis','Spine_','Spine1','Neck_','Neck1','Neck2','Head_','Queue de cheval 1_','Tail_','Tail1','Tail2','Tail3','Tail4','Tail5_']}
def bone(key):return old.pose.bones[names[key]]
# Extend the tail behind the standing animal, preserving the source weighted mesh.
tails=[bone(k) for k in ['Tail_','Tail1','Tail2','Tail3','Tail4','Tail5_']]
base={b.name:b.matrix.copy() for b in old.pose.bones}
tail_heads=[b.head.copy() for b in tails]
tip=next(b.head.copy() for b in old.pose.bones if 'Tail5_end' in b.name)
tail_heads.append(tip)
point=tail_heads[0].copy()
for i,b in enumerate(tails):
 original=tail_heads[i+1]-tail_heads[i]
 direction=Vector((.025*math.sin(i*.6),1,-.28-i*.035)).normalized()*original.length
 delta=original.rotation_difference(direction)
 m=delta.to_matrix().to_4x4()@base[b.name];m.translation=point
 b.matrix=m;bpy.context.view_layer.update();point+=direction

meshes=[o for o in scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers)]
# Preserve all semantic joint positions before baking the pose into the mesh.
positions={b.name:old.matrix_world@b.head for b in old.pose.bones}
parents={b.name:b.parent.name if b.parent else None for b in old.pose.bones}
for obj in meshes:
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
 for mod in list(obj.modifiers):
  if mod.type=='ARMATURE':bpy.ops.object.modifier_apply(modifier=mod.name)
 world=obj.matrix_world.copy();obj.parent=None;obj.matrix_world=world
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 for poly in obj.data.polygons:poly.use_smooth=True
for obj in list(bpy.data.objects):
 if obj not in meshes:bpy.data.objects.remove(obj,do_unlink=True)
for action in list(bpy.data.actions):bpy.data.actions.remove(action)

# Ground between the paws and scale the extended neutral silhouette to 1.05 m.
pts=[v.co for o in meshes for v in o.data.vertices]
lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)))
scale=1.05/(hi.y-lo.y)
foot_names=[n for n in positions if ('Finger0_' in n or 'Foot_' in n) and 'end' not in n]
center=sum((positions[n] for n in foot_names),Vector())/len(foot_names);center.z=lo.z
for o in meshes:
 for v in o.data.vertices:v.co=(v.co-center)*scale
positions={n:(p-center)*scale for n,p in positions.items()}

# Rebuild a clean anatomical rest rig with the original source skin weights.
data=bpy.data.armatures.new('Red_fox_skeleton');rig=bpy.data.objects.new('Red_fox_rig',data);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
children={n:[x for x,p in parents.items() if p==n] for n in parents}
for n,p in positions.items():
 b=data.edit_bones.new(n);b.head=p
 cs=[x for x in children[n] if (positions[x]-p).length>.001]
 b.tail=positions[cs[0]] if cs else p+Vector((0,-.025,0))
 if (b.tail-b.head).length<.001:b.tail=p+Vector((0,.025,0))
for n,p in parents.items():
 if p:data.edit_bones[n].parent=data.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
for o in meshes:
 o.parent=rig;m=o.modifiers.new('Fox skin','ARMATURE');m.object=rig
 # Subdivision smooths the source's actual surface; it does not synthesize anatomy.
 sub=o.modifiers.new('Surface refinement','SUBSURF');sub.levels=1;sub.render_levels=1
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name)

# Paint only the distal tail in the source UV atlas, retaining its fur texture.
image=next(im for im in bpy.data.images if 'base_color' in im.name)
w,h=image.size;pixels=np.array(image.pixels[:],dtype=np.float32).reshape(h,w,4)
mask=np.zeros((h,w),dtype=np.float32)
tip_start=positions[names['Tail4']].y;tip_end=max(v.co.y for o in meshes for v in o.data.vertices)
for o in meshes:
 uv=o.data.uv_layers.active.data;o.data.calc_loop_triangles()
 for tri in o.data.loop_triangles:
  vs=[o.data.vertices[i].co for i in tri.vertices]
  if max(v.y for v in vs)<tip_start:continue
  coords=np.array([[uv[i].uv.x*(w-1),uv[i].uv.y*(h-1)] for i in tri.loops])
  xmin=max(0,int(np.floor(coords[:,0].min())));xmax=min(w-1,int(np.ceil(coords[:,0].max())))
  ymin=max(0,int(np.floor(coords[:,1].min())));ymax=min(h-1,int(np.ceil(coords[:,1].max())))
  if xmax<xmin or ymax<ymin:continue
  xx,yy=np.meshgrid(np.arange(xmin,xmax+1),np.arange(ymin,ymax+1));a,b,c=coords
  den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(den)<1e-8:continue
  u=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
  v=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;t=1-u-v
  along=u*vs[0].y+v*vs[1].y+t*vs[2].y
  weight=np.clip((along-tip_start)/max(.001,(tip_end-tip_start)*.28),0,1)
  weight*=((u>=-.03)&(v>=-.03)&(t>=-.03));region=mask[ymin:ymax+1,xmin:xmax+1];np.maximum(region,weight,out=region)
lum=(pixels[:,:,:3]*np.array([.2126,.7152,.0722])).sum(axis=2)
white=np.clip(.64+lum*.38,0,.98)[:,:,None]*np.array([1,.985,.95])
pixels[:,:,:3]=pixels[:,:,:3]*(1-mask[:,:,None])+white*mask[:,:,None]
image.pixels.foreach_set(pixels.ravel());image.update();image.pack()
for mat in bpy.data.materials:
 if mat.use_nodes:
  for n in mat.node_tree.nodes:
   if n.type=='BSDF_PRINCIPLED':
    n.inputs['Metallic'].default_value=0
    # Fur must not inherit a metal response from a generic packed source map.
    for link in list(mat.node_tree.links):
     if link.to_socket==n.inputs['Metallic']:mat.node_tree.links.remove(link)

rest={b.name:b.matrix.copy() for b in rig.pose.bones}
rest_head={n:m.translation.copy() for n,m in rest.items()}
rest_tail={b.name:b.tail.copy() for b in rig.pose.bones}
rig.animation_data_create()
def named(fragment):return next(n for n in rest if fragment in n)
limbs=[]
for side in ['L','R']:
 for hind in [False,True]:
  keys=([side+' Thigh_',side+' Calf_',side+' HorseLink_',side+' Foot_'] if hind else [side+' UpperArm_',side+' Forearm_',side+' Hand_',side+' Finger0_'])
  ns=[named(k) for k in keys];limbs.append((side,hind,ns))
def aimed(n,head,tail):
 q=(rest_tail[n]-rest_head[n]).rotation_difference(tail-head)
 m=q.to_matrix().to_4x4()@rest[n];m.translation=head;return m
def solve(a,c,l1,l2,preferred):
 d=c-a;length=max(1e-6,min(d.length,l1+l2-.0001));unit=d.normalized()
 x=(length*length+l1*l1-l2*l2)/(2*length);height=math.sqrt(max(0,l1*l1-x*x))
 perp=preferred-unit*preferred.dot(unit)
 if perp.length<1e-4:perp=Vector((0,1,0))
 return a+unit*x+perp.normalized()*height
for label,frames in [('Idle',120),('Walk',48),('Trot',30),('Run',24)]:
 action=bpy.data.actions.new(label);action.use_fake_user=True;rig.animation_data.action=action
 for frame in range(frames+1):
  t=frame/frames*math.tau;moving=label!='Idle';speed={'Idle':0,'Walk':1,'Trot':1.25,'Run':1.65}[label]
  bob=(.002*math.sin(t) if not moving else .005*speed*(1-math.cos(2*t)))
  shift=Vector((0,0,bob))
  matrices={n:m.copy() for n,m in rest.items()}
  for m in matrices.values():m.translation+=shift
  if moving:
   for side,hind,ns in limbs:
    # Four-beat walk; diagonal trot; paired fore/hind gallop with slight lead offset.
    phase=({('L',True):0,('L',False):.25,('R',True):.5,('R',False):.75}[(side,hind)] if label=='Walk' else (0 if (side=='L')==hind else .5) if label=='Trot' else (.05 if side=='R' else 0)+(.45 if hind else 0))
    p=(frame/frames+phase)%1;stance=.64 if label=='Walk' else .53 if label=='Trot' else .42
    stride=.075*speed
    if p<stance:advance=stride*(1-2*p/stance);lift=0
    else:q=(p-stance)/(1-stance);advance=-stride*math.cos(q*math.pi);lift=.035*speed*math.sin(q*math.pi)
    foot=rest_head[ns[3]]+Vector((0,-advance,lift));ankle=foot+(rest_head[ns[2]]-rest_head[ns[3]])
    hip=rest_head[ns[0]]+shift;l1=(rest_head[ns[1]]-rest_head[ns[0]]).length;l2=(rest_head[ns[2]]-rest_head[ns[1]]).length
    preferred=Vector((0,-1 if hind else 1,0));knee=solve(hip,ankle,l1,l2,preferred)
    matrices[ns[0]]=aimed(ns[0],hip,knee);matrices[ns[1]]=aimed(ns[1],knee,ankle);matrices[ns[2]]=aimed(ns[2],ankle,foot)
    matrices[ns[3]]=rest[ns[3]].copy();matrices[ns[3]].translation=foot
    for child in children.get(ns[3],[]):
     matrices[child]=rest[child].copy();matrices[child].translation+=foot-rest_head[ns[3]]
  # Slow breathing/attention in Idle; soft follow-through in the head and tail.
  head=names['Head_'];angle=(.035 if not moving else .012)*math.sin(t)
  pivot=rest_head[head]+shift;q=Quaternion(Vector((0,0,1)),angle)
  for n in [head]+children.get(head,[]):
   m=q.to_matrix().to_4x4()@rest[n];m.translation=pivot+q@(rest_head[n]-rest_head[head]);matrices[n]=m
  tail_ns=[names[k] for k in ['Tail_','Tail1','Tail2','Tail3','Tail4','Tail5_']]
  for i,n in enumerate(tail_ns):
   offset=Vector((.006*(i+1)*math.sin(t-i*.35),0,.002*i*math.sin(t-i*.3)))
   h=rest_head[n]+shift+offset
   if i<len(tail_ns)-1:
    c=tail_ns[i+1];end=rest_head[c]+shift+Vector((.006*(i+2)*math.sin(t-(i+1)*.35),0,.002*(i+1)*math.sin(t-(i+1)*.3)))
   else:end=rest_tail[n]+shift+offset
   matrices[n]=aimed(n,h,end)
  # Set parent before child and bake all channels, avoiding runtime constraints.
  for b in rig.pose.bones:
   b.matrix=matrices[b.name];bpy.context.view_layer.update()
   b.rotation_mode='QUATERNION'
   for channel in ['location','rotation_quaternion','scale']:b.keyframe_insert(channel,frame=frame,group=b.name)
 for curve in action.fcurves:
  for k in curve.keyframe_points:k.interpolation='LINEAR'
rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(0);bpy.context.view_layer.update()
# Refinement slightly shrinks the surface. Measure the evaluated Idle mesh and
# apply one common rig transform so the final exported neutral length is 1.05 m.
deps=bpy.context.evaluated_depsgraph_get();evaluated=[]
for o in meshes:
 e=o.evaluated_get(deps);evaluated.extend(e.matrix_world@v.co for v in e.data.vertices)
final_scale=1.05/(max(p.y for p in evaluated)-min(p.y for p in evaluated))
rig.scale=(final_scale,)*3;rig.location.z=-min(p.z for p in evaluated)*final_scale
bpy.context.view_layer.update()
scene.unit_settings.system='METRIC'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'pipeline/assets/red-fox.blend'))
bpy.ops.export_scene.gltf(filepath=str(WORK/'red-fox.glb'),export_format='GLB',export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_cameras=False,export_lights=False,export_copyright='Fox by Alexei Ostapenko, CC BY 4.0. Earthbound adaptation: new standing rig, tail markings, Idle/Walk/Trot/Run actions. https://sketchfab.com/3d-models/fox-4e37c303f8a241aaa2511bd9f3019273')
print('EARTHBOUND: exported original CC BY fox adaptation with Idle, Walk, Trot, Run')
