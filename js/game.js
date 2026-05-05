// HOST TICK (game logic — only runs on host)
// ══════════════════════════════════════════════════════════════
function hostTick(){
  gameTick++;
  const cycleT=gameTick%CYCLE;
  const isDay=cycleT<DAY_DUR;
  const prog=isDay?cycleT/DAY_DUR:(cycleT-DAY_DUR)/NIGHT_DUR;
  const ZP=isDay?DAY_Z:NIGHT_Z;

  if(cycleT===0)        hostBroadcast({type:'event',ev:'phase',isDay:true, msg:'🌅 AMANHECEU — zumbis recuam...'});
  if(cycleT===DAY_DUR)  hostBroadcast({type:'event',ev:'phase',isDay:false,msg:'🌙 ANOITECEU — eles vêm em massa!'});
  if(cycleT===DAY_DUR-200) hostBroadcast({type:'event',ev:'phase',isDay:true,msg:'⚠ A noite se aproxima!'});

  // Spawn zombies
  const alivePl=Object.values(gameState.players).filter(p=>!p.dead&&p.hp>0);
  if(gameTick%ZP.spawnEvery===0&&gameState.zombies.length<ZP.maxZ&&alivePl.length>0){
    for(let i=0;i<ZP.spawnCount;i++){
      if(gameState.zombies.length>=ZP.maxZ)break;
      const pos=edgePos();
      gameState.zombies.push({id:uid(),x:pos.x,y:pos.y,hp:ZP.hp,maxHp:ZP.hp,speed:ZP.spd,dmg:ZP.dmg,atkCd:0});
    }
  }
  if(!isDay&&gameTick%380===0&&gameState.drops.length<MAX_DROPS){
    const p=safeSpawn();const t=ITEM_D_NIGHT[Math.floor(Math.random()*ITEM_D_NIGHT.length)];
    if(WEAPONS[t])spawnWeaponDrop(p.x,p.y,t);else spawnDrop(p.x,p.y,t);
  }

  // Zombie AI
  for(const z of gameState.zombies){
    if(!alivePl.length)break;
    let target=alivePl[0],best=dist2(z,target);
    for(const p of alivePl){const d=dist2(z,p);if(d<best){best=d;target=p;}}
    if(z.atkCd>0)z.atkCd--;
    if(Math.sqrt(best)<ZR+PR){
      if(z.atkCd===0){
        let dmg=z.dmg;if(target.armor>0){const ab=Math.min(target.armor,dmg*.5);target.armor-=ab;dmg-=ab;}
        target.hp=Math.max(0,target.hp-dmg);z.atkCd=ZMB_ATK_CD;
        if(target.hp===0){
          target.dead=true;
          currentUser.deaths++;saveProgress();
          const ev={type:'event',ev:'playerDied',id:target.id,username:target.username,killer:'zombie'};
          hostBroadcast(ev);applyEvent(ev);
        }
      }
    }else{
      const ang=Math.atan2(target.y-z.y,target.x-z.x);
      const nx=z.x+Math.cos(ang)*z.speed,ny=z.y+Math.sin(ang)*z.speed;
      if(!circleWall(nx,z.y,ZR)&&nx>0&&nx<MAP_W)z.x=nx;
      if(!circleWall(z.x,ny,ZR)&&ny>0&&ny<MAP_H)z.y=ny;
    }
  }

  // Bullets
  gameState.bullets=gameState.bullets.filter(b=>{
    b.x+=b.vx;b.y+=b.vy;b.ttl--;
    if(b.ttl<=0||b.x<0||b.x>MAP_W||b.y<0||b.y>MAP_H)return false;
    if(circleWall(b.x,b.y,BR))return false;
    // Hit zombies
    for(let i=gameState.zombies.length-1;i>=0;i--){
      const z=gameState.zombies[i];
      if(dist2(b,z)<(BR+ZR)**2){
        z.hp-=b.dmg;
        if(z.hp<=0){
          zombieDrop(z.x,z.y,isDay);gameState.zombies.splice(i,1);
          const owner=gameState.players[b.ownerId];
          if(owner){const money=isDay?Math.floor(rnd(5,15)):Math.floor(rnd(15,35));owner.money+=money;owner.kills++;if(owner.gangId&&gameState.gangs[owner.gangId])gameState.gangs[owner.gangId].kills++;if(owner.id===myPeerId){currentUser.kills++;currentUser.money=owner.money;}}
        }
        return false;
      }
    }
    // PvP
    for(const p of alivePl){
      if(p.id===b.ownerId)continue;
      if(b.ownerGangId&&p.gangId&&b.ownerGangId===p.gangId)continue; // friendly fire off
      if(dist2(b,p)<(BR+PR)**2){
        let dmg=b.dmg;if(p.armor>0){const ab=Math.min(p.armor,dmg*.4);p.armor-=ab;dmg-=ab;}
        p.hp=Math.max(0,p.hp-dmg);
        if(p.hp===0){
          p.dead=true;if(p.id===myPeerId)currentUser.deaths++;
          const killer=gameState.players[b.ownerId];
          if(killer){killer.kills++;killer.money+=50;if(killer.id===myPeerId){currentUser.kills++;currentUser.money=killer.money;}}
          const ev={type:'event',ev:'playerDied',id:p.id,username:p.username,killer:killer?killer.username:'Desconhecido'};
          hostBroadcast(ev);applyEvent(ev);
        }
        return false;
      }
    }
    return true;
  });

  // Players
  for(const p of Object.values(gameState.players)){
    if(p.dead||p.hp<=0)continue;

    const moving=p.keys.up||p.keys.down||p.keys.left||p.keys.right;
    const canSprint=p.keys.sprint&&moving&&p.stamina>5;
    if(canSprint) p.stamina=Math.max(0,p.stamina-STAMINA_DRAIN);
    else if(!p.keys.sprint) p.stamina=Math.min(STAMINA_MAX,p.stamina+STAMINA_REGEN);
    else if(p.stamina<=0) p.stamina=Math.min(STAMINA_MAX,p.stamina+STAMINA_REGEN*0.3); // regen lento quando exausto
    p.sprinting=canSprint;
    const spd=canSprint?PLAYER_SPRINT:PLAYER_SPEED;

    let dx=0,dy=0;
    if(p.keys.up)dy-=1;
    if(p.keys.down)dy+=1;
    if(p.keys.left)dx-=1;
    if(p.keys.right)dx+=1;
    // Normaliza diagonal pra não ser mais rápido
    const dlen=Math.sqrt(dx*dx+dy*dy)||1;
    if(dx!==0||dy!==0){dx/=dlen;dy/=dlen;}
    const nx=Math.max(PR,Math.min(MAP_W-PR,p.x+dx*spd));
    const ny=Math.max(PR,Math.min(MAP_H-PR,p.y+dy*spd));
    if(!circleWall(nx,p.y,PR))p.x=nx;
    if(!circleWall(p.x,ny,PR))p.y=ny;
    p.buildingId=insideBuilding(p.x,p.y)?.id??null;

    // Gang regen
    if(p.gangId&&gameState.gangs[p.gangId]?.base){const base=gameState.gangs[p.gangId].base;if(dist({x:p.x,y:p.y},base)<base.r&&gameTick%25===0&&p.hp<MAX_HP)p.hp=Math.min(MAX_HP,p.hp+1);}

    // Drops auto-pickup
    for(let i=gameState.drops.length-1;i>=0;i--){
      const d=gameState.drops[i];
      if(dist2({x:p.x,y:p.y},{x:d.x,y:d.y})>(PR+16)**2)continue;
      if(WEAPONS[d.type]){if(p.id===myPeerId&&p.pendingPickup!==d.id){p.pendingPickup=d.id;myPendingPickup=d.id;document.getElementById('pickup-wpn-name').textContent=WEAPONS[d.type].name;document.getElementById('hud-pickup').style.display='block';}continue;}
      if(d.type.endsWith('_ammo')){addAmmo(p.ammoInv,d.type,20);gameState.drops.splice(i,1);continue;}
      if(d.type==='health_sm'){p.hp=Math.min(MAX_HP,p.hp+25);gameState.drops.splice(i,1);continue;}
      if(d.type==='health_lg'){p.hp=Math.min(MAX_HP,p.hp+60);gameState.drops.splice(i,1);continue;}
      if(d.type==='armor_sm'){p.armor=Math.min(100,p.armor+25);gameState.drops.splice(i,1);continue;}
      if(d.type==='armor_lg'){p.armor=Math.min(100,p.armor+50);gameState.drops.splice(i,1);continue;}
    }
    if(p.pendingPickup){const d=gameState.drops.find(d=>d.id===p.pendingPickup);if(!d||dist2({x:p.x,y:p.y},{x:d.x,y:d.y})>(PR+32)**2){p.pendingPickup=null;if(p.id===myPeerId){myPendingPickup=null;document.getElementById('hud-pickup').style.display='none';}}}

    // Shoot
    if(p.wantShoot&&p.shootCd===0){
      const wpn=WEAPONS[p.weapon]||WEAPONS.fists;
      if(wpn.melee){
        for(let i=gameState.zombies.length-1;i>=0;i--){const z=gameState.zombies[i];if(dist2({x:p.x,y:p.y},z)<(wpn.range+ZR)**2){z.hp-=wpn.dmg;if(z.hp<=0){zombieDrop(z.x,z.y,isDay);gameState.zombies.splice(i,1);p.kills++;p.money+=Math.floor(rnd(5,15));if(p.id===myPeerId){currentUser.kills++;currentUser.money=p.money;}}}}p.shootCd=wpn.cd;
      }else{
        const at=wpn.ammoType,av=p.ammoInv[at]||0;
        if(av>0){
          const pellets=wpn.pellets||1;
          for(let i=0;i<pellets;i++){const sp=(Math.random()-0.5)*wpn.spread*2,a=p.aimAngle+sp;gameState.bullets.push({id:uid(),ownerId:p.id,ownerGangId:p.gangId,x:p.x,y:p.y,vx:Math.cos(a)*wpn.spd,vy:Math.sin(a)*wpn.spd,ttl:55,dmg:wpn.dmg,color:wpn.color});}
          p.ammoInv[at]=av-1;p.shootCd=wpn.cd;
        }else if(p.id===myPeerId)noAmmoTimer=30;
      }
      p.wantShoot=false;
    }
    if(p.shootCd>0)p.shootCd--;
  }

  // Build base state (shared)
  const baseState={type:'state',tick:gameTick,day:isDay,dayProg:prog,
    players:Object.values(gameState.players).map(p=>({id:p.id,x:Math.round(p.x),y:Math.round(p.y),hp:p.hp,armor:p.armor,gangId:p.gangId,skin:p.skin,weapon:p.weapon,kills:p.kills,aim:+(p.aimAngle||0).toFixed(2),buildingId:p.buildingId,sprinting:p.sprinting?1:0,dead:p.dead?1:0,username:p.username})),
    zombies:gameState.zombies.map(z=>({id:z.id,x:Math.round(z.x),y:Math.round(z.y),hp:z.hp,maxHp:z.maxHp})),
    bullets:gameState.bullets.map(b=>({id:b.id,x:Math.round(b.x),y:Math.round(b.y),c:b.color})),
    drops:gameState.drops.map(d=>({id:d.id,x:Math.round(d.x),y:Math.round(d.y),type:d.type})),
    gangs:Object.values(gameState.gangs).map(g=>({id:g.id,name:g.name,color:g.color,kills:g.kills,members:g.members.length,base:g.base})),
  };
  // Send personalized state to each client with their own ammo/stamina
  Object.entries(connections).forEach(([peerId,conn])=>{
    const p=gameState.players[peerId];
    conn.send({...baseState,myAmmoInv:p?.ammoInv||{},myStamina:Math.round(p?.stamina||0)});
  });
  // Host applies its own state
  const hostState={...baseState,myAmmoInv:gameState.players[myPeerId]?.ammoInv||{},myStamina:Math.round(gameState.players[myPeerId]?.stamina||0)};
  applyServerState(hostState);
  saveProgress();
}

