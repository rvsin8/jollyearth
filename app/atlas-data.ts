let atlas:Promise<any>|undefined;
export function loadAtlas(){return atlas??=(fetch('/data/hotspots.json').then(r=>{if(!r.ok)throw Error('Atlas unavailable');return r.json()}).catch(e=>{atlas=undefined;throw e}));}
let land:Promise<any>|undefined;
export function loadLand(){return land??=fetch('/data/land.json').then(r=>r.json());}
// The whole immutable polygon collection is parsed once per session. Selection only changes an ID.
export function preloadHotspot(id:string){void loadAtlas().then(d=>d.hotspots.find((h:any)=>h.id===id)).catch(()=>{});}
