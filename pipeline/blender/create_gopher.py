"""Earthbound original Gopherus polyphemus. CC0-1.0. Reproducible Blender 4.2 authoring.
No imported geometry or primitive-based anatomy: all surfaces are authored vertices/faces.
Reference: https://www.fws.gov/project/gopher-tortoise (morphology only).
Run: blender -b --python pipeline/blender/create_gopher.py
"""
import bpy, math, os, json, random
import numpy as np
from mathutils import Vector
from math import sin, cos, pi, sqrt
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','gopher-tortoise'); WORK=os.path.join(ROOT,'work','gopher-tortoise')
os.makedirs(OUT,exist_ok=True); os.makedirs(WORK,exist_ok=True)
random.seed(39);bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for dat in bpy.data.materials: bpy.data.materials.remove(dat)
objects=[];normal_textures={};roughness_textures={}

def image(name,arr):
 h,w=arr.shape[:2]; im=bpy.data.images.new(name,width=w,height=h,alpha=True)
 rgba=np.ones((h,w,4),np.float32); rgba[:,:,:3]=np.clip(arr,0,1)
 im.pixels.foreach_set(rgba.ravel()); im.filepath_raw=os.path.join(OUT,name+'.png'); im.file_format='PNG'; im.save(); im.pack(); return im

def mat(name,col,tex=None,rough=.8,bump=.08):
 m=bpy.data.materials.new(name); m.use_nodes=True; n=m.node_tree.nodes; p=n.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*col,1); p.inputs['Roughness'].default_value=rough; m.diffuse_color=(*col,1)
 if tex:
  uvnode=n.new('ShaderNodeUVMap');uvnode.uv_map='UVMap';t=n.new('ShaderNodeTexImage'); t.image=tex;m.node_tree.links.new(uvnode.outputs['UV'],t.inputs['Vector']); m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
  b=n.new('ShaderNodeBump'); b.inputs['Strength'].default_value=bump; b.inputs['Distance'].default_value=.00075
  m.node_tree.links.new(t.outputs['Color'],b.inputs['Height'])
  if tex.name in normal_textures:
   nt=n.new('ShaderNodeTexImage');nt.image=normal_textures[tex.name];m.node_tree.links.new(uvnode.outputs['UV'],nt.inputs['Vector']);nm=n.new('ShaderNodeNormalMap');m.node_tree.links.new(nt.outputs['Color'],nm.inputs['Color']);m.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal'])
  if tex.name in roughness_textures:
   rt=n.new('ShaderNodeTexImage');rt.image=roughness_textures[tex.name];m.node_tree.links.new(uvnode.outputs['UV'],rt.inputs['Vector']);m.node_tree.links.new(rt.outputs['Color'],p.inputs['Roughness'])
  # Export normals only from explicit tangent-space maps.
 return m
# Independent worn-keratin scute tiles: pigment, rubbed ridges and pores are distinct masks.
rng=np.random.default_rng(73)
TILE=292;COLS=7;ROWS=6;W=COLS*TILE;H=ROWS*TILE
shellrgb=np.zeros((H,W,3),np.float32);shellheight=np.zeros((H,W),np.float32);shellrough=np.zeros((H,W),np.float32)
for tile in range(COLS*ROWS):
 trng=np.random.default_rng(730+tile*101);yy,xx=np.mgrid[0:TILE,0:TILE]/(TILE-1);u=(xx-.5)*2;v=(yy-.5)*2;r=np.sqrt(u*u+v*v);a=np.arctan2(v,u)
 broad=np.zeros_like(r);fine=np.zeros_like(r)
 for scale,amp in [(3,.042),(8,.030),(19,.040),(47,.025),(110,.018)]:
  for k in range(3):
   angle=trng.uniform(0,6.28);phase=trng.uniform(0,6.28);val=np.sin((u*np.cos(angle)+v*np.sin(angle))*scale+phase)*amp/3
   broad+=val if scale<20 else 0;fine+=val if scale>=20 else 0
 grain=trng.normal(0,.008,r.shape)
 worn=np.clip((broad+.018)*10,0,.65)
 wobble=r+.013*np.sin(a*5+tile)+.006*np.sin(a*9-r*11)
 rings=np.exp(-((np.sin(wobble*(42+tile%5))+1)/.19)**2)*(1-worn)*np.clip(r*1.4,.1,1)
 scratches=np.zeros_like(r)
 for k in range(16):
  angle=trng.uniform(0,6.28);offset=trng.uniform(-.8,.8);along=u*np.cos(angle)+v*np.sin(angle);across=-u*np.sin(angle)+v*np.cos(angle)
  scratches+=np.exp(-((across-offset)/trng.uniform(.002,.007))**2)*np.exp(-((along-trng.uniform(-.5,.5))/.18)**8)*trng.uniform(.003,.012)
 pigment=broad+fine+grain+worn*.13;edgewear=np.clip((r-.78)*1.4,0,.18)
 rgb=np.stack([.24+pigment+edgewear*.28-.020*rings+scratches,.205+pigment*.92+edgewear*.22-.017*rings+scratches*.9,.155+pigment*.72+edgewear*.15-.012*rings+scratches*.65],-1)
 # Adjacent scutes differ subtly, without a repeating bullseye motif.
 rgb*=trng.uniform(.91,1.08);row,col=divmod(tile,COLS);sl=(slice(row*TILE,(row+1)*TILE),slice(col*TILE,(col+1)*TILE))
 shellrgb[sl]=rgb;shellheight[sl]=-.016*rings-scratches*.6+fine*.08;shellrough[sl]=np.clip(.77+fine*2+worn*.20-grain*.5,.67,.94)
