"use client";
import { usePathname } from 'next/navigation';
import WhereTheyGo from './where-they-go';

import { localSections } from './sections';
export function JerseyShell({children}:{children:React.ReactNode}){const pathname=usePathname();const main=pathname==='/jersey-city'?'discover':pathname.includes('/map')?'map':pathname.includes('/stories')?'stories':'';return <div className="jc-shell" data-local-view={main}><nav className="jc-primary-subnav" aria-label="Jersey City views">{[['/jersey-city','Discover','discover'],['/jersey-city/map','Map','map'],['/jersey-city/stories','Stories','stories']].map(([href,label,id])=><a key={href} href={href} aria-current={main===id?'page':undefined}>{label}</a>)}</nav>{!main&&<nav className="local-subnav local-subnav-mobile" aria-label="Jersey City sections">{localSections.map(([slug,name])=><a key={slug} href={'/jersey-city'+slug} aria-current={pathname==='/jersey-city'+slug?'page':undefined}>{name}</a>)}</nav>}<div className="jc-body">{children}{!main&&<WhereTheyGo/>}</div></div>}
