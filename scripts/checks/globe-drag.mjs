import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';import {geoOrthographic} from 'd3-geo';
let code=ts.transpileModule(fs.readFileSync('app/globe-drag.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll("'d3-geo'","'"+import.meta.resolve('d3-geo')+"'");
const {grabPoint,dragRotation,dampVelocity,POLE_LIMIT}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
let cases=0,worst=0;
for(const zoom of [.7,1,2.2])for(const rotation of [[0,0],[-47,19],[74,-40]])for(const origin of [[0,0],[.3,-.2],[-.4,.3]])for(const delta of [[18,0],[-18,0],[0,18],[0,-18],[12,-9]]){
 const radius=180*zoom,center=[300,250],start=origin.map((n,i)=>center[i]+n*radius),end=start.map((n,i)=>n+delta[i]);
 const anchor=grabPoint(rotation,start,center,radius),next=dragRotation(rotation,anchor,end,center,radius),p=geoOrthographic().scale(radius).translate(center).rotate([...next,0])(anchor),error=Math.hypot(p[0]-end[0],p[1]-end[1]);worst=Math.max(worst,error);assert.ok(error<.05,JSON.stringify({zoom,rotation,origin,delta,next,error}));cases++;
}
for(const angle of [-84,84]){const rot=[0,angle],anchor=grabPoint(rot,[200,200],[200,200],150);const next=dragRotation(rot,anchor,[200,angle>0?-200:600],[200,200],150);assert.ok(Math.abs(next[1])<=POLE_LIMIT)}
for(const v of [[1,-1],[-1,1]]){let after=v;for(let i=0;i<25;i++)after=dampVelocity(after,16);assert.ok(Math.abs(after[0])<.011);assert.equal(Math.sign(after[0]),Math.sign(v[0]));assert.equal(Math.sign(after[1]),Math.sign(v[1]));}
console.log(`PASS: ${cases} globe surface grabs; worst error ${worst.toFixed(6)} px, pole limits and 400 ms directional damping`);
