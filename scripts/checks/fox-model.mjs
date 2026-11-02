import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ts from 'typescript';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {inspect} from '../../pipeline/validate.mjs';

// CPU verification of the actual browser loader, rig and clips. ImageBitmap is
// stubbed because these checks do not create a WebGL context or claim browser QA.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){this.closed=true}});
let code=ts.transpileModule(fs.readFileSync('app/animal-viewer-utils.ts','utf8').replace("'three'",JSON.stringify(import.meta.resolve('three'))),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {disposeAnimal}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function positions(root){root.updateMatrixWorld(true);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});const out=[];root.traverse(o=>{if(!o.isMesh)return;const p=new THREE.Vector3();for(let i=0;i<o.geometry.attributes.position.count;i+=23){o.getVertexPosition(i,p).applyMatrix4(o.matrixWorld);out.push(p.x,p.y,p.z)}});return out}
const reports=[];
for(const variant of ['desktop','mobile']){
 const file=`public/models/animals/red-fox${variant==='mobile'?'.mobile':''}.glb`,bytes=fs.readFileSync(file),start=performance.now();
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const parseMs=performance.now()-start;assert.deepEqual(gltf.animations.map(c=>c.name).sort(),['Idle','Run','Trot','Walk']);
 const mixer=new THREE.AnimationMixer(gltf.scene),clips=[];
 for(const clip of gltf.animations){mixer.stopAllAction();const action=mixer.clipAction(clip).reset().setLoop(THREE.LoopOnce,1).play();action.clampWhenFinished=true;mixer.update(0);const first=positions(gltf.scene);mixer.update(clip.duration/3);const mid=positions(gltf.scene);assert.ok(mid.every(Number.isFinite));const displacement=Math.max(...mid.map((v,i)=>Math.abs(v-first[i])));assert.ok(displacement>.001,clip.name+' must deform the skinned animal');mixer.update(clip.duration*2/3);const last=positions(gltf.scene);const seam=Math.max(...last.map((v,i)=>Math.abs(v-first[i])));assert.ok(seam<.001,clip.name+' loops without a pose discontinuity');clips.push({name:clip.name,durationSeconds:clip.duration,maxSampleDisplacementM:displacement,loopSeamM:seam})}
 const resources=new Set();gltf.scene.traverse(o=>{if(o.isMesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v)}}});let released=0;resources.forEach(r=>r.addEventListener('dispose',()=>released++));mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);disposeAnimal(gltf.scene);assert.equal(released,resources.size);
 const technical=await inspect(file,variant);assert.deepEqual(technical.errors,[]);reports.push({variant,bytes:bytes.length,triangles:technical.triangles,measuredLengthM:technical.lengthM,cpuParseMs:Math.round(parseMs),clips,resourcesDisposed:released,glTFErrors:technical.validator.numErrors,glTFWarnings:technical.validator.numWarnings});
}
let preserved=0;for(const row of fs.readFileSync('pipeline/reports/illustrations-before.sha256','utf8').trim().split('\n')){const [sha,file]=row.split(/\s+/);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);preserved++}assert.equal(preserved,38);
const result={result:'PASS',models:reports,originalIllustrationsUnchanged:preserved,verification:'Blender render review and CPU GLTFLoader/AnimationMixer checks; browser, touchscreen, GPU contexts and network load timing not measured'};
fs.writeFileSync('pipeline/reports/fox-model-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
