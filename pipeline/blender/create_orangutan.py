"""Original Bornean orangutan female study. Custom anatomical contour meshes and skeletal animation.
No third-party mesh reused. Blender 4.2. Run from project root.
"""
import bpy, math, random, json
import numpy as np
from pathlib import Path
from mathutils import Vector
import sys
sys.path.extend([str(Path(__file__).resolve().parent),str(Path(__file__).resolve().parents[1]/'vendor/scenario')])
import bx_sculpt as S
from scenario_compat import mesh_clay
random.seed(24)
ROOT=Path.cwd(); OUT=ROOT/'pipeline/assets/bornean-orangutan'; OUT.mkdir(parents=True,exist_ok=True)
REPORT=ROOT/'pipeline/reports/bornean-orangutan-render';REPORT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.render.fps=30
# Fine directional coat texture, embedded PNG and exported with glTF.
n=1024; yy,xx=np.mgrid[:n,:n];rng=np.random.default_rng(24)
noise=rng.random((n,n));grain=.79+.035*np.sin(xx*.037+np.sin(yy*.021)*4)+.035*np.sin(xx*.17+yy*.008)+.045*noise
pix=np.ones((n,n,4),dtype=np.float32)
for c,v in enumerate([.38,.112,.032]):pix[:,:,c]=grain*v
img=bpy.data.images.new('Russet coat directional grain',width=n,height=n);img.pixels.foreach_set(pix.ravel());img.filepath_raw=str(OUT/'russet-coat.png');img.file_format='PNG';img.save();img.pack()
def mat(name,color,rough=.8,tex=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 if tex:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=img;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 return m
coat=mat('Russet auburn short Bornean coat',(.30,.075,.024),.96,tex=True)
skin=mat('Charcoal umber facial skin',(.075,.062,.051),.94);muzzle=mat('Warm gray muzzle',(.066,.042,.027),.88)
eye=mat('Dark brown eyes',(.014,.008,.004),.17);iris=mat('Amber iris',(.16,.065,.014),.28);black=mat('Nostril and lip crease',(.009,.006,.004),.95)
hairm=[mat('Hair lock '+str(i),(.075+i*.009,.016+i*.0025,.004+i*.0007),.98) for i in range(7)]
meshes=[]
bones={
 'root':((0,0,0),(0,0,.24),None),
 'pelvis':((0,.045,.56),(0,.045,.74),'root'),
 'spine':((0,.045,.74),(0,.035,1.01),'pelvis'),
 'chest':((0,.035,1.01),(0,.02,1.17),'spine'),
 'neck':((0,.02,1.17),(0,-.005,1.24),'chest'),
 'head':((0,-.005,1.24),(0,-.005,1.45),'neck')}
for s,side in [(-1,'R'),(1,'L')]:
 bones.update({f'upper_arm.{side}':((s*.225,.015,1.105),(s*.43,.01,.76),'chest'),f'forearm.{side}':((s*.43,.01,.76),(s*.56,-.025,.365),f'upper_arm.{side}'),f'hand.{side}':((s*.56,-.025,.365),(s*.575,-.045,.255),f'forearm.{side}'),f'thigh.{side}':((s*.12,.03,.62),(s*.20,-.02,.335),'pelvis'),f'shin.{side}':((s*.20,-.02,.335),(s*.17,.02,.10),f'thigh.{side}'),f'foot.{side}':((s*.17,.02,.10),(s*.17,-.14,.055),f'shin.{side}')})
def blendweights(p,names):
 p=Vector(p);ds=[]
 for name in names:
  a,b,_=bones[name];a,b=Vector(a),Vector(b);t=max(0,min(1,(p-a).dot(b-a)/(b-a).length_squared));ds.append(((p-(a+t*(b-a))).length,name))
 ds.sort();ds=ds[:4];w=[1/max(.025,d)**4 for d,_ in ds];total=sum(w)
 return {name:w[i]/total for i,(_,name) in enumerate(ds)}
def obj(name,vs,fs,material,weights=None,uv=None):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);o.data.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 if weights:
  for i,ws in enumerate(weights):
   total=sum(w for bn,w in sorted(ws.items(),key=lambda q:q[1],reverse=True)[:4])
   for bn,w in sorted(ws.items(),key=lambda q:q[1],reverse=True)[:4]:
    w/=total
    vg=o.vertex_groups.get(bn) or o.vertex_groups.new(name=bn);vg.add([i],float(w),'REPLACE')
 if uv:
  layer=me.uv_layers.new(name='Coat UV')
  for l in me.loops:layer.data[l.index].uv=uv[l.vertex_index]
 meshes.append(o);return o