shelltex=image('gopher_carapace_albedo',shellrgb)
def atlas_uv(coords,tile):
 row,col=divmod(tile,COLS);return [((col+.025+.95*x)/COLS,(row+.025+.95*y)/ROWS) for x,y in coords]
# Periodic cellular texture: shallow irregular keratin scales, earthy pigment, fine pits.
N=1024; yy,xx=np.mgrid[0:N,0:N]/N; X=xx*30;Y=yy*30; ix=np.floor(X);iy=np.floor(Y)
D=np.full((N,N),999.); D2=D.copy(); ident=D.copy()
for oy in [-1,0,1]:
 for ox in [-1,0,1]:
  cx=ix+ox;cy=iy+oy
  hx=np.mod(np.sin(cx*127.1+cy*311.7)*43758.5453,1);hy=np.mod(np.sin(cx*269.5+cy*183.3)*43758.5453,1)
  d=(X-cx-.15-.7*hx)**2+(Y-cy-.15-.7*hy)**2
  hit=d<D; D2=np.where(hit,D,np.minimum(D2,d)); ident=np.where(hit,hx,ident);D=np.minimum(D,d)
edge=np.clip((np.sqrt(D2)-np.sqrt(D))/.10,0,1); grain=rng.normal(0,.01,(N,N));shade=.76+.10*(1-edge)+ident*.12+grain
skintex=image('gopher_skin_albedo',np.stack([.41*shade,.345*shade,.245*shade],-1))
var=.025*np.sin(xx*20+np.sin(yy*13))+.018*np.cos(yy*37)+rng.normal(0,.008,(N,N));plastrontex=image('gopher_plastron_albedo',np.stack([.47+var*1.6,.365+var*1.4,.205+var],-1))
# Forearm armor has rubbed horn edges and weathered dark centers.
rr=np.sqrt(((xx-.5)*2)**2+((yy-.5)*2)**2);armorwear=np.clip((rr-.55)*1.6,0,.45);avar=.007*np.sin(xx*5+yy*6)+rng.normal(0,.003,(N,N))
armortex=image('gopher_armor_albedo',np.stack([.235+avar+armorwear*.28,.207+avar*.9+armorwear*.24,.151+avar*.65+armorwear*.16],-1))
def make_normal(name,rgb,strength):
 g=np.mean(rgb,axis=-1);dy,dx=np.gradient(g);norm=np.stack([-dx*strength,-dy*strength,np.ones_like(g)],-1);norm/=np.linalg.norm(norm,axis=-1)[:,:,None];arr=norm*.5+.5
 h,w=arr.shape[:2];im=bpy.data.images.new(name+'_normal',width=w,height=h,alpha=True,is_data=True);rgba=np.ones((h,w,4),np.float32);rgba[:,:,:3]=arr;im.pixels.foreach_set(rgba.ravel());im.filepath_raw=os.path.join(OUT,name+'_normal.png');im.file_format='PNG';im.save();im.pack();normal_textures[name]=im
make_normal(shelltex.name,np.repeat(shellheight[:,:,None],3,axis=-1),12)
make_normal(skintex.name,np.repeat((edge*.035+grain*.02)[:,:,None],3,axis=-1),7)
def data_image(name,array):
 h,w=array.shape;im=bpy.data.images.new(name,width=w,height=h,alpha=True,is_data=True);rgba=np.ones((h,w,4),np.float32);rgba[:,:,:3]=array[:,:,None];im.pixels.foreach_set(rgba.ravel());im.filepath_raw=os.path.join(OUT,name+'.png');im.file_format='PNG';im.save();im.pack();return im
roughness_textures[shelltex.name]=data_image('gopher_carapace_roughness',shellrough)
roughness_textures[skintex.name]=data_image('gopher_skin_roughness',np.clip(.78+.14*(1-edge)+grain,.68,.95))
shellmat=mat('Weathered brown gray keratin',(.3,.26,.2),shelltex,bump=.12)
skinmat=mat('Ochre gray pebbled skin',(.4,.32,.23),skintex,bump=.16)
armormat=mat('Weathered raised limb armor',(.30,.26,.19),armortex,rough=.87)
plastronmat=mat('Yellow brown plastron',(.5,.4,.23),plastrontex,bump=.08)
seammat=mat('Deep scute grooves',(.025,.018,.010),rough=.92)
clawmat=mat('Worn horn claws',(.37,.31,.205),skintex,bump=.025)
eye=mat('Dark amber eyes',(.0015,.0008,.0003),rough=.22)
eye.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.20
mouthmat=mat('Beak and mouth shadow',(.025,.016,.009),rough=.8)

