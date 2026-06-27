import { useState, useEffect } from "react";
import { EmptyState, Loading, Modal, Sparkline, SwipeCard, SwipeHint } from "../../components/common";
import { COLORS, S } from "../../theme";
import { TODAY_STR, daysAgo, daysBetween, formatDate, nextDueDate } from "../../lib/dates";
import { useTable } from "../../hooks/useTable";
import { maintColor, maintStatus, statusColor } from "../../utils/status";
export function poolStatus(param,value){
  if(value===null||value===undefined||isNaN(value))return"grey";
  const ranges={ph:{low:7.2,goodHigh:7.6,high:7.8},free_chlorine:{low:1.5,goodHigh:4.0,high:5.0},salt:{low:3200,goodHigh:3600,high:3800},cya:{low:50,goodHigh:80,high:90},alkalinity:{low:80,goodHigh:120,high:140}};
  const r=ranges[param];if(!r)return"green";
  if(value<r.low||value>r.high)return"red";
  if(value<=r.goodHigh)return"green";return"amber";
}
function calcPoolHealth(last, shockMin, readings) {
  if (!last) return null;
  const fcSafe = last.free_chlorine !== null && last.free_chlorine >= 1.0;
  const phSafe = last.ph === null || (last.ph >= 6.8 && last.ph <= 8.5);
  const ccSafe = last.cc === null || last.cc === undefined || last.cc <= 1.0;
  const safeToSwim = fcSafe && phSafe && ccSafe;
  const phIdeal = last.ph === null || (last.ph >= 7.2 && last.ph <= 7.8);
  const maintenanceNeeded = !phIdeal||(last.cya!==null&&last.cya<50)||(last.salt!==null&&(last.salt<3200||last.salt>3800))||(last.alkalinity!==null&&(last.alkalinity<80||last.alkalinity>140));
  const notSafeReasons=[];
  if(!fcSafe)notSafeReasons.push(last.free_chlorine===null?"FC not tested":`FC too low (${last.free_chlorine} ppm   need  1 ppm)`);
  if(!phSafe)notSafeReasons.push(`pH ${last.ph} is extreme   outside 6.8 8.5`);
  if(!ccSafe)notSafeReasons.push(`CC elevated at ${last.cc} ppm   chloramines present`);
  const maintenanceReasons=[];
  if(last.ph&&last.ph>7.8)maintenanceReasons.push(`pH ${last.ph} elevated   add acid`);
  else if(last.ph&&last.ph<7.2)maintenanceReasons.push(`pH ${last.ph} low   add sodium bicarb`);
  function paramLabel(param,value){
    const s=poolStatus(param,value);
    if(value===null||value===undefined)return{statusLabel:"Not tested",color:COLORS.slate,icon:" ",scoreDeduct:3};
    if(param==="cya"){
      if(value>=60)return{statusLabel:"Good",color:COLORS.green,icon:" ",scoreDeduct:0};
      if(value>=40)return{statusLabel:"Acceptable",color:COLORS.green,icon:" ",scoreDeduct:5};
      if(value>=30)return{statusLabel:"Slightly Low",color:COLORS.amber,icon:" ",scoreDeduct:10};
      return{statusLabel:"Low   add stabilizer",color:COLORS.red,icon:" ",scoreDeduct:30};
    }
    if(param==="ph"){
      if(value>=7.2&&value<=7.8)return{statusLabel:"Good",color:COLORS.green,icon:" ",scoreDeduct:0};
      if((value>7.8&&value<=8.1)||(value>=6.8&&value<7.2))return{statusLabel:value>7.8?"Elevated":"Low",color:COLORS.amber,icon:" ",scoreDeduct:15};
      return{statusLabel:value>8.1?"High":"Low",color:COLORS.red,icon:" ",scoreDeduct:35};
    }
    const labels={green:{statusLabel:"Good",color:COLORS.green,icon:" ",scoreDeduct:0},amber:{statusLabel:param==="free_chlorine"&&value>4.0?"High":param==="salt"&&value<3200?"Low":"Off",color:COLORS.amber,icon:" ",scoreDeduct:15},red:{statusLabel:param==="free_chlorine"&&value<1?"Unsafe":"Action needed",color:COLORS.red,icon:" ",scoreDeduct:40}};
    return labels[s]||{statusLabel:"Check",color:COLORS.slate,icon:" ",scoreDeduct:5};
  }
  function mostRecentValue(key){for(const r of readings){if(r[key]!==null&&r[key]!==undefined)return{value:r[key],date:r.date};}return{value:null,date:null};}
  const cyaRecent=mostRecentValue("cya"),taRecent=mostRecentValue("alkalinity"),calciumRecent=mostRecentValue("calcium_hardness");
  function nextTestInfo(lastDate,intervalDays){
    if(!lastDate)return{dueLabel:"Never tested",overdue:true,urgency:"red"};
    const due=nextDueDate(lastDate,intervalDays),days=daysBetween(due);
    if(days<0)return{dueLabel:`Overdue by ${-days}d`,overdue:true,urgency:"red"};
    if(days<=5)return{dueLabel:`Due in ${days}d`,overdue:false,urgency:"amber"};
    return{dueLabel:`Due ${formatDate(due)}`,overdue:false,urgency:"green"};
  }
  const cyaTestInfo=nextTestInfo(cyaRecent.date,14),taTestInfo=nextTestInfo(taRecent.date,14),calciumTestInfo=nextTestInfo(calciumRecent.date,90);
  const params=[
    {key:"free_chlorine",label:"Free Chlorine",shortLabel:"FC",value:last.free_chlorine,unit:"ppm",target:"4 6 ppm",testInterval:null},
    {key:"ph",label:"pH",shortLabel:"pH",value:last.ph,unit:"",target:"7.2 7.8",testInterval:null},
    {key:"cya",label:"Stabilizer",shortLabel:"CYA",value:cyaRecent.value,unit:"ppm",target:"60 80 ppm",testInterval:14,testedDate:cyaRecent.date,testInfo:cyaTestInfo},
    {key:"salt",label:"Salt",shortLabel:"Salt",value:last.salt,unit:"ppm",target:"3200 3600",testInterval:null},
    {key:"alkalinity",label:"Total Alkalinity",shortLabel:"TA",value:taRecent.value,unit:"ppm",target:"80 120 ppm",testInterval:14,testedDate:taRecent.date,testInfo:taTestInfo},
    {key:"calcium_hardness",label:"Calcium Hardness",shortLabel:"Ca",value:calciumRecent.value,unit:"ppm",target:"150 250 ppm",testInterval:90,testedDate:calciumRecent.date,testInfo:calciumTestInfo},
  ].map(p=>{
    const trend=trendDirection(readings,p.key,p.value);
    const trendArrowChar=trend==="up"?"  ":trend==="down"?"  ":trend==="flat"?"  ":null;
    const lastTested=p.testedDate||lastTestedDate(readings,p.key);
    const lastTestedLabel=p.value!==null&&p.value!==undefined?(p.testInterval?`Tested ${formatDate(lastTested)}`:null):(lastTested?`Last: ${formatDate(lastTested)}`:"Never tested");
    return{...p,...paramLabel(p.key,p.value),trend,trendArrow:trendArrowChar,lastTestedLabel};
  });
  let score=100;params.forEach(p=>{score-=(p.scoreDeduct||0);});score=Math.max(0,Math.min(100,score));
  const anyRed=params.some(p=>p.icon===" "),anyAmber=params.some(p=>p.icon===" ");
  const overallColor=anyRed?COLORS.red:anyAmber?COLORS.amber:COLORS.green;
  // Unified swim status   single signal, no contradiction
  const swimStatus = !safeToSwim ? {label:"Do Not Swim", color:COLORS.red} :
    anyRed ? {label:"Swim OK - Fix Today", color:COLORS.amber} :
    anyAmber ? {label:"Swim OK - Monitor", color:COLORS.amber} :
    {label:"Swim Ready", color:COLORS.green};
  const overallLabel=swimStatus.label;
  const overallEmoji="";
  // Short status-only summary   actions surface in rec cards below
  let summary = "";
  const issues = params.filter(p=>p.color===COLORS.red||p.color===COLORS.amber).map(p=>p.shortLabel||p.label);
  if(!safeToSwim) summary = notSafeReasons[0]||"Check chemistry before swimming.";
  else if(issues.length===0) summary = "All tested parameters in range.";
  else if(issues.length===1) summary = `${issues[0]} needs attention   see action below.`;
  else summary = `${issues.slice(0,-1).join(", ")} and ${issues[issues.length-1]} need attention.`;

  return{safeToSwim,notSafeReasons,maintenanceNeeded,maintenanceReasons,params,overallColor,overallLabel,overallEmoji,score,summary};
}
function lastTestedDate(readings,paramKey){for(const r of readings){if(r[paramKey]!==null&&r[paramKey]!==undefined)return r.date;}return null;}
function nextTestDue(readings,paramKey,intervalDays){const lastDate=lastTestedDate(readings,paramKey);if(!lastDate)return null;const due=nextDueDate(lastDate,intervalDays);return{lastDate,due,days:daysBetween(due)};}
function trendDirection(readings,paramKey,currentValue){if(currentValue===null||currentValue===undefined)return null;for(let i=1;i<readings.length;i++){const v=readings[i][paramKey];if(v!==null&&v!==undefined){if(currentValue>v)return"up";if(currentValue<v)return"down";return"flat";}}return null;}
const POOL_GALLONS=17000,CALCIUM_HARDNESS=200;
function calcAcidDose(currentPH,targetPH=7.4,alkalinity=90,gallons=POOL_GALLONS){if(!currentPH||currentPH<=targetPH)return null;const phDrop=currentPH-targetPH,alkFactor=(alkalinity||90)/100,baseOzPer10k=phDrop*12*alkFactor;return Math.round(baseOzPer10k*(gallons/10000));}
function calcShockThreshold(cya){return Math.round((cya||60)/10);}
function calcFCBurnRate(readings){if(!readings||readings.length<2)return null;const r1=readings[0],r2=readings[1];if(r1.free_chlorine===null||r2.free_chlorine===null)return null;const days=Math.abs(daysBetween(r2.date)-daysBetween(r1.date));if(days===0)return null;return{perDay:((r2.free_chlorine-r1.free_chlorine)/days).toFixed(1),days,from:r2.free_chlorine,to:r1.free_chlorine};}
function calcLangelier(ph,alkalinity,calcium=CALCIUM_HARDNESS,waterTemp=82){if(!ph||!alkalinity)return null;const lsi=ph-(12.1-Math.log10(calcium||CALCIUM_HARDNESS)-Math.log10(alkalinity)+(0.009*(waterTemp||82)));return Math.round(lsi*100)/100;}
function fcEffectiveAtPH(ph){const effectiveness={7.0:73,7.2:63,7.4:50,7.6:37,7.8:24,8.0:14,8.2:9};const keys=Object.keys(effectiveness).map(Number).sort((a,b)=>a-b);const nearest=keys.reduce((prev,curr)=>Math.abs(curr-ph)<Math.abs(prev-ph)?curr:prev);return effectiveness[nearest]||14;}
function calcTargetSWG(fc,cya,waterTemp,pumpHours){const targetFC=Math.max(3,(cya||60)*0.075),hours=pumpHours||8,tempBoost=(waterTemp&&waterTemp>85)?1.2:1.0,base=Math.round(60*tempBoost*(8/hours));if(fc>targetFC*1.5)return Math.max(20,base-20);if(fc<targetFC*0.5)return Math.min(100,base+25);return Math.min(100,base);}
function getSeasonalReminder(){const month=new Date().getMonth();const seasons={0:{label:"January",swg:"20-30%",note:"Cell barely runs below 60 F. Manual chlorine may be needed if temps spike."},1:{label:"February",swg:"20-30%",note:"Still winter mode   minimal SWG output needed."},2:{label:"March",swg:"30-40%",note:"Start ramping up as water warms."},3:{label:"April",swg:"40-50%",note:"Spring ramp-up. Check salt cell after winter dormancy."},4:{label:"May",swg:"50-60%",note:"Heading into summer demand. Verify CYA is 70-75 before heavy use season."},5:{label:"June",swg:"60-70%",note:"Peak SC summer heat. FC burns fast   monitor closely."},6:{label:"July",swg:"60-70%",note:"Hottest stretch. Consider split pump schedule."},7:{label:"August",swg:"60-70%",note:"Still peak demand. Watch for storm-driven dilution."},8:{label:"September",swg:"50-60%",note:"Early fall   demand starts easing as temps drop."},9:{label:"October",swg:"40-50%",note:"Drop SWG as pump runs less and bather load fades."},10:{label:"November",swg:"30-40%",note:"Cell efficiency drops below 60 F water."},11:{label:"December",swg:"20-30%",note:"Cell stops producing chlorine below ~60 F."}};return seasons[month];}

