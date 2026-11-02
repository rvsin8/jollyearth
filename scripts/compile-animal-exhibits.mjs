// Project existing sourced records into one exhibit registry; never synthesize biology.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ecology=read('public/data/ecology.json');
const models=read('public/data/models.json'),profiles=read('public/data/species.json').species;
const hotspots=read('public/data/hotspots.json').hotspots,local=read('public/data/jersey-city/guide.json'),migrations=read('public/data/migrations.json');
const same=(a,b)=>a?.toLowerCase()===b?.toLowerCase();
const catalog=[...models.filter(m=>m.kind==='animal')];
for(const s of local.species.filter(s=>s.id!=='water-nymph'))if(!catalog.some(m=>same(m.scientificName,s.scientific)))catalog.push({slug:s.id,commonName:s.name,scientificName:s.scientific,kind:'animal',file:null});
const exhibits=catalog.map(m=>{
 const p=profiles.find(s=>same(s.scientific,m.scientificName)),l=local.species.find(s=>same(s.scientific,m.scientificName)),route=migrations.find(s=>same(s.scientificName,m.scientificName));
 const regions=hotspots.filter(h=>h.species.some(s=>same(s.scientific,m.scientificName))||p?.hotspots?.includes(h.id));
 const entries=regions.flatMap(h=>h.species.filter(s=>same(s.scientific,m.scientificName)));
 const e=ecology[m.slug]||entries.map(s=>ecology[s.id]).find(Boolean);
 const sources=[...(m.exhibit?.sources||[]),...(p?.sources||[]),...local.sources.filter(s=>l?.sources.includes(s.id)),...(route?.sources||[]),...regions.flatMap(h=>h.sources.filter(s=>entries.some(e=>s.id==='ecology-'+e.id)))];
 return {slug:m.exhibitSlug||m.slug,commonName:m.commonName,scientificName:m.scientificName,aliases:[...new Set([m.slug,...entries.map(s=>s.id),...(p?.id?[p.id]:[]),...(l?.id?[l.id]:[])])],illustration:m.icon||null,illustrationFallback:m.illustrationFallback||null,illustrationAlt:m.iconAlt||m.commonName,illustrationCredit:m.iconCredit||null,photo:p?.image||l?.image||entries.find(s=>s.image)?.image||null,
  habitat:m.exhibit?.habitat||p?.habitat||e?.habitat||null,diet:m.exhibit?.diet||p?.diet||(e?.foods?.length?'Selected foods documented in this guide: '+e.foods.join(', ')+'. This is not a complete diet.':null),distribution:m.exhibit?.distribution||p?.range||l?.range||null,
  size:m.size||null,populationTrend:m.populationTrend||null,model:m.model||null,status:m.iucn||p?.status||l?.status||null,statusProvider:m.iucn?'IUCN Red List':p?.statusProvider||(p?.status?'GBIF cached IUCN category':l?.status?'Local protection context':null),assessmentYear:m.assessmentYear||p?.assessmentYear||null,dataAsOf:m.dataAsOf||p?.dataAsOf||null,
  facts:m.exhibit?.facts||[p?.traits||p?.description||l?.traits,route?.summary].filter(Boolean),threats:p?.threats||l?.threats||(route?[route.threat]:[]),action:p?.action||l?.action||null,
  regions:regions.map(h=>({id:h.id,name:h.name})),sources:[...new Map(sources.concat(e?.source&&!sources.some(s=>s.url===e.source)?[{id:'exhibit-ecology',title:'Species ecology reference',url:e.source,note:e.note,accessed:'See regional reference record'}]:[]).map(s=>[s.url,s])).values()]};
});
fs.writeFileSync('public/data/animal-exhibits.json',JSON.stringify(exhibits,null,2)+'\n');
console.log(`Compiled ${exhibits.length} animal exhibits from existing records; missing biology stays unfilled`);
