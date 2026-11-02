import {findSpeciesIcon} from './model-records';
export default function SpeciesIcon({slug,scientificName}:{slug:string;scientificName?:string}){
 const record=findSpeciesIcon(slug,scientificName);
 return record?.icon?<img className="species-icon" src={record.icon} alt={record.iconAlt||record.commonName} width={128} height={128} loading="lazy" decoding="async"/>:<span className="species-icon-missing">Illustration unavailable</span>;
}

export function SpeciesIconCredit({slug,scientificName}:{slug:string;scientificName?:string}){
 const record=findSpeciesIcon(slug,scientificName);return record?.iconCredit?<span>{record.iconCredit}</span>:null;
}
