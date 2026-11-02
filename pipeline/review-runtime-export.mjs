/** Decode the exact deployed geometry and WebP pixels for Blender review.
 * No simplification, animation resampling or material replacement is performed.
 * Output is a private QA artifact, never a runtime replacement.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const [slug,variant='desktop']=process.argv.slice(2);
if(!JSON.parse(fs.readFileSync('pipeline/collection.json')).some(c=>c.exhibitSlug===slug))throw Error('Unknown collection animal');
if(!['desktop','mobile'].includes(variant))throw Error('Invalid variant');
const input=`public/models/animals/${slug}${variant==='mobile'?'.mobile':''}.glb`;
const output=`pipeline/work/runtime-review/${slug}/${variant}/model.gltf`;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
await MeshoptDecoder.ready;
const doc=await io.read(input);
for(const extension of doc.getRoot().listExtensionsUsed())if(['EXT_meshopt_compression','EXT_texture_webp'].includes(extension.extensionName))extension.dispose();
for(const [i,texture] of doc.getRoot().listTextures().entries()){
 if(texture.getMimeType()==='image/webp'){
  const png=execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python',['-c','import sys,io;from PIL import Image; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); im.save(sys.stdout.buffer,format="PNG")'],{input:texture.getImage(),maxBuffer:32*1024*1024});
  texture.setImage(png).setMimeType('image/png');
 }
 texture.setURI(`texture-${i}.png`);
}
fs.mkdirSync(path.dirname(output),{recursive:true});await io.write(output,doc);console.log(output);
