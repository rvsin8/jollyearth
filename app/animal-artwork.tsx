'use client';
import type {ImgHTMLAttributes} from 'react';
export default function AnimalArtwork({animal,...props}:{animal:{illustration:string|null;illustrationAlt:string;illustrationFallback?:string|null}}&ImgHTMLAttributes<HTMLImageElement>){if(!animal.illustration)return null;return <img {...props} src={animal.illustration} alt={animal.illustrationAlt} onError={e=>{const image=e.currentTarget;if(animal.illustrationFallback&&!image.dataset.fallback){image.dataset.fallback='true';image.src=animal.illustrationFallback}}}/>}
