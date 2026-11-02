// Compare exported skin poses with evaluated Blender source bounds, without a GPU.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const slug=process.argv[2];
const source=JSON.parse(fs.readFileSync(`pipeline/reports/${slug}-source-audit.json`));
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const reports=[];
for(const variant of ['desktop','mobile']){
 const bytes=fs.readFileSync(`public/models/animals/${slug}${variant==='mobile'?'.mobile':''}.glb`);
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const mixer=new THREE.AnimationMixer(gltf.scene);
 for(const clip of gltf.animations){
  const reference=source.clips.find(c=>c.name===clip.name);assert.ok(reference);
  mixer.stopAllAction();const action=mixer.clipAction(clip).reset().setLoop(THREE.LoopOnce,1).play();action.clampWhenFinished=true;
  const poses=[];
  for(let i=0;i<reference.poses.length;i++){
   mixer.setTime(clip.duration*i/(reference.poses.length-1));
   gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});
   const box=new THREE.Box3(),p=new THREE.Vector3();
   gltf.scene.traverse(o=>{if(o.isMesh)for(let k=0;k<o.geometry.attributes.position.count;k++)box.expandByPoint(o.getVertexPosition(k,p).applyMatrix4(o.matrixWorld))});
   const a=reference.poses[i];
   // Blender Z up / -Y front -> glTF Y up / +Z front.
   const expected=[a.min[0],a.min[2],-a.max[1],a.max[0],a.max[2],-a.min[1]];
   const actual=[...box.min.toArray(),...box.max.toArray()];
   const maxErrorM=Math.max(...actual.map((x,k)=>Math.abs(x-expected[k])));
   poses.push({fraction:i/(reference.poses.length-1),maxErrorM,actual,expected});
  }
  reports.push({variant,clip:clip.name,maxBoundsErrorM:Math.max(...poses.map(p=>p.maxErrorM)),poses});
 }
}
const maxBoundsErrorM=Math.max(...reports.map(r=>r.maxBoundsErrorM));
fs.writeFileSync(`pipeline/reports/${slug}-roundtrip.json`,JSON.stringify({slug,maxBoundsErrorM,toleranceM:.003,reports,limitation:'CPU evaluated bounding boxes; not a browser rendering or anatomical validation.'},null,2)+'\n');
console.log(JSON.stringify({slug,maxBoundsErrorM,reports:reports.map(({variant,clip,maxBoundsErrorM})=>({variant,clip,maxBoundsErrorM}))}));
assert.ok(maxBoundsErrorM<.003,'Export pose bounds differ by more than 3 mm; inspect skin transforms, clip timing and simplification');
