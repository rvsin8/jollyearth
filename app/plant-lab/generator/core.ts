import type {PlantSpec,MeshData,PlantGeometry,GenerationRequest} from './types';
type V=[number,number,number];
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a:V,s:number):V=>[a[0]*s,a[1]*s,a[2]*s],sub=(a:V,b:V):V=>add(a,mul(b,-1));
const length=(v:V)=>Math.hypot(...v),unit=(v:V):V=>mul(v,1/(length(v)||1)),cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export function randomSeed(seed:number){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
class MeshBuilder{
 p:number[]=[];n:number[]=[];uv:number[]=[];i:number[]=[];
 vertex(p:V,n:V=[0,1,0],uv=[0,0]){this.p.push(...p);this.n.push(...n);this.uv.push(...uv);return this.p.length/3-1}
 triangle(a:V,b:V,c:V){const n=unit(cross(sub(b,a),sub(c,a))),i=this.vertex(a,n);this.vertex(b,n);this.vertex(c,n);this.i.push(i,i+1,i+2)}
 quad(a:V,b:V,c:V,d:V){const n=unit(cross(sub(b,a),sub(c,a))),i=this.vertex(a,n,[0,0]);this.vertex(b,n,[1,0]);this.vertex(c,n,[1,1]);this.vertex(d,n,[0,1]);this.i.push(i,i+1,i+2,i,i+2,i+3)}
 tube(a:V,b:V,r0:number,r1:number,sides=6){const d=unit(sub(b,a)),u=unit(cross(d,Math.abs(d[1])>.9?[1,0,0]:[0,1,0])),v=cross(d,u),base=this.p.length/3;for(const [p,r]of [[a,r0],[b,r1]] as [V,number][]){for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2,n=add(mul(u,Math.cos(angle)),mul(v,Math.sin(angle)));this.vertex(add(p,mul(n,r)),n,[j/sides,p[1]])}}for(let j=0;j<sides;j++){const q=base+j,z=q+sides+1;this.i.push(q,z,q+1,q+1,z,z+1)}}
 finish():MeshData{return{positions:new Float32Array(this.p),normals:new Float32Array(this.n),uvs:new Float32Array(this.uv),indices:new Uint32Array(this.i)}}
}
type Node={p:V;parent:number;children:number[];radius:number;depth:number};
export function generatePlant({spec:s,seed,lod,leafLimit}:GenerationRequest):PlantGeometry{
 const start=performance.now(),rand=randomSeed(seed),wood=new MeshBuilder(),blades=new MeshBuilder(),flowers=new MeshBuilder(),fruit=new MeshBuilder(),silhouette=new MeshBuilder(),leaves:number[]=[];
 const quality=lod===0?1:.28,H=.9+rand()*.2,W=s.crownWidthRatio,Hm=H*s.matureHeightM,limit=Math.max(0,Math.min(leafLimit??(lod===0?2600:128),lod===0?3000:128));
 let nodes:Node[]=[],pipeError=0;
 const pick=(a:number,b:number)=>a+(b-a)*rand();
 function leaf(p:V,dir:V,size:number,widthRatio=.5){if(leaves.length/16>=5000)return;const y=unit(dir),u=unit(cross(y,Math.abs(y[1])>.9?[1,0,0]:[0,1,0])),v=cross(y,u),angle=rand()*Math.PI*2,x=add(mul(u,Math.cos(angle)),mul(v,Math.sin(angle))),z=cross(x,y);const sx=size*widthRatio,sy=size;leaves.push(x[0]*sx,x[1]*sx,x[2]*sx,0,y[0]*sy,y[1]*sy,y[2]*sy,0,z[0]*size,z[1]*size,z[2]*size,0,...p,1)}
 function arc(origin:V,angle:number,h:number,splay:number,t:number):V{return add(origin,[Math.cos(angle)*splay*t*t,h*(Math.sin(t*1.7)/Math.sin(1.7)),Math.sin(angle)*splay*t*t])}
 function ribbon(path:V[],width:number,angle:number,target:MeshBuilder=blades){for(let j=0;j<path.length-1;j++){const t=j/(path.length-1),t1=(j+1)/(path.length-1),v:V=[Math.cos(angle),.12*Math.sin(t*4),Math.sin(angle)],w=width*Math.pow(Math.sin(Math.PI*(t*.98+.01)),.6),w1=width*Math.pow(Math.sin(Math.PI*(t1*.98+.01)),.6);target.quad(add(path[j],mul(v,-w)),add(path[j],mul(v,w)),add(path[j+1],mul(v,w1)),add(path[j+1],mul(v,-w1)))}}
 function petal(center:V,direction:V,size:number,width:number,target=flowers){const d=unit(direction),side=unit(cross(d,Math.abs(d[1])>.9?[1,0,0]:[0,1,0]));let prev=center;for(let k=1;k<=4;k++){const t=k/4,p=add(center,add(mul(d,size*t),[0,Math.sin(t*Math.PI)*size*.16,0])),w=Math.sin(t*Math.PI)*width,pt=(k-1)/4,pw=Math.sin(pt*Math.PI)*width;target.quad(add(prev,mul(side,-pw)),add(prev,mul(side,pw)),add(p,mul(side,w)),add(p,mul(side,-w)));prev=p}}
 function floralHead(p:V,scale=.055){
  if(!s.hasFlowers)return;
  if(s.slug==='buttonbush'){
   // A head of separate narrow corollas and projecting styles, never a sphere stand-in.
   for(let j=0;j<(lod===0?54:16);j++){const y=1-2*(j+.5)/(lod===0?54:16),a=j*2.39996,d:V=[Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a)],base=add(p,mul(d,scale*.45));flowers.tube(base,add(p,mul(d,scale)),scale*.018,scale*.006,3);for(let k=0;k<4;k++)petal(add(p,mul(d,scale*.64)),add(d,[Math.cos(k*Math.PI/2)*.45,0,Math.sin(k*Math.PI/2)*.45]),scale*.18,scale*.05)}
  }else if(s.slug==='new-england-aster'){
   for(let j=0;j<(lod===0?22:12);j++){const a=j/(lod===0?22:12)*Math.PI*2;petal(p,[Math.cos(a),.08,Math.sin(a)],scale,scale*.13)}
   // Central disc is custom radial florets; rendered with the separate golden fruit material.
   for(let j=0;j<12;j++){const a=j/12*Math.PI*2;fruit.triangle(p,add(p,[Math.cos(a)*scale*.28,.003,Math.sin(a)*scale*.28]),add(p,[Math.cos(a+.53)*scale*.28,.003,Math.sin(a+.53)*scale*.28]))}
  }else{
   const milk=s.slug.includes('milkweed')||s.slug==='butterfly-weed',count=milk?(lod===0?23:8):5;
   for(let j=0;j<count;j++){const a=j*2.39996,r=milk?Math.sqrt((j+.5)/count)*scale:scale*.35,head=add(p,[Math.cos(a)*r,Math.sqrt(Math.max(0,1-r*r/(scale*scale)))*scale*.32,Math.sin(a)*r]);for(let k=0;k<5;k++){const angle=k/5*Math.PI*2;petal(head,[Math.cos(angle),milk?-.22:.1,Math.sin(angle)],scale*(milk?.23:.7),scale*(milk?.09:.22))}if(milk)for(let k=0;k<5;k++){const angle=k/5*Math.PI*2;petal(head,[Math.cos(angle)*.5,1,Math.sin(angle)*.5],scale*.13,scale*.04)}}
  }
 }
 function fruits(p:V){if(!s.hasFruit||seed%2===1&&['spicebush','eastern-red-cedar'].includes(s.slug))return;for(let j=0;j<3;j++){const center=add(p,[pick(-.018,.018),pick(-.012,.012),pick(-.018,.018)]); // Revolved berry surface with a recessed pole.
 const rings=5,sides=7,r=s.form==='canopy tree'?.006:.012;for(let k=0;k<rings;k++){const a=k/rings*Math.PI,b=(k+1)/rings*Math.PI;for(let q=0;q<sides;q++){const u=q/sides*Math.PI*2,v=(q+1)/sides*Math.PI*2,point=(t:number,z:number):V=>add(center,[Math.sin(t)*Math.cos(z)*r,Math.cos(t)*r*.86,Math.sin(t)*Math.sin(z)*r]);fruit.quad(point(a,u),point(a,v),point(b,v),point(b,u))}}}}
 if(['canopy tree','understory tree','shrub'].includes(s.form)){
  const multi=s.form==='shrub'||s.crownShape.includes('multistem'),stems=multi?3:1,attractors:V[]=[],baseY=multi?.16:.34;
  function node(p:V,parent:number){const index=nodes.length;nodes.push({p,parent,children:[],radius:0,depth:parent<0?0:nodes[parent].depth+1});if(parent>=0)nodes[parent].children.push(index);return index}
  const root=node([0,0,0],-1);
  for(let stem=0;stem<stems;stem++){let parent=root;const angle=stem/stems*Math.PI*2+rand(),lean=multi?.14:.025;for(let k=1;k<=6;k++)parent=node([Math.cos(angle)*lean*k/6,H*baseY*k/6,Math.sin(angle)*lean*k/6],parent)}
  for(let i=0;i<(lod===0?460:125);i++){const y=pick(baseY*.8,1),r=s.crownShape==='narrow-conical'?(1-y)*W*.67:Math.sqrt(Math.max(0,1-Math.pow((y-(baseY+1)/2)/((1-baseY)/2),2)))*W*.53;const a=rand()*Math.PI*2,rad=Math.sqrt(rand())*r;attractors.push([Math.cos(a)*rad,H*y,Math.sin(a)*rad])}
  let active=attractors;
  const step=lod===0?.047:.085,maxNodes=lod===0?640:150;
  for(let round=0;round<(lod===0?36:16)&&active.length&&nodes.length<maxNodes;round++){
   const accum=new Map<number,{dir:V;count:number}>(),remaining:V[]=[];
   for(const point of active){let nearest=-1,best=.35*.35,reached=false;for(let n=0;n<nodes.length;n++){const np=nodes[n].p,dx=point[0]-np[0],dy=point[1]-np[1],dz=point[2]-np[2],sq=dx*dx+dy*dy+dz*dz;if(sq<step*step*1.3){reached=true;break}if(sq<best&&nodes[n].children.length<3){best=sq;nearest=n}}if(reached)continue;remaining.push(point);if(nearest>=0){const a=accum.get(nearest)||{dir:[0,0,0] as V,count:0};a.dir=add(a.dir,unit(sub(point,nodes[nearest].p)));a.count++;accum.set(nearest,a)}}
   active=remaining;if(!accum.size)break;
   for(const [n,a]of accum){if(nodes.length>=maxNodes)break;const parent=nodes[n],d=unit(add(mul(a.dir,1/a.count),[pick(-.065,.065),Math.cos((s.branchAngle||45)*Math.PI/180)*.07,pick(-.065,.065)]));if(parent.children.some(c=>dot(unit(sub(nodes[c].p,parent.p)),d)>.965))continue;node(add(parent.p,mul(d,step)),n)}
  }
  for(let i=nodes.length-1;i>=0;i--){const n=nodes[i];n.radius=n.children.length?Math.sqrt(n.children.reduce((sum,c)=>sum+nodes[c].radius**2,0)):.0017*pick(.8,1.2)*(s.branchTaper||.74)/.74}
  const scale=(multi?.018:.026)/nodes[0].radius;
  for(const n of nodes)n.radius*=scale;
  for(let i=1;i<nodes.length;i++){const n=nodes[i],p=nodes[n.parent];wood.tube(p.p,n.p,p.children.length===1?p.radius:n.radius,n.children.length===0?n.radius*.15:n.radius,lod===0?7:4)}
  for(const n of nodes){if(n.children.length)pipeError=Math.max(pipeError,Math.abs(n.radius*n.radius-n.children.reduce((sum,c)=>sum+nodes[c].radius**2,0)))}
  const terminals=nodes.filter(n=>!n.children.length||n.children.every(c=>!nodes[c].children.length));
  const each=Math.max(1,Math.floor(limit/Math.max(1,terminals.length))),scaleLeaves=s.leafShape==='scale';
  let headCount=0,fruitCount=0;for(const n of terminals){const p=nodes[n.parent],d=unit(sub(n.p,p?.p||[0,0,0]));for(let j=0;j<each;j++){const pos=add(n.p,[pick(-.024,.024),pick(-.02,.02),pick(-.024,.024)]);const size=scaleLeaves?pick(.04,.08):Math.max(.025,Math.min(.1,s.leafSizeCm/100/s.matureHeightM*4))*pick(.8,1.25);leaf(pos,add(d,[pick(-1,1),pick(-.7,.5),pick(-1,1)]),size,scaleLeaves?.65:s.leafShape==='palmate-lobed'?.85:.55)}if(rand()<.5&&headCount++<(lod===0?24:5))floralHead(n.p,s.slug==='buttonbush'?.035:.014);if(rand()<.45&&fruitCount++<(lod===0?30:6))fruits(n.p)}
 }else if(s.form==='grass'){
  const count=Math.floor((s.slug==='switchgrass'?130:100)*quality);
  for(let j=0;j<count;j++){const a=rand()*Math.PI*2,origin:V=[Math.cos(a)*pick(0,.08),0,Math.sin(a)*pick(0,.08)],h=H*pick(.36,.82),splay=W*pick(.15,.65),points=Array.from({length:lod===0?13:7},(_,k)=>arc(origin,a,h,splay,k/(lod===0?12:6)));ribbon(points,s.slug==='switchgrass'?.009:.0048,a+Math.PI/2)}
  for(let j=0;j<Math.floor(18*quality);j++){const a=rand()*6.28,tip:V=[Math.cos(a)*W*.22,H*pick(.82,1),Math.sin(a)*W*.22];wood.tube([tip[0]*.3,0,tip[2]*.3],tip,.002,.0007,4);const open=s.slug==='switchgrass';for(let k=0;k<(open?12:8);k++){const t=k/(open?12:8),base=add(tip,[0,-t*.25,0]),direction=rand()*6.28,end=add(base,[Math.cos(direction)*(open?.1:.025)*(1-t),.025,Math.sin(direction)*(open?.1:.025)*(1-t)]);flowers.tube(base,end,.0008,.0002,3);petal(end,[Math.cos(direction),.4,Math.sin(direction)],open?.012:.024,.004)}}
 }else if(s.form==='fern'){
  const count=lod===0?14:6,christmas=s.slug==='christmas-fern';
  for(let j=0;j<count;j++){const a=j/count*Math.PI*2+pick(-.15,.15),h=H*pick(.65,1),splay=W*pick(.34,.6),points=Array.from({length:17},(_,k)=>arc([0,0,0],a,h,splay,k/16));for(let k=0;k<16;k++)wood.tube(points[k],points[k+1],.0018*(1-k/18),.0015*(1-k/18),4);
   for(let k=3;k<=23;k++){const t=k/25,p=arc([0,0,0],a,h,splay,t),len=Math.sin(t*Math.PI)*pick(.11,.14)*(christmas?.8:1);for(const side of [-1,1]){const angle=a+side*Math.PI*.43;leaf(p,[Math.cos(angle),.2,Math.sin(angle)],len,christmas?.33:.27)}}
  }
  if(!christmas)for(let j=0;j<(lod===0?5:2);j++){const a=rand()*6.28,base:V=[Math.cos(a)*.06,0,Math.sin(a)*.06],tip:V=[base[0],H*.83,base[2]];wood.tube(base,tip,.003,.001,4);for(let k=0;k<16;k++){const p:V=[tip[0],H*(.45+k*.024),tip[2]];petal(p,[Math.cos(k*2.4),.4,Math.sin(k*2.4)],.025,.009,fruit)}}
 }else{
  const count=lod===0?(s.slug==='butterfly-weed'?13:10):4;
  for(let j=0;j<count;j++){const a=j*2.39996,tip:V=[Math.cos(a)*W*pick(.12,.42),H*pick(.65,1),Math.sin(a)*W*pick(.12,.42)],base:V=[tip[0]*.2,0,tip[2]*.2];for(let k=0;k<8;k++){const p=add(base,mul(sub(tip,base),k/8)),q=add(base,mul(sub(tip,base),(k+1)/8));wood.tube(p,q,.0025,.002,5);if(k>1&&k<7){const opposite=s.slug==='swamp-milkweed';for(let side=0;side<(opposite?2:1);side++){const angle=k*2.4+side*Math.PI;leaf(p,[Math.cos(angle),.35,Math.sin(angle)],(s.leafSizeCm/100/s.matureHeightM)*pick(.9,1.15),.28)}}}floralHead(tip,s.slug==='butterfly-weed'?.095:s.slug==='swamp-milkweed'?.065:.052)
  }
 }
 if(leaves.length/16>limit){const original=leaves.slice(),count=original.length/16;leaves.length=0;for(let i=0;i<limit;i++){const index=Math.floor((i+.5)*count/limit)*16;leaves.push(...original.slice(index,index+16))}}
 // Plan LOD projects the generated botanical surfaces, including each leaflet.
 if(lod===2){for(let i=0;i<leaves.length;i+=16){const p:V=[leaves[i+12],.003,leaves[i+14]],x:V=[leaves[i],0,leaves[i+2]],y:V=[leaves[i+4],0,leaves[i+6]];silhouette.quad(add(p,mul(x,-.5)),add(p,mul(y,.5)),add(p,mul(x,.5)),add(p,y))}}
 let maxY=0,maxR=0;for(const m of [wood,blades,flowers,fruit])for(let i=0;i<m.p.length;i+=3){maxY=Math.max(maxY,m.p[i+1]);maxR=Math.max(maxR,Math.hypot(m.p[i],m.p[i+2]))}for(let i=0;i<leaves.length;i+=16){maxY=Math.max(maxY,leaves[i+13]+Math.abs(leaves[i+5]));maxR=Math.max(maxR,Math.hypot(leaves[i+12],leaves[i+14])+Math.hypot(leaves[i+4],leaves[i+6]))}
 return{wood:wood.finish(),blades:blades.finish(),flowers:flowers.finish(),fruit:fruit.finish(),leaves:new Float32Array(leaves),silhouette:silhouette.finish(),seed:seed>>>0,lod,height:maxY,spread:maxR*2,nodes:nodes.length,leafCount:leaves.length/16,generationMs:performance.now()-start,pipeError};
}
