"""Earthbound original Chelonia mydas. Original vertex surfaces and painted UV maps. CC0.
No external geometry, textures or rigs. NOAA photographs used only for anatomy.
Blender 4.2: --factory-startup --python-exit-code 1 -b -t 4 --python thisfile
"""
import bpy, math, os, json, shutil, bmesh, sys
import numpy as np
from mathutils import Vector, Quaternion
from math import sin,cos,pi,sqrt
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','green-sea-turtle'); os.makedirs(OUT,exist_ok=True)
REPORT=os.path.join(ROOT,'reports');os.makedirs(REPORT,exist_ok=True)
# Reexport a visually approved stable source without rebuilding geometry or rendering.
if '--export-only' in sys.argv:
 bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'green-sea-turtle.blend'))
 rigs=[ob for ob in bpy.context.scene.objects if ob.type=='ARMATURE'];assert len(rigs)==1;rig=rigs[0]
 bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
 for ob in bpy.context.scene.objects:
  if ob.type=='MESH' and any(m.type=='ARMATURE' and m.object==rig for m in ob.modifiers):ob.select_set(True)
 bpy.context.view_layer.objects.active=rig;rig.animation_data.action=None
 for tr in rig.animation_data.nla_tracks:tr.mute=False
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'green-sea-turtle-input.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_skins=True,export_normals=True,export_tangents=True,export_materials='EXPORT',export_extras=True)
 print('RESULT GREEN_TURTLE_REEXPORTED_ZERO_BASED',flush=True);sys.exit(0)

# Archive the disallowed imported predecessor. It is never opened or used by authoring.
legacy=['green-sea-turtle.blend','source.glb','CREDITS.txt','credit.json']+['texture-%d.png'%i for i in range(5)]
if os.path.isfile(os.path.join(OUT,'source.glb')):
 archive=os.path.join(OUT,'archived-external-predecessor');os.makedirs(archive,exist_ok=True)
 for name in legacy:
  p=os.path.join(OUT,name)
  if os.path.isfile(p):shutil.move(p,os.path.join(archive,name))
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
objects=[];textures=[]
def tex(name,arr,data=False):
 h,w=arr.shape[:2]; rgba=np.ones((h,w,4),np.float32)
 # Input artists' pigment values are sRGB. Convert exactly once before PNG encoding.
 rgb=np.clip(arr,0,1);rgba[:,:,:3]=rgb if data else np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
 im=bpy.data.images.new(name,width=w,height=h,alpha=True,float_buffer=True)
 im.colorspace_settings.name='Non-Color' if data else 'Linear Rec.709';im.pixels.foreach_set(rgba.ravel())
 im.filepath_raw=os.path.join(OUT,name+'.png');im.file_format='PNG';im.save()
 bpy.data.images.remove(im);im=bpy.data.images.load(os.path.join(OUT,name+'.png'));im.name=name;im.colorspace_settings.name='Non-Color' if data else 'sRGB';im.pack();textures.append(im);return im

