'use client';
import {useAnimalExhibit} from './animal-exhibit-context';
import {exhibitHref,findAnimal} from './animal-registry';
export default function AnimalTrigger({slug,children,className='',label}:{slug:string;children:React.ReactNode;className?:string;label?:string}){const {open}=useAnimalExhibit(),animal=findAnimal(slug);if(!animal)return <>{children}</>;return <a className={'animal-trigger '+className} href={exhibitHref(animal.slug)} aria-label={label||'Open '+animal.commonName+' exhibit'} aria-haspopup="dialog" onClick={e=>{if(e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){e.preventDefault();open(animal.slug,e.currentTarget)}}}>{children}</a>}