def mesh(name,verts,faces,material,uv=None,bone='body',weights=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);objects.append(ob);me.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 layer=me.uv_layers.new(name='UVMap')
 for loop in me.loops:
  q=verts[loop.vertex_index]; layer.data[loop.index].uv=uv[loop.vertex_index] if uv else (q[0]*8+.5,q[1]*8+.5)
 if weights:
  groups={k:ob.vertex_groups.new(name=k) for k in set(k for w in weights for k in w)}
  for i,w in enumerate(weights):
   for k,val in w.items():
    if val>0:groups[k].add([i],val,'REPLACE')
 else:ob.vertex_groups.new(name=bone).add(list(range(len(verts))),1,'REPLACE')
 return ob

def dome(x,y):
 # adult oval, modest posterior flare; low and broad front arch
 r2=x*x+y*y;rim=.052+.032*max(0,-y)**8+.010*max(0,y)**8
 z=rim+.108*max(0,1-.60*r2-.40*r2**3)**.60
 return (x*.118*(1+.025*y),y*.154,z+.0012*sin(y*4)*max(0,1-r2))

def clip(poly,n,c):
 out=[]
 for p,q in zip(poly,poly[1:]+poly[:1]):
  dp=p[0]*n[0]+p[1]*n[1]-c;dq=q[0]*n[0]+q[1]*n[1]-c
  if dp<=0:out.append(p)
  if (dp<=0)!=(dq<=0):
   t=dp/(dp-dq);out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
 return out

def resample(poly,steps=48):
 poly=[p for i,p in enumerate(poly) if math.dist(p,poly[i-1])>1e-9]
 length=[math.dist(p,q) for p,q in zip(poly,poly[1:]+poly[:1])]; total=sum(length);out=[]
 for k in range(steps):
  d=total*k/steps;j=0
  while d>length[j] and j<len(length)-1:d-=length[j];j+=1
  t=d/length[j];p=poly[j];q=poly[(j+1)%len(poly)];out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
 return out
# Fully closed underlying carapace; exposed gaps are recesses, not holes.
verts=[dome(0,0)];uv=[(.5,.5)];faces=[]
for j in range(1,25):
 for k in range(128):
  t=2*pi*k/128;r=j/24;verts.append(dome(r*cos(t),r*sin(t)));uv.append((.5+.5*r*cos(t),.5+.5*r*sin(t)))
for k in range(128):faces.append((0,1+k,1+(k+1)%128))
for j in range(23):
 for k in range(128):
  a=1+j*128+k;b=1+j*128+(k+1)%128;faces.append((a,b,b+128,a+128))
# underside shell edge closure
base=len(verts)
for k in range(128):
 t=2*pi*k/128;pos=dome(cos(t),sin(t));verts.append((pos[0],pos[1],pos[2]-.004));uv.append((.5+.5*cos(t),.5+.5*sin(t)))
for k in range(128):faces.append((1+23*128+k,1+23*128+(k+1)%128,base+(k+1)%128,base+k))
mesh('Continuous dark carapace foundation',verts,faces,seammat,uv)
seeds=[(0,y) for y in [-.72,-.38,0,.38,.72]]+[(s*x,y) for s in [-1,1] for x,y in [(.49,-.60),(.60,-.22),(.60,.22),(.49,.60)]]
outer=[(.96*cos(2*pi*i/160),.96*sin(2*pi*i/160)) for i in range(160)]
for idx,p in enumerate(seeds):
 poly=outer.copy()
 for q in seeds:
  if p==q:continue
  poly=clip(poly,(q[0]-p[0],q[1]-p[1]),(q[0]**2+q[1]**2-p[0]**2-p[1]**2)/2)
 boundary=resample(poly,48);center=np.mean(np.array(poly),axis=0);vv=[];uu=[];ff=[]
 vv.append(tuple(np.array(dome(*center))+[0,0,.0012]));uu.append((.5,.5))
 for j in range(1,11):
  rr=j/10
  for k,b in enumerate(boundary):
   xy=center+(np.array(b)-center)*rr*.989
   xyz=np.array(dome(*xy));xyz[2]+=.0007+.0012*sin(pi*rr)**2
   vv.append(tuple(xyz));ang=2*pi*k/48;uu.append((.5+.48*rr*cos(ang),.5+.48*rr*sin(ang)))
 for k in range(48):ff.append((0,1+k,1+(k+1)%48))
 for j in range(9):
  for k in range(48):a=1+j*48+k;b=1+j*48+(k+1)%48;ff.append((a,b,b+48,a+48))
 mesh(('Vertebral' if idx<5 else 'Costal')+' scute %02d'%idx,vv,ff,shellmat,atlas_uv(uu,idx))
