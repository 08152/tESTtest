import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';
import { createWorld } from './world.js';
import { PlayerController } from './player.js';
import { AudioSystem } from './AudioSystem.js';
import { GameUI } from './UI.js';
import { WeaponSystem } from './WeaponSystem.js';
import { EnemyManager } from './EnemyAI.js';
import { getWeapon } from './WeaponRegistry.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(74, window.innerWidth/window.innerHeight, .08, 4200);
scene.add(camera);

const ambient = new THREE.HemisphereLight(0x9bb6d2, 0x1b221d, 1.25);
scene.add(ambient);
const moonFill = new THREE.DirectionalLight(0x8eacdc, 1.15);
moonFill.position.set(-800,900,-900);
scene.add(moonFill);

const world = createWorld(scene);
const audio = new AudioSystem();
const ui = new GameUI();
const player = new PlayerController(camera, scene, canvas);
const weaponSystem = new WeaponSystem(scene, camera, player, audio, {
  toast:(m)=>ui.toast(m),
  inventory:(s,i)=>ui.renderInventory(s,i),
  weapon:(slot,data)=>ui.setWeapon(slot,data),
  ammo:(slot,data)=>ui.setAmmo(slot,data),
  reload:(v)=>ui.setReloading(v),
  bossBar:(v,h,m)=>ui.setBossBar(v,h,m)
});
const enemies = new EnemyManager(scene, player, audio, weaponSystem, {
  toast:(m)=>ui.toast(m),
  bossBar:(v,h,m)=>ui.setBossBar(v,h,m)
});
weaponSystem.setEnemyManager(enemies);

let started = false;
let last = performance.now();
let accumulator = 0;
let gameEnded = false;

function syncHUD(){
  ui.setHealth(player.health, player.shield);
  const state=weaponSystem.getHUDState();
  ui.setWeapon(state.slot,state.data);
  ui.setAmmo(state.slot,state.data);
  ui.setReloading(state.reloading);
  ui.setCrosshairAim(state.aiming);
  ui.renderInventory(state.slots,state.selected);
  ui.updatePosition(player,world);
  ui.setInteract(weaponSystem.getNearbyDescription());
  ui.setCompass(player.yaw);
}

function startRun(){
  started=true; gameEnded=false;
  audio.unlock();
  audio.loadExternal();
  player.resetPlane();
  weaponSystem.slots.fill(null);
  weaponSystem.selected=0;
  weaponSystem.equip(0);
  weaponSystem.spawnInitialLoot();
  ui.hideGameOver();
  ui.showPlane();
  ui.toast('Militärflugzeug über der Insel · bereit zum Absprung',3500);
}

function beginJump(){
  audio.unlock();
  player.jumpFromPlane();
  ui.hideJump();
  ui.showPhaseHint('ABSprung · LEERTASTE: FALLSCHIRM');
  audio.play('jump');
}

function onLanded(){
  ui.showHUD();
  ui.toast('Landung abgeschlossen · Noxhaven liegt im Nebel …',3200);
  audio.play('land');
}

function endGame(){
  if(gameEnded)return;
  gameEnded=true;player.phase='gameover';ui.hideHUD();ui.gameOver('DU WURDEST BESIEGT','Die Insel bleibt in ewiger Halloween-Nacht. Starte eine neue Runde.');
}

function restart(){
  location.reload();
}

// Start/menu actions.
document.getElementById('start-button').addEventListener('click',startRun);
document.getElementById('jump-button').addEventListener('click',beginJump);
document.getElementById('resume-button').addEventListener('click',()=>ui.hidePause());
document.getElementById('restart-button').addEventListener('click',restart);
document.getElementById('game-over-restart').addEventListener('click',restart);
document.getElementById('close-map').addEventListener('click',()=>ui.closeMap());

// Mouse controls. Pointer lock is requested by clicking the game canvas.
canvas.addEventListener('mousedown',e=>{
  if(!started || player.phase!=='playing' || ui.mapOpen || ui.pauseOpen)return;
  if(e.button===0)weaponSystem.fire();
  if(e.button===2)weaponSystem.setAim(true);
});
window.addEventListener('mouseup',e=>{if(e.button===2)weaponSystem.setAim(false);});
window.addEventListener('contextmenu',e=>{if(started)e.preventDefault();});

