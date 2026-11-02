"""Original Earthbound anatomical artist study, CC0. Custom lofted surfaces, not primitive solids.
Blender -b -t 4 -P pipeline/blender/create_lemur.py
Append -- --mobile-only to derive a mobile LOD from the saved full .blend.
"""
import bpy, math, random, json
from mathutils import Vector
from pathlib import Path
import bmesh,sys, numpy as np
sys.path.extend([str(Path(__file__).resolve().parent),str(Path(__file__).resolve().parents[1]/'vendor/scenario')])
import bx_sculpt as S
from scenario_compat import mesh_clay
from prepare_lemur_mobile import build_mobile
if '--mobile-only' in sys.argv:
 build_mobile();raise SystemExit
R=Path.cwd(); OUT=R/'pipeline/assets/ring-tailed-lemur'; OUT.mkdir(parents=True,exist_ok=True)
random.seed(27011); bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.render.fps=24
# A UV texture gives each coat region fine, longitudinal natural variation.
def material(name,color,fur=True):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.83
 if fur:
  size=256;im=bpy.data.images.new(name+' coat texture',width=size,height=size);px=[]
  for j in range(size):
   for i in range(size):
    a=.92+random.random()*.13+.008*math.sin(i*1.4+j*.08);px.extend([min(1,c*a) for c in color]+[1])
  im.pixels=px;im.pack();n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;m.node_tree.links.new(n.outputs['Color'],p.inputs['Base Color'])
 return m
grey=material('Warm grey back',(0.36,.34,.32));white=material('Ivory underside and face',(.86,.84,.78));black=material('Charcoal mask and tail rings',(.025,.023,.021));dark=material('Bare graphite hands',(.085,.075,.068));amber=material('Amber iris',(.42,.20,.035),False);pupil=material('Dark pupils',(.007,.005,.003),False);nosemat=material('Black nose',(.025,.018,.015),False);nosemat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.35
meshes=[];bone_defs={}
def bone(name,head,tail,parent='Root'):
 bone_defs[name]=(Vector(head),Vector(tail),parent)
def mesh(name,vs,fs,mat,weights=None,uvs=None):
 me=bpy.data.meshes.new(name+' surface');me.from_pydata(vs,[],fs);me.update();ob=bpy.data.objects.new(name,me);scene.collection.objects.link(ob);ob.data.materials.append(mat)
 for p in me.polygons:p.use_smooth=True
 uv=me.uv_layers.new(name='Coat UV')
 for p in me.polygons:
  for k in p.loop_indices:
   v=me.loops[k].vertex_index;uv.data[k].uv=uvs[v] if uvs else (vs[v][0]*3,vs[v][2]*3)
 if weights:
  for b in set(k for d in weights for k in d):
   g=ob.vertex_groups.new(name=b)
   for i,d in enumerate(weights):
    if b in d:g.add([i],d[b],'REPLACE')
 meshes.append(ob);return ob
