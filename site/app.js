/* ================= STATE ================= */
const STORAGE_KEY = 'droidex-tracker-v1';
let state = { owned:{}, inBase:{}, targetRB:1 };  // owned[id] = [int x5] ou true pour iconic ; inBase[id] = bool
let filter = 'all';
let query = '';
let saveTimer = null;

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
/* Un droïde est "à garder" s'il a au moins une exigence de rebirth >= cible */
function keepInfo(d){
  if(!d.reqs) return null;
  const future = d.reqs.filter(([rb])=>rb>=state.targetRB);
  if(!future.length) return null;
  return future;
}

/* ================= STORAGE ================= */
/* Normalise un état brut (localStorage ou import JSON) vers le format courant.
   Conserve la migration historique : anciens booléens -> états numériques 0/1/2. */
function applyParsedState(parsed){
  if(!(parsed && typeof parsed==='object')) return false;
  state.owned = parsed.owned || {};
  state.inBase = parsed.inBase || {};
  state.targetRB = parsed.targetRB || 1;
  /* migration : anciens booléens -> états numériques 0/1/2 */
  const iconicIds = new Set(DROIDS.filter(d=>d.iconic).map(d=>d.id));
  Object.keys(state.owned).forEach(id=>{
    const v = state.owned[id];
    if(Array.isArray(v)){
      state.owned[id] = v.map(x=>x===true?1:(typeof x==='number'?x:0));
      /* ancien toggle global "en base" -> promotion de la meilleure variante possédée */
      if(state.inBase[id]===true && !iconicIds.has(id)){
        const arr = state.owned[id];
        for(let i=4;i>=0;i--){ if(arr[i]>=1){ arr[i]=2; break; } }
        delete state.inBase[id];
      }
    }
  });
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
      el.textContent = 'Registre sauvegardé';
      el.classList.remove('err');
    }catch(e){
      el.textContent = 'Échec de sauvegarde — réessaie';
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
  el.textContent = 'Sauvegarde exportée (droidex-backup.json)';
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
      if(hasData && !confirm('Remplacer le registre actuel par le contenu du fichier importé ?')) return;
      applyParsedState(parsed);
      persistState();
      renderAll();
      el.textContent = 'Registre importé';
      el.classList.remove('err');
    }catch(e){
      el.textContent = 'Fichier invalide — export Droidex attendu';
      el.classList.add('err');
    }
  };
  reader.onerror = ()=>{
    el.textContent = 'Lecture du fichier impossible';
    el.classList.add('err');
  };
  reader.readAsText(file);
}

/* ================= RENDER ================= */
function renderRBPanel(){
  const sel = document.getElementById('rbSelect');
  if(!sel.options.length){
    for(let i=1;i<=23;i++){
      const o=document.createElement('option');
      o.value=i;o.textContent='Renaissance '+i;
      sel.appendChild(o);
    }
    sel.addEventListener('change',()=>{
      state.targetRB=parseInt(sel.value,10);
      scheduleSave();renderAll();
    });
  }
  sel.value=state.targetRB;

  const reqsEl=document.getElementById('rbReqs');
  reqsEl.innerHTML='';
  const needed=[];
  DROIDS.forEach(d=>{
    (d.reqs||[]).forEach(([rb,tier])=>{
      if(rb===state.targetRB) needed.push({d,tier});
    });
  });
  needed.forEach(({d,tier})=>{
    const owned=meetsReq(d.id,tier);
    const ready=inBaseReq(d.id,tier);
    const row=document.createElement('div');
    row.className='rb-req '+(ready?'met':'unmet');
    let icon,note;
    if(ready){icon='✓';note=TIERS[tier]+' min · en base';}
    else if(owned){icon='⚠';note=TIERS[tier]+' min · pas en base';}
    else{icon='✗';note=TIERS[tier]+' minimum';}
    row.innerHTML='<span class="status">'+icon+'</span>'+
      '<span>'+d.n+'</span>'+
      '<span class="req-tier" style="color:var(--sand-dim)">'+note+'</span>';
    reqsEl.appendChild(row);
  });
  document.getElementById('rbCredits').innerHTML=
    'Crédits requis : <b>'+(RB_CREDITS[state.targetRB]||'—')+'</b> · une variante supérieure valide toujours l’exigence';
}

