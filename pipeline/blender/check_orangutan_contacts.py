"""Measure virtual grip stability in the authored clip. Not collision simulation."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
root=Path.cwd(); asset=root/'pipeline/assets/bornean-orangutan/bornean-orangutan.blend'
bpy.ops.wm.open_mainfile(filepath=str(asset))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
rig.animation_data.action=bpy.data.actions['Climb']
duration=int(rig.animation_data.action.frame_range[1]); errors=[]; support=[]
for frame in range(duration+1):
 bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
 for sign,side in [(-1,'R'),(1,'L')]:
  q=(frame/duration+(0 if sign==1 else .5))%1
  recover=math.sin(math.pi*(q-.64)/.36)**2 if q>.64 else 0
  target=Vector((sign*(.34+.07*recover),-.22-.10*recover,1.65-.20*recover))
  actual=rig.matrix_world@rig.pose.bones['hand.'+side].head
  error=(actual-target).length;errors.append(error)
  if .03<q<.60:support.append(error)
report={'measurement':'Authored wrist against a virtual stationary support target. No tree or collision geometry is present.',
 'frames':duration+1,'maximumWristTargetErrorM':max(errors),'maximumSupportErrorM':max(support),
 'status':'passed' if max(support)<.005 and max(errors)<.012 else 'failed'}
(root/'pipeline/reports/phase25-orangutan-contact.json').write_text(json.dumps(report,indent=2)+'\n')
print(report)
assert report['status']=='passed',report
