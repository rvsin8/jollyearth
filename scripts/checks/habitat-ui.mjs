import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const read=p=>fs.readFileSync(p,'utf8');
async function moduleAt(p,replace=x=>x){const js=ts.transpileModule(replace(read(p)),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))}
const {hotspots}=JSON.parse(read('public/data/hotspots.json'));
const profiles=JSON.parse(read('public/data/species.json')).species;
const {habitatEstimate,habitatBands}=await moduleAt('app/habitat-estimate.ts');
const {documentedSpecies}=await moduleAt('app/hotspot-species.ts');
let estimated=0,missing=0,expanded=0;
for(const h of hotspots){
 const e=habitatEstimate(h);
 if(h.remaining.value===null){missing++;assert.equal(e.band,'unknown');assert.equal(e.label,'No estimate');assert.equal(e.source,undefined)}
 else{estimated++;assert.equal(e.value,h.remaining.value);assert.equal(e.label,h.remaining.display);assert.equal(e.year,2000);assert.ok(h.sources.some(s=>s.id===e.source))}
 const all=documentedSpecies(h,profiles),expected=new Set([...h.species,...profiles.filter(s=>s.hotspots.includes(h.id))].map(s=>s.scientific.toLowerCase()));
 assert.equal(all.length,expected.size);if(all.length>h.species.length)expanded++;
}
assert.equal(estimated,23);assert.equal(missing,13);assert.equal(habitatEstimate(hotspots.find(h=>h.id==='north-american-coastal-plain')).band,'unknown');
for(const [value,band] of [[0,'clay'],[9.99,'clay'],[10,'ochre'],[20,'ochre'],[20.01,'sage'],[100,'sage'],[null,'unknown'],[-1,'unknown'],[101,'unknown'],['10','unknown']])assert.equal(habitatEstimate({remaining:{value,source:'test',year:2000},sources:[{id:'test'}]}).band,band);
assert.equal(habitatEstimate({remaining:{value:12,source:'missing',year:2000},sources:[]}).band,'unknown');
assert.ok(habitatBands.some(b=>b.key==='unknown'&&b.label==='No estimate'));
const migrations=JSON.parse(read('public/data/migrations.json'));
const {migrationHref,routeCoordinates}=await moduleAt('app/migration-data.ts',s=>s.replace("import records from '@/public/data/migrations.json';",`const records=${JSON.stringify(migrations)};`));
for(const m of migrations){const u=new URL(migrationHref(m),'https://example.test');assert.equal(u.pathname,'/');assert.equal(u.searchParams.get('migration'),m.slug);assert.equal(u.searchParams.get('hotspot'),m.destinationHotspot);const [lon,lat]=routeCoordinates(m)[0];assert.ok(lat>40.6&&lat<40.8&&lon>-74.2&&lon<-73.9)}
assert.ok(read('app/jersey-city/where-they-go.tsx').includes('id="where-they-go"'));assert.ok(read('app/migration-panel.tsx').includes('href="/jersey-city/wildlife#where-they-go"'));
const page=read('app/page.tsx');assert.ok(page.includes("'&view=species'"));assert.ok(page.includes("get('view')==='species'"));assert.ok(!page.includes('<Link'));
for(const p of ['app/page.tsx','app/guide-views.tsx','app/world.tsx'])assert.ok(read(p).includes('habitatEstimate('));
console.log(JSON.stringify({result:'PASS',estimated,missing,coastalPlain:'No estimate',compareExpandedHotspots:expanded,migrationOriginsAndReturnLinks:3,meetSpecies:'real href and URL state'}));
