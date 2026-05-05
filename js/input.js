// INPUT
// ══════════════════════════════════════════════════════════════
const KMAP={w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
let gangModalOpen=false,shopModalOpen=false;

window.addEventListener('keydown',e=>{
  if(gangModalOpen||shopModalOpen)return;
  if(KMAP[e.key]){myKeys[KMAP[e.key]]=true;sendInput();}
  if(e.key==='Shift'){myKeys.sprint=true;sendInput();}
  if(e.key==='f'||e.key==='F'){if(myPendingPickup){if(isHost)hostPickupWeapon(myPeerId,myPendingPickup);else connections['host']?.send({type:'pickupWeapon',dropId:myPendingPickup});}}
  if(e.key==='g'||e.key==='G')openGangModal();
  if(e.key==='b'||e.key==='B')openShop();
  if(e.key==='Escape'){if(shopModalOpen)closeModal('modal-shop');else if(gangModalOpen)closeModal('modal-gang');}
});
window.addEventListener('keyup',e=>{
  if(KMAP[e.key]){myKeys[KMAP[e.key]]=false;sendInput();}
  if(e.key==='Shift'){myKeys.sprint=false;sendInput();}
});
canvas.addEventListener('mousemove',e=>{
  const me=renderState.players.find(p=>p.id===myPeerId);if(!me)return;
  myAim=Math.atan2(e.clientY-(me.y-camY),e.clientX-(me.x-camX));
  if(!isHost) sendInput(); // clients send aim continuously
});
canvas.addEventListener('mousedown',e=>{if(e.button===0){myMouseDown=true;tryShoot();}});
canvas.addEventListener('mouseup',e=>{if(e.button===0)myMouseDown=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
setInterval(()=>{
  if(!gameRunning)return;
  if(myMouseDown)tryShoot();
  sendInput(); // heartbeat so host always has latest keys
},50);

function tryShoot(){
  if(!gameRunning)return;
  const me=isHost?gameState.players[myPeerId]:null;
  const wpn=WEAPONS[me?.weapon||'fists']||{cd:12};
  const now=Date.now();if(now-myLastShot<(wpn.cd||12)*50)return;
  myLastShot=now;
  sendInput(true);
}

function sendInput(shoot=false){
  if(!gameRunning||!myPeerId)return;
  if(isHost){
    const p=gameState.players[myPeerId];
    if(p){p.keys={...myKeys};p.aimAngle=myAim;if(shoot)p.wantShoot=true;}
  }else{
    const conn=connections['host'];
    if(conn&&conn.open){
      conn.send({type:'input',keys:{...myKeys},aim:myAim,shoot});
    }
  }
}

