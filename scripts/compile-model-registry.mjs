import fs from 'node:fs';import crypto from 'node:crypto';
const source=JSON.parse(fs.readFileSync('content/animals/registry.json','utf8'));
for(const m of source.filter(x=>x.model?.status==='ready')){const report=JSON.parse(fs.readFileSync('pipeline/reports/'+m.slug+'.json'));if(report.status!=='passed')throw Error('Model has no passing validation: '+m.slug);for(const file of [m.model.file,m.model.mobileFile]){const r=report.models.find(x=>'public'+file===x.file);if(!r||r.sha256!==crypto.createHash('sha256').update(fs.readFileSync('public'+file)).digest('hex'))throw Error('Model changed since validation: '+file)}}
const records=source.filter(m=>m.kind==='plant'||'hasLOD' in m).map(({fidelity,illustrationFile,fallbackFile,...m})=>m);
fs.writeFileSync('public/data/models.json',JSON.stringify(records,null,2)+'\n');
console.log(`Published ${records.length} model records; fidelity remains in the private authoring registry`);
