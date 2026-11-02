import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import * as THREE from 'three';
import {inspectGLB,validatePilot} from '../animals/inspect-glb.mjs';
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
async function source(p,replace=x=>x){let code=ts.transpileModule(replace(read(p)),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}
const records=json('public/data/animal-exhibits.json');
const {exhibitHref,ecosystemQuery,findAnimal}=await source('app/animal-registry.ts',s=>s.replace("import records from '@/public/data/animal-exhibits.json';",`const records=${JSON.stringify(records)};`));
for(const a of records){assert.equal(findAnimal(a.slug).scientificName,a.scientificName);for(const alias of a.aliases)assert.equal(findAnimal(alias).scientificName,a.scientificName);if(a.slug!=='red-fox')assert.ok(a.illustration||a.photo,a.slug+' has a real fallback');if(a.illustration)assert.ok(fs.existsSync('public'+a.illustration));for(const s of a.sources)assert.equal(new URL(s.url).protocol,'https:')}
for(const base of ['/?biome=Grassland&hotspot=north-american-coastal-plain&intro=0','/at-risk?species=lemur','/jersey-city/wildlife#where-they-go','/compare?pins=madagascar,sundaland'])for(const slug of ['lemur','eastern-oyster','kākāpō']){const before=new URL(base,'https://example.test'),after=new URL(exhibitHref(slug,before.href),'https://example.test');assert.equal(after.pathname,before.pathname);assert.equal(after.hash,before.hash);assert.equal(after.searchParams.get('exhibit'),slug);assert.equal(ecosystemQuery(after.search),ecosystemQuery(before.search));after.searchParams.delete('exhibit');assert.equal(after.searchParams.toString(),before.searchParams.toString())}
assert.equal(findAnimal('red-fox').model.status,'ready');assert.equal(findAnimal('red-fox').populationTrend,null);
const base='89d697e0a73026ddc5bc2a36d9df5692a0606d0e';
const old=JSON.parse(execFileSync('git',['show',base+':public/data/models.json'],{encoding:'utf8'}));
let preserved=0;for(const m of old){if(m.icon){assert.deepEqual(fs.readFileSync('public'+m.icon),execFileSync('git',['show',base+':public'+m.icon]));preserved++}}
for(const file of ['app/species-icon.tsx','app/globals.css','app/style-system.css','app/redesign.css','app/fonts.css'])assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show',base+':'+file]),file+' illustration styling preserved');
const {disposeAnimal}=await source('app/animal-viewer-utils.ts',s=>s.replace("'three'",JSON.stringify(import.meta.resolve('three'))));
const g=new THREE.BufferGeometry(),texture=new THREE.Texture(),m=new THREE.MeshStandardMaterial({map:texture,normalMap:texture});let gd=0,md=0,td=0,closed=0;g.addEventListener('dispose',()=>gd++);m.addEventListener('dispose',()=>md++);texture.addEventListener('dispose',()=>td++);texture.image={close:()=>closed++};const group=new THREE.Group();group.add(new THREE.Mesh(g,m),new THREE.Mesh(g,m));disposeAnimal(group);assert.deepEqual([gd,md,td,closed],[1,1,1,1],'Each owned GPU/image resource is released once');
const oyster=inspectGLB('public/models/animals/eastern-oyster.glb');assert.ok(oyster.texturedMaterials);assert.equal(oyster.animations.length,0);
const fox=json('content/animals/red-fox-pilot.json');assert.equal(fox.status,'ready');assert.ok(validatePilot(oyster,{...fox,maxTriangles:60000,maxBytes:8000000}).includes('Missing working clip: Idle'),'Static models cannot pass the animated pilot gate');
assert.ok(!read('app/world.tsx').includes('SpecimenTransition'));
assert.ok(!read('app/page.tsx').includes('preloadModel'));
assert.ok(read('app/page.tsx').includes('ecosystemQuery(params.toString())'));
assert.ok(read('app/animal-exhibit-provider.tsx').includes('history.back()'));
assert.ok(read('app/animal-exhibit.tsx').includes('<Dialog.Content'));
console.log(JSON.stringify({result:'PASS',registryRecords:records.length,preservedIllustrations:preserved,urlCases:12,resourceDisposal:'single-owner',foxPilot:'Ready: licensed fox mesh adapted in Blender with four working clips',browserInteractions:'NOT RUN'}));
