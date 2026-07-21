/* ================= STATE ================= */
const STORAGE_KEY = 'droidex-tracker-v1';
let state = { owned:{}, inBase:{}, targetRB:1, targetCycle:1, flawless:{}, wish:{} };
// owned[id] = [int x5] ou true pour iconic ; inBase[id] = bool ; flawless/wish[id] = bool
let filter = 'all';
let query = '';
let sortMode = 'rarity';
let saveTimer = null;

/* Exigences par droïde, dérivées de REBIRTHS : DROID_REQS[id][cycle] = [[rb, tier], …] */
const DROID_REQS = {};
Object.entries(REBIRTHS).forEach(([cyc, levels])=>{
  Object.entries(levels).forEach(([rb, reqs])=>{
    reqs.forEach(([id, tier])=>{
      const byCycle = DROID_REQS[id] = DROID_REQS[id] || {};
      (byCycle[cyc] = byCycle[cyc] || []).push([parseInt(rb,10), tier]);
    });
  });
});
const DROID_BY_ID = {};
DROIDS.forEach(d=>{ DROID_BY_ID[d.id] = d; });
/* Exigences du droïde dans le cycle visé (null si aucune) */
function reqsFor(d){
  const byCycle = DROID_REQS[d.id];
  return byCycle ? (byCycle[state.targetCycle] || null) : null;
}

function ownedTiers(id){
  const v = state.owned[id];
  return Array.isArray(v) ? v : [0,0,0,0,0,0];
}
/* états par variante : 0 = pas eu, 1 = possédé (Droidex), 2 = en base */
function meetsReq(id, tier){
  const o = ownedTiers(id);
  for(let i=tier;i<6;i++) if(o[i]>=1) return true;
  return false;
}
function inBaseReq(id, tier){
  const o = ownedTiers(id);
  for(let i=tier;i<6;i++) if(o[i]===2) return true;
  return false;
}
function hasAnyInBase(id){
  return ownedTiers(id).some(v=>v===2);
}
/* Un droïde est "à garder" s'il a au moins une exigence de rebirth >= cible (cycle visé) */
function keepInfo(d){
  const reqs = reqsFor(d);
  if(!reqs) return null;
  const future = reqs.filter(([rb])=>rb>=state.targetRB);
  if(!future.length) return null;
  return future;
}
/* Droïdes distincts possédés (bonus de collection : +1 % de revenus chacun) */
function distinctOwned(){
  return DROIDS.filter(d=> d.iconic ? state.owned[d.id]===true : ownedTiers(d.id).some(v=>v>=1)).length;
}
/* Formatage compact des revenus (972 -> "972", 8200 -> "8.2K") */
function fmtInc(n){
  if(n>=1000){ const k=Math.round(n/100)/10; return (k===Math.round(k)?Math.round(k):k)+'K'; }
  return String(n);
}

/* ================= STORAGE ================= */
/* Normalisation PURE d'un état brut (localStorage, import JSON ou sauvegarde
   serveur) vers le format courant, SANS toucher à l'entrée. Migrations :
   anciens booléens -> 0/1/2, promotion du toggle "en base" historique,
   padding à 6 variantes (v1.5.0, Galactique), CB-23 reclassé Iconique.
   Utilisée par applyParsedState ET par syncStatesEqual (sync.js) : comparer
   du non-migré à du migré ferait boucler le dialogue de conflit de synchro. */
