'use client';

import {useMemo,useRef,useState} from 'react';
import {ArrowDown,ArrowRight,ArrowUpRight,Box,Search,X} from 'lucide-react';
import {animals,type AnimalRecord} from '../animal-registry';
import AnimalArtwork from '../animal-artwork';
import AnimalTrigger from '../animal-trigger';
import speciesData from '@/public/data/species.json';
import './collection.css';

const illustrated=animals.filter(animal=>animal.illustration);
const isReady=(animal:AnimalRecord)=>animal.model?.status==='ready'&&!!animal.model.file;
const exhibits=illustrated.filter(isReady);
const normalize=(value:string)=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const statusLabels:Record<string,string>={CR:'Critically endangered',EN:'Endangered',VU:'Vulnerable',NT:'Near threatened',LC:'Least concern',DD:'Data deficient',EW:'Extinct in the wild',EX:'Extinct',NE:'Not evaluated'};
function profileFor(animal:AnimalRecord){return speciesData.species.find(species=>species.scientific===animal.scientificName)}
function ProfileLink({animal}:{animal:AnimalRecord}){
 const profile=profileFor(animal);
 return profile?<a className="collection-profile-link" href={'/at-risk?species='+encodeURIComponent(profile.id)}>Species profile <ArrowUpRight size={15} aria-hidden="true"/></a>:<AnimalTrigger slug={animal.slug} className="collection-profile-link" label={'Read '+animal.commonName+' species profile'}>Species profile <ArrowUpRight size={15} aria-hidden="true"/></AnimalTrigger>;
}