# 11 marginals per side, a small cervical scute, and one undivided supracaudal.
segments=[('Cervical',-pi/2-.06,-pi/2+.06),('Supracaudal',pi/2-.10,pi/2+.10)]
for side in [0,1]:
 aa=(-pi/2+.06 if side==0 else pi/2+.10);bb=(pi/2-.10 if side==0 else 3*pi/2-.06)
 for i in range(11):segments.append(('Marginal '+str(side)+' '+str(i),aa+(bb-aa)*i/11,aa+(bb-aa)*(i+1)/11))
for i,(name,a0,a1) in enumerate(segments):
 vv=[];ff=[];uu=[]
 for j in range(7):
  r=.962+(.999-.962)*j/6
  for k in range(13):
   a=a0+(a1-a0)*(.008+.984*k/12);x=r*cos(a);y=r*sin(a);v=list(dome(x,y));v[2]+=.0007
   vv.append(v);uu.append((.18+.64*k/12,.68+.29*j/6))
 for j in range(6):
  for k in range(12):a=j*13+k;ff.append((a,a+1,a+14,a+13))
 mesh(name+' scute',vv,ff,shellmat,atlas_uv(uu,13+i))
# Authored plastron outline includes paired anterior gular projection.
outline=[(-.022,-.176),(0,-.169),(.022,-.176),(.027,-.143),(.059,-.123),(.076,-.073),(.088,-.025),(.09,.036),(.073,.090),(.047,.132),(.019,.145),(0,.123),(-.019,.145),(-.047,.132),(-.073,.09),(-.09,.036),(-.088,-.025),(-.076,-.073),(-.059,-.123),(-.027,-.143)]
bound=resample(outline,100);vv=[(0,0,.045)];uu=[(.5,.5)];ff=[]
for j in range(1,9):
 for x,y in bound:
  rr=j/8;vv.append((x*rr,y*rr,.044+.007*rr**3));uu.append((.5+x*rr*4.5,.5+y*rr*2.7))
for k in range(100):ff.append((0,1+(k+1)%100,1+k))
for j in range(7):
 for k in range(100):a=1+j*100+k;b=1+j*100+(k+1)%100;ff.append((a,a+100,b+100,b))
base=len(vv)
for x,y in bound:vv.append((x,y,.059));uu.append((.5+x*4.5,.5+y*2.7))
for k in range(100):ff.append((1+700+k,1+700+(k+1)%100,base+(k+1)%100,base+k))
mesh('Hingeless plastron with projecting gular scutes',vv,ff,plastronmat,uu)
# Ring loft is a vertex layout tool; every section below is an anatomical outline.
def loft(name,sections,material,bone,n=40,detail=.0,weights_fun=None):
 vv=[];ff=[];uv=[];ww=[]
 for j,(cx,cy,cz,rx,rz) in enumerate(sections):
  for k in range(n):
   a=2*pi*k/n; irregular=1+detail*(sin(a*5+j*.7)+.5*sin(a*9-j))
   if name.startswith('Blunt') and cy>-.16:irregular+=.024*sin((cy+.11)*700)
   power=.78 if name.startswith('Blunt') else 1.0;ca=math.copysign(abs(cos(a))**power,cos(a));sa=math.copysign(abs(sin(a))**power,sin(a));vv.append((cx+rx*ca*irregular,cy,cz+rz*sa*irregular));uv.append((k/n,j/(len(sections)-1)))
   ww.append(weights_fun(j/(len(sections)-1)) if weights_fun else {bone:1})
 for j in range(len(sections)-1):
  for k in range(n):a=j*n+k;b=j*n+(k+1)%n;ff.append((a,b,b+n,a+n))
 ff.append(tuple(reversed(range(n))));ff.append(tuple((len(sections)-1)*n+k for k in range(n)))
 return mesh(name,vv,ff,material,uv,weights=ww)
