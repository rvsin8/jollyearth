const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const plants=JSON.parse(fs.readFileSync('public/data/plants.json')),sites=JSON.parse(fs.readFileSync('public/data/plant-sites.json'));
function load(file,imports){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:id=>imports[id]});return exports}
const data=load('app/plant-lab/catalog.ts',{'@/public/data/plants.json':plants,'@/public/data/plant-sites.json':sites}).default;
const bedExports=load('app/plant-lab/bed.ts',{'./catalog':data});
const {parseDesign,reasons,score}=bedExports;
const valid={v:1,site:'schoolyard',bed:[{slug:'asclepias-incarnata',cell:20}]};assert.ok(parseDesign(JSON.stringify(valid)));assert.equal(parseDesign(JSON.stringify({...valid,site:'unknown'})),null);assert.equal(parseDesign(JSON.stringify({...valid,bed:[{slug:'invented-plant',cell:20}]})),null);assert.equal(parseDesign(JSON.stringify({...valid,bed:[{slug:'asclepias-incarnata',cell:64}]})),null);assert.equal(parseDesign(JSON.stringify({...valid,bed:[...valid.bed,...valid.bed]})),null);assert.equal(parseDesign('{broken'),null);
const p=data.plants.find(p=>p.id==='swamp-milkweed'),site=data.sites.find(s=>s.id==='schoolyard-strip');assert.ok(reasons(p,site,20).some(s=>s.includes('soil')));assert.ok(reasons(data.plants[0],site,0).some(s=>s.includes('extends beyond')));assert.ok(reasons(p,data.sites[1],20,[{id:'b',slug:p.id,cell:21}]).every(s=>typeof s==='string'));
const one=score([{id:'a',slug:p.id,cell:0}]),two=score([{id:'a',slug:p.id,cell:0},{id:'b',slug:p.id,cell:1}]);assert.deepEqual(one,two);assert.ok(Object.values(score(data.plants.map((p,i)=>({id:String(i),slug:p.id,cell:i})))).every(v=>v>=0&&v<=100));
const seeded=parseDesign(JSON.stringify({v:2,site:'liberty-meadow',bed:[{slug:'red-maple',cell:30,seed:4294967295}]}));assert.equal(seeded.bed[0].seed,4294967295);
console.log('Plant lab: sharing validation, incompatible conditions, boundary warnings and duplicate-safe scores passed');
