const fs=require('fs'),vm=require('vm'),assert=require('assert');
let allocations=0,layoutReads=0;
class Element{
 constructor(tag=''){allocations++;this.tag=tag;this.dataset={};this.style={setProperty:(k,v)=>this.styles[k]=String(v)};this.styles={};this.classList={toggle:()=>{},add:()=>{},remove:()=>{},contains:()=>true};this.children=[];this.attrs={};this.clientWidth=1600;}
 setAttribute(k,v){this.attrs[k]=v}append(a){a.parent=this;this.children.push(a)}remove(){this.parent.children=this.parent.children.filter(x=>x!==this)}getBoundingClientRect(){layoutReads++;return {}}
 set innerHTML(s){this.images=new Element();this.rotor=new Element();this.buttons=[new Element(),new Element()]}
 querySelector(s){return s==='.rotor'?this.rotor:this.images}querySelectorAll(s){if(s==='button')return this.buttons;if(s==='figure')return this.rotor.children;return []}addEventListener(){}
}
const stage=new Element(),status=new Element(),prev=new Element(),next=new Element();let timer;
const ctx=vm.createContext({document:{querySelector:s=>({'.stage':stage,'#status':status,'#previous':prev,'#next':next}[s]),createElement:t=>new Element(t)},matchMedia:()=>({matches:false}),innerWidth:1600,addEventListener:()=>{},requestAnimationFrame:f=>1,performance:{now:()=>0},setTimeout:f=>(timer=f,1),clearTimeout:()=>{}});
vm.runInContext(fs.readFileSync(__dirname+'/check.js','utf8'),ctx);
function value(code){return vm.runInContext(code,ctx)}
assert.equal(value('current'),1);const initialAllocations=allocations;
for(const dir of [1,1,1,-1,-1,-1,1,-1]){
 const before=new Map(stage.children.map(a=>[a.dataset.sequence,Number(a.styles['--position'])]));
 value(`move(${dir})`);
 for(const a of stage.children)if(before.has(a.dataset.sequence))assert.equal(Number(a.styles['--position']),before.get(a.dataset.sequence)-dir,'Every retained carousel must move only along the belt');
 timer();
 assert.equal(stage.children.filter(a=>a.styles['--position']==='0').length,1);
 for(const a of stage.children){const visible=a.rotor.children.filter(f=>f.styles['--visible']==='1').length;assert.equal(visible,a.styles['--position']==='0'?5:3)}
}
value('move(1);move(1);move(1)');timer();timer();timer();assert.equal(value('current'),4);assert.equal(value('moving'),false);
value('spin(1,1)');assert.equal(value('projects[1].index'),3);
assert(stage.children.length<=9,'Offscreen copies should be recycled');
assert.equal(allocations,initialAllocations,'Navigation must reuse nodes');assert.equal(layoutReads,0,'Navigation must not force layout reads');
for(let k=0;k<25;k++){const before=value('projects[1].index');value('spin(1,1)');assert.equal(value('projects[1].index'),before+1);for(const a of stage.children)if(((Number(a.dataset.sequence)%3)+3)%3===1)assert.equal(a.rotor.styles['--rotation'],String(-(before+1)*36)+'deg')}
for(let k=0;k<40;k++){const before=value('projects[1].index');value('spin(1,-1)');assert.equal(value('projects[1].index'),before-1)}
assert.equal(allocations,initialAllocations);
value('lastAutoTime=0');
const beforeAuto=value('projects.map(p=>p.index)');
for(let n=1;n<=240;n++)value(`autoRotate(${n*50})`);
const afterAuto=value('projects.map(p=>p.index)');
const selected=value('mod(current,projects.length)');
for(let i=0;i<3;i++)assert(Math.abs(afterAuto[i]-beforeAuto[i]-(i===selected?1:0))<1e-8,'Only the central carousel should rotate');
value('hoverSequence=current');const paused=value('projects[mod(current,projects.length)].index');
value('autoRotate(12050)');assert.equal(value('projects[mod(current,projects.length)].index'),paused);
value('hoverSequence=null;autoRotate(12100)');assert(value('projects[mod(current,projects.length)].index')>paused);
value('hoverSequence=current;spin(mod(current,projects.length),1)');
const clickedIndex=value('projects[mod(current,projects.length)].index');
value('autoRotate(12150)');assert.equal(value('projects[mod(current,projects.length)].index'),clickedIndex,'Hover must keep the manually selected position paused');
value('hoverSequence=null;autoRotate(12200)');
assert(Math.abs(value('projects[mod(current,projects.length)].index')-clickedIndex-50/12000)<1e-8,'Unhover resumes immediately from the clicked position');
assert.equal(value('focusScale(0,0,true)'),1.3);
assert.equal(value('focusScale(0,1,true)'),1);
assert.equal(value('focusScale(0,.5,true)'),1.15);
assert.equal(value('focusScale(0,-.5,true)'),1.15);
assert.equal(value('focusScale(0,0,false)'),1);
assert.equal(value('focusScale(0,ringCount,true)'),1.3);
assert(Math.abs(value('focusScale(0,.0001,true)')-1.3)<1e-7,'No abrupt scale change near center');
value('projects[mod(current,projects.length)].index=2.4;move(1)');timer();
for(const a of stage.children){if(a.styles['--position']==='0')assert.equal(a.styles['--ring-radius'],'420px');else{assert.equal(a.styles['--ring-radius'],'420px');const projectIndex=value('projects['+((Number(a.dataset.sequence)%3+3)%3)+'].index');assert.equal(Number.parseFloat(a.rotor.styles['--rotation']),-projectIndex*36,'Switching must preserve the exact ring orientation')}}
const frozen=stage.children.map(a=>({a,rotation:a.rotor.styles['--rotation'],radius:a.styles['--ring-radius'],cards:a.rotor.children.map(f=>({...f.styles}))}));
value('move(-1)');
for(const before of frozen){assert.equal(before.a.rotor.styles['--rotation'],before.rotation);assert.equal(before.a.styles['--ring-radius'],before.radius);before.a.rotor.children.forEach((f,j)=>assert.deepEqual(f.styles,before.cards[j],'Inner card transforms and visibility must stay fixed throughout parent switching'))}
timer();
console.log('Passed: stable inner cards during parent transitions, identical ring geometry and preserved fractional angles at both sizes, symmetric eased enlargement, smooth peak, ring wrapping, central-only auto rotation, hover pause, click while paused, immediate resume from selected position.');
