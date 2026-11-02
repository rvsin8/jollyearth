import fs from 'node:fs';
import crypto from 'node:crypto';
import {inspect} from './validate.mjs';
const slug=process.argv[2],configs=JSON.parse(fs.readFileSync('pipeline/collection.json')),cfg=configs.find(c=>c.exhibitSlug===slug);
if(!cfg)throw Error('Usage: node pipeline/validate-collection.mjs <exhibit-slug>');
const records=JSON.parse(fs.readFileSync('content/animals/registry.json')),record=records.find(r=>r.slug===cfg.registrySlug);
const result={slug:cfg.registrySlug,exhibitSlug:slug,checkedAt:new Date().toISOString(),status:'failed',models:[],errors:[],visualReview:null};
for(const variant of ['desktop','mobile']){
 const file=`public/models/animals/${slug}${variant==='mobile'?'.mobile':''}.glb`;
 try{const r=await inspect(file,variant,{requiredClips:cfg.clips,canonical:cfg.clips,lengthRange:cfg.lengthRange});result.models.push(r);result.errors.push(...r.errors.map(e=>variant+': '+e))}catch(e){result.errors.push(variant+': '+e.message)}
}
let credit;
try{credit=JSON.parse(fs.readFileSync(`pipeline/assets/${slug}/credit.json`));for(const k of ['creator','creatorUrl','license','licenseUrl','sourceUrl'])if(!credit[k])throw Error('Missing '+k);for(const k of ['creatorUrl','licenseUrl','sourceUrl'])if(new URL(credit[k]).protocol!=='https:')throw Error('Not HTTPS: '+k)}catch(e){result.errors.push('Credit: '+e.message)}
try{
 result.visualReview=JSON.parse(fs.readFileSync(`pipeline/reports/${slug}-visual.json`));
 const review=result.visualReview;
 if(review.status!=='reviewed'||!review.renders?.length)throw Error('Inspect rendered views and all clips before marking reviewed');
 for(const p of review.renders)if(!fs.existsSync(p))throw Error('Missing render '+p);
 for(const view of ['front','side','rear','three-quarter']){
  const path=review.views?.[view];
  if(!path||!fs.existsSync(path))throw Error('Missing inspected '+view+' view');
 }
 for(const clip of cfg.clips)if(!review.clipsReviewed?.includes(clip))throw Error('Clip not visually reviewed: '+clip);
 // Bind visual approval to these exact exports. A regenerated asset cannot inherit an older review.
 for(const variant of ['desktop','mobile']){
  const file=`public/models/animals/${slug}${variant==='mobile'?'.mobile':''}.glb`;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(review.exportSha256?.[variant]!==hash)throw Error('Visual review does not cover current '+variant+' export');
 }
}catch(e){result.errors.push('Visual review: '+e.message)}
if(!result.errors.length){result.status='passed';record.model={status:'ready',file:`/models/animals/${slug}.glb`,mobileFile:`/models/animals/${slug}.mobile.glb`,clips:cfg.clips,credit};record.file=record.model.file;record.hasAnimation=true;record.hasLOD=true;Object.assign(record,credit);fs.writeFileSync('content/animals/registry.json',JSON.stringify(records,null,2)+'\n')}
fs.writeFileSync(`pipeline/reports/${cfg.registrySlug}.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;