def material(name,col,image=None,rough=.56,normal=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Roughness'].default_value=rough;m.diffuse_color=(*col,1)
 if image:
  uv=m.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap';t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=image;m.node_tree.links.new(uv.outputs['UV'],t.inputs['Vector']);m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 if normal:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=normal;m.node_tree.links.new(uv.outputs['UV'],t.inputs['Vector']);n=m.node_tree.nodes.new('ShaderNodeNormalMap');m.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],p.inputs['Normal'])
 return m
# Each shell scute receives its own irregular, non-repeating restrained sunburst pigment.
T=192;COLS=8;ROWS=5;rng=np.random.default_rng(624)
atlas=np.zeros((T*ROWS,T*COLS,3),np.float32);height=np.zeros((T*ROWS,T*COLS),np.float32)
for k in range(COLS*ROWS):
 rr=np.random.default_rng(880+k*97);y,x=np.mgrid[0:T,0:T]/(T-1);u=(x-.5)*2;v=(y-.5)*2
 a=np.arctan2(v+rr.uniform(-.12,.12),u+rr.uniform(-.12,.12));r=np.sqrt(u*u+v*v)
 broad=.014*np.sin(u*7+v*3+k)+.008*np.sin(v*12-u*5+k*.7)
 rays=np.zeros_like(r)
 for j in range(26):
  theta=rr.uniform(-pi,pi);da=np.arctan2(np.sin(a-theta),np.cos(a-theta));rays+=rr.uniform(-.095,.065)*np.exp(-(da/rr.uniform(.015,.055))**2)*np.clip((r-rr.uniform(.1,.5))*2,0,1)
 grain=rr.normal(0,.006,r.shape);shade=broad+rays+grain;warm=rr.uniform(-.045,.035)
 base=np.array([.29+warm,.265+warm*.65,.13+warm*.5]);rgb=base+shade[:,:,None]*np.array([1,.94,.65])
 row,col=divmod(k,COLS);atlas[row*T:(row+1)*T,col*T:(col+1)*T]=rgb;height[row*T:(row+1)*T,col*T:(col+1)*T]=grain*.04+.0005*np.sin(r*110)
shelltex=tex('turtle_original_carapace_albedo',atlas)
def normalmap(name,heights,strength):
 dy,dx=np.gradient(heights);n=np.stack([-dx*strength,-dy*strength,np.ones_like(dx)],-1);n/=np.linalg.norm(n,axis=-1)[:,:,None];return tex(name,n*.5+.5,True)
shellnormal=normalmap('turtle_original_carapace_normal',height,25)
# Nonuniform skin scales: pale irregular sutures, variable olive centers and quieter throat.
N=1024;y,x=np.mgrid[0:N,0:N]/N;X=x*20;Y=y*20;ix=np.floor(X);iy=np.floor(Y);D=np.full((N,N),999.);D2=D.copy();ID=D.copy()
for oy in [-1,0,1]:
 for ox in [-1,0,1]:
  cx=ix+ox;cy=iy+oy;hx=np.mod(np.sin(cx*127.1+cy*311.7)*43758.5453,1);hy=np.mod(np.sin(cx*269.5+cy*183.3)*43758.5453,1)
  d=(X-cx-.15-.7*hx)**2+(Y-cy-.15-.7*hy)**2;hit=d<D;D2=np.where(hit,D,np.minimum(D2,d));ID=np.where(hit,hx,ID);D=np.minimum(D,d)
edge=np.clip((np.sqrt(D2)-np.sqrt(D))/.065,0,1);var=.04*np.sin(x*17+y*11)+.05*(ID-.5);centers=np.stack([.24+var,.245+var,.145+var*.8],-1);cream=np.array([.48,.47,.31]);skinrgb=centers*edge[:,:,None]+cream*(1-edge[:,:,None]);skintex=tex('turtle_original_skin_albedo',skinrgb);skinnormal=normalmap('turtle_original_skin_normal',edge*.003,10)
var=.025*np.sin(x*16+np.sin(y*18))+.013*np.sin(y*45+x*21);plastrontex=tex('turtle_original_plastron_albedo',np.stack([.76+var,.735+var,.54+var*.8],-1))
shellmat=material('Olive brown sunburst carapace',(.1,.1,.04),shelltex,.50,shellnormal)
skinmat=material('Olive scales with cream sutures',(.13,.15,.07),skintex,.62,skinnormal)
plastronmat=material('Ivory cream plastron',(.65,.6,.4),plastrontex,.65)
seammat=material('Fine dark olive scute sutures',(.065,.075,.035),rough=.69)
eyemat=material('Small dark amber eyes',(.008,.005,.002),rough=.39)
beakmat=material('Pale horn beak',(.36,.37,.19),rough=.64)
mouthmat=material('Mouth and nostril recess',(.016,.019,.007),rough=.72)

def mesh(name,v,f,mat,uv=None,bone='body',weights=None):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);objects.append(ob);me.materials.append(mat)
 for p in me.polygons:p.use_smooth=True
 layer=me.uv_layers.new(name='UVMap')
 for l in me.loops:
  q=v[l.vertex_index];layer.data[l.index].uv=uv[l.vertex_index] if uv else (q[0]*4+.5,q[1]*4+.5)
 if weights:
  groups={k:ob.vertex_groups.new(name=k) for k in set(k for w in weights for k in w)}
  for i,w in enumerate(weights):
   for k,val in w.items():
    if val>0:groups[k].add([i],val,'REPLACE')
 else:ob.vertex_groups.new(name=bone).add(list(range(len(v))),1,'REPLACE')
 return ob

def shellpoint(x,y,delta=0):
 r2=min(1,x*x+y*y);z=.016+.082*max(0,1-r2)**.72
 return (x*.167*(1-.10*y),y*.232,z+delta)
