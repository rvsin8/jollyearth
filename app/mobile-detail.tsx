'use client';
import {useEffect, useRef, useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';

/** In-flow disclosure: never follows the reader over unrelated atlas sections. */
export default function MobileDetail({title, children, openRequest=0}:{title:string;children:React.ReactNode;openRequest?:number}) {
 const [open,setOpen]=useState(false);
 const panel=useRef<HTMLElement>(null);
 const toggle=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!openRequest)return;
  setOpen(true);
  const frame=requestAnimationFrame(()=>{
   panel.current?.scrollIntoView({block:'start',behavior:'instant'});
   panel.current?.querySelector<HTMLElement>('.migration-panel')?.focus();
  });
  return()=>cancelAnimationFrame(frame);
 },[openRequest]);
 function collapse(){setOpen(false);toggle.current?.focus()}
 return <section ref={panel} className="mobile-detail field-detail" aria-label="Selected hotspot" onKeyDown={e=>{if(e.key==='Escape'&&open){e.stopPropagation();collapse()}}}>
  <button ref={toggle} className="field-detail-toggle" aria-expanded={open} aria-controls="mobile-detail-content" onClick={()=>setOpen(v=>!v)}>
   <span><span className="eyebrow">Selected hotspot</span><strong className="place-name">{title}</strong><span className="field-detail-action">{open?'Collapse details':'Read habitat, species & sources'}</span></span>
   {open?<ChevronUp aria-hidden="true"/>:<ChevronDown aria-hidden="true"/>}
  </button>
  <div id="mobile-detail-content" hidden={!open}>{children}{open&&<button className="action-button" onClick={collapse}>Collapse hotspot details</button>}</div>
 </section>;
}
