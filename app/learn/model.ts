export type Rainfall='Light'|'Heavy';
export type Ground='Pavement'|'Add a rain garden';
export type Prediction='Less runoff'|'About the same'|'More runoff'|'';
export type Conditions={rainfall:Rainfall;ground:Ground};
// Ordinal teaching assumptions only. These are not calibrated hydrological quantities.
export function rainResult(c:Conditions){
 const garden=c.ground==='Add a rain garden';
 return {runoff:c.rainfall==='Heavy'?(garden?'Moderate':'High'):(garden?'Low':'Moderate'),capture:garden?'Some water is held and filters through the planted soil.':'Water flows across the paving toward the drain.',sewer:c.rainfall==='Heavy'?'More wet-weather flow reaches the combined sewer. Overflow is possible if capacity is exceeded; this model cannot predict whether it will happen.':'The combined sewer carries wastewater and stormwater. This model does not predict an overflow.'};
}
export function sameConditions(a:Conditions,b:Conditions){return a.rainfall===b.rainfall&&a.ground===b.ground}
export function compareRuns(a:Conditions,b:Conditions){if(a.rainfall!==b.rainfall)return 'Rainfall changed. Run both ground surfaces with the same rainfall for a fair comparison.';if(a.ground===b.ground)return 'The conditions are unchanged, so the model gives the same result.';return b.ground==='Add a rain garden'?'With the same rainfall, the rain garden sends less runoff toward the drain.':'With the same rainfall, pavement sends more runoff toward the drain.'}
