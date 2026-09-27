import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'

type Hotspot={name:string;region:string;biome:string;status:string;summary:string;pressure:string;lat:number;lon:number}
const hotspots:Hotspot[]=[
{name:'Coastal Plain',region:'Southeastern North America',biome:'Grassland',status:'REFUGE',summary:'Longleaf pine savannas, wetlands and coastal landscapes hold a rich native flora. Fire and water sustain the region’s distinctive ecological patterns.',pressure:'Development and the loss of natural fire regimes reshape these habitats.',lat:31,lon:-83},
{name:'Madagascar',region:'Western Indian Ocean',biome:'Tropical forest',status:'REFUGE',summary:'Isolation produced extraordinary endemism across forests, drylands and highlands.',pressure:'Deforestation, fire and fragmented habitat threaten species found nowhere else.',lat:-19,lon:47},
{name:'Tropical Andes',region:'Northern and western South America',biome:'Alpine',status:'FRONTIER',summary:'Steep elevation gradients compress remarkable ecological variety into a narrow mountain chain.',pressure:'Roads, agriculture and warming climates change how species move between elevations.',lat:-10,lon:-75},
{name:'Atlantic Forest',region:'Eastern South America',biome:'Tropical forest',status:'REMNANT',summary:'A fragmented but exceptionally rich forest belt runs along Brazil’s Atlantic side.',pressure:'Restoration focuses on reconnecting remnants so wildlife can move between patches.',lat:-22,lon:-44},
{name:'Indo–Burma',region:'Mainland Southeast Asia',biome:'Grassland',status:'REFUGE',summary:'Rivers, forests and karst landscapes support striking biological diversity.',pressure:'Infrastructure, land conversion and wildlife trade create overlapping pressures.',lat:18,lon:103}
]
function ll(lat:number,lon:number,r=2.05){const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta))}
function Globe({selected,onSelect}:{selected:string,onSelect:(n:string)=>void}){
 const dots=useMemo(()=>hotspots.map(h=>({h,p:ll(h.lat,h.lon)})),[])
 return <Canvas camera={{position:[0,0,6],fov:38}}>
  <ambientLight intensity={1.5}/><directionalLight position={[4,5,4]} intensity={2}/>
  <mesh><sphereGeometry args={[2,64,64]}/><meshStandardMaterial color="#d9dece" roughness={.88}/></mesh>
  <mesh><sphereGeometry args={[2.01,32,16]}/><meshBasicMaterial color="#9ba392" wireframe transparent opacity={.24}/></mesh>
  {dots.map(({h,p})=><mesh key={h.name} position={p} onClick={(e)=>{e.stopPropagation();onSelect(h.name)}} scale={selected===h.name?1.35:1}>
   <sphereGeometry args={[.07,20,20]}/><meshStandardMaterial color={selected===h.name?'#ffc83d':'#bb7c62'}/>
  </mesh>)}
  <OrbitControls enablePan={false} minDistance={4} maxDistance={8} autoRotate autoRotateSpeed={.35}/>
 </Canvas>
}
export default function App(){
 const [selected,setSelected]=useState('Coastal Plain')
 const h=hotspots.find(x=>x.name===selected)!
 return <div>
  <header className="mast"><div className="brand"><span className="mark">◎</span>earthbound.</div><button className="biome">Grassland⌄</button></header>
  <nav className="nav">{['Explore','At Risk','Jersey City','Field Notes','Hotspot list','Compare','Sources'].map((x,i)=><button className={i===0?'active':''} key={x}>{x}</button>)}</nav>
  <section className="strip"><div className="stripHead"><span>PLACES OF EXTRAORDINARY LIFE</span><span>Meet the species →</span></div><div className="places">
   {hotspots.map(x=><button key={x.name} className={selected===x.name?'place selected':'place'} onClick={()=>setSelected(x.name)}><span className="thumb"/><span><b>{x.name}</b><small>{x.status}</small></span></button>)}
  </div></section>
  <main className="atlas">
   <section className="map"><div className="eyebrow">THE BIODIVERSITY ATLAS</div><h1>Explore a changing planet.</h1><div className="globe"><Globe selected={selected} onSelect={setSelected}/></div><div className="toolrail"><button>◈</button><button>⌗</button><button>⌁</button></div><div className="orbit">← &nbsp; ↶ &nbsp; 360° &nbsp; Ⅱ &nbsp; →</div></section>
   <aside className="detail"><div className="kicker">● {h.biome.toUpperCase()}</div><h2>{h.name}</h2><em>{h.region}</em><div className="chips"><span>{h.biome}</span><span>Biodiversity hotspot</span><span>Habitat loss</span></div><p>{h.summary}</p><p>{h.pressure}</p></aside>
  </main>
 </div>
}