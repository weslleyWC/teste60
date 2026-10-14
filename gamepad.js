'use strict';
window.TacoGamepad=(()=>{
 let previous=[],identity=null;const movement={player:1,x:0,y:0};
 const axis=v=>Math.abs(v||0)<.18?0:Math.sign(v)*(Math.abs(v)-.18)/.82;
 function status(text){const el=document.getElementById('gamepadStatus');if(el&&el.textContent!==text)el.textContent=text;}
 function poll(api){
  let pads=[],unavailable='';try{if(navigator.getGamepads)pads=Array.from(navigator.getGamepads());else unavailable='Este navegador não oferece suporte a controle. Use o teclado.';}catch{unavailable='Controle indisponível neste endereço. Abra por HTTPS ou localhost.';}
  const pad=pads.find(p=>p&&p.connected&&p.mapping==='standard');
  movement.x=movement.y=0;
  if(!pad){if(identity!==null)api.cancelCharge(movement.player);identity=null;previous=[];status(unavailable||(pads.some(p=>p&&p.connected)?'Controle sem mapeamento Xbox neste navegador. Tente Chrome/Edge ou use o teclado.':'Conecte o controle Xbox e aperte um botão nele para o navegador reconhecer.'));return movement;}
  const id=pad.index+':'+pad.id;if(identity!==id){api.cancelCharge(movement.player);previous=[];identity=id;}
  const player=api.local?Number(document.getElementById('padPlayer').value):1;if(movement.player!==player){api.cancelCharge(movement.player);previous=[];}movement.player=player;
  status('Controle conectado · Jogador '+player+' · '+pad.id);
  const pressed=pad.buttons.map(b=>b.pressed||b.value>.5),edge=i=>pressed[i]&&!previous[i];
  if(edge(9)&&!api.modal)api.pause();
  if(api.blocked()){api.cancelCharge(player);previous=pressed;return movement;}
  movement.x=axis(pad.axes[0]);movement.y=axis(pad.axes[1]);
  const rx=axis(pad.axes[2]),ry=axis(pad.axes[3]);if(Math.hypot(rx,ry)>.1)api.aim(player,rx,ry);
  if(edge(0))api.begin(player);if(!pressed[0]&&previous[0])api.release(player);
  if(edge(1))api.switch(player);if(edge(2))api.run(player);if(edge(3))api.interact(player);
  if(edge(12))api.cross(player);if(edge(14))api.target(player);
  for(const [i,change]of [[4,-5],[5,5]])if(edge(i))api.power(player,change);
  previous=pressed;return movement;
 }
 return {poll};
})();
