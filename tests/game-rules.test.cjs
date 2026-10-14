const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// Run the real game state machine without a render loop or browser timing.
function game(mode = 'local', role = 'bat') {
  const nodes = new Map();
  const values = {mode, startRole: role, team: 'orange', mousePlayer: '1', angle1: '-35', angle2: '35', power1: '70', power2: '70'};
  const context = new Proxy({}, {get: () => () => {}});
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: values[id] || '', style: {}, open: false, classList: {remove() {}, toggle() {}},
      getContext: () => context, addEventListener() {}, showModal() {this.open = true;}, close() {this.open = false;}
    });
    return nodes.get(id);
  }
  const sandbox = {document: {getElementById: node, querySelector: selector => node(selector), querySelectorAll: () => [], addEventListener() {}}, window: {addEventListener() {}}, requestAnimationFrame() {}, Math: Object.assign(Object.create(Math), {random: () => .99})};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8'), sandbox);
  return source => vm.runInContext(source, sandbox);
}

test('a strong throw reaches the opposite circle in under one second', () => {
  const run = game();
  run('throwBall(2, 1)');
  assert.ok(run('state.ball.vx') >= 1200);
  run('for(let i=0;i<40;i++) update(.02)');
  assert.ok(run('state.ball.x') > 910);
});

test('bots alternate strong throws without advancing between unrebutted throws', () => {
  const run = game('solo');
  run('globalThis.shots=0;globalThis.minSpeed=Infinity;globalThis.previousOwner=0;for(let i=0;i<750;i++){update(.02);if(previousOwner!==null&&state.ball.owner===null){shots++;minSpeed=Math.min(minSpeed,Math.hypot(state.ball.vx,state.ball.vy));}previousOwner=state.ball.owner;}');
  assert.ok(run('shots') >= 4);
  assert.ok(run('minSpeed') > 1100);
  assert.equal(run('state.fielders[0].x'), 110);
  assert.equal(run('state.fielders[1].x'), 990);
});

test('pickup stops movement and freezes the forward limit; retreat remains allowed', () => {
  const run = game();
  run("state.ball={x:550,y:226,z:0,vx:0,vy:0,vz:0,owner:null,kind:'batted',touchedGround:true};state.fielders[0].x=550;state.fielders[0].goal={x:900,y:226};collectBall(0);move(state.fielders[0],1,0,1)");
  assert.equal(run('state.fielders[0].x'), 550);
  assert.equal(run('state.fielders[0].goal'), null);
  run('move(state.fielders[0],-1,0,.5)');
  assert.ok(run('state.fielders[0].x') < 550);
  run('move(state.fielders[0],1,0,2)');
  assert.equal(run('state.fielders[0].x'), 550);
  run('state.fielders[0].x=560;throwBall(2,1)');
  assert.equal(run('state.ball.owner'), 0);
});

test('right-side holder cannot advance left and a fresh rebat permits a new forward pickup', () => {
  const run = game();
  run("state.ball.owner=1;move(state.fielders[1],-1,0,1)");
  assert.equal(run('state.fielders[1].x'), 990);
  run("state.ball={x:700,y:226,z:0,vx:0,vy:0,vz:0,owner:null,kind:'batted',touchedGround:true};move(state.fielders[1],-1,0,1)");
  assert.ok(run('state.fielders[1].x') < 990);
  run('state.fielders[1].x=700;collectBall(1);move(state.fielders[1],-1,0,1)');
  assert.equal(run('state.fielders[1].x'), 700);
});

test('catching a descending rebat before ground contact wins for the fielding team', () => {
  const run = game();
  run("state.phase='loose';state.ball={x:550,y:226,z:25,vx:0,vy:0,vz:-80,owner:null,kind:'batted',touchedGround:false};state.fielders[0].x=550;update(.02)");
  assert.equal(run('state.phase'), 'won');
  assert.equal(run('state.winner'), false);
  assert.match(run('state.winReason'), /no ar/);
});

test('a bouncing rebat and an ordinary throw cannot grant an aerial victory', () => {
  for (const kind of ['batted', 'throw']) {
    const run = game();
    run(`state.phase='loose';state.ball={x:550,y:226,z:12,vx:0,vy:0,vz:-80,owner:null,kind:'${kind}',touchedGround:true};state.fielders[0].x=550;update(.02)`);
    assert.notEqual(run('state.phase'), 'won');
    assert.equal(run('state.ball.owner'), 0);
  }
});

