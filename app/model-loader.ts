import type {GLTF,GLTFLoader as Loader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {findModel} from './model-records';
const cache=new Map<string,Promise<GLTF>>();let loader:Promise<Loader>;
function getLoader(){return loader??=Promise.all([import('three/examples/jsm/loaders/GLTFLoader.js'),import('three/examples/jsm/loaders/DRACOLoader.js'),import('three/examples/jsm/libs/meshopt_decoder.module.js')]).then(([{GLTFLoader},{DRACOLoader},{MeshoptDecoder}])=>{const draco=new DRACOLoader();draco.setDecoderPath('/decoders/draco/');draco.setWorkerLimit(1);return new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder)}).catch(e=>{loader=undefined!;throw e})}
export function loadModel(file:string){if(!cache.has(file))cache.set(file,getLoader().then(loader=>loader.loadAsync(file)).catch(e=>{cache.delete(file);throw e}));return cache.get(file)!}
export function preloadModel(slug:string){const model=findModel(slug);if(model&&typeof window!=='undefined')void loadModel(model.file).catch(()=>{})}
// Exhibits own their model resources: no hover fetch and no persistent decoded cache.
export async function loadExhibitModel(file:string,signal:AbortSignal,onProgress?:(fraction:number|null)=>void){
 const loader=await getLoader();signal.throwIfAborted();
 const response=await fetch(file,{signal});if(!response.ok)throw Error('Model download failed');
 const total=Number(response.headers.get('content-length'))||0;let bytes:ArrayBuffer;
 if(response.body){const reader=response.body.getReader(),chunks:Uint8Array[]=[];let loaded=0;onProgress?.(total?0:null);while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.length;onProgress?.(total?Math.min(.95,loaded/total):null)}const joined=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length}bytes=joined.buffer}else bytes=await response.arrayBuffer();signal.throwIfAborted();onProgress?.(1);
 return loader.parseAsync(bytes,new URL('.',new URL(file,location.href)).href);
}
