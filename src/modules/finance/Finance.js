import { useState, useEffect } from "react";
import { EmptyState, Modal, Sparkline, SwipeCard, SwipeHint } from "../../components/common";
import { AiBriefActions, AiBriefCard, AiBriefEmpty, AiBriefError, AiBriefFollowUp, AiBriefLoading, AiBriefText } from "../../components/ai/AiBriefPanel";
import { Button } from "../../components/ui/button";
import { SectionHeader } from "../../components/ui/section-header";
import { COLORS, S } from "../../theme";
import { TODAY_STR, daysBetween, formatDate } from "../../lib/dates";
import { useTable } from "../../hooks/useTable";
export function formatMoney(n,decimals=0){if(n===null||n===undefined||isNaN(n))return" ";return"$"+Math.round(n).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:decimals});}
export function formatMoneyShort(n){if(n===null||n===undefined||isNaN(n))return" ";const abs=Math.abs(n);if(abs>=1000000)return(n<0?"-":"")+"$"+(abs/1000000).toFixed(2)+"M";if(abs>=1000)return(n<0?"-":"")+"$"+Math.round(abs/1000)+"k";return formatMoney(n);}
function futureValue(presentValue,monthlyContribution,annualRatePct,years){const r=annualRatePct/100/12,n=years*12;if(r===0)return presentValue+monthlyContribution*n;return presentValue*Math.pow(1+r,n)+monthlyContribution*((Math.pow(1+r,n)-1)/r);}
function effectiveMonthlyContribution(account){const amount=account.monthly_contribution||0,match=account.employer_match||0;if(account.contribution_frequency==="biweekly")return(amount*26/12)+(match*26/12);return amount+match;}
function futureValueWithGrowth(presentValue,monthlyContribution,annualRatePct,years,annualGrowthPct=0){const r=annualRatePct/100/12;let balance=presentValue,contrib=monthlyContribution;const trajectory=[{year:0,balance:Math.round(balance)}];for(let y=1;y<=years;y++){for(let m=0;m<12;m++)balance=balance*(1+r)+contrib;trajectory.push({year:y,balance:Math.round(balance)});contrib=contrib*(1+annualGrowthPct/100);}return{finalBalance:balance,trajectory};}
function futureHealthcareCost(annualEstimate,years,growthPct=5.5,accelCapYears=20,normalInflationPct=3){if(years<=accelCapYears)return annualEstimate*Math.pow(1+growthPct/100,years);const atCap=annualEstimate*Math.pow(1+growthPct/100,accelCapYears);return atCap*Math.pow(1+normalInflationPct/100,years-accelCapYears);}
function householdSocialSecurityAtAge(assumptions,age,inflationPct){const hasSpouseFields=assumptions.social_security_estimate_spouse!==undefined&&assumptions.social_security_estimate_spouse!==null;if(!hasSpouseFields){const claimAge=+(assumptions.ss_claim_age)||67;if(age<claimAge)return 0;return(+(assumptions.social_security_estimate)||0)*Math.pow(1+inflationPct/100,age-claimAge);}let total=0;const userClaimAge=+(assumptions.ss_claim_age)||67,userBenefit=+(assumptions.social_security_estimate)||0;if(age>=userClaimAge)total+=userBenefit*Math.pow(1+inflationPct/100,age-userClaimAge);const spouseClaimAge=+(assumptions.ss_claim_age_spouse)||67,spouseBenefit=+(assumptions.social_security_estimate_spouse)||0;if(age>=spouseClaimAge)total+=spouseBenefit*Math.pow(1+inflationPct/100,age-spouseClaimAge);return total;}
function ruleOf55Eligible(account){return account.account_type==="403b"||account.account_type==="401k";}

// - MONTE CARLO -
function randomNormal(mean,stdDev){let u1=Math.random(),u2=Math.random();while(u1===0)u1=Math.random();const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);return mean+z*stdDev;}
function runOneMonteCarloPath(accounts,assumptions,retirementAgeOverride,meanReturn,stdDev){
  const spending=+(assumptions.annual_retirement_spending)||110000,hcEstimate=+(assumptions.healthcare_estimate)||0,inflationPct=+(assumptions.inflation_pct)||3,contribGrowth=+(assumptions.contribution_increase_pct)||0;
  const retAge=+(retirementAgeOverride||assumptions.retirement_age),currentAge=+(assumptions.current_age)||44,medicareAge=+(assumptions.medicare_age||assumptions.bridge_end_age)||65,planEndAge=+(assumptions.plan_end_age)||90;
  const totalBalance=accounts.reduce((s,a)=>s+(+(a.balance)||0),0),totalMonthly=accounts.reduce((s,a)=>s+effectiveMonthlyContribution(a),0),accumYears=Math.max(0,retAge-currentAge);
  const ruleOf55Share=totalBalance>0?accounts.filter(ruleOf55Eligible).reduce((s,a)=>s+(+(a.balance)||0),0)/totalBalance:0;
  let balance=totalBalance,contrib=totalMonthly;
  for(let y=0;y<accumYears;y++){const yearReturn=randomNormal(meanReturn,stdDev)/100;for(let m=0;m<12;m++)balance=balance*(1+yearReturn/12)+contrib;contrib=contrib*(1+contribGrowth/100);}
  const taxableMix=accounts.reduce((acc,a)=>{const share=totalBalance>0?(+(a.balance)||0)/totalBalance:0;return acc+share*(a.tax_treatment==="Roth"||a.tax_treatment==="HSA"?0:a.tax_treatment==="taxable"?0.10:0.18);},0);
  let spendable=balance*(1-taxableMix),ruleOf55Pool=spendable*ruleOf55Share,otherPool=spendable*(1-ruleOf55Share);
  const bridgeYears=Math.max(0,medicareAge-retAge),spendingAtRet=spending*Math.pow(1+inflationPct/100,accumYears);
  for(let y=0;y<bridgeYears;y++){const yearReturn=randomNormal(meanReturn,stdDev)/100,totalYearsFromNow=accumYears+y,hcYear=futureHealthcareCost(hcEstimate,totalYearsFromNow,5.5,20,inflationPct),needYear=hcYear+spendingAtRet*Math.pow(1+inflationPct/100,y);ruleOf55Pool*=(1+yearReturn);otherPool*=(1+yearReturn);if(ruleOf55Pool>=needYear)ruleOf55Pool-=needYear;else{const sf=needYear-ruleOf55Pool;ruleOf55Pool=0;otherPool=Math.max(0,otherPool-sf);}}
  let runningBalance=ruleOf55Pool+otherPool;const postBridgeYears=Math.max(0,planEndAge-medicareAge);
  for(let y=0;y<postBridgeYears;y++){const age=medicareAge+y,yearsFromRet=age-retAge,totalYearsFromNow=accumYears+bridgeYears+y,yearReturn=randomNormal(meanReturn,stdDev)/100,spendingThisYear=spending*Math.pow(1+inflationPct/100,yearsFromRet),hcYear=futureHealthcareCost(hcEstimate,totalYearsFromNow,5.5,20,inflationPct),ssThisYear=householdSocialSecurityAtAge(assumptions,age,inflationPct),spendYear=Math.max(0,spendingThisYear+hcYear-ssThisYear);runningBalance=runningBalance*(1+yearReturn)-spendYear;if(runningBalance<0)return{success:false,finalBalance:0};}
  return{success:true,finalBalance:Math.max(0,runningBalance)};
}
function runMonteCarloScenario(accounts,assumptions,retirementAgeOverride,numSimulations=1000){
  const meanReturn=+(assumptions.moderate_rate_pct)||7,stdDev=+(assumptions.return_volatility_pct)||15;
  let successes=0;const finalBalances=[];
  for(let i=0;i<numSimulations;i++){const result=runOneMonteCarloPath(accounts,assumptions,retirementAgeOverride,meanReturn,stdDev);if(result.success){successes++;finalBalances.push(result.finalBalance);}}
  finalBalances.sort((a,b)=>a-b);const median=finalBalances.length?finalBalances[Math.floor(finalBalances.length/2)]:0;
  return{retirementAge:retirementAgeOverride||assumptions.retirement_age,successRate:Math.round((successes/numSimulations)*100),medianFinalBalance:median,numSimulations};
}
function buildMonteCarloComparison(accounts,assumptions,numSimulations=1000){if(!assumptions)return[];const baseAge=assumptions.retirement_age;return[{label:"Current Plan",age:baseAge},{label:`Retire at ${baseAge-2}`,age:baseAge-2},{label:`Retire at ${baseAge+1}`,age:baseAge+1},{label:`Retire at ${baseAge+3}`,age:baseAge+3}].filter(v=>v.age>assumptions.current_age&&v.age<(assumptions.plan_end_age||90)).map(v=>{const result=runMonteCarloScenario(accounts,assumptions,v.age,numSimulations);return{...result,label:v.label};});}
function buildSpendingSensitivity(accounts,assumptions,numSimulations=500){if(!assumptions)return[];const base=+(assumptions.annual_retirement_spending)||110000;return[{label:formatMoneyShort(base-20000),spending:base-20000},{label:formatMoneyShort(base-10000),spending:base-10000},{label:`${formatMoneyShort(base)} (current)`,spending:base,isCurrent:true},{label:formatMoneyShort(base+10000),spending:base+10000},{label:formatMoneyShort(base+20000),spending:base+20000}].filter(v=>v.spending>0).map(v=>{const result=runMonteCarloScenario(accounts,{...assumptions,annual_retirement_spending:v.spending},null,numSimulations);return{...result,label:v.label,isCurrent:v.isCurrent||false};});}
function buildContributionImpact(accounts,assumptions,numSimulations=500){if(!assumptions)return[];return[{label:"Current",delta:0,isCurrent:true},{label:"+$250/mo",delta:250},{label:"+$500/mo",delta:500},{label:"+$1,000/mo",delta:1000}].map(v=>{const modifiedAccounts=v.delta>0?[...accounts,{id:`extra-${v.delta}`,balance:0,monthly_contribution:v.delta,employer_match:0,account_type:"IRA",tax_treatment:"Roth",contribution_frequency:"monthly",name:`Extra $${v.delta}/mo`}]:accounts;const result=runMonteCarloScenario(modifiedAccounts,assumptions,null,numSimulations);return{...result,label:v.label,delta:v.delta,isCurrent:v.isCurrent||false};});}

