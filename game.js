'use strict';
const canvas=document.querySelector('#field'),ctx=canvas.getContext('2d');
const ui=id=>document.getElementById(id), bases=[190,910], y=226;
const keys=new Set();let state,last=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function say(text){ui('message').textContent=text;}
function battingPlayer(){return state.role==='bat'?1:2;}
function fieldingPlayer(){return 3-battingPlayer();}
function human(player){return player===1||state.mode==='local';}
function characters(player){return player===battingPlayer()?state.bats:state.fielders;}
function selected(player){return characters(player)[state.selected[player-1]];}
function blocked(){return state.paused||ui('rules').open||ui('result').open||['won','crossing'].includes(state.phase);}
function reset(){if(ui('result').open)ui('result').close();keys.clear();state={mode:ui('mode').value,team:ui('team').value,role:ui('startRole').value,score:0,enemy:0,stats:{hits:0,swaps:0},phase:'ready',paused:false,selected:[0,0],charges:[null,null],target:1,swapped:false,aiTimer:1.5,swing:0,cross:0,broken:-1};placePlayers();say('Movimente-se, escolha sua jogada e proteja as garrafas.');sync();document.querySelector('.game').classList.remove('paused');}
function placePlayers(){state.bats=bases.map(x=>({x,y,goal:null}));state.fielders=[{x:110,y,goal:null,side:1,throwLimit:110,elevation:0},{x:990,y,goal:null,side:-1,throwLimit:990,elevation:0}];state.ball={x:110,y,z:0,vx:0,vy:0,vz:0,owner:0,kind:'throw',touchedGround:false};state.selected[fieldingPlayer()-1]=0;state.selected[battingPlayer()-1]=1;state.aim={x:910,y};state.expected=[1,0];state.running=false;state.charges=[null,null];}
function protectedBase(i){return state.bats.some(p=>distance(p,{x:bases[i],y})<34);}
function sync(){const local=state.mode==='local',bp=battingPlayer();ui('localControls').hidden=!local;ui('mousePlayerLabel').hidden=!local;ui('skill2').hidden=!local;ui('teamLabel').textContent=local?'JOGADOR 1':'SUA DUPLA';ui('enemyLabel').textContent=local?'JOGADOR 2':'DUPLA DA RUA';ui('score').textContent=state.score;ui('enemyScore').textContent=state.enemy;ui('progress').style.width=state.score+'%';ui('phase').textContent=state.phase==='won'?'Fim de partida':local?`J${bp}: tacos · J${3-bp}: bola`:bp===1?'Sua dupla está com os tacos':'Sua dupla está com a bola';for(const [player,prefix]of [[1,''],[2,'p2']]){const bat=player===bp;ui(prefix?prefix+'hit':'hit').textContent=(prefix?'J2 · ':'')+(bat?'Rebater':'Lançar');ui(prefix?prefix+'run':'run').disabled=!bat||!state.running;ui(prefix?prefix+'cross':'cross').disabled=!bat||(player===1?state.score:state.enemy)<100||state.phase==='won';ui(prefix?prefix+'aim':'aim').hidden=bat;}
ui('aim').textContent='Mirar: '+(state.target?'direita':'esquerda')+' ⇄';for(const [player,id]of [[1,'climb'],[2,'p2climb']]){const p=selected(player);ui(id).hidden=player!==fieldingPlayer();ui(id).textContent=(player===2?'J2 · ':'')+(p.elevation>0?'Descer do telhado':'Subir no telhado');ui(id).disabled=blocked()||(!state.ball.onRoof&&!p.elevation);}const exposed=!protectedBase(0)||!protectedBase(1);ui('danger').textContent=exposed?'⚠ Garrafa desprotegida!':'Garrafas protegidas';ui('danger').className=exposed?'exposed':'';ui('pause').textContent=state.paused?'Continuar':'Pausar';for(let i=1;i<=2;i++){ui('angleValue'+i).textContent=ui('angle'+i).value+'°';ui('powerValue'+i).textContent=ui('power'+i).value+'%';}}
function switchPlayer(player){if(blocked()||!human(player))return;state.selected[player-1]=1-state.selected[player-1];say('Personagem '+(state.selected[player-1]+1)+' selecionado.');}
function aim(player){if(blocked()||player!==fieldingPlayer())return;state.target=1-state.target;state.aim={x:bases[state.target],y};say('Mira na garrafa '+(state.target+1)+'.');}
function beginCharge(player){if(blocked()||!human(player))return;if(player===battingPlayer()){bat(player);return;}if(state.ball.owner!==state.selected[player-1]){say('Pegue a bola ou selecione o colega que está com ela.');return;}state.charges[player-1]=0;}
function releaseCharge(player){if(state.charges[player-1]===null)return;const power=clamp(.2+state.charges[player-1]*.65,.2,1);state.charges[player-1]=null;if(!blocked())throwBall(player,power);}
function action(player){if(blocked()||!human(player))return;if(player===battingPlayer())bat(player);else throwBall(player,Number(ui('power'+player).value)/100);}
function throwBall(player,power){
 if(player!==fieldingPlayer()||state.ball.owner!==state.selected[player-1]){say('Vá até a bola para pegá-la. Q ou / troca de personagem.');return;}
 const p=selected(player);
 if(p.elevation>0||p.climbing){say('Desça do telhado antes de lançar!');return;}
 if((p.x-p.throwLimit)*p.side>.1){say('Sem avançar com a bola! Volte até a linha da coleta.');return;}
 const aim=state.aim,dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy);if(d<1)return;
 p.goal=null;p.climbIntent=null;
 const speed=420+clamp(power,0,1)*800;
 state.ball={x:p.x,y:p.y,z:4,vx:dx/d*speed,vy:dy/d*speed,vz:0,owner:null,pickupDelay:.12,kind:'throw',touchedGround:false};state.phase='shot';say('Lançamento! Direção e força estão nas suas mãos.');
}
function bat(player){const ball=state.ball,p=selected(player);state.swing=.25;if(state.phase!=='shot'||ball.z>32||distance(ball,p)>62){say('Aproxime o taco da bola e acerte o tempo da rebatida.');return;}const power=Number(ui('power'+player).value)/100,angle=Number(ui('angle'+player).value)*Math.PI/180,side=p.x>550?-1:1;const timing=1-distance(ball,p)/100;ball.vx=side*Math.cos(angle)*(210+power*540)*timing;ball.vy=Math.sin(angle)*(210+power*540)*timing;ball.vz=110+power*150;ball.z=8;ball.owner=null;ball.kind='batted';ball.touchedGround=false;ball.onRoof=false;ball.pickupDelay=.12;state.phase='loose';state.stats.hits++;state.running=true;say('Rebatida! Corra — eles precisam buscar a bola onde ela cair.');}
function run(player){if(blocked()||player!==battingPlayer()||!state.running)return;state.bats.forEach((p,i)=>p.goal={x:bases[state.expected[i]],y});state.running=true;say('Dupla correndo! Você pode mudar o caminho com o movimento livre.');}
function cross(player){if(blocked()||player!==battingPlayer()||(player===1?state.score:state.enemy)<100)return;state.phase='crossing';state.cross=0;state.bats.forEach((p,i)=>p.goal={x:530+i*40,y});say('Indo ao meio cruzar os tacos!');}
function swap(i){state.stats.swaps++;state.role=state.role==='bat'?'ball':'bat';state.phase='ready';state.broken=i;state.aiTimer=1.5;placePlayers();say('Garrafa derrubada! Troca de função; os pontos continuam.');sync();}
function win(player,reason='100 pontos e tacos cruzados'){state.winReason=reason;state.winner=player;state.phase='won';say((player?'Sua dupla venceu! ':'A outra dupla venceu! ')+reason);ui('resultTitle').textContent=state.mode==='local'?'Jogador '+(player?'1':'2')+' venceu!':player?'Sua dupla venceu!':'A dupla da rua venceu!';ui('resultScore').textContent=`Placar: ${state.score} × ${state.enemy}`;ui('resultStats').textContent=`${reason} · ${state.stats.hits} rebatidas · ${state.stats.swaps} trocas de função`;ui('result').showModal();sync();}
function pause(){if(state.phase==='won')return;state.paused=!state.paused;keys.clear();state.charges=[null,null];document.querySelector('.game').classList.toggle('paused',state.paused);sync();}
function canAdvance(p){return !state.fielders.includes(p)||state.ball.owner===null&&state.ball.kind==='batted';}
function move(p,dx,dy,dt){
 if(p.climbing)return;
 const length=Math.hypot(dx,dy);if(!length)return;
 let nextX=clamp(p.x+dx/length*205*dt,40,1060);
 if(!canAdvance(p)){nextX=p.side===1?Math.min(nextX,p.throwLimit):Math.max(nextX,p.throwLimit);}
 p.x=nextX;p.y=clamp(p.y+dy/length*205*dt,p.elevation>0?75:105,p.elevation>0?100:325);
}
function follow(p,dt){if(!p.goal||p.climbing)return;const d=distance(p,p.goal);if(d<5){move(p,p.goal.x-p.x,p.goal.y-p.y,d/205);p.goal=null;}else move(p,p.goal.x-p.x,p.goal.y-p.y,Math.min(dt,d/205));}
function climb(player){
 if(blocked()||player!==fieldingPlayer())return;
 const p=selected(player);if(p.climbing)return;
 if(p.elevation>0){p.climbIntent='down';p.goal={x:p.x,y:100};}
 else if(state.ball.onRoof){p.climbIntent='up';p.goal={x:state.ball.x,y:110};say('Indo ao telhado buscar a bola. A corrida continua!');}
}
function updateClimb(p,dt){
 if(p.climbIntent&&!p.goal&&!p.climbing){p.climbing={direction:p.climbIntent,progress:0};p.climbIntent=null;}
 if(!p.climbing)return;
 const c=p.climbing;c.progress=Math.min(1,c.progress+dt/1.2);
 p.elevation=52*(c.direction==='up'?c.progress:1-c.progress);
 p.y=c.direction==='up'?110-20*c.progress:90+20*c.progress;
 if(c.progress===1){p.climbing=null;if(c.direction==='up'&&state.ball.onRoof)p.goal={x:state.ball.x,y:state.ball.y};}
}
function collectBall(i){
 const p=state.fielders[i],ball=state.ball;
 state.fielders.forEach(f=>{f.goal=null;f.climbIntent=null;if(ball.kind==='batted')f.throwLimit=f.x;});p.throwLimit=p.x;
 ball.owner=i;ball.onRoof=false;ball.vx=ball.vy=ball.vz=0;state.phase='ready';state.aiTimer=.35;
 say(p.elevation>0?'Bola recuperada no telhado! Desça para lançar.':'Bola na mão! Pode recuar, mas não ultrapasse a linha da coleta.');
}
function ai(dt){
 if(state.mode==='local')return;state.aiTimer-=dt;
 if(fieldingPlayer()===2){
  const ball=state.ball;
  if(ball.owner!==null){
   const p=state.fielders[ball.owner];state.selected[1]=ball.owner;p.goal=null;
   if(p.elevation>0){if(!p.climbing&&!p.climbIntent)climb(2);}
   else if(!p.climbing&&state.aiTimer<=0){const open=bases.findIndex((_,i)=>!protectedBase(i));state.aim={x:bases[open<0?(p.side===1?1:0):open],y};throwBall(2,.9+Math.random()*.1);state.aiTimer=.9;}
  }else if(ball.onRoof){
   const i=distance(state.fielders[0],ball)<distance(state.fielders[1],ball)?0:1;state.selected[1]=i;
   const p=state.fielders[i];if(!p.elevation&&!p.climbing&&!p.climbIntent)climb(2);
  }else if(ball.kind==='batted'||Math.hypot(ball.vx,ball.vy)<90){
   // Predict where a descending ball will be within reach of the hands.
   const disc=ball.vz*ball.vz+840*(ball.z-28);
   const t=!ball.touchedGround&&disc>=0?Math.max(0,(ball.vz+Math.sqrt(disc))/420):0;
   const target={x:clamp(ball.x+ball.vx*t,40,1060),y:clamp(ball.y+ball.vy*t,105,325)};
   const candidates=state.fielders.map((p,i)=>({p,i,d:distance(p,target)})).filter(({p})=>canAdvance(p)||(target.x-p.throwLimit)*p.side<=0);
   candidates.sort((a,b)=>a.d-b.d);if(candidates.length)candidates[0].p.goal=target;
  }
 }else{
  if(state.phase==='shot'){const i=distance(state.bats[0],state.ball)<distance(state.bats[1],state.ball)?0:1;state.selected[1]=i;if(distance(state.bats[i],state.ball)<48){ui('angle2').value=String(Math.round(Math.random()*130-65));ui('power2').value=String(45+Math.round(Math.random()*50));bat(2);}}
  if(state.running&&state.enemy<100&&state.aiTimer<=0&&state.ball.owner===null){run(2);state.aiTimer=.6;}
  if(state.enemy>=100)cross(2);
 }
}
function update(dt){if(blocked()&&state.phase!=='crossing')return;if(state.paused||ui('rules').open||ui('result').open)return;state.swing=Math.max(0,state.swing-dt);if(state.phase==='crossing'){state.bats.forEach(p=>follow(p,dt));if(state.bats.every(p=>!p.goal))win(battingPlayer()===1);sync();return;}ai(dt);
for(let player=1;player<=2;player++){if(!human(player))continue;const map=player===1?['a','d','w','s']:['arrowleft','arrowright','arrowup','arrowdown'];const dx=Number(keys.has(map[1]))-Number(keys.has(map[0])),dy=Number(keys.has(map[3]))-Number(keys.has(map[2]));if(dx||dy){const p=selected(player);p.goal=null;p.climbIntent=null;move(p,dx,dy,dt);}if(state.charges[player-1]!==null)state.charges[player-1]=Math.min(1.25,state.charges[player-1]+dt);}
[...state.bats,...state.fielders].forEach(p=>follow(p,dt));state.fielders.forEach(p=>updateClimb(p,dt));const ball=state.ball;
if(ball.owner!==null){const p=state.fielders[ball.owner];ball.x=p.x;ball.y=p.y;ball.z=p.elevation||0;}
else if(!ball.onRoof){const old={x:ball.x,y:ball.y};ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z+=ball.vz*dt;ball.vz-=420*dt;
if(ball.z<=0){ball.z=0;ball.touchedGround=true;if(Math.abs(ball.vz)>65)ball.vz=-ball.vz*.28;else ball.vz=0;const friction=Math.exp(-(ball.kind==='throw'?.16:2.3)*dt);ball.vx*=friction;ball.vy*=friction;}
if(ball.x<35||ball.x>1065){ball.x=clamp(ball.x,35,1065);ball.vx*=-.65;}if(ball.y<105){if(ball.z>52&&ball.kind==='batted'){state.phase='roof';const house=Math.floor((ball.x+15)/157)*157-15;ball.x=clamp(ball.x,house+10,house+125);ball.y=90;ball.z=52;ball.onRoof=true;ball.vx=ball.vy=ball.vz=0;say('Bola no telhado! Os tacos continuam correndo; a defesa pode subir para buscar.');}if(!ball.onRoof){ball.y=105;ball.vy*=-.6;}}if(ball.y>325){ball.y=325;ball.vy*=-.6;}
if(state.phase==='shot'){for(let i=0;i<2;i++){const dx=ball.x-old.x,dy=ball.y-old.y,t=clamp(((bases[i]-old.x)*dx+(y-old.y)*dy)/(dx*dx+dy*dy||1),0,1);if(Math.hypot(old.x+t*dx-bases[i],old.y+t*dy-y)<13&&ball.z<20){if(!protectedBase(i)){swap(i);return;}say('A garrafa foi protegida pelo taco!');}}}
}
const ballNow=state.ball;
ballNow.pickupDelay=Math.max(0,(ballNow.pickupDelay||0)-dt);
for(let i=0;i<2&&ballNow.owner===null;i++){
 const p=state.fielders[i];if(p.climbing||ballNow.pickupDelay>0||distance(p,ballNow)>22)continue;
 if(ballNow.onRoof){if(p.elevation===52)collectBall(i);continue;}
 if(p.elevation>0)continue;
 if(ballNow.kind==='batted'&&!ballNow.touchedGround&&ballNow.vz<0&&ballNow.z>0&&ballNow.z<=34){win(fieldingPlayer()===1,'Bola pega no ar antes de cair no chão!');return;}
 if(ballNow.z<18&&(ballNow.touchedGround||ballNow.kind!=='batted'))collectBall(i);
}
if(state.running&&state.bats.every((p,i)=>distance(p,{x:bases[state.expected[i]],y})<24)){if(battingPlayer()===1)state.score=Math.min(100,state.score+10);else state.enemy=Math.min(100,state.enemy+10);state.expected=state.expected.map(i=>1-i);state.swapped=!state.swapped;say('Troca completa! +10 pontos.'+((battingPlayer()===1?state.score:state.enemy)>=100?' Cruze os tacos no meio para vencer!':''));}
sync();}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function line(x,y,a,b,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function person(x,py,color,bat,elevation=0){
 // Feet stay on the ground plane; body is projected upward by its elevation.
 ctx.fillStyle='#25382930';ctx.beginPath();ctx.ellipse(x+6,py+28,14,6,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(x,py-elevation);
 line(-5,20,-7,29,'#38483a',5);line(5,20,8,29,'#38483a',5);
 polygon([[-9,0],[7,-3],[11,17],[-6,22]],color);polygon([[7,-3],[11,17],[6,22],[3,1]],'#233b3238');
 circle(0,-8,8,'#d9aa7b');circle(-2,-11,7,color);line(-7,5,-18,15,'#d9aa7b',5);line(7,5,18,15,'#d9aa7b',5);
 if(bat){const side=x<550?-1:1;line(side*18,15,side*40,state.swing>0?-20:28,'#a37644',6);}
 ctx.restore();
}
function draw(){ctx.clearRect(0,0,1100,420);rect(0,0,1100,420,'#dbe4cc');rect(0,123,1100,221,'#999f8e');rect(0,134,1100,200,'#aaa99a');rect(0,123,1100,10,'#c4c7b6');rect(0,334,1100,10,'#c4c7b6');
for(let i=0;i<8;i++){
 const x=i*157-15,roof=i%2?'#b47f60':'#93a17c';
 polygon([[x+10,112],[x+144,112],[x+161,121],[x+25,121]],'#283c2c20');
 rect(x,57,130,53,i%2?'#dfc9aa':'#d0d4b5');polygon([[x+130,57],[x+143,45],[x+143,103],[x+130,110]],'#9e9d80');
 polygon([[x-5,57],[x+130,57],[x+143,44],[x+8,44]],'#786c52');
 polygon([[x-5,57],[x+8,20],[x+143,20],[x+130,57]],roof);
 for(let j=1;j<5;j++)line(x+j*26,57,x+13+j*26,20,'#ffffff20',1);
 line(x+8,20,x+143,20,'#ffffff55',2);rect(x+48,72,26,38,'#738375');rect(x+12,71,22,18,'#9aaf9e');rect(x+90,71,22,18,'#9aaf9e');
 rect(x,368,125,52,'#c5d1b2');
}
if(state.ball.onRoof||state.fielders.some(p=>p.elevation>0)){
 const ladderX=state.ball.onRoof?state.ball.x:state.fielders.find(p=>p.elevation>0).x;
 line(ladderX-7,110,ladderX-7,43,'#f2d6a1',3);line(ladderX+7,110,ladderX+7,43,'#f2d6a1',3);
 for(let r=48;r<110;r+=10)line(ladderX-7,r,ladderX+7,r,'#b39366',3);
}
for(const x of [50,1030]){rect(x,69,7,48,'#84765b');circle(x+3,64,28,'#8fa879');circle(x-12,51,19,'#a1b587');circle(x+16,49,21,'#789866');}
ctx.setLineDash([24,22]);line(310,237,790,237,'#e3debd',3);ctx.setLineDash([]);
for(let i=0;i<2;i++){let x=bases[i];ctx.strokeStyle=!protectedBase(i)?'#ec724a':'#f4eee0';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,36,28,0,0,7);ctx.stroke();ctx.beginPath();ctx.arc(x,y-4,19,Math.PI,Math.PI*2);ctx.stroke();if(state.broken!==i){rect(x-5,y-8,10,23,'#5e8972');rect(x-3,y-14,6,8,'#5e8972');rect(x-4,y+1,8,7,'#d5dabb');}else{rect(x+5,y+6,20,7,'#5e8972');}}
const batColor=state.role==='bat'?(state.team==='orange'?'#d85c38':'#3f6f87'):(state.team==='orange'?'#3f6f87':'#d85c38'),fieldColor=batColor==='#d85c38'?'#3f6f87':'#d85c38';
[...state.bats.map(p=>({p,color:batColor,bat:true})),...state.fielders.map(p=>({p,color:fieldColor,bat:false}))].sort((a,b)=>a.p.y-b.p.y).forEach(({p,color,bat})=>person(p.x,p.y-28,color,bat,p.elevation||0));
for(let player=1;player<=2;player++){if(!human(player))continue;const p=selected(player);ctx.strokeStyle=player===1?'#fff8c6':'#b8e8ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-(p.elevation||0),18,10,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#273e32';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('J'+player+' · '+ui('power'+player).value+'%',p.x+(p.elevation>0?28:0),Math.max(12,p.y-52-(p.elevation||0)));
if(player===battingPlayer()){const angle=Number(ui('angle'+player).value)*Math.PI/180,side=p.x>550?-1:1;ctx.setLineDash([5,5]);line(p.x,p.y,p.x+side*Math.cos(angle)*90,p.y+Math.sin(angle)*90,'#fff6c3',2);ctx.setLineDash([]);}else if(state.ball.owner===state.selected[player-1]&&!p.elevation){ctx.setLineDash([6,6]);line(p.x,p.y,state.aim.x,state.aim.y,'#f9e7b5',2);ctx.setLineDash([]);ctx.strokeStyle='#f5e0a3';ctx.beginPath();ctx.arc(state.aim.x,state.aim.y,12,0,Math.PI*2);ctx.stroke();const charge=state.charges[player-1];if(charge!==null){rect(p.x-25,p.y-67,50,5,'#d4d8c3');rect(p.x-25,p.y-67,50*Math.min(charge/1.25,1),5,'#df6039');}}
}
for(const p of state.fielders){
 if(p.elevation===0){ctx.setLineDash([5,5]);line(p.throwLimit,146,p.throwLimit,320,'#fff4bd70',2);ctx.setLineDash([]);}
}
const ball=state.ball;
ctx.fillStyle='#25382930';ctx.beginPath();ctx.ellipse(ball.x+3,ball.y+3,7+ball.z*.025,3+ball.z*.01,0,0,Math.PI*2);ctx.fill();
if(ball.z>18){ctx.setLineDash([2,4]);line(ball.x,ball.y,ball.x,ball.y-ball.z,'#faf0c980',1);ctx.setLineDash([]);}
circle(ball.x,ball.y-ball.z,6,'#bdab77');circle(ball.x-1,ball.y-ball.z-1,4.5,'#fff9dc');
if(ball.owner===null&&ball.z>18){ctx.fillStyle='#273e32';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(ball.onRoof?'NO TELHADO':'NO AR · '+Math.round(ball.z),ball.x,Math.max(12,ball.y-ball.z-13));}
ctx.fillStyle='#edf0df';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('CÍRCULO 01',190,302);ctx.fillText('CÍRCULO 02',910,302);ctx.fillStyle='#738567';ctx.font='11px Arial';ctx.fillText('RUA DAS BOAS MEMÓRIAS',550,391);
if(state.phase==='won'){rect(340,146,420,115,'#f5f2e9');ctx.fillStyle='#273e32';ctx.font='bold 28px Arial';ctx.fillText(state.winner?'VITÓRIA DA SUA DUPLA!':'FIM DE PARTIDA',550,190);ctx.font='14px Arial';ctx.fillText('Uma rua, quatro amigos e mais uma história.',550,220);line(534,236,566,255,'#a37644',5);line(566,236,534,255,'#a37644',5);}}
function frame(now){const dt=Math.min((now-last)/1000,.035);last=now;update(dt);draw();requestAnimationFrame(frame);}
ui('hit').onclick=()=>action(1);ui('p2hit').onclick=()=>action(2);ui('run').onclick=()=>run(1);ui('p2run').onclick=()=>run(2);ui('cross').onclick=()=>cross(1);ui('p2cross').onclick=()=>cross(2);ui('aim').onclick=()=>aim(1);ui('p2aim').onclick=()=>aim(2);ui('switch').onclick=()=>switchPlayer(1);ui('p2switch').onclick=()=>switchPlayer(2);ui('climb').onclick=()=>climb(1);ui('p2climb').onclick=()=>climb(2);ui('pause').onclick=pause;ui('restart').onclick=reset;ui('rematch').onclick=reset;ui('dismissResult').onclick=()=>ui('result').close();ui('help').onclick=()=>{keys.clear();state.charges=[null,null];ui('rules').showModal();};ui('close').onclick=ui('play').onclick=()=>ui('rules').close();
document.querySelectorAll('[data-move]').forEach(button=>{button.addEventListener('pointerdown',e=>{e.preventDefault();if(blocked())return;button.setPointerCapture(e.pointerId);keys.add(button.dataset.move);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.move));});
for(let i=1;i<=2;i++){ui('angle'+i).oninput=sync;ui('power'+i).oninput=sync;}
function mousePlayer(){return state.mode==='local'?Number(ui('mousePlayer').value):1;}
function fieldPoint(event){const r=canvas.getBoundingClientRect();return {x:clamp((event.clientX-r.left)*1100/r.width,0,1100),y:clamp((event.clientY-r.top)*420/r.height,0,420)};}
function pointerAim(player,point){const p=selected(player);if(distance(p,point)<2)return;if(player===battingPlayer()){const side=p.x>550?-1:1;const angle=Math.atan2(point.y-p.y,(point.x-p.x)*side)*180/Math.PI;ui('angle'+player).value=String(Math.round(angle));}else state.aim={...point};sync();}
canvas.addEventListener('pointermove',event=>{if(event.pointerType==='mouse'&&!blocked())pointerAim(mousePlayer(),fieldPoint(event));});
canvas.addEventListener('pointerdown',event=>{
 if(blocked())return;
 const point=fieldPoint(event),mouse=event.pointerType==='mouse',player=mouse?mousePlayer():state.mode==='local'?fieldingPlayer():1,p=selected(player);
 if(mouse){
  if(event.button===2){p.goal={x:clamp(point.x,40,1060),y:clamp(point.y,105,325)};say('Indo até o ponto marcado.');}
  else if(event.button===0){pointerAim(player,point);action(player);}
 }else if(player===fieldingPlayer()&&state.ball.owner===state.selected[player-1])state.aim=point;
 else p.goal={x:clamp(point.x,40,1060),y:clamp(point.y,105,325)};
 canvas.focus();event.preventDefault();
});
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('wheel',event=>{
 event.preventDefault();if(blocked()||event.deltaY===0)return;
 const player=mousePlayer(),input=ui('power'+player);
 input.value=String(clamp(Number(input.value)+(event.deltaY<0?5:-5),20,100));sync();
},{passive:false});canvas.tabIndex=0;
document.addEventListener('keydown',e=>{if(['SELECT','INPUT'].includes(e.target.tagName)||ui('rules').open||ui('result').open)return;const k=e.key.toLowerCase();if([' ','enter','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='p')pause();if(blocked())return;if(k===' ')beginCharge(1);if(k==='q')switchPlayer(1);if(k==='r')run(1);if(k==='x')cross(1);if(k==='c')climb(1);if(state.mode==='local'){if(k==='enter')beginCharge(2);if(k==='/')switchPlayer(2);if(k==='l')run(2);if(k==='k')cross(2);if(k==='m')climb(2);}});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k===' ')releaseCharge(1);if(k==='enter'&&state.mode==='local')releaseCharge(2);});window.addEventListener('blur',()=>{keys.clear();state.charges=[null,null];});reset();requestAnimationFrame(frame);
