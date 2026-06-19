const C={
  cm:{n:"CM",r:"mem",f:"h"},jb:{n:"JB",r:"vil",f:"h"},
  sw:{n:"SW",r:"vil",f:"h"},zs:{n:"ZS",r:"vil",f:"h"},
  fh:{n:"FH",r:"pro",f:"g"},yz:{n:"YZ",r:"wit",f:"g"},
  lx:{n:"LX",r:"kni",f:"g"},ss:{n:"SS",r:"mag",f:"g"},
  zy:{n:"ZY",r:"wk",f:"w"},gy:{n:"GY",r:"mw",f:"w"},
  tx:{n:"TX",r:"hw",f:"w"},zm:{n:"ZM",r:"w",f:"w"}
};
const W=["zy","gy","tx","zm"];
function p(a){return a[Math.floor(Math.random()*a.length)]}
function rm(a,i){return a.filter(x=>x!==i)}
function gs(){return {a:Object.keys(C),dd:[],wu:0,wr:0,kd:0,kl:0,kt:null,ms:[],pc:{},gs:null,zr:false};}
function wv(g){const aw=W.filter(w=>g.a.includes(w));if(!aw.length)return null;const vo={};
aw.forEach(w=>{const tg=g.a.filter(i=>!W.includes(i));if(!tg.length)return;const sc={};
tg.forEach(t=>{let s=25+Math.random()*30;
if(w==="zy"){if(t==="lx")s+=25;}
if(w==="gy"){s+=Math.random()*25;}
if(w==="tx"){if(t==="cm")s-=80;if(t==="lx")s-=50;if(t==="sw")s+=40;if(t==="zs"||t==="jb")s+=5;}
if(w==="zm"){if(t==="zs")s+=35;if(t==="cm"||t==="sw")s+=10;}
sc[t]=s;});vo[w]=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0][0];});
const tl={};aw.forEach(w=>{const t=vo[w];tl[t]=(tl[t]||0)+1;});
const ents=Object.entries(tl).sort((a,b)=>b[1]-a[1]);
if(ents[0][1]>=2)return{target:ents[0][0],tl,detail:vo,mode:"CONS"};
return{target:ents[0][0],tl,detail:vo,mode:"PLUR"};}
function wa(g,wt){const t=g.wu+g.wr;if(t>=3)return{};if(Math.random()<0.6&&g.wr<3)return{a:"r",t:wt};if(Math.random()<0.08&&g.wu<3){const c=g.a.filter(i=>i!=="yz"&&!W.includes(i));if(c.length)return{a:"c",t:p(c)};}return{};}
function pr(g){const o=g.a.filter(i=>i!=="fh");if(!o.length)return null;const uc=o.filter(i=>!g.pc[i]);const t=uc.length?p(uc):p(o);const ch=C[t];g.pc[t]=ch.r==="hw"?"a":(ch.f==="w"?"e":"a");return{t,r:g.pc[t]};}
function kn(g){if(g.kd>0)return{a:"r"};const su=g.a.filter(i=>!W.includes(i)&&i!=="lx");if(!su.length)return{a:"n"};if(Math.random()<0.13){let t;if(g.a.includes("tx")&&Math.random()<0.35){const nc=su.filter(s=>s!=="cm"&&s!=="lx");t=nc.length?p(nc):p(su);}else t=p(su);return{a:"d",t,s:C[t].f==="w"};}if(Math.random()<0.3){const ts=g.a.filter(i=>i!=="lx"&&!W.includes(i));if(ts.length){const wk=ts.filter(t=>t==="yz"||t==="cm"||t==="sw");return{a:"g",t:wk.length?p(wk):p(ts)};}}return{a:"n"};}
function mg(g){const o=g.a.filter(i=>i!=="ss");if(o.length<2)return{a:"n"};const b=g.ms||[];const e=o.filter(i=>!b.includes(i));if(e.length<2)return{a:"n"};const sh=[...e].sort(()=>Math.random()-0.5);return{a:"s",p:[sh[0],sh[1]]};}
function fj(g,d){if(!g.a.includes("tx")||d<2)return null;if(Math.random()<0.18){const t=p(g.a.filter(i=>i!=="tx"&&i!=="cm"));return{t,c:"e"};}return null;}
const EV=["drawer","food","window","footprints","crying","lantern","papers"];
function sim(sd){let s=sd;function rn(){s=(s*16807)%2147483647;return(s-1)/2147483646;}const g=gs();const lg=[];
for(let d=1;d<=7;d++){const dl=[];
if(d>1&&Math.random()<0.5)dl.push("[E]"+p(EV));
const j=fj(g,d);if(j)dl.push("[HJ]TX->"+C[j.t].n);
const k=kn(g);if(k.a==="d"){if(k.s){dl.push("[KT]LXk"+C[k.t].n+"(w)");g.a=rm(g.a,k.t);g.dd.push(k.t);g.kd=2;}else{dl.push("[KT]LXk"+C[k.t].n+"(g)");g.a=rm(g.a,k.t);g.dd.push(k.t);g.kd=3;}}else if(k.a==="g"){g.kl=true;g.kt=k.t;dl.push("[GD]LXg"+C[k.t].n);}else{if(g.kd>0){g.kd--;if(g.kd>0)dl.push("[KT]r"+g.kd);}g.kl=false;}
const p2=pr(g);if(p2)dl.push("[PR]FHc"+C[p2.t].n+":"+(p2.r==="a"?"A":"E"));
const m2=mg(g);if(m2.a==="s"){g.ms=[...m2.p];dl.push("[MG]SSs"+C[m2.p[0]].n+"x"+C[m2.p[1]].n);}
lg.push("D"+d);dl.forEach(e=>lg.push(" "+e));
const nl=["N"+d];const w=wv(g);if(!w){lg.push(" wdead");lg.push("");break;}
let at=w.target;const sp=g.ms||[];if(sp.length===2&&g.a.includes("ss")){if(sp.includes(w.target)&&rn()<0.5){const o=sp.find(i=>i!==w.target);at=o;nl.push("[MG]wc->"+C[o].n);}}g.ms=[];
Object.entries(w.detail).forEach(([k,v])=>{nl.push("[W]"+C[k].n+"->"+C[v].n);});
nl.push("[V]"+w.mode+" "+C[w.target].n);
let gd=false;if(g.kt&&g.kl){gd=g.kt===at;g.kt=null;}
const wx=wa(g,at);let sv=false;
if(wx.a==="r"){if(gd){nl.push("[W+G]c,"+C[at].n+"d");g.wr++;}else{nl.push("[W]YZs"+C[at].n);g.wr++;sv=true;}}else if(wx.a==="c"){nl.push("[W]YZc"+C[wx.t].n);g.wu++;}
if(!sv&&!gd){const ch=C[at];g.a=rm(g.a,at);g.dd.push(at);nl.push("[X]"+ch.n);
if(ch.r==="wk"&&!g.zr){g.zr=true;const ow=W.filter(w=>w!==at&&g.a.includes(w));if(ow.length){const tk=p(ow);g.a=rm(g.a,tk);g.dd.push(tk);nl.push("[WK]ZYt"+C[tk].n);}}
if(g.a.includes("gy")&&!g.gs){const rr=C[at].r;if(["pro","wit","kni","mag"].includes(rr)){g.gs=rr;nl.push("[MW]GYs"+ch.n+":"+rr);}}}
if(g.a.includes("zm"))nl.push("[CL]ZMCc");
const tu=g.wu+g.wr;if(tu>0)nl.push("[W]"+tu+"/3");
nl.forEach(e=>lg.push(" "+e));lg.push("");
const ah=g.a.filter(i=>!W.includes(i)).length;const aw=g.a.filter(i=>W.includes(i)).length;
if(d>=7)return{o:ah>0?"DAY7":"WIPE",ds:7,dd:g.dd,a:g.a,l:lg};
if(ah<=1)return{o:"NEAR_WIPE",ds:d,dd:g.dd,a:g.a,l:lg};
}return{o:"TO",ds:7,dd:g.dd,a:g.a,l:lg};}
const R=[];for(let i=0;i<20;i++)R.push(sim(i+1));
const S={d7:0,nw:0,ad:0,fh:0,yz:0,lx:0,ss:0,cm:0,sw:0,jb:0,zs:0,total:0};
R.forEach(r=>{S[r.o]++;S.ad+=r.ds;
if(r.dd.includes("fh"))S.fh++;if(r.dd.includes("yz"))S.yz++;if(r.dd.includes("lx"))S.lx++;if(r.dd.includes("ss"))S.ss++;
if(r.dd.includes("cm"))S.cm++;if(r.dd.includes("sw"))S.sw++;if(r.dd.includes("jb"))S.jb++;if(r.dd.includes("zs"))S.zs++;
S.total+=r.dd.length;});S.ad=(S.ad/20).toFixed(1);S.avgd=(S.total/20).toFixed(1);
console.log("=== ESN v4 20 rounds ===");
console.log("DAY7:"+S.d7+" NEAR_WIPE:"+S.nw);
console.log("Avg:"+S.ad+"d AvgDeaths:"+S.avgd+"/12");
console.log("");
console.log("Deaths:");
console.log(" FH:"+S.fh+" YZ:"+S.yz+" LX:"+S.lx+" SS:"+S.ss);
console.log(" CM:"+S.cm+" SW:"+S.sw+" JB:"+S.jb+" ZS:"+S.zs);
console.log("");
for(let i=0;i<20;i++){const r=R[i];
console.log("R"+(i+1)+"|"+r.o+"|d"+r.ds+"|A:"+r.a.length+" D:"+r.dd.length);
console.log("A:["+r.a.map(id=>C[id].n).join()+" D:["+r.dd.map(id=>C[id].n).join()+"]");
r.l.forEach(l=>console.log(l));
console.log("");}