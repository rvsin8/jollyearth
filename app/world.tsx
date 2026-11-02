'use client';
import {useEffect,useRef,useState} from 'react';
import {geoOrthographic,geoPath,geoGraticule10,geoContains,geoDistance,geoInterpolate} from 'd3-geo';
import {habitatEstimate} from './habitat-estimate';
import {loadLand} from './atlas-data';
import {migrations as migrationRecords,findMigration,routeCoordinates,migrationDescription} from './migration-data';
import {grabPoint,dragRotation,dampVelocity,POLE_LIMIT,type Pair} from './globe-drag';
import SpeciesIcon from './species-icon';
import AnimalTrigger from './animal-trigger';
const migrationLines=Object.fromEntries(migrationRecords.map(m=>{const coordinates=routeCoordinates(m),interpolate=geoInterpolate(...coordinates);return [m.slug,{type:'LineString',coordinates:Array.from({length:97},(_,i)=>interpolate(i/96)),interpolate}]}));
const graticule=geoGraticule10();
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const ease=(n:number)=>1-Math.pow(1-n,3);
export default function World(props:any){
 const {data,selected,species,labels,rotating,reset,turn,splash=false,onInput,scaleVisible}=props;
 const canvas=useRef<HTMLCanvasElement>(null),host=useRef<HTMLDivElement>(null),layer=useRef<HTMLDivElement>(null),live=useRef(props);
 const camera=useRef({rotation:[-25,-12] as [number,number],zoom:1,pan:[0,0] as [number,number]});
 const migrationClock=useRef({slug:'',start:0});
 const transition=useRef<any>(null),velocity=useRef([0,0]),manualStop=useRef(false),[land,setLand]=useState<any>(null);
 const showSpecies=!!species;
 live.current={...props,globeHidden:showSpecies};
 function animateTo(rotation:[number,number],duration:number){const c=camera.current;let dx=((rotation[0]-c.rotation[0]+540)%360)-180;transition.current={from:[...c.rotation],to:[c.rotation[0]+dx,rotation[1]],zoom:c.zoom,pan:[...c.pan],start:performance.now(),duration};velocity.current=[0,0]}
 useEffect(()=>{loadLand().then(setLand).catch(()=>{})},[]);
 useEffect(()=>{const route=findMigration(props.migration);if(!splash){const point=route?routeCoordinates(route)[1]:selected.center;animateTo([-point[0],-point[1]],600)}},[selected.id,splash,props.migration]);
 const priorReset=useRef(reset),priorTurn=useRef(turn);
 useEffect(()=>{if(reset!==priorReset.current){priorReset.current=reset;manualStop.current=true;animateTo([-25,-12],500)}},[reset]);
 useEffect(()=>{if(turn!==priorTurn.current){camera.current.rotation[0]+=(turn-priorTurn.current)*15;transition.current=null;velocity.current=[0,0];manualStop.current=true;priorTurn.current=turn}},[turn]);
 useEffect(()=>{manualStop.current=!rotating},[rotating]);
 useEffect(()=>{
  const cv=canvas.current,el=layer.current;if(!cv||!el||!land)return;
  const ctx=cv.getContext('2d')!;let w=0,h=0,raf=0,last=0,hover:any=null,hoverStart=0;
  const projection=geoOrthographic(),path=geoPath(projection,ctx),pointers=new Map<number,{x:number;y:number}>();
  let gesture:any=null,pinch=0;
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  let theme:any;function readTheme(){const s=getComputedStyle(document.documentElement);theme={ink:s.getPropertyValue('--ink').trim(),muted:s.getPropertyValue('--muted-foreground').trim(),line:s.getPropertyValue('--line').trim(),paper:s.getPropertyValue('--paper').trim(),serif:s.getPropertyValue('--font-serif').trim(),sans:s.getPropertyValue('--font-sans').trim(),small:s.getPropertyValue('--text-small').trim(),micro:s.getPropertyValue('--text-micro').trim(),...Object.fromEntries(['globe-ocean','globe-land','globe-coast','globe-grid','hotspot-clay','hotspot-ochre','hotspot-sage','hotspot-unknown','hotspot-border','hotspot-selected','migration-line'].map(key=>[key,s.getPropertyValue('--'+key).trim()]))}}readTheme();const themeObserver=new MutationObserver(readTheme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  document.fonts.ready.then(readTheme);
  function size(){w=el!.clientWidth;h=el!.clientHeight;const dpr=Math.min(devicePixelRatio,2);cv!.width=w*dpr;cv!.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw(performance.now(),false)}
  const ro=new ResizeObserver(size);ro.observe(el);size();
  function input(){manualStop.current=true;transition.current=null;velocity.current=[0,0];live.current.onInput?.()}
  function draw(time:number,schedule=true){
   const elapsed=time-last||16,dt=Math.min(elapsed,40);last=time;const p=live.current,c=camera.current;
   if(p.paused||p.globeHidden||document.hidden){if(transition.current)transition.current.start+=elapsed;if(migrationClock.current.slug)migrationClock.current.start+=elapsed;if(schedule)raf=requestAnimationFrame(draw);return}
   if(transition.current&&!p.splash){const a=transition.current,t=motion.matches?1:clamp((time-a.start)/a.duration,0,1),f=ease(t);c.rotation=[a.from[0]+(a.to[0]-a.from[0])*f,a.from[1]+(a.to[1]-a.from[1])*f];c.zoom=a.zoom+(1-a.zoom)*f;c.pan=[a.pan[0]*(1-f),a.pan[1]*(1-f)];if(t===1)transition.current=null}
   else if(!pointers.size&&!motion.matches){if(p.rotating&&!manualStop.current&&!hover)c.rotation[0]+=dt*.018;else {c.rotation[0]+=velocity.current[0]*dt;c.rotation[1]=clamp(c.rotation[1]+velocity.current[1]*dt,-POLE_LIMIT,POLE_LIMIT);velocity.current=dampVelocity(velocity.current as Pair,dt)}}
   const radius=Math.min(w*.37,h*.43)*c.zoom,cx=w*.52+c.pan[0],cy=h*.49+c.pan[1];
   projection.translate([cx,cy]).scale(radius).rotate([c.rotation[0],c.rotation[1],0]).clipAngle(90);ctx.clearRect(0,0,w,h);
   ctx.beginPath();path({type:'Sphere'});ctx.fillStyle=theme['globe-ocean'];ctx.fill();ctx.strokeStyle=theme.line;ctx.lineWidth=.7;ctx.stroke();
   ctx.beginPath();path(graticule);ctx.strokeStyle=theme['globe-grid'];ctx.lineWidth=.5;ctx.stroke();
   ctx.beginPath();path(land);ctx.fillStyle=theme['globe-land'];ctx.fill();ctx.strokeStyle=theme['globe-coast'];ctx.lineWidth=.6;ctx.stroke();
   for(let i=0;i<data.hotspots.length;i++){
    const f=data.hotspots[i],hovered=hover?.id===f.id,progress=hovered?(motion.matches?1:clamp((time-hoverStart)/150,0,1)):0;
    ctx.save();if(hovered&&!motion.matches)ctx.translate(0,-2*progress);
    if(p.splash&&!motion.matches){const phase=(time/1300)%data.hotspots.length,light=Math.max(0,1-Math.abs(phase-i));ctx.shadowColor='rgba(221,192,133,'+light*.3+')';ctx.shadowBlur=light*10}
    ctx.beginPath();path(f.geometry);ctx.fillStyle=theme['hotspot-'+habitatEstimate(f).band];ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle=!p.migrationOnly&&f.id===p.selected.id?theme['hotspot-selected']:theme['hotspot-border'];ctx.lineWidth=!p.migrationOnly&&f.id===p.selected.id?1.1:.5;ctx.stroke();if(hovered){ctx.fillStyle='rgba(35,38,26,.16)';ctx.fill()}ctx.restore();
   }

   const shade=ctx.createRadialGradient(cx-radius*.36,cy-radius*.38,radius*.05,cx,cy,radius);shade.addColorStop(0,'rgba(255,255,245,.12)');shade.addColorStop(.72,'rgba(100,110,80,0)');shade.addColorStop(1,'rgba(50,45,32,.16)');ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=shade;ctx.fill();
   const route=findMigration(p.migration);
   if(route&&!p.splash){
    if(migrationClock.current.slug!==route.slug)migrationClock.current={slug:route.slug,start:time};
    const progress=motion.matches?1:clamp((time-migrationClock.current.start)/1200,0,1),line=migrationLines[route.slug];
    // Raise the route very slightly above the printed sphere, retaining hemisphere clipping.
    const raised=geoOrthographic().translate([cx,cy]).scale(radius*1.015).rotate([c.rotation[0],c.rotation[1],0]).clipAngle(90),routePath=geoPath(raised,ctx);
    const coords=line.coordinates.slice(0,Math.floor(progress*96)+1);if(progress<1)coords.push(line.interpolate(progress));
    ctx.beginPath();routePath({type:'LineString',coordinates:coords});ctx.strokeStyle=theme['migration-line'];ctx.lineWidth=1;ctx.stroke();
    routeCoordinates(route).forEach((point,i)=>{if(i===1&&progress<1)return;if(geoDistance(point,[-c.rotation[0],-c.rotation[1]])>=Math.PI/2)return;const xy=raised(point);if(!xy)return;ctx.beginPath();ctx.arc(xy[0],xy[1],3,0,Math.PI*2);ctx.fillStyle=theme.paper;ctx.fill();ctx.stroke();const label=i===0?'Jersey City':route.destinationName;ctx.font=theme.small+' '+theme.sans;ctx.textAlign='left';const tw=ctx.measureText(label).width,tx=clamp(xy[0]+8,8,Math.max(8,w-tw-8)),ty=clamp(xy[1]-8,20,h-15);ctx.fillStyle=theme.paper;ctx.fillRect(tx-3,ty-14,tw+6,19);ctx.fillStyle=theme.ink;ctx.fillText(label,tx,ty)});
   }else migrationClock.current.slug='';
   if(p.labels&&!p.splash){[p.migration?null:p.selected,hover].filter((f,i,a)=>f&&a.findIndex(x=>x?.id===f.id)===i).forEach(f=>{if(geoDistance(f.center,[-c.rotation[0],-c.rotation[1]])>Math.PI/2-.07)return;const point=projection(f.center);if(!point)return;const [x,y]=point,right=x>cx,tx=clamp(x+(right?60:-75),75,w-85),ty=clamp(y-34,40,h-35),progress=hover?.id===f.id&&!motion.matches?clamp((time-hoverStart)/150,0,1):1;ctx.save();ctx.globalAlpha=progress;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(tx-x)*progress,y+(ty-y)*progress);if(progress>.7)ctx.lineTo(tx+(right?25:-25)*(progress-.7)/.3,ty);ctx.strokeStyle=theme.muted;ctx.lineWidth=.7;ctx.stroke();ctx.font=theme.small+' '+theme.serif;ctx.textAlign=right?'left':'right';ctx.fillStyle=theme.ink;ctx.fillText(f.shortName||f.name,tx+(right?3:-3),ty-7);ctx.font=theme.micro+' '+theme.sans;ctx.fillStyle=theme.muted;ctx.fillText(habitatEstimate(f).value===null?'NO ESTIMATE':'BIODIVERSITY HOTSPOT',tx+(right?3:-3),ty+14);ctx.restore()})}
   if(schedule)raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
  function locate(e:PointerEvent){const r=cv!.getBoundingClientRect(),xy:[number,number]=[e.clientX-r.left,e.clientY-r.top],center=projection.translate();if(Math.hypot(xy[0]-center[0],xy[1]-center[1])>projection.scale())return null;const inv=projection.invert?.(xy);return inv?data.hotspots.find((f:any)=>geoContains(f.geometry,inv)):null}
  function pointer(e:PointerEvent):Pair{const r=cv!.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]}
  function anchor(e:PointerEvent){return grabPoint(camera.current.rotation,pointer(e),projection.translate() as Pair,projection.scale())}
  function down(e:PointerEvent){input();cv!.focus({preventScroll:true});pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,time:performance.now(),moved:false,pan:e.shiftKey,anchor:anchor(e)};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);gesture.moved=true}cv!.setPointerCapture(e.pointerId)}
  function move(e:PointerEvent){if(!pointers.has(e.pointerId)){const next=locate(e);if(next?.id!==hover?.id)hoverStart=performance.now();hover=next;cv!.style.cursor=hover?'pointer':'grab';return}const c=camera.current,now=performance.now();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)c.zoom=clamp(c.zoom*distance/pinch,.7,2.2);pinch=distance;velocity.current=[0,0];return}const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,dt=Math.max(8,now-gesture.time);if(gesture.pan){c.pan=[clamp(c.pan[0]+dx,-w*.3,w*.3),clamp(c.pan[1]+dy,-h*.3,h*.3)]}else {const previous=[...c.rotation] as Pair;c.rotation=dragRotation(previous,gesture.anchor,pointer(e),projection.translate() as Pair,projection.scale());velocity.current=[(c.rotation[0]-previous[0])/dt,(c.rotation[1]-previous[1])/dt]}gesture.moved=gesture.moved||Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>5;gesture.x=e.clientX;gesture.y=e.clientY;gesture.time=now;hover=null}
  function up(e:PointerEvent){const click=pointers.size===1&&!gesture?.moved&&e.type!=='pointercancel';pointers.delete(e.pointerId);if(click){const f=locate(e);if(f)live.current.onSelect(f)}if(!pointers.size){if(e.type==='pointercancel'||performance.now()-(gesture?.time||0)>100||motion.matches)velocity.current=[0,0];gesture=null;pinch=0}else {const p=[...pointers.values()][0];gesture={...p,startX:p.x,startY:p.y,time:performance.now(),moved:true,pan:false,anchor:grabPoint(camera.current.rotation,[p.x-cv!.getBoundingClientRect().left,p.y-cv!.getBoundingClientRect().top],projection.translate() as Pair,projection.scale())};velocity.current=[0,0];pinch=0}}
  function wheel(e:WheelEvent){e.preventDefault();input();camera.current.zoom=clamp(camera.current.zoom*Math.exp(-e.deltaY*.001),.7,2.2)}
  function resetView(){input();animateTo([-25,-12],500)}
  function key(e:KeyboardEvent){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home','Enter'].includes(e.key))return;e.preventDefault();input();const c=camera.current;if(e.key==='Home')resetView();else if(['+','=','-','_'].includes(e.key))c.zoom=clamp(c.zoom*(['+','='].includes(e.key)?1.15:1/1.15),.7,2.2);else if(e.key==='Enter'){const f=data.hotspots.find((f:any)=>geoDistance(f.center,[-c.rotation[0],-c.rotation[1]])<.5);if(f)live.current.onSelect(f)}else {c.rotation[0]+=e.key==='ArrowLeft'?-15:e.key==='ArrowRight'?15:0;c.rotation[1]=clamp(c.rotation[1]+(e.key==='ArrowUp'?15:e.key==='ArrowDown'?-15:0),-POLE_LIMIT,POLE_LIMIT)}}
  const leave=()=>{hover=null};
  cv.addEventListener('pointerdown',down);cv.addEventListener('pointermove',move);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('pointerleave',leave);cv.addEventListener('wheel',wheel,{passive:false});cv.addEventListener('keydown',key);cv.addEventListener('dblclick',resetView);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();themeObserver.disconnect();cv.removeEventListener('pointerdown',down);cv.removeEventListener('pointermove',move);cv.removeEventListener('pointerup',up);cv.removeEventListener('pointercancel',up);cv.removeEventListener('pointerleave',leave);cv.removeEventListener('wheel',wheel);cv.removeEventListener('keydown',key);cv.removeEventListener('dblclick',resetView)};
 },[data,land]);
 return <div className="world" ref={host}><div ref={layer} className="globe-layer" style={{...(splash?{position:'fixed',inset:0,zIndex:91}:{}),opacity:showSpecies?0:1,pointerEvents:species||splash?'none':'auto'}}><canvas ref={canvas} aria-describedby={props.migration?'globe-migration-description':undefined} tabIndex={species||splash?-1:0} aria-label="Interactive globe. Arrow keys rotate 15 degrees; plus and minus zoom; Home or double-click resets. Shift-drag pans. Enter selects a centered hotspot."/></div>{props.migration&&!species&&<p id="globe-migration-description" className="sr-only" role="status">{findMigration(props.migration)?migrationDescription(findMigration(props.migration)!):''}</p>}{species&&<div className="inline-animal-illustration"><AnimalTrigger slug={species.id}><SpeciesIcon slug={species.id} scientificName={species.scientific}/></AnimalTrigger></div>}</div>
}
