'use client';
import {migrations,migrationHref,migrationDescription,type Migration} from './migration-data';
import {SourceList} from "./evidence";
export function MigrationPanel({record:m}:{record:Migration}){return <section className="migration-panel" tabIndex={-1} aria-label={m.commonName+' migration'}>
 <span className="eyebrow">Where they go</span><h2>{m.commonName}</h2><p className="scientific">{m.scientificName}</p>
 <p>{m.localSite} → {m.destinationName}</p><p>{m.localSeason}</p>
 <p>{m.summary}</p><p className="migration-distance">Approximately {m.distanceKm.toLocaleString('en-US')} km <small>straight-line separation</small></p>
 <p>{m.note}</p>{!m.destinationHotspot&&<p>Suriname’s coast lies outside the mapped terrestrial biodiversity hotspots. Important migration habitat also exists beyond these boundaries.</p>}
 <h3>Threats along the way</h3><p>{m.threat}</p><a href="/jersey-city/wildlife#where-they-go">Back to Jersey City →</a>
 <details><summary>Migration sources & methods</summary><SourceList sources={m.sources}/></details>
 </section>}
export function ConnectedMigrations({hotspot}:{hotspot:string}){const matches=migrations.filter(m=>m.destinationHotspot===hotspot);if(!matches.length)return null;return <section className="migration-panel"><h2>Connected to Jersey City</h2><p>Local wildlife depends on habitats beyond the harbor.</p>{matches.map(m=><a key={m.slug} className="migration-local-link" href={migrationHref(m)} aria-label={migrationDescription(m)}>{m.commonName} · {m.destinationName} →</a>)}<a href="/jersey-city/wildlife#where-they-go">Explore Jersey City connections →</a></section>}
