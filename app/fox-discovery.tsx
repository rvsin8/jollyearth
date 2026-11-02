'use client';
import AnimalArtwork from './animal-artwork';
import AnimalTrigger from './animal-trigger';
import {findAnimal} from './animal-registry';
// Appended to the species list: no existing illustration is moved or resized.
export default function FoxDiscovery(){const animal=findAnimal('red-fox');if(!animal)return null;return <section className="fox-discovery" aria-label="Red fox species entry"><AnimalTrigger slug="red-fox" className="fox-discovery-link">{animal.illustration&&<AnimalArtwork animal={animal} width="128" height="128" loading="lazy"/>}<span><strong>Red fox</strong><i>Vulpes vulpes</i><span>Open animal exhibit →</span></span></AnimalTrigger></section>}
