// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function notify(text,bad=false,gold=false){
  const el=document.createElement('div');el.className='notif'+(bad?' bad':gold?' gold':'');el.textContent=text;
  document.getElementById('notifs').appendChild(el);setTimeout(()=>el.remove(),3000);
}