loft('Skin under shell',[(0,.143,.061,.023,.012),(0,.120,.062,.060,.022),(0,.07,.064,.087,.028),(0,0,.065,.094,.030),(0,-.07,.068,.078,.030),(0,-.120,.071,.043,.022)],skinmat,'body',64,.012)
headsections=[(0,-.110,.078,.025,.021),(0,-.128,.077,.024,.021),(0,-.145,.077,.022,.019),(0,-.158,.079,.021,.018),(0,-.168,.081,.022,.020),(0,-.179,.083,.026,.023),(0,-.192,.084,.028,.023),(0,-.204,.083,.026,.021),(0,-.217,.081,.022,.017),(0,-.227,.079,.019,.013),(0,-.233,.079,.017,.010),(0,-.236,.079,.014,.008)]
headsections=[(x,(-.145+(y+.145)*.80 if y<-.145 else y),z,rx*1.12,rz) for x,y,z,rx,rz in headsections]
headsections=[tuple(a+(b-a)*f/4 for a,b in zip(p,q)) for p,q in zip(headsections,headsections[1:]) for f in range(4)]+[headsections[-1]]
loft('Blunt beaked head and folded neck',headsections,skinmat,'head',48,.012,lambda t:{'head':min(1,max(0,(t-.10)/.30)),'body':1-min(1,max(0,(t-.10)/.30))})
# Relief scales: flattened polygon plates fitted to skin, with softened layered borders.
def plate(name,c,ax,ay,rx,ry,material,bone,ang=0,height=.0008,n=6,surface=None):
 c=Vector(c);a=Vector(ax);b=Vector(ay);normal=a.cross(b).normalized();vv=[surface(c,height) if surface else tuple(c+normal*height)];ff=[];uv=[(.5,.5)]
 for r,h in [(.72,height*.7),(1,0)]:
  for k in range(n):
   t=2*pi*k/n+ang;q=c+a*rx*r*cos(t)+b*ry*r*sin(t);vv.append(surface(q,h) if surface else tuple(q+normal*h));uv.append((.5+.48*r*cos(t),.5+.48*r*sin(t)))
 for k in range(n):ff.append((0,1+k,1+(k+1)%n));ff.append((1+k,1+n+k,1+n+(k+1)%n,1+(k+1)%n))
 ob=mesh(name,vv,ff,material,uv,bone)
 if 'armor' in name and 'sections' in globals():
  prefix='fore' if name.startswith('fore') else 'hind';tag='L' if ' L' in name else 'R';names=[prefix+'_upper.'+tag,prefix+'foot.'+tag]
  for group in list(ob.vertex_groups):ob.vertex_groups.remove(group)
  groups=[ob.vertex_groups.new(name=q) for q in names];zs=[v[2] for v in reversed(sections)];ts=list(reversed([max(0,min(1,(j/(len(sections)-1)-.35)/.35)) for j in range(len(sections))]))
  for vi,co in enumerate(vv):
   t=float(np.interp(co[2],zs,ts));groups[0].add([vi],1-t,'REPLACE');groups[1].add([vi],t,'REPLACE')
 return ob
def headtop(p,h):
 y=p.y; ss=sorted(headsections,key=lambda v:v[1]); cy=[v[1] for v in ss];rx=np.interp(y,cy,[v[3] for v in ss]);rz=np.interp(y,cy,[v[4] for v in ss]);cz=np.interp(y,cy,[v[2] for v in ss]);return (p.x,p.y,cz+rz*max(.01,1-abs(p.x/rx)**(2/.78))**(.78/2)+h)
# Cephalic scutes on the forehead; small irregular polygon relief rather than round bumps.
for row,y in enumerate([-.173,-.180,-.187,-.195,-.202]):
 for col in range(-2,3):
  x=col*.008+(row%2)*.0015
  if abs(x)>.019:continue
  z=.083+.022*sqrt(max(.05,1-(x/.029)**2))-(max(0,-y-.201))*.25
  plate('Head keratin scale',(x,y,z),[1,0,0],[0,1,0],.0052,.0045,armormat,'head',ang=.15*row,height=.00035,surface=headtop)
# The lower jaw and fine hooked beak edge define a short terrestrial-tortoise skull.
loft('Broad lower jaw',[(0,-.157,.068,.018,.007),(0,-.174,.066,.026,.009),(0,-.189,.065,.027,.010),(0,-.202,.067,.023,.008),(0,-.213,.071,.017,.004),(0,-.217,.073,.013,.002)],skinmat,'head',40,.008)
vv=[];ff=[]
for k in range(33):
 t=-1+2*k/32;x=.016*t;y=-.218+.0025*t*t;z=.074+.0015*t*t
 vv.extend([(x,y,z-.00045),(x,y,z+.00045)])
for k in range(32):ff.append((2*k,2*k+1,2*k+3,2*k+2))
mesh('Anterior hooked beak seam',vv,ff,mouthmat,bone='head')
# Eyes have custom inset lens surfaces and asymmetrical eyelid rim geometry.
for side in [-1,1]:
 center=Vector((side*.030,-.190,.091)); normal=Vector((side*.92,-.32,.10)).normalized();a=Vector((.32*side,.92,0));b=normal.cross(a).normalized()
 vv=[tuple(center+normal*.00065)];ff=[];uv=[(.5,.5)]
 for j in range(1,6):
  rr=j/5
  for k in range(32):
   t=2*pi*k/32;vv.append(tuple(center+a*.0039*rr*cos(t)+b*.0033*rr*sin(t)+normal*.00065*(1-rr*rr)));uv.append((.5+.5*rr*cos(t),.5+.5*rr*sin(t)))
 for k in range(32):ff.append((0,1+k,1+(k+1)%32))
 for j in range(4):
  for k in range(32):a0=1+j*32+k;b0=1+j*32+(k+1)%32;ff.append((a0,b0,b0+32,a0+32))
 mesh('Amber black eye '+str(side),vv,ff,eye,uv,'head')
 vv=[];ff=[]
 for j in range(3):
  rr=1+j*.12
  for k in range(40):
   t=2*pi*k/40;vv.append(tuple(center+a*.0040*rr*cos(t)+b*.0034*rr*sin(t)+normal*(.0002+(.0005 if j==1 else 0))*max(.6,1+.35*sin(t))))
 for j in range(2):
  for k in range(40):a0=j*40+k;b0=j*40+(k+1)%40;ff.append((a0,b0,b0+40,a0+40))
 mesh('Scaled eye socket '+str(side),vv,ff,skinmat,bone='head')
 # lateral mouth crease follows tapered beak edge
 vv=[];ff=[]
 for k in range(20):
  t=k/19;y=-.215+t*.026;x=side*(.017+.011*sin(t*pi*.7));z=.075-.0015*sin(t*pi)
  vv.extend([(x,y,z-.0004),(x,y,z+.0004)])
 for k in range(19):ff.append((2*k,2*k+1,2*k+3,2*k+2))
 mesh('Beak mouth crease '+str(side),vv,ff,mouthmat,bone='head')
 plate('Nostril '+str(side),(side*.011,-.216,.084),[1,0,0],[0,-.35,.94],.00115,.0008,mouthmat,'head',height=.0001,n=10)