function renderProgress(){
  let total=0,done=0;
  DROIDS.forEach(d=>{
    if(d.iconic){total+=1;if(state.owned[d.id]===true)done+=1;}
    else{total+=5;done+=ownedTiers(d.id).filter(v=>v>=1).length;}
  });
  const pct=total?Math.round(done/total*100):0;
  document.getElementById('progressFill').style.width=pct+'%';
  document.getElementById('progressLabel').textContent=done+' / '+total+' variantes';
}

function droidMatches(d){
  if(query && !d.n.toLowerCase().includes(query)) return false;
  if(filter==='all') return true;
  if(filter==='keep') return !!keepInfo(d);
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

  RARITY_ORDER.forEach(rar=>{
    const ds=DROIDS.filter(d=>d.r===rar && droidMatches(d));
    if(!ds.length) return;
    any=true;
    const sec=document.createElement('div');
    sec.className='rarity-section';
    sec.innerHTML='<div class="rarity-title">'+RARITY_FR[rar]+
      ' <span class="count">'+ds.length+'</span></div>';
    ds.forEach(d=>sec.appendChild(renderDroid(d)));
    list.appendChild(sec);
  });

  if(!any){
    list.innerHTML='<div class="empty">Aucun droïde ne correspond. Modifie la recherche ou le filtre.</div>';
  }
}

function renderDroid(d){
  const ki=keepInfo(d);
  const hasUnmet=ki && ki.some(([,tier])=>!inBaseReq(d.id,tier));
  const card=document.createElement('div');
  card.className='droid'+(hasUnmet?' keep':'');

  let top='<div class="droid-top"><span class="droid-name">'+d.n+'</span>'+
    '<span class="droid-type">'+d.t+'</span>';
  if(ki) top+='<span class="keep-tag">À garder</span>';
  top+='</div>';

  let badges='';
  if(d.reqs){
    badges='<div class="req-badges">'+d.reqs.map(([rb,tier])=>{
      const past=rb<state.targetRB;
      let cls,prefix='';
      if(past){cls=' done';}
      else if(inBaseReq(d.id,tier)){cls=' ready';prefix='✓ ';}
      else if(meetsReq(d.id,tier)){cls=' warn';prefix='⚠ ';}
      else{cls=' urgent';}
      return '<span class="req-badge'+cls+'">'+prefix+'RB'+rb+' · '+TIERS[tier]+'</span>';
    }).join('')+'</div>';
  }

  card.innerHTML=top+badges;

  if(d.iconic){
    const btn=document.createElement('button');
    btn.type='button';
    const on=state.owned[d.id]===true;
    btn.className='iconic-own'+(on?' on':'');
    btn.innerHTML='<span class="lamp"></span><span>'+(on?'Possédé':'Non possédé')+'</span>';
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
      b.setAttribute('aria-label',d.n+' '+TIERS[i]+' : '+(o[i]===2?'en base':(o[i]===1?'possédé':'absent')));
      b.innerHTML='<span class="lamp"></span>'+(o[i]===2?'🏠':label);
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
    baseBtn.innerHTML='<span class="lamp"></span><span>'+(inB?'En base':'Pas en base')+'</span>';
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
document.getElementById('resetBtn').addEventListener('click',()=>{
  if(!confirm('Effacer tout le registre ? Cette action est définitive.')) return;
  state={owned:{},inBase:{},targetRB:1};
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
  renderAll();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{ /* hors ligne au premier chargement : sans conséquence */ });
  }
})();
