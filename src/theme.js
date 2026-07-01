// - DESIGN TOKENS -
export const COLORS={
  navy:"#0F1729",navyMid:"#1A2540",navyLight:"#243352",
  slate:"#8892A4",slateLight:"#B8C0CC",white:"#F7F8FA",
  red:"#E05252",amber:"#F0A030",green:"#3DB87A",blue:"#4A90D9",purple:"#8B6FD4",
};
export const MEMBER_COLORS={
  Matt:"#4A90D9",Kalee:"#8B6FD4",Aubrey:"#E05252",Blake:"#3DB87A",Brayden:"#F0A030",
};


// - STYLES -
export const S={
  app:{background:COLORS.navy,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Inter',system-ui,-apple-system,sans-serif",color:COLORS.white,position:"relative",paddingBottom:160},
  header:{background:COLORS.navyMid,padding:"16px 20px 14px",paddingTop:"calc(env(safe-area-inset-top) + 16px)",borderBottom:`1px solid ${COLORS.navyLight}`,position:"sticky",top:0,zIndex:10,backdropFilter:"blur(8px)"},
  headerRow:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  logo:{fontSize:20,fontWeight:800,letterSpacing:"-0.6px"},
  logoAccent:{color:COLORS.blue},
  dateLabel:{fontSize:13,color:COLORS.slate,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  screen:{padding:"20px 16px 8px",background:COLORS.navy},
  sectionLabel:{fontSize:15,fontWeight:700,letterSpacing:"1px",color:COLORS.slate,textTransform:"uppercase",marginBottom:12,marginTop:32},
  card:{background:COLORS.navyMid,borderRadius:16,padding:"18px 20px",marginBottom:12,border:`1px solid ${COLORS.navyLight}`},
  statusCard:(c)=>({background:COLORS.navyMid,borderRadius:16,padding:"18px 20px",marginBottom:12,border:`1px solid ${COLORS.navyLight}`,borderLeft:`3px solid ${c}`}),
  badge:(c)=>({display:"inline-flex",alignItems:"center",background:c+"1a",color:c,borderRadius:20,padding:"3px 10px",fontSize:15,fontWeight:600,letterSpacing:"0.1px"}),
  memberDot:(m)=>({display:"inline-block",width:8,height:8,borderRadius:"50%",background:MEMBER_COLORS[m]||COLORS.slate,marginRight:6}),
  btn:{background:COLORS.blue,color:"#fff",border:"none",borderRadius:12,padding:"14px 20px",fontSize:15,fontWeight:600,cursor:"pointer",width:"100%",marginTop:12,WebkitTapHighlightColor:"transparent",transition:"opacity 0.1s",letterSpacing:"-0.1px"},
  btnSm:{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},
  btnGreen:{background:COLORS.green+"1a",color:COLORS.green,border:`1px solid ${COLORS.green}33`,borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},
  btnCheck:{background:COLORS.green+"1a",color:COLORS.green,border:`1px solid ${COLORS.green}33`,borderRadius:8,padding:"6px 10px",fontSize:15,fontWeight:700,cursor:"pointer",flexShrink:0,lineHeight:1,minWidth:32,textAlign:"center",WebkitTapHighlightColor:"transparent"},
  btnRed:{background:COLORS.red+"1a",color:COLORS.red,border:`1px solid ${COLORS.red}33`,borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},
  btnAmber:{background:COLORS.amber+"1a",color:COLORS.amber,border:`1px solid ${COLORS.amber}33`,borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},
  input:{background:"#1e2d4a",border:"1px solid #2d3f5c",borderRadius:12,padding:"13px 16px",fontSize:15,color:COLORS.white,width:"100%",boxSizing:"border-box",outline:"none",marginBottom:14,transition:"border-color 0.15s",WebkitAppearance:"none"},
  label:{fontSize:15,color:COLORS.slate,marginBottom:10,display:"block",fontWeight:600,letterSpacing:"0.2px"},
  row:{display:"flex",gap:12},col:{flex:1},
  statGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10},
  statCell:(c)=>({background:COLORS.navyMid,border:`1px solid ${COLORS.navyLight}`,borderTop:`3px solid ${c}`,borderRadius:12,padding:"14px 8px",textAlign:"center"}),
  statVal:{fontSize:22,fontWeight:700,letterSpacing:"-0.3px"},
  statLbl:{fontSize:15,color:COLORS.slate,marginTop:3,fontWeight:500},
  nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:COLORS.navyMid,borderTop:`1px solid ${COLORS.navyLight}`,display:"flex",zIndex:20,paddingBottom:"env(safe-area-inset-bottom)"},
  navItem:(a)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 2px 8px",cursor:"pointer",background:"transparent",border:"none",color:a?COLORS.blue:COLORS.slate,fontSize:10,fontWeight:a?700:500,gap:3,borderTop:a?`2px solid ${COLORS.blue}`:"2px solid transparent",WebkitTapHighlightColor:"transparent",transition:"color 0.15s",letterSpacing:"-0.1px"}),
  modal:{position:"fixed",inset:0,background:"#000d",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  sheet:{background:COLORS.navyMid,borderRadius:"24px 24px 0 0",padding:"12px 20px 52px",width:"100%",maxWidth:430,maxHeight:"93vh",overflowY:"auto",animation:"slideUp 0.28s cubic-bezier(0.34,1.06,0.64,1)"},
  sheetHandle:{width:44,height:4,borderRadius:2,background:COLORS.navyLight,margin:"0 auto 18px"},
  sheetTitle:{fontSize:20,fontWeight:700,marginBottom:20,letterSpacing:"-0.3px"},
  chip:(a,c)=>({display:"inline-block",padding:"5px 13px",borderRadius:20,fontSize:15,fontWeight:600,cursor:"pointer",border:`1px solid ${a?c:COLORS.navyLight}`,background:a?c+"1a":"transparent",color:a?c:COLORS.slate,marginRight:6,marginBottom:10,WebkitTapHighlightColor:"transparent",transition:"all 0.12s"}),
  tabs:{display:"flex",background:COLORS.navyMid,borderRadius:12,padding:4,marginBottom:18,border:`1px solid ${COLORS.navyLight}`},
  tabBtn:(a)=>({flex:1,border:"none",borderRadius:9,padding:"9px 0",cursor:"pointer",background:a?COLORS.blue:"transparent",color:a?"#fff":COLORS.slate,fontSize:15,fontWeight:700,textTransform:"capitalize",transition:"all 0.15s",WebkitTapHighlightColor:"transparent",letterSpacing:"0.1px"}),
  empty:{textAlign:"center",padding:"48px 20px",color:COLORS.slate,fontSize:15},
  progress:{height:4,background:COLORS.navyLight,borderRadius:2,marginTop:10,overflow:"hidden"},
  progressFill:(pct,c)=>({height:"100%",width:`${Math.min(100,Math.max(0,pct))}%`,background:c,borderRadius:2,transition:"width 0.4s ease-out"}),
  gcBanner:{background:COLORS.blue+"15",border:`1px solid ${COLORS.blue}33`,borderRadius:16,padding:"16px 20px",marginBottom:16},
  swipeHint:{fontSize:15,color:COLORS.slate,textAlign:"center",marginBottom:10,letterSpacing:"0.3px"},
};

// - ICONS -
export const I={
  home:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  college:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  pool:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="10"/></svg>,
  finance:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  tasks:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  settings:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 00.36 1.98l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.8 1.8 0 0015 19.4a1.8 1.8 0 00-1 .6 1.8 1.8 0 00-.5 1.3V21a2 2 0 01-4 0v-.09A1.8 1.8 0 008.6 19.4a1.8 1.8 0 00-1.98.36l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.8 1.8 0 004.6 15a1.8 1.8 0 00-.6-1 1.8 1.8 0 00-1.3-.5H2.6a2 2 0 010-4h.09A1.8 1.8 0 004.6 8.6a1.8 1.8 0 00-.36-1.98l-.06-.06a2 2 0 012.83-2.83l.06.06A1.8 1.8 0 009 4.6a1.8 1.8 0 001-.6 1.8 1.8 0 00.5-1.3V2.6a2 2 0 014 0v.09A1.8 1.8 0 0015.4 4.6a1.8 1.8 0 001.98-.36l.06-.06a2 2 0 012.83 2.83l-.06.06A1.8 1.8 0 0019.4 9c.23.37.57.67 1 .8.25.08.51.11.76.1H21.4a2 2 0 010 4h-.09a1.8 1.8 0 00-1.91 1.1z"/></svg>,
  close:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 11-2.8-6.4L23 10"/></svg>,
  google:()=><svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
};

