'use client';
import {usePathname} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
export function LearningHeader(){const path=usePathname(),detective=path.includes('/detective');return <header className={'learning-header '+(detective?'focused-header':'')}>
 {detective&&<a className="learning-back" href="/learn" aria-label="Back to challenges"><ArrowLeft/></a>}<a className="learning-wordmark" href="/learn">earthbound.</a><span className="learning-brand">{detective?'Learn':'Learning lab'}</span>
 <nav aria-label="Learning navigation"><a href="/?intro=0">Explore</a><a href="/learn" aria-current={!path.includes('/journal')?'page':undefined}>Challenges</a><a href="/learn/journal" aria-current={path.includes('/journal')?'page':undefined}>Field journal</a></nav>
 </header>}
