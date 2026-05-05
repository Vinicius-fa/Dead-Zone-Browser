// HUD UPDATE
// ══════════════════════════════════════════════════════════════
function updateHUD(data){
  const me=data.players?.find(p=>p.id===myPeerId);
  if(!me)return;
  myBuildingId=me.buildingId;

  // Vitals
  document.getElementById('bar-hp').style.width=Math.max(0,me.hp)+'%';
  document.getElementById('val-hp').textContent=Math.max(0,me.hp);
  document.getElementById('bar-hp').style.background=me.hp>50?'linear-gradient(90deg,#990000,#cc0000)':me.hp>25?'linear-gradient(90deg,#804000,#cc6600)':'linear-gradient(90deg,#550000,#990000)';
  document.getElementById('bar-armor').style.width=Math.max(0,me.armor)+'%';
  document.getElementById('val-armor').textContent=Math.max(0,me.armor);
  const st=data.myStamina||0;
  document.getElementById('bar-stamina').style.width=(st/STAMINA_MAX*100)+'%';
  document.getElementById('val-stamina').textContent=Math.round(st);

  // Weapon
  const wpn=WEAPONS[me.weapon];
  document.getElementById('wpn-name').textContent=wpn?wpn.name:'PUNHOS';
  const ammoEl=document.getElementById('wpn-ammo');
  if(wpn&&!wpn.melee){
    const have=data.myAmmoInv?.[wpn.ammoType]||0;
    ammoEl.textContent=have;
    ammoEl.className='weapon-ammo'+(have===0?' empty':have<10?' low':'');
  }else{ammoEl.textContent='—';ammoEl.className='weapon-ammo';ammoEl.style.color='#444';}

  // Ammo stash
  const stash=document.getElementById('ammo-stash');
  stash.innerHTML=Object.entries(AMMO_TYPES).map(([k,v])=>{
    const have=data.myAmmoInv?.[k]||0;
    const active=wpn?.ammoType===k;
    return `<div class="ammo-pill ${active?'active':''}" style="${active?'border-color:#2a2a2a':''}" ><span class="ap-name">${v.name}</span><span class="ap-val">${have}/${v.max}</span></div>`;
  }).join('');

  // Phase
  const phLabel=document.getElementById('phase-label');
  phLabel.textContent=data.day?'🌅 DIA':'🌙 NOITE';
  phLabel.style.color=data.day?'#ffeaa7':'#a29bfe';
  document.getElementById('phase-fill').style.width=(data.dayProg*100)+'%';
  document.getElementById('phase-fill').style.background=data.day?'#ffeaa7':'#a29bfe';
  document.getElementById('hud-kills').textContent=me.kills+' KILLS';

  // Money
  const money=isHost?gameState.players[myPeerId]?.money||0:0;
  document.getElementById('hud-money').textContent='$'+(currentUser.money||0);

  // Scoreboard
  const sorted=[...data.players].sort((a,b)=>b.kills-a.kills);
  document.getElementById('sb-list').innerHTML=sorted.map(p=>{
    const isMe=p.id===myPeerId;
    const gc=getGangColor(p.gangId,data.gangs);
    return `<div class="sb-row ${isMe?'me':''} ${p.dead?'dead':''}"><span class="sb-name" style="color:${gc}">${p.username?.slice(0,11)||'?'}</span><span style="color:#333">${p.kills}💀</span></div>`;
  }).join('');

  // Gang
  const myGang=data.gangs?.find(g=>g.id===me.gangId);
  const gangBadgeName=document.getElementById('gang-badge-name');
  const gangDot=document.getElementById('gang-dot');
  if(myGang){gangBadgeName.textContent=myGang.name;gangDot.style.background=myGang.color;document.getElementById('gp-mine').textContent='⚔ '+myGang.name;document.getElementById('gp-mine').style.color=myGang.color;document.getElementById('gp-leave-btn').style.display='';}
  else{gangBadgeName.textContent='SEM GANGUE';gangDot.style.background='#333';document.getElementById('gp-mine').textContent='Sem gangue';document.getElementById('gp-mine').style.color='#2a2a2a';document.getElementById('gp-leave-btn').style.display='none';}

  // Gang list
  document.getElementById('gp-list').innerHTML=(data.gangs||[]).map(g=>
    `<div class="gp-entry" onclick="joinGang('${g.id}')"><span style="color:${g.color};font-size:.68rem">${g.name.slice(0,12)}</span><span style="color:#2a2a2a">${g.members}👤</span></div>`
  ).join('');
}

function getGangColor(gangId,gangs){const g=(gangs||[]).find(g=>g.id===gangId);return g?g.color:'#444';}

function showPhaseFlash(msg,isDay){
  const el=document.getElementById('phase-flash');
  el.textContent=msg;el.style.color=isDay?'#ffeaa7':'#c8a2ff';el.style.opacity='1';
  setTimeout(()=>el.style.opacity='0',3500);
}

