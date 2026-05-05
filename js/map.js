// MAP GENERATION
// ══════════════════════════════════════════════════════════════
let WALLS=[],TREES=[],BUILDINGS=[];

function buildMap(){
  WALLS=[];TREES=[];BUILDINGS=[];
  const addWall=(x,y,w,h)=>WALLS.push({x,y,w,h});
  const BLDG=[
    {x:200,y:200,w:180,h:140,door:'s',dOff:70},{x:500,y:150,w:200,h:160,door:'e',dOff:60},
    {x:180,y:500,w:160,h:200,door:'e',dOff:80},{x:550,y:480,w:220,h:180,door:'n',dOff:90},
    {x:850,y:200,w:180,h:160,door:'s',dOff:70},{x:900,y:500,w:200,h:180,door:'w',dOff:80},
    {x:200,y:850,w:220,h:160,door:'e',dOff:70},{x:600,y:800,w:180,h:200,door:'n',dOff:80},
    {x:950,y:820,w:200,h:160,door:'w',dOff:70},{x:1100,y:200,w:180,h:200,door:'s',dOff:80},
    {x:1200,y:600,w:160,h:180,door:'n',dOff:70},{x:1050,y:1000,w:200,h:160,door:'w',dOff:70},
    {x:1820,y:200,w:180,h:140,door:'s',dOff:70},{x:2100,y:150,w:200,h:160,door:'w',dOff:60},
    {x:2400,y:200,w:180,h:160,door:'s',dOff:70},{x:1800,y:480,w:220,h:180,door:'e',dOff:80},
    {x:2150,y:500,w:180,h:200,door:'n',dOff:80},{x:2500,y:480,w:200,h:180,door:'w',dOff:80},
    {x:2750,y:200,w:180,h:200,door:'s',dOff:80},{x:1850,y:820,w:200,h:160,door:'e',dOff:70},
    {x:2200,y:800,w:180,h:200,door:'n',dOff:80},{x:2600,y:820,w:200,h:160,door:'w',dOff:70},
    {x:2800,y:700,w:180,h:180,door:'s',dOff:70},{x:1950,y:1050,w:200,h:160,door:'n',dOff:80},
    {x:200,y:1820,w:180,h:140,door:'n',dOff:70},{x:500,y:1850,w:200,h:160,door:'e',dOff:60},
    {x:180,y:2200,w:160,h:200,door:'e',dOff:80},{x:550,y:2150,w:220,h:180,door:'s',dOff:90},
    {x:850,y:1820,w:180,h:160,door:'n',dOff:70},{x:900,y:2100,w:200,h:180,door:'e',dOff:80},
    {x:200,y:2550,w:220,h:160,door:'e',dOff:70},{x:600,y:2500,w:180,h:200,door:'s',dOff:80},
    {x:950,y:2520,w:200,h:160,door:'w',dOff:70},{x:1100,y:1900,w:180,h:200,door:'n',dOff:80},
    {x:1200,y:2200,w:160,h:180,door:'s',dOff:70},{x:1050,y:2700,w:200,h:160,door:'e',dOff:70},
    {x:1820,y:1820,w:180,h:140,door:'n',dOff:70},{x:2100,y:1850,w:200,h:160,door:'w',dOff:60},
    {x:2400,y:1820,w:180,h:160,door:'n',dOff:70},{x:1800,y:2150,w:220,h:180,door:'e',dOff:80},
    {x:2150,y:2100,w:180,h:200,door:'s',dOff:80},{x:2500,y:2150,w:200,h:180,door:'w',dOff:80},
    {x:2750,y:1900,w:180,h:200,door:'n',dOff:80},{x:1850,y:2520,w:200,h:160,door:'e',dOff:70},
    {x:2200,y:2500,w:180,h:200,door:'s',dOff:80},{x:2600,y:2520,w:200,h:160,door:'w',dOff:70},
    {x:2800,y:2400,w:180,h:180,door:'n',dOff:70},{x:1950,y:2750,w:200,h:160,door:'s',dOff:80},
    {x:1380,y:1380,w:240,h:240,door:'n',dOff:100},
  ];
  const GAP=40,T=8;
  BLDG.forEach((b,idx)=>{
    const{x,y,w,h,door,dOff}=b;
    BUILDINGS.push({id:idx,x,y,w,h});
    if(door==='n'){addWall(x,y,dOff,T);addWall(x+dOff+GAP,y,w-dOff-GAP,T);}else addWall(x,y,w,T);
    if(door==='s'){addWall(x,y+h-T,dOff,T);addWall(x+dOff+GAP,y+h-T,w-dOff-GAP,T);}else addWall(x,y+h-T,w,T);
    if(door==='w'){addWall(x,y,T,dOff);addWall(x,y+dOff+GAP,T,h-dOff-GAP);}else addWall(x,y,T,h);
    if(door==='e'){addWall(x+w-T,y,T,dOff);addWall(x+w-T,y+dOff+GAP,T,h-dOff-GAP);}else addWall(x+w-T,y,T,h);
  });
  for(let i=0;i<200;i++){
    let tx=rnd(60,MAP_W-60),ty=rnd(60,MAP_H-60),t=0;
    const inB=BUILDINGS.some(b=>tx+28>b.x-20&&tx-28<b.x+b.w+20&&ty+28>b.y-20&&ty-28<b.y+b.h+20);
    const inC=tx>1380&&tx<1820&&ty>1380&&ty<1820;
    if(!inB&&!inC)TREES.push({x:tx,y:ty,r:18+Math.random()*10});
  }
}

function circleWall(x,y,r){
  for(const w of WALLS){const cx=Math.max(w.x,Math.min(x,w.x+w.w)),cy=Math.max(w.y,Math.min(y,w.y+w.h));if((x-cx)**2+(y-cy)**2<r*r)return true;}
  for(const t of TREES){if((x-t.x)**2+(y-t.y)**2<(r+t.r*0.7)**2)return true;}
  return false;
}
function insideBuilding(x,y){return BUILDINGS.find(b=>x>b.x+8&&x<b.x+b.w-8&&y>b.y+8&&y<b.y+b.h-8)||null;}
function rnd(lo,hi){return Math.random()*(hi-lo)+lo;}
function dist2(a,b){return(a.x-b.x)**2+(a.y-b.y)**2;}
function dist(a,b){return Math.sqrt(dist2(a,b));}
let _id=1;function uid(){return _id++;}

