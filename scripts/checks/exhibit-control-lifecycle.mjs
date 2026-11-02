// Unit test the actual viewer effect/handlers with real Three animation math and
// mocked DOM/WebGL scheduling. This does NOT replace browser or touch QA.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
const source=fs.readFileSync('app/animal-viewer.tsx','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;

function harness({failure=false,enhanced=true,reducedMotion=false,view={}}={}){
 const hooks=[],effects=[],frames=new Map(),docEvents=new Map();let cursor=0,clock=0,frameId=0,renderer,controls,mixer,loadedFile,camera;
 const canvasEvents=new Map(),canvas={tabIndex:-1,setAttribute(){},addEventListener(n,f){canvasEvents.set(n,f)},removeEventListener(n){canvasEvents.delete(n)},remove(){this.removed=true},removed:false};
 const host={clientWidth:390,clientHeight:360,appendChild(){}};
 const react={useRef(initial){const i=cursor++;return hooks[i]??=( {current:initial===null&&i===0?host:initial} )},useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=initial;return [hooks[i],next=>hooks[i]=typeof next==='function'?next(hooks[i]):next]},useEffect(fn){const i=cursor++;if(!(i in hooks)){hooks[i]=true;effects.push(fn)}}};
 class Renderer{constructor(){renderer=this;this.domElement=canvas;this.renders=0;this.disposals=0;this.losses=0}setPixelRatio(){}setSize(){}render(){this.renders++}dispose(){this.disposals++}forceContextLoss(){this.losses++;canvasEvents.get('webglcontextlost')?.({preventDefault(){}})}}
 class Controls{constructor(value){camera=value;controls=this;this.target=new THREE.Vector3();this.touches={};this.events=new Map()}addEventListener(n,f){this.events.set(n,f)}update(){}dispose(){this.disposed=true}}
 class Mixer extends THREE.AnimationMixer{constructor(root){super(root);mixer=this}}
 const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial()));
 const animations=['Idle','Walk'].map(name=>new THREE.AnimationClip(name,1,[new THREE.NumberKeyframeTrack('.position[x]',[0,.5,1],[0,.1,0])]));
 const document={hidden:false,createElement(){return {width:0,height:0,getContext(){return {createRadialGradient(){return {addColorStop(){}}},fillRect(){}}}}},addEventListener(n,f){docEvents.set(n,f)},removeEventListener(n){docEvents.delete(n)}};
 const exports={};const deps={react,three:{...THREE,WebGLRenderer:Renderer,AnimationMixer:Mixer},'three/examples/jsm/controls/OrbitControls.js':{OrbitControls:Controls},'lucide-react':{},'./animal-artwork':{default:()=>null},'./motion':{useReducedMotion:()=>reducedMotion},'./model-loader':{loadExhibitModel(file){loadedFile=file;return failure?Promise.reject(Error('Injected download failure')):Promise.resolve({scene:root,animations})}},'./animal-viewer-utils':{animationLabel:n=>n,disposeAnimal(scene){scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}},'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:Symbol('fragment')}};
 vm.runInNewContext(compiled,{exports,require:n=>{assert.ok(n in deps,n);return deps[n]},AbortController,devicePixelRatio:3,innerWidth:390,navigator:{deviceMemory:4},document,matchMedia:()=>({matches:false}),performance:{now:()=>clock},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId},cancelAnimationFrame:id=>frames.delete(id),setTimeout:()=>1,clearTimeout(){},ResizeObserver:class{observe(){}disconnect(){}},console});
 const animal={slug:enhanced?'gopher-tortoise':'red-fox',commonName:'Test animal',illustration:'/test.svg'},model={file:'/desktop.glb',mobileFile:'/mobile.glb',exhibitView:enhanced?{controlsVersion:2,...view}:undefined};
 function render(){cursor=0;return exports.default({animal,model})}
 function buttons(label){const found=[];function visit(node){if(Array.isArray(node))return node.forEach(visit);if(!node||typeof node!=='object')return;if(node.type==='button'&&(node.props['aria-label']===label||node.props.children===label))found.push(node);visit(node.props?.children)}visit(render());return found}
 function button(label){const found=buttons(label);assert.equal(found.length,1,label);return found[0].props}
 render();const cleanup=effects[0]();
 return {button,buttons,render,cleanup,async ready(){await new Promise(resolve=>setImmediate(resolve));render()},tick(t){clock=t;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(t))},wheel(){canvasEvents.get('wheel')?.()},lose(){canvasEvents.get('webglcontextlost')?.({preventDefault(){}})},visibility(hidden){document.hidden=hidden;docEvents.get('visibilitychange')?.()},get camera(){return camera},get target(){return controls.target},get mixer(){return mixer},get renderer(){return renderer},get pending(){return frames.size},get canvas(){return canvas},get loadedFile(){return loadedFile}};
}

