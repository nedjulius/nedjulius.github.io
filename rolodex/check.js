
const photos=[['photo-1544850716-ef48420ae3bc','Rocky coastline and blue ocean'],['photo-1746911779503-f16ee2088257','Repeating concrete balconies'],['photo-1522743791393-522312deeebf','Concrete monoliths against the sky'],['photo-1680647337398-03be08e138eb','Angular facade and dark sky'],['photo-1549791084-5f78368b208b','Minimal white architectural forms']];
const projects=[{title:'Coastal studies',index:0},{title:'Concrete & light',index:2},{title:'Quiet geometry',index:4}];
let current=1;const stage=document.querySelector('.stage');const mod=(n,m)=>(n%m+m)%m;
const ringCount=photos.length*2,angleStep=360/ringCount;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const copies=new Map();let moving=false,pending=0,finishTimer,gesture,suppressClick=false;
function createCopy(sequence){
 const i=mod(sequence,projects.length),p=projects[i];
 const a=document.createElement('article');a.className='project';a.dataset.sequence=sequence;a.setAttribute('aria-label',p.title);
 a.innerHTML='<div class="images"><div class="rotor"></div></div>';a.rotor=a.querySelector('.rotor');
 Array.from({length:ringCount},(_,j)=>photos[j%photos.length]).forEach((photo,j)=>{const f=document.createElement('figure');const img=document.createElement('img');img.width=210;img.height=280;img.decoding="async";img.draggable=false;img.src='https://images.unsplash.com/'+photo[0]+'?auto=format&fit=crop&w=600&q=80';img.alt=photo[1];f.append(img);f.onclick=()=>{if(suppressClick)return;const selected=Number(a.dataset.sequence);const offset=selected-current;if(offset)move(Math.sign(offset));else{const p=projects[mod(selected,projects.length)];const half=Math.floor(ringCount/2);const delta=mod(j-Math.round(p.index)+half,ringCount)-half;spin(mod(selected,projects.length),delta)}};a.rotor.append(f)});
 copies.set(sequence,a);stage.append(a);placeOffscreen(a,sequence);
}
function radius(){const pixels=innerWidth<=700?300:Math.min(620,Math.max(300,innerWidth*.39));return Math.ceil(innerWidth/(2*pixels))+2;}
function placeOffscreen(a,sequence){a.classList.add('resetting');a.style.transition='none';a.dataset.sequence=sequence;a.setAttribute('aria-label',projects[mod(sequence,projects.length)].title);renderCopy(a,sequence);requestAnimationFrame(()=>{a.style.transition='';a.classList.remove('resetting')})}
function fill(){const r=radius();for(let n=current-r;n<=current+r;n++)if(!copies.has(n))createCopy(n);}
function recycle(){const r=radius(),pool=[];for(const [n,a] of copies)if(Math.abs(n-current)>r){copies.delete(n);pool.push(a)}
 for(let n=current-r;n<=current+r;n++)if(!copies.has(n)){const a=pool.pop();if(a){copies.set(n,a);placeOffscreen(a,n)}else createCopy(n)}
 for(const a of pool)a.remove();
}
function spin(i,d){projects[mod(i,projects.length)].index=Math.round(projects[mod(i,projects.length)].index)+d;render()}
function focusScale(card,index,active){
 if(!active)return 1;
 const half=ringCount/2;
 const distance=Math.abs(mod(card-index+half,ringCount)-half);
 // A cosine bell has zero slope at the center and both ends.
 const weight=distance<1?(1+Math.cos(Math.PI*distance))/2:0;
 return 1+.3*weight;
}
function updateFocus(a,index){a.querySelectorAll('figure').forEach((f,j)=>f.style.setProperty('--focus-scale',focusScale(j,index,true)))}
function renderCopy(a,sequence){const pos=sequence-current,i=mod(sequence,projects.length);
 a.style.setProperty('--position',pos);a.style.setProperty('--scale',pos?'.4556':'1.15');a.style.setProperty('--opacity',pos?'.32':'1');a.style.setProperty('--layer',pos?'1':'3');a.classList.toggle('active',!pos);a.classList.toggle('near',Math.abs(pos)<=2);
 const outside=Math.abs(pos)>1;a.inert=outside;a.setAttribute('aria-hidden',String(outside));
 // Move the parent row without also rotating, resizing, or revealing its cards.
 if(moving&&a.dataset.imageState!==undefined)return;
 a.style.setProperty('--ring-radius','420px');
 const displayIndex=projects[i].index;
 a.rotor.style.setProperty('--rotation',(-displayIndex*angleStep)+'deg');
 const imageState=(pos===0)+':'+Math.round(displayIndex);if(a.dataset.imageState===imageState)return;a.dataset.imageState=imageState;
 a.querySelectorAll('figure').forEach((f,j)=>{const half=Math.floor(ringCount/2);const slot=mod(j-Math.round(displayIndex)+half,ringCount)-half;const visible=Math.abs(slot)<=(pos?1:2);
 f.style.setProperty('--focus-scale',focusScale(j,displayIndex,true));f.style.setProperty('--angle',(j*angleStep)+'deg');f.style.setProperty('--shade',Math.abs(slot)*.16);f.style.setProperty('--visible',visible?'1':'0');f.style.pointerEvents=visible?'auto':'none';f.setAttribute('aria-hidden',String(!visible));
 });
}
function render(){for(const [sequence,a] of copies)renderCopy(a,sequence);document.querySelector('#status').textContent=projects[mod(current,projects.length)].title;}
function completeMove(){if(!moving)return;clearTimeout(finishTimer);moving=false;render();recycle();if(pending){const d=Math.sign(pending);pending-=d;move(d)}}
function move(d){if(moving){pending+=d;return}for(const a of copies.values())a.rotor.classList.remove('auto-rotating');moving=true;current+=d;render();if(reduced.matches)completeMove();else finishTimer=setTimeout(completeMove,380)}
stage.onkeydown=e=>{if(e.target!==stage)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(e.shiftKey)move(e.key==='ArrowLeft'?-1:1);else spin(mod(current,projects.length),e.key==='ArrowLeft'?-1:1)}};
stage.addEventListener('pointerdown',e=>{suppressClick=false;const a=e.target.closest('.project');gesture={x:e.clientX,y:e.clientY,sequence:a?Number(a.dataset.sequence):null}});
stage.addEventListener('pointerup',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){suppressClick=true;const direction=dx<0?1:-1;if(gesture.sequence===current)spin(mod(current,projects.length),direction);else move(direction)}gesture=null});
stage.addEventListener('pointercancel',()=>gesture=null);addEventListener('resize',()=>{if(!moving){recycle();render()}});fill();render();

