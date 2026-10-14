'use strict';
const canvas=document.querySelector('#field'),ctx=canvas.getContext('2d');
const ui=id=>document.getElementById(id);
let state,last=0;
const bases=[190,910], y=226;
function say(text){ui('message').textContent=text;}
function reset(){if(ui('result').open)ui('result').close();state={mode:ui('mode').value||'solo',stats:{hits:0,swaps:0},role:ui('startRole').value||'bat',paused:false,target:1,throwTimer:0,team:ui('team').value||'orange',score:0,enemy:0,phase:'waiting',timer:1.7,ball:{x:110,y},run:0,swapped:false,flight:0,returning:0,swing:0,aiRun:0,cross:0,broken:-1};say(state.role==='bat'?'A bola vem aí. Rebata perto do círculo da direita!':'Você está com a bola. Espere os adversários correrem e lance!');sync();}
function sync(){const local=state.mode==='local';ui('localControls').hidden=!local;ui('teamLabel').textContent=local?'JOGADOR 1':'SUA DUPLA';ui('enemyLabel').textContent=local?'JOGADOR 2':'DUPLA DA RUA';ui('p2hit').textContent=state.role==='bat'?'J2 · Lançar':'J2 · Rebater';ui('p2run').disabled=state.role==='bat'||!['chase','returnShot'].includes(state.phase)||state.run>0;ui('p2cross').disabled=state.role==='bat'||state.enemy<100||state.phase==='won';ui('p2aim').textContent='J2 · Alvo: '+(state.target?'direita':'esquerda');ui('score').textContent=state.score;ui('enemyScore').textContent=state.enemy;ui('progress').style.width=state.score+'%';ui('phase').textContent=state.phase==='won'?'Fim de partida':local?'J1: '+(state.role==='bat'?'tacos · J2: bola':'bola · J2: tacos'):state.role==='bat'?'Sua dupla está com os tacos':'Sua dupla está com a bola';ui('claim').hidden=state.phase!=='roof';ui('hit').textContent=state.role==='bat'?'Rebater':'Lançar';ui('aim').hidden=state.role==='bat';ui('aim').textContent='Alvo: '+(state.target?'direita':'esquerda')+' ⇄';ui('cross').disabled=state.score<100||state.role!=='bat'||state.phase==='won';const exposed=state.run>0||state.aiRun>0;ui('danger').textContent=exposed?'⚠ Garrafas desprotegidas!':'Garrafas protegidas';ui('danger').className=exposed?'exposed':'';ui('pause').textContent=state.paused?'Continuar':'Pausar';ui('run').disabled=state.role!=='bat'||!['chase','returnShot'].includes(state.phase)||state.run>0;}
function swap(){state.stats.swaps++;state.role=state.role==='bat'?'ball':'bat';state.phase='waiting';state.timer=2;state.run=0;state.aiRun=0;state.throwTimer=0;state.broken=state.target;state.ball={x:110,y};say('Garrafa derrubada! As duplas trocam de função.');sync();}
function win(player){state.winner=player;state.phase='won';say(player?'Vitória! Os tacos se cruzam no meio da rua.':'A dupla da rua venceu. Bora uma revanche?');ui('resultTitle').textContent=state.mode==='local'?'Jogador '+(player?'1':'2')+' venceu!':player?'Sua dupla venceu!':'A dupla da rua venceu!';ui('resultScore').textContent='Placar: '+state.score+' × '+state.enemy;ui('resultStats').textContent=state.stats.hits+' rebatidas · '+state.stats.swaps+' trocas de função';sync();ui('result').showModal();}
function hit(){
 if(state.mode==='local'){localAction(1,'hit');return;}
 if(state.paused||ui('rules').open||['won','roof','crossing'].includes(state.phase))return;
 if(state.role==='bat'){
  if(state.phase==='pitch'&&Math.abs(state.ball.x-870)<65){state.stats.hits++;state.phase='chase';state.flight=0;state.returning=5.5+Math.random()*3;state.roof=Math.random()<.08;state.swing=.35;say('Boa rebatida! Aperte R para trocar de círculo.');}
  else{state.swing=.25;say('Espere a bola chegar perto do batedor da direita.');}
 }else if(state.phase==='aiChase'){
  if(state.throwTimer>0){say('Buscando a bola… espere para lançar novamente.');return;}
  state.throwTimer=.75;state.shotTarget=state.target;state.ball={x:state.target?110:990,y};say('Bola lançada! Precisa acertar enquanto a garrafa está desprotegida.');
 }else if(state.phase==='waiting'){state.timer=0;}
}
function aim(){if(state.mode==='local'){localAction(1,'aim');return;}if(state.role==='ball'&&!state.paused&&state.throwTimer===0){state.target=1-state.target;sync();}}
function pause(){if(state.phase==='won')return;state.paused=!state.paused;document.querySelector('.game').classList.toggle('paused',state.paused);sync();}
function run(){if(state.mode==='local'){localAction(1,'run');return;}if(!state.paused&&state.role==='bat'&&state.phase==='chase'&&state.run===0&&state.score<100){state.run=.95;say('Correndo! A garrafa está desprotegida.');}}
function cross(){if(state.mode==='local'){localAction(1,'cross');return;}if(!state.paused&&state.role==='bat'&&state.score>=100&&state.phase!=='won'&&state.phase!=='crossing'){state.phase='crossing';state.cross=0;say('Indo ao meio da rua para cruzar os tacos…');}}
function claim(){if(!state.paused&&state.phase==='roof')win(state.role==='bat');}
function update(dt){if(state.paused)return;state.swing=Math.max(0,state.swing-dt);if(state.phase==='won')return;if(state.mode==='local'){updateLocal(dt);sync();return;}if(state.phase==='crossing'){state.cross+=dt;if(state.cross>=1.2)win(true);return;}
if(state.phase==='waiting'){state.timer-=dt;if(state.timer<=0){state.broken=-1;state.ball={x:110,y};if(state.role==='bat'){state.phase='pitch';say('Agora! Rebata quando a bola chegar perto de você.');}else{state.phase='aiChase';state.returning=6;state.aiDelay=.8;state.throwTimer=0;say('Eles rebateram! Lance quando estiverem fora do círculo.');}}}
if(state.phase==='pitch'){state.ball.x+=390*dt;if(state.ball.x>945){state.phase='waiting';state.timer=1.2;say('Taco no círculo, garrafa protegida. Tente a próxima bola!');}}
if(state.phase==='chase'){state.flight+=dt;state.returning-=dt;state.ball={x:870-Math.min(state.flight/1.4,1)*430,y:y-Math.sin(Math.min(state.flight/1.4,1)*Math.PI/2)*155};if(state.roof&&state.flight>1.4){state.phase='roof';state.run=0;say('A bola ficou no telhado! Aperte V ou “Gritar vitória!”.');sync();return;}if(state.run>0){state.run=Math.max(0,state.run-dt);if(state.run===0){state.score+=10;state.swapped=!state.swapped;say(state.score===100?'100 pontos! Aperte X para finalizar no meio da rua.':'Troca completa! +10 pontos. Pode correr de novo.');sync();}}if(state.returning<=0){if(state.run>0)swap();else{state.phase='waiting';state.timer=1.4;state.ball={x:110,y};say(state.score>=100?'Faça o X no meio da rua para vencer!':'Eles buscaram a bola. Tacos nos círculos!');}}}
if(state.phase==='enemyCrossing'){state.cross+=dt;if(state.cross>=1.2)win(false);sync();return;}
if(state.phase==='aiChase'){
if(state.throwTimer>0){const previous=state.throwTimer;state.throwTimer=Math.max(0,state.throwTimer-dt);if(previous>.35&&state.throwTimer<=.35){if(state.aiRun>0){swap();return;}say('A bola acertou, mas o taco protegeu a garrafa.');}const t=Math.min((.75-state.throwTimer)/.4,1);state.ball={x:(state.shotTarget?110:990)+((state.shotTarget?910:190)-(state.shotTarget?110:990))*t,y};}
state.returning-=dt;if(state.aiRun>0){state.aiRun=Math.max(0,state.aiRun-dt);if(!state.aiRun){state.enemy+=10;state.swapped=!state.swapped;state.aiDelay=.65;if(state.enemy>=100){state.phase='enemyCrossing';state.cross=0;say('Eles chegaram a 100! Vão cruzar os tacos no meio.');}sync();}}else{state.aiDelay-=dt;if(state.aiDelay<=0)state.aiRun=1.1;}if(state.returning<=0&&state.phase==='aiChase'){state.phase='waiting';state.timer=1;state.aiRun=0;say('A dupla adversária voltou aos círculos. Lance outra bola.');}}sync();}
// In local play both people keep their team while the bat/ball roles swap.
function localAction(player,action){
 if(state.mode!=='local'||state.paused||ui('rules').open||ui('result').open||['won','roof','crossing','enemyCrossing'].includes(state.phase))return;
 const batting=player===(state.role==='bat'?1:2);
 if(action==='aim'&&!batting&&state.throwTimer===0&&['waiting','chase'].includes(state.phase)){state.target=1-state.target;say('Alvo escolhido: '+(state.target?'direita':'esquerda')+'.');}
 if(action==='hit'&&batting){
  state.swing=.3;
  if(state.phase==='pitch'&&Math.abs(state.ball.x-(state.target?870:230))<65){state.stats.hits++;state.phase='chase';state.flight=0;state.returning=5.5+Math.random()*2;state.roof=Math.random()<.08;say('Rebatida! A dupla com os tacos pode correr.');}
 }
 if(action==='hit'&&!batting){
  if(state.phase==='waiting'){state.broken=-1;state.ball={x:state.target?110:990,y};state.phase='pitch';say('Bola lançada! A outra dupla precisa rebater.');}
  else if(state.phase==='chase'&&state.returning<=0&&state.throwTimer===0){state.phase='returnShot';state.shotTarget=state.target;state.throwTimer=.75;say('Tentativa de derrubar a garrafa!');}
  else say('Buscando a bola… espere o aviso de bola na mão.');
 }
 if(action==='run'&&batting&&['chase','returnShot'].includes(state.phase)&&state.run===0&&(player===1?state.score:state.enemy)<100){state.run=.95;say('Correndo! Garrafas desprotegidas.');}
 if(action==='cross'&&batting&&(player===1?state.score:state.enemy)>=100){state.phase=player===1?'crossing':'enemyCrossing';state.cross=0;say('A dupla vai ao meio para cruzar os tacos!');}
 sync();
}
function updateLocal(dt){
 if(['crossing','enemyCrossing'].includes(state.phase)){state.cross+=dt;if(state.cross>=1.2)win(state.phase==='crossing');return;}
 if(state.phase==='pitch'){
  state.ball.x+=(state.target?1:-1)*390*dt;
  if(state.target?state.ball.x>945:state.ball.x<155){state.phase='waiting';say('Garrafa protegida. A dupla da bola pode lançar de novo.');}
 }
 if(['chase','returnShot'].includes(state.phase)){
  // Resolve impact before completing a run in this frame.
  if(state.phase==='returnShot'){
   const previous=state.throwTimer;state.throwTimer=Math.max(0,state.throwTimer-dt);
   const t=Math.min((.75-state.throwTimer)/.4,1);state.ball={x:(state.shotTarget?110:990)+(state.shotTarget?800:-800)*t,y};
   if(previous>.35&&state.throwTimer<=.35&&state.run>0){swap();return;}
   if(state.throwTimer===0){state.phase='waiting';say('Taco no círculo: garrafa protegida. Pode lançar de novo.');}
  }else{
   state.flight+=dt;const previous=state.returning;state.returning=Math.max(0,state.returning-dt);
   state.ball={x:(state.target?870:230)+(state.target?-430:430)*Math.min(state.flight/1.4,1),y:y-Math.sin(Math.min(state.flight/1.4,1)*Math.PI/2)*155};
   if(state.roof&&state.flight>1.4){state.phase='roof';state.run=0;say('Bola no telhado! A dupla dos tacos pode gritar vitória (V).');return;}
   if(previous>0&&state.returning===0)say('Bola na mão! A dupla lançadora pode tentar derrubar uma garrafa.');
  }
  if(state.run>0){state.run=Math.max(0,state.run-dt);if(state.run===0){if(state.role==='bat')state.score+=10;else state.enemy+=10;state.swapped=!state.swapped;say('Troca completa! +10 pontos.'+((state.role==='bat'?state.score:state.enemy)>=100?' Faça o X para vencer!':''));}}
 }
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function line(x,y,a,b,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function person(x,py,color,bat,angle=0){ctx.save();ctx.translate(x,py);ctx.rotate(angle);ctx.fillStyle='#33433325';ctx.beginPath();ctx.ellipse(8,13,13,6,0,0,7);ctx.fill();rect(-8,-1,16,22,color);line(-5,20,-7,33,'#38483a',5);line(5,20,8,33,'#38483a',5);circle(0,-8,8,'#d9aa7b');rect(-8,-14,16,5,color);line(-7,5,-18,15,'#d9aa7b',5);line(7,5,18,15,'#d9aa7b',5);if(bat){const side=x<550?-1:1;line(side*18,15,side*40,state.swing>0?-20:28,'#a37644',6);}ctx.restore();}
function draw(){ctx.clearRect(0,0,1100,420);rect(0,0,1100,420,'#dbe4cc');rect(0,123,1100,221,'#999f8e');rect(0,134,1100,200,'#aaa99a');rect(0,123,1100,10,'#c4c7b6');rect(0,334,1100,10,'#c4c7b6');
for(let i=0;i<8;i++){const x=i*157-15;rect(x,10,130,81,i%2?'#dfc9aa':'#d0d4b5');rect(x-6,7,142,16,i%2?'#af775b':'#8c9b74');rect(x+48,46,26,45,'#738375');rect(x+12,38,22,22,'#9aaf9e');rect(x+90,38,22,22,'#9aaf9e');line(x,98,x+130,98,'#c8cfb8',3);rect(x,368,125,52,'#c5d1b2');}
for(const x of [50,1030]){rect(x,69,7,48,'#84765b');circle(x+3,64,28,'#8fa879');circle(x-12,51,19,'#a1b587');circle(x+16,49,21,'#789866');}
ctx.setLineDash([24,22]);line(310,237,790,237,'#e3debd',3);ctx.setLineDash([]);
for(let i=0;i<2;i++){let x=bases[i];ctx.strokeStyle=state.run>0||state.aiRun>0?'#ec724a':'#f4eee0';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,36,28,0,0,7);ctx.stroke();ctx.beginPath();ctx.arc(x,y-4,19,Math.PI,Math.PI*2);ctx.stroke();if(state.broken!==i){rect(x-5,y-8,10,23,'#5e8972');rect(x-3,y-14,6,8,'#5e8972');rect(x-4,y+1,8,7,'#d5dabb');}else{rect(x+5,y+6,20,7,'#5e8972');}}
let t=state.mode==='local'?state.run:state.role==='bat'?state.run:state.aiRun;let amount=t>0?1-t/(state.mode==='local'?.95:state.role==='bat'?.95:1.1):0;let left=state.swapped?870:230,right=state.swapped?230:870;let a=left+(right-left)*amount,b=right+(left-right)*amount;if(['crossing','enemyCrossing'].includes(state.phase)||state.phase==='won'&&(state.score>=100||state.enemy>=100)){const p=Math.min(state.cross/1.2,1);a=left+(530-left)*p;b=right+(570-right)*p;}
person(a,y-28,state.role==='bat'?(state.team==='orange'?'#d85c38':'#3f6f87'):(state.team==='orange'?'#3f6f87':'#d85c38'),true);person(b,y-28,state.role==='bat'?(state.team==='orange'?'#d85c38':'#3f6f87'):(state.team==='orange'?'#3f6f87':'#d85c38'),true);
let chase=state.phase==='chase'?Math.min(state.flight/2,1):0;person(110+chase*285,y-24-chase*115,state.role==='bat'?(state.team==='orange'?'#3f6f87':'#d85c38'):(state.team==='orange'?'#d85c38':'#3f6f87'),false);person(990-chase*480,y-24-chase*110,state.role==='bat'?(state.team==='orange'?'#3f6f87':'#d85c38'):(state.team==='orange'?'#d85c38':'#3f6f87'),false);
if(['pitch','chase','roof','returnShot'].includes(state.phase)||state.phase==='aiChase'&&state.throwTimer>0){circle(state.ball.x+3,state.ball.y+8,6,'#454d3b33');circle(state.ball.x,state.ball.y,5,'#fff7d7');}
ctx.fillStyle='#edf0df';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('CÍRCULO 01',190,302);ctx.fillText('CÍRCULO 02',910,302);ctx.fillStyle='#738567';ctx.font='11px Arial';ctx.fillText('RUA DAS BOAS MEMÓRIAS',550,391);
if(state.phase==='won'){rect(340,146,420,115,'#f5f2e9');ctx.fillStyle='#273e32';ctx.font='bold 28px Arial';ctx.fillText(state.winner?'VITÓRIA DA SUA DUPLA!':'FIM DE PARTIDA',550,190);ctx.font='14px Arial';ctx.fillText('Uma rua, quatro amigos e mais uma história.',550,220);line(534,236,566,255,'#a37644',5);line(566,236,534,255,'#a37644',5);}}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!ui('rules').open)update(dt);draw();requestAnimationFrame(frame);}
ui('p2hit').onclick=()=>localAction(2,'hit');ui('p2run').onclick=()=>localAction(2,'run');ui('p2cross').onclick=()=>localAction(2,'cross');ui('p2aim').onclick=()=>localAction(2,'aim');ui('rematch').onclick=()=>ui('restart').click();ui('dismissResult').onclick=()=>ui('result').close();ui('hit').onclick=hit;ui('run').onclick=run;ui('cross').onclick=cross;ui('claim').onclick=claim;ui('restart').onclick=()=>{reset();document.querySelector('.game').classList.remove('paused');};ui('pause').onclick=pause;ui('aim').onclick=aim;ui('help').onclick=()=>ui('rules').showModal();ui('close').onclick=ui('play').onclick=()=>ui('rules').close();document.addEventListener('keydown',e=>{if(ui('rules').open||ui('result').open||e.repeat||['SELECT','INPUT','BUTTON'].includes(e.target.tagName))return;const k=e.key.toLowerCase();if(k===' '){e.preventDefault();hit();}if(state.mode==='local'){if(k==='enter'){e.preventDefault();localAction(2,'hit');}if(k==='l')localAction(2,'run');if(k==='k')localAction(2,'cross');if(k==='j')localAction(2,'aim');}if(k==='p')pause();if(k==='a')aim();if(k==='r')run();if(k==='x')cross();if(k==='v')claim();});reset();requestAnimationFrame(frame);
