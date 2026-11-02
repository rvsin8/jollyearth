import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
const files=fs.readdirSync('app',{recursive:true}).filter(p=>/\.(css|tsx)$/.test(p));
for(const file of files){const text=fs.readFileSync(path.join('app',file),'utf8');
 assert.ok(!/Spectral|DM Sans|Georgia/.test(text),'Legacy font: '+file);
 if(file.endsWith('.css')&&file!=='fonts.css'){
  assert.ok(!/font-size\s*:\s*\d+(px|rem)/.test(text),'Untokenized type size: '+file);
  assert.ok(!/font-family\s*:\s*(?!var\()[^;}]*/.test(text),'Untokenized font family: '+file);
 }
 assert.ok(!/Interpretive 3D study|At Risk|Key Traits|Field Notes/.test(text),'Legacy UI label: '+file);
 for(const match of text.matchAll(/["'](\/images\/[^"']+\.(?:webp|png|jpg|svg))["']/g))assert.ok(fs.existsSync('public'+match[1]),'Missing image '+match[1]);
}
const fonts=JSON.parse(fs.readFileSync('public/fonts/font-provenance.json','utf8'));
for(const font of fonts.fonts){const data=fs.readFileSync('public/fonts/'+font.file);assert.equal(data.toString('ascii',0,4),'wOF2');assert.equal(data.readUInt32BE(8),data.length);assert.ok(fs.existsSync('public/fonts/'+font.license_file))}
const code=ts.transpileModule(fs.readFileSync('app/atlas-stats.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {introStats}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const sample={hotspots:[{remaining:{value:0},species:[{scientific:'Lemur catta'}]},{remaining:{value:20},species:[{scientific:'  Lemur  catta '}]},{remaining:{value:null},species:[]}]};
assert.deepEqual(introStats(sample,[{scientific:'LEMUR CATTA'}]),{hotspots:3,species:1,average:10,coverage:2});
assert.equal(introStats({hotspots:[]},[]).average,null);
const atlas=JSON.parse(fs.readFileSync('public/data/hotspots.json','utf8')),species=JSON.parse(fs.readFileSync('public/data/species.json','utf8'));
for(const dir of ['public/data'])for(const file of fs.readdirSync(dir,{recursive:true}).filter(f=>f.endsWith('.json'))){const text=fs.readFileSync(path.join(dir,file),'utf8');JSON.parse(text);for(const match of text.matchAll(/"(\/images\/[^" ]+)"/g))assert.ok(fs.existsSync('public'+match[1]),'Missing data image '+match[1])}
console.log('Typography, WOFF2 assets, image references, sentence-case regressions and counter coverage checks passed');
console.log('Splash counters:',introStats(atlas,[...species.species,...JSON.parse(fs.readFileSync('public/data/jersey-city/guide.json','utf8')).species,...JSON.parse(fs.readFileSync('public/data/plants.json','utf8'))]));