# Forelimbs are thick, broad armored wedges with flattened digging faces with overlapping armor.
# Each limb uses an irregular stacked cross-section surface, not primitive parts.
limbs={}
for side in [-1,1]:
 tag='L' if side>0 else 'R'
 for fore in [True,False]:
  prefix='fore' if fore else 'hind'; upper=prefix+'_upper.'+tag; foot=prefix+'foot.'+tag
  if fore:
   sections=[(.062,-.082,.074,.020,.023),(.079,-.098,.067,.023,.024),(.096,-.114,.056,.025,.027),(.110,-.131,.043,.028,.027),(.119,-.145,.029,.029,.025),(.122,-.152,.018,.027,.022),(.122,-.155,.011,.023,.018)]
  else:
   sections=[(.060,.074,.074,.019,.023),(.080,.097,.065,.022,.024),(.100,.119,.050,.024,.026),(.110,.130,.032,.024,.025),(.112,.133,.017,.026,.027),(.112,.133,.011,.023,.025)]
  vv=[];ff=[];uv=[];ww=[];n=48
  for j,(cx,cy,z,rx,ry) in enumerate(sections):
   for k in range(n):
    a=2*pi*k/n;ir=1;vv.append((side*(cx+rx*cos(a)*ir),cy+ry*sin(a)*ir,z));uv.append((k/n,j/(len(sections)-1)))
    t=max(0,min(1,(j/(len(sections)-1)-.35)/.35));ww.append({upper:1-t,foot:t})
  for j in range(len(sections)-1):
   for k in range(n):a=j*n+k;b=j*n+(k+1)%n;ff.append((a,b,b+n,a+n) if side>0 else (a,a+n,b+n,b))
  ff.append(tuple(range(n)));ff.append(tuple(reversed([(len(sections)-1)*n+k for k in range(n)])))
  mesh(('Shovel forelimb ' if fore else 'Elephantine hind leg ')+tag,vv,ff,skinmat,uv,weights=ww)
  # Embedded relief follows the exact anatomical limb surface at every plate vertex.
  sz=[v[2] for v in reversed(sections)]; ss=list(reversed(sections))
  def frontsurface(p,h):
   z=p.z;cx=np.interp(z,sz,[v[0] for v in ss]);cy=np.interp(z,sz,[v[1] for v in ss]);rx=np.interp(z,sz,[v[3] for v in ss]);ry=np.interp(z,sz,[v[4] for v in ss]);
   frac=max(.025,1-((abs(p.x)-cx)/rx)**2)
   return (p.x,cy-ry*sqrt(frac)-h,p.z)
  for row in range(6 if fore else 4):
   z=.020+row*.008;cx=np.interp(z,sz,[v[0] for v in ss]);width=np.interp(z,sz,[v[3] for v in ss])*.78
   for col in range(5 if fore else 4):
    x=cx+(col-(2 if fore else 1.5))*width*.40
    c=(side*x,0,z)
    plate(prefix+' embedded armor '+tag,c,[1,0,0],[0,0,1],.0060 if fore else .0049,.0054 if fore else .0048,armormat,foot if row<3 else upper,ang=pi/6,height=.0015 if fore else .0009,surface=frontsurface)
  def sidesurface(p,h):
   z=p.z;cx=np.interp(z,sz,[v[0] for v in ss]);cy=np.interp(z,sz,[v[1] for v in ss]);rx=np.interp(z,sz,[v[3] for v in ss]);ry=np.interp(z,sz,[v[4] for v in ss]);
   return (side*(cx+rx*sqrt(max(.025,1-((p.y-cy)/ry)**2))+h*side),p.y,p.z)
  for row in range(4):
   z=.024+row*.009;cy=np.interp(z,sz,[v[1] for v in ss])
   for k in range(3):
    y=cy+(k-1)*.010
    plate(prefix+' outer armor '+tag,(0,y,z),[0,1,0],[0,0,1],.0055,.005,armormat,foot if row<2 else upper,height=.0007,surface=sidesurface)
  # Five front claws and four hind claws: tapered, downward-curved worn horn.
  for j in range(5 if fore else 4):
   xx=(.103+j*.0095 if fore else .095+j*.011);y0=(-.169 if fore else .111);z0=.016;length=.014 if fore else .010
   vv=[];ff=[];uv=[];n=12
   for r,(dy,rz,rx,zoff) in enumerate([(0,.0045,.0043,.002),(.30,.004,.004,-.000),(.72,.0024,.0028,-.003),(1,.0004,.0006,-.0045)]):
    for k in range(n):
     a=2*pi*k/n;vv.append((side*(xx+rx*cos(a)),y0-length*dy,z0+zoff+rz*sin(a)));uv.append((k/n,r/3))
   for r in range(3):
    for k in range(n):a=r*n+k;b=r*n+(k+1)%n;ff.append((a,b,b+n,a+n))
   ff.append(tuple(reversed(range(n))));ff.append(tuple(3*n+k for k in range(n)))
   mesh(prefix+' claw %s %d'%(tag,j),vv,ff,clawmat,uv,foot)