function normalizeParsedState(parsed){
  const out = {
    owned: {},
    inBase: Object.assign({}, parsed.inBase || {}),
    targetRB: parsed.targetRB || 1,
    targetCycle: parsed.targetCycle || 1,
    flawless: Object.assign({}, parsed.flawless || {}),
    wish: Object.assign({}, parsed.wish || {})
  };
  const iconicIds = new Set(DROIDS.filter(d=>d.iconic).map(d=>d.id));
  Object.keys(parsed.owned || {}).forEach(id=>{
    const v = (parsed.owned || {})[id];
    if(Array.isArray(v) && !iconicIds.has(id)){
      const arr = v.map(x=>x===true?1:(typeof x==='number'?x:0));
      /* v1.5.0 : padding à 6 entrées (variante Galactique) */
      while(arr.length<6) arr.push(0);
      /* ancien toggle global "en base" -> promotion de la meilleure variante possédée */
      if(out.inBase[id]===true){
        for(let i=arr.length-1;i>=0;i--){ if(arr[i]>=1){ arr[i]=2; break; } }
        delete out.inBase[id];
      }
      out.owned[id] = arr;
    }else{
      out.owned[id] = v;
    }
  });
  /* migration : CB-23 reclassé Iconique (variantes -> possédé + en base) */
  const cb23 = out.owned.cb23;
  if(Array.isArray(cb23)){
    const arr = cb23.map(x=>x===true?1:(typeof x==='number'?x:0));
    if(arr.some(v=>v>=1)) out.owned.cb23 = true; else delete out.owned.cb23;
    if(arr.some(v=>v===2) || out.inBase.cb23===true) out.inBase.cb23 = true;
  }
  return out;
}
function applyParsedState(parsed){
  if(!(parsed && typeof parsed==='object')) return false;
  const n = normalizeParsedState(parsed);
  state.owned = n.owned;
  state.inBase = n.inBase;
  state.targetRB = n.targetRB;
  state.targetCycle = n.targetCycle;
  state.flawless = n.flawless;
  state.wish = n.wish;
  return true;
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) applyParsedState(JSON.parse(raw));
  }catch(e){ /* première utilisation ou JSON invalide : on garde l'état vide */ }
}
function persistState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  /* synchronisation de compte optionnelle (sync.js) */
  if(typeof syncNotifyLocalChange === 'function') syncNotifyLocalChange();
}
function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    const el = document.getElementById('saveState');
    try{
      persistState();
      el.textContent = t('saved');
      el.classList.remove('err');
    }catch(e){
      el.textContent = t('saveFailed');
      el.classList.add('err');
    }
  }, 400);
}

/* ================= EXPORT / IMPORT ================= */
function exportState(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'droidex-backup.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  const el = document.getElementById('saveState');
  el.textContent = t('exported');
  el.classList.remove('err');
}
function importStateFile(file){
  const el = document.getElementById('saveState');
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      if(!(parsed && typeof parsed==='object' && (parsed.owned || parsed.inBase || parsed.targetRB))){
        throw new Error('format');
      }
      const hasData = Object.keys(state.owned).length || Object.keys(state.inBase).length;
      if(hasData && !confirm(t('importConfirm'))) return;
      applyParsedState(parsed);
      persistState();
      renderAll();
      el.textContent = t('imported');
      el.classList.remove('err');
    }catch(e){
      el.textContent = t('importInvalid');
      el.classList.add('err');
    }
  };
  reader.onerror = ()=>{
    el.textContent = t('importUnreadable');
    el.classList.add('err');
  };
  reader.readAsText(file);
}

