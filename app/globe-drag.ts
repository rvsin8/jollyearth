import {geoOrthographic} from 'd3-geo';
export type Pair=[number,number];
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const POLE_LIMIT=85;
export const MOMENTUM_TAU_MS=87; // 99% of release velocity decays within 400 ms.
export function dampVelocity(v:Pair,dt:number):Pair{return v.map(x=>Math.abs(x)<.0001?0:x*Math.exp(-dt/MOMENTUM_TAU_MS)) as Pair}
export function normalizedPointer(point:Pair,center:Pair,radius:number):Pair{
 const x=(point[0]-center[0])/radius,y=(point[1]-center[1])/radius,length=Math.hypot(x,y),factor=length>.985?.985/length:1;
 return [x*factor,y*factor];
}
export function grabPoint(rotation:Pair,point:Pair,center:Pair,radius:number):Pair{
 return geoOrthographic().translate([0,0]).scale(1).rotate([...rotation,0]).invert!(normalizedPointer(point,center,radius))!;
}
// Solve the two angular camera coordinates against the grabbed geographic point.
// Normalized sphere coordinates replace signed, fixed pixel deltas. This also
// handles off-center grabs and zoom without reversing the visible surface.
export function dragRotation(rotation:Pair,anchor:Pair,point:Pair,center:Pair,radius:number):Pair{
 const target=normalizedPointer(point,center,radius),p=geoOrthographic().translate([0,0]).scale(1);
 let [lon,lat]=rotation;
 const project=(x:number,y:number)=>p.rotate([x,y,0])(anchor)!;
 for(let i=0;i<12;i++){
  const a=project(lon,lat),ex=target[0]-a[0],ey=target[1]-a[1];if(Math.hypot(ex,ey)<1e-7)break;
  const h=.01,b=project(lon+h,lat),c=project(lon,lat+h),xx=(b[0]-a[0])/h,xy=(c[0]-a[0])/h,yx=(b[1]-a[1])/h,yy=(c[1]-a[1])/h,det=xx*yy-xy*yx;
  if(Math.abs(det)<1e-9)break;
  lon+=clamp((ex*yy-ey*xy)/det,-15,15);
  lat=clamp(lat+clamp((ey*xx-ex*yx)/det,-15,15),-POLE_LIMIT,POLE_LIMIT);
 }
 return [lon,lat];
}
