'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {AnimalExhibitContext} from './animal-exhibit-context';
import {exhibitHref,findAnimal} from './animal-registry';
import AnimalExhibit from './animal-exhibit';
const marker='earthboundAnimalExhibit';
export default function AnimalExhibitProvider({children}:{children:React.ReactNode}){
 const path=usePathname(),params=useSearchParams(),slug=params.get('exhibit')||'';
 const [active,setActive]=useState(slug);
 const saved=useRef<{url:string;x:number;y:number;trigger:HTMLElement|null;token:string;scrollers:{node:Element;left:number;top:number}[]}|null>(null);
 const mounted=useRef(true),closing=useRef(false);
 const sync=useCallback(()=>{closing.current=false;setActive(new URLSearchParams(location.search).get('exhibit')||'')},[]);
 useEffect(()=>{sync()},[path,slug,sync]);
 useEffect(()=>{mounted.current=true;window.addEventListener('popstate',sync);return()=>{mounted.current=false;window.removeEventListener('popstate',sync)}},[sync]);
 function open(raw:string,trigger?:HTMLElement|null){
  const animal=findAnimal(raw);if(!animal)return;
  if(!active){saved.current={url:location.pathname+location.search+location.hash,x:scrollX,y:scrollY,trigger:trigger||document.activeElement as HTMLElement,token:crypto.randomUUID(),scrollers:Array.from(document.querySelectorAll('.cards,.detail-panel,.site-rail,.page-content,.jc-body')).map(node=>({node,left:node.scrollLeft,top:node.scrollTop}))};
   history.pushState({...history.state,[marker]:saved.current.token},'',exhibitHref(animal.slug,location.href));
  }else history.replaceState({...history.state},'',exhibitHref(animal.slug,location.href));
  setActive(animal.slug);
 }
 function close(){
  if(closing.current)return;closing.current=true;
  const snap=saved.current;
  if(snap&&history.state?.[marker]===snap.token){history.back();return}
  const url=new URL(location.href);url.searchParams.delete('exhibit');history.replaceState({...history.state},'',url.pathname+url.search+url.hash);closing.current=false;setActive('');
 }
 function restore(){
  const snap=saved.current;saved.current=null;
  requestAnimationFrame(()=>{if(!mounted.current)return;if(snap){window.scrollTo({left:snap.x,top:snap.y,behavior:'instant'});snap.scrollers.forEach(({node,left,top})=>{if(node.isConnected){node.scrollLeft=left;node.scrollTop=top}});if(snap.trigger?.isConnected)snap.trigger.focus({preventScroll:true})}else{document.querySelector<HTMLElement>('.wordmark')?.focus({preventScroll:true})}});
 }
 return <AnimalExhibitContext.Provider value={{isOpen:!!active,open}}>{children}{active&&<AnimalExhibit slug={active} onClose={close} onRestore={restore}/>}</AnimalExhibitContext.Provider>
}
