// CLIENT — Apply state from host
// ══════════════════════════════════════════════════════════════
let renderState={players:[],zombies:[],bullets:[],drops:[],gangs:[],day:true,dayProg:0,myAmmoInv:{},myStamina:100};
let prevState={players:[],zombies:[],bullets:[]};
let lastStateTime=0;

function applyServerState(data){
  prevState={players:[...renderState.players],zombies:[...renderState.zombies],bullets:[...renderState.bullets]};
  renderState={players:data.players||[],zombies:data.zombies||[],bullets:data.bullets||[],drops:data.drops||[],gangs:data.gangs||[],day:data.day,dayProg:data.dayProg,myAmmoInv:data.myAmmoInv||{},myStamina:data.myStamina||0};
  lastStateTime=performance.now();
  updateHUD(data);

  // Sync ammo for host directly from gameState
  if(isHost){
    const me=gameState.players[myPeerId];
    if(me)renderState.myAmmoInv={...me.ammoInv};
  }

  // Client: check nearby weapon drops to show pickup prompt
  if(!isHost){
    const me=renderState.players.find(p=>p.id===myPeerId);
    if(me){
      let found=null;
      for(const d of renderState.drops){
        if(WEAPONS[d.type]&&!WEAPONS[d.type].melee&&dist2({x:me.x,y:me.y},{x:d.x,y:d.y})<(PR+30)**2){found=d;break;}
      }
      if(found){
        if(myPendingPickup!==found.id){
          myPendingPickup=found.id;
          document.getElementById('pickup-wpn-name').textContent=WEAPONS[found.type].name;
          document.getElementById('hud-pickup').style.display='block';
        }
      }else{
        myPendingPickup=null;
        document.getElementById('hud-pickup').style.display='none';
      }
    }
  }
}

function applyEvent(data){
  if(data.ev==='phase'){showPhaseFlash(data.msg,data.isDay);}
  if(data.ev==='notify'){notify(data.msg);}
  if(data.ev==='playerDied'){
    if(data.id===myPeerId){openModal('modal-death');document.getElementById('death-msg').textContent=data.killer==='zombie'?`Devorado pelos zumbis • ${currentUser.kills} kills`:`Eliminado por ${data.killer} • ${currentUser.kills} kills`;}
    else notify(`💀 ${data.username} ${data.killer==='zombie'?'foi devorado':'foi eliminado por '+data.killer}`,true);
  }
}