// - RETIREMENT DRAWDOWN -
function simulateRetirementDrawdown(accounts,assumptions){
  if(!assumptions)return null;
  const totalBalance=accounts.reduce((s,a)=>s+(+(a.balance)||0),0),totalMonthly=accounts.reduce((s,a)=>s+effectiveMonthlyContribution(a),0);
  const retirementAge=+(assumptions.retirement_age)||59,currentAge=+(assumptions.current_age)||44,accumYears=Math.max(0,retirementAge-currentAge);
  const contribGrowth=+(assumptions.contribution_increase_pct)||0,inflationPct=+(assumptions.inflation_pct)||3,accumRate=+(assumptions.moderate_rate_pct)||7,drawdownRate=+(assumptions.drawdown_rate_pct)||5,r=drawdownRate/100;
  const planEndAge=+(assumptions.plan_end_age)||90,medicareAge=+(assumptions.medicare_age||assumptions.bridge_end_age)||65,ssClaimAge=+(assumptions.ss_claim_age)||67;
  const annualSpending=+(assumptions.annual_retirement_spending)||110000,hcEstimate=+(assumptions.healthcare_estimate)||0;
  const ruleOf55Share=totalBalance>0?accounts.filter(ruleOf55Eligible).reduce((s,a)=>s+(+(a.balance)||0),0)/totalBalance:0;
  const accumSchedule=[];
  {let bal=totalBalance,contrib=totalMonthly,rMonthly=accumRate/100/12;accumSchedule.push({age:currentAge,balance:Math.round(bal)});for(let y=1;y<=accumYears;y++){for(let m=0;m<12;m++)bal=bal*(1+rMonthly)+contrib;accumSchedule.push({age:currentAge+y,balance:Math.round(bal)});contrib=contrib*(1+contribGrowth/100);}}
  const balanceAtRetirement=accumSchedule.length?accumSchedule[accumSchedule.length-1].balance:totalBalance;
  const taxableMix=accounts.reduce((acc,a)=>{const share=totalBalance>0?(a.balance||0)/totalBalance:0;return acc+share*(a.tax_treatment==="Roth"||a.tax_treatment==="HSA"?0:a.tax_treatment==="taxable"?0.10:0.18);},0);
  const spendableAtRetirement=balanceAtRetirement*(1-taxableMix);
  let ruleOf55Pool=spendableAtRetirement*ruleOf55Share,otherPool=spendableAtRetirement*(1-ruleOf55Share);
  const bridgeYears=Math.max(0,medicareAge-retirementAge),spendingAtRetirement=annualSpending*Math.pow(1+inflationPct/100,accumYears);
  const bridgeSchedule=[];let bridgeShortfall=0;
  for(let y=0;y<bridgeYears;y++){const totalYearsFromNow=accumYears+y,hcYear=futureHealthcareCost(hcEstimate,totalYearsFromNow,5.5,20,inflationPct),spendYear=spendingAtRetirement*Math.pow(1+inflationPct/100,y),needYear=hcYear+spendYear;ruleOf55Pool=ruleOf55Pool*(1+r);otherPool=otherPool*(1+r);if(ruleOf55Pool>=needYear)ruleOf55Pool-=needYear;else{const shortfall=needYear-ruleOf55Pool;bridgeShortfall+=shortfall;ruleOf55Pool=0;otherPool=Math.max(0,otherPool-shortfall);}bridgeSchedule.push({age:retirementAge+y,balance:Math.round(ruleOf55Pool+otherPool),ruleOf55Pool:Math.round(ruleOf55Pool),otherPool:Math.round(otherPool),needYear:Math.round(needYear)});}
  const balanceAtBridgeEnd=ruleOf55Pool+otherPool,postBridgeYears=Math.max(0,planEndAge-medicareAge);
  let runningBalance=balanceAtBridgeEnd;const drawdownSchedule=[];let ranOutAtAge=null;
  for(let y=0;y<postBridgeYears;y++){const age=medicareAge+y,yearsFromRetirement=age-retirementAge,totalYearsFromNow=accumYears+bridgeYears+y,spendingThisYear=annualSpending*Math.pow(1+inflationPct/100,yearsFromRetirement),hcYear=futureHealthcareCost(hcEstimate,totalYearsFromNow,5.5,20,inflationPct),ssThisYear=householdSocialSecurityAtAge(assumptions,age,inflationPct),spendYear=Math.max(0,spendingThisYear+hcYear-ssThisYear);runningBalance=runningBalance*(1+r)-spendYear;if(runningBalance<0&&ranOutAtAge===null)ranOutAtAge=age;if(runningBalance<0)runningBalance=0;drawdownSchedule.push({age,balance:Math.round(runningBalance)});}
  return{totalBalance,totalMonthly,accumYears,balanceAtRetirement,spendableAtRetirement,taxableMix,ruleOf55Share,bridgeYears,medicareAge,ssClaimAge,bridgeShortfall,bridgeSchedule,balanceAtBridgeEnd,postBridgeYears,planEndAge,drawdownSchedule,ranOutAtAge,lastsFullPlan:ranOutAtAge===null,finalBalance:Math.max(0,runningBalance),fullTimeline:[...accumSchedule,...bridgeSchedule,...drawdownSchedule]};
}

function buildIncomeTimeline(assumptions,drawdown){
  if(!assumptions||!drawdown)return[];
  const retAge=+(assumptions.retirement_age)||59,annualSpend=+(assumptions.annual_retirement_spending)||110000,medicareAge=drawdown.medicareAge,ssClaimAge=drawdown.ssClaimAge,planEnd=drawdown.planEndAge;
  function avgNeedForRange(startAge,endAge){const bridgeVals=(drawdown.bridgeSchedule||[]).filter(b=>b.age>=startAge&&b.age<endAge).map(b=>b.needYear);if(bridgeVals.length)return bridgeVals.reduce((a,b)=>a+b,0)/bridgeVals.length;return null;}
  const bands=[];
  if(medicareAge>retAge)bands.push({ageRange:`${retAge} ${medicareAge}`,sources:["403(b) / 401(k)   Rule of 55"],detail:"Penalty-free withdrawals from current-employer plans. Self-funded healthcare (no Medicare yet).",avgAnnual:avgNeedForRange(retAge,medicareAge),color:COLORS.purple});
  if(ssClaimAge>medicareAge)bands.push({ageRange:`${medicareAge} ${ssClaimAge}`,sources:["Medicare","Portfolio withdrawals"],detail:"Healthcare costs drop with Medicare coverage. No Social Security yet.",avgAnnual:annualSpend,color:COLORS.blue});
  else bands.push({ageRange:`${medicareAge}+`,sources:["Medicare","Social Security","Portfolio"],detail:"Medicare and Social Security both active.",avgAnnual:Math.max(0,annualSpend-(+(assumptions.social_security_estimate)||0)),color:COLORS.blue});
  if(ssClaimAge>=medicareAge&&ssClaimAge<planEnd)bands.push({ageRange:`${ssClaimAge} ${planEnd}`,sources:["Social Security","Medicare","Portfolio withdrawals"],detail:"Full income stack   Social Security and Medicare both active.",avgAnnual:Math.max(0,annualSpend-(+(assumptions.social_security_estimate)||0)),color:COLORS.green});
  return bands;
}

function buildFamilyMilestones(assump,collegeGoals,mort,mortMonths,retProj){
  const milestones=[],currentYear=new Date().getFullYear(),childColors={Aubrey:COLORS.red,Blake:COLORS.green,Brayden:COLORS.amber};
  (collegeGoals||[]).forEach(g=>{if(g?.target_year)milestones.push({year:g.target_year,label:`${g.child_name||"Child"} starts college`,detail:g.notes||"Target start year",icon:" ",color:childColors[g.child_name]||COLORS.slate});});
  if(mort&&mortMonths){const payoffYear=currentYear+Math.ceil(mortMonths/12);milestones.push({year:payoffYear,label:"Mortgage paid off",detail:`${formatMoney(mort.current_balance)} balance, ${mort.interest_rate}% rate`,icon:" ",color:COLORS.blue});}
  if(assump){const retYear=currentYear+(assump.retirement_age-assump.current_age);milestones.push({year:retYear,label:`Retirement (age ${assump.retirement_age})`,detail:"Rule of 55 bridge years begin",icon:"  ",color:COLORS.purple});if(retProj?.drawdown){const medicareYear=currentYear+(retProj.drawdown.medicareAge-assump.current_age);milestones.push({year:medicareYear,label:`Medicare eligible (age ${retProj.drawdown.medicareAge})`,detail:"Bridge years end, healthcare costs drop",icon:"  ",color:COLORS.green});const ssYear=currentYear+(retProj.drawdown.ssClaimAge-assump.current_age);milestones.push({year:ssYear,label:`Social Security claimed (age ${retProj.drawdown.ssClaimAge})`,detail:"Full income stack begins",icon:" ",color:COLORS.green});}}
  return milestones.sort((a,b)=>a.year-b.year);
}