# Complete continuous shell including thin underside, built from polar vertex rings.
v=[shellpoint(0,0)];uv=[(.5,.5)];f=[];n=80;nr=20
for j in range(1,nr+1):
 r=j/nr
 for i in range(n):
  a=2*pi*i/n;x0=r*cos(a);y0=r*sin(a);v.append(shellpoint(x0,y0));uv.append((x0*.48+.5,y0*.48+.5))
for i in range(n):f.append((0,1+i,1+(i+1)%n))
for j in range(nr-1):
 for i in range(n):a=1+j*n+i;b=1+j*n+(i+1)%n;f.append((a,a+n,b+n,b))
mesh('Continuous low streamlined carapace',v,f,seammat,uv)
def clip(poly,n,c):
 out=[]
 for p,q in zip(poly,poly[1:]+poly[:1]):
  dp=p[0]*n[0]+p[1]*n[1]-c;dq=q[0]*n[0]+q[1]*n[1]-c
  if dp<=0:out.append(p)
  if (dp<=0)!=(dq<=0):
   t=dp/(dp-dq);out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
 return out

def patch(name,poly,tile,mapper=shellpoint,mat=shellmat,bone='body',rings=5):
 center=np.mean(poly,axis=0);poly=np.array(poly);pts=[]
 for p,q in zip(poly,np.roll(poly,-1,axis=0)):
  for s in range(max(1,int(np.linalg.norm(p-q)*40))):pts.append(p+(q-p)*s/max(1,int(np.linalg.norm(p-q)*40)))
 pts=np.array(pts);mn=poly.min(axis=0);sz=np.maximum(.001,poly.max(axis=0)-mn);coords=[center];n=len(pts)
 for r in range(1,rings+1):coords.extend(center+(pts-center)*(r/rings)*.992)
 vv=[];uv=[];faces=[];row,col=divmod(tile,COLS)
 for p in coords:
  vv.append(mapper(*p,.00065));q=(p-mn)/sz;uv.append(((col+.02+.96*q[0])/COLS,(row+.02+.96*q[1])/ROWS))
 for i in range(n):faces.append((0,1+i,1+(i+1)%n))
 for j in range(rings-1):
  for i in range(n):a=1+j*n+i;b=1+j*n+(i+1)%n;faces.append((a,a+n,b+n,b))
 return mesh(name,vv,faces,mat,uv,bone)
seeds=[(0,y) for y in [-.76,-.41,-.02,.38,.74]]+[(side*.62,y) for side in [-1,1] for y in [-.58,-.20,.22,.59]]
for k,s in enumerate(seeds):
 poly=[(.905*cos(i*2*pi/128),.905*sin(i*2*pi/128)) for i in range(128)]
 for j,q in enumerate(seeds):
  if j!=k:poly=clip(poly,(q[0]-s[0],q[1]-s[1]),(q[0]**2+q[1]**2-s[0]**2-s[1]**2)/2)
 patch(('Vertebral ' if k<5 else 'Costal ')+str(k+1),poly,k)
for i in range(24):
 a0=2*pi*i/24;a1=2*pi*(i+1)/24;poly=[]
 for a in np.linspace(a0,a1,6):poly.append((.91*cos(a),.91*sin(a)))
 for a in np.linspace(a1,a0,6):poly.append((.998*cos(a),.998*sin(a)))
 patch('Thin marginal scute %02d'%i,poly,13+i,rings=2)
# Plastron underside is a shallow sculpted oval, not a thick cylindrical shell rim.
v=[(0,0,-.035)];f=[];uv=[(.5,.5)]
for j in range(1,13):
 r=j/12
 for i in range(72):
  a=i*2*pi/72;x0=r*cos(a);y0=r*sin(a);v.append((.159*x0*(1-.1*y0),.226*y0,-.035+.050*r**3));uv.append((.5+x0*.49,.5+y0*.49))
for i in range(72):f.append((0,1+(i+1)%72,1+i))
for j in range(11):
 for i in range(72):a=1+j*72+i;b=1+j*72+(i+1)%72;f.append((a,b,b+72,a+72))
