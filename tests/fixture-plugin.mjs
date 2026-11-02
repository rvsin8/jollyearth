import fs from 'node:fs';
// Dev server only. This middleware does not participate in production builds.
export function fixturePlugin(){return {name:'earthbound-test-fixture',apply:'serve',configureServer(server){server.middlewares.use('/__test__/animated-test.glb',(_req,res)=>{res.setHeader('Content-Type','model/gltf-binary');res.end(fs.readFileSync(new URL('./fixtures/animated-test.glb',import.meta.url)))})}}}
