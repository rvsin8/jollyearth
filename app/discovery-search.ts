export type Discovery={id:string;name:string;secondary:string;type:'Species'|'Places';image:string;href:string;ready:boolean};
const normalize=(text:string)=>text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase();
export function discoveryIndex(animals:any[],hotspots:any[]):Discovery[]{
 return [...animals.filter(a=>a.illustration).map(a=>({id:a.slug,name:a.commonName,secondary:a.scientificName,type:'Species' as const,image:a.illustration,href:'/collection?exhibit='+encodeURIComponent(a.slug),ready:a.model?.status==='ready'&&!!a.model?.file})),...hotspots.map(h=>({id:h.id,name:h.name,secondary:h.region,type:'Places' as const,image:h.icon||'',href:'/?intro=0&hotspot='+encodeURIComponent(h.id),ready:false}))];
}
export function discoveryResults(index:Discovery[],query:string,scope:string,limit=12){
 const term=normalize(query.trim());const matches=index.filter(i=>(scope==='All'||i.type===scope)&&normalize(`${i.name} ${i.secondary}`).includes(term));
 return {matches:matches.slice(0,limit),total:matches.length};
}
