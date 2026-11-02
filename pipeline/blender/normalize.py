"""Blender 4.2+ / 4.4+: normalize a user-supplied fox, never generate animal geometry.
blender -b -P pipeline/blender/normalize.py -- models/source/red-fox.glb pipeline/work/red-fox.glb
Blender works Z-up / -Y forward; glTF exporter converts to +Y-up / +Z-forward.
Source must face Blender -Y after import (standard +Z-facing glTF). Other source
orientations can be declared as sourceForward in pipeline/source-settings.json.
"""
import bpy, sys, json, re, math
from pathlib import Path
from mathutils import Vector, Matrix
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2: raise RuntimeError('Expected input and output paths')
source,out=map(lambda x:Path(x).resolve(),args)
settings_path=Path('pipeline/source-settings.json')
settings=json.loads(settings_path.read_text()) if settings_path.exists() else {}
canonical=['Idle','Walk','Trot','Run','Sit','Pounce','Swim','Fly','Glide','Climb','Perch']
aliases={'idle':['idle','rest','breath','breathing'],'walk':['walk','walking'],'trot':['trot','trotting'],'run':['run','running','gallop'],'sit':['sit','sitting'],'pounce':['pounce','jumpattack']}
def clip_name(name):
    clean=re.sub(r'(?<=[a-z])(?=[A-Z])',' ',name).lower()
    tokens=re.findall(r'[a-z]+',clean)
    for canonical_name,words in aliases.items():
        if any(word in tokens for word in words):return canonical_name.title()
    return next((x for x in canonical if x.lower() in tokens),None)
def curves(action):
    # Legacy and layered action APIs, including all slots in Blender 4.4+.
    if hasattr(action,'fcurves'):yield from action.fcurves
    else:
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:yield from bag.fcurves
bpy.ops.wm.read_factory_settings(use_empty=True)
if source.suffix.lower()=='.blend':bpy.ops.wm.open_mainfile(filepath=str(source))
elif source.suffix.lower() in ['.glb','.gltf']:bpy.ops.import_scene.gltf(filepath=str(source))
elif source.suffix.lower()=='.fbx':bpy.ops.import_scene.fbx(filepath=str(source),automatic_bone_orientation=False)
else:raise RuntimeError('Supported input: .glb, .fbx, .blend')
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
for obj in list(bpy.data.objects):
    if obj.type in {'CAMERA','LIGHT'}:bpy.data.objects.remove(obj,do_unlink=True)
# Extract actions before rebuilding NLA. Duplicate canonical names are ambiguous: fail, do not pick silently.
chosen={};dropped=[]
for action in list(bpy.data.actions):
    name=clip_name(action.name)
    if not name:
        dropped.append(action.name);print('DROP unmapped clip:',action.name);continue
    if name in chosen:raise RuntimeError('Multiple actions map to '+name+'; resolve aliases in source')
    chosen[name]=action
if 'Idle' not in chosen:raise RuntimeError('No mapped Idle clip')
armatures=[o for o in scene.objects if o.type=='ARMATURE']
if not armatures:raise RuntimeError('A rigged fox is required')
# Apply mesh and rig object rotation/scale together, preserving local animation units.
# Nonuniform rig scale cannot safely be baked automatically: require an authoring fix.
for arm in armatures:
    if max(arm.scale)-min(arm.scale)>1e-5:raise RuntimeError('Apply nonuniform rig scale in the source before normalization')
    factor=arm.scale.x
    if abs(factor-1)>1e-7:
        for action in chosen.values():
            for curve in curves(action):
                if curve.data_path.startswith('pose.bones[') and curve.data_path.endswith('.location'):
                    for key in curve.keyframe_points:
                        key.co.y*=factor;key.handle_left.y*=factor;key.handle_right.y*=factor
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in {'ARMATURE','MESH'}:obj.select_set(True)
bpy.context.view_layer.objects.active=armatures[0]
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)

# Remove horizontal root translation only. Preserve vertical motion for breathing and Pounce.
roots=set(settings.get('rootBones',[]))
for arm in armatures:
    roots.update(b.name for b in arm.data.bones if b.parent is None)
