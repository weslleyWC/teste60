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
function blocked(){return state.hubHidden||state.paused||ui('settings').open||ui('rules').open||ui('result').open||['won','crossing'].includes(state.phase);}
function reset(){window.TacoVisuals?.reset();if(ui('result').open)ui('result').close();keys.clear();state={mode:ui('mode').value,team:ui('team').value,role:ui('startRole').value,score:0,enemy:0,stats:{hits:0,swaps:0,drops:0},phase:'ready',paused:false,selected:[0,0],charges:[null,null],target:1,swapped:false,aiTimer:1.5,swing:0,cross:0,broken:-1};placePlayers();say('Movimente-se, escolha sua jogada e proteja as garrafas.');sync();document.querySelector('.game').classList.remove('paused');}
function placePlayers(){state.bats=bases.map(x=>({x,y,goal:null}));state.fielders=[{x:110,y,goal:null,side:1,throwLimit:110,elevation:0},{x:990,y,goal:null,side:-1,throwLimit:990,elevation:0}];state.ball={x:110,y,z:0,vx:0,vy:0,vz:0,owner:0,kind:'throw',touchedGround:false};state.selected[fieldingPlayer()-1]=0;state.selected[battingPlayer()-1]=1;state.aim={x:910,y};state.expected=[1,0];state.running=false;state.aiRunCommitted=false;state.aiRetreat=false;state.charges=[null,null];}
function canCollect(i){if(state.ball.accidental)return i===state.ball.thrower;return state.ball.kind!=='batted'||state.ball.collector===undefined||state.ball.collector===i;}
function protectedBase(i){return state.bats.some(p=>distance(p,{x:bases[i],y})<34);}
function sync(){const local=state.mode==='local',bp=battingPlayer();ui('localControls').hidden=!local;ui('mousePlayerLabel').hidden=!local;ui('skill2').hidden=!local;ui('teamLabel').textContent=local?'JOGADOR 1':'SUA DUPLA';ui('enemyLabel').textContent=local?'JOGADOR 2':'DUPLA DA RUA';ui('score').textContent=state.score;ui('enemyScore').textContent=state.enemy;ui('progress').style.width=state.score+'%';ui('phase').textContent=state.phase==='won'?'Fim de partida':local?`J${bp}: tacos · J${3-bp}: bola`:bp===1?'Sua dupla está com os tacos':'Sua dupla está com a bola';for(const [player,prefix]of [[1,''],[2,'p2']]){const bat=player===bp;ui(prefix?prefix+'hit':'hit').textContent=(prefix?'J2 · ':'')+(bat?'Rebater':'Lançar');ui(prefix?prefix+'run':'run').disabled=!bat||!state.running;ui(prefix?prefix+'cross':'cross').disabled=!bat||(player===1?state.score:state.enemy)<100||state.phase==='won';ui(prefix?prefix+'aim':'aim').hidden=false;ui(prefix?prefix+'aim':'aim').disabled=bat;}
ui('aim').textContent='Mirar: '+(state.target?'direita':'esquerda')+' ⇄';for(const [player,id]of [[1,'climb'],[2,'p2climb']]){const p=selected(player);ui(id).hidden=false;ui(id).textContent=(player===2?'J2 · ':'')+(p.elevation>0?'Descer do telhado':'Subir no telhado');ui(id).disabled=player!==fieldingPlayer()||(!p.elevation&&!canCollect(state.selected[player-1]))||blocked()||(!state.ball.onRoof&&!p.elevation);}const exposed=!protectedBase(0)||!protectedBase(1);ui('danger').textContent=exposed?'⚠ Garrafa desprotegida!':'Garrafas protegidas';ui('danger').className=exposed?'exposed':'';ui('pause').textContent=state.paused?'Continuar':'Pausar';for(let i=1;i<=2;i++){ui('angleValue'+i).textContent=ui('angle'+i).value+'°';ui('powerValue'+i).textContent=ui('power'+i).value+'%';}}
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
 state.ball={x:p.x,y:p.y,z:4,vx:dx/d*speed,vy:dy/d*speed,vz:0,owner:null,pickupDelay:.12,kind:'throw',throwSide:p.side===1?0:1,thrower:state.selected[player-1],touchedGround:false};state.phase='shot';say('Lançamento! Direção e força estão nas suas mãos.');
}
function bat(player){const ball=state.ball,p=selected(player);state.swing=.25;if(ball.throwSide!==undefined&&(p.x>550?1:0)===ball.throwSide){say('Esse é o batedor do mesmo lado: bolada não vale rebatida.');return;}if(state.phase!=='shot'||ball.z>32||distance(ball,p)>62){say('Aproxime o taco da bola e acerte o tempo da rebatida.');return;}const power=Number(ui('power'+player).value)/100,angle=Number(ui('angle'+player).value)*Math.PI/180,side=p.x>550?-1:1;const timing=1-distance(ball,p)/100;ball.vx=side*Math.cos(angle)*(210+power*540)*timing;ball.vy=Math.sin(angle)*(210+power*540)*timing;ball.vz=110+power*150;ball.z=8;ball.owner=null;ball.kind='batted';ball.collector=p.x>550?0:1;state.fielders.forEach(f=>f.goal=null);ball.touchedGround=false;ball.airCatchEligible=true;ball.onRoof=false;ball.pickupDelay=.12;state.phase='loose';state.stats.hits++;window.TacoVisuals?.burst(p.x,p.y,'hit');state.running=true;say('Rebatida! Só o lançador da '+(ball.collector===0?'esquerda':'direita')+' pode buscar. Corra!');}
function segmentDistance(point,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);}
function accidentalHit(p,ball){
 ball.accidental=true;ball.vx*=-.12;ball.vy*=.12;ball.vz=35;ball.z=Math.max(3,ball.z);ball.slipped=true;ball.kind='throw';ball.airCatchEligible=false;ball.collector=undefined;ball.pickupDelay=.18;
 state.phase='loose';state.running=false;state.bats.forEach(b=>b.goal=null);
 window.TacoVisuals?.ouch(p);say('Opa, bolada! Não foi rebatida: sem corrida. Busque a bola e lance de novo.');
}
function sameSideCollision(old,ball){
 if(ball.kind!=='throw'||ball.throwSide===undefined||state.phase!=='shot')return false;
 const a={x:old.x,y:old.y-(old.z||0)},b={x:ball.x,y:ball.y-ball.z};
 for(const p of state.bats){
  if((p.x>550?1:0)!==ball.throwSide)continue;
  const side=p.x<550?-1:1;
  const body=segmentDistance({x:p.x,y:p.y-25},a,b)<12;
  const taco=!(ball.z<=6&&Math.abs(ball.y-p.y)<5)&&[.0,.25,.5,.75,1].some(t=>segmentDistance({x:p.x+side*(17+18*t),y:p.y-19+13*t},a,b)<4);
  if(body||taco){accidentalHit(p,ball);return true;}
 }
 return false;
}
function run(player){if(blocked()||player!==battingPlayer()||!state.running)return;state.bats.forEach((p,i)=>p.goal={x:bases[state.expected[i]],y});state.running=true;say('Dupla correndo! Você pode mudar o caminho com o movimento livre.');}
function cross(player){if(blocked()||player!==battingPlayer()||(player===1?state.score:state.enemy)<100)return;state.phase='crossing';state.cross=0;state.bats.forEach((p,i)=>p.goal={x:530+i*40,y});say('Indo ao meio cruzar os tacos!');}
function swap(i){window.TacoVisuals?.burst(bases[i],y,'hit');state.stats.swaps++;state.role=state.role==='bat'?'ball':'bat';state.phase='ready';state.broken=-1;state.aiTimer=1.5;placePlayers();say('Garrafa derrubada! Troca de função; os pontos continuam.');sync();}
function win(player,reason='100 pontos e tacos cruzados'){window.TacoVisuals?.burst(550,226,'win');state.winReason=reason;state.winner=player;state.phase='won';say((player?'Sua dupla venceu! ':'A outra dupla venceu! ')+reason);ui('resultTitle').textContent=state.mode==='local'?'Jogador '+(player?'1':'2')+' venceu!':player?'Sua dupla venceu!':'A dupla da rua venceu!';ui('resultScore').textContent=`Placar: ${state.score} × ${state.enemy}`;ui('resultStats').textContent=`${reason} · ${state.stats.hits} rebatidas · ${state.stats.swaps} trocas de função`;ui('result').showModal();sync();}
function pause(){if(state.phase==='won')return;state.paused=!state.paused;keys.clear();state.charges=[null,null];document.querySelector('.game').classList.toggle('paused',state.paused);sync();}
function canAdvance(p){return !state.fielders.includes(p)||state.ball.owner===null&&(state.ball.kind==='batted'||state.ball.accidental&&canCollect(state.fielders.indexOf(p)));}
function move(p,dx,dy,dt){
 if(p.climbing)return;
 const length=Math.hypot(dx,dy);if(!length)return;
 let nextX=clamp(p.x+dx/length*205*dt,40,1060);
 if(!canAdvance(p)){nextX=p.side===1?Math.min(nextX,Math.max(p.x,p.throwLimit)):Math.max(nextX,Math.min(p.x,p.throwLimit));}
 p.x=nextX;p.y=clamp(p.y+dy/length*205*dt,p.elevation>0?75:105,p.elevation>0?100:325);
}
function follow(p,dt){if(!p.goal||p.climbing)return;const d=distance(p,p.goal);if(d<5){move(p,p.goal.x-p.x,p.goal.y-p.y,d/205);p.goal=null;}else move(p,p.goal.x-p.x,p.goal.y-p.y,Math.min(dt,d/205));}
function climb(player){
 if(blocked()||player!==fieldingPlayer())return;
 const p=selected(player);if(p.climbing)return;if(!p.elevation&&!canCollect(state.selected[player-1])){say('Essa rebatida só pode ser recolhida pelo lançador do lado contrário. Troque de personagem.');return;}
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
function attemptCatch(i,air=false){
 if(!canCollect(i))return false;
 const ball=state.ball,p=state.fielders[i],speed=Math.hypot(ball.vx,ball.vy,ball.vz);
 const risk=clamp((speed-180)/1200,0,.55);
 if(risk>0&&Math.random()<risk){
  state.stats.drops++;ball.owner=null;ball.airCatchEligible=false;ball.onRoof=false;
  ball.slipped=true;ball.vx=ball.vx*.18;ball.vy=ball.vy*.18;ball.vz=-45;ball.z=10;ball.pickupDelay=.55;
  state.phase=ball.kind==='batted'?'loose':'shot';p.goal=null;
  say('A bola escapou das mãos! Caiu — vá buscar de novo.');return false;
 }
 if(air)win(fieldingPlayer()===1,'Bola pega no ar antes de cair no chão!');else collectBall(i);
 return true;
}
function collectBall(i){
 if(!canCollect(i))return;
 const p=state.fielders[i],ball=state.ball;
 state.fielders.forEach(f=>{f.goal=null;f.climbIntent=null;if(ball.kind==='batted')f.throwLimit=f.x;});if(!ball.accidental)p.throwLimit=p.x;
 ball.owner=i;ball.onRoof=false;ball.vx=ball.vy=ball.vz=0;state.phase='ready';state.aiTimer=.35;
 say(p.elevation>0?'Bola recuperada no telhado! Desça para lançar.':'Bola na mão! Pode recuar, mas não ultrapasse a linha da coleta.');
}
// Predict the public ball trajectory using the same bounce/drag rules as the game.
// This does not consume randomness or change the live ball.
function predictedPath(ball,horizon=5){
 const p={...ball},points=[{...p,t:0}],dt=.025;
 if(p.onRoof||p.owner!==null)return points;
 for(let t=dt;t<=horizon;t+=dt){
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=420*dt;
  if(p.z<=0){p.z=0;p.touchedGround=true;p.vz=Math.abs(p.vz)>65?-p.vz*.28:0;const drag=Math.exp(-(p.kind==='throw'&&!p.slipped?.16:2.3)*dt);p.vx*=drag;p.vy*=drag;}
  if(p.x<35||p.x>1065){p.x=clamp(p.x,35,1065);p.vx*=-.65;}
  if(p.y<105){
   if(p.kind==='batted'&&p.z>52){const house=Math.floor((p.x+15)/157)*157-15;p.x=clamp(p.x,house+10,house+125);p.y=90;p.z=52;p.onRoof=true;points.push({...p,t});break;}
   p.y=105;p.vy*=-.6;
  }
  if(p.y>325){p.y=325;p.vy*=-.6;}
  points.push({...p,t});
 }
 return points;
}
function reachableCatch(p,point){
 const legal=point.kind==='batted'||point.accidental&&point.thrower===state.fielders.indexOf(p)||(point.x-p.throwLimit)*p.side<=.1;
 const height=point.touchedGround||point.kind!=='batted'?point.z<18:point.vz<0&&point.z<=34;
 return !point.onRoof&&legal&&height&&point.y>=105&&point.y<=325&&distance(p,point)<=205*point.t+15;
}
function interceptFor(p,path){
 const early=path.find(point=>point.t>=Math.max(.08,path[0].pickupDelay||0)&&reachableCatch(p,point))||null;
 // Prefer a crossing of the fielder's current line: lateral cover instead of creeping forward.
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i];if((a.x-p.x)*(b.x-p.x)>0||Math.abs(b.x-a.x)<.01)continue;
  const ratio=(p.x-a.x)/(b.x-a.x);if(ratio<0||ratio>1)continue;
  const point={...b,x:p.x,y:a.y+(b.y-a.y)*ratio,z:a.z+(b.z-a.z)*ratio,t:a.t+(b.t-a.t)*ratio};
  if(point.t>=Math.max(.08,path[0].pickupDelay||0)&&reachableCatch(p,point))return early&&early.t+.1<point.t?early:point;
 }
 return early;
}
function homeFielder(p){
 if(p.climbing||p.climbIntent)return;
 if(p.elevation>0){p.climbIntent='down';p.goal={x:p.x,y:100};return;}
 const home={x:p.side===1?Math.min(110,p.throwLimit):Math.max(990,p.throwLimit),y};p.goal=distance(p,home)<3?null:home;
}
function defenseTime(ball=state.ball,path=predictedPath(ball)){
 if(ball.owner!==null){const p=state.fielders[ball.owner];return (p.elevation>0?1.3:0)+.25+Math.min(...bases.map(x=>distance(p,{x,y})))/1140;}
 const eligible=state.fielders.filter((_,i)=>ball.collector===undefined||ball.kind!=='batted'||ball.collector===i);
 const roof=path.find(point=>point.onRoof);
 if(roof)return Math.min(...eligible.map(p=>distance(p,{x:roof.x,y:110})/205))+2.6+.25;
 const catches=eligible.map(p=>interceptFor(p,path)).filter(Boolean);
 if(catches.length)return Math.min(...catches.map(point=>point.t+.25+Math.min(...bases.map(x=>distance(point,{x,y})))/1140));
 const landing=path.find(point=>point.touchedGround&&Math.hypot(point.vx,point.vy)<60)||path[path.length-1];
 return Math.max(landing.t,Math.min(...eligible.map(p=>distance(p,landing)/205)))+.45;
}
function safeBotRun(){
 if(!state.running||state.ball.owner!==null||state.enemy>=100)return false;
 const needed=Math.max(...state.bats.map((p,i)=>distance(p,{x:bases[state.expected[i]],y})))/205;
 return defenseTime()>needed+.6;
}
function retreatBotBats(){
 const arrangements=[[0,1],[1,0]];
 arrangements.sort((a,b)=>Math.max(...state.bats.map((p,i)=>distance(p,{x:bases[a[i]],y})))-Math.max(...state.bats.map((p,i)=>distance(p,{x:bases[b[i]],y}))));
 state.bats.forEach((p,i)=>p.goal={x:bases[arrangements[0][i]],y});state.aiRetreat=true;
}
function chooseBotBat(p){
 const ball=state.ball,timing=1-distance(ball,p)/100,side=p.x>550?-1:1,collector=p.x>550?0:1;
 let best=null;
 for(const degrees of [-65,-35,0,35,65]){
  const angle=degrees*Math.PI/180,power=.9;
  const candidate={...ball,owner:null,kind:'batted',collector,touchedGround:false,onRoof:false,z:8,vx:side*Math.cos(angle)*696*timing,vy:Math.sin(angle)*696*timing,vz:244};
  const score=defenseTime(candidate);
  if(!best||score>best.score)best={degrees,power,score};
 }
 ui('angle2').value=String(best.degrees);ui('power2').value=String(best.power*100);bat(2);
}
function ai(dt){
 if(state.mode==='local')return;state.aiTimer-=dt;
 const ball=state.ball;
 if(fieldingPlayer()===2){
  if(ball.owner!==null){
   const i=ball.owner,p=state.fielders[i];state.selected[1]=i;homeFielder(state.fielders[1-i]);
   if(p.climbing)return;
   if(p.elevation>0){if(!p.climbIntent)climb(2);return;}
   if((p.x-p.throwLimit)*p.side>.1){p.goal={x:p.throwLimit,y:p.y};return;}
   p.goal=null;
   if(state.aiTimer<=0){
    const open=bases.map((x,i)=>({x,i,d:distance(p,{x,y})})).filter(base=>!protectedBase(base.i)).sort((a,b)=>a.d-b.d);
    state.aim={x:open.length?open[0].x:bases[p.side===1?1:0],y};throwBall(2,.9+Math.random()*.1);state.aiTimer=.9;
    // Return after release, while the partner covers the actual incoming trajectory.
    homeFielder(p);
   }
  }else if(ball.onRoof){
   const i=ball.collector===undefined?(distance(state.fielders[0],ball)<distance(state.fielders[1],ball)?0:1):ball.collector;
   state.selected[1]=i;homeFielder(state.fielders[1-i]);const p=state.fielders[i];
   if(!p.elevation&&!p.climbing&&!p.climbIntent)climb(2);
  }else{
   const path=predictedPath(ball),preferred=ball.kind==='batted'?ball.collector:ball.accidental?ball.thrower:ball.thrower===undefined?null:1-ball.thrower;
   const plans=state.fielders.map((p,i)=>({p,i,point:canCollect(i)&&!p.elevation&&!p.climbing?interceptFor(p,path):null})).filter(plan=>plan.point);
   plans.sort((a,b)=>(a.i===preferred?0:1)-(b.i===preferred?0:1)||a.point.t-b.point.t);
   const chosen=plans[0];
   state.fielders.forEach((p,i)=>{if(chosen&&i===chosen.i){p.goal={x:chosen.point.x,y:chosen.point.y};state.selected[1]=i;}else homeFielder(p);});
   if(!chosen&&(ball.kind==='batted'||ball.accidental||Math.hypot(ball.vx,ball.vy)<90)){
    const target=path[path.length-1];
    const choices=state.fielders.map((p,i)=>({p,i,d:distance(p,target)})).filter(({p,i})=>canCollect(i)&&!p.elevation&&!p.climbing&&(canAdvance(p)||(target.x-p.throwLimit)*p.side<=.1)).sort((a,b)=>a.d-b.d);
    if(choices.length){choices[0].p.goal={x:target.x,y:clamp(target.y,105,325)};state.selected[1]=choices[0].i;}
   }
  }
 }else{
  if(state.phase==='shot'){
   const legal=state.bats.map((p,i)=>({p,i,d:distance(p,ball)})).filter(({p})=>ball.throwSide===undefined||(p.x>550?1:0)!==ball.throwSide).sort((a,b)=>a.d-b.d);
   if(legal.length&&legal[0].d<48&&ball.z<=32){state.selected[1]=legal[0].i;chooseBotBat(legal[0].p);}
  }
  const underway=state.bats.some(p=>p.goal&&distance(p,p.goal)>5);
  if(state.aiRunCommitted&&underway&&!state.aiRetreat){
   const remaining=Math.max(...state.bats.map(p=>p.goal?distance(p,p.goal):0))/205;
   if(defenseTime()<remaining+.25)retreatBotBats();
  }
  if(!underway){state.aiRunCommitted=false;state.aiRetreat=false;}
  if(!underway&&state.aiTimer<=0&&safeBotRun()){run(2);state.aiRunCommitted=true;state.aiTimer=.4;}
  if(state.enemy>=100)cross(2);
 }
}
function update(dt){if(blocked()&&state.phase!=='crossing')return;if(state.hubHidden||state.paused||ui('settings').open||ui('rules').open||ui('result').open)return;state.swing=Math.max(0,state.swing-dt);if(state.phase==='crossing'){state.bats.forEach(p=>follow(p,dt));if(state.bats.every(p=>!p.goal))win(battingPlayer()===1);sync();return;}ai(dt);
for(let player=1;player<=2;player++){if(!human(player))continue;const map=player===1?['a','d','w','s']:['arrowleft','arrowright','arrowup','arrowdown'];const dx=Number(keys.has(map[1]))-Number(keys.has(map[0])),dy=Number(keys.has(map[3]))-Number(keys.has(map[2]));if(dx||dy){const p=selected(player);p.goal=null;p.climbIntent=null;move(p,dx,dy,dt);}if(state.charges[player-1]!==null)state.charges[player-1]=Math.min(1.25,state.charges[player-1]+dt);}
[...state.bats,...state.fielders].forEach(p=>follow(p,dt));state.fielders.forEach(p=>updateClimb(p,dt));const ball=state.ball;
if(ball.owner!==null){const p=state.fielders[ball.owner];ball.x=p.x;ball.y=p.y;ball.z=p.elevation||0;}
else if(!ball.onRoof){const old={x:ball.x,y:ball.y,z:ball.z};ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z+=ball.vz*dt;ball.vz-=420*dt;
if(ball.z<=0){ball.z=0;ball.touchedGround=true;if(Math.abs(ball.vz)>65)ball.vz=-ball.vz*.28;else ball.vz=0;const friction=Math.exp(-(ball.kind==='throw'&&!ball.slipped?.16:2.3)*dt);ball.vx*=friction;ball.vy*=friction;}
if(ball.x<35||ball.x>1065){ball.x=clamp(ball.x,35,1065);ball.vx*=-.65;}if(ball.y<105){if(ball.z>52&&ball.kind==='batted'){state.phase='roof';const house=Math.floor((ball.x+15)/157)*157-15;ball.x=clamp(ball.x,house+10,house+125);ball.y=90;ball.z=52;ball.onRoof=true;ball.vx=ball.vy=ball.vz=0;say('Bola no telhado! Os tacos continuam correndo; a defesa pode subir para buscar.');}if(!ball.onRoof){ball.y=105;ball.vy*=-.6;}}if(ball.y>325){ball.y=325;ball.vy*=-.6;}
sameSideCollision(old,ball);
if(state.phase==='shot'){for(let i=0;i<2;i++){const dx=ball.x-old.x,dy=ball.y-old.y,t=clamp(((bases[i]-old.x)*dx+(y-old.y)*dy)/(dx*dx+dy*dy||1),0,1);if(Math.hypot(old.x+t*dx-bases[i],old.y+t*dy-y)<13&&ball.z<20){if(!protectedBase(i)){swap(i);return;}say('A garrafa foi protegida pelo taco!');}}}
}
const ballNow=state.ball;
ballNow.pickupDelay=Math.max(0,(ballNow.pickupDelay||0)-dt);
for(let i=0;i<2&&ballNow.owner===null;i++){
 const p=state.fielders[i];if(!canCollect(i)||p.climbing||ballNow.pickupDelay>0||distance(p,ballNow)>22)continue;
 if(ballNow.onRoof){if(p.elevation===52)collectBall(i);continue;}
 if(p.elevation>0)continue;
 if(ballNow.kind==='batted'&&ballNow.airCatchEligible!==false&&!ballNow.touchedGround&&ballNow.vz<0&&ballNow.z>0&&ballNow.z<=34){if(attemptCatch(i,true))return;break;}
 if(ballNow.z<18&&(ballNow.touchedGround||ballNow.kind!=='batted')){attemptCatch(i);break;}
}
if(state.running&&state.bats.every((p,i)=>distance(p,{x:bases[state.expected[i]],y})<24)){if(battingPlayer()===1)state.score=Math.min(100,state.score+10);else state.enemy=Math.min(100,state.enemy+10);state.expected=state.expected.map(i=>1-i);state.swapped=!state.swapped;say('Troca completa! +10 pontos.'+((battingPlayer()===1?state.score:state.enemy)>=100?' Cruze os tacos no meio para vencer!':''));}
sync();}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function line(x,y,a,b,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function draw(){ctx.clearRect(0,0,1100,420);window.TacoVisuals.background(ctx);
if(state.ball.onRoof||state.fielders.some(p=>p.elevation>0)){
 const ladderX=state.ball.onRoof?state.ball.x:state.fielders.find(p=>p.elevation>0).x;
 line(ladderX-7,110,ladderX-7,43,'#f2d6a1',3);line(ladderX+7,110,ladderX+7,43,'#f2d6a1',3);
 for(let r=48;r<110;r+=10)line(ladderX-7,r,ladderX+7,r,'#b39366',3);
}
for(let i=0;i<2;i++){let x=bases[i];ctx.strokeStyle=!protectedBase(i)?'#ec724a':'#f4eee0';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,36,28,0,0,7);ctx.stroke();ctx.beginPath();ctx.arc(x,y-4,19,Math.PI,Math.PI*2);ctx.stroke();window.TacoVisuals.bottle(ctx,x,y);}
const batColor=state.role==='bat'?(state.team==='orange'?'#d85c38':'#3f6f87'):(state.team==='orange'?'#3f6f87':'#d85c38'),fieldColor=batColor==='#d85c38'?'#3f6f87':'#d85c38';
[...state.bats.map((p,index)=>({p,color:batColor,bat:true,index})),...state.fielders.map((p,index)=>({p,color:fieldColor,bat:false,index:index+2}))].sort((a,b)=>a.p.y-b.p.y).forEach(({p,color,bat,index})=>window.TacoVisuals.person(ctx,p,color,bat,bat&&index===state.selected[battingPlayer()-1]?state.swing:0,index));
for(let player=1;player<=2;player++){if(!human(player))continue;const p=selected(player);ctx.strokeStyle=player===1?'#fff8c6':'#b8e8ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y-(p.elevation||0),18,10,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#273e32';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('J'+player+' · '+ui('power'+player).value+'%',p.x+(p.elevation>0?28:0),Math.max(12,p.y-52-(p.elevation||0)));
if(player===battingPlayer()){const angle=Number(ui('angle'+player).value)*Math.PI/180,side=p.x>550?-1:1;ctx.setLineDash([5,5]);line(p.x,p.y,p.x+side*Math.cos(angle)*90,p.y+Math.sin(angle)*90,'#fff6c3',2);ctx.setLineDash([]);}else if(state.ball.owner===state.selected[player-1]&&!p.elevation){ctx.setLineDash([6,6]);line(p.x,p.y,state.aim.x,state.aim.y,'#f9e7b5',2);ctx.setLineDash([]);ctx.strokeStyle='#f5e0a3';ctx.beginPath();ctx.arc(state.aim.x,state.aim.y,12,0,Math.PI*2);ctx.stroke();const charge=state.charges[player-1];if(charge!==null){rect(p.x-25,p.y-67,50,5,'#d4d8c3');rect(p.x-25,p.y-67,50*Math.min(charge/1.25,1),5,'#df6039');}}
}
for(const p of state.fielders){
 if(p.elevation===0){ctx.setLineDash([5,5]);line(p.throwLimit,146,p.throwLimit,320,'#fff4bd70',2);ctx.setLineDash([]);}
}
const ball=state.ball;window.TacoVisuals.ball(ctx,ball);window.TacoVisuals.effects(ctx);
if(ball.owner===null&&ball.z>18){ctx.fillStyle='#273e32';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(ball.onRoof?'NO TELHADO':'NO AR · '+Math.round(ball.z),ball.x,Math.max(12,ball.y-ball.z-13));}
ctx.fillStyle='#edf0df';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('CÍRCULO 01',190,302);ctx.fillText('CÍRCULO 02',910,302);ctx.fillStyle='#738567';ctx.font='11px Arial';ctx.fillText('RUA DAS BOAS MEMÓRIAS',550,391);
if(state.phase==='won'){rect(340,146,420,115,'#f5f2e9');ctx.fillStyle='#273e32';ctx.font='bold 28px Arial';ctx.fillText(state.winner?'VITÓRIA DA SUA DUPLA!':'FIM DE PARTIDA',550,190);ctx.font='14px Arial';ctx.fillText('Uma rua, quatro amigos e mais uma história.',550,220);line(534,236,566,255,'#a37644',5);line(566,236,534,255,'#a37644',5);}}
function frame(now){const dt=Math.min((now-last)/1000,.035);last=now;update(dt);if(!state.hubHidden){if(!blocked())window.TacoVisuals.tick(dt);draw();}requestAnimationFrame(frame);}
ui('hit').onclick=()=>action(1);ui('p2hit').onclick=()=>action(2);ui('run').onclick=()=>run(1);ui('p2run').onclick=()=>run(2);ui('cross').onclick=()=>cross(1);ui('p2cross').onclick=()=>cross(2);ui('aim').onclick=()=>aim(1);ui('p2aim').onclick=()=>aim(2);ui('switch').onclick=()=>switchPlayer(1);ui('p2switch').onclick=()=>switchPlayer(2);ui('climb').onclick=()=>climb(1);ui('p2climb').onclick=()=>climb(2);ui('pause').onclick=pause;ui('restart').onclick=()=>{ui('settings').close();reset();};ui('settingsOpen').onclick=()=>{keys.clear();state.charges=[null,null];ui('settings').showModal();};ui('settingsClose').onclick=()=>ui('settings').close();ui('rematch').onclick=reset;ui('dismissResult').onclick=()=>ui('result').close();ui('help').onclick=()=>{keys.clear();state.charges=[null,null];ui('rules').showModal();};ui('close').onclick=ui('play').onclick=()=>ui('rules').close();
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
document.addEventListener('keydown',e=>{if(['SELECT','INPUT'].includes(e.target.tagName)||ui('settings').open||ui('rules').open||ui('result').open)return;const k=e.key.toLowerCase();if([' ','enter','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k==='p')pause();if(blocked())return;if(k===' ')beginCharge(1);if(k==='q')switchPlayer(1);if(k==='r')run(1);if(k==='x')cross(1);if(k==='c')climb(1);if(state.mode==='local'){if(k==='enter')beginCharge(2);if(k==='/')switchPlayer(2);if(k==='l')run(2);if(k==='k')cross(2);if(k==='m')climb(2);}});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k===' ')releaseCharge(1);if(k==='enter'&&state.mode==='local')releaseCharge(2);});window.addEventListener('blur',()=>{keys.clear();state.charges=[null,null];});reset();requestAnimationFrame(frame);

// Only the same-origin hub may suspend/resume this embedded game.
window.addEventListener('message',event=>{
 if(event.source!==window.parent||event.origin!==window.location.origin||event.data?.type!=='childhoodHub:visibility')return;
 state.hubHidden=event.data.active!==true;keys.clear();state.charges=[null,null];
});

if(window.parent&&window.parent!==window)document.body.classList.add('embedded');

function fitCanvas(){
 const scale=Math.max(1,Math.min(2,(window.devicePixelRatio||1)*canvas.getBoundingClientRect().width/1100));
 canvas.width=Math.round(1100*scale);canvas.height=Math.round(420*scale);
 canvas.style.aspectRatio='1100 / 420';ctx.setTransform(canvas.width/1100,0,0,canvas.height/420,0,0);
}
if(window.TacoVisuals){fitCanvas();window.addEventListener('resize',fitCanvas);}
