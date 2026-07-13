import { useEffect, useState } from "react";
const CACHE_MS=30*60*1000;
export function configuredWeatherLocation(settings={}) { const safe=settings||{},location=safe.location||{}; return location.display_label||[location.city,location.region||location.state,location.postal_code,location.country].filter(Boolean).join(", ")||safe.weather_location||safe.postal_code||safe.zip_code||"Ravenel, South Carolina"; }
export function useGreetingWeather(settings) {
  const location=configuredWeatherLocation(settings),coordinates=settings?.location||{}; const [weather,setWeather]=useState(null);
  useEffect(()=>{ if(!location)return; const key=`familyos_weather:${location}`; try{const cached=JSON.parse(sessionStorage.getItem(key)||"null");if(cached&&Date.now()-cached.savedAt<CACHE_MS){setWeather(cached.data);return;}}catch{}
    const controller=new AbortController(),params=new URLSearchParams({location});if(Number.isFinite(Number(coordinates.latitude)))params.set("latitude",coordinates.latitude);if(Number.isFinite(Number(coordinates.longitude)))params.set("longitude",coordinates.longitude);fetch(`/api/weather?${params}`,{signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(!data)return;setWeather(data);try{sessionStorage.setItem(key,JSON.stringify({savedAt:Date.now(),data}));}catch{}}).catch(()=>{}); return()=>controller.abort();
  },[coordinates.latitude,coordinates.longitude,location]); return weather;
}
