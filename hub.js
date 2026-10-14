'use strict';
const hub=document.getElementById('hub'),player=document.getElementById('player'),frame=document.getElementById('gameFrame');
const games=window.ChildhoodGames;let activeGame=null,lastCard=null;
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;}
for(const game of games){
 const card=element('article','game-card'+(game.available?' playable':' upcoming'));
 const cover=element(game.available?'a':'div','card-cover');if(game.available){cover.href='#jogar/'+game.id;cover.setAttribute('aria-label','Abrir '+game.title);}const img=element('img');img.src=game.cover;img.alt='Ilustração de '+game.title;img.loading='lazy';cover.append(img,element('span','badge'+(game.available?' available':''),game.available?'PRONTO PRA JOGAR':'EM BREVE'));
 const body=element('div','card-body'),top=element('div','card-category');top.append(element('span','game-icon',game.icon),element('span','',game.category));body.append(top,element('h3','',game.title),element('p','',game.description),element('span','players',game.players));
 const button=element('button','card-button',game.available?'Jogar agora ↗':'Em breve');button.disabled=!game.available;if(game.available)cover.addEventListener('click',()=>{lastCard=button;});button.setAttribute('aria-label',game.available?'Jogar '+game.title:game.title+' — em breve');if(game.available)button.addEventListener('click',()=>{lastCard=button;location.hash='jogar/'+game.id;});body.append(button);card.append(cover,body);document.getElementById('gameGrid').append(card);
}
const available=games.filter(game=>game.available).length;document.getElementById('gameCount').textContent=available+' '+(available===1?'jogo disponível':'jogos disponíveis');
function visibility(active){if(frame.contentWindow&&activeGame)frame.contentWindow.postMessage({type:'childhoodHub:visibility',active},location.origin);}
function openGame(game){
 const different=activeGame?.id!==game.id;hub.hidden=true;player.hidden=false;document.body.classList.add('in-game');document.getElementById('playingTitle').textContent=game.title;document.title=game.title+' — Recreio';document.getElementById('playerStatus').textContent='';
 if(different){activeGame=game;frame.title=game.title;frame.src=game.url;}else visibility(true);
 window.scrollTo(0,0);document.getElementById('backToHub').focus();
}
function closeGame(){
 visibility(false);player.hidden=true;hub.hidden=false;document.body.classList.remove('in-game');document.title='Recreio — jogos de infância';
 if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
 if(lastCard)lastCard.focus();
}
function route(){const match=location.hash.match(/^#jogar\/([a-z0-9-]+)$/);const game=match&&games.find(g=>g.id===match[1]&&g.available);if(game)openGame(game);else closeGame();}
frame.addEventListener('load',()=>visibility(!player.hidden));
document.getElementById('backToHub').onclick=()=>{location.hash='colecao';};
const fullscreen=document.getElementById('fullscreen');
fullscreen.onclick=async()=>{
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(player.requestFullscreen)await player.requestFullscreen();else throw new Error('Fullscreen unavailable');}
 catch{document.getElementById('playerStatus').textContent='Seu navegador não permitiu tela cheia. O jogo continua disponível nesta janela.';}
};
document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===player;fullscreen.textContent=active?'⛶ Sair da tela cheia':'⛶ Tela cheia';fullscreen.setAttribute('aria-pressed',String(active));});
window.addEventListener('hashchange',route);route();
