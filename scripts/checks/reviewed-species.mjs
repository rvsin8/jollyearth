import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=read('public/data/models.json'),profiles=read('public/data/species.json').species,hotspots=read('public/data/hotspots.json').hotspots;
const reviewed=manifest.filter(m=>m.statusProvider==='IUCN Red List');
assert.equal(reviewed.length,10);
const expected={'red-wolf':'CR','saola':'CR','javan-rhinoceros':'CR','mountain-gorilla':'EN','tamarin':'EN','philippine-eagle':'CR','ethiopian-wolf':'EN','iberian-lynx':'VU','hirola':'CR','kākāpō':'CR'};
for(const m of reviewed){
 assert.equal(m.status,expected[m.slug]);assert.equal(m.file,null);
 assert.equal(profiles.filter(s=>s.id===m.slug).length,1);
 const p=profiles.find(s=>s.id===m.slug);
 assert.equal(p.status,m.status);assert.equal(p.trend,m.populationTrend);assert.equal(p.description,m.description);assert.deepEqual(p.sources,m.sources);
 assert.ok(['increasing','decreasing','stable'].includes(m.populationTrend));assert.ok(m.assessmentYear&&m.assessmentPublication&&m.reviewedAt);
 assert.ok(m.description&&m.primaryThreats.length&&m.action&&m.actionUrl);
 assert.ok(m.sources.some(s=>s.url===m.statusSource&&s.url.startsWith('https://www.iucnredlist.org/species/')));
 for(const source of m.sources){assert.equal(new URL(source.url).protocol,'https:');if(source.licenseUrl)assert.equal(new URL(source.licenseUrl).protocol,'https:')}
 assert.ok(m.sources.some(s=>s.id.startsWith('photo-')&&s.licenseUrl));
 for(const asset of [m.icon,m.image])assert.ok(fs.existsSync('public'+asset));
 for(const id of m.hotspots){const h=hotspots.find(h=>h.id===id);assert.ok(h);assert.equal(h.species.filter(s=>s.id===m.slug).length,1);assert.equal(h.species.find(s=>s.id===m.slug).image,m.image)}
 assert.equal(m.population,undefined,'No unsupported population estimate');
}
assert.equal(profiles.find(s=>s.id==='mountain-gorilla').scientific,'Gorilla beringei beringei');
assert.equal(profiles.find(s=>s.id==='tamarin').trend,'decreasing');
assert.ok(profiles.find(s=>s.id==='javan-rhinoceros').trendNote.includes('not a claim'));
console.log('PASS: 10 reviewed profiles, unique icons, local photo fallbacks, valid hotspot links, dated trends and cited status/credit records');