for name,action in chosen.items():
    action.name=name
    groups={}
    for curve in curves(action):
        match=re.match(r'pose.bones\["(.+)"\].location$',curve.data_path)
        if curve.data_path=='location' or (match and match.group(1) in roots):
            groups.setdefault(curve.data_path,{})[curve.array_index]=curve
    for data_path,channels in groups.items():
        match=re.match(r'pose.bones\["(.+)"\].location$',data_path)
        arm=next((a for a in armatures if not match or match.group(1) in a.data.bones),armatures[0])
        basis=(arm.matrix_world.to_3x3() @ arm.data.bones[match.group(1)].matrix_local.to_3x3()) if match else (arm.parent.matrix_world.to_3x3() if arm.parent else Matrix.Identity(3))
        inverse=basis.inverted_safe();begin,end=map(int,action.frame_range)
        first=Vector(tuple(channels[i].evaluate(begin) if i in channels else 0 for i in range(3)))
        samples=[]
        for frame in range(begin,end+1):
            value=Vector(tuple(channels[i].evaluate(frame) if i in channels else 0 for i in range(3)))
            delta=basis@(value-first);delta.x=0;delta.y=0
            samples.append((frame,first+inverse@delta))
        # Missing axes may be needed when an imported bone's local Z points forward.
        for i in range(3):
            if i not in channels:
                if hasattr(action,'fcurves'):channels[i]=action.fcurves.new(data_path,index=i)
                else:
                    bags=[bag for layer in action.layers for strip in layer.strips for bag in strip.channelbags]
                    if not bags:raise RuntimeError('Action has no channel bag')
                    channels[i]=bags[0].fcurves.new(data_path,index=i)
            curve=channels[i]
            for key in list(curve.keyframe_points):curve.keyframe_points.remove(key)
            for frame,value in samples:
                key=curve.keyframe_points.insert(frame,value[i],options={'FAST'});key.interpolation='LINEAR'
            curve.update()
for obj in scene.objects:
    if obj.animation_data:
        for track in list(obj.animation_data.nla_tracks):obj.animation_data.nla_tracks.remove(track)
        obj.animation_data.action=None
# Bind each action to its compatible slot/armature; exporter ACTIONS mode exports named actions.
for arm in armatures:
    arm.animation_data_create()
    idle=chosen['Idle'];arm.animation_data.action=idle
    if hasattr(idle,'slots') and len(idle.slots):arm.animation_data.action_slot=idle.slots[0]
scene.frame_set(int(chosen['Idle'].frame_range[0]));bpy.context.view_layer.update()
meshes=[o for o in scene.objects if o.type=='MESH']
if not meshes:raise RuntimeError('No mesh')
# A common transform on the full hierarchy preserves skin bind transforms and all actions.
anchor=bpy.data.objects.new('Earthbound_ground_origin',None);scene.collection.objects.link(anchor)
for obj in list(scene.objects):
    if obj!=anchor and obj.parent is None:obj.parent=anchor
forward=settings.get('sourceForward','-Y')
angles={'-Y':0,'+Y':math.pi,'+X':-math.pi/2,'-X':math.pi/2}
if forward not in angles:raise RuntimeError('sourceForward must be a horizontal Blender axis: -Y, +Y, +X, -X')
anchor.rotation_euler.z=angles[forward];bpy.context.view_layer.update()
points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
length=hi.y-lo.y
if length<=0:raise RuntimeError('Invalid nose-tail extent')
registry=json.loads(Path('content/animals/registry.json').read_text());fox=next(x for x in registry if x['slug']=='red-fox')
scale=fox['fidelity']['scale']['totalLength']/length
ground_points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices if (o.matrix_world@v.co).z<=lo.z+(hi.z-lo.z)*.02]
if not ground_points:raise RuntimeError('Cannot locate ground-contact vertices')
foot_center=Vector(((min(v.x for v in ground_points)+max(v.x for v in ground_points))*.5,(min(v.y for v in ground_points)+max(v.y for v in ground_points))*.5,lo.z))
anchor.scale=(scale,)*3;anchor.location=-foot_center*scale
bpy.context.view_layer.update()
# Applying the common transform to the parent keeps rest pose and animations consistent.
# Mesh/armature local transforms are baked by the glTF exporter, not destructively
# applied to skinned meshes independently (which would corrupt inverse bind matrices).
for action in list(bpy.data.actions):
    if action not in chosen.values():bpy.data.actions.remove(action)
for collection in [bpy.data.cameras,bpy.data.lights,bpy.data.materials,bpy.data.images]:
    for data in list(collection):
        if data.users==0:collection.remove(data)
out.parent.mkdir(parents=True,exist_ok=True)
kwargs=dict(filepath=str(out),export_format='GLB',export_yup=True,export_animations=True,export_force_sampling=True,export_skins=True,export_morph=True,export_cameras=False,export_lights=False)
props=bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
if 'export_animation_mode' in props:kwargs['export_animation_mode']='ACTIONS'
if 'export_nla_strips' in props:kwargs['export_nla_strips']=False
bpy.ops.export_scene.gltf(**kwargs)
report={'input':str(source),'output':str(out),'clips':list(chosen),'dropped':dropped,'sourceForward':forward,'targetLengthM':1.05,'axisConvention':'glTF +Y up, +Z facing; Blender Z up, -Y facing','rootBones':sorted(roots),'note':'Review neutral pose, foot contact and true nose-to-tail extent; automated bbox cannot identify anatomical landmarks.'}
Path('pipeline/reports').mkdir(exist_ok=True);Path('pipeline/reports/normalize.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
