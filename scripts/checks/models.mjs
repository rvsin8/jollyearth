import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
const catalog=JSON.parse(fs.readFileSync('public/data/models.json','utf8'));
const models=catalog.filter(m=>m.file);
for(const entry of catalog){assert.ok(entry.file===null||typeof entry.file==='string');assert.ok(entry.commonName&&entry.scientificName);if(entry.file===null){assert.equal(entry.hasAnimation,false);assert.equal(entry.hasLOD,false)}}
const slugs=new Set();
for(const model of models){
 for(const key of ['slug','commonName','scientificName','kind','file','creator','creatorUrl','license','licenseUrl','sourceUrl'])assert.ok(typeof model[key]==='string'&&model[key].length,key);
 assert.ok(['animal','plant'].includes(model.kind));assert.equal(typeof model.hasLOD,'boolean');assert.equal(typeof model.hasAnimation,'boolean');
 assert.ok(!slugs.has(model.slug),'Duplicate slug');slugs.add(model.slug);
 assert.match(model.file,/^\/models\/(animals|plants)\/[a-z0-9-]+\.glb$/);
 const binary=fs.readFileSync('public'+model.file);assert.equal(binary.toString('utf8',0,4),'glTF');assert.equal(binary.readUInt32LE(4),2);assert.equal(binary.readUInt32LE(8),binary.length);
 const json=JSON.parse(binary.toString('utf8',20,20+binary.readUInt32LE(12)));
 assert.ok(json.meshes?.length,'No mesh');
 if(model.hasAnimation)assert.ok(json.animations?.length,'Manifest promises animations but GLB contains none');
 if(model.hasLOD)assert.ok(json.nodes?.some(n=>n.extensions?.MSFT_lod||/LOD[_. -]?\d+$/i.test(n.name||'')),'Manifest promises LODs but none are recognized');
 for(const texture of json.images||[])assert.ok(texture.bufferView!==undefined||texture.uri?.startsWith('data:'),'Texture must be bundled in GLB');
}
let code=ts.transpileModule(fs.readFileSync('app/model-scene.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
for(const spec of ['three','three/examples/jsm/utils/SkeletonUtils.js'])code=code.replaceAll("'"+spec+"'","'"+import.meta.resolve(spec)+"'");
const {modelScene,modelBounds,plantFeatures}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const scene=new THREE.Group();for(const name of ['Canopy_LOD0','Canopy_LOD2','Trunk']){const node=new THREE.Group();node.name=name;scene.add(node)}
const base={scene,userData:{},parser:{}};
assert.deepEqual((await modelScene(base,{hasLOD:true},'high')).children.map(o=>o.name),['Canopy_LOD0','Trunk']);
assert.deepEqual((await modelScene(base,{hasLOD:true},'low')).children.map(o=>o.name),['Canopy_LOD2','Trunk']);
assert.equal(scene.children.length,3,'Cached scene was mutated');
const hi=new THREE.Group();hi.userData.gltfExtensions={MSFT_lod:{ids:[1,2]}};const extended=new THREE.Group();extended.add(hi);
const low=await modelScene({scene:extended,parser:{getDependency:async(type,index)=>{assert.equal(type,'node');assert.equal(index,2);const n=new THREE.Group();n.name='Lowest';return n}}},{hasLOD:true},'low');assert.equal(low.children[0].name,'Lowest');
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([2,-4,5,4,-2,5,3,-3,6],3));const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());
const {box,center,scale}=modelBounds(mesh);const offset=new THREE.Group();offset.position.set(-center.x,-box.min.y,-center.z);offset.add(mesh);const fitted=new THREE.Group();fitted.add(offset);fitted.scale.setScalar(scale);const bounds=new THREE.Box3().setFromObject(fitted);assert.ok(Math.abs(bounds.min.y)<1e-6);assert.ok(Math.abs(bounds.max.y-2.8)<1e-6);assert.ok(Math.abs(bounds.getCenter(new THREE.Vector3()).x)<1e-6);
assert.deepEqual(plantFeatures(base,{},scene).capabilities,{seasonal:false,wind:false,individuals:0});
console.log(`Model checks passed: ${models.length} bundled GLB(s), manifest metadata, authored LOD selection, cache isolation and grounded auto-fit`);