# Smooth interpolation of independently designed cross-sectional contours.
def sample(rows,k=3):
 arr=np.array(rows,float);res=[]
 for i in range(len(rows)-1):
  p0=arr[max(0,i-1)];p1=arr[i];p2=arr[i+1];p3=arr[min(len(rows)-1,i+2)]
  for a in range(k):
   t=a/k;res.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
 return res+[arr[-1]]
def contour(name,rows,names,material=coat,segments=24,fur=0):
 rows=sample(rows);vs=[];fs=[];ws=[];uv=[];surface=[]
 for i,r in enumerate(rows):
  center=Vector(r[:3]);prev=Vector(rows[max(0,i-1)][:3]);nxt=Vector(rows[min(len(rows)-1,i+1)][:3]);t=(nxt-prev).normalized();u=t.cross(Vector((0,1,0))).normalized();v=t.cross(u).normalized()
  if u.length<.1:u=Vector((1,0,0));v=Vector((0,0,1))
  for j in range(segments):
   a=2*math.pi*j/segments;normal=(u*math.cos(a)+v*math.sin(a)).normalized();p=center+u*max(.001,r[3])*math.cos(a)+v*max(.001,r[4])*math.sin(a)
   p+=normal*(.0012*math.sin(a*5+i*.8));vs.append(tuple(p));ws.append(blendweights(p,names));uv.append((j/segments,i/(len(rows)-1)));surface.append((p,normal,ws[-1]))
 for i in range(len(rows)-1):
  for j in range(segments):a=i*segments+j;b=i*segments+(j+1)%segments;fs.append((a,b,b+segments,a+segments))
 fs += [tuple(range(segments-1,-1,-1)),tuple((len(rows)-1)*segments+j for j in range(segments))]
 o=obj(name,vs,fs,material,ws,uv)
 if False:furcoat(name,surface,fur)
 return o

def furcoat(name,surface,count):
 vs=[];fs=[];ws=[];mi=[]
 for k in range(count):
  p,n,w=random.choice(surface[48:-48] if len(surface)>120 else surface)
  # Hair drapes with gravity, bent out from the skin, rather than radial spikes.
  lengths=(.045,.105) if abs(p.x)>.26 and p.z>.4 else (.025,.065)
  if 'Cranial' in name:lengths=(.018,.052)
  l=random.uniform(*lengths);width=random.uniform(.0011,.0024);down=Vector((0,0,-1));d=(down-n*down.dot(n)+n*.045+Vector((0,.025,0))).normalized();cross=d.cross(n)
  if cross.length<.1:cross=Vector((1,0,0))
  cross.normalize();p=p+n*.002;start=len(vs)
  if p.z<.25:l=min(l,.018)
  strandshade=random.randrange(0,len(hairm)-2)
  for t,ww in [(0,.65),(.52,1),(1,0)]:
   c=p+d*l*t+n*(math.sin(math.pi*t)*.0025)+cross*(math.sin(t*5+k)*.001*t)
   c.z=max(c.z,.03)
   vs.extend([tuple(c-cross*width*ww),tuple(c+cross*width*ww)]);ws.extend([w,w])
  for j in range(2):a=start+2*j;fs.append((a,a+1,a+3,a+2));mi.append(strandshade+j)
 o=obj(name+' draped hair locks',vs,fs,hairm[0],ws)
 for m in hairm[1:]:o.data.materials.append(m)
 for p,i in zip(o.data.polygons,mi):p.material_index=i