/* ================= RENDER ================= */
function renderRBPanel(){
  const sel = document.getElementById('rbSelect');
  if(!sel.options.length){
    const maxRB = Math.max(...Object.keys(REBIRTHS[1]).map(Number));
    for(let i=1;i<=maxRB;i++){
      const o=document.createElement('option');
      o.value=i;
      sel.appendChild(o);
    }
    sel.addEventListener('change',()=>{
      state.targetRB=parseInt(sel.value,10);
      scheduleSave();renderAll();
    });
  }
  [...sel.options].forEach((o,idx)=>{ o.textContent=t('rbShort')+' '+(idx+1); });
  sel.value=state.targetRB;

  const cyc = document.getElementById('cycleSelect');
  if(!cyc.options.length){
    for(let i=1;i<=4;i++){
      const o=document.createElement('option');
      o.value=i;
      cyc.appendChild(o);
    }
    cyc.addEventListener('change',()=>{
      state.targetCycle=parseInt(cyc.value,10);
      scheduleSave();renderAll();
    });
  }
  [...cyc.options].forEach((o,idx)=>{ o.textContent=t('cycleShort')+' '+(idx+1); });
  cyc.value=state.targetCycle;

  const reqsEl=document.getElementById('rbReqs');
  reqsEl.innerHTML='';
  const needed=((REBIRTHS[state.targetCycle]||{})[state.targetRB]||[])
    .map(([id,tier])=>({d:DROID_BY_ID[id],tier}));
  let ready=0;
  needed.forEach(({d,tier})=>{
    const owned=meetsReq(d.id,tier);
    const isReady=inBaseReq(d.id,tier);
    if(isReady) ready++;
    const row=document.createElement('div');
    row.className='rb-req '+(isReady?'met':(owned?'part':'unmet'));
    let icon,note;
    if(isReady){icon='✓';note=TIERS[tier]+' '+t('minInBase');}
    else if(owned){icon='⚠';note=TIERS[tier]+' '+t('minNotInBase');}
    else{icon='✗';note=TIERS[tier]+' '+t('minimum');}
    row.innerHTML='<span class="status">'+icon+'</span><span class="rq-name">'+d.n+'</span>'+
      '<span class="rq-note">'+note+'</span>';
    reqsEl.appendChild(row);
  });
  const badge=document.getElementById('readyBadge');
  const allReady=needed.length>0 && ready===needed.length;
  badge.textContent=allReady?t('rebirthReady'):t('readyCount', ready, needed.length);
  badge.classList.toggle('all',allReady);
  document.getElementById('rbCreditsBig').textContent=RB_CREDITS[state.targetRB]||'—';
  let note=t('credits');
  if(state.targetCycle===1 && RB_UNLOCKS[state.targetRB]) note+=' · '+t('unlocks', RB_UNLOCKS[state.targetRB]);
  document.getElementById('rbCredits').textContent=note;
}

function renderProgress(){
  let total=0,done=0,gal=0,galTotal=0;
  DROIDS.forEach(d=>{
    if(d.iconic){total+=1;if(state.owned[d.id]===true)done+=1;}
    else{
      const o=ownedTiers(d.id);
      /* le jeu n'inclut pas le Galactique dans le total Droidex (317) */
      total+=5;done+=o.slice(0,5).filter(v=>v>=1).length;
      galTotal+=1;if(o[5]>=1)gal+=1;
    }
  });
  const segs=document.getElementById('progressSegs');
  const lit=total?Math.round(done/total*10):0;
  [...segs.children].forEach((s,i)=>s.classList.toggle('on',i<lit));
  document.getElementById('progressLabel').textContent=String(done).padStart(3,'0')+'/'+total;
  document.getElementById('galacticCount').textContent=t('galacticCount', gal, galTotal);
  const n=distinctOwned();
  document.getElementById('collectionBonus').textContent=t('collectionBonus', n, n);
  renderLiveCcu();  /* relibellé aussi à la bascule de langue (renderAll) */
}

/* Joueurs en direct — Ecosystem API officielle d'Epic (peakCCU par tranches
   de 10 min, dernier point non-null). Échec réseau/API/hors-ligne : badge
   simplement caché, jamais d'erreur visible. */
const LIVE_CCU_URL='https://api.fortnite.com/ecosystem/v1/islands/7865-8305-9184/metrics/minute';
let liveCcu=null;
function renderLiveCcu(){
  const el=document.getElementById('liveCcu');
  el.hidden=liveCcu==null;
  if(liveCcu!=null) el.textContent=t('liveCcu', fmtInc(liveCcu));
}
function refreshLiveCcu(){
  if(typeof fetch==='undefined') return;
  fetch(LIVE_CCU_URL)
    .then(r=>r.ok?r.json():Promise.reject(new Error(r.status)))
    .then(d=>{
      const pts=(d.peakCCU||[]).filter(p=>typeof p.value==='number');
      liveCcu=pts.length?pts[pts.length-1].value:null;
      renderLiveCcu();
    })
    .catch(()=>{ liveCcu=null; renderLiveCcu(); });
}

