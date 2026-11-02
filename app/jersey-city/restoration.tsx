"use client";
import {useState} from 'react';
import {Slider} from '@/components/ui/slider';
import {ExternalLink} from '../external-link';
import {Sources} from './shared';

const designSource='https://www.stevenyavanian.com/work-1/liberty-state-park';
const stages=[
 {label:'1969 · Rail yards',image:'cnj-1969',kind:'Historical photograph',alt:'CNJ locomotive and tracks at its Jersey City engine terminal, 1969',caption:'The waterfront’s railway past, photographed in 1969.',credit:'Historical photograph · source below',source:null,fit:'cover',text:'A locomotive at the Central Railroad of New Jersey’s Jersey City engine terminal. Rail infrastructure shaped this waterfront before the park.'},
 {label:'2023 · Cleanup begins',image:'lsp-remediation-design',kind:'Project design diagram',alt:'Liberty State Park design diagram showing proposed wetland excavation and reuse of fill in landscaped hills',caption:'Earthworks design: creating wetlands and reshaping land. This illustrates the design approach, not a photograph of the 2023 groundbreaking. Quantities shown belong to this published design study.',credit:'Steven Yavanian with WRT',source:designSource,fit:'contain',text:'NJDEP broke ground on October 18, 2023. The long-fenced interior needs remediation before it can support new public access. The restoration program describes more than 230 acres.'},
 {label:'Ahead · Restored habitat',image:'lsp-wetland-design',kind:'Proposed habitat rendering',alt:'Design rendering of a freshwater wetland with a path, planted viewing hide and visitors observing wildlife',caption:'A proposed freshwater wetland and wildlife-viewing area. Design visualization, not a photograph of completed restoration.',credit:'Steven Yavanian with WRT',source:designSource,fit:'cover',text:'The plan calls for tidal and non-tidal wetlands, meadows, urban forest, and a 5.6-mile trail network. This is the intended future landscape; it is not shown as completed work.'},
] as const;

export function Restoration(){
 const [stage,setStage]=useState(0);
 const selected=stages[stage];
 return <section id="interior">
  <span className="jc-tag">Coming back</span><h2>Liberty State Park interior</h2>
  <p>Restoration means dealing with the land’s industrial history and rebuilding habitat. The project also aims to manage stormwater and strengthen flood resilience.</p>
  <div className="jc-slider jc-restoration">
   <figure className="restoration-figure">
    <div className="restoration-image"><img key={selected.image} loading="lazy" decoding="async" src={'/images/jersey-city/'+selected.image+'.webp'} alt={selected.alt} style={{objectFit:selected.fit}}/></div>
    <figcaption><span className="eyebrow">{selected.kind}</span><p>{selected.caption}</p><span className="restoration-credit">{selected.source?<ExternalLink href={selected.source}>{selected.credit} ↗</ExternalLink>:selected.credit} · <a href={'/images/jersey-city/'+selected.image+'.webp'} target="_blank" rel="noopener noreferrer">View full image ↗</a></span></figcaption>
   </figure>
   <div className="jc-slider-controls">
    <div className="jc-slider-labels">{stages.map((item,index)=><button key={item.label} className="jc-timeline-tab" aria-pressed={stage===index} onClick={()=>setStage(index)}>{item.label}</button>)}</div>
    <Slider aria-label="Restoration timeline: rail yards, cleanup, planned habitat" min={0} max={2} step={1} value={[stage]} onValueChange={value=>setStage(value[0])}/>
    <div aria-live="polite"><h3>{selected.label}</h3><p>{selected.text}</p></div>
   </div>
  </div>
  <Sources ids={['interior','groundbreak','cleanup','photo-cnj-1969','lsp-design-imagery']}/>
 </section>;
}
