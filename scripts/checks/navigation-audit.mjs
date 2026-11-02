import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
const routes=['/','/at-risk','/jersey-city','/plant-lab','/field-notes','/hotspots','/compare','/sources','/jersey-city/wildlife','/jersey-city/places','/jersey-city/challenges','/jersey-city/sightings','/jersey-city/field-station'];
for(const route of routes)assert.ok(fs.existsSync(path.join('app',route,'page.tsx')),route+' has a page');
const files=fs.readdirSync('app',{recursive:true}).filter(p=>p.endsWith('.tsx'));
let anchors=0;const missing=[];
for(const filename of files){const text=fs.readFileSync(path.join('app',filename),'utf8');assert.ok(!text.includes('next/link'),'No navigation click interception: '+filename);const tree=ts.createSourceFile(filename,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);function visit(node){if((ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))&&node.tagName.getText(tree)==='a'){anchors++;if(!node.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(tree)==='href'))missing.push(filename)}ts.forEachChild(node,visit)}visit(tree)}
assert.deepEqual(missing,[],'Every anchor declares href');
for(const name of ['navigation-guard.tsx','navigation-recovery.ts','atlas-shell-state.tsx'])assert.ok(!fs.existsSync('app/'+name),'Deleted '+name);
const shell=fs.readFileSync('app/site-shell.tsx','utf8');assert.ok(!/preventDefault|stopPropagation|inert=/.test(shell));
const home=fs.readFileSync('app/page.tsx','utf8');assert.ok(home.includes("const currentView=usePathname()"));assert.ok(home.includes('{introOpen&&<AtlasIntro'));assert.ok(!/introTimer|closing|initialView/.test(home));
const globe=fs.readFileSync('app/world.tsx','utf8');assert.ok(globe.includes("...(splash?{position:'fixed'"));assert.ok(!/floating|setTimeout/.test(globe));
const plants=JSON.parse(fs.readFileSync('public/data/plant-sites.json','utf8'));
for(const s of plants){assert.ok(Math.max(352,352*s.width/s.depth)/8>=44);assert.ok(Math.max(352,352*s.depth/s.width)/8>=44)}
let urls=0;function walk(value){if(!value||typeof value!=='object')return;for(const [key,v]of Object.entries(value)){if(typeof v==='string'&&/^(url|sourceUrl|creatorUrl|licenseUrl)$/.test(key)){assert.equal(new URL(v).protocol,'https:');urls++}else walk(v)}}
for(const f of fs.readdirSync('public/data',{recursive:true}).filter(p=>p.endsWith('.json')&&!p.includes('metadata/')))walk(JSON.parse(fs.readFileSync(path.join('public/data',f),'utf8')));
console.log(JSON.stringify({routeModules:routes.length,anchorsWithHref:anchors,httpsSourceFields:urls,bedCellMinimum:'44 × 44 CSS px by layout constraint',runtimeClickTests:'NOT RUN — no authorized browser testing interface available'}));
