"use client";
import {SourceList} from "../evidence";
import {ExternalLink} from "../external-link";
import {ArrowUpRight,HandHeart} from 'lucide-react';
import data from '@/public/data/jersey-city/guide.json';
export function Sources({ids}: {ids:string[]}){return <details className="sources"><summary>Sources & dates</summary><SourceList sources={data.sources.filter(s=>ids.includes(s.id))}/></details>}
export function Help(){return <section className="jc-help"><span className="eyebrow"><HandHeart size={16}/> Take part</span><h2>How to help</h2><p>Join an organized activity with your class or family. Check the organizer’s age requirements and current schedule.</p><div className="jc-help-links"><ExternalLink href="https://www.folsp.org/">Park stewardship · Friends of Liberty State Park <ArrowUpRight size={14}/></ExternalLink><ExternalLink href="https://www.sustainablejc.org/trees-trash">Tree care · Sustainable Jersey City <ArrowUpRight size={14}/></ExternalLink><ExternalLink href="https://www.billionoysterproject.org/volunteering">Oyster restoration · Billion Oyster Project <ArrowUpRight size={14}/></ExternalLink><ExternalLink href="https://gothamwhale.org/">Report marine wildlife · Gotham Whale <ArrowUpRight size={14}/></ExternalLink></div></section>}
export function PageIntro({title,children}:any){return <><span className="eyebrow">Earthbound · Jersey City</span><h1>{title}</h1><div className="intro">{children}</div></>}
