import * as T from 'three';
import type {PlantGeometry,MeshData,PlantSpec,Season} from './types';
import {seasonState} from './season';
function geometry(m:MeshData){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(m.positions,3));g.setAttribute('normal',new T.BufferAttribute(m.normals,3));g.setAttribute('uv',new T.BufferAttribute(m.uvs,2));g.setIndex(new T.BufferAttribute(m.indices,1));g.computeBoundingSphere();return g}
function leafTexture(shape:string,slug:string){const w=64,h=128,bytes=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const t=y/(h-1),u=(x/(w-1)-.5)*2;let width=Math.pow(Math.sin(Math.PI*t),shape==='lance'?.8:.55);if(shape==='palmate-lobed')width*=.55+.45*Math.pow(Math.abs(Math.cos((t-.5)*Math.PI*4)),.6);if(shape==='obovate')width*=.5+.5*t;if(shape==='scale')width*=.52+.48*Math.abs(Math.cos(t*Math.PI*11));if(shape==='pinnate-frond'){width*=.7+.3*Math.abs(Math.cos(t*Math.PI*13));if(slug==='christmas-fern'&&t<.22)width=Math.min(1,width+.2)}const inside=Math.abs(u)<width&&t>.015&&t<.995,vein=Math.abs(u)<.025||Math.abs(((t+Math.abs(u)*.35)*13)%1)<.04,i=(y*w+x)*4;bytes[i]=vein?205:242;bytes[i+1]=vein?221:250;bytes[i+2]=vein?196:236;bytes[i+3]=inside?255:0}const tex=new T.DataTexture(bytes,w,h,T.RGBAFormat);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;return tex}
type Uniform={value:number};
export function plantObject(data:PlantGeometry,s:PlantSpec){
 const root=new T.Group(),materials:T.MeshStandardMaterial[]=[],geometries:T.BufferGeometry[]=[],textures:T.Texture[]=[],uniforms:{time:Uniform;wind:Uniform;density:Uniform;leaf:number}[]=[];
 function material(color:string,leaf=0){const mat=new T.MeshStandardMaterial({color,roughness:1,metalness:0,side:T.DoubleSide});const u={time:{value:0},wind:{value:0},density:{value:1},leaf};uniforms.push(u);mat.onBeforeCompile=shader=>{shader.uniforms.plantTime=u.time;shader.uniforms.plantWind=u.wind;shader.uniforms.plantDensity=u.density;shader.vertexShader='uniform float plantTime;uniform float plantWind;uniform float plantDensity;\n'+(leaf?'attribute float plantRank;\n':'')+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec3 plantAnchor=position;
 #ifdef USE_INSTANCING
 plantAnchor=instanceMatrix[3].xyz;
 #endif
 float distanceFromRoot=length(plantAnchor.xz)+max(0.0,plantAnchor.y)*0.3;
 float sway=plantWind*pow(max(0.0,plantAnchor.y),1.4)*(0.012+distanceFromRoot*0.025);
 #ifndef USE_INSTANCING
 transformed.x+=sin(plantTime*1.3+plantAnchor.y*2.0)*sway;
 transformed.z+=cos(plantTime*0.97+plantAnchor.x*3.0)*sway*0.6;
 #endif
 ${leaf?'float growth=smoothstep(plantRank,plantRank+0.035,plantDensity);transformed*=growth;transformed.z+=sin(plantTime*9.0+plantRank*43.0)*plantWind*0.018*uv.y;':''}
 `);if(leaf)shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',T.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;',`mvPosition.x+=sin(plantTime*1.3+plantAnchor.y*2.0)*sway;mvPosition.z+=cos(plantTime*0.97+plantAnchor.x*3.0)*sway*0.6;mvPosition = modelViewMatrix * mvPosition;`));if(!leaf){shader.fragmentShader='uniform float plantDensity;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
 if(plantDensity < fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453))discard;
 `)}};mat.customProgramCacheKey=()=>`plant-wind-v3-${leaf}`;materials.push(mat);return{mat,u}}
 const wood=material(s.barkColor||'#7A7752'),green=material(s.summerColor),floral=material(s.flowerColor||'#C6AE88'),fruity=material(s.slug==='new-england-aster'?'#C8A238':s.slug==='cinnamon-fern'?'#9B5E34':s.fruitColor||'#977859');
 function add(m:MeshData,mat:T.Material){if(!m.positions.length)return;const g=geometry(m);geometries.push(g);root.add(new T.Mesh(g,mat))}
 if(data.lod===2){const flat=(m:MeshData,y:number)=>{const positions=m.positions.slice(),normals=m.normals.slice();for(let i=0;i<positions.length;i+=3){positions[i+1]=y;normals[i]=0;normals[i+1]=1;normals[i+2]=0}return {...m,positions,normals}};add(flat(data.wood,.001),wood.mat);add(flat(data.blades,.002),green.mat);add(data.silhouette,green.mat);add(flat(data.flowers,.004),floral.mat);add(flat(data.fruit,.005),fruity.mat)}else{
  add(data.wood,wood.mat);add(data.blades,green.mat);add(data.flowers,floral.mat);add(data.fruit,fruity.mat);
  if(data.leafCount){const card=new T.BufferGeometry();card.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,.5,0,0,.5,1,0,-.5,1,0],3));card.setAttribute('normal',new T.Float32BufferAttribute([0,0,1,0,0,1,0,0,1,0,0,1],3));card.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));card.setIndex([0,1,2,0,2,3]);const ranks=Float32Array.from({length:data.leafCount},(_,i)=>((i*0.61803398875)%1)*.96);card.setAttribute('plantRank',new T.InstancedBufferAttribute(ranks,1));const leaves=material(s.summerColor,1),texture=leafTexture(s.leafShape,s.slug);textures.push(texture);leaves.mat.map=texture;leaves.mat.alphaTest=.45;const inst=new T.InstancedMesh(card,leaves.mat,data.leafCount);inst.instanceMatrix.array.set(data.leaves);inst.instanceMatrix.needsUpdate=true;inst.frustumCulled=false;root.add(inst);geometries.push(card)}
 }
 let target=seasonState(s,'summer',data.seed),from={...target},fromColor=new T.Color(target.color),toColor=fromColor.clone(),start=-1000,currentDensity=target.density,currentFlowers=target.flowers,currentFruit=target.fruit;
 function setSeason(season:Season,reduced:boolean){from={...target,density:currentDensity,flowers:currentFlowers,fruit:currentFruit};fromColor=green.mat.color.clone();target=seasonState(s,season,data.seed);toColor=new T.Color(target.color);start=reduced?-1000:performance.now()}
 function update(now:number,wind:boolean,reduced:boolean){const t=reduced?1:Math.min(1,(now-start)/600),f=t*t*(3-2*t);currentDensity=T.MathUtils.lerp(from.density,target.density,f);currentFlowers=T.MathUtils.lerp(from.flowers,target.flowers,f);currentFruit=T.MathUtils.lerp(from.fruit,target.fruit,f);green.mat.color.copy(fromColor).lerp(toColor,f);for(const u of uniforms){u.time.value=reduced?0:now/1000;u.wind.value=!reduced&&wind&&data.lod!==2?1:0;if(u.leaf){u.density.value=currentDensity;materials[uniforms.indexOf(u)].color.copy(green.mat.color)}}green.u.density.value=currentDensity;floral.u.density.value=currentFlowers;fruity.u.density.value=currentFruit;return t<1}
 function dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
 return{root,setSeason,update,dispose,data};
}
