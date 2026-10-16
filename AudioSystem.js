import { GAME_CONFIG } from './config.js';
export class AudioSystem {
  constructor(){this.ctx=null;this.enabled=true;this.buffers={};this.external={};this.unlocked=false;}
  async unlock(){if(this.unlocked)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();await this.ctx.resume();this.unlocked=true;}catch(e){this.enabled=false;}}
  loadExternal(){
    const url=GAME_CONFIG.externalSounds.ghostfaceAlert;
    if(!url)return;
    const audio=new Audio();audio.src=url;audio.preload='auto';audio.volume=.42;audio.crossOrigin='anonymous';this.external.ghostfaceAlert=audio;
    audio.addEventListener('error',()=>{this.external.ghostfaceAlert=null;},{once:true});
  }
  async playExternal(name){const a=this.external[name];if(!a)return;try{const copy=a.cloneNode();copy.volume=a.volume;await copy.play();}catch(e){/* Browser may require a gesture or block cross-origin media. */}}
  tone(freq=440,duration=.08,type='sawtooth',volume=.035,slide=0){if(!this.enabled||!this.ctx)return;try{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),this.ctx.currentTime+duration);g.gain.setValueAtTime(volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration+.01);}catch(e){}}
  noise(duration=.1,volume=.025,filter=1200){if(!this.enabled||!this.ctx)return;const n=Math.max(1,Math.floor(this.ctx.sampleRate*duration)),buffer=this.ctx.createBuffer(1,n,this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n);const src=this.ctx.createBufferSource(),flt=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=buffer;flt.type='lowpass';flt.frequency.value=filter;g.gain.value=volume;g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);src.connect(flt);flt.connect(g);g.connect(this.ctx.destination);src.start();src.stop(this.ctx.currentTime+duration);}
  play(name){switch(name){case 'shoot':this.tone(160,.065,'sawtooth',.035,-90);this.noise(.05,.03,2400);break;case 'gatling':this.tone(110,.048,'square',.023,-55);this.noise(.04,.018,1800);break;case 'melee':this.tone(540,.11,'triangle',.035,-360);this.noise(.07,.02,900);break;case 'reload':this.tone(280,.07,'square',.025,-110);break;case 'pickup':this.tone(680,.09,'sine',.03,180);this.tone(880,.11,'sine',.02,100);break;case 'hit':this.tone(85,.12,'triangle',.045,-35);break;case 'mark':this.tone(740,.18,'sine',.028,420);break;case 'alert':this.tone(90,.55,'sawtooth',.05,-50);this.playExternal('ghostfaceAlert');break;case 'shell':this.tone(1700,.025,'square',.006,-500);break;case 'bone':this.tone(420,.12,'triangle',.03,-240);break;case 'land':this.noise(.2,.055,350);this.tone(85,.17,'sine',.06,-30);break;case 'jump':this.tone(300,.15,'triangle',.025,250);break;case 'empty':this.tone(140,.05,'square',.025,-70);break;}}
  setEnabled(v){this.enabled=v;if(this.ctx&&!v)this.ctx.suspend();else if(this.ctx&&v)this.ctx.resume();}
}