window.addEventListener('keydown',e=>{
  if(e.code==='Enter' && !started){startRun();return;}
  if(e.code==='Escape'){
    if(ui.mapOpen){ui.closeMap();return;}
    if(player.phase==='playing'){ui.pauseOpen?ui.hidePause():ui.showPause();}
  }
  if(player.phase!=='playing'){
    if(player.phase==='airborne' && e.code==='Space')player.deployParachute();
    return;
  }
  if(e.code==='KeyE'){weaponSystem.pickupNearest();}
  if(e.code==='KeyQ'){weaponSystem.dropCurrent();}
  if(e.code==='KeyR'){weaponSystem.reload();}
  if(e.code==='KeyM'){ui.mapOpen?ui.closeMap():ui.openMap();}
  if(/^Digit[1-5]$/.test(e.code)){weaponSystem.equip(Number(e.code.slice(-1))-1);}
});

// Simple touch support for Chromebooks/tablets.
ui.showTouchControls();
const touchStick=document.getElementById('touch-stick');
const touchKnob=document.getElementById('touch-knob');
let touchId=null, touchOrigin=null;
touchStick?.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchId=t.identifier;touchOrigin={x:t.clientX,y:t.clientY};e.preventDefault();},{passive:false});
touchStick?.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===touchId){let dx=t.clientX-touchOrigin.x,dy=t.clientY-touchOrigin.y;const len=Math.hypot(dx,dy)||1;const max=55;if(len>max){dx=dx/len*max;dy=dy/len*max;}player.touchMove.x=dx/max;player.touchMove.y=-dy/max;touchKnob.style.transform=`translate(${dx}px,${dy}px)`;}e.preventDefault();},{passive:false});
touchStick?.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===touchId){touchId=null;player.touchMove.x=player.touchMove.y=0;touchKnob.style.transform='translate(0,0)';}},{passive:false});
document.getElementById('touch-fire')?.addEventListener('touchstart',e=>{e.preventDefault();weaponSystem.fire();},{passive:false});
document.getElementById('touch-reload')?.addEventListener('touchstart',e=>{e.preventDefault();weaponSystem.reload();},{passive:false});
document.getElementById('touch-pickup')?.addEventListener('touchstart',e=>{e.preventDefault();weaponSystem.pickupNearest();},{passive:false});
document.getElementById('touch-jump')?.addEventListener('touchstart',e=>{e.preventDefault();if(player.phase==='airborne')player.deployParachute();else if(player.phase==='playing'&&player.grounded)player.keys.add('Space');},{passive:false});

// Keep the UI off during the flight/parachute phase exactly as requested.
function updatePhaseUI(){
  if(player.phase==='plane'){ui.hideHUD();}
  else if(player.phase==='airborne'){ui.hideHUD();ui.showPhaseHint(player.parachute?'FALLSCHIRM · STEUERN MIT WASD':'ABSPrung · LEERTASTE: FALLSCHIRM');}
  else if(player.phase==='playing'){ui.showHUD();}
}

function tick(now){
  const raw=Math.min(.05,(now-last)/1000);last=now;accumulator+=raw;
  const dt=Math.min(.033,raw);
  if(started&&!ui.pauseOpen&&!ui.mapOpen&&!gameEnded){
    const result=player.update(dt);
    if(result.landed)onLanded();
    weaponSystem.update(dt);
    enemies.update(dt);
    if(player.health<=0)endGame();
    updatePhaseUI();
    syncHUD();
  }
  // Subtle camera damage flash.
  if(player.damageFlash>0)document.body.style.setProperty('--damage-flash',String(player.damageFlash/.28));
  else document.body.style.setProperty('--damage-flash','0');
  renderer.render(scene,camera);
  requestAnimationFrame(tick);
}

window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.35));renderer.setSize(window.innerWidth,window.innerHeight,false);
});

// Loading is intentionally short because the world is generated locally.
setTimeout(()=>ui.loaded(),250);
ui.renderInventory(weaponSystem.slots,weaponSystem.selected);
requestAnimationFrame(tick);
