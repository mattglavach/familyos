import { useEffect, useState } from "react";
const CACHE_MS=30*60*1000;
export function configuredWeatherLocation(settings={}) { const safe=settings||{}; return safe.weather_location || safe.location || safe.postal_code || safe.zip_code || ""; }
export function useGreetingWeather(settings) {
  const location=configuredWeatherLocation(settings); const [weather,setWeather]=useState(null);
  useEffect(()=>{ if(!location)return; const key=`familyos_weather:${location}`; try{const cached=JSON.parse(sessionStorage.getItem(key)||"null");if(cached&&Date.now()-cached.savedAt<CACHE_MS){setWeather(cached.data);return;}}catch{}
    const controller=new AbortController(); fetch(`/api/weather?location=${encodeURIComponent(location)}`,{signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(!data)return;setWeather(data);try{sessionStorage.setItem(key,JSON.stringify({savedAt:Date.now(),data}));}catch{}}).catch(()=>{}); return()=>controller.abort();
  },[location]); return weather;
}
