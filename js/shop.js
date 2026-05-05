// GANG & SHOP UI
// ══════════════════════════════════════════════════════════════
let selectedGangColor=GANG_COLORS[0];
function buildColorGrid(){
  document.getElementById('color-grid').innerHTML=GANG_COLORS.map((c,i)=>
    `<div class="cpick ${i===0?'sel':''}" style="background:${c}" onclick="pickColor('${c}',this)"></div>`).join('');
}
window.pickColor=function(c,el){selectedGangColor=c;document.querySelectorAll('.cpick').forEach(e=>e.classList.remove('sel'));el.classList.add('sel');};
window.openGangModal=function(){gangModalOpen=true;openModal('modal-gang');};
document.getElementById('modal-gang').addEventListener('click',e=>{if(e.target===document.getElementById('modal-gang'))closeModal('modal-gang');});

function createGang(){
  const name=document.getElementById('gang-name-inp').value.trim();
  if(!name){notify('Digite o nome!',true);return;}
  if(isHost)hostCreateGang(myPeerId,name,selectedGangColor);
  else connections['host']?.send({type:'createGang',name,color:selectedGangColor});
  closeModal('modal-gang');
}
window.createGang=createGang;

window.joinGang=function(id){
  if(isHost)hostJoinGang(myPeerId,id);else connections['host']?.send({type:'joinGang',gangId:id});
};
function leaveGang(){
  if(isHost)hostLeaveGang(myPeerId);else connections['host']?.send({type:'leaveGang'});
}
window.leaveGang=leaveGang;

function renderShop(){
  document.getElementById('skin-grid').innerHTML=Object.entries(SKINS).map(([k,s])=>{
    const owned=currentUser.unlockedSkins?.includes(k)||k==='default';
    const equipped=currentUser.skin===k;
    return `<div class="skin-card ${owned?'owned':''} ${equipped?'equipped':''}" onclick="buySkin('${k}')">
      <div class="skin-dot" style="background:${s.color};border-color:${s.color}44"></div>
      <div class="skin-label">${s.name}</div>
      <div class="skin-price">${s.cost===0?'GRÁTIS':'$'+s.cost}</div>
      ${equipped?'<span class="skin-tag" style="background:var(--gold);color:#000">EQUIPADO</span>':owned?'<span class="skin-tag" style="background:#1e90ff;color:#fff">DONO</span>':''}
    </div>`;
  }).join('');
}
window.buySkin=function(k){
  const s=SKINS[k];if(!s)return;
  const owned=currentUser.unlockedSkins?.includes(k)||k==='default';
  if(!owned){if(currentUser.money<s.cost){notify('Dinheiro insuficiente!',true);return;}currentUser.money-=s.cost;if(!currentUser.unlockedSkins)currentUser.unlockedSkins=[];currentUser.unlockedSkins.push(k);}
  currentUser.skin=k;
  if(gameRunning){const p=gameState.players[myPeerId];if(p)p.skin=k;}
  saveProgress();renderShop();renderAvatar();document.getElementById('shop-bal').textContent='$'+currentUser.money;notify('🎨 Skin equipada!',false,true);
};

window.openShop=function(){shopModalOpen=true;renderShop();document.getElementById('shop-bal').textContent='$'+currentUser.money;openModal('modal-shop');};
document.getElementById('close-shop').onclick=()=>closeModal('modal-shop');

function respawn(){
  closeModal('modal-death');
  if(isHost)hostRespawn(myPeerId);else connections['host']?.send({type:'respawn'});
}
window.respawn=respawn;

