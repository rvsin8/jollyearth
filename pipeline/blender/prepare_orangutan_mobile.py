"""Mobile derivative with denser one-triangle hair and complete silhouette extrema."""
import bpy,json,numpy as np,bmesh
from pathlib import Path
R=Path.cwd();A=R/'pipeline/assets/bornean-orangutan'
bpy.ops.wm.open_mainfile(filepath=str(A/'bornean-orangutan.blend'))
scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE');keep={o.name:set() for o in scene.objects if o.type=='MESH' and 'hair locks' in o.name}
for clip in ['Idle','Walk','Climb','Reach']:
 rig.animation_data.action=bpy.data.actions[clip];end=rig.animation_data.action.frame_range[1]
 for fr in [end*i/8 for i in range(9)]:
  scene.frame_set(int(fr),subframe=fr-int(fr));dg=bpy.context.evaluated_depsgraph_get()
  for name in keep:
   ob=bpy.data.objects[name];ev=ob.evaluated_get(dg);me=ev.to_mesh();co=np.array([v.co[:] for v in me.vertices]);keep[name].update(i//6 for i in np.argmin(co,axis=0).tolist()+np.argmax(co,axis=0).tolist());ev.to_mesh_clear()
rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(0)
for ob in list(scene.objects):
 if ob.type!='MESH':continue
 if ob.name in keep:
  bm=bmesh.new();bm.from_mesh(ob.data);bm.faces.ensure_lookup_table();bm.verts.ensure_lookup_table()
  verts=list(bm.verts);extrema=keep[ob.name]
  remove=[f for i,f in enumerate(list(bm.faces)) if (i//2) not in extrema]
  bmesh.ops.delete(bm,geom=remove,context='FACES_ONLY')
  for card in range(len(verts)//6):
   if card%2 or card in extrema:continue
   # Preserve skin weights on the original root and tip. Spend one triangle
   # per ordinary strand, retaining half the groom instead of one seventh.
   face=bm.faces.new([verts[card*6],verts[card*6+1],verts[card*6+4]])
   face.material_index=min(card%5,len(ob.data.materials)-1)
  bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
  bm.to_mesh(ob.data);bm.free()
 elif len(ob.data.polygons)>80 and 'craniofacial' not in ob.name and 'Curved finger finger2.' not in ob.name:
  bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Mobile anatomical reduction','DECIMATE');mod.ratio=.16
  while list(ob.modifiers).index(mod)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
  bpy.ops.object.modifier_apply(modifier=mod.name)
# Match the four-influence glTF consumer exactly after decimation.
for ob in scene.objects:
 if ob.type!='MESH':continue
 for v in ob.data.vertices:
  groups=sorted([(g.group,g.weight) for g in v.groups],key=lambda q:q[1],reverse=True);top=groups[:4];total=sum(w for _,w in top)
  for gi,w in groups[4:]:ob.vertex_groups[gi].remove([v.index])
  for gi,w in top:ob.vertex_groups[gi].add([v.index],w/total,'REPLACE')
for im in bpy.data.images:
 if im.size[0]>1024:im.scale(1024,1024);im.pack()
tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in scene.objects if o.type=='MESH')
assert tri<=20000,tri
for ob in scene.objects:ob.select_set(ob.type in {'ARMATURE','MESH'})
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(A/'bornean-orangutan.mobile.blend'))
bpy.ops.export_scene.gltf(filepath=str(A/'bornean-orangutan.mobile.raw.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_apply=False,export_anim_slide_to_zero=True)
report={'triangles':tri,'bytes':(A/'bornean-orangutan.mobile.raw.glb').stat().st_size,'texture_max_dimension':1024,'groom_cards_retained_fraction':1/2,'ordinary_groom_triangles_per_card':1,'extreme_cards_retained':{k:len(v) for k,v in keep.items()},'status':'authored derivative; optimized consumer audit pending'}
(R/'pipeline/reports/bornean-orangutan-mobile.json').write_text(json.dumps(report,indent=2));print(report)
