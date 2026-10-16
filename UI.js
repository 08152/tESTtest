import { GAME_CONFIG } from './config.js';
import { getWeapon } from './WeaponRegistry.js';

const $=id=>document.getElementById(id);
export class GameUI {
  constructor(){
    this.loading=$('loading-screen');this.start=$('start-screen');this.jump=$('jump-screen');this.hud=$('hud');this.pause=$('pause-screen');this.map=$('map-screen');this.over=$('game-over-screen');this.phaseHint=$('phase-hint');this.toastEl=$('toast');this.toastTimer=null;this.mapOpen=false;this.pauseOpen=false;this.hudVisible=false;this.playerPos={x:0,z:0};this.pois=GAME_CONFIG.pois;
    this.startButton=$('start-button');this.jumpButton=$('jump-button');this.closeMapButton=$('close-map');this.resumeButton=$('resume-button');this.restartButton=$('restart-button');this.gameOverRestart=$('game-over-restart');
    this.canvas=$('map-canvas');this.ctx=this.canvas.getContext('2d');
    this.poiList=$('poi-list');this.inventoryEl=$('inventory');
  }
  loaded(){this.loading.classList.add('hidden');this.start.classList.remove('hidden');}
  showPlane(){this.start.classList.add('hidden');this.jump.classList.remove('hidden');this.hud.classList.add('hidden');this.hudVisible=false;this.phaseHint.classList.add('hidden');}
  hideJump(){this.jump.classList.add('hidden');this.phaseHint.classList.add('hidden');this.hud.classList.add('hidden');this.hudVisible=false;}
  showHUD(){this.hud.classList.remove('hidden');this.hudVisible=true;this.jump.classList.add('hidden');this.start.classList.add('hidden');this.phaseHint.classList.add('hidden');}
  hideHUD(){this.hud.classList.add('hidden');this.hudVisible=false;}
  showPhaseHint(text){this.phaseHint.textContent=text;this.phaseHint.classList.remove('hidden');}
  toast(message,duration=2300){this.toastEl.textContent=message;this.toastEl.classList.remove('hidden');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.toastEl.classList.add('hidden'),duration);}
  setHealth(health,shield){$('health-label').textContent=Math.max(0,Math.ceil(health));$('health-fill').style.width=`${Math.max(0,Math.min(100,health))}%`;$('shield-label').textContent=Math.max(0,Math.ceil(shield));$('shield-fill').style.width=`${Math.max(0,Math.min(100,shield))}%`;}
  setWeapon(slot,data){$('weapon-name').textContent=data?.name||'Fäuste';$('weapon-rarity').textContent=slot?(GAME_CONFIG.rarity[slot.rarity]?.label||'GEWÖHNLICH').toUpperCase():'KEINE WAFFE';$('weapon-rarity').style.color=slot?`#${(GAME_CONFIG.rarity[slot.rarity]?.color||0xb8c2cc).toString(16).padStart(6,'0')}`:'#b8c2cc';$('ammo-current').textContent=slot?slot.ammo:'—';$('ammo-reserve').textContent=slot?slot.reserve:'—';$('reload-word').textContent='';this.setCrosshairAim(false);}
  setAmmo(slot,data){$('ammo-current').textContent=slot?slot.ammo:'—';$('ammo-reserve').textContent=slot?slot.reserve:'—';}
  setReloading(flag){$('reload-word').textContent=flag?'NACHLADEN …':'';}
  setCrosshairAim(aim){$('crosshair').classList.toggle('hidden',aim);$('aim-label').classList.toggle('hidden',!aim);}
  setBossBar(visible,hp,max){$('boss-bar').classList.toggle('hidden',!visible);$('boss-health-fill').style.width=`${Math.max(0,Math.min(100,hp/max*100))}%`;$('boss-health-label').textContent=`${Math.max(0,Math.ceil(hp))} / ${max}`;}
  setInteract(text){const el=$('interact-prompt');if(text){el.textContent=text;el.classList.remove('hidden');}else el.classList.add('hidden');}
  setLocation(text){$('location-name').textContent=text.toUpperCase();}
  setCompass(yaw){let degrees=(((-yaw*180/Math.PI)%360)+360)%360;const dirs=['N','NO','O','SO','S','SW','W','NW'];const dir=dirs[Math.round(degrees/45)%8];$('compass').textContent=`${dir} · ${String(Math.round(degrees)).padStart(3,'0')}°`;}
  renderInventory(slots,selected){this.inventoryEl.innerHTML='';slots.forEach((slot,i)=>{const div=document.createElement('div');div.className='inventory-slot'+(i===selected?' active':'');const key=document.createElement('span');key.className='slot-number';key.textContent=String(i+1);const icon=document.createElement('span');icon.className='slot-icon';const name=document.createElement('span');name.className='slot-name';if(slot){const d=getWeapon(slot.id)?.WEAPON_DATA;icon.textContent=d?.icon||'◈';name.textContent=d?.short||d?.name||slot.id;div.style.borderColor=`#${(GAME_CONFIG.rarity[slot.rarity]?.color||0xb8c2cc).toString(16).padStart(6,'0')}`;}else{name.textContent='LEER';icon.textContent='·';}div.append(key,icon,name);div.title=slot?`${getWeapon(slot.id)?.WEAPON_DATA.name} (${slot.rarity})`:'Leerer Platz';this.inventoryEl.appendChild(div);});}
  updatePosition(player,world){this.playerPos={x:player.position.x,z:player.position.z};const nearest=this.pois.map(p=>({...p,d:Math.hypot(p.x-this.playerPos.x,p.z-this.playerPos.z)})).sort((a,b)=>a.d-b.d)[0];if(nearest&&nearest.d<230)this.setLocation(nearest.name);else{const biome=world.biomeAt(player.position.x,player.position.z);const names={snow:'Cryvorn',desert:'Zarkora',industry:'Kravent',forest:'Varnyx-Hain',fields:'Avelorn',city:'Nexora',coast:'Marivex-Küste',plains:'Varnyx-Insel'};this.setLocation(names[biome]||'Insel');}}
  openMap(){this.mapOpen=true;this.map.classList.remove('hidden');this.drawMap();}
  closeMap(){this.mapOpen=false;this.map.classList.add('hidden');}
  drawMap(){const c=this.canvas,ctx=this.ctx,w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#102c43';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(w/3000,-h/3000);
    ctx.fillStyle='#435f48';ctx.beginPath();for(let i=0;i<=90;i++){const a=i/90*Math.PI*2,rough=1+Math.sin(a*6.5)*.035+Math.cos(a*10.5)*.025;const x=Math.cos(a)*1430*rough,z=Math.sin(a)*1390*rough;if(i===0)ctx.moveTo(x,z);else ctx.lineTo(x,z);}ctx.closePath();ctx.fill();
    const regions=[[-680,-150,550,650,'#244935'],[700,-500,700,600,'#d0d9d9'],[720,650,650,650,'#ba8b55'],[-650,560,800,450,'#a2a05a'],[560,-100,470,450,'#646458']];for(const [x,z,ww,hh,col] of regions){ctx.fillStyle=col;ctx.globalAlpha=.52;ctx.fillRect(x-ww/2,z-hh/2,ww,hh);}ctx.globalAlpha=1;
    ctx.strokeStyle='#31383c';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(0,950);ctx.lineTo(0,-600);ctx.lineTo(250,-150);ctx.lineTo(680,-190);ctx.moveTo(-500,-820);ctx.lineTo(0,-300);ctx.lineTo(-330,250);ctx.lineTo(-730,500);ctx.moveTo(680,-190);ctx.lineTo(720,670);ctx.stroke();
    for(const p of this.pois){ctx.beginPath();ctx.fillStyle=p.id==='Noxhaven'?'#f37b49':'#f0e9d6';ctx.arc(p.x,p.z,p.id==='Noxhaven'?24:16,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0a131b';ctx.lineWidth=5;ctx.stroke();}
    ctx.beginPath();ctx.fillStyle='#5ff1cd';ctx.arc(this.playerPos.x,this.playerPos.z,23,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#06241d';ctx.lineWidth=6;ctx.stroke();ctx.restore();
    this.poiList.innerHTML='';for(const p of this.pois){const tag=document.createElement('span');tag.className='poi-tag';tag.textContent=`${p.id==='Noxhaven'?'☠ ':''}${p.name}`;this.poiList.appendChild(tag);}
  }
  showPause(){this.pauseOpen=true;this.pause.classList.remove('hidden');}
  hidePause(){this.pauseOpen=false;this.pause.classList.add('hidden');}
  gameOver(title,message){$('game-over-title').textContent=title;$('game-over-message').textContent=message;this.over.classList.remove('hidden');}
  hideGameOver(){this.over.classList.add('hidden');}
  showTouchControls(){if(('ontouchstart'in window)||navigator.maxTouchPoints>0)$('touch-controls').classList.remove('hidden');}
}
