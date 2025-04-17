// ==UserScript==
// @name         TheTVDB → Sonarr (Detail + Search Inline, Popup Status + Logs, Error Fix)
// @namespace    http://tampermonkey.net/
// @version      1.17
// @description  Fügt auf thetvdb.com "Add to Sonarr"‑Buttons
// @match        https://thetvdb.com/series/*
// @match        https://thetvdb.com/search*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Sonarr-Script] Script gestartet auf', location.href);

    // ─── KONFIGURATION ──────────────────────────────────────────────────────────
    const SONARR_URL         = 'http://localhost:8989';
    const SONARR_API_KEY     = 'DEIN_SONARR_API_KEY';
    const QUALITY_PROFILE_ID = 1;
    const ROOT_FOLDER_PATH   = '/tv';
    const MONITORED          = true;
    const SEASON_FOLDER      = true;
    const ADD_OPTIONS = {
        searchForMissingEpisodes: true,
        ignoreEpisodesWithFiles: false,
        ignoreEpisodesWithoutFiles: false
    };

    // ─── Overlay für Statusanzeige ───────────────────────────────────────────────
    function createOverlay() {
        let overlay = document.getElementById('sonarr-overlay');
        if (overlay) return overlay;
        console.log('[Sonarr-Script] createOverlay');
        overlay = document.createElement('div'); overlay.id = 'sonarr-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top:0, left:0, right:0, bottom:0,
            background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000
        });
        const popup = document.createElement('div'); popup.id='sonarr-popup';
        Object.assign(popup.style, {
            display:'flex', flexDirection:'column', alignItems:'center', padding:'20px', background:'#000', borderRadius:'10px'
        });
        const circle=document.createElement('div'); circle.id='sonarr-circle';
        Object.assign(circle.style, { width:'80px', height:'80px', borderRadius:'50%', background:'#7BBD42', marginBottom:'15px', animation:'sonarr-pulse 1s ease-out infinite' });
        const text=document.createElement('div'); text.id='sonarr-text';
        Object.assign(text.style, { fontSize:'18px', color:'#fff' });
        popup.append(circle,text); overlay.append(popup); document.body.append(overlay);
        const style=document.createElement('style');
        style.textContent='@keyframes sonarr-pulse{0%{transform:scale(1);}50%{transform:scale(1.2);}100%{transform:scale(1);}}';
        document.head.append(style);
        return overlay;
    }
    function showOverlay(message) {
        console.log('[Sonarr-Script] showOverlay:',message);
        const ov=createOverlay();
        ov.querySelector('#sonarr-circle').style.background='#7BBD42';
        ov.querySelector('#sonarr-text').textContent=message;
        ov.style.display='flex';
    }
    function updateOverlay(message,success) {
        console.log('[Sonarr-Script] updateOverlay:',message,'success=',success);
        const ov=document.getElementById('sonarr-overlay'); if(!ov)return;
        const circle=ov.querySelector('#sonarr-circle'); circle.style.animation='none';
        circle.style.background=success? '#4CAF50':'#E53935';
        ov.querySelector('#sonarr-text').textContent=message;
        setTimeout(()=>{ ov.style.display='none'; console.log('[Sonarr-Script] overlay hidden'); }, success?2000:5000);
    }

    // ─── Sonarr Lookup & Add mit Popup und Logs ───────────────────────────────────
    function lookupAndAdd(tvdbId) {
        console.log('[Sonarr-Script] lookupAndAdd for TVDB ID',tvdbId);
        showOverlay('Adding to Sonarr...');
        const lookupUrl=`${SONARR_URL}/api/v3/series/lookup?term=tvdb:${tvdbId}&apikey=${SONARR_API_KEY}`;
        console.log('[Sonarr-Script] Lookup URL:',lookupUrl);
        GM_xmlhttpRequest({method:'GET',url:lookupUrl,
            onload(res){
                console.log('[Sonarr-Script] Lookup status',res.status);
                if(res.status!==200) return updateOverlay(`Lookup failed (${res.status})`,false);
                let results; try{results=JSON.parse(res.responseText);}catch(e){console.error('[Sonarr-Script] parse error',e); return updateOverlay('Invalid lookup response',false);}
                console.log('[Sonarr-Script] Results',results);
                if(!results.length) return updateOverlay('Series not found',false);
                const series=results[0];
                series.qualityProfileId=QUALITY_PROFILE_ID;
                series.rootFolderPath=ROOT_FOLDER_PATH;
                series.monitored=MONITORED;
                series.seasonFolder=SEASON_FOLDER;
                series.addOptions=ADD_OPTIONS;
                const addUrl=`${SONARR_URL}/api/v3/series?apikey=${SONARR_API_KEY}`;
                console.log('[Sonarr-Script] Add URL:',addUrl,'Payload:',series);
                GM_xmlhttpRequest({method:'POST',url:addUrl,headers:{'Content-Type':'application/json'},data:JSON.stringify(series),
                    onload(res2){
                        console.log('[Sonarr-Script] Add status',res2.status,'resp',res2.responseText);
                        if(res2.status===201){ updateOverlay('Added successfully',true);
                        } else {
                            let err;
                            try{ const data=JSON.parse(res2.responseText);
                                if(Array.isArray(data)&&data[0]?.errorMessage) err=data[0].errorMessage;
                                else if(data.message) err=data.message;
                                else err=res2.statusText||res2.status;
                            }catch(e){console.error('[Sonarr-Script] parse add err',e); err=res2.statusText||res2.status;}
                            updateOverlay(`Error: ${err}`,false);
                        }
                    },
                    onerror(e){console.error('[Sonarr-Script] network add err',e); updateOverlay('Network error adding series',false);}
                });
            },
            onerror(e){console.error('[Sonarr-Script] network lookup err',e); updateOverlay('Network error during lookup',false);}
        });
    }

    // ─── Button & Label für Detail/Search mit Logs und Klickbarkeit ─────────────
    function createAddElements(tvdbId) {
        console.log('[Sonarr-Script] createAddElements for ID',tvdbId);
        const clickHandler=()=>lookupAndAdd(tvdbId);
        const btn=document.createElement('button'); btn.textContent='+';
        Object.assign(btn.style,{marginLeft:'8px',padding:'2px 6px',fontSize:'14px',background:'#7BBD42',color:'white',border:'none',borderRadius:'3px',cursor:'pointer',verticalAlign:'middle'});
        btn.addEventListener('click',clickHandler);
        const label=document.createElement('span'); label.textContent=' Add to Sonarr';
        Object.assign(label.style,{marginLeft:'4px',fontSize:'14px',verticalAlign:'middle',fontWeight:'bold',cursor:'pointer'});
        label.addEventListener('click',clickHandler);
        return {btn,label};
    }
    function insertAfter(target,btn,label){ const p=target.parentNode; p.insertBefore(btn,target.nextSibling); p.insertBefore(label,btn.nextSibling); }

    // ─── Hauptfluss: Detailseite & Suchseite ────────────────────────────────────
    if(/^\/series\//.test(location.pathname)){
        console.log('[Sonarr-Script] Detail page detected');
        let tvdbId; const preload=document.querySelector('script#__PRELOADED_STATE__');
        if(preload) try{tvdbId=JSON.parse(preload.textContent).series.id; console.log('[Sonarr-Script] ID preloaded',tvdbId);}catch{}
        if(!tvdbId){ const ld=document.querySelector('script[type="application/ld+json"]'); if(ld)try{const m=JSON.parse(ld.textContent).identifier.match(/\/series\/(\d+)/);tvdbId=+m[1];console.log('[Sonarr-Script] ID JSON-LD',tvdbId);}catch{} }
        if(!tvdbId){ document.querySelectorAll('#series_basic_info .list-group-item').forEach(li=>{ if(li.querySelector('strong')?.textContent.trim()==='TheTVDB.com Series ID'){tvdbId=+li.querySelector('span').textContent.trim();console.log('[Sonarr-Script] ID DOM',tvdbId);} }); }
        if(tvdbId){ const titleEl=document.querySelector('h1'); const{btn,label}=createAddElements(tvdbId); insertAfter(titleEl,btn,label); console.log('[Sonarr-Script] Detail button inserted'); } else console.warn('[Sonarr-Script] TVDB ID not found');
    }
    if(/^\/search/.test(location.pathname)){
        console.log('[Sonarr-Script] Search page detected');
        const obs=new MutationObserver(()=>{ document.querySelectorAll('a[href*="/series/"]').forEach(link=>{ if(link.classList.contains('sonarr-processed'))return; const meta=link.nextElementSibling; if(!meta)return; const m=meta.textContent.match(/Series\s+#(\d+)/); if(!m)return; const tvdbId=+m[1]; console.log('[Sonarr-Script] Found search ID',tvdbId); const{btn,label}=createAddElements(tvdbId); insertAfter(link,btn,label); link.classList.add('sonarr-processed'); console.log(`[Sonarr-Script] Search button for TVDB#${tvdbId} inserted`); }); }); obs.observe(document.body,{childList:true,subtree:true}); console.log('[Sonarr-Script] Initial search observer set'); }
})();
