const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const code=ts.transpileModule(fs.readFileSync('app/plant-lab/generator/client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
async function scenario(mode,asset='/_next/static/worker-test.js'){
 const urls=[],generated=[],exports={};let attempts=0,terminated=0;
 class FakeWorker{
  constructor(url,options){attempts++;urls.push(String(url));assert.equal(options.type,'module');if(mode==='constructor')throw new DOMException('Blocked file worker','SecurityError')}
  terminate(){terminated++}
  postMessage(message){if(mode==='post')throw new DOMException('Clone failed','DataCloneError');if(mode==='timeout')return;queueMicrotask(()=>{if(mode==='load')this.onerror?.({preventDefault(){}});else if(mode==='decode')this.onmessageerror?.({});else if(mode==='job')this.onmessage?.({data:{id:message.id,error:'Generation unavailable'}});else this.onmessage?.({data:{id:message.id,data:{seed:message.request.seed,via:'worker'}}})})}
 }
 vm.runInNewContext(code,{exports,require:id=>id.endsWith('?worker&url')?asset:{generatePlant:request=>{generated.push(request.seed);return {seed:request.seed,via:'main'}}},Worker:mode==='absent'?undefined:FakeWorker,location:{origin:'https://earthbound-field-atlas.rvsin8.chatgpt.site'},URL,Promise,Map,setTimeout:(fn,ms)=>setTimeout(fn,ms===2500?10:ms),clearTimeout});
 const request={spec:{slug:'red-maple'},seed:42,lod:0};let promise;
 assert.doesNotThrow(()=>promise=exports.generate(request));assert.equal(exports.generate(request),promise,'Deduplicate in-flight request');
 const results=await Promise.all([promise,exports.generate({...request,seed:43})]);
 assert.deepEqual(Array.from(results,r=>r.seed),[42,43]);
 assert.ok(results.every(r=>r.via===(mode==='success'?'worker':'main')));
 if(mode!=='success'){await exports.generate(request);assert.equal(generated.filter(n=>n===42).length,1,'Fallback cache avoids regeneration')}
 if(asset.startsWith('/'))assert.ok(urls.every(url=>url==='https://earthbound-field-atlas.rvsin8.chatgpt.site/_next/static/worker-test.js'));
 if(['constructor','post','load','decode','timeout'].includes(mode))assert.equal(attempts,1,'Failed worker stays disabled');
 if(['post','load','decode','timeout'].includes(mode))assert.equal(terminated,1);
 console.log('PASS: '+mode+' — '+results[0].via+' generation');
}
(async()=>{for(const mode of ['success','constructor','post','load','decode','timeout','job','absent'])await scenario(mode);await scenario('bad-url','file:///_next/static/worker-test.js');console.log('Worker URL, synchronous SecurityError, async failure, timeout, fallback cache and concurrent job tests passed')})().catch(e=>{console.error(e);process.exitCode=1});
