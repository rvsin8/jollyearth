"""Apply the approved neutral-grey coat correction to the saved original atlas."""
import bpy,numpy as np
from pathlib import Path
R=Path.cwd();P=R/'pipeline/assets/ring-tailed-lemur'
bpy.ops.wm.open_mainfile(filepath=str(P/'ring-tailed-lemur.blend'))
def neutral(c):
 c=np.asarray(c);lum=c.mean(axis=-1);t=np.clip((.53-lum)/.20,0,1);t=t*t*(3-2*t);gray=lum[...,None]*np.array([.985,1.0,1.015]);return c*(1-t[...,None]*.85)+gray*(t[...,None]*.85)
for im in bpy.data.images:
 if im.name.startswith('Continuous torso'):
  px=np.array(im.pixels[:],dtype=np.float32).reshape(im.size[1],im.size[0],4);px[:,:,:3]=neutral(px[:,:,:3]);im.pixels.foreach_set(px.ravel());im.pack()
for ob in bpy.context.scene.objects:
 if ob.type=='MESH' and ob.name.startswith('Continuous torso') and 'groomed' in ob.name:
  at=ob.data.color_attributes['FurColor'];a=np.array([c.color[:] for c in at.data]);s=np.where(a[:,:3]<=.0031308,a[:,:3]*12.92,1.055*np.power(a[:,:3],1/2.4)-.055);s=neutral(s);a[:,:3]=np.where(s<=.04045,s/12.92,((s+.055)/1.055)**2.4)
  for i,c in enumerate(at.data):c.color=a[i]
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');rig.animation_data.action=bpy.data.actions['Idle'];bpy.context.scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'ring-tailed-lemur.blend'))
for ob in bpy.context.scene.objects:ob.select_set(ob.type in {'MESH','ARMATURE'})
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'ring-tailed-lemur.raw.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_apply=False,export_anim_slide_to_zero=True)
print('LEMUR_STABLE')
