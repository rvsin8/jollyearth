import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=read('public/data/models.json'),species=read('public/data/species.json').species,hotspots=read('public/data/hotspots.json').hotspots;
const catalog=[...read('public/data/migrations.json').map(m=>({id:m.slug,name:m.commonName,scientific:m.scientificName})),...species,...hotspots.flatMap(h=>h.species||[])];let n=0;
const paths=new Set(),slugs=new Set();
for(const m of manifest){assert.ok(!slugs.has(m.slug),'Duplicate slug');slugs.add(m.slug);assert.match(m.icon,/^\/icons\/species\/[a-z0-9-]+\.svg$/);assert.ok(!paths.has(m.icon),'Each species needs an individual icon');paths.add(m.icon);const svg=fs.readFileSync('public'+m.icon,'utf8');assert.match(svg,/<svg/);assert.match(svg,/<title>/);assert.doesNotMatch(svg,/<(?:image|filter|linearGradient|radialGradient|script)\b/);assert.doesNotMatch(svg,/(?:href|src)=/);assert.ok(Buffer.byteLength(svg)<15000);}
for(const s of catalog){assert.ok(manifest.some(m=>m.slug===s.id||m.scientificName?.toLowerCase()===s.scientific?.toLowerCase()),`Missing icon: ${s.name}`);n++}
const records=fs.readFileSync('app/model-records.ts','utf8');assert.match(records,/catalog\.filter\(m=>typeof m.file==='string'&&m.file.endsWith\('\.glb'\)\)/);
console.log(`PASS: ${paths.size} unique SVG portraits cover ${n} species references; icon-only records excluded from GLB loading`);
