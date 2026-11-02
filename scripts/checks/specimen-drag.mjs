import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
function drag(kind,dx,dy,zoom){
 const camera=new PerspectiveCamera(35,1,.1,100);camera.position.set(0,1.4+zoom*.15,zoom);
 const controls=new OrbitControls(camera,null);controls.domElement={clientHeight:400};controls.target.set(0,1.4,0);controls.enableDamping=true;controls.dampingFactor=1-Math.exp(-16/87);controls.rotateSpeed=zoom/6;controls.minPolarAngle=.05;controls.maxPolarAngle=Math.PI*.49;controls.update();camera.updateMatrixWorld();
 const point=new Vector3(0,1.4,1),before=point.clone().project(camera);
 if(kind==='mouse'){controls._handleMouseDownRotate({clientX:200,clientY:200});controls._handleMouseMoveRotate({clientX:200+dx,clientY:200+dy})}
 else {controls._pointers=[1];controls._handleTouchStartRotate({pageX:200,pageY:200});controls._handleTouchMoveRotate({pageX:200+dx,pageY:200+dy});controls.update()}
 camera.updateMatrixWorld();const after=point.clone().project(camera);
 if(dx)assert.equal(Math.sign(after.x-before.x),Math.sign(dx),'Visible point must follow horizontal drag');
 if(dy)assert.equal(Math.sign(after.y-before.y),-Math.sign(dy),'Visible point must follow vertical drag in CSS coordinates');
 const release=camera.position.clone();for(let i=0;i<25;i++)controls.update(.016);camera.updateMatrixWorld();const coast=point.clone().project(camera);
 if(dx)assert.equal(Math.sign(coast.x-after.x),Math.sign(dx),'Release must keep horizontal direction');
 if(dy)assert.equal(Math.sign(coast.y-after.y),-Math.sign(dy),'Release must keep vertical direction');
 assert.ok(controls.getPolarAngle()>=.05&&controls.getPolarAngle()<=Math.PI*.49);
 return {release,coast:camera.position.clone()};
}
for(const zoom of [3,6,15])for(const [dx,dy] of [[10,0],[-10,0],[0,10],[0,-10]]){
 const mouse=drag('mouse',dx,dy,zoom),touch=drag('touch',dx,dy,zoom);assert.ok(mouse.release.distanceTo(touch.release)<1e-10);assert.ok(mouse.coast.distanceTo(touch.coast)<1e-10);
}
console.log('PASS: Species mouse/touch direction and release momentum match in four directions at three zoom levels');
