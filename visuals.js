'use strict';
// Visual effects have their own deterministic noise; they never consume gameplay randomness.
window.TacoVisuals = (() => {
  const W=1100,H=420;let scenery=null,time=0,particles=[],trail=[],lastBall=null,serial=0;
  const positions=new WeakMap();
  const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function line(c,x,y,a,b,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();}
  function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function buildScene(){
    const layer=document.createElement('canvas');layer.width=W*2;layer.height=H*2;const c=layer.getContext('2d');c.scale(2,2);
    box(c,0,0,W,H,'#bcc89c');
    const road=c.createLinearGradient(0,125,0,334);road.addColorStop(0,'#8b9387');road.addColorStop(.55,'#9a9d8f');road.addColorStop(1,'#838d81');box(c,0,130,W,204,road);
    // Small aggregate and old asphalt repairs, generated once rather than every frame.
    for(let i=0;i<2100;i++){const x=noise(i)*W,y=135+noise(i+7000)*193;box(c,x,y,noise(i+2000)*1.8+.4,.7,i%2?'#e1dfc21c':'#28382d12');}
    for(const [x,y,w,h] of [[365,267,110,18],[695,156,72,22],[50,307,145,10]]){poly(c,[[x,y],[x+w,y-3],[x+w+12,y+h],[x-6,y+h]],'#56675916');}
    for(const points of [[[270,158],[280,170],[273,182],[292,194]],[[720,288],[736,280],[747,286],[766,276]],[[96,249],[103,264],[97,281]]]){c.strokeStyle='#55635655';c.lineWidth=.8;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
    box(c,0,116,W,13,'#dfddc1');box(c,0,129,W,5,'#51654d33');box(c,0,334,W,14,'#dcddc2');box(c,0,348,W,18,'#a6b78d');
    for(let x=0;x<W;x+=39){line(c,x,117,x+4,128,'#9da88c',1);line(c,x,335,x+2,347,'#9da88c',1);}
    c.setLineDash([23,23]);line(c,310,237,790,237,'#e9dfb987',2);c.setLineDash([]);
    for(let i=0;i<8;i++)house(c,i*157-15,i);
    for(const x of [48,1036])tree(c,x,92);
    // Low garden walls and flowering yards on the near side of the street.
    for(let i=0;i<8;i++){const x=i*157-15;box(c,x,378,132,42,i%2?'#b2c398':'#9cb488');box(c,x,374,132,8,'#e3dfbd');box(c,x,382,132,4,'#75876a');for(let j=0;j<7;j++){ellipse(c,x+14+j*17,399+noise(i*10+j)*10,11,8,'#819f6a');if(j%3===0)ellipse(c,x+14+j*17,396,2,2,'#e5b379');}}
    // Afternoon tree shadows reach into the road, with a transparent warm wash.
    for(const x of [40,1015]){ellipse(c,x+42,162,48,15,'#354e3720');ellipse(c,x+65,173,24,10,'#354e3712');}
    const sun=c.createLinearGradient(0,0,W,H);sun.addColorStop(0,'#fff0b314');sun.addColorStop(1,'#4c735b0c');box(c,0,0,W,H,sun);
    scenery=layer;
  }
  function house(c,x,i){
    const walls=['#ded0aa','#d6b592','#bfc8ab','#d4bd9c'],roof=['#b77952','#a36d4d','#8b9670','#b8835e'];
    poly(c,[[x+12,110],[x+146,110],[x+169,123],[x+35,123]],'#3a49342a');
    box(c,x,56,130,56,walls[i%4]);poly(c,[[x+130,56],[x+143,43],[x+143,105],[x+130,112]],'#978e70');
    box(c,x,100,130,12,'#b2ae8a');box(c,x,107,130,5,'#d5cfab');
    poly(c,[[x-5,57],[x+130,57],[x+143,43],[x+8,43]],'#675d43');
    poly(c,[[x-5,53],[x+8,16],[x+143,16],[x+130,53]],roof[i%4]);
    c.save();c.beginPath();c.moveTo(x-5,53);c.lineTo(x+8,16);c.lineTo(x+143,16);c.lineTo(x+130,53);c.closePath();c.clip();
    for(let row=0;row<5;row++)for(let j=0;j<12;j++){const tx=x+j*14+(row%2?7:0)-8,ty=18+row*8;line(c,tx,ty,tx+12,ty,'#f4c89b35',1.6);line(c,tx+12,ty,tx+10,ty+7,'#533d3124',1);}
    c.restore();line(c,x+8,16,x+143,16,'#efd5a76e',2);
    // Chimney with separate faces.
    if(i%3===0){box(c,x+100,12,14,14,'#bfa481');poly(c,[[x+114,12],[x+120,8],[x+120,22],[x+114,26]],'#8c785d');poly(c,[[x+100,12],[x+106,8],[x+120,8],[x+114,12]],'#d8be96');}
    box(c,x+47,70,27,39,'#677563');box(c,x+50,73,20,36,'#76846a');ellipse(c,x+67,92,1.6,1.6,'#dfc389');
    for(const wx of [x+12,x+91]){box(c,wx-2,69,26,23,'#e7debd');box(c,wx,71,22,18,'#70968a');box(c,wx+2,73,8,14,'#a3c4ac');line(c,wx+11,71,wx+11,89,'#e3dab8',2);line(c,wx,80,wx+22,80,'#e3dab8',2);box(c,wx-3,92,28,4,'#a49879');}
    c.fillStyle='#7a755e';c.font='7px Arial';c.fillText(String(12+i*2),x+80,78);
    box(c,x+32,103,10,8,'#b38259');ellipse(c,x+37,102,8,5,'#799369');ellipse(c,x+39,98,5,4,'#8aa46e');
  }
  function tree(c,x,y){
    line(c,x,y,x+21,y+47,'#44573c30',9);line(c,x,y,x,y-47,'#8d7753',7);line(c,x,y-32,x-15,y-51,'#8d7753',4);
    for(let i=0;i<12;i++){const angle=i*2.4,r=12+noise(i)*16;ellipse(c,x+Math.cos(angle)*r,y-43+Math.sin(angle)*r*.7,18+noise(i+10)*7,15+noise(i+20)*6,['#6b8d58','#7fa267','#92b476','#a1bb7c'][i%4]);}
    ellipse(c,x-9,y-54,16,10,'#adc68a');
  }
  function background(c){if(!scenery)buildScene();c.drawImage(scenery,0,0,W,H);}
  function burst(x,y,type='dust'){
    const count=type==='hit'?14:type==='win'?40:3;
    for(let i=0;i<count;i++){const n=serial++,a=noise(n)*Math.PI*2,v=(type==='hit'?65:28)+noise(n+1)*70;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.55,z:type==='hit'?12:0,vz:30+noise(n+2)*55,life:.35+noise(n+3)*.45,max:.8,type});}
    if(particles.length>130)particles.splice(0,particles.length-130);
  }
  function tick(dt){time+=dt;particles=particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z=Math.max(0,p.z+p.vz*dt);p.vz-=150*dt;return p.life>0;});trail=trail.filter(p=>(p.life-=dt)>0);}
  function person(c,p,color,bat,swing,index){
    const previous=positions.get(p),moving=previous&&Math.hypot(p.x-previous.x,p.y-previous.y)>.2;positions.set(p,{x:p.x,y:p.y});
    const stride=moving?Math.sin(time*18+index)*4:0,bob=moving?Math.abs(Math.sin(time*18+index))*1.5:Math.sin(time*2+index)*.4;
    if(moving&&Math.floor(time*12)%5===index%5)burst(p.x,p.y,'dust');
    ellipse(c,p.x+9,p.y+3,16,6,'#253a3035');line(c,p.x,p.y,p.x+20,p.y+10,'#31462c20',6);
    c.save();c.translate(p.x,p.y-(p.elevation||0)-bob);const depthScale=1-(p.elevation||0)/52*.22;c.scale(depthScale,depthScale);
    // Shoes, socks, shorts and shaded shirts give the figures volume.
    line(c,-5,-12,-7+stride,-2,'#bf946d',5);line(c,5,-12,7-stride,-2,'#bf946d',5);
    line(c,-7+stride,-2,-11+stride,0,'#f1e6cc',5);line(c,7-stride,-2,11-stride,0,'#f1e6cc',5);
    poly(c,[[-9,-18],[9,-18],[8,-9],[1,-8],[0,-13],[-2,-8],[-8,-9]],'#344b46');
    poly(c,[[-9,-34],[7,-36],[11,-19],[5,-15],[-9,-18]],color);poly(c,[[7,-36],[11,-19],[5,-15],[3,-31]],'#172d313b');line(c,-6,-32,-6,-21,'#fff4d633',2);
    c.fillStyle='#fff1d6';c.font='bold 7px Arial';c.textAlign='center';c.fillText(String(index+1),0,-24);
    const skin=['#d4a071','#bd865e','#e0b58d','#a97451'][index%4];
    ellipse(c,0,-43,8,9,skin);ellipse(c,3,-42,5,7,'#7f4b3420');ellipse(c,-2,-48,8,5,['#3d332b','#564331','#302e2a','#493b2d'][index%4]);
    line(c,-7,-30,-17,-20+stride,skin,4);line(c,8,-30,18,-20-stride,skin,4);
    if(bat){const side=p.x<550?-1:1,hit=swing>0;
      line(c,side*17,-19,side*(hit?43:39),hit?-37:0,'#77532f',7);line(c,side*17,-20,side*(hit?43:39),hit?-38:-1,'#cca371',4);line(c,side*17,-20,side*23,-16,'#eee0bc',2);
      if(hit){c.strokeStyle='#fff0bb99';c.lineWidth=2;c.beginPath();c.arc(side*15,-20,32,side>0?-1.1:2.1,side>0?.5:3.7);c.stroke();}
    }else{ellipse(c,18,-19-stride,4,4,'#c59b6a');}
    c.restore();
  }
  function bottle(c,x,y){
    ellipse(c,x+7,y+8,12,4,'#334c3530');
    const glass=c.createLinearGradient(x-5,0,x+6,0);glass.addColorStop(0,'#366c59');glass.addColorStop(.4,'#82b49a');glass.addColorStop(1,'#2d624f');
    poly(c,[[x-5,y+7],[x-5,y-7],[x-2,y-11],[x-2,y-18],[x+2,y-18],[x+2,y-11],[x+5,y-7],[x+5,y+7]],glass);box(c,x-3,y-20,6,3,'#dbc57c');box(c,x-5,y-2,10,7,'#e3d9b2');box(c,x-3,y,6,2,'#77976a');line(c,x-3,y-12,x-3,y-5,'#dcf1d699',1);
  }
  function ball(c,ball){
    if(ball.owner===null&&!ball.onRoof){if(!lastBall||Math.hypot(ball.x-lastBall.x,ball.y-lastBall.y)>2)trail.push({x:ball.x,y:ball.y-ball.z,life:.15});}else trail=[];
    lastBall={x:ball.x,y:ball.y};if(trail.length>14)trail.shift();
    for(const p of trail)ellipse(c,p.x,p.y,3,3,`rgba(255,239,178,${Math.max(0,p.life)*1.7})`);
    ellipse(c,ball.x+ball.z*.15,ball.y+3,6+ball.z*.04,3+ball.z*.015,`rgba(35,55,39,${Math.max(.08,.27-ball.z*.002)})`);
    const screenY=ball.y-ball.z;const g=c.createRadialGradient(ball.x-2,screenY-2,1,ball.x,screenY,6);g.addColorStop(0,'#fffdf1');g.addColorStop(.7,'#f8e8ba');g.addColorStop(1,'#bbaa77');ellipse(c,ball.x,screenY,6,6,g);
    c.strokeStyle='#b7966f';c.lineWidth=.7;c.beginPath();c.arc(ball.x-2,screenY,4,-1.2,1.2);c.stroke();
  }
  function effects(c){for(const p of particles){c.globalAlpha=Math.max(0,p.life/p.max);if(p.type==='hit')line(c,p.x,p.y-p.z,p.x-p.vx*.03,p.y-p.z-p.vy*.03,'#ffedb0',2);else ellipse(c,p.x,p.y-p.z,p.type==='win'?3:2,p.type==='win'?2:1.2,p.type==='win'?'#e6b85e':'#e1cc9a');}c.globalAlpha=1;}
  function reset(){particles=[];trail=[];lastBall=null;}
  return {background,person,bottle,ball,effects,tick,burst,reset};
})();
