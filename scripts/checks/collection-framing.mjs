// Default camera projection check using the existing viewer's fit calculation.
// This does not verify responsive DOM layout or touch interaction.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
const configs=JSON.parse(fs.readFileSync('pipeline/collection.json'));
const registry=JSON.parse(fs.readFileSync('public/data/models.json'));
const reports=[];
for(const cfg of configs){
 const model=registry.find(r=>r.slug===cfg.registrySlug),view=model.exhibitView;
 for(const variant of ['desktop','mobile']){
  const file=`public/models/animals/${cfg.exhibitSlug}${variant==='mobile'?'.mobile':''}.glb`,bytes=fs.readFileSync(file);
  const {scene:root,animations}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const anchor=new THREE.Group(),offset=new THREE.Group();offset.position.set(-center.x,-box.min.y,-center.z);offset.add(root);anchor.add(offset);anchor.scale.setScalar(2.8/size.y);
  const radius=Math.hypot(size.x,size.z)*anchor.scale.x/2,mixer=new THREE.AnimationMixer(root);
  for(const aspect of [.6,1,1.4]){
   const camera=new THREE.PerspectiveCamera(35,aspect,.01,100),height=view?.targetHeight??1.4;
   const distance=Math.max(1.5/Math.tan(THREE.MathUtils.degToRad(17.5)),radius/(Math.tan(THREE.MathUtils.degToRad(17.5))*aspect))*(view?.fitPadding??1.2);
   const direction=view?.camera||[.8,.25,.85];camera.position.set(distance*direction[0],height+distance*direction[1],distance*direction[2]);camera.lookAt(0,height,0);camera.updateMatrixWorld();
   for(const clip of animations){mixer.stopAllAction();const action=mixer.clipAction(clip).reset().setLoop(THREE.LoopOnce,1).play();action.clampWhenFinished=true;let maxX=0,maxY=0;
    for(let k=0;k<=8;k++){mixer.update(k===0?0:clip.duration/8);anchor.updateMatrixWorld(true);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});root.traverse(o=>{if(!o.isMesh)return;const v=new THREE.Vector3();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld).project(camera);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y))}})}
    reports.push({species:cfg.exhibitSlug,variant,aspect,clip:clip.name,maxX,maxY,insideViewport:maxX<1&&maxY<1});
   }
  }
  mixer.stopAllAction();mixer.uncacheRoot(root);const resources=new Set();root.traverse(o=>{if(o.isMesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);Object.values(m).forEach(v=>{if(v?.isTexture)resources.add(v)})}}});resources.forEach(r=>r.dispose());
 }
}
const failed=reports.filter(r=>!r.insideViewport);
fs.writeFileSync('pipeline/reports/collection-framing.json',JSON.stringify({status:failed.length?'failed':'passed',verification:'CPU projection of every vertex at nine clip phases using the existing default camera, three stage aspect ratios and both variants. Not browser responsive-layout verification.',reports},null,2)+'\n');
console.log(JSON.stringify({checks:reports.length,failed}));assert.equal(failed.length,0,'Default camera clips sampled animation bounds');
