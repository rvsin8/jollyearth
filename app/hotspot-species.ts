export function documentedSpecies(h:any,catalog:any[]){
 const records=[...(h.species||[]),...catalog.filter(s=>s.hotspots?.includes(h.id))];
 return Array.from(new Map(records.map(s=>[s.scientific.trim().toLowerCase(),s])).values());
}