export default function CollectionPage(){
 const [feature,setFeature]=useState(0),[query,setQuery]=useState(''),[mode,setMode]=useState<'exhibits'|'all'>('exhibits');
 const search=useRef<HTMLInputElement>(null);
 const selected=exhibits[feature]||exhibits[0];
 const result=useMemo(()=>illustrated.filter(animal=>(mode==='all'||isReady(animal))&&normalize(animal.commonName+' '+animal.scientificName).includes(normalize(query.trim()))),[query,mode]);
 const clips=exhibits.reduce((count,animal)=>count+(animal.model?.clips.length||0),0);
 function clear(){setQuery('');setMode('all');search.current?.focus()}
 return <main className="collection-page" id="main">
  <header className="collection-intro">
   <div><span className="eyebrow">Earthbound · The living collection</span><h1>Life, seen a little closer</h1><p>An illustrated cabinet of the natural world. Open an exhibit, turn a specimen in your hands, and discover the life behind its silhouette.</p><a className="collection-browse-link" href="#collection-catalog">Browse the collection <ArrowDown size={16} aria-hidden="true"/></a></div>
   <dl className="collection-counts" aria-label="Collection contents"><div><dt>Animated exhibits</dt><dd>{exhibits.length.toString().padStart(2,'0')}</dd></div><div><dt>Illustrated species</dt><dd>{illustrated.length.toString().padStart(2,'0')}</dd></div><div><dt>Animation studies</dt><dd>{clips.toString().padStart(2,'0')}</dd></div></dl>
  </header>

  {selected&&<section className="collection-feature" aria-label="Featured specimens">
   <p className="collection-sr-only" role="status">Featured specimen: {selected.commonName}</p>
   <div className="collection-feature-stage">
    <div className="collection-feature-top"><span className="eyebrow">Specimen {String(feature+1).padStart(2,'0')} / {String(exhibits.length).padStart(2,'0')}</span><span className="collection-model-badge"><Box size={14} aria-hidden="true"/>Interactive 3D exhibit</span></div>
    <AnimalTrigger slug={selected.slug} className="collection-feature-art" label={'Open '+selected.commonName+' interactive 3D exhibit'}><AnimalArtwork animal={selected} decoding="async"/><span>Open exhibit <ArrowUpRight size={17} aria-hidden="true"/></span></AnimalTrigger>
    <p className="collection-art-caption"><i>{selected.commonName} — {selected.scientificName}</i><span>Original illustration · 3D opens on selection</span></p>
   </div>
   <div className="collection-feature-copy"><span className="eyebrow">A closer encounter</span><h2>{selected.commonName}</h2><p className="collection-scientific">{selected.scientificName}</p><p>{selected.facts[0]||selected.habitat||selected.distribution||'Explore the illustrated species profile, its conservation context and the references behind it.'}</p><div className="collection-feature-actions"><AnimalTrigger slug={selected.slug} className="collection-open" label={'Open '+selected.commonName+' exhibit'}>Open 3D exhibit <ArrowRight size={17} aria-hidden="true"/></AnimalTrigger><ProfileLink animal={selected}/></div><p className="collection-feature-hint">Rotate, zoom and explore the available animations. Each exhibit opens in place; close it to return here.</p><div className="collection-specimen-index" aria-label="Choose featured specimen">{exhibits.map((animal,index)=><button key={animal.slug} onClick={()=>setFeature(index)} aria-pressed={feature===index} aria-label={'Feature '+animal.commonName}><AnimalArtwork animal={animal} loading="lazy"/><span><strong>{animal.commonName}</strong><i>{animal.scientificName}</i></span><ArrowRight size={15} aria-hidden="true"/></button>)}</div></div>
  </section>}

  <section className="collection-catalog" id="collection-catalog" aria-labelledby="collection-catalog-heading">
   <div className="collection-catalog-heading"><div><span className="eyebrow">Find your next encounter</span><h2 id="collection-catalog-heading">The specimen index</h2></div><p>Original illustrations throughout.<br/>Animated models where available.</p></div>
   <div className="collection-tools"><div className="collection-filter-group" role="group" aria-label="Specimen availability"><button onClick={()=>setMode('exhibits')} aria-pressed={mode==='exhibits'}>3D exhibits <span>{exhibits.length}</span></button><button onClick={()=>setMode('all')} aria-pressed={mode==='all'}>All illustrations <span>{illustrated.length}</span></button></div><label className="collection-search"><Search size={18} aria-hidden="true"/><span className="collection-sr-only">Search common or scientific name</span><input ref={search} type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Common or scientific name" aria-controls="collection-results"/>{query&&<button aria-label="Clear species search" onClick={()=>{setQuery('');search.current?.focus()}}><X size={16} aria-hidden="true"/></button>}</label></div>
   <div className="collection-results-meta"><p role="status" aria-live="polite">{result.length} {result.length===1?'specimen':'specimens'}{query.trim()?' matching “'+query.trim()+'”':''}</p><a href="/sources#models">Models, methods & credits <ArrowUpRight size={14} aria-hidden="true"/></a></div>
   <div className="collection-grid" id="collection-results">{result.map(animal=><article className="collection-card" key={animal.slug}>
    <div className="collection-card-art"><AnimalTrigger slug={animal.slug} label={'Open '+animal.commonName+' '+(isReady(animal)?'3D exhibit':'illustrated profile')}><AnimalArtwork animal={animal} loading="lazy" decoding="async"/></AnimalTrigger><span className="collection-availability" data-ready={isReady(animal)}>{isReady(animal)?<><Box size={13} aria-hidden="true"/>Interactive 3D</>:'Illustrated profile'}</span></div>
    <div className="collection-card-text"><h3><AnimalTrigger slug={animal.slug} label={'Open '+animal.commonName+' exhibit'}>{animal.commonName}</AnimalTrigger></h3><p className="collection-scientific">{animal.scientificName}</p><div className="collection-card-context">{animal.regions[0]?<a href={'/?intro=0&hotspot='+animal.regions[0].id}>{animal.regions[0].name}</a>:<span>In the field guide</span>}{animal.statusProvider==='IUCN Red List'&&animal.status&&statusLabels[animal.status]&&<span className="collection-risk" title={'IUCN Red List: '+statusLabels[animal.status]}>{statusLabels[animal.status]}</span>}</div><div className="collection-card-actions"><AnimalTrigger slug={animal.slug} className="collection-open-text" label={'Open '+animal.commonName+' exhibit'}>{isReady(animal)?'Open 3D exhibit':'Explore profile'} <ArrowRight size={15} aria-hidden="true"/></AnimalTrigger><ProfileLink animal={animal}/></div></div>
   </article>)}</div>
   {!result.length&&<div className="collection-empty"><h3>No specimens found</h3><p>Try a common name, scientific name, or browse every illustration.</p><button className="collection-open" onClick={clear}>Clear filters <ArrowRight size={16} aria-hidden="true"/></button></div>}
  </section>
  <aside className="collection-bottom-note"><span className="eyebrow">An atlas, not a complete census</span><p>This collection brings together the animals documented in Earthbound. Models are educational studies; illustrations stay at the heart of the atlas.</p><a href="/?intro=0">Return to the globe <ArrowRight size={16} aria-hidden="true"/></a></aside>
 </main>
}
