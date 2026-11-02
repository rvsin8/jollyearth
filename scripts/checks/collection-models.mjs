import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ts from 'typescript';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {inspect} from '../../pipeline/validate.mjs';
const includeDrafts=process.argv.includes('--drafts');
const configs=JSON.parse(fs.readFileSync('pipeline/collection.json'));
const registry=JSON.parse(fs.readFileSync('public/data/animal-exhibits.json'));
const modelRegistry=JSON.parse(fs.readFileSync('public/data/models.json'));
globalThis.self=globalThis;
// Decodes actual geometry/animations. Texture upload and GPU performance require browser QA.
globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){this.closed=true}});
const code=ts.transpileModule(fs.readFileSync('app/animal-viewer-utils.ts','utf8').replace("'three'",JSON.stringify(import.meta.resolve('three'))),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {disposeAnimal}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function positions(root){root.updateMatrixWorld(true);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});const out=[];root.traverse(o=>{if(!o.isMesh)return;const p=new THREE.Vector3();for(let i=0;i<o.geometry.attributes.position.count;i+=31){o.getVertexPosition(i,p).applyMatrix4(o.matrixWorld);out.push(p.x,p.y,p.z)}});return out}
const reports=[];
for(const cfg of configs){
 const record=registry.find(r=>r.slug===cfg.exhibitSlug),model=modelRegistry.find(r=>r.slug===cfg.registrySlug);
 assert.ok(record);assert.ok(record.aliases.includes(cfg.registrySlug));if(!includeDrafts)assert.equal(record.model.status,'ready');assert.equal(record.populationTrend,null);
 for(const field of ['size','diet','habitat','distribution','status'])assert.ok(record[field],cfg.exhibitSlug+' missing '+field);
 assert.ok(record.sources.length>=3);assert.equal(record.illustration,model.icon);
 assert.deepEqual(model.exhibitView.clipOrder,cfg.clips);assert.equal(model.exhibitView.defaultClip,cfg.clips[0]);
 for(const variant of ['desktop','mobile']){
  const file=`public/models/animals/${cfg.exhibitSlug}${variant==='mobile'?'.mobile':''}.glb`,bytes=fs.readFileSync(file),start=performance.now();
  const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const cpuParseMs=performance.now()-start;assert.deepEqual(gltf.animations.map(c=>c.name).sort(),[...cfg.clips].sort());
  const mixer=new THREE.AnimationMixer(gltf.scene),clips=[];
  for(const clip of gltf.animations){mixer.stopAllAction();const action=mixer.clipAction(clip).reset().setLoop(THREE.LoopOnce,1).play();action.clampWhenFinished=true;mixer.update(0);const first=positions(gltf.scene);let displacement=0;const poses=[];
   for(let k=1;k<=8;k++){mixer.update(clip.duration/8);const pose=positions(gltf.scene);assert.ok(pose.every(Number.isFinite));displacement=Math.max(displacement,...pose.map((v,i)=>Math.abs(v-first[i])));poses.push(pose)}
   assert.ok(displacement>.0001,clip.name+' must deform the animal');const seam=Math.max(...poses[7].map((v,i)=>Math.abs(v-first[i])));if(!(model.exhibitView.oneShotClips||[]).includes(clip.name))assert.ok(seam<.005,`${cfg.exhibitSlug} ${clip.name} loop seam ${seam}m`);
   clips.push({name:clip.name,durationSeconds:clip.duration,maxSampleDisplacementM:displacement,loopSeamM:seam});
  }
  const resources=new Set();gltf.scene.traverse(o=>{if(o.isMesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v)}}});let released=0;resources.forEach(r=>r.addEventListener('dispose',()=>released++));mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);disposeAnimal(gltf.scene);assert.equal(released,resources.size);
  const technical=await inspect(file,variant,{requiredClips:cfg.clips,canonical:cfg.clips,lengthRange:cfg.lengthRange});assert.deepEqual(technical.errors,[]);
  reports.push({species:cfg.exhibitSlug,releaseReady:record.model.status==='ready',variant,bytes:bytes.length,triangles:technical.triangles,dimensionsM:technical.dimensionsM,cpuParseMs:Math.round(cpuParseMs),clips,resourcesDisposed:released,glTFErrors:technical.validator.numErrors,glTFWarnings:technical.validator.numWarnings});
 }
}
const before=JSON.parse(fs.readFileSync('pipeline/reports/collection-preservation-before.json')),after={};for(const [file,hash] of Object.entries(before)){after[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.equal(after[file],hash,file+' must stay byte-identical')}
fs.writeFileSync('pipeline/reports/collection-preservation-after.json',JSON.stringify(after,null,2)+'\n');
const notReady=configs.filter(c=>registry.find(r=>r.slug===c.exhibitSlug)?.model?.status!=='ready').map(c=>c.exhibitSlug);
const result={status:'technical-checks-passed',releaseStatus:'held-for-browser-QA'+(notReady.length?'-and-model-refinement':''),notReady,models:reports,protectedAssetsUnchanged:Object.keys(after).length,originalIllustrations:Object.keys(after).filter(p=>p.endsWith('.svg')).length,verification:'Actual GLTFLoader and AnimationMixer CPU checks, technical GLB validation and resource-disposal events. No browser, touch, WebGL context, network loading or frame-rate result is implied.'};
fs.writeFileSync('pipeline/reports/collection-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
