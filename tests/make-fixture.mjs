// Abstract articulated test ribbon, NOT an animal. Never published or registered.
import fs from 'node:fs';import {Document,NodeIO} from '@gltf-transform/core';
const d=new Document(),b=d.createBuffer();const acc=(name,type,array)=>d.createAccessor(name).setType(type).setArray(array).setBuffer(b);
const positions=acc('positions','VEC3',new Float32Array([-.2,0,0,.2,0,0,-.2,.5,0,.2,.5,0,-.2,1,0,.2,1,0]));
const indices=acc('triangles','SCALAR',new Uint16Array([0,1,2,1,3,2,2,3,4,3,5,4]));
const joints=acc('joints','VEC4',new Uint16Array([0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0]));
const weights=acc('weights','VEC4',new Float32Array([1,0,0,0,1,0,0,0,.5,.5,0,0,.5,.5,0,0,1,0,0,0,1,0,0,0]));
const normal=acc('normals','VEC3',new Float32Array(Array.from({length:6},()=>[0,0,1]).flat()));
const mat=d.createMaterial('test matte').setBaseColorFactor([.4,.5,.35,1]).setMetallicFactor(0).setRoughnessFactor(1).setDoubleSided(true);
const mesh=d.createMesh('Articulated test ribbon').addPrimitive(d.createPrimitive().setAttribute('POSITION',positions).setAttribute('NORMAL',normal).setAttribute('JOINTS_0',joints).setAttribute('WEIGHTS_0',weights).setIndices(indices).setMaterial(mat));
const root=d.createNode('root bone'),tip=d.createNode('tip bone').setTranslation([0,.5,0]);root.addChild(tip);
const ibm=acc('bind matrices','MAT4',new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,1,0,0,0,0,1,0,0,-.5,0,1]));
const skin=d.createSkin('two bones').addJoint(root).addJoint(tip).setSkeleton(root).setInverseBindMatrices(ibm);const body=d.createNode('Test ribbon').setMesh(mesh).setSkin(skin);d.createScene().addChild(root).addChild(body);
for(const [name,angle] of [['Idle',.06],['Walk',.6]]){const time=acc(name+' times','SCALAR',new Float32Array([0,.5,1]));const rot=acc(name+' rotations','VEC4',new Float32Array([0,0,0,1,0,0,Math.sin(angle/2),Math.cos(angle/2),0,0,0,1]));const sampler=d.createAnimationSampler().setInput(time).setOutput(rot).setInterpolation('LINEAR');d.createAnimation(name).addSampler(sampler).addChannel(d.createAnimationChannel().setSampler(sampler).setTargetNode(tip).setTargetPath('rotation'))}
fs.mkdirSync('tests/fixtures',{recursive:true});await new NodeIO().write('tests/fixtures/animated-test.glb',d);console.log('Wrote test-only two-bone, two-clip fixture');