const FILTER_DEFS=[['all','filterAll'],['keep','filterKeep'],['missing','filterMissing'],['base','filterBase'],['wish','filterWish'],['Worker','filterWorker'],['Astromech','filterAstromech'],['Battle','filterBattle']];
function countFor(f){
  const prev=filter; filter=f;
  const n=DROIDS.filter(droidMatches).length;
  filter=prev; return n;
}
function renderFilters(){
  ['filtersSide','filtersChips'].forEach(cid=>{
    const box=document.getElementById(cid);
    if(!box) return;
    box.innerHTML='';
    FILTER_DEFS.forEach(([f,key])=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='chip'+(filter===f?' active':'');
      b.dataset.filter=f;
      b.innerHTML='<span class="chip-label">'+t(key)+'</span><span class="chip-count">'+countFor(f)+'</span>';
      b.addEventListener('click',()=>{
        filter=f; renderFilters(); renderList();
        const nb=document.querySelector('#'+cid+' .chip[data-filter="'+f+'"]');
        if(nb) nb.focus();
      });
      box.appendChild(b);
    });
  });
}

function droidMatches(d){
  if(query && !d.n.toLowerCase().includes(query)) return false;
  if(filter==='all') return true;
  if(filter==='keep') return !!keepInfo(d);
  if(filter==='wish') return !!state.wish[d.id];
  if(filter==='base') return d.iconic ? !!state.inBase[d.id] : hasAnyInBase(d.id);
  if(filter==='missing'){
    const ki=keepInfo(d);
    return !!ki && ki.some(([,tier])=>!inBaseReq(d.id,tier));
  }
  return d.t===filter;
}

function renderList(){
  const list=document.getElementById('list');
  list.innerHTML='';
  let any=false;

  if(sortMode==='income'){
    /* liste à plat, triée par revenu Beskar décroissant (Iconiques en fin) */
    const ds=DROIDS.filter(droidMatches).slice().sort((a,b)=>{
      const av=a.inc?a.inc[4]:-1, bv=b.inc?b.inc[4]:-1;
      return bv-av;
    });
    if(ds.length){
      any=true;
      const sec=document.createElement('div');
      sec.className='rarity-section';
      sec.innerHTML='<div class="rarity-title">'+t('byIncome')+
        ' <span class="count">'+ds.length+'</span></div>';
      const cards=document.createElement('div');
      cards.className='cards';
      ds.forEach(d=>cards.appendChild(renderDroid(d)));
      sec.appendChild(cards);
      list.appendChild(sec);
    }
  }else RARITY_ORDER.forEach(rar=>{
    const ds=DROIDS.filter(d=>d.r===rar && droidMatches(d));
    if(!ds.length) return;
    any=true;
    const sec=document.createElement('div');
    sec.className='rarity-section';
    sec.innerHTML='<div class="rarity-title">'+RARITY_LABELS[rar]+
      ' <span class="count">'+ds.length+'</span></div>';
    const cards=document.createElement('div');
    cards.className='cards';
    ds.forEach(d=>cards.appendChild(renderDroid(d)));
    sec.appendChild(cards);
    list.appendChild(sec);
  });

  if(!any){
    const empty=document.createElement('div');
    empty.className='empty';
    empty.textContent=t('empty');
    list.appendChild(empty);
  }
}