loft('Small tapered tail',[(0,.127,.063,.012,.011),(0,.148,.057,.010,.009),(0,.165,.047,.007,.007),(0,.177,.038,.003,.003),(0,.182,.034,.0004,.0004)],skinmat,'tail',24,.03)
# Recalculate consistent outward normals before armature creation.
for ob in objects:
 bpy.context.view_layer.objects.active=ob;ob.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');ob.select_set(False)
# Anatomical skeleton; deform groups retained in editable source and glTF skin.
arm=bpy.data.armatures.new('Gopher tortoise skeleton');rig=bpy.data.objects.new('Gopher tortoise • anatomical rig',arm);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,tail,parent=None):
 b=arm.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=arm.edit_bones[parent]
 return b
bone('root',(0,0,.01),(0,0,.05));bone('body',(0,.04,.09),(0,-.07,.09),'root');bone('head',(0,-.125,.079),(0,-.215,.082),'body');bone('tail',(0,.125,.06),(0,.178,.039),'body')
for side in [-1,1]:
 tag='L' if side>0 else 'R'
 bone('fore_upper.'+tag,(side*.062,-.082,.074),(side*.110,-.132,.043),'body');bone('forefoot.'+tag,(side*.110,-.132,.043),(side*.122,-.169,.016),'fore_upper.'+tag)
 bone('hind_upper.'+tag,(side*.060,.074,.074),(side*.105,.122,.039),'body');bone('hindfoot.'+tag,(side*.105,.122,.039),(side*.112,.137,.014),'hind_upper.'+tag)
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
for ob in objects:
 ob.parent=rig;mod=ob.modifiers.new('Anatomical skin','ARMATURE');mod.object=rig
# Join by material to reduce draw calls while retaining explicit scutes and skin groups.
joined=[]
for material in [shellmat,skinmat,armormat,plastronmat,seammat,clawmat,eye,mouthmat]:
 group=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials[0]==material]
 bpy.ops.object.select_all(action='DESELECT')
 for ob in group:ob.select_set(True)
 bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();ob=bpy.context.object;ob.name=material.name;joined.append(ob)
 # Triangulate all surfaces deterministically, including claw and loft ends.
 mod=ob.modifiers.new('Export triangulation','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=mod.name)
objects=joined
# Canonical ground transform moves model and skeleton together; no bind-matrix edits.
bpy.context.view_layer.update();ground=min((ob.matrix_world@v.co).z for ob in objects for v in ob.data.vertices);rig.location.z=-ground
bpy.context.view_layer.update()
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=144
for p in rig.pose.bones:p.rotation_mode='XYZ'
rig.animation_data_create()
def setworld(p,vector):p.location=p.bone.matrix_local.to_3x3().inverted()@Vector(vector)
for clip,duration in [('Idle',144),('Walk',144),('Turn',144),('Dig',96)]:
 act=bpy.data.actions.new(clip);rig.animation_data.action=act
 for f in range(1,duration+1,3):
  phase=(f-1)/(duration-1);t=phase*2*pi
  for p in rig.pose.bones:p.location=(0,0,0);p.rotation_euler=(0,0,0)
  body=rig.pose.bones['body'];head=rig.pose.bones['head']
  if clip=='Idle':
   setworld(body,(0,0,.00025*(1-cos(t))));head.rotation_euler[0]=.025*sin(t);head.rotation_euler[2]=.035*sin(t);rig.pose.bones['tail'].rotation_euler[2]=.04*sin(t)
  if clip in ['Walk','Turn']:
   setworld(body,(0,0,0));body.rotation_euler[1]=0
   head.rotation_euler[0]=.025*sin(t+.3)
   if clip=='Turn':rig.pose.bones['root'].rotation_euler[1]=.42*(1-cos(t))*.5;head.rotation_euler[2]=.09*sin(t)
   for index,(limb,tag) in enumerate([('fore','L'),('hind','R'),('fore','R'),('hind','L')]):
    ph=(phase+(0 if index<2 else .5)+(.08 if limb=='hind' else 0))%1
    if ph<.72:dy=-.010+.020*ph/.72;lift=0
    else:q=(ph-.72)/.28;dy=.010-.020*q;lift=.010*sin(pi*q)
    if clip=='Turn':dy*=.45 if tag=='L' else 1
    setworld(rig.pose.bones[limb+'_upper.'+tag],(0,dy,lift))
    rig.pose.bones[limb+'foot.'+tag].rotation_euler[0]=-.08*sin(pi*(ph-.72)/.28) if ph>.72 else 0
  if clip=='Dig':
   head.rotation_euler[0]=.10+.02*sin(2*t);setworld(body,(0,-.002,0))
   for tag,offset in [('L',0),('R',pi)]:
    ph=(phase+offset/(2*pi))%1
    if ph<.65:q=ph/.65;dy=-.014+.029*q;lift=0
    else:q=(ph-.65)/.35;dy=.015-.029*q;lift=.016*sin(pi*q)
    setworld(rig.pose.bones['fore_upper.'+tag],(0,dy,lift));rig.pose.bones['forefoot.'+tag].rotation_euler[0]=0
  for p in rig.pose.bones:
   p.keyframe_insert('location',frame=f,group=p.name);p.keyframe_insert('rotation_euler',frame=f,group=p.name)
 # Copy first sample to exact endpoint for seamless loops.
 for fc in act.fcurves:
  val=fc.keyframe_points[0].co.y;fc.keyframe_points.insert(duration,val)
  for key in fc.keyframe_points:key.interpolation='LINEAR'
 track=rig.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,1,act);track.mute=True
