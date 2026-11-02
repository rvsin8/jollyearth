'use client';

import { Globe2,Leaf,MapPin,Sprout } from 'lucide-react';

// One route registry drives desktop, mobile, and no-JavaScript navigation.
export const primaryNavigation = [
  {href: '/', label: 'Explore', mobileLabel: 'Explore', icon: Globe2},
  {href: '/collection', label: 'Living collection', mobileLabel: 'Collection', icon: Leaf},
  {href: '/jersey-city', label: 'Jersey City', mobileLabel: 'Jersey City', icon: MapPin},
  {href: '/plant-lab', label: 'Plant lab', mobileLabel: 'Plant lab', icon: Sprout},
] as const;

export const resourceNavigation = [
  {href: '/learn', label: 'Learning challenges'},
  {href: '/learn/journal', label: 'Field journal'},
  {href: '/at-risk', label: 'At risk'},
  {href: '/hotspots', label: 'Hotspot list'},
  {href: '/compare', label: 'Compare hotspots'},
  {href: '/field-notes', label: 'Field notes'},
  {href: '/sources', label: 'Sources & methods'},
] as const;

export const allNavigation = [...primaryNavigation, ...resourceNavigation];
export function navigationView(path: string) {
  return path.startsWith('/jersey-city') ? '/jersey-city' : path;
}

export function PrimaryNavigation({view}: {view: string}) {
  return <nav className="view-nav" aria-label="Main navigation">
    {primaryNavigation.map(({href, label}) =>
      <a key={href} href={href} aria-current={view === href ? 'page' : undefined}>{label}</a>)}
  </nav>;
}

export function ResourceNavigation({view}: {view: string}) {
  const active = resourceNavigation.some(item => item.href === view);
  return <details className="resource-navigation" key={view} open={active || undefined}>
    <summary>Tools & resources</summary>
    <nav className="view-nav" aria-label="Tools and resources">
      {resourceNavigation.map(({href, label}) =>
        <a key={href} href={href} aria-current={view === href ? 'page' : undefined}>{label}</a>)}
    </nav>
  </details>;
}
