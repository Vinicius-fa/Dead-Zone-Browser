// RENDER LOOP
// ══════════════════════════════════════════════════════════════
let grassPatCache=null;
function getGrassPat(){
  if(grassPatCache)return grassPatCache;
  const c=document.createElement('canvas');c.width=64;c.height=64;
  const x=c.getContext('2d');
  x.fillStyle='#2d5a1b';x.fillRect(0,0,64,64);
  for(let i=0;i<40;i++){x.fillStyle=`rgba(${Math.random()>.5?50:15},${80+Math.floor(Math.random()*30)},${Math.floor(Math.random()*12)},0.3)`;x.fillRect(Math.random()*64,Math.random()*64,2+Math.random()*4,2+Math.random()*4);}
  grassPatCache=ctx.createPattern(c,'repeat');return grassPatCache;
}

function lerp(a,b,t){return a+(b-a)*t;}
function lerpE(prev,curr,t,key='id'){
  const map={};for(const c of curr){const p=prev.find(x=>x[key]===c[key]);map[c[key]]=p?{...c,x:lerp(p.x,c.x,t),y:lerp(p.y,c.y,t)}:c;}return Object.values(map);
}

const DROP_ICON={pistol:'🔫',shotgun:'🔫',rifle:'🔫',smg:'🔫',sniper:'🔫',pistol_ammo:'●',shotgun_ammo:'●',rifle_ammo:'●',smg_ammo:'●',sniper_ammo:'●',health_sm:'💊',health_lg:'💊',armor_sm:'🔵',armor_lg:'🔷'};
const DROP_COL={pistol:'#ccc',shotgun:'#e17055',rifle:'#74b9ff',smg:'#55efc4',sniper:'#fd79a8',pistol_ammo:'#ccc',shotgun_ammo:'#e17055',rifle_ammo:'#74b9ff',smg_ammo:'#55efc4',sniper_ammo:'#fd79a8',health_sm:'#e74c3c',health_lg:'#c0392b',armor_sm:'#3498db',armor_lg:'#2980b9'};