contour('Pear shaped torso',[(0,.045,.53,.08,.08),(0,.045,.60,.17,.14),(0,.03,.73,.205,.175),(0,.025,.87,.19,.17),(0,.025,1.00,.185,.145),(0,.02,1.08,.205,.13),(0,.015,1.155,.185,.105),(0,.005,1.21,.09,.075)],['pelvis','spine','chest','neck'],segments=40,fur=1100)
#contour('Cranium and nape',[(0,.005,1.17,.065,.065),(0,.005,1.22,.105,.08),(0,.012,1.32,.13,.105),(0,.02,1.41,.112,.092),(0,.02,1.455,.06,.055),(0,.015,1.465,.005,.005)],['head'],segments=36,fur=440)
for s,side in [(-1,'R'),(1,'L')]:
 contour('Long shoulder upper arm '+side,[(s*.12,.02,1.12,.085,.085),(s*.245,.02,1.075,.09,.09),(s*.33,.02,.99,.082,.08),(s*.39,.02,.86,.063,.062),(s*.43,.01,.76,.060,.06),(s*.47,0,.64,.067,.067),(s*.51,-.01,.51,.056,.052),(s*.55,-.02,.39,.038,.038),(s*.565,-.025,.345,.031,.028)],[f'upper_arm.{side}',f'forearm.{side}',f'hand.{side}'],segments=28,fur=650)
 contour('Short flexed leg '+side,[(s*.10,.045,.64,.09,.10),(s*.145,.055,.56,.102,.105),(s*.19,.015,.43,.078,.078),(s*.20,-.02,.335,.056,.055),(s*.185,0,.23,.057,.058),(s*.17,.02,.12,.04,.037)],[f'thigh.{side}',f'shin.{side}'],segments=28,fur=250)
 contour('Grasping palm '+side,[(s*.565,-.025,.365,.031,.024),(s*.575,-.035,.32,.046,.026),(s*.58,-.045,.27,.045,.022),(s*.58,-.052,.245,.035,.018)],[f'hand.{side}'],skin,20)
 # Long curved fingers and a short opposing thumb; individually sculpted contour paths.
 for j in range(4):
  x=s*(.548+j*.022);z=.26;length=[.085,.108,.115,.093][j];bn=f'finger{j+1}.{side}';bones[bn]=((x,-.05,z),(x,-.07,z-length),f'hand.{side}')
  contour('Curved finger '+bn,[(x,-.05,z,.012,.013),(x,-.052,z-.035,.011,.011),(x,-.072,z-length*.70,.009,.009),(x,-.104,z-length*.88,.006,.007),(x,-.115,z-length*.76,.002,.003)],[bn],skin,12)
 bn=f'thumb.{side}';bones[bn]=((s*.54,-.04,.31),(s*.507,-.085,.26),f'hand.{side}')
 contour('Opposable thumb '+side,[(s*.54,-.04,.31,.017,.015),(s*.51,-.055,.285,.013,.012),(s*.505,-.08,.26,.010,.009),(s*.514,-.092,.252,.004,.005)],[bn],skin,12)
 contour('Hind grasping foot '+side,[(s*.17,.04,.11,.033,.032),(s*.17,-.015,.075,.047,.032),(s*.17,-.08,.055,.055,.025),(s*.17,-.12,.05,.043,.018)],[f'foot.{side}'],skin,20)
 for j in range(4):
  x=s*(.137+j*.022);bn=f'toe{j+1}.{side}';bones[bn]=((x,-.10,.05),(x,-.19,.04),f'foot.{side}')
  contour('Grasping toe '+bn,[(x,-.10,.05,.011,.012),(x,-.15,.046,.010,.010),(x,-.19,.046,.008,.008),(x,-.20,.06,.002,.003)],[bn],skin,12)
 bn=f'great_toe.{side}';bones[bn]=((s*.13,-.03,.06),(s*.08,-.11,.05),f'foot.{side}')
 contour('Opposing great toe '+side,[(s*.13,-.03,.06,.017,.017),(s*.09,-.065,.05,.014,.014),(s*.075,-.10,.049,.009,.010),(s*.083,-.115,.055,.003,.004)],[bn],skin,14)
