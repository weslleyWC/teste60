const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function controller(){
 const pad={id:'Xbox test',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 const nodes={padPlayer:{value:'2'},gamepadStatus:{textContent:''}},events=[];let blocked=false;
 const api={local:true,modal:false,blocked:()=>blocked};for(const name of ['begin','release','cancelCharge','switch','run','interact','cross','target','power','aim'])api[name]=(...args)=>events.push([name,...args]);api.pause=()=>{blocked=!blocked;events.push(['pause']);};
 const sandbox={window:{},navigator:{getGamepads:()=>pad.connected?[pad]:[]},document:{getElementById:id=>nodes[id]}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','gamepad.js'),'utf8'),sandbox);
 return {pad,events,api,poll:()=>sandbox.window.TacoGamepad.poll(api),press:i=>pad.buttons[i]={pressed:true,value:1},release:i=>pad.buttons[i]={pressed:false,value:0}};
}
test('Xbox maps J2 analog input, deadzone, A press/release and B/X/Y actions',()=>{
 const c=controller();assert.equal(c.poll().player,2);c.pad.axes[0]=.1;assert.equal(c.poll().x,0);c.pad.axes[0]=.8;assert.ok(c.poll().x>.5);
 c.press(0);c.poll();c.poll();c.release(0);c.poll();assert.equal(c.events.filter(e=>e[0]==='begin').length,1);assert.deepEqual(c.events.find(e=>e[0]==='release'),['release',2]);
 for(const [i,name]of [[1,'switch'],[2,'run'],[3,'interact'],[12,'cross'],[14,'target']]){c.press(i);c.poll();assert.ok(c.events.some(e=>e[0]===name&&e[1]===2));}
});
test('bumpers adjust strength and disconnect clears movement and charging',()=>{
 const c=controller();c.press(4);c.poll();c.press(5);c.poll();assert.ok(c.events.some(e=>e[0]==='power'&&e[2]===-5));assert.ok(c.events.some(e=>e[0]==='power'&&e[2]===5));c.pad.connected=false;const motion=c.poll();assert.equal(motion.x,0);assert.equal(motion.y,0);assert.deepEqual(c.events.at(-1),['cancelCharge',2]);
});
test('pause blocks gameplay and Menu resumes; open dialogs suppress Menu',()=>{
 const c=controller();c.press(9);c.poll();c.press(0);c.pad.axes[0]=1;assert.equal(c.poll().x,0);assert.equal(c.events.some(e=>e[0]==='begin'),false);c.release(9);c.poll();c.press(9);assert.ok(c.poll().x>0);c.release(9);c.poll();c.api.modal=true;c.press(9);c.poll();assert.equal(c.events.filter(e=>e[0]==='pause').length,2);
});
