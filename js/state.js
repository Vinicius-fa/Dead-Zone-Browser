// GAME STATE
// ══════════════════════════════════════════════════════════════
let gameRunning=false,gameLoop=null,gameTick=0;
let camX=0,camY=0;
let gameState={players:{},zombies:[],bullets:[],drops:[],gangs:{}};
let myKeys={up:false,down:false,left:false,right:false,sprint:false};
let myAim=0,myMouseDown=false,myLastShot=0;
let myPendingPickup=null,myBuildingId=null;
let flashAlpha=0,noAmmoTimer=0,phaseFlashTimer=0;
let renderLoopRunning=false;
function startRenderLoop(){
  if(renderLoopRunning)return;
  renderLoopRunning=true;
  requestAnimationFrame(renderLoop);
}

const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
const mmCanvas=document.getElementById('minimap');
const mmCtx=mmCanvas.getContext('2d');

function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
window.addEventListener('resize',resize);resize();

function initGame(){
  gameRunning=true;gameTick=0;
  grassPatCache=null;
  if(isHost){
    if(!gameState.drops||!gameState.drops.length) spawnWorldDrops();
    gameLoop=setInterval(hostTick,50);
  }
  startRenderLoop();
}

function safeSpawn(){let x,y,t=0;do{x=rnd(200,MAP_W-200);y=rnd(200,MAP_H-200);t++;}while(t<40&&circleWall(x,y,PR+4));return{x,y};}

function spawnWorldDrops(){
  ['pistol','pistol','shotgun','rifle','smg','pistol','shotgun'].forEach(w=>{const p=safeSpawn();spawnWeaponDrop(p.x,p.y,w);});
  for(let i=0;i<14;i++){const p=safeSpawn();const t=ITEM_D_DAY[Math.floor(Math.random()*ITEM_D_DAY.length)];if(WEAPONS[t])spawnWeaponDrop(p.x,p.y,t);else gameState.drops.push({id:uid(),x:p.x,y:p.y,type:t});}
}
function spawnWeaponDrop(x,y,wpnKey){
  if(gameState.drops.length>=MAX_DROPS)return;
  const wpn=WEAPONS[wpnKey],ba=wpn.spawnAmmo||[0,0];
  gameState.drops.push({id:uid(),x,y,type:wpnKey,bundledAmmo:Math.floor(rnd(ba[0],ba[1]+1))});
}
function spawnDrop(x,y,type){if(gameState.drops.length>=MAX_DROPS)return;gameState.drops.push({id:uid(),x,y,type});}

function addAmmo(inv,type,amount){const max=AMMO_TYPES[type]?.max||999;inv[type]=Math.min((inv[type]||0)+amount,max);}

