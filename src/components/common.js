import { useRef, useState } from "react";
import { Edit3, Trash2, X } from "lucide-react";
import { COLORS, S } from "../theme";
import { OriginDrawer } from "./origin/drawer";
import { Card } from "./ui/card";
import { EmptyStatePanel } from "./ui/empty-state";
import { SectionHeader as UISectionHeader } from "./ui/section-header";
import { Skeleton } from "./ui/skeleton";
import { StatusBadge as UIStatusBadge } from "./ui/badge";

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
  function handleEdit(){
    onEdit();
    setActiveId(null);
    setConfirming(false);
  }
  function handleDeleteConfirm(){
    setConfirming(false);
    setActiveId(null);
    onDelete();
  }
  function onActionKeyDown(action){
    return (e)=>{
      if(e.key!=="Enter"&&e.key!==" ")return;
      e.preventDefault();
      action();
    };
  }
  function handleSwipe(dx){
    if(dx<-THRESHOLD)setActiveId(id);
    else if(dx>THRESHOLD){setActiveId(null);setConfirming(false);}
  }
  function onTouchStart(e){startX.current=e.touches[0].clientX;}
  function onTouchEnd(e){
    if(startX.current===null)return;
    handleSwipe(e.changedTouches[0].clientX-startX.current);
    startX.current=null;
  }
  function onMouseDown(e){
    if(e.button!==0)return;
    startX.current=e.clientX;
  }
  function onMouseUp(e){
    if(startX.current===null)return;
    handleSwipe(e.clientX-startX.current);
    startX.current=null;
  }
  const fallbackButton={height:32,minWidth:36,border:`1px solid ${COLORS.navyLight}`,borderRadius:8,background:"rgba(15,23,42,0.72)",color:COLORS.slateLight,fontSize:12,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:"0 10px"};
  return(
    <div style={{position:"relative",marginBottom:10,borderRadius:12,overflow:"hidden"}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,display:"flex",alignItems:"stretch",borderRadius:"0 12px 12px 0"}}>
        {!confirming
          ?<>
            <button onClick={handleEdit} style={{width:65,background:COLORS.amber,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,WebkitTapHighlightColor:"transparent"}}><Edit3 size={18} aria-hidden="true"/>Edit</button>
            <button onClick={()=>setConfirming(true)} style={{width:65,background:COLORS.red,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderRadius:"0 12px 12px 0",WebkitTapHighlightColor:"transparent"}}><Trash2 size={18} aria-hidden="true"/>Delete</button>
          </>
          :<div style={{display:"flex",alignItems:"stretch"}}>
            <button onClick={()=>setConfirming(false)} style={{width:65,background:COLORS.slate,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,WebkitTapHighlightColor:"transparent"}}><X size={18} aria-hidden="true"/>Cancel</button>
            <button onClick={handleDeleteConfirm} style={{width:80,background:COLORS.red,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderRadius:"0 12px 12px 0",WebkitTapHighlightColor:"transparent"}}><Trash2 size={18} aria-hidden="true"/>Confirm</button>
          </div>
        }
      </div>
      <div ref={ref} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseDown={onMouseDown} onMouseUp={onMouseUp} style={{...style,transform:`translateX(${isOpen?-(confirming?145:REVEAL):0}px)`,transition:"transform 0.25s ease",position:"relative",zIndex:1,touchAction:"pan-y"}}>
        {children}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:10}}>
          <button type="button" aria-label="Edit row" onClick={handleEdit} onKeyDown={onActionKeyDown(handleEdit)} style={fallbackButton}><Edit3 size={14} aria-hidden="true"/>Edit</button>
          {!confirming
            ?<button type="button" aria-label="Delete row" onClick={()=>setConfirming(true)} onKeyDown={onActionKeyDown(()=>setConfirming(true))} style={{...fallbackButton,color:"#fecaca",borderColor:"rgba(248,113,113,0.45)"}}><Trash2 size={14} aria-hidden="true"/>Delete</button>
            :<>
              <button type="button" aria-label="Cancel delete" onClick={()=>setConfirming(false)} onKeyDown={onActionKeyDown(()=>setConfirming(false))} style={fallbackButton}><X size={14} aria-hidden="true"/>Cancel</button>
              <button type="button" aria-label="Confirm delete" onClick={handleDeleteConfirm} onKeyDown={onActionKeyDown(handleDeleteConfirm)} style={{...fallbackButton,color:"#fecaca",borderColor:"rgba(248,113,113,0.45)"}}><Trash2 size={14} aria-hidden="true"/>Confirm</button>
            </>
          }
        </div>
      </div>
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
    <EmptyStatePanel icon={icon} title={title} detail={detail} action={action} onAction={onAction}/>
  );
}

export function SectionHeader({label,title,count,color,tone,action}){
  const toneFromColor = color===COLORS.red?"red":color===COLORS.amber?"amber":color===COLORS.green?"green":color===COLORS.blue?"blue":color===COLORS.purple?"purple":"neutral";
  return <UISectionHeader title={title||label} count={count} tone={tone||toneFromColor} action={action}/>;
}

export function StatusBadge({status,children,className}){
  return <UIStatusBadge status={status} className={className}>{children}</UIStatusBadge>;
}

export function SwipeHint(){
  const [seen,setSeen]=useState(()=>{try{return sessionStorage.getItem("swipeHintSeen")==="1";}catch{return false;}});
  if(seen)return null;
  return(<div style={S.swipeHint} onClick={()=>{setSeen(true);try{sessionStorage.setItem("swipeHintSeen","1");}catch{}}}>  swipe left to edit or delete</div>);
}

