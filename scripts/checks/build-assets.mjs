import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
// RSC may otherwise publish a manifest pointing at an eliminated CSS-only JS chunk.
const missing=new Set(),assets=new Set();
function visit(value){if(typeof value==='string'){for(const match of value.matchAll(/\/_next\/static\/[^\s"'\\)]+/g)){const asset=match[0];assets.add(asset);if(!fs.existsSync(path.join('dist/client',asset)))missing.add(asset)}}else if(value&&typeof value==='object')Object.values(value).forEach(visit)}
for(const file of ['dist/server/__vite_rsc_assets_manifest.js','dist/server/ssr/__vite_rsc_assets_manifest.js']){assert.ok(fs.existsSync(file),file);visit((await import(pathToFileURL(path.resolve(file)).href)).default)}
assert.deepEqual([...missing],[],'Build manifest references missing browser assets');
console.log(`PASS: ${assets.size} distinct browser JS/CSS assets referenced by both server manifests exist`);
// Inspect the shipped client output, not just the authored new URL expression.
const clientFiles=fs.readdirSync('dist/client/_next/static/chunks').filter(p=>p.endsWith('.js'));
const plantClients=clientFiles.map(p=>fs.readFileSync('dist/client/_next/static/chunks/'+p,'utf8')).filter(code=>code.includes('Plant worker must use the site origin'));
assert.equal(plantClients.length,1,'One compiled plant worker client');
const plantClient=plantClients[0];
assert.ok(!/file:\/\/\/ROOT\/app\/plant-lab/.test(plantClient),'No server file URL in shipped worker construction');
assert.ok(plantClient.includes('location.origin'),'Worker resolves against the browser origin');
const workerPaths=[...plantClient.matchAll(/\/_next\/static\/worker-[\w-]+\.js/g)].map(m=>m[0]);
assert.ok(workerPaths.length>0,'Bundler emitted a plant worker asset URL');
for(const asset of workerPaths){assert.ok(fs.existsSync('dist/client'+asset),'Worker asset exists: '+asset);assert.equal(new URL(asset,'https://earthbound-field-atlas.rvsin8.chatgpt.site').protocol,'https:')}
console.log('PASS: plant worker asset exists and resolves to HTTPS on the site origin');
