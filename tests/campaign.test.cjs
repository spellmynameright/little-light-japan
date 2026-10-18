const assert=require('node:assert/strict'),E=require('../dist/engine.js');
const s=E.fresh();s.started=true;const milestones=[];
for(let target=0;target<5;target++){
 const begin=s.time;let done=false;
 for(let second=0;second<7200;second++){
  if(E.projectReady(s)){const p=E.claimProject(s);assert.ok(p);assert.equal(E.claimProject(s),false,'no duplicate project reward');}
  E.startProject(s);
  for(let i=0;i<8;i++){if(!s.stations[i].level){if(E.buy(s,i))milestones.push({city:s.city,place:E.ACTIVITIES[i].id,seconds:Math.round(s.time-begin)});}if(s.stations[i].level&&!s.stations[i].auto)E.automate(s,i);}
  const p=E.project(s);const reserve=p&&!s.projectActive&&p.tasks.every(([i])=>s.stations[i].level)?p.cost:0;
  const options=s.stations.map((x,i)=>({i,ratio:E.payout(s,i)/Math.max(1,x.level)/E.duration(s,i)/Math.max(1,E.price(s,i)),cost:E.price(s,i)})).filter(x=>s.stations[x.i].level&&s.stations[x.i].level<100&&s.xp-reserve>x.cost*2).sort((a,b)=>b.ratio-a.ratio);
  if(options[0])E.buy(s,options[0].i);
  for(let i=0;i<2;i++){E.train(s,i);E.appoint(s,i);}
  if(E.ready(s)){assert.equal(s.projects.length,3);assert.ok(s.elders.filter(e=>e.appointed).length>=2);const language=s.jp;assert.ok(E.prestige(s,target===4?-1:target+1));assert.equal(s.jp,language);milestones.push({city:target,handoverSeconds:Math.round(s.time-begin)});done=true;break;}
  E.step(s,1);
 }
 assert.ok(done,'city '+target+' reachable without taps or lesson bonuses');
}
assert.equal(E.complete(s),true);assert.equal(E.gifts(s).length,5);assert.equal(E.ready(s),false);assert.equal(E.prestige(s,-1),false,'ending cannot grant repeated rewards');assert.ok(s.stations[7].level>0,'finished neighborhood preserved');
let project=E.fresh();project.started=true;project.jp=20;project.xp=1000;E.buy(project,1);assert.ok(E.startProject(project));assert.equal(E.startProject(project),false);E.start(project,1);E.step(project,20);const restored=E.hydrate(JSON.parse(JSON.stringify(project)));assert.deepEqual(E.projectProgress(restored),E.projectProgress(project));assert.equal(E.claimProject(restored),false,'incomplete work cannot be claimed');restored.stations[0].auto=true;E.step(restored,300);assert.ok(E.projectReady(restored));assert.ok(E.claimProject(restored));const after=restored.xp;assert.equal(E.claimProject(restored),false);assert.equal(after,restored.xp);
const old=E.fresh();delete old.projects;delete old.projectActive;delete old.situations;old.revision=3;assert.deepEqual(E.hydrate(old).projects,[],'old saves gain campaign without losing progress');
const malformed=structuredClone(restored);malformed.projectActive={index:1,baseline:[-1,Infinity]};assert.equal(E.hydrate(malformed).projectActive,null);
const lesson=E.fresh();lesson.started=true;assert.equal(E.solveSituation(lesson,0,2),false);assert.equal(E.solveSituation(lesson,9,0),false,'locked situation');assert.equal(E.solveSituation(lesson,0,0),true);const learned=lesson.jp;assert.equal(E.solveSituation(lesson,0,0),false);assert.equal(lesson.jp,learned,'no repeated first-answer bonus');
const partner=E.fresh();partner.stations[1].level=1;const normal=E.sideGain(partner,1);partner.stories.sato=4;assert.equal(E.sideGain(partner,1),normal*1.2);
const complete=E.hydrate(JSON.parse(JSON.stringify(s)));assert.ok(E.complete(complete));assert.deepEqual(complete.projects,[0,1,2]);
console.log('PASS: all five cities completed from a fresh save with normal purchases and idle production; projects, gifts, partners, lesson gates, save migration, and the ending verified.');console.log(JSON.stringify({simulatedMinutes:Math.round(s.time/60),handover:milestones.filter(x=>'handoverSeconds'in x)},null,2));
