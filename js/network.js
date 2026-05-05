// NETWORKING — Sala única automática
// ══════════════════════════════════════════════════════════════
// ID fixo da sala — todos tentam se conectar a este peer
// Se ele não existir, o jogador vira host com esse ID
// ID fixo da sala — suficientemente único pra não conflitar
const ROOM_ID = 'dz-room-x7k2m9';
let peer=null,connections={},isHost=false,myPeerId=null;
let lobbyPlayers={};

function joinServer(){
  showScreen('screen-lobby');
  document.getElementById('room-status').textContent='Conectando à sala...';
  peer=new Peer(undefined,{debug:0});
  peer.on('open',id=>{
    myPeerId=id;
    tryConnect(0);
  });
  peer.on('error',()=>becomeHost());
}

function tryConnect(attempt){
  if(attempt>2){becomeHost();return;}
  document.getElementById('room-status').textContent='Procurando sala... (tentativa '+(attempt+1)+')';
  const conn=peer.connect(ROOM_ID,{reliable:true,serialization:'json'});
  let connected=false;
  const timeout=setTimeout(()=>{
    if(!connected){conn.close();becomeHost();}
  },4000);
  conn.on('open',()=>{
    clearTimeout(timeout);
    connected=true;
    isHost=false;
    connections['host']=conn;
    document.getElementById('room-status').textContent='Conectado! Entrando...';
    conn.send({type:'join',username:currentUser.username,skin:currentUser.skin});
  });
  conn.on('data',data=>clientReceive(data));
  conn.on('close',()=>{
    if(gameRunning){notify('Host saiu, reconectando...',true);setTimeout(()=>{if(!isHost)becomeHost();},2000);}
  });
  conn.on('error',()=>{
    clearTimeout(timeout);
    if(!connected) setTimeout(()=>tryConnect(attempt+1),500);
  });
}

function becomeHost(){
  if(peer){peer.destroy();peer=null;}
  isHost=true;
  connections={};
  peer=new Peer(ROOM_ID,{debug:0});
  peer.on('open',()=>{
    myPeerId='host';
    document.getElementById('room-status').textContent='Sala criada! Iniciando...';
    buildMap();
    gameState={players:{},zombies:[],bullets:[],drops:[],gangs:{}};
    spawnWorldDrops();
    // Cria o jogador host
    const sp=safeSpawn();
    gameState.players['host']={
      id:'host',username:currentUser.username,skin:currentUser.skin,
      x:sp.x,y:sp.y,hp:MAX_HP,armor:0,ammoInv:{},weapon:'fists',
      kills:0,money:0,gangId:null,stamina:STAMINA_MAX,sprinting:false,
      keys:{up:false,down:false,left:false,right:false,sprint:false},
      aimAngle:0,wantShoot:false,shootCd:0,pendingPickup:null,buildingId:null,dead:false,
    };
    gameRunning=true;gameTick=0;
    gameLoop=setInterval(hostTick,50);
    startRenderLoop();
    showScreen('screen-game');
  });
  peer.on('connection',conn=>{
    conn.on('open',()=>{
      connections[conn.peer]=conn;
      conn.on('data',data=>hostReceive(conn.peer,data));
      conn.on('close',()=>{
        delete connections[conn.peer];
        delete lobbyPlayers[conn.peer];
        if(gameRunning)removePlayer(conn.peer);
        notify('🔴 Jogador saiu');
      });
    });
  });
  peer.on('error',e=>{
    document.getElementById('room-status').textContent='Erro: '+e.type;
  });
}

// Host receives from clients
function hostReceive(fromId,data){
  if(data.type==='join'){
    // Add player to game immediately (no lobby wait)
    const sp=safeSpawn();
    gameState.players[fromId]={
      id:fromId,username:data.username,skin:data.skin,
      x:sp.x,y:sp.y,hp:MAX_HP,armor:0,ammoInv:{},weapon:'fists',
      kills:0,money:0,gangId:null,stamina:STAMINA_MAX,sprinting:false,
      keys:{up:false,down:false,left:false,right:false,sprint:false},
      aimAngle:0,wantShoot:false,shootCd:0,pendingPickup:null,buildingId:null,dead:false,
    };
    lobbyPlayers[fromId]={username:data.username,skin:data.skin};
    // Send map + player ID to new client
    connections[fromId]?.send({type:'joined',yourId:fromId,walls:WALLS,trees:TREES,buildings:BUILDINGS});
    // Notify others
    Object.entries(connections).forEach(([id,c])=>{if(id!==fromId)c.send({type:'event',ev:'notify',msg:'🟢 '+data.username+' entrou na zona'});});
  }
  if(data.type==='input'&&gameRunning){
    const p=gameState.players[fromId];
    if(p){p.keys=data.keys;p.aimAngle=data.aim||0;if(data.shoot)p.wantShoot=true;}
  }
  if(data.type==='pickupWeapon'&&gameRunning) hostPickupWeapon(fromId,data.dropId);
  if(data.type==='createGang'&&gameRunning)   hostCreateGang(fromId,data.name,data.color);
  if(data.type==='joinGang'&&gameRunning)     hostJoinGang(fromId,data.gangId);
  if(data.type==='leaveGang'&&gameRunning)    hostLeaveGang(fromId);
  if(data.type==='respawn'&&gameRunning)      hostRespawn(fromId);
}

// Client receives from host
function clientReceive(data){
  if(data.type==='joined'){
    myPeerId=data.yourId;
    WALLS=data.walls;TREES=data.trees;BUILDINGS=data.buildings;
    grassPatCache=null;
    gameRunning=true;gameTick=0;
    sendInput();
    startRenderLoop();
    showScreen('screen-game');
    notify('🟢 Entrou na zona!');
  }
  if(data.type==='state'&&gameRunning) applyServerState(data);
  if(data.type==='event'&&gameRunning) applyEvent(data);
}

function hostBroadcast(data){
  Object.values(connections).forEach(c=>{ try{c.send(data);}catch(e){} });
}

