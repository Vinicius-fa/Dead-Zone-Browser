// SAVE / AUTH  (localStorage-based, no server needed)
// ══════════════════════════════════════════════════════════════
function getSaves(){try{return JSON.parse(localStorage.getItem('dz_saves')||'{}')}catch{return{}}}
function setSaves(s){localStorage.setItem('dz_saves',JSON.stringify(s))}
function getSession(){try{return JSON.parse(localStorage.getItem('dz_session')||'null')}catch{return null}}
function setSession(u){localStorage.setItem('dz_session',JSON.stringify(u))}
function clearSession(){localStorage.removeItem('dz_session')}

function defaultProfile(username){
  return{username,password:'',kills:0,deaths:0,money:0,skin:'default',unlockedSkins:['default'],created:Date.now()};
}

let currentUser=null; // logged-in profile object

function switchTab(tab){
  document.querySelectorAll('.auth-tab').forEach((b,i)=>b.classList.toggle('active',['login','register'][i]===tab));
  document.getElementById('auth-err').textContent='';
}

function doAuth(){
  const u=document.getElementById('auth-user').value.trim().toLowerCase();
  const p=document.getElementById('auth-pass').value;
  const errEl=document.getElementById('auth-err');
  if(!u||u.length<2){errEl.textContent='Usuário muito curto';return;}
  if(!p||p.length<4){errEl.textContent='Senha muito curta (min 4)';return;}
  const saves=getSaves();
  const isRegister=document.querySelector('.auth-tab.active').textContent==='CRIAR CONTA';
  if(isRegister){
    if(saves[u]){errEl.textContent='Usuário já existe';return;}
    saves[u]=defaultProfile(u);saves[u].password=p;
    setSaves(saves);
  }
  if(!saves[u]){errEl.textContent='Usuário não encontrado';return;}
  if(saves[u].password!==p){errEl.textContent='Senha incorreta';return;}
  currentUser=saves[u];setSession(u);
  showLoggedIn();
}

function doLogout(){currentUser=null;clearSession();showLoggedOut();}

function saveProgress(){
  if(!currentUser)return;
  const saves=getSaves();saves[currentUser.username]=currentUser;setSaves(saves);
}

function showLoggedIn(){
  document.getElementById('auth-box').classList.add('hidden');
  document.getElementById('profile-bar').classList.remove('hidden');
  document.getElementById('play-opts').classList.remove('hidden');
  document.getElementById('profile-name').textContent=currentUser.username.toUpperCase();
  document.getElementById('stat-kills').textContent=currentUser.kills;
  document.getElementById('stat-deaths').textContent=currentUser.deaths;
  document.getElementById('stat-money').textContent=currentUser.money;
  renderAvatar();
}
function showLoggedOut(){
  document.getElementById('auth-box').classList.remove('hidden');
  document.getElementById('profile-bar').classList.add('hidden');
  document.getElementById('play-opts').classList.add('hidden');
}
function renderAvatar(){
  const av=document.getElementById('profile-avatar');
  const skin=SKINS[currentUser.skin]||SKINS.default;
  av.style.background=skin.color;
  av.style.border='2px solid '+skin.color+'88';
}

// Auto-login from session
window.addEventListener('DOMContentLoaded',()=>{
  buildColorGrid();
  const session=getSession();
  if(session){const saves=getSaves();if(saves[session]){currentUser=saves[session];showLoggedIn();}}
});

