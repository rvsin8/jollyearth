import workerAssetUrl from './worker.ts?worker&url';
import {generatePlant} from './core';
import type {GenerationRequest,PlantGeometry} from './types';

type Job={request:GenerationRequest;key:string;resolve:(value:PlantGeometry)=>void;reject:(reason:unknown)=>void;timer:ReturnType<typeof setTimeout>};
let worker:Worker|null=null,id=0,workerDisabled=false;
const pending=new Map<number,Job>();
const requests=new Map<string,Promise<PlantGeometry>>();
const fallbackCache=new Map<string,PlantGeometry>();
let fallbackQueue=Promise.resolve();

// Serialize fallback jobs and yield between them so a full bed never runs in one task.
function onMainThread(request:GenerationRequest,key:string):Promise<PlantGeometry>{
 const task=fallbackQueue.then(()=>new Promise<PlantGeometry>((resolve,reject)=>{
  setTimeout(()=>{try{
   let result=fallbackCache.get(key);
   if(result){fallbackCache.delete(key);fallbackCache.set(key,result)}
   else{result=generatePlant(request);fallbackCache.set(key,result);while(fallbackCache.size>24)fallbackCache.delete(fallbackCache.keys().next().value!)}
   resolve(result);
  }catch(error){reject(error)}},0);
 }));
 fallbackQueue=task.then(()=>{},()=>{});
 return task;
}
function disableWorker(){
 workerDisabled=true;
 if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();worker=null}
 const jobs=[...pending.values()];pending.clear();
 for(const job of jobs){clearTimeout(job.timer);onMainThread(job.request,job.key).then(job.resolve,job.reject)}
}
function createWorker(){
 if(workerDisabled||typeof Worker==='undefined'||typeof location==='undefined'){workerDisabled=true;return null}
 if(worker)return worker;
 try{
  // Vite emits the worker as a separate asset. Do not use import.meta.url here:
  // the Sites server/client transform rewrites that base to file:///ROOT/....
  const url=new URL(workerAssetUrl,location.origin);
  if(!['https:','http:'].includes(url.protocol)||url.origin!==location.origin)throw new Error('Plant worker must use the site origin');
  worker=new Worker(url,{type:'module'});
  worker.onmessage=event=>{
   const job=pending.get(event.data.id);if(!job)return;
   pending.delete(event.data.id);clearTimeout(job.timer);
   if(event.data.error)onMainThread(job.request,job.key).then(job.resolve,job.reject);
   else job.resolve(event.data.data);
  };
  worker.onerror=event=>{event.preventDefault();disableWorker()};
  worker.onmessageerror=()=>disableWorker();
  return worker;
 }catch{disableWorker();return null}
}
export function generate(request:GenerationRequest):Promise<PlantGeometry>{
 // All setup, including constructor and postMessage failures, is inside a promise.
 const key=JSON.stringify(request),existing=requests.get(key);if(existing)return existing;
 const task=Promise.resolve().then(()=>{
  const current=createWorker();if(!current)return onMainThread(request,key);
  return new Promise<PlantGeometry>((resolve,reject)=>{
   const jobId=++id;
   const timer=setTimeout(disableWorker,2500);
   pending.set(jobId,{request,key,resolve,reject,timer});
   try{current.postMessage({id:jobId,key,request})}catch{disableWorker()}
  });
 });
 requests.set(key,task);task.finally(()=>requests.delete(key)).catch(()=>{});return task;
}
export const BED_LEAF_CAP=4096;
export function bedQuality(count:number,plan:boolean){return {lod:(plan||count>24?2:1) as 1|2,leafLimit:plan?64:Math.min(128,Math.floor(BED_LEAF_CAP/Math.max(1,count)))}}
export function nextSeed(){return crypto.getRandomValues(new Uint32Array(1))[0]}
