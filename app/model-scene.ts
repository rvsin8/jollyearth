import * as THREE from 'three';
import type {GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {ModelRecord, SeasonalModel} from './model-records';

export type ModelCapabilities={seasonal:boolean;wind:boolean;individuals:number};
export const noCapabilities:ModelCapabilities={seasonal:false,wind:false,individuals:0};

// LODs are authored geometry. Nothing in this module generates organism meshes.
export async function modelScene(gltf:GLTF,model:ModelRecord,detail:'high'|'low'='high'){
 const root=clone(gltf.scene);
 if(!model.hasLOD)return root;
 async function resolve(parent:THREE.Object3D){
  for(const object of [...parent.children]){
   const ids=object.userData.gltfExtensions?.MSFT_lod?.ids;
   let selected=object;
   if(detail==='low'&&Array.isArray(ids)&&ids.length){
    selected=clone(await gltf.parser.getDependency('node',ids[ids.length-1]));
    parent.remove(object);parent.add(selected);
   }
   await resolve(selected);
  }
  // Common DCC export convention: each sibling family has its own LOD0…LODn.
  const families=new Map<string,{object:THREE.Object3D;level:number}[]>();
  for(const object of parent.children){
   const match=object.name.match(/^(.*?)[_. -]?LOD[_. -]?(\d+)$/i);
   if(match){const family=match[1];const entries=families.get(family)||[];entries.push({object,level:Number(match[2])});families.set(family,entries)}
  }
  for(const entries of families.values()){
   entries.sort((a,b)=>a.level-b.level);
   const chosen=detail==='high'?entries[0]:entries[entries.length-1];
   for(const entry of entries)if(entry!==chosen)parent.remove(entry.object);
   chosen.object.visible=true;
  }
 }
 await resolve(root);return root;
}

export function plantFeatures(gltf:GLTF,model:ModelRecord,root:THREE.Object3D){
 const extras=gltf.scene.userData.earthbound||gltf.userData.earthbound||{};
 const seasonal:SeasonalModel|undefined=model.seasonal||extras.seasonal;
 const individuals:string[]=model.individuals||extras.individuals||[];
 const foliage=(seasonal?.foliageNodes||[]).map(name=>root.getObjectByName(name)).filter((node):node is THREE.Object3D=>!!node);
 const seasonalNodes=seasonal?[...seasonal.foliageNodes,...seasonal.flowerNodes,...seasonal.fruitNodes]:[];
 return {seasonal,individuals,foliage,capabilities:{seasonal:!!seasonal&&seasonalNodes.some(name=>!!root.getObjectByName(name)),wind:foliage.length>0,individuals:individuals.length>1?individuals.length:0}};
}

export function modelBounds(root:THREE.Object3D){
 root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
 if(!Number.isFinite(size.y)||size.y<=0)throw Error('Empty specimen');
 return {box,size,center:box.getCenter(new THREE.Vector3()),scale:2.8/size.y};
}
