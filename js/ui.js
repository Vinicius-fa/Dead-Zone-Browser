// NAVIGATION
// ══════════════════════════════════════════════════════════════
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');}
function showJoinUI(){document.getElementById('join-ui').classList.remove('hidden');document.getElementById('join-code').focus();}
function hideJoinUI(){document.getElementById('join-ui').classList.add('hidden');}

function backToMenu(){
  stopGame();
  if(peer){peer.destroy();peer=null;}
  connections={};lobbyPlayers={};
  gameState={players:{},zombies:[],bullets:[],drops:[],gangs:{}};
  isHost=false;myPeerId=null;
  document.getElementById('modal-death').classList.add('hidden');
  document.getElementById('modal-shop').classList.add('hidden');
  document.getElementById('modal-gang').classList.add('hidden');
  shopOpen=false;gangModalOpen=false;
  showScreen('screen-menu');
  if(currentUser){
    document.getElementById('stat-kills').textContent=currentUser.kills;
    document.getElementById('stat-money').textContent=currentUser.money;
  }
}
function openModal(id){
  document.getElementById(id).classList.remove('hidden');
  if(id==='modal-gang') gangModalOpen=true;
  if(id==='modal-shop') shopModalOpen=true;
}
function closeModal(id){
  document.getElementById(id).classList.add('hidden');
  if(id==='modal-gang') gangModalOpen=false;
  if(id==='modal-shop') shopModalOpen=false;
  // Reset all keys so player doesn't get stuck moving
  myKeys={up:false,down:false,left:false,right:false,sprint:false};
  sendInput();
}
function openShop(){renderShop();document.getElementById('shop-bal').textContent='$'+currentUser.money;openModal('modal-shop');}
function openGangModal(){openModal('modal-gang');}