# Each ring follows a hand-authored anatomical center line and changing cross-section.
def loft(name,sections,mat,b='Root',sides=24,coat=False,ringmats=None):
 vs=[];uv=[];ws=[];frames=[]
 for k,(co,rx,ry) in enumerate(sections):
  co=Vector(co);t=Vector(sections[min(k+1,len(sections)-1)][0])-Vector(sections[max(0,k-1)][0]);t.normalize();u=t.cross(Vector((0,0,1)))
  if u.length<.1:u=t.cross(Vector((0,1,0)))
  u.normalize();v=t.cross(u).normalized();frames.append((co,u,v,rx,ry))
  for j in range(sides):
   a=j*2*math.pi/sides;p=co+u*(math.cos(a)*rx)+v*(math.sin(a)*ry);vs.append(tuple(p));uv.append((j/sides,k/(len(sections)-1)));ws.append({b(k/(len(sections)-1)) if callable(b) else b:1})
 fs=[]
 for k in range(len(sections)-1):
  for j in range(sides):fs.append((k*sides+j,k*sides+(j+1)%sides,(k+1)*sides+(j+1)%sides,(k+1)*sides+j))
 fs.extend([tuple(reversed(tuple(range(sides)))),tuple((len(sections)-1)*sides+j for j in range(sides))]);ob=mesh(name,vs,fs,mat,ws,uv)
 if ringmats:
  ob.data.materials.clear()
  for m in ringmats:ob.data.materials.append(m)
  for p in ob.data.polygons:p.material_index=min(len(ringmats)-1,int(p.index/sides)%len(ringmats))
 if coat:
  # Sparse tapered fur ribbons, following the coat; no geometry primitives.
  fvs=[];ffs=[];fws=[]
  for n in range(7500 if name=='Torso' else 1200):
   k=random.randrange(0,len(sections)-1);f=random.random();co,u,v,rx,ry=frames[k];co2,u2,v2,rx2,ry2=frames[k+1];co=co.lerp(co2,f);u=u.lerp(u2,f).normalized();v=v.lerp(v2,f).normalized();rx=rx*(1-f)+rx2*f;ry=ry*(1-f)+ry2*f;a=random.uniform(0,math.tau);normal=u*math.cos(a)+v*math.sin(a);p=co+u*(math.cos(a)*rx)+v*(math.sin(a)*ry);tip=p+normal*.011+Vector((0,.009,-.003));width=.00065;idx=len(fvs);fvs.extend([tuple(p-u*width),tuple(p+u*width),tuple(tip)]);ffs.append((idx,idx+1,idx+2));fws.extend([ws[k*sides]]*3)
  mesh(name+' fine guard hairs',fvs,ffs,mat,fws)
 return ob
# Proportions: head-body 0.55m, tail 0.65m; head 0.11m; slim forearms,
# deeper haunches. Original continuous SDF surface with explicit muzzle and sockets.
bone('Root',(0,0,.24),(0,0,.34),None)
bone('Neck',(0,-.19,.31),(0,-.27,.39));bone('Head',(0,-.27,.39),(0,-.37,.40),'Neck')
print('STAGE body',flush=True)
clay=S.Clay((-.15,-.31,.02),(.15,.29,.44),.0021)
clay.add(S.sd_ellipsoid((0,-.12,.30),(.071,.135,.082)))
clay.add(S.sd_ellipsoid((0,.075,.285),(.065,.15,.075)),blend=.045)
clay.add(S.sd_ellipsoid((0,.160,.285),(.075,.085,.070)),blend=.035)
clay.add(S.sd_ellipsoid((0,-.205,.335),(.037,.061,.050),rot=(25,0,0)),blend=.035)
clay.add(S.sd_cone((0,-.205,.330),(0,-.275,.390),.034,.029),blend=.025)
for side in [-1,1]:
 for front in [True,False]:
  label=('Fore' if front else 'Hind')+('L' if side<0 else 'R')
  hip=(side*.062,-.165 if front else .155,.30);elbow=(side*.073,-.14 if front else .205,.17);wrist=(side*.078,-.21 if front else .13,.042)
  bone(label,hip,elbow);bone(label+'Lower',elbow,wrist,label);bone(label+'Foot',wrist,(side*.078,wrist[1]-.060,.024),label+'Lower')
  clay.add(S.sd_cone(hip,elbow,.028 if front else .040,.017 if front else .022),blend=.018)
  clay.add(S.sd_cone(elbow,wrist,.017 if front else .021,.011),blend=.014)
print('MESH body',flush=True)
body=mesh_clay(clay,'Continuous torso neck and limbs');meshes.append(body)
# Decimate only after the continuous silhouette has been authored.
bpy.context.view_layer.objects.active=body
m=body.modifiers.new('Sculpt surface reduction','DECIMATE');m.ratio=min(1,16000/len(body.data.polygons));bpy.ops.object.modifier_apply(modifier=m.name)
print('STAGE head',flush=True)
headclay=S.Clay((-.08,-.43,.345),(.08,-.21,.51),.00085)
headclay.add(S.sd_ellipsoid((0,-.285,.420),(.043,.047,.047)))
headclay.add(S.sd_ellipsoid((0,-.312,.405),(.036,.038,.031)),blend=.017)
headclay.add(S.sd_cone((0,-.325,.396),(0,-.391,.390),.023,.012),blend=.014)
# Cheek wedge and lower mandible, distinct from the high cranial mass.
headclay.add(S.sd_round_box((0,-.331,.382),(.023,.030,.010),.008),blend=.010)
for side in [-1,1]:
 headclay.add(S.sd_ellipsoid((side*.039,-.277,.459),(.018,.014,.027),rot=(0,side*-15,0)),blend=.009)
 headclay.sub(S.sd_ellipsoid((side*.042,-.290,.462),(.011,.007,.018)),blend=.003)
 # small socket recess; eyeball will be inset, with the rim formed by the sculpt
 headclay.sub(S.sd_ellipsoid((side*.027,-.3255,.426),(.012,.0095,.011)),blend=.002)