# Continuous closed female head: cranium, mandibular planes, muzzle, brows and
# nose share one smooth signed-distance sculpt. Skin color is painted onto it.
clay=S.Clay((-.18,-.235,1.135),(.18,.155,1.51),.0018)
clay.add(S.sd_ellipsoid((0,.012,1.35),(.116,.101,.120)))
clay.add(S.sd_ellipsoid((0,.005,1.205),(.077,.078,.078)),blend=.035)
clay.add(S.sd_ellipsoid((0,-.074,1.318),(.091,.061,.086)),blend=.038)
clay.add(S.sd_round_box((0,-.079,1.251),(.059,.037,.028),.024),blend=.034)
clay.add(S.sd_ellipsoid((0,-.119,1.253),(.064,.044,.040)),blend=.024)
clay.add(S.sd_ellipsoid((0,-.153,1.237),(.047,.017,.011)),blend=.008)
clay.add(S.sd_ellipsoid((0,-.152,1.252),(.044,.014,.008)),blend=.007)
clay.add(S.sd_ellipsoid((0,-.140,1.294),(.033,.028,.016)),blend=.014)
clay.sub(S.sd_ellipsoid((0,-.164,1.243),(.042,.008,.0018)),blend=.0008)
for side in [-1,1]:
 clay.add(S.sd_ellipsoid((side*.044,-.108,1.354),(.034,.019,.011)),blend=.012)
 clay.sub(S.sd_ellipsoid((side*.043,-.130,1.335),(.013,.014,.0095)),blend=.002)
 clay.sub(S.sd_ellipsoid((side*.018,-.160,1.286),(.0055,.007,.0038)),blend=.001)
 clay.add(S.sd_ellipsoid((side*.113,.002,1.317),(.020,.017,.029)),blend=.009)
 clay.sub(S.sd_ellipsoid((side*.123,-.010,1.318),(.010,.010,.018)),blend=.002)