mesh('Continuous cream plastron and bridge',v,f,plastronmat,uv)
# Longitudinal lofts use authored anatomical cross sections, never stock primitives.
def loft(name,sections,mat,bone='body',n=32,weightfun=None):
 v=[];f=[];uv=[];weights=[]
 for j,(cx,cy,cz,rx,rz) in enumerate(sections):
  for i in range(n):
   a=2*pi*i/n;v.append((cx+rx*cos(a),cy,cz+rz*sin(a)));uv.append((i/n*(.62 if 'skull' in name else 1),j/(len(sections)-1)*(.70 if 'skull' in name else 1)));weights.append(weightfun(j/(len(sections)-1)) if weightfun else {bone:1})
 for j in range(len(sections)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;f.append((a,b,b+n,a+n))
 f.append(tuple(reversed(range(n))));f.append(tuple((len(sections)-1)*n+i for i in range(n)))
 return mesh(name,v,f,mat,uv,weights=weights)
headsecs=[(0,-.170,.025,.044,.035),(0,-.200,.028,.043,.033),(0,-.225,.030,.037,.030),(0,-.245,.031,.031,.026),(0,-.267,.032,.029,.026),(0,-.285,.033,.033,.031),(0,-.303,.033,.040,.035),(0,-.321,.033,.043,.035),(0,-.338,.032,.042,.033),(0,-.353,.030,.036,.028),(0,-.368,.027,.029,.023),(0,-.379,.025,.026,.020),(0,-.383,.025,.024,.018),(0,-.386,.025,.017,.012),(0,-.387,.025,.001,.001)]
# Shorten exposed neck while retaining a broad, blunt skull.
headsecs=[(x,y+(.035*min(1,max(0,(-y-.225)/.060))),z,rx*(1.07 if y<-.285 else 1),rz) for x,y,z,rx,rz in headsecs]
def hw(t):
 h=max(0,min(1,(t-.15)/.40));return {'body':1-h,'head':h}
loft('Continuous tapered neck and blunt skull',headsecs,skinmat,n=48,weightfun=hw)
# Closed mouth crease follows a blunt non-hooked keratin beak, with small nasal recesses.
def tube(name,points,radii,mat,bone='head',n=8):
 vv=[];ff=[]
 for j,p in enumerate(points):
  tangent=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)]);tangent.normalize();ref=Vector((0,0,1));u=tangent.cross(ref).normalized();w=tangent.cross(u).normalized()
  for k in range(n):vv.append(tuple(Vector(p)+radii[j]*(cos(2*pi*k/n)*u+sin(2*pi*k/n)*w)))
 for j in range(len(points)-1):
  for k in range(n):a=j*n+k;b=j*n+(k+1)%n;ff.append((a,b,b+n,a+n))
 ff.append(tuple(reversed(range(n))));ff.append(tuple((len(points)-1)*n+k for k in range(n)))
 return mesh(name,vv,ff,mat,bone=bone)
for side in [-1,1]:
 points=[(side*.032,-.347,.016),(side*.029,-.362,.013),(side*.022,-.376,.012),(side*.011,-.383,.013),(0,-.385,.014)]
 points=[(x,y+.035,z) for x,y,z in points];tube('Subtle beak mouth seam',points,[.0007]*5,mouthmat)
 # Lid aperture ellipsoid authored from rings and compressed into head, no toy sclera.
 def eye_mesh(name,center,scale,mat):
  vv=[];ff=[];nn=24;rows=12
  for j in range(rows+1):
   t=pi*j/rows
   for k in range(nn):
    a=2*pi*k/nn;vv.append((center[0]+scale[0]*sin(t)*cos(a),center[1]+scale[1]*sin(t)*sin(a),center[2]+scale[2]*cos(t)))
  for j in range(rows):
   for k in range(nn):a=j*nn+k;b=j*nn+(k+1)%nn;ff.append((a,b,b+nn,a+nn))
  return mesh(name,vv,ff,mat,bone='head')
 eye_mesh('Embedded dark eye', (side*.0390,-.304,.047),(.0035,.0058,.0046),eyemat)
 eye_mesh('Small nostril', (side*.010,-.343,.037),(.0017,.0017,.0009),mouthmat)
 # Exactly one pair of elongate prefrontal scales; placed on the dorsal snout.
 poly=[(.002,-.337),(.013,-.338),(.027,-.321),(.024,-.306),(.003,-.305)]
 def headtop(x,y,d):
  ss=list(reversed(headsecs));rx=np.interp(y,[s[1] for s in ss],[s[3] for s in ss]);rz=np.interp(y,[s[1] for s in ss],[s[4] for s in ss]);cz=np.interp(y,[s[1] for s in ss],[s[2] for s in ss]);return (side*x,y,cz+rz*sqrt(max(.001,1-(x/rx)**2))+d)
 patch('Single prefrontal scale '+str(side),poly,38,headtop,shellmat,'head',rings=3)
 # A low skin eyelid rim occludes the bead silhouette and seats the lens in the skull.
 lid=[]
 for a in np.linspace(0,2*pi,25):
  lid.append((side*(.039+.0014*cos(a)), -.304+.0062*cos(a), .047+.0050*sin(a)))
 tube('Embedded eyelid rim '+str(side),lid,[.0012]*len(lid),skinmat,n=6)
