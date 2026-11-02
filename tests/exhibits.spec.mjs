import {test,expect} from '@playwright/test';
import fs from 'node:fs';
// Never fulfills or modifies the fox illustration: missing supplied artwork remains a visible failure.
const snapshot=page=>page.evaluate(()=>({url:location.pathname+location.search+location.hash,x:scrollX,y:scrollY,selected:document.querySelector('.biome-item.active')?.textContent,globe:document.querySelector('.globe-wrapper svg')?.getAttribute('viewBox')}));
async function trackGPU(page){await page.addInitScript(()=>{window.__contexts=[];const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){const ctx=get.apply(this,args);if(ctx&&/^webgl/.test(args[0])&&!window.__contexts.includes(ctx))window.__contexts.push(ctx);return ctx}})}
async function shot(page,name,info){fs.mkdirSync('pipeline/reports/screenshots',{recursive:true});const path=`pipeline/reports/screenshots/${info.project.name}-${name}.png`;await page.screenshot({path,fullPage:false});await info.attach(name,{path,contentType:'image/png'})}
test('ready fox, trigger, direct link, Escape and state preservation',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await trackGPU(page);
 for(const route of ['/jersey-city/wildlife','/?biome=Grassland&intro=0']){
  await page.goto(route);const trigger=page.getByRole('link',{name:'Open Red fox exhibit'});await expect(trigger).toBeVisible();await trigger.scrollIntoViewIfNeeded();const before=await snapshot(page);await shot(page,route.startsWith('/jersey')?'ecosystem-city':'ecosystem-grassland',info);
  await trigger.click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page).toHaveURL(/exhibit=red-fox/);await expect(page.locator('.animal-model-host canvas')).toBeVisible();for(const clip of ['Idle','Walk','Trot','Run']){await page.getByRole('button',{name:clip,exact:true}).click();await expect(page.getByRole('button',{name:clip,exact:true})).toHaveAttribute('aria-pressed','true')}await expect(page.getByRole('heading',{name:'Diet',exact:true})).toBeVisible();await page.getByText('Sources & dates',{exact:true}).click();await expect(page.getByText('Animal Diversity Web — Vulpes vulpes')).toBeVisible();await shot(page,'fox-exhibit'+(route.startsWith('/jersey')?'-city':'-grassland'),info);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect.poll(()=>snapshot(page)).toEqual(before);await expect.poll(()=>page.evaluate(()=>window.__contexts.filter(c=>!c.isContextLost()).length)).toBe(0);await shot(page,'after-escape'+(route.startsWith('/jersey')?'-city':'-grassland'),info);
 }
 await page.goto('/?biome=Grassland&intro=0&exhibit=red-fox');await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('heading',{name:'Red fox',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);expect(errors).toEqual([]);
});
test('fixture loads, orbits, zooms, switches both clips and releases context',async({page},info)=>{
 await trackGPU(page);await page.goto('/?biome=Grassland&intro=0&model=fixture');const trigger=page.getByRole('link',{name:'Open Red fox exhibit'});await trigger.scrollIntoViewIfNeeded();const before=await snapshot(page);await trigger.click();const canvas=page.locator('.animal-model-host canvas');await expect(canvas).toBeVisible();
 await expect(page.getByRole('button',{name:'Idle',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Walk',exact:true}).click();await expect(page.getByRole('button',{name:'Walk',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Pause animation'}).click();
 const start=await canvas.screenshot();await page.getByRole('button',{name:'Rotate right',exact:true}).click();await expect.poll(async()=>Buffer.compare(start,await canvas.screenshot())).not.toBe(0);const rotated=await canvas.screenshot();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect.poll(async()=>Buffer.compare(rotated,await canvas.screenshot())).not.toBe(0);
 await canvas.focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('+');await page.keyboard.press('Home');await page.getByRole('button',{name:'Idle',exact:true}).click();await expect(page.getByRole('button',{name:'Idle',exact:true})).toHaveAttribute('aria-pressed','true');await shot(page,'fixture-test-only',info);
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect.poll(()=>snapshot(page)).toEqual(before);await expect.poll(()=>page.evaluate(()=>window.__contexts.filter(c=>!c.isContextLost()).length)).toBe(0);
});
test('loading, retry, and reduced motion',async({page})=>{
 let fail=true;await page.route('**/__test__/animated-test.glb',async route=>{if(fail)return route.abort();await route.fulfill({path:'tests/fixtures/animated-test.glb',contentType:'model/gltf-binary'})});
 await page.goto('/?intro=0&exhibit=red-fox&model=fixture');await expect(page.getByText('The 3D model didn’t load',{exact:true})).toBeVisible();fail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.animal-model-host canvas')).toBeVisible();await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByRole('button',{name:'Walk',exact:true})).toBeDisabled();
});

test('species without a model keeps its original illustration',async({page})=>{await page.goto('/?intro=0&exhibit=condor');await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByText('3D model in preparation',{exact:true})).toBeVisible();await expect(page.getByRole('group',{name:'Available animations'})).toHaveCount(0);await expect(page.locator('.animal-illustration img')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0)});

