import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('app/discovery-search.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {discoveryIndex,discoveryResults}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const animals=JSON.parse(fs.readFileSync('public/data/animal-exhibits.json'));
const atlas=JSON.parse(fs.readFileSync('public/data/hotspots.json'));
const index=discoveryIndex(animals,atlas.hotspots),illustrated=animals.filter(a=>a.illustration);
assert.equal(index.length,illustrated.length+atlas.hotspots.length);
assert.equal(index.filter(i=>i.ready).length,5);
for(const slug of ['red-fox','gopher-tortoise','green-sea-turtle','ring-tailed-lemur','bornean-orangutan']){
 const record=index.find(i=>i.id===slug);assert.ok(record?.ready);assert.equal(new URL(record.href,'https://example.test').searchParams.get('exhibit'),slug);
}
assert.equal(discoveryResults(index,'  VULPES VULPES  ','Species').matches[0].id,'red-fox');
assert.equal(discoveryResults(index,'pongo pygmaeus','Species').matches[0].id,'bornean-orangutan');
assert.equal(discoveryResults(index,'','Places').total,atlas.hotspots.length);
assert.equal(discoveryResults(index,'fox','Places').total,0);
assert.equal(discoveryResults(index,'no-such-species-000','All').total,0);
assert.equal(discoveryResults(index,'','All',3).matches.length,3);
assert.equal(discoveryResults(index,'','All',3).total,index.length);
const nullable=discoveryIndex([{slug:'test',commonName:'Kākāpō',scientificName:'Strigops habroptilus',illustration:'/test.svg',model:null}],[]);
assert.equal(nullable[0].ready,false);assert.equal(discoveryResults(nullable,'kakapo','Species').total,1);
const preserved=JSON.parse(fs.readFileSync('pipeline/reports/phase25-preservation-after.json')).files;
for(const [file,hash] of Object.entries(preserved)){
 const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file+' changed');
}
const result={status:'passed',indexedSpecies:illustrated.length,indexedPlaces:atlas.hotspots.length,readyExhibits:5,checks:['Scientific/common name matching','Case and accent normalization','Category isolation','Correct total vs limited results','Empty result','Null-model safety','Five canonical share links','All 50 SVG/GLB asset hashes preserved'],verification:'Pure search functions executed against actual data and exact asset hashes. No browser, layout or touch verification implied.'};
fs.writeFileSync('pipeline/reports/living-collection-discovery-checks.json',JSON.stringify(result,null,2)+'\n');console.log(result);