function renderDroid(d){
  const ki=keepInfo(d);
  const hasUnmet=ki && ki.some(([,tier])=>!inBaseReq(d.id,tier));
  const card=document.createElement('div');
  card.className='droid'+(hasUnmet?' keep':'');

  let top='<div class="droid-top"><span class="droid-name">'+d.n+'</span>'+
    '<span class="type-ico t-'+d.t.toLowerCase()+'" role="img" aria-label="'+d.t+'" title="'+d.t+'"></span>'+
    '<span class="card-actions"></span>';
  if(ki) top+='<span class="keep-tag">'+t('keepTag')+'</span>';
  top+='</div>';

  let badges='';
  const reqs=reqsFor(d);
  if(reqs){
    badges='<div class="req-badges">'+reqs.map(([rb,tier])=>{
      const past=rb<state.targetRB;
      let cls,prefix='';
      if(past){cls=' done';}
      else if(inBaseReq(d.id,tier)){cls=' ready';prefix='✓ ';}
      else if(meetsReq(d.id,tier)){cls=' warn';prefix='⚠ ';}
      else{cls=' urgent';}
      return '<span class="req-badge'+cls+'">'+prefix+'RB'+rb+'·'+TIER_SHORT[tier]+'</span>';
    }).join('')+'</div>';
  }

  let value='';
  if(d.inc){
    value='<div class="value-line"><span class="ico-cred" aria-hidden="true"></span>'+fmtInc(d.inc[0])+'/s → '+fmtInc(d.inc[4])+'/s'+
      (d.bskCost?' <span class="dim">· BSK '+d.bskCost+'</span>':'')+
      (d.perk?' <span class="dim">· '+d.perk+'</span>':'')+'</div>';
  }else if(d.iconic){
    value='<div class="value-line"><span class="ico-cred" aria-hidden="true"></span>+15%/s'+(d.perk?' <span class="dim">· '+d.perk+'</span>':'')+'</div>';
  }

  card.innerHTML=top+badges+value;

  /* toggles wishlist ☆ et flawless ✦ */
  const actions=card.querySelector('.card-actions');
  const wishOn=!!state.wish[d.id];
  const wishBtn=document.createElement('button');
  wishBtn.type='button';
  wishBtn.className='icon-btn'+(wishOn?' on-wish':'');
  wishBtn.textContent=wishOn?'★':'☆';
  wishBtn.setAttribute('aria-label',t('wishAria')+' : '+d.n);
  wishBtn.setAttribute('aria-pressed',wishOn?'true':'false');
  wishBtn.title=t('wishTip');
  wishBtn.addEventListener('click',()=>{
    if(state.wish[d.id]) delete state.wish[d.id]; else state.wish[d.id]=true;
    scheduleSave();renderAll();
  });
  actions.appendChild(wishBtn);
  const flawOn=!!state.flawless[d.id];
  const flawBtn=document.createElement('button');
  flawBtn.type='button';
  flawBtn.className='icon-btn flaw'+(flawOn?' on-flaw':'');
  flawBtn.textContent='✦';
  flawBtn.setAttribute('aria-label',t('flawAria')+' : '+d.n);
  flawBtn.setAttribute('aria-pressed',flawOn?'true':'false');
  flawBtn.title=t('flawTip');
  flawBtn.addEventListener('click',()=>{
    if(state.flawless[d.id]) delete state.flawless[d.id]; else state.flawless[d.id]=true;
    scheduleSave();renderAll();
  });
  actions.appendChild(flawBtn);

  if(d.iconic){
    const btn=document.createElement('button');
    btn.type='button';
    const on=state.owned[d.id]===true;
    btn.className='iconic-own'+(on?' on':'');
    btn.innerHTML='<span class="lamp"></span><span>'+(on?t('owned'):t('notOwned'))+'</span>';
    btn.addEventListener('click',()=>{
      state.owned[d.id]=state.owned[d.id]===true?false:true;
      scheduleSave();renderAll();
    });

    const baseBtn=document.createElement('button');
    baseBtn.type='button';
    const inB=!!state.inBase[d.id];
    baseBtn.className='base-toggle'+(inB?' on':'');
    baseBtn.setAttribute('aria-pressed',inB?'true':'false');
    baseBtn.innerHTML='<span class="lamp"></span><span>'+(inB?t('inBase'):t('notInBase'))+'</span>';
    baseBtn.addEventListener('click',()=>{
      state.inBase[d.id]=!state.inBase[d.id];
      scheduleSave();renderAll();
    });

    const row=document.createElement('div');
    row.className='iconic-row';
    row.appendChild(btn);
    row.appendChild(baseBtn);
    card.appendChild(row);
  }else{
    const tiers=document.createElement('div');
    tiers.className='tiers';
    const o=ownedTiers(d.id);
    TIER_SHORT.forEach((label,i)=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='tier'+(o[i]>=1?' on':'')+(o[i]===2?' base':'');
      b.dataset.t=i;
      b.setAttribute('aria-label',d.n+' '+TIERS[i]+' : '+(o[i]===2?t('ariaInBase'):(o[i]===1?t('ariaOwned'):t('ariaAbsent'))));
      b.innerHTML='<span class="lamp"></span>'+label+(o[i]===2?BASE_ICON:'');
      b.addEventListener('click',()=>{
        const arr=ownedTiers(d.id).slice();
        arr[i]=(arr[i]+1)%3;
        state.owned[d.id]=arr;
        scheduleSave();renderAll();
      });
      tiers.appendChild(b);
    });
    card.appendChild(tiers);
  }
  return card;
}