print('MESH head',flush=True)
head=mesh_clay(headclay,'Sculpted facial planes and pinnae');meshes.append(head)
bpy.context.view_layer.objects.active=head
m=head.modifiers.new('Facial surface reduction','DECIMATE');m.ratio=min(1,11000/len(head.data.polygons));bpy.ops.object.modifier_apply(modifier=m.name)

def smoothstep(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def weights_at(p,headpart=False):
 x,y,z=p
 if headpart:return {'Head':1}
 if y<-.205 and z>.30:
  q=smoothstep(-.205,-.265,y);return {'Root':1-q,'Neck':q}
 side='L' if x<0 else 'R';front=y<0;n=('Fore' if front else 'Hind')+side
 h,e,_=bone_defs[n];_,w,_=bone_defs[n+'Lower']
 if z<.245 or abs(x)>.057:
  l=smoothstep(.275,.21,z)*smoothstep(.030,.062,abs(x))
  low=smoothstep(.200,.135,z);foot=smoothstep(.058,.035,z)
  d={'Root':1-l,n:l*(1-low),n+'Lower':l*low*(1-foot),n+'Foot':l*low*foot};return {k:v for k,v in d.items() if v>.00001}
 return {'Root':1}
def coat_color(p,headpart=False):
 x,y,z=p;ax=abs(x)
 if headpart:
  col=np.array([.74,.715,.65])
  # Narrow snout is dark; a white bridge remains between bilateral masks.
  muzzle=smoothstep(-.341,-.369,y)*smoothstep(.416,.403,z)
  # Tapered black mask over eye, ending above narrow cheek.
  dz=(z-.429)/.027;center=.027+.004*dz;width=.014*(1-.35*min(1,abs(dz)))
  mask=(1-smoothstep(width-.003,width+.002,abs(ax-center)))*(1-smoothstep(.83,1.1,abs(dz)))*(1-smoothstep(-.315,-.299,y))
  mask=max(mask,muzzle)
  ear=smoothstep(.449,.458,z)*smoothstep(.032,.043,ax)*(1-smoothstep(-.289,-.278,y))
  col=col*(1-mask)+np.array([.014,.012,.011])*mask
  col=col*(1-ear*.8)+np.array([.085,.065,.055])*ear*.8
 else:
  col=np.array([.29,.265,.235]);whitepart=(1-smoothstep(.248,.295,z))*(1-smoothstep(.048,.073,ax))
  col=col*(1-whitepart)+np.array([.66,.64,.58])*whitepart
  # Pale lower forearms and hind shins, with brown-grey shoulder saddle.
  q=(1-smoothstep(.09,.19,z))*.45;col=col*(1-q)+np.array([.60,.58,.52])*q
 if not headpart:
  lum=col.mean();t=max(0,min(1,(.53-lum)/.20));t=t*t*(3-2*t);col=col*(1-t*.85)+lum*np.array([.985,1.,1.015])*t*.85
 return col
for obj,ish in [(body,False),(head,True)]:
 print('BAKE',obj.name,flush=True)
 for bn in bone_defs:obj.vertex_groups.new(name=bn)
 for v in obj.data.vertices:
  for bn,w in weights_at(v.co,ish).items():obj.vertex_groups[bn].add([v.index],w,'REPLACE')
 # Exact per-face atlas authored directly; no operator-context UV dependencies.
 vertexcolors=np.array([(*coat_color(v.co,ish),1) for v in obj.data.vertices]);uv=obj.data.uv_layers.new(name='Coat atlas');px=np.ones((2048,2048,4),dtype=np.float32);cell=16;cols=128
 aa,bb=np.meshgrid(np.linspace(-.12,1.12,cell),np.linspace(-.12,1.12,cell));wa=np.clip(aa,0,1);wb=np.clip(bb,0,1);den=np.maximum(1,wa+wb);wa/=den;wb/=den
 rng=np.random.default_rng(811 if ish else 812)
 for poly in obj.data.polygons:
  row=poly.index//cols;col=poly.index%cols;x0=col*cell;y0=row*cell
  colors=vertexcolors[list(poly.vertices),:3]
  block=colors[0][None,None,:]*(1-wa-wb)[:,:,None]+colors[1][None,None,:]*wa[:,:,None]+colors[2][None,None,:]*wb[:,:,None]
  noise=rng.random((cell,cell));noise=(noise+np.roll(noise,1,0)+np.roll(noise,2,0))/3
  px[y0:y0+cell,x0:x0+cell,:3]=block*(.9+noise[:,:,None]*.2)
  for loop,local in zip(poly.loop_indices,[(2,2),(14,2),(2,14)]):uv.data[loop].uv=((x0+local[0])/2048,(y0+local[1])/2048)
 mat=bpy.data.materials.new(obj.name+' original baked coat');mat.use_nodes=True;nd=mat.node_tree.nodes;lk=mat.node_tree.links;pr=nd.get('Principled BSDF');pr.inputs['Roughness'].default_value=.88
 im=bpy.data.images.new(obj.name+' original 2K coat',width=2048,height=2048);im.pixels.foreach_set(px.ravel());im.pack();tex=nd.new('ShaderNodeTexImage');tex.image=im;lk.new(tex.outputs['Color'],pr.inputs['Base Color'])
 obj.data.materials.clear();obj.data.materials.append(mat)
print('COAT complete',flush=True)
# Inset eyes: small ochre iris with a black pupil; no external bulging bead.
for side in [-1,1]:
 cx=side*.027;cy=-.319;cz=.426
 loft('Inset iris '+str(side),[((cx,cy+.003,cz),.0064,.0066),((cx,cy-.0025,cz),.0060,.0063),((cx,cy-.004,cz),.003,.003)],amber,'Head',sides=24)
 loft('Pupil '+str(side),[((cx,cy-.0041,cz),.0031,.0036),((cx,cy-.0045,cz),.0029,.0033)],pupil,'Head',sides=24)
 # Small black rhinarium, with lateral nostril depressions visually indicated.
loft('Nose leather',[((0,-.391,.390),.011,.007),((0,-.401,.390),.010,.0065),((0,-.4025,.388),.006,.004)],nosemat,'Head',sides=24)
for side in [-1,1]:
 for front in [True,False]:
  label=('Fore' if front else 'Hind')+('L' if side<0 else 'R');wrist=bone_defs[label+'Foot'][0];xx=wrist.x;yy=wrist.y
  loft(label+' palm',[(tuple(wrist),.011,.011),((xx,yy-.027,.025),.017,.009),((xx,yy-.045,.019),.016,.007)],dark,label+'Foot',sides=16)
  for j in range(4):
   x=xx+(j-1.5)*.008;y=yy-.039;ln=.031 if j in [1,2] else .024
   loft(label+' digit '+str(j),[((x,y,.021),.0035,.0038),((x,y-ln*.65,.014),.003,.0032),((x,y-ln,.011),.0018,.002)],dark,label+'Foot',sides=8)
  loft(label+' opposable digit',[((xx-side*.012,yy-.018,.024),.004,.004),((xx-side*.026,yy-.030,.017),.0032,.0035),((xx-side*.025,yy-.044,.013),.0018,.002)],dark,label+'Foot',sides=8)
print('DETAILS complete',flush=True)
# Surface-attached, groomed three-point short fur ribbons. Each inherits the same
# skin weights as its root. Color follows the painted surface, including masks.
furmat=material('Short coat strand pigment',(1,1,1),False);nd=furmat.node_tree.nodes;vc=nd.new('ShaderNodeVertexColor');vc.layer_name='FurColor';furmat.node_tree.links.new(vc.outputs['Color'],nd['Principled BSDF'].inputs['Base Color'])
for obj,ish,count in [(body,False,4200),(head,True,1600)]:
 obj.data.calc_loop_triangles();tris=list(obj.data.loop_triangles);areas=[t.area for t in tris];vs=[];fs=[];ws=[];cols=[]
 for tri in random.choices(tris,weights=areas,k=count):
  a,b,c=[obj.data.vertices[i] for i in tri.vertices];u=random.random();v=random.random()
  if u+v>1:u,v=1-u,1-v
  p=a.co*(1-u-v)+b.co*u+c.co*v;n=(a.normal*(1-u-v)+b.normal*u+c.normal*v).normalized()
  if ish and p.y<-.349:continue
  if ish and abs(abs(p.x)-.027)<.010 and abs(p.z-.426)<.011 and p.y<-.318:continue
  flow=Vector((p.x*.5,.5,-.1)) if not ish else Vector((p.x*4,.15,-.20))
  tangent=(flow-n*flow.dot(n)).normalized();length=random.uniform(.005,.010) if not ish else random.uniform(.003,.007)
  direction=(n*.35+tangent).normalized();width=random.uniform(.00020,.00045);cross=direction.cross(n).normalized()*width;base=p+n*.00015;mid=base+direction*length*.58+n*length*.10;tip=base+direction*length
  j=len(vs);vs.extend([tuple(base-cross),tuple(base+cross),tuple(mid-cross*.65),tuple(mid+cross*.65),tuple(tip)]);fs.extend([(j,j+1,j+3,j+2),(j+2,j+3,j+4)]);ws.extend([weights_at(p,ish)]*5);color=coat_color(p,ish)*random.uniform(.88,1.14);color=np.where(color<=.04045,color/12.92,((color+.055)/1.055)**2.4);cols.extend([(*color,1)]*5)
 ob=mesh(obj.name+' groomed short fur',vs,fs,furmat,ws);at=ob.data.color_attributes.new(name='FurColor',type='FLOAT_COLOR',domain='POINT')
 for i,col in enumerate(cols):at.data[i].color=col
print('FUR complete',flush=True)
# Ringed tail: long raised arch, never fused into back. 13 dark bands plus pale bands.
def tailpos(t):return Vector((.018*math.sin(t*math.pi),.23+.25*math.sin(t*math.pi*.75),.31+.59*t-.05*t*t))
for i in range(12):bone('Tail%02d'%i,tailpos(i/12),tailpos((i+1)/12),'Root' if i==0 else 'Tail%02d'%(i-1))
sections=[(tuple(tailpos(i/104)),.026*(1-i/104*.70),.028*(1-i/104*.70)) for i in range(105)]
tail=loft('Ringed tail',sections,white,lambda t:'Tail%02d'%min(11,int(t*12)),sides=24)
tail.data.materials.append(black)
for p in tail.data.polygons:p.material_index=1 if p.index//24>=100 else int((p.index//24)/4)%2
for band in [0,1]:
 vs=[];fs=[];ws=[]
 for n in range(2200):
  t=random.uniform(0,1)
  if (1 if t>.9615 else int(t*26)%2)!=band:continue
  co=tailpos(t);a=random.uniform(0,math.tau);rad=.027*(1-t*.70);tangent=(tailpos(min(1,t+.002))-tailpos(max(0,t-.002))).normalized();u=tangent.cross(Vector((1,0,0))).normalized();v=tangent.cross(u).normalized();normal=u*math.cos(a)+v*math.sin(a);p=co+normal*rad;idx=len(vs);vs.extend([tuple(p+Vector((-.0005,0,0))),tuple(p+Vector((.0005,0,0))),tuple(p+normal*.005+tangent*.008)]);fs.append((idx,idx+1,idx+2));ws.extend([{'Tail%02d'%min(11,int(t*12)):1}]*3)
 mesh('Tail '+('dark' if band else 'pale')+' guard hairs',vs,fs,black if band else white,ws)

# Proportion correction after silhouette review: slightly larger small head,
# tapered neck and 14% shorter standing limb height. Shared by skin and skeleton.
def proportion(p):
 p=Vector(p);p.z=p.z*.86 if p.z<.30 else p.z-.042;return p
for ob in meshes:
 ishead=all(len(v.groups)==1 and ob.vertex_groups[v.groups[0].group].name=='Head' for v in ob.data.vertices)
 for vert in ob.data.vertices:
  p=vert.co.copy()
  if ishead:p=Vector((p.x*1.09,(p.y+.29)*1.09-.302,(p.z-.41)*1.09+.41))
  if any(t in ob.name for t in ['palm','digit']) and p.z<.032:p.z=.010+(p.z-.010)*.55
  vert.co=proportion(p)
for n,(h,t,pa) in list(bone_defs.items()):
 if n=='Head':h=Vector((h.x,h.y-.012,h.z));t=Vector((t.x,t.y-.012,t.z))
 bone_defs[n]=(proportion(h),proportion(t),pa)
print('TAIL complete',flush=True)
# Armature creation and skin binding.
arm=bpy.data.armatures.new('Lemur anatomical skeleton');rig=bpy.data.objects.new('Ring-tailed lemur rig',arm);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);print('enter armature edit',flush=True);bpy.ops.object.mode_set(mode='EDIT');print('armature edit okay',flush=True)
for n,(h,t,parent) in bone_defs.items():
 b=arm.edit_bones.new(n);b.head=h;b.tail=t
 if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
