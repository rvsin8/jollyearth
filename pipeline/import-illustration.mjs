// Byte-preserving import. Never optimizes, redraws, or alters existing illustrations.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [svg,png]=process.argv.slice(2);if(!svg||path.basename(svg)!=='red-fox.svg')throw Error('Usage: node pipeline/import-illustration.mjs /path/red-fox.svg [/path/red-fox.png]');
const bytes=fs.readFileSync(svg);if(!bytes.toString().includes('<svg'))throw Error('Not an SVG');
const dest='public/icons/species/red-fox.svg';if(fs.existsSync(dest)&&!fs.readFileSync(dest).equals(bytes))throw Error('A different fox master already exists; review it before replacing');
fs.copyFileSync(svg,dest);if(png){fs.mkdirSync('public/images/species',{recursive:true});fs.copyFileSync(png,'public/images/species/red-fox.png')}
const file='content/animals/registry.json',records=JSON.parse(fs.readFileSync(file));const fox=records.find(x=>x.slug==='red-fox');fox.icon='/icons/species/red-fox.svg';fox.iconCredit='Illustration supplied for Earthbound';fs.writeFileSync(file,JSON.stringify(records,null,2)+'\n');console.log('Imported master unchanged: sha256 '+crypto.createHash('sha256').update(bytes).digest('hex'));
