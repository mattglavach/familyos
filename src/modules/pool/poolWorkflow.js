const FIELD_BY_NAME=[[/acid/i,"muriatic_acid_oz"],[/salt/i,"salt_lbs"],[/cya|stabilizer/i,"cya_oz"],[/chlorine/i,"liquid_chlorine_oz"]];
export function treatmentPrefill(recommendations, latest, now=new Date()) {
  const chemical=(recommendations||[]).filter(item=>item.category==="Chemical"&&item.amount); const form={date:now.toISOString().slice(0,10),time:now.toTimeString().slice(0,5),related_reading_id:latest?.id||null,reason:"FamilyOS treatment recommendation",notes:chemical.map(x=>x.action).join("; ")};
  chemical.forEach(rec=>{const match=String(rec.amount).match(/([\d.]+)\s*([a-zA-Z%]+)/);if(!match)return;const field=FIELD_BY_NAME.find(([pattern])=>pattern.test(`${rec.action} ${rec.amount}`))?.[1];if(field)form[field]=Number(match[1]);if(!form.treatment)form.treatment=rec.action;if(!form.amount){form.amount=Number(match[1]);form.unit=match[2];}}); return form;
}
