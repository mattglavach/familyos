import { useRef, useState } from "react";
import { Edit3, Trash2, X } from "lucide-react";
import { COLORS, S } from "../theme";
import { OriginDrawer } from "./origin/drawer";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

// - SPARKLINE -
export function Sparkline({data,color}){
  if(!data||data.length<2)return null;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1,W=64,H=24;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-min)/range)*H}`).join(" ");
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// - SWIPE CARD -
export function SwipeCard({children, onEdit, onDelete, style={}, activeId, setActiveId, id}){
  const ref=useRef(null),startX=useRef(null),isOpen=activeId===id;
  const [confirming,setConfirming]=useState(false);
  const THRESHOLD=60,REVEAL=130;
  function onTouchStart(e){startX.current=e.touches[0].clientX;}
  function onTouchEnd(e){
    if(startX.current===null)return;
    const dx=e.changedTouches[0].clientX-startX.current;
    if(dx<-THRESHOLD)setActiveId(id);
    else if(dx>THRESHOLD){setActiveId(null);setConfirming(false);}
    startX.current=null;
  }
  return(
    <div style={{position:"relative",marginBottom:10,borderRadius:12,overflow:"hidden"}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,display:"flex",alignItems:"stretch",borderRadius:"0 12px 12px 0"}}>
        {!confirming
          ?<>
            <button onClick={()=>{onEdit();setActiveId(null);}} style={{width:65,background:COLORS.amber,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,WebkitTapHighlightColor:"transparent"}}><Edit3 size={18} aria-hidden="true"/>Edit</button>
            <button onClick={()=>setConfirming(true)} style={{width:65,background:COLORS.red,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderRadius:"0 12px 12px 0",WebkitTapHighlightColor:"transparent"}}><Trash2 size={18} aria-hidden="true"/>Delete</button>
          </>
          :<div style={{display:"flex",alignItems:"stretch"}}>
            <button onClick={()=>setConfirming(false)} style={{width:65,background:COLORS.slate,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,WebkitTapHighlightColor:"transparent"}}><X size={18} aria-hidden="true"/>Cancel</button>
            <button onClick={()=>{setConfirming(false);setActiveId(null);onDelete();}} style={{width:80,background:COLORS.red,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderRadius:"0 12px 12px 0",WebkitTapHighlightColor:"transparent"}}><Trash2 size={18} aria-hidden="true"/>Confirm</button>
          </div>
        }
      </div>
      <div ref={ref} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{...style,transform:`translateX(${isOpen?-(confirming?145:REVEAL):0}px)`,transition:"transform 0.25s ease",position:"relative",zIndex:1,touchAction:"pan-y"}}>{children}</div>
    </div>
  );
}

// - MODAL -
export function Modal({title,onClose,children}){
  return(
    <OriginDrawer open onOpenChange={(open)=>{ if(!open) onClose(); }} title={title}>
      {children}
    </OriginDrawer>
  );
}

export function Loading(){
  return(
    <div style={{padding:"4px 0"}}>
      {[0.9,0.7,0.85].map((w,i)=>(
        <Card key={i} className="mb-3 overflow-hidden p-5">
          <Skeleton className="mb-3 h-3.5" style={{width:`${w*100}%`}}/>
          <Skeleton className="mb-2 h-3 w-[55%]"/>
          <Skeleton className="h-3 w-[35%]"/>
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({icon,title,detail,action,onAction}){
  return(
    <div style={{textAlign:"center",padding:"48px 24px 40px"}}>
      <div style={{fontSize:40,marginBottom:14,opacity:0.6}}>{icon||" "}</div>
      <div style={{fontSize:16,fontWeight:700,color:COLORS.slateLight,marginBottom:8}}>{title||"Nothing here yet"}</div>
      {detail&&<div style={{fontSize:14,color:COLORS.slate,lineHeight:1.6,marginBottom:20,maxWidth:260,margin:"0 auto 20px"}}>{detail}</div>}
      {action&&onAction&&<Button type="button" size="lg" onClick={onAction}>{action}</Button>}
    </div>
  );
}

export function SwipeHint(){
  const [seen,setSeen]=useState(()=>{try{return sessionStorage.getItem("swipeHintSeen")==="1";}catch{return false;}});
  if(seen)return null;
  return(<div style={S.swipeHint} onClick={()=>{setSeen(true);try{sessionStorage.setItem("swipeHintSeen","1");}catch{}}}>  swipe left to edit or delete</div>);
}

