import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function inspectGLB(file){
 const bytes=fs.readFileSync(file);if(bytes.length<20||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid GLB 2 container');
 let json;for(let i=12;i<bytes.length;){const length=bytes.readUInt32LE(i),type=bytes.readUInt32LE(i+4);if(i+8+length>bytes.length)throw Error('Truncated GLB chunk');if(type===0x4e4f534a)json=JSON.parse(bytes.subarray(i+8,i+8+length).toString());i+=8+length}
 if(!json)throw Error('Missing glTF JSON');
 if((json.buffers||[]).some(b=>b.uri)||(json.images||[]).some(i=>i.uri&&!i.uri.startsWith('data:')))throw Error('External asset URI: use a self-contained GLB');
 let triangles=0,vertices=0;
 for(const mesh of json.meshes||[])for(const p of mesh.primitives){if((p.mode??4)!==4)throw Error('Expected triangle primitives');const positions=json.accessors?.[p.attributes?.POSITION];if(!positions||!positions.count)throw Error('Missing vertices');vertices+=positions.count;triangles+=(p.indices!=null?json.accessors[p.indices].count:positions.count)/3;}
 const animations=(json.animations||[]).map(a=>({name:a.name,channels:a.channels?.length||0,duration:Math.max(0,...(a.samplers||[]).map(s=>json.accessors[s.input]?.max?.[0]||0))}));
 return {file,bytes:bytes.length,triangles,vertices,meshes:json.meshes?.length||0,skins:json.skins?.length||0,materials:json.materials?.length||0,texturedMaterials:(json.materials||[]).filter(m=>m.pbrMetallicRoughness?.baseColorTexture).length,images:json.images?.length||0,animations,generator:json.asset?.generator||null};
}
export function validatePilot(report,config){const failures=[];if(!report.meshes||!report.vertices)failures.push('No animal mesh');if(report.triangles>config.maxTriangles)failures.push('Triangle budget exceeded');if(report.bytes>config.maxBytes)failures.push('File budget exceeded');if(!report.skins)failures.push('No skinned quadruped rig');if(!report.texturedMaterials)failures.push('No base-color texture');for(const name of config.requiredAnimations)if(!report.animations.some(a=>a.name===name&&a.duration>0&&a.channels>0))failures.push('Missing working clip: '+name);return failures}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const report=inspectGLB(process.argv[2]);if(process.argv[3]){const config=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));report.failures=validatePilot(report,config);if(report.failures.length)process.exitCode=1}console.log(JSON.stringify(report,null,2))}catch(error){console.error(error.message);process.exitCode=1}}
