import fs from 'node:fs';
import assert from 'node:assert/strict';
import {geoContains,geoDistance,geoInterpolate} from 'd3-geo';
const {hotspots}=JSON.parse(fs.readFileSync('public/data/hotspots.json'));
const migrations=JSON.parse(fs.readFileSync('public/data/migrations.json'));
assert.equal(hotspots.length,36);
for(const h of hotspots){
 assert.ok(!h.role,'Undefined role removed');
 for(const field of ['endemics','atRisk','remaining','area']){
  const value=h[field];if(!value||value.value===null){if(value)assert.equal(value.display,field==='remaining'?'No estimate':'Not available');continue;}
  assert.ok(!/criterion|≥\s*1,500/.test(value.display),`${h.id} ${field}: criterion used as measurement`);
  assert.ok(h.sources.some(s=>s.id===value.source),`${h.id} ${field}: missing source`);
 }
 if(h.endemics.value!==null){assert.equal(h.endemics.source,'cepf-endemics');assert.ok(h.endemics.value>0)}
 assert.ok(!h.biomes.includes('Coral reef'));
}
assert.equal(new Set(migrations.map(m=>m.slug)).size,migrations.length);
for(const m of migrations){
 for(const field of ['slug','commonName','scientificName','localSite','localSeason','destinationHotspot','destinationLatLng','routeType','distanceKm','threat','sources'])assert.ok(Object.hasOwn(m,field),m.slug+': '+field);
 const a=[m.originLatLng[1],m.originLatLng[0]],b=[m.destinationLatLng[1],m.destinationLatLng[0]];
 assert.equal(m.distanceKm,Math.round(geoDistance(a,b)*6371/100)*100);
 const members=hotspots.filter(h=>geoContains(h.geometry,b));
 if(m.destinationHotspot)assert.ok(members.some(h=>h.id===m.destinationHotspot),m.slug+' destination outside claimed hotspot');
 else assert.equal(members.length,0,'Non-hotspot destination must stay explicitly unassigned');
 const arc=geoInterpolate(a,b);assert.ok(geoDistance(a,arc(0))<1e-10);assert.ok(geoDistance(b,arc(1))<1e-10);
 assert.ok(fs.existsSync('public'+m.image));assert.ok(m.sources.length>=3);
 for(const source of m.sources){assert.equal(new URL(source.url).protocol,'https:');assert.ok(source.note&&source.accessed)}
}
const world=fs.readFileSync('app/world.tsx','utf8');assert.ok(!world.includes('setLineDash'));assert.ok(world.includes('/1200'));assert.ok(world.includes('motion.matches?1:'));assert.ok(world.includes('aria-describedby'));
const home=fs.readFileSync('app/page.tsx','utf8');assert.ok(!/≤ 30%|c\.role|source\|\|'criteria'/.test(home));
console.log(JSON.stringify({hotspots:36,cepfCounts:hotspots.filter(h=>h.endemics.value!==null).length,missingEndemicCounts:hotspots.filter(h=>h.endemics.value===null).map(h=>h.id),biomeMemberships:hotspots.reduce((n,h)=>n+h.biomes.length,0),migrations:migrations.map(m=>({slug:m.slug,distanceKm:m.distanceKm,destination:m.destinationHotspot})),result:'PASS'}));