head=mesh_clay(clay,'Continuous female craniofacial sculpt');meshes.append(head)
bpy.context.view_layer.objects.active=head
m=head.modifiers.new('Facial surface budget','DECIMATE');m.ratio=min(1,10500/len(head.data.polygons));bpy.ops.object.modifier_apply(modifier=m.name)
vg=head.vertex_groups.new(name='head');vg.add(list(range(len(head.data.vertices))),1,'REPLACE')
def smoothstep(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def facecolor(p):
 x,y,z=p
 # Natural irregular hairline: forehead high, sides descend to the jaw.
 r=((x/.091)**2+((z-1.307)/.105)**2)**.5+.025*math.sin(x*220+z*97)
 mask=(1-smoothstep(.88,1.06,r))*(1-smoothstep(-.065,-.035,y))
 ear=smoothstep(.102,.115,abs(x))*(1-smoothstep(-.012,.012,y))
 mask=max(mask,ear*.85)
 col=np.array([.38,.112,.032])*(1-mask)+np.array([.22,.193,.167])*mask
 eyezone=sum(math.exp(-((x-q*.043)/.023)**2-((z-1.335)/.014)**2) for q in [-1,1])
 col*=1-.18*eyezone*mask
 # Subtle anatomically placed folds, not random spots: eyelid rim,
 # nasolabial crease and shallow forehead lines remain in the exported atlas.
 orbital=((abs(x)-.043)/.024)**2+((z-1.335)/.014)**2
 lid=math.exp(-((orbital-1)/.20)**2)
 cheek=math.exp(-((abs(x)-(.032+(1.29-z)*.40))/.0025)**2)*math.exp(-((z-1.268)/.032)**2)
 forehead=sum(math.exp(-((z-(h+.10*x*x))/.0013)**2) for h in [1.366,1.376])*math.exp(-(x/.055)**4)
 col*=1-mask*(.07*lid+.06*cheek+.035*forehead)
 col*=1+mask*.012*math.sin(x*870)*math.sin(z*730)
 return col
vertexcolors=np.array([facecolor(v.co) for v in head.data.vertices])
uv=head.data.uv_layers.new(name='Original facial coat atlas');px=np.ones((2048,2048,4),dtype=np.float32);cell=16;cols=128
aa,bb=np.meshgrid(np.linspace(-.12,1.12,cell),np.linspace(-.12,1.12,cell));wa=np.clip(aa,0,1);wb=np.clip(bb,0,1);den=np.maximum(1,wa+wb);wa/=den;wb/=den
for poly in head.data.polygons:
 row=poly.index//cols;col=poly.index%cols;x0=col*cell;y0=row*cell
 colors=vertexcolors[list(poly.vertices)]
 block=colors[0][None,None,:]*(1-wa-wb)[:,:,None]+colors[1][None,None,:]*wa[:,:,None]+colors[2][None,None,:]*wb[:,:,None]
 px[y0:y0+cell,x0:x0+cell,:3]=block*(.96+rng.random((cell,cell,1))*.08)
 for loop,local in zip(poly.loop_indices,[(2,2),(14,2),(2,14)]):uv.data[loop].uv=((x0+local[0])/2048,(y0+local[1])/2048)
faceim=bpy.data.images.new('Original female face and hairline 2K',width=2048,height=2048);faceim.pixels.foreach_set(px.ravel());faceim.filepath_raw=str(OUT/'female-face-atlas.png');faceim.file_format='PNG';faceim.save();faceim.pack()
fm=mat('Continuous painted craniofacial skin',(.1,.1,.1),.93);tx=fm.node_tree.nodes.new('ShaderNodeTexImage');tx.image=faceim;fm.node_tree.links.new(tx.outputs['Color'],fm.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);head.data.materials.append(fm)
# Tiny inset dark eyes, without a protruding marble or layered iris disks.
for side in [-1,1]:
 c=S.Clay((side*.043-.013,-.141,1.325),(side*.043+.013,-.110,1.345),.001)
 c.add(S.sd_ellipsoid((side*.043,-.124,1.335),(.009,.008,.006)))
 o=mesh_clay(c,'Inset dark eye '+str(side));o.data.materials.append(eye);meshes.append(o);g=o.vertex_groups.new(name='head');g.add(list(range(len(o.data.vertices))),1,'REPLACE')
# Closed mouth line follows the same sculpt surface and never floats in profile.
vs=[]
for i in range(33):
 x=-.042+i*.084/32;z=1.243-.003*(1-(x/.042)**2)
 hit,loc,norm,index=head.ray_cast(Vector((x,-.30,z)),Vector((0,1,0)))
 y=loc.y-.0006 if hit else -.16;vs += [(x,y,z-.0014),(x,y,z+.0014)]
obj('Closed lip crease',vs,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(32)],black,[{'head':1}]*len(vs))
surf=[(v.co.copy(),v.normal.copy(),{'head':1}) for v in head.data.vertices if (v.co.y>-.055 or abs(v.co.x)>.094 or v.co.z>1.414)]
furcoat('Cranial russet',surf,1000)
# Unite the custom anatomical surfaces into one continuous sculpted body.
cores=[o for o in meshes if any(o.name.startswith(n) for n in ['Pear shaped torso','Cranium and nape','Long shoulder upper arm','Short flexed leg']) and 'hair locks' not in o.name]
bpy.ops.object.select_all(action='DESELECT')
for o in cores:o.select_set(True)
bpy.context.view_layer.objects.active=cores[0];bpy.ops.object.join();body=bpy.context.object;body.name='Continuous sculpted body'
meshes=[o for o in meshes if o.name in bpy.data.objects] if False else [o for o in scene.objects if o.type=='MESH']
body.data.remesh_voxel_size=.0075;bpy.ops.object.voxel_remesh()
sm=body.modifiers.new('Soften anatomical transitions','SMOOTH');sm.factor=1.2;sm.iterations=6;bpy.ops.object.modifier_apply(modifier=sm.name)
dec=body.modifiers.new('Web surface budget','DECIMATE');dec.ratio=.12;bpy.ops.object.modifier_apply(modifier=dec.name)
body.vertex_groups.clear()
for vert in body.data.vertices:
 p=vert.co;x=abs(p.x);z=p.z;side='L' if p.x>0 else 'R'
 names=['pelvis','spine','chest','neck','head',f'upper_arm.{side}',f'forearm.{side}',f'thigh.{side}',f'shin.{side}']
 ws=blendweights(p,names)
 shoulder=smoothstep(.90,1.06,z);armmask=smoothstep(.205-.055*shoulder,.285-.035*shoulder,x)
 for bn in ws:
  if 'arm.' in bn:ws[bn]*=armmask
  elif 'thigh.' in bn or 'shin.' in bn:ws[bn]*=1-smoothstep(.64,.79,z)
 total=sum(ws.values())
 for bn,w in ws.items():
  if w<1e-7:continue
  vg=body.vertex_groups.get(bn) or body.vertex_groups.new(name=bn);vg.add([vert.index],float(w/total),'REPLACE')
