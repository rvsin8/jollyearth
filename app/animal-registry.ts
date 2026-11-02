import records from '@/public/data/animal-exhibits.json';
export type AnimalRecord=(typeof records)[number];
export const animals=records;
export function findAnimal(slug:string,scientificName?:string){return records.find(a=>a.slug===slug||(a.aliases as string[]).includes(slug))||(scientificName?records.find(a=>a.scientificName.toLowerCase()===scientificName.toLowerCase()):undefined)}
export function exhibitHref(slug:string,base='/'){const url=new URL(base,'https://earthbound.invalid');url.searchParams.set('exhibit',slug);return url.pathname+url.search+url.hash}
// Exhibit navigation must never be treated as a change to the mounted ecosystem.
export function ecosystemQuery(search:string){const q=new URLSearchParams(search);q.delete('exhibit');return q.toString()}
