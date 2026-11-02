import catalog from '@/public/data/models.json';
export type SeasonalModel={foliageNodes:string[];flowerNodes:string[];fruitNodes:string[];colors:Record<string,string>;flowers:string[];fruit:string[];leafless:string[]};
export type ExhibitView={controlsVersion?:2;defaultClip?:string;clipOrder?:string[];oneShotClips?:string[];camera?:[number,number,number];targetHeight?:number;fitPadding?:number;contactShadow?:boolean;minPolarAngle?:number;maxPolarAngle?:number};
export type ModelRecord={slug:string;commonName:string;scientificName:string;kind:'animal'|'plant';file:string;creator:string;creatorUrl:string;license:string;licenseUrl:string;sourceUrl:string;hasAnimation:boolean;hasLOD:boolean;exhibitView?:ExhibitView;mobileFile?:string|null;changes?:string;animationNote?:string;dimensions?:{heightM:number;label:string;sourceUrl:string};caption?:string;silhouette?:string;seasonal?:SeasonalModel;individuals?:string[]};
export type SpeciesIconRecord={slug:string;commonName:string;scientificName:string;kind:'animal'|'plant';file:string|null;icon?:string;iconAlt?:string;iconCredit?:string};
export const specimens=catalog as SpeciesIconRecord[];
// Icon-only records must never become loadable GLBs or model-credit entries.
export const models=catalog.map((m:any)=>m.model?{...m,file:m.model.status==='ready'?m.model.file:null,mobileFile:m.model.mobileFile,...(m.model.credit||{}),hasAnimation:!!m.model.clips?.length}:m).filter(m=>typeof m.file==='string'&&m.file.endsWith('.glb')) as ModelRecord[];
export const findModel=(slug:string,scientificName?:string)=>models.find(m=>m.slug===slug)|| (scientificName?models.find(m=>m.scientificName.toLowerCase()===scientificName.toLowerCase()):undefined);
export const findSpeciesIcon=(slug:string,scientificName?:string)=>specimens.find(m=>m.slug===slug)||(scientificName?specimens.find(m=>m.scientificName.toLowerCase()===scientificName.toLowerCase()):undefined);