# Four flat hydrodynamic flippers. Forelimbs are long, narrow blades with embedded shoulders.
for side in [-1,1]:
 tag='L' if side>0 else 'R'
 for fore in [True,False]:
  prefix='front' if fore else 'rear'
  if fore:sections=[(.075,-.130,.018,.030,.016),(.105,-.138,.015,.040,.022),(.139,-.143,.012,.040,.019),(.172,-.145,.008,.041,.014),(.213,-.130,.002,.044,.009),(.255,-.110,-.004,.045,.0065),(.295,-.092,-.009,.035,.0045),(.331,-.069,-.014,.024,.0033),(.357,-.044,-.017,.012,.0022),(.368,-.025,-.019,.002,.0006)]
  else:sections=[(.065,.130,.002,.025,.014),(.095,.144,-.002,.035,.017),(.130,.171,-.008,.041,.013),(.161,.197,-.011,.041,.008),(.182,.218,-.013,.034,.005),(.198,.225,-.013,.027,.003),(.208,.229,-.012,.017,.002),(.214,.230,-.012,.001,.001)]
  vv=[];ff=[];uv=[];ww=[];n=22
  for j,(x0,y0,z0,width,thick) in enumerate(sections):
   t=j/(len(sections)-1);a1=max(0,min(1,(t-.08)/.16));a2=max(0,min(1,(t-.42)/.28))
   for k in range(n):
    a=2*pi*k/n;vv.append((side*x0,y0+width*cos(a),z0+thick*sin(a)));uv.append((t*.85+.05,k/n));ww.append({'body':1-a1,prefix+'.'+tag:a1*(1-a2),prefix+'_tip.'+tag:a1*a2})
  for j in range(len(sections)-1):
   for k in range(n):a=j*n+k;b=j*n+(k+1)%n;ff.append((a,b,b+n,a+n))
  ff.append(tuple(reversed(range(n))));ff.append(tuple((len(sections)-1)*n+k for k in range(n)))
  mesh(('Long narrow pectoral blade ' if fore else 'Short steering rudder ')+tag,vv,ff,skinmat,uv,weights=ww)
  # Single short horn claw on each foreflipper's anterior margin.
  if fore:tube('Single foreflipper claw '+tag,[(side*.198,-.171,.004),(side*.206,-.181,.003),(side*.213,-.184,.001)],[.003,.002,.0003],beakmat,'front.'+tag)
loft('Short juvenile tail',[(0,.193,-.005,.013,.012),(0,.223,-.009,.012,.010),(0,.247,-.012,.008,.007),(0,.268,-.014,.0005,.0005)],skinmat,'tail',24)
# Consistent normals; deterministic triangulation. Rig sources stay separated by anatomy.
for ob in objects:
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bmesh.ops.triangulate(bm,faces=bm.faces);bm.to_mesh(ob.data);bm.free()
arm=bpy.data.armatures.new('Chelonia mydas skeleton');rig=bpy.data.objects.new('Earthbound green turtle anatomical rig',arm);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(name,h,t,parent=None):
 b=arm.edit_bones.new(name);b.head=h;b.tail=t
 if parent:b.parent=arm.edit_bones[parent]
bone('root',(0,0,-.04),(0,0,.01));bone('body',(0,.06,.025),(0,-.10,.025),'root');bone('head',(0,-.215,.03),(0,-.325,.03),'body');bone('tail',(0,.19,-.006),(0,.26,-.014),'body')
for side in [-1,1]:
 tag='L' if side>0 else 'R'
 bone('front.'+tag,(side*.116,-.14,.012),(side*.245,-.108,-.003),'body');bone('front_tip.'+tag,(side*.245,-.108,-.003),(side*.365,-.027,-.018),'front.'+tag)
 bone('rear.'+tag,(side*.10,.148,-.004),(side*.159,.2,-.011),'body');bone('rear_tip.'+tag,(side*.159,.2,-.011),(side*.18,.262,-.013),'rear.'+tag)
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
for ob in objects:
 ob.parent=rig;mod=ob.modifiers.new('Explicit anatomical weights','ARMATURE');mod.object=rig
