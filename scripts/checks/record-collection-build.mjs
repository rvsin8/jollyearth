import fs from 'node:fs';
// Invoked only after the ordered production build command succeeds.
if(!fs.existsSync('dist/server/wrangler.json'))throw Error('No production build output');
const configs=JSON.parse(fs.readFileSync('pipeline/collection.json'));
const checks=JSON.parse(fs.readFileSync('pipeline/reports/collection-checks.json'));
if(checks.status!=='technical-checks-passed')throw Error('Model technical checks have not passed');
const visualModels=Object.fromEntries(configs.map(({exhibitSlug})=>{
 const review=JSON.parse(fs.readFileSync(`pipeline/reports/${exhibitSlug}-visual.json`));
 return [exhibitSlug,review.status];
}));
const data={checkedAt:new Date().toISOString(),productionBuild:'passed',typecheck:'passed',registryAndURLChecks:'passed',modelTechnicalChecks:checks.status,preservation:`${checks.protectedAssetsUnchanged} files unchanged`,visualModels,browserInteractions:'not run — required control-browser capability unavailable',deployment:'held — user requires interaction verification before publishing'};
fs.writeFileSync('pipeline/reports/collection-release.json',JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data));
