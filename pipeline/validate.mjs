import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';import validator from 'gltf-validator';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';import {Vector3,Matrix4} from 'three';
import {canonical,budgets} from './canonical.mjs';
export async function inspect(file,variant,options={}){
 const bytes=fs.readFileSync(file),errors=[];const validation=await validator.validateBytes(new Uint8Array(bytes),{uri:path.basename(file)});
 if(validation.issues.numErrors)errors.push(`${validation.issues.numErrors} glTF Validator errors`);
 await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 const doc=await io.read(file),root=doc.getRoot(),budget=budgets[variant];let triangles=0,vertices=0;const low=new Vector3(Infinity,Infinity,Infinity),high=new Vector3(-Infinity,-Infinity,-Infinity),v=new Vector3();
 for(const node of root.listNodes()){const mesh=node.getMesh();if(!mesh)continue;const matrix=new Matrix4().fromArray(node.getWorldMatrix());
  if(/^(cube|sphere|cylinder)([._ -]\d+)?$/i.test(mesh.getName())||/^(cube|sphere|cylinder)([._ -]\d+)?$/i.test(node.getName()))errors.push('Primitive mesh name: '+(mesh.getName()||node.getName()));
  const skin=node.getSkin(),bind=skin?.getInverseBindMatrices(),jointMatrices=skin?.listJoints().map((joint,i)=>new Matrix4().fromArray(joint.getWorldMatrix()).multiply(bind?new Matrix4().fromArray(bind.getElement(i,[])):new Matrix4()));
  for(const p of mesh.listPrimitives()){const pos=p.getAttribute('POSITION');if(!pos){errors.push('Missing position data');continue}vertices+=pos.getCount();if(p.getMode()!==4)errors.push('Non-triangle mesh');triangles+=(p.getIndices()?.getCount()||pos.getCount())/3;
   // Meshopt may quantize normalized coordinates and put the decode transform in
   // inverse bind matrices. Raw accessor integers are NOT measurements in metres.
   const joints=p.getAttribute('JOINTS_0'),weights=p.getAttribute('WEIGHTS_0'),point=new Vector3();
   for(let i=0;i<pos.getCount();i++){point.fromArray(pos.getElement(i,[]));if(jointMatrices&&joints&&weights){v.set(0,0,0);const ji=joints.getElement(i,[]),ws=weights.getElement(i,[]);for(let k=0;k<4;k++)if(ws[k])v.addScaledVector(point.clone().applyMatrix4(jointMatrices[ji[k]]),ws[k])}else v.copy(point).applyMatrix4(matrix);low.min(v);high.max(v)}
  }
 }
 const textureSizes=root.listTextures().map(t=>({name:t.getName(),mime:t.getMimeType(),size:t.getSize()}));
 for(const t of textureSizes){if(!t.size)errors.push('Cannot measure texture '+t.name);else if(Math.max(...t.size)>budget.texture)errors.push(`Texture over ${budget.texture}px: ${t.name}`);if(!['image/webp','image/ktx2'].includes(t.mime))errors.push('Texture must be WebP or KTX2: '+t.name)}
 const clips=root.listAnimations().map(a=>a.getName());const required=options.requiredClips||['Idle'],allowed=options.canonical||canonical;for(const c of required)if(!clips.includes(c))errors.push(!options.requiredClips&&c==='Idle'?'No Idle clip':'Missing required clip: '+c);if(new Set(clips).size!==clips.length)errors.push('Duplicate clip name');for(const c of clips)if(!allowed.includes(c))errors.push('Noncanonical clip: '+c);
 for(const a of root.listAnimations()){if(!a.listChannels().length||!a.listSamplers().some(s=>s.getInput()?.getCount()>1))errors.push('Empty animation: '+a.getName())}
 const length=high.z-low.z,range=options.lengthRange||[.75,1.45];if(!Number.isFinite(length)||length<range[0]||length>range[1])errors.push('Measured Z extent outside '+range.join('–')+'m: '+length);
 if(vertices<500)errors.push('Very low vertex count: possible primitive stand-in');if(triangles>budget.triangles)errors.push(`Triangles ${triangles} exceed ${budget.triangles}`);if(bytes.length>budget.bytes)errors.push(`Bytes ${bytes.length} exceed ${budget.bytes}`);
 if(!root.listSkins().length)errors.push('No skinned rig');if(!root.listTextures().length)errors.push('No textured materials');
 return {file,variant,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,vertices,triangles,lengthM:length,dimensionsM:high.clone().sub(low).toArray(),skins:root.listSkins().length,clips,textureSizes,validator:validation.issues,errors};
}
export async function validate({desktop='public/models/animals/red-fox.glb',mobile='public/models/animals/red-fox.mobile.glb',creditPath='pipeline/credit.json',write=true}={}){
 const result={slug:'red-fox',checkedAt:new Date().toISOString(),status:'failed',models:[],errors:[],manualReview:[]};
 const registryPath='content/animals/registry.json',records=JSON.parse(fs.readFileSync(registryPath)),fox=records.find(r=>r.slug==='red-fox');
 result.manualReview=fox.fidelity.diagnosticFeatures.map(text=>({text,checked:false}));
 for(const [variant,file] of [['desktop',desktop],['mobile',mobile]])try{const report=await inspect(file,variant);result.models.push(report);result.errors.push(...report.errors.map(e=>variant+': '+e))}catch(e){result.errors.push(variant+': '+e.message)}
 let credit;try{credit=JSON.parse(fs.readFileSync(creditPath));for(const k of ['creator','license','creatorUrl','licenseUrl','sourceUrl'])if(!credit[k]||/REPLACE|example\.invalid/.test(credit[k]))throw Error('Supply actual credit: '+k);for(const k of ['creatorUrl','licenseUrl','sourceUrl'])if(new URL(credit[k]).protocol!=='https:')throw Error(k+' must be HTTPS')}catch(e){result.errors.push('Credit: '+e.message)}
 if(result.models.length===2&&result.models[0].clips.join('|')!==result.models[1].clips.join('|'))result.errors.push('Desktop/mobile clips differ');
 for(const item of result.manualReview)console.log('● [ ] '+item.text);
 console.log('● [ ] Anatomical silhouette, source orientation, foot contact and all in-place clips reviewed against the supplied fidelity sheet');
 // Technical success never claims the manual visual checklist was completed.
 if(!result.errors.length){result.status='passed';if(write){fox.model={status:'ready',file:'/models/animals/red-fox.glb',mobileFile:'/models/animals/red-fox.mobile.glb',clips:canonical.filter(c=>result.models[0].clips.includes(c)),credit};fox.file=fox.model.file;fox.hasAnimation=true;fox.hasLOD=true;Object.assign(fox,credit);const temp=registryPath+'.tmp';fs.writeFileSync(temp,JSON.stringify(records,null,2)+'\n');fs.renameSync(temp,registryPath)}}
 if(write){fs.mkdirSync('pipeline/reports',{recursive:true});fs.writeFileSync('pipeline/reports/red-fox.json',JSON.stringify(result,null,2)+'\n')}
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await validate({creditPath:process.argv[2]||'pipeline/credit.json'});console.log(JSON.stringify(r,null,2));if(r.errors.length)process.exitCode=1}