export function calcRetirementProjection(accounts,assumptions){
  if(!assumptions||!accounts)return null;
  const retirementAge=+(assumptions.retirement_age)||59,currentAge=+(assumptions.current_age)||44,contribGrowth=+(assumptions.contribution_increase_pct)||0,inflationPct=+(assumptions.inflation_pct)||3;
  const annualSpending=+(assumptions.annual_retirement_spending)||110000,hcEstimate=+(assumptions.healthcare_estimate)||0,ssEstimate=+(assumptions.social_security_estimate)||0,withdrawalRate=+(assumptions.withdrawal_rate_pct)||4,medicareAge=+(assumptions.medicare_age||assumptions.bridge_end_age)||65;
  const totalBalance=accounts.reduce((s,a)=>s+(+(a.balance)||0),0),totalMonthly=accounts.reduce((s,a)=>s+effectiveMonthlyContribution(a),0),years=Math.max(0,retirementAge-currentAge),deflator=Math.pow(1+inflationPct/100,years);
  const scenarios=[{label:"Conservative",rate:+(assumptions.conservative_rate_pct)||5,color:COLORS.slate},{label:"Moderate",rate:+(assumptions.moderate_rate_pct)||7,color:COLORS.blue},{label:"Aggressive",rate:+(assumptions.aggressive_rate_pct)||9,color:COLORS.green}].map(s=>{const result=futureValueWithGrowth(totalBalance,totalMonthly,s.rate,years,contribGrowth);return{...s,projected:result.finalBalance,trajectory:result.trajectory,projectedTodaysDollars:result.finalBalance/deflator};});
  const moderate=scenarios.find(s=>s.label==="Moderate"),moderateProjected=moderate.projected;
  const taxableMix=accounts.reduce((acc,a)=>{const share=totalBalance>0?(a.balance||0)/totalBalance:0;return acc+share*(a.tax_treatment==="Roth"||a.tax_treatment==="HSA"?0:a.tax_treatment==="taxable"?0.10:0.18);},0);
  const spendableProjected=moderateProjected*(1-taxableMix),spendableTodaysDollars=spendableProjected/deflator;
  const netAnnualNeed=Math.max(0,annualSpending-ssEstimate),targetNumberToday=netAnnualNeed/(withdrawalRate/100),targetNumberInflated=targetNumberToday*deflator,gap=targetNumberInflated-spendableProjected;
  const r=(+(assumptions.moderate_rate_pct)||7)/100/12,n=years*12,fvOfCurrent=totalBalance*Math.pow(1+r,n),remaining=targetNumberInflated-fvOfCurrent;
  const monthlyNeeded=remaining>0&&n>0?remaining/((Math.pow(1+r,n)-1)/r):0;
  const bridgeEndAge=medicareAge,bridgeYears=Math.max(0,medicareAge-retirementAge),spendingAtRetirement=annualSpending*Math.pow(1+inflationPct/100,years);
  let bridgeTotalNeeded=0;for(let y=0;y<bridgeYears;y++){const hcYear=futureHealthcareCost(hcEstimate,years+y,5.5,20,inflationPct),spendYear=spendingAtRetirement*Math.pow(1+inflationPct/100,y);bridgeTotalNeeded+=hcYear+spendYear;}
  const ruleOf55Balance=accounts.filter(ruleOf55Eligible).reduce((s,a)=>s+(a.balance||0),0),ruleOf55Share=totalBalance>0?ruleOf55Balance/totalBalance:0;
  const drawdown=simulateRetirementDrawdown(accounts,assumptions),gapPctOfTarget=targetNumberInflated>0?(gap/targetNumberInflated)*100:0;
  let status,statusLabel,statusColor,statusDetail;
  const bridgeOk=drawdown.bridgeShortfall<=0,finalCushionPct=drawdown.lastsFullPlan&&targetNumberInflated>0?(drawdown.finalBalance/targetNumberInflated)*100:0;
  if(drawdown.lastsFullPlan&&bridgeOk&&finalCushionPct>=50){status="excellent";statusLabel="Excellent";statusColor=COLORS.green;statusDetail=`Plan lasts through age ${drawdown.planEndAge||90} with significant cushion.`;}
  else if(drawdown.lastsFullPlan&&bridgeOk){status="ontrack";statusLabel="On Track";statusColor=COLORS.green;statusDetail=`Plan lasts through age ${drawdown.planEndAge||90}.`;}
  else if(drawdown.lastsFullPlan&&!bridgeOk){status="monitor";statusLabel="On Track   Monitor Bridge Years";statusColor=COLORS.amber;statusDetail=`Full plan succeeds, but the ${retirementAge}-${drawdown.medicareAge} bridge needs attention.`;}
  else if(drawdown.ranOutAtAge&&drawdown.ranOutAtAge>=80){status="monitor";statusLabel="Monitor Closely";statusColor=COLORS.amber;statusDetail=`Funds projected to run low around age ${drawdown.ranOutAtAge}.`;}
  else{status="risk";statusLabel="Retirement Plan Needs Adjustment";statusColor=COLORS.red;statusDetail=`Funds projected to run low around age ${drawdown.ranOutAtAge||" "}.`;}
  const contributionIncreasePctNeeded=totalMonthly>0?((monthlyNeeded-totalMonthly)/totalMonthly)*100:(monthlyNeeded>0?999:0),bridgeCovered=drawdown.bridgeShortfall<=0;
  const quickRecs=[];
  if(drawdown.bridgeShortfall>0)quickRecs.push(`Bridge years (age ${retirementAge}-${drawdown.medicareAge}) come up ~${formatMoneyShort(drawdown.bridgeShortfall)} short   consider increasing contributions or building extra taxable savings.`);
  if(!drawdown.lastsFullPlan)quickRecs.push(`At current trajectory, savings are projected to run low around age ${drawdown.ranOutAtAge}   well before ${drawdown.planEndAge}.`);
  else if(drawdown.finalBalance>0&&status==="green")quickRecs.push(`Projected to last through age ${drawdown.planEndAge} with ${formatMoneyShort(drawdown.finalBalance)} remaining.`);
  if(taxableMix>0.15)quickRecs.push(`Most of your balance is pre-tax   consider Roth contributions or conversions to reduce future tax drag.`);
  if(quickRecs.length===0)quickRecs.push(`Current trajectory covers your full retirement plan through age ${drawdown.planEndAge}   maintain contributions and revisit assumptions annually.`);
  return{totalBalance,totalMonthly,years,scenarios,growthRate:contribGrowth,targetNumberToday,targetNumberInflated,inflationPct,deflator,spendableProjected,spendableTodaysDollars,taxableMix,gap,monthlyNeeded,netAnnualNeed,bridgeYears,bridgeTotalNeeded,bridgeEndAge,ruleOf55Balance,ruleOf55Share,nonRuleOf55Balance:totalBalance-ruleOf55Balance,bridgeCovered,status,statusLabel,statusColor,statusDetail,gapPctOfTarget,contributionIncreasePctNeeded,quickRecs,drawdown,trajectory:moderate.trajectory};
}

function buildReadinessChecklist(retProj,monteCarloResults,assumptions){
  if(!retProj)return[];
  const items=[],contributionGapPct=retProj.contributionIncreasePctNeeded;
  if(contributionGapPct<=0)items.push({label:"Savings Rate",status:"good",detail:"Current contributions meet or exceed what's needed for the moderate scenario."});
  else if(contributionGapPct<=25)items.push({label:"Savings Rate",status:"watch",detail:`Contributions are close   increasing by ~${Math.round(contributionGapPct)}% would close the gap.`});
  else items.push({label:"Savings Rate",status:"risk",detail:`Contributions would need to increase ~${Math.round(contributionGapPct)}% to fully close the gap.`});
  if(retProj.gap<=0)items.push({label:"Portfolio Size",status:"good",detail:"Projected balance meets or exceeds the inflation-adjusted target."});
  else if(retProj.gapPctOfTarget<=20)items.push({label:"Portfolio Size",status:"watch",detail:`Within ${Math.round(retProj.gapPctOfTarget)}% of target   a modest gap.`});
  else items.push({label:"Portfolio Size",status:"risk",detail:`${Math.round(retProj.gapPctOfTarget)}% below the inflation-adjusted target.`});
  if(retProj.bridgeCovered)items.push({label:"Rule of 55 Bridge",status:"good",detail:"403(b)/401(k) funds alone cover the bridge years without penalty."});
  else items.push({label:"Rule of 55 Bridge",status:"risk",detail:`Bridge years come up ~${formatMoneyShort(retProj.drawdown.bridgeShortfall)} short.`});
  const hcAtEnd=futureHealthcareCost(assumptions.healthcare_estimate||0,(retProj.drawdown.planEndAge-assumptions.current_age),5.5,20,retProj.inflationPct),spendAtEnd=assumptions.annual_retirement_spending*Math.pow(1+retProj.inflationPct/100,retProj.drawdown.planEndAge-assumptions.retirement_age),hcShareAtEnd=spendAtEnd>0?hcAtEnd/(hcAtEnd+spendAtEnd):0;
  if(hcShareAtEnd<0.25)items.push({label:"Healthcare Risk",status:"good",detail:`Healthcare projected at ~${Math.round(hcShareAtEnd*100)}% of total spending by age ${retProj.drawdown.planEndAge}.`});
  else if(hcShareAtEnd<0.40)items.push({label:"Healthcare Risk",status:"watch",detail:`Healthcare grows to ~${Math.round(hcShareAtEnd*100)}% of spending   worth monitoring.`});
  else items.push({label:"Healthcare Risk",status:"risk",detail:`Healthcare projected at ~${Math.round(hcShareAtEnd*100)}% of spending   a significant share.`});
  if(retProj.taxableMix<=0.10)items.push({label:"Tax Diversification",status:"good",detail:"Well diversified across Roth, taxable, and pre-tax accounts."});
  else if(retProj.taxableMix<=0.18)items.push({label:"Tax Diversification",status:"watch",detail:"Moderately concentrated in pre-tax accounts."});
  else items.push({label:"Tax Diversification",status:"risk",detail:"Heavily concentrated in pre-tax accounts."});
  if(monteCarloResults){const current=monteCarloResults.find(r=>r.label==="Current Plan");if(current){if(current.successRate>=85)items.push({label:"Market Variation",status:"good",detail:`${current.successRate}% of simulated market paths succeed.`});else if(current.successRate>=70)items.push({label:"Market Variation",status:"watch",detail:`${current.successRate}% of simulated paths succeed   meaningful risk from bad timing.`});else items.push({label:"Market Variation",status:"risk",detail:`Only ${current.successRate}% of simulated paths succeed.`});}}
  else items.push({label:"Market Variation",status:"unknown",detail:"Run Monte Carlo simulation to see how market variation affects this."});
  return items;
}

function calcPooledCollegeProjection(savings,goals){
  if(!savings||!goals||goals.length===0)return null;
  const currentYear=new Date().getFullYear(),sorted=[...goals].filter(g=>g.target_year).sort((a,b)=>a.target_year-b.target_year);
  if(sorted.length===0)return null;
  let balance=savings.balance||0,lastYear=currentYear;const monthlyContribution=savings.monthly_contribution||0,rate=6,perChild=[];
  sorted.forEach(g=>{const yearsToThis=Math.max(0,g.target_year-lastYear);balance=futureValue(balance,monthlyContribution,rate,yearsToThis);const availableAtStart=balance,shortfall=Math.max(0,g.target_amount-availableAtStart);balance=Math.max(0,availableAtStart-g.target_amount);perChild.push({child_name:g.child_name,target_year:g.target_year,target_amount:g.target_amount,poolBalanceAtStart:Math.round(availableAtStart),shortfall:Math.round(shortfall),fullyFunded:shortfall<=0});lastYear=g.target_year;});
  const totalTargets=sorted.reduce((s,g)=>s+g.target_amount,0),anyShortfall=perChild.some(c=>!c.fullyFunded);
  const finalGoal=sorted[sorted.length-1],yearsToLast=Math.max(0,finalGoal.target_year-currentYear);
  let suggestedMonthly=monthlyContribution;
  if(anyShortfall&&yearsToLast>0){let lo=monthlyContribution,hi=monthlyContribution+5000,iterations=0;while(hi-lo>1&&iterations<40){const mid=(lo+hi)/2;let bal=savings.balance||0,ly=currentYear,ok=true;for(const g of sorted){const yrs=Math.max(0,g.target_year-ly);bal=futureValue(bal,mid,rate,yrs);if(bal<g.target_amount)ok=false;bal=Math.max(0,bal-g.target_amount);ly=g.target_year;}if(ok)hi=mid;else lo=mid;iterations++;}suggestedMonthly=Math.round(hi);}
  return{perChild,totalTargets,totalShortfall:perChild.reduce((s,c)=>s+c.shortfall,0),anyShortfall,suggestedMonthly,currentContribution:monthlyContribution};
}

function calcPayoffMonths(balance,annualRatePct,monthlyPayment){const r=annualRatePct/100/12;if(monthlyPayment<=balance*r)return null;if(r===0)return Math.ceil(balance/monthlyPayment);return Math.ceil(Math.log(monthlyPayment/(monthlyPayment-balance*r))/Math.log(1+r));}
function calcTotalInterest(balance,annualRatePct,monthlyPayment,months){if(!months)return null;return Math.round(monthlyPayment*months-balance);}
function monthsToDate(months){const d=new Date();d.setMonth(d.getMonth()+months);return d.toLocaleDateString("en-US",{month:"short",year:"numeric"});}
function staleness(lastUpdated,thresholdDays=30){if(!lastUpdated)return{stale:true,days:null};const days=-daysBetween(lastUpdated);return{stale:days>thresholdDays,days};}

