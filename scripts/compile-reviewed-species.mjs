// Authored IUCN profiles live in models.json. Keep the cached UI catalog in sync.
import fs from 'node:fs';
const path='public/data/species.json';
const catalog=JSON.parse(fs.readFileSync(path,'utf8'));
const manifest=JSON.parse(fs.readFileSync('public/data/models.json','utf8'));
const reviewed=manifest.filter(m=>m.statusProvider==='IUCN Red List');
const ids=new Set(reviewed.map(m=>m.slug));
catalog.species=[...catalog.species.filter(s=>!ids.has(s.id)),...reviewed.map(m=>({
 id:m.slug,name:m.commonName,scientific:m.scientificName,color:m.color,image:m.image,alt:m.alt,
 photoCaption:m.photoCaption,biomes:m.biomes,hotspots:m.hotspots,range:m.range,traits:m.description,
 description:m.description,threats:m.primaryThreats,action:m.action,actionUrl:m.actionUrl,
 trend:m.populationTrend,trendNote:m.trendNote,status:m.status,statusProvider:m.statusProvider,
 assessmentYear:m.assessmentYear,assessmentPublication:m.assessmentPublication,
 dataAsOf:m.reviewedAt,statusSource:m.statusSource,stale:false,sources:m.sources
}))];
fs.writeFileSync(path,JSON.stringify(catalog,null,2)+'\n');
console.log(`Compiled ${reviewed.length} reviewed IUCN profiles from models.json`);