// One card every twelve seconds. Only the currently centered project advances.
let hoverSequence=null,lastAutoTime=null;
stage.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const a=e.target.closest('.project');hoverSequence=a?Number(a.dataset.sequence):null});
stage.addEventListener('pointerout',e=>{if(e.pointerType==='touch')return;const a=e.relatedTarget?.closest?.('.project');hoverSequence=a?Number(a.dataset.sequence):null});
stage.addEventListener('pointerleave',()=>{hoverSequence=null});
addEventListener('pointerup',()=>{gesture=null});
addEventListener('pointercancel',()=>{gesture=null});
addEventListener('blur',()=>{hoverSequence=null;gesture=null});
function autoRotate(now){
 const elapsed=lastAutoTime===null?0:Math.min(now-lastAutoTime,50);lastAutoTime=now;
 const running=!reduced.matches&&!document.hidden&&!moving&&!gesture&&hoverSequence!==current;
 for(const [sequence,a] of copies)a.rotor.classList.toggle('auto-rotating',running&&mod(sequence,projects.length)===mod(current,projects.length));
 if(running){const p=projects[mod(current,projects.length)];p.index+=elapsed/12000;const a=copies.get(current);a.rotor.style.setProperty('--rotation',(-p.index*angleStep)+'deg');if(a.dataset.imageState!=='true:'+Math.round(p.index))renderCopy(a,current);updateFocus(a,p.index)}
 requestAnimationFrame(autoRotate);
}
requestAnimationFrame(autoRotate);