const ready=harness();await ready.ready();assert.equal(ready.loadedFile,'/mobile.glb');ready.tick(100);
ready.wheel();const pausedAt=ready.mixer.time;ready.tick(200);assert.equal(ready.mixer.time,pausedAt,'camera interaction pauses the clip');
ready.button('Pause animation').onClick();ready.button('Play animation').onClick();ready.render();ready.tick(300);assert.ok(ready.mixer.time>pausedAt,'explicit Play overrides the 3-second camera pause');
ready.wheel();const beforeClip=ready.mixer.time;ready.button('Walk').onClick();ready.render();ready.tick(400);assert.ok(ready.mixer.time>beforeClip,'choosing a clip starts immediately');
ready.visibility(true);assert.equal(ready.pending,0,'hidden tab stops scheduling');ready.visibility(false);assert.equal(ready.pending,1,'visible healthy viewer resumes');
ready.lose();assert.equal(ready.renderer.disposals,1);assert.equal(ready.renderer.losses,1);assert.equal(ready.canvas.removed,true);ready.visibility(false);assert.equal(ready.pending,0,'failed viewer cannot restart on visibility change');ready.cleanup();assert.equal(ready.renderer.disposals,1,'close after failure must not double-dispose');
const failure=harness({failure:true});await failure.ready();assert.equal(failure.renderer.disposals,1);assert.equal(failure.pending,0);failure.cleanup();assert.equal(failure.renderer.disposals,1);
const fox=harness({enhanced:false});await fox.ready();fox.tick(100);fox.wheel();const oldTime=fox.mixer.time;fox.button('Pause animation').onClick();fox.button('Play animation').onClick();fox.render();fox.tick(200);assert.equal(fox.mixer.time,oldTime,'legacy fox timing unchanged');fox.cleanup();assert.equal(fox.renderer.disposals,1);
// Presets must move the real Three camera rather than merely changing a label.
const cameraViews=harness({view:{camera:[.8,.38,.95],targetHeight:1.1}});await cameraViews.ready();
const initialPosition=cameraViews.camera.position.clone(),initialDistance=initialPosition.distanceTo(cameraViews.target);
cameraViews.button('Front view').onClick();cameraViews.render();
assert.ok(Math.abs(cameraViews.camera.position.x)<1e-9,'front view aligns the camera to the front axis');
assert.ok(cameraViews.camera.position.z>0);assert.equal(cameraViews.camera.position.y,initialPosition.y,'preset keeps configured elevation');
assert.ok(Math.abs(cameraViews.camera.position.distanceTo(cameraViews.target)-initialDistance)<1e-9,'front view preserves framing distance');
assert.equal(cameraViews.button('Front view')['aria-pressed'],true);
cameraViews.button('Side view').onClick();cameraViews.render();
assert.ok(Math.abs(cameraViews.camera.position.z)<1e-9,'side view aligns to a different axis');assert.ok(cameraViews.camera.position.x>0);
assert.ok(Math.abs(cameraViews.camera.position.distanceTo(cameraViews.target)-initialDistance)<1e-9,'side view preserves framing distance');
assert.equal(cameraViews.button('Front view')['aria-pressed'],false);assert.equal(cameraViews.button('Side view')['aria-pressed'],true);
cameraViews.button('Three-quarter view').onClick();cameraViews.render();
assert.ok(cameraViews.camera.position.distanceTo(initialPosition)<1e-9,'three-quarter restores the configured default');
cameraViews.button('Rotate left').onClick();cameraViews.render();
assert.equal(cameraViews.button('Three-quarter view')['aria-pressed'],false,'manual rotation clears the preset selection');
cameraViews.button('Reset model view').onClick();cameraViews.render();assert.ok(cameraViews.camera.position.distanceTo(initialPosition)<1e-9);cameraViews.cleanup();

// Test the actual mixer clock at equal 20ms frame intervals, below the dt cap.
const playback=harness();await playback.ready();playback.tick(100);const start=playback.mixer.time;
playback.tick(120);const normalDelta=playback.mixer.time-start;
playback.button('0.5 times playback speed').onClick();playback.render();const halfStart=playback.mixer.time;playback.tick(140);
assert.ok(Math.abs((playback.mixer.time-halfStart)-normalDelta*.5)<1e-9,'half speed advances the real mixer by half');
assert.equal(playback.button('0.5 times playback speed')['aria-pressed'],true);
playback.button('1.5 times playback speed').onClick();playback.render();const fastStart=playback.mixer.time;playback.tick(160);
assert.ok(Math.abs((playback.mixer.time-fastStart)-normalDelta*1.5)<1e-9,'1.5 speed advances the real mixer proportionally');
playback.button('1 times playback speed').onClick();playback.render();const resetStart=playback.mixer.time;playback.tick(180);
assert.ok(Math.abs((playback.mixer.time-resetStart)-normalDelta)<1e-9,'normal speed restores the original rate');playback.cleanup();

const reduced=harness({reducedMotion:true});await reduced.ready();reduced.tick(100);const heldTime=reduced.mixer.time;reduced.tick(120);reduced.tick(140);
for(const label of ['Idle','Walk','Pause animation','0.5 times playback speed','1 times playback speed','1.5 times playback speed'])assert.equal(reduced.button(label).disabled,true,label+' disabled under reduced motion');
assert.equal(reduced.mixer.time,heldTime,'reduced motion keeps the Idle pose frozen');
assert.equal(reduced.button('Front view').disabled,undefined,'instant camera inspection remains available');reduced.cleanup();
assert.equal(fox.buttons('Front view').length,0);assert.equal(fox.buttons('0.5 times playback speed').length,0,'fox never gains the new opt-in controls');
const report={status:'passed',checks:['Mobile asset selection','Gesture pause','Immediate explicit Play','Immediate clip selection','Hidden-tab suspension','Failed-renderer cleanup','No restart after failure','Idempotent close cleanup','Legacy fox timing','Camera preset positions, framing and reset','Playback speed changes real mixer time','Reduced-motion controls and frozen pose','New controls absent from fox'],scope:'Actual component handlers with real Three camera/animation math and mocked DOM/WebGL. Not browser interaction, visual rendering, GPU, or touch validation.'};
fs.writeFileSync('pipeline/reports/phase2-control-lifecycle.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
