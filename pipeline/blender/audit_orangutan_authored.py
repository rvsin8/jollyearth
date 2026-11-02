"""Source-side checks independent of root's optimized consumer audit."""
import bpy,json
from pathlib import Path
R=Path.cwd();A=R/'pipeline/assets/bornean-orangutan';report={}
for lod,file in [('desktop','bornean-orangutan.blend'),('mobile','bornean-orangutan.mobile.blend')]:
 bpy.ops.wm.open_mainfile(filepath=str(A/file));scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE');meshes=[o for o in scene.objects if o.type=='MESH']
 zero=0;over4=0;dev=0
 for ob in meshes:
  for v in ob.data.vertices:
   w=[g.weight for g in v.groups if g.weight>1e-7];zero+=not w;over4+=len(w)>4;dev=max(dev,abs(1-sum(w)))
 clips={}
 for name in ['Idle','Walk','Climb','Reach']:
  ac=bpy.data.actions[name];seams=[abs(fc.evaluate(ac.frame_range[0])-fc.evaluate(ac.frame_range[1])) for fc in ac.fcurves];clips[name]={'frames':list(ac.frame_range),'duration_seconds':(ac.frame_range[1]-ac.frame_range[0])/30,'max_channel_loop_seam':max(seams)}
 report[lod]={'triangles':sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in meshes),'bones':len(rig.data.bones),'mesh_objects':len(meshes),'unweighted_vertices':zero,'vertices_over4weights':over4,'max_weight_sum_error':dev,'texture_max_dimension':max(max(im.size) for im in bpy.data.images),'clips':clips}
(R/'pipeline/reports/bornean-orangutan-authored-audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