export function getChemRecommendations(last,readings,filterBaseline){
  if(!last)return[];
  const recs=[],shockMin=calcShockThreshold(last.cya),burnRate=calcFCBurnRate(readings),acidOz=calcAcidDose(last.ph,7.4,last.alkalinity);
  const calciumReading=readings.find(r=>r.calcium_hardness!==null&&r.calcium_hardness!==undefined),calciumValue=calciumReading?calciumReading.calcium_hardness:null;
  const lsi=calcLangelier(last.ph,last.alkalinity,calciumValue||CALCIUM_HARDNESS,last.water_temp),targetSWG=calcTargetSWG(last.free_chlorine,last.cya,last.water_temp,last.pump_hours),phEffective=last.ph?fcEffectiveAtPH(last.ph):null;
  if(last.ph&&last.ph>7.6){const oz=acidOz||"?",effNote=phEffective?` At pH ${last.ph}, only ${phEffective}% of FC is active.`:"";recs.push({priority:"high",param:"pH",icon:" ",action:`Add ~${oz} oz muriatic acid (pH ${last.ph} to 7.4)`,detail:`Pour slowly in front of return jets with pump running.${effNote}`,color:COLORS.red});}
  else if(last.ph&&last.ph<7.4&&last.ph>=7.2)recs.push({priority:"med",param:"pH",icon:" ",action:`pH ${last.ph} slightly low - add soda ash`,detail:`Target is 7.4 7.6. Add ~6 oz soda ash per 10,000 gal, retest in 4 hrs.`,color:COLORS.amber});
  else if(last.ph&&last.ph<7.2)recs.push({priority:"high",param:"pH",icon:" ",action:"Add soda ash to raise pH",detail:`pH ${last.ph} is too low   target 7.4. Add ~12 oz soda ash per 0.2 pH rise per 10,000 gal.`,color:COLORS.red});
  if(last.cc!==null&&last.cc!==undefined&&last.cc>0.5)recs.push({priority:"high",param:"CC",icon:"  ",action:`CC ${last.cc} ppm   chloramines present, raise FC to breakpoint`,detail:`Raise SWG to 100% until FC reaches ${Math.round((last.cya||60)*0.4)} ppm. Brush and run pump 24hrs.`,color:COLORS.red});
  else if(last.cc!==null&&last.cc!==undefined&&last.cc>0.2)recs.push({priority:last.cc>=0.5?"high":"med",param:"CC",icon:"",action:`CC ${last.cc>=0.5?"elevated":"slightly elevated"} at ${last.cc} ppm${last.cc>=0.5?" - raise FC to breakpoint":" - watch closely"}`,detail:last.cc>=0.5?`Raise SWG to 100% until FC reaches ${Math.round((last.cya||60)*0.4)} ppm. Brush and run pump 24hrs.`:`Combined chlorine should be 0. Raise FC target by 1-2 ppm and retest in 48 hrs.`,color:last.cc>=0.5?COLORS.red:COLORS.amber});
  if(last.free_chlorine!==null&&last.free_chlorine<shockMin)recs.push({priority:"high",param:"FC",icon:" ",action:`FC ${last.free_chlorine} ppm   below minimum. Raise SWG to 90%`,detail:`Minimum effective FC with CYA ${last.cya||60} ppm is ${shockMin} ppm (CYA 10). Raise SWG to 90% immediately.`,color:COLORS.red});
  else if(last.free_chlorine>8)recs.push({priority:"med",param:"FC",icon:" ",action:`FC high at ${last.free_chlorine} ppm   lower SWG to ${Math.max(20,targetSWG-20)}%`,detail:`Target FC is 4 5 ppm. Lower SWG output and retest in 48 hours.`,color:COLORS.amber});
  if(last.swg_setting){if(Math.abs(last.swg_setting-targetSWG)>10){const dir=last.swg_setting>targetSWG?"lower":"raise";recs.push({priority:"med",param:"SWG",icon:"  ",action:`${dir==="lower"?"Lower":"Raise"} SWG from ${last.swg_setting}% to ${targetSWG}%`,detail:`Based on FC ${last.free_chlorine} ppm, CYA ${last.cya||60} ppm, and ${last.pump_hours||8} pump hours.`,color:COLORS.amber});}}
  else recs.push({priority:"med",param:"SWG",icon:"  ",action:`Set SWG to ~${targetSWG}% for current conditions`,detail:`Recommended for FC ${last.free_chlorine} ppm, CYA ${last.cya||60} ppm in SC summer.`,color:COLORS.blue});
  if(!last.pump_hours||last.pump_hours<8)recs.push({priority:"med",param:"Pump",icon:" ",action:"Increase pump run time to 8-10 hrs/day",detail:`Less than 8 hrs/day limits SWG chlorine production and circulation.`,color:COLORS.blue});
  if(last.cya&&last.cya<60){const ozNeeded=Math.round((70-last.cya)*POOL_GALLONS/1000000*10*134);recs.push({priority:"med",param:"CYA",icon:"  ",action:`Add stabilizer   CYA ${last.cya} ppm, target 70 75`,detail:`Add ~${ozNeeded} oz (${Math.round(ozNeeded/16)} lbs) cyanuric acid. Dissolve in bucket first, pour in front of return jet.`,color:COLORS.amber});}
  else if(last.cya&&last.cya>80)recs.push({priority:"med",param:"CYA",icon:"  ",action:`CYA ${last.cya} ppm   dilute by draining 15-20%`,detail:`Above 80 ppm CYA locks up chlorine. Drain ~2,500 gallons and refill.`,color:COLORS.amber});
  if(last.salt&&last.salt<3200){const lbsNeeded=Math.round((3400-last.salt)*POOL_GALLONS/1000000*8.34),bags=Math.ceil(lbsNeeded/40);recs.push({priority:"med",param:"Salt",icon:" ",action:`Add ${bags} x 40lb bag${bags!==1?"s":""} of salt`,detail:`Salt ${last.salt} ppm is below Pentair IntelliChlor minimum 3200 ppm.`,color:COLORS.amber});}
  else if(last.salt&&last.salt>3800)recs.push({priority:"med",param:"Salt",icon:" ",action:`Salt high at ${last.salt} ppm   dilute by draining`,detail:`Above 3800 ppm can damage Pentair cell. Drain 10% and refill.`,color:COLORS.amber});
  if(last.alkalinity&&last.alkalinity<80){const ozNeeded=Math.round((100-last.alkalinity)*POOL_GALLONS/1000000*1.5*128);recs.push({priority:"med",param:"TA",icon:"  ",action:`Add ~${ozNeeded} oz baking soda to raise TA`,detail:`TA ${last.alkalinity} ppm is low   pH will be unstable.`,color:COLORS.amber});}
  else if(last.alkalinity&&last.alkalinity>120)recs.push({priority:"low",param:"TA",icon:"  ",action:"TA slightly high   add acid in small doses",detail:`TA ${last.alkalinity} ppm. Your pH corrections will naturally lower TA over time.`,color:COLORS.blue});
  if(last.filter_pressure&&filterBaseline&&last.filter_pressure>filterBaseline+10)recs.push({priority:"med",param:"Filter",icon:" ",action:`Filter pressure ${last.filter_pressure} psi (+${last.filter_pressure-filterBaseline} above baseline)   clean cartridge`,detail:`Baseline after last clean was ${filterBaseline} psi.`,color:COLORS.amber});
  else if(last.filter_pressure&&!filterBaseline&&last.filter_pressure>20)recs.push({priority:"med",param:"Filter",icon:" ",action:`Filter pressure ${last.filter_pressure} psi   clean cartridge`,detail:`No clean baseline set yet   using a general 20 psi threshold.`,color:COLORS.amber});
  if(!calciumValue)recs.push({priority:"low",param:"Ca",icon:" ",action:"Test calcium hardness",detail:`Using estimated 200 ppm. Vinyl pools target 150-250 ppm.`,color:COLORS.slate});
  else if(calciumValue<150)recs.push({priority:"med",param:"Ca",icon:" ",action:`Calcium hardness low at ${calciumValue} ppm`,detail:`Vinyl pools target 150-250 ppm. Low calcium is corrosive to your Pentair cell.`,color:COLORS.amber});
  else if(calciumValue>250)recs.push({priority:"low",param:"Ca",icon:" ",action:`Calcium hardness high at ${calciumValue} ppm`,detail:`Above 250 ppm risks scaling. Dilute by draining if it keeps climbing.`,color:COLORS.amber});
  if(lsi!==null&&lsi>0.3)recs.push({priority:"low",param:"LSI",icon:" ",action:`LSI ${lsi}   scaling tendency`,detail:`Water has a slight tendency to deposit scale. First: adjust pH toward 7.4.`,color:COLORS.amber});
  if(burnRate){const dailyDrop=parseFloat(burnRate.perDay);if(dailyDrop<-0.8)recs.push({priority:"low",param:"FC",icon:" ",action:`FC dropping ${Math.abs(dailyDrop)} ppm/day   high demand`,detail:`Lost ${Math.abs(burnRate.from-burnRate.to).toFixed(1)} ppm over ${burnRate.days} days. SC summer heat and UV are likely cause.`,color:COLORS.slate});}
  return recs;
}