function zombieDrop(x,y,isDay){
  if(Math.random()<0.5){const t=isDay?AMMO_D_DAY:AMMO_D_NIGHT;spawnDrop(x,y,t[Math.floor(Math.random()*t.length)]);}
  if(!isDay&&Math.random()<0.15)spawnDrop(x,y,'health_sm');
}
function edgePos(){const s=Math.floor(Math.random()*4);if(s===0)return{x:rnd(0,MAP_W),y:0};if(s===1)return{x:MAP_W,y:rnd(0,MAP_H)};if(s===2)return{x:rnd(0,MAP_W),y:MAP_H};return{x:0,y:rnd(0,MAP_H)};}

function hostPickupWeapon(fromId,dropId){
  const d=gameState.drops.find(d=>d.id===dropId&&WEAPONS[d.type]);
  const p=gameState.players[fromId];
  if(!d||!p||dist2({x:p.x,y:p.y},{x:d.x,y:d.y})>(PR+38)**2)return;
  if(p.weapon!=='fists')gameState.drops.push({id:uid(),x:p.x+rnd(-18,18),y:p.y+rnd(-18,18),type:p.weapon});
  if(d.bundledAmmo&&WEAPONS[d.type].ammoType)addAmmo(p.ammoInv,WEAPONS[d.type].ammoType,d.bundledAmmo);
  p.weapon=d.type;gameState.drops.splice(gameState.drops.indexOf(d),1);p.pendingPickup=null;
}
function hostCreateGang(fromId,name,color){
  const p=gameState.players[fromId];if(!p)return;
  if(p.gangId){const old=gameState.gangs[p.gangId];if(old){old.members=old.members.filter(m=>m!==fromId);if(!old.members.length)delete gameState.gangs[old.id];}}
  const id='g'+uid();
  gameState.gangs[id]={id,name:name.slice(0,16),color,members:[fromId],kills:0,base:{x:Math.max(160,Math.min(MAP_W-160,p.x)),y:Math.max(160,Math.min(MAP_H-160,p.y)),r:120}};
  p.gangId=id;
}
function hostJoinGang(fromId,gangId){
  const g=gameState.gangs[gangId],p=gameState.players[fromId];if(!g||!p)return;
  if(p.gangId){const old=gameState.gangs[p.gangId];if(old){old.members=old.members.filter(m=>m!==fromId);if(!old.members.length)delete gameState.gangs[old.id];}}
  p.gangId=gangId;if(!g.members.includes(fromId))g.members.push(fromId);
}
function hostLeaveGang(fromId){
  const p=gameState.players[fromId];if(!p||!p.gangId)return;
  const g=gameState.gangs[p.gangId];if(g){g.members=g.members.filter(m=>m!==fromId);if(!g.members.length)delete gameState.gangs[p.gangId];}
  p.gangId=null;
}
function hostRespawn(fromId){
  const p=gameState.players[fromId];if(!p)return;
  const sp=safeSpawn();p.x=sp.x;p.y=sp.y;p.hp=MAX_HP;p.armor=0;p.ammoInv={};p.weapon='fists';p.stamina=STAMINA_MAX;p.dead=false;
  if(p.gangId&&gameState.gangs[p.gangId]?.base){const b=gameState.gangs[p.gangId].base;p.x=b.x+rnd(-50,50);p.y=b.y+rnd(-50,50);}
}
function removePlayer(id){delete gameState.players[id];}

