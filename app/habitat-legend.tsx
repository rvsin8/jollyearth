import {habitatBands} from './habitat-estimate';
export default function HabitatLegend(){return <section className="habitat-legend" aria-label="Historical habitat remaining, 2000"><span className="eyebrow">Historical habitat remaining (2000)</span><ul>{habitatBands.map(b=><li key={b.key}><i aria-hidden="true" style={{background:`var(--hotspot-${b.key})`}}/>{b.label}</li>)}</ul></section>}
