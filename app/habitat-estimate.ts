export const habitatBands=[
 {key:'clay',label:'< 10%'},
 {key:'ochre',label:'10–20%'},
 {key:'sage',label:'> 20%'},
 {key:'unknown',label:'No estimate'},
] as const;
export function habitatEstimate(h:any){
 const r=h?.remaining;
 const valid=typeof r?.value==='number'&&Number.isFinite(r.value)&&r.value>=0&&r.value<=100&&r.source&&h.sources?.some((s:any)=>s.id===r.source);
 if(!valid)return {value:null,band:'unknown',label:'No estimate',source:undefined,year:null};
 return {value:r.value,band:r.value<10?'clay':r.value<=20?'ochre':'sage',label:`${r.value}% (${r.year})`,source:r.source,year:r.year};
}
