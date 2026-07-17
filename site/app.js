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
  return Array.isArray(v) ? v : [0,0,0,0,0];
}
/* états par variante : 0 = pas eu, 1 = possédé (Droidex), 2 = en base */
function meetsReq(id, tier){
  const o = ownedTiers(id);
  for(let i=tier;i<5;i++) if(o[i]>=1) return true;
  return false;
}
function inBaseReq(id, tier){
  const o = ownedTiers(id);
  for(let i=tier;i<5;i++) if(o[i]===2) return true;
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
/* Normalise un état brut (localStorage ou import JSON) vers le format courant.
   Conserve la migration historique : anciens booléens -> états numériques 0/1/2. */
function applyParsedState(parsed){
  if(!(parsed && typeof parsed==='object')) return false;
  state.owned = parsed.owned || {};
  state.inBase = parsed.inBase || {};
  state.targetRB = parsed.targetRB || 1;
  state.targetCycle = parsed.targetCycle || 1;
  state.flawless = parsed.flawless || {};
  state.wish = parsed.wish || {};
  /* migration : anciens booléens -> états numériques 0/1/2 */
  const iconicIds = new Set(DROIDS.filter(d=>d.iconic).map(d=>d.id));
  Object.keys(state.owned).forEach(id=>{
    const v = state.owned[id];
    if(Array.isArray(v) && !iconicIds.has(id)){
      state.owned[id] = v.map(x=>x===true?1:(typeof x==='number'?x:0));
      /* ancien toggle global "en base" -> promotion de la meilleure variante possédée */
      if(state.inBase[id]===true){
        const arr = state.owned[id];
        for(let i=4;i>=0;i--){ if(arr[i]>=1){ arr[i]=2; break; } }
        delete state.inBase[id];
      }
    }
  });
  /* migration : CB-23 reclassé Iconique (variantes -> possédé + en base) */
  const cb23 = state.owned.cb23;
  if(Array.isArray(cb23)){
    const arr = cb23.map(x=>x===true?1:(typeof x==='number'?x:0));
    if(arr.some(v=>v>=1)) state.owned.cb23 = true; else delete state.owned.cb23;
    if(arr.some(v=>v===2) || state.inBase.cb23===true) state.inBase.cb23 = true;
  }
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
    for(let i=1;i<=27;i++){
      const o=document.createElement('option');
      o.value=i;
      sel.appendChild(o);
    }
    sel.addEventListener('change',()=>{
      state.targetRB=parseInt(sel.value,10);
      scheduleSave();renderAll();
    });
  }
  [...sel.options].forEach((o,idx)=>{ o.textContent=t('rebirth')+' '+(idx+1); });
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
  [...cyc.options].forEach((o,idx)=>{ o.textContent=t('cycle')+' '+(idx+1); });
  cyc.value=state.targetCycle;

  const reqsEl=document.getElementById('rbReqs');
  reqsEl.innerHTML='';
  const needed=((REBIRTHS[state.targetCycle]||{})[state.targetRB]||[])
    .map(([id,tier])=>({d:DROID_BY_ID[id],tier}));
  needed.forEach(({d,tier})=>{
    const owned=meetsReq(d.id,tier);
    const ready=inBaseReq(d.id,tier);
    const row=document.createElement('div');
    row.className='rb-req '+(ready?'met':'unmet');
    let icon,note;
    if(ready){icon='✓';note=TIERS[tier]+' '+t('minInBase');}
    else if(owned){icon='⚠';note=TIERS[tier]+' '+t('minNotInBase');}
    else{icon='✗';note=TIERS[tier]+' '+t('minimum');}
    row.innerHTML='<span class="status">'+icon+'</span>'+
      '<span>'+d.n+'</span>'+
      '<span class="req-tier" style="color:var(--sand-dim)">'+note+'</span>';
    reqsEl.appendChild(row);
  });
  let creditsLine=t('credits', RB_CREDITS[state.targetRB]||'—');
  if(state.targetCycle===1 && RB_UNLOCKS[state.targetRB]){
    creditsLine+=' · '+t('unlocks', RB_UNLOCKS[state.targetRB]);
  }
  document.getElementById('rbCredits').innerHTML=creditsLine;
}

function renderProgress(){
  let total=0,done=0;
  DROIDS.forEach(d=>{
    if(d.iconic){total+=1;if(state.owned[d.id]===true)done+=1;}
    else{total+=5;done+=ownedTiers(d.id).filter(v=>v>=1).length;}
  });
  const segs=document.getElementById('progressSegs');
  const lit=total?Math.round(done/total*10):0;
  [...segs.children].forEach((s,i)=>s.classList.toggle('on',i<lit));
  document.getElementById('progressLabel').textContent=String(done).padStart(3,'0')+'/'+total;
  const n=distinctOwned();
  document.getElementById('collectionBonus').textContent=t('collectionBonus', n, n);
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
      ds.forEach(d=>sec.appendChild(renderDroid(d)));
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
    ds.forEach(d=>sec.appendChild(renderDroid(d)));
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
    '<span class="droid-type">'+d.t+'</span>'+
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
      return '<span class="req-badge'+cls+'">'+prefix+'RB'+rb+' · '+TIERS[tier]+'</span>';
    }).join('')+'</div>';
  }

  let value='';
  if(d.inc){
    value='<div class="value-line">💰 '+fmtInc(d.inc[0])+'/s → '+fmtInc(d.inc[4])+'/s'+
      (d.bskCost?' <span class="dim">· BSK '+d.bskCost+'</span>':'')+
      (d.perk?' <span class="dim">· '+d.perk+'</span>':'')+'</div>';
  }else if(d.iconic){
    value='<div class="value-line">💰 +15%/s'+(d.perk?' <span class="dim">· '+d.perk+'</span>':'')+'</div>';
  }

  card.innerHTML=top+badges+value;

  /* toggles wishlist ☆ et flawless ✨ */
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
  flawBtn.textContent='✨';
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
    card.appendChild(btn);
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
      b.innerHTML='<span class="lamp"></span>'+(o[i]===2?BASE_ICON:label);
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

  if(d.iconic){
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
    card.appendChild(baseBtn);
  }
  return card;
}

function renderAll(){
  renderRBPanel();
  renderProgress();
  renderList();
}

/* ================= EVENTS ================= */
document.querySelectorAll('.chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    filter=chip.dataset.filter;
    renderList();
  });
});
document.getElementById('search').addEventListener('input',e=>{
  query=e.target.value.trim().toLowerCase();
  renderList();
});
document.getElementById('sortSelect').addEventListener('change',e=>{
  sortMode=e.target.value;
  renderList();
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
  document.getElementById('appVersion').textContent='Droidex v'+APP_VERSION;
  renderAll();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{ /* hors ligne au premier chargement : sans conséquence */ });
  }
})();
