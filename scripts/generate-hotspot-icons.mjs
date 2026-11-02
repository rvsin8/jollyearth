import fs from 'node:fs';
import {geoAzimuthalEqualArea,geoPath} from 'd3-geo';
const {hotspots}=JSON.parse(fs.readFileSync('public/data/hotspots.json','utf8'));
fs.mkdirSync('public/icons/hotspots',{recursive:true});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
for(const h of hotspots){
 const projection=geoAzimuthalEqualArea().rotate([-h.center[0],-h.center[1]]).fitExtent([[7,7],[81,65]],h.geometry);
 const path=geoPath(projection).digits(1)(h.geometry);
 const color=h.remaining?.value==null?'#c2c1bc':h.remaining.value<10?'#b1826d':h.remaining.value<=20?'#bbab7c':'#8e9d86';
 fs.writeFileSync('public'+h.icon,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 72"><title>${escape(h.name)} outline</title><desc>Regional outline from the atlas hotspot boundaries. Shape only; not a map to scale.</desc><path d="${path}" fill="${color}" stroke="#514B40" stroke-width=".7" stroke-linejoin="round"/></svg>\n`);
}
console.log(`Generated ${hotspots.length} regional SVG illustrations from atlas boundaries`);