test('roof contact keeps play active and scoring continues without an automatic win', () => {
  const run = game();
  run("state.phase='loose';state.running=true;state.ball={x:550,y:106,z:80,vx:0,vy:-100,vz:30,owner:null,kind:'batted',touchedGround:false};state.bats=[{x:910,y:226},{x:190,y:226}];update(.02)");
  assert.equal(run('state.phase'), 'roof');
  assert.equal(run('state.ball.onRoof'), true);
  assert.equal(run('state.score'), 10);
  assert.equal(run("ui('result').open"), false);
  run('run(1);for(let i=0;i<190;i++)update(.02)');
  assert.equal(run('state.score'), 20);
});

test('roof recovery requires climbing, does not count as an aerial catch and requires descent to throw', () => {
  const run = game();
  run("state.phase='roof';state.running=true;state.ball={x:550,y:90,z:52,vx:0,vy:0,vz:0,owner:null,kind:'batted',touchedGround:false,onRoof:true};state.fielders[0].x=530;state.fielders[0].y=110;climb(2);for(let i=0;i<100;i++)update(.02)");
  assert.equal(run('state.ball.owner'), 0);
  assert.equal(run('state.fielders[0].elevation'), 52);
  assert.notEqual(run('state.phase'), 'won');
  run('throwBall(2,1)');
  assert.equal(run('state.ball.owner'), 0);
  run('climb(2);for(let i=0;i<100;i++)update(.02)');
  assert.equal(run('state.fielders[0].elevation'), 0);
  run('throwBall(2,1)');
  assert.equal(run('state.ball.owner'), null);
  assert.equal(run('state.phase'), 'shot');
});

test('bot recovers a roof ball, descends and launches from its collection line', () => {
  const run = game('solo');
  run("state.phase='roof';state.running=true;state.ball={x:550,y:90,z:52,vx:0,vy:0,vz:0,owner:null,kind:'batted',touchedGround:false,onRoof:true};for(let i=0;i<400;i++)update(.02)");
  assert.equal(run('Boolean(state.ball.onRoof)'), false);
  assert.equal(run('state.fielders.every(p=>p.elevation===0)'), true);
  assert.notEqual(run('state.phase'), 'roof');
  assert.ok(run('state.fielders[0].x<=state.fielders[0].throwLimit'));
});

test('roof-running victory still requires reaching 100 and crossing the bats', () => {
  const run = game();
  run("state.phase='roof';state.running=true;state.score=90;state.ball={x:550,y:90,z:52,vx:0,vy:0,vz:0,owner:null,kind:'batted',onRoof:true};state.bats=[{x:910,y:226},{x:190,y:226}];update(.02)");
  assert.equal(run('state.score'), 100);
  assert.equal(run('state.phase'), 'roof');
  run('cross(1);for(let i=0;i<100;i++)update(.02)');
  assert.equal(run('state.phase'), 'won');
  assert.equal(run('state.winner'), true);
});

test('bottles are restored upright when the teams switch', () => {
  const run = game();
  run('state.broken=1;swap(1)');
  assert.equal(run('state.broken'), -1);
  assert.equal(run('state.role'), 'ball');
});

test('fast catches can slip without granting aerial victory, then be retrieved after falling', () => {
  const run = game();
  run("Math.random=()=>0;state.phase='loose';state.ball={x:550,y:226,z:25,vx:600,vy:0,vz:-80,owner:null,kind:'batted',touchedGround:false};state.fielders[0].x=550;attemptCatch(0,true)");
  assert.notEqual(run('state.phase'), 'won');
  assert.equal(run('state.ball.owner'), null);
  assert.equal(run('state.stats.drops'), 1);
  assert.equal(run('state.ball.airCatchEligible'), false);
  run('for(let i=0;i<40;i++)update(.02)');
  assert.equal(run('state.ball.touchedGround'), true);
  run('state.fielders[0].x=state.ball.x;state.fielders[0].y=state.ball.y;state.ball.vx=state.ball.vy=state.ball.vz=0;update(.02)');
  assert.equal(run('state.ball.owner'), 0);
});

test('slow balls are collected reliably and high speed increases the chance of a slip', () => {
  const run = game();
  run("Math.random=()=>.2;state.ball={x:550,y:226,z:0,vx:50,vy:0,vz:0,owner:null,kind:'batted',touchedGround:true};attemptCatch(0)");
  assert.equal(run('state.ball.owner'), 0);
  run("state.ball={x:550,y:226,z:0,vx:1000,vy:0,vz:0,owner:null,kind:'throw',touchedGround:true};attemptCatch(0)");
  assert.equal(run('state.ball.owner'), null);
});