for ob in meshes:
 mod=ob.modifiers.new('Skeletal deformation','ARMATURE');mod.object=rig;ob.parent=rig
for p in rig.pose.bones:p.rotation_mode='XYZ'
rig.animation_data_create()
for clip,duration in [('Idle',96),('Walk',48),('Leap',48),('Climb',64)]:
 action=bpy.data.actions.new(clip);rig.animation_data.action=action;action.use_fake_user=True
 for fr in range(0,duration+1,4):
  t=fr/duration;phase=math.tau*t
  for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0)
  root=rig.pose.bones['Root'];head=rig.pose.bones['Head']
  if clip=='Idle':
   root.scale=(1,1+.009*math.sin(phase),1);head.rotation_euler[2]=.06*math.sin(phase);head.rotation_euler[0]=.035*math.sin(phase)
  elif clip=='Walk':
   bob=.004*(1-math.cos(phase*2));root.location[1]=bob;root.scale=(1,1,1)
   for i,n in enumerate(['ForeL','HindR','ForeR','HindL']):
    q=phase+(math.pi if i>1 else 0);h,e,_=bone_defs[n];_,w,_=bone_defs[n+'Lower'];l1=(e-h).length;l2=(w-e).length
    target=w.copy();target.y+=.045*math.cos(q);target.z+=.025*max(0,math.sin(q))-bob
    dy=target.y-h.y;dz=target.z-h.z;dist=min(l1+l2-.0001,math.hypot(dy,dz))
    base1=math.atan2(e.z-h.z,e.y-h.y);base2=math.atan2(w.z-e.z,w.y-e.y)
    a1=math.atan2(dz,dy)+math.acos(max(-1,min(1,(l1*l1+dist*dist-l2*l2)/(2*l1*dist))))
    ey=h.y+l1*math.cos(a1);ez=h.z+l1*math.sin(a1);a2=math.atan2(target.z-ez,target.y-ey)
    rig.pose.bones[n].rotation_euler[0]=a1-base1;rig.pose.bones[n+'Lower'].rotation_euler[0]=(a2-a1)-(base2-base1);rig.pose.bones[n+'Foot'].rotation_euler[0]=-(a2-base2)
  elif clip=='Leap':
   lift=max(0,math.sin(math.pi*t))**1.4;root.location[1]=.18*lift;root.scale=(1,1,1);root.rotation_euler[0]=-.10*math.sin(phase)
   for n in ['ForeL','ForeR']:rig.pose.bones[n].rotation_euler[0]=-.75*lift;rig.pose.bones[n+'Lower'].rotation_euler[0]=-.25*lift
   for n in ['HindL','HindR']:rig.pose.bones[n].rotation_euler[0]=.70*lift;rig.pose.bones[n+'Lower'].rotation_euler[0]=-.55*lift
  else:
   root.location[1]=.065+.025*math.sin(phase);root.rotation_euler[0]=-.55;root.scale=(1,1,1)
   for i,n in enumerate(['ForeL','ForeR','HindL','HindR']):
    q=phase+(i%2)*math.pi;rig.pose.bones[n].rotation_euler[0]=(-.45 if n.startswith('Fore') else .25)+.40*math.sin(q);rig.pose.bones[n+'Lower'].rotation_euler[0]=-.4-.20*math.cos(q)
  if clip in ['Leap','Climb']:
   for n in ['ForeL','ForeR','HindL','HindR']:rig.pose.bones[n+'Foot'].rotation_euler[0]=-rig.pose.bones[n].rotation_euler[0]-rig.pose.bones[n+'Lower'].rotation_euler[0]
  for i in range(12):
   rig.pose.bones['Tail%02d'%i].rotation_euler[2]=.022*math.sin(phase+i*.3);rig.pose.bones['Tail%02d'%i].rotation_euler[0]=.012*math.sin(phase+i*.25)
  for p in rig.pose.bones:
   p.keyframe_insert(data_path='rotation_euler',frame=fr);p.keyframe_insert(data_path='location',frame=fr);p.keyframe_insert(data_path='scale',frame=fr)
 for fc in action.fcurves:
  for kp in fc.keyframe_points:kp.interpolation='LINEAR'
