'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {Leaf,PawPrint,Shell} from 'lucide-react';
import {findModel} from './model-records';
import {loadModel} from './model-loader';
import {modelScene,modelBounds,plantFeatures,noCapabilities} from './model-scene';
import {ExternalLink} from "./external-link";

export default function Specimen({species,rotating=true,reset=0,turn=0,zoom=0,season='summer',wind=false,individual=0,onState,onCapabilities,onInput,scaleVisible=false}:any){
 const host=useRef<HTMLDivElement>(null),scaleRef=useRef<HTMLElement>(null),live=useRef<any>({});
 live.current={rotating,reset,turn,zoom,season,wind,onState,onCapabilities,onInput};
 const model=findModel(species.id,species.scientific),[state,setState]=useState('loading'),[attempt,setAttempt]=useState(0);
 const measurement=model?.dimensions;const mature=species.form&&species.height?.length?species.height.join('–')+' ft at maturity':null;
 const name=model?.commonName||species.name;
 const Silhouette=model?.silhouette==='shell'?Shell:model?.kind==='plant'||species.form?Leaf:PawPrint;
 useEffect(()=>{
  const el=host.current;let cancelled=false,raf=0;
  function status(value:string){if(cancelled)return;setState(value);if(value==='failed'&&species.image){const photo=new Image();const ready=()=>{if(!cancelled)live.current.onState?.(value)};photo.onload=ready;photo.onerror=ready;photo.src=species.image}else live.current.onState?.(value)}
  live.current.onCapabilities?.(noCapabilities);
  if(!el||!model){status('failed');return}
  status('loading');let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch{status('failed');return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;el.appendChild(renderer.domElement);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',name+' 3D model. Arrow keys rotate 15 degrees; plus and minus zoom; Home or double-click resets. Shift-drag pans.');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.01,100);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=true;controls.enableDamping=true;controls.dampingFactor=.12;controls.minPolarAngle=.05;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=3;controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  scene.add(new THREE.HemisphereLight(0xffffff,0xe9e7e2,2));
  const key=new THREE.DirectionalLight(0xffffff,1.2);key.position.set(-3,7,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,.8);fill.position.set(4,3,4);scene.add(fill);const rim=new THREE.DirectionalLight(0xffffff,.35);rim.position.set(0,4,-5);scene.add(rim);
  // A feathered contact patch, separate from the specimen. No directional cast shadow.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const ctx=shadowCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(35,31,25,0.18)');gradient.addColorStop(.4,'rgba(35,31,25,0.10)');gradient.addColorStop(1,'rgba(35,31,25,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.01;scene.add(ground);
  const anchor=new THREE.Group();scene.add(anchor);
  let root:THREE.Object3D|undefined,mixer:THREE.AnimationMixer|undefined,features:ReturnType<typeof plantFeatures>|undefined;
  let fitDistance=6,radius=1.5,active=false,resume=0,last=0,prevReset=reset,prevTurn=turn,prevZoom=zoom,lastSeason='',manualStop=!rotating,priorRotating=rotating;let resetTween:{start:number;position:THREE.Vector3;target:THREE.Vector3}|null=null;const defaultPosition=new THREE.Vector3(),defaultTarget=new THREE.Vector3(0,1.4,0);const ownedTextures=new Set<THREE.Texture>();
  const foliage:{o:THREE.Object3D;z:number}[]=[];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function clearMomentum(){const position=camera.position.clone(),target=controls.target.clone(),damping=controls.enableDamping;controls.autoRotate=false;controls.enableDamping=false;controls.update();camera.position.copy(position);controls.target.copy(target);controls.update();controls.enableDamping=damping}
  function pause(){if(controls.autoRotate)clearMomentum();resume=performance.now()+3000;manualStop=true;live.current.onInput?.()}
  function start(){active=true;resetTween=null;pause()}function end(){active=false;pause()}
  controls.addEventListener('start',start);controls.addEventListener('end',end);renderer.domElement.addEventListener('wheel',pause);
  const loss=(event:Event)=>{event.preventDefault();status('failed');live.current.onCapabilities?.(noCapabilities)};
  renderer.domElement.addEventListener('webglcontextlost',loss);
  function fit(){
   const w=el!.clientWidth||300,h=el!.clientHeight||350;renderer.setSize(w,h);camera.aspect=w/h;
   const fov=THREE.MathUtils.degToRad(camera.fov/2);
   // Height is normalized; wide specimens fit within the viewport rather than clipping.
   fitDistance=Math.max(1.5/Math.tan(fov),radius/(Math.tan(fov)*camera.aspect))*1.2;
   camera.position.set(fitDistance*.18,1.4+fitDistance*.15,fitDistance);controls.target.set(0,1.4,0);
   controls.minDistance=fitDistance*.5;controls.maxDistance=fitDistance*2.5;camera.far=Math.max(100,fitDistance*5);
   camera.updateProjectionMatrix();controls.update();defaultPosition.copy(camera.position);defaultTarget.copy(controls.target);
  }
  const ro=new ResizeObserver(fit);ro.observe(el);fit();
  function resetView(){pause();clearMomentum();controls.enableDamping=false;resetTween={start:performance.now(),position:camera.position.clone(),target:controls.target.clone()}}
  function orbit(horizontal:number,vertical=0){pause();clearMomentum();resetTween=null;const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));spherical.theta-=THREE.MathUtils.degToRad(horizontal);spherical.phi=THREE.MathUtils.clamp(spherical.phi-THREE.MathUtils.degToRad(vertical),.05,controls.maxPolarAngle);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update()}
  function keyboard(e:KeyboardEvent){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')resetView();else if(e.key.startsWith('Arrow'))orbit(e.key==='ArrowLeft'?-15:e.key==='ArrowRight'?15:0,e.key==='ArrowUp'?-15:e.key==='ArrowDown'?15:0);else {pause();camera.position.sub(controls.target).multiplyScalar(['+','='].includes(e.key)?.85:1/.85).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);controls.update()}}
  renderer.domElement.addEventListener('dblclick',resetView);renderer.domElement.addEventListener('keydown',keyboard);
  async function prepare(){
   const base=await loadModel(model!.file);
   const authored=model!.individuals||base.scene.userData.earthbound?.individuals||base.userData.earthbound?.individuals;
   const file=authored?.length?authored[individual%authored.length]:model!.file;
   const gltf=file===model!.file?base:await loadModel(file);
   const instance=await modelScene(gltf,model!,'high');if(cancelled)return;
   root=instance;
   root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const material of Array.isArray(o.material)?o.material:[o.material]){for(const key of Object.keys(material)){const texture=(material as any)[key];if(texture instanceof THREE.Texture){const own=texture.clone();(material as any)[key]=own;ownedTextures.add(own)}}}}});
   const {box,size,center,scale}=modelBounds(root),offset=new THREE.Group();
   offset.position.set(-center.x,-box.min.y,-center.z);offset.add(root);anchor.add(offset);anchor.scale.setScalar(scale);
   radius=Math.hypot(size.x,size.z)*scale/2;ground.scale.set(Math.max(.3,size.x*scale)*1.35,Math.max(.3,size.z*scale)*1.35,1);fit();
   if(model!.hasAnimation&&gltf.animations.length){
    mixer=new THREE.AnimationMixer(root);
    const clip=gltf.animations.find(a=>/idle|rest|breath/i.test(a.name))||gltf.animations[0];
    mixer.clipAction(clip).setLoop(THREE.LoopRepeat,Infinity).play();mixer.timeScale=.5;
   }
   features=plantFeatures(base,model!,root);
   features.foliage.forEach(o=>foliage.push({o,z:o.rotation.z}));
   live.current.onCapabilities?.(features.capabilities);status('ready');
  }
  void prepare().catch(()=>{status('failed');if(!cancelled)live.current.onCapabilities?.(noCapabilities)});
  function frame(t:number){
   if(cancelled)return;
   const p=live.current,dt=Math.min((t-last)/1000||0,.05);last=t;
   if(p.reset!==prevReset){resetView();prevReset=p.reset}
   if(p.turn!==prevTurn){orbit((p.turn-prevTurn)*15);prevTurn=p.turn}
   if(p.zoom!==prevZoom){camera.position.sub(controls.target).multiplyScalar(Math.pow(.85,p.zoom-prevZoom)).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);prevZoom=p.zoom;pause()}
   if(p.rotating!==priorRotating){priorRotating=p.rotating;if(p.rotating)manualStop=false;else if(controls.autoRotate)clearMomentum()}
   const animate=!motion.matches&&!document.hidden&&!active&&t>=resume;
   controls.autoRotate=animate&&p.rotating&&!manualStop&&!resetTween;
   if(resetTween){const t=motion.matches?1:Math.min(1,(performance.now()-resetTween.start)/500),f=1-Math.pow(1-t,3);camera.position.lerpVectors(resetTween.position,defaultPosition,f);controls.target.lerpVectors(resetTween.target,defaultTarget,f);if(t===1){resetTween=null;controls.enableDamping=true}}
   // OrbitControls already makes a surface move with both mouse and touch.
   // Reduce angular travel when zoomed in; keep release damping time-based.
   controls.rotateSpeed=camera.position.distanceTo(controls.target)/fitDistance;
   controls.dampingFactor=1-Math.exp(-Math.max(dt,.001)/.087);
   if(motion.matches)controls.enableDamping=false;else if(!resetTween)controls.enableDamping=true;controls.update(dt);
   // Idle playback is independent of the turntable rotation toggle.
   if(animate)mixer?.update(dt);
   foliage.forEach(({o,z},i)=>o.rotation.z=z+(animate&&p.wind?Math.sin(t*.0008+i)*.025:0));
   if(root&&features?.seasonal&&p.season!==lastSeason){
    lastSeason=p.season;const sc=features.seasonal;
    for(const node of sc.foliageNodes){const o=root.getObjectByName(node);if(o){o.visible=!sc.leafless.includes(p.season);o.traverse(n=>{if(n instanceof THREE.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])if('color'in m&&sc.colors[p.season])(m as THREE.MeshStandardMaterial).color.set(sc.colors[p.season])})}}
    for(const node of sc.flowerNodes){const o=root.getObjectByName(node);if(o)o.visible=sc.flowers.includes(p.season)}
    for(const node of sc.fruitNodes){const o=root.getObjectByName(node);if(o)o.visible=sc.fruit.includes(p.season)}
   }
   if(scaleRef.current&&(measurement||mature)){const top=new THREE.Vector3(0,2.8,0).project(camera),bottom=new THREE.Vector3(0,0,0).project(camera),height=el!.clientHeight;scaleRef.current.style.top=((1-top.y)*height/2)+'px';scaleRef.current.style.bottom='auto';const bar=scaleRef.current.querySelector<HTMLElement>('.measurement-bar');if(bar)bar.style.height=Math.max(1,(top.y-bottom.y)*height/2)+'px'}
   if(!document.hidden)renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return()=>{cancelled=true;cancelAnimationFrame(raf);ro.disconnect();controls.dispose();renderer.domElement.removeEventListener('wheel',pause);renderer.domElement.removeEventListener('dblclick',resetView);renderer.domElement.removeEventListener('keydown',keyboard);renderer.domElement.removeEventListener('webglcontextlost',loss);mixer?.stopAllAction();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});ownedTextures.forEach(t=>t.dispose());shadowTexture.dispose();renderer.dispose();renderer.domElement.remove()};
 },[species.id,model,individual,attempt]);
 return <div className="specimen-layer"><div className="model-host" ref={host} style={{opacity:state==='ready'?1:0}}/>{state==='loading'&&<div className="model-loading" role="status" aria-label={'Loading '+name+' model'}><Silhouette/></div>}{state==='failed'&&<div className="specimen-fallback"><span className="eyebrow">3D model unavailable</span>{species.image?<img decoding="async" src={species.image} alt={name+' — photographic reference'}/>:<p>A verified photograph has not yet been added for this species.</p>}{model&&<button className="retry-model" onClick={()=>setAttempt(x=>x+1)}>Retry model</button>}</div>}{scaleVisible&&<aside ref={scaleRef} className="specimen-scale" aria-label="Specimen scale">{measurement||mature?<><span className="measurement-bar" aria-hidden="true"/><span>{measurement?.label||mature}</span>{measurement?.sourceUrl&&<ExternalLink href={measurement.sourceUrl}>Measurement source</ExternalLink>}</>:<span>Verified dimensions are not supplied for this specimen.</span>}</aside>}</div>
}
