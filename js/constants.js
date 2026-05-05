// CONSTANTS
// ══════════════════════════════════════════════════════════════
const MAP_W=3200,MAP_H=3200;
const PR=14,ZR=16,BR=4;
const PLAYER_SPEED=5,PLAYER_SPRINT=8.5;
const STAMINA_MAX=100,STAMINA_DRAIN=1.8,STAMINA_REGEN=0.7;
const MAX_HP=100;
const DAY_DUR=1800,NIGHT_DUR=1200,CYCLE=DAY_DUR+NIGHT_DUR;
const ZMB_ATK_CD=45,MAX_DROPS=55;
const DAY_Z  ={hp:30,spd:1.2,dmg:8, maxZ:30,spawnEvery:220,spawnCount:2};
const NIGHT_Z={hp:60,spd:1.9,dmg:15,maxZ:70,spawnEvery:90, spawnCount:4};

const AMMO_TYPES={
  pistol_ammo: {name:'PIST',color:'#ccc',   max:120},
  shotgun_ammo:{name:'ESCP',color:'#e17055',max:48},
  rifle_ammo:  {name:'RIFL',color:'#74b9ff',max:80},
  smg_ammo:    {name:'SMG', color:'#55efc4',max:160},
  sniper_ammo: {name:'SNIP',color:'#fd79a8',max:20},
};

const WEAPONS={
  fists:  {name:'Punhos',  dmg:12,cd:22,range:30,melee:true, ammoType:null,          color:'#aaa'                                  },
  pistol: {name:'Pistola', dmg:20,cd:12,spd:16,  ammoType:'pistol_ammo', color:'#ccc',   spread:0.06, spawnAmmo:[8,24]  },
  shotgun:{name:'Escopeta',dmg:16,cd:30,spd:12,  ammoType:'shotgun_ammo',color:'#e17055',spread:0.22, spawnAmmo:[4,12], pellets:5},
  rifle:  {name:'Rifle',   dmg:35,cd:22,spd:22,  ammoType:'rifle_ammo',  color:'#74b9ff',spread:0.02, spawnAmmo:[10,30] },
  smg:    {name:'SMG',     dmg:12,cd:5, spd:17,  ammoType:'smg_ammo',    color:'#55efc4',spread:0.10, spawnAmmo:[20,50] },
  sniper: {name:'Sniper',  dmg:90,cd:65,spd:28,  ammoType:'sniper_ammo', color:'#fd79a8',spread:0.003,spawnAmmo:[3,8]   },
};

const SKINS={
  default:{name:'Padrão',  cost:0,  color:'#dfe6e9'},
  red:    {name:'Vermelho',cost:100,color:'#ff7675'},
  blue:   {name:'Azul',   cost:100,color:'#74b9ff'},
  green:  {name:'Verde',  cost:100,color:'#55efc4'},
  yellow: {name:'Amarelo',cost:150,color:'#ffeaa7'},
  purple: {name:'Roxo',   cost:150,color:'#a29bfe'},
  pink:   {name:'Rosa',   cost:200,color:'#fd79a8'},
  black:  {name:'Preto',  cost:300,color:'#2d3436'},
  gold:   {name:'Ouro',   cost:500,color:'#f0c040'},
};

const GANG_COLORS=['#ff4757','#2ed573','#1e90ff','#ffa502','#fd79a8','#a29bfe','#00cec9','#e17055'];
const AMMO_D_DAY  =['pistol_ammo','pistol_ammo','shotgun_ammo','smg_ammo','rifle_ammo'];
const AMMO_D_NIGHT=['rifle_ammo','sniper_ammo','smg_ammo','shotgun_ammo','pistol_ammo'];
const ITEM_D_DAY  =['pistol','pistol','shotgun','smg','pistol_ammo','smg_ammo','health_sm','health_sm','armor_sm'];
const ITEM_D_NIGHT=['rifle','smg','sniper','rifle_ammo','sniper_ammo','health_lg','health_lg','armor_lg'];