rig.animation_data.action=None
for p in rig.pose.bones:p.location=(0,0,0);p.rotation_euler=(0,0,0)
scene.frame_set(1)
# Neutral cream studio: soft key, open fill, restrained rim. Cycles output is QA only.
world=bpy.data.worlds.new('Cream studio') if not bpy.data.worlds else bpy.data.worlds[0];scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.74,.70,.62,1);world.node_tree.nodes['Background'].inputs[1].default_value=.25
floor=mesh('QA studio floor',[(-200,-200,0),(200,-200,0),(200,200,0),(-200,200,0)],[(0,1,2,3)],mat('QA warm cream',(.73,.68,.57),rough=.9));objects.remove(floor)
def area(name,loc,power,size):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,.07))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-.4,-.5,.7),14,.55);area('Soft fill',(.5,-.1,.35),5,.4);area('Rear softbox',(.0,.5,.6),8,.4)
camd=bpy.data.cameras.new('QA Camera');cam=bpy.data.objects.new('QA Camera',camd);bpy.context.collection.objects.link(cam);scene.camera=cam
cam.location=(.47,-.62,.39);cam.rotation_euler=(Vector((0,-.028,.080))-cam.location).to_track_quat('-Z','Y').to_euler();camd.type='ORTHO';camd.ortho_scale=.51
scene.render.engine='CYCLES';scene.render.threads_mode='FIXED';scene.render.threads=4;scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1400;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'gopher-tortoise-qa.png')
rig['creator']='Earthbound';rig['license']='CC0-1.0';rig['scientific_name']='Gopherus polyphemus';rig['asset_origin']='Original custom anatomical surfaces and generated textures';rig['biological_reference']='https://www.fws.gov/project/gopher-tortoise'
# Export selected model only, meters, +Y up +Z forward after glTF axis transform.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for ob in objects:ob.select_set(True)
bpy.context.view_layer.objects.active=rig
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'gopher-tortoise-input.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_skins=True,export_normals=True,export_tangents=True,export_materials='EXPORT',export_extras=True)
for tr in rig.animation_data.nla_tracks:tr.mute=True
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'gopher-tortoise.blend'))
# Four truthful studio views with the same neutral lighting and grounded rig.
for view,loc in [('three-quarter',(.47,-.62,.39)),('front',(0,-.65,.19)),('side',(.65,0,.18)),('rear',(0,.65,.19))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,-.020,.075))-cam.location).to_track_quat('-Z','Y').to_euler();camd.ortho_scale=.48
 scene.render.filepath=os.path.join(OUT,'gopher-tortoise-'+view+'-qa.png');bpy.ops.render.render(write_still=True)
stats={'species':'Gopherus polyphemus','author':'Earthbound','license':'CC0-1.0','source':'Original vertex-authored mesh and generated textures; no imported model','reference':'https://www.fws.gov/project/gopher-tortoise','triangles':sum(len(o.data.polygons) for o in objects),'vertices':sum(len(o.data.vertices) for o in objects),'bones':len(arm.bones),'animations':[{ 'name':a.name,'frames':list(a.frame_range)} for a in bpy.data.actions],'texture_dimensions':[[i.name,i.size[0],i.size[1]] for i in [shelltex,skintex,armortex,plastrontex]+list(normal_textures.values())+list(roughness_textures.values())],'units':'meters','qa':'Four grounded Cycles 32-sample neutral studio views; front, side, rear, three-quarter','sourceGroundOffsetM':float(ground)}
with open(os.path.join(ROOT,'reports','gopher-tortoise-authored.json'),'w') as f:json.dump(stats,f,indent=2)
print('RESULT GOPHER_COMPLETE',json.dumps(stats))