# Join by material, preserving skinning, UV islands, named rig and editable texture images.
joined=[]
groups_by_mat=[(mat,[ob for ob in objects if ob.data.materials[0]==mat]) for mat in [shellmat,skinmat,plastronmat,seammat,eyemat,beakmat,mouthmat]]
for mat,group in groups_by_mat:
 if not group:continue
 bpy.ops.object.select_all(action='DESELECT')
 for ob in group:ob.select_set(True)
 bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();ob=bpy.context.object;ob.name=mat.name;joined.append(ob)
objects=joined
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=97
for p in rig.pose.bones:p.rotation_mode='QUATERNION'
rig.animation_data_create()
def rotate_world(name,axis,angle):
 p=rig.pose.bones[name];local=p.bone.matrix_local.to_3x3().inverted()@Vector(axis);p.rotation_quaternion=Quaternion(local,angle)
def locworld(name,vec):
 p=rig.pose.bones[name];p.location=p.bone.matrix_local.to_3x3().inverted()@Vector(vec)
for clip,duration in [('Float',121),('Swim',73),('Glide',121),('Turn',97)]:
 act=bpy.data.actions.new(clip);rig.animation_data.action=act
 for frame in range(1,duration+1,3):
  t=(frame-1)/(duration-1)*2*pi
  for p in rig.pose.bones:p.location=(0,0,0);p.rotation_quaternion=(1,0,0,0)
  locworld('body',(0,0,.002*sin(t)));rotate_world('head',(1,0,0),.018*sin(t+.3));rotate_world('tail',(0,0,1),.05*sin(t))
  if clip=='Turn':rotate_world('root',(0,0,1),.32*(1-cos(t)));rotate_world('body',(0,1,0),.07*sin(t));rotate_world('head',(0,0,1),-.055*sin(t))
  for side in [-1,1]:
   tag='L' if side>0 else 'R';amp={'Float':.045,'Swim':.48,'Glide':.025,'Turn':.23}[clip]
   if clip=='Turn' and side>0:amp*=.38
   stroke=sin(t)+(.12*sin(2*t) if clip=='Swim' else 0)
   rotate_world('front.'+tag,(0,1,0),side*amp*stroke)
   rotate_world('front_tip.'+tag,(0,1,0),side*amp*.20*sin(t-.45))
   rotate_world('rear.'+tag,(0,0,1),side*(.035*sin(t+.6)+(.13*(1-cos(t)) if clip=='Turn' else 0)))
   rotate_world('rear_tip.'+tag,(1,0,0),.035*sin(t+.5))
  for p in rig.pose.bones:p.keyframe_insert('location',frame=frame,group=p.name);p.keyframe_insert('rotation_quaternion',frame=frame,group=p.name)
 for fc in act.fcurves:
  fc.keyframe_points[-1].co.y=fc.keyframe_points[0].co.y
  for key in fc.keyframe_points:key.interpolation='LINEAR'
 tr=rig.animation_data.nla_tracks.new();tr.name=clip;tr.strips.new(clip,1,act);tr.mute=True
