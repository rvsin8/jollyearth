"use client";
import {ExternalLink} from "./external-link";
export interface SourceRecord {id?:string;url:string|null;title:string;note?:string;accessed?:string;licenseUrl?:string}
export function SourceList({sources}:{sources?:SourceRecord[]}){return <>{sources?.map((s)=><div className="source-entry" id={'source-'+s.id} key={s.id||s.url}><ExternalLink href={s.url||undefined}>{s.title} ↗</ExternalLink>{s.note&&<p>{s.note}</p>}<p>Accessed {s.accessed||'20 September 2026'}{s.licenseUrl&&<> · <ExternalLink href={s.licenseUrl}>Image license</ExternalLink></>}</p></div>)}</>}
export const statusNames:Record<string,string>={LC:'Least concern',NT:'Near threatened',VU:'Vulnerable',EN:'Endangered',CR:'Critically endangered',EW:'Extinct in the wild',EX:'Extinct',DD:'Data deficient',NE:'Not evaluated',UNKNOWN:'Status unavailable'};
export function RiskChip({status}:{status?:string}){return <span className="risk-chip" data-risk={status}>{status&&status!=='UNKNOWN'?status+' · ':''}{statusNames[status||'UNKNOWN']||'Status unavailable'}</span>}
