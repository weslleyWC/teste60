'use strict';
window.TacoAudio=(()=>{
 let context=null,master=null,noiseBuffer=null,muted=false,volume=.45,hidden=false;const cooldown=new Map(),voices=new Set();
 const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 muted=read('recreio.audio.muted')==='true';const saved=read('recreio.audio.volume');if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));
 function remember(){try{localStorage.setItem('recreio.audio.muted',String(muted));localStorage.setItem('recreio.audio.volume',String(volume));}catch{}}
 function sync(){const button=document.getElementById('sound'),slider=document.getElementById('volume'),output=document.getElementById('volumeValue');if(button){button.textContent=muted?'Som desligado':'Som ligado';button.setAttribute('aria-pressed',String(!muted));}if(slider)slider.value=String(Math.round(volume*100));if(output)output.textContent=Math.round(volume*100)+'%';if(master)master.gain.setTargetAtTime(muted||hidden?0:volume*.45,context.currentTime,.02);}
 async function unlock(){
  if(muted||hidden)return;
  try{
   if(!context){const API=window.AudioContext||window.webkitAudioContext;if(!API)return;context=new API();master=context.createGain();const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;master.connect(limiter);limiter.connect(context.destination);
    noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.5),context.sampleRate);const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++){const n=Math.sin(i*127.1+311.7)*43758.5453;samples[i]=(n-Math.floor(n))*2-1;}sync();}
   if(context.state==='suspended')await context.resume();
  }catch{const button=document.getElementById('sound');if(button){button.textContent='Som indisponível';button.disabled=true;}}
 }
 function envelope(gain,start,duration,level){gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level),start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);}
 function connect(source,gain){source.connect(gain);gain.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};}
 function tone(frequency,duration,level=.25,type='sine',offset=0,endFrequency=frequency){const start=context.currentTime+offset,source=context.createOscillator(),gain=context.createGain();source.type=type;source.frequency.setValueAtTime(frequency,start);source.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+duration);envelope(gain,start,duration,level);connect(source,gain);source.start(start);source.stop(start+duration+.02);}
 function noise(duration,level,frequency){const start=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;source.connect(filter);filter.connect(gain);gain.connect(master);envelope(gain,start,duration,level);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(start);source.stop(start+duration);}
 function play(kind){
  if(!context||context.state!=='running'||muted||hidden||volume===0||voices.size>24)return false;
  const now=context.currentTime,interval=kind==='step'?.13:.07;if(now-(cooldown.get(kind)??-Infinity)<interval)return false;cooldown.set(kind,now);
  switch(kind){
   case 'throw':noise(.16,.17,1900);tone(330,.12,.08,'sine',0,180);break;
   case 'bat':noise(.09,.5,2100);tone(210,.16,.5,'triangle',0,75);break;
   case 'bounce':tone(170,.07,.2,'sine',0,55);break;
   case 'step':noise(.045,.055,460);tone(90,.045,.025,'sine',0,55);break;
   case 'ouch':tone(390,.14,.22,'triangle',0,160);noise(.07,.18,650);break;
   case 'bottle':noise(.2,.32,3500);tone(690,.15,.2,'sine',0,210);tone(930,.09,.1,'sine',.06,380);break;
   case 'catch':noise(.065,.12,750);tone(130,.08,.12,'sine',0,80);break;
   case 'drop':noise(.075,.17,600);tone(190,.13,.13,'sine',0,60);break;
   case 'climb':noise(.07,.08,1100);tone(240,.08,.07,'triangle',0,180);break;
   case 'point':tone(440,.12,.15,'sine');tone(660,.18,.15,'sine',.1);break;
   case 'win':[523,659,784,1047].forEach((f,i)=>tone(f,.28,.2,'triangle',i*.14));break;
   default:return false;
  }
  return true;
 }
 function setHidden(value){hidden=value;sync();if(hidden)for(const source of voices){try{source.stop();}catch{}}}
 const button=document.getElementById('sound');if(button)button.onclick=()=>{muted=!muted;remember();sync();if(!muted)unlock();};
 const slider=document.getElementById('volume');if(slider)slider.oninput=()=>{volume=Number(slider.value)/100;remember();sync();};
 document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',e=>{if(!e.repeat)unlock();},{capture:true});
 document.addEventListener('visibilitychange',()=>setHidden(document.hidden));sync();
 return {play,setHidden};
})();