rig.animation_data.action=bpy.data.actions['Idle'];scene.frame_set(0)
# Subdivide custom anatomical surfaces once, preserving clean smooth silhouettes.
for ob in meshes:
 if len(ob.data.polygons)>20 and any(k in ob.name for k in ['palm','digit','Nose','iris','Pupil']):
  bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Surface refinement','SUBSURF');mod.levels=1;bpy.ops.object.modifier_move_up(modifier=mod.name);bpy.ops.object.modifier_apply(modifier=mod.name)
for ob in scene.objects:ob.select_set(ob.type in {'MESH','ARMATURE'})
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ring-tailed-lemur.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'ring-tailed-lemur.raw.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_apply=False,export_anim_slide_to_zero=True)
tri=sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in meshes)
report={'author':'Earthbound','refinement':'Continuous SDF torso/limbs and sculpted narrow head, carved eye sockets, baked surface masks, groomed short coat, black tail tip','license':'CC0-1.0','basis':'Original anatomical artist interpretation; not a scan or expert-reviewed reconstruction','triangles':tri,'bones':len(bone_defs),'clips':['Idle','Walk','Leap','Climb'],'limitations':['Fur is an economical textured surface and sparse guard-hair mesh, not strand-level grooming.','Animations are educational in-place artist interpretations, not motion capture.','Climbing is shown without environmental branches.']};(R/'pipeline/reports/ring-tailed-lemur-creation.json').write_text(json.dumps(report,indent=2))
# Review renders only: cameras, lighting, and paper not included in GLB above.
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Paper');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.85,.83,.79,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55;scene.view_settings.view_transform='Standard'
for name,pos,power,size in [('Key',(2,-3,4),130,3),('Fill',(-3,-1,2),80,3),('Rim',(0,3,3),100,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
# The sole primitive is the paper ground, not part of the organism or exported model.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.002));ground=bpy.context.object;ground.data.materials.append(material('Paper',(.90,.88,.83),False))
d=bpy.data.cameras.new('Review');cam=bpy.data.objects.new('Review',d);scene.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=1.15
for label,pos in [('three-quarter',(1.3,-1.7,.85)),('side',(1.8,0,.7)),('front',(0,-2,.65)),('rear',(0,2,.65))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,.05,.43))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(R/'pipeline/reports/ring-tailed-lemur-render'/(label+'.png'));bpy.ops.render.render(write_still=True)
print('LEMUR_REPORT',json.dumps(report))
