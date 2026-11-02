'use client';
import { Compass,Flower2,Globe2,Info,Menu,Moon,Mountain,Search,Sprout,Sun,TreePine,Waves,X } from 'lucide-react';
import { usePathname,useSearchParams } from 'next/navigation';
import { useEffect,useState } from 'react';
import AnimalExhibitProvider from './animal-exhibit-provider';
import AtlasSearch from './atlas-search';
import { OutboundProvider } from "./external-link";
import { localSections } from './jersey-city/sections';
import { PrimaryNavigation,ResourceNavigation,allNavigation,navigationView,primaryNavigation,resourceNavigation } from './site-navigation';
const biomes=[['Tropical forest',TreePine],['Coastal & reef',Waves],['Grassland',Flower2],['Mangrove',Sprout],['Alpine',Mountain],['Desert',Sun]] as const;
export default function SiteShell({children}:{children:React.ReactNode}){
 const path=usePathname(),params=useSearchParams();
 const view=navigationView(path);
 const [theme,setTheme]=useState<'light'|'dark'>('light');
 useEffect(()=>{let saved='light';try{saved=localStorage.getItem('earthbound-theme')||'light'}catch{}const next=saved==='dark'?'dark':'light';setTheme(next);document.documentElement.dataset.theme=next},[]);
 function toggleTheme(){const next=theme==='light'?'dark':'light';setTheme(next);document.documentElement.dataset.theme=next;try{localStorage.setItem('earthbound-theme',next)}catch{}}
 const themeButton=<button className="theme-toggle" onClick={toggleTheme} aria-pressed={theme==='dark'} aria-label="Dark theme">{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}<span>{theme==='dark'?'Light paper':'Dark theme'}</span></button>;
 const [searchOpen,setSearchOpen]=useState(false);
 const searchButton=<button data-search-trigger className="atlas-search-trigger" onClick={()=>setSearchOpen(true)} aria-haspopup="dialog"><Search size={17}/><span>Search atlas</span><kbd>⌘ K</kbd></button>;
 const moreSections=resourceNavigation;
 const [more,setMore]=useState(false),[hotspots,setHotspots]=useState<any[]>([]);
 useEffect(()=>{let active=true;import('./atlas-data').then(m=>m.loadAtlas()).then(d=>{if(active)setHotspots(d.hotspots)}).catch(()=>{});return()=>{active=false}},[]);
 useEffect(()=>{setMore(false)},[path,searchOpen]);
 useEffect(()=>{if(!more)return;function dismiss(e:KeyboardEvent){if(e.key==='Escape'){setMore(false);document.getElementById('more-sections-toggle')?.focus()}}document.addEventListener('keydown',dismiss);return()=>document.removeEventListener('keydown',dismiss)},[more]);
 const requestedBiome=params.get('biome')==='Coral reef'?'Coastal & reef':params.get('biome');
 const hotspot=hotspots.find(h=>h.id===params.get('hotspot'));
 const biome=biomes.some(([name])=>name===requestedBiome)?requestedBiome:hotspot?.biomes[0]||'Grassland';
 if(path.startsWith('/learn'))return <OutboundProvider><AnimalExhibitProvider>{children}</AnimalExhibitProvider></OutboundProvider>;
 return <OutboundProvider><AnimalExhibitProvider><div className="site-frame">
  <aside className="site-rail">
   <a href="/?intro=1" className="wordmark" title="Return to the welcome globe"><Globe2 strokeWidth={1.2}/>earthbound.</a>
   {searchButton}<PrimaryNavigation view={view}/><ResourceNavigation view={view}/>
   <div className="rail-extras">{path.startsWith('/jersey-city')&&<nav className="rail-local-nav" aria-label="Jersey City sections">{localSections.map(([slug,name])=><a key={slug} href={'/jersey-city'+slug} aria-current={path==='/jersey-city'+slug?'page':undefined}>{name}</a>)}<a href="/">Back to the globe →</a></nav>}{path==='/'&&<>
    <div className="biome-heading"><span className="nav-title eyebrow">Explore by biome</span><details className="biome-info"><summary aria-label="About biome counts" title="About biome counts"><Info size={16}/></summary><div><p>Hotspots span multiple biomes, so counts overlap.</p><p>Coastal &amp; reef counts terrestrial hotspots with associated coastal habitats.</p></div></details></div>
    <nav aria-label="Biomes">{biomes.map(([name,Icon])=><a key={name} href={'/?biome='+encodeURIComponent(name)} className="biome-button" data-active={path==='/'&&biome===name} aria-current={path==='/'&&biome===name?'true':undefined}><Icon size={20}/><div><span>{name}</span><small>{hotspots.length?hotspots.filter(h=>h.biomes.includes(name)).length:'—'} hotspots</small></div></a>)}</nav>
   </>}

    {themeButton}<div className="rail-bottom"><Compass size={16}/>Stay curious. Tread lightly.</div>
   </div>
  </aside>
  <div className="site-main"><header className="site-mobile"><a href="/?intro=1" className="wordmark" title="Return to the welcome globe">earthbound.</a>{searchButton}{themeButton}{path==='/'&&<form action="/" method="get" className="mobile-biome"><label>Biome <select name="biome" defaultValue={biome||'Grassland'} key={biome}>{biomes.map(([name])=><option key={name}>{name}</option>)}</select></label><button type="submit">Go</button></form>}</header>{children}</div>
  <nav className="bottom-tabs" aria-label="Main navigation">{primaryNavigation.map(({href:url,mobileLabel:label,icon:Icon})=><a key={url} href={url} aria-current={view===url?'page':undefined}><Icon size={20}/><span>{label}</span></a>)}<button id="more-sections-toggle" aria-expanded={more} aria-controls="mobile-more" aria-label="Tools and resources" className={moreSections.some(({href})=>href===view)?'selected':''} onClick={()=>setMore(!more)}>{more?<X size={20}/>:<Menu size={20}/>}<span>Tools</span></button></nav>
  {more&&<nav id="mobile-more" className="mobile-more" aria-label="Tools and resources">{moreSections.map(({href:url,label})=><a key={url} href={url} aria-current={view===url?'page':undefined}>{label}</a>)}</nav>}
  <noscript><nav className="no-script-navigation" aria-label="All sections">{allNavigation.map(({href:url,label})=><a key={url} href={url}>{label}</a>)}</nav></noscript>
 </div><AtlasSearch hotspots={hotspots} open={searchOpen} onOpenChange={setSearchOpen}/><footer className="site-footer"><span>A field guide to a changing planet</span><span><a href="/sources#hotspot-data">{hotspots.length||'—'} hotspots</a> · One remarkable planet</span></footer></AnimalExhibitProvider></OutboundProvider>
}