function renderAll(){
  renderRBPanel();
  renderProgress();
  renderFilters();
  renderList();
  hintAutoClose();
}
/* fin de la phase d'apprentissage : dès HINT_LEARN_DROIDS droïdes distincts,
   l'aide se ferme d'elle-même (définitivement) */
function hintAutoClose(){
  try{
    if(!hintPanel.hidden && !localStorage.getItem('droidex-hint-seen') &&
       distinctOwned()>=HINT_LEARN_DROIDS){
      hintDismiss();
    }
  }catch(e){}
}

/* ================= EVENTS ================= */
document.getElementById('search').addEventListener('input',e=>{
  query=e.target.value.trim().toLowerCase();
  renderFilters();
  renderList();
});
document.getElementById('sortSelect').addEventListener('change',e=>{
  sortMode=e.target.value;
  renderList();
});
/* pastille « i » : l'infobulle title est invisible au tactile → le tap ouvre un encart */
const hintBtn=document.getElementById('hintI');
const hintPanel=document.getElementById('hintPanel');
function setHint(open){
  hintPanel.hidden=!open;
  hintBtn.setAttribute('aria-expanded',open?'true':'false');
}
/* phase d'apprentissage : l'aide reste affichée tant que l'utilisateur possède
   moins de HINT_LEARN_DROIDS droïdes distincts et ne l'a pas fermée lui-même */
const HINT_LEARN_DROIDS=30;
function hintDismiss(){
  setHint(false);
  try{ localStorage.setItem('droidex-hint-seen','1'); }catch(e){}
}
function hintLearning(){
  try{ return !localStorage.getItem('droidex-hint-seen') && distinctOwned()<HINT_LEARN_DROIDS; }
  catch(e){ return false; }
}
hintBtn.addEventListener('click',()=>{
  if(hintPanel.hidden) setHint(true); else hintDismiss();
});
document.addEventListener('click',e=>{
  if(!hintPanel.hidden && !hintLearning() && e.target!==hintBtn && !hintPanel.contains(e.target)){
    hintDismiss();
  }
});
document.getElementById('resetBtn').addEventListener('click',()=>{
  if(!confirm(t('resetConfirm'))) return;
  state={owned:{},inBase:{},targetRB:1,targetCycle:1,flawless:{},wish:{}};
  try{ persistState(); }catch(e){}
  renderAll();
});
function applySuperRebirth(){
  DROIDS.forEach(d=>{
    if(d.iconic){
      delete state.inBase[d.id];
    }else if(Array.isArray(state.owned[d.id])){
      state.owned[d.id]=state.owned[d.id].map(v=>v===2?1:v);
    }
  });
  state.targetRB=1;
  state.targetCycle=(state.targetCycle%4)+1;
}
document.getElementById('superRebirthBtn').addEventListener('click',()=>{
  if(!confirm(t('superRebirthConfirm'))) return;
  applySuperRebirth();
  try{ persistState(); }catch(e){}
  renderAll();
});
document.getElementById('exportBtn').addEventListener('click',exportState);
document.getElementById('importBtn').addEventListener('click',()=>{
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change',e=>{
  const file=e.target.files && e.target.files[0];
  if(file) importStateFile(file);
  e.target.value='';  // permet de réimporter le même fichier
});

/* ================= INIT ================= */
(function init(){
  loadState();
  document.getElementById('loading').style.display='none';
  document.getElementById('list').style.display='block';
  document.getElementById('appVersion').textContent='DROIDEX V'+APP_VERSION;
  renderAll();
  refreshLiveCcu();
  setInterval(refreshLiveCcu, 5*60*1000);
  /* premières visites : l'aide s'affiche d'office pendant la phase d'apprentissage —
     un « i » en bout de ligne ne serait jamais découvert par un nouvel utilisateur */
  if(hintLearning()) setHint(true);
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{ /* hors ligne au premier chargement : sans conséquence */ });
  }
})();
