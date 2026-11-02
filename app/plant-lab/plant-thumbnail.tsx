'use client';
import {useEffect,useRef} from 'react';
import {generate} from './generator/client';
import type {PlantSpec} from './generator/types';
export default function PlantThumbnail({spec}:{spec:PlantSpec}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{let stale=false;generate({spec,seed:1,lod:2,leafLimit:64}).then(data=>{if(stale||!ref.current)return;const c=ref.current,ctx=c.getContext('2d')!;ctx.clearRect(0,0,80,80);ctx.fillStyle=spec.summerColor;const scale=65/data.spread;for(const m of [data.silhouette,data.wood,data.blades,data.flowers])for(let i=0;i<m.indices.length;i+=3){ctx.beginPath();for(let j=0;j<3;j++){const p=m.indices[i+j]*3,x=40+m.positions[p]*scale,y=40+m.positions[p+2]*scale;j?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill()}}).catch(()=>{});return()=>{stale=true}},[spec]);return <canvas ref={ref} width={80} height={80} className="plant-thumbnail" aria-hidden="true"/>}
