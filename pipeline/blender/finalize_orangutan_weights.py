"""Normalize game skin influences on an existing authored source and re-export."""
import bpy,sys
from pathlib import Path
R=Path.cwd();A=R/'pipeline/assets/bornean-orangutan'
bpy.ops.wm.open_mainfile(filepath=str(A/'bornean-orangutan.blend'))
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 for v in ob.data.vertices:
  groups=sorted([(g.group,g.weight) for g in v.groups],key=lambda q:q[1],reverse=True);top=groups[:4];total=sum(w for _,w in top)
  for gi,w in groups[4:]:ob.vertex_groups[gi].remove([v.index])
  for gi,w in top:ob.vertex_groups[gi].add([v.index],w/total,'REPLACE')
sys.path.insert(0,str(Path(__file__).resolve().parent))
from orangutan_animation import build_actions
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
build_actions(rig,[o for o in bpy.context.scene.objects if o.type=='MESH'],bpy.context.scene)
for ob in bpy.context.scene.objects:ob.select_set(ob.type in {'MESH','ARMATURE'})
bpy.ops.wm.save_as_mainfile(filepath=str(A/'bornean-orangutan.blend'))
bpy.ops.export_scene.gltf(filepath=str(A/'bornean-orangutan.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_apply=False,export_anim_slide_to_zero=True)
