import records from '@/public/data/migrations.json';
export const migrations=records;
export type Migration=(typeof records)[number];
export const findMigration=(slug:string|null|undefined)=>records.find(m=>m.slug===slug);
export function migrationHref(m:Migration){return '/?migration='+encodeURIComponent(m.slug)+(m.destinationHotspot?'&hotspot='+encodeURIComponent(m.destinationHotspot):'')+'&intro=0';}
export function migrationDescription(m:Migration){return `${m.commonName}, ${m.localSite} to ${m.destinationName}, approximately ${m.distanceKm.toLocaleString('en-US')} kilometres straight-line separation. ${m.routeType}. Not an individual tracking record.`;}
// Data uses [latitude, longitude]; D3 uses [longitude, latitude].
export function routeCoordinates(m:Migration):[[number,number],[number,number]]{return [[m.originLatLng[1],m.originLatLng[0]],[m.destinationLatLng[1],m.destinationLatLng[0]]];}