for poly in body.data.polygons:poly.use_smooth=True
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')

# Area-random sampled groom from the FINAL unified anatomy avoids contour rows,
# repeated stitch patterns and roots floating off the smoothed body.
body.data.calc_loop_triangles()
tri=list(body.data.loop_triangles);areas=np.array([t.area for t in tri]);areas/=areas.sum()
surface=[]
for ti in rng.choice(len(tri),5500,p=areas):
 t=tri[ti];a,b,c=[body.data.vertices[i] for i in t.vertices];u,v=rng.random(2)
 if u+v>1:u=1-u;v=1-v
 p=a.co*(1-u-v)+b.co*u+c.co*v;n=(a.normal*(1-u-v)+b.normal*u+c.normal*v).normalized()
 # Weighted anchors use exactly the same anatomical deformation as their roots.
 ws={}
 for vert,f in [(a,1-u-v),(b,u),(c,v)]:
  for g in vert.groups:
   bn=body.vertex_groups[g.group].name;ws[bn]=ws.get(bn,0)+g.weight*f
 surface.append((p,n,ws))
furcoat('Irregular gravity groom',surface,5500)

# Ground at the lowest anatomical surface.
floor=min(v.co.z for o in meshes if 'hair locks' not in o.name for v in o.data.vertices)
for o in meshes:
 for v in o.data.vertices:v.co.z-=floor
for bn,(a,b,parent) in list(bones.items()):bones[bn]=((a[0],a[1],a[2]-floor),(b[0],b[1],b[2]-floor),parent)
# Skeleton and skinning, authored per anatomical region and per digit.
arm=bpy.data.armatures.new('Bornean orangutan anatomical skeleton');rig=bpy.data.objects.new('Bornean orangutan rig',arm);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(a,b,parent) in bones.items():
 eb=arm.edit_bones.new(name);eb.head=a;eb.tail=b
 if parent:eb.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
for o in meshes:
 o.parent=rig;mod=o.modifiers.new('Skeletal deformation','ARMATURE');mod.object=rig
rig.animation_data_create()
from orangutan_animation import build_actions
build_actions(rig,meshes,scene)
# Save editable source and a self-contained web asset.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bornean-orangutan.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'bornean-orangutan.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_nla_strips=False,export_skins=True,export_yup=True,export_anim_slide_to_zero=True)
tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
metrics={'species':'Pongo pygmaeus','sex':'female','origin':'Original custom contour mesh; no third-party geometry','triangles':tris,'vertices':sum(len(o.data.vertices) for o in meshes),'bones':len(bones),'clips':['Idle','Walk','Climb','Reach'],'texture_max_dimension':2048,'quality':'Stylized anatomical study; visual review required','glb_bytes':(OUT/'bornean-orangutan.glb').stat().st_size}
(ROOT/'pipeline/reports/bornean-orangutan-metrics.json').write_text(json.dumps(metrics,indent=2))
if '--save-only' in sys.argv:sys.exit(0)
# Neutral studio QA with full views and animated samples.
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Warm studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.65,.65,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
for name,pos,power,size in [('Key',(3,-4,5),450,4),('Fill',(-3,-2,3),250,3),('Rim',(0,3,4),400,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
# Ground is a custom quad, not animal geometry.
me=bpy.data.meshes.new('Ground');me.from_pydata([(-20,-20,0),(20,-20,0),(20,20,0),(-20,20,0)],[],[(0,1,2,3)]);g=bpy.data.objects.new('Ground',me);scene.collection.objects.link(g);g.data.materials.append(mat('Warm ivory ground',(.65,.63,.59)))
d=bpy.data.cameras.new('QA Camera');camera=bpy.data.objects.new('QA Camera',d);scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO';d.ortho_scale=1.9
for label,pos,clip,fr in [('front',(0,-4,1.15),'Idle',0),('three-quarter',(2.7,-4,1.8),'Idle',0),('side',(4,-.1,1.2),'Idle',0),('rear',(2.5,4,1.8),'Idle',0)]:
 rig.animation_data.action=bpy.data.actions[clip];scene.frame_set(fr);camera.location=pos;camera.rotation_euler=(Vector((0,0,.79))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(REPORT/(label+'-final.png'));bpy.ops.render.render(write_still=True)
print('METRICS',metrics)
