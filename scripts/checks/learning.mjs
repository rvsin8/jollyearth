import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
async function load(file){const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}
const {rainResult,sameConditions,compareRuns}=await load('app/learn/model.ts');
const {initialState,decodeState}=await load('app/learn/storage.ts');
for(const rainfall of ['Light','Heavy']){
 const pavement={rainfall,ground:'Pavement'},garden={rainfall,ground:'Add a rain garden'};
 assert.deepEqual(rainResult(garden),rainResult({...garden}));
 assert.notEqual(rainResult(garden).runoff,rainResult(pavement).runoff);
 assert.match(compareRuns(pavement,garden),/less runoff/);
 assert.match(compareRuns(garden,pavement),/more runoff/);
 assert.equal(sameConditions(garden,{...garden}),true);
 assert.equal(sameConditions(garden,pavement),false);
}
assert.match(compareRuns({rainfall:'Light',ground:'Pavement'},{rainfall:'Heavy',ground:'Add a rain garden'}),/Rainfall changed/);
assert.match(rainResult({rainfall:'Heavy',ground:'Pavement'}).sewer,/cannot predict/);
const state=initialState();assert.equal(state.detective.answer,null);assert.equal(state.entries.length,0);
assert.deepEqual(decodeState(JSON.stringify(state)),state);
for(const invalid of ['{','null',JSON.stringify({...state,version:2}),JSON.stringify({...state,entries:[{}]}),JSON.stringify({...state,rain:{...state.rain,runs:[{id:'invalid'}]}})])assert.throws(()=>decodeState(invalid));
const entry={...state.draft,id:'one',noticed:'Black cap',savedAt:'2026-11-02T00:00:00Z',attribution:'Shantham11 · CC BY-SA 4.0'};
state.entries=[entry];state.draft=entry;state.detective.reason='Dark feathers above the eye';
const restored=decodeState(JSON.stringify(state));assert.equal(restored.draft.noticed,'Black cap');assert.equal(restored.entries[0].attribution,entry.attribution);assert.equal(restored.detective.reason,state.detective.reason);
for(const file of ['app/learn/page.tsx','app/learn/detective/page.tsx','app/learn/rain/page.tsx','app/learn/journal/page.tsx','app/jersey-city/map/page.tsx','app/jersey-city/stories/page.tsx','public/fonts/Fraunces-OFL.txt','public/fonts/DMSans-OFL.txt'])assert.ok(fs.existsSync(file),file);
console.log('PASS: deterministic four-condition model, fair comparison, stale-condition detection, no automatic overflow claim, unanswered start, storage round-trip, schema rejection, preserved attribution and draft, required routes/fonts. Browser journeys remain unexecuted.');