function RetirementBrief({accounts, assumptions, retProj, monteCarloResults, onClose}) {
  const [brief, setBrief]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [history, setHistory] = useState([]);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [hasRun, setHasRun]   = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [askingFollowUp, setAskingFollowUp] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("retirementBriefHistory") || "[]");
      setHistory(saved);
    } catch {}
  }, []);

  function saveBriefToHistory(briefText) {
    try {
      const saved = JSON.parse(localStorage.getItem("retirementBriefHistory") || "[]");
      const updated = [{ date: new Date().toISOString(), text: briefText }, ...saved].slice(0, 3);
      localStorage.setItem("retirementBriefHistory", JSON.stringify(updated));
      setHistory(updated);
    } catch {}
  }

  async function generateBrief() {
    setHasRun(true); setLoading(true); setViewingHistory(null);
    try {
      const accountSummary = accounts.map(a =>
        `${a.name} (${a.account_type}, ${a.tax_treatment}): ${formatMoney(a.balance)}, contributing ${formatMoney(a.monthly_contribution)}${a.contribution_frequency==="biweekly"?"/paycheck":"/mo"}${a.employer_match?` + ${formatMoney(a.employer_match)} match`:""}, last updated ${a.last_updated}`
      ).join(String.fromCharCode(10));
      const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
      const prompt = `You are a knowledgeable, plain-spoken financial planning assistant helping a 44-year-old household in South Carolina targeting retirement at age ${assumptions.retirement_age}. You are not a licensed financial advisor.

Today is ${today}.

Accounts:
${accountSummary}

Totals: Balance ${formatMoney(retProj.totalBalance)}, Monthly contribution ${formatMoney(retProj.totalMonthly)}, Years to retirement: ${retProj.years}

Projections at age ${assumptions.retirement_age}:
- Conservative: ${formatMoney(retProj.scenarios[0].projectedTodaysDollars)} today's dollars
- Moderate: ${formatMoney(retProj.scenarios[1].projectedTodaysDollars)} today's dollars
- Aggressive: ${formatMoney(retProj.scenarios[2].projectedTodaysDollars)} today's dollars

Gap (nominal dollars): ${formatMoney(retProj.gap)}
Drawdown result: ${retProj.drawdown.lastsFullPlan ? `Lasts through age ${retProj.drawdown.planEndAge}` : `Runs low around age ${retProj.drawdown.ranOutAtAge}`}
Bridge shortfall: ${retProj.drawdown.bridgeShortfall>0?formatMoneyShort(retProj.drawdown.bridgeShortfall):"none"}
${monteCarloResults ? `Monte Carlo success rate: ${monteCarloResults.find(r=>r.label==="Current Plan")?.successRate}%` : "Monte Carlo not run yet."}

Write a brief with these EXACT sections, bullets only, under 200 words total:
**WHERE YOU STAND**   [current balance and trajectory]
**THE REAL NUMBER**   [tax-adjusted inflation-adjusted gap]
**THE BRIDGE YEARS**   [age ${assumptions.retirement_age}-${retProj.drawdown.medicareAge} assessment]
**THROUGH AGE ${retProj.drawdown.planEndAge}**   [does the plan last]
**REALISTIC ODDS**   [Monte Carlo result or note to run it]
**WHAT WOULD HELP MOST**   [1-2 concrete levers]
**KNOWN LIMITATION**   [brief honest note]`;

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      if(!res.ok || data.error) { setError(`API error: ${data.error?.message||data.error||`HTTP ${res.status}`}`); setLoading(false); return; }
      const textBlocks = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join(String.fromCharCode(10));
      const finalBrief = textBlocks || "Unable to generate brief.";
      setBrief(finalBrief);
      saveBriefToHistory(finalBrief);
    } catch(e) { setError("Could not generate brief: " + e.message); }
    setLoading(false);
  }

  async function askFollowUp() {
    if (!followUp.trim() || !brief) return;
    const question = followUp.trim();
    setChatMessages(prev => [...prev, { role: "user", text: question }]);
    setFollowUp(""); setAskingFollowUp(true);
    try {
      const followUpPrompt = `You already gave this retirement brief:\n\n${brief}\n\nAnswer this follow-up (2-4 sentences, no headers). You are not a licensed advisor. Balance ${formatMoney(retProj.totalBalance)}, retiring at ${assumptions.retirement_age}.\n\nQuestion: ${question}`;
      const res = await fetch("/api/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, messages: [{ role: "user", content: followUpPrompt }] }) });
      const data = await res.json();
      const textBlocks = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join(String.fromCharCode(10));
      setChatMessages(prev => [...prev, { role: "assistant", text: textBlocks || "Could not get a response." }]);
    } catch(e) { setChatMessages(prev => [...prev, { role: "assistant", text: "Error: " + e.message }]); }
    setAskingFollowUp(false);
  }

  const displayedBrief = viewingHistory !== null ? history[viewingHistory]?.text : brief;
  const displayedIsHistory = viewingHistory !== null;

  return (
    <Modal title="Retirement Brief" onClose={onClose}>
      {history.length > 0 && (
        <>
          <SectionHeader title="Past Briefs" className="mt-0"/>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={viewingHistory===null?"default":"secondary"} onClick={()=>setViewingHistory(null)}>Latest</Button>
            {history.map((h,i)=>(<Button key={i} type="button" size="sm" variant={viewingHistory===i?"default":"secondary"} onClick={()=>setViewingHistory(i)}>{new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</Button>))}
          </div>
        </>
      )}
      {loading && viewingHistory===null && <AiBriefLoading title="Analyzing your retirement trajectory" />}
      {viewingHistory===null && <AiBriefError>{error}</AiBriefError>}
      {!hasRun && !loading && viewingHistory===null && (
        <AiBriefEmpty detail="Run an analysis of your retirement trajectory, contribution rate, and bridge gap." actionLabel="Run Analysis" onAction={generateBrief}/>
      )}
      {displayedBrief && (!loading || displayedIsHistory) && (
        <>
          <AiBriefCard><AiBriefText text={displayedBrief} headingSize="md"/></AiBriefCard>
          {!displayedIsHistory && <AiBriefActions primaryLabel="Regenerate" onPrimary={generateBrief}/>}
          {!displayedIsHistory && (
            <AiBriefFollowUp messages={chatMessages} asking={askingFollowUp} value={followUp} onChange={e=>setFollowUp(e.target.value)} onAsk={askFollowUp} placeholder="e.g. what if I retire at 62 instead?"/>
          )}
        </>
      )}
    </Modal>
  );
}

export function Finance(){
  const accounts    = useTable("retirement_accounts","name",true);
  const assumptions = useTable("retirement_assumptions","id",true);
  const collegeSav  = useTable("college_savings","id",true);
  const collegeGoal = useTable("college_goal","id",true);
  const mortgage    = useTable("mortgage","id",true);
  const otherDebt   = useTable("other_debt","name",true);
  const snapshots   = useTable("net_worth_snapshots","date",false);
  const actionItems = useTable("finance_action_items","created_date",false);

  const [tab,setTab]             = useState("summary");
  const [showModal,setShowModal] = useState(null);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);
  const [showRetBrief,setShowRetBrief] = useState(false);
  const [showBridgeMath,setShowBridgeMath] = useState(false);
  const [showBridgeTable,setShowBridgeTable] = useState(false);
  const [showAnalysis,setShowAnalysis] = useState(false);
  const [showTimeline,setShowTimeline] = useState(false);
  const [monteCarloResults,setMonteCarloResults] = useState(null);
  const [monteCarloRunning,setMonteCarloRunning] = useState(false);
  const [spendingResults,setSpendingResults] = useState(null);
  const [spendingRunning,setSpendingRunning] = useState(false);
  const [contribResults,setContribResults] = useState(null);
  const [contribRunning,setContribRunning] = useState(false);

  function openEdit(modal,item){ setEditItem(item); setForm({...item}); setShowModal(modal); setActiveSwipe(null); }
  function closeModal(){ setShowModal(null); setEditItem(null); setForm({}); }

  const assump = assumptions.data[0];
  const collegeS = collegeSav.data[0];
  const mort = mortgage.data[0];

  function runMonteCarlo() {
    if(!assump) return;
    setMonteCarloRunning(true); setMonteCarloResults(null);
    setTimeout(() => { setMonteCarloResults(buildMonteCarloComparison(accounts.data, assump, 1000)); setMonteCarloRunning(false); }, 50);
  }
  function runSpendingSensitivity() {
    if(!assump) return;
    setSpendingRunning(true); setSpendingResults(null);
    setTimeout(() => { setSpendingResults(buildSpendingSensitivity(accounts.data, assump, 500)); setSpendingRunning(false); }, 50);
  }
  function runContribImpact() {
    if(!assump) return;
    setContribRunning(true); setContribResults(null);
    setTimeout(() => { setContribResults(buildContributionImpact(accounts.data, assump, 500)); setContribRunning(false); }, 50);
  }

  const retProj = assump ? calcRetirementProjection(accounts.data, assump) : null;
  const readinessChecklist = retProj && assump ? buildReadinessChecklist(retProj, monteCarloResults, assump) : [];
  const pooledCollegeProj = calcPooledCollegeProjection(collegeS, collegeGoal.data);
  const mortMonths = mort ? calcPayoffMonths(mort.current_balance, mort.interest_rate, mort.monthly_payment + (mort.extra_payment_monthly||0)) : null;
  const mortMonthsNoExtra = mort ? calcPayoffMonths(mort.current_balance, mort.interest_rate, mort.monthly_payment) : null;
  const mortInterest = mort && mortMonths ? calcTotalInterest(mort.current_balance, mort.interest_rate, mort.monthly_payment+(mort.extra_payment_monthly||0), mortMonths) : null;
  const interestSaved = mort && mortMonths && mortMonthsNoExtra && mort.extra_payment_monthly>0
    ? calcTotalInterest(mort.current_balance, mort.interest_rate, mort.monthly_payment, mortMonthsNoExtra) - mortInterest : null;

  const incomeTimeline = assump && retProj?.drawdown ? buildIncomeTimeline(assump, retProj.drawdown) : [];
  const familyMilestones = assump ? buildFamilyMilestones(assump, collegeGoal.data, mort, mortMonths, retProj) : [];

  const totalRetirement = accounts.data.reduce((s,a)=>s+(a.balance||0),0);
  const totalCollege = collegeS?.balance || 0;
  const homeValue = mort?.home_value || 0;
  const totalMortgageDebt = mort?.current_balance || 0;
  const homeEquity = homeValue - totalMortgageDebt;
  const totalOtherDebt = otherDebt.data.reduce((s,d)=>s+(d.balance||0),0);
  const netWorth = totalRetirement + totalCollege + homeValue - totalMortgageDebt - totalOtherDebt;
  const totalAssets = totalRetirement + totalCollege + homeValue;
  const totalLiabilities = totalMortgageDebt + totalOtherDebt;

  const retStale = accounts.data.length>0 ? staleness(accounts.data.sort((a,b)=>new Date(a.last_updated)-new Date(b.last_updated))[0]?.last_updated) : {stale:false};
  const collegeStale = collegeS ? staleness(collegeS.last_updated) : {stale:false};
  const mortStale = mort ? staleness(mort.last_updated) : {stale:false};

  async function saveAccount(){
    if(!form.name||!form.balance) return;
    try{
      const row={name:form.name,account_type:form.account_type||"other",balance:+form.balance,monthly_contribution:+form.monthly_contribution||0,employer_match:+form.employer_match||0,contribution_frequency:form.contribution_frequency||"monthly",tax_treatment:form.tax_treatment||"pre-tax",last_updated:form.last_updated||TODAY_STR,notes:form.notes||""};
      if(editItem) await accounts.update(editItem.id,row); else await accounts.insert(row);
    }catch(e){console.error("saveAccount failed",e);}
    closeModal();
  }
  async function saveAssumptions(){
    try{
      const row={current_age:+form.current_age||0,retirement_age:+form.retirement_age||0,annual_return_pct:+form.annual_return_pct||0,withdrawal_rate_pct:+form.withdrawal_rate_pct||0,annual_retirement_spending:+form.annual_retirement_spending||0,social_security_estimate:+form.social_security_estimate||0,social_security_estimate_spouse:+form.social_security_estimate_spouse||0,ss_claim_age_spouse:+form.ss_claim_age_spouse||67,healthcare_estimate:+form.healthcare_estimate||0,contribution_increase_pct:+form.contribution_increase_pct||0,bridge_end_age:+form.medicare_age||65,medicare_age:+form.medicare_age||65,ss_claim_age:+form.ss_claim_age||67,plan_end_age:+form.plan_end_age||90,inflation_pct:+form.inflation_pct||3,conservative_rate_pct:+form.conservative_rate_pct||5,moderate_rate_pct:+form.moderate_rate_pct||7,aggressive_rate_pct:+form.aggressive_rate_pct||9,drawdown_rate_pct:+form.drawdown_rate_pct||5,return_volatility_pct:+form.return_volatility_pct||15};
      if(assump && assump.id) await assumptions.update(assump.id,row); else await assumptions.insert(row);
    }catch(e){console.error("saveAssumptions failed",e);}
    closeModal();
  }
  async function saveCollegeSavings(){
    try{
      const row={balance:+form.balance||0,monthly_contribution:+form.monthly_contribution||0,last_updated:form.last_updated||TODAY_STR,notes:form.notes||""};
      if(collegeS && collegeS.id) await collegeSav.update(collegeS.id,row); else await collegeSav.insert(row);
    }catch(e){console.error("saveCollegeSavings failed",e);}
    closeModal();
  }
  async function saveMortgage(){
    try{
      const row={current_balance:+form.current_balance||0,interest_rate:+form.interest_rate||0,monthly_payment:+form.monthly_payment||0,term_years:+form.term_years||30,start_date:form.start_date||"",extra_payment_monthly:+form.extra_payment_monthly||0,home_value:+form.home_value||0,last_updated:form.last_updated||TODAY_STR};
      if(mort && mort.id) await mortgage.update(mort.id,row); else await mortgage.insert(row);
    }catch(e){console.error("saveMortgage failed",e);}
    closeModal();
  }
  async function saveDebt(){
    if(!form.name||!form.balance) return;
    try{
      const row={name:form.name,balance:+form.balance,interest_rate:+form.interest_rate||0,payment_amount:+form.payment_amount||0,payment_frequency:form.payment_frequency||"monthly",extra_payment:+form.extra_payment||0,last_updated:form.last_updated||TODAY_STR,notes:form.notes||""};
      if(editItem) await otherDebt.update(editItem.id,row); else await otherDebt.insert(row);
    }catch(e){console.error("saveDebt failed",e);}
    closeModal();
  }
  async function saveSnapshot(){
    try{
      const row={date:form.date||TODAY_STR,total_assets:totalAssets,total_liabilities:totalLiabilities,net_worth:netWorth,notes:form.notes||""};
      await snapshots.insert(row);
    }catch(e){console.error("saveSnapshot failed",e);}
    closeModal();
  }
  async function saveActionItem(){
    if(!form.title) return;
    try{
      const row={title:form.title,category:form.category||"other",priority:form.priority||"med",completed:false,created_date:TODAY_STR};
      await actionItems.insert(row);
    }catch(e){console.error("saveActionItem failed",e);}
    closeModal();
  }

  const accountTypeColors={"403b":COLORS.blue,"401k":COLORS.blue,IRA:COLORS.purple,HSA:COLORS.green,brokerage:COLORS.amber,cash:COLORS.slate,other:COLORS.slate};
  const priorityColors={high:COLORS.red,med:COLORS.amber,low:COLORS.slate};

  return(
    <div style={S.screen}>
      <div style={{...S.card,background:COLORS.navyLight,borderLeft:`3px solid ${COLORS.green}`,marginBottom:16}}>
        <div style={{fontSize:15,color:COLORS.green,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase"}}>Net Worth</div>
        <div style={{fontSize:30,fontWeight:800,marginTop:2}}>{formatMoney(netWorth)}</div>
        <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>{formatMoney(totalAssets)} assets   {formatMoney(totalLiabilities)} liabilities</div>
      </div>

      <div style={S.tabs}>
        {["summary","retire","college","debt","timeline"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab==="summary"&&<> <div style={{background:COLORS.navyMid,borderRadius:16,padding:"20px 18px",marginBottom:12,borderLeft:`4px solid ${retProj?retProj.statusColor:COLORS.slate}`}}>
          <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>Net Worth</div>
          <div style={{fontSize:34,fontWeight:800,letterSpacing:"-1px",marginBottom:2}}>{formatMoneyShort(netWorth)}</div>
          <div style={{fontSize:13,color:COLORS.slate,marginBottom:14}}>{formatMoney(totalAssets)} assets - {formatMoney(totalLiabilities)} liabilities</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:COLORS.navyLight,borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>Retirement</div>
              <div style={{fontSize:18,fontWeight:800,color:retProj?retProj.statusColor:COLORS.white}}>{retProj?formatMoneyShort(retProj.totalBalance):"--"}</div>
              <div style={{fontSize:11,color:COLORS.slate,marginTop:2}}>{retProj?`Age ${assump.retirement_age} target - ${retProj.gap>0?formatMoneyShort(retProj.gap)+" gap":"on track"}`:"Add accounts"}</div>
            </div>
            <div style={{background:COLORS.navyLight,borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>College 529</div>
              <div style={{fontSize:18,fontWeight:800,color:pooledCollegeProj?(pooledCollegeProj.anyShortfall?COLORS.amber:COLORS.green):COLORS.white}}>{formatMoneyShort(totalCollege)}</div>
              <div style={{fontSize:11,color:COLORS.slate,marginTop:2}}>{pooledCollegeProj?(pooledCollegeProj.anyShortfall?`+${formatMoney(pooledCollegeProj.suggestedMonthly-pooledCollegeProj.currentContribution)}/mo needed`:"On track"):"Add goals"}</div>
            </div>
            <div style={{background:COLORS.navyLight,borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>Home Equity</div>
              <div style={{fontSize:18,fontWeight:800,color:COLORS.blue}}>{formatMoneyShort(homeEquity)}</div>
              <div style={{fontSize:11,color:COLORS.slate,marginTop:2}}>{mort?`${formatMoneyShort(mort.current_balance)} remaining`:"No mortgage"}</div>
            </div>
            <div style={{background:COLORS.navyLight,borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>Other Debt</div>
              <div style={{fontSize:18,fontWeight:800,color:totalOtherDebt>0?COLORS.red:COLORS.green}}>{totalOtherDebt>0?formatMoneyShort(totalOtherDebt):"Clear"}</div>
              <div style={{fontSize:11,color:COLORS.slate,marginTop:2}}>{otherDebt.data.length>0?otherDebt.data[0].name:"No other debt"}</div>
            </div>
          </div>
        </div> {(retStale.stale||collegeStale.stale||mortStale.stale)&&(
          <div style={{background:COLORS.amber+"11",border:`1px solid ${COLORS.amber}33`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,color:COLORS.amber,fontWeight:700,flexShrink:0}}>Stale data:</div>
            <div style={{fontSize:12,color:COLORS.slateLight}}>
              {[retStale.stale&&`Retirement (${retStale.days||"?"}d)`,collegeStale.stale&&`College (${collegeStale.days||"?"}d)`,mortStale.stale&&`Mortgage (${mortStale.days||"?"}d)`].filter(Boolean).join(", ")}
            </div>
          </div>
        )} {retProj&&(
          <div style={{background:COLORS.navyMid,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Monthly Contributions</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:13,color:COLORS.slateLight}}>Retirement</div>
              <div style={{fontSize:14,fontWeight:700}}>{formatMoney(retProj.totalMonthly)}/mo</div>
            </div>
            {collegeS&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:13,color:COLORS.slateLight}}>College 529</div>
              <div style={{fontSize:14,fontWeight:700}}>{formatMoney(collegeS.monthly_contribution)}/mo</div>
            </div>}
            {mort&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:13,color:COLORS.slateLight}}>Mortgage</div>
              <div style={{fontSize:14,fontWeight:700,color:COLORS.red}}>{formatMoney(mort.monthly_payment+(mort.extra_payment_monthly||0))}/mo</div>
            </div>}
            {retProj.gap>0&&(
              <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,color:COLORS.amber}}>To close retirement gap</div>
                <div style={{fontSize:14,fontWeight:700,color:COLORS.amber}}>+{formatMoney(retProj.monthlyNeeded)}/mo</div>
              </div>
            )}
          </div>
        )} {actionItems.data.filter(a=>!a.completed).length>0&&(
          <div style={{background:COLORS.navyMid,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Action Items</div>
            {actionItems.data.filter(a=>!a.completed).map(a=>(
              <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${COLORS.navyLight}`}}>
                <div style={{flex:1,paddingRight:10}}>
                  <div style={{fontSize:13,fontWeight:600,color:COLORS.white}}>{a.title}</div>
                  <div style={{fontSize:11,color:priorityColors[a.priority]||COLORS.slate,marginTop:2,textTransform:"uppercase",letterSpacing:"0.5px"}}>{a.priority}</div>
                </div>
                <button style={S.btnCheck} onClick={()=>actionItems.update(a.id,{completed:true})}>v</button>
              </div>
            ))}
            <button style={{...S.btnSm,width:"100%",marginTop:10,fontSize:12}} onClick={()=>{setForm({priority:"med",category:"other"});setShowModal("action");}}>+ Add Action Item</button>
          </div>
        )}
        {!actionItems.data.filter(a=>!a.completed).length&&(
          <button style={{...S.btnSm,width:"100%",marginTop:4,marginBottom:12,fontSize:12}} onClick={()=>{setForm({priority:"med",category:"other"});setShowModal("action");}}>+ Add Action Item</button>
        )} {snapshots.data.length>0&&(
          <div style={{background:COLORS.navyMid,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Net Worth History</div>
            {snapshots.data.slice(0,4).map((s,i)=>(
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<Math.min(snapshots.data.length,4)-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                <div style={{fontSize:12,color:COLORS.slate}}>{formatDate(s.date)}</div>
                <div style={{fontSize:14,fontWeight:700}}>{formatMoneyShort(s.net_worth)}</div>
              </div>
            ))}
            <button style={{...S.btnSm,width:"100%",marginTop:10,fontSize:12}} onClick={()=>{setForm({date:TODAY_STR});setShowModal("snapshot");}}>+ Save Snapshot</button>
          </div>
        )}
        {!snapshots.data.length&&(
          <button style={{...S.btnSm,width:"100%",marginBottom:12,fontSize:12}} onClick={()=>{setForm({date:TODAY_STR});setShowModal("snapshot");}}>Save Net Worth Snapshot</button>
        )}
      </>}
      {tab==="retire"&&<>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={()=>{setForm({...assump});setShowModal("assumptions");}} style={{background:COLORS.navyLight,border:`1px solid ${COLORS.navyLight}`,borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:700,color:COLORS.slateLight,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
               Edit Assumptions
          </button>
        </div>
        {retProj&&<>
          <div style={{...S.card,background:retProj.statusColor+"18",borderColor:retProj.statusColor+"44",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:retProj.statusColor,flexShrink:0}}/>
                  <div style={{fontSize:20,fontWeight:800,color:retProj.statusColor,letterSpacing:"-0.3px"}}>{retProj.statusLabel}</div>
                </div>
                <div style={{fontSize:13,color:COLORS.slate,lineHeight:1.5}}>{retProj.statusDetail}</div>
                {retProj.drawdown.lastsFullPlan&&<div style={{fontSize:12,color:COLORS.slate,marginTop:4}}>~{formatMoneyShort(retProj.drawdown.finalBalance)} expected at age {retProj.drawdown.planEndAge||90}</div>}
                <div style={{fontSize:11,color:COLORS.slate,marginTop:6,fontStyle:"italic"}}>Steady {assump.drawdown_rate_pct||5}% return   see Simulations below for realistic range</div>
              </div>
            </div>
            {retProj.quickRecs.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${retProj.statusColor}33`}}>
              {retProj.quickRecs.map((rec,i)=><div key={i} style={{fontSize:13,color:COLORS.slateLight,lineHeight:1.5,marginBottom:i<retProj.quickRecs.length-1?4:0}}>  {rec}</div>)}
            </div>}
            {monteCarloResults&&(()=>{
              const cur=monteCarloResults.find(r=>r.label==="Current Plan");
              if(!cur)return null;
              return(<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${retProj.statusColor}33`}}>
                <span style={{fontSize:14,color:COLORS.slateLight}}>  Realistic success rate: </span>
                <strong style={{color:cur.successRate>=85?COLORS.green:cur.successRate>=70?COLORS.amber:COLORS.red,fontSize:15}}>{cur.successRate}%</strong>
              </div>);
            })()}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{...S.card,flex:1,marginBottom:0,textAlign:"center",padding:"14px 8px"}}>
              <div style={{fontSize:11,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700}}>Balance</div>
              <div style={{fontSize:20,fontWeight:800,marginTop:6,letterSpacing:"-0.3px"}}>{formatMoneyShort(retProj.totalBalance)}</div>
            </div>
            <div style={{...S.card,flex:1,marginBottom:0,textAlign:"center",padding:"14px 8px"}}>
              <div style={{fontSize:11,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700}}>Monthly</div>
              <div style={{fontSize:20,fontWeight:800,marginTop:6,letterSpacing:"-0.3px"}}>{formatMoney(retProj.totalMonthly)}</div>
            </div>
            <div style={{...S.card,flex:1,marginBottom:0,textAlign:"center",padding:"14px 8px"}}>
              <div style={{fontSize:11,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700}}>Gap</div>
              <div style={{fontSize:20,fontWeight:800,marginTop:6,letterSpacing:"-0.3px",color:retProj.gap>0?COLORS.amber:COLORS.green}}>{retProj.gap>0?formatMoneyShort(retProj.gap):" "}</div>
            </div>
          </div>
          <button onClick={()=>setShowRetBrief(true)} style={{width:"100%",background:COLORS.purple,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:12}}>  Retirement Brief</button>
          {[
            {key:"analysis",icon:" ",label:"Projection & Readiness",open:showAnalysis,toggle:()=>setShowAnalysis(p=>!p)},
            {key:"bridge",icon:" ",label:`Bridge Years (age ${assump.retirement_age} ${retProj.drawdown.medicareAge})`,open:showBridgeMath,toggle:()=>setShowBridgeMath(p=>!p),badge:retProj.drawdown.bridgeShortfall>0?"   Short":"  Covered",badgeColor:retProj.drawdown.bridgeShortfall>0?COLORS.red:COLORS.green},
            {key:"sims",icon:" ",label:"Simulations",open:showBridgeTable,toggle:()=>setShowBridgeTable(p=>!p),badge:monteCarloResults?`${monteCarloResults.find(r=>r.label==="Current Plan")?.successRate??"-"}% success`:null,badgeColor:monteCarloResults?(monteCarloResults.find(r=>r.label==="Current Plan")?.successRate>=85?COLORS.green:COLORS.amber):COLORS.slate},
            {key:"accounts",icon:" ",label:`Accounts (${accounts.data.length})`,open:showTimeline,toggle:()=>setShowTimeline(p=>!p)},
          ].map(section=>(
            <div key={section.key} style={{...S.card,marginBottom:10}}>
              <button onClick={section.toggle} style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center",WebkitTapHighlightColor:"transparent"}}>
                <div style={{fontSize:14,fontWeight:700,color:COLORS.white}}>{section.icon} {section.label}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  {section.badge&&<span style={{...S.badge(section.badgeColor),fontSize:11}}>{section.badge}</span>}
                  <span style={{fontSize:13,color:COLORS.blue}}>{section.open?" ":" "}</span>
                </div>
              </button>
              {section.key==="analysis"&&section.open&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${COLORS.navyLight}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:13,color:COLORS.slate}}>At age {assump.retirement_age} ({retProj.years}y away)</div>
                  <Sparkline data={retProj.trajectory.map(t=>t.balance)} color={COLORS.blue}/>
                </div>
                {retProj.scenarios.map(s=>(
                  <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${COLORS.navyLight}`}}>
                    <div style={{fontSize:13,color:COLORS.slateLight}}>{s.label} ({s.rate}%)</div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:700,color:s.color}}>{formatMoneyShort(s.projectedTodaysDollars)}</div>
                      <div style={{fontSize:11,color:COLORS.slate}}>{formatMoneyShort(s.projected)} future $</div>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`}}>
                  <div style={{fontSize:13,color:COLORS.slate}}>Target (today's $): <strong style={{color:COLORS.white}}>{formatMoneyShort(retProj.targetNumberToday)}</strong></div>
                  <div style={{fontSize:13,color:COLORS.slate,marginTop:3}}>Spendable after tax: <strong style={{color:COLORS.white}}>{formatMoneyShort(retProj.spendableTodaysDollars)}</strong></div>
                  <div style={{fontSize:13,color:retProj.gap>0?COLORS.amber:COLORS.green,marginTop:8,fontWeight:600}}>
                    {retProj.gap>0?`Gap: ${formatMoneyShort(retProj.gap)}   +${formatMoney(retProj.monthlyNeeded)}/mo needed`:`Surplus: ${formatMoneyShort(-retProj.gap)}`}
                  </div>
                </div>
                {readinessChecklist.length>0&&<>
                  <div style={{fontSize:11,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:14,marginBottom:8}}>Readiness Checklist</div>
                  {readinessChecklist.map((item,i)=>{
                    const icon=item.status==="good"?" ":item.status==="watch"?"  ":" ";
                    const col=item.status==="good"?COLORS.green:item.status==="watch"?COLORS.amber:COLORS.red;
                    return(<div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:i<readinessChecklist.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                      <span style={{fontSize:13,flexShrink:0}}>{icon}</span>
                      <div><div style={{fontSize:13,fontWeight:700,color:col}}>{item.label}</div><div style={{fontSize:12,color:COLORS.slate,marginTop:1,lineHeight:1.4}}>{item.detail}</div></div>
                    </div>);
                  })}
                </>}
                {incomeTimeline.length>0&&<>
                  <div style={{fontSize:11,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:14,marginBottom:8}}>Income by Phase</div>
                  {incomeTimeline.map((band,i)=>(
                    <div key={i} style={{padding:"8px 0",borderBottom:i<incomeTimeline.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{fontSize:13,fontWeight:700,color:band.color}}>Ages {band.ageRange}</div>
                        {band.avgAnnual&&<div style={{fontSize:12,color:COLORS.slateLight}}>{formatMoneyShort(band.avgAnnual)}/yr</div>}
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:4}}>
                        {band.sources.map(src=><span key={src} style={S.badge(band.color)}>{src}</span>)}
                      </div>
                      <div style={{fontSize:11,color:COLORS.slate,lineHeight:1.4}}>{band.detail}</div>
                    </div>
                  ))}
                </>}
              </div>}
              {section.key==="bridge"&&section.open&&(()=>{
                const d=retProj.drawdown;
                const bridgeOk=d.bridgeShortfall<=0;
                const r55Pct=Math.round(retProj.ruleOf55Share*100);
                return(<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${COLORS.navyLight}`}}>
                  <div style={{fontSize:12,color:COLORS.slateLight,lineHeight:1.6,marginBottom:10}}>
                    <strong style={{color:COLORS.white}}>Rule of 55:</strong> Penalty-free from current employer's 403(b)/401(k) at separation age 55+. ~{r55Pct}% of your balance ({formatMoneyShort(retProj.ruleOf55Balance)}) qualifies.
                  </div>
                  {d.bridgeSchedule&&d.bridgeSchedule.length>0&&<>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginBottom:6}}>
                      {["Age","Need","R55","Total"].map(h=><div key={h} style={{fontSize:10,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",textAlign:"right",paddingRight:4}}>{h}</div>)}
                    </div>
                    {d.bridgeSchedule.map((row,i)=>(
                      <div key={row.age} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,padding:"4px 0",borderBottom:i<d.bridgeSchedule.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                        <div style={{fontSize:11,fontWeight:600}}>Age {row.age}</div>
                        <div style={{fontSize:11,color:COLORS.slate,textAlign:"right",paddingRight:4}}>{formatMoneyShort(row.needYear)}</div>
                        <div style={{fontSize:11,color:row.ruleOf55Pool<row.needYear?COLORS.red:COLORS.slate,textAlign:"right",paddingRight:4}}>{formatMoneyShort(row.ruleOf55Pool)}</div>
                        <div style={{fontSize:11,fontWeight:600,color:row.balance>0?COLORS.white:COLORS.red,textAlign:"right",paddingRight:4}}>{formatMoneyShort(row.balance)}</div>
                      </div>
                    ))}
                  </>}
                  <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`}}>
                    {bridgeOk
                      ?<div style={{fontSize:12,color:COLORS.green,fontWeight:600}}>  Rule of 55 funds cover the bridge. No IRA early withdrawal penalty needed.</div>
                      :<div style={{fontSize:12,color:COLORS.red,fontWeight:600}}>   Bridge short ~{formatMoneyShort(d.bridgeShortfall)}   IRA early withdrawal or taxable savings needed.</div>
                    }
                  </div>
                </div>);
              })()}
              {section.key==="sims"&&section.open&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${COLORS.navyLight}`}}>
                <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Probability of Success</div>
                {!monteCarloResults&&!monteCarloRunning&&<button onClick={runMonteCarlo} style={{...S.btn,background:COLORS.purple,marginTop:0,marginBottom:12,fontSize:14}}>Run Monte Carlo (1,000 paths)</button>}
                {monteCarloRunning&&<div style={{textAlign:"center",padding:"14px 0",color:COLORS.slate,fontSize:13,marginBottom:12}}>Running simulations </div>}
                {monteCarloResults&&!monteCarloRunning&&<>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
                    {monteCarloResults.map(r=>{
                      const col=r.successRate>=85?COLORS.green:r.successRate>=70?COLORS.amber:COLORS.red;
                      return(<div key={r.label} style={{background:COLORS.navyLight,borderRadius:10,padding:"12px",textAlign:"center"}}>
                        <div style={{fontSize:11,color:COLORS.slate,marginBottom:4,fontWeight:600}}>{r.label}</div>
                        <div style={{fontSize:22,fontWeight:800,color:col}}>{r.successRate}%</div>
                        <div style={{fontSize:10,color:COLORS.slate,marginTop:2}}>Age {r.retirementAge}</div>
                        {r.medianFinalBalance>0&&<div style={{fontSize:11,color:COLORS.slate,marginTop:2}}>{formatMoneyShort(r.medianFinalBalance)} median</div>}
                      </div>);
                    })}
                  </div>
                  <button onClick={runMonteCarlo} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:14}}>  Re-run</button>
                </>}
                <div style={{borderTop:`1px solid ${COLORS.navyLight}`,paddingTop:14,marginBottom:14}}>
                  <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Spending Sensitivity</div>
                  {!spendingResults&&!spendingRunning&&<button onClick={runSpendingSensitivity} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:10}}>Run Spending Analysis</button>}
                  {spendingRunning&&<div style={{textAlign:"center",padding:"10px 0",color:COLORS.slate,fontSize:13}}>Running </div>}
                  {spendingResults&&!spendingRunning&&spendingResults.map(r=>(
                    <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",borderRadius:6,marginBottom:2,background:r.isCurrent?COLORS.navyLight:"transparent"}}>
                      <div style={{fontSize:13,fontWeight:r.isCurrent?700:400,color:r.isCurrent?COLORS.white:COLORS.slateLight}}>{r.label}{r.isCurrent?"  ":""}</div>
                      <div style={{fontSize:13,fontWeight:700,color:r.successRate>=85?COLORS.green:r.successRate>=70?COLORS.amber:COLORS.red}}>{r.successRate}%</div>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:`1px solid ${COLORS.navyLight}`,paddingTop:14}}>
                  <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Contribution Impact</div>
                  {!contribResults&&!contribRunning&&<button onClick={runContribImpact} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:10}}>Run Contribution Analysis</button>}
                  {contribRunning&&<div style={{textAlign:"center",padding:"10px 0",color:COLORS.slate,fontSize:13}}>Running </div>}
                  {contribResults&&!contribRunning&&contribResults.map(r=>(
                    <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 8px",borderRadius:6,marginBottom:2,background:r.isCurrent?COLORS.navyLight:"transparent"}}>
                      <div style={{fontSize:13,fontWeight:r.isCurrent?700:400,color:r.isCurrent?COLORS.white:COLORS.slateLight}}>{r.label}{r.isCurrent?"  ":""}</div>
                      <div style={{fontSize:13,fontWeight:700,color:r.successRate>=85?COLORS.green:r.successRate>=70?COLORS.amber:COLORS.red}}>{r.successRate}%</div>
                    </div>
                  ))}
                </div>
              </div>}
              {section.key==="accounts"&&section.open&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${COLORS.navyLight}`}}>
                {accounts.data.map(a=>(
                  <SwipeCard key={a.id} id={a.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                    onEdit={()=>openEdit("account",a)}
                    onDelete={()=>{accounts.remove(a.id);setActiveSwipe(null);}}
                    style={{...S.card,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700}}>{a.name}</div>
                        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                          <span style={S.badge(COLORS.blue)}>{a.account_type}</span>
                          <span style={S.badge(a.tax_treatment==="Roth"?COLORS.green:COLORS.amber)}>{a.tax_treatment}</span>
                          {ruleOf55Eligible(a)&&<span style={S.badge(COLORS.purple)}>Rule of 55</span>}
                        </div>
                        <div style={{fontSize:12,color:COLORS.slate,marginTop:6}}>{formatMoney(a.monthly_contribution)}/mo{a.employer_match>0?` + ${formatMoney(a.employer_match)} match`:""}</div>
                      </div>
                      <div style={{fontSize:18,fontWeight:700,textAlign:"right",flexShrink:0,marginLeft:12}}>{formatMoneyShort(a.balance)}</div>
                    </div>
                  </SwipeCard>
                ))}
                {accounts.data.length===0&&<EmptyState icon=" " title="No accounts" detail="Add your 401(k), IRA, and other retirement accounts."/>}
                <button style={{...S.btn,marginTop:4}} onClick={()=>{setForm({account_type:"401k",tax_treatment:"pre-tax",contribution_frequency:"biweekly"});setShowModal("account");}}>+ Add Account</button>
              </div>}
            </div>
          ))}
        </>}
        {showRetBrief&&<RetirementBrief accounts={accounts.data} assumptions={assump} retProj={retProj} monteCarloResults={monteCarloResults} onClose={()=>setShowRetBrief(false)}/>}
      </>}

      {tab==="college"&&<>
        {collegeS&&(
          <div style={{...S.card,background:COLORS.navyLight,marginBottom:12}}>
            <div style={{fontSize:15,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10}}>Shared 529 Plan</div>
            <div style={{fontSize:28,fontWeight:800}}>{formatMoneyShort(collegeS.balance)}</div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{formatMoney(collegeS.monthly_contribution)}/mo combined contribution</div>
          </div>
        )}
        {pooledCollegeProj&&(
          <div style={{...S.card,background:COLORS.navyLight,marginBottom:12}}>
            <div style={{fontSize:15,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10}}>Funding Sequence   one pool, three kids</div>
            {pooledCollegeProj.perChild.map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 0",borderBottom:i<pooledCollegeProj.perChild.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700}}>{c.child_name}   {c.target_year}</div>
                  <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Pool at start: {formatMoneyShort(c.poolBalanceAtStart)}   Needs {formatMoneyShort(c.target_amount)}</div>
                </div>
                <span style={S.badge(c.fullyFunded?COLORS.green:COLORS.red)}>{c.fullyFunded?"funded":`short ${formatMoneyShort(c.shortfall)}`}</span>
              </div>
            ))}
            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`}}>
              {pooledCollegeProj.anyShortfall
                ?<div style={{fontSize:15,color:COLORS.amber,fontWeight:600}}>   Increase to ~{formatMoney(pooledCollegeProj.suggestedMonthly)}/mo to fund all three.</div>
                :<div style={{fontSize:15,color:COLORS.green,fontWeight:600}}>  Current contribution funds all three kids in sequence.</div>
              }
            </div>
          </div>
        )}
        <div style={S.sectionLabel}>Per-Child Goals</div>
        <SwipeHint/>
        {collegeGoal.data.map(g=>(
          <SwipeCard key={g.id} id={g.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
            onEdit={()=>{setEditItem(g);setForm({...g});setShowModal("college-goal-child");}}
            onDelete={()=>{collegeGoal.remove(g.id);setActiveSwipe(null);}}
            style={{...S.card,borderLeft:`3px solid ${{Aubrey:COLORS.red,Blake:COLORS.green,Brayden:COLORS.amber}[g.child_name]||COLORS.slate}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:15,fontWeight:600}}>{g.child_name}</div>
                <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{g.target_year}   {formatMoneyShort(g.target_amount)} target</div>
              </div>
            </div>
            {g.notes&&<div style={{fontSize:15,color:COLORS.slateLight,marginTop:10,fontStyle:"italic"}}>{g.notes}</div>}
          </SwipeCard>
        ))}
        <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>{setForm({...collegeS,last_updated:TODAY_STR});setShowModal("college-savings");}}>Update Pool Balance</button>
      </>}

      {tab==="debt"&&<>
        {mort&&(
          <div style={{...S.card,background:COLORS.navyLight,marginBottom:12}}>
            <div style={{fontSize:15,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10}}>Mortgage</div>
            <div style={{fontSize:26,fontWeight:800}}>{formatMoney(mort.current_balance)}</div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{mort.interest_rate}%   {formatMoney(mort.monthly_payment)}/mo{mort.extra_payment_monthly>0?` + ${formatMoney(mort.extra_payment_monthly)} extra`:""}</div>
            {mortMonths&&<div style={{fontSize:15,color:COLORS.green,marginTop:10,fontWeight:600}}>Payoff: {monthsToDate(mortMonths)} ({mortMonths} months)</div>}
            {interestSaved>0&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Extra payments save ~{formatMoney(interestSaved)} in interest</div>}
            {homeValue>0&&(
              <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`,display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:15,color:COLORS.slate}}>Home value {formatMoney(homeValue)}</div>
                <div style={{fontSize:15,fontWeight:700,color:COLORS.green}}>{formatMoney(homeEquity)} equity</div>
              </div>
            )}
            <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>{setForm({...mort,last_updated:TODAY_STR});setShowModal("mortgage");}}>Update Mortgage</button>
          </div>
        )}
        <div style={S.sectionLabel}>Other Debt</div>
        <SwipeHint/>
        {otherDebt.data.map(d=>{
          const months = calcPayoffMonths(d.balance, d.interest_rate, d.payment_frequency==="biweekly"?d.payment_amount*2.17:d.payment_amount);
          return(
            <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEdit("debt",d)} onDelete={()=>{otherDebt.remove(d.id);setActiveSwipe(null);}}
              style={S.statusCard(COLORS.red)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600}}>{d.name}</div>
                  <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.interest_rate}%   {formatMoney(d.payment_amount)} {d.payment_frequency}</div>
                  {months&&<div style={{fontSize:15,color:COLORS.amber,marginTop:2,fontWeight:600}}>Payoff: {monthsToDate(months)}</div>}
                  {d.notes&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2,fontStyle:"italic"}}>{d.notes}</div>}
                </div>
                <div style={{fontSize:19,fontWeight:700,color:COLORS.red}}>{formatMoney(d.balance)}</div>
              </div>
            </SwipeCard>
          );
        })}
        <button style={S.btn} onClick={()=>{setForm({payment_frequency:"monthly",last_updated:TODAY_STR});setShowModal("debt");}}>+ Add Debt</button>
      </>}

      {tab==="timeline"&&<>
        <div style={{fontSize:15,color:COLORS.slate,marginBottom:16,lineHeight:1.5}}>Every dated milestone tracked across Finance and College, in one timeline.</div>
        {familyMilestones.length===0&&<EmptyState icon="  " title="No milestones yet" detail="Add college goals, a mortgage, and retirement assumptions to see your family timeline here."/>}
        {familyMilestones.map((m,i)=>{
          const yearsAway = m.year - new Date().getFullYear();
          const isCollege = m.label.includes("starts college");
          const goalRecord = isCollege ? collegeGoal.data.find(g=>m.label.startsWith(g.child_name)) : null;
          return(
            <div key={i} style={{display:"flex",gap:12,marginBottom:i<familyMilestones.length-1?4:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:24,flexShrink:0}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:m.color,flexShrink:0,marginTop:10}}/>
                {i<familyMilestones.length-1&&<div style={{width:2,flex:1,background:COLORS.navyLight,marginTop:10}}/>}
              </div>
              <div style={{...S.card,flex:1,borderLeft:`3px solid ${m.color}`,cursor:goalRecord?"pointer":"default",opacity:yearsAway<0?0.5:yearsAway>10?0.7:1}}
                onClick={()=>{ if(goalRecord){ setEditItem(goalRecord); setForm({...goalRecord}); setShowModal("college-goal-child"); } }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:12}}>
                    <div style={{fontSize:15,fontWeight:700,letterSpacing:"-0.2px"}}>{m.icon} {m.label}</div>
                    <div style={{fontSize:13,color:COLORS.slate,marginTop:4,lineHeight:1.4}}>{m.detail}</div>
                    <div style={{fontSize:12,color:m.color,marginTop:6,fontWeight:700,letterSpacing:"0.2px",textTransform:"uppercase"}}>
                      {yearsAway<0?`${-yearsAway}y ago`:yearsAway===0?"this year":`in ${yearsAway}y`}
                    </div>
                  </div>
                  <div style={{fontSize:22,fontWeight:800,color:m.color,flexShrink:0,letterSpacing:"-0.5px"}}>{m.year}</div>
                </div>
              </div>
            </div>
          );
        })}
      </>}

      {showModal==="college-goal-child"&&<Modal title={`Edit ${editItem?.child_name}'s College Goal`} onClose={closeModal}>
        <label style={S.label}>Target Start Year</label>
        <input type="number" style={S.input} value={form.target_year||""} onChange={e=>setForm(p=>({...p,target_year:e.target.value}))}/>
        <label style={S.label}>Target Savings Amount</label>
        <input type="number" style={S.input} value={form.target_amount||""} onChange={e=>setForm(p=>({...p,target_amount:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={async()=>{
          try{ const row={child_name:editItem.child_name,target_amount:+form.target_amount||0,target_year:+form.target_year||new Date().getFullYear(),notes:form.notes||""}; await collegeGoal.update(editItem.id,row); }
          catch(e){console.error("save child goal failed",e);}
          closeModal();
        }}>Save Changes</button>
      </Modal>}
      {showModal==="account"&&<Modal title={editItem?"Edit Account":"Add Account"} onClose={closeModal}>
        <label style={S.label}>Account Name</label>
        <input style={S.input} placeholder="e.g. Matt 403(b)" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
        <label style={S.label}>Account Type</label>
        <div>{["403b","401k","IRA","HSA","brokerage","cash","other"].map(t=><span key={t} style={S.chip(form.account_type===t,accountTypeColors[t]||COLORS.slate)} onClick={()=>setForm(p=>({...p,account_type:t}))}>{t}</span>)}</div>
        <label style={S.label}>Current Balance</label>
        <input type="number" style={S.input} value={form.balance||""} onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <label style={{...S.label,marginBottom:0}}>Contribution Frequency</label>
          <div style={{display:"flex",gap:6}}>
            <span style={S.chip((form.contribution_frequency||"monthly")==="monthly",COLORS.blue)} onClick={()=>setForm(p=>({...p,contribution_frequency:"monthly"}))}>monthly</span>
            <span style={S.chip(form.contribution_frequency==="biweekly",COLORS.purple)} onClick={()=>setForm(p=>({...p,contribution_frequency:"biweekly"}))}>biweekly</span>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>{form.contribution_frequency==="biweekly"?"Per Paycheck":"Monthly"} Contribution</label><input type="number" style={S.input} value={form.monthly_contribution||""} onChange={e=>setForm(p=>({...p,monthly_contribution:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>{form.contribution_frequency==="biweekly"?"Per Paycheck":"Monthly"} Match</label><input type="number" style={S.input} value={form.employer_match||""} onChange={e=>setForm(p=>({...p,employer_match:e.target.value}))}/></div>
        </div>
        {form.contribution_frequency==="biweekly"&&form.monthly_contribution&&(
          <div style={{fontSize:15,color:COLORS.purple,marginTop:-6,marginBottom:10}}>  {formatMoney((+form.monthly_contribution+(+form.employer_match||0))*26/12)}/mo equivalent</div>
        )}
        <label style={S.label}>Tax Treatment</label>
        <div>{["pre-tax","Roth","taxable","HSA"].map(t=><span key={t} style={S.chip(form.tax_treatment===t,COLORS.purple)} onClick={()=>setForm(p=>({...p,tax_treatment:t}))}>{t}</span>)}</div>
        <label style={S.label}>Last Updated</label>
        <input type="date" style={S.input} value={form.last_updated||""} onChange={e=>setForm(p=>({...p,last_updated:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveAccount}>{editItem?"Save Changes":"Add Account"}</button>
      </Modal>}
      {showModal==="assumptions"&&<Modal title="Retirement Assumptions" onClose={closeModal}>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Current Age</label><input type="number" style={S.input} value={form.current_age||""} onChange={e=>setForm(p=>({...p,current_age:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Retirement Age</label><input type="number" style={S.input} value={form.retirement_age||""} onChange={e=>setForm(p=>({...p,retirement_age:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Annual Retirement Spending</label>
        <input type="number" style={S.input} value={form.annual_retirement_spending||""} onChange={e=>setForm(p=>({...p,annual_retirement_spending:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Matt SS (annual)</label><input type="number" style={S.input} value={form.social_security_estimate||""} onChange={e=>setForm(p=>({...p,social_security_estimate:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Matt Claim Age</label><input type="number" style={S.input} placeholder="67" value={form.ss_claim_age||""} onChange={e=>setForm(p=>({...p,ss_claim_age:e.target.value}))}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Kalee SS (annual)</label><input type="number" style={S.input} value={form.social_security_estimate_spouse||""} onChange={e=>setForm(p=>({...p,social_security_estimate_spouse:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Kalee Claim Age</label><input type="number" style={S.input} placeholder="67" value={form.ss_claim_age_spouse||""} onChange={e=>setForm(p=>({...p,ss_claim_age_spouse:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Healthcare Est. (annual)</label>
        <input type="number" style={S.input} value={form.healthcare_estimate||""} onChange={e=>setForm(p=>({...p,healthcare_estimate:e.target.value}))}/>
        <label style={S.label}>Inflation Rate (%)</label>
        <input type="number" step="0.5" style={S.input} placeholder="3" value={form.inflation_pct||""} onChange={e=>setForm(p=>({...p,inflation_pct:e.target.value}))}/>
        <label style={S.label}>Medicare Age</label>
        <input type="number" style={S.input} placeholder="65" value={form.medicare_age||""} onChange={e=>setForm(p=>({...p,medicare_age:e.target.value}))}/>
        <label style={S.label}>Plan Through Age</label>
        <input type="number" style={S.input} placeholder="90" value={form.plan_end_age||""} onChange={e=>setForm(p=>({...p,plan_end_age:e.target.value}))}/>
        <label style={{...S.label,marginTop:14}}>Return Rates (%)</label>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Conservative</label><input type="number" step="0.5" style={S.input} placeholder="5" value={form.conservative_rate_pct||""} onChange={e=>setForm(p=>({...p,conservative_rate_pct:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Moderate</label><input type="number" step="0.5" style={S.input} placeholder="7" value={form.moderate_rate_pct||""} onChange={e=>setForm(p=>({...p,moderate_rate_pct:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Aggressive</label><input type="number" step="0.5" style={S.input} placeholder="9" value={form.aggressive_rate_pct||""} onChange={e=>setForm(p=>({...p,aggressive_rate_pct:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Drawdown Rate (%)</label>
        <input type="number" step="0.5" style={S.input} placeholder="5" value={form.drawdown_rate_pct||""} onChange={e=>setForm(p=>({...p,drawdown_rate_pct:e.target.value}))}/>
        <label style={S.label}>Return Volatility (%   Monte Carlo)</label>
        <input type="number" step="1" style={S.input} placeholder="15" value={form.return_volatility_pct||""} onChange={e=>setForm(p=>({...p,return_volatility_pct:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveAssumptions}>Save Assumptions</button>
      </Modal>}
      {showModal==="college-savings"&&<Modal title="Update 529 Balance" onClose={closeModal}>
        <label style={S.label}>Current Balance</label>
        <input type="number" style={S.input} value={form.balance||""} onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
        <label style={S.label}>Monthly Contribution</label>
        <input type="number" style={S.input} value={form.monthly_contribution||""} onChange={e=>setForm(p=>({...p,monthly_contribution:e.target.value}))}/>
        <label style={S.label}>Last Updated</label>
        <input type="date" style={S.input} value={form.last_updated||""} onChange={e=>setForm(p=>({...p,last_updated:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveCollegeSavings}>Save</button>
      </Modal>}
      {showModal==="mortgage"&&<Modal title="Update Mortgage" onClose={closeModal}>
        <label style={S.label}>Home Value (estimated)</label>
        <input type="number" style={S.input} value={form.home_value||""} onChange={e=>setForm(p=>({...p,home_value:e.target.value}))}/>
        <label style={S.label}>Current Balance</label>
        <input type="number" style={S.input} value={form.current_balance||""} onChange={e=>setForm(p=>({...p,current_balance:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Interest Rate (%)</label><input type="number" step="0.01" style={S.input} value={form.interest_rate||""} onChange={e=>setForm(p=>({...p,interest_rate:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Monthly Payment</label><input type="number" style={S.input} value={form.monthly_payment||""} onChange={e=>setForm(p=>({...p,monthly_payment:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Extra Monthly Payment</label>
        <input type="number" style={S.input} value={form.extra_payment_monthly||""} onChange={e=>setForm(p=>({...p,extra_payment_monthly:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveMortgage}>Save</button>
      </Modal>}
      {showModal==="debt"&&<Modal title={editItem?"Edit Debt":"Add Debt"} onClose={closeModal}>
        <label style={S.label}>Debt Name</label>
        <input style={S.input} placeholder="e.g. Personal Loan" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
        <label style={S.label}>Balance</label>
        <input type="number" style={S.input} value={form.balance||""} onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Interest Rate (%)</label><input type="number" step="0.1" style={S.input} value={form.interest_rate||""} onChange={e=>setForm(p=>({...p,interest_rate:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Payment Amount</label><input type="number" style={S.input} value={form.payment_amount||""} onChange={e=>setForm(p=>({...p,payment_amount:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Payment Frequency</label>
        <div>{["weekly","biweekly","monthly"].map(f=><span key={f} style={S.chip(form.payment_frequency===f,COLORS.blue)} onClick={()=>setForm(p=>({...p,payment_frequency:f}))}>{f}</span>)}</div>
        <button style={{...S.btn,marginTop:16}} onClick={saveDebt}>{editItem?"Save Changes":"Add Debt"}</button>
      </Modal>}
      {showModal==="snapshot"&&<Modal title="Save Net Worth Snapshot" onClose={closeModal}>
        <div style={{fontSize:15,color:COLORS.slateLight,marginBottom:12,lineHeight:1.5}}>Captures: {formatMoney(totalAssets)} assets, {formatMoney(totalLiabilities)} liabilities, {formatMoney(netWorth)} net worth.</div>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="What changed this month?" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveSnapshot}>Save Snapshot</button>
      </Modal>}
      {showModal==="action"&&<Modal title="Add Action Item" onClose={closeModal}>
        <label style={S.label}>Title</label>
        <input style={S.input} placeholder="e.g. Increase 401k contribution" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Category</label>
        <div>{["retirement","college","debt","other"].map(c=><span key={c} style={S.chip(form.category===c,COLORS.blue)} onClick={()=>setForm(p=>({...p,category:c}))}>{c}</span>)}</div>
        <label style={S.label}>Priority</label>
        <div>{["high","med","low"].map(p=><span key={p} style={S.chip(form.priority===p,priorityColors[p])} onClick={()=>setForm(prev=>({...prev,priority:p}))}>{p}</span>)}</div>
        <button style={{...S.btn,marginTop:16}} onClick={saveActionItem}>Add Item</button>
      </Modal>}
    </div>
  );
}