function PoolBrief({readings, treatments, maintLog, onClose}) {
  const [brief, setBrief]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [history, setHistory]   = useState([]);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [followUp, setFollowUp] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [askingFollowUp, setAskingFollowUp] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("poolBriefHistory") || "[]");
      setHistory(saved);
      // Auto-show most recent brief without re-running
      if(saved.length>0) { setBrief(saved[0].text); }
    } catch {}
  }, []);

  function saveBriefToHistory(briefText) {
    try {
      const saved = JSON.parse(localStorage.getItem("poolBriefHistory") || "[]");
      const updated = [{ date: new Date().toISOString(), text: briefText }, ...saved].slice(0, 5);
      localStorage.setItem("poolBriefHistory", JSON.stringify(updated));
      setHistory(updated);
    } catch {}
  }

  async function generateBrief() {
    setLoading(true); setViewingHistory(null); setError(null);
    try {
      const recentReadings = readings.slice(0, 10);
      const last = readings[0];
      // Include structured treatment data
      const recentTreatments = (treatments||[]).slice(0,5);
      const oldTreatments = (maintLog||[]).filter(m=>m.type==="Treatment applied").slice(0,3);

      const cyaDue = nextTestDue(readings, "cya", 14);
      const taDue  = nextTestDue(readings, "alkalinity", 14);
      const mostRecentCYA      = readings.find(r=>r.cya!==null&&r.cya!==undefined);
      const mostRecentTA       = readings.find(r=>r.alkalinity!==null&&r.alkalinity!==undefined);
      const mostRecentCalcium  = readings.find(r=>r.calcium_hardness!==null&&r.calcium_hardness!==undefined);

      const readingsSummary = recentReadings.map(r=>{
        const time = r.logged_at?` ${new Date(r.logged_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`:""
        return `${r.date}${time}: FC=${r.free_chlorine??"-"} pH=${r.ph??"-"} Salt=${r.salt??"-"} CYA=${r.cya??"-"} TA=${r.alkalinity??"-"} CC=${r.cc??"-"} Temp=${r.water_temp??"-"}F SWG=${r.swg_setting??"-"}% PSI=${r.filter_pressure??"-"} Pump=${r.pump_hours??"-"}h${r.notes?` Note:${r.notes}`:""}`;
      }).join("\n");

      const treatmentSummary = recentTreatments.length>0
        ? recentTreatments.map(t=>{
            const chems=[
              t.muriatic_acid_oz&&`${t.muriatic_acid_oz}oz muriatic acid`,
              t.soda_ash_oz&&`${t.soda_ash_oz}oz soda ash`,
              t.sodium_bicarb_oz&&`${t.sodium_bicarb_oz}oz bicarb`,
              t.salt_lbs&&`${t.salt_lbs}lb salt`,
              t.cya_oz&&`${t.cya_oz}oz CYA`,
              t.liquid_chlorine_oz&&`${t.liquid_chlorine_oz}oz liquid chlorine`,
              t.shock_lbs&&`${t.shock_lbs}lb shock`,
            ].filter(Boolean);
            const tasks=[t.brushed&&"brushed",t.vacuumed&&"vacuumed",t.cleaned_filter&&"cleaned filter",t.cleaned_cell&&"cleaned cell"].filter(Boolean);
            const swg=t.swg_pct_before&&t.swg_pct_after?` SWG ${t.swg_pct_before}%-->${t.swg_pct_after}%`:"";
            return `${t.date}: ${[...chems,...tasks].join(", ")||"maintenance"}${swg}${t.notes?` (${t.notes})`:""}`;
          }).join("\n")
        : oldTreatments.length>0
          ? oldTreatments.map(t=>`${t.date}: ${t.notes||"treatment logged"}`).join("\n")
          : "No treatments logged.";

      const staleFlags=[];
      if(cyaDue&&cyaDue.days<0) staleFlags.push(`CYA last tested ${cyaDue.lastDate} (${-cyaDue.days}d overdue)`);
      if(taDue&&taDue.days<0)   staleFlags.push(`TA last tested ${taDue.lastDate} (${-taDue.days}d overdue)`);
      const daysSinceLast=last?daysAgo(last.date):null;
      if(daysSinceLast>=3)       staleFlags.push(`Last reading ${daysSinceLast} days ago - chemistry may have drifted`);

      const today=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
      const acidOzNeeded = last&&last.ph ? (calcAcidDose(last.ph,7.4,last.alkalinity)||"?") : "?";
      const minFC = mostRecentCYA ? Math.round(mostRecentCYA.cya/10) : "unknown";
      const cyaStr = mostRecentCYA ? mostRecentCYA.cya+" ppm ("+mostRecentCYA.date+")" : "never tested";
      const taStr  = mostRecentTA  ? mostRecentTA.alkalinity+" ppm ("+mostRecentTA.date+")"  : "never tested";
      const caStr  = mostRecentCalcium ? mostRecentCalcium.calcium_hardness+" ppm ("+mostRecentCalcium.date+")" : "not tested";
      const NL = String.fromCharCode(10);
      const staleSection = staleFlags.length>0 ? "DATA FLAGS:"+NL+staleFlags.map(f=>"- "+f).join(NL) : "";
      const prompt = [
        "You are a knowledgeable pool chemistry advisor helping a homeowner in Summerville, SC manage their 17,000 gal vinyl inground saltwater pool. Equipment: Pentair IntelliChlor IC40 SWG, cartridge filter. Test kit: Taylor K-2006 FAS-DPD (FC in drops x0.5=ppm).",
        "Today: "+today+". Analyzing "+recentReadings.length+" readings and "+recentTreatments.length+" logged treatments.",
        "READINGS (newest first):", readingsSummary,
        "TREATMENTS LOGGED:", treatmentSummary,
        "CHEMISTRY CONTEXT:",
        "- CYA: "+cyaStr+" | Target 70-80 ppm for SC summer",
        "- TA: "+taStr+" | Target 80-120 ppm",
        "- Calcium: "+caStr+" | Target 150-250 ppm (vinyl)",
        "- Min FC for current CYA: "+minFC+" ppm (CYA/10 rule)",
        "- pH at "+(last&&last.ph?last.ph:"unknown")+": approx "+acidOzNeeded+" oz acid to reach 7.4",
        "- LSI: vinyl pool - skip scaling alerts at normal calcium levels",
        staleSection,
        "Search for current Summerville SC weather before answering.",
        "Write a pool brief. Bullets only. Max 160 words. Sections:",
        "**STATUS** - swim-ready or not + why",
        "**TREND** - what has changed across recent readings",
        "**TREATMENTS** - did recent treatments work (before/after numbers)",
        "**WEATHER IMPACT** - current Summerville conditions + pool effect",
        "**ACTION TODAY** - specific dose if needed (oz/lbs), or no action needed",
        "**WATCH** - what to check next and when",
      ].filter(Boolean).join(NL+NL)
      const res = await fetch("/api/brief", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]
        })
      });
      const data = await res.json();
      if(!res.ok||data.error){setError(`API error: ${data.error?.message||`HTTP ${res.status}`}`);setLoading(false);return;}
      const textBlocks=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n");
      const finalBrief=textBlocks||"Unable to generate brief.";
      setBrief(finalBrief);
      saveBriefToHistory(finalBrief);
    } catch(e){setError("Could not generate brief: "+e.message);}
    setLoading(false);
  }

  async function askFollowUp() {
    if(!followUp.trim()||!brief) return;
    const question=followUp.trim();
    setChatMessages(prev=>[...prev,{role:"user",text:question}]);
    setFollowUp(""); setAskingFollowUp(true);
    try {
      const last=readings[0];
      const ctx=`Pool: 17,000 gal vinyl SWG Summerville SC. Current: FC=${last?.free_chlorine} pH=${last?.ph} Salt=${last?.salt} CYA=${last?.cya} CC=${last?.cc}.`;
      const res=await fetch("/api/brief",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:400,messages:[{role:"user",content:`Brief you gave:\n\n${brief}\n\n${ctx}\n\nFollow-up (answer in 2-3 sentences, no headers): ${question}`}]})});
      const data=await res.json();
      const text=(data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n");
      setChatMessages(prev=>[...prev,{role:"assistant",text:text||"Could not get a response."}]);
    } catch(e){setChatMessages(prev=>[...prev,{role:"assistant",text:"Error: "+e.message}]);}
    setAskingFollowUp(false);
  }

  function renderBrief(text) {
    if(!text) return null;
    return text.split("\n").map((line,i)=>{
      const trimmed=line.trim();
      if(!trimmed) return <div key={i} style={{height:6}}/>;
      if(trimmed.startsWith("**")&&trimmed.endsWith("**")){
        return <div key={i} style={{fontSize:11,fontWeight:700,color:COLORS.blue,letterSpacing:"0.8px",textTransform:"uppercase",marginTop:14,marginBottom:6}}>{trimmed.replace(/\*\*/g,"")}</div>;
      }
      if(trimmed.startsWith("-")||trimmed.startsWith("*")){
        return <div key={i} style={{fontSize:14,color:COLORS.white,lineHeight:1.6,marginBottom:6,paddingLeft:12,position:"relative"}}><span style={{position:"absolute",left:0,color:COLORS.blue}}>-</span>{trimmed.replace(/^[-*]\s*/,"")}</div>;
      }
      return <div key={i} style={{fontSize:14,color:COLORS.slateLight,lineHeight:1.6,marginBottom:6}}>{trimmed}</div>;
    });
  }

  const displayedBrief=viewingHistory!==null?history[viewingHistory]?.text:brief;
  const isHistory=viewingHistory!==null;
  const lastUpdated=history[0]?.date?new Date(history[0].date).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}):null;

  return(
    <Modal title="Pool Brief" onClose={onClose}> {history.length>1&&(
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          <span style={S.chip(viewingHistory===null,COLORS.purple)} onClick={()=>setViewingHistory(null)}>Latest</span>
          {history.slice(1).map((h,i)=>(
            <span key={i} style={S.chip(viewingHistory===i+1,COLORS.slate)} onClick={()=>setViewingHistory(i+1)}>
              {new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </span>
          ))}
        </div>
      )} {lastUpdated&&!loading&&(
        <div style={{fontSize:11,color:COLORS.slate,marginBottom:10}}>Last generated: {lastUpdated}</div>
      )}
      {loading&&<div style={{textAlign:"center",padding:"32px 20px"}}><div style={{fontSize:14,color:COLORS.slate}}>Analyzing readings + Summerville weather...</div><div style={{fontSize:12,color:COLORS.slate,marginTop:6}}>About 10 seconds</div></div>}
      {error&&<div style={{fontSize:14,color:COLORS.red,padding:"16px 0"}}>{error}</div>} {displayedBrief&&!loading&&(
        <>
          <div style={{background:COLORS.navyLight,borderRadius:12,padding:"14px 16px",marginBottom:12}}>{renderBrief(displayedBrief)}</div>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <button style={{...S.btn,marginTop:0,flex:2,background:COLORS.blue}} onClick={generateBrief}>Refresh</button>
            {!isHistory&&<button style={{...S.btn,marginTop:0,flex:1,background:COLORS.navyLight,color:COLORS.slateLight}} onClick={async()=>{try{await navigator.clipboard.writeText(displayedBrief);alert("Copied");}catch{}}}>Copy</button>}
          </div>
          {!isHistory&&(
            <>
              <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Ask a follow-up</div>
              {chatMessages.map((m,i)=>(
                <div key={i} style={{marginBottom:8,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",background:m.role==="user"?COLORS.blue:COLORS.navyLight,color:"#fff",borderRadius:10,padding:"8px 12px",fontSize:13,lineHeight:1.5}}>{m.text}</div>
                </div>
              ))}
              {askingFollowUp&&<div style={{fontSize:13,color:COLORS.slate,marginBottom:8}}>Thinking...</div>}
              <div style={{display:"flex",gap:8}}>
                <input style={{...S.input,marginBottom:0,flex:1,fontSize:13}} placeholder="e.g. Is it safe to swim now?" value={followUp} onChange={e=>setFollowUp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")askFollowUp();}}/>
                <button style={{...S.btnSm,flexShrink:0}} onClick={askFollowUp} disabled={askingFollowUp}>Ask</button>
              </div>
            </>
          )}
        </>
      )}
      {!displayedBrief&&!loading&&(
        <div style={{textAlign:"center",padding:"32px 20px"}}>
          <div style={{fontSize:14,color:COLORS.slate,marginBottom:16,lineHeight:1.5}}>Analyzes your readings, treatments, and current Summerville weather.</div>
          <button style={S.btn} onClick={generateBrief}>Run Analysis</button>
        </div>
      )}
    </Modal>
  );
}


export function Pool(){
  const readings   = useTable("pool_readings","logged_at");
  const maintLog   = useTable("pool_maintenance","date");
  const treatments = useTable("pool_treatments","logged_at");
  const schedule   = useTable("pool_schedule","title",true);
  const poolSettings = useTable("pool_settings","id",true);
  const [tab,setTab]             = useState("history");
  const [showLog,setShowLog]     = useState(false);
  const [showMaint,setShowMaint] = useState(false);
  const [showScheduleEdit,setShowScheduleEdit] = useState(false);
  const [showBrief,setShowBrief] = useState(false);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [useDrops,setUseDrops]   = useState(false);
  const [activeSwipe,setActiveSwipe] = useState(null);
  const [showOptionalFields,setShowOptionalFields] = useState(false);
  const [showDateTime,setShowDateTime] = useState(false);

  const PARAMS=[
    {k:"ph",l:"pH",unit:"",target:"7.4 7.6"},
    {k:"free_chlorine",l:"FC",unit:"ppm",target:"CYA 10 min"},
    {k:"cc",l:"CC",unit:"ppm",target:"0"},
    {k:"salt",l:"Salt",unit:"ppm",target:"3200 3600"},
    {k:"cya",l:"CYA",unit:"ppm",target:"70 75"},
    {k:"alkalinity",l:"TA",unit:"ppm",target:"80 120"},
    {k:"water_temp",l:"Temp",unit:" F",target:" "},
    {k:"filter_pressure",l:"PSI",unit:"psi",target:"<20"},
  ];

  const poolSettingsRow = poolSettings.data[0];
  const filterBaseline = poolSettingsRow?.filter_clean_baseline_psi || null;

  function latestValue(key) {
    for (const r of readings.data) { if (r[key] !== null && r[key] !== undefined) return r[key]; }
    return null;
  }
  const lastRaw = readings.data[0];
  const last = lastRaw ? {
    ...lastRaw,
    ph:             latestValue("ph"),
    free_chlorine:  latestValue("free_chlorine"),
    cc:             latestValue("cc"),
    salt:           latestValue("salt"),
    cya:            latestValue("cya"),
    alkalinity:     latestValue("alkalinity"),
    calcium_hardness: latestValue("calcium_hardness"),
    water_temp:     latestValue("water_temp"),
    filter_pressure: latestValue("filter_pressure"),
    swg_setting:    latestValue("swg_setting"),
  } : null;
  const shockMin = last ? calcShockThreshold(last.cya) : null;
  const chemRecs = getChemRecommendations(last, readings.data, filterBaseline);
  const health   = calcPoolHealth(last, shockMin, readings.data);

  const [dismissed,setDismissed] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem("poolDismissedRecs")||"{}"); }catch{ return {}; }
  });
  function dismissRec(param){
    if(!last) return;
    setDismissed(prev=>{
      const updated = {...prev, [last.id]: [...(prev[last.id]||[]), param]};
      try{ localStorage.setItem("poolDismissedRecs", JSON.stringify(updated)); }catch{}
      return updated;
    });
  }
  const dismissedForThisReading = (last && dismissed[last.id]) || [];
  const visibleRecs = chemRecs.filter(r=>!dismissedForThisReading.includes(r.param));
  const highRecs = visibleRecs.filter(r=>r.priority==="high");
  const medRecs  = visibleRecs.filter(r=>r.priority==="med");
  const lowRecs  = visibleRecs.filter(r=>r.priority==="low");
  const [showLow,setShowLow] = useState(false);
  const [showAllWatch,setShowAllWatch] = useState(false);
  const [showTreatmentForm,setShowTreatmentForm] = useState(false);
  const [treatForm,setTreatForm] = useState({});

  const season = getSeasonalReminder();
  const seasonKey = `pool_season_dismissed_${new Date().getFullYear()}_${new Date().getMonth()}`;
  const [seasonDismissed,setSeasonDismissed] = useState(()=>{
    try{ return localStorage.getItem(seasonKey)==="true"; }catch{ return false; }
  });
  function dismissSeason(){ setSeasonDismissed(true); try{ localStorage.setItem(seasonKey,"true"); }catch{} }

  function openEditReading(r){
    const timeVal = r.logged_at ? new Date(r.logged_at).toTimeString().slice(0,5) : "";
    setEditItem(r); setForm({...r, time:timeVal}); setShowLog(true); setActiveSwipe(null);
  }
  function openEditMaint(m){setEditItem(m);setForm({...m});setShowMaint(true);setActiveSwipe(null);}
  function closeLog(){setShowLog(false);setEditItem(null);setForm({});setUseDrops(false);setShowOptionalFields(false);setShowDateTime(false);}
  function closeMaint(){setShowMaint(false);setEditItem(null);setForm({});}

  async function markScheduleDone(item){
    await schedule.update(item.id, {last_completed: TODAY_STR, title: item.title, interval_days: item.interval_days, notes: item.notes||""});
  }
  async function saveScheduleItem(){
    if(!form.title || !form.interval_days) return;
    const row = {title: form.title, last_completed: form.last_completed||TODAY_STR, interval_days: +form.interval_days, notes: form.notes||""};
    if(editItem) await schedule.update(editItem.id, row); else await schedule.insert(row);
    setShowScheduleEdit(false); setEditItem(null); setForm({});
  }
  async function saveReading(){
    function num(v){ return (v===undefined||v===null||v==='') ? null : +v; }
    let fc = num(form.free_chlorine);
    if(useDrops && fc!==null) fc = Math.round(fc * 0.5 * 10) / 10;
    const d = form.date||TODAY_STR;
    const timeStr = form.time || new Date().toTimeString().slice(0,5);
    const loggedAt = new Date(`${d}T${timeStr}:00`).toISOString();
    const row={date:d,logged_at:loggedAt,ph:num(form.ph),free_chlorine:fc,cc:num(form.cc),salt:num(form.salt),cya:num(form.cya),alkalinity:num(form.alkalinity),calcium_hardness:num(form.calcium_hardness),water_temp:num(form.water_temp),swg_setting:num(form.swg_setting),filter_pressure:num(form.filter_pressure),pump_hours:num(form.pump_hours),notes:form.notes||""};
    if(editItem) await readings.update(editItem.id,row); else await readings.insert(row);
    closeLog();
  }
  async function saveMaint(){
    if(!form.type)return;
    const row={date:form.date||TODAY_STR,type:form.type,notes:form.notes||""};
    if(editItem) await maintLog.update(editItem.id,row); else await maintLog.insert(row);
    closeMaint();
  }
  function num(v){ return (v===undefined||v===null||v==="") ? null : +v; }
  async function saveTreatment(){
    const d = treatForm.date||TODAY_STR;
    // Parse time from logged_at if editing existing entry and no explicit time set
    let timeStr = treatForm.time||"";
    if(!timeStr && treatForm.logged_at) {
      timeStr = new Date(treatForm.logged_at).toTimeString().slice(0,5);
    }
    if(!timeStr) timeStr = new Date().toTimeString().slice(0,5);
    const loggedAt = new Date(`${d}T${timeStr}:00`).toISOString();
    const row = {
      date:d, logged_at:loggedAt,
      muriatic_acid_oz:  num(treatForm.muriatic_acid_oz),
      soda_ash_oz:       num(treatForm.soda_ash_oz),
      sodium_bicarb_oz:  num(treatForm.sodium_bicarb_oz),
      salt_lbs:          num(treatForm.salt_lbs),
      cya_oz:            num(treatForm.cya_oz),
      liquid_chlorine_oz:num(treatForm.liquid_chlorine_oz),
      shock_lbs:         num(treatForm.shock_lbs),
      algaecide_oz:      num(treatForm.algaecide_oz),
      swg_pct_before:    num(treatForm.swg_pct_before),
      swg_pct_after:     num(treatForm.swg_pct_after),
      brushed:           !!treatForm.brushed,
      vacuumed:          !!treatForm.vacuumed,
      cleaned_skimmer:   !!treatForm.cleaned_skimmer,
      cleaned_filter:    !!treatForm.cleaned_filter,
      cleaned_cell:      !!treatForm.cleaned_cell,
      checked_flow:      !!treatForm.checked_flow,
      notes:             treatForm.notes||"",
    };
    if(treatForm.id) {
      await treatments.update(treatForm.id, row);
    } else {
      await treatments.insert(row);
    }
    setShowTreatmentForm(false);
    setTreatForm({});
  }

  // - Log form helpers -
  function poolFieldStatus(key, val, formCya) {
    const v = (val===undefined||val===null||val==="") ? null : +val;
    if(v===null) return null;
    if(key==="ph"){
      if(v<7.0||v>8.5) return {color:COLORS.red, text:"Extreme   target 7.4 7.6"};
      if(v<7.4) return {color:COLORS.amber, text:"Low   target 7.4 7.6"};
      if(v>7.8) return {color:COLORS.red, text:"High   add acid"};
      if(v>7.6) return {color:COLORS.amber, text:"Elevated   target 7.4 7.6"};
      return {color:COLORS.green, text:"Good (7.4 7.6)"};
    }
    if(key==="cc"){
      if(v===0) return {color:COLORS.green, text:"None   ideal"};
      if(v<=0.2) return {color:COLORS.green, text:"Trace   acceptable"};
      if(v<=0.5) return {color:COLORS.amber, text:"Watch   raise FC"};
      return {color:COLORS.red, text:"Elevated   chloramines"};
    }
    if(key==="free_chlorine"){
      const cyaVal = formCya ? +formCya : (last?.cya||60);
      const minFC = Math.round(cyaVal/10);
      if(v<minFC) return {color:COLORS.red, text:"Below min for CYA "+cyaVal+" (need  "+minFC+")"};
      if(v>8) return {color:COLORS.amber, text:"High   lower SWG"};
      return {color:COLORS.green, text:"Good ( "+minFC+" ppm)"};
    }
    const ranges = {
      salt:{low:3200,ok:3600,high:3800},
      cya:{low:60,ok:80,high:90},
      alkalinity:{low:80,ok:120,high:140},
    };
    const r = ranges[key]; if(!r) return null;
    if(v<r.low||v>r.high) return {color:COLORS.red, text:"Out of range"};
    if(v>r.ok) return {color:COLORS.amber, text:"Slightly high"};
    return {color:COLORS.green, text:"Good"};
  }



  const schedSorted=[...schedule.data].sort((a,b)=>{
    const o={overdue:0,"due-soon":1,ok:2};
    return o[maintStatus(a)]-o[maintStatus(b)];
  });
  const [showChemDetails,setShowChemDetails] = useState(false);

  return(
    <div style={S.screen}>
      {health&&(
        <div style={{background:COLORS.navyMid,borderRadius:16,border:`1px solid ${health.overallColor}44`,borderLeft:`4px solid ${health.overallColor}`,marginBottom:8,padding:"16px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:health.overallColor,flexShrink:0}}/>
              <div style={{fontSize:18,fontWeight:800,color:health.overallColor,letterSpacing:"-0.2px"}}>{health.overallLabel}</div>
            </div>
            {daysAgo(lastRaw.date)>=3
              ? <span style={{fontSize:11,background:COLORS.amber+"22",color:COLORS.amber,borderRadius:6,padding:"3px 8px",fontWeight:600}}>{daysAgo(lastRaw.date)}d old</span>
              : readings.data[0]&&["ph","free_chlorine","salt","cya","alkalinity","cc"].filter(k=>readings.data[0][k]!==null&&readings.data[0][k]!==undefined).length<4
              ? <span style={{fontSize:11,background:COLORS.slate+"22",color:COLORS.slate,borderRadius:6,padding:"3px 8px",fontWeight:600}}>partial</span>
              : null}
          </div>
          <div style={{fontSize:12,color:COLORS.slate,marginBottom:10,marginLeft:18}}>
            {formatDate(last.date)}{last.logged_at?` - ${new Date(last.logged_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`:""}{last.water_temp?` - ${last.water_temp}F`:""}
          </div>
          <div style={{fontSize:14,color:COLORS.slateLight,lineHeight:1.5,marginBottom:14}}>{health.summary}</div>
          <button onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}} style={{width:"100%",background:COLORS.blue,color:"#fff",border:"none",borderRadius:10,padding:"11px 0",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8}}>+ Log Reading</button>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <button onClick={()=>{setTreatForm({date:TODAY_STR,swg_pct_before:last?.swg_setting||""});setShowTreatmentForm(true);}} style={{flex:1,background:COLORS.green+"22",color:COLORS.green,border:`1px solid ${COLORS.green}44`,borderRadius:10,padding:"8px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Log Treatment</button>
            <button onClick={()=>setShowBrief(true)} style={{flex:1,background:COLORS.purple+"22",color:COLORS.purple,border:`1px solid ${COLORS.purple}44`,borderRadius:10,padding:"8px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>AI Brief</button>
          </div>
          <button onClick={()=>setShowChemDetails(p=>!p)} style={{width:"100%",background:"transparent",border:`1px solid ${COLORS.navyLight}`,borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:600,color:COLORS.slate,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Chemistry Details</span><span style={{fontSize:10}}>{showChemDetails?"^":"v"}</span>
          </button>
          {showChemDetails&&(
            <div style={{marginTop:12,borderTop:`1px solid ${COLORS.navyLight}`,paddingTop:12}}>
              {health.params.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<health.params.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,marginTop:1}}/>
                  <div style={{flex:"0 0 120px",minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:COLORS.white}}>{p.label}</div>
                    <div style={{fontSize:15,color:p.color,marginTop:1}}>{p.statusLabel}</div>
                  </div>
                  <div style={{flex:"0 0 72px",textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:p.value!==null&&p.value!==undefined?COLORS.white:COLORS.slate}}>
                      {p.value!==null&&p.value!==undefined?`${p.value}${p.unit}`:"--"}
                      {p.trendArrow&&<span style={{fontSize:15,marginLeft:3}}>{p.trendArrow}</span>}
                    </div>
                    <div style={{fontSize:11,color:COLORS.slate,marginTop:1}}>{p.target}</div>
                    <div style={{marginTop:4,display:"flex",justifyContent:"flex-end"}}>
                      <Sparkline data={[...readings.data].reverse().map(r=>r[p.key]).filter(v=>v!=null)} color={p.color}/>
                    </div>
                  </div>
                  <div style={{flex:1,textAlign:"right"}}>
                    {p.lastTestedLabel&&<div style={{fontSize:11,color:COLORS.slate,lineHeight:1.3}}>{p.lastTestedLabel}</div>}
                    {p.testInfo&&<div style={{fontSize:11,color:p.testInfo.urgency==="red"?COLORS.red:p.testInfo.urgency==="amber"?COLORS.amber:COLORS.slate,marginTop:p.lastTestedLabel?2:0,lineHeight:1.3}}>{p.testInfo.dueLabel}</div>}
                    {!p.lastTestedLabel&&!p.testInfo&&<div style={{fontSize:11,color:COLORS.slate}}>every reading</div>}
                  </div>
                </div>
              ))}
              {last.cc!==null&&last.cc!==undefined&&(
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:`1px solid ${COLORS.navyLight}`}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:last.cc>0.5?COLORS.red:last.cc>0.2?COLORS.amber:COLORS.green,flexShrink:0,marginTop:1}}/>
                  <div style={{flex:"0 0 120px",minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:COLORS.white}}>Combined Chlorine</div>
                    <div style={{fontSize:13,color:last.cc>0.5?COLORS.red:last.cc>0?COLORS.amber:COLORS.green,marginTop:1}}>{last.cc===0?"None":last.cc<=0.2?"Trace":last.cc<=0.5?"Watch":"Elevated"}</div>
                  </div>
                  <div style={{flex:"0 0 72px",textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:COLORS.white}}>{last.cc} ppm</div>
                    <div style={{fontSize:11,color:COLORS.slate,marginTop:1}}>target: 0</div>
                  </div>
                  <div style={{flex:1,textAlign:"right"}}><div style={{fontSize:11,color:COLORS.slate}}>every reading</div></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!last&&(
        <div style={{...S.card,textAlign:"center",padding:"32px 20px",marginBottom:14}}>
          <div style={{fontSize:32,marginBottom:10}}> </div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>No readings yet</div>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:16}}>Log your first pool reading to see health status and recommendations.</div>
          <button onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}} style={S.btn}>+ Log First Reading</button>
        </div>
      )}
{highRecs.map((r,i)=>(
        <div key={i} style={{...S.statusCard(r.color),marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,paddingRight:8}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{r.icon} {r.action}</div>
              <div style={{fontSize:14,color:COLORS.slateLight,lineHeight:1.5}}>{r.detail}</div>
            </div>
            <button onClick={()=>dismissRec(r.param)} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:18,padding:2,flexShrink:0}}> </button>
          </div>
        </div>
      ))}
      {medRecs.length>0 && (()=>{
        const chemParams = ["pH","CC","FC","CYA","Salt","TA","Ca"];
        const chemRecs2 = medRecs.filter(r=>chemParams.includes(r.param));
        const equipRecs = medRecs.filter(r=>!chemParams.includes(r.param));
        const watchItems = [...chemRecs2,...equipRecs];
        const visibleWatch = showAllWatch ? watchItems : watchItems.slice(0,3);
        const hiddenCount = watchItems.length - 3;
        return (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,marginTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px"}}>Watch</div>
              {hiddenCount>0&&!showAllWatch&&<button onClick={()=>setShowAllWatch(true)} style={{fontSize:12,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0}}>{hiddenCount} more</button>}
              {showAllWatch&&hiddenCount>0&&<button onClick={()=>setShowAllWatch(false)} style={{fontSize:12,color:COLORS.slate,background:"none",border:"none",cursor:"pointer",padding:0}}>less</button>}
            </div>
            {visibleWatch.map((r,i)=>{
              const isChem = chemParams.includes(r.param);
              return(
                <div key={i} style={{background:COLORS.navyMid,borderRadius:12,borderLeft:`3px solid ${isChem?r.color:COLORS.slate}`,marginBottom:8,padding:isChem?"12px 14px":"10px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:r.detail&&isChem?4:0}}>
                    <div style={{fontSize:isChem?14:13,fontWeight:isChem?700:600,color:isChem?COLORS.white:COLORS.slateLight,flex:1,paddingRight:8,lineHeight:1.4}}>{r.action}</div>
                    <button onClick={()=>dismissRec(r.param)} style={{background:COLORS.navyLight,border:"none",color:COLORS.slate,cursor:"pointer",fontSize:11,padding:"3px 7px",borderRadius:6,flexShrink:0,fontWeight:600}}>Done</button>
                  </div>
                  {r.detail&&isChem&&<div style={{fontSize:12,color:COLORS.slate,lineHeight:1.5}}>{r.detail}</div>}
                </div>
              );
            })}
          </>
        );
      })()}
      {last&&highRecs.length===0&&medRecs.length===0&&(
        <div style={{background:COLORS.green+"11",border:`1px solid ${COLORS.green}33`,borderRadius:12,textAlign:"center",padding:"14px 16px",marginTop:8}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.green}}>Chemistry balanced</div>
          <div style={{fontSize:13,color:COLORS.slate,marginTop:4}}>No actions needed - keep up with regular testing.</div>
        </div>
      )}
      {lowRecs.length>0&&(
        <button onClick={()=>setShowLow(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:10,marginTop:8}}>
          {showLow?"Hide":"Show"} {lowRecs.length} note{lowRecs.length!==1?"s":""}
        </button>
      )}
      {showLow&&lowRecs.map((r,i)=>(
        <div key={i} style={{background:COLORS.navyMid,borderRadius:10,borderLeft:`2px solid ${COLORS.slate}`,marginBottom:6,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,color:COLORS.slateLight,flex:1,paddingRight:8}}>{r.action}</div>
            <button onClick={()=>dismissRec(r.param)} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:11,padding:"2px 6px",borderRadius:4,fontWeight:600}}>Done</button>
          </div>
        </div>
      ))}
      {!seasonDismissed&&season&&(
        <div style={{...S.statusCard(COLORS.blue),marginBottom:14,marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,paddingRight:8}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>   {season.label}   target SWG {season.swg}</div>
              <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5}}>{season.note}</div>
            </div>
            <button onClick={dismissSeason} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:15,padding:2,flexShrink:0}}> </button>
          </div>
        </div>
      )}
      <div style={{...S.tabs,marginTop:16}}>
        {["history","schedule"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t==="schedule"?"maintenance":t}</button>)}
      </div>
      {tab==="schedule"&&<>
        <div style={{background:COLORS.navyLight,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:COLORS.slate,lineHeight:1.4}}>Pool-specific maintenance schedule. Yard, home, and other tasks are in Tasks.</div>
        </div>
        {schedule.loading?<Loading/>:<>
          <SwipeHint/>
          {schedSorted.map(item=>{
            const st=maintStatus(item);const color=maintColor(st);
            const nd=nextDueDate(item.last_completed,item.interval_days);
            const days=daysBetween(nd);
            const pct=Math.max(0,100-(days/item.interval_days)*100);
            return(
              <SwipeCard key={item.id} id={item.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>{setEditItem(item);setForm({...item});setShowScheduleEdit(true);setActiveSwipe(null);}}
                onDelete={()=>{schedule.remove(item.id);setActiveSwipe(null);}}
                style={S.statusCard(color)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
                    <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>
                      {st==="overdue"?`Overdue by ${-days}d`:st==="due-soon"?`Due in ${days}d`:`Due ${formatDate(nd)}`}
                      {item.notes?`   ${item.notes}`:""}
                    </div>
                    <div style={S.progress}><div style={S.progressFill(pct,color)}/></div>
                  </div>
                  <button style={{...S.btnCheck,marginLeft:12}} onClick={()=>markScheduleDone(item)}> </button>
                </div>
              </SwipeCard>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({interval_days:7});setShowScheduleEdit(true);}}>+ Add Item</button>
        </>}
      </>}
      {tab==="history"&&<>
        <button onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}} style={{...S.btn,marginBottom:12,marginTop:0}}>+ Log Reading</button>
        {(readings.loading||maintLog.loading)?<Loading/>:<>
          <SwipeHint/>
          {(()=>{
            const items = [
              ...readings.data.map(r=>({...r, _type:"reading", _sortKey:r.logged_at||r.date})),
              ...maintLog.data.map(m=>({...m, _type:"maint", _sortKey:m.date})),
              ...treatments.data.map(t=>({...t, _type:"treatment", _sortKey:t.logged_at||t.date})),
            ].sort((a,b)=>new Date(b._sortKey)-new Date(a._sortKey));
            const readingsByDate = {};
            readings.data.forEach(r=>{ readingsByDate[r.date]=(readingsByDate[r.date]||0)+1; });
            if(items.length===0) return <EmptyState icon=" " title="No history yet" detail="Log your first pool reading to start building a history."/>;
            return items.map(item=>{
              if(item._type==="reading"){
                const hasTime = item.logged_at && readingsByDate[item.date] > 1;
                const timeLabel = hasTime ? new Date(item.logged_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}) : "";
                return(
                  <SwipeCard key={`r-${item.id}`} id={`r-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
                    onEdit={()=>openEditReading(item)}
                    onDelete={()=>{readings.remove(item.id);setActiveSwipe(null);}}
                    style={S.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <span style={{fontSize:15,background:COLORS.blue+"22",color:COLORS.blue,borderRadius:4,padding:"1px 6px",fontWeight:700}}>Reading</span>
                            <div style={{fontSize:15,fontWeight:700}}>{formatDate(item.date)}{timeLabel?`   ${timeLabel}`:""}</div>
                            {["ph","free_chlorine","salt","cya","alkalinity","cc"].filter(k=>item[k]!==null&&item[k]!==undefined).length<=2&&(
                              <span style={{fontSize:11,background:COLORS.slate+"22",color:COLORS.slate,borderRadius:4,padding:"1px 6px"}}>partial   {["ph","free_chlorine","salt","cya","alkalinity","cc"].filter(k=>item[k]!==null&&item[k]!==undefined).join(", ")}</span>
                            )}
                          </div>
                      <div style={{fontSize:15,color:COLORS.slate,textAlign:"right"}}>
                        {item.water_temp?`${item.water_temp} F`:""}{item.swg_setting?`   SWG ${item.swg_setting}%`:""}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
                      {PARAMS.filter(p=>!["water_temp","filter_pressure"].includes(p.k)).map(p=>{
                        const v=item[p.k];
                        const s=poolStatus(p.k,v);
                        return <div key={p.k}><div style={{fontSize:15,fontWeight:600,color:v!==null&&v!==undefined?statusColor(s):COLORS.slate}}>{v!==null&&v!==undefined?v:" "}</div><div style={{fontSize:15,color:COLORS.slate}}>{p.l}</div></div>;
                      })}
                    </div>
                    {item.notes&&<div style={{fontSize:15,color:COLORS.slate,marginTop:10,fontStyle:"italic"}}>{item.notes}</div>}
                  </SwipeCard>
                );
              }
              if(item._type==="maint"){
              return(
                <SwipeCard key={`m-${item.id}`} id={`m-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
                  onEdit={()=>openEditMaint(item)}
                  onDelete={()=>{maintLog.remove(item.id);setActiveSwipe(null);}}
                  style={S.card}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13,background:COLORS.slate+"22",color:COLORS.slate,borderRadius:4,padding:"1px 6px",fontWeight:700}}>Maintenance</span>
                    <div style={{fontSize:14,fontWeight:600,color:COLORS.slateLight}}>{item.type}</div>
                  </div>
                  <div style={{fontSize:12,color:COLORS.slate,marginTop:3}}>{formatDate(item.date)}</div>
                  {item.notes&&<div style={{fontSize:13,color:COLORS.slate,marginTop:6,fontStyle:"italic"}}>{item.notes}</div>}
                </SwipeCard>
              );
              }
              if(item._type==="treatment"){
                const chems = [
                  item.muriatic_acid_oz&&`${item.muriatic_acid_oz} oz acid`,
                  item.soda_ash_oz&&`${item.soda_ash_oz} oz soda ash`,
                  item.sodium_bicarb_oz&&`${item.sodium_bicarb_oz} oz bicarb`,
                  item.salt_lbs&&`${item.salt_lbs} lbs salt`,
                  item.cya_oz&&`${item.cya_oz} oz CYA`,
                  item.liquid_chlorine_oz&&`${item.liquid_chlorine_oz} oz chlorine`,
                  item.shock_lbs&&`${item.shock_lbs} lbs shock`,
                  item.algaecide_oz&&`${item.algaecide_oz} oz algaecide`,
                ].filter(Boolean);
                const tasks = [
                  item.brushed&&"Brushed",
                  item.vacuumed&&"Vacuumed",
                  item.cleaned_skimmer&&"Cleaned skimmer",
                  item.cleaned_filter&&"Cleaned filter",
                  item.cleaned_cell&&"Cleaned cell",
                  item.checked_flow&&"Checked flow switch",
                ].filter(Boolean);
                const swgChange = item.swg_pct_before&&item.swg_pct_after&&item.swg_pct_before!==item.swg_pct_after;
                return(
                  <SwipeCard key={`t-${item.id}`} id={`t-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
                    onEdit={()=>{setTreatForm({...item,time:item.logged_at?new Date(item.logged_at).toTimeString().slice(0,5):""});setShowTreatmentForm(true);setActiveSwipe(null);}}
                    onDelete={()=>{treatments.remove(item.id);setActiveSwipe(null);}}
                    style={S.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13,background:COLORS.green+"22",color:COLORS.green,borderRadius:4,padding:"1px 6px",fontWeight:700}}>Treatment</span>
                        <div style={{fontSize:12,color:COLORS.slate}}>{formatDate(item.date)}{item.logged_at?` - ${new Date(item.logged_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`:""}</div>
                      </div>
                      {swgChange&&<span style={{fontSize:12,color:COLORS.blue,fontWeight:600}}>SWG {item.swg_pct_before}% to {item.swg_pct_after}%</span>}
                    </div>
                    {chems.length>0&&(
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:tasks.length>0?8:0}}>
                        {chems.map((c,i)=>(
                          <span key={i} style={{fontSize:13,background:COLORS.amber+"22",color:COLORS.amber,borderRadius:6,padding:"3px 8px",fontWeight:600}}>{c}</span>
                        ))}
                      </div>
                    )}
                    {tasks.length>0&&(
                      <div style={{fontSize:13,color:COLORS.slate,lineHeight:1.5}}>{tasks.join(", ")}</div>
                    )}
                    {item.notes&&<div style={{fontSize:13,color:COLORS.slate,marginTop:6,fontStyle:"italic"}}>{item.notes}</div>}
                    {chems.length===0&&tasks.length===0&&<div style={{fontSize:13,color:COLORS.slate}}>No chemicals or tasks logged</div>}
                  </SwipeCard>
                );
              }
              return null;
            });
          })()}
          <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowMaint(true);}}>+ Log Maintenance</button>
        </>}
      </>}
      {showLog&&<Modal title={editItem?"Edit Reading":"Log Pool Reading"} onClose={closeLog}>
        <button onClick={()=>setShowDateTime(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"left",marginBottom:12,fontSize:13}}>
            {showDateTime?"Hide date/time  ":"Change date/time  "}   {form.date||TODAY_STR} {form.time||new Date().toTimeString().slice(0,5)}
        </button>
        {showDateTime&&(
          <div style={{...S.row,marginBottom:4}}>
            <div style={S.col}><label style={S.label}>Date</label><input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div style={{flex:"0 0 110px"}}><label style={S.label}>Time</label><input type="time" style={S.input} value={form.time||new Date().toTimeString().slice(0,5)} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/></div>
          </div>
        )}
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <span style={S.chip(!useDrops,COLORS.blue)} onClick={()=>setUseDrops(false)}>Enter ppm</span>
          <span style={S.chip(useDrops,COLORS.purple)} onClick={()=>setUseDrops(true)}>K-2006 drops</span>
        </div>
                <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{...S.label,marginBottom:0,fontSize:14}}>{useDrops?"Free Chlorine (drops)":"Free Chlorine"}</label>
            {poolFieldStatus("free_chlorine",form["free_chlorine"],form.cya)&&<span style={{fontSize:12,color:poolFieldStatus("free_chlorine",form["free_chlorine"],form.cya).color,fontWeight:600}}>{poolFieldStatus("free_chlorine",form["free_chlorine"],form.cya).text}</span>}
          </div>
          <input type="number" step="0.5" style={{...S.input,marginBottom:0}} placeholder={useDrops?"e.g. 11 drops":"e.g. 5.5"} value={form.free_chlorine!==undefined?form.free_chlorine:""} onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/>
        </div>
        {useDrops&&form.free_chlorine&&<div style={{fontSize:12,color:COLORS.purple,marginTop:-10,marginBottom:12}}>= {(+form.free_chlorine*0.5).toFixed(1)} ppm FC</div>}
                <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{...S.label,marginBottom:0,fontSize:14}}>{"CC (Combined Chlorine)"}</label>
            {poolFieldStatus("cc",form["cc"],form.cya)&&<span style={{fontSize:12,color:poolFieldStatus("cc",form["cc"],form.cya).color,fontWeight:600}}>{poolFieldStatus("cc",form["cc"],form.cya).text}</span>}
          </div>
          <input type="number" step="0.5" style={{...S.input,marginBottom:0}} placeholder={"0"} value={form.cc!==undefined?form.cc:""} onChange={e=>setForm(p=>({...p,cc:e.target.value}))}/>
        </div>
        <div style={S.row}>
          <div style={S.col}>        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{...S.label,marginBottom:0,fontSize:14}}>{"pH"}</label>
            {poolFieldStatus("ph",form["ph"],form.cya)&&<span style={{fontSize:12,color:poolFieldStatus("ph",form["ph"],form.cya).color,fontWeight:600}}>{poolFieldStatus("ph",form["ph"],form.cya).text}</span>}
          </div>
          <input type="number" step="0.1" style={{...S.input,marginBottom:0}} placeholder={""} value={form.ph!==undefined?form.ph:""} onChange={e=>setForm(p=>({...p,ph:e.target.value}))}/>
        </div></div>
          <div style={S.col}>        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{...S.label,marginBottom:0,fontSize:14}}>{"Salt (ppm)"}</label>
            {poolFieldStatus("salt",form["salt"],form.cya)&&<span style={{fontSize:12,color:poolFieldStatus("salt",form["salt"],form.cya).color,fontWeight:600}}>{poolFieldStatus("salt",form["salt"],form.cya).text}</span>}
          </div>
          <input type="number" step="any" style={{...S.input,marginBottom:0}} placeholder={"3200-3600"} value={form.salt!==undefined?form.salt:""} onChange={e=>setForm(p=>({...p,salt:e.target.value}))}/>
        </div></div>
        </div>
        <button onClick={()=>setShowOptionalFields(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"left",marginBottom:12,fontSize:13}}>
          {showOptionalFields?"  Hide optional fields":"  More fields   CYA, TA, Calcium, Temp, PSI, SWG, Pump"}
        </button>
        {showOptionalFields&&(
          <>
            <div style={S.row}>
              <div style={S.col}>        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{...S.label,marginBottom:0,fontSize:14}}>{"CYA (ppm)"}</label>
            {poolFieldStatus("cya",form["cya"],form.cya)&&<span style={{fontSize:12,color:poolFieldStatus("cya",form["cya"],form.cya).color,fontWeight:600}}>{poolFieldStatus("cya",form["cya"],form.cya).text}</span>}
          </div>
          <input type="number" step="any" style={{...S.input,marginBottom:0}} placeholder={"60-80"} value={form.cya!==undefined?form.cya:""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/>
        </div></div>
              <div style={S.col}>        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{...S.label,marginBottom:0,fontSize:14}}>{"TA (ppm)"}</label>
            {poolFieldStatus("alkalinity",form["alkalinity"],form.cya)&&<span style={{fontSize:12,color:poolFieldStatus("alkalinity",form["alkalinity"],form.cya).color,fontWeight:600}}>{poolFieldStatus("alkalinity",form["alkalinity"],form.cya).text}</span>}
          </div>
          <input type="number" step="any" style={{...S.input,marginBottom:0}} placeholder={"80-120"} value={form.alkalinity!==undefined?form.alkalinity:""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/>
        </div></div>
            </div>
            <div style={S.row}>
              <div style={S.col}><label style={S.label}>Calcium (ppm)</label><input type="number" style={S.input} placeholder="150 250" value={form.calcium_hardness||""} onChange={e=>setForm(p=>({...p,calcium_hardness:e.target.value}))}/></div>
              <div style={S.col}><label style={S.label}>Water Temp ( F)</label><input type="number" style={S.input} value={form.water_temp||""} onChange={e=>setForm(p=>({...p,water_temp:e.target.value}))}/></div>
            </div>
            <div style={S.row}>
              <div style={S.col}><label style={S.label}>Filter PSI</label><input type="number" style={S.input} value={form.filter_pressure||""} onChange={e=>setForm(p=>({...p,filter_pressure:e.target.value}))}/></div>
              <div style={S.col}><label style={S.label}>SWG (%)</label><input type="number" style={S.input} value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/></div>
            </div>
            <div style={S.row}>
              <div style={S.col}><label style={S.label}>Pump Hrs/Day</label><input type="number" style={S.input} value={form.pump_hours||""} onChange={e=>setForm(p=>({...p,pump_hours:e.target.value}))}/></div>
              <div style={S.col}/>
            </div>
          </>
        )}
        <label style={S.label}>Notes</label>
        <input style={S.input} value={form.notes||""} placeholder="Rain? Lots of swimmers? Treatments done?" onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:4}} onClick={saveReading}>{editItem?"Save Changes":"Save Reading"}</button>
      </Modal>}
      {showMaint&&<Modal title={editItem?"Edit Entry":"Log Pool Entry"} onClose={closeMaint}>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||form.last_completed||""} onChange={e=>setForm(p=>({...p,date:e.target.value,last_completed:e.target.value}))}/>
        <label style={S.label}>Type</label>
        {["Check water level","Clean skimmer basket","Brushed walls & floor","Added salt","Cleaned cartridge filter","Cleaned salt cell","Checked flow switch","Inspected O-rings","Rain event","Other"].map(t=>(
          <span key={t} style={S.chip(form.type===t,COLORS.blue)} onClick={()=>setForm(p=>({...p,type:t}))}>{t}</span>
        ))}
        <label style={{...S.label,marginTop:10}}>Notes (optional)</label>
        <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:10}} onClick={saveMaint}>{editItem?"Save Changes":"Save"}</button>
      </Modal>}
      {showBrief&&<PoolBrief readings={readings.data} treatments={treatments.data} maintLog={maintLog.data} onClose={()=>setShowBrief(false)}/>}
      {showTreatmentForm&&<Modal title="Log Treatment" onClose={()=>{setShowTreatmentForm(false);setTreatForm({});}}> <div style={{background:COLORS.navyLight,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:20,flexWrap:"wrap"}}>
          {[["FC",last?.free_chlorine],["pH",last?.ph],["Salt",last?.salt],["CYA",last?.cya],["CC",last?.cc],["SWG",last?.swg_setting?last.swg_setting+"%":null]].map(([k,v])=>(
            <div key={k} style={{textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:700,color:v!=null?COLORS.white:COLORS.slate}}>{v!=null?v:"--"}</div>
              <div style={{fontSize:11,color:COLORS.slate,marginTop:1}}>{k}</div>
            </div>
          ))}
        </div> {chemRecs.filter(r=>r.priority==="high"||r.priority==="med").length>0&&(
          <div style={{background:COLORS.amber+"11",border:`1px solid ${COLORS.amber}33`,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:COLORS.amber,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Active Recommendations</div>
            {chemRecs.filter(r=>r.priority==="high"||r.priority==="med").slice(0,3).map((r,i)=>(
              <div key={i} style={{fontSize:13,color:COLORS.slateLight,marginBottom:2}}>- {r.action}</div>
            ))}
          </div>
        )} <div style={{display:"flex",gap:8,marginBottom:14}}>
          <div style={{flex:1}}><label style={S.label}>Date</label><input type="date" style={S.input} value={treatForm.date||TODAY_STR} onChange={e=>setTreatForm(p=>({...p,date:e.target.value}))}/></div>
          <div style={{flex:"0 0 110px"}}><label style={S.label}>Time</label><input type="time" style={S.input} value={treatForm.time||new Date().toTimeString().slice(0,5)} onChange={e=>setTreatForm(p=>({...p,time:e.target.value}))}/></div>
        </div> <div style={{fontSize:11,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Chemicals Added</div>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>Muriatic Acid (oz)</label>
            <input type="number" step="0.5" style={S.input} placeholder="e.g. 11" value={treatForm.muriatic_acid_oz||""} onChange={e=>setTreatForm(p=>({...p,muriatic_acid_oz:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>Soda Ash (oz)</label>
            <input type="number" step="0.5" style={S.input} placeholder="pH up" value={treatForm.soda_ash_oz||""} onChange={e=>setTreatForm(p=>({...p,soda_ash_oz:e.target.value}))}/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>Sodium Bicarb (oz)</label>
            <input type="number" step="0.5" style={S.input} placeholder="TA up" value={treatForm.sodium_bicarb_oz||""} onChange={e=>setTreatForm(p=>({...p,sodium_bicarb_oz:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>Salt (lbs)</label>
            <input type="number" step="0.5" style={S.input} placeholder="e.g. 2" value={treatForm.salt_lbs||""} onChange={e=>setTreatForm(p=>({...p,salt_lbs:e.target.value}))}/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>CYA Stabilizer (oz)</label>
            <input type="number" step="1" style={S.input} placeholder="e.g. 48" value={treatForm.cya_oz||""} onChange={e=>setTreatForm(p=>({...p,cya_oz:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>Liquid Chlorine (oz)</label>
            <input type="number" step="1" style={S.input} value={treatForm.liquid_chlorine_oz||""} onChange={e=>setTreatForm(p=>({...p,liquid_chlorine_oz:e.target.value}))}/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>Shock (lbs)</label>
            <input type="number" step="0.5" style={S.input} value={treatForm.shock_lbs||""} onChange={e=>setTreatForm(p=>({...p,shock_lbs:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>Algaecide (oz)</label>
            <input type="number" step="1" style={S.input} value={treatForm.algaecide_oz||""} onChange={e=>setTreatForm(p=>({...p,algaecide_oz:e.target.value}))}/>
          </div>
        </div> <div style={{fontSize:11,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:4}}>SWG Setting</div>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>Before (%)</label>
            <input type="number" style={S.input} placeholder={last?.swg_setting||""} value={treatForm.swg_pct_before||""} onChange={e=>setTreatForm(p=>({...p,swg_pct_before:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>After (%)</label>
            <input type="number" style={S.input} value={treatForm.swg_pct_after||""} onChange={e=>setTreatForm(p=>({...p,swg_pct_after:e.target.value}))}/>
          </div>
        </div> <div style={{fontSize:11,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Maintenance Done</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {[["brushed","Brushed"],["vacuumed","Vacuumed"],["cleaned_skimmer","Cleaned skimmer"],["cleaned_filter","Cleaned filter"],["cleaned_cell","Cleaned cell"],["checked_flow","Checked flow switch"]].map(([k,label])=>(
            <span key={k} style={S.chip(!!treatForm[k],COLORS.green)} onClick={()=>setTreatForm(p=>({...p,[k]:!p[k]}))}>
              {treatForm[k]?"v ":""}{label}
            </span>
          ))}
        </div> <label style={S.label}>Notes (optional)</label>
        <input style={S.input} placeholder="Anything else worth noting..." value={treatForm.notes||""} onChange={e=>setTreatForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:4,background:COLORS.green}} onClick={saveTreatment}>Save Treatment</button>
      </Modal>}
      {showScheduleEdit&&<Modal title={editItem?"Edit Schedule Item":"Add Schedule Item"} onClose={()=>{setShowScheduleEdit(false);setEditItem(null);setForm({});}}>
        <label style={S.label}>Task Name</label>
        <input style={S.input} placeholder="e.g. Check water level" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Interval</label>
        <div style={{marginBottom:12}}>
          {[7,14,30,60,90,180,365].map(d=><span key={d} style={S.chip(+form.interval_days===d,COLORS.blue)} onClick={()=>setForm(p=>({...p,interval_days:d}))}>{d}d</span>)}
        </div>
        <label style={S.label}>Last Completed</label>
        <input type="date" style={S.input} value={form.last_completed||""} onChange={e=>setForm(p=>({...p,last_completed:e.target.value}))}/>
        <label style={S.label}>Notes (optional)</label>
        <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:10}} onClick={saveScheduleItem}>{editItem?"Save Changes":"Add Item"}</button>
      </Modal>}
    </div>
  );
}

// - RETIREMENT BRIEF -