function renderLoop(){
  if(!gameRunning){requestAnimationFrame(renderLoop);return;}
  const W=canvas.width,H=canvas.height;
  const now=performance.now();
  const t=Math.min(1,(now-lastStateTime)/50);

  const iP=lerpE(prevState.players,renderState.players,t);
  const iZ=lerpE(prevState.zombies,renderState.zombies,t);
  const iB=lerpE(prevState.bullets,renderState.bullets,t);
  const isDay=renderState.day;

  const me=iP.find(p=>p.id===myPeerId);
  if(me){camX=lerp(camX,me.x-W/2,.1);camY=lerp(camY,me.y-H/2,.1);}
  camX=Math.max(0,Math.min(MAP_W-W,camX));camY=Math.max(0,Math.min(MAP_H-H,camY));

  ctx.clearRect(0,0,W,H);
  ctx.save();ctx.translate(-camX,-camY);

  // Grass
  ctx.fillStyle=getGrassPat();ctx.fillRect(camX,camY,W,H);

  // Map border
  ctx.strokeStyle='#1a3d0a';ctx.lineWidth=4;ctx.strokeRect(0,0,MAP_W,MAP_H);

  // Building floors
  for(const b of BUILDINGS){
    ctx.fillStyle='#c8b99a';ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle='#bfaa8a';
    for(let fx=b.x+16;fx<b.x+b.w-8;fx+=32)for(let fy=b.y+16;fy<b.y+b.h-8;fy+=32)ctx.fillRect(fx,fy,28,28);
  }

  // Gang bases
  for(const g of renderState.gangs||[]){
    if(!g.base)continue;const{x,y,r}=g.base;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g.color+'0e';ctx.fill();
    ctx.strokeStyle=g.color+'44';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    ctx.font='11px "Share Tech Mono"';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=g.color+'88';ctx.fillText(g.name,x,y+r-14);
    ctx.font='18px serif';ctx.fillText('🏠',x,y);
  }

  // Drops
  for(const d of renderState.drops||[]){
    const col=DROP_COL[d.type]||'#aaa';const pulse=0.7+0.3*Math.sin(now/450+d.id);
    ctx.save();ctx.globalAlpha=pulse;ctx.shadowColor=col;ctx.shadowBlur=8;
    const isW=!!WEAPONS[d.type]&&!WEAPONS[d.type]?.melee;
    ctx.font=(isW?'15px':'12px')+' serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(DROP_ICON[d.type]||'?',d.x,d.y);
    if(isW){ctx.strokeStyle=col+'66';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(d.x,d.y,14,0,Math.PI*2);ctx.stroke();}
    else if(d.type.endsWith('_ammo')){ctx.fillStyle=col;ctx.beginPath();ctx.arc(d.x,d.y,4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  // Bullets
  for(const b of iB){ctx.save();ctx.fillStyle=b.c||'#ffe066';ctx.shadowColor=b.c||'#ffcc00';ctx.shadowBlur=7;ctx.beginPath();ctx.arc(b.x,b.y,BR,0,Math.PI*2);ctx.fill();ctx.restore();}

  // Zombies
  for(const z of iZ){
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(z.x+2,z.y+4,ZR*.8,ZR*.4,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(z.x,z.y,ZR,0,Math.PI*2);ctx.fillStyle='#1a3d17';ctx.fill();ctx.strokeStyle='#254d20';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#cc0000';ctx.shadowColor='#ff0000';ctx.shadowBlur=4;
    ctx.beginPath();ctx.arc(z.x-5,z.y-5,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(z.x+5,z.y-5,2.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#111';ctx.fillRect(z.x-ZR,z.y-ZR-8,ZR*2,3);ctx.fillStyle='#39ff14';ctx.fillRect(z.x-ZR,z.y-ZR-8,ZR*2*(z.hp/z.maxHp),3);
    ctx.restore();
  }

  // Players
  for(const p of iP){
    if(p.dead){ctx.save();ctx.globalAlpha=.3;ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('💀',p.x,p.y);ctx.restore();continue;}
    if(p.buildingId!==undefined&&p.buildingId!==null&&p.buildingId!==myBuildingId)continue;
    const isMe=p.id===myPeerId;
    const aim=isMe?myAim:(p.aim||0);
    const gangCol=getGangColor(p.gangId,renderState.gangs);
    const skinCol=SKINS[p.skin]?.color||'#dfe6e9';
    ctx.save();
    // Shadow
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(p.x+2,p.y+4,PR*.8,PR*.4,0,0,Math.PI*2);ctx.fill();
    // Sprint trail
    if(p.sprinting){ctx.fillStyle=gangCol+'22';ctx.beginPath();ctx.arc(p.x-Math.cos(aim)*8,p.y-Math.sin(aim)*8,PR+4,0,Math.PI*2);ctx.fill();}
    // Gang ring
    if(p.gangId){ctx.beginPath();ctx.arc(p.x,p.y,PR+4,0,Math.PI*2);ctx.strokeStyle=gangCol+'77';ctx.lineWidth=2;ctx.stroke();}
    // Body
    ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fillStyle=skinCol;ctx.fill();
    ctx.strokeStyle=isMe?'rgba(255,255,255,.5)':'rgba(0,0,0,.4)';ctx.lineWidth=isMe?1.5:1;ctx.stroke();
    // Eyes
    const ex=p.x+Math.cos(aim)*(PR*.45),ey=p.y+Math.sin(aim)*(PR*.45);
    ctx.fillStyle='#111';
    ctx.beginPath();ctx.arc(ex-Math.sin(aim)*3.5,ey+Math.cos(aim)*3.5,2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(ex+Math.sin(aim)*3.5,ey-Math.cos(aim)*3.5,2,0,Math.PI*2);ctx.fill();
    // Weapon bar
    const wpn=WEAPONS[p.weapon];
    if(wpn&&!wpn.melee){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(aim);
      ctx.fillStyle=wpn.color||'#aaa';
      const gw=wpn.name==='Sniper'?18:wpn.name==='Rifle'?14:10;
      ctx.fillRect(PR+3,-2,gw,4);ctx.restore();
    }else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(aim);ctx.fillStyle='#888';ctx.beginPath();ctx.arc(PR+3,0,4,0,Math.PI*2);ctx.fill();ctx.restore();}
    // Name
    ctx.font='bold 10px "Share Tech Mono"';const tw=ctx.measureText(p.username||'?').width;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(p.x-tw/2-3,p.y-PR-16,tw+6,12);
    ctx.fillStyle=isMe?'#fff':gangCol!=='#444'?gangCol:'#aaa';
    ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(p.username||'?',p.x,p.y-PR-4);
    // HP bar
    ctx.fillStyle='#111';ctx.fillRect(p.x-PR,p.y+PR+3,PR*2,3);
    ctx.fillStyle=p.hp>50?'#2ecc71':p.hp>25?'#f39c12':'#e74c3c';
    ctx.fillRect(p.x-PR,p.y+PR+3,PR*2*(p.hp/100),3);
    ctx.restore();
  }

  // Walls
  for(const w of WALLS){ctx.fillStyle='#6b5a3e';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeStyle='#4a3d2a';ctx.lineWidth=1;ctx.strokeRect(w.x,w.y,w.w,w.h);}

  // Trees
  for(const t of TREES){
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(t.x+4,t.y+6,t.r*.7,t.r*.4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5c3d1e';ctx.fillRect(t.x-3,t.y,6,10);
    ctx.fillStyle='#1e5c0f';ctx.beginPath();ctx.arc(t.x,t.y-2,t.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2a7a14';ctx.beginPath();ctx.arc(t.x-t.r*.2,t.y-t.r*.2,t.r*.7,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  // Interior fog
  if(myBuildingId!==null&&myBuildingId!==undefined){
    const b=BUILDINGS.find(b=>b.id===myBuildingId);
    if(b){ctx.save();ctx.fillStyle='rgba(0,0,0,.72)';ctx.beginPath();ctx.rect(camX,camY,W,H);ctx.rect(b.x+8,b.y+8,b.w-16,b.h-16);ctx.fill('evenodd');ctx.restore();}
  }

  // Night overlay
  if(!isDay){
    const d=0.25+renderState.dayProg*.22;
    const grad=ctx.createRadialGradient(camX+W/2,camY+H/2,H*.3,camX+W/2,camY+H/2,H*.72);
    grad.addColorStop(0,`rgba(4,0,12,0)`);grad.addColorStop(1,`rgba(4,0,12,${d})`);
    ctx.fillStyle=grad;ctx.fillRect(camX,camY,W,H);
  }

  ctx.restore();

  // Flash
  if(flashAlpha>0){ctx.fillStyle=`rgba(200,0,0,${flashAlpha})`;ctx.fillRect(0,0,W,H);flashAlpha=Math.max(0,flashAlpha-.025);}

  // Vignette
  const vig=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.72);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);

  // No ammo flash
  if(noAmmoTimer>0){const el=document.getElementById('no-ammo');el.style.opacity=(noAmmoTimer/30).toString();noAmmoTimer--;}else document.getElementById('no-ammo').style.opacity='0';

  drawMinimap(iP);
  requestAnimationFrame(renderLoop);
}

function drawMinimap(iP){
  const mw=mmCanvas.width,mh=mmCanvas.height,sx=mw/MAP_W,sy=mh/MAP_H;
  const isDay=renderState.day;
  mmCtx.fillStyle=isDay?'#2d5a1b':'#1a3d10';mmCtx.fillRect(0,0,mw,mh);
  mmCtx.fillStyle=isDay?'#c8b99a':'#8a7a66';for(const b of BUILDINGS)mmCtx.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy);
  for(const g of renderState.gangs||[]){if(!g.base)continue;mmCtx.strokeStyle=g.color+'55';mmCtx.lineWidth=1;mmCtx.beginPath();mmCtx.arc(g.base.x*sx,g.base.y*sy,g.base.r*sx,0,Math.PI*2);mmCtx.stroke();}
  const me=iP.find(p=>p.id===myPeerId);
  if(me){
    mmCtx.strokeStyle='rgba(255,255,255,.12)';mmCtx.lineWidth=1;mmCtx.strokeRect(camX*sx,camY*sy,canvas.width*sx,canvas.height*sy);
    const mc=getGangColor(me.gangId,renderState.gangs)||'#fff';
    mmCtx.fillStyle=mc;mmCtx.beginPath();mmCtx.arc(me.x*sx,me.y*sy,4,0,Math.PI*2);mmCtx.fill();
    mmCtx.strokeStyle=mc;mmCtx.lineWidth=1;mmCtx.beginPath();mmCtx.moveTo(me.x*sx,me.y*sy);mmCtx.lineTo(me.x*sx+Math.cos(myAim)*7,me.y*sy+Math.sin(myAim)*7);mmCtx.stroke();
  }
  mmCtx.strokeStyle='#1a3d0a';mmCtx.lineWidth=1;mmCtx.strokeRect(0,0,mw,mh);
}

function stopGame(){
  gameRunning=false;
  renderLoopRunning=false;
  if(gameLoop){clearInterval(gameLoop);gameLoop=null;}
}