rig.animation_data.action=None
for p in rig.pose.bones:p.location=(0,0,0);p.rotation_quaternion=(1,0,0,0)
scene.frame_set(1)
# Neutral studio QA, with floating posture and no underwater color cast.
world=bpy.data.worlds.new('Neutral gray studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.45,.45,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
floor=mesh('QA ground',[(-200,-200,-.17),(200,-200,-.17),(200,200,-.17),(-200,200,-.17)],[(0,1,2,3)],material('QA neutral gray',(.34,.34,.34),rough=.9));objects.remove(floor)
def area(name,loc,power,size):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Soft key',(-.6,-.7,1),30,.8);area('Open fill',(.6,-.3,.5),12,.7);area('Rim',(.2,.7,.8),20,.7)
camd=bpy.data.cameras.new('QA Camera');cam=bpy.data.objects.new('QA Camera',camd);bpy.context.collection.objects.link(cam);scene.camera=cam;camd.type='ORTHO';camd.ortho_scale=.94;camd.clip_end=1000
scene.render.engine='CYCLES';scene.render.threads_mode='FIXED';scene.render.threads=4;scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
def view(loc):cam.location=loc;cam.rotation_euler=(Vector((0,-.04,.015))-cam.location).to_track_quat('-Z','Y').to_euler()
view((.72,-.90,.67))
rig['creator']='Earthbound';rig['license']='CC0-1.0';rig['scientific_name']='Chelonia mydas';rig['asset_origin']='Original vertex-authored surfaces, generated UV paintings and species rig; zero external geometry or textures'
# Export no studio helpers.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for ob in objects:ob.select_set(True)
bpy.context.view_layer.objects.active=rig
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'green-sea-turtle-input.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_skins=True,export_normals=True,export_tangents=True,export_materials='EXPORT',export_extras=True)
for tr in rig.animation_data.nla_tracks:tr.mute=True
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'green-sea-turtle.blend'))
credit={'title':'Original Earthbound green sea turtle','creator':'Earthbound','creatorUrl':'https://earthbound-field-atlas.rvsin8.chatgpt.site','sourceUrl':'https://earthbound-field-atlas.rvsin8.chatgpt.site/sources','scientificName':'Chelonia mydas','license':'CC0-1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','source':'Original custom vertex-authored anatomical mesh, UV textures, skeleton and animation. No third-party geometry, texture or rig.','biologicalReferences':['https://www.fisheries.noaa.gov/species/green-turtle','https://www.aoml.noaa.gov/general/graphics/lib/turtles.htm'],'referenceUse':'Anatomical observation only; no image incorporated into delivered textures.','archivedPredecessor':'archived-external-predecessor is provenance only and excluded from authored/exported assets.'}
credit['changes']=credit['source'];credit['animationNote']='Original Float, Swim, Glide and Turn loops; shoulder-driven marine strokes and restrained distal flex. Educational authored interpretation, not motion capture.'
with open(os.path.join(OUT,'credit.json'),'w') as f:json.dump(credit,f,indent=2)
with open(os.path.join(OUT,'CREDITS.txt'),'w') as f:f.write('Original Earthbound green sea turtle (Chelonia mydas)\nCC0-1.0. Original geometry, UV textures, rig and animations.\nNOAA photographs and anatomical diagrams used only as visual morphology references. No external model or texture is included.\n')
stats={'species':'Chelonia mydas','author':'Earthbound','license':'CC0-1.0','triangles':sum(len(o.data.polygons) for o in objects),'vertices':sum(len(o.data.vertices) for o in objects),'bones':len(arm.bones),'clips':[{ 'name':a.name,'frames':list(a.frame_range)} for a in bpy.data.actions],'textures':[{ 'name':im.name,'dimensions':list(im.size),'packed':bool(im.packed_file),'colorSpace':im.colorspace_settings.name} for im in textures],'source':'Entirely original authored geometry/textures; archived imported predecessor never opened','limitations':['Procedural hand-authored anatomical interpretation, not a scan. Skin scale pigment is generated; dorsal prefrontal pair explicitly authored.','Separate overlapping anatomical surfaces at shell/soft tissue junctions, weighted together; no continuous watertight whole-animal union.']}
with open(os.path.join(REPORT,'green-sea-turtle-authored.json'),'w') as f:json.dump(stats,f,indent=2)
print('SOURCE_STABLE',json.dumps(stats),flush=True)
for name,loc in [('three-quarter',(.72,-.9,.67)),('front',(0,-1,.22)),('side',(1,0,.18)),('rear',(0,1,.25))]:
 view(loc);scene.render.filepath=os.path.join(OUT,'green-sea-turtle-'+name+'-qa.png');bpy.ops.render.render(write_still=True);print('RENDER_READY',name,flush=True)
scene.render.resolution_x=500;scene.render.resolution_y=500;scene.cycles.samples=20
for clip in ['Float','Swim','Glide','Turn']:
 act=bpy.data.actions[clip];rig.animation_data.action=act;duration=int(act.frame_range[1])
 for i,frame in enumerate([1,1+round((duration-1)*.25),1+round((duration-1)*.5),1+round((duration-1)*.75)]):
  scene.frame_set(frame);view((.72,-.9,.67));scene.render.filepath=os.path.join(OUT,'green-sea-turtle-%s-pose-%d.png'%(clip,i));bpy.ops.render.render(write_still=True)
rig.animation_data.action=None;print('RESULT GREEN_TURTLE_COMPLETE',json.dumps(stats),flush=True)
