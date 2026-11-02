"""Original hand-authored educational in-place orangutan motion, no mocap.
Analytic two-link posing keeps a slow lowered, fist-supported terrestrial walk.
Climb shows alternating canopy grasps without an implied visible tree.
"""
import bpy,math
from mathutils import Vector

def build_actions(rig,meshes,scene):
 for action in list(bpy.data.actions):bpy.data.actions.remove(action)
 for pb in rig.pose.bones:pb.rotation_mode='XYZ'
 def aim(name,direction):
  pb=rig.pose.bones[name];b=pb.bone
  parent_rot=pb.parent.matrix.to_quaternion() @ b.parent.matrix_local.to_quaternion().inverted() if pb.parent else None
  direction=Vector(direction)
  if parent_rot:direction=parent_rot.inverted() @ direction
  local=b.matrix_local.to_quaternion().inverted() @ direction
  pb.rotation_euler=Vector((0,1,0)).rotation_difference(local).to_euler('XYZ')
  bpy.context.view_layer.update()
 def solve(upper,lower,target,pole):
  bpy.context.view_layer.update();a=rig.pose.bones[upper].head.copy();target=Vector(target);pole=Vector(pole)
  l1=rig.data.bones[upper].length;l2=rig.data.bones[lower].length;delta=target-a;d=max(.001,min(delta.length,l1+l2-.001));axis=delta.normalized()
  along=(l1*l1-l2*l2+d*d)/(2*d);height=math.sqrt(max(0,l1*l1-along*along));bend=pole-a-axis*(pole-a).dot(axis)
  if bend.length<.001:bend=Vector((0,-1,0))
  elbow=a+axis*along+bend.normalized()*height
  aim(upper,elbow-a);aim(lower,target-elbow)
 def ground():
  bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();low=10
  for ob in meshes:
   if any(k in ob.name for k in ['foot','toe']):
    ev=ob.evaluated_get(dg);me=ev.to_mesh();low=min(low,min(v.co.z for v in me.vertices));ev.to_mesh_clear()
  rig.pose.bones['root'].location.y-=low
 def stride(phase,span,lift):
  # A long support interval and a shorter recovery replace sinusoidal skating.
  q=phase%1
  if q<.64:return (-span+2*span*q/.64,0)
  u=(q-.64)/.36;ease=u*u*(3-2*u)
  return (span-2*span*ease,lift*math.sin(math.pi*u)**2)
 for clip,duration in [('Idle',120),('Walk',120),('Climb',150),('Reach',120)]:
  action=bpy.data.actions.new(clip);rig.animation_data.action=action
  for fr in range(0,duration+1,2):
   t=fr/duration;wave=math.sin(t*math.tau);lift=math.sin(t*math.pi)**2
   for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
   rig.pose.bones['spine'].rotation_euler.x=.012*wave;rig.pose.bones['head'].rotation_euler.z=.025*wave
   bpy.context.view_layer.update()
   if clip=='Walk':
    rig.pose.bones['pelvis'].location.y=-.18
    rig.pose.bones['pelvis'].location.x=.012*wave
    rig.pose.bones['spine'].rotation_euler.x=.16;rig.pose.bones['chest'].rotation_euler.x=.08
    bpy.context.view_layer.update()
    for s,side in [(-1,'R'),(1,'L')]:
     phase=t+(0 if s==1 else .5)
     foot_y,raisefoot=stride(phase,.065,.045)
     hand_y,raisehand=stride(phase+.25,.07,.04)
     solve(f'thigh.{side}',f'shin.{side}',(s*.18,.035+foot_y,.10+raisefoot),(s*.30,-.40,.25))
     aim(f'foot.{side}',(0,-.16,-.045))
     solve(f'upper_arm.{side}',f'forearm.{side}',(s*.47,-.18+hand_y,.19+raisehand),(s*.62,-.10,.42))
     aim(f'hand.{side}',(0,-.015,-.11))
     for j in range(4):aim(f'finger{j+1}.{side}',(0,.10,.005))
    rig.pose.bones['head'].rotation_euler.x=-.18
   elif clip=='Climb':
    # Fixed virtual grip targets during support; only the recovering hand moves.
    # No tree/collision geometry is claimed by this in-place grasp study.
    rig.pose.bones['pelvis'].location.x=.022*wave
    rig.pose.bones['chest'].rotation_euler.z=.035*wave
    bpy.context.view_layer.update()
    for s,side in [(-1,'R'),(1,'L')]:
     q=(t+(0 if s==1 else .5))%1
     recover=math.sin(math.pi*(q-.64)/.36)**2 if q>.64 else 0
     solve(f'upper_arm.{side}',f'forearm.{side}',(s*(.34+.07*recover),-.22-.10*recover,1.65-.20*recover),(s*.72,-.38,1.27))
     aim(f'hand.{side}',(0,-.065,.10))
     for j in range(4):aim(f'finger{j+1}.{side}',(0,.10,-.045+.055*recover))
     rig.pose.bones[f'thigh.{side}'].rotation_euler.x=-.23+.10*s*wave
     rig.pose.bones[f'shin.{side}'].rotation_euler.x=.26+.08*s*wave
   elif clip=='Reach':
    aim('upper_arm.L',Vector((.205,-.005,-.345)).lerp(Vector((.32,-.30,.37)),lift))
    rig.pose.bones['forearm.L'].rotation_euler.x=.12*lift
    rig.pose.bones['head'].rotation_euler.z=-.14*lift
   ground()
   if clip=='Climb':
    # Ground correction moves the whole rig. Re-solve the arms afterwards so
    # the support wrist stays fixed instead of sliding with that correction.
    for s,side in [(-1,'R'),(1,'L')]:
     q=(t+(0 if s==1 else .5))%1
     recover=math.sin(math.pi*(q-.64)/.36)**2 if q>.64 else 0
     solve(f'upper_arm.{side}',f'forearm.{side}',(s*(.34+.07*recover),-.22-.10*recover,1.65-.20*recover),(s*.72,-.38,1.27))
     aim(f'hand.{side}',(0,-.065,.10))
     for j in range(4):aim(f'finger{j+1}.{side}',(0,.10,-.045+.055*recover))
   for pb in rig.pose.bones:pb.keyframe_insert(data_path='rotation_euler',frame=fr);pb.keyframe_insert(data_path='location',frame=fr)
  action.use_fake_user=True
  for fc in action.fcurves:
   fc.keyframe_points[-1].co.y=fc.keyframe_points[0].co.y
   for key in fc.keyframe_points:key.interpolation='LINEAR'
 rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(0);bpy.context.view_layer.update()
