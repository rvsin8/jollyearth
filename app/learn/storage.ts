import type {Conditions,Prediction} from './model';
export const STORAGE_KEY='earthbound-learning-v1';
export type Reflection={noticed:string;explanation:string;wonder:string};
export type Draft=Reflection&{id?:string;evidenceId:string;sourceActivity:string;context?:string};
export type Entry=Draft&{id:string;savedAt:string;attribution:string};
export type Run=Conditions&{id:string;prediction:Prediction;reason:string;result:string};
export type LearningState={version:1;draft:Draft;entries:Entry[];detective:{step:number;answer:number|null;reason:string;transfer:number|null;transferReason:string;complete:boolean};rain:{rainfall:Conditions['rainfall'];ground:Conditions['ground'];prediction:Prediction;reason:string;reflection:string;runs:Run[]}};
export function initialState():LearningState{return {version:1,draft:{evidenceId:'tern',sourceActivity:'journal',noticed:'',explanation:'',wonder:''},entries:[],detective:{step:1,answer:null,reason:'',transfer:null,transferReason:'',complete:false},rain:{rainfall:'Heavy',ground:'Add a rain garden',prediction:'',reason:'',reflection:'',runs:[]}}}
const text=(v:unknown)=>typeof v==='string';
function draftValid(d:any){return d&&['noticed','explanation','wonder','sourceActivity'].every(k=>text(d[k]))&&['tern','rail','rain'].includes(d.evidenceId)&&(d.id===undefined||text(d.id))&&(d.context===undefined||text(d.context))}
export function decodeState(raw:string|null):LearningState{
 if(!raw)return initialState();const s=JSON.parse(raw),d=s.detective,r=s.rain;
 if(s.version!==1||!draftValid(s.draft)||!Array.isArray(s.entries)||!s.entries.every((e:any)=>draftValid(e)&&text(e.id)&&text(e.savedAt)&&text(e.attribution))||!d||![1,2,3].includes(d.step)||![null,0,1,2].includes(d.answer)||![null,0,1,2].includes(d.transfer)||!text(d.reason)||!text(d.transferReason)||typeof d.complete!=='boolean'||!r||!['Light','Heavy'].includes(r.rainfall)||!['Pavement','Add a rain garden'].includes(r.ground)||!['','Less runoff','About the same','More runoff'].includes(r.prediction)||!text(r.reason)||!text(r.reflection)||!Array.isArray(r.runs)||!r.runs.every((x:any)=>text(x.id)&&text(x.result)&&text(x.reason)&&['Light','Heavy'].includes(x.rainfall)&&['Pavement','Add a rain garden'].includes(x.ground)&&['','Less runoff','About the same','More runoff'].includes(x.prediction)))throw Error('Saved learning data could not be read.');
 return s;
}