const collection=[
 {slug:'bornean-orangutan',name:'Bornean orangutan',clips:['Idle','Walk','Climb','Reach']},
 {slug:'green-sea-turtle',name:'Green sea turtle',clips:['Float','Swim','Glide','Turn']},
 {slug:'gopher-tortoise',name:'Gopher tortoise',clips:['Idle','Walk','Turn','Dig']},
 {slug:'ring-tailed-lemur',name:'Ring-tailed lemur',clips:['Idle','Walk','Leap','Climb']}
];
for(const animal of collection)test(animal.name+' exhibit, controls, sharing and back',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await trackGPU(page);
 await page.goto('/at-risk?intro=0');const trigger=page.locator('.model-link').filter({hasText:'Open exhibit'}).and(page.getByRole('link',{name:'Open '+animal.name+' exhibit'}));await expect(trigger).toBeVisible();await trigger.scrollIntoViewIfNeeded();const before=await snapshot(page);await trigger.click();await expect(page).toHaveURL(new RegExp('exhibit='+animal.slug));const canvas=page.locator('.animal-model-host canvas');await expect(canvas).toBeVisible({timeout:25000});
 for(const clip of animal.clips){const button=page.getByRole('button',{name:clip,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true')}
 await page.getByRole('button',{name:'Pause animation',exact:true}).click();const start=await canvas.screenshot();await page.getByRole('button',{name:'Rotate right',exact:true}).click();await expect.poll(async()=>Buffer.compare(start,await canvas.screenshot())).not.toBe(0);
 const rotated=await canvas.screenshot();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect.poll(async()=>Buffer.compare(rotated,await canvas.screenshot())).not.toBe(0);await page.getByRole('button',{name:'Zoom out',exact:true}).click();await page.getByRole('button',{name:'Reset model view',exact:true}).click();await page.getByRole('button',{name:'Play animation',exact:true}).click();
 await page.getByRole('button',{name:'Share this exhibit'}).click();await expect(page.getByLabel('Exhibit link')).toHaveValue(new RegExp('exhibit='+animal.slug));await shot(page,animal.slug+'-exhibit',info);await page.goBack();await expect(page.getByRole('dialog')).toHaveCount(0);await expect.poll(()=>snapshot(page)).toEqual(before);await expect.poll(()=>page.evaluate(()=>window.__contexts.filter(c=>!c.isContextLost()).length)).toBe(0);
 await page.goto('/?intro=0&exhibit='+animal.slug);await expect(page.getByRole('heading',{name:animal.name,exact:true})).toBeVisible();await expect(page.locator('.animal-model-host canvas')).toBeVisible({timeout:25000});await page.getByRole('button',{name:'Close animal exhibit'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(errors).toEqual([]);
});

for(const animal of collection)test(animal.name+' mobile polish and failure recovery',async({page},info)=>{
 await trackGPU(page);await page.goto('/?intro=0&exhibit='+animal.slug);
 await expect(page.locator('.animal-model-host canvas')).toBeVisible({timeout:25000});
 await page.getByRole('button',{name:'Share this exhibit'}).click();
 await expect(page.getByRole('button',{name:'Share this exhibit'})).toHaveAttribute('aria-expanded','true');
 await page.getByRole('button',{name:'Hide link',exact:true}).click();
 await expect(page.getByLabel('Exhibit link')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Share this exhibit'})).toBeFocused();
 if(info.project.name==='iphone-13'){
  const controls=page.locator('.animal-camera-controls button,.animal-animation-controls button');
  for(const button of await controls.all()){const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44)}
  await page.getByRole('button',{name:'Read species facts'}).click();
  await expect(page.getByRole('complementary',{name:'Species facts'})).toBeFocused();
 }
 await page.locator('.animal-model-host canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await expect(page.getByText('The 3D model didn’t load',{exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.__contexts.filter(c=>!c.isContextLost()).length)).toBe(0);
 await page.getByRole('button',{name:'Retry',exact:true}).click();
 await expect(page.locator('.animal-model-host canvas')).toBeVisible({timeout:25000});
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
