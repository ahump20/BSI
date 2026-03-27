(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();(function(){const s=document.createElement("link").relList;if(!(s&&s.supports&&s.supports("modulepreload"))){for(const t of document.querySelectorAll('link[rel="modulepreload"]'))e(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&e(i)}).observe(document,{childList:!0,subtree:!0})}function e(t){if(t.ep)return;t.ep=!0;const n=(function(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r})(t);fetch(t.href,n)}})();const En=Object.freeze({BOOT:"boot",HOME:"home",IDENTITY:"identity",MODE_SELECT:"mode-select",DIFFICULTY_SELECT:"difficulty-select",TEAM_SELECT:"team-select",PREGAME:"pregame",PITCH_READY:"pitch-ready",PITCH_FLIGHT:"pitch-flight",CONTACT_RESOLVE:"contact-resolve",BALL_IN_PLAY:"ball-in-play",PLATE_RESULT:"plate-result",INNING_BREAK:"inning-break",PAUSED:"paused",GAME_OVER:"game-over"}),yh=Object.freeze({easy:Object.freeze({key:"easy",readyDelayMs:1450,timingWindowMs:105,contactRadiusMultiplier:1.2,breakScaleMultiplier:.88,pitchSpeedMultiplier:.94}),medium:Object.freeze({key:"medium",readyDelayMs:1200,timingWindowMs:85,contactRadiusMultiplier:1,breakScaleMultiplier:1,pitchSpeedMultiplier:1}),hard:Object.freeze({key:"hard",readyDelayMs:950,timingWindowMs:68,contactRadiusMultiplier:.85,breakScaleMultiplier:1.14,pitchSpeedMultiplier:1.06})}),_i=Object.freeze({id:"sandlot",name:"Sandlot Sluggers",abbreviation:"SLG",conference:"Sandlot League",logoUrl:"",primaryColor:"#BF5700",secondaryColor:"#FFD700"}),kc=Object.freeze({contactRating:56,powerRating:58,disciplineRating:55,speedRating:52,pitchingRating:55}),af=["Jet Ramirez","Mason Cole","Cruz Dalton","Ty Walker","Rhett Bishop","Owen Vega","Jace Mercer","Noah Lane","Brooks Harper"],of=["CF","SS","LF","1B","RF","3B","C","2B","DH"],lf=Object.freeze({practice:"practice",quickPlay:"quick-play",hrDerby:"hr-derby",teamMode:"team-mode"});function yn(s,e,t){return Math.max(e,Math.min(t,s))}function oi(s,e,t,n,i){if(t===e)return n;const r=yn((s-e)/(t-e),0,1);return n+r*(i-n)}function bh(s,e,t,n,i){if(e===t)return n;const r=yn((e-s)/(e-t),0,1);return n+r*(i-n)}function bd(s){return yh[s]??yh.medium}function cf(s){return lf[s]??"quick-play"}function br(s=Date.now()){return Number(s)>>>0||1}function hf(s){let e=br(s);return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Dt(s,e=0){const t=Number(s);return Number.isFinite(t)?t:e}function uf(s=""){const e=String(s).toUpperCase();return e==="P"||e==="RHP"||e==="LHP"}function df(s,e){const t=s?.team??s??{};return{id:String(t.id??e??_i.id),name:t.name??_i.name,abbreviation:t.abbreviation??t.abbr??_i.abbreviation,conference:t.conference??t.conf??_i.conference,logoUrl:t.logo??t.logoUrl??_i.logoUrl,primaryColor:t.colors?.primary??t.primaryColor??t.color??_i.primaryColor,secondaryColor:t.colors?.secondary??t.secondaryColor??t.altColor??_i.secondaryColor}}function pf(s){const e=s?.team??s??{};return s?.roster??e.roster??s?.players??[]}function ff(s){return(s?.team??s??{}).stats??s?.stats??{}}function mf(s){const e=s?.stats??s??{};return{avg:Dt(e.avg??e.battingAvg,.25),obp:Dt(e.obp,.32),slg:Dt(e.slg,.42),ops:Dt(e.ops,.74),hr:Dt(e.hr??e.homeRuns,0),bb:Dt(e.bb??e.walks,0),k:Dt(e.k??e.so??e.strikeouts,0),sb:Dt(e.sb??e.stolenBases,0),ab:Dt(e.ab??e.atBats,0),gp:Dt(e.gp??e.gamesPlayed??e.games,1),rbi:Dt(e.rbi,0)}}function Md(s){const e=yn(s.bb/Math.max(s.k,1),0,1),t=.7*(s.obp-s.avg)+.3*e,n=s.gp>0?s.sb/s.gp:0;return{contactRating:Math.round(oi(s.avg,.22,.34,35,90)),powerRating:Math.round(oi(s.slg,.32,.62,35,90)),disciplineRating:Math.round(oi(t,.05,.18,35,90)),speedRating:Math.round(oi(n,0,1.2,40,90))}}function Sd(s){const e={avg:.252+s*.004,obp:.325+s*.004,slg:.42+s*.012,ops:.745+s*.012,hr:s<3?1:0,bb:6+s%3,k:10+s,sb:s%4,ab:28,gp:8,rbi:5+s};return{id:`sandlot-${s+1}`,name:af[s]??`Sandlot ${s+1}`,position:of[s]??"UT",number:String(s+1),stats:e,gameplay:Md(e)}}function gf(s){const e=[],t=new Set,n=(i,r)=>{for(const a of i)if(!t.has(a.id)&&(e.push(a),t.add(a.id),e.length>=r))break};for(n([...s].sort((i,r)=>r.stats.obp-i.stats.obp||r.stats.avg-i.stats.avg),2),n([...s].sort((i,r)=>r.stats.ops-i.stats.ops||r.stats.slg-i.stats.slg),4),n([...s].sort((i,r)=>r.stats.slg-i.stats.slg||r.stats.hr-i.stats.hr),6),n([...s].sort((i,r)=>{const a=i.gameplay?.speedRating??50,o=r.gameplay?.speedRating??50;return r.stats.avg-i.stats.avg||o-a}),9);e.length<9;)e.push(Sd(e.length));return e.slice(0,9)}function cc(s){return s>=70?{pitchMixProfile:["Fastball","Slider","Curve","Change-up"],pitchSpeedBand:{min:88,max:95},pitchWeights:[34,18,20,20,8],speedMultiplier:1.08,movementMultiplier:1.18,zoneBias:"edge"}:s>=50?{pitchMixProfile:["Fastball","Slider","Change-up"],pitchSpeedBand:{min:86,max:91},pitchWeights:[40,8,24,20,8],speedMultiplier:1,movementMultiplier:1.04,zoneBias:"balanced"}:{pitchMixProfile:["Fastball","Change-up"],pitchSpeedBand:{min:84,max:88},pitchWeights:[56,4,10,24,6],speedMultiplier:.94,movementMultiplier:.92,zoneBias:"middle"}}function wd(s){const e=Dt(s.wins,1),t=Dt(s.losses,0),n=Math.max(e+t,1),i=Dt(s.era,4.8),r=Dt(s.runsAllowed,5.5*n)/n;return Math.round(.7*bh(i,7,2.5,35,90)+.3*bh(r,9,3,35,90))}function vf(s){const e=Dt(s.wins,1),t=Dt(s.losses,0),n=Math.max(e+t,1),i=Dt(s.battingAvg,.255),r=Dt(s.runsScored,5.2*n)/n;return{contactRating:Math.round(oi(i,.22,.34,35,90)),powerRating:Math.round(oi(r,3,10,35,90)),disciplineRating:55,speedRating:50,pitchingRating:wd(s)}}function xf(s){const e=s.reduce((l,c)=>{const h=Math.max(c.stats.ab,1);return l.weight+=h,l.avg+=c.stats.avg*h,l.obp+=c.stats.obp*h,l.slg+=c.stats.slg*h,l.ops+=c.stats.ops*h,l.bbToK+=yn(c.stats.bb/Math.max(c.stats.k,1),0,1)*h,l.sbPerGame+=(c.stats.gp>0?c.stats.sb/c.stats.gp:0)*h,l},{weight:0,avg:0,obp:0,slg:0,ops:0,bbToK:0,sbPerGame:0}),t=Math.max(e.weight,1),n=e.avg/t,i=e.obp/t,r=e.slg/t,a=e.sbPerGame/t,o=.7*(i-n)+.3*(e.bbToK/t);return{contactRating:Math.round(oi(n,.22,.34,35,90)),powerRating:Math.round(oi(r,.32,.62,35,90)),disciplineRating:Math.round(oi(o,.05,.18,35,90)),speedRating:Math.round(oi(a,0,1.2,40,90))}}function jn(s={}){const e={..._i,...s,id:String(s.id??_i.id)},t=Array.from({length:9},(r,a)=>Sd(a)),n={...kc},i={pitchingRating:n.pitchingRating,...cc(n.pitchingRating)};return{team:e,batters:t,source:"fallback",contactRating:n.contactRating,powerRating:n.powerRating,disciplineRating:n.disciplineRating,speedRating:n.speedRating,pitchingRating:n.pitchingRating,pitchMixProfile:i.pitchMixProfile,pitchSpeedBand:i.pitchSpeedBand,pitchWeights:i.pitchWeights,pitcher:i,targetOffenseRating:Math.round(.4*n.contactRating+.3*n.powerRating+.2*n.disciplineRating+.1*n.speedRating)}}function _f(s,e){const t=df(s,e),n=pf(s),i=ff(s),r=n.filter(u=>!uf(u.position)).map((u,d)=>{const p=mf(u);return{id:String(u.id??`${t.id}-player-${d}`),name:u.name??`Player ${d+1}`,position:u.position??"UT",number:String(u.number??u.jersey??d+1),stats:p,gameplay:Md(p)}});let a=r.filter(u=>u.stats.ab>=10);if(a.length<9&&(a=r.filter(u=>u.stats.ab>0)),a.length<5){const u=jn(t),d=vf(i),p={pitchingRating:d.pitchingRating,...cc(d.pitchingRating)};return{...u,team:t,source:"fallback-team-stats",contactRating:d.contactRating,powerRating:d.powerRating,disciplineRating:d.disciplineRating,speedRating:d.speedRating,pitchingRating:d.pitchingRating,pitchMixProfile:p.pitchMixProfile,pitchSpeedBand:p.pitchSpeedBand,pitchWeights:p.pitchWeights,pitcher:p,targetOffenseRating:Math.round(.4*d.contactRating+.3*d.powerRating+.2*d.disciplineRating+.1*d.speedRating)}}const o=gf(a),l=xf(o),c=wd(i),h={pitchingRating:c,...cc(c)};return{team:t,batters:o,source:"api",contactRating:l.contactRating,powerRating:l.powerRating,disciplineRating:l.disciplineRating,speedRating:l.speedRating,pitchingRating:c,pitchMixProfile:h.pitchMixProfile,pitchSpeedBand:h.pitchSpeedBand,pitchWeights:h.pitchWeights,pitcher:h,targetOffenseRating:Math.round(.4*l.contactRating+.3*l.powerRating+.2*l.disciplineRating+.1*l.speedRating)}}function yf({mode:s,teamId:e=null,opponentTeamId:t=null,difficulty:n="medium",sessionSeed:i=br(),targetRuns:r=s==="quickPlay"||s==="teamMode"?4:null}){return{mode:s,inning:1,halfInning:"bottom",outs:0,strikes:0,balls:0,bases:[!1,!1,!1],stats:{runs:0,hits:0,homeRuns:0,atBats:0,pitchCount:0,strikeouts:0,walks:0,currentStreak:0,longestStreak:0,derbyOuts:0,rbis:0,perfectContacts:0,solidContacts:0,totalHomeRunDistance:0,bonusSwingsEarned:0},maxInnings:s==="quickPlay"||s==="teamMode"?3:Number.POSITIVE_INFINITY,maxDerbyOuts:10,teamId:e,opponentTeamId:t,targetRuns:r,suddenDeath:!1,result:null,difficulty:n,sessionSeed:i}}function Mh(s,e){const t=s.outs+e;if(t<3)return{...s,outs:t,strikes:0,balls:0};let n={...s,inning:s.inning+1,outs:0,strikes:0,balls:0,bases:[!1,!1,!1]};if(s.mode==="quickPlay"||s.mode==="teamMode"){const i=!s.suddenDeath&&s.inning>=s.maxInnings,r=s.suddenDeath&&s.inning>=s.maxInnings+1;i?s.stats.runs>(s.targetRuns??0)?n={...n,result:"win"}:s.stats.runs===(s.targetRuns??0)?n={...n,suddenDeath:!0,targetRuns:(s.targetRuns??0)+1}:n={...n,result:"loss"}:r&&(n={...n,result:s.stats.runs>(s.targetRuns??0)?"win":"loss"})}return n}function bf(s){const e=[...s];let t=0;return e[0]&&e[1]&&e[2]&&(t+=1),e[0]&&e[1]&&(e[2]=!0),e[0]&&(e[1]=!0),e[0]=!0,{bases:e,runs:t}}function Mf(s,e,t){const[n,i,r]=s;if(e==="homeRun")return{bases:[!1,!1,!1],runs:Number(n)+Number(i)+Number(r)+1};if(e==="triple")return{bases:[!1,!1,!0],runs:Number(n)+Number(i)+Number(r)};if(e==="double"){let l=Number(i)+Number(r);const c=[!1,!0,!1];return n&&(t==="solid"||t==="perfect"?l+=1:c[2]=!0),{bases:c,runs:l}}let a=Number(r);const o=[!0,!1,!1];return i&&(t==="solid"||t==="perfect"?a+=1:o[2]=!0),n&&(t==="perfect"?a+=1:o[t==="solid"?2:1]=!0),{bases:o,runs:a}}function Fr(s,e){let t={...s,bases:[...s.bases],stats:{...s.stats},strikes:0,balls:0};if(e.type==="walk"){const i=bf(t.bases);return t.bases=i.bases,t.stats.walks+=1,t.stats.runs+=i.runs,t.stats.rbis+=i.runs,t}if(e.type==="strikeout")return t.stats.atBats+=1,t.stats.strikeouts+=1,t.stats.currentStreak=0,Mh(t,1);if(e.type==="out"||e.type==="doublePlay"||e.type==="sacFly")return e.type!=="sacFly"&&(t.stats.atBats+=1),t.stats.currentStreak=0,e.type==="sacFly"&&(t.stats.runs+=1,t.stats.rbis+=1,t.bases[2]=!1),e.type==="doublePlay"&&(t.bases[0]=!1),Mh(t,e.type==="doublePlay"?2:1);const n=Mf(t.bases,e.type,e.contactTier);return t.bases=n.bases,t.stats.runs+=n.runs,t.stats.rbis+=n.runs,t.stats.hits+=1,t.stats.atBats+=1,t.stats.currentStreak+=1,t.stats.longestStreak=Math.max(t.stats.longestStreak,t.stats.currentStreak),e.contactTier==="perfect"&&(t.stats.perfectContacts+=1),e.contactTier==="solid"&&(t.stats.solidContacts+=1),e.type==="homeRun"&&(t.stats.homeRuns+=1,t.stats.totalHomeRunDistance+=Math.round(e.distanceFt??0)),t}function Br(s,e){let t={...s,stats:{...s.stats},strikes:0,balls:0};return e.type==="homeRun"?(t.stats.homeRuns+=1,t.stats.runs+=1,t.stats.hits+=1,t.stats.atBats+=1,t.stats.currentStreak+=1,t.stats.longestStreak=Math.max(t.stats.longestStreak,t.stats.currentStreak),t.stats.rbis+=1,t.stats.totalHomeRunDistance+=Math.round(e.distanceFt??0),e.contactTier==="perfect"&&(t.stats.perfectContacts+=1),e.contactTier==="solid"&&(t.stats.solidContacts+=1),(e.distanceFt??0)>=430&&t.stats.bonusSwingsEarned<4&&(t.stats.bonusSwingsEarned+=1,t.maxDerbyOuts+=1),t):(e.type==="foul"||(t.stats.derbyOuts+=1,t.stats.atBats+=1,t.stats.currentStreak=0),t)}function Sf(s){return s.mode==="hrDerby"?s.stats.derbyOuts>=s.maxDerbyOuts:s.mode==="quickPlay"||s.mode==="teamMode"?s.result==="win"||s.result==="loss":!1}function wf({playerPrevention:s=kc.pitchingRating,opponentOffense:e=60,difficulty:t="medium",seed:n=1}){const i=t==="easy"?-.4:t==="hard"?.5:0,r=[-1,0,1][Math.abs(br(n))%3];return yn(Math.round(2+(e-s)/18+i+r),2,10)}function Tf({swingTimeMs:s,strikeTimeMs:e,contactPoint:t,zoneCenter:n={x:0,z:.8},isInZone:i,hitterRatings:r=kc,pitchSpeedMph:a=88,difficulty:o="medium"}){const l=bd(o),c=s-e,h=Dt(t?.x,0)-Dt(n?.x,0),u=Dt(t?.z,.8)-Dt(n?.z,.8),d=Math.sqrt(h*h+u*u),p=.19*l.contactRadiusMultiplier,f=yn(1-Math.abs(c)/l.timingWindowMs,0,1),g=yn(1-d/p,0,1);let m=0;i||(m=d<=p*1.25?.12:.25);const _=Math.abs(c)>l.timingWindowMs*1.7||d>p*1.9,x=yn(100*(.6*f+.25*g+.1*((r.contactRating??55)/100)+.05*((r.disciplineRating??55)/100)-m),0,100),v=Math.abs(c)>l.timingWindowMs*.78||!i&&m>0;let y="weak";_||x<35?y="whiff":v&&x<78?y="foul":x>=92?y="perfect":x>=58?y="solid":y="weak";const I=yn(c/l.timingWindowMs,-1.5,1.5),S=18+yn(u/.3,-1.2,1.2)*12,w=y==="perfect"?6:y==="solid"?2:y==="weak"?-4:-10,L=yn(S+I*10+w,-12,55),b=yn(I*18+h*52,-38,38),C=yn(45+a*.35+(r.powerRating??55)*.35+(x-50)*.45,40,112),U=Math.round(yn(C*(2.2+Math.max(L,0)/32)+(y==="perfect"?28:y==="solid"?12:0),45,470)),A=Math.abs(c)<=l.timingWindowMs*.35?"On Time":c<0?"Early":"Late";return{tier:y,timingDeltaMs:c,timingLabel:A,timingWindowMs:l.timingWindowMs,contactPointDistance:d,contactRadius:p,contactQuality:x,chasePenalty:m,timingScore:f,zoneScore:g,exitVelocityMph:C,launchAngleDeg:L,sprayAngleDeg:b,distanceFt:U,isFairBall:y!=="foul"&&y!=="whiff",homeRunThreat:U>=390&&L>=18&&L<=42&&y!=="weak"}}function Af(s){switch(s){case"perfect":return"perfect";case"solid":return"good";case"foul":return"foul";case"whiff":return"whiff";default:return"weak"}}function Ef(s,e,t){const n=hf(t);return e.tier==="perfect"?e.homeRunThreat?{type:"homeRun",contactTier:e.tier,distanceFt:e.distanceFt}:e.distanceFt>=335&&n()<.22?{type:"triple",contactTier:e.tier,distanceFt:e.distanceFt}:e.distanceFt>=250||e.exitVelocityMph>=95?{type:"double",contactTier:e.tier,distanceFt:e.distanceFt}:{type:"single",contactTier:e.tier,distanceFt:e.distanceFt}:e.tier==="solid"?e.homeRunThreat&&n()<.16?{type:"homeRun",contactTier:e.tier,distanceFt:e.distanceFt}:s.bases[2]&&s.outs<2&&e.launchAngleDeg>=24&&e.distanceFt>=180?{type:"sacFly",contactTier:e.tier,distanceFt:e.distanceFt}:e.launchAngleDeg>48&&e.distanceFt<215&&n()<.7?{type:"out",contactTier:e.tier,distanceFt:e.distanceFt}:e.distanceFt>=315&&n()<.12?{type:"triple",contactTier:e.tier,distanceFt:e.distanceFt}:e.distanceFt>=235||e.exitVelocityMph>=88?{type:n()<.48?"double":"single",contactTier:e.tier,distanceFt:e.distanceFt}:{type:n()<.32?"out":"single",contactTier:e.tier,distanceFt:e.distanceFt}:s.bases[0]&&s.outs<2&&e.launchAngleDeg<10&&e.exitVelocityMph<85&&n()<.18?{type:"doublePlay",contactTier:e.tier,distanceFt:e.distanceFt}:{type:n()<.78?"out":"single",contactTier:e.tier,distanceFt:e.distanceFt}}function Rf(s){if(s.mode==="hrDerby"){const i=12*s.stats.homeRuns+Math.floor(s.stats.totalHomeRunDistance/40)+3*s.stats.perfectContacts,r=s.difficulty==="easy"?.9:s.difficulty==="hard"?1.15:1;return Math.min(Math.floor(i*r),200)}const e=20*s.stats.runs+6*s.stats.rbis+4*s.stats.hits+2*s.stats.walks+4*s.stats.perfectContacts+2*s.stats.solidContacts-s.stats.strikeouts,t=s.difficulty==="easy"?.9:s.difficulty==="hard"?1.15:1,n=s.mode==="teamMode"?1.1:1;return Math.min(Math.floor(e*t*n),200)}function Cf({finalScore:s,win:e,currentDailyStreak:t=0,mode:n}){if(n==="practice")return 0;const i=Math.min(t,5);return Math.max(5,Math.floor(s/12))+(e?5:0)+i}function Pf(s,e={}){return{mode:cf(s.mode),difficulty:s.difficulty??"medium",teamId:s.teamId??null,opponentTeamId:s.opponentTeamId??null,scoreVersion:2,result:s.result??null,targetRuns:s.targetRuns??null,durationSeconds:e.durationSeconds??null,coinsEarned:e.coinsEarned??0,sessionSeed:s.sessionSeed}}const hc="160",Lf=2,Td=0,uc=1,ti=2,If=0,Nf=1,Xn=2,ls=100,Df=101,Uf=102,Of=200,Ff=201,Bf=202,kf=203,zf=204,Vf=205,Hf=206,Gf=207,Wf=208,Xf=209,qf=210,jf=211,$f=212,Yf=213,Kf=214,Zf=4,Sh="attached",cr=301,hr=302,Xo=306,On=1e3,bi=1001,Io=1002,on=1003,dc=1004,wo=1005,Bn=1006,Ad=1007,ur=1008,ir=1009,zc=1012,Ed=1013,Wi=1014,$i=1015,wi=1016,cs=1020,li=1023,hs=1026,dr=1027,ml=33776,gl=33777,vl=33778,xl=33779,_l=36492,da=2300,pr=2301,yl=2302,Jf=0,Rd=1,pc=2,us=3001,si="",Ut="srgb",en="srgb-linear",Vc="display-p3",qo="display-p3-linear",No="linear",Ct="srgb",Do="rec709",Uo="p3",Ts=7680,Qf=512,em=513,tm=514,nm=515,im=516,sm=517,rm=518,am=519,fc=35044,wh="300 es",mc=1035,fr=2e3,Oo=2001;class Mr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const n=this._listeners[e];if(n!==void 0){const i=n.indexOf(t);i!==-1&&n.splice(i,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const t=this._listeners[e.type];if(t!==void 0){e.target=this;const n=t.slice(0);for(let i=0,r=n.length;i<r;i++)n[i].call(this,e);e.target=null}}}const sn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Th=1234567;const sr=Math.PI/180,mr=180/Math.PI;function zn(){const s=4294967295*Math.random()|0,e=4294967295*Math.random()|0,t=4294967295*Math.random()|0,n=4294967295*Math.random()|0;return(sn[255&s]+sn[s>>8&255]+sn[s>>16&255]+sn[s>>24&255]+"-"+sn[255&e]+sn[e>>8&255]+"-"+sn[e>>16&15|64]+sn[e>>24&255]+"-"+sn[63&t|128]+sn[t>>8&255]+"-"+sn[t>>16&255]+sn[t>>24&255]+sn[255&n]+sn[n>>8&255]+sn[n>>16&255]+sn[n>>24&255]).toLowerCase()}function Zt(s,e,t){return Math.max(e,Math.min(t,s))}function gc(s,e){return(s%e+e)%e}function aa(s,e,t){return(1-t)*s+t*e}function vc(s){return!(s&s-1)&&s!==0}function Fo(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function ri(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function St(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(4294967295*s);case Uint16Array:return Math.round(65535*s);case Uint8Array:return Math.round(255*s);case Int32Array:return Math.round(2147483647*s);case Int16Array:return Math.round(32767*s);case Int8Array:return Math.round(127*s);default:throw new Error("Invalid component type.")}}const om={DEG2RAD:sr,RAD2DEG:mr,generateUUID:zn,clamp:Zt,euclideanModulo:gc,mapLinear:function(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)},inverseLerp:function(s,e,t){return s!==e?(t-s)/(e-s):0},lerp:aa,damp:function(s,e,t,n){return aa(s,e,1-Math.exp(-t*n))},pingpong:function(s,e=1){return e-Math.abs(gc(s,2*e)-e)},smoothstep:function(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e))*s*(3-2*s)},smootherstep:function(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e))*s*s*(s*(6*s-15)+10)},randInt:function(s,e){return s+Math.floor(Math.random()*(e-s+1))},randFloat:function(s,e){return s+Math.random()*(e-s)},randFloatSpread:function(s){return s*(.5-Math.random())},seededRandom:function(s){s!==void 0&&(Th=s);let e=Th+=1831565813;return e=Math.imul(e^e>>>15,1|e),e^=e+Math.imul(e^e>>>7,61|e),((e^e>>>14)>>>0)/4294967296},degToRad:function(s){return s*sr},radToDeg:function(s){return s*mr},isPowerOfTwo:vc,ceilPowerOfTwo:function(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))},floorPowerOfTwo:Fo,setQuaternionFromProperEuler:function(s,e,t,n,i){const r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),p=r((n-e)/2),f=a((n-e)/2);switch(i){case"XYX":s.set(o*h,l*u,l*d,o*c);break;case"YZY":s.set(l*d,o*h,l*u,o*c);break;case"ZXZ":s.set(l*u,l*d,o*h,o*c);break;case"XZX":s.set(o*h,l*f,l*p,o*c);break;case"YXY":s.set(l*p,o*h,l*f,o*c);break;case"ZYZ":s.set(l*f,l*p,o*h,o*c)}},normalize:St,denormalize:ri};let xe=class Cd{constructor(e=0,t=0){Cd.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Zt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*i+e.x,this.y=r*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},lt=class Pd{constructor(e,t,n,i,r,a,o,l,c){Pd.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c)}set(e,t,n,i,r,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=i,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],p=n[5],f=n[8],g=i[0],m=i[3],_=i[6],x=i[1],v=i[4],y=i[7],I=i[2],S=i[5],w=i[8];return r[0]=a*g+o*x+l*I,r[3]=a*m+o*v+l*S,r[6]=a*_+o*y+l*w,r[1]=c*g+h*x+u*I,r[4]=c*m+h*v+u*S,r[7]=c*_+h*y+u*w,r[2]=d*g+p*x+f*I,r[5]=d*m+p*v+f*S,r[8]=d*_+p*y+f*w,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,p=c*r-a*l,f=t*u+n*d+i*p;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);const g=1/f;return e[0]=u*g,e[1]=(i*c-h*n)*g,e[2]=(o*n-i*a)*g,e[3]=d*g,e[4]=(h*t-i*l)*g,e[5]=(i*r-o*t)*g,e[6]=p*g,e[7]=(n*l-c*t)*g,e[8]=(a*t-n*r)*g,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(bl.makeScale(e,t)),this}rotate(e){return this.premultiply(bl.makeRotation(-e)),this}translate(e,t){return this.premultiply(bl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};const bl=new lt;function Ld(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function pa(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function lm(){const s=pa("canvas");return s.style.display="block",s}const Ah={};function oa(s){s in Ah||(Ah[s]=!0)}const Eh=new lt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Rh=new lt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ia={[en]:{transfer:No,primaries:Do,toReference:s=>s,fromReference:s=>s},[Ut]:{transfer:Ct,primaries:Do,toReference:s=>s.convertSRGBToLinear(),fromReference:s=>s.convertLinearToSRGB()},[qo]:{transfer:No,primaries:Uo,toReference:s=>s.applyMatrix3(Rh),fromReference:s=>s.applyMatrix3(Eh)},[Vc]:{transfer:Ct,primaries:Uo,toReference:s=>s.convertSRGBToLinear().applyMatrix3(Rh),fromReference:s=>s.applyMatrix3(Eh).convertLinearToSRGB()}},cm=new Set([en,qo]),_t={enabled:!0,_workingColorSpace:en,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(s){if(!cm.has(s))throw new Error(`Unsupported working color space, "${s}".`);this._workingColorSpace=s},convert:function(s,e,t){if(this.enabled===!1||e===t||!e||!t)return s;const n=Ia[e].toReference;return(0,Ia[t].fromReference)(n(s))},fromWorkingColorSpace:function(s,e){return this.convert(s,this._workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this._workingColorSpace)},getPrimaries:function(s){return Ia[s].primaries},getTransfer:function(s){return s===si?No:Ia[s].transfer}};function rr(s){return s<.04045?.0773993808*s:Math.pow(.9478672986*s+.0521327014,2.4)}function Ml(s){return s<.0031308?12.92*s:1.055*Math.pow(s,.41666)-.055}let As,Id=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{As===void 0&&(As=pa("canvas")),As.width=e.width,As.height=e.height;const n=As.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=As}return t.width>2048||t.height>2048?t.toDataURL("image/jpeg",.6):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=pa("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=255*rr(r[a]/255);return n.putImageData(i,0,0),t}if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(255*rr(t[n]/255)):t[n]=rr(t[n]);return{data:t,width:e.width,height:e.height}}return e}},hm=0,Nd=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:hm++}),this.uuid=zn(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Sl(i[a].image)):r.push(Sl(i[a]))}else r=Sl(i);n.url=r}return t||(e.images[this.uuid]=n),n}};function Sl(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Id.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:{}}let um=0,Mn=class To extends Mr{constructor(e=To.DEFAULT_IMAGE,t=To.DEFAULT_MAPPING,n=1001,i=1001,r=1006,a=1008,o=1023,l=1009,c=To.DEFAULT_ANISOTROPY,h=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:um++}),this.uuid=zn(),this.name="",this.source=new Nd(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new xe(0,0),this.repeat=new xe(1,1),this.center=new xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new lt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(oa("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===us?Ut:si),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case On:e.x=e.x-Math.floor(e.x);break;case bi:e.x=e.x<0?0:1;break;case Io:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case On:e.y=e.y-Math.floor(e.y);break;case bi:e.y=e.y<0?0:1;break;case Io:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return oa("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===Ut?us:3e3}set encoding(e){oa("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===us?Ut:si}};Mn.DEFAULT_IMAGE=null,Mn.DEFAULT_MAPPING=300,Mn.DEFAULT_ANISOTROPY=1;let Pt=class Dd{constructor(e=0,t=0,n=0,i=1){Dd.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],f=l[9],g=l[2],m=l[6],_=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-g)<.01&&Math.abs(f-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+g)<.1&&Math.abs(f+m)<.1&&Math.abs(c+p+_-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const v=(c+1)/2,y=(p+1)/2,I=(_+1)/2,S=(h+d)/4,w=(u+g)/4,L=(f+m)/4;return v>y&&v>I?v<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(v),i=S/n,r=w/n):y>I?y<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(y),n=S/i,r=L/i):I<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(I),n=w/r,i=L/r),this.set(n,i,r,t),this}let x=Math.sqrt((m-f)*(m-f)+(u-g)*(u-g)+(d-h)*(d-h));return Math.abs(x)<.001&&(x=1),this.x=(m-f)/x,this.y=(u-g)/x,this.z=(d-h)/x,this.w=Math.acos((c+p+_-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},dm=class extends Mr{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Pt(0,0,e,t),this.scissorTest=!1,this.viewport=new Pt(0,0,e,t);const i={width:e,height:t,depth:1};n.encoding!==void 0&&(oa("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===us?Ut:si),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Bn,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new Mn(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){this.width===e&&this.height===t&&this.depth===n||(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Nd(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Yn=class extends dm{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Ud=class extends Mn{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=on,this.minFilter=on,this.wrapR=bi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},pm=class extends Mn{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=on,this.minFilter=on,this.wrapR=bi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Yi=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3];const d=r[a+0],p=r[a+1],f=r[a+2],g=r[a+3];if(o===0)return e[t+0]=l,e[t+1]=c,e[t+2]=h,void(e[t+3]=u);if(o===1)return e[t+0]=d,e[t+1]=p,e[t+2]=f,void(e[t+3]=g);if(u!==g||l!==d||c!==p||h!==f){let m=1-o;const _=l*d+c*p+h*f+u*g,x=_>=0?1:-1,v=1-_*_;if(v>Number.EPSILON){const I=Math.sqrt(v),S=Math.atan2(I,_*x);m=Math.sin(m*S)/I,o=Math.sin(o*S)/I}const y=o*x;if(l=l*m+d*y,c=c*m+p*y,h=h*m+f*y,u=u*m+g*y,m===1-o){const I=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=I,c*=I,h*=I,u*=I}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,a){const o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=r[a],d=r[a+1],p=r[a+2],f=r[a+3];return e[t]=o*f+h*u+l*p-c*d,e[t+1]=l*f+h*d+c*u-o*p,e[t+2]=c*f+h*p+o*d-l*u,e[t+3]=h*f-o*u-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,i=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(r/2),d=l(n/2),p=l(i/2),f=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u-d*p*f;break;case"YXZ":this._x=d*h*u+c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u+d*p*f;break;case"ZXY":this._x=d*h*u-c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u-d*p*f;break;case"ZYX":this._x=d*h*u-c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u+d*p*f;break;case"YZX":this._x=d*h*u+c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u-d*p*f;break;case"XZY":this._x=d*h*u-c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u+d*p*f}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(a-i)*p}else if(n>o&&n>u){const p=2*Math.sqrt(1+n-o-u);this._w=(h-l)/p,this._x=.25*p,this._y=(i+a)/p,this._z=(r+c)/p}else if(o>u){const p=2*Math.sqrt(1+o-n-u);this._w=(r-c)/p,this._x=(i+a)/p,this._y=.25*p,this._z=(l+h)/p}else{const p=2*Math.sqrt(1+u-n-o);this._w=(a-i)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Zt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,r=this._z,a=this._w;let o=a*e._w+n*e._x+i*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=i,this._z=r,this;const l=1-o*o;if(l<=Number.EPSILON){const p=1-t;return this._w=p*a+t*this._w,this._x=p*n+t*this._x,this._y=p*i+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(r),n*Math.cos(r),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},M=class Od{constructor(e=0,t=0,n=0){Od.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ch.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ch.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),h=2*(o*t-r*i),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=i+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return wl.copy(this).projectOnVector(e),this.sub(wl)}reflect(e){return this.sub(wl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Zt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,4*t)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,3*t)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=2*(Math.random()-.5),t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};const wl=new M,Ch=new Yi;let Ai=class{constructor(e=new M(1/0,1/0,1/0),t=new M(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Hn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Hn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Hn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Hn):Hn.fromBufferAttribute(r,a),Hn.applyMatrix4(e.matrixWorld),this.expandByPoint(Hn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Na.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Na.copy(n.boundingBox)),Na.applyMatrix4(e.matrixWorld),this.union(Na)}const i=e.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Hn),Hn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(kr),Da.subVectors(this.max,kr),Es.subVectors(e.a,kr),Rs.subVectors(e.b,kr),Cs.subVectors(e.c,kr),Di.subVectors(Rs,Es),Ui.subVectors(Cs,Rs),Zi.subVectors(Es,Cs);let t=[0,-Di.z,Di.y,0,-Ui.z,Ui.y,0,-Zi.z,Zi.y,Di.z,0,-Di.x,Ui.z,0,-Ui.x,Zi.z,0,-Zi.x,-Di.y,Di.x,0,-Ui.y,Ui.x,0,-Zi.y,Zi.x,0];return!!Tl(t,Es,Rs,Cs,Da)&&(t=[1,0,0,0,1,0,0,0,1],!!Tl(t,Es,Rs,Cs,Da)&&(Ua.crossVectors(Di,Ui),t=[Ua.x,Ua.y,Ua.z],Tl(t,Es,Rs,Cs,Da)))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Hn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=.5*this.getSize(Hn).length()),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(di[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),di[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),di[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),di[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),di[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),di[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),di[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),di[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(di)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}};const di=[new M,new M,new M,new M,new M,new M,new M,new M],Hn=new M,Na=new Ai,Es=new M,Rs=new M,Cs=new M,Di=new M,Ui=new M,Zi=new M,kr=new M,Da=new M,Ua=new M,Ji=new M;function Tl(s,e,t,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Ji.fromArray(s,r);const o=i.x*Math.abs(Ji.x)+i.y*Math.abs(Ji.y)+i.z*Math.abs(Ji.z),l=e.dot(Ji),c=t.dot(Ji),h=n.dot(Ji);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const fm=new Ai,zr=new M,Al=new M;let ui=class{constructor(e=new M,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):fm.setFromPoints(e).getCenter(n);let i=0;for(let r=0,a=e.length;r<a;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;zr.subVectors(e,this.center);const t=zr.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=.5*(n-this.radius);this.center.addScaledVector(zr,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Al.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(zr.copy(e.center).add(Al)),this.expandByPoint(zr.copy(e.center).sub(Al))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}};const pi=new M,El=new M,Oa=new M,Oi=new M,Rl=new M,Fa=new M,Cl=new M;let jo=class{constructor(e=new M,t=new M(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,pi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=pi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(pi.copy(this.origin).addScaledVector(this.direction,t),pi.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){El.copy(e).add(t).multiplyScalar(.5),Oa.copy(t).sub(e).normalize(),Oi.copy(this.origin).sub(El);const r=.5*e.distanceTo(t),a=-this.direction.dot(Oa),o=Oi.dot(this.direction),l=-Oi.dot(Oa),c=Oi.lengthSq(),h=Math.abs(1-a*a);let u,d,p,f;if(h>0)if(u=a*l-o,d=a*o-l,f=r*h,u>=0)if(d>=-f)if(d<=f){const g=1/h;u*=g,d*=g,p=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d<=-f?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c):d<=f?(u=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(El).addScaledVector(Oa,d),p}intersectSphere(e,t){pi.subVectors(e.center,this.origin);const n=pi.dot(this.direction),i=pi.dot(pi)-n*n,r=e.radius*e.radius;if(i>r)return null;const a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0?!0:e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>i?null:((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>i?null:((o>n||n!=n)&&(n=o),(l<i||i!=i)&&(i=l),i<0?null:this.at(n>=0?n:i,t)))}intersectsBox(e){return this.intersectBox(e,pi)!==null}intersectTriangle(e,t,n,i,r){Rl.subVectors(t,e),Fa.subVectors(n,e),Cl.crossVectors(Rl,Fa);let a,o=this.direction.dot(Cl);if(o>0){if(i)return null;a=1}else{if(!(o<0))return null;a=-1,o=-o}Oi.subVectors(this.origin,e);const l=a*this.direction.dot(Fa.crossVectors(Oi,Fa));if(l<0)return null;const c=a*this.direction.dot(Rl.cross(Oi));if(c<0||l+c>o)return null;const h=-a*Oi.dot(Cl);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},at=class xc{constructor(e,t,n,i,r,a,o,l,c,h,u,d,p,f,g,m){xc.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c,h,u,d,p,f,g,m)}set(e,t,n,i,r,a,o,l,c,h,u,d,p,f,g,m){const _=this.elements;return _[0]=e,_[4]=t,_[8]=n,_[12]=i,_[1]=r,_[5]=a,_[9]=o,_[13]=l,_[2]=c,_[6]=h,_[10]=u,_[14]=d,_[3]=p,_[7]=f,_[11]=g,_[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new xc().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/Ps.setFromMatrixColumn(e,0).length(),r=1/Ps.setFromMatrixColumn(e,1).length(),a=1/Ps.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){const d=a*h,p=a*u,f=o*h,g=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=p+f*c,t[5]=d-g*c,t[9]=-o*l,t[2]=g-d*c,t[6]=f+p*c,t[10]=a*l}else if(e.order==="YXZ"){const d=l*h,p=l*u,f=c*h,g=c*u;t[0]=d+g*o,t[4]=f*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=p*o-f,t[6]=g+d*o,t[10]=a*l}else if(e.order==="ZXY"){const d=l*h,p=l*u,f=c*h,g=c*u;t[0]=d-g*o,t[4]=-a*u,t[8]=f+p*o,t[1]=p+f*o,t[5]=a*h,t[9]=g-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const d=a*h,p=a*u,f=o*h,g=o*u;t[0]=l*h,t[4]=f*c-p,t[8]=d*c+g,t[1]=l*u,t[5]=g*c+d,t[9]=p*c-f,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const d=a*l,p=a*c,f=o*l,g=o*c;t[0]=l*h,t[4]=g-d*u,t[8]=f*u+p,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=p*u+f,t[10]=d-g*u}else if(e.order==="XZY"){const d=a*l,p=a*c,f=o*l,g=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+g,t[5]=a*h,t[9]=p*u-f,t[2]=f*u-p,t[6]=o*h,t[10]=g*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(mm,e,gm)}lookAt(e,t,n){const i=this.elements;return wn.subVectors(e,t),wn.lengthSq()===0&&(wn.z=1),wn.normalize(),Fi.crossVectors(n,wn),Fi.lengthSq()===0&&(Math.abs(n.z)===1?wn.x+=1e-4:wn.z+=1e-4,wn.normalize(),Fi.crossVectors(n,wn)),Fi.normalize(),Ba.crossVectors(wn,Fi),i[0]=Fi.x,i[4]=Ba.x,i[8]=wn.x,i[1]=Fi.y,i[5]=Ba.y,i[9]=wn.y,i[2]=Fi.z,i[6]=Ba.z,i[10]=wn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],p=n[13],f=n[2],g=n[6],m=n[10],_=n[14],x=n[3],v=n[7],y=n[11],I=n[15],S=i[0],w=i[4],L=i[8],b=i[12],C=i[1],U=i[5],A=i[9],O=i[13],F=i[2],j=i[6],J=i[10],W=i[14],k=i[3],$=i[7],N=i[11],Q=i[15];return r[0]=a*S+o*C+l*F+c*k,r[4]=a*w+o*U+l*j+c*$,r[8]=a*L+o*A+l*J+c*N,r[12]=a*b+o*O+l*W+c*Q,r[1]=h*S+u*C+d*F+p*k,r[5]=h*w+u*U+d*j+p*$,r[9]=h*L+u*A+d*J+p*N,r[13]=h*b+u*O+d*W+p*Q,r[2]=f*S+g*C+m*F+_*k,r[6]=f*w+g*U+m*j+_*$,r[10]=f*L+g*A+m*J+_*N,r[14]=f*b+g*O+m*W+_*Q,r[3]=x*S+v*C+y*F+I*k,r[7]=x*w+v*U+y*j+I*$,r[11]=x*L+v*A+y*J+I*N,r[15]=x*b+v*O+y*W+I*Q,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],p=e[14];return e[3]*(+r*l*u-i*c*u-r*o*d+n*c*d+i*o*p-n*l*p)+e[7]*(+t*l*p-t*c*d+r*a*d-i*a*p+i*c*h-r*l*h)+e[11]*(+t*c*u-t*o*p-r*a*u+n*a*p+r*o*h-n*c*h)+e[15]*(-i*o*h-t*l*u+t*o*d+i*a*u-n*a*d+n*l*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],p=e[11],f=e[12],g=e[13],m=e[14],_=e[15],x=u*m*c-g*d*c+g*l*p-o*m*p-u*l*_+o*d*_,v=f*d*c-h*m*c-f*l*p+a*m*p+h*l*_-a*d*_,y=h*g*c-f*u*c+f*o*p-a*g*p-h*o*_+a*u*_,I=f*u*l-h*g*l-f*o*d+a*g*d+h*o*m-a*u*m,S=t*x+n*v+i*y+r*I;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const w=1/S;return e[0]=x*w,e[1]=(g*d*r-u*m*r-g*i*p+n*m*p+u*i*_-n*d*_)*w,e[2]=(o*m*r-g*l*r+g*i*c-n*m*c-o*i*_+n*l*_)*w,e[3]=(u*l*r-o*d*r-u*i*c+n*d*c+o*i*p-n*l*p)*w,e[4]=v*w,e[5]=(h*m*r-f*d*r+f*i*p-t*m*p-h*i*_+t*d*_)*w,e[6]=(f*l*r-a*m*r-f*i*c+t*m*c+a*i*_-t*l*_)*w,e[7]=(a*d*r-h*l*r+h*i*c-t*d*c-a*i*p+t*l*p)*w,e[8]=y*w,e[9]=(f*u*r-h*g*r-f*n*p+t*g*p+h*n*_-t*u*_)*w,e[10]=(a*g*r-f*o*r+f*n*c-t*g*c-a*n*_+t*o*_)*w,e[11]=(h*o*r-a*u*r-h*n*c+t*u*c+a*n*p-t*o*p)*w,e[12]=I*w,e[13]=(h*g*i-f*u*i+f*n*d-t*g*d-h*n*m+t*u*m)*w,e[14]=(f*o*i-a*g*i-f*n*l+t*g*l+a*n*m-t*o*m)*w,e[15]=(a*u*i-h*o*i+h*n*l-t*u*l-a*n*d+t*o*d)*w,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,a){return this.set(1,n,r,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,p=r*h,f=r*u,g=a*h,m=a*u,_=o*u,x=l*c,v=l*h,y=l*u,I=n.x,S=n.y,w=n.z;return i[0]=(1-(g+_))*I,i[1]=(p+y)*I,i[2]=(f-v)*I,i[3]=0,i[4]=(p-y)*S,i[5]=(1-(d+_))*S,i[6]=(m+x)*S,i[7]=0,i[8]=(f+v)*w,i[9]=(m-x)*w,i[10]=(1-(d+g))*w,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let r=Ps.set(i[0],i[1],i[2]).length();const a=Ps.set(i[4],i[5],i[6]).length(),o=Ps.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],Gn.copy(this);const l=1/r,c=1/a,h=1/o;return Gn.elements[0]*=l,Gn.elements[1]*=l,Gn.elements[2]*=l,Gn.elements[4]*=c,Gn.elements[5]*=c,Gn.elements[6]*=c,Gn.elements[8]*=h,Gn.elements[9]*=h,Gn.elements[10]*=h,t.setFromRotationMatrix(Gn),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,i,r,a,o=2e3){const l=this.elements,c=2*r/(t-e),h=2*r/(n-i),u=(t+e)/(t-e),d=(n+i)/(n-i);let p,f;if(o===fr)p=-(a+r)/(a-r),f=-2*a*r/(a-r);else{if(o!==Oo)throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);p=-a/(a-r),f=-a*r/(a-r)}return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=f,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,i,r,a,o=2e3){const l=this.elements,c=1/(t-e),h=1/(n-i),u=1/(a-r),d=(t+e)*c,p=(n+i)*h;let f,g;if(o===fr)f=(a+r)*u,g=-2*u;else{if(o!==Oo)throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);f=r*u,g=-1*u}return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=g,l[14]=-f,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};const Ps=new M,Gn=new at,mm=new M(0,0,0),gm=new M(1,1,1),Fi=new M,Ba=new M,wn=new M,Ph=new at,Lh=new Yi;let Js=class Fd{constructor(e=0,t=0,n=0,i=Fd.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],p=i[10];switch(t){case"XYZ":this._y=Math.asin(Zt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Zt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Zt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Zt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Zt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Zt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ph.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ph,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Lh.setFromEuler(this),this.setFromQuaternion(Lh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Js.DEFAULT_ORDER="XYZ";let Bd=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},vm=0;const Ih=new M,Ls=new Yi,fi=new at,ka=new M,Vr=new M,xm=new M,_m=new Yi,Nh=new M(1,0,0),Dh=new M(0,1,0),Uh=new M(0,0,1),ym={type:"added"},bm={type:"removed"};let yt=class Ao extends Mr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:vm++}),this.uuid=zn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ao.DEFAULT_UP.clone();const e=new M,t=new Js,n=new Yi,i=new M(1,1,1);t._onChange(function(){n.setFromEuler(t,!1)}),n._onChange(function(){t.setFromQuaternion(n,void 0,!1)}),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new at},normalMatrix:{value:new lt}}),this.matrix=new at,this.matrixWorld=new at,this.matrixAutoUpdate=Ao.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ao.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Bd,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ls.setFromAxisAngle(e,t),this.quaternion.multiply(Ls),this}rotateOnWorldAxis(e,t){return Ls.setFromAxisAngle(e,t),this.quaternion.premultiply(Ls),this}rotateX(e){return this.rotateOnAxis(Nh,e)}rotateY(e){return this.rotateOnAxis(Dh,e)}rotateZ(e){return this.rotateOnAxis(Uh,e)}translateOnAxis(e,t){return Ih.copy(e).applyQuaternion(this.quaternion),this.position.add(Ih.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Nh,e)}translateY(e){return this.translateOnAxis(Dh,e)}translateZ(e){return this.translateOnAxis(Uh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(fi.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ka.copy(e):ka.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Vr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?fi.lookAt(Vr,ka,this.up):fi.lookAt(ka,Vr,this.up),this.quaternion.setFromRotationMatrix(fi),i&&(fi.extractRotation(i.matrixWorld),Ls.setFromRotationMatrix(fi),this.quaternion.premultiply(Ls.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this||e&&e.isObject3D&&(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(ym)),this}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(bm)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),fi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),fi.multiply(e.parent.matrixWorld)),e.applyMatrix4(fi),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vr,e,xm),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vr,_m,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++){const r=t[n];r.matrixWorldAutoUpdate!==!0&&e!==!0||r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const i=this.children;for(let r=0,a=i.length;r<a;r++){const o=i[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxGeometryCount=this._maxGeometryCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()})),this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(r(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),p=a(e.animations),f=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),f.length>0&&(n.nodes=f)}return n.object=i,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}};yt.DEFAULT_UP=new M(0,1,0),yt.DEFAULT_MATRIX_AUTO_UPDATE=!0,yt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Wn=new M,mi=new M,Pl=new M,gi=new M,Is=new M,Ns=new M,Oh=new M,Ll=new M,Il=new M,Nl=new M;let Qs=class ss{constructor(e=new M,t=new M,n=new M){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Wn.subVectors(e,t),i.cross(Wn);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Wn.subVectors(i,t),mi.subVectors(n,t),Pl.subVectors(e,t);const a=Wn.dot(Wn),o=Wn.dot(mi),l=Wn.dot(Pl),c=mi.dot(mi),h=mi.dot(Pl),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;const d=1/u,p=(c*l-o*h)*d,f=(a*h-o*l)*d;return r.set(1-p-f,f,p)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,gi)!==null&&gi.x>=0&&gi.y>=0&&gi.x+gi.y<=1}static getUV(e,t,n,i,r,a,o,l){return this.getInterpolation(e,t,n,i,r,a,o,l)}static getInterpolation(e,t,n,i,r,a,o,l){return this.getBarycoord(e,t,n,i,gi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,gi.x),l.addScaledVector(a,gi.y),l.addScaledVector(o,gi.z),l)}static isFrontFacing(e,t,n,i){return Wn.subVectors(n,t),mi.subVectors(e,t),Wn.cross(mi).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Wn.subVectors(this.c,this.b),mi.subVectors(this.a,this.b),.5*Wn.cross(mi).length()}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return ss.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return ss.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,r){return ss.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}getInterpolation(e,t,n,i,r){return ss.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return ss.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return ss.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let a,o;Is.subVectors(i,n),Ns.subVectors(r,n),Ll.subVectors(e,n);const l=Is.dot(Ll),c=Ns.dot(Ll);if(l<=0&&c<=0)return t.copy(n);Il.subVectors(e,i);const h=Is.dot(Il),u=Ns.dot(Il);if(h>=0&&u<=h)return t.copy(i);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(Is,a);Nl.subVectors(e,r);const p=Is.dot(Nl),f=Ns.dot(Nl);if(f>=0&&p<=f)return t.copy(r);const g=p*c-l*f;if(g<=0&&c>=0&&f<=0)return o=c/(c-f),t.copy(n).addScaledVector(Ns,o);const m=h*f-p*u;if(m<=0&&u-h>=0&&p-f>=0)return Oh.subVectors(r,i),o=(u-h)/(u-h+(p-f)),t.copy(i).addScaledVector(Oh,o);const _=1/(m+g+d);return a=g*_,o=d*_,t.copy(n).addScaledVector(Is,a).addScaledVector(Ns,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}};const kd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Bi={h:0,s:0,l:0},za={h:0,s:0,l:0};function Dl(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+6*(e-s)*t:t<.5?e:t<2/3?s+6*(e-s)*(2/3-t):s}let Ue=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(255&e)/255,_t.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=_t.workingColorSpace){return this.r=e,this.g=t,this.b=n,_t.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=_t.workingColorSpace){if(e=gc(e,1),t=Zt(t,0,1),n=Zt(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Dl(a,r,e+1/3),this.g=Dl(a,r,e),this.b=Dl(a,r,e-1/3)}return _t.toWorkingColorSpace(this,i),this}setStyle(e,t=Ut){function n(r){}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r[4],this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r[4],this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return r[4],this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ut){const n=kd[e.toLowerCase()];return n!==void 0&&this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=rr(e.r),this.g=rr(e.g),this.b=rr(e.b),this}copyLinearToSRGB(e){return this.r=Ml(e.r),this.g=Ml(e.g),this.b=Ml(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ut){return _t.fromWorkingColorSpace(rn.copy(this),e),65536*Math.round(Zt(255*rn.r,0,255))+256*Math.round(Zt(255*rn.g,0,255))+Math.round(Zt(255*rn.b,0,255))}getHexString(e=Ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=_t.workingColorSpace){_t.fromWorkingColorSpace(rn.copy(this),t);const n=rn.r,i=rn.g,r=rn.b,a=Math.max(n,i,r),o=Math.min(n,i,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-r)/u+(i<r?6:0);break;case i:l=(r-n)/u+2;break;case r:l=(n-i)/u+4}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=_t.workingColorSpace){return _t.fromWorkingColorSpace(rn.copy(this),t),e.r=rn.r,e.g=rn.g,e.b=rn.b,e}getStyle(e=Ut){_t.fromWorkingColorSpace(rn.copy(this),e);const t=rn.r,n=rn.g,i=rn.b;return e!==Ut?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(255*t)},${Math.round(255*n)},${Math.round(255*i)})`}offsetHSL(e,t,n){return this.getHSL(Bi),this.setHSL(Bi.h+e,Bi.s+t,Bi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Bi),e.getHSL(za);const n=aa(Bi.h,za.h,t),i=aa(Bi.s,za.s,t),r=aa(Bi.l,za.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}};const rn=new Ue;Ue.NAMES=kd;let Mm=0,Kn=class extends Mr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Mm++}),this.uuid=zn(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=ls,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ue(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ts,this.stencilZFail=Ts,this.stencilZPass=Ts,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0)continue;const i=this[t];i!==void 0&&(i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n)}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};function i(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==204&&(n.blendSrc=this.blendSrc),this.blendDst!==205&&(n.blendDst=this.blendDst),this.blendEquation!==ls&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ts&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ts&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ts&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData),t){const r=i(e.textures),a=i(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Rn=class extends Kn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ue(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};const Wt=new M,Va=new xe;let st=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=fc,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=$i,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Va.fromBufferAttribute(this,t),Va.applyMatrix3(e),this.setXY(t,Va.x,Va.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Wt.fromBufferAttribute(this,t),Wt.applyMatrix3(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Wt.fromBufferAttribute(this,t),Wt.applyMatrix4(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Wt.fromBufferAttribute(this,t),Wt.applyNormalMatrix(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Wt.fromBufferAttribute(this,t),Wt.transformDirection(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=ri(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=St(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ri(t,this.array)),t}setX(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ri(t,this.array)),t}setY(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ri(t,this.array)),t}setZ(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ri(t,this.array)),t}setW(e,t){return this.normalized&&(t=St(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=St(t,this.array),n=St(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=St(t,this.array),n=St(n,this.array),i=St(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=St(t,this.array),n=St(n,this.array),i=St(i,this.array),r=St(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==fc&&(e.usage=this.usage),e}},zd=class extends st{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Vd=class extends st{constructor(e,t,n){super(new Uint32Array(e),t,n)}},dt=class extends st{constructor(e,t,n){super(new Float32Array(e),t,n)}},Sm=0;const Dn=new at,Ul=new yt,Ds=new M,Tn=new Ai,Hr=new Ai,Kt=new M;let rt=class Hd extends Mr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Sm++}),this.uuid=zn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Ld(e)?Vd:zd)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new lt().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Dn.makeRotationFromQuaternion(e),this.applyMatrix4(Dn),this}rotateX(e){return Dn.makeRotationX(e),this.applyMatrix4(Dn),this}rotateY(e){return Dn.makeRotationY(e),this.applyMatrix4(Dn),this}rotateZ(e){return Dn.makeRotationZ(e),this.applyMatrix4(Dn),this}translate(e,t,n){return Dn.makeTranslation(e,t,n),this.applyMatrix4(Dn),this}scale(e,t,n){return Dn.makeScale(e,t,n),this.applyMatrix4(Dn),this}lookAt(e){return Ul.lookAt(e),Ul.updateMatrix(),this.applyMatrix4(Ul.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ds).negate(),this.translate(Ds.x,Ds.y,Ds.z),this}setFromPoints(e){const t=[];for(let n=0,i=e.length;n<i;n++){const r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new dt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ai);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)this.boundingBox.set(new M(-1/0,-1/0,-1/0),new M(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];Tn.setFromBufferAttribute(r),this.morphTargetsRelative?(Kt.addVectors(this.boundingBox.min,Tn.min),this.boundingBox.expandByPoint(Kt),Kt.addVectors(this.boundingBox.max,Tn.max),this.boundingBox.expandByPoint(Kt)):(this.boundingBox.expandByPoint(Tn.min),this.boundingBox.expandByPoint(Tn.max))}}else this.boundingBox.makeEmpty();isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ui);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)this.boundingSphere.set(new M,1/0);else if(e){const n=this.boundingSphere.center;if(Tn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];Hr.setFromBufferAttribute(o),this.morphTargetsRelative?(Kt.addVectors(Tn.min,Hr.min),Tn.expandByPoint(Kt),Kt.addVectors(Tn.max,Hr.max),Tn.expandByPoint(Kt)):(Tn.expandByPoint(Hr.min),Tn.expandByPoint(Hr.max))}Tn.getCenter(n);let i=0;for(let r=0,a=e.count;r<a;r++)Kt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Kt));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Kt.fromBufferAttribute(o,c),l&&(Ds.fromBufferAttribute(e,c),Kt.add(Ds)),i=Math.max(i,n.distanceToSquared(Kt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0)return;const n=e.array,i=t.position.array,r=t.normal.array,a=t.uv.array,o=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new st(new Float32Array(4*o),4));const l=this.getAttribute("tangent").array,c=[],h=[];for(let C=0;C<o;C++)c[C]=new M,h[C]=new M;const u=new M,d=new M,p=new M,f=new xe,g=new xe,m=new xe,_=new M,x=new M;function v(C,U,A){u.fromArray(i,3*C),d.fromArray(i,3*U),p.fromArray(i,3*A),f.fromArray(a,2*C),g.fromArray(a,2*U),m.fromArray(a,2*A),d.sub(u),p.sub(u),g.sub(f),m.sub(f);const O=1/(g.x*m.y-m.x*g.y);isFinite(O)&&(_.copy(d).multiplyScalar(m.y).addScaledVector(p,-g.y).multiplyScalar(O),x.copy(p).multiplyScalar(g.x).addScaledVector(d,-m.x).multiplyScalar(O),c[C].add(_),c[U].add(_),c[A].add(_),h[C].add(x),h[U].add(x),h[A].add(x))}let y=this.groups;y.length===0&&(y=[{start:0,count:n.length}]);for(let C=0,U=y.length;C<U;++C){const A=y[C],O=A.start;for(let F=O,j=O+A.count;F<j;F+=3)v(n[F+0],n[F+1],n[F+2])}const I=new M,S=new M,w=new M,L=new M;function b(C){w.fromArray(r,3*C),L.copy(w);const U=c[C];I.copy(U),I.sub(w.multiplyScalar(w.dot(U))).normalize(),S.crossVectors(L,U);const A=S.dot(h[C])<0?-1:1;l[4*C]=I.x,l[4*C+1]=I.y,l[4*C+2]=I.z,l[4*C+3]=A}for(let C=0,U=y.length;C<U;++C){const A=y[C],O=A.start;for(let F=O,j=O+A.count;F<j;F+=3)b(n[F+0]),b(n[F+1]),b(n[F+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new st(new Float32Array(3*t.count),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);const i=new M,r=new M,a=new M,o=new M,l=new M,c=new M,h=new M,u=new M;if(e)for(let d=0,p=e.count;d<p;d+=3){const f=e.getX(d+0),g=e.getX(d+1),m=e.getX(d+2);i.fromBufferAttribute(t,f),r.fromBufferAttribute(t,g),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,f),l.fromBufferAttribute(n,g),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(g,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Kt.fromBufferAttribute(e,t),Kt.normalize(),e.setXYZ(t,Kt.x,Kt.y,Kt.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h);let p=0,f=0;for(let g=0,m=l.length;g<m;g++){p=o.isInterleavedBufferAttribute?l[g]*o.data.stride+o.offset:l[g]*h;for(let _=0;_<h;_++)d[f++]=c[p++]}return new st(d,h,u)}if(this.index===null)return this;const t=new Hd,n=this.index.array,i=this.attributes;for(const o in i){const l=e(i[o],n);t.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){const d=e(c[h],n);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const i={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const p=c[u];h.push(p.toJSON(e.data))}h.length>0&&(i[l]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const i=e.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(t))}const r=e.morphAttributes;for(const c in r){const h=[],u=r[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}};const Fh=new at,Qi=new jo,Ha=new ui,Bh=new M,Us=new M,Os=new M,Fs=new M,Ol=new M,Ga=new M,Wa=new xe,Xa=new xe,qa=new xe,kh=new M,zh=new M,Vh=new M,ja=new M,$a=new M;class ce extends yt{constructor(e=new rt,t=new Rn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){const n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++){const a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const o=this.morphTargetInfluences;if(r&&o){Ga.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],u=r[l];h!==0&&(Ol.fromBufferAttribute(u,e),a?Ga.addScaledVector(Ol,h):Ga.addScaledVector(Ol.sub(t),h))}t.add(Ga)}return t}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;if(i!==void 0){if(n.boundingSphere===null&&n.computeBoundingSphere(),Ha.copy(n.boundingSphere),Ha.applyMatrix4(r),Qi.copy(e.ray).recast(e.near),Ha.containsPoint(Qi.origin)===!1&&(Qi.intersectSphere(Ha,Bh)===null||Qi.origin.distanceToSquared(Bh)>(e.far-e.near)**2))return;Fh.copy(r).invert(),Qi.copy(e.ray).applyMatrix4(Fh),n.boundingBox!==null&&Qi.intersectsBox(n.boundingBox)===!1||this._computeIntersections(e,t,Qi)}}_computeIntersections(e,t,n){let i;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let f=0,g=d.length;f<g;f++){const m=d[f],_=a[m.materialIndex];for(let x=Math.max(m.start,p.start),v=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));x<v;x+=3)i=Ya(this,_,e,n,c,h,u,o.getX(x),o.getX(x+1),o.getX(x+2)),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=m.materialIndex,t.push(i))}else for(let f=Math.max(0,p.start),g=Math.min(o.count,p.start+p.count);f<g;f+=3)i=Ya(this,a,e,n,c,h,u,o.getX(f),o.getX(f+1),o.getX(f+2)),i&&(i.faceIndex=Math.floor(f/3),t.push(i));else if(l!==void 0)if(Array.isArray(a))for(let f=0,g=d.length;f<g;f++){const m=d[f],_=a[m.materialIndex];for(let x=Math.max(m.start,p.start),v=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));x<v;x+=3)i=Ya(this,_,e,n,c,h,u,x,x+1,x+2),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=m.materialIndex,t.push(i))}else for(let f=Math.max(0,p.start),g=Math.min(l.count,p.start+p.count);f<g;f+=3)i=Ya(this,a,e,n,c,h,u,f,f+1,f+2),i&&(i.faceIndex=Math.floor(f/3),t.push(i))}}function Ya(s,e,t,n,i,r,a,o,l,c){s.getVertexPosition(o,Us),s.getVertexPosition(l,Os),s.getVertexPosition(c,Fs);const h=(function(u,d,p,f,g,m,_,x){let v;if(v=d.side===1?f.intersectTriangle(_,m,g,!0,x):f.intersectTriangle(g,m,_,d.side===0,x),v===null)return null;$a.copy(x),$a.applyMatrix4(u.matrixWorld);const y=p.ray.origin.distanceTo($a);return y<p.near||y>p.far?null:{distance:y,point:$a.clone(),object:u}})(s,e,t,n,Us,Os,Fs,ja);if(h){i&&(Wa.fromBufferAttribute(i,o),Xa.fromBufferAttribute(i,l),qa.fromBufferAttribute(i,c),h.uv=Qs.getInterpolation(ja,Us,Os,Fs,Wa,Xa,qa,new xe)),r&&(Wa.fromBufferAttribute(r,o),Xa.fromBufferAttribute(r,l),qa.fromBufferAttribute(r,c),h.uv1=Qs.getInterpolation(ja,Us,Os,Fs,Wa,Xa,qa,new xe),h.uv2=h.uv1),a&&(kh.fromBufferAttribute(a,o),zh.fromBufferAttribute(a,l),Vh.fromBufferAttribute(a,c),h.normal=Qs.getInterpolation(ja,Us,Os,Fs,kh,zh,Vh,new M),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new M,materialIndex:0};Qs.getNormal(Us,Os,Fs,u.normal),h.face=u}return h}class Ke extends rt{constructor(e=1,t=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};const o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],u=[];let d=0,p=0;function f(g,m,_,x,v,y,I,S,w,L,b){const C=y/w,U=I/L,A=y/2,O=I/2,F=S/2,j=w+1,J=L+1;let W=0,k=0;const $=new M;for(let N=0;N<J;N++){const Q=N*U-O;for(let ve=0;ve<j;ve++){const R=ve*C-A;$[g]=R*x,$[m]=Q*v,$[_]=F,c.push($.x,$.y,$.z),$[g]=0,$[m]=0,$[_]=S>0?1:-1,h.push($.x,$.y,$.z),u.push(ve/w),u.push(1-N/L),W+=1}}for(let N=0;N<L;N++)for(let Q=0;Q<w;Q++){const ve=d+Q+j*N,R=d+Q+j*(N+1),T=d+(Q+1)+j*(N+1),G=d+(Q+1)+j*N;l.push(ve,R,G),l.push(R,T,G),k+=6}o.addGroup(p,k,b),p+=k,d+=W}f("z","y","x",-1,-1,n,t,e,a,r,0),f("z","y","x",1,-1,n,t,-e,a,r,1),f("x","z","y",1,1,e,n,t,i,a,2),f("x","z","y",1,-1,e,n,-t,i,a,3),f("x","y","z",1,-1,e,t,n,i,r,4),f("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new dt(c,3)),this.setAttribute("normal",new dt(h,3)),this.setAttribute("uv",new dt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ke(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function gr(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?e[t][n]=null:e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function fn(s){const e={};for(let t=0;t<s.length;t++){const n=gr(s[t]);for(const i in n)e[i]=n[i]}return e}function Gd(s){return s.getRenderTarget()===null?s.outputColorSpace:_t.workingColorSpace}const Bo={clone:gr,merge:fn};class Cn extends Kn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,this.fragmentShader=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=gr(e.uniforms),this.uniformsGroups=(function(t){const n=[];for(let i=0;i<t.length;i++)n.push(t[i].clone());return n})(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const r=this.uniforms[i].value;r&&r.isTexture?t.uniforms[i]={type:"t",value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[i]={type:"c",value:r.getHex()}:r&&r.isVector2?t.uniforms[i]={type:"v2",value:r.toArray()}:r&&r.isVector3?t.uniforms[i]={type:"v3",value:r.toArray()}:r&&r.isVector4?t.uniforms[i]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?t.uniforms[i]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?t.uniforms[i]={type:"m4",value:r.toArray()}:t.uniforms[i]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Wd extends yt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new at,this.projectionMatrix=new at,this.projectionMatrixInverse=new at,this.coordinateSystem=fr}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class gn extends Wd{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=2*mr*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(.5*sr*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return 2*mr*Math.atan(Math.tan(.5*sr*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(.5*sr*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Bs=-90;class wm extends yt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new gn(Bs,1,e,t);i.layers=this.layers,this.add(i);const r=new gn(Bs,1,e,t);r.layers=this.layers,this.add(r);const a=new gn(Bs,1,e,t);a.layers=this.layers,this.add(a);const o=new gn(Bs,1,e,t);o.layers=this.layers,this.add(o);const l=new gn(Bs,1,e,t);l.layers=this.layers,this.add(l);const c=new gn(Bs,1,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,i,r,a,o,l]=t;for(const c of t)this.remove(c);if(e===fr)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else{if(e!==Oo)throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1)}for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),f=e.xr.enabled;e.xr.enabled=!1;const g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,a),e.setRenderTarget(n,2,i),e.render(t,o),e.setRenderTarget(n,3,i),e.render(t,l),e.setRenderTarget(n,4,i),e.render(t,c),n.texture.generateMipmaps=g,e.setRenderTarget(n,5,i),e.render(t,h),e.setRenderTarget(u,d,p),e.xr.enabled=f,n.texture.needsPMREMUpdate=!0}}class Xd extends Mn{constructor(e,t,n,i,r,a,o,l,c,h){super(e=e!==void 0?e:[],t=t!==void 0?t:cr,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Tm extends Yn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];t.encoding!==void 0&&(oa("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===us?Ut:si),this.texture=new Xd(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0&&t.generateMipmaps,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Bn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Ke(5,5,5),r=new Cn({name:"CubemapFromEquirect",uniforms:gr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});r.uniforms.tEquirect.value=t;const a=new ce(i,r),o=t.minFilter;return t.minFilter===ur&&(t.minFilter=Bn),new wm(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,i){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(r)}}const Fl=new M,Am=new M,Em=new lt;class rs{constructor(e=new M(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=Fl.subVectors(n,t).cross(Am.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Fl),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Em.getNormalMatrix(e),i=this.coplanarPoint(Fl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const es=new ui,Ka=new M;class Hc{constructor(e=new rs,t=new rs,n=new rs,i=new rs,r=new rs,a=new rs){this.planes=[e,t,n,i,r,a]}set(e,t,n,i,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3){const n=this.planes,i=e.elements,r=i[0],a=i[1],o=i[2],l=i[3],c=i[4],h=i[5],u=i[6],d=i[7],p=i[8],f=i[9],g=i[10],m=i[11],_=i[12],x=i[13],v=i[14],y=i[15];if(n[0].setComponents(l-r,d-c,m-p,y-_).normalize(),n[1].setComponents(l+r,d+c,m+p,y+_).normalize(),n[2].setComponents(l+a,d+h,m+f,y+x).normalize(),n[3].setComponents(l-a,d-h,m-f,y-x).normalize(),n[4].setComponents(l-o,d-u,m-g,y-v).normalize(),t===fr)n[5].setComponents(l+o,d+u,m+g,y+v).normalize();else{if(t!==Oo)throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);n[5].setComponents(o,u,g,v).normalize()}return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),es.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),es.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(es)}intersectsSprite(e){return es.center.set(0,0,0),es.radius=.7071067811865476,es.applyMatrix4(e.matrixWorld),this.intersectsSphere(es)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(Ka.x=i.normal.x>0?e.max.x:e.min.x,Ka.y=i.normal.y>0?e.max.y:e.min.y,Ka.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Ka)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function qd(){let s=null,e=!1,t=null,n=null;function i(r,a){t(r,a),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Rm(s,e){const t=e.isWebGL2,n=new WeakMap;return{get:function(i){return i.isInterleavedBufferAttribute&&(i=i.data),n.get(i)},remove:function(i){i.isInterleavedBufferAttribute&&(i=i.data);const r=n.get(i);r&&(s.deleteBuffer(r.buffer),n.delete(i))},update:function(i,r){if(i.isGLBufferAttribute){const o=n.get(i);return void((!o||o.version<i.version)&&n.set(i,{buffer:i.buffer,type:i.type,bytesPerElement:i.elementSize,version:i.version}))}i.isInterleavedBufferAttribute&&(i=i.data);const a=n.get(i);if(a===void 0)n.set(i,(function(o,l){const c=o.array,h=o.usage,u=c.byteLength,d=s.createBuffer();let p;if(s.bindBuffer(l,d),s.bufferData(l,c,h),o.onUploadCallback(),c instanceof Float32Array)p=s.FLOAT;else if(c instanceof Uint16Array)if(o.isFloat16BufferAttribute){if(!t)throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");p=s.HALF_FLOAT}else p=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=s.SHORT;else if(c instanceof Uint32Array)p=s.UNSIGNED_INT;else if(c instanceof Int32Array)p=s.INT;else if(c instanceof Int8Array)p=s.BYTE;else if(c instanceof Uint8Array)p=s.UNSIGNED_BYTE;else{if(!(c instanceof Uint8ClampedArray))throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);p=s.UNSIGNED_BYTE}return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}})(i,r));else if(a.version<i.version){if(a.size!==i.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");(function(o,l,c){const h=l.array,u=l._updateRange,d=l.updateRanges;if(s.bindBuffer(c,o),u.count===-1&&d.length===0&&s.bufferSubData(c,0,h),d.length!==0){for(let p=0,f=d.length;p<f;p++){const g=d[p];t?s.bufferSubData(c,g.start*h.BYTES_PER_ELEMENT,h,g.start,g.count):s.bufferSubData(c,g.start*h.BYTES_PER_ELEMENT,h.subarray(g.start,g.start+g.count))}l.clearUpdateRanges()}u.count!==-1&&(t?s.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h,u.offset,u.count):s.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h.subarray(u.offset,u.offset+u.count)),u.count=-1),l.onUploadCallback()})(a.buffer,i,r),a.version=i.version}}}}class yi extends rt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=e/o,d=t/l,p=[],f=[],g=[],m=[];for(let _=0;_<h;_++){const x=_*d-a;for(let v=0;v<c;v++){const y=v*u-r;f.push(y,-x,0),g.push(0,0,1),m.push(v/o),m.push(1-_/l)}}for(let _=0;_<l;_++)for(let x=0;x<o;x++){const v=x+c*_,y=x+c*(_+1),I=x+1+c*(_+1),S=x+1+c*_;p.push(v,y,S),p.push(y,I,S)}this.setIndex(p),this.setAttribute("position",new dt(f,3)),this.setAttribute("normal",new dt(g,3)),this.setAttribute("uv",new dt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new yi(e.width,e.height,e.widthSegments,e.heightSegments)}}const tt={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:"gl_FragColor = linearToOutputTexel( gl_FragColor );",colorspace_pars_fragment:`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_fragment:`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,distanceRGBA_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distanceRGBA_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},Me={common:{diffuse:{value:new Ue(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new lt},alphaMap:{value:null},alphaMapTransform:{value:new lt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new lt}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new lt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new lt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new lt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new lt},normalScale:{value:new xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new lt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new lt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new lt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new lt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ue(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ue(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new lt},alphaTest:{value:0},uvTransform:{value:new lt}},sprite:{diffuse:{value:new Ue(16777215)},opacity:{value:1},center:{value:new xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new lt},alphaMap:{value:null},alphaMapTransform:{value:new lt},alphaTest:{value:0}}},ni={basic:{uniforms:fn([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.fog]),vertexShader:tt.meshbasic_vert,fragmentShader:tt.meshbasic_frag},lambert:{uniforms:fn([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)}}]),vertexShader:tt.meshlambert_vert,fragmentShader:tt.meshlambert_frag},phong:{uniforms:fn([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)},specular:{value:new Ue(1118481)},shininess:{value:30}}]),vertexShader:tt.meshphong_vert,fragmentShader:tt.meshphong_frag},standard:{uniforms:fn([Me.common,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.roughnessmap,Me.metalnessmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag},toon:{uniforms:fn([Me.common,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.gradientmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)}}]),vertexShader:tt.meshtoon_vert,fragmentShader:tt.meshtoon_frag},matcap:{uniforms:fn([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,{matcap:{value:null}}]),vertexShader:tt.meshmatcap_vert,fragmentShader:tt.meshmatcap_frag},points:{uniforms:fn([Me.points,Me.fog]),vertexShader:tt.points_vert,fragmentShader:tt.points_frag},dashed:{uniforms:fn([Me.common,Me.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:tt.linedashed_vert,fragmentShader:tt.linedashed_frag},depth:{uniforms:fn([Me.common,Me.displacementmap]),vertexShader:tt.depth_vert,fragmentShader:tt.depth_frag},normal:{uniforms:fn([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,{opacity:{value:1}}]),vertexShader:tt.meshnormal_vert,fragmentShader:tt.meshnormal_frag},sprite:{uniforms:fn([Me.sprite,Me.fog]),vertexShader:tt.sprite_vert,fragmentShader:tt.sprite_frag},background:{uniforms:{uvTransform:{value:new lt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:tt.background_vert,fragmentShader:tt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:tt.backgroundCube_vert,fragmentShader:tt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:tt.cube_vert,fragmentShader:tt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:tt.equirect_vert,fragmentShader:tt.equirect_frag},distanceRGBA:{uniforms:fn([Me.common,Me.displacementmap,{referencePosition:{value:new M},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:tt.distanceRGBA_vert,fragmentShader:tt.distanceRGBA_frag},shadow:{uniforms:fn([Me.lights,Me.fog,{color:{value:new Ue(0)},opacity:{value:1}}]),vertexShader:tt.shadow_vert,fragmentShader:tt.shadow_frag}};ni.physical={uniforms:fn([ni.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new lt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new lt},clearcoatNormalScale:{value:new xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new lt},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new lt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new lt},sheen:{value:0},sheenColor:{value:new Ue(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new lt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new lt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new lt},transmissionSamplerSize:{value:new xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new lt},attenuationDistance:{value:0},attenuationColor:{value:new Ue(0)},specularColor:{value:new Ue(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new lt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new lt},anisotropyVector:{value:new xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new lt}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag};const Za={r:0,b:0,g:0};function Cm(s,e,t,n,i,r,a){const o=new Ue(0);let l,c,h=r===!0?0:1,u=null,d=0,p=null;function f(g,m){g.getRGB(Za,Gd(s)),n.buffers.color.setClear(Za.r,Za.g,Za.b,m,a)}return{getClearColor:function(){return o},setClearColor:function(g,m=1){o.set(g),h=m,f(o,h)},getClearAlpha:function(){return h},setClearAlpha:function(g){h=g,f(o,h)},render:function(g,m){let _=!1,x=m.isScene===!0?m.background:null;x&&x.isTexture&&(x=(m.backgroundBlurriness>0?t:e).get(x)),x===null?f(o,h):x&&x.isColor&&(f(x,1),_=!0);const v=s.xr.getEnvironmentBlendMode();v==="additive"?n.buffers.color.setClear(0,0,0,1,a):v==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(s.autoClear||_)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),x&&(x.isCubeTexture||x.mapping===Xo)?(c===void 0&&(c=new ce(new Ke(1,1,1),new Cn({name:"BackgroundCubeMaterial",uniforms:gr(ni.backgroundCube.uniforms),vertexShader:ni.backgroundCube.vertexShader,fragmentShader:ni.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(y,I,S){this.matrixWorld.copyPosition(S.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=m.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,c.material.toneMapped=_t.getTransfer(x.colorSpace)!==Ct,u===x&&d===x.version&&p===s.toneMapping||(c.material.needsUpdate=!0,u=x,d=x.version,p=s.toneMapping),c.layers.enableAll(),g.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new ce(new yi(2,2),new Cn({name:"BackgroundMaterial",uniforms:gr(ni.background.uniforms),vertexShader:ni.background.vertexShader,fragmentShader:ni.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,l.material.toneMapped=_t.getTransfer(x.colorSpace)!==Ct,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),u===x&&d===x.version&&p===s.toneMapping||(l.material.needsUpdate=!0,u=x,d=x.version,p=s.toneMapping),l.layers.enableAll(),g.unshift(l,l.geometry,l.material,0,0,null))}}}function Pm(s,e,t,n){const i=s.getParameter(s.MAX_VERTEX_ATTRIBS),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),a=n.isWebGL2||r!==null,o={},l=p(null);let c=l,h=!1;function u(I){return n.isWebGL2?s.bindVertexArray(I):r.bindVertexArrayOES(I)}function d(I){return n.isWebGL2?s.deleteVertexArray(I):r.deleteVertexArrayOES(I)}function p(I){const S=[],w=[],L=[];for(let b=0;b<i;b++)S[b]=0,w[b]=0,L[b]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:S,enabledAttributes:w,attributeDivisors:L,object:I,attributes:{},index:null}}function f(){const I=c.newAttributes;for(let S=0,w=I.length;S<w;S++)I[S]=0}function g(I){m(I,0)}function m(I,S){const w=c.newAttributes,L=c.enabledAttributes,b=c.attributeDivisors;w[I]=1,L[I]===0&&(s.enableVertexAttribArray(I),L[I]=1),b[I]!==S&&((n.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](I,S),b[I]=S)}function _(){const I=c.newAttributes,S=c.enabledAttributes;for(let w=0,L=S.length;w<L;w++)S[w]!==I[w]&&(s.disableVertexAttribArray(w),S[w]=0)}function x(I,S,w,L,b,C,U){U===!0?s.vertexAttribIPointer(I,S,w,b,C):s.vertexAttribPointer(I,S,w,L,b,C)}function v(){y(),h=!0,c!==l&&(c=l,u(c.object))}function y(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:function(I,S,w,L,b){let C=!1;if(a){const U=(function(A,O,F){const j=F.wireframe===!0;let J=o[A.id];J===void 0&&(J={},o[A.id]=J);let W=J[O.id];W===void 0&&(W={},J[O.id]=W);let k=W[j];return k===void 0&&(k=p(n.isWebGL2?s.createVertexArray():r.createVertexArrayOES()),W[j]=k),k})(L,w,S);c!==U&&(c=U,u(c.object)),C=(function(A,O,F,j){const J=c.attributes,W=O.attributes;let k=0;const $=F.getAttributes();for(const N in $)if($[N].location>=0){const Q=J[N];let ve=W[N];if(ve===void 0&&(N==="instanceMatrix"&&A.instanceMatrix&&(ve=A.instanceMatrix),N==="instanceColor"&&A.instanceColor&&(ve=A.instanceColor)),Q===void 0||Q.attribute!==ve||ve&&Q.data!==ve.data)return!0;k++}return c.attributesNum!==k||c.index!==j})(I,L,w,b),C&&(function(A,O,F,j){const J={},W=O.attributes;let k=0;const $=F.getAttributes();for(const N in $)if($[N].location>=0){let Q=W[N];Q===void 0&&(N==="instanceMatrix"&&A.instanceMatrix&&(Q=A.instanceMatrix),N==="instanceColor"&&A.instanceColor&&(Q=A.instanceColor));const ve={};ve.attribute=Q,Q&&Q.data&&(ve.data=Q.data),J[N]=ve,k++}c.attributes=J,c.attributesNum=k,c.index=j})(I,L,w,b)}else{const U=S.wireframe===!0;c.geometry===L.id&&c.program===w.id&&c.wireframe===U||(c.geometry=L.id,c.program=w.id,c.wireframe=U,C=!0)}b!==null&&t.update(b,s.ELEMENT_ARRAY_BUFFER),(C||h)&&(h=!1,(function(U,A,O,F){if(n.isWebGL2===!1&&(U.isInstancedMesh||F.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;f();const j=F.attributes,J=O.getAttributes(),W=A.defaultAttributeValues;for(const k in J){const $=J[k];if($.location>=0){let N=j[k];if(N===void 0&&(k==="instanceMatrix"&&U.instanceMatrix&&(N=U.instanceMatrix),k==="instanceColor"&&U.instanceColor&&(N=U.instanceColor)),N!==void 0){const Q=N.normalized,ve=N.itemSize,R=t.get(N);if(R===void 0)continue;const T=R.buffer,G=R.type,Z=R.bytesPerElement,D=n.isWebGL2===!0&&(G===s.INT||G===s.UNSIGNED_INT||N.gpuType===Ed);if(N.isInterleavedBufferAttribute){const K=N.data,B=K.stride,V=N.offset;if(K.isInstancedInterleavedBuffer){for(let q=0;q<$.locationSize;q++)m($.location+q,K.meshPerAttribute);U.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let q=0;q<$.locationSize;q++)g($.location+q);s.bindBuffer(s.ARRAY_BUFFER,T);for(let q=0;q<$.locationSize;q++)x($.location+q,ve/$.locationSize,G,Q,B*Z,(V+ve/$.locationSize*q)*Z,D)}else{if(N.isInstancedBufferAttribute){for(let K=0;K<$.locationSize;K++)m($.location+K,N.meshPerAttribute);U.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=N.meshPerAttribute*N.count)}else for(let K=0;K<$.locationSize;K++)g($.location+K);s.bindBuffer(s.ARRAY_BUFFER,T);for(let K=0;K<$.locationSize;K++)x($.location+K,ve/$.locationSize,G,Q,ve*Z,ve/$.locationSize*K*Z,D)}}else if(W!==void 0){const Q=W[k];if(Q!==void 0)switch(Q.length){case 2:s.vertexAttrib2fv($.location,Q);break;case 3:s.vertexAttrib3fv($.location,Q);break;case 4:s.vertexAttrib4fv($.location,Q);break;default:s.vertexAttrib1fv($.location,Q)}}}}_()})(I,S,w,L),b!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(b).buffer))},reset:v,resetDefaultState:y,dispose:function(){v();for(const I in o){const S=o[I];for(const w in S){const L=S[w];for(const b in L)d(L[b].object),delete L[b];delete S[w]}delete o[I]}},releaseStatesOfGeometry:function(I){if(o[I.id]===void 0)return;const S=o[I.id];for(const w in S){const L=S[w];for(const b in L)d(L[b].object),delete L[b];delete S[w]}delete o[I.id]},releaseStatesOfProgram:function(I){for(const S in o){const w=o[S];if(w[I.id]===void 0)continue;const L=w[I.id];for(const b in L)d(L[b].object),delete L[b];delete w[I.id]}},initAttributes:f,enableAttribute:g,disableUnusedAttributes:_}}function Lm(s,e,t,n){const i=n.isWebGL2;let r;this.setMode=function(a){r=a},this.render=function(a,o){s.drawArrays(r,a,o),t.update(o,r,1)},this.renderInstances=function(a,o,l){if(l===0)return;let c,h;if(i)c=s,h="drawArraysInstanced";else if(c=e.get("ANGLE_instanced_arrays"),h="drawArraysInstancedANGLE",c===null)return;c[h](r,a,o,l),t.update(o,r,l)},this.renderMultiDraw=function(a,o,l){if(l===0)return;const c=e.get("WEBGL_multi_draw");if(c===null)for(let h=0;h<l;h++)this.render(a[h],o[h]);else{c.multiDrawArraysWEBGL(r,a,0,o,0,l);let h=0;for(let u=0;u<l;u++)h+=o[u];t.update(h,r,1)}}}function Im(s,e,t){let n;function i(y){if(y==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";y="mediump"}return y==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const r=typeof WebGL2RenderingContext<"u"&&s.constructor.name==="WebGL2RenderingContext";let a=t.precision!==void 0?t.precision:"highp";const o=i(a);o!==a&&(a=o);const l=r||e.has("WEBGL_draw_buffers"),c=t.logarithmicDepthBuffer===!0,h=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),u=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=s.getParameter(s.MAX_TEXTURE_SIZE),p=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),f=s.getParameter(s.MAX_VERTEX_ATTRIBS),g=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),m=s.getParameter(s.MAX_VARYING_VECTORS),_=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),x=u>0,v=r||e.has("OES_texture_float");return{isWebGL2:r,drawBuffers:l,getMaxAnisotropy:function(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const y=e.get("EXT_texture_filter_anisotropic");n=s.getParameter(y.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n},getMaxPrecision:i,precision:a,logarithmicDepthBuffer:c,maxTextures:h,maxVertexTextures:u,maxTextureSize:d,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:g,maxVaryings:m,maxFragmentUniforms:_,vertexTextures:x,floatFragmentTextures:v,floatVertexTextures:x&&v,maxSamples:r?s.getParameter(s.MAX_SAMPLES):0}}function Nm(s){const e=this;let t=null,n=0,i=!1,r=!1;const a=new rs,o=new lt,l={value:null,needsUpdate:!1};function c(h,u,d,p){const f=h!==null?h.length:0;let g=null;if(f!==0){if(g=l.value,p!==!0||g===null){const m=d+4*f,_=u.matrixWorldInverse;o.getNormalMatrix(_),(g===null||g.length<m)&&(g=new Float32Array(m));for(let x=0,v=d;x!==f;++x,v+=4)a.copy(h[x]).applyMatrix4(_,o),a.normal.toArray(g,v),g[v+3]=a.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=f,e.numIntersection=0,g}this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,u){const d=h.length!==0||u||n!==0||i;return i=u,n=h.length,d},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,u){t=c(h,u,0)},this.setState=function(h,u,d){const p=h.clippingPlanes,f=h.clipIntersection,g=h.clipShadows,m=s.get(h);if(!i||p===null||p.length===0||r&&!g)r?c(null):(function(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0})();else{const _=r?0:n,x=4*_;let v=m.clippingState||null;l.value=v,v=c(p,u,x,d);for(let y=0;y!==x;++y)v[y]=t[y];m.clippingState=v,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=_}}}function Dm(s){let e=new WeakMap;function t(i,r){return r===303?i.mapping=cr:r===304&&(i.mapping=hr),i}function n(i){const r=i.target;r.removeEventListener("dispose",n);const a=e.get(r);a!==void 0&&(e.delete(r),a.dispose())}return{get:function(i){if(i&&i.isTexture){const r=i.mapping;if(r===303||r===304){if(e.has(i))return t(e.get(i).texture,i.mapping);{const a=i.image;if(a&&a.height>0){const o=new Tm(a.height/2);return o.fromEquirectangularTexture(s,i),e.set(i,o),i.addEventListener("dispose",n),t(o.texture,i.mapping)}return null}}}return i},dispose:function(){e=new WeakMap}}}class $o extends Wd{constructor(e=-1,t=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Hh=[.125,.215,.35,.446,.526,.582],Ja=20,Bl=new $o,Gh=new Ue;let kl=null,zl=0,Vl=0;const as=(1+Math.sqrt(5))/2,ks=1/as,Wh=[new M(1,1,1),new M(-1,1,1),new M(1,1,-1),new M(-1,1,-1),new M(0,as,ks),new M(0,as,-ks),new M(ks,0,as),new M(-ks,0,as),new M(as,ks,0),new M(-as,ks,0)];class Xh{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){kl=this._renderer.getRenderTarget(),zl=this._renderer.getActiveCubeFace(),Vl=this._renderer.getActiveMipmapLevel(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=$h(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=jh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(kl,zl,Vl),e.scissorTest=!1,Qa(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===cr||e.mapping===hr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),kl=this._renderer.getRenderTarget(),zl=this._renderer.getActiveCubeFace(),Vl=this._renderer.getActiveMipmapLevel();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Bn,minFilter:Bn,generateMipmaps:!1,type:wi,format:li,colorSpace:en,depthBuffer:!1},i=qh(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=qh(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=(function(a){const o=[],l=[],c=[];let h=a;const u=a-4+1+Hh.length;for(let d=0;d<u;d++){const p=Math.pow(2,h);l.push(p);let f=1/p;d>a-4?f=Hh[d-a+4-1]:d===0&&(f=0),c.push(f);const g=1/(p-2),m=-g,_=1+g,x=[m,m,_,m,_,_,m,m,_,_,m,_],v=6,y=6,I=3,S=2,w=1,L=new Float32Array(I*y*v),b=new Float32Array(S*y*v),C=new Float32Array(w*y*v);for(let A=0;A<v;A++){const O=A%3*2/3-1,F=A>2?0:-1,j=[O,F,0,O+2/3,F,0,O+2/3,F+1,0,O,F,0,O+2/3,F+1,0,O,F+1,0];L.set(j,I*y*A),b.set(x,S*y*A);const J=[A,A,A,A,A,A];C.set(J,w*y*A)}const U=new rt;U.setAttribute("position",new st(L,I)),U.setAttribute("uv",new st(b,S)),U.setAttribute("faceIndex",new st(C,w)),o.push(U),h>4&&h--}return{lodPlanes:o,sizeLods:l,sigmas:c}})(r)),this._blurMaterial=(function(a,o,l){const c=new Float32Array(Ja),h=new M(0,1,0);return new Cn({name:"SphericalGaussianBlur",defines:{n:Ja,CUBEUV_TEXEL_WIDTH:1/o,CUBEUV_TEXEL_HEIGHT:1/l,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:c},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:h}},vertexShader:Gc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})})(r,e,t)}return i}_compileMaterial(e){const t=new ce(this._lodPlanes[0],e);this._renderer.compile(t,Bl)}_sceneToCubeUV(e,t,n,i){const r=new gn(90,1,t,n),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,h=l.toneMapping;l.getClearColor(Gh),l.toneMapping=0,l.autoClear=!1;const u=new Rn({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),d=new ce(new Ke,u);let p=!1;const f=e.background;f?f.isColor&&(u.color.copy(f),e.background=null,p=!0):(u.color.copy(Gh),p=!0);for(let g=0;g<6;g++){const m=g%3;m===0?(r.up.set(0,a[g],0),r.lookAt(o[g],0,0)):m===1?(r.up.set(0,0,a[g]),r.lookAt(0,o[g],0)):(r.up.set(0,a[g],0),r.lookAt(0,0,o[g]));const _=this._cubeSize;Qa(i,m*_,g>2?_:0,_,_),l.setRenderTarget(i),p&&l.render(d,r),l.render(e,r)}d.geometry.dispose(),d.material.dispose(),l.toneMapping=h,l.autoClear=c,e.background=f}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===cr||e.mapping===hr;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=$h()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=jh());const r=i?this._cubemapMaterial:this._equirectMaterial,a=new ce(this._lodPlanes[0],r);r.uniforms.envMap.value=e;const o=this._cubeSize;Qa(t,0,0,3*o,2*o),n.setRenderTarget(t),n.render(a,Bl)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){const r=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),a=Wh[(i-1)%Wh.length];this._blur(e,i-1,i,r,a)}t.autoClear=n}_blur(e,t,n,i,r){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,i,"latitudinal",r),this._halfBlur(a,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,a,o){const l=this._renderer,c=this._blurMaterial,h=new ce(this._lodPlanes[i],c),u=c.uniforms,d=this._sizeLods[n]-1,p=isFinite(r)?Math.PI/(2*d):2*Math.PI/39,f=r/p,g=isFinite(r)?1+Math.floor(3*f):Ja,m=[];let _=0;for(let y=0;y<Ja;++y){const I=y/f,S=Math.exp(-I*I/2);m.push(S),y===0?_+=S:y<g&&(_+=2*S)}for(let y=0;y<m.length;y++)m[y]=m[y]/_;u.envMap.value=e.texture,u.samples.value=g,u.weights.value=m,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:x}=this;u.dTheta.value=p,u.mipInt.value=x-n;const v=this._sizeLods[i];Qa(t,3*v*(i>x-4?i-x+4:0),4*(this._cubeSize-v),3*v,2*v),l.setRenderTarget(t),l.render(h,Bl)}}function qh(s,e,t){const n=new Yn(s,e,t);return n.texture.mapping=Xo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Qa(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function jh(){return new Cn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Gc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function $h(){return new Cn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Gc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Gc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Um(s){let e=new WeakMap,t=null;function n(i){const r=i.target;r.removeEventListener("dispose",n);const a=e.get(r);a!==void 0&&(e.delete(r),a.dispose())}return{get:function(i){if(i&&i.isTexture){const r=i.mapping,a=r===303||r===304,o=r===cr||r===hr;if(a||o){if(i.isRenderTargetTexture&&i.needsPMREMUpdate===!0){i.needsPMREMUpdate=!1;let l=e.get(i);return t===null&&(t=new Xh(s)),l=a?t.fromEquirectangular(i,l):t.fromCubemap(i,l),e.set(i,l),l.texture}if(e.has(i))return e.get(i).texture;{const l=i.image;if(a&&l&&l.height>0||o&&l&&(function(c){let h=0;const u=6;for(let d=0;d<u;d++)c[d]!==void 0&&h++;return h===u})(l)){t===null&&(t=new Xh(s));const c=a?t.fromEquirectangular(i):t.fromCubemap(i);return e.set(i,c),i.addEventListener("dispose",n),c.texture}return null}}}return i},dispose:function(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}}}function Om(s){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){return t(n)}}}function Fm(s,e,t,n){const i={},r=new WeakMap;function a(l){const c=l.target;c.index!==null&&e.remove(c.index);for(const u in c.attributes)e.remove(c.attributes[u]);for(const u in c.morphAttributes){const d=c.morphAttributes[u];for(let p=0,f=d.length;p<f;p++)e.remove(d[p])}c.removeEventListener("dispose",a),delete i[c.id];const h=r.get(c);h&&(e.remove(h),r.delete(c)),n.releaseStatesOfGeometry(c),c.isInstancedBufferGeometry===!0&&delete c._maxInstanceCount,t.memory.geometries--}function o(l){const c=[],h=l.index,u=l.attributes.position;let d=0;if(h!==null){const g=h.array;d=h.version;for(let m=0,_=g.length;m<_;m+=3){const x=g[m+0],v=g[m+1],y=g[m+2];c.push(x,v,v,y,y,x)}}else{if(u===void 0)return;{const g=u.array;d=u.version;for(let m=0,_=g.length/3-1;m<_;m+=3){const x=m+0,v=m+1,y=m+2;c.push(x,v,v,y,y,x)}}}const p=new(Ld(c)?Vd:zd)(c,1);p.version=d;const f=r.get(l);f&&e.remove(f),r.set(l,p)}return{get:function(l,c){return i[c.id]===!0||(c.addEventListener("dispose",a),i[c.id]=!0,t.memory.geometries++),c},update:function(l){const c=l.attributes;for(const u in c)e.update(c[u],s.ARRAY_BUFFER);const h=l.morphAttributes;for(const u in h){const d=h[u];for(let p=0,f=d.length;p<f;p++)e.update(d[p],s.ARRAY_BUFFER)}},getWireframeAttribute:function(l){const c=r.get(l);if(c){const h=l.index;h!==null&&c.version<h.version&&o(l)}else o(l);return r.get(l)}}}function Bm(s,e,t,n){const i=n.isWebGL2;let r,a,o;this.setMode=function(l){r=l},this.setIndex=function(l){a=l.type,o=l.bytesPerElement},this.render=function(l,c){s.drawElements(r,c,a,l*o),t.update(c,r,1)},this.renderInstances=function(l,c,h){if(h===0)return;let u,d;if(i)u=s,d="drawElementsInstanced";else if(u=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",u===null)return;u[d](r,c,a,l*o,h),t.update(c,r,h)},this.renderMultiDraw=function(l,c,h){if(h===0)return;const u=e.get("WEBGL_multi_draw");if(u===null)for(let d=0;d<h;d++)this.render(l[d]/o,c[d]);else{u.multiDrawElementsWEBGL(r,c,0,a,l,0,h);let d=0;for(let p=0;p<h;p++)d+=c[p];t.update(d,r,1)}}}function km(s){const e={frame:0,calls:0,triangles:0,points:0,lines:0};return{memory:{geometries:0,textures:0},render:e,programs:null,autoReset:!0,reset:function(){e.calls=0,e.triangles=0,e.points=0,e.lines=0},update:function(t,n,i){switch(e.calls++,n){case s.TRIANGLES:e.triangles+=i*(t/3);break;case s.LINES:e.lines+=i*(t/2);break;case s.LINE_STRIP:e.lines+=i*(t-1);break;case s.LINE_LOOP:e.lines+=i*t;break;case s.POINTS:e.points+=i*t}}}}function zm(s,e){return s[0]-e[0]}function Vm(s,e){return Math.abs(e[1])-Math.abs(s[1])}function Hm(s,e,t){const n={},i=new Float32Array(8),r=new WeakMap,a=new Pt,o=[];for(let l=0;l<8;l++)o[l]=[l,0];return{update:function(l,c,h){const u=l.morphTargetInfluences;if(e.isWebGL2===!0){const d=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,p=d!==void 0?d.length:0;let f=r.get(c);if(f===void 0||f.count!==p){let _=function(){A.dispose(),r.delete(c),c.removeEventListener("dispose",_)};f!==void 0&&f.texture.dispose();const x=c.morphAttributes.position!==void 0,v=c.morphAttributes.normal!==void 0,y=c.morphAttributes.color!==void 0,I=c.morphAttributes.position||[],S=c.morphAttributes.normal||[],w=c.morphAttributes.color||[];let L=0;x===!0&&(L=1),v===!0&&(L=2),y===!0&&(L=3);let b=c.attributes.position.count*L,C=1;b>e.maxTextureSize&&(C=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);const U=new Float32Array(b*C*4*p),A=new Ud(U,b,C,p);A.type=$i,A.needsUpdate=!0;const O=4*L;for(let F=0;F<p;F++){const j=I[F],J=S[F],W=w[F],k=b*C*4*F;for(let $=0;$<j.count;$++){const N=$*O;x===!0&&(a.fromBufferAttribute(j,$),U[k+N+0]=a.x,U[k+N+1]=a.y,U[k+N+2]=a.z,U[k+N+3]=0),v===!0&&(a.fromBufferAttribute(J,$),U[k+N+4]=a.x,U[k+N+5]=a.y,U[k+N+6]=a.z,U[k+N+7]=0),y===!0&&(a.fromBufferAttribute(W,$),U[k+N+8]=a.x,U[k+N+9]=a.y,U[k+N+10]=a.z,U[k+N+11]=W.itemSize===4?a.w:1)}}f={count:p,texture:A,size:new xe(b,C)},r.set(c,f),c.addEventListener("dispose",_)}let g=0;for(let _=0;_<u.length;_++)g+=u[_];const m=c.morphTargetsRelative?1:1-g;h.getUniforms().setValue(s,"morphTargetBaseInfluence",m),h.getUniforms().setValue(s,"morphTargetInfluences",u),h.getUniforms().setValue(s,"morphTargetsTexture",f.texture,t),h.getUniforms().setValue(s,"morphTargetsTextureSize",f.size)}else{const d=u===void 0?0:u.length;let p=n[c.id];if(p===void 0||p.length!==d){p=[];for(let x=0;x<d;x++)p[x]=[x,0];n[c.id]=p}for(let x=0;x<d;x++){const v=p[x];v[0]=x,v[1]=u[x]}p.sort(Vm);for(let x=0;x<8;x++)x<d&&p[x][1]?(o[x][0]=p[x][0],o[x][1]=p[x][1]):(o[x][0]=Number.MAX_SAFE_INTEGER,o[x][1]=0);o.sort(zm);const f=c.morphAttributes.position,g=c.morphAttributes.normal;let m=0;for(let x=0;x<8;x++){const v=o[x],y=v[0],I=v[1];y!==Number.MAX_SAFE_INTEGER&&I?(f&&c.getAttribute("morphTarget"+x)!==f[y]&&c.setAttribute("morphTarget"+x,f[y]),g&&c.getAttribute("morphNormal"+x)!==g[y]&&c.setAttribute("morphNormal"+x,g[y]),i[x]=I,m+=I):(f&&c.hasAttribute("morphTarget"+x)===!0&&c.deleteAttribute("morphTarget"+x),g&&c.hasAttribute("morphNormal"+x)===!0&&c.deleteAttribute("morphNormal"+x),i[x]=0)}const _=c.morphTargetsRelative?1:1-m;h.getUniforms().setValue(s,"morphTargetBaseInfluence",_),h.getUniforms().setValue(s,"morphTargetInfluences",i)}}}}function Gm(s,e,t,n){let i=new WeakMap;function r(a){const o=a.target;o.removeEventListener("dispose",r),t.remove(o.instanceMatrix),o.instanceColor!==null&&t.remove(o.instanceColor)}return{update:function(a){const o=n.render.frame,l=a.geometry,c=e.get(a,l);if(i.get(c)!==o&&(e.update(c),i.set(c,o)),a.isInstancedMesh&&(a.hasEventListener("dispose",r)===!1&&a.addEventListener("dispose",r),i.get(a)!==o&&(t.update(a.instanceMatrix,s.ARRAY_BUFFER),a.instanceColor!==null&&t.update(a.instanceColor,s.ARRAY_BUFFER),i.set(a,o))),a.isSkinnedMesh){const h=a.skeleton;i.get(h)!==o&&(h.update(),i.set(h,o))}return c},dispose:function(){i=new WeakMap}}}class jd extends Mn{constructor(e,t,n,i,r,a,o,l,c,h){if((h=h!==void 0?h:hs)!==hs&&h!==dr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===hs&&(n=Wi),n===void 0&&h===dr&&(n=cs),super(null,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:on,this.minFilter=l!==void 0?l:on,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const $d=new Mn,Yd=new jd(1,1);Yd.compareFunction=515;const Kd=new Ud,Zd=new pm,Jd=new Xd,Yh=[],Kh=[],Zh=new Float32Array(16),Jh=new Float32Array(9),Qh=new Float32Array(4);function Sr(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=Yh[i];if(r===void 0&&(r=new Float32Array(i),Yh[i]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,s[a].toArray(r,o)}return r}function qt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function jt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Yo(s,e){let t=Kh[e];t===void 0&&(t=new Int32Array(e),Kh[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function Wm(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function Xm(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(qt(t,e))return;s.uniform2fv(this.addr,e),jt(t,e)}}function qm(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)t[0]===e.r&&t[1]===e.g&&t[2]===e.b||(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(qt(t,e))return;s.uniform3fv(this.addr,e),jt(t,e)}}function jm(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(qt(t,e))return;s.uniform4fv(this.addr,e),jt(t,e)}}function $m(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(qt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),jt(t,e)}else{if(qt(t,n))return;Qh.set(n),s.uniformMatrix2fv(this.addr,!1,Qh),jt(t,n)}}function Ym(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(qt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),jt(t,e)}else{if(qt(t,n))return;Jh.set(n),s.uniformMatrix3fv(this.addr,!1,Jh),jt(t,n)}}function Km(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(qt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),jt(t,e)}else{if(qt(t,n))return;Zh.set(n),s.uniformMatrix4fv(this.addr,!1,Zh),jt(t,n)}}function Zm(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function Jm(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(qt(t,e))return;s.uniform2iv(this.addr,e),jt(t,e)}}function Qm(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(qt(t,e))return;s.uniform3iv(this.addr,e),jt(t,e)}}function eg(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(qt(t,e))return;s.uniform4iv(this.addr,e),jt(t,e)}}function tg(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function ng(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(qt(t,e))return;s.uniform2uiv(this.addr,e),jt(t,e)}}function ig(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(qt(t,e))return;s.uniform3uiv(this.addr,e),jt(t,e)}}function sg(s,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(qt(t,e))return;s.uniform4uiv(this.addr,e),jt(t,e)}}function rg(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);const r=this.type===s.SAMPLER_2D_SHADOW?Yd:$d;t.setTexture2D(e||r,i)}function ag(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Zd,i)}function og(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Jd,i)}function lg(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Kd,i)}function cg(s,e){s.uniform1fv(this.addr,e)}function hg(s,e){const t=Sr(e,this.size,2);s.uniform2fv(this.addr,t)}function ug(s,e){const t=Sr(e,this.size,3);s.uniform3fv(this.addr,t)}function dg(s,e){const t=Sr(e,this.size,4);s.uniform4fv(this.addr,t)}function pg(s,e){const t=Sr(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function fg(s,e){const t=Sr(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function mg(s,e){const t=Sr(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function gg(s,e){s.uniform1iv(this.addr,e)}function vg(s,e){s.uniform2iv(this.addr,e)}function xg(s,e){s.uniform3iv(this.addr,e)}function _g(s,e){s.uniform4iv(this.addr,e)}function yg(s,e){s.uniform1uiv(this.addr,e)}function bg(s,e){s.uniform2uiv(this.addr,e)}function Mg(s,e){s.uniform3uiv(this.addr,e)}function Sg(s,e){s.uniform4uiv(this.addr,e)}function wg(s,e,t){const n=this.cache,i=e.length,r=Yo(t,i);qt(n,r)||(s.uniform1iv(this.addr,r),jt(n,r));for(let a=0;a!==i;++a)t.setTexture2D(e[a]||$d,r[a])}function Tg(s,e,t){const n=this.cache,i=e.length,r=Yo(t,i);qt(n,r)||(s.uniform1iv(this.addr,r),jt(n,r));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||Zd,r[a])}function Ag(s,e,t){const n=this.cache,i=e.length,r=Yo(t,i);qt(n,r)||(s.uniform1iv(this.addr,r),jt(n,r));for(let a=0;a!==i;++a)t.setTextureCube(e[a]||Jd,r[a])}function Eg(s,e,t){const n=this.cache,i=e.length,r=Yo(t,i);qt(n,r)||(s.uniform1iv(this.addr,r),jt(n,r));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||Kd,r[a])}class Rg{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=(function(i){switch(i){case 5126:return Wm;case 35664:return Xm;case 35665:return qm;case 35666:return jm;case 35674:return $m;case 35675:return Ym;case 35676:return Km;case 5124:case 35670:return Zm;case 35667:case 35671:return Jm;case 35668:case 35672:return Qm;case 35669:case 35673:return eg;case 5125:return tg;case 36294:return ng;case 36295:return ig;case 36296:return sg;case 35678:case 36198:case 36298:case 36306:case 35682:return rg;case 35679:case 36299:case 36307:return ag;case 35680:case 36300:case 36308:case 36293:return og;case 36289:case 36303:case 36311:case 36292:return lg}})(t.type)}}class Cg{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=(function(i){switch(i){case 5126:return cg;case 35664:return hg;case 35665:return ug;case 35666:return dg;case 35674:return pg;case 35675:return fg;case 35676:return mg;case 5124:case 35670:return gg;case 35667:case 35671:return vg;case 35668:case 35672:return xg;case 35669:case 35673:return _g;case 5125:return yg;case 36294:return bg;case 36295:return Mg;case 36296:return Sg;case 35678:case 36198:case 36298:case 36306:case 35682:return wg;case 35679:case 36299:case 36307:return Tg;case 35680:case 36300:case 36308:case 36293:return Ag;case 36289:case 36303:case 36311:case 36292:return Eg}})(t.type)}}class Pg{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,a=i.length;r!==a;++r){const o=i[r];o.setValue(e,t[o.id],n)}}}const Hl=/(\w+)(\])?(\[|\.)?/g;function eu(s,e){s.seq.push(e),s.map[e.id]=e}function Lg(s,e,t){const n=s.name,i=n.length;for(Hl.lastIndex=0;;){const r=Hl.exec(n),a=Hl.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o|=0),c===void 0||c==="["&&a+2===i){eu(t,c===void 0?new Rg(o,s,e):new Cg(o,s,e));break}{let h=t.map[o];h===void 0&&(h=new Pg(o),eu(t,h)),t=h}}}class Eo{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const r=e.getActiveUniform(t,i);Lg(r,e.getUniformLocation(t,r.name),this)}}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,a=t.length;r!==a;++r){const o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const a=e[i];a.id in t&&n.push(a)}return n}}function tu(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}let Ig=0;function nu(s,e,t){const n=s.getShaderParameter(e,s.COMPILE_STATUS),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const a=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+(function(o,l){const c=o.split(`
`),h=[],u=Math.max(l-6,0),d=Math.min(l+6,c.length);for(let p=u;p<d;p++){const f=p+1;h.push(`${f===l?">":" "} ${f}: ${c[p]}`)}return h.join(`
`)})(s.getShaderSource(e),a)}return i}function Ng(s,e){const t=(function(n){const i=_t.getPrimaries(_t.workingColorSpace),r=_t.getPrimaries(n);let a;switch(i===r?a="":i===Uo&&r===Do?a="LinearDisplayP3ToLinearSRGB":i===Do&&r===Uo&&(a="LinearSRGBToLinearDisplayP3"),n){case en:case qo:return[a,"LinearTransferOETF"];case Ut:case Vc:return[a,"sRGBTransferOETF"];default:return[a,"LinearTransferOETF"]}})(e);return`vec4 ${s}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Dg(s,e){let t;switch(e){case 1:default:t="Linear";break;case 2:t="Reinhard";break;case 3:t="OptimizedCineon";break;case 4:t="ACESFilmic";break;case 6:t="AgX";break;case 5:t="Custom"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function zs(s){return s!==""}function iu(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function su(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Ug=/^[ \t]*#include +<([\w\d./]+)>/gm;function _c(s){return s.replace(Ug,Fg)}const Og=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function Fg(s,e){let t=tt[e];if(t===void 0){const n=Og.get(e);if(n===void 0)throw new Error("Can not resolve #include <"+e+">");t=tt[n]}return _c(t)}const Bg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ru(s){return s.replace(Bg,kg)}function kg(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function au(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function zg(s,e,t,n){const i=s.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=(function(A){let O="SHADOWMAP_TYPE_BASIC";return A.shadowMapType===1?O="SHADOWMAP_TYPE_PCF":A.shadowMapType===2?O="SHADOWMAP_TYPE_PCF_SOFT":A.shadowMapType===3&&(O="SHADOWMAP_TYPE_VSM"),O})(t),c=(function(A){let O="ENVMAP_TYPE_CUBE";if(A.envMap)switch(A.envMapMode){case cr:case hr:O="ENVMAP_TYPE_CUBE";break;case Xo:O="ENVMAP_TYPE_CUBE_UV"}return O})(t),h=(function(A){let O="ENVMAP_MODE_REFLECTION";return A.envMap&&A.envMapMode===hr&&(O="ENVMAP_MODE_REFRACTION"),O})(t),u=(function(A){let O="ENVMAP_BLENDING_NONE";if(A.envMap)switch(A.combine){case 0:O="ENVMAP_BLENDING_MULTIPLY";break;case 1:O="ENVMAP_BLENDING_MIX";break;case 2:O="ENVMAP_BLENDING_ADD"}return O})(t),d=(function(A){const O=A.envMapCubeUVHeight;if(O===null)return null;const F=Math.log2(O)-2,j=1/O;return{texelWidth:1/(3*Math.max(Math.pow(2,F),112)),texelHeight:j,maxMip:F}})(t),p=t.isWebGL2?"":(function(A){return[A.extensionDerivatives||A.envMapCubeUVHeight||A.bumpMap||A.normalMapTangentSpace||A.clearcoatNormalMap||A.flatShading||A.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(A.extensionFragDepth||A.logarithmicDepthBuffer)&&A.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",A.extensionDrawBuffers&&A.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(A.extensionShaderTextureLOD||A.envMap||A.transmission)&&A.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(zs).join(`
`)})(t),f=(function(A){return[A.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(zs).join(`
`)})(t),g=(function(A){const O=[];for(const F in A){const j=A[F];j!==!1&&O.push("#define "+F+" "+j)}return O.join(`
`)})(r),m=i.createProgram();let _,x,v=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(_=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(zs).join(`
`),_.length>0&&(_+=`
`),x=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(zs).join(`
`),x.length>0&&(x+=`
`)):(_=[au(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(zs).join(`
`),x=[p,au(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?tt.tonemapping_pars_fragment:"",t.toneMapping!==0?Dg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",tt.colorspace_pars_fragment,Ng("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(zs).join(`
`)),a=_c(a),a=iu(a,t),a=su(a,t),o=_c(o),o=iu(o,t),o=su(o,t),a=ru(a),o=ru(o),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,_=[f,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,x=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===wh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===wh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+x);const y=v+_+a,I=v+x+o,S=tu(i,i.VERTEX_SHADER,y),w=tu(i,i.FRAGMENT_SHADER,I);function L(A){if(s.debug.checkShaderErrors){const O=i.getProgramInfoLog(m).trim(),F=i.getShaderInfoLog(S).trim(),j=i.getShaderInfoLog(w).trim();let J=!0,W=!0;i.getProgramParameter(m,i.LINK_STATUS)===!1?(J=!1,typeof s.debug.onShaderError=="function"?s.debug.onShaderError(i,m,S,w):(nu(i,S,"vertex"),nu(i,w,"fragment"))):O!==""||F!==""&&j!==""||(W=!1),W&&(A.diagnostics={runnable:J,programLog:O,vertexShader:{log:F,prefix:_},fragmentShader:{log:j,prefix:x}})}i.deleteShader(S),i.deleteShader(w),b=new Eo(i,m),C=(function(O,F){const j={},J=O.getProgramParameter(F,O.ACTIVE_ATTRIBUTES);for(let W=0;W<J;W++){const k=O.getActiveAttrib(F,W),$=k.name;let N=1;k.type===O.FLOAT_MAT2&&(N=2),k.type===O.FLOAT_MAT3&&(N=3),k.type===O.FLOAT_MAT4&&(N=4),j[$]={type:k.type,location:O.getAttribLocation(F,$),locationSize:N}}return j})(i,m)}let b,C;i.attachShader(m,S),i.attachShader(m,w),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m),this.getUniforms=function(){return b===void 0&&L(this),b},this.getAttributes=function(){return C===void 0&&L(this),C};let U=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=i.getProgramParameter(m,37297)),U},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Ig++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=S,this.fragmentShader=w,this}let Vg=0;class Hg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Gg(e),t.set(e,n)),n}}class Gg{constructor(e){this.id=Vg++,this.code=e,this.usedTimes=0}}function Wg(s,e,t,n,i,r,a){const o=new Bd,l=new Hg,c=[],h=i.isWebGL2,u=i.logarithmicDepthBuffer,d=i.vertexTextures;let p=i.precision;const f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(m){return m===0?"uv":`uv${m}`}return{getParameters:function(m,_,x,v,y){const I=v.fog,S=y.geometry,w=m.isMeshStandardMaterial?v.environment:null,L=(m.isMeshStandardMaterial?t:e).get(m.envMap||w),b=L&&L.mapping===Xo?L.image.height:null,C=f[m.type];m.precision!==null&&(p=i.getMaxPrecision(m.precision),m.precision);const U=S.morphAttributes.position||S.morphAttributes.normal||S.morphAttributes.color,A=U!==void 0?U.length:0;let O,F,j,J,W=0;if(S.morphAttributes.position!==void 0&&(W=1),S.morphAttributes.normal!==void 0&&(W=2),S.morphAttributes.color!==void 0&&(W=3),C){const Ft=ni[C];O=Ft.vertexShader,F=Ft.fragmentShader}else O=m.vertexShader,F=m.fragmentShader,l.update(m),j=l.getVertexShaderID(m),J=l.getFragmentShaderID(m);const k=s.getRenderTarget(),$=y.isInstancedMesh===!0,N=y.isBatchedMesh===!0,Q=!!m.map,ve=!!m.matcap,R=!!L,T=!!m.aoMap,G=!!m.lightMap,Z=!!m.bumpMap,D=!!m.normalMap,K=!!m.displacementMap,B=!!m.emissiveMap,V=!!m.metalnessMap,q=!!m.roughnessMap,oe=m.anisotropy>0,ae=m.clearcoat>0,E=m.iridescence>0,Y=m.sheen>0,z=m.transmission>0,H=oe&&!!m.anisotropyMap,he=ae&&!!m.clearcoatMap,fe=ae&&!!m.clearcoatNormalMap,Se=ae&&!!m.clearcoatRoughnessMap,Ee=E&&!!m.iridescenceMap,De=E&&!!m.iridescenceThicknessMap,Te=Y&&!!m.sheenColorMap,Ae=Y&&!!m.sheenRoughnessMap,$e=!!m.specularMap,ht=!!m.specularColorMap,Re=!!m.specularIntensityMap,et=z&&!!m.transmissionMap,Ze=z&&!!m.thicknessMap,zt=!!m.gradientMap,Zn=!!m.alphaMap,Ci=m.alphaTest>0,tn=!!m.alphaHash,it=!!m.extensions,Pn=!!S.attributes.uv1,ne=!!S.attributes.uv2,Vn=!!S.attributes.uv3;let cn=0;return m.toneMapped&&(k!==null&&k.isXRRenderTarget!==!0||(cn=s.toneMapping)),{isWebGL2:h,shaderID:C,shaderType:m.type,shaderName:m.name,vertexShader:O,fragmentShader:F,defines:m.defines,customVertexShaderID:j,customFragmentShaderID:J,isRawShaderMaterial:m.isRawShaderMaterial===!0,glslVersion:m.glslVersion,precision:p,batching:N,instancing:$,instancingColor:$&&y.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:k===null?s.outputColorSpace:k.isXRRenderTarget===!0?k.texture.colorSpace:en,map:Q,matcap:ve,envMap:R,envMapMode:R&&L.mapping,envMapCubeUVHeight:b,aoMap:T,lightMap:G,bumpMap:Z,normalMap:D,displacementMap:d&&K,emissiveMap:B,normalMapObjectSpace:D&&m.normalMapType===1,normalMapTangentSpace:D&&m.normalMapType===0,metalnessMap:V,roughnessMap:q,anisotropy:oe,anisotropyMap:H,clearcoat:ae,clearcoatMap:he,clearcoatNormalMap:fe,clearcoatRoughnessMap:Se,iridescence:E,iridescenceMap:Ee,iridescenceThicknessMap:De,sheen:Y,sheenColorMap:Te,sheenRoughnessMap:Ae,specularMap:$e,specularColorMap:ht,specularIntensityMap:Re,transmission:z,transmissionMap:et,thicknessMap:Ze,gradientMap:zt,opaque:m.transparent===!1&&m.blending===1,alphaMap:Zn,alphaTest:Ci,alphaHash:tn,combine:m.combine,mapUv:Q&&g(m.map.channel),aoMapUv:T&&g(m.aoMap.channel),lightMapUv:G&&g(m.lightMap.channel),bumpMapUv:Z&&g(m.bumpMap.channel),normalMapUv:D&&g(m.normalMap.channel),displacementMapUv:K&&g(m.displacementMap.channel),emissiveMapUv:B&&g(m.emissiveMap.channel),metalnessMapUv:V&&g(m.metalnessMap.channel),roughnessMapUv:q&&g(m.roughnessMap.channel),anisotropyMapUv:H&&g(m.anisotropyMap.channel),clearcoatMapUv:he&&g(m.clearcoatMap.channel),clearcoatNormalMapUv:fe&&g(m.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Se&&g(m.clearcoatRoughnessMap.channel),iridescenceMapUv:Ee&&g(m.iridescenceMap.channel),iridescenceThicknessMapUv:De&&g(m.iridescenceThicknessMap.channel),sheenColorMapUv:Te&&g(m.sheenColorMap.channel),sheenRoughnessMapUv:Ae&&g(m.sheenRoughnessMap.channel),specularMapUv:$e&&g(m.specularMap.channel),specularColorMapUv:ht&&g(m.specularColorMap.channel),specularIntensityMapUv:Re&&g(m.specularIntensityMap.channel),transmissionMapUv:et&&g(m.transmissionMap.channel),thicknessMapUv:Ze&&g(m.thicknessMap.channel),alphaMapUv:Zn&&g(m.alphaMap.channel),vertexTangents:!!S.attributes.tangent&&(D||oe),vertexColors:m.vertexColors,vertexAlphas:m.vertexColors===!0&&!!S.attributes.color&&S.attributes.color.itemSize===4,vertexUv1s:Pn,vertexUv2s:ne,vertexUv3s:Vn,pointsUvs:y.isPoints===!0&&!!S.attributes.uv&&(Q||Zn),fog:!!I,useFog:m.fog===!0,fogExp2:I&&I.isFogExp2,flatShading:m.flatShading===!0,sizeAttenuation:m.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:y.isSkinnedMesh===!0,morphTargets:S.morphAttributes.position!==void 0,morphNormals:S.morphAttributes.normal!==void 0,morphColors:S.morphAttributes.color!==void 0,morphTargetsCount:A,morphTextureStride:W,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:m.dithering,shadowMapEnabled:s.shadowMap.enabled&&x.length>0,shadowMapType:s.shadowMap.type,toneMapping:cn,useLegacyLights:s._useLegacyLights,decodeVideoTexture:Q&&m.map.isVideoTexture===!0&&_t.getTransfer(m.map.colorSpace)===Ct,premultipliedAlpha:m.premultipliedAlpha,doubleSided:m.side===2,flipSided:m.side===1,useDepthPacking:m.depthPacking>=0,depthPacking:m.depthPacking||0,index0AttributeName:m.index0AttributeName,extensionDerivatives:it&&m.extensions.derivatives===!0,extensionFragDepth:it&&m.extensions.fragDepth===!0,extensionDrawBuffers:it&&m.extensions.drawBuffers===!0,extensionShaderTextureLOD:it&&m.extensions.shaderTextureLOD===!0,extensionClipCullDistance:it&&m.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:m.customProgramCacheKey()}},getProgramCacheKey:function(m){const _=[];if(m.shaderID?_.push(m.shaderID):(_.push(m.customVertexShaderID),_.push(m.customFragmentShaderID)),m.defines!==void 0)for(const x in m.defines)_.push(x),_.push(m.defines[x]);return m.isRawShaderMaterial===!1&&((function(x,v){x.push(v.precision),x.push(v.outputColorSpace),x.push(v.envMapMode),x.push(v.envMapCubeUVHeight),x.push(v.mapUv),x.push(v.alphaMapUv),x.push(v.lightMapUv),x.push(v.aoMapUv),x.push(v.bumpMapUv),x.push(v.normalMapUv),x.push(v.displacementMapUv),x.push(v.emissiveMapUv),x.push(v.metalnessMapUv),x.push(v.roughnessMapUv),x.push(v.anisotropyMapUv),x.push(v.clearcoatMapUv),x.push(v.clearcoatNormalMapUv),x.push(v.clearcoatRoughnessMapUv),x.push(v.iridescenceMapUv),x.push(v.iridescenceThicknessMapUv),x.push(v.sheenColorMapUv),x.push(v.sheenRoughnessMapUv),x.push(v.specularMapUv),x.push(v.specularColorMapUv),x.push(v.specularIntensityMapUv),x.push(v.transmissionMapUv),x.push(v.thicknessMapUv),x.push(v.combine),x.push(v.fogExp2),x.push(v.sizeAttenuation),x.push(v.morphTargetsCount),x.push(v.morphAttributeCount),x.push(v.numDirLights),x.push(v.numPointLights),x.push(v.numSpotLights),x.push(v.numSpotLightMaps),x.push(v.numHemiLights),x.push(v.numRectAreaLights),x.push(v.numDirLightShadows),x.push(v.numPointLightShadows),x.push(v.numSpotLightShadows),x.push(v.numSpotLightShadowsWithMaps),x.push(v.numLightProbes),x.push(v.shadowMapType),x.push(v.toneMapping),x.push(v.numClippingPlanes),x.push(v.numClipIntersection),x.push(v.depthPacking)})(_,m),(function(x,v){o.disableAll(),v.isWebGL2&&o.enable(0),v.supportsVertexTextures&&o.enable(1),v.instancing&&o.enable(2),v.instancingColor&&o.enable(3),v.matcap&&o.enable(4),v.envMap&&o.enable(5),v.normalMapObjectSpace&&o.enable(6),v.normalMapTangentSpace&&o.enable(7),v.clearcoat&&o.enable(8),v.iridescence&&o.enable(9),v.alphaTest&&o.enable(10),v.vertexColors&&o.enable(11),v.vertexAlphas&&o.enable(12),v.vertexUv1s&&o.enable(13),v.vertexUv2s&&o.enable(14),v.vertexUv3s&&o.enable(15),v.vertexTangents&&o.enable(16),v.anisotropy&&o.enable(17),v.alphaHash&&o.enable(18),v.batching&&o.enable(19),x.push(o.mask),o.disableAll(),v.fog&&o.enable(0),v.useFog&&o.enable(1),v.flatShading&&o.enable(2),v.logarithmicDepthBuffer&&o.enable(3),v.skinning&&o.enable(4),v.morphTargets&&o.enable(5),v.morphNormals&&o.enable(6),v.morphColors&&o.enable(7),v.premultipliedAlpha&&o.enable(8),v.shadowMapEnabled&&o.enable(9),v.useLegacyLights&&o.enable(10),v.doubleSided&&o.enable(11),v.flipSided&&o.enable(12),v.useDepthPacking&&o.enable(13),v.dithering&&o.enable(14),v.transmission&&o.enable(15),v.sheen&&o.enable(16),v.opaque&&o.enable(17),v.pointsUvs&&o.enable(18),v.decodeVideoTexture&&o.enable(19),x.push(o.mask)})(_,m),_.push(s.outputColorSpace)),_.push(m.customProgramCacheKey),_.join()},getUniforms:function(m){const _=f[m.type];let x;if(_){const v=ni[_];x=Bo.clone(v.uniforms)}else x=m.uniforms;return x},acquireProgram:function(m,_){let x;for(let v=0,y=c.length;v<y;v++){const I=c[v];if(I.cacheKey===_){x=I,++x.usedTimes;break}}return x===void 0&&(x=new zg(s,_,m,r),c.push(x)),x},releaseProgram:function(m){if(--m.usedTimes===0){const _=c.indexOf(m);c[_]=c[c.length-1],c.pop(),m.destroy()}},releaseShaderCache:function(m){l.remove(m)},programs:c,dispose:function(){l.dispose()}}}function Xg(){let s=new WeakMap;return{get:function(e){let t=s.get(e);return t===void 0&&(t={},s.set(e,t)),t},remove:function(e){s.delete(e)},update:function(e,t,n){s.get(e)[t]=n},dispose:function(){s=new WeakMap}}}function qg(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function ou(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function lu(){const s=[];let e=0;const t=[],n=[],i=[];function r(a,o,l,c,h,u){let d=s[e];return d===void 0?(d={id:a.id,object:a,geometry:o,material:l,groupOrder:c,renderOrder:a.renderOrder,z:h,group:u},s[e]=d):(d.id=a.id,d.object=a,d.geometry=o,d.material=l,d.groupOrder=c,d.renderOrder=a.renderOrder,d.z=h,d.group=u),e++,d}return{opaque:t,transmissive:n,transparent:i,init:function(){e=0,t.length=0,n.length=0,i.length=0},push:function(a,o,l,c,h,u){const d=r(a,o,l,c,h,u);l.transmission>0?n.push(d):l.transparent===!0?i.push(d):t.push(d)},unshift:function(a,o,l,c,h,u){const d=r(a,o,l,c,h,u);l.transmission>0?n.unshift(d):l.transparent===!0?i.unshift(d):t.unshift(d)},finish:function(){for(let a=e,o=s.length;a<o;a++){const l=s[a];if(l.id===null)break;l.id=null,l.object=null,l.geometry=null,l.material=null,l.group=null}},sort:function(a,o){t.length>1&&t.sort(a||qg),n.length>1&&n.sort(o||ou),i.length>1&&i.sort(o||ou)}}}function jg(){let s=new WeakMap;return{get:function(e,t){const n=s.get(e);let i;return n===void 0?(i=new lu,s.set(e,[i])):t>=n.length?(i=new lu,n.push(i)):i=n[t],i},dispose:function(){s=new WeakMap}}}function $g(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new M,color:new Ue};break;case"SpotLight":t={position:new M,direction:new M,color:new Ue,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new M,color:new Ue,distance:0,decay:0};break;case"HemisphereLight":t={direction:new M,skyColor:new Ue,groundColor:new Ue};break;case"RectAreaLight":t={color:new Ue,position:new M,halfWidth:new M,halfHeight:new M}}return s[e.id]=t,t}}}let Yg=0;function Kg(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function Zg(s,e){const t=new $g,n=(function(){const l={};return{get:function(c){if(l[c.id]!==void 0)return l[c.id];let h;switch(c.type){case"DirectionalLight":case"SpotLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe};break;case"PointLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new xe,shadowCameraNear:1,shadowCameraFar:1e3}}return l[c.id]=h,h}}})(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new M);const r=new M,a=new at,o=new at;return{setup:function(l,c){let h=0,u=0,d=0;for(let C=0;C<9;C++)i.probe[C].set(0,0,0);let p=0,f=0,g=0,m=0,_=0,x=0,v=0,y=0,I=0,S=0,w=0;l.sort(Kg);const L=c===!0?Math.PI:1;for(let C=0,U=l.length;C<U;C++){const A=l[C],O=A.color,F=A.intensity,j=A.distance,J=A.shadow&&A.shadow.map?A.shadow.map.texture:null;if(A.isAmbientLight)h+=O.r*F*L,u+=O.g*F*L,d+=O.b*F*L;else if(A.isLightProbe){for(let W=0;W<9;W++)i.probe[W].addScaledVector(A.sh.coefficients[W],F);w++}else if(A.isDirectionalLight){const W=t.get(A);if(W.color.copy(A.color).multiplyScalar(A.intensity*L),A.castShadow){const k=A.shadow,$=n.get(A);$.shadowBias=k.bias,$.shadowNormalBias=k.normalBias,$.shadowRadius=k.radius,$.shadowMapSize=k.mapSize,i.directionalShadow[p]=$,i.directionalShadowMap[p]=J,i.directionalShadowMatrix[p]=A.shadow.matrix,x++}i.directional[p]=W,p++}else if(A.isSpotLight){const W=t.get(A);W.position.setFromMatrixPosition(A.matrixWorld),W.color.copy(O).multiplyScalar(F*L),W.distance=j,W.coneCos=Math.cos(A.angle),W.penumbraCos=Math.cos(A.angle*(1-A.penumbra)),W.decay=A.decay,i.spot[g]=W;const k=A.shadow;if(A.map&&(i.spotLightMap[I]=A.map,I++,k.updateMatrices(A),A.castShadow&&S++),i.spotLightMatrix[g]=k.matrix,A.castShadow){const $=n.get(A);$.shadowBias=k.bias,$.shadowNormalBias=k.normalBias,$.shadowRadius=k.radius,$.shadowMapSize=k.mapSize,i.spotShadow[g]=$,i.spotShadowMap[g]=J,y++}g++}else if(A.isRectAreaLight){const W=t.get(A);W.color.copy(O).multiplyScalar(F),W.halfWidth.set(.5*A.width,0,0),W.halfHeight.set(0,.5*A.height,0),i.rectArea[m]=W,m++}else if(A.isPointLight){const W=t.get(A);if(W.color.copy(A.color).multiplyScalar(A.intensity*L),W.distance=A.distance,W.decay=A.decay,A.castShadow){const k=A.shadow,$=n.get(A);$.shadowBias=k.bias,$.shadowNormalBias=k.normalBias,$.shadowRadius=k.radius,$.shadowMapSize=k.mapSize,$.shadowCameraNear=k.camera.near,$.shadowCameraFar=k.camera.far,i.pointShadow[f]=$,i.pointShadowMap[f]=J,i.pointShadowMatrix[f]=A.shadow.matrix,v++}i.point[f]=W,f++}else if(A.isHemisphereLight){const W=t.get(A);W.skyColor.copy(A.color).multiplyScalar(F*L),W.groundColor.copy(A.groundColor).multiplyScalar(F*L),i.hemi[_]=W,_++}}m>0&&(e.isWebGL2?s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Me.LTC_FLOAT_1,i.rectAreaLTC2=Me.LTC_FLOAT_2):(i.rectAreaLTC1=Me.LTC_HALF_1,i.rectAreaLTC2=Me.LTC_HALF_2):s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Me.LTC_FLOAT_1,i.rectAreaLTC2=Me.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0&&(i.rectAreaLTC1=Me.LTC_HALF_1,i.rectAreaLTC2=Me.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;const b=i.hash;b.directionalLength===p&&b.pointLength===f&&b.spotLength===g&&b.rectAreaLength===m&&b.hemiLength===_&&b.numDirectionalShadows===x&&b.numPointShadows===v&&b.numSpotShadows===y&&b.numSpotMaps===I&&b.numLightProbes===w||(i.directional.length=p,i.spot.length=g,i.rectArea.length=m,i.point.length=f,i.hemi.length=_,i.directionalShadow.length=x,i.directionalShadowMap.length=x,i.pointShadow.length=v,i.pointShadowMap.length=v,i.spotShadow.length=y,i.spotShadowMap.length=y,i.directionalShadowMatrix.length=x,i.pointShadowMatrix.length=v,i.spotLightMatrix.length=y+I-S,i.spotLightMap.length=I,i.numSpotLightShadowsWithMaps=S,i.numLightProbes=w,b.directionalLength=p,b.pointLength=f,b.spotLength=g,b.rectAreaLength=m,b.hemiLength=_,b.numDirectionalShadows=x,b.numPointShadows=v,b.numSpotShadows=y,b.numSpotMaps=I,b.numLightProbes=w,i.version=Yg++)},setupView:function(l,c){let h=0,u=0,d=0,p=0,f=0;const g=c.matrixWorldInverse;for(let m=0,_=l.length;m<_;m++){const x=l[m];if(x.isDirectionalLight){const v=i.directional[h];v.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(g),h++}else if(x.isSpotLight){const v=i.spot[d];v.position.setFromMatrixPosition(x.matrixWorld),v.position.applyMatrix4(g),v.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(g),d++}else if(x.isRectAreaLight){const v=i.rectArea[p];v.position.setFromMatrixPosition(x.matrixWorld),v.position.applyMatrix4(g),o.identity(),a.copy(x.matrixWorld),a.premultiply(g),o.extractRotation(a),v.halfWidth.set(.5*x.width,0,0),v.halfHeight.set(0,.5*x.height,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),p++}else if(x.isPointLight){const v=i.point[u];v.position.setFromMatrixPosition(x.matrixWorld),v.position.applyMatrix4(g),u++}else if(x.isHemisphereLight){const v=i.hemi[f];v.direction.setFromMatrixPosition(x.matrixWorld),v.direction.transformDirection(g),f++}}},state:i}}function cu(s,e){const t=new Zg(s,e),n=[],i=[];return{init:function(){n.length=0,i.length=0},state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:function(r){t.setup(n,r)},setupLightsView:function(r){t.setupView(n,r)},pushLight:function(r){n.push(r)},pushShadow:function(r){i.push(r)}}}function Jg(s,e){let t=new WeakMap;return{get:function(n,i=0){const r=t.get(n);let a;return r===void 0?(a=new cu(s,e),t.set(n,[a])):i>=r.length?(a=new cu(s,e),r.push(a)):a=r[i],a},dispose:function(){t=new WeakMap}}}class Qg extends Kn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class e0 extends Kn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function t0(s,e,t){let n=new Hc;const i=new xe,r=new xe,a=new Pt,o=new Qg({depthPacking:3201}),l=new e0,c={},h=t.maxTextureSize,u={[Td]:1,[uc]:0,[ti]:2},d=new Cn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new xe},radius:{value:4}},vertexShader:`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fragmentShader:`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const f=new rt;f.setAttribute("position",new st(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const g=new ce(f,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;function x(S,w){const L=e.update(g);d.defines.VSM_SAMPLES!==S.blurSamples&&(d.defines.VSM_SAMPLES=S.blurSamples,p.defines.VSM_SAMPLES=S.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new Yn(i.x,i.y)),d.uniforms.shadow_pass.value=S.map.texture,d.uniforms.resolution.value=S.mapSize,d.uniforms.radius.value=S.radius,s.setRenderTarget(S.mapPass),s.clear(),s.renderBufferDirect(w,null,L,d,g,null),p.uniforms.shadow_pass.value=S.mapPass.texture,p.uniforms.resolution.value=S.mapSize,p.uniforms.radius.value=S.radius,s.setRenderTarget(S.map),s.clear(),s.renderBufferDirect(w,null,L,p,g,null)}function v(S,w,L,b){let C=null;const U=L.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(U!==void 0)C=U;else if(C=L.isPointLight===!0?l:o,s.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){const A=C.uuid,O=w.uuid;let F=c[A];F===void 0&&(F={},c[A]=F);let j=F[O];j===void 0&&(j=C.clone(),F[O]=j,w.addEventListener("dispose",I)),C=j}return C.visible=w.visible,C.wireframe=w.wireframe,C.side=b===3?w.shadowSide!==null?w.shadowSide:w.side:w.shadowSide!==null?w.shadowSide:u[w.side],C.alphaMap=w.alphaMap,C.alphaTest=w.alphaTest,C.map=w.map,C.clipShadows=w.clipShadows,C.clippingPlanes=w.clippingPlanes,C.clipIntersection=w.clipIntersection,C.displacementMap=w.displacementMap,C.displacementScale=w.displacementScale,C.displacementBias=w.displacementBias,C.wireframeLinewidth=w.wireframeLinewidth,C.linewidth=w.linewidth,L.isPointLight===!0&&C.isMeshDistanceMaterial===!0&&(s.properties.get(C).light=L),C}function y(S,w,L,b,C){if(S.visible===!1)return;if(S.layers.test(w.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&C===3)&&(!S.frustumCulled||n.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,S.matrixWorld);const A=e.update(S),O=S.material;if(Array.isArray(O)){const F=A.groups;for(let j=0,J=F.length;j<J;j++){const W=F[j],k=O[W.materialIndex];if(k&&k.visible){const $=v(S,k,b,C);S.onBeforeShadow(s,S,w,L,A,$,W),s.renderBufferDirect(L,null,A,$,S,W),S.onAfterShadow(s,S,w,L,A,$,W)}}}else if(O.visible){const F=v(S,O,b,C);S.onBeforeShadow(s,S,w,L,A,F,null),s.renderBufferDirect(L,null,A,F,S,null),S.onAfterShadow(s,S,w,L,A,F,null)}}const U=S.children;for(let A=0,O=U.length;A<O;A++)y(U[A],w,L,b,C)}function I(S){S.target.removeEventListener("dispose",I);for(const w in c){const L=c[w],b=S.target.uuid;b in L&&(L[b].dispose(),delete L[b])}}this.render=function(S,w,L){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||S.length===0)return;const b=s.getRenderTarget(),C=s.getActiveCubeFace(),U=s.getActiveMipmapLevel(),A=s.state;A.setBlending(0),A.buffers.color.setClear(1,1,1,1),A.buffers.depth.setTest(!0),A.setScissorTest(!1);const O=_!==3&&this.type===3,F=_===3&&this.type!==3;for(let j=0,J=S.length;j<J;j++){const W=S[j],k=W.shadow;if(k===void 0||k.autoUpdate===!1&&k.needsUpdate===!1)continue;i.copy(k.mapSize);const $=k.getFrameExtents();if(i.multiply($),r.copy(k.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/$.x),i.x=r.x*$.x,k.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/$.y),i.y=r.y*$.y,k.mapSize.y=r.y)),k.map===null||O===!0||F===!0){const Q=this.type!==3?{minFilter:on,magFilter:on}:{};k.map!==null&&k.map.dispose(),k.map=new Yn(i.x,i.y,Q),k.map.texture.name=W.name+".shadowMap",k.camera.updateProjectionMatrix()}s.setRenderTarget(k.map),s.clear();const N=k.getViewportCount();for(let Q=0;Q<N;Q++){const ve=k.getViewport(Q);a.set(r.x*ve.x,r.y*ve.y,r.x*ve.z,r.y*ve.w),A.viewport(a),k.updateMatrices(W,Q),n=k.getFrustum(),y(w,L,k.camera,W,this.type)}k.isPointLightShadow!==!0&&this.type===3&&x(k,L),k.needsUpdate=!1}_=this.type,m.needsUpdate=!1,s.setRenderTarget(b,C,U)}}function n0(s,e,t){const n=t.isWebGL2,i=new function(){let E=!1;const Y=new Pt;let z=null;const H=new Pt(0,0,0,0);return{setMask:function(he){z===he||E||(s.colorMask(he,he,he,he),z=he)},setLocked:function(he){E=he},setClear:function(he,fe,Se,Ee,De){De===!0&&(he*=Ee,fe*=Ee,Se*=Ee),Y.set(he,fe,Se,Ee),H.equals(Y)===!1&&(s.clearColor(he,fe,Se,Ee),H.copy(Y))},reset:function(){E=!1,z=null,H.set(-1,0,0,0)}}},r=new function(){let E=!1,Y=null,z=null,H=null;return{setTest:function(he){he?Z(s.DEPTH_TEST):D(s.DEPTH_TEST)},setMask:function(he){Y===he||E||(s.depthMask(he),Y=he)},setFunc:function(he){if(z!==he){switch(he){case 0:s.depthFunc(s.NEVER);break;case 1:s.depthFunc(s.ALWAYS);break;case 2:s.depthFunc(s.LESS);break;case 3:default:s.depthFunc(s.LEQUAL);break;case 4:s.depthFunc(s.EQUAL);break;case 5:s.depthFunc(s.GEQUAL);break;case 6:s.depthFunc(s.GREATER);break;case 7:s.depthFunc(s.NOTEQUAL)}z=he}},setLocked:function(he){E=he},setClear:function(he){H!==he&&(s.clearDepth(he),H=he)},reset:function(){E=!1,Y=null,z=null,H=null}}},a=new function(){let E=!1,Y=null,z=null,H=null,he=null,fe=null,Se=null,Ee=null,De=null;return{setTest:function(Te){E||(Te?Z(s.STENCIL_TEST):D(s.STENCIL_TEST))},setMask:function(Te){Y===Te||E||(s.stencilMask(Te),Y=Te)},setFunc:function(Te,Ae,$e){z===Te&&H===Ae&&he===$e||(s.stencilFunc(Te,Ae,$e),z=Te,H=Ae,he=$e)},setOp:function(Te,Ae,$e){fe===Te&&Se===Ae&&Ee===$e||(s.stencilOp(Te,Ae,$e),fe=Te,Se=Ae,Ee=$e)},setLocked:function(Te){E=Te},setClear:function(Te){De!==Te&&(s.clearStencil(Te),De=Te)},reset:function(){E=!1,Y=null,z=null,H=null,he=null,fe=null,Se=null,Ee=null,De=null}}},o=new WeakMap,l=new WeakMap;let c={},h={},u=new WeakMap,d=[],p=null,f=!1,g=null,m=null,_=null,x=null,v=null,y=null,I=null,S=new Ue(0,0,0),w=0,L=!1,b=null,C=null,U=null,A=null,O=null;const F=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let j=!1,J=0;const W=s.getParameter(s.VERSION);W.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(W)[1]),j=J>=1):W.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),j=J>=2);let k=null,$={};const N=s.getParameter(s.SCISSOR_BOX),Q=s.getParameter(s.VIEWPORT),ve=new Pt().fromArray(N),R=new Pt().fromArray(Q);function T(E,Y,z,H){const he=new Uint8Array(4),fe=s.createTexture();s.bindTexture(E,fe),s.texParameteri(E,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(E,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Se=0;Se<z;Se++)!n||E!==s.TEXTURE_3D&&E!==s.TEXTURE_2D_ARRAY?s.texImage2D(Y+Se,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,he):s.texImage3D(Y,0,s.RGBA,1,1,H,0,s.RGBA,s.UNSIGNED_BYTE,he);return fe}const G={};function Z(E){c[E]!==!0&&(s.enable(E),c[E]=!0)}function D(E){c[E]!==!1&&(s.disable(E),c[E]=!1)}G[s.TEXTURE_2D]=T(s.TEXTURE_2D,s.TEXTURE_2D,1),G[s.TEXTURE_CUBE_MAP]=T(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(G[s.TEXTURE_2D_ARRAY]=T(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),G[s.TEXTURE_3D]=T(s.TEXTURE_3D,s.TEXTURE_3D,1,1)),i.setClear(0,0,0,1),r.setClear(1),a.setClear(0),Z(s.DEPTH_TEST),r.setFunc(3),q(!1),oe(1),Z(s.CULL_FACE),V(0);const K={[ls]:s.FUNC_ADD,[Df]:s.FUNC_SUBTRACT,[Uf]:s.FUNC_REVERSE_SUBTRACT};if(n)K[103]=s.MIN,K[104]=s.MAX;else{const E=e.get("EXT_blend_minmax");E!==null&&(K[103]=E.MIN_EXT,K[104]=E.MAX_EXT)}const B={[Of]:s.ZERO,[Ff]:s.ONE,[Bf]:s.SRC_COLOR,[zf]:s.SRC_ALPHA,[qf]:s.SRC_ALPHA_SATURATE,[Wf]:s.DST_COLOR,[Hf]:s.DST_ALPHA,[kf]:s.ONE_MINUS_SRC_COLOR,[Vf]:s.ONE_MINUS_SRC_ALPHA,[Xf]:s.ONE_MINUS_DST_COLOR,[Gf]:s.ONE_MINUS_DST_ALPHA,[jf]:s.CONSTANT_COLOR,[$f]:s.ONE_MINUS_CONSTANT_COLOR,[Yf]:s.CONSTANT_ALPHA,[Kf]:s.ONE_MINUS_CONSTANT_ALPHA};function V(E,Y,z,H,he,fe,Se,Ee,De,Te){if(E!==0){if(f===!1&&(Z(s.BLEND),f=!0),E===5)he=he||Y,fe=fe||z,Se=Se||H,Y===m&&he===v||(s.blendEquationSeparate(K[Y],K[he]),m=Y,v=he),z===_&&H===x&&fe===y&&Se===I||(s.blendFuncSeparate(B[z],B[H],B[fe],B[Se]),_=z,x=H,y=fe,I=Se),Ee.equals(S)!==!1&&De===w||(s.blendColor(Ee.r,Ee.g,Ee.b,De),S.copy(Ee),w=De),g=E,L=!1;else if(E!==g||Te!==L){if(m===ls&&v===ls||(s.blendEquation(s.FUNC_ADD),m=ls,v=ls),Te)switch(E){case 1:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case 2:s.blendFunc(s.ONE,s.ONE);break;case 3:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case 4:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA)}else switch(E){case 1:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case 2:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case 3:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case 4:s.blendFunc(s.ZERO,s.SRC_COLOR)}_=null,x=null,y=null,I=null,S.set(0,0,0),w=0,g=E,L=Te}}else f===!0&&(D(s.BLEND),f=!1)}function q(E){b!==E&&(E?s.frontFace(s.CW):s.frontFace(s.CCW),b=E)}function oe(E){E!==0?(Z(s.CULL_FACE),E!==C&&(E===1?s.cullFace(s.BACK):E===2?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):D(s.CULL_FACE),C=E}function ae(E,Y,z){E?(Z(s.POLYGON_OFFSET_FILL),A===Y&&O===z||(s.polygonOffset(Y,z),A=Y,O=z)):D(s.POLYGON_OFFSET_FILL)}return{buffers:{color:i,depth:r,stencil:a},enable:Z,disable:D,bindFramebuffer:function(E,Y){return h[E]!==Y&&(s.bindFramebuffer(E,Y),h[E]=Y,n&&(E===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=Y),E===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=Y)),!0)},drawBuffers:function(E,Y){let z=d,H=!1;if(E)if(z=u.get(Y),z===void 0&&(z=[],u.set(Y,z)),E.isWebGLMultipleRenderTargets){const he=E.texture;if(z.length!==he.length||z[0]!==s.COLOR_ATTACHMENT0){for(let fe=0,Se=he.length;fe<Se;fe++)z[fe]=s.COLOR_ATTACHMENT0+fe;z.length=he.length,H=!0}}else z[0]!==s.COLOR_ATTACHMENT0&&(z[0]=s.COLOR_ATTACHMENT0,H=!0);else z[0]!==s.BACK&&(z[0]=s.BACK,H=!0);H&&(t.isWebGL2?s.drawBuffers(z):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(z))},useProgram:function(E){return p!==E&&(s.useProgram(E),p=E,!0)},setBlending:V,setMaterial:function(E,Y){E.side===2?D(s.CULL_FACE):Z(s.CULL_FACE);let z=E.side===1;Y&&(z=!z),q(z),E.blending===1&&E.transparent===!1?V(0):V(E.blending,E.blendEquation,E.blendSrc,E.blendDst,E.blendEquationAlpha,E.blendSrcAlpha,E.blendDstAlpha,E.blendColor,E.blendAlpha,E.premultipliedAlpha),r.setFunc(E.depthFunc),r.setTest(E.depthTest),r.setMask(E.depthWrite),i.setMask(E.colorWrite);const H=E.stencilWrite;a.setTest(H),H&&(a.setMask(E.stencilWriteMask),a.setFunc(E.stencilFunc,E.stencilRef,E.stencilFuncMask),a.setOp(E.stencilFail,E.stencilZFail,E.stencilZPass)),ae(E.polygonOffset,E.polygonOffsetFactor,E.polygonOffsetUnits),E.alphaToCoverage===!0?Z(s.SAMPLE_ALPHA_TO_COVERAGE):D(s.SAMPLE_ALPHA_TO_COVERAGE)},setFlipSided:q,setCullFace:oe,setLineWidth:function(E){E!==U&&(j&&s.lineWidth(E),U=E)},setPolygonOffset:ae,setScissorTest:function(E){E?Z(s.SCISSOR_TEST):D(s.SCISSOR_TEST)},activeTexture:function(E){E===void 0&&(E=s.TEXTURE0+F-1),k!==E&&(s.activeTexture(E),k=E)},bindTexture:function(E,Y,z){z===void 0&&(z=k===null?s.TEXTURE0+F-1:k);let H=$[z];H===void 0&&(H={type:void 0,texture:void 0},$[z]=H),H.type===E&&H.texture===Y||(k!==z&&(s.activeTexture(z),k=z),s.bindTexture(E,Y||G[E]),H.type=E,H.texture=Y)},unbindTexture:function(){const E=$[k];E!==void 0&&E.type!==void 0&&(s.bindTexture(E.type,null),E.type=void 0,E.texture=void 0)},compressedTexImage2D:function(){try{s.compressedTexImage2D.apply(s,arguments)}catch{}},compressedTexImage3D:function(){try{s.compressedTexImage3D.apply(s,arguments)}catch{}},texImage2D:function(){try{s.texImage2D.apply(s,arguments)}catch{}},texImage3D:function(){try{s.texImage3D.apply(s,arguments)}catch{}},updateUBOMapping:function(E,Y){let z=l.get(Y);z===void 0&&(z=new WeakMap,l.set(Y,z));let H=z.get(E);H===void 0&&(H=s.getUniformBlockIndex(Y,E.name),z.set(E,H))},uniformBlockBinding:function(E,Y){const z=l.get(Y).get(E);o.get(Y)!==z&&(s.uniformBlockBinding(Y,z,E.__bindingPointIndex),o.set(Y,z))},texStorage2D:function(){try{s.texStorage2D.apply(s,arguments)}catch{}},texStorage3D:function(){try{s.texStorage3D.apply(s,arguments)}catch{}},texSubImage2D:function(){try{s.texSubImage2D.apply(s,arguments)}catch{}},texSubImage3D:function(){try{s.texSubImage3D.apply(s,arguments)}catch{}},compressedTexSubImage2D:function(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch{}},compressedTexSubImage3D:function(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch{}},scissor:function(E){ve.equals(E)===!1&&(s.scissor(E.x,E.y,E.z,E.w),ve.copy(E))},viewport:function(E){R.equals(E)===!1&&(s.viewport(E.x,E.y,E.z,E.w),R.copy(E))},reset:function(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),n===!0&&(s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),c={},k=null,$={},h={},u=new WeakMap,d=[],p=null,f=!1,g=null,m=null,_=null,x=null,v=null,y=null,I=null,S=new Ue(0,0,0),w=0,L=!1,b=null,C=null,U=null,A=null,O=null,ve.set(0,0,s.canvas.width,s.canvas.height),R.set(0,0,s.canvas.width,s.canvas.height),i.reset(),r.reset(),a.reset()}}}function i0(s,e,t,n,i,r,a){const o=i.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator<"u"&&/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap;let u;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function f(R,T){return p?new OffscreenCanvas(R,T):pa("canvas")}function g(R,T,G,Z){let D=1;if((R.width>Z||R.height>Z)&&(D=Z/Math.max(R.width,R.height)),D<1||T===!0){if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap){const K=T?Fo:Math.floor,B=K(D*R.width),V=K(D*R.height);u===void 0&&(u=f(B,V));const q=G?f(B,V):u;return q.width=B,q.height=V,q.getContext("2d").drawImage(R,0,0,B,V),q}return R}return R}function m(R){return vc(R.width)&&vc(R.height)}function _(R,T){return R.generateMipmaps&&T&&R.minFilter!==on&&R.minFilter!==Bn}function x(R){s.generateMipmap(R)}function v(R,T,G,Z,D=!1){if(o===!1)return T;if(R!==null&&s[R]!==void 0)return s[R];let K=T;if(T===s.RED&&(G===s.FLOAT&&(K=s.R32F),G===s.HALF_FLOAT&&(K=s.R16F),G===s.UNSIGNED_BYTE&&(K=s.R8)),T===s.RED_INTEGER&&(G===s.UNSIGNED_BYTE&&(K=s.R8UI),G===s.UNSIGNED_SHORT&&(K=s.R16UI),G===s.UNSIGNED_INT&&(K=s.R32UI),G===s.BYTE&&(K=s.R8I),G===s.SHORT&&(K=s.R16I),G===s.INT&&(K=s.R32I)),T===s.RG&&(G===s.FLOAT&&(K=s.RG32F),G===s.HALF_FLOAT&&(K=s.RG16F),G===s.UNSIGNED_BYTE&&(K=s.RG8)),T===s.RGBA){const B=D?No:_t.getTransfer(Z);G===s.FLOAT&&(K=s.RGBA32F),G===s.HALF_FLOAT&&(K=s.RGBA16F),G===s.UNSIGNED_BYTE&&(K=B===Ct?s.SRGB8_ALPHA8:s.RGBA8),G===s.UNSIGNED_SHORT_4_4_4_4&&(K=s.RGBA4),G===s.UNSIGNED_SHORT_5_5_5_1&&(K=s.RGB5_A1)}return K!==s.R16F&&K!==s.R32F&&K!==s.RG16F&&K!==s.RG32F&&K!==s.RGBA16F&&K!==s.RGBA32F||e.get("EXT_color_buffer_float"),K}function y(R,T,G){return _(R,G)===!0||R.isFramebufferTexture&&R.minFilter!==on&&R.minFilter!==Bn?Math.log2(Math.max(T.width,T.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?T.mipmaps.length:1}function I(R){return R===on||R===dc||R===wo?s.NEAREST:s.LINEAR}function S(R){const T=R.target;T.removeEventListener("dispose",S),(function(G){const Z=n.get(G);if(Z.__webglInit===void 0)return;const D=G.source,K=d.get(D);if(K){const B=K[Z.__cacheKey];B.usedTimes--,B.usedTimes===0&&L(G),Object.keys(K).length===0&&d.delete(D)}n.remove(G)})(T),T.isVideoTexture&&h.delete(T)}function w(R){const T=R.target;T.removeEventListener("dispose",w),(function(G){const Z=G.texture,D=n.get(G),K=n.get(Z);if(K.__webglTexture!==void 0&&(s.deleteTexture(K.__webglTexture),a.memory.textures--),G.depthTexture&&G.depthTexture.dispose(),G.isWebGLCubeRenderTarget)for(let B=0;B<6;B++){if(Array.isArray(D.__webglFramebuffer[B]))for(let V=0;V<D.__webglFramebuffer[B].length;V++)s.deleteFramebuffer(D.__webglFramebuffer[B][V]);else s.deleteFramebuffer(D.__webglFramebuffer[B]);D.__webglDepthbuffer&&s.deleteRenderbuffer(D.__webglDepthbuffer[B])}else{if(Array.isArray(D.__webglFramebuffer))for(let B=0;B<D.__webglFramebuffer.length;B++)s.deleteFramebuffer(D.__webglFramebuffer[B]);else s.deleteFramebuffer(D.__webglFramebuffer);if(D.__webglDepthbuffer&&s.deleteRenderbuffer(D.__webglDepthbuffer),D.__webglMultisampledFramebuffer&&s.deleteFramebuffer(D.__webglMultisampledFramebuffer),D.__webglColorRenderbuffer)for(let B=0;B<D.__webglColorRenderbuffer.length;B++)D.__webglColorRenderbuffer[B]&&s.deleteRenderbuffer(D.__webglColorRenderbuffer[B]);D.__webglDepthRenderbuffer&&s.deleteRenderbuffer(D.__webglDepthRenderbuffer)}if(G.isWebGLMultipleRenderTargets)for(let B=0,V=Z.length;B<V;B++){const q=n.get(Z[B]);q.__webglTexture&&(s.deleteTexture(q.__webglTexture),a.memory.textures--),n.remove(Z[B])}n.remove(Z),n.remove(G)})(T)}function L(R){const T=n.get(R);s.deleteTexture(T.__webglTexture);const G=R.source;delete d.get(G)[T.__cacheKey],a.memory.textures--}let b=0;function C(R,T){const G=n.get(R);if(R.isVideoTexture&&(function(Z){const D=a.render.frame;h.get(Z)!==D&&(h.set(Z,D),Z.update())})(R),R.isRenderTargetTexture===!1&&R.version>0&&G.__version!==R.version){const Z=R.image;if(Z!==null){if(Z.complete!==!1)return void J(G,R,T)}}t.bindTexture(s.TEXTURE_2D,G.__webglTexture,s.TEXTURE0+T)}const U={[On]:s.REPEAT,[bi]:s.CLAMP_TO_EDGE,[Io]:s.MIRRORED_REPEAT},A={[on]:s.NEAREST,[dc]:s.NEAREST_MIPMAP_NEAREST,[wo]:s.NEAREST_MIPMAP_LINEAR,[Bn]:s.LINEAR,[Ad]:s.LINEAR_MIPMAP_NEAREST,[ur]:s.LINEAR_MIPMAP_LINEAR},O={[Qf]:s.NEVER,[am]:s.ALWAYS,[em]:s.LESS,[nm]:s.LEQUAL,[tm]:s.EQUAL,[rm]:s.GEQUAL,[im]:s.GREATER,[sm]:s.NOTEQUAL};function F(R,T,G){if(G?(s.texParameteri(R,s.TEXTURE_WRAP_S,U[T.wrapS]),s.texParameteri(R,s.TEXTURE_WRAP_T,U[T.wrapT]),R!==s.TEXTURE_3D&&R!==s.TEXTURE_2D_ARRAY||s.texParameteri(R,s.TEXTURE_WRAP_R,U[T.wrapR]),s.texParameteri(R,s.TEXTURE_MAG_FILTER,A[T.magFilter]),s.texParameteri(R,s.TEXTURE_MIN_FILTER,A[T.minFilter])):(s.texParameteri(R,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(R,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),R!==s.TEXTURE_3D&&R!==s.TEXTURE_2D_ARRAY||s.texParameteri(R,s.TEXTURE_WRAP_R,s.CLAMP_TO_EDGE),T.wrapS!==bi||T.wrapT,s.texParameteri(R,s.TEXTURE_MAG_FILTER,I(T.magFilter)),s.texParameteri(R,s.TEXTURE_MIN_FILTER,I(T.minFilter)),T.minFilter!==on&&T.minFilter),T.compareFunction&&(s.texParameteri(R,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(R,s.TEXTURE_COMPARE_FUNC,O[T.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const Z=e.get("EXT_texture_filter_anisotropic");if(T.magFilter===on||T.minFilter!==wo&&T.minFilter!==ur||T.type===$i&&e.has("OES_texture_float_linear")===!1||o===!1&&T.type===wi&&e.has("OES_texture_half_float_linear")===!1)return;(T.anisotropy>1||n.get(T).__currentAnisotropy)&&(s.texParameterf(R,Z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,i.getMaxAnisotropy())),n.get(T).__currentAnisotropy=T.anisotropy)}}function j(R,T){let G=!1;R.__webglInit===void 0&&(R.__webglInit=!0,T.addEventListener("dispose",S));const Z=T.source;let D=d.get(Z);D===void 0&&(D={},d.set(Z,D));const K=(function(B){const V=[];return V.push(B.wrapS),V.push(B.wrapT),V.push(B.wrapR||0),V.push(B.magFilter),V.push(B.minFilter),V.push(B.anisotropy),V.push(B.internalFormat),V.push(B.format),V.push(B.type),V.push(B.generateMipmaps),V.push(B.premultiplyAlpha),V.push(B.flipY),V.push(B.unpackAlignment),V.push(B.colorSpace),V.join()})(T);if(K!==R.__cacheKey){D[K]===void 0&&(D[K]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,G=!0),D[K].usedTimes++;const B=D[R.__cacheKey];B!==void 0&&(D[R.__cacheKey].usedTimes--,B.usedTimes===0&&L(T)),R.__cacheKey=K,R.__webglTexture=D[K].texture}return G}function J(R,T,G){let Z=s.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(Z=s.TEXTURE_2D_ARRAY),T.isData3DTexture&&(Z=s.TEXTURE_3D);const D=j(R,T),K=T.source;t.bindTexture(Z,R.__webglTexture,s.TEXTURE0+G);const B=n.get(K);if(K.version!==B.__version||D===!0){t.activeTexture(s.TEXTURE0+G);const V=_t.getPrimaries(_t.workingColorSpace),q=T.colorSpace===si?null:_t.getPrimaries(T.colorSpace),oe=T.colorSpace===si||V===q?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,T.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,T.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,oe);const ae=(function(Ae){return!o&&(Ae.wrapS!==bi||Ae.wrapT!==bi||Ae.minFilter!==on&&Ae.minFilter!==Bn)})(T)&&m(T.image)===!1;let E=g(T.image,ae,!1,i.maxTextureSize);E=ve(T,E);const Y=m(E)||o,z=r.convert(T.format,T.colorSpace);let H,he=r.convert(T.type),fe=v(T.internalFormat,z,he,T.colorSpace,T.isVideoTexture);F(Z,T,Y);const Se=T.mipmaps,Ee=o&&T.isVideoTexture!==!0&&fe!==36196,De=B.__version===void 0||D===!0,Te=y(T,E,Y);if(T.isDepthTexture)fe=s.DEPTH_COMPONENT,o?fe=T.type===$i?s.DEPTH_COMPONENT32F:T.type===Wi?s.DEPTH_COMPONENT24:T.type===cs?s.DEPTH24_STENCIL8:s.DEPTH_COMPONENT16:T.type,T.format===hs&&fe===s.DEPTH_COMPONENT&&T.type!==zc&&T.type!==Wi&&(T.type=Wi,he=r.convert(T.type)),T.format===dr&&fe===s.DEPTH_COMPONENT&&(fe=s.DEPTH_STENCIL,T.type!==cs&&(T.type=cs,he=r.convert(T.type))),De&&(Ee?t.texStorage2D(s.TEXTURE_2D,1,fe,E.width,E.height):t.texImage2D(s.TEXTURE_2D,0,fe,E.width,E.height,0,z,he,null));else if(T.isDataTexture)if(Se.length>0&&Y){Ee&&De&&t.texStorage2D(s.TEXTURE_2D,Te,fe,Se[0].width,Se[0].height);for(let Ae=0,$e=Se.length;Ae<$e;Ae++)H=Se[Ae],Ee?t.texSubImage2D(s.TEXTURE_2D,Ae,0,0,H.width,H.height,z,he,H.data):t.texImage2D(s.TEXTURE_2D,Ae,fe,H.width,H.height,0,z,he,H.data);T.generateMipmaps=!1}else Ee?(De&&t.texStorage2D(s.TEXTURE_2D,Te,fe,E.width,E.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,E.width,E.height,z,he,E.data)):t.texImage2D(s.TEXTURE_2D,0,fe,E.width,E.height,0,z,he,E.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){Ee&&De&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Te,fe,Se[0].width,Se[0].height,E.depth);for(let Ae=0,$e=Se.length;Ae<$e;Ae++)H=Se[Ae],T.format!==li?z!==null&&(Ee?t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,Ae,0,0,0,H.width,H.height,E.depth,z,H.data,0,0):t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,Ae,fe,H.width,H.height,E.depth,0,H.data,0,0)):Ee?t.texSubImage3D(s.TEXTURE_2D_ARRAY,Ae,0,0,0,H.width,H.height,E.depth,z,he,H.data):t.texImage3D(s.TEXTURE_2D_ARRAY,Ae,fe,H.width,H.height,E.depth,0,z,he,H.data)}else{Ee&&De&&t.texStorage2D(s.TEXTURE_2D,Te,fe,Se[0].width,Se[0].height);for(let Ae=0,$e=Se.length;Ae<$e;Ae++)H=Se[Ae],T.format!==li?z!==null&&(Ee?t.compressedTexSubImage2D(s.TEXTURE_2D,Ae,0,0,H.width,H.height,z,H.data):t.compressedTexImage2D(s.TEXTURE_2D,Ae,fe,H.width,H.height,0,H.data)):Ee?t.texSubImage2D(s.TEXTURE_2D,Ae,0,0,H.width,H.height,z,he,H.data):t.texImage2D(s.TEXTURE_2D,Ae,fe,H.width,H.height,0,z,he,H.data)}else if(T.isDataArrayTexture)Ee?(De&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Te,fe,E.width,E.height,E.depth),t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,E.width,E.height,E.depth,z,he,E.data)):t.texImage3D(s.TEXTURE_2D_ARRAY,0,fe,E.width,E.height,E.depth,0,z,he,E.data);else if(T.isData3DTexture)Ee?(De&&t.texStorage3D(s.TEXTURE_3D,Te,fe,E.width,E.height,E.depth),t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,E.width,E.height,E.depth,z,he,E.data)):t.texImage3D(s.TEXTURE_3D,0,fe,E.width,E.height,E.depth,0,z,he,E.data);else if(T.isFramebufferTexture){if(De)if(Ee)t.texStorage2D(s.TEXTURE_2D,Te,fe,E.width,E.height);else{let Ae=E.width,$e=E.height;for(let ht=0;ht<Te;ht++)t.texImage2D(s.TEXTURE_2D,ht,fe,Ae,$e,0,z,he,null),Ae>>=1,$e>>=1}}else if(Se.length>0&&Y){Ee&&De&&t.texStorage2D(s.TEXTURE_2D,Te,fe,Se[0].width,Se[0].height);for(let Ae=0,$e=Se.length;Ae<$e;Ae++)H=Se[Ae],Ee?t.texSubImage2D(s.TEXTURE_2D,Ae,0,0,z,he,H):t.texImage2D(s.TEXTURE_2D,Ae,fe,z,he,H);T.generateMipmaps=!1}else Ee?(De&&t.texStorage2D(s.TEXTURE_2D,Te,fe,E.width,E.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,z,he,E)):t.texImage2D(s.TEXTURE_2D,0,fe,z,he,E);_(T,Y)&&x(Z),B.__version=K.version,T.onUpdate&&T.onUpdate(T)}R.__version=T.version}function W(R,T,G,Z,D,K){const B=r.convert(G.format,G.colorSpace),V=r.convert(G.type),q=v(G.internalFormat,B,V,G.colorSpace);if(!n.get(T).__hasExternalTextures){const oe=Math.max(1,T.width>>K),ae=Math.max(1,T.height>>K);D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY?t.texImage3D(D,K,q,oe,ae,T.depth,0,B,V,null):t.texImage2D(D,K,q,oe,ae,0,B,V,null)}t.bindFramebuffer(s.FRAMEBUFFER,R),Q(T)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,Z,D,n.get(G).__webglTexture,0,N(T)):(D===s.TEXTURE_2D||D>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&D<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,Z,D,n.get(G).__webglTexture,K),t.bindFramebuffer(s.FRAMEBUFFER,null)}function k(R,T,G){if(s.bindRenderbuffer(s.RENDERBUFFER,R),T.depthBuffer&&!T.stencilBuffer){let Z=o===!0?s.DEPTH_COMPONENT24:s.DEPTH_COMPONENT16;if(G||Q(T)){const D=T.depthTexture;D&&D.isDepthTexture&&(D.type===$i?Z=s.DEPTH_COMPONENT32F:D.type===Wi&&(Z=s.DEPTH_COMPONENT24));const K=N(T);Q(T)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,K,Z,T.width,T.height):s.renderbufferStorageMultisample(s.RENDERBUFFER,K,Z,T.width,T.height)}else s.renderbufferStorage(s.RENDERBUFFER,Z,T.width,T.height);s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.RENDERBUFFER,R)}else if(T.depthBuffer&&T.stencilBuffer){const Z=N(T);G&&Q(T)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Z,s.DEPTH24_STENCIL8,T.width,T.height):Q(T)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Z,s.DEPTH24_STENCIL8,T.width,T.height):s.renderbufferStorage(s.RENDERBUFFER,s.DEPTH_STENCIL,T.width,T.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.RENDERBUFFER,R)}else{const Z=T.isWebGLMultipleRenderTargets===!0?T.texture:[T.texture];for(let D=0;D<Z.length;D++){const K=Z[D],B=r.convert(K.format,K.colorSpace),V=r.convert(K.type),q=v(K.internalFormat,B,V,K.colorSpace),oe=N(T);G&&Q(T)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,oe,q,T.width,T.height):Q(T)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,oe,q,T.width,T.height):s.renderbufferStorage(s.RENDERBUFFER,q,T.width,T.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function $(R){const T=n.get(R),G=R.isWebGLCubeRenderTarget===!0;if(R.depthTexture&&!T.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");(function(Z,D){if(D&&D.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,Z),!D.depthTexture||!D.depthTexture.isDepthTexture)throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");n.get(D.depthTexture).__webglTexture&&D.depthTexture.image.width===D.width&&D.depthTexture.image.height===D.height||(D.depthTexture.image.width=D.width,D.depthTexture.image.height=D.height,D.depthTexture.needsUpdate=!0),C(D.depthTexture,0);const K=n.get(D.depthTexture).__webglTexture,B=N(D);if(D.depthTexture.format===hs)Q(D)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,K,0,B):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,K,0);else{if(D.depthTexture.format!==dr)throw new Error("Unknown depthTexture format");Q(D)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,K,0,B):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,K,0)}})(T.__webglFramebuffer,R)}else if(G){T.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)t.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer[Z]),T.__webglDepthbuffer[Z]=s.createRenderbuffer(),k(T.__webglDepthbuffer[Z],R,!1)}else t.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer=s.createRenderbuffer(),k(T.__webglDepthbuffer,R,!1);t.bindFramebuffer(s.FRAMEBUFFER,null)}function N(R){return Math.min(i.maxSamples,R.samples)}function Q(R){const T=n.get(R);return o&&R.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function ve(R,T){const G=R.colorSpace,Z=R.format;return R.type,R.isCompressedTexture===!0||R.isVideoTexture===!0||R.format===mc||G!==en&&G!==si&&_t.getTransfer(G)===Ct&&o===!1&&(e.has("EXT_sRGB")===!0&&Z===li?(R.format=mc,R.minFilter=Bn,R.generateMipmaps=!1):T=Id.sRGBToLinear(T)),T}this.allocateTextureUnit=function(){const R=b;return i.maxTextures,b+=1,R},this.resetTextureUnits=function(){b=0},this.setTexture2D=C,this.setTexture2DArray=function(R,T){const G=n.get(R);R.version>0&&G.__version!==R.version?J(G,R,T):t.bindTexture(s.TEXTURE_2D_ARRAY,G.__webglTexture,s.TEXTURE0+T)},this.setTexture3D=function(R,T){const G=n.get(R);R.version>0&&G.__version!==R.version?J(G,R,T):t.bindTexture(s.TEXTURE_3D,G.__webglTexture,s.TEXTURE0+T)},this.setTextureCube=function(R,T){const G=n.get(R);R.version>0&&G.__version!==R.version?(function(Z,D,K){if(D.image.length!==6)return;const B=j(Z,D),V=D.source;t.bindTexture(s.TEXTURE_CUBE_MAP,Z.__webglTexture,s.TEXTURE0+K);const q=n.get(V);if(V.version!==q.__version||B===!0){t.activeTexture(s.TEXTURE0+K);const oe=_t.getPrimaries(_t.workingColorSpace),ae=D.colorSpace===si?null:_t.getPrimaries(D.colorSpace),E=D.colorSpace===si||oe===ae?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,D.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,D.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,E);const Y=D.isCompressedTexture||D.image[0].isCompressedTexture,z=D.image[0]&&D.image[0].isDataTexture,H=[];for(let Re=0;Re<6;Re++)H[Re]=Y||z?z?D.image[Re].image:D.image[Re]:g(D.image[Re],!1,!0,i.maxCubemapSize),H[Re]=ve(D,H[Re]);const he=H[0],fe=m(he)||o,Se=r.convert(D.format,D.colorSpace),Ee=r.convert(D.type),De=v(D.internalFormat,Se,Ee,D.colorSpace),Te=o&&D.isVideoTexture!==!0,Ae=q.__version===void 0||B===!0;let $e,ht=y(D,he,fe);if(F(s.TEXTURE_CUBE_MAP,D,fe),Y){Te&&Ae&&t.texStorage2D(s.TEXTURE_CUBE_MAP,ht,De,he.width,he.height);for(let Re=0;Re<6;Re++){$e=H[Re].mipmaps;for(let et=0;et<$e.length;et++){const Ze=$e[et];D.format!==li?Se!==null&&(Te?t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et,0,0,Ze.width,Ze.height,Se,Ze.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et,De,Ze.width,Ze.height,0,Ze.data)):Te?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et,0,0,Ze.width,Ze.height,Se,Ee,Ze.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et,De,Ze.width,Ze.height,0,Se,Ee,Ze.data)}}}else{$e=D.mipmaps,Te&&Ae&&($e.length>0&&ht++,t.texStorage2D(s.TEXTURE_CUBE_MAP,ht,De,H[0].width,H[0].height));for(let Re=0;Re<6;Re++)if(z){Te?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,0,0,0,H[Re].width,H[Re].height,Se,Ee,H[Re].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,0,De,H[Re].width,H[Re].height,0,Se,Ee,H[Re].data);for(let et=0;et<$e.length;et++){const Ze=$e[et].image[Re].image;Te?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et+1,0,0,Ze.width,Ze.height,Se,Ee,Ze.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et+1,De,Ze.width,Ze.height,0,Se,Ee,Ze.data)}}else{Te?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,0,0,0,Se,Ee,H[Re]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,0,De,Se,Ee,H[Re]);for(let et=0;et<$e.length;et++){const Ze=$e[et];Te?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et+1,0,0,Se,Ee,Ze.image[Re]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Re,et+1,De,Se,Ee,Ze.image[Re])}}}_(D,fe)&&x(s.TEXTURE_CUBE_MAP),q.__version=V.version,D.onUpdate&&D.onUpdate(D)}Z.__version=D.version})(G,R,T):t.bindTexture(s.TEXTURE_CUBE_MAP,G.__webglTexture,s.TEXTURE0+T)},this.rebindTextures=function(R,T,G){const Z=n.get(R);T!==void 0&&W(Z.__webglFramebuffer,R,R.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),G!==void 0&&$(R)},this.setupRenderTarget=function(R){const T=R.texture,G=n.get(R),Z=n.get(T);R.addEventListener("dispose",w),R.isWebGLMultipleRenderTargets!==!0&&(Z.__webglTexture===void 0&&(Z.__webglTexture=s.createTexture()),Z.__version=T.version,a.memory.textures++);const D=R.isWebGLCubeRenderTarget===!0,K=R.isWebGLMultipleRenderTargets===!0,B=m(R)||o;if(D){G.__webglFramebuffer=[];for(let V=0;V<6;V++)if(o&&T.mipmaps&&T.mipmaps.length>0){G.__webglFramebuffer[V]=[];for(let q=0;q<T.mipmaps.length;q++)G.__webglFramebuffer[V][q]=s.createFramebuffer()}else G.__webglFramebuffer[V]=s.createFramebuffer()}else{if(o&&T.mipmaps&&T.mipmaps.length>0){G.__webglFramebuffer=[];for(let V=0;V<T.mipmaps.length;V++)G.__webglFramebuffer[V]=s.createFramebuffer()}else G.__webglFramebuffer=s.createFramebuffer();if(K&&i.drawBuffers){const V=R.texture;for(let q=0,oe=V.length;q<oe;q++){const ae=n.get(V[q]);ae.__webglTexture===void 0&&(ae.__webglTexture=s.createTexture(),a.memory.textures++)}}if(o&&R.samples>0&&Q(R)===!1){const V=K?T:[T];G.__webglMultisampledFramebuffer=s.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let q=0;q<V.length;q++){const oe=V[q];G.__webglColorRenderbuffer[q]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,G.__webglColorRenderbuffer[q]);const ae=r.convert(oe.format,oe.colorSpace),E=r.convert(oe.type),Y=v(oe.internalFormat,ae,E,oe.colorSpace,R.isXRRenderTarget===!0),z=N(R);s.renderbufferStorageMultisample(s.RENDERBUFFER,z,Y,R.width,R.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+q,s.RENDERBUFFER,G.__webglColorRenderbuffer[q])}s.bindRenderbuffer(s.RENDERBUFFER,null),R.depthBuffer&&(G.__webglDepthRenderbuffer=s.createRenderbuffer(),k(G.__webglDepthRenderbuffer,R,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(D){t.bindTexture(s.TEXTURE_CUBE_MAP,Z.__webglTexture),F(s.TEXTURE_CUBE_MAP,T,B);for(let V=0;V<6;V++)if(o&&T.mipmaps&&T.mipmaps.length>0)for(let q=0;q<T.mipmaps.length;q++)W(G.__webglFramebuffer[V][q],R,T,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+V,q);else W(G.__webglFramebuffer[V],R,T,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+V,0);_(T,B)&&x(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(K){const V=R.texture;for(let q=0,oe=V.length;q<oe;q++){const ae=V[q],E=n.get(ae);t.bindTexture(s.TEXTURE_2D,E.__webglTexture),F(s.TEXTURE_2D,ae,B),W(G.__webglFramebuffer,R,ae,s.COLOR_ATTACHMENT0+q,s.TEXTURE_2D,0),_(ae,B)&&x(s.TEXTURE_2D)}t.unbindTexture()}else{let V=s.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&o&&(V=R.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(V,Z.__webglTexture),F(V,T,B),o&&T.mipmaps&&T.mipmaps.length>0)for(let q=0;q<T.mipmaps.length;q++)W(G.__webglFramebuffer[q],R,T,s.COLOR_ATTACHMENT0,V,q);else W(G.__webglFramebuffer,R,T,s.COLOR_ATTACHMENT0,V,0);_(T,B)&&x(V),t.unbindTexture()}R.depthBuffer&&$(R)},this.updateRenderTargetMipmap=function(R){const T=m(R)||o,G=R.isWebGLMultipleRenderTargets===!0?R.texture:[R.texture];for(let Z=0,D=G.length;Z<D;Z++){const K=G[Z];if(_(K,T)){const B=R.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:s.TEXTURE_2D,V=n.get(K).__webglTexture;t.bindTexture(B,V),x(B),t.unbindTexture()}}},this.updateMultisampleRenderTarget=function(R){if(o&&R.samples>0&&Q(R)===!1){const T=R.isWebGLMultipleRenderTargets?R.texture:[R.texture],G=R.width,Z=R.height;let D=s.COLOR_BUFFER_BIT;const K=[],B=R.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,V=n.get(R),q=R.isWebGLMultipleRenderTargets===!0;if(q)for(let oe=0;oe<T.length;oe++)t.bindFramebuffer(s.FRAMEBUFFER,V.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+oe,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,V.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+oe,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,V.__webglMultisampledFramebuffer),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,V.__webglFramebuffer);for(let oe=0;oe<T.length;oe++){K.push(s.COLOR_ATTACHMENT0+oe),R.depthBuffer&&K.push(B);const ae=V.__ignoreDepthValues!==void 0&&V.__ignoreDepthValues;if(ae===!1&&(R.depthBuffer&&(D|=s.DEPTH_BUFFER_BIT),R.stencilBuffer&&(D|=s.STENCIL_BUFFER_BIT)),q&&s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,V.__webglColorRenderbuffer[oe]),ae===!0&&(s.invalidateFramebuffer(s.READ_FRAMEBUFFER,[B]),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[B])),q){const E=n.get(T[oe]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,E,0)}s.blitFramebuffer(0,0,G,Z,0,0,G,Z,D,s.NEAREST),c&&s.invalidateFramebuffer(s.READ_FRAMEBUFFER,K)}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),q)for(let oe=0;oe<T.length;oe++){t.bindFramebuffer(s.FRAMEBUFFER,V.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+oe,s.RENDERBUFFER,V.__webglColorRenderbuffer[oe]);const ae=n.get(T[oe]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,V.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+oe,s.TEXTURE_2D,ae,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,V.__webglMultisampledFramebuffer)}},this.setupDepthRenderbuffer=$,this.setupFrameBufferTexture=W,this.useMultisampledRTT=Q}function s0(s,e,t){const n=t.isWebGL2;return{convert:function(i,r=""){let a;const o=_t.getTransfer(r);if(i===ir)return s.UNSIGNED_BYTE;if(i===1017)return s.UNSIGNED_SHORT_4_4_4_4;if(i===1018)return s.UNSIGNED_SHORT_5_5_5_1;if(i===1010)return s.BYTE;if(i===1011)return s.SHORT;if(i===zc)return s.UNSIGNED_SHORT;if(i===Ed)return s.INT;if(i===Wi)return s.UNSIGNED_INT;if(i===$i)return s.FLOAT;if(i===wi)return n?s.HALF_FLOAT:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(i===1021)return s.ALPHA;if(i===li)return s.RGBA;if(i===1024)return s.LUMINANCE;if(i===1025)return s.LUMINANCE_ALPHA;if(i===hs)return s.DEPTH_COMPONENT;if(i===dr)return s.DEPTH_STENCIL;if(i===mc)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(i===1028)return s.RED;if(i===1029)return s.RED_INTEGER;if(i===1030)return s.RG;if(i===1031)return s.RG_INTEGER;if(i===1033)return s.RGBA_INTEGER;if(i===ml||i===gl||i===vl||i===xl)if(o===Ct){if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a===null)return null;if(i===ml)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===gl)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===vl)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===xl)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else{if(a=e.get("WEBGL_compressed_texture_s3tc"),a===null)return null;if(i===ml)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===gl)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===vl)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===xl)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}if(i===35840||i===35841||i===35842||i===35843){if(a=e.get("WEBGL_compressed_texture_pvrtc"),a===null)return null;if(i===35840)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===35841)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===35842)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===35843)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}if(i===36196)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(i===37492||i===37496){if(a=e.get("WEBGL_compressed_texture_etc"),a===null)return null;if(i===37492)return o===Ct?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===37496)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}if(i===37808||i===37809||i===37810||i===37811||i===37812||i===37813||i===37814||i===37815||i===37816||i===37817||i===37818||i===37819||i===37820||i===37821){if(a=e.get("WEBGL_compressed_texture_astc"),a===null)return null;if(i===37808)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===37809)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===37810)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===37811)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===37812)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===37813)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===37814)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===37815)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===37816)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===37817)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===37818)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===37819)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===37820)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===37821)return o===Ct?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}if(i===_l||i===36494||i===36495){if(a=e.get("EXT_texture_compression_bptc"),a===null)return null;if(i===_l)return o===Ct?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===36494)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===36495)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}if(i===36283||i===36284||i===36285||i===36286){if(a=e.get("EXT_texture_compression_rgtc"),a===null)return null;if(i===_l)return a.COMPRESSED_RED_RGTC1_EXT;if(i===36284)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===36285)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===36286)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}return i===cs?n?s.UNSIGNED_INT_24_8:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):s[i]!==void 0?s[i]:null}}}class r0 extends gn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}let Rt=class extends yt{constructor(){super(),this.isGroup=!0,this.type="Group"}};const a0={type:"move"};let Gl=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Rt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Rt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new M,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new M),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Rt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new M,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new M),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const g of e.hand.values()){const m=t.getJointPose(g,n),_=this._getHandJoint(c,g);m!==null&&(_.matrix.fromArray(m.transform.matrix),_.matrix.decompose(_.position,_.rotation,_.scale),_.matrixWorldNeedsUpdate=!0,_.jointRadius=m.radius),_.visible=m!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,f=.005;c.inputState.pinching&&d>p+f?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-f&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(a0)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Rt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};class o0 extends Mr{constructor(e,t){super();const n=this;let i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,f=null;const g=t.getContextAttributes();let m=null,_=null;const x=[],v=[],y=new xe;let I=null;const S=new gn;S.layers.enable(1),S.viewport=new Pt;const w=new gn;w.layers.enable(2),w.viewport=new Pt;const L=[S,w],b=new r0;b.layers.enable(1),b.layers.enable(2);let C=null,U=null;function A(N){const Q=v.indexOf(N.inputSource);if(Q===-1)return;const ve=x[Q];ve!==void 0&&(ve.update(N.inputSource,N.frame,c||a),ve.dispatchEvent({type:N.type,data:N.inputSource}))}function O(){i.removeEventListener("select",A),i.removeEventListener("selectstart",A),i.removeEventListener("selectend",A),i.removeEventListener("squeeze",A),i.removeEventListener("squeezestart",A),i.removeEventListener("squeezeend",A),i.removeEventListener("end",O),i.removeEventListener("inputsourceschange",F);for(let N=0;N<x.length;N++){const Q=v[N];Q!==null&&(v[N]=null,x[N].disconnect(Q))}C=null,U=null,e.setRenderTarget(m),p=null,d=null,u=null,i=null,_=null,$.stop(),n.isPresenting=!1,e.setPixelRatio(I),e.setSize(y.width,y.height,!1),n.dispatchEvent({type:"sessionend"})}function F(N){for(let Q=0;Q<N.removed.length;Q++){const ve=N.removed[Q],R=v.indexOf(ve);R>=0&&(v[R]=null,x[R].disconnect(ve))}for(let Q=0;Q<N.added.length;Q++){const ve=N.added[Q];let R=v.indexOf(ve);if(R===-1){for(let G=0;G<x.length;G++){if(G>=v.length){v.push(ve),R=G;break}if(v[G]===null){v[G]=ve,R=G;break}}if(R===-1)break}const T=x[R];T&&T.connect(ve)}}this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(N){let Q=x[N];return Q===void 0&&(Q=new Gl,x[N]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(N){let Q=x[N];return Q===void 0&&(Q=new Gl,x[N]=Q),Q.getGripSpace()},this.getHand=function(N){let Q=x[N];return Q===void 0&&(Q=new Gl,x[N]=Q),Q.getHandSpace()},this.setFramebufferScaleFactor=function(N){r=N,n.isPresenting},this.setReferenceSpaceType=function(N){o=N,n.isPresenting},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(N){c=N},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return f},this.getSession=function(){return i},this.setSession=async function(N){if(i=N,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",A),i.addEventListener("selectstart",A),i.addEventListener("selectend",A),i.addEventListener("squeeze",A),i.addEventListener("squeezestart",A),i.addEventListener("squeezeend",A),i.addEventListener("end",O),i.addEventListener("inputsourceschange",F),g.xrCompatible!==!0&&await t.makeXRCompatible(),I=e.getPixelRatio(),e.getSize(y),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const Q={antialias:i.renderState.layers!==void 0||g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(i,t,Q),i.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),_=new Yn(p.framebufferWidth,p.framebufferHeight,{format:li,type:ir,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil})}else{let Q=null,ve=null,R=null;g.depth&&(R=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Q=g.stencil?dr:hs,ve=g.stencil?cs:Wi);const T={colorFormat:t.RGBA8,depthFormat:R,scaleFactor:r};u=new XRWebGLBinding(i,t),d=u.createProjectionLayer(T),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),_=new Yn(d.textureWidth,d.textureHeight,{format:li,type:ir,depthTexture:new jd(d.textureWidth,d.textureHeight,ve,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0}),e.properties.get(_).__ignoreDepthValues=d.ignoreDepthValues}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),$.setContext(i),$.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode};const j=new M,J=new M;function W(N,Q){Q===null?N.matrixWorld.copy(N.matrix):N.matrixWorld.multiplyMatrices(Q.matrixWorld,N.matrix),N.matrixWorldInverse.copy(N.matrixWorld).invert()}this.updateCamera=function(N){if(i===null)return;b.near=w.near=S.near=N.near,b.far=w.far=S.far=N.far,C===b.near&&U===b.far||(i.updateRenderState({depthNear:b.near,depthFar:b.far}),C=b.near,U=b.far);const Q=N.parent,ve=b.cameras;W(b,Q);for(let R=0;R<ve.length;R++)W(ve[R],Q);ve.length===2?(function(R,T,G){j.setFromMatrixPosition(T.matrixWorld),J.setFromMatrixPosition(G.matrixWorld);const Z=j.distanceTo(J),D=T.projectionMatrix.elements,K=G.projectionMatrix.elements,B=D[14]/(D[10]-1),V=D[14]/(D[10]+1),q=(D[9]+1)/D[5],oe=(D[9]-1)/D[5],ae=(D[8]-1)/D[0],E=(K[8]+1)/K[0],Y=B*ae,z=B*E,H=Z/(-ae+E),he=H*-ae;T.matrixWorld.decompose(R.position,R.quaternion,R.scale),R.translateX(he),R.translateZ(H),R.matrixWorld.compose(R.position,R.quaternion,R.scale),R.matrixWorldInverse.copy(R.matrixWorld).invert();const fe=B+H,Se=V+H,Ee=Y-he,De=z+(Z-he),Te=q*V/Se*fe,Ae=oe*V/Se*fe;R.projectionMatrix.makePerspective(Ee,De,Te,Ae,fe,Se),R.projectionMatrixInverse.copy(R.projectionMatrix).invert()})(b,S,w):b.projectionMatrix.copy(S.projectionMatrix),(function(R,T,G){G===null?R.matrix.copy(T.matrixWorld):(R.matrix.copy(G.matrixWorld),R.matrix.invert(),R.matrix.multiply(T.matrixWorld)),R.matrix.decompose(R.position,R.quaternion,R.scale),R.updateMatrixWorld(!0),R.projectionMatrix.copy(T.projectionMatrix),R.projectionMatrixInverse.copy(T.projectionMatrixInverse),R.isPerspectiveCamera&&(R.fov=2*mr*Math.atan(1/R.projectionMatrix.elements[5]),R.zoom=1)})(N,b,Q)},this.getCamera=function(){return b},this.getFoveation=function(){if(d!==null||p!==null)return l},this.setFoveation=function(N){l=N,d!==null&&(d.fixedFoveation=N),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=N)};let k=null;const $=new qd;$.setAnimationLoop(function(N,Q){if(h=Q.getViewerPose(c||a),f=Q,h!==null){const ve=h.views;p!==null&&(e.setRenderTargetFramebuffer(_,p.framebuffer),e.setRenderTarget(_));let R=!1;ve.length!==b.cameras.length&&(b.cameras.length=0,R=!0);for(let T=0;T<ve.length;T++){const G=ve[T];let Z=null;if(p!==null)Z=p.getViewport(G);else{const K=u.getViewSubImage(d,G);Z=K.viewport,T===0&&(e.setRenderTargetTextures(_,K.colorTexture,d.ignoreDepthValues?void 0:K.depthStencilTexture),e.setRenderTarget(_))}let D=L[T];D===void 0&&(D=new gn,D.layers.enable(T),D.viewport=new Pt,L[T]=D),D.matrix.fromArray(G.transform.matrix),D.matrix.decompose(D.position,D.quaternion,D.scale),D.projectionMatrix.fromArray(G.projectionMatrix),D.projectionMatrixInverse.copy(D.projectionMatrix).invert(),D.viewport.set(Z.x,Z.y,Z.width,Z.height),T===0&&(b.matrix.copy(D.matrix),b.matrix.decompose(b.position,b.quaternion,b.scale)),R===!0&&b.cameras.push(D)}}for(let ve=0;ve<x.length;ve++){const R=v[ve],T=x[ve];R!==null&&T!==void 0&&T.update(R,Q,c||a)}k&&k(N,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),f=null}),this.setAnimationLoop=function(N){k=N},this.dispose=function(){}}}function l0(s,e){function t(i,r){i.matrixAutoUpdate===!0&&i.updateMatrix(),r.value.copy(i.matrix)}function n(i,r){i.opacity.value=r.opacity,r.color&&i.diffuse.value.copy(r.color),r.emissive&&i.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(i.map.value=r.map,t(r.map,i.mapTransform)),r.alphaMap&&(i.alphaMap.value=r.alphaMap,t(r.alphaMap,i.alphaMapTransform)),r.bumpMap&&(i.bumpMap.value=r.bumpMap,t(r.bumpMap,i.bumpMapTransform),i.bumpScale.value=r.bumpScale,r.side===1&&(i.bumpScale.value*=-1)),r.normalMap&&(i.normalMap.value=r.normalMap,t(r.normalMap,i.normalMapTransform),i.normalScale.value.copy(r.normalScale),r.side===1&&i.normalScale.value.negate()),r.displacementMap&&(i.displacementMap.value=r.displacementMap,t(r.displacementMap,i.displacementMapTransform),i.displacementScale.value=r.displacementScale,i.displacementBias.value=r.displacementBias),r.emissiveMap&&(i.emissiveMap.value=r.emissiveMap,t(r.emissiveMap,i.emissiveMapTransform)),r.specularMap&&(i.specularMap.value=r.specularMap,t(r.specularMap,i.specularMapTransform)),r.alphaTest>0&&(i.alphaTest.value=r.alphaTest);const a=e.get(r).envMap;if(a&&(i.envMap.value=a,i.flipEnvMap.value=a.isCubeTexture&&a.isRenderTargetTexture===!1?-1:1,i.reflectivity.value=r.reflectivity,i.ior.value=r.ior,i.refractionRatio.value=r.refractionRatio),r.lightMap){i.lightMap.value=r.lightMap;const o=s._useLegacyLights===!0?Math.PI:1;i.lightMapIntensity.value=r.lightMapIntensity*o,t(r.lightMap,i.lightMapTransform)}r.aoMap&&(i.aoMap.value=r.aoMap,i.aoMapIntensity.value=r.aoMapIntensity,t(r.aoMap,i.aoMapTransform))}return{refreshFogUniforms:function(i,r){r.color.getRGB(i.fogColor.value,Gd(s)),r.isFog?(i.fogNear.value=r.near,i.fogFar.value=r.far):r.isFogExp2&&(i.fogDensity.value=r.density)},refreshMaterialUniforms:function(i,r,a,o,l){r.isMeshBasicMaterial||r.isMeshLambertMaterial?n(i,r):r.isMeshToonMaterial?(n(i,r),(function(c,h){h.gradientMap&&(c.gradientMap.value=h.gradientMap)})(i,r)):r.isMeshPhongMaterial?(n(i,r),(function(c,h){c.specular.value.copy(h.specular),c.shininess.value=Math.max(h.shininess,1e-4)})(i,r)):r.isMeshStandardMaterial?(n(i,r),(function(c,h){c.metalness.value=h.metalness,h.metalnessMap&&(c.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,c.metalnessMapTransform)),c.roughness.value=h.roughness,h.roughnessMap&&(c.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,c.roughnessMapTransform)),e.get(h).envMap&&(c.envMapIntensity.value=h.envMapIntensity)})(i,r),r.isMeshPhysicalMaterial&&(function(c,h,u){c.ior.value=h.ior,h.sheen>0&&(c.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),c.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(c.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,c.sheenColorMapTransform)),h.sheenRoughnessMap&&(c.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,c.sheenRoughnessMapTransform))),h.clearcoat>0&&(c.clearcoat.value=h.clearcoat,c.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(c.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,c.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(c.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===1&&c.clearcoatNormalScale.value.negate())),h.iridescence>0&&(c.iridescence.value=h.iridescence,c.iridescenceIOR.value=h.iridescenceIOR,c.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],c.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(c.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,c.iridescenceMapTransform)),h.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),h.transmission>0&&(c.transmission.value=h.transmission,c.transmissionSamplerMap.value=u.texture,c.transmissionSamplerSize.value.set(u.width,u.height),h.transmissionMap&&(c.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,c.transmissionMapTransform)),c.thickness.value=h.thickness,h.thicknessMap&&(c.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=h.attenuationDistance,c.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(c.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(c.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=h.specularIntensity,c.specularColor.value.copy(h.specularColor),h.specularColorMap&&(c.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,c.specularColorMapTransform)),h.specularIntensityMap&&(c.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,c.specularIntensityMapTransform))})(i,r,l)):r.isMeshMatcapMaterial?(n(i,r),(function(c,h){h.matcap&&(c.matcap.value=h.matcap)})(i,r)):r.isMeshDepthMaterial?n(i,r):r.isMeshDistanceMaterial?(n(i,r),(function(c,h){const u=e.get(h).light;c.referencePosition.value.setFromMatrixPosition(u.matrixWorld),c.nearDistance.value=u.shadow.camera.near,c.farDistance.value=u.shadow.camera.far})(i,r)):r.isMeshNormalMaterial?n(i,r):r.isLineBasicMaterial?((function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform))})(i,r),r.isLineDashedMaterial&&(function(c,h){c.dashSize.value=h.dashSize,c.totalSize.value=h.dashSize+h.gapSize,c.scale.value=h.scale})(i,r)):r.isPointsMaterial?(function(c,h,u,d){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.size.value=h.size*u,c.scale.value=.5*d,h.map&&(c.map.value=h.map,t(h.map,c.uvTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)})(i,r,a,o):r.isSpriteMaterial?(function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.rotation.value=h.rotation,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)})(i,r):r.isShadowMaterial?(i.color.value.copy(r.color),i.opacity.value=r.opacity):r.isShaderMaterial&&(r.uniformsNeedUpdate=!1)}}}function c0(s,e,t,n){let i={},r={},a=[];const o=t.isWebGL2?s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(u,d,p,f){const g=u.value,m=d+"_"+p;if(f[m]===void 0)return f[m]=typeof g=="number"||typeof g=="boolean"?g:g.clone(),!0;{const _=f[m];if(typeof g=="number"||typeof g=="boolean"){if(_!==g)return f[m]=g,!0}else if(_.equals(g)===!1)return _.copy(g),!0}return!1}function c(u){const d={boundary:0,storage:0};return typeof u=="number"||typeof u=="boolean"?(d.boundary=4,d.storage=4):u.isVector2?(d.boundary=8,d.storage=8):u.isVector3||u.isColor?(d.boundary=16,d.storage=12):u.isVector4?(d.boundary=16,d.storage=16):u.isMatrix3?(d.boundary=48,d.storage=48):u.isMatrix4?(d.boundary=64,d.storage=64):u.isTexture,d}function h(u){const d=u.target;d.removeEventListener("dispose",h);const p=a.indexOf(d.__bindingPointIndex);a.splice(p,1),s.deleteBuffer(i[d.id]),delete i[d.id],delete r[d.id]}return{bind:function(u,d){const p=d.program;n.uniformBlockBinding(u,p)},update:function(u,d){let p=i[u.id];p===void 0&&((function(m){const _=m.uniforms;let x=0;const v=16;for(let I=0,S=_.length;I<S;I++){const w=Array.isArray(_[I])?_[I]:[_[I]];for(let L=0,b=w.length;L<b;L++){const C=w[L],U=Array.isArray(C.value)?C.value:[C.value];for(let A=0,O=U.length;A<O;A++){const F=c(U[A]),j=x%v;j!==0&&v-j<F.boundary&&(x+=v-j),C.__data=new Float32Array(F.storage/Float32Array.BYTES_PER_ELEMENT),C.__offset=x,x+=F.storage}}}const y=x%v;y>0&&(x+=v-y),m.__size=x,m.__cache={}})(u),p=(function(m){const _=(function(){for(let I=0;I<o;I++)if(a.indexOf(I)===-1)return a.push(I),I;return 0})();m.__bindingPointIndex=_;const x=s.createBuffer(),v=m.__size,y=m.usage;return s.bindBuffer(s.UNIFORM_BUFFER,x),s.bufferData(s.UNIFORM_BUFFER,v,y),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,_,x),x})(u),i[u.id]=p,u.addEventListener("dispose",h));const f=d.program;n.updateUBOMapping(u,f);const g=e.render.frame;r[u.id]!==g&&((function(m){const _=i[m.id],x=m.uniforms,v=m.__cache;s.bindBuffer(s.UNIFORM_BUFFER,_);for(let y=0,I=x.length;y<I;y++){const S=Array.isArray(x[y])?x[y]:[x[y]];for(let w=0,L=S.length;w<L;w++){const b=S[w];if(l(b,y,w,v)===!0){const C=b.__offset,U=Array.isArray(b.value)?b.value:[b.value];let A=0;for(let O=0;O<U.length;O++){const F=U[O],j=c(F);typeof F=="number"||typeof F=="boolean"?(b.__data[0]=F,s.bufferSubData(s.UNIFORM_BUFFER,C+A,b.__data)):F.isMatrix3?(b.__data[0]=F.elements[0],b.__data[1]=F.elements[1],b.__data[2]=F.elements[2],b.__data[3]=0,b.__data[4]=F.elements[3],b.__data[5]=F.elements[4],b.__data[6]=F.elements[5],b.__data[7]=0,b.__data[8]=F.elements[6],b.__data[9]=F.elements[7],b.__data[10]=F.elements[8],b.__data[11]=0):(F.toArray(b.__data,A),A+=j.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,C,b.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)})(u),r[u.id]=g)},dispose:function(){for(const u in i)s.deleteBuffer(i[u]);a=[],i={},r={}}}}let Qd=class{constructor(e={}){const{canvas:t=lm(),context:n=null,depth:i=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e;let d;this.isWebGLRenderer=!0,d=n!==null?n.getContextAttributes().alpha:a;const p=new Uint32Array(4),f=new Int32Array(4);let g=null,m=null;const _=[],x=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ut,this._useLegacyLights=!1,this.toneMapping=0,this.toneMappingExposure=1;const v=this;let y=!1,I=0,S=0,w=null,L=-1,b=null;const C=new Pt,U=new Pt;let A=null;const O=new Ue(0);let F=0,j=t.width,J=t.height,W=1,k=null,$=null;const N=new Pt(0,0,j,J),Q=new Pt(0,0,j,J);let ve=!1;const R=new Hc;let T=!1,G=!1,Z=null;const D=new at,K=new xe,B=new M,V={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function q(){return w===null?W:1}let oe,ae,E,Y,z,H,he,fe,Se,Ee,De,Te,Ae,$e,ht,Re,et,Ze,zt,Zn,Ci,tn,it,Pn,ne=n;function Vn(P,ee){for(let le=0;le<P.length;le++){const me=P[le],ie=t.getContext(me,ee);if(ie!==null)return ie}return null}try{const P={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${hc}`),t.addEventListener("webglcontextlost",fs,!1),t.addEventListener("webglcontextrestored",ms,!1),t.addEventListener("webglcontextcreationerror",gs,!1),ne===null){const ee=["webgl2","webgl","experimental-webgl"];if(v.isWebGL1Renderer===!0&&ee.shift(),ne=Vn(ee,P),ne===null)throw Vn(ee)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u",ne.getShaderPrecisionFormat===void 0&&(ne.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(P){throw P}function cn(){oe=new Om(ne),ae=new Im(ne,oe,e),oe.init(ae),tn=new s0(ne,oe,ae),E=new n0(ne,oe,ae),Y=new km(ne),z=new Xg,H=new i0(ne,oe,E,z,ae,tn,Y),he=new Dm(v),fe=new Um(v),Se=new Rm(ne,ae),it=new Pm(ne,oe,Se,ae),Ee=new Fm(ne,Se,Y,it),De=new Gm(ne,Ee,Se,Y),zt=new Hm(ne,ae,H),Re=new Nm(z),Te=new Wg(v,he,fe,oe,ae,it,Re),Ae=new l0(v,z),$e=new jg,ht=new Jg(oe,ae),Ze=new Cm(v,he,fe,E,De,d,l),et=new t0(v,De,ae),Pn=new c0(ne,Y,ae,E),Zn=new Lm(ne,oe,Y,ae),Ci=new Bm(ne,oe,Y,ae),Y.programs=Te.programs,v.capabilities=ae,v.extensions=oe,v.properties=z,v.renderLists=$e,v.shadowMap=et,v.state=E,v.info=Y}cn();const Ft=new o0(v,ne);function fs(P){P.preventDefault(),y=!0}function ms(){y=!1;const P=Y.autoReset,ee=et.enabled,le=et.autoUpdate,me=et.needsUpdate,ie=et.type;cn(),Y.autoReset=P,et.enabled=ee,et.autoUpdate=le,et.needsUpdate=me,et.type=ie}function gs(P){}function Ln(P){const ee=P.target;ee.removeEventListener("dispose",Ln),(function(le){(function(me){const ie=z.get(me).programs;ie!==void 0&&(ie.forEach(function(we){Te.releaseProgram(we)}),me.isShaderMaterial&&Te.releaseShaderCache(me))})(le),z.remove(le)})(ee)}function vn(P,ee,le){P.transparent===!0&&P.side===2&&P.forceSinglePass===!1?(P.side=1,P.needsUpdate=!0,Ki(P,ee,le),P.side=0,P.needsUpdate=!0,Ki(P,ee,le),P.side=2):Ki(P,ee,le)}this.xr=Ft,this.getContext=function(){return ne},this.getContextAttributes=function(){return ne.getContextAttributes()},this.forceContextLoss=function(){const P=oe.get("WEBGL_lose_context");P&&P.loseContext()},this.forceContextRestore=function(){const P=oe.get("WEBGL_lose_context");P&&P.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(P){P!==void 0&&(W=P,this.setSize(j,J,!1))},this.getSize=function(P){return P.set(j,J)},this.setSize=function(P,ee,le=!0){Ft.isPresenting||(j=P,J=ee,t.width=Math.floor(P*W),t.height=Math.floor(ee*W),le===!0&&(t.style.width=P+"px",t.style.height=ee+"px"),this.setViewport(0,0,P,ee))},this.getDrawingBufferSize=function(P){return P.set(j*W,J*W).floor()},this.setDrawingBufferSize=function(P,ee,le){j=P,J=ee,W=le,t.width=Math.floor(P*le),t.height=Math.floor(ee*le),this.setViewport(0,0,P,ee)},this.getCurrentViewport=function(P){return P.copy(C)},this.getViewport=function(P){return P.copy(N)},this.setViewport=function(P,ee,le,me){P.isVector4?N.set(P.x,P.y,P.z,P.w):N.set(P,ee,le,me),E.viewport(C.copy(N).multiplyScalar(W).floor())},this.getScissor=function(P){return P.copy(Q)},this.setScissor=function(P,ee,le,me){P.isVector4?Q.set(P.x,P.y,P.z,P.w):Q.set(P,ee,le,me),E.scissor(U.copy(Q).multiplyScalar(W).floor())},this.getScissorTest=function(){return ve},this.setScissorTest=function(P){E.setScissorTest(ve=P)},this.setOpaqueSort=function(P){k=P},this.setTransparentSort=function(P){$=P},this.getClearColor=function(P){return P.copy(Ze.getClearColor())},this.setClearColor=function(){Ze.setClearColor.apply(Ze,arguments)},this.getClearAlpha=function(){return Ze.getClearAlpha()},this.setClearAlpha=function(){Ze.setClearAlpha.apply(Ze,arguments)},this.clear=function(P=!0,ee=!0,le=!0){let me=0;if(P){let ie=!1;if(w!==null){const we=w.texture.format;ie=we===1033||we===1031||we===1029}if(ie){const we=w.texture.type,Ge=we===ir||we===Wi||we===zc||we===cs||we===1017||we===1018,qe=Ze.getClearColor(),Je=Ze.getClearAlpha(),Qe=qe.r,nt=qe.g,re=qe.b;Ge?(p[0]=Qe,p[1]=nt,p[2]=re,p[3]=Je,ne.clearBufferuiv(ne.COLOR,0,p)):(f[0]=Qe,f[1]=nt,f[2]=re,f[3]=Je,ne.clearBufferiv(ne.COLOR,0,f))}else me|=ne.COLOR_BUFFER_BIT}ee&&(me|=ne.DEPTH_BUFFER_BIT),le&&(me|=ne.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ne.clear(me)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",fs,!1),t.removeEventListener("webglcontextrestored",ms,!1),t.removeEventListener("webglcontextcreationerror",gs,!1),$e.dispose(),ht.dispose(),z.dispose(),he.dispose(),fe.dispose(),De.dispose(),it.dispose(),Pn.dispose(),Te.dispose(),Ft.dispose(),Ft.removeEventListener("sessionstart",Tr),Ft.removeEventListener("sessionend",xs),Z&&(Z.dispose(),Z=null),Jn.stop()},this.renderBufferDirect=function(P,ee,le,me,ie,we){ee===null&&(ee=V);const Ge=ie.isMesh&&ie.matrixWorld.determinant()<0,qe=(function(ue,ye,ge,be,_e){ye.isScene!==!0&&(ye=V),H.resetTextureUnits();const ze=ye.fog,Ne=be.isMeshStandardMaterial?ye.environment:null,We=w===null?v.outputColorSpace:w.isXRRenderTarget===!0?w.texture.colorSpace:en,je=(be.isMeshStandardMaterial?fe:he).get(be.envMap||Ne),mt=be.vertexColors===!0&&!!ge.attributes.color&&ge.attributes.color.itemSize===4,Tt=!!ge.attributes.tangent&&(!!be.normalMap||be.anisotropy>0),Bt=!!ge.morphAttributes.position,At=!!ge.morphAttributes.normal,Nt=!!ge.morphAttributes.color;let Mt=0;be.toneMapped&&(w!==null&&w.isXRRenderTarget!==!0||(Mt=v.toneMapping));const Lt=ge.morphAttributes.position||ge.morphAttributes.normal||ge.morphAttributes.color,vt=Lt!==void 0?Lt.length:0,Xe=z.get(be),Ht=m.state.lights;if(T===!0&&(G===!0||ue!==b)){const Oe=ue===b&&be.id===L;Re.setState(be,ue,Oe)}let Et=!1;be.version===Xe.__version?Xe.needsLights&&Xe.lightsStateVersion!==Ht.state.version||Xe.outputColorSpace!==We||_e.isBatchedMesh&&Xe.batching===!1?Et=!0:_e.isBatchedMesh||Xe.batching!==!0?_e.isInstancedMesh&&Xe.instancing===!1?Et=!0:_e.isInstancedMesh||Xe.instancing!==!0?_e.isSkinnedMesh&&Xe.skinning===!1?Et=!0:_e.isSkinnedMesh||Xe.skinning!==!0?_e.isInstancedMesh&&Xe.instancingColor===!0&&_e.instanceColor===null||_e.isInstancedMesh&&Xe.instancingColor===!1&&_e.instanceColor!==null||Xe.envMap!==je||be.fog===!0&&Xe.fog!==ze?Et=!0:Xe.numClippingPlanes===void 0||Xe.numClippingPlanes===Re.numPlanes&&Xe.numIntersection===Re.numIntersection?(Xe.vertexAlphas!==mt||Xe.vertexTangents!==Tt||Xe.morphTargets!==Bt||Xe.morphNormals!==At||Xe.morphColors!==Nt||Xe.toneMapping!==Mt||ae.isWebGL2===!0&&Xe.morphTargetsCount!==vt)&&(Et=!0):Et=!0:Et=!0:Et=!0:Et=!0:(Et=!0,Xe.__version=be.version);let kt=Xe.currentProgram;Et===!0&&(kt=Ki(be,ye,_e));let $t=!1,ut=!1,un=!1;const pt=kt.getUniforms(),gt=Xe.uniforms;if(E.useProgram(kt.program)&&($t=!0,ut=!0,un=!0),be.id!==L&&(L=be.id,ut=!0),$t||b!==ue){pt.setValue(ne,"projectionMatrix",ue.projectionMatrix),pt.setValue(ne,"viewMatrix",ue.matrixWorldInverse);const Oe=pt.map.cameraPosition;Oe!==void 0&&Oe.setValue(ne,B.setFromMatrixPosition(ue.matrixWorld)),ae.logarithmicDepthBuffer&&pt.setValue(ne,"logDepthBufFC",2/(Math.log(ue.far+1)/Math.LN2)),(be.isMeshPhongMaterial||be.isMeshToonMaterial||be.isMeshLambertMaterial||be.isMeshBasicMaterial||be.isMeshStandardMaterial||be.isShaderMaterial)&&pt.setValue(ne,"isOrthographic",ue.isOrthographicCamera===!0),b!==ue&&(b=ue,ut=!0,un=!0)}if(_e.isSkinnedMesh){pt.setOptional(ne,_e,"bindMatrix"),pt.setOptional(ne,_e,"bindMatrixInverse");const Oe=_e.skeleton;Oe&&ae.floatVertexTextures&&(Oe.boneTexture===null&&Oe.computeBoneTexture(),pt.setValue(ne,"boneTexture",Oe.boneTexture,H))}_e.isBatchedMesh&&(pt.setOptional(ne,_e,"batchingTexture"),pt.setValue(ne,"batchingTexture",_e._matricesTexture,H));const It=ge.morphAttributes;(It.position!==void 0||It.normal!==void 0||It.color!==void 0&&ae.isWebGL2===!0)&&zt.update(_e,ge,kt),(ut||Xe.receiveShadow!==_e.receiveShadow)&&(Xe.receiveShadow=_e.receiveShadow,pt.setValue(ne,"receiveShadow",_e.receiveShadow)),be.isMeshGouraudMaterial&&be.envMap!==null&&(gt.envMap.value=je,gt.flipEnvMap.value=je.isCubeTexture&&je.isRenderTargetTexture===!1?-1:1),ut&&(pt.setValue(ne,"toneMappingExposure",v.toneMappingExposure),Xe.needsLights&&(ke=un,(Be=gt).ambientLightColor.needsUpdate=ke,Be.lightProbe.needsUpdate=ke,Be.directionalLights.needsUpdate=ke,Be.directionalLightShadows.needsUpdate=ke,Be.pointLights.needsUpdate=ke,Be.pointLightShadows.needsUpdate=ke,Be.spotLights.needsUpdate=ke,Be.spotLightShadows.needsUpdate=ke,Be.rectAreaLights.needsUpdate=ke,Be.hemisphereLights.needsUpdate=ke),ze&&be.fog===!0&&Ae.refreshFogUniforms(gt,ze),Ae.refreshMaterialUniforms(gt,be,W,J,Z),Eo.upload(ne,Ma(Xe),gt,H));var Be,ke;if(be.isShaderMaterial&&be.uniformsNeedUpdate===!0&&(Eo.upload(ne,Ma(Xe),gt,H),be.uniformsNeedUpdate=!1),be.isSpriteMaterial&&pt.setValue(ne,"center",_e.center),pt.setValue(ne,"modelViewMatrix",_e.modelViewMatrix),pt.setValue(ne,"normalMatrix",_e.normalMatrix),pt.setValue(ne,"modelMatrix",_e.matrixWorld),be.isShaderMaterial||be.isRawShaderMaterial){const Oe=be.uniformsGroups;for(let ot=0,xn=Oe.length;ot<xn;ot++)if(ae.isWebGL2){const wt=Oe[ot];Pn.update(wt,kt),Pn.bind(wt,kt)}}return kt})(P,ee,le,me,ie);E.setMaterial(me,Ge);let Je=le.index,Qe=1;if(me.wireframe===!0){if(Je=Ee.getWireframeAttribute(le),Je===void 0)return;Qe=2}const nt=le.drawRange,re=le.attributes.position;let Pe=nt.start*Qe,de=(nt.start+nt.count)*Qe;we!==null&&(Pe=Math.max(Pe,we.start*Qe),de=Math.min(de,(we.start+we.count)*Qe)),Je!==null?(Pe=Math.max(Pe,0),de=Math.min(de,Je.count)):re!=null&&(Pe=Math.max(Pe,0),de=Math.min(de,re.count));const te=de-Pe;if(te<0||te===1/0)return;let pe;it.setup(ie,me,qe,le,Je);let X=Zn;if(Je!==null&&(pe=Se.get(Je),X=Ci,X.setIndex(pe)),ie.isMesh)me.wireframe===!0?(E.setLineWidth(me.wireframeLinewidth*q()),X.setMode(ne.LINES)):X.setMode(ne.TRIANGLES);else if(ie.isLine){let ue=me.linewidth;ue===void 0&&(ue=1),E.setLineWidth(ue*q()),ie.isLineSegments?X.setMode(ne.LINES):ie.isLineLoop?X.setMode(ne.LINE_LOOP):X.setMode(ne.LINE_STRIP)}else ie.isPoints?X.setMode(ne.POINTS):ie.isSprite&&X.setMode(ne.TRIANGLES);if(ie.isBatchedMesh)X.renderMultiDraw(ie._multiDrawStarts,ie._multiDrawCounts,ie._multiDrawCount);else if(ie.isInstancedMesh)X.renderInstances(Pe,te,ie.count);else if(le.isInstancedBufferGeometry){const ue=le._maxInstanceCount!==void 0?le._maxInstanceCount:1/0,ye=Math.min(le.instanceCount,ue);X.renderInstances(Pe,te,ye)}else X.render(Pe,te)},this.compile=function(P,ee,le=null){le===null&&(le=P),m=ht.get(le),m.init(),x.push(m),le.traverseVisible(function(ie){ie.isLight&&ie.layers.test(ee.layers)&&(m.pushLight(ie),ie.castShadow&&m.pushShadow(ie))}),P!==le&&P.traverseVisible(function(ie){ie.isLight&&ie.layers.test(ee.layers)&&(m.pushLight(ie),ie.castShadow&&m.pushShadow(ie))}),m.setupLights(v._useLegacyLights);const me=new Set;return P.traverse(function(ie){const we=ie.material;if(we)if(Array.isArray(we))for(let Ge=0;Ge<we.length;Ge++){const qe=we[Ge];vn(qe,le,ie),me.add(qe)}else vn(we,le,ie),me.add(we)}),x.pop(),m=null,me},this.compileAsync=function(P,ee,le=null){const me=this.compile(P,ee,le);return new Promise(ie=>{function we(){me.forEach(function(Ge){z.get(Ge).currentProgram.isReady()&&me.delete(Ge)}),me.size!==0?setTimeout(we,10):ie(P)}oe.get("KHR_parallel_shader_compile")!==null?we():setTimeout(we,10)})};let vs=null;function Tr(){Jn.stop()}function xs(){Jn.start()}const Jn=new qd;function Ar(P,ee,le,me){if(P.visible===!1)return;if(P.layers.test(ee.layers)){if(P.isGroup)le=P.renderOrder;else if(P.isLOD)P.autoUpdate===!0&&P.update(ee);else if(P.isLight)m.pushLight(P),P.castShadow&&m.pushShadow(P);else if(P.isSprite){if(!P.frustumCulled||R.intersectsSprite(P)){me&&B.setFromMatrixPosition(P.matrixWorld).applyMatrix4(D);const we=De.update(P),Ge=P.material;Ge.visible&&g.push(P,we,Ge,le,B.z,null)}}else if((P.isMesh||P.isLine||P.isPoints)&&(!P.frustumCulled||R.intersectsObject(P))){const we=De.update(P),Ge=P.material;if(me&&(P.boundingSphere!==void 0?(P.boundingSphere===null&&P.computeBoundingSphere(),B.copy(P.boundingSphere.center)):(we.boundingSphere===null&&we.computeBoundingSphere(),B.copy(we.boundingSphere.center)),B.applyMatrix4(P.matrixWorld).applyMatrix4(D)),Array.isArray(Ge)){const qe=we.groups;for(let Je=0,Qe=qe.length;Je<Qe;Je++){const nt=qe[Je],re=Ge[nt.materialIndex];re&&re.visible&&g.push(P,we,re,le,B.z,nt)}}else Ge.visible&&g.push(P,we,Ge,le,B.z,null)}}const ie=P.children;for(let we=0,Ge=ie.length;we<Ge;we++)Ar(ie[we],ee,le,me)}function hn(P,ee,le,me){const ie=P.opaque,we=P.transmissive,Ge=P.transparent;m.setupLightsView(le),T===!0&&Re.setGlobalState(v.clippingPlanes,le),we.length>0&&(function(qe,Je,Qe,nt){if((Qe.isScene===!0?Qe.overrideMaterial:null)!==null)return;const Pe=ae.isWebGL2;Z===null&&(Z=new Yn(1,1,{generateMipmaps:!0,type:oe.has("EXT_color_buffer_half_float")?wi:ir,minFilter:ur,samples:Pe?4:0})),v.getDrawingBufferSize(K),Pe?Z.setSize(K.x,K.y):Z.setSize(Fo(K.x),Fo(K.y));const de=v.getRenderTarget();v.setRenderTarget(Z),v.getClearColor(O),F=v.getClearAlpha(),F<1&&v.setClearColor(16777215,.5),v.clear();const te=v.toneMapping;v.toneMapping=0,_s(qe,Qe,nt),H.updateMultisampleRenderTarget(Z),H.updateRenderTargetMipmap(Z);let pe=!1;for(let X=0,ue=Je.length;X<ue;X++){const ye=Je[X],ge=ye.object,be=ye.geometry,_e=ye.material,ze=ye.group;if(_e.side===2&&ge.layers.test(nt.layers)){const Ne=_e.side;_e.side=1,_e.needsUpdate=!0,ba(ge,Qe,nt,be,_e,ze),_e.side=Ne,_e.needsUpdate=!0,pe=!0}}pe===!0&&(H.updateMultisampleRenderTarget(Z),H.updateRenderTargetMipmap(Z)),v.setRenderTarget(de),v.setClearColor(O,F),v.toneMapping=te})(ie,we,ee,le),me&&E.viewport(C.copy(me)),ie.length>0&&_s(ie,ee,le),we.length>0&&_s(we,ee,le),Ge.length>0&&_s(Ge,ee,le),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function _s(P,ee,le){const me=ee.isScene===!0?ee.overrideMaterial:null;for(let ie=0,we=P.length;ie<we;ie++){const Ge=P[ie],qe=Ge.object,Je=Ge.geometry,Qe=me===null?Ge.material:me,nt=Ge.group;qe.layers.test(le.layers)&&ba(qe,ee,le,Je,Qe,nt)}}function ba(P,ee,le,me,ie,we){P.onBeforeRender(v,ee,le,me,ie,we),P.modelViewMatrix.multiplyMatrices(le.matrixWorldInverse,P.matrixWorld),P.normalMatrix.getNormalMatrix(P.modelViewMatrix),ie.onBeforeRender(v,ee,le,me,P,we),ie.transparent===!0&&ie.side===2&&ie.forceSinglePass===!1?(ie.side=1,ie.needsUpdate=!0,v.renderBufferDirect(le,ee,me,ie,P,we),ie.side=0,ie.needsUpdate=!0,v.renderBufferDirect(le,ee,me,ie,P,we),ie.side=2):v.renderBufferDirect(le,ee,me,ie,P,we),P.onAfterRender(v,ee,le,me,ie,we)}function Ki(P,ee,le){ee.isScene!==!0&&(ee=V);const me=z.get(P),ie=m.state.lights,we=m.state.shadowsArray,Ge=ie.state.version,qe=Te.getParameters(P,ie.state,we,ee,le),Je=Te.getProgramCacheKey(qe);let Qe=me.programs;me.environment=P.isMeshStandardMaterial?ee.environment:null,me.fog=ee.fog,me.envMap=(P.isMeshStandardMaterial?fe:he).get(P.envMap||me.environment),Qe===void 0&&(P.addEventListener("dispose",Ln),Qe=new Map,me.programs=Qe);let nt=Qe.get(Je);if(nt!==void 0){if(me.currentProgram===nt&&me.lightsStateVersion===Ge)return Er(P,qe),nt}else qe.uniforms=Te.getUniforms(P),P.onBuild(le,qe,v),P.onBeforeCompile(qe,v),nt=Te.acquireProgram(qe,Je),Qe.set(Je,nt),me.uniforms=qe.uniforms;const re=me.uniforms;return(P.isShaderMaterial||P.isRawShaderMaterial)&&P.clipping!==!0||(re.clippingPlanes=Re.uniform),Er(P,qe),me.needsLights=(function(Pe){return Pe.isMeshLambertMaterial||Pe.isMeshToonMaterial||Pe.isMeshPhongMaterial||Pe.isMeshStandardMaterial||Pe.isShadowMaterial||Pe.isShaderMaterial&&Pe.lights===!0})(P),me.lightsStateVersion=Ge,me.needsLights&&(re.ambientLightColor.value=ie.state.ambient,re.lightProbe.value=ie.state.probe,re.directionalLights.value=ie.state.directional,re.directionalLightShadows.value=ie.state.directionalShadow,re.spotLights.value=ie.state.spot,re.spotLightShadows.value=ie.state.spotShadow,re.rectAreaLights.value=ie.state.rectArea,re.ltc_1.value=ie.state.rectAreaLTC1,re.ltc_2.value=ie.state.rectAreaLTC2,re.pointLights.value=ie.state.point,re.pointLightShadows.value=ie.state.pointShadow,re.hemisphereLights.value=ie.state.hemi,re.directionalShadowMap.value=ie.state.directionalShadowMap,re.directionalShadowMatrix.value=ie.state.directionalShadowMatrix,re.spotShadowMap.value=ie.state.spotShadowMap,re.spotLightMatrix.value=ie.state.spotLightMatrix,re.spotLightMap.value=ie.state.spotLightMap,re.pointShadowMap.value=ie.state.pointShadowMap,re.pointShadowMatrix.value=ie.state.pointShadowMatrix),me.currentProgram=nt,me.uniformsList=null,nt}function Ma(P){if(P.uniformsList===null){const ee=P.currentProgram.getUniforms();P.uniformsList=Eo.seqWithValue(ee.seq,P.uniforms)}return P.uniformsList}function Er(P,ee){const le=z.get(P);le.outputColorSpace=ee.outputColorSpace,le.batching=ee.batching,le.instancing=ee.instancing,le.instancingColor=ee.instancingColor,le.skinning=ee.skinning,le.morphTargets=ee.morphTargets,le.morphNormals=ee.morphNormals,le.morphColors=ee.morphColors,le.morphTargetsCount=ee.morphTargetsCount,le.numClippingPlanes=ee.numClippingPlanes,le.numIntersection=ee.numClipIntersection,le.vertexAlphas=ee.vertexAlphas,le.vertexTangents=ee.vertexTangents,le.toneMapping=ee.toneMapping}Jn.setAnimationLoop(function(P){vs&&vs(P)}),typeof self<"u"&&Jn.setContext(self),this.setAnimationLoop=function(P){vs=P,Ft.setAnimationLoop(P),P===null?Jn.stop():Jn.start()},Ft.addEventListener("sessionstart",Tr),Ft.addEventListener("sessionend",xs),this.render=function(P,ee){if(ee!==void 0&&ee.isCamera!==!0||y===!0)return;P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),ee.parent===null&&ee.matrixWorldAutoUpdate===!0&&ee.updateMatrixWorld(),Ft.enabled===!0&&Ft.isPresenting===!0&&(Ft.cameraAutoUpdate===!0&&Ft.updateCamera(ee),ee=Ft.getCamera()),P.isScene===!0&&P.onBeforeRender(v,P,ee,w),m=ht.get(P,x.length),m.init(),x.push(m),D.multiplyMatrices(ee.projectionMatrix,ee.matrixWorldInverse),R.setFromProjectionMatrix(D),G=this.localClippingEnabled,T=Re.init(this.clippingPlanes,G),g=$e.get(P,_.length),g.init(),_.push(g),Ar(P,ee,0,v.sortObjects),g.finish(),v.sortObjects===!0&&g.sort(k,$),this.info.render.frame++,T===!0&&Re.beginShadows();const le=m.state.shadowsArray;if(et.render(le,P,ee),T===!0&&Re.endShadows(),this.info.autoReset===!0&&this.info.reset(),Ze.render(g,P),m.setupLights(v._useLegacyLights),ee.isArrayCamera){const me=ee.cameras;for(let ie=0,we=me.length;ie<we;ie++){const Ge=me[ie];hn(g,P,Ge,Ge.viewport)}}else hn(g,P,ee);w!==null&&(H.updateMultisampleRenderTarget(w),H.updateRenderTargetMipmap(w)),P.isScene===!0&&P.onAfterRender(v,P,ee),it.resetDefaultState(),L=-1,b=null,x.pop(),m=x.length>0?x[x.length-1]:null,_.pop(),g=_.length>0?_[_.length-1]:null},this.getActiveCubeFace=function(){return I},this.getActiveMipmapLevel=function(){return S},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(P,ee,le){z.get(P.texture).__webglTexture=ee,z.get(P.depthTexture).__webglTexture=le;const me=z.get(P);me.__hasExternalTextures=!0,me.__hasExternalTextures&&(me.__autoAllocateDepthBuffer=le===void 0,me.__autoAllocateDepthBuffer||oe.has("WEBGL_multisampled_render_to_texture")===!0&&(me.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(P,ee){const le=z.get(P);le.__webglFramebuffer=ee,le.__useDefaultFramebuffer=ee===void 0},this.setRenderTarget=function(P,ee=0,le=0){w=P,I=ee,S=le;let me=!0,ie=null,we=!1,Ge=!1;if(P){const qe=z.get(P);qe.__useDefaultFramebuffer!==void 0?(E.bindFramebuffer(ne.FRAMEBUFFER,null),me=!1):qe.__webglFramebuffer===void 0?H.setupRenderTarget(P):qe.__hasExternalTextures&&H.rebindTextures(P,z.get(P.texture).__webglTexture,z.get(P.depthTexture).__webglTexture);const Je=P.texture;(Je.isData3DTexture||Je.isDataArrayTexture||Je.isCompressedArrayTexture)&&(Ge=!0);const Qe=z.get(P).__webglFramebuffer;P.isWebGLCubeRenderTarget?(ie=Array.isArray(Qe[ee])?Qe[ee][le]:Qe[ee],we=!0):ie=ae.isWebGL2&&P.samples>0&&H.useMultisampledRTT(P)===!1?z.get(P).__webglMultisampledFramebuffer:Array.isArray(Qe)?Qe[le]:Qe,C.copy(P.viewport),U.copy(P.scissor),A=P.scissorTest}else C.copy(N).multiplyScalar(W).floor(),U.copy(Q).multiplyScalar(W).floor(),A=ve;if(E.bindFramebuffer(ne.FRAMEBUFFER,ie)&&ae.drawBuffers&&me&&E.drawBuffers(P,ie),E.viewport(C),E.scissor(U),E.setScissorTest(A),we){const qe=z.get(P.texture);ne.framebufferTexture2D(ne.FRAMEBUFFER,ne.COLOR_ATTACHMENT0,ne.TEXTURE_CUBE_MAP_POSITIVE_X+ee,qe.__webglTexture,le)}else if(Ge){const qe=z.get(P.texture),Je=ee||0;ne.framebufferTextureLayer(ne.FRAMEBUFFER,ne.COLOR_ATTACHMENT0,qe.__webglTexture,le||0,Je)}L=-1},this.readRenderTargetPixels=function(P,ee,le,me,ie,we,Ge){if(!P||!P.isWebGLRenderTarget)return;let qe=z.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&Ge!==void 0&&(qe=qe[Ge]),qe){E.bindFramebuffer(ne.FRAMEBUFFER,qe);try{const Je=P.texture,Qe=Je.format,nt=Je.type;if(Qe!==li&&tn.convert(Qe)!==ne.getParameter(ne.IMPLEMENTATION_COLOR_READ_FORMAT))return;const re=nt===wi&&(oe.has("EXT_color_buffer_half_float")||ae.isWebGL2&&oe.has("EXT_color_buffer_float"));if(!(nt===ir||tn.convert(nt)===ne.getParameter(ne.IMPLEMENTATION_COLOR_READ_TYPE)||nt===$i&&(ae.isWebGL2||oe.has("OES_texture_float")||oe.has("WEBGL_color_buffer_float"))||re))return;ee>=0&&ee<=P.width-me&&le>=0&&le<=P.height-ie&&ne.readPixels(ee,le,me,ie,tn.convert(Qe),tn.convert(nt),we)}finally{const Je=w!==null?z.get(w).__webglFramebuffer:null;E.bindFramebuffer(ne.FRAMEBUFFER,Je)}}},this.copyFramebufferToTexture=function(P,ee,le=0){const me=Math.pow(2,-le),ie=Math.floor(ee.image.width*me),we=Math.floor(ee.image.height*me);H.setTexture2D(ee,0),ne.copyTexSubImage2D(ne.TEXTURE_2D,le,0,0,P.x,P.y,ie,we),E.unbindTexture()},this.copyTextureToTexture=function(P,ee,le,me=0){const ie=ee.image.width,we=ee.image.height,Ge=tn.convert(le.format),qe=tn.convert(le.type);H.setTexture2D(le,0),ne.pixelStorei(ne.UNPACK_FLIP_Y_WEBGL,le.flipY),ne.pixelStorei(ne.UNPACK_PREMULTIPLY_ALPHA_WEBGL,le.premultiplyAlpha),ne.pixelStorei(ne.UNPACK_ALIGNMENT,le.unpackAlignment),ee.isDataTexture?ne.texSubImage2D(ne.TEXTURE_2D,me,P.x,P.y,ie,we,Ge,qe,ee.image.data):ee.isCompressedTexture?ne.compressedTexSubImage2D(ne.TEXTURE_2D,me,P.x,P.y,ee.mipmaps[0].width,ee.mipmaps[0].height,Ge,ee.mipmaps[0].data):ne.texSubImage2D(ne.TEXTURE_2D,me,P.x,P.y,Ge,qe,ee.image),me===0&&le.generateMipmaps&&ne.generateMipmap(ne.TEXTURE_2D),E.unbindTexture()},this.copyTextureToTexture3D=function(P,ee,le,me,ie=0){if(v.isWebGL1Renderer)return;const we=P.max.x-P.min.x+1,Ge=P.max.y-P.min.y+1,qe=P.max.z-P.min.z+1,Je=tn.convert(me.format),Qe=tn.convert(me.type);let nt;if(me.isData3DTexture)H.setTexture3D(me,0),nt=ne.TEXTURE_3D;else{if(!me.isDataArrayTexture&&!me.isCompressedArrayTexture)return;H.setTexture2DArray(me,0),nt=ne.TEXTURE_2D_ARRAY}ne.pixelStorei(ne.UNPACK_FLIP_Y_WEBGL,me.flipY),ne.pixelStorei(ne.UNPACK_PREMULTIPLY_ALPHA_WEBGL,me.premultiplyAlpha),ne.pixelStorei(ne.UNPACK_ALIGNMENT,me.unpackAlignment);const re=ne.getParameter(ne.UNPACK_ROW_LENGTH),Pe=ne.getParameter(ne.UNPACK_IMAGE_HEIGHT),de=ne.getParameter(ne.UNPACK_SKIP_PIXELS),te=ne.getParameter(ne.UNPACK_SKIP_ROWS),pe=ne.getParameter(ne.UNPACK_SKIP_IMAGES),X=le.isCompressedTexture?le.mipmaps[ie]:le.image;ne.pixelStorei(ne.UNPACK_ROW_LENGTH,X.width),ne.pixelStorei(ne.UNPACK_IMAGE_HEIGHT,X.height),ne.pixelStorei(ne.UNPACK_SKIP_PIXELS,P.min.x),ne.pixelStorei(ne.UNPACK_SKIP_ROWS,P.min.y),ne.pixelStorei(ne.UNPACK_SKIP_IMAGES,P.min.z),le.isDataTexture||le.isData3DTexture?ne.texSubImage3D(nt,ie,ee.x,ee.y,ee.z,we,Ge,qe,Je,Qe,X.data):le.isCompressedArrayTexture?ne.compressedTexSubImage3D(nt,ie,ee.x,ee.y,ee.z,we,Ge,qe,Je,X.data):ne.texSubImage3D(nt,ie,ee.x,ee.y,ee.z,we,Ge,qe,Je,Qe,X),ne.pixelStorei(ne.UNPACK_ROW_LENGTH,re),ne.pixelStorei(ne.UNPACK_IMAGE_HEIGHT,Pe),ne.pixelStorei(ne.UNPACK_SKIP_PIXELS,de),ne.pixelStorei(ne.UNPACK_SKIP_ROWS,te),ne.pixelStorei(ne.UNPACK_SKIP_IMAGES,pe),ie===0&&me.generateMipmaps&&ne.generateMipmap(nt),E.unbindTexture()},this.initTexture=function(P){P.isCubeTexture?H.setTextureCube(P,0):P.isData3DTexture?H.setTexture3D(P,0):P.isDataArrayTexture||P.isCompressedArrayTexture?H.setTexture2DArray(P,0):H.setTexture2D(P,0),E.unbindTexture()},this.resetState=function(){I=0,S=0,w=null,E.reset(),it.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return fr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===Vc?"display-p3":"srgb",t.unpackColorSpace=_t.workingColorSpace===qo?"display-p3":"srgb"}get outputEncoding(){return this.outputColorSpace===Ut?us:3e3}set outputEncoding(e){this.outputColorSpace=e===us?Ut:en}get useLegacyLights(){return this._useLegacyLights}set useLegacyLights(e){this._useLegacyLights=e}};(class extends Qd{}).prototype.isWebGL1Renderer=!0;let h0=class ep{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ue(e),this.density=t}clone(){return new ep(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}},u0=class extends yt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}},tp=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=fc,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=zn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=zn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=zn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}};const pn=new M;let yc=class np{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)pn.fromBufferAttribute(this,t),pn.applyMatrix4(e),this.setXYZ(t,pn.x,pn.y,pn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)pn.fromBufferAttribute(this,t),pn.applyNormalMatrix(e),this.setXYZ(t,pn.x,pn.y,pn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)pn.fromBufferAttribute(this,t),pn.transformDirection(e),this.setXYZ(t,pn.x,pn.y,pn.z);return this}setX(e,t){return this.normalized&&(t=St(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=St(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=St(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=St(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=ri(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=ri(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=ri(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=ri(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=St(t,this.array),n=St(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=St(t,this.array),n=St(n,this.array),i=St(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=St(t,this.array),n=St(n,this.array),i=St(i,this.array),r=St(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new st(new this.array.constructor(t),this.itemSize,this.normalized)}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new np(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},bc=class extends Kn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ue(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Vs;const Gr=new M,Hs=new M,Gs=new M,Ws=new xe,Wr=new xe,ip=new at,eo=new M,Xr=new M,to=new M,hu=new xe,Wl=new xe,uu=new xe;let du=class extends yt{constructor(e=new bc){if(super(),this.isSprite=!0,this.type="Sprite",Vs===void 0){Vs=new rt;const t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new tp(t,5);Vs.setIndex([0,1,2,0,2,3]),Vs.setAttribute("position",new yc(n,3,0,!1)),Vs.setAttribute("uv",new yc(n,2,3,!1))}this.geometry=Vs,this.material=e,this.center=new xe(.5,.5)}raycast(e,t){e.camera,Hs.setFromMatrixScale(this.matrixWorld),ip.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Gs.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Hs.multiplyScalar(-Gs.z);const n=this.material.rotation;let i,r;n!==0&&(r=Math.cos(n),i=Math.sin(n));const a=this.center;no(eo.set(-.5,-.5,0),Gs,a,Hs,i,r),no(Xr.set(.5,-.5,0),Gs,a,Hs,i,r),no(to.set(.5,.5,0),Gs,a,Hs,i,r),hu.set(0,0),Wl.set(1,0),uu.set(1,1);let o=e.ray.intersectTriangle(eo,Xr,to,!1,Gr);if(o===null&&(no(Xr.set(-.5,.5,0),Gs,a,Hs,i,r),Wl.set(0,1),o=e.ray.intersectTriangle(eo,to,Xr,!1,Gr),o===null))return;const l=e.ray.origin.distanceTo(Gr);l<e.near||l>e.far||t.push({distance:l,point:Gr.clone(),uv:Qs.getInterpolation(Gr,eo,Xr,to,hu,Wl,uu,new xe),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function no(s,e,t,n,i,r){Ws.subVectors(s,t).addScalar(.5).multiply(n),i!==void 0?(Wr.x=r*Ws.x-i*Ws.y,Wr.y=i*Ws.x+r*Ws.y):Wr.copy(Ws),s.copy(e),s.x+=Wr.x,s.y+=Wr.y,s.applyMatrix4(ip)}const pu=new M,fu=new Pt,mu=new Pt,d0=new M,gu=new at,io=new M,Xl=new ui,vu=new at,ql=new jo;let p0=class extends ce{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Sh,this.bindMatrix=new at,this.bindMatrixInverse=new at,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Ai),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,io),this.boundingBox.expandByPoint(io)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new ui),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,io),this.boundingSphere.expandByPoint(io)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Xl.copy(this.boundingSphere),Xl.applyMatrix4(i),e.ray.intersectsSphere(Xl)!==!1&&(vu.copy(i).invert(),ql.copy(e.ray).applyMatrix4(vu),this.boundingBox!==null&&ql.intersectsBox(this.boundingBox)===!1||this._computeIntersections(e,t,ql)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new Pt,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);const r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Sh?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode==="detached"&&this.bindMatrixInverse.copy(this.bindMatrix).invert()}applyBoneTransform(e,t){const n=this.skeleton,i=this.geometry;fu.fromBufferAttribute(i.attributes.skinIndex,e),mu.fromBufferAttribute(i.attributes.skinWeight,e),pu.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){const a=mu.getComponent(r);if(a!==0){const o=fu.getComponent(r);gu.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(d0.copy(pu).applyMatrix4(gu),a)}}return t.applyMatrix4(this.bindMatrixInverse)}boneTransform(e,t){return this.applyBoneTransform(e,t)}},sp=class extends yt{constructor(){super(),this.isBone=!0,this.type="Bone"}},f0=class extends Mn{constructor(e=null,t=1,n=1,i,r,a,o,l,c=1003,h=1003,u,d){super(null,a,o,l,c,h,i,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};const xu=new at,m0=new at;let g0=class rp{constructor(e=[],t=[]){this.uuid=zn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(16*e.length),t.length===0)this.calculateInverses();else if(e.length!==t.length){this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new at)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const n=new at;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,a=e.length;r<a;r++){const o=e[r]?e[r].matrixWorld:m0;xu.multiplyMatrices(o,t[r]),xu.toArray(n,16*r)}i!==null&&(i.needsUpdate=!0)}clone(){return new rp(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(4*this.bones.length);e=4*Math.ceil(e/4),e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const n=new f0(t,e,e,li,$i);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){const i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){let r=t[e.bones[n]];r===void 0&&(r=new sp),this.bones.push(r),this.boneInverses.push(new at().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){const e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){const a=t[i];e.bones.push(a.uuid);const o=n[i];e.boneInverses.push(o.toArray())}return e}},Mc=class extends st{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}};const Xs=new at,_u=new at,so=[],yu=new Ai,v0=new at,qr=new ce,jr=new ui;let x0=class extends ce{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Mc(new Float32Array(16*n),16),this.instanceColor=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,v0)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ai),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Xs),yu.copy(e.boundingBox).applyMatrix4(Xs),this.boundingBox.union(yu)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ui),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Xs),jr.copy(e.boundingSphere).applyMatrix4(Xs),this.boundingSphere.union(jr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,3*e)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,16*e)}raycast(e,t){const n=this.matrixWorld,i=this.count;if(qr.geometry=this.geometry,qr.material=this.material,qr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),jr.copy(this.boundingSphere),jr.applyMatrix4(n),e.ray.intersectsSphere(jr)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Xs),_u.multiplyMatrices(n,Xs),qr.matrixWorld=_u,qr.raycast(e,so);for(let a=0,o=so.length;a<o;a++){const l=so[a];l.instanceId=r,l.object=this,t.push(l)}so.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Mc(new Float32Array(3*this.instanceMatrix.count),3)),t.toArray(this.instanceColor.array,3*e)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,16*e)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}},Ko=class extends Kn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ue(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}};const bu=new M,Mu=new M,Su=new at,jl=new jo,ro=new ui;let Zo=class extends yt{constructor(e=new rt,t=new Ko){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)bu.fromBufferAttribute(t,i-1),Mu.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=bu.distanceTo(Mu);e.setAttribute("lineDistance",new dt(n,1))}return this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ro.copy(n.boundingSphere),ro.applyMatrix4(i),ro.radius+=r,e.ray.intersectsSphere(ro)===!1)return;Su.copy(i).invert(),jl.copy(e.ray).applyMatrix4(Su);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=new M,h=new M,u=new M,d=new M,p=this.isLineSegments?2:1,f=n.index,g=n.attributes.position;if(f!==null)for(let m=Math.max(0,a.start),_=Math.min(f.count,a.start+a.count)-1;m<_;m+=p){const x=f.getX(m),v=f.getX(m+1);if(c.fromBufferAttribute(g,x),h.fromBufferAttribute(g,v),jl.distanceSqToSegment(c,h,d,u)>l)continue;d.applyMatrix4(this.matrixWorld);const y=e.ray.origin.distanceTo(d);y<e.near||y>e.far||t.push({distance:y,point:u.clone().applyMatrix4(this.matrixWorld),index:m,face:null,faceIndex:null,object:this})}else for(let m=Math.max(0,a.start),_=Math.min(g.count,a.start+a.count)-1;m<_;m+=p){if(c.fromBufferAttribute(g,m),h.fromBufferAttribute(g,m+1),jl.distanceSqToSegment(c,h,d,u)>l)continue;d.applyMatrix4(this.matrixWorld);const x=e.ray.origin.distanceTo(d);x<e.near||x>e.far||t.push({distance:x,point:u.clone().applyMatrix4(this.matrixWorld),index:m,face:null,faceIndex:null,object:this})}}updateMorphTargets(){const e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){const n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++){const a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}};const wu=new M,Tu=new M;let ap=class extends Zo{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)wu.fromBufferAttribute(t,i),Tu.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+wu.distanceTo(Tu);e.setAttribute("lineDistance",new dt(n,1))}return this}},_0=class extends Zo{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},Qt=class extends Kn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ue(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};const Au=new at,Sc=new jo,ao=new ui,oo=new M;let an=class extends yt{constructor(e=new rt,t=new Qt){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ao.copy(n.boundingSphere),ao.applyMatrix4(i),ao.radius+=r,e.ray.intersectsSphere(ao)===!1)return;Au.copy(i).invert(),Sc.copy(e.ray).applyMatrix4(Au);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,h=n.attributes.position;if(c!==null)for(let u=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);u<d;u++){const p=c.getX(u);oo.fromBufferAttribute(h,p),Eu(oo,p,l,i,e,t,this)}else for(let u=Math.max(0,a.start),d=Math.min(h.count,a.start+a.count);u<d;u++)oo.fromBufferAttribute(h,u),Eu(oo,u,l,i,e,t,this)}updateMorphTargets(){const e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){const n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++){const a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}};function Eu(s,e,t,n,i,r,a){const o=Sc.distanceSqToPoint(s);if(o<t){const l=new M;Sc.closestPointToPoint(s,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,object:a})}}let vi=class extends Mn{constructor(e,t,n,i,r,a,o,l,c){super(e,t,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},ci=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return null}getPointAt(e,t){const n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let n,i=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){const n=this.getLengths();let i=0;const r=n.length;let a;a=t||e*n[r-1];let o,l=0,c=r-1;for(;l<=c;)if(i=Math.floor(l+(c-l)/2),o=n[i]-a,o<0)l=i+1;else{if(!(o>0)){c=i;break}c=i-1}if(i=c,n[i]===a)return i/(r-1);const h=n[i];return(i+(a-h)/(n[i+1]-h))/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);const a=this.getPoint(i),o=this.getPoint(r),l=t||(a.isVector2?new xe:new M);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){const n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t){const n=new M,i=[],r=[],a=[],o=new M,l=new at;for(let p=0;p<=e;p++){const f=p/e;i[p]=this.getTangentAt(f,new M)}r[0]=new M,a[0]=new M;let c=Number.MAX_VALUE;const h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let p=1;p<=e;p++){if(r[p]=r[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(i[p-1],i[p]),o.length()>Number.EPSILON){o.normalize();const f=Math.acos(Zt(i[p-1].dot(i[p]),-1,1));r[p].applyMatrix4(l.makeRotationAxis(o,f))}a[p].crossVectors(i[p],r[p])}if(t===!0){let p=Math.acos(Zt(r[0].dot(r[e]),-1,1));p/=e,i[0].dot(o.crossVectors(r[0],r[e]))>0&&(p=-p);for(let f=1;f<=e;f++)r[f].applyMatrix4(l.makeRotationAxis(i[f],p*f)),a[f].crossVectors(i[f],r[f])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},wc=class extends ci{constructor(e=0,t=0,n=1,i=1,r=0,a=2*Math.PI,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t){const n=t||new xe,i=2*Math.PI;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(r=a?0:i),this.aClockwise!==!0||a||(r===i?r=-i:r-=i);const o=this.aStartAngle+e*r;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*h-p*u+this.aX,c=d*u+p*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){const e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}};function Wc(){let s=0,e=0,t=0,n=0;function i(r,a,o,l){s=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){i(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,p=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,p*=h,i(a,o,d,p)},calc:function(r){const a=r*r;return s+e*r+t*a+n*(a*r)}}}const lo=new M,$l=new Wc,Yl=new Wc,Kl=new Wc;function Ru(s,e,t,n,i){const r=.5*(n-e),a=.5*(i-t),o=s*s;return(2*t-2*n+r+a)*(s*o)+(-3*t+3*n-2*r-a)*o+r*s+t}function la(s,e,t,n){return(function(i,r){const a=1-i;return a*a*r})(s,e)+(function(i,r){return 2*(1-i)*i*r})(s,t)+(function(i,r){return i*i*r})(s,n)}function ca(s,e,t,n,i){return(function(r,a){const o=1-r;return o*o*o*a})(s,e)+(function(r,a){const o=1-r;return 3*o*o*r*a})(s,t)+(function(r,a){return 3*(1-r)*r*r*a})(s,n)+(function(r,a){return r*r*r*a})(s,i)}let op=class extends ci{constructor(e=new xe,t=new xe,n=new xe,i=new xe){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new xe){const n=t,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(ca(e,i.x,r.x,a.x,o.x),ca(e,i.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},lp=class extends ci{constructor(e=new xe,t=new xe){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new xe){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new xe){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},cp=class extends ci{constructor(e=new xe,t=new xe,n=new xe){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new xe){const n=t,i=this.v0,r=this.v1,a=this.v2;return n.set(la(e,i.x,r.x,a.x),la(e,i.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},hp=class extends ci{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new xe){const n=t,i=this.points,r=(i.length-1)*e,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],u=i[a>i.length-3?i.length-1:a+2];return n.set(Ru(o,l.x,c.x,h.x,u.x),Ru(o,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const i=e.points[t];this.points.push(i.clone())}return this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const i=e.points[t];this.points.push(new xe().fromArray(i))}return this}};var Tc=Object.freeze({__proto__:null,ArcCurve:class extends wc{constructor(s,e,t,n,i,r){super(s,e,t,t,n,i,r),this.isArcCurve=!0,this.type="ArcCurve"}},CatmullRomCurve3:class extends ci{constructor(s=[],e=!1,t="centripetal",n=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=s,this.closed=e,this.curveType=t,this.tension=n}getPoint(s,e=new M){const t=e,n=this.points,i=n.length,r=(i-(this.closed?0:1))*s;let a,o,l=Math.floor(r),c=r-l;this.closed?l+=l>0?0:(Math.floor(Math.abs(l)/i)+1)*i:c===0&&l===i-1&&(l=i-2,c=1),this.closed||l>0?a=n[(l-1)%i]:(lo.subVectors(n[0],n[1]).add(n[0]),a=lo);const h=n[l%i],u=n[(l+1)%i];if(this.closed||l+2<i?o=n[(l+2)%i]:(lo.subVectors(n[i-1],n[i-2]).add(n[i-1]),o=lo),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let p=Math.pow(a.distanceToSquared(h),d),f=Math.pow(h.distanceToSquared(u),d),g=Math.pow(u.distanceToSquared(o),d);f<1e-4&&(f=1),p<1e-4&&(p=f),g<1e-4&&(g=f),$l.initNonuniformCatmullRom(a.x,h.x,u.x,o.x,p,f,g),Yl.initNonuniformCatmullRom(a.y,h.y,u.y,o.y,p,f,g),Kl.initNonuniformCatmullRom(a.z,h.z,u.z,o.z,p,f,g)}else this.curveType==="catmullrom"&&($l.initCatmullRom(a.x,h.x,u.x,o.x,this.tension),Yl.initCatmullRom(a.y,h.y,u.y,o.y,this.tension),Kl.initCatmullRom(a.z,h.z,u.z,o.z,this.tension));return t.set($l.calc(c),Yl.calc(c),Kl.calc(c)),t}copy(s){super.copy(s),this.points=[];for(let e=0,t=s.points.length;e<t;e++){const n=s.points[e];this.points.push(n.clone())}return this.closed=s.closed,this.curveType=s.curveType,this.tension=s.tension,this}toJSON(){const s=super.toJSON();s.points=[];for(let e=0,t=this.points.length;e<t;e++){const n=this.points[e];s.points.push(n.toArray())}return s.closed=this.closed,s.curveType=this.curveType,s.tension=this.tension,s}fromJSON(s){super.fromJSON(s),this.points=[];for(let e=0,t=s.points.length;e<t;e++){const n=s.points[e];this.points.push(new M().fromArray(n))}return this.closed=s.closed,this.curveType=s.curveType,this.tension=s.tension,this}},CubicBezierCurve:op,CubicBezierCurve3:class extends ci{constructor(s=new M,e=new M,t=new M,n=new M){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=s,this.v1=e,this.v2=t,this.v3=n}getPoint(s,e=new M){const t=e,n=this.v0,i=this.v1,r=this.v2,a=this.v3;return t.set(ca(s,n.x,i.x,r.x,a.x),ca(s,n.y,i.y,r.y,a.y),ca(s,n.z,i.z,r.z,a.z)),t}copy(s){return super.copy(s),this.v0.copy(s.v0),this.v1.copy(s.v1),this.v2.copy(s.v2),this.v3.copy(s.v3),this}toJSON(){const s=super.toJSON();return s.v0=this.v0.toArray(),s.v1=this.v1.toArray(),s.v2=this.v2.toArray(),s.v3=this.v3.toArray(),s}fromJSON(s){return super.fromJSON(s),this.v0.fromArray(s.v0),this.v1.fromArray(s.v1),this.v2.fromArray(s.v2),this.v3.fromArray(s.v3),this}},EllipseCurve:wc,LineCurve:lp,LineCurve3:class extends ci{constructor(s=new M,e=new M){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=s,this.v2=e}getPoint(s,e=new M){const t=e;return s===1?t.copy(this.v2):(t.copy(this.v2).sub(this.v1),t.multiplyScalar(s).add(this.v1)),t}getPointAt(s,e){return this.getPoint(s,e)}getTangent(s,e=new M){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(s,e){return this.getTangent(s,e)}copy(s){return super.copy(s),this.v1.copy(s.v1),this.v2.copy(s.v2),this}toJSON(){const s=super.toJSON();return s.v1=this.v1.toArray(),s.v2=this.v2.toArray(),s}fromJSON(s){return super.fromJSON(s),this.v1.fromArray(s.v1),this.v2.fromArray(s.v2),this}},QuadraticBezierCurve:cp,QuadraticBezierCurve3:class extends ci{constructor(s=new M,e=new M,t=new M){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=s,this.v1=e,this.v2=t}getPoint(s,e=new M){const t=e,n=this.v0,i=this.v1,r=this.v2;return t.set(la(s,n.x,i.x,r.x),la(s,n.y,i.y,r.y),la(s,n.z,i.z,r.z)),t}copy(s){return super.copy(s),this.v0.copy(s.v0),this.v1.copy(s.v1),this.v2.copy(s.v2),this}toJSON(){const s=super.toJSON();return s.v0=this.v0.toArray(),s.v1=this.v1.toArray(),s.v2=this.v2.toArray(),s}fromJSON(s){return super.fromJSON(s),this.v0.fromArray(s.v0),this.v1.fromArray(s.v1),this.v2.fromArray(s.v2),this}},SplineCurve:hp});let y0=class extends ci{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){const e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){const n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Tc[n](t,e))}return this}getPoint(e,t){const n=e*this.getLength(),i=this.getCurveLengths();let r=0;for(;r<i.length;){if(i[r]>=n){const a=i[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){const e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const e=[];let t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){const t=[];let n;for(let i=0,r=this.curves;i<r.length;i++){const a=r[i],o=a.isEllipseCurve?2*e:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){const e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){const i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const i=e.curves[t];this.curves.push(new Tc[i.type]().fromJSON(i))}return this}},Cu=class extends y0{constructor(e){super(),this.type="Path",this.currentPoint=new xe,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){const n=new lp(this.currentPoint.clone(),new xe(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){const r=new cp(this.currentPoint.clone(),new xe(e,t),new xe(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,r,a){const o=new op(this.currentPoint.clone(),new xe(e,t),new xe(n,i),new xe(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){const t=[this.currentPoint.clone()].concat(e),n=new hp(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,r,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,i,r,a),this}absarc(e,t,n,i,r,a){return this.absellipse(e,t,n,n,i,r,a),this}ellipse(e,t,n,i,r,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,i,r,a,o,l),this}absellipse(e,t,n,i,r,a,o,l){const c=new wc(e,t,n,i,r,a,o,l);if(this.curves.length>0){const u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){const e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Xc=class up extends rt{constructor(e=1,t=32,n=0,i=2*Math.PI){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);const r=[],a=[],o=[],l=[],c=new M,h=new xe;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){const p=n+u/t*i;c.x=e*Math.cos(p),c.y=e*Math.sin(p),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new dt(a,3)),this.setAttribute("normal",new dt(o,3)),this.setAttribute("uv",new dt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new up(e.radius,e.segments,e.thetaStart,e.thetaLength)}},kn=class dp extends rt{constructor(e=1,t=1,n=1,i=32,r=1,a=!1,o=0,l=2*Math.PI){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),r=Math.floor(r);const h=[],u=[],d=[],p=[];let f=0;const g=[],m=n/2;let _=0;function x(v){const y=f,I=new xe,S=new M;let w=0;const L=v===!0?e:t,b=v===!0?1:-1;for(let U=1;U<=i;U++)u.push(0,m*b,0),d.push(0,b,0),p.push(.5,.5),f++;const C=f;for(let U=0;U<=i;U++){const A=U/i*l+o,O=Math.cos(A),F=Math.sin(A);S.x=L*F,S.y=m*b,S.z=L*O,u.push(S.x,S.y,S.z),d.push(0,b,0),I.x=.5*O+.5,I.y=.5*F*b+.5,p.push(I.x,I.y),f++}for(let U=0;U<i;U++){const A=y+U,O=C+U;v===!0?h.push(O,O+1,A):h.push(O+1,O,A),w+=3}c.addGroup(_,w,v===!0?1:2),_+=w}(function(){const v=new M,y=new M;let I=0;const S=(t-e)/n;for(let w=0;w<=r;w++){const L=[],b=w/r,C=b*(t-e)+e;for(let U=0;U<=i;U++){const A=U/i,O=A*l+o,F=Math.sin(O),j=Math.cos(O);y.x=C*F,y.y=-b*n+m,y.z=C*j,u.push(y.x,y.y,y.z),v.set(F,S,j).normalize(),d.push(v.x,v.y,v.z),p.push(A,1-b),L.push(f++)}g.push(L)}for(let w=0;w<i;w++)for(let L=0;L<r;L++){const b=g[L][w],C=g[L+1][w],U=g[L+1][w+1],A=g[L][w+1];h.push(b,C,A),h.push(C,U,A),I+=6}c.addGroup(_,I,0),_+=I})(),a===!1&&(e>0&&x(!0),t>0&&x(!1)),this.setIndex(h),this.setAttribute("position",new dt(u,3)),this.setAttribute("normal",new dt(d,3)),this.setAttribute("uv",new dt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new dp(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};const co=new M,ho=new M,Zl=new M,uo=new Qs;class b0 extends rt{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){const i=Math.pow(10,4),r=Math.cos(sr*t),a=e.getIndex(),o=e.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),d={},p=[];for(let f=0;f<l;f+=3){a?(c[0]=a.getX(f),c[1]=a.getX(f+1),c[2]=a.getX(f+2)):(c[0]=f,c[1]=f+1,c[2]=f+2);const{a:g,b:m,c:_}=uo;if(g.fromBufferAttribute(o,c[0]),m.fromBufferAttribute(o,c[1]),_.fromBufferAttribute(o,c[2]),uo.getNormal(Zl),u[0]=`${Math.round(g.x*i)},${Math.round(g.y*i)},${Math.round(g.z*i)}`,u[1]=`${Math.round(m.x*i)},${Math.round(m.y*i)},${Math.round(m.z*i)}`,u[2]=`${Math.round(_.x*i)},${Math.round(_.y*i)},${Math.round(_.z*i)}`,u[0]!==u[1]&&u[1]!==u[2]&&u[2]!==u[0])for(let x=0;x<3;x++){const v=(x+1)%3,y=u[x],I=u[v],S=uo[h[x]],w=uo[h[v]],L=`${y}_${I}`,b=`${I}_${y}`;b in d&&d[b]?(Zl.dot(d[b].normal)<=r&&(p.push(S.x,S.y,S.z),p.push(w.x,w.y,w.z)),d[b]=null):L in d||(d[L]={index0:c[x],index1:c[v],normal:Zl.clone()})}}for(const f in d)if(d[f]){const{index0:g,index1:m}=d[f];co.fromBufferAttribute(o,g),ho.fromBufferAttribute(o,m),p.push(co.x,co.y,co.z),p.push(ho.x,ho.y,ho.z)}this.setAttribute("position",new dt(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class pp extends Cu{constructor(e){super(e),this.uuid=zn(),this.type="Shape",this.holes=[]}getPointsHoles(e){const t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){const e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){const i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const i=e.holes[t];this.holes.push(new Cu().fromJSON(i))}return this}}const M0=function(s,e,t=2){const n=e&&e.length,i=n?e[0]*t:s.length;let r=Pu(s,0,i,t,!0);const a=[];if(!r||r.next===r.prev)return a;let o,l,c,h,u,d,p;if(n&&(r=(function(f,g,m,_){const x=[];let v,y,I,S,w;for(v=0,y=g.length;v<y;v++)I=g[v]*_,S=v<y-1?g[v+1]*_:f.length,w=Pu(f,I,S,_,!1),w===w.next&&(w.steiner=!0),x.push(P0(w));for(x.sort(E0),v=0;v<x.length;v++)m=R0(x[v],m);return m})(s,e,r,t)),s.length>80*t){o=c=s[0],l=h=s[1];for(let f=t;f<i;f+=t)u=s[f],d=s[f+1],u<o&&(o=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);p=Math.max(c-o,h-l),p=p!==0?32767/p:0}return fa(r,a,t,o,l,p,0),a};function Pu(s,e,t,n,i){let r,a;if(i===(function(o,l,c,h){let u=0;for(let d=l,p=c-h;d<c;d+=h)u+=(o[p]-o[d])*(o[d+1]+o[p+1]),p=d;return u})(s,e,t,n)>0)for(r=e;r<t;r+=n)a=Lu(r,s[r],s[r+1],a);else for(r=t-n;r>=e;r-=n)a=Lu(r,s[r],s[r+1],a);return a&&Jo(a,a.next)&&(ga(a),a=a.next),a}function ps(s,e){if(!s)return s;e||(e=s);let t,n=s;do if(t=!1,n.steiner||!Jo(n,n.next)&&Ot(n.prev,n,n.next)!==0)n=n.next;else{if(ga(n),n=e=n.prev,n===n.next)break;t=!0}while(t||n!==e);return e}function fa(s,e,t,n,i,r,a){if(!s)return;!a&&r&&(function(h,u,d,p){let f=h;do f.z===0&&(f.z=Ac(f.x,f.y,u,d,p)),f.prevZ=f.prev,f.nextZ=f.next,f=f.next;while(f!==h);f.prevZ.nextZ=null,f.prevZ=null,(function(g){let m,_,x,v,y,I,S,w,L=1;do{for(_=g,g=null,y=null,I=0;_;){for(I++,x=_,S=0,m=0;m<L&&(S++,x=x.nextZ,x);m++);for(w=L;S>0||w>0&&x;)S!==0&&(w===0||!x||_.z<=x.z)?(v=_,_=_.nextZ,S--):(v=x,x=x.nextZ,w--),y?y.nextZ=v:g=v,v.prevZ=y,y=v;_=x}y.nextZ=null,L*=2}while(I>1)})(f)})(s,n,i,r);let o,l,c=s;for(;s.prev!==s.next;)if(o=s.prev,l=s.next,r?w0(s,n,i,r):S0(s))e.push(o.i/t|0),e.push(s.i/t|0),e.push(l.i/t|0),ga(s),s=l.next,c=l.next;else if((s=l)===c){a?a===1?fa(s=T0(ps(s),e,t),e,t,n,i,r,2):a===2&&A0(s,e,t,n,i,r):fa(ps(s),e,t,n,i,r,1);break}}function S0(s){const e=s.prev,t=s,n=s.next;if(Ot(e,t,n)>=0)return!1;const i=e.x,r=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=i<r?i<a?i:a:r<a?r:a,u=o<l?o<c?o:c:l<c?l:c,d=i>r?i>a?i:a:r>a?r:a,p=o>l?o>c?o:c:l>c?l:c;let f=n.next;for(;f!==e;){if(f.x>=h&&f.x<=d&&f.y>=u&&f.y<=p&&er(i,o,r,l,a,c,f.x,f.y)&&Ot(f.prev,f,f.next)>=0)return!1;f=f.next}return!0}function w0(s,e,t,n){const i=s.prev,r=s,a=s.next;if(Ot(i,r,a)>=0)return!1;const o=i.x,l=r.x,c=a.x,h=i.y,u=r.y,d=a.y,p=o<l?o<c?o:c:l<c?l:c,f=h<u?h<d?h:d:u<d?u:d,g=o>l?o>c?o:c:l>c?l:c,m=h>u?h>d?h:d:u>d?u:d,_=Ac(p,f,e,t,n),x=Ac(g,m,e,t,n);let v=s.prevZ,y=s.nextZ;for(;v&&v.z>=_&&y&&y.z<=x;){if(v.x>=p&&v.x<=g&&v.y>=f&&v.y<=m&&v!==i&&v!==a&&er(o,h,l,u,c,d,v.x,v.y)&&Ot(v.prev,v,v.next)>=0||(v=v.prevZ,y.x>=p&&y.x<=g&&y.y>=f&&y.y<=m&&y!==i&&y!==a&&er(o,h,l,u,c,d,y.x,y.y)&&Ot(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;v&&v.z>=_;){if(v.x>=p&&v.x<=g&&v.y>=f&&v.y<=m&&v!==i&&v!==a&&er(o,h,l,u,c,d,v.x,v.y)&&Ot(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;y&&y.z<=x;){if(y.x>=p&&y.x<=g&&y.y>=f&&y.y<=m&&y!==i&&y!==a&&er(o,h,l,u,c,d,y.x,y.y)&&Ot(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function T0(s,e,t){let n=s;do{const i=n.prev,r=n.next.next;!Jo(i,r)&&fp(i,n,n.next,r)&&ma(i,r)&&ma(r,i)&&(e.push(i.i/t|0),e.push(n.i/t|0),e.push(r.i/t|0),ga(n),ga(n.next),n=s=r),n=n.next}while(n!==s);return ps(n)}function A0(s,e,t,n,i,r){let a=s;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&L0(a,o)){let l=mp(a,o);return a=ps(a,a.next),l=ps(l,l.next),fa(a,e,t,n,i,r,0),void fa(l,e,t,n,i,r,0)}o=o.next}a=a.next}while(a!==s)}function E0(s,e){return s.x-e.x}function R0(s,e){const t=(function(i,r){let a,o=r,l=-1/0;const c=i.x,h=i.y;do{if(h<=o.y&&h>=o.next.y&&o.next.y!==o.y){const m=o.x+(h-o.y)*(o.next.x-o.x)/(o.next.y-o.y);if(m<=c&&m>l&&(l=m,a=o.x<o.next.x?o:o.next,m===c))return a}o=o.next}while(o!==r);if(!a)return null;const u=a,d=a.x,p=a.y;let f,g=1/0;o=a;do c>=o.x&&o.x>=d&&c!==o.x&&er(h<p?c:l,h,d,p,h<p?l:c,h,o.x,o.y)&&(f=Math.abs(h-o.y)/(c-o.x),ma(o,i)&&(f<g||f===g&&(o.x>a.x||o.x===a.x&&C0(a,o)))&&(a=o,g=f)),o=o.next;while(o!==u);return a})(s,e);if(!t)return e;const n=mp(t,s);return ps(n,n.next),ps(t,t.next)}function C0(s,e){return Ot(s.prev,s,e.prev)<0&&Ot(e.next,s,s.next)<0}function Ac(s,e,t,n,i){return(s=1431655765&((s=858993459&((s=252645135&((s=16711935&((s=(s-t)*i|0)|s<<8))|s<<4))|s<<2))|s<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=(e-n)*i|0)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function P0(s){let e=s,t=s;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==s);return t}function er(s,e,t,n,i,r,a,o){return(i-a)*(e-o)>=(s-a)*(r-o)&&(s-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(i-a)*(n-o)}function L0(s,e){return s.next.i!==e.i&&s.prev.i!==e.i&&!(function(t,n){let i=t;do{if(i.i!==t.i&&i.next.i!==t.i&&i.i!==n.i&&i.next.i!==n.i&&fp(i,i.next,t,n))return!0;i=i.next}while(i!==t);return!1})(s,e)&&(ma(s,e)&&ma(e,s)&&(function(t,n){let i=t,r=!1;const a=(t.x+n.x)/2,o=(t.y+n.y)/2;do i.y>o!=i.next.y>o&&i.next.y!==i.y&&a<(i.next.x-i.x)*(o-i.y)/(i.next.y-i.y)+i.x&&(r=!r),i=i.next;while(i!==t);return r})(s,e)&&(Ot(s.prev,s,e.prev)||Ot(s,e.prev,e))||Jo(s,e)&&Ot(s.prev,s,s.next)>0&&Ot(e.prev,e,e.next)>0)}function Ot(s,e,t){return(e.y-s.y)*(t.x-e.x)-(e.x-s.x)*(t.y-e.y)}function Jo(s,e){return s.x===e.x&&s.y===e.y}function fp(s,e,t,n){const i=fo(Ot(s,e,t)),r=fo(Ot(s,e,n)),a=fo(Ot(t,n,s)),o=fo(Ot(t,n,e));return i!==r&&a!==o||!(i!==0||!po(s,t,e))||!(r!==0||!po(s,n,e))||!(a!==0||!po(t,s,n))||!(o!==0||!po(t,e,n))}function po(s,e,t){return e.x<=Math.max(s.x,t.x)&&e.x>=Math.min(s.x,t.x)&&e.y<=Math.max(s.y,t.y)&&e.y>=Math.min(s.y,t.y)}function fo(s){return s>0?1:s<0?-1:0}function ma(s,e){return Ot(s.prev,s,s.next)<0?Ot(s,e,s.next)>=0&&Ot(s,s.prev,e)>=0:Ot(s,e,s.prev)<0||Ot(s,s.next,e)<0}function mp(s,e){const t=new Ec(s.i,s.x,s.y),n=new Ec(e.i,e.x,e.y),i=s.next,r=e.prev;return s.next=e,e.prev=s,t.next=i,i.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function Lu(s,e,t,n){const i=new Ec(s,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function ga(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function Ec(s,e,t){this.i=s,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}class ha{static area(e){const t=e.length;let n=0;for(let i=t-1,r=0;r<t;i=r++)n+=e[i].x*e[r].y-e[r].x*e[i].y;return .5*n}static isClockWise(e){return ha.area(e)<0}static triangulateShape(e,t){const n=[],i=[],r=[];Iu(e),Nu(n,e);let a=e.length;t.forEach(Iu);for(let l=0;l<t.length;l++)i.push(a),a+=t[l].length,Nu(n,t[l]);const o=M0(n,i);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}}function Iu(s){const e=s.length;e>2&&s[e-1].equals(s[0])&&s.pop()}function Nu(s,e){for(let t=0;t<e.length;t++)s.push(e[t].x),s.push(e[t].y)}class qc extends rt{constructor(e=new pp([new xe(.5,.5),new xe(-.5,.5),new xe(-.5,-.5),new xe(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];const n=this,i=[],r=[];for(let o=0,l=e.length;o<l;o++)a(e[o]);function a(o){const l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1;let d=t.bevelEnabled===void 0||t.bevelEnabled,p=t.bevelThickness!==void 0?t.bevelThickness:.2,f=t.bevelSize!==void 0?t.bevelSize:p-.1,g=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3;const _=t.extrudePath,x=t.UVGenerator!==void 0?t.UVGenerator:I0;let v,y,I,S,w,L=!1;_&&(v=_.getSpacedPoints(h),L=!0,d=!1,y=_.computeFrenetFrames(h,!1),I=new M,S=new M,w=new M),d||(m=0,p=0,f=0,g=0);const b=o.extractPoints(c);let C=b.shape;const U=b.holes;if(!ha.isClockWise(C)){C=C.reverse();for(let B=0,V=U.length;B<V;B++){const q=U[B];ha.isClockWise(q)&&(U[B]=q.reverse())}}const A=ha.triangulateShape(C,U),O=C;for(let B=0,V=U.length;B<V;B++){const q=U[B];C=C.concat(q)}function F(B,V,q){return B.clone().addScaledVector(V,q)}const j=C.length,J=A.length;function W(B,V,q){let oe,ae,E;const Y=B.x-V.x,z=B.y-V.y,H=q.x-B.x,he=q.y-B.y,fe=Y*Y+z*z,Se=Y*he-z*H;if(Math.abs(Se)>Number.EPSILON){const Ee=Math.sqrt(fe),De=Math.sqrt(H*H+he*he),Te=V.x-z/Ee,Ae=V.y+Y/Ee,$e=((q.x-he/De-Te)*he-(q.y+H/De-Ae)*H)/(Y*he-z*H);oe=Te+Y*$e-B.x,ae=Ae+z*$e-B.y;const ht=oe*oe+ae*ae;if(ht<=2)return new xe(oe,ae);E=Math.sqrt(ht/2)}else{let Ee=!1;Y>Number.EPSILON?H>Number.EPSILON&&(Ee=!0):Y<-Number.EPSILON?H<-Number.EPSILON&&(Ee=!0):Math.sign(z)===Math.sign(he)&&(Ee=!0),Ee?(oe=-z,ae=Y,E=Math.sqrt(fe)):(oe=Y,ae=z,E=Math.sqrt(fe/2))}return new xe(oe/E,ae/E)}const k=[];for(let B=0,V=O.length,q=V-1,oe=B+1;B<V;B++,q++,oe++)q===V&&(q=0),oe===V&&(oe=0),k[B]=W(O[B],O[q],O[oe]);const $=[];let N,Q=k.concat();for(let B=0,V=U.length;B<V;B++){const q=U[B];N=[];for(let oe=0,ae=q.length,E=ae-1,Y=oe+1;oe<ae;oe++,E++,Y++)E===ae&&(E=0),Y===ae&&(Y=0),N[oe]=W(q[oe],q[E],q[Y]);$.push(N),Q=Q.concat(N)}for(let B=0;B<m;B++){const V=B/m,q=p*Math.cos(V*Math.PI/2),oe=f*Math.sin(V*Math.PI/2)+g;for(let ae=0,E=O.length;ae<E;ae++){const Y=F(O[ae],k[ae],oe);T(Y.x,Y.y,-q)}for(let ae=0,E=U.length;ae<E;ae++){const Y=U[ae];N=$[ae];for(let z=0,H=Y.length;z<H;z++){const he=F(Y[z],N[z],oe);T(he.x,he.y,-q)}}}const ve=f+g;for(let B=0;B<j;B++){const V=d?F(C[B],Q[B],ve):C[B];L?(S.copy(y.normals[0]).multiplyScalar(V.x),I.copy(y.binormals[0]).multiplyScalar(V.y),w.copy(v[0]).add(S).add(I),T(w.x,w.y,w.z)):T(V.x,V.y,0)}for(let B=1;B<=h;B++)for(let V=0;V<j;V++){const q=d?F(C[V],Q[V],ve):C[V];L?(S.copy(y.normals[B]).multiplyScalar(q.x),I.copy(y.binormals[B]).multiplyScalar(q.y),w.copy(v[B]).add(S).add(I),T(w.x,w.y,w.z)):T(q.x,q.y,u/h*B)}for(let B=m-1;B>=0;B--){const V=B/m,q=p*Math.cos(V*Math.PI/2),oe=f*Math.sin(V*Math.PI/2)+g;for(let ae=0,E=O.length;ae<E;ae++){const Y=F(O[ae],k[ae],oe);T(Y.x,Y.y,u+q)}for(let ae=0,E=U.length;ae<E;ae++){const Y=U[ae];N=$[ae];for(let z=0,H=Y.length;z<H;z++){const he=F(Y[z],N[z],oe);L?T(he.x,he.y+v[h-1].y,v[h-1].x+q):T(he.x,he.y,u+q)}}}function R(B,V){let q=B.length;for(;--q>=0;){const oe=q;let ae=q-1;ae<0&&(ae=B.length-1);for(let E=0,Y=h+2*m;E<Y;E++){const z=j*E,H=j*(E+1);Z(V+oe+z,V+ae+z,V+ae+H,V+oe+H)}}}function T(B,V,q){l.push(B),l.push(V),l.push(q)}function G(B,V,q){D(B),D(V),D(q);const oe=i.length/3,ae=x.generateTopUV(n,i,oe-3,oe-2,oe-1);K(ae[0]),K(ae[1]),K(ae[2])}function Z(B,V,q,oe){D(B),D(V),D(oe),D(V),D(q),D(oe);const ae=i.length/3,E=x.generateSideWallUV(n,i,ae-6,ae-3,ae-2,ae-1);K(E[0]),K(E[1]),K(E[3]),K(E[1]),K(E[2]),K(E[3])}function D(B){i.push(l[3*B+0]),i.push(l[3*B+1]),i.push(l[3*B+2])}function K(B){r.push(B.x),r.push(B.y)}(function(){const B=i.length/3;if(d){let V=0,q=j*V;for(let oe=0;oe<J;oe++){const ae=A[oe];G(ae[2]+q,ae[1]+q,ae[0]+q)}V=h+2*m,q=j*V;for(let oe=0;oe<J;oe++){const ae=A[oe];G(ae[0]+q,ae[1]+q,ae[2]+q)}}else{for(let V=0;V<J;V++){const q=A[V];G(q[2],q[1],q[0])}for(let V=0;V<J;V++){const q=A[V];G(q[0]+j*h,q[1]+j*h,q[2]+j*h)}}n.addGroup(B,i.length/3-B,0)})(),(function(){const B=i.length/3;let V=0;R(O,V),V+=O.length;for(let q=0,oe=U.length;q<oe;q++){const ae=U[q];R(ae,V),V+=ae.length}n.addGroup(B,i.length/3-B,1)})()}this.setAttribute("position",new dt(i,3)),this.setAttribute("uv",new dt(r,2)),this.computeVertexNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON();return(function(t,n,i){if(i.shapes=[],Array.isArray(t))for(let r=0,a=t.length;r<a;r++){const o=t[r];i.shapes.push(o.uuid)}else i.shapes.push(t.uuid);return i.options=Object.assign({},n),n.extrudePath!==void 0&&(i.options.extrudePath=n.extrudePath.toJSON()),i})(this.parameters.shapes,this.parameters.options,e)}static fromJSON(e,t){const n=[];for(let r=0,a=e.shapes.length;r<a;r++){const o=t[e.shapes[r]];n.push(o)}const i=e.options.extrudePath;return i!==void 0&&(e.options.extrudePath=new Tc[i.type]().fromJSON(i)),new qc(n,e.options)}}const I0={generateTopUV:function(s,e,t,n,i){const r=e[3*t],a=e[3*t+1],o=e[3*n],l=e[3*n+1],c=e[3*i],h=e[3*i+1];return[new xe(r,a),new xe(o,l),new xe(c,h)]},generateSideWallUV:function(s,e,t,n,i,r){const a=e[3*t],o=e[3*t+1],l=e[3*t+2],c=e[3*n],h=e[3*n+1],u=e[3*n+2],d=e[3*i],p=e[3*i+1],f=e[3*i+2],g=e[3*r],m=e[3*r+1],_=e[3*r+2];return Math.abs(o-h)<Math.abs(a-c)?[new xe(a,1-l),new xe(c,1-u),new xe(d,1-f),new xe(g,1-_)]:[new xe(o,1-l),new xe(h,1-u),new xe(p,1-f),new xe(m,1-_)]}};class tr extends rt{constructor(e=.5,t=1,n=32,i=1,r=0,a=2*Math.PI){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:a},n=Math.max(3,n);const o=[],l=[],c=[],h=[];let u=e;const d=(t-e)/(i=Math.max(1,i)),p=new M,f=new xe;for(let g=0;g<=i;g++){for(let m=0;m<=n;m++){const _=r+m/n*a;p.x=u*Math.cos(_),p.y=u*Math.sin(_),l.push(p.x,p.y,p.z),c.push(0,0,1),f.x=(p.x/t+1)/2,f.y=(p.y/t+1)/2,h.push(f.x,f.y)}u+=d}for(let g=0;g<i;g++){const m=g*(n+1);for(let _=0;_<n;_++){const x=_+m,v=x,y=x+n+1,I=x+n+2,S=x+1;o.push(v,y,S),o.push(y,I,S)}}this.setIndex(o),this.setAttribute("position",new dt(l,3)),this.setAttribute("normal",new dt(c,3)),this.setAttribute("uv",new dt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tr(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class ln extends rt{constructor(e=1,t=32,n=16,i=0,r=2*Math.PI,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],u=new M,d=new M,p=[],f=[],g=[],m=[];for(let _=0;_<=n;_++){const x=[],v=_/n;let y=0;_===0&&a===0?y=.5/t:_===n&&l===Math.PI&&(y=-.5/t);for(let I=0;I<=t;I++){const S=I/t;u.x=-e*Math.cos(i+S*r)*Math.sin(a+v*o),u.y=e*Math.cos(a+v*o),u.z=e*Math.sin(i+S*r)*Math.sin(a+v*o),f.push(u.x,u.y,u.z),d.copy(u).normalize(),g.push(d.x,d.y,d.z),m.push(S+y,1-v),x.push(c++)}h.push(x)}for(let _=0;_<n;_++)for(let x=0;x<t;x++){const v=h[_][x+1],y=h[_][x],I=h[_+1][x],S=h[_+1][x+1];(_!==0||a>0)&&p.push(v,y,S),(_!==n-1||l<Math.PI)&&p.push(y,I,S)}this.setIndex(p),this.setAttribute("position",new dt(f,3)),this.setAttribute("normal",new dt(g,3)),this.setAttribute("uv",new dt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ln(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class jc extends rt{constructor(e=1,t=.4,n=12,i=48,r=2*Math.PI){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:r},n=Math.floor(n),i=Math.floor(i);const a=[],o=[],l=[],c=[],h=new M,u=new M,d=new M;for(let p=0;p<=n;p++)for(let f=0;f<=i;f++){const g=f/i*r,m=p/n*Math.PI*2;u.x=(e+t*Math.cos(m))*Math.cos(g),u.y=(e+t*Math.cos(m))*Math.sin(g),u.z=t*Math.sin(m),o.push(u.x,u.y,u.z),h.x=e*Math.cos(g),h.y=e*Math.sin(g),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(f/i),c.push(p/n)}for(let p=1;p<=n;p++)for(let f=1;f<=i;f++){const g=(i+1)*p+f-1,m=(i+1)*(p-1)+f-1,_=(i+1)*(p-1)+f,x=(i+1)*p+f;a.push(g,m,x),a.push(m,_,x)}this.setIndex(a),this.setAttribute("position",new dt(o,3)),this.setAttribute("normal",new dt(l,3)),this.setAttribute("uv",new dt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new jc(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}class Ie extends Kn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Ue(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ue(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new xe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Ei extends Ie{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new xe(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Zt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ue(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ue(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ue(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}function mo(s,e,t){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function N0(s){const e=s.length,t=new Array(e);for(let n=0;n!==e;++n)t[n]=n;return t.sort(function(n,i){return s[n]-s[i]}),t}function Du(s,e,t){const n=s.length,i=new s.constructor(n);for(let r=0,a=0;a!==n;++r){const o=t[r]*e;for(let l=0;l!==e;++l)i[a++]=s[o+l]}return i}function gp(s,e,t,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(e.push(r.time),t.push.apply(t,a)),r=s[i++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(e.push(r.time),a.toArray(t,t.length)),r=s[i++];while(r!==void 0);else do a=r[n],a!==void 0&&(e.push(r.time),t.push(a)),r=s[i++];while(r!==void 0)}class va{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break e}a=t.length;break t}if(!(e>=r)){const o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){const o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let a=0;a!==i;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class D0 extends va{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(e,t,n){const i=this.parameterPositions;let r=e-2,a=e+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case 2401:r=e,o=2*t-n;break;case 2402:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case 2401:a=e,l=2*n-t;break;case 2402:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}const c=.5*(n-t),h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,f=(n-t)/(i-t),g=f*f,m=g*f,_=-d*m+2*d*g-d*f,x=(1+d)*m+(-1.5-2*d)*g+(-.5+d)*f+1,v=(-1-p)*m+(1.5+p)*g+.5*f,y=p*m-p*g;for(let I=0;I!==o;++I)r[I]=_*a[h+I]+x*a[c+I]+v*a[l+I]+y*a[u+I];return r}}class U0 extends va{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}}class O0 extends va{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class hi{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=mo(t,this.TimeBufferType),this.values=mo(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:mo(e.times,Array),values:mo(e.values,Array)};const i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new O0(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new U0(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new D0(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case da:t=this.InterpolantFactoryMethodDiscrete;break;case pr:t=this.InterpolantFactoryMethodLinear;break;case yl:t=this.InterpolantFactoryMethodSmooth}if(t===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0){if(e===this.DefaultInterpolation)throw new Error(n);this.setInterpolation(this.DefaultInterpolation)}return this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return da;case this.InterpolantFactoryMethodLinear:return pr;case this.InterpolantFactoryMethodSmooth:return yl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){const n=this.times,i=n.length;let r=0,a=i-1;for(;r!==i&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);const o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(e=!1);const n=this.times,i=this.values,r=n.length;r===0&&(e=!1);let a=null;for(let l=0;l!==r;l++){const c=n[l];if(typeof c=="number"&&isNaN(c)){e=!1;break}if(a!==null&&a>c){e=!1;break}a=c}if(i!==void 0&&(o=i,ArrayBuffer.isView(o)&&!(o instanceof DataView)))for(let l=0,c=i.length;l!==c;++l){const h=i[l];if(isNaN(h)){e=!1;break}}var o;return e}optimize(){const e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===yl,r=e.length-1;let a=1;for(let o=1;o<r;++o){let l=!1;const c=e[o];if(c!==e[o+1]&&(o!==1||c!==e[0]))if(i)l=!0;else{const h=o*n,u=h-n,d=h+n;for(let p=0;p!==n;++p){const f=t[h+p];if(f!==t[u+p]||f!==t[d+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];const h=o*n,u=a*n;for(let d=0;d!==n;++d)t[u+d]=t[h+d]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),n=new this.constructor(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}}hi.prototype.TimeBufferType=Float32Array,hi.prototype.ValueBufferType=Float32Array,hi.prototype.DefaultInterpolation=pr;class js extends hi{}js.prototype.ValueTypeName="bool",js.prototype.ValueBufferType=Array,js.prototype.DefaultInterpolation=da,js.prototype.InterpolantFactoryMethodLinear=void 0,js.prototype.InterpolantFactoryMethodSmooth=void 0;class vp extends hi{}vp.prototype.ValueTypeName="color";class vr extends hi{}vr.prototype.ValueTypeName="number";class F0 extends va{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t);let c=e*o;for(let h=c+o;c!==h;c+=4)Yi.slerpFlat(r,0,a,c-o,a,c,l);return r}}class ds extends hi{InterpolantFactoryMethodLinear(e){return new F0(this.times,this.values,this.getValueSize(),e)}}ds.prototype.ValueTypeName="quaternion",ds.prototype.DefaultInterpolation=pr,ds.prototype.InterpolantFactoryMethodSmooth=void 0;class $s extends hi{}$s.prototype.ValueTypeName="string",$s.prototype.ValueBufferType=Array,$s.prototype.DefaultInterpolation=da,$s.prototype.InterpolantFactoryMethodLinear=void 0,$s.prototype.InterpolantFactoryMethodSmooth=void 0;class xr extends hi{}xr.prototype.ValueTypeName="vector";class B0{constructor(e,t=-1,n,i=2500){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=zn(),this.duration<0&&this.resetDuration()}static parse(e){const t=[],n=e.tracks,i=1/(e.fps||1);for(let a=0,o=n.length;a!==o;++a)t.push(k0(n[a]).scale(i));const r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r}static toJSON(e){const t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let r=0,a=n.length;r!==a;++r)t.push(hi.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){const r=t.length,a=[];for(let o=0;o<r;o++){let l=[],c=[];l.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);const h=N0(l);l=Du(l,1,h),c=Du(c,1,h),i||l[0]!==0||(l.push(r),c.push(c[0])),a.push(new vr(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){const i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){const i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){const c=e[o],h=c.name.match(r);if(h&&h.length>1){const u=h[1];let d=i[u];d||(i[u]=d=[]),d.push(c)}}const a=[];for(const o in i)a.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return a}static parseAnimation(e,t){if(!e)return null;const n=function(h,u,d,p,f){if(d.length!==0){const g=[],m=[];gp(d,g,m,p),g.length!==0&&f.push(new h(u,g,m))}},i=[],r=e.name||"default",a=e.fps||30,o=e.blendMode;let l=e.length||-1;const c=e.hierarchy||[];for(let h=0;h<c.length;h++){const u=c[h].keys;if(u&&u.length!==0)if(u[0].morphTargets){const d={};let p;for(p=0;p<u.length;p++)if(u[p].morphTargets)for(let f=0;f<u[p].morphTargets.length;f++)d[u[p].morphTargets[f]]=-1;for(const f in d){const g=[],m=[];for(let _=0;_!==u[p].morphTargets.length;++_){const x=u[p];g.push(x.time),m.push(x.morphTarget===f?1:0)}i.push(new vr(".morphTargetInfluence["+f+"]",g,m))}l=d.length*a}else{const d=".bones["+t[h].name+"]";n(xr,d+".position",u,"pos",i),n(ds,d+".quaternion",u,"rot",i),n(xr,d+".scale",u,"scl",i)}}return i.length===0?null:new this(r,l,i,o)}resetDuration(){let e=0;for(let t=0,n=this.tracks.length;t!==n;++t){const i=this.tracks[t];e=Math.max(e,i.times[i.times.length-1])}return this.duration=e,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function k0(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=(function(t){switch(t.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return vr;case"vector":case"vector2":case"vector3":case"vector4":return xr;case"color":return vp;case"quaternion":return ds;case"bool":case"boolean":return js;case"string":return $s}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+t)})(s.type);if(s.times===void 0){const t=[],n=[];gp(s.keys,t,n,"value"),s.times=t,s.values=n}return e.parse!==void 0?e.parse(s):new e(s.name,s.times,s.values,s.interpolation)}const Xi={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};class z0{constructor(e,t,n){const i=this;let r,a=!1,o=0,l=0;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){l++,a===!1&&i.onStart!==void 0&&i.onStart(h,o,l),a=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,l),o===l&&(a=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return r?r(h):h},this.setURLModifier=function(h){return r=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){const u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){const p=c[u],f=c[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return f}return null}}}const V0=new z0;class wr{constructor(e){this.manager=e!==void 0?e:V0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}}wr.DEFAULT_MATERIAL_NAME="__DEFAULT";const xi={};class H0 extends Error{constructor(e,t){super(e),this.response=t}}class xp extends wr{constructor(e){super(e)}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=Xi.get(e);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(xi[e]!==void 0)return void xi[e].push({onLoad:t,onProgress:n,onError:i});xi[e]=[],xi[e].push({onLoad:t,onProgress:n,onError:i});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status,typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=xi[e],u=c.body.getReader(),d=c.headers.get("Content-Length")||c.headers.get("X-File-Size"),p=d?parseInt(d):0,f=p!==0;let g=0;const m=new ReadableStream({start(_){(function x(){u.read().then(({done:v,value:y})=>{if(v)_.close();else{g+=y.byteLength;const I=new ProgressEvent("progress",{lengthComputable:f,loaded:g,total:p});for(let S=0,w=h.length;S<w;S++){const L=h[S];L.onProgress&&L.onProgress(I)}_.enqueue(y),x()}})})()}});return new Response(m)}throw new H0(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o===void 0)return c.text();{const h=/charset="?([^;"\s]*)"?/i.exec(o),u=h&&h[1]?h[1].toLowerCase():void 0,d=new TextDecoder(u);return c.arrayBuffer().then(p=>d.decode(p))}}}).then(c=>{Xi.add(e,c);const h=xi[e];delete xi[e];for(let u=0,d=h.length;u<d;u++){const p=h[u];p.onLoad&&p.onLoad(c)}}).catch(c=>{const h=xi[e];if(h===void 0)throw this.manager.itemError(e),c;delete xi[e];for(let u=0,d=h.length;u<d;u++){const p=h[u];p.onError&&p.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class G0 extends wr{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=Xi.get(e);if(a!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0),a;const o=pa("img");function l(){h(),Xi.add(e,this),t&&t(this),r.manager.itemEnd(e)}function c(u){h(),i&&i(u),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),r.manager.itemStart(e),o.src=e,o}}class W0 extends wr{constructor(e){super(e)}load(e,t,n,i){const r=new Mn,a=new G0(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}}class xa extends yt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ue(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class X0 extends xa{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ue(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const Jl=new at,Uu=new M,Ou=new M;class $c{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new xe(512,512),this.map=null,this.mapPass=null,this.matrix=new at,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Hc,this._frameExtents=new xe(1,1),this._viewportCount=1,this._viewports=[new Pt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Uu.setFromMatrixPosition(e.matrixWorld),t.position.copy(Uu),Ou.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ou),t.updateMatrixWorld(),Jl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Jl),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Jl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),this.mapSize.x===512&&this.mapSize.y===512||(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class q0 extends $c{constructor(){super(new gn(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){const t=this.camera,n=2*mr*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;n===t.fov&&i===t.aspect&&r===t.far||(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class j0 extends xa{constructor(e,t,n=0,i=Math.PI/3,r=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.target=new yt,this.distance=n,this.angle=i,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new q0}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const Fu=new at,$r=new M,Ql=new M;class $0 extends $c{constructor(){super(new gn(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new xe(4,2),this._viewportCount=6,this._viewports=[new Pt(2,1,1,1),new Pt(0,1,1,1),new Pt(3,1,1,1),new Pt(1,1,1,1),new Pt(3,0,1,1),new Pt(1,0,1,1)],this._cubeDirections=[new M(1,0,0),new M(-1,0,0),new M(0,0,1),new M(0,0,-1),new M(0,1,0),new M(0,-1,0)],this._cubeUps=[new M(0,1,0),new M(0,1,0),new M(0,1,0),new M(0,1,0),new M(0,0,1),new M(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,i=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),$r.setFromMatrixPosition(e.matrixWorld),n.position.copy($r),Ql.copy(n.position),Ql.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Ql),n.updateMatrixWorld(),i.makeTranslation(-$r.x,-$r.y,-$r.z),Fu.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Fu)}}class Y0 extends xa{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new $0}get power(){return 4*this.intensity*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class K0 extends $c{constructor(){super(new $o(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Rc extends xa{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.target=new yt,this.shadow=new K0}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Z0 extends xa{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class ua{static decodeText(e){if(typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let n=0,i=e.length;n<i;n++)t+=String.fromCharCode(e[n]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}class J0 extends wr{constructor(e){super(e),this.isImageBitmapLoader=!0,this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=Xi.get(e);if(a!==void 0)return r.manager.itemStart(e),a.then?void a.then(c=>{t&&t(c),r.manager.itemEnd(e)}).catch(c=>{i&&i(c)}):(setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0),a);const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;const l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(c){return Xi.add(e,c),t&&t(c),r.manager.itemEnd(e),c}).catch(function(c){i&&i(c),Xi.remove(e),r.manager.itemError(e),r.manager.itemEnd(e)});Xi.add(e,l),r.manager.itemStart(e)}}class Q0{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Bu(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=Bu();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function Bu(){return(typeof performance>"u"?Date:performance).now()}const Yc="\\[\\]\\.:\\/",ev=new RegExp("["+Yc+"]","g"),ec="[^"+Yc+"]",tv="[^"+Yc.replace("\\.","")+"]",nv=new RegExp("^"+/((?:WC+[\/:])*)/.source.replace("WC",ec)+/(WCOD+)?/.source.replace("WCOD",tv)+/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",ec)+/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",ec)+"$"),iv=["material","materials","bones","map"];class xt{constructor(e,t,n){this.path=t,this.parsedPath=n||xt.parseTrackName(t),this.node=xt.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new xt.Composite(e,t,n):new xt(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(ev,"")}static parseTrackName(e){const t=nv.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const r=n.nodeName.substring(i+1);iv.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){const n=function(r){for(let a=0;a<r.length;a++){const o=r[a];if(o.name===t||o.uuid===t)return o;const l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,n=t.objectName,i=t.propertyName;let r=t.propertyIndex;if(e||(e=xt.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e)return;if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material||!e.material.materials)return;e=e.material.materials;break;case"bones":if(!e.skeleton)return;e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material||!e.material.map)return;e=e.material.map;break;default:if(e[n]===void 0)return;e=e[n]}if(c!==void 0){if(e[c]===void 0)return;e=e[c]}}const a=e[i];if(a===void 0){t.nodeName;return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry||!e.geometry.morphAttributes)return;e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}xt.Composite=class{constructor(s,e,t){const n=t||xt.parseTrackName(e);this._targetGroup=s,this._bindings=s.subscribe_(e,n)}getValue(s,e){this.bind();const t=this._targetGroup.nCachedObjects_,n=this._bindings[t];n!==void 0&&n.getValue(s,e)}setValue(s,e){const t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].setValue(s,e)}bind(){const s=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=s.length;e!==t;++e)s[e].bind()}unbind(){const s=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=s.length;e!==t;++e)s[e].unbind()}},xt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},xt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},xt.prototype.GetterByBindingType=[xt.prototype._getValue_direct,xt.prototype._getValue_array,xt.prototype._getValue_arrayElement,xt.prototype._getValue_toArray],xt.prototype.SetterByBindingTypeAndVersioning=[[xt.prototype._setValue_direct,xt.prototype._setValue_direct_setNeedsUpdate,xt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_array,xt.prototype._setValue_array_setNeedsUpdate,xt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_arrayElement,xt.prototype._setValue_arrayElement_setNeedsUpdate,xt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_fromArray,xt.prototype._setValue_fromArray_setNeedsUpdate,xt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:hc}})),typeof window<"u"&&(window.__THREE__||(window.__THREE__=hc));var sv=Object.defineProperty,se=(s,e,t)=>((n,i,r)=>i in n?sv(n,i,{enumerable:!0,configurable:!0,writable:!0,value:r}):n[i]=r)(s,typeof e!="symbol"?e+"":e,t);const Cc=s=>`/games/sandlot-sluggers/${String(s).replace(/^\/+/,"")}`,_p={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class _a{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){}dispose(){}}const rv=new $o(-1,1,1,-1,0,1),av=new class extends rt{constructor(){super(),this.setAttribute("position",new dt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new dt([0,2,0,0,2,0],2))}};class yp{constructor(e){this._mesh=new ce(av,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,rv)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class ov extends _a{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof Cn?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Bo.clone(e.uniforms),this.material=new Cn({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new yp(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class ku extends _a{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const i=e.getContext(),r=e.state;let a,o;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0),this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),r.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(i.EQUAL,1,4294967295),r.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),r.buffers.stencil.setLocked(!0)}}class lv extends _a{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class cv{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new xe);this._width=n.width,this._height=n.height,(t=new Yn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:wi})).texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new ov(_p),this.copyPass.material.blending=If,this.clock=new Q0}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let i=0,r=this.passes.length;i<r;i++){const a=this.passes[i];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}ku!==void 0&&(a instanceof ku?n=!0:a instanceof lv&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new xe);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,(e=this.renderTarget1.clone()).setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(n,i),this.renderTarget2.setSize(n,i);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class hv extends _a{constructor(e,t,n=null,i=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=i,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new Ue}render(e,t,n){const i=e.autoClear;let r,a;e.autoClear=!1,this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor)),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=i}}const uv={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ue(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			vec3 luma = vec3( 0.299, 0.587, 0.114 );

			float v = dot( texel.xyz, luma );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class _r extends _a{constructor(e,t,n,i){super(),this.strength=t!==void 0?t:1,this.radius=n,this.threshold=i,this.resolution=e!==void 0?new xe(e.x,e.y):new xe(256,256),this.clearColor=new Ue(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Yn(r,a,{type:wi}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){const u=new Yn(r,a,{type:wi});u.texture.name="UnrealBloomPass.h"+h,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);const d=new Yn(r,a,{type:wi});d.texture.name="UnrealBloomPass.v"+h,d.texture.generateMipmaps=!1,this.renderTargetsVertical.push(d),r=Math.round(r/2),a=Math.round(a/2)}const o=uv;this.highPassUniforms=Bo.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Cn({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new xe(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1,this.compositeMaterial.uniforms.bloomFactors.value=[1,.8,.6,.4,.2],this.bloomTintColors=[new M(1,1,1),new M(1,1,1),new M(1,1,1),new M(1,1,1),new M(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const c=_p;this.copyUniforms=Bo.clone(c.uniforms),this.blendMaterial=new Cn({uniforms:this.copyUniforms,vertexShader:c.vertexShader,fragmentShader:c.fragmentShader,blending:Xn,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new Ue,this.oldClearAlpha=1,this.basic=new Rn,this.fsQuad=new yp(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),i=Math.round(t/2);this.renderTargetBright.setSize(n,i);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,i),this.renderTargetsVertical[r].setSize(n,i),this.separableBlurMaterials[r].uniforms.invSize.value=new xe(1/n,1/i),n=Math.round(n/2),i=Math.round(i/2)}render(e,t,n,i,r){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),r&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=_r.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=_r.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(n),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=a}getSeperableBlurMaterial(e){const t=[];for(let n=0;n<e;n++)t.push(.39894*Math.exp(-.5*n*n/(e*e))/e);return new Cn({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new xe(.5,.5)},direction:{value:new xe(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new Cn({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}function zu(s,e){if(e===Jf)return s;if(e===pc||e===Rd){let t=s.getIndex();if(t===null){const a=[],o=s.getAttribute("position");if(o===void 0)return s;for(let l=0;l<o.count;l++)a.push(l);s.setIndex(a),t=s.getIndex()}const n=t.count-2,i=[];if(e===pc)for(let a=1;a<=n;a++)i.push(t.getX(0)),i.push(t.getX(a)),i.push(t.getX(a+1));else for(let a=0;a<n;a++)a%2==0?(i.push(t.getX(a)),i.push(t.getX(a+1)),i.push(t.getX(a+2))):(i.push(t.getX(a+2)),i.push(t.getX(a+1)),i.push(t.getX(a)));i.length;const r=s.clone();return r.setIndex(i),r.clearGroups(),r}return s}_r.BlurDirectionX=new xe(1,0),_r.BlurDirectionY=new xe(0,1);class bp extends wr{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new gv(t)}),this.register(function(t){return new Tv(t)}),this.register(function(t){return new Av(t)}),this.register(function(t){return new Ev(t)}),this.register(function(t){return new xv(t)}),this.register(function(t){return new _v(t)}),this.register(function(t){return new yv(t)}),this.register(function(t){return new bv(t)}),this.register(function(t){return new mv(t)}),this.register(function(t){return new Mv(t)}),this.register(function(t){return new vv(t)}),this.register(function(t){return new wv(t)}),this.register(function(t){return new Sv(t)}),this.register(function(t){return new pv(t)}),this.register(function(t){return new Rv(t)}),this.register(function(t){return new Cv(t)})}load(e,t,n,i){const r=this;let a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){const c=ua.extractUrlBase(e);a=ua.resolveURL(c,this.path)}else a=ua.extractUrlBase(e);this.manager.itemStart(e);const o=function(c){i&&i(c),r.manager.itemError(e),r.manager.itemEnd(e)},l=new xp(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{r.parse(c,a,function(h){t(h),r.manager.itemEnd(e)},o)}catch(h){o(h)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setDDSLoader(){throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r;const a={},o={},l=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===Mp){try{a[ct.KHR_BINARY_GLTF]=new Iv(e)}catch(h){return void(i&&i(h))}r=JSON.parse(a[ct.KHR_BINARY_GLTF].content)}else r=JSON.parse(l.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2)return void(i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.")));const c=new qv(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const u=this.pluginCallbacks[h](c);u.name,o[u.name]=u,a[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){const u=r.extensionsUsed[h],d=r.extensionsRequired||[];switch(u){case ct.KHR_MATERIALS_UNLIT:a[u]=new fv;break;case ct.KHR_DRACO_MESH_COMPRESSION:a[u]=new Nv(r,this.dracoLoader);break;case ct.KHR_TEXTURE_TRANSFORM:a[u]=new Dv;break;case ct.KHR_MESH_QUANTIZATION:a[u]=new Uv;break;default:d.indexOf(u)>=0&&o[u]}}c.setExtensions(a),c.setPlugins(o),c.parse(n,i)}parseAsync(e,t){const n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}}function dv(){let s={};return{get:function(e){return s[e]},add:function(e,t){s[e]=t},remove:function(e){delete s[e]},removeAll:function(){s={}}}}const ct={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class pv{constructor(e){this.parser=e,this.name=ct.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){const r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){const t=this.parser,n="light:"+e;let i=t.cache.get(n);if(i)return i;const r=t.json,a=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e];let o;const l=new Ue(16777215);a.color!==void 0&&l.setRGB(a.color[0],a.color[1],a.color[2],en);const c=a.range!==void 0?a.range:0;switch(a.type){case"directional":o=new Rc(l),o.target.position.set(0,0,-1),o.add(o.target);break;case"point":o=new Y0(l),o.distance=c;break;case"spot":o=new j0(l),o.distance=c,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,o.angle=a.spot.outerConeAngle,o.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,o.target.position.set(0,0,-1),o.add(o.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return o.position.set(0,0,0),o.decay=2,Vi(o,a),a.intensity!==void 0&&(o.intensity=a.intensity),o.name=t.createUniqueName(a.name||"light_"+e),i=Promise.resolve(o),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,n=this.parser,i=n.json.nodes[e],r=(i.extensions&&i.extensions[this.name]||{}).light;return r===void 0?null:this._loadLight(r).then(function(a){return n._getNodeRef(t.cache,r,a)})}}class fv{constructor(){this.name=ct.KHR_MATERIALS_UNLIT}getMaterialType(){return Rn}extendParams(e,t,n){const i=[];e.color=new Ue(1,1,1),e.opacity=1;const r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){const a=r.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],en),e.opacity=a[3]}r.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",r.baseColorTexture,Ut))}return Promise.all(i)}}class mv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name].emissiveStrength;return i!==void 0&&(t.emissiveIntensity=i),Promise.resolve()}}class gv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];if(a.clearcoatFactor!==void 0&&(t.clearcoat=a.clearcoatFactor),a.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",a.clearcoatTexture)),a.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=a.clearcoatRoughnessFactor),a.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",a.clearcoatRoughnessTexture)),a.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",a.clearcoatNormalTexture)),a.clearcoatNormalTexture.scale!==void 0)){const o=a.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new xe(o,o)}return Promise.all(r)}}class vv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return a.iridescenceFactor!==void 0&&(t.iridescence=a.iridescenceFactor),a.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",a.iridescenceTexture)),a.iridescenceIor!==void 0&&(t.iridescenceIOR=a.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),a.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=a.iridescenceThicknessMinimum),a.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=a.iridescenceThicknessMaximum),a.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",a.iridescenceThicknessTexture)),Promise.all(r)}}class xv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_SHEEN}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[];t.sheenColor=new Ue(0,0,0),t.sheenRoughness=0,t.sheen=1;const a=i.extensions[this.name];if(a.sheenColorFactor!==void 0){const o=a.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],en)}return a.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=a.sheenRoughnessFactor),a.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",a.sheenColorTexture,Ut)),a.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",a.sheenRoughnessTexture)),Promise.all(r)}}class _v{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return a.transmissionFactor!==void 0&&(t.transmission=a.transmissionFactor),a.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",a.transmissionTexture)),Promise.all(r)}}class yv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_VOLUME}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];t.thickness=a.thicknessFactor!==void 0?a.thicknessFactor:0,a.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",a.thicknessTexture)),t.attenuationDistance=a.attenuationDistance||1/0;const o=a.attenuationColor||[1,1,1];return t.attenuationColor=new Ue().setRGB(o[0],o[1],o[2],en),Promise.all(r)}}class bv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_IOR}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const i=n.extensions[this.name];return t.ior=i.ior!==void 0?i.ior:1.5,Promise.resolve()}}class Mv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_SPECULAR}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];t.specularIntensity=a.specularFactor!==void 0?a.specularFactor:1,a.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",a.specularTexture));const o=a.specularColorFactor||[1,1,1];return t.specularColor=new Ue().setRGB(o[0],o[1],o[2],en),a.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",a.specularColorTexture,Ut)),Promise.all(r)}}class Sv{constructor(e){this.parser=e,this.name=ct.EXT_MATERIALS_BUMP}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return t.bumpScale=a.bumpFactor!==void 0?a.bumpFactor:1,a.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",a.bumpTexture)),Promise.all(r)}}class wv{constructor(e){this.parser=e,this.name=ct.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const t=this.parser.json.materials[e];return t.extensions&&t.extensions[this.name]?Ei:null}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return a.anisotropyStrength!==void 0&&(t.anisotropy=a.anisotropyStrength),a.anisotropyRotation!==void 0&&(t.anisotropyRotation=a.anisotropyRotation),a.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",a.anisotropyTexture)),Promise.all(r)}}class Tv{constructor(e){this.parser=e,this.name=ct.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;const r=i.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,a)}}class Av{constructor(e){this.parser=e,this.name=ct.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return n.loadTextureImage(e,a.source,l);if(i.extensionsRequired&&i.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Ev{constructor(e){this.parser=e,this.name=ct.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return n.loadTextureImage(e,a.source,l);if(i.extensionsRequired&&i.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Rv{constructor(e){this.name=ct.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(o){const l=i.byteOffset||0,c=i.byteLength||0,h=i.count,u=i.byteStride,d=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(h,u,d,i.mode,i.filter).then(function(p){return p.buffer}):a.ready.then(function(){const p=new ArrayBuffer(h*u);return a.decodeGltfBuffer(new Uint8Array(p),h,u,d,i.mode,i.filter),p})})}return null}}class Cv{constructor(e){this.name=ct.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=t.meshes[n.mesh];for(const l of i.primitives)if(l.mode!==Un.TRIANGLES&&l.mode!==Un.TRIANGLE_STRIP&&l.mode!==Un.TRIANGLE_FAN&&l.mode!==void 0)return null;const r=n.extensions[this.name].attributes,a=[],o={};for(const l in r)a.push(this.parser.getDependency("accessor",r[l]).then(c=>(o[l]=c,o[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{const c=l.pop(),h=c.isGroup?c.children:[c],u=l[0].count,d=[];for(const p of h){const f=new at,g=new M,m=new Yi,_=new M(1,1,1),x=new x0(p.geometry,p.material,u);for(let v=0;v<u;v++)o.TRANSLATION&&g.fromBufferAttribute(o.TRANSLATION,v),o.ROTATION&&m.fromBufferAttribute(o.ROTATION,v),o.SCALE&&_.fromBufferAttribute(o.SCALE,v),x.setMatrixAt(v,f.compose(g,m,_));for(const v in o)if(v==="_COLOR_0"){const y=o[v];x.instanceColor=new Mc(y.array,y.itemSize,y.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&p.geometry.setAttribute(v,o[v]);yt.prototype.copy.call(x,p),this.parser.assignFinalMaterial(x),d.push(x)}return c.isGroup?(c.clear(),c.add(...d),c):d[0]}))}}const Mp="glTF",Pv=1313821514,Lv=5130562;class Iv{constructor(e){this.name=ct.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,12),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Mp)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-12,r=new DataView(e,12);let a=0;for(;a<i;){const o=r.getUint32(a,!0);a+=4;const l=r.getUint32(a,!0);if(a+=4,l===Pv){const c=new Uint8Array(e,12+a,o);this.content=n.decode(c)}else if(l===Lv){const c=12+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class Nv{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ct.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(const h in a){const u=Pc[h]||h.toLowerCase();o[u]=a[h]}for(const h in e.attributes){const u=Pc[h]||h.toLowerCase();if(a[h]!==void 0){const d=n.accessors[e.attributes[h]],p=ar[d.componentType];c[u]=p.name,l[u]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,d){i.decodeDracoFile(h,function(p){for(const f in p.attributes){const g=p.attributes[f],m=l[f];m!==void 0&&(g.normalized=m)}u(p)},o,c,en,d)})})}}class Dv{constructor(){this.name=ct.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord!==void 0&&t.texCoord!==e.channel||t.offset!==void 0||t.rotation!==void 0||t.scale!==void 0)&&(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class Uv{constructor(){this.name=ct.KHR_MESH_QUANTIZATION}}class Sp extends va{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let a=0;a!==i;a++)t[a]=n[r+a];return t}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=2*o,c=3*o,h=i-t,u=(n-t)/h,d=u*u,p=d*u,f=e*c,g=f-c,m=-2*p+3*d,_=p-d,x=1-m,v=_-d+u;for(let y=0;y!==o;y++){const I=a[g+y+o],S=a[g+y+l]*h,w=a[f+y+o],L=a[f+y]*h;r[y]=x*I+v*S+m*w+_*L}return r}}const Ov=new Yi;class Fv extends Sp{interpolate_(e,t,n,i){const r=super.interpolate_(e,t,n,i);return Ov.fromArray(r).normalize().toArray(r),r}}const Un={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},ar={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Vu={9728:on,9729:Bn,9984:dc,9985:Ad,9986:wo,9987:ur},Hu={33071:bi,33648:Io,10497:On},tc={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Pc={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},ki={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Bv={CUBICSPLINE:void 0,LINEAR:pr,STEP:da},kv="OPAQUE",zv="MASK",Vv="BLEND";function Hv(s){return s.DefaultMaterial===void 0&&(s.DefaultMaterial=new Ie({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Td})),s.DefaultMaterial}function ts(s,e,t){for(const n in t.extensions)s[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Vi(s,e){e.extras!==void 0&&typeof e.extras=="object"&&Object.assign(s.userData,e.extras)}function Gv(s,e){if(s.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)s.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(s.morphTargetInfluences.length===t.length){s.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)s.morphTargetDictionary[t[n]]=n}}}function Wv(s){let e;const t=s.extensions&&s.extensions[ct.KHR_DRACO_MESH_COMPRESSION];if(e=t?"draco:"+t.bufferView+":"+t.indices+":"+nc(t.attributes):s.indices+":"+nc(s.attributes)+":"+s.mode,s.targets!==void 0)for(let n=0,i=s.targets.length;n<i;n++)e+=":"+nc(s.targets[n]);return e}function nc(s){let e="";const t=Object.keys(s).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+s[t[n]]+";";return e}function Lc(s){switch(s){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}const Xv=new at;class qv{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new dv,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=!1,r=-1;typeof navigator<"u"&&(n=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)===!0,i=navigator.userAgent.indexOf("Firefox")>-1,r=i?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1),typeof createImageBitmap>"u"||n||i&&r<98?this.textureLoader=new W0(this.options.manager):this.textureLoader=new J0(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new xp(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(a){const o={scene:a[0][i.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:i.asset,parser:n,userData:{}};return ts(r,o,i),Vi(o,i),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){const a=t[i].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let i=0,r=e.length;i<r;i++){const a=e[i];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(n[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;const i=n.clone(),r=(a,o)=>{const l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(const[c,h]of a.children.entries())r(h,o.children[c])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){const i=e(t[n]);if(i)return i}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const n=[];for(let i=0;i<t.length;i++){const r=e(t[i]);r&&n.push(r)}return n}getDependency(e,t){const n=e+":"+t;let i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e)}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){const n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,a){return n.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ct.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(r,a){n.load(ua.resolveURL(t.uri,i.path),r,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){const i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){const t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){const a=tc[i.type],o=ar[i.componentType],l=i.normalized===!0,c=new o(i.count*a);return Promise.resolve(new st(c,a,l))}const r=[];return i.bufferView!==void 0?r.push(this.getDependency("bufferView",i.bufferView)):r.push(null),i.sparse!==void 0&&(r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(r).then(function(a){const o=a[0],l=tc[i.type],c=ar[i.componentType],h=c.BYTES_PER_ELEMENT,u=h*l,d=i.byteOffset||0,p=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,f=i.normalized===!0;let g,m;if(p&&p!==u){const _=Math.floor(d/p),x="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+_+":"+i.count;let v=t.cache.get(x);v||(g=new c(o,_*p,i.count*p/h),v=new tp(g,p/h),t.cache.add(x,v)),m=new yc(v,l,d%p/h,f)}else g=o===null?new c(i.count*l):new c(o,d,i.count*l),m=new st(g,l,f);if(i.sparse!==void 0){const _=tc.SCALAR,x=ar[i.sparse.indices.componentType],v=i.sparse.indices.byteOffset||0,y=i.sparse.values.byteOffset||0,I=new x(a[1],v,i.sparse.count*_),S=new c(a[2],y,i.sparse.count*l);o!==null&&(m=new st(m.array.slice(),m.itemSize,m.normalized));for(let w=0,L=I.length;w<L;w++){const b=I[w];if(m.setX(b,S[w*l]),l>=2&&m.setY(b,S[w*l+1]),l>=3&&m.setZ(b,S[w*l+2]),l>=4&&m.setW(b,S[w*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return m})}loadTexture(e){const t=this.json,n=this.options,i=t.textures[e].source,r=t.images[i];let a=this.textureLoader;if(r.uri){const o=n.manager.getHandler(r.uri);o!==null&&(a=o)}return this.loadTextureImage(e,i,a)}loadTextureImage(e,t,n){const i=this,r=this.json,a=r.textures[e],o=r.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=a.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);const u=(r.samplers||{})[a.sampler]||{};return h.magFilter=Vu[u.magFilter]||Bn,h.minFilter=Vu[u.minFilter]||ur,h.wrapS=Hu[u.wrapS]||On,h.wrapT=Hu[u.wrapT]||On,i.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){const n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());const a=i.images[e],o=self.URL||self.webkitURL;let l=a.uri||"",c=!1;if(a.bufferView!==void 0)l=n.getDependency("bufferView",a.bufferView).then(function(u){c=!0;const d=new Blob([u],{type:a.mimeType});return l=o.createObjectURL(d),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const h=Promise.resolve(l).then(function(u){return new Promise(function(d,p){let f=d;t.isImageBitmapLoader===!0&&(f=function(g){const m=new Mn(g);m.needsUpdate=!0,d(m)}),t.load(ua.resolveURL(u,r.path),f,void 0,p)})}).then(function(u){var d;return c===!0&&o.revokeObjectURL(l),u.userData.mimeType=a.mimeType||((d=a.uri).search(/\.jpe?g($|\?)/i)>0||d.search(/^data\:image\/jpeg/)===0?"image/jpeg":d.search(/\.webp($|\?)/i)>0||d.search(/^data\:image\/webp/)===0?"image/webp":"image/png"),u}).catch(function(u){throw u});return this.sourceCache[e]=h,h}assignTexture(e,t,n,i){const r=this;return this.getDependency("texture",n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&((a=a.clone()).channel=n.texCoord),r.extensions[ct.KHR_TEXTURE_TRANSFORM]){const o=n.extensions!==void 0?n.extensions[ct.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const l=r.associations.get(a);a=r.extensions[ct.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),r.associations.set(a,l)}}return i!==void 0&&(a.colorSpace=i),e[t]=a,a})}assignFinalMaterial(e){const t=e.geometry;let n=e.material;const i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new Qt,Kn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(o,l)),n=l}else if(e.isLine){const o="LineBasicMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new Ko,Kn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(o,l)),n=l}if(i||r||a){let o="ClonedMaterial:"+n.uuid+":";i&&(o+="derivative-tangents:"),r&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=n.clone(),r&&(l.vertexColors=!0),a&&(l.flatShading=!0),i&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(n))),n=l}e.material=n}getMaterialType(){return Ie}loadMaterial(e){const t=this,n=this.json,i=this.extensions,r=n.materials[e];let a;const o={},l=[];if((r.extensions||{})[ct.KHR_MATERIALS_UNLIT]){const h=i[ct.KHR_MATERIALS_UNLIT];a=h.getMaterialType(),l.push(h.extendParams(o,r,t))}else{const h=r.pbrMetallicRoughness||{};if(o.color=new Ue(1,1,1),o.opacity=1,Array.isArray(h.baseColorFactor)){const u=h.baseColorFactor;o.color.setRGB(u[0],u[1],u[2],en),o.opacity=u[3]}h.baseColorTexture!==void 0&&l.push(t.assignTexture(o,"map",h.baseColorTexture,Ut)),o.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,o.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(o,"metalnessMap",h.metallicRoughnessTexture)),l.push(t.assignTexture(o,"roughnessMap",h.metallicRoughnessTexture))),a=this._invokeOne(function(u){return u.getMaterialType&&u.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(u){return u.extendMaterialParams&&u.extendMaterialParams(e,o)})))}r.doubleSided===!0&&(o.side=ti);const c=r.alphaMode||kv;if(c===Vv?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,c===zv&&(o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&a!==Rn&&(l.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new xe(1,1),r.normalTexture.scale!==void 0)){const h=r.normalTexture.scale;o.normalScale.set(h,h)}if(r.occlusionTexture!==void 0&&a!==Rn&&(l.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&a!==Rn){const h=r.emissiveFactor;o.emissive=new Ue().setRGB(h[0],h[1],h[2],en)}return r.emissiveTexture!==void 0&&a!==Rn&&l.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,Ut)),Promise.all(l).then(function(){const h=new a(o);return r.name&&(h.name=r.name),Vi(h,r),t.associations.set(h,{materials:e}),r.extensions&&ts(i,h,r),h})}createUniqueName(e){const t=xt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,n=this.extensions,i=this.primitiveCache;function r(o){return n[ct.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return Gu(l,o,t)})}const a=[];for(let o=0,l=e.length;o<l;o++){const c=e[o],h=Wv(c),u=i[h];if(u)a.push(u.promise);else{let d;d=c.extensions&&c.extensions[ct.KHR_DRACO_MESH_COMPRESSION]?r(c):Gu(new rt,c,t),i[h]={primitive:c,promise:d},a.push(d)}}return Promise.all(a)}loadMesh(e){const t=this,n=this.json,i=this.extensions,r=n.meshes[e],a=r.primitives,o=[];for(let l=0,c=a.length;l<c;l++){const h=a[l].material===void 0?Hv(this.cache):this.getDependency("material",a[l].material);o.push(h)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(l){const c=l.slice(0,l.length-1),h=l[l.length-1],u=[];for(let p=0,f=h.length;p<f;p++){const g=h[p],m=a[p];let _;const x=c[p];if(m.mode===Un.TRIANGLES||m.mode===Un.TRIANGLE_STRIP||m.mode===Un.TRIANGLE_FAN||m.mode===void 0)_=r.isSkinnedMesh===!0?new p0(g,x):new ce(g,x),_.isSkinnedMesh===!0&&_.normalizeSkinWeights(),m.mode===Un.TRIANGLE_STRIP?_.geometry=zu(_.geometry,Rd):m.mode===Un.TRIANGLE_FAN&&(_.geometry=zu(_.geometry,pc));else if(m.mode===Un.LINES)_=new ap(g,x);else if(m.mode===Un.LINE_STRIP)_=new Zo(g,x);else if(m.mode===Un.LINE_LOOP)_=new _0(g,x);else{if(m.mode!==Un.POINTS)throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);_=new an(g,x)}Object.keys(_.geometry.morphAttributes).length>0&&Gv(_,r),_.name=t.createUniqueName(r.name||"mesh_"+e),Vi(_,r),m.extensions&&ts(i,_,m),t.assignFinalMaterial(_),u.push(_)}for(let p=0,f=u.length;p<f;p++)t.associations.set(u[p],{meshes:e,primitives:p});if(u.length===1)return r.extensions&&ts(i,u[0],r),u[0];const d=new Rt;r.extensions&&ts(i,d,r),t.associations.set(d,{meshes:e});for(let p=0,f=u.length;p<f;p++)d.add(u[p]);return d})}loadCamera(e){let t;const n=this.json.cameras[e],i=n[n.type];if(i)return n.type==="perspective"?t=new gn(om.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new $o(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Vi(t,n),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const r=i.pop(),a=i,o=[],l=[];for(let c=0,h=a.length;c<h;c++){const u=a[c];if(u){o.push(u);const d=new at;r!==null&&d.fromArray(r.array,16*c),l.push(d)}}return new g0(o,l)})}loadAnimation(e){const t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,a=[],o=[],l=[],c=[],h=[];for(let u=0,d=i.channels.length;u<d;u++){const p=i.channels[u],f=i.samplers[p.sampler],g=p.target,m=g.node,_=i.parameters!==void 0?i.parameters[f.input]:f.input,x=i.parameters!==void 0?i.parameters[f.output]:f.output;g.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",_)),l.push(this.getDependency("accessor",x)),c.push(f),h.push(g))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(u){const d=u[0],p=u[1],f=u[2],g=u[3],m=u[4],_=[];for(let x=0,v=d.length;x<v;x++){const y=d[x],I=p[x],S=f[x],w=g[x],L=m[x];if(y===void 0)continue;y.updateMatrix&&y.updateMatrix();const b=n._createAnimationTracks(y,I,S,w,L);if(b)for(let C=0;C<b.length;C++)_.push(b[C])}return new B0(r,void 0,_)})}createNodeMesh(e){const t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(r){const a=n._getNodeRef(n.meshCache,i.mesh,r);return i.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=i.weights.length;l<c;l++)o.morphTargetInfluences[l]=i.weights[l]}),a})}loadNode(e){const t=this,n=this.json.nodes[e],i=t._loadNodeShallow(e),r=[],a=n.children||[];for(let l=0,c=a.length;l<c;l++)r.push(t.getDependency("node",a[l]));const o=n.skin===void 0?Promise.resolve(null):t.getDependency("skin",n.skin);return Promise.all([i,Promise.all(r),o]).then(function(l){const c=l[0],h=l[1],u=l[2];u!==null&&c.traverse(function(d){d.isSkinnedMesh&&d.bind(u,Xv)});for(let d=0,p=h.length;d<p;d++)c.add(h[d]);return c})}_loadNodeShallow(e){const t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const r=t.nodes[e],a=r.name?i.createUniqueName(r.name):"",o=[],l=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),r.camera!==void 0&&o.push(i.getDependency("camera",r.camera).then(function(c){return i._getNodeRef(i.cameraCache,r.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let h;if(h=r.isBone===!0?new sp:c.length>1?new Rt:c.length===1?c[0]:new yt,h!==c[0])for(let u=0,d=c.length;u<d;u++)h.add(c[u]);if(r.name&&(h.userData.name=r.name,h.name=a),Vi(h,r),r.extensions&&ts(n,h,r),r.matrix!==void 0){const u=new at;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);return i.associations.has(h)||i.associations.set(h,{}),i.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){const t=this.extensions,n=this.json.scenes[e],i=this,r=new Rt;n.name&&(r.name=i.createUniqueName(n.name)),Vi(r,n),n.extensions&&ts(t,r,n);const a=n.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(i.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let c=0,h=l.length;c<h;c++)r.add(l[c]);return i.associations=(c=>{const h=new Map;for(const[u,d]of i.associations)(u instanceof Kn||u instanceof Mn)&&h.set(u,d);return c.traverse(u=>{const d=i.associations.get(u);d!=null&&h.set(u,d)}),h})(r),r})}_createAnimationTracks(e,t,n,i,r){const a=[],o=e.name?e.name:e.uuid,l=[];let c;switch(ki[r.path]===ki.weights?e.traverse(function(d){d.morphTargetInfluences&&l.push(d.name?d.name:d.uuid)}):l.push(o),ki[r.path]){case ki.weights:c=vr;break;case ki.rotation:c=ds;break;case ki.position:case ki.scale:c=xr;break;default:n.itemSize===1?c=vr:c=xr}const h=i.interpolation!==void 0?Bv[i.interpolation]:pr,u=this._getArrayFromAccessor(n);for(let d=0,p=l.length;d<p;d++){const f=new c(l[d]+"."+ki[r.path],t.array,u,h);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(f),a.push(f)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const n=Lc(t.constructor),i=new Float32Array(t.length);for(let r=0,a=t.length;r<a;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(t){return new(this instanceof ds?Fv:Sp)(this.times,this.values,this.getValueSize()/3,t)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Gu(s,e,t){const n=e.attributes,i=[];function r(a,o){return t.getDependency("accessor",a).then(function(l){s.setAttribute(o,l)})}for(const a in n){const o=Pc[a]||a.toLowerCase();o in s.attributes||i.push(r(n[a],o))}if(e.indices!==void 0&&!s.index){const a=t.getDependency("accessor",e.indices).then(function(o){s.setIndex(o)});i.push(a)}return _t.workingColorSpace,Vi(s,e),(function(a,o,l){const c=o.attributes,h=new Ai;if(c.POSITION===void 0)return;{const p=l.json.accessors[c.POSITION],f=p.min,g=p.max;if(f===void 0||g===void 0)return;if(h.set(new M(f[0],f[1],f[2]),new M(g[0],g[1],g[2])),p.normalized){const m=Lc(ar[p.componentType]);h.min.multiplyScalar(m),h.max.multiplyScalar(m)}}const u=o.targets;if(u!==void 0){const p=new M,f=new M;for(let g=0,m=u.length;g<m;g++){const _=u[g];if(_.POSITION!==void 0){const x=l.json.accessors[_.POSITION],v=x.min,y=x.max;if(v!==void 0&&y!==void 0){if(f.setX(Math.max(Math.abs(v[0]),Math.abs(y[0]))),f.setY(Math.max(Math.abs(v[1]),Math.abs(y[1]))),f.setZ(Math.max(Math.abs(v[2]),Math.abs(y[2]))),x.normalized){const I=Lc(ar[x.componentType]);f.multiplyScalar(I)}p.max(f)}}}h.expandByVector(p)}a.boundingBox=h;const d=new ui;h.getCenter(d.center),d.radius=h.min.distanceTo(h.max)/2,a.boundingSphere=d})(s,e,t),Promise.all(i).then(function(){return e.targets!==void 0?(function(a,o,l){let c=!1,h=!1,u=!1;for(let g=0,m=o.length;g<m;g++){const _=o[g];if(_.POSITION!==void 0&&(c=!0),_.NORMAL!==void 0&&(h=!0),_.COLOR_0!==void 0&&(u=!0),c&&h&&u)break}if(!c&&!h&&!u)return Promise.resolve(a);const d=[],p=[],f=[];for(let g=0,m=o.length;g<m;g++){const _=o[g];if(c){const x=_.POSITION!==void 0?l.getDependency("accessor",_.POSITION):a.attributes.position;d.push(x)}if(h){const x=_.NORMAL!==void 0?l.getDependency("accessor",_.NORMAL):a.attributes.normal;p.push(x)}if(u){const x=_.COLOR_0!==void 0?l.getDependency("accessor",_.COLOR_0):a.attributes.color;f.push(x)}}return Promise.all([Promise.all(d),Promise.all(p),Promise.all(f)]).then(function(g){const m=g[0],_=g[1],x=g[2];return c&&(a.morphAttributes.position=m),h&&(a.morphAttributes.normal=_),u&&(a.morphAttributes.color=x),a.morphTargetsRelative=!0,a})})(s,e.targets,t):s})}const Kc="SYB_Root",Ye={HOME:"SYB_Anchor_Home",FIRST_BASE:"SYB_Anchor_1B",SECOND_BASE:"SYB_Anchor_2B",THIRD_BASE:"SYB_Anchor_3B",MOUND:"SYB_Anchor_Mound",BATTER:"SYB_Anchor_Batter",CATCHER:"SYB_Anchor_Catcher",FIRST_BASEMAN:"SYB_Anchor_1B_F",SECOND_BASEMAN:"SYB_Anchor_2B_F",SHORTSTOP:"SYB_Anchor_SS_F",THIRD_BASEMAN:"SYB_Anchor_3B_F",LEFT_FIELD:"SYB_Anchor_LF",CENTER_FIELD:"SYB_Anchor_CF",RIGHT_FIELD:"SYB_Anchor_RF"},Ic={STRIKE_ZONE:"SYB_Aim_StrikeZone",MOUND:"SYB_Aim_Mound"},or={BEHIND_BATTER:"SYB_Cam_BehindBatter",STRIKE_ZONE_HIGH:"SYB_Cam_StrikeZoneHigh",ISOMETRIC:"SYB_Cam_Isometric"},jv=[Kc,...Object.values(Ye),...Object.values(Ic),...Object.values(or)],$v=new bp;async function Yv(s){const e=await(async function(t){const{loader:n,url:i}=t,r=t.anchorPrefix??"SYB_Anchor_",a=t.aimPrefix??"SYB_Aim_",o=t.expectedRootName??Kc,l=await n.loadAsync(i),c=l.scene.getObjectByName(o)??l.scene,h=new Map,u=new Map,d=new Map,p=new Map;return c.traverse(f=>{f.name&&(h.set(f.name,f),f.isCamera&&u.set(f.name,f),f.name.startsWith(r)&&d.set(f.name,f),f.name.startsWith(a)&&p.set(f.name,f))}),{gltf:l,root:c,nodes:h,cameras:u,anchors:d,aimTargets:p}})({loader:$v,url:s});return{scene:e.gltf.scene,index:e}}function Kv(s){return(function(e){const t=[],n=[];for(const r of jv)e.nodes.has(r)||t.push(r);e.cameras.size===0&&n.push("No cameras found in GLB - fallback cameras will be used");const i=[Ye.LEFT_FIELD,Ye.CENTER_FIELD,Ye.RIGHT_FIELD].filter(r=>!e.anchors.has(r));return i.length>0&&n.push(`Missing outfielder anchors: ${i.join(", ")} - fielding may be inaccurate`),{valid:t.length===0,missing:t,warnings:n}})(s)}function Wu(){const s=new Rt;s.name="SYB_Bat";const e=new kn(.015,.02,.6,8),t=new kn(.035,.025,.4,12),n=new Ie({color:2759178,roughness:.9,metalness:0}),i=new Ie({color:9136404,roughness:.5,metalness:.05}),r=new ce(e,n);r.position.y=.3;const a=new ce(t,i);return a.position.y=.8,s.add(r),s.add(a),s.rotation.set(.2,0,-.5),s.castShadow=!0,s}const wp="pitcher_torso",Tp="pitcher_throwArm",Ap="pitcher_gloveArm",Ep="pitcher_leadLeg",Rp="pitcher_driveLeg",Cp="pitcher_head";function Xu(){const s=new Rt;s.name="SYB_Pitcher",s.scale.setScalar(1.2);const e=new Ie({color:3355443,roughness:.8}),t=new Ie({color:2039583,roughness:.85,metalness:.15}),n=new Ie({color:1579032,roughness:.5,metalness:.2}),i=new Ie({color:13935988,roughness:.7}),r=new Ie({color:1118481,roughness:.9,metalness:.1}),a=new Ie({color:9127187,roughness:.9}),o=new Rt;o.name=wp,o.position.z=.6;const l=new Ke(.38,.22,.32),c=new ce(l,e);c.position.z=.37,o.add(c);const h=new Ke(.28,.2,.26),u=new ce(h,e);u.position.z=.13,o.add(u);const d=new Ke(.3,.22,.035),p=new Ie({color:2236962,roughness:.6,metalness:.15}),f=new ce(d,p);f.position.z=-.01,o.add(f),s.add(o);const g=new Rt;g.name=Cp,g.position.z=1.3;const m=new ln(.11,10,10),_=new ce(m,i);_.position.z=.12,g.add(_);const x=new ln(.12,10,6,0,2*Math.PI,0,Math.PI/2),v=new ce(x,n);v.position.z=.14,g.add(v);const y=new kn(.14,.14,.02,8),I=new ce(y,n);I.position.set(0,.06,.16),I.rotation.x=Math.PI/10,g.add(I),s.add(g);const S=new Rt;S.name=Tp,S.position.set(.19,0,.97);const w=new kn(.04,.035,.35,6),L=new ce(w,e);L.position.set(0,0,-.15),L.rotation.z=-Math.PI/6,S.add(L);const b=new ln(.035,6,4),C=new ce(b,i);C.position.set(.04,0,-.32),S.add(C),s.add(S);const U=new Rt;U.name=Ap,U.position.set(-.19,0,.97);const A=new ce(w,e);A.position.set(0,0,-.12),A.rotation.z=Math.PI/4,U.add(A);const O=new ln(.07,8,6),F=new ce(O,a);F.position.set(-.13,.02,-.27),U.add(F),s.add(U);const j=new Rt;j.name=Ep,j.position.set(-.08,0,.46);const J=new Ke(.1,.1,.42),W=new ce(J,t);W.position.z=-.21,j.add(W);const k=new Ke(.1,.14,.04),$=new ce(k,r);$.position.set(0,.01,-.44),j.add($),s.add(j);const N=new Rt;N.name=Rp,N.position.set(.08,0,.46);const Q=new ce(J,t);Q.position.z=-.21,N.add(Q);const ve=new ce(k,r);ve.position.set(0,.01,-.44),N.add(ve),s.add(N);const R=new Xc(.35,16),T=new Rn({color:0,transparent:!0,opacity:.25,depthWrite:!1}),G=new ce(R,T);return G.rotation.x=-Math.PI/2,G.position.z=.01,s.add(G),s.castShadow=!0,s}const mn={atBat:{position:new M(0,-5,3.8),lookAt:new M(0,16,.5),fov:50},fieldPlay:{position:new M(28,-18,25),lookAt:new M(0,20,0),fov:55},homeRun:{position:new M(-8,-2,.6),lookAt:new M(0,30,5),fov:70}};class Zv{constructor(e){se(this,"threeCamera"),se(this,"targetPosition",new M),se(this,"targetLookAt",new M),se(this,"currentLookAt",new M),se(this,"targetFov"),se(this,"shakeIntensity",0),se(this,"shakeOffset",new M),se(this,"sceneIndex",null),se(this,"followTarget",null),se(this,"followLocked",!1),se(this,"followLockedPos",new M),se(this,"overrideAtBatPos",null),se(this,"overrideFieldPlayPos",null),se(this,"overrideMoundY",null),se(this,"slowMoActive",!1),se(this,"slowMoRemaining",0),se(this,"slowMoMult",1),se(this,"shakeDecayRate",8),se(this,"hrCelebActive",!1),se(this,"hrCelebAngle",0),se(this,"hrCelebCenter",new M),se(this,"hrCelebElapsed",0),se(this,"hrCelebDuration",3),se(this,"strikeoutSnapActive",!1),se(this,"strikeoutSnapElapsed",0),se(this,"strikeoutSnapDuration",.3),se(this,"strikeoutSnapSavedPos",new M),se(this,"strikeoutSnapSavedLookAt",new M),se(this,"strikeoutSnapSavedFov",50),se(this,"strikeoutSnapZoomPos",new M),se(this,"batterIntroActive",!1),se(this,"batterIntroElapsed",0),se(this,"batterIntroDuration",1.2),se(this,"batterIntroZoomPos",new M),se(this,"batterIntroZoomLookAt",new M),se(this,"batterIntroEndPos",new M),se(this,"batterIntroEndLookAt",new M),se(this,"batterIntroEndFov",50),se(this,"fovPunchActive",!1),se(this,"fovPunchAmount",0),se(this,"fovPunchElapsed",0),se(this,"fovPunchDuration",.15),se(this,"orbitActive",!1),se(this,"orbitAngle",0),se(this,"orbitCenter",new M(0,0,0)),se(this,"sweepActive",!1),se(this,"sweepProgress",0),se(this,"sweepDuration",4),this.threeCamera=new gn(mn.atBat.fov,e,.1,500),this.threeCamera.position.copy(mn.atBat.position),this.targetPosition.copy(mn.atBat.position),this.currentLookAt.copy(mn.atBat.lookAt),this.targetLookAt.copy(mn.atBat.lookAt),this.targetFov=mn.atBat.fov,this.threeCamera.lookAt(this.currentLookAt)}bindIndex(e){this.sceneIndex=e;const t=e.nodes.get(or.BEHIND_BATTER);t&&(this.overrideAtBatPos=t.position.clone());const n=e.nodes.get(or.ISOMETRIC);n&&(this.overrideFieldPlayPos=n.position.clone());const i=e.anchors.get(Ye.MOUND);i&&(this.overrideMoundY=i.position.y)}switchTo(e){if(e===mn.atBat&&this.overrideAtBatPos?this.targetPosition.copy(this.overrideAtBatPos):e===mn.fieldPlay&&this.overrideFieldPlayPos?this.targetPosition.copy(this.overrideFieldPlayPos):this.targetPosition.copy(e.position),this.overrideMoundY!==null){const t=e.lookAt.clone(),n=this.overrideMoundY/16;t.y*=n,this.targetLookAt.copy(t)}else this.targetLookAt.copy(e.lookAt);this.targetFov=e.fov}shake(e){this.shakeIntensity=e}fovPunch(e=6,t=.15){this.fovPunchActive=!0,this.fovPunchAmount=e,this.fovPunchElapsed=0,this.fovPunchDuration=t}followBall(e,t=!1){this.followTarget=e.clone(),this.targetLookAt.copy(e),this.followLocked||(this.followLocked=!0,this.followLockedPos.copy(this.threeCamera.position),this.followLockedPos.z+=3,this.followLockedPos.y-=4),this.targetPosition.copy(this.followLockedPos),this.targetFov=t?58:52}startHomeRunOrbit(e){this.orbitActive=!0,this.orbitAngle=.75*Math.PI,this.orbitCenter.copy(e),this.targetFov=45}stopOrbit(){this.orbitActive=!1}startGameOverSweep(e){this.sweepActive=!0,this.sweepProgress=0,this.orbitActive=!1,this.followTarget=null,this.targetFov=55,this.targetLookAt.set(e.x,e.y+15,2)}stopSweep(){this.sweepActive=!1}updateSweep(e){if(!this.sweepActive)return;this.sweepProgress+=e/this.sweepDuration;const t=Math.min(this.sweepProgress,1),n=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,i=new M(0,-4,2.5),r=new M(20,-30,25);this.targetPosition.lerpVectors(i,r,n);const a=new M(0,14,1),o=new M(0,35,0);this.targetLookAt.lerpVectors(a,o,n),this.targetFov=50+15*n}updateOrbit(e){this.orbitActive&&(this.orbitAngle+=.4*e,this.targetPosition.set(this.orbitCenter.x+8*Math.cos(this.orbitAngle),this.orbitCenter.y+8*Math.sin(this.orbitAngle),this.orbitCenter.z+3),this.targetLookAt.copy(this.orbitCenter),this.targetLookAt.z+=1)}stopFollow(){this.followTarget=null,this.followLocked=!1}triggerSlowMo(e=1.5,t=.25){this.slowMoActive=!0,this.slowMoRemaining=e,this.slowMoMult=t}stopSlowMo(){this.slowMoActive=!1,this.slowMoRemaining=0,this.slowMoMult=1}shakeCamera(e,t=8){this.shakeIntensity=e,this.shakeDecayRate=t}startHRCelebration(e){this.orbitActive=!1,this.followTarget=null,this.sweepActive=!1,this.hrCelebActive=!0,this.hrCelebElapsed=0,this.hrCelebAngle=.75*Math.PI,this.hrCelebCenter.copy(e),this.targetFov=42}stopHRCelebration(){this.hrCelebActive=!1}updateHRCelebration(e){if(!this.hrCelebActive)return;this.hrCelebElapsed+=e;const t=Math.min(this.hrCelebElapsed/this.hrCelebDuration,1),n=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,i=this.hrCelebAngle+n*Math.PI,r=3+4*n;this.targetPosition.set(this.hrCelebCenter.x+12*Math.cos(i),this.hrCelebCenter.y+12*Math.sin(i),this.hrCelebCenter.z+r),this.targetLookAt.set(this.hrCelebCenter.x,this.hrCelebCenter.y,this.hrCelebCenter.z+1-.5*n),this.targetFov=42+6*n,t>=1&&(this.hrCelebActive=!1)}strikeoutSnap(e){this.strikeoutSnapSavedPos.copy(this.targetPosition),this.strikeoutSnapSavedLookAt.copy(this.targetLookAt),this.strikeoutSnapSavedFov=this.targetFov,this.strikeoutSnapZoomPos.set(e.x+2,e.y-3,e.z+1.5),this.strikeoutSnapActive=!0,this.strikeoutSnapElapsed=0}updateStrikeoutSnap(e){if(!this.strikeoutSnapActive)return;this.strikeoutSnapElapsed+=e;const t=Math.min(this.strikeoutSnapElapsed/this.strikeoutSnapDuration,1);if(t<.5){const n=1-Math.pow(1-2*t,3);this.targetPosition.lerpVectors(this.strikeoutSnapSavedPos,this.strikeoutSnapZoomPos,n),this.targetFov=this.strikeoutSnapSavedFov-15*n}else{const n=Math.pow(2*(t-.5),2);this.targetPosition.lerpVectors(this.strikeoutSnapZoomPos,this.strikeoutSnapSavedPos,n),this.targetFov=this.strikeoutSnapSavedFov-15+15*n}t>=1&&(this.strikeoutSnapActive=!1,this.targetPosition.copy(this.strikeoutSnapSavedPos),this.targetLookAt.copy(this.strikeoutSnapSavedLookAt),this.targetFov=this.strikeoutSnapSavedFov)}batterIntro(e){if(this.strikeoutSnapActive=!1,this.hrCelebActive=!1,this.orbitActive=!1,this.sweepActive=!1,this.followTarget=null,this.batterIntroActive=!0,this.batterIntroElapsed=0,this.batterIntroZoomPos.set(e.x+2.5,e.y-2,e.z+1.8),this.batterIntroZoomLookAt.set(e.x,e.y,e.z+1.2),this.overrideAtBatPos?this.batterIntroEndPos.copy(this.overrideAtBatPos):this.batterIntroEndPos.copy(mn.atBat.position),this.overrideMoundY!==null){const t=mn.atBat.lookAt.clone();t.y*=this.overrideMoundY/16,this.batterIntroEndLookAt.copy(t)}else this.batterIntroEndLookAt.copy(mn.atBat.lookAt);this.batterIntroEndFov=mn.atBat.fov}updateBatterIntro(e){if(!this.batterIntroActive)return;this.batterIntroElapsed+=e;const t=this.batterIntroElapsed;if(t<.3){const n=t/.3,i=1-Math.pow(1-n,2);this.targetPosition.lerpVectors(this.batterIntroEndPos,this.batterIntroZoomPos,i),this.targetLookAt.lerpVectors(this.batterIntroEndLookAt,this.batterIntroZoomLookAt,i),this.targetFov=this.batterIntroEndFov-8*i}else if(t<.8)this.targetPosition.copy(this.batterIntroZoomPos),this.targetLookAt.copy(this.batterIntroZoomLookAt),this.targetFov=this.batterIntroEndFov-8;else if(t<this.batterIntroDuration){const n=(t-.8)/.4,i=n<.5?2*n*n:1-Math.pow(-2*n+2,2)/2;this.targetPosition.lerpVectors(this.batterIntroZoomPos,this.batterIntroEndPos,i),this.targetLookAt.lerpVectors(this.batterIntroZoomLookAt,this.batterIntroEndLookAt,i),this.targetFov=this.batterIntroEndFov-8+8*i}else this.batterIntroActive=!1,this.targetPosition.copy(this.batterIntroEndPos),this.targetLookAt.copy(this.batterIntroEndLookAt),this.targetFov=this.batterIntroEndFov}setAspect(e){this.threeCamera.aspect=e,this.threeCamera.updateProjectionMatrix()}update(e){this.updateOrbit(e),this.updateSweep(e),this.updateHRCelebration(e),this.updateStrikeoutSnap(e),this.updateBatterIntro(e);let t=1;this.slowMoActive&&(this.slowMoRemaining-=e,this.slowMoRemaining<=0?this.stopSlowMo():t=this.slowMoMult);const n=1-Math.exp(-4*t*e);if(this.threeCamera.position.lerp(this.targetPosition,n),this.currentLookAt.lerp(this.targetLookAt,n),this.threeCamera.fov+=(this.targetFov-this.threeCamera.fov)*n,this.fovPunchActive){this.fovPunchElapsed+=e;const i=Math.min(this.fovPunchElapsed/this.fovPunchDuration,1),r=1-Math.pow(1-i,3);this.threeCamera.fov-=this.fovPunchAmount*(1-r),i>=1&&(this.fovPunchActive=!1)}this.threeCamera.updateProjectionMatrix(),this.shakeIntensity>.001&&(this.shakeOffset.set(2*(Math.random()-.5)*this.shakeIntensity,2*(Math.random()-.5)*this.shakeIntensity,2*(Math.random()-.5)*this.shakeIntensity),this.threeCamera.position.add(this.shakeOffset),this.shakeIntensity*=Math.exp(-this.shakeDecayRate*e)),this.threeCamera.lookAt(this.currentLookAt)}}const Pp=-32.17,Lp=.3125,Jv=.121*Math.PI*.121,Xt=14/60.5,ii=60.5/14,Ip=.00118845*.33*Jv,bn=.005,qu=.04,Yr=.17285714285714285,Qv={Fastball:{x:0,z:14},Curve:{x:3,z:-18},Slider:{x:10,z:-4},"Change-up":{x:8,z:-6},Cutter:{x:-5,z:4}},ex=.22,tx=.3,Np={MID_MID:{x:0,z:0},IN_MID:{x:-.154,z:0},OUT_MID:{x:.154,z:0},MID_HIGH:{x:0,z:.21},MID_LOW:{x:0,z:-.21},IN_HIGH:{x:-.154,z:.21},IN_LOW:{x:-.154,z:-.21},OUT_HIGH:{x:.154,z:.21},OUT_LOW:{x:.154,z:-.21}};class nx{constructor(e){se(this,"pool",[]),se(this,"factory"),this.factory=e;for(let t=0;t<3;t++){const n=this.factory();n.visible=!1,this.pool.push(n)}}acquire(){const e=this.pool.pop()??this.factory();return e.visible=!0,e}release(e){e.visible=!1,e.removeFromParent(),this.pool.push(e)}}function ix(s){const{index:e,scene:t,lane:n,ballPool:i,onStrikeCross:r,speed:a=1,breakScale:o=1,trailColor:l}=s,c=e.anchors.get(Ye.MOUND),h=e.anchors.get(Ye.HOME),u=c?c.position.clone():new M(0,14,.3),d=h?h.position.clone():new M(0,0,0),p=Np[n],f=new M(d.x+p.x,d.y,.8+p.z),g=new M(u.x,u.y,u.z+1.5),m=s.pitchTypeName??"Fastball",_=(function(U,A,O,F,j,J,W,k,$=1){const N=O*ii,Q=F*ii,ve=j*ii,R=1.46667*U,T=J*ii-N,G=W*ii-Q,Z=k*ii-ve,D=Math.sqrt(T*T+G*G+Z*Z),K=D/R;let B=T/D*R,V=G/D*R,q=(Z+16.085*K*K*.6)/D*R;const oe=Qv[A]??{x:0,z:0},ae=oe.x*$,E=oe.z*$,Y=[];let z=N,H=Q,he=ve,fe=0,Se=0;Y.push(z*Xt,H*Xt,he*Xt);for(let Ee=0;Ee<600;Ee++){const De=Math.sqrt(B*B+V*V+q*q);if(De<1)break;const Te=Ip*De/Lp,Ae=-Te*B,$e=-Te*V,ht=-Te*q,Re=Math.min(fe/(1.1*K),1),et=Re*Re;if(B+=(Ae+ae*et)*bn,V+=$e*bn,q+=(ht+Pp+E*et)*bn,z+=B*bn,H+=V*bn,he+=q*bn,fe+=bn,Ee%2==1&&Y.push(z*Xt,H*Xt,he*Xt),H*Xt<=W){Se=B*B+V*V+q*q,Y.push(z*Xt,H*Xt,he*Xt);break}}return{positions:new Float32Array(Y),sampleCount:Y.length/3,duration:fe,plateVelocityMph:Math.sqrt(Se)/1.46667}})(s.pitchMph??85,m,g.x,g.y,g.z,f.x,f.y,f.z,o),x=_.duration,v=i.acquire();v.position.copy(g),t.add(v);const y=Math.round(10+8*a),I=Math.min(.9,.4+.3*a);let S=null,w=null;if(l!==void 0){const U=new rt;w=new Float32Array(3*y);for(let O=0;O<y;O++)w[3*O]=g.x,w[3*O+1]=g.y,w[3*O+2]=g.z;U.setAttribute("position",new st(w,3));const A=new Ko({color:l,transparent:!0,opacity:I,blending:Xn,depthWrite:!1,linewidth:2});S=new Zo(U,A),S.frustumCulled=!1,t.add(S)}let L=0,b=!1;performance.now();const C={active:!0,lastCross:null,update(U){if(!C.active)return;L+=U;const A=Math.min(L/x,1),O=A*(_.sampleCount-1),F=Math.floor(O),j=Math.min(F+1,_.sampleCount-1),J=O-F,W=_.positions;if(v.position.set(W[3*F]+(W[3*j]-W[3*F])*J,W[3*F+1]+(W[3*j+1]-W[3*F+1])*J,W[3*F+2]+(W[3*j+2]-W[3*F+2])*J),v.rotation.x+=15*U*a,v.rotation.z+=8*U*a,w&&S){for(let k=y-1;k>0;k--)w[3*k]=w[3*(k-1)],w[3*k+1]=w[3*(k-1)+1],w[3*k+2]=w[3*(k-1)+2];w[0]=v.position.x,w[1]=v.position.y,w[2]=v.position.z,S.geometry.attributes.position.needsUpdate=!0,S.material.opacity=Math.max(.1,I*(1-A))}if(!b&&v.position.y<=.3){b=!0;const k=Math.abs(v.position.x-d.x),$=Math.abs(v.position.z-.8),N=k<=ex&&$<=tx,Q={position:v.position.clone(),isInZone:N,timing:performance.now()};C.lastCross=Q,r(Q)}A>=1&&(C.active=!1)},stop(){C.active=!1,v.visible=!1,t.remove(v),i.release(v),S&&(t.remove(S),S.geometry.dispose(),S.material.dispose(),S=null,w=null)}};return C}function sx(s){let e=0|s;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function rx(s,e,t,n,i,r=1,a=0,o=65){const l=sx(n),c=t.position.x,h=(t.position.z-.8)/.3;let u,d,p,f;switch(s){case"perfect":u=6*(l()-.5);break;case"good":u=16*(l()-.5);break;default:u=30*(l()-.5)}if(s==="foul")d=30+40*l()+u,p=.3+.3*l(),l();else if(s==="perfect"||s==="good"||s==="weak"){h>.3?d=25+35*Math.min((h-.3)/.7,1)+u:h<-.3?d=5-15*Math.min((-.3-h)/.7,1)+u:d=8+12*((h+.3)/.6)+u;let S;switch(s){case"perfect":S=.85+.15*l(),l();break;case"good":S=.6+.25*l(),l();break;default:S=.2+.3*l(),l()}const w=Math.min(1,Math.abs(h));p=S*Math.max(.4,1-w*w*.5)}else d=0,p=0;s==="foul"?f=(l()<.5?-1:1)*(.35*Math.PI+l()*Math.PI*.2):(f=(.7*Math.max(-1,Math.min(1,a/150))+.3*(6*c))*Math.PI*.45+.15*(l()-.5),s==="perfect"&&(f*=.85));const g=new M;g.set(Math.sin(f),Math.cos(f),Math.sin(d*Math.PI/180)).normalize(),p*=r;const m=110*p;let _,x;switch(s){case"perfect":_=2e3+500*l(),x=1e3*(l()-.5);break;case"good":_=1500+500*l(),x=1600*(l()-.5);break;default:_=500+500*l(),x=2e3*(l()-.5)}const v=(function(S,w,L,b,C,U,A,O,F=65){let j=U*ii,J=A*ii,W=O*ii;const k=j,$=J,N=F*ii,Q=1.46667*S,ve=w*Math.PI/180,R=Q*Math.cos(ve),T=Q*Math.sin(ve);let G=R*Math.sin(L),Z=R*Math.cos(L),D=T;const K=.003*b,B=.002*C,V=[];let q=0,oe=0,ae=!1,E=0;V.push(j*Xt,J*Xt,W*Xt);for(let z=0;z<2e3;z++){const H=Math.sqrt(G*G+Z*Z+D*D);if(H<3&&oe>0)break;const he=Ip*H/Lp,fe=W>Yr+.5;G+=(-he*G+(fe?B:0))*bn,Z+=-he*Z*bn,D+=(-he*D+Pp+(fe?K:0))*bn,j+=G*bn,J+=Z*bn,W+=D*bn,q+=bn,W<=Yr&&(W=Yr,oe++,oe>=5||Math.abs(D)<2?(D=0,G*=.95,Z*=.95):(D=.35*-D,G*=.65,Z*=.65));const Se=j-k,Ee=J-$,De=Se*Se+Ee*Ee;if(De>E&&(E=De),!ae&&Math.sqrt(De)>=N&&W>Yr+3&&(ae=!0),z%4==3&&V.push(j*Xt,J*Xt,Math.max(W*Xt,qu)),oe>0&&H<5||q>8||ae&&W<=Yr)break}V.push(j*Xt,J*Xt,Math.max(W*Xt,qu));const Y=Math.sqrt(E);return{positions:new Float32Array(V),sampleCount:V.length/3,duration:q,distanceFt:Y,clearedFence:ae}})(m,d,f,_,x,t.position.x,t.position.y,t.position.z,o),y=3*(v.sampleCount-1),I=new M(v.positions[y],v.positions[y+1],v.positions[y+2]);return{quality:s,launchAngle:d,exitVelocity:p,direction:g,distance:v.distanceFt*Xt,flightPositions:v.positions,flightSampleCount:v.sampleCount,landingPos:I,flightDuration:v.duration,clearedFence:v.clearedFence}}const ax={"1B_F":Ye.FIRST_BASEMAN,"2B_F":Ye.SECOND_BASEMAN,SS_F:Ye.SHORTSTOP,"3B_F":Ye.THIRD_BASEMAN,LF:Ye.LEFT_FIELD,CF:Ye.CENTER_FIELD,RF:Ye.RIGHT_FIELD,C:Ye.CATCHER},ox={"1B_F":[13,13,.05],"2B_F":[6,18,.05],SS_F:[-6,18,.05],"3B_F":[-13,13,.05],LF:[-22,42,.05],CF:[0,52,.05],RF:[22,42,.05],C:[0,-1.2,.05]},lx=[[13,0,.05],[0,18,.05],[-13,0,.05]],cx=new Ie({color:9127187,roughness:.9}),ko=new Ie({color:1118481,roughness:.9,metalness:.1}),Dp=new Ie({color:13935988,roughness:.7});function zo(s,e){return Math.floor((s>>16&255)*e)<<16|Math.floor((s>>8&255)*e)<<8|Math.floor((255&s)*e)}function ju(s,e=!1){const t=new Rt,n=new Ie({color:s,roughness:.8}),i=new Ie({color:zo(s,.6),roughness:.85,metalness:.15}),r=zo(s,.45),a=new Ie({color:r,roughness:.5,metalness:.2}),o=e?.55:.85,l=e?.95:1.42,c=e?.18:.25,h=e?.28:.42,u=e?.55:.82,d=new Ke(.38,.22,e?.28:.32),p=new ce(d,n);p.position.z=o+(e?.08:.12),t.add(p);const f=new Ke(.28,.2,e?.22:.26),g=new ce(f,n);g.position.z=o-(e?.1:.12),t.add(g);const m=new Ke(.3,.22,.035),_=new Ie({color:2236962,roughness:.6,metalness:.15}),x=new ce(m,_);x.position.z=o-(e?.22:.26),t.add(x);const v=new ln(.11,10,10),y=new ce(v,Dp);y.position.z=l,t.add(y);const I=new ln(.12,10,6,0,2*Math.PI,0,Math.PI/2),S=new ce(I,a);S.position.z=l+.02,t.add(S);const w=new kn(.14,.14,.02,8),L=new ce(w,a);L.position.set(0,.06,l+.04),L.rotation.x=Math.PI/10,t.add(L);const b=new Ke(.1,.1,h),C=new ce(b,i);C.position.set(-.08,0,c),t.add(C);const U=new ce(b,i);U.position.set(.08,0,c),t.add(U);const A=new Ke(.1,.14,.04),O=new ce(A,ko);O.position.set(-.08,.01,c-h/2-.02),t.add(O);const F=new ce(A,ko);F.position.set(.08,.01,c-h/2-.02),t.add(F);const j=new kn(.04,.035,.35,6),J=new ce(j,n);J.position.set(-.24,.02,u),J.rotation.z=Math.PI/3.5,t.add(J);const W=new ce(j,n);W.position.set(.2,0,u-.05),W.rotation.z=-Math.PI/6,t.add(W);const k=new ln(.07,8,6),$=new ce(k,cx);return $.position.set(-.32,.04,e?.42:.68),t.add($),t.castShadow=!0,t}const $u="batter_torso",Yu="batter_hips",Ku="batter_frontArm",Zu="batter_backArm",Ju="batter_frontLeg",Qu="batter_backLeg",ed="batter_head";class td{constructor(e,t,n,i){se(this,"scene"),se(this,"sceneIndex"),se(this,"fielders",new Map),se(this,"runners",[]),se(this,"runnerBasePositions",[]),se(this,"batter",null),se(this,"batterHomePos",new M),se(this,"chaserKey",null),se(this,"chaseTarget",null),se(this,"chaseComplete",!1),se(this,"returning",!1),se(this,"batterRunning",!1),se(this,"batterRunPath",[]),se(this,"batterRunIndex",0),se(this,"batterRunProgress",0),se(this,"batterRunSpeed",14),se(this,"batterRunComplete",!1),se(this,"pitcherMesh",null),se(this,"pitcherDeliveryActive",!1),se(this,"pitcherDeliveryProgress",0),se(this,"pitcherOriginalZ",0),se(this,"pitcherDeliveryDuration",.4),se(this,"batterSwingActive",!1),se(this,"batterSwingProgress",0),se(this,"batterSwingDuration",.25),se(this,"throwBall",null),se(this,"throwStart",null),se(this,"throwEnd",null),se(this,"throwProgress",0),se(this,"throwActive",!1),se(this,"catchAnimActive",!1),se(this,"catchAnimProgress",0),se(this,"catchAnimKey",null),se(this,"catchAnimOrigZ",0),se(this,"onBaseArrival",null),se(this,"lastBatterBaseIndex",-1),se(this,"basePositions",[]),se(this,"pitcherFidgetPhase",0),se(this,"backupShifts",new Map),se(this,"relayPhase","done"),se(this,"relayBall",null),se(this,"relayStart",new M),se(this,"relayMid",new M),se(this,"relayEnd",new M),se(this,"relayProgress",0),se(this,"walkInActive",!1),se(this,"walkInProgress",0),se(this,"walkInStart",new M),se(this,"WALK_IN_DURATION",.8),se(this,"prevBases",[!1,!1,!1]),se(this,"runnerAnimations",[]),se(this,"infieldersCrouching",!1),se(this,"crouchProgress",0),se(this,"INFIELD_KEYS",["1B_F","2B_F","SS_F","3B_F"]),se(this,"catcherPumpActive",!1),se(this,"catcherPumpProgress",0),this.scene=e,this.sceneIndex=t,this.onBaseArrival=i??null,this.cacheBasePositions(),this.placeFielders(n),this.placeBatterAndRunners(n),this.findPitcher()}cacheBasePositions(){const e=this.sceneIndex.anchors.get(Ye.HOME);this.basePositions=[e?.position.clone()??new M(0,0,.05)];const t=[Ye.FIRST_BASE,Ye.SECOND_BASE,Ye.THIRD_BASE];for(let n=0;n<3;n++){const i=this.sceneIndex.anchors.get(t[n]),r=lx[n];this.basePositions.push(i?.position.clone()??new M(...r))}}placeFielders(e){const t=["1B_F","2B_F","SS_F","3B_F","LF","CF","RF","C"],n=e??4473924;for(const i of t){const r=i==="C",a=ju(n,r);a.name=`SYB_Fielder_${i}`;const o=ax[i],l=this.sceneIndex.anchors.get(o),c=ox[i],h=l?.position.clone()??new M(...c);if(a.position.copy(h),!r){const u=this.basePositions[0],d=new M(u.x,u.y,h.z);a.lookAt(d)}this.scene.add(a),this.fielders.set(i,{mesh:a,homePos:h.clone(),currentPos:h.clone()})}}placeBatterAndRunners(e){const t=e??12539648,n=this.sceneIndex.anchors.get(Ye.BATTER),i=n?.position.clone()??new M(-.5,-.3,.05);this.batter=(function(o){const l=new Rt,c=new Ie({color:o,roughness:.8}),h=new Ie({color:zo(o,.6),roughness:.85,metalness:.15}),u=new Ie({color:zo(o,.35),roughness:.4,metalness:.3}),d=new Rt;d.name=Yu,d.position.z=.55,l.add(d);const p=new Rt;p.name=$u,p.position.z=.05;const f=new Ke(.38,.22,.32),g=new ce(f,c);g.position.z=.37,p.add(g);const m=new Ke(.28,.2,.26),_=new ce(m,c);_.position.z=.13,p.add(_);const x=new Ke(.3,.22,.035),v=new Ie({color:2236962,roughness:.6,metalness:.15}),y=new ce(x,v);y.position.z=-.01,p.add(y),d.add(p);const I=new Rt;I.name=ed,I.position.z=.7;const S=new ln(.12,10,10),w=new ce(S,Dp);w.position.z=.2,I.add(w);const L=new ln(.14,10,6,0,2*Math.PI,0,.6*Math.PI),b=new ce(L,u);b.position.z=.22,I.add(b);const C=new kn(.16,.16,.025,10),U=new ce(C,u);U.position.set(0,.08,.26),U.rotation.x=Math.PI/8,I.add(U),p.add(I);const A=new Rt;A.name=Ku,A.position.set(-.19,0,.37);const O=new kn(.04,.035,.34,6),F=new ce(O,c);F.position.set(-.03,-.08,-.07),F.rotation.z=Math.PI/4,F.rotation.x=-Math.PI/8,A.add(F),p.add(A);const j=new Rt;j.name=Zu,j.position.set(.19,0,.37);const J=new ce(O,c);J.position.set(-.01,-.1,-.02),J.rotation.z=-Math.PI/5,J.rotation.x=-Math.PI/6,j.add(J),p.add(j);const W=new Rt;W.name=Ju,W.position.set(-.12,0,.46);const k=new Ke(.1,.1,.42),$=new ce(k,h);$.position.z=-.21,W.add($);const N=new Ke(.1,.14,.04),Q=new ce(N,ko);Q.position.set(0,.01,-.44),W.add(Q),l.add(W);const ve=new Rt;ve.name=Qu,ve.position.set(.12,0,.46);const R=new ce(k,h);R.position.z=-.21,ve.add(R);const T=new ce(N,ko);return T.position.set(0,.01,-.44),ve.add(T),l.add(ve),l.castShadow=!0,l})(t),this.batter.name="SYB_Batter",this.batter.position.copy(i),this.batterHomePos.copy(i);const r=this.sceneIndex.anchors.get(Ye.MOUND),a=r?.position??new M(0,20,0);this.batter.lookAt(new M(a.x,a.y,i.z)),this.scene.add(this.batter);for(let o=0;o<3;o++){const l=ju(t,!1);l.name=`SYB_Runner_${o+1}B`,l.visible=!1;const c=this.basePositions[o+1].clone();l.position.copy(c),this.scene.add(l),this.runners.push(l),this.runnerBasePositions.push(c.clone())}}findPitcher(){this.pitcherMesh=this.sceneIndex.nodes.get("SYB_Pitcher")??null,this.pitcherMesh&&(this.pitcherOriginalZ=this.pitcherMesh.position.z)}updatePitcherIdle(e){if(!this.pitcherMesh||this.pitcherDeliveryActive)return;this.pitcherFidgetPhase+=e;const t=this.pitcherFidgetPhase,n=.03*Math.sin(1.5*t);this.pitcherMesh.position.x=(this.sceneIndex.anchors.get(Ye.MOUND)?.position.x??0)+n;const i=.02*Math.sin(.9*t+.5);this.pitcherMesh.rotation.x=i;const r=t%4;if(r>3.6&&r<3.9){const a=(r-3.6)/.3;this.pitcherMesh.position.z=this.pitcherOriginalZ+.04*Math.sin(a*Math.PI)}else this.pitcherMesh.position.z=this.pitcherOriginalZ}startPursuit(e){this.chaseTarget=e.clone(),this.chaseComplete=!1,this.returning=!1,this.backupShifts.clear();let t=null,n=1/0;for(const[i,r]of this.fielders){if(i==="C")continue;const a=r.homePos.distanceTo(e);a<n&&(n=a,t=i)}if(this.chaserKey=t,t){for(const[i,r]of this.fielders)if(!(i==="C"||i===t)&&r.homePos.distanceTo(e)<40){const a=r.homePos.clone().lerp(e,.25);a.z=r.homePos.z,this.backupShifts.set(i,a)}}}endPursuit(e){if(this.chaserKey&&this.chaseComplete){const t=this.fielders.get(this.chaserKey);t&&(e&&e!=="MOUND"?this.startRelayThrow(t.currentPos.clone(),e):this.startThrowBack(t.currentPos.clone()))}this.chaseTarget=null,this.chaserKey=null,this.chaseComplete=!1,this.returning=!0}startRelayThrow(e,t){let n;n=t==="2B"?this.basePositions[2]?.clone()??new M(0,18,.05):t==="3B"?this.basePositions[3]?.clone()??new M(-13,0,.05):this.basePositions[0]?.clone()??new M(0,0,.05);const i=e.clone().lerp(n,.45);i.z=.05;const r=new ln(.035,8,6),a=new Ie({color:16119280,roughness:.6});this.relayBall=new ce(r,a),this.relayBall.position.copy(e),this.relayBall.position.z+=.8,this.scene.add(this.relayBall),this.relayStart.copy(e).setZ(e.z+.8),this.relayMid.copy(i).setZ(i.z+1),this.relayEnd.copy(n).setZ(n.z+.5),this.relayProgress=0,this.relayPhase="leg1"}updateRelayThrow(e){if(this.relayPhase==="done"||!this.relayBall)return;const t=this.relayStart.distanceTo(this.relayMid),n=this.relayMid.distanceTo(this.relayEnd);if(this.relayProgress+=e,this.relayPhase==="leg1"){const i=t/35,r=Math.min(this.relayProgress/i,1);this.relayBall.position.lerpVectors(this.relayStart,this.relayMid,r),this.relayBall.position.z+=.06*t*Math.sin(r*Math.PI),this.relayBall.rotation.x+=25*e,r>=1&&(this.relayPhase="leg2",this.relayProgress=0)}else if(this.relayPhase==="leg2"){const i=n/35,r=Math.min(this.relayProgress/i,1);this.relayBall.position.lerpVectors(this.relayMid,this.relayEnd,r),this.relayBall.position.z+=.05*n*Math.sin(r*Math.PI),this.relayBall.rotation.x+=25*e,r>=1&&(this.relayPhase="done",this.scene.remove(this.relayBall),this.relayBall.geometry.dispose(),this.relayBall.material.dispose(),this.relayBall=null)}}startThrowBack(e){const t=this.sceneIndex.anchors.get(Ye.MOUND),n=t?.position.clone()??new M(0,20,0),i=new ln(.035,8,6),r=new Ie({color:16119280,roughness:.6});this.throwBall=new ce(i,r),this.throwBall.position.copy(e),this.throwBall.position.z+=.8,this.scene.add(this.throwBall),this.throwStart=e.clone(),this.throwStart.z+=.8,this.throwEnd=n.clone(),this.throwEnd.z+=1,this.throwProgress=0,this.throwActive=!0}startBatterRun(){this.batter&&(this.batterRunning=!0,this.batterRunComplete=!1,this.batterRunSpeed=14,this.batterRunPath=[this.batterHomePos.clone(),this.basePositions[1].clone()],this.batterRunIndex=0,this.batterRunProgress=0)}resolveBatterRun(e,t){if(!this.batterRunning)return;if(t)return void(this.batterRunComplete=!0);if(e==="homeRun")return this.batterRunSpeed=8,void(this.batterRunPath=[this.batterHomePos.clone(),this.basePositions[1].clone(),this.basePositions[2].clone(),this.basePositions[3].clone(),this.batterHomePos.clone()]);const n=e;this.batterRunPath=[this.batterHomePos.clone()];for(let i=1;i<=n;i++)this.batterRunPath.push(this.basePositions[i].clone())}resetBatter(e=!1){if(this.batterRunning=!1,this.batterRunComplete=!1,this.batterRunPath=[],this.batterRunIndex=0,this.batterRunProgress=0,this.lastBatterBaseIndex=-1,this.batter)if(e)this.walkInActive=!0,this.walkInProgress=0,this.walkInStart.set(this.batterHomePos.x+8,this.batterHomePos.y-2,this.batterHomePos.z),this.batter.position.copy(this.walkInStart),this.batter.lookAt(new M(this.batterHomePos.x,this.batterHomePos.y,this.batterHomePos.z));else{this.batter.position.copy(this.batterHomePos);const t=this.sceneIndex.anchors.get(Ye.MOUND),n=t?.position??new M(0,20,0);this.batter.lookAt(new M(n.x,n.y,this.batterHomePos.z))}}updateWalkIn(e){if(!this.walkInActive||!this.batter)return;this.walkInProgress+=e/this.WALK_IN_DURATION;const t=Math.min(this.walkInProgress,1),n=1-Math.pow(1-t,2);this.batter.position.lerpVectors(this.walkInStart,this.batterHomePos,n);const i=.08*Math.abs(Math.sin(t*Math.PI*4));this.batter.position.z+=i;const r=new M().subVectors(this.batterHomePos,this.walkInStart).normalize(),a=this.batter.position.clone().add(r);if(a.z=this.batter.position.z,this.batter.lookAt(a),t>=1){this.walkInActive=!1,this.batter.position.copy(this.batterHomePos);const o=this.sceneIndex.anchors.get(Ye.MOUND),l=o?.position??new M(0,20,0);this.batter.lookAt(new M(l.x,l.y,this.batterHomePos.z))}}updateRunners(e){for(let t=2;t>=0;t--)if(this.prevBases[t]&&!e[t]){const n=this.basePositions[t+1].clone();let i;i=t<2&&e[t+1]?this.basePositions[t+2].clone():this.basePositions[0].clone();const r=this.runners[t];r&&(r.visible=!0,r.position.copy(n),this.runnerAnimations.push({runner:r,from:n,to:i,progress:0,duration:.6}))}setTimeout(()=>{for(let t=0;t<3;t++)this.runnerAnimations.some(n=>n.runner===this.runners[t])||(this.runners[t].visible=e[t],e[t]&&this.runners[t].position.copy(this.basePositions[t+1]))},50),this.prevBases=[...e]}updateRunnerAnimations(e){for(let t=this.runnerAnimations.length-1;t>=0;t--){const n=this.runnerAnimations[t];n.progress+=e/n.duration;const i=Math.min(n.progress,1);n.runner.position.lerpVectors(n.from,n.to,i);const r=.1*Math.abs(Math.sin(i*Math.PI*3));n.runner.position.z+=r;const a=new M().subVectors(n.to,n.from).normalize();if(a.lengthSq()>0){const o=n.runner.position.clone().add(a);o.z=n.runner.position.z,n.runner.lookAt(o)}i>=1&&(n.to.distanceTo(this.basePositions[0])<.5&&(n.runner.visible=!1),this.onBaseArrival?.(n.to.clone()),this.runnerAnimations.splice(t,1))}}crouchInfielders(){this.infieldersCrouching=!0,this.crouchProgress=0}standInfielders(){this.infieldersCrouching=!1,this.crouchProgress=0;for(const e of this.INFIELD_KEYS){const t=this.fielders.get(e);t&&(t.mesh.position.z=t.homePos.z,t.mesh.rotation.x=0)}}updateInfielderCrouch(e){if(!this.infieldersCrouching)return;this.crouchProgress=Math.min(this.crouchProgress+4*e,1);const t=this.crouchProgress;for(const n of this.INFIELD_KEYS){const i=this.fielders.get(n);i&&this.chaserKey!==n&&(i.mesh.position.z=i.homePos.z-.08*t,i.mesh.rotation.x=.15*t)}}adjustForSituation(e,t,n,i){const r=i[2],a=e>=2&&t<2;for(const[o,l]of this.fielders){if(o==="C"||this.chaserKey===o)continue;const c=o==="LF"||o==="CF"||o==="RF";if((o==="1B_F"||o==="2B_F"||o==="SS_F"||o==="3B_F")&&r&&n<2){const h=new M().subVectors(this.basePositions[0],l.homePos).normalize(),u=l.homePos.clone().addScaledVector(h,3);u.z=l.homePos.z,l.mesh.position.copy(u),l.currentPos.copy(u)}else if(c&&a){const h=new M().subVectors(l.homePos,this.basePositions[0]).normalize(),u=l.homePos.clone().addScaledVector(h,4);u.z=l.homePos.z,l.mesh.position.copy(u),l.currentPos.copy(u)}else l.mesh.position.copy(l.homePos),l.currentPos.copy(l.homePos)}}shiftCatcher(e){const t=this.fielders.get("C");if(!t)return;const n=t.homePos.x+.3*e;t.currentPos.x=n,t.mesh.position.x=n}resetCatcher(){const e=this.fielders.get("C");e&&(e.currentPos.copy(e.homePos),e.mesh.position.copy(e.homePos))}triggerCatcherPump(){this.catcherPumpActive=!0,this.catcherPumpProgress=0}updateCatcherPump(e){if(!this.catcherPumpActive)return;const t=this.fielders.get("C");if(!t)return;this.catcherPumpProgress+=e;const n=Math.min(this.catcherPumpProgress/.35,1);if(n<.4){const i=n/.4;t.mesh.position.z=t.homePos.z+.3*i}else if(n<.7){const i=(n-.4)/.3;t.mesh.position.z=t.homePos.z+.3+.15*Math.sin(i*Math.PI)}else{const i=(n-.7)/.3;t.mesh.position.z=t.homePos.z+.3*(1-i)}n>=1&&(this.catcherPumpActive=!1,t.mesh.position.z=t.homePos.z)}triggerCatchAnimation(){if(!this.chaserKey)return;const e=this.fielders.get(this.chaserKey);e&&(this.catchAnimActive=!0,this.catchAnimProgress=0,this.catchAnimKey=this.chaserKey,this.catchAnimOrigZ=e.homePos.z)}updateCatchAnimation(e){if(!this.catchAnimActive||!this.catchAnimKey)return;const t=this.fielders.get(this.catchAnimKey);if(!t)return void(this.catchAnimActive=!1);this.catchAnimProgress+=e;const n=Math.min(this.catchAnimProgress/.45,1);if(n<.35){const i=n/.35,r=Math.sin(i*Math.PI*.5);t.mesh.position.z=this.catchAnimOrigZ+.6*r,t.mesh.rotation.x=.2*-r}else if(n<.6)t.mesh.position.z=this.catchAnimOrigZ+.6;else{const i=(n-.6)/.4,r=1-Math.pow(1-i,2);t.mesh.position.z=this.catchAnimOrigZ+.6*(1-r),t.mesh.rotation.x=-.2*(1-r)}n>=1&&(this.catchAnimActive=!1,t.mesh.position.z=this.catchAnimOrigZ,t.mesh.rotation.x=0)}startPitcherDelivery(e){this.pitcherMesh&&(this.pitcherDeliveryActive=!0,this.pitcherDeliveryProgress=0,this.pitcherDeliveryDuration=e??.4)}update(e){this.updateFielderPursuit(e),this.updateFielderReturn(e),this.updateBatterRun(e),this.updatePitcherDelivery(e),this.updateBatterSwing(e),this.updateThrowBack(e),this.updateRelayThrow(e),this.updateInfielderCrouch(e),this.updateCatcherPump(e),this.updateCatchAnimation(e),this.updateRunnerAnimations(e),this.updateWalkIn(e),this.chaserKey||this.returning||this.animateIdleSway()}animateIdleSway(){const e=.001*performance.now();for(const[t,n]of this.fielders){if(t==="C"||this.chaserKey===t)continue;const i=.7*t.charCodeAt(0),r=.04*Math.sin(1.2*e+i);n.mesh.position.x=n.homePos.x+r;const a=.02*Math.sin(.8*e+1.3*i);n.mesh.position.y=n.homePos.y+a}}updateFielderPursuit(e){if(!this.chaserKey||!this.chaseTarget||this.chaseComplete)return;const t=this.fielders.get(this.chaserKey);if(!t)return;const n=new M().subVectors(this.chaseTarget,t.currentPos),i=n.length();if(i<.5)return void(this.chaseComplete=!0);n.normalize();const r=Math.min(18*e,i);t.currentPos.addScaledVector(n,r),t.mesh.position.copy(t.currentPos);const a=t.currentPos.clone().add(n);a.z=t.currentPos.z,t.mesh.lookAt(a);const o=.15*Math.abs(Math.sin(.012*performance.now()));t.mesh.position.z=t.currentPos.z+o;for(const[l,c]of this.backupShifts){const h=this.fielders.get(l);if(!h)continue;const u=new M().subVectors(c,h.currentPos),d=u.length();if(d>.2){u.normalize();const p=Math.min(8*e,d);h.currentPos.addScaledVector(u,p),h.mesh.position.copy(h.currentPos);const f=h.currentPos.clone().add(u);f.z=h.currentPos.z,h.mesh.lookAt(f)}}}updateFielderReturn(e){if(!this.returning)return;let t=!0;for(const[,n]of this.fielders){const i=n.currentPos.distanceTo(n.homePos);if(i>.1){t=!1;const r=new M().subVectors(n.homePos,n.currentPos);r.normalize();const a=Math.min(8*e,i);n.currentPos.addScaledVector(r,a),n.mesh.position.copy(n.currentPos);const o=n.currentPos.clone().add(r);o.z=n.currentPos.z,n.mesh.lookAt(o)}else n.currentPos.copy(n.homePos),n.mesh.position.copy(n.homePos)}t&&(this.returning=!1)}updateBatterRun(e){if(!this.batterRunning||this.batterRunComplete||!this.batter||this.batterRunPath.length<2)return;const t=this.batterRunPath[this.batterRunIndex],n=this.batterRunPath[this.batterRunIndex+1];if(!t||!n)return void(this.batterRunComplete=!0);const i=t.distanceTo(n);if(i<.01)return this.batterRunIndex++,void(this.batterRunIndex>=this.batterRunPath.length-1&&(this.batterRunComplete=!0));if(this.batterRunProgress+=this.batterRunSpeed*e/i,this.batterRunProgress>=1)return this.batter.position.copy(n),this.batterRunIndex++,this.batterRunProgress=0,this.batterRunIndex!==this.lastBatterBaseIndex&&(this.lastBatterBaseIndex=this.batterRunIndex,this.onBaseArrival?.(n.clone())),void(this.batterRunIndex>=this.batterRunPath.length-1&&(this.batterRunComplete=!0));this.batter.position.lerpVectors(t,n,this.batterRunProgress);const r=.12*Math.abs(Math.sin(.014*performance.now()));this.batter.position.z+=r;const a=new M().subVectors(n,t).normalize(),o=this.batter.position.clone().add(a);o.z=this.batter.position.z,this.batter.lookAt(o)}updateThrowBack(e){if(!(this.throwActive&&this.throwBall&&this.throwStart&&this.throwEnd))return;const t=this.throwStart.distanceTo(this.throwEnd),n=t/35;this.throwProgress+=e;const i=Math.min(this.throwProgress/n,1);this.throwBall.position.lerpVectors(this.throwStart,this.throwEnd,i);const r=.08*t;this.throwBall.position.z+=r*Math.sin(i*Math.PI),this.throwBall.rotation.x+=25*e,i>=1&&(this.scene.remove(this.throwBall),this.throwBall.geometry.dispose(),this.throwBall.material.dispose(),this.throwBall=null,this.throwActive=!1)}updatePitcherDelivery(e){if(!this.pitcherDeliveryActive||!this.pitcherMesh)return;this.pitcherDeliveryProgress+=e;const t=this.pitcherDeliveryDuration,n=Math.min(this.pitcherDeliveryProgress/t,1),i=this.pitcherMesh.getObjectByName(wp),r=this.pitcherMesh.getObjectByName(Tp),a=this.pitcherMesh.getObjectByName(Ap),o=this.pitcherMesh.getObjectByName(Ep),l=this.pitcherMesh.getObjectByName(Rp),c=this.pitcherMesh.getObjectByName(Cp),h=!!(i&&r&&a&&o&&l);if(h){const u=d=>Math.sin(d*Math.PI*.5);if(n<.15){const d=u(n/.15);o.rotation.x=1.4*d,l.rotation.x=-.08*d,i.rotation.x=-.06*d,r&&(r.rotation.x=.3*d),a&&(a.rotation.x=.3*d),this.pitcherMesh.position.z=this.pitcherOriginalZ+.08*d}else if(n<.4){const d=u((n-.15)/.25);o.rotation.x=1.4*(1-.9*d),o.rotation.z=-.15*d,l.rotation.x=-.1*d-.08,i.rotation.x=.15*d-.06,i.rotation.y=-.35*d,r&&(r.rotation.x=.3-1.1*d,r.rotation.z=-.7*d),a&&(a.rotation.x=.3-.6*d,a.rotation.z=.3*d),this.pitcherMesh.position.y-=.15*d,this.pitcherMesh.position.z=this.pitcherOriginalZ+.08*(1-.5*d)}else if(n<.55){const d=u((n-.4)/.15);o.rotation.x=1.4*.1+-.15*d,l.rotation.x=-.05*d-.18,i.rotation.x=.09+.2*d,i.rotation.y=-.35-.25*d,r&&(r.rotation.x=-.8-.8*d,r.rotation.z=.2*d-.7),a&&(a.rotation.x=-.3-.2*d,a.rotation.z=.3+.15*d)}else if(n<.7){const d=(n-.55)/.15,p=1-Math.pow(1-d,3);r&&(r.rotation.x=2.8*p-1.6,r.rotation.z=.8*p-.5),i.rotation.x=.29+.35*p,i.rotation.y=.45*p-.6,a&&(a.rotation.x=.6*p-.5,a.rotation.z=.45-.3*p),o.rotation.x=-.05-.1*p,l.rotation.x=.1*p-.23}else if(n<.85){const d=u((n-.7)/.15);r&&(r.rotation.x=1.2+.3*d,r.rotation.z=.3-.2*d),i.rotation.x=.64+.1*d,i.rotation.y=.1*d-.15,l.rotation.x=.4*d-.13,a&&(a.rotation.x=.1-.1*d)}else{const d=u((n-.85)/.15);r&&(r.rotation.x=1.5*(1-d),r.rotation.z=.1*(1-d)),a&&(a.rotation.x=0*(1-d),a.rotation.z=0),i.rotation.x=.74*(1-d),i.rotation.y=-.05*(1-d),o.rotation.x=-.15*(1-d),o.rotation.z=0,l.rotation.x=.27*(1-d);const p=this.sceneIndex.anchors.get(Ye.MOUND)?.position.y??20;this.pitcherMesh.position.y+=(p-this.pitcherMesh.position.y)*d,this.pitcherMesh.position.z=this.pitcherOriginalZ+.04*(1-d)}c&&(c.rotation.x=-.3*i.rotation.x)}else if(n<.3){const u=Math.sin(n/.3*Math.PI*.5);this.pitcherMesh.position.z=this.pitcherOriginalZ+.15*u}else if(n<.7){const u=Math.sin((n-.3)/.4*Math.PI*.5);this.pitcherMesh.position.z=this.pitcherOriginalZ+.15*(1-.8*u),this.pitcherMesh.position.y-=.3*u}else{const u=1-Math.pow(1-(n-.7)/.3,3);this.pitcherMesh.position.z=this.pitcherOriginalZ+.03*(1-u);const d=this.sceneIndex.anchors.get(Ye.MOUND)?.position.y??20;this.pitcherMesh.position.y+=(d-this.pitcherMesh.position.y)*u}if(n>=1){this.pitcherDeliveryActive=!1,this.pitcherDeliveryProgress=0,h&&(i.rotation.set(0,0,0),r.rotation.set(0,0,0),a.rotation.set(0,0,0),o.rotation.set(0,0,0),l.rotation.set(0,0,0),c&&c.rotation.set(0,0,0)),this.pitcherMesh.rotation.x=0,this.pitcherMesh.position.z=this.pitcherOriginalZ;const u=this.sceneIndex.anchors.get(Ye.MOUND)?.position.y??20;this.pitcherMesh.position.y=u}}startBatterSwing(){this.batter&&(this.batterSwingActive=!0,this.batterSwingProgress=0)}get isBatterSwinging(){return this.batterSwingActive}updateBatterSwing(e){if(!this.batterSwingActive||!this.batter)return;this.batterSwingProgress+=e;const t=Math.min(this.batterSwingProgress/this.batterSwingDuration,1),n=this.batter.getObjectByName(Yu),i=this.batter.getObjectByName($u),r=this.batter.getObjectByName(Ku),a=this.batter.getObjectByName(Zu),o=this.batter.getObjectByName(Ju),l=this.batter.getObjectByName(Qu),c=this.batter.getObjectByName(ed);if(!n||!i)return this.batter.rotation.z=t<.5?2*t*.3:.3*(1-2*(t-.5)),void(t>=1&&(this.batterSwingActive=!1,this.batter.rotation.z=0));const h=u=>Math.sin(u*Math.PI*.5);if(t<.15){const u=h(t/.15);n.rotation.y=.12*u,i&&(i.rotation.y=.18*u),o&&(o.rotation.x=.15*u),l&&(l.rotation.x=-.08*u),a&&(a.rotation.z=-.2*u)}else if(t<.35){const u=h((t-.15)/.2);n.rotation.y=.12*(1-.3*u),i&&(i.rotation.y=.18+.08*u),o&&(o.rotation.x=.15-.25*u),a&&(a.rotation.z=-.2-.1*u)}else if(t<.55){const u=(t-.35)/.2,d=1-Math.pow(1-u,3);n.rotation.y=.084-1.2*d,i&&(i.rotation.y=.26-.5*d),o&&(o.rotation.x=-.1-.1*d),l&&(l.rotation.x=.15*d-.08)}else if(t<.75){const u=(t-.55)/.2,d=1-Math.pow(1-u,3);n.rotation.y=-1.116-.3*d,i&&(i.rotation.y=-.24-1*d),r&&(r.rotation.x=-.4*d,r.rotation.z=-.3*d),a&&(a.rotation.x=-.3*d,a.rotation.z=.6*d-.3),l&&(l.rotation.x=.07+.25*d)}else if(t<.85){const u=h((t-.75)/.1);n.rotation.y=-1.416-.1*u,i&&(i.rotation.y=-1.24-.15*u),l&&(l.rotation.x=.32+.1*u)}else{const u=h((t-.85)/.15);n.rotation.y=-1.516*(1-.7*u),i&&(i.rotation.y=-1.39*(1-.7*u)),r&&(r.rotation.x=-.4*(1-u),r.rotation.z=-.3*(1-u)),a&&(a.rotation.x=-.3*(1-u),a.rotation.z=.3*(1-u)),o&&(o.rotation.x=o.rotation.x*(1-u)),l&&(l.rotation.x=.42*(1-u))}c&&i&&(c.rotation.y=.6*-i.rotation.y),t>=1&&(this.batterSwingActive=!1,this.batterSwingProgress=0,n.rotation.set(0,0,0),i&&i.rotation.set(0,0,0),r&&r.rotation.set(0,0,0),a&&a.rotation.set(0,0,0),o&&o.rotation.set(0,0,0),l&&l.rotation.set(0,0,0),c&&c.rotation.set(0,0,0))}dispose(){for(const[,e]of this.fielders)this.scene.remove(e.mesh);for(const e of this.runners)this.scene.remove(e);this.batter&&this.scene.remove(this.batter),this.throwBall&&(this.scene.remove(this.throwBall),this.throwBall.geometry.dispose(),this.throwBall.material.dispose(),this.throwBall=null),this.relayBall&&(this.scene.remove(this.relayBall),this.relayBall.geometry.dispose(),this.relayBall.material.dispose(),this.relayBall=null),this.fielders.clear(),this.runners=[]}}class hx{constructor(){se(this,"ctx",null),se(this,"masterGain",null),se(this,"ambientSource",null),se(this,"ambientGain",null),se(this,"isUnlocked",!1),se(this,"ambientLayers",[]),se(this,"ambientLayerGains",[]),se(this,"ambientMidFilter",null),se(this,"ambientHighFilter",null),se(this,"ambientLfoNode",null),se(this,"rallyMode",!1),se(this,"currentTensionStrikes",0),se(this,"baseAmbientVolume",.08),se(this,"whooshSource",null),se(this,"whooshGain",null),se(this,"muted",!1);try{this.ctx=new(window.AudioContext||window.webkitAudioContext),this.masterGain=this.ctx.createGain(),this.masterGain.gain.value=.7,this.masterGain.connect(this.ctx.destination)}catch{}}async unlock(){if(this.isUnlocked||!this.ctx)return;this.ctx.state==="suspended"&&await this.ctx.resume();const e=this.ctx.createBuffer(1,1,22050),t=this.ctx.createBufferSource();t.buffer=e,t.connect(this.ctx.destination),t.start(0),this.isUnlocked=!0}noise(e){const t=this.ctx,n=t.sampleRate*e,i=t.createBuffer(1,n,t.sampleRate),r=i.getChannelData(0);for(let a=0;a<n;a++)r[a]=2*Math.random()-1;return i}playCrack(e="good"){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const t=this.ctx,n=t.currentTime,i={perfect:{freq:2800,q:6,vol:1,dur:.1},good:{freq:2200,q:5,vol:.7,dur:.08},weak:{freq:1200,q:3,vol:.4,dur:.06},foul:{freq:1600,q:4,vol:.35,dur:.05}},r=i[e]??i.good,a=t.createBufferSource();a.buffer=this.noise(r.dur);const o=t.createBiquadFilter();o.type="bandpass",o.frequency.value=r.freq,o.Q.value=r.q;const l=t.createGain();if(l.gain.setValueAtTime(r.vol,n),l.gain.exponentialRampToValueAtTime(.001,n+r.dur),a.connect(o),o.connect(l),l.connect(this.masterGain),a.start(n),e==="perfect"){const c=t.createOscillator();c.type="sine",c.frequency.value=120;const h=t.createGain();h.gain.setValueAtTime(.3,n),h.gain.exponentialRampToValueAtTime(.001,n+.15),c.connect(h),h.connect(this.masterGain),c.start(n),c.stop(n+.2)}}playWhiff(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(.15);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.setValueAtTime(800,t),i.frequency.linearRampToValueAtTime(200,t+.15),i.Q.value=2;const r=e.createGain();r.gain.setValueAtTime(.4,t),r.gain.linearRampToValueAtTime(0,t+.15),n.connect(i),i.connect(r),r.connect(this.masterGain),n.start(t)}playCheer(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(2);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.value=1500,i.Q.value=.5;const r=e.createOscillator();r.frequency.value=3;const a=e.createGain();a.gain.value=300,r.connect(a),a.connect(i.frequency),r.start(t),r.stop(t+2);const o=e.createGain();o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.5,t+.2),o.gain.setValueAtTime(.5,t+1.2),o.gain.linearRampToValueAtTime(0,t+2),n.connect(i),i.connect(o),o.connect(this.masterGain),n.start(t)}playGroan(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(1);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.setValueAtTime(600,t),i.frequency.linearRampToValueAtTime(300,t+1),i.Q.value=.8;const r=e.createGain();r.gain.setValueAtTime(.4,t),r.gain.linearRampToValueAtTime(0,t+1),n.connect(i),i.connect(r),r.connect(this.masterGain),n.start(t)}playStrike(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime;[0,.12].forEach(n=>{const i=e.createOscillator();i.type="square",i.frequency.value=350,i.detune.value=40*Math.random()-20;const r=e.createGain();r.gain.setValueAtTime(.2,t+n),r.gain.exponentialRampToValueAtTime(.001,t+n+.08),i.connect(r),r.connect(this.masterGain),i.start(t+n),i.stop(t+n+.1)})}playBall(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type="square",n.frequency.value=250,n.detune.value=40*Math.random()-20;const i=e.createGain();i.gain.setValueAtTime(.2,t),i.gain.exponentialRampToValueAtTime(.001,t+.3),n.connect(i),i.connect(this.masterGain),n.start(t),n.stop(t+.35)}startPitchWhoosh(e){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;this.stopPitchWhoosh();const t=this.ctx,n=t.currentTime,i=t.createBufferSource();i.buffer=this.noise(1.5);const r=t.createBiquadFilter();r.type="bandpass";const a=300+8*e;r.frequency.setValueAtTime(.4*a,n),r.frequency.linearRampToValueAtTime(a,n+.7),r.Q.value=1.5;const o=t.createGain();o.gain.setValueAtTime(0,n),o.gain.linearRampToValueAtTime(.15,n+.5),o.gain.setValueAtTime(.15,n+.7),o.gain.linearRampToValueAtTime(0,n+1),i.connect(r),r.connect(o),o.connect(this.masterGain),i.start(n),this.whooshSource=i,this.whooshGain=o}stopPitchWhoosh(){if(this.whooshSource){try{this.whooshSource.stop()}catch{}this.whooshSource=null}this.whooshGain=null}playHomeRunHorn(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime;[220,440].forEach(n=>{const i=e.createOscillator();i.type="sawtooth",i.frequency.value=n;const r=e.createBiquadFilter();r.type="lowpass",r.frequency.value=1200;const a=e.createGain();a.gain.setValueAtTime(0,t),a.gain.linearRampToValueAtTime(.3,t+.3),a.gain.setValueAtTime(.3,t+1),a.gain.linearRampToValueAtTime(0,t+1.5),i.connect(r),r.connect(a),a.connect(this.masterGain),i.start(t),i.stop(t+1.6)}),setTimeout(()=>this.playCheer(),200)}startAmbient(){if(!this.ctx||!this.isUnlocked||!this.masterGain||this.ambientSource)return;const e=this.ctx;this.stopAmbientLayers();const t=e.createBuffer(1,4*e.sampleRate,e.sampleRate),n=t.getChannelData(0);let i=0;for(let y=0;y<n.length;y++)i=(i+.02*(2*Math.random()-1))/1.02,n[y]=3.5*i;const r=e.createBufferSource();r.buffer=t,r.loop=!0;const a=e.createBiquadFilter();a.type="lowpass",a.frequency.value=250;const o=e.createGain();o.gain.value=this.baseAmbientVolume,r.connect(a),a.connect(o),o.connect(this.masterGain),r.start();const l=e.createBuffer(1,6*e.sampleRate,e.sampleRate),c=l.getChannelData(0);for(let y=0;y<c.length;y++)c[y]=.6*(2*Math.random()-1);const h=e.createBufferSource();h.buffer=l,h.loop=!0;const u=e.createBiquadFilter();u.type="bandpass",u.frequency.value=650,u.Q.value=.6,this.ambientMidFilter=u;const d=e.createOscillator();d.type="sine",d.frequency.value=.15;const p=e.createGain();p.gain.value=150,d.connect(p),p.connect(u.frequency),d.start(),this.ambientLfoNode=d;const f=e.createGain();f.gain.value=.7*this.baseAmbientVolume,h.connect(u),u.connect(f),f.connect(this.masterGain),h.start();const g=e.createBuffer(1,5*e.sampleRate,e.sampleRate),m=g.getChannelData(0);for(let y=0;y<m.length;y++)m[y]=.3*(2*Math.random()-1);const _=e.createBufferSource();_.buffer=g,_.loop=!0;const x=e.createBiquadFilter();x.type="bandpass",x.frequency.value=1800,x.Q.value=.4,this.ambientHighFilter=x;const v=e.createGain();v.gain.value=.35*this.baseAmbientVolume,_.connect(x),x.connect(v),v.connect(this.masterGain),_.start(),this.ambientSource=r,this.ambientGain=o,this.ambientLayers=[r,h,_],this.ambientLayerGains=[o,f,v]}stopAmbientLayers(){for(const e of this.ambientLayers)try{e.stop()}catch{}if(this.ambientLfoNode){try{this.ambientLfoNode.stop()}catch{}this.ambientLfoNode=null}this.ambientLayers=[],this.ambientLayerGains=[],this.ambientMidFilter=null,this.ambientHighFilter=null}playOrganRiff(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime;[523.25,659.25,783.99].forEach((n,i)=>{const r=e.createOscillator();r.type="square",r.frequency.value=n;const a=e.createBiquadFilter();a.type="lowpass",a.frequency.value=2e3;const o=e.createGain(),l=t+.15*i;o.gain.setValueAtTime(0,l),o.gain.linearRampToValueAtTime(.2,l+.03),o.gain.setValueAtTime(.2,l+.12),o.gain.exponentialRampToValueAtTime(.001,l+.3),r.connect(a),a.connect(o),o.connect(this.masterGain),r.start(l),r.stop(l+.35)})}playUmpireOut(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime;[280,220].forEach((n,i)=>{const r=e.createOscillator();r.type="square",r.frequency.value=n;const a=e.createGain(),o=t+.18*i;a.gain.setValueAtTime(.25,o),a.gain.exponentialRampToValueAtTime(.001,o+.15),r.connect(a),a.connect(this.masterGain),r.start(o),r.stop(o+.2)})}playCrowdForStreak(e){if(!this.ctx||!this.isUnlocked||!this.masterGain||e<2)return;const t=this.ctx,n=t.currentTime,i=Math.min(.3+.1*e,.8),r=.8+.3*e,a=t.createBufferSource();a.buffer=this.noise(r);const o=t.createBiquadFilter();o.type="bandpass",o.frequency.value=1200+200*e,o.Q.value=.4;const l=t.createGain();l.gain.setValueAtTime(0,n),l.gain.linearRampToValueAtTime(i,n+.1),l.gain.setValueAtTime(i,n+.6*r),l.gain.linearRampToValueAtTime(0,n+r),a.connect(o),o.connect(l),l.connect(this.masterGain),a.start(n)}playWalkUp(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime;[349.23,440,523.25].forEach((n,i)=>{const r=e.createOscillator();r.type="sawtooth",r.frequency.value=n;const a=e.createBiquadFilter();a.type="lowpass",a.frequency.value=1500;const o=e.createGain(),l=t+.1*i;o.gain.setValueAtTime(0,l),o.gain.linearRampToValueAtTime(.15,l+.02),o.gain.exponentialRampToValueAtTime(.001,l+.2),r.connect(a),a.connect(o),o.connect(this.masterGain),r.start(l),r.stop(l+.25)})}playCrowdForHit(e){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const t=this.ctx,n=t.currentTime,i={single:{vol:.25,dur:.8,freq:1200},double:{vol:.35,dur:1.2,freq:1400},triple:{vol:.45,dur:1.6,freq:1600},homeRun:{vol:.55,dur:2,freq:1800}},r=i[e]??i.single,a=t.createBufferSource();a.buffer=this.noise(r.dur);const o=t.createBiquadFilter();o.type="bandpass",o.frequency.value=r.freq,o.Q.value=.5;const l=t.createOscillator();l.frequency.value=2.5;const c=t.createGain();c.gain.value=200,l.connect(c),c.connect(o.frequency),l.start(n),l.stop(n+r.dur);const h=t.createGain();h.gain.setValueAtTime(0,n),h.gain.linearRampToValueAtTime(r.vol,n+.08),h.gain.setValueAtTime(r.vol,n+.5*r.dur),h.gain.linearRampToValueAtTime(0,n+r.dur),a.connect(o),o.connect(h),h.connect(this.masterGain),a.start(n)}playTwoOutTension(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(1.5);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.value=800,i.Q.value=.6;const r=e.createGain();r.gain.setValueAtTime(0,t),r.gain.linearRampToValueAtTime(.12,t+.5),r.gain.setValueAtTime(.12,t+1),r.gain.linearRampToValueAtTime(0,t+1.5),n.connect(i),i.connect(r),r.connect(this.masterGain),n.start(t)}playFullCountClap(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime;for(let n=0;n<6;n++){const i=t+.33*n,r=e.createBufferSource();r.buffer=this.noise(.04);const a=e.createBiquadFilter();a.type="bandpass",a.frequency.value=3e3,a.Q.value=2;const o=e.createGain();o.gain.setValueAtTime(.15+.02*n,i),o.gain.exponentialRampToValueAtTime(.001,i+.05),r.connect(a),a.connect(o),o.connect(this.masterGain),r.start(i)}}setCrowdEnergy(e,t,n,i){if(!this.ctx||!this.ambientGain||this.muted)return;let r=.06+Math.min(.012*(t-1),.05)+Math.min(.006*e,.04)+Math.min(.01*n,.03);i!==void 0&&i>=3?r*=.15:i!==void 0&&i>=2&&(r*=.5),i!==void 0&&i>=1&&n>=1&&(r*=2);const a=this.ctx.currentTime;this.ambientGain.gain.cancelScheduledValues(a),this.ambientGain.gain.setTargetAtTime(Math.min(r,.2),a,.5)}playInningTransition(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(2);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.setValueAtTime(600,t),i.frequency.linearRampToValueAtTime(1200,t+.8),i.frequency.linearRampToValueAtTime(800,t+2),i.Q.value=.5;const r=e.createGain();r.gain.setValueAtTime(0,t),r.gain.linearRampToValueAtTime(.25,t+.6),r.gain.setValueAtTime(.25,t+1),r.gain.linearRampToValueAtTime(0,t+2),n.connect(i),i.connect(r),r.connect(this.masterGain),n.start(t)}playBigInning(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(3);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.value=1600,i.Q.value=.4;const r=e.createOscillator();r.frequency.value=4;const a=e.createGain();a.gain.value=400,r.connect(a),a.connect(i.frequency),r.start(t),r.stop(t+3);const o=e.createGain();o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.6,t+.15),o.gain.setValueAtTime(.6,t+1.5),o.gain.linearRampToValueAtTime(0,t+3),n.connect(i),i.connect(o),o.connect(this.masterGain),n.start(t)}playClutchHit(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime;[587.33,739.99,880].forEach((n,i)=>{const r=e.createOscillator();r.type="sawtooth",r.frequency.value=n;const a=e.createBiquadFilter();a.type="lowpass",a.frequency.value=2500;const o=e.createGain(),l=t+.08*i;o.gain.setValueAtTime(0,l),o.gain.linearRampToValueAtTime(.25,l+.03),o.gain.setValueAtTime(.25,l+.15),o.gain.exponentialRampToValueAtTime(.001,l+.5),r.connect(a),a.connect(o),o.connect(this.masterGain),r.start(l),r.stop(l+.55)})}playGlovePop(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(.04);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.value=4200,i.Q.value=3;const r=e.createOscillator();r.type="sine",r.frequency.value=180;const a=e.createGain();a.gain.setValueAtTime(.15,t),a.gain.exponentialRampToValueAtTime(.001,t+.05),r.connect(a),a.connect(this.masterGain),r.start(t),r.stop(t+.06);const o=e.createGain();o.gain.setValueAtTime(.35,t),o.gain.exponentialRampToValueAtTime(.001,t+.04),n.connect(i),i.connect(o),o.connect(this.masterGain),n.start(t)}playFoulTick(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(.02);const i=e.createBiquadFilter();i.type="highpass",i.frequency.value=5e3,i.Q.value=2;const r=e.createGain();r.gain.setValueAtTime(.2,t),r.gain.exponentialRampToValueAtTime(.001,t+.03),n.connect(i),i.connect(r),r.connect(this.masterGain),n.start(t)}playWallBounce(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createOscillator();n.type="sine",n.frequency.value=80;const i=e.createGain();i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.001,t+.12),n.connect(i),i.connect(this.masterGain),n.start(t),n.stop(t+.15);const r=e.createBufferSource();r.buffer=this.noise(.08);const a=e.createBiquadFilter();a.type="bandpass",a.frequency.value=2800,a.Q.value=4;const o=e.createGain();o.gain.setValueAtTime(.2,t+.03),o.gain.exponentialRampToValueAtTime(.001,t+.1),r.connect(a),a.connect(o),o.connect(this.masterGain),r.start(t+.03)}playBasesLoaded(){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const e=this.ctx,t=e.currentTime,n=e.createBufferSource();n.buffer=this.noise(3);const i=e.createBiquadFilter();i.type="bandpass",i.frequency.value=1e3,i.Q.value=.3;const r=e.createOscillator();r.frequency.value=2;const a=e.createGain();a.gain.value=.15,r.connect(a),a.connect(i.frequency),r.start(t),r.stop(t+3);const o=e.createGain();o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.4,t+.3),o.gain.setValueAtTime(.4,t+2),o.gain.linearRampToValueAtTime(0,t+3),n.connect(i),i.connect(o),o.connect(this.masterGain),n.start(t);for(let l=0;l<4;l++){const c=t+.3+.5*l,h=e.createOscillator();h.type="sine",h.frequency.value=60;const u=e.createGain();u.gain.setValueAtTime(.2,c),u.gain.exponentialRampToValueAtTime(.001,c+.1),h.connect(u),u.connect(this.masterGain),h.start(c),h.stop(c+.12)}}crowdReact(e){if(!this.ctx||!this.isUnlocked||!this.masterGain)return;const t=this.ctx,n=t.currentTime;switch(e){case"hit":{const i=t.createBufferSource();i.buffer=this.noise(1.2);const r=t.createBiquadFilter();r.type="bandpass",r.frequency.value=1100,r.Q.value=.5,r.frequency.linearRampToValueAtTime(1400,n+.6);const a=t.createGain();a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.3,n+.1),a.gain.setValueAtTime(.3,n+.5),a.gain.linearRampToValueAtTime(0,n+1.2),i.connect(r),r.connect(a),a.connect(this.masterGain),i.start(n);break}case"homerun":{const i=t.createBufferSource();i.buffer=this.noise(3);const r=t.createBiquadFilter();r.type="bandpass",r.frequency.value=600,r.Q.value=.3;const a=t.createGain();a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.45,n+.2),a.gain.setValueAtTime(.45,n+1.8),a.gain.linearRampToValueAtTime(0,n+3),i.connect(r),r.connect(a),a.connect(this.masterGain),i.start(n);const o=t.createBufferSource();o.buffer=this.noise(3);const l=t.createBiquadFilter();l.type="bandpass",l.frequency.value=1600,l.Q.value=.4;const c=t.createOscillator();c.frequency.value=3.5;const h=t.createGain();h.gain.value=350,c.connect(h),h.connect(l.frequency),c.start(n),c.stop(n+3);const u=t.createGain();u.gain.setValueAtTime(0,n),u.gain.linearRampToValueAtTime(.5,n+.15),u.gain.setValueAtTime(.5,n+2),u.gain.linearRampToValueAtTime(0,n+3),o.connect(l),l.connect(u),u.connect(this.masterGain),o.start(n);const d=t.createBufferSource();d.buffer=this.noise(2.5);const p=t.createBiquadFilter();p.type="bandpass",p.frequency.value=3200,p.Q.value=.5;const f=t.createGain();f.gain.setValueAtTime(0,n),f.gain.linearRampToValueAtTime(.2,n+.3),f.gain.setValueAtTime(.2,n+1.5),f.gain.linearRampToValueAtTime(0,n+2.5),d.connect(p),p.connect(f),f.connect(this.masterGain),d.start(n);break}case"strikeout":{const i=t.createBufferSource();i.buffer=this.noise(1.4);const r=t.createBiquadFilter();r.type="bandpass",r.frequency.setValueAtTime(500,n),r.frequency.linearRampToValueAtTime(250,n+1),r.Q.value=.7;const a=t.createGain();a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.3,n+.08),a.gain.setValueAtTime(.3,n+.3),a.gain.linearRampToValueAtTime(0,n+1.4),i.connect(r),r.connect(a),a.connect(this.masterGain),i.start(n);const o=t.createBufferSource();o.buffer=this.noise(1);const l=t.createBiquadFilter();l.type="bandpass",l.frequency.setValueAtTime(800,n),l.frequency.linearRampToValueAtTime(400,n+.8),l.Q.value=.5;const c=t.createGain();c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.15,n+.06),c.gain.setValueAtTime(.15,n+.25),c.gain.linearRampToValueAtTime(0,n+1),o.connect(l),l.connect(c),c.connect(this.masterGain),o.start(n);break}case"foul":{const i=t.createBufferSource();i.buffer=this.noise(.7);const r=t.createBiquadFilter();r.type="bandpass",r.frequency.value=1e3,r.Q.value=.6;const a=t.createGain();a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.2,n+.05),a.gain.setValueAtTime(.2,n+.15),a.gain.linearRampToValueAtTime(0,n+.7),i.connect(r),r.connect(a),a.connect(this.masterGain),i.start(n);break}}}setTension(e){this.ctx&&!this.muted&&(this.currentTensionStrikes=e,this.applyAmbientModulation())}setRallyMode(e){this.ctx&&!this.muted&&(this.rallyMode=e,this.applyAmbientModulation())}applyAmbientModulation(){if(!this.ctx||this.ambientLayerGains.length<3)return;const e=this.ctx.currentTime,t=(1+.2*this.currentTensionStrikes)*(this.rallyMode?1.4:1),n=this.ambientLayerGains[0];n.gain.cancelScheduledValues(e),n.gain.setTargetAtTime(this.baseAmbientVolume*t,e,.4);const i=this.ambientLayerGains[1];i.gain.cancelScheduledValues(e),i.gain.setTargetAtTime(.7*this.baseAmbientVolume*t*1.2,e,.4);const r=this.ambientLayerGains[2];if(r.gain.cancelScheduledValues(e),r.gain.setTargetAtTime(.35*this.baseAmbientVolume*t,e,.4),this.ambientMidFilter){const o=50*this.currentTensionStrikes,l=this.rallyMode?100:0;this.ambientMidFilter.frequency.cancelScheduledValues(e),this.ambientMidFilter.frequency.setTargetAtTime(650+o+l,e,.5)}this.ambientHighFilter&&this.rallyMode?(this.ambientHighFilter.frequency.cancelScheduledValues(e),this.ambientHighFilter.frequency.setTargetAtTime(2200,e,.5)):this.ambientHighFilter&&(this.ambientHighFilter.frequency.cancelScheduledValues(e),this.ambientHighFilter.frequency.setTargetAtTime(1800,e,.5))}stopAmbient(){this.stopAmbientLayers(),this.ambientSource=null,this.ambientGain=null,this.rallyMode=!1,this.currentTensionStrikes=0}get isMuted(){return this.muted}toggleMute(){return this.muted=!this.muted,this.masterGain&&(this.masterGain.gain.value=this.muted?0:.7),this.muted}dispose(){this.stopAmbient(),this.stopPitchWhoosh(),this.ctx?.state!=="closed"&&this.ctx?.close()}}const Jt={perfectTrail:new Ue(16766720),perfectTrailAlt:new Ue(12539648),goodTrail:new Ue(16777215),dirt:new Ue(12887933),fireworkRed:new Ue(16729156),fireworkGold:new Ue(16766720),fireworkWhite:new Ue(16777215),dustMote:new Ue(16770229)};class ux{constructor(e){se(this,"scene"),se(this,"systems",[]),se(this,"trailSystem",null),se(this,"trailHead",0),se(this,"TRAIL_COUNT",60),se(this,"dustMotes",null),se(this,"streakAura",null),se(this,"streakAuraCenter",new M),se(this,"streakActive",!1),se(this,"ballShadow",null),this.scene=e}startTrail(e){this.stopTrail();const t=this.TRAIL_COUNT,n=new rt,i=new Float32Array(3*t),r=new Float32Array(3*t),a=new Float32Array(t),o=e==="perfect"?Jt.perfectTrail:Jt.goodTrail;for(let h=0;h<t;h++)i[3*h]=0,i[3*h+1]=-999,i[3*h+2]=0,r[3*h]=o.r,r[3*h+1]=o.g,r[3*h+2]=o.b,a[h]=e==="perfect"?.08:.05;n.setAttribute("position",new st(i,3)),n.setAttribute("color",new st(r,3)),n.setAttribute("size",new st(a,1));const l=new Qt({size:e==="perfect"?.08:.05,vertexColors:!0,transparent:!0,opacity:.8,blending:Xn,depthWrite:!1}),c=new an(n,l);c.frustumCulled=!1,this.scene.add(c),this.trailSystem={points:c,velocities:new Float32Array(3*t),lifetimes:new Float32Array(t),maxLifetimes:new Float32Array(t).fill(.5),alive:!0,elapsed:0,duration:5},this.trailHead=0}updateTrail(e){if(!this.trailSystem?.alive)return;const t=this.trailSystem.points.geometry,n=t.attributes.position.array,i=t.attributes.color.array,r=this.trailHead;n[3*r]=e.x+.03*(Math.random()-.5),n[3*r+1]=e.y+.03*(Math.random()-.5),n[3*r+2]=e.z+.03*(Math.random()-.5),this.trailHead%3==0&&(i[3*r]=Jt.perfectTrailAlt.r,i[3*r+1]=Jt.perfectTrailAlt.g,i[3*r+2]=Jt.perfectTrailAlt.b),this.trailHead=(this.trailHead+1)%this.TRAIL_COUNT,t.attributes.position.needsUpdate=!0,t.attributes.color.needsUpdate=!0;const a=this.trailSystem.points.material;a.opacity=Math.max(.3,a.opacity-.002)}stopTrail(){this.trailSystem&&(this.scene.remove(this.trailSystem.points),this.trailSystem.points.geometry.dispose(),this.trailSystem.points.material.dispose(),this.trailSystem=null)}spawnImpact(e,t){const n=t==="perfect"?40:20,i=new rt,r=new Float32Array(3*n),a=new Float32Array(3*n),o=new Float32Array(n),l=new Float32Array(n);for(let d=0;d<n;d++){r[3*d]=e.x,r[3*d+1]=e.y,r[3*d+2]=e.z;const p=Math.random()*Math.PI*2,f=2+4*Math.random();a[3*d]=Math.cos(p)*f,a[3*d+1]=Math.sin(p)*f*.3,a[3*d+2]=2+3*Math.random(),o[d]=0,l[d]=.3+.4*Math.random()}i.setAttribute("position",new st(r,3));const c=t==="perfect"?Jt.perfectTrail:Jt.dirt,h=new Qt({size:t==="perfect"?.06:.04,color:c,transparent:!0,opacity:1,blending:t==="perfect"?Xn:Nf,depthWrite:!1}),u=new an(i,h);u.frustumCulled=!1,this.scene.add(u),this.systems.push({points:u,velocities:a,lifetimes:o,maxLifetimes:l,alive:!0,elapsed:0,duration:.8})}spawnFireworks(e){for(let t=0;t<3;t++){const i=new rt,r=new Float32Array(240),a=new Float32Array(240),o=new Float32Array(240),l=new Float32Array(80),c=new Float32Array(80),h=new M(8*(Math.random()-.5),4*(Math.random()-.5),3*Math.random()),u=e.clone().add(h),d=[Jt.fireworkRed,Jt.fireworkGold,Jt.fireworkWhite][t%3];for(let g=0;g<80;g++){r[3*g]=u.x,r[3*g+1]=u.y,r[3*g+2]=u.z;const m=Math.random()*Math.PI*2,_=Math.acos(2*Math.random()-1),x=3+6*Math.random();a[3*g]=Math.sin(_)*Math.cos(m)*x,a[3*g+1]=Math.sin(_)*Math.sin(m)*x,a[3*g+2]=Math.cos(_)*x,o[3*g]=d.r,o[3*g+1]=d.g,o[3*g+2]=d.b,l[g]=0,c[g]=.8+.6*Math.random()}i.setAttribute("position",new st(r,3)),i.setAttribute("color",new st(o,3));const p=new Qt({size:.12,vertexColors:!0,transparent:!0,opacity:1,blending:Xn,depthWrite:!1}),f=new an(i,p);f.frustumCulled=!1,setTimeout(()=>{this.scene.add(f),this.systems.push({points:f,velocities:a,lifetimes:l,maxLifetimes:c,alive:!0,elapsed:0,duration:1.5})},300*t)}}startDustMotes(){if(this.dustMotes)return;const e=new rt,t=new Float32Array(300);for(let i=0;i<100;i++)t[3*i]=40*(Math.random()-.5),t[3*i+1]=30*Math.random(),t[3*i+2]=8*Math.random();e.setAttribute("position",new st(t,3));const n=new Qt({size:.03,color:Jt.dustMote,transparent:!0,opacity:.3,depthWrite:!1});this.dustMotes=new an(e,n),this.dustMotes.frustumCulled=!1,this.scene.add(this.dustMotes)}spawnFenceFlash(e){const n=new rt,i=new Float32Array(150),r=new Float32Array(150),a=new Float32Array(150),o=new Float32Array(50),l=new Float32Array(50);for(let u=0;u<50;u++){i[3*u]=e.x,i[3*u+1]=e.y,i[3*u+2]=e.z;const d=Math.random()*Math.PI*2,p=4+6*Math.random();r[3*u]=Math.cos(d)*p,r[3*u+1]=Math.sin(d)*p*.3,r[3*u+2]=1+2*Math.random();const f=u%2==0?Jt.fireworkGold:Jt.fireworkWhite;a[3*u]=f.r,a[3*u+1]=f.g,a[3*u+2]=f.b,o[u]=0,l[u]=.4+.3*Math.random()}n.setAttribute("position",new st(i,3)),n.setAttribute("color",new st(a,3));const c=new Qt({size:.1,vertexColors:!0,transparent:!0,opacity:1,blending:Xn,depthWrite:!1}),h=new an(n,c);h.frustumCulled=!1,this.scene.add(h),this.systems.push({points:h,velocities:r,lifetimes:o,maxLifetimes:l,alive:!0,elapsed:0,duration:.8})}spawnCatchFlash(e){const t=new rt,n=new Float32Array(36),i=new Float32Array(36),r=new Float32Array(12),a=new Float32Array(12);for(let c=0;c<12;c++){n[3*c]=e.x,n[3*c+1]=e.y,n[3*c+2]=e.z;const h=Math.random()*Math.PI*2,u=1+2*Math.random();i[3*c]=Math.cos(h)*u,i[3*c+1]=Math.sin(h)*u*.5,i[3*c+2]=.5+Math.random(),r[c]=0,a[c]=.15+.15*Math.random()}t.setAttribute("position",new st(n,3));const o=new Qt({size:.05,color:16777215,transparent:!0,opacity:.9,blending:Xn,depthWrite:!1}),l=new an(t,o);l.frustumCulled=!1,this.scene.add(l),this.systems.push({points:l,velocities:i,lifetimes:r,maxLifetimes:a,alive:!0,elapsed:0,duration:.4})}spawnContactRing(e,t){const i=new rt,r=new Float32Array(72),a=new Float32Array(72),o=new Float32Array(24),l=new Float32Array(24),c=t==="perfect"?16766720:t==="good"?3398997:16747520;for(let d=0;d<24;d++){const p=d/24*Math.PI*2;r[3*d]=e.x,r[3*d+1]=e.y,r[3*d+2]=e.z;const f=3;a[3*d]=Math.cos(p)*f,a[3*d+1]=Math.sin(p)*f*.3,a[3*d+2]=0,o[d]=0,l[d]=.2+.1*Math.random()}i.setAttribute("position",new st(r,3));const h=new Qt({size:.06,color:c,transparent:!0,opacity:.9,blending:Xn,depthWrite:!1}),u=new an(i,h);u.frustumCulled=!1,this.scene.add(u),this.systems.push({points:u,velocities:a,lifetimes:o,maxLifetimes:l,alive:!0,elapsed:0,duration:.35})}spawnPitchMarker(e,t){const n=new rt,i=new Float32Array(24),r=new Float32Array(24),a=new Float32Array(8),o=new Float32Array(8);for(let h=0;h<8;h++)i[3*h]=e.x+.05*(Math.random()-.5),i[3*h+1]=e.y,i[3*h+2]=e.z+.05*(Math.random()-.5),r[3*h]=.4*(Math.random()-.5),r[3*h+1]=.4*(Math.random()-.5),r[3*h+2]=.2*Math.random(),a[h]=0,o[h]=.3+.2*Math.random();n.setAttribute("position",new st(i,3));const l=new Qt({size:.08,color:t?16729156:4504388,transparent:!0,opacity:.8,blending:Xn,depthWrite:!1}),c=new an(n,l);c.frustumCulled=!1,this.scene.add(c),this.systems.push({points:c,velocities:r,lifetimes:a,maxLifetimes:o,alive:!0,elapsed:0,duration:.5})}spawnSwingArc(e){const n=new rt,i=new Float32Array(48),r=new Float32Array(48),a=new Float32Array(16),o=new Float32Array(16);for(let h=0;h<16;h++){const u=h/16*1.1-.5,d=.8+.3*Math.random();i[3*h]=e.x+Math.cos(u)*d,i[3*h+1]=e.y+Math.sin(u)*d*.3,i[3*h+2]=e.z+.3+.1*Math.random(),r[3*h]=2*Math.cos(u),r[3*h+1]=1*Math.sin(u),r[3*h+2]=.5,a[h]=0,o[h]=.1+.08*Math.random()}n.setAttribute("position",new st(i,3));const l=new Qt({size:.04,color:16777215,transparent:!0,opacity:.6,blending:Xn,depthWrite:!1}),c=new an(n,l);c.frustumCulled=!1,this.scene.add(c),this.systems.push({points:c,velocities:r,lifetimes:a,maxLifetimes:o,alive:!0,elapsed:0,duration:.25})}spawnDirtKick(e){const t=new rt,n=new Float32Array(24),i=new Float32Array(24),r=new Float32Array(8),a=new Float32Array(8);for(let c=0;c<8;c++){n[3*c]=e.x+.1*(Math.random()-.5),n[3*c+1]=e.y+.1*(Math.random()-.5),n[3*c+2]=e.z;const h=Math.random()*Math.PI*2;i[3*c]=Math.cos(h)*(.5+Math.random()),i[3*c+1]=.3*Math.sin(h),i[3*c+2]=1+2*Math.random(),r[c]=0,a[c]=.2+.15*Math.random()}t.setAttribute("position",new st(n,3));const o=new Qt({size:.06,color:Jt.dirt.getHex(),transparent:!0,opacity:.7,depthWrite:!1}),l=new an(t,o);l.frustumCulled=!1,this.scene.add(l),this.systems.push({points:l,velocities:i,lifetimes:r,maxLifetimes:a,alive:!0,elapsed:0,duration:.3})}spawnBaseDust(e){const t=new rt,n=new Float32Array(30),i=new Float32Array(30),r=new Float32Array(10),a=new Float32Array(10);for(let c=0;c<10;c++){n[3*c]=e.x,n[3*c+1]=e.y,n[3*c+2]=e.z+.05;const h=Math.random()*Math.PI*2;i[3*c]=Math.cos(h)*(.8+Math.random()),i[3*c+1]=Math.sin(h)*(.8+Math.random()),i[3*c+2]=.3+.5*Math.random(),r[c]=0,a[c]=.3+.2*Math.random()}t.setAttribute("position",new st(n,3));const o=new Qt({size:.07,color:Jt.dirt.getHex(),transparent:!0,opacity:.5,depthWrite:!1}),l=new an(t,o);l.frustumCulled=!1,this.scene.add(l),this.systems.push({points:l,velocities:i,lifetimes:r,maxLifetimes:a,alive:!0,elapsed:0,duration:.4})}spawnWallImpact(e){const n=new rt,i=new Float32Array(90),r=new Float32Array(90),a=new Float32Array(90),o=new Float32Array(30),l=new Float32Array(30);for(let u=0;u<30;u++){i[3*u]=e.x+.3*(Math.random()-.5),i[3*u+1]=e.y,i[3*u+2]=e.z+.5*Math.random();const d=Math.random()*Math.PI,p=2+4*Math.random();r[3*u]=Math.cos(d)*p*.8,r[3*u+1]=-(1+3*Math.random()),r[3*u+2]=1+2*Math.random();const f=u%3==0?Jt.dirt:new Ue(2976286);a[3*u]=f.r,a[3*u+1]=f.g,a[3*u+2]=f.b,o[u]=0,l[u]=.3+.3*Math.random()}n.setAttribute("position",new st(i,3)),n.setAttribute("color",new st(a,3));const c=new Qt({size:.08,vertexColors:!0,transparent:!0,opacity:.8,depthWrite:!1}),h=new an(n,c);h.frustumCulled=!1,this.scene.add(h),this.systems.push({points:h,velocities:r,lifetimes:o,maxLifetimes:l,alive:!0,elapsed:0,duration:.6})}startStreakAura(e){if(this.streakAura)return;this.streakActive=!0,this.streakAuraCenter.copy(e);const t=24,n=new rt,i=new Float32Array(72),r=new Float32Array(72),a=new Float32Array(t),o=new Float32Array(t);for(let h=0;h<t;h++){const u=h/t*Math.PI*2,d=.6+.3*Math.random();i[3*h]=e.x+Math.cos(u)*d,i[3*h+1]=e.y+Math.sin(u)*d*.3,i[3*h+2]=e.z+.5+1*Math.random(),r[3*h]=0,r[3*h+1]=0,r[3*h+2]=.5+.5*Math.random(),a[h]=Math.random(),o[h]=.8+.5*Math.random()}n.setAttribute("position",new st(i,3));const l=new Qt({size:.06,color:Jt.perfectTrail.getHex(),transparent:!0,opacity:.6,blending:Xn,depthWrite:!1}),c=new an(n,l);c.frustumCulled=!1,this.scene.add(c),this.streakAura={points:c,velocities:r,lifetimes:a,maxLifetimes:o,alive:!0,elapsed:0,duration:999}}updateStreakAura(e){if(!this.streakAura||!this.streakActive)return;const t=this.streakAura.points.geometry.attributes.position.array,n=t.length/3;for(let i=0;i<n;i++){this.streakAura.lifetimes[i]+=e,t[3*i+2]+=this.streakAura.velocities[3*i+2]*e;const r=1.5,a=.001*performance.now()*r+i/n*Math.PI*2,o=.5+.15*Math.sin(2*this.streakAura.lifetimes[i]);t[3*i]=this.streakAuraCenter.x+Math.cos(a)*o,t[3*i+1]=this.streakAuraCenter.y+Math.sin(a)*o*.3,this.streakAura.lifetimes[i]>=this.streakAura.maxLifetimes[i]&&(this.streakAura.lifetimes[i]=0,t[3*i+2]=this.streakAuraCenter.z+.5+1*Math.random())}this.streakAura.points.geometry.attributes.position.needsUpdate=!0,this.streakAura.points.material.opacity=.4+.2*Math.sin(.003*performance.now())}stopStreakAura(){this.streakAura&&(this.scene.remove(this.streakAura.points),this.streakAura.points.geometry.dispose(),this.streakAura.points.material.dispose(),this.streakAura=null),this.streakActive=!1}createBallShadow(){if(this.ballShadow)return;const e=new Xc(.15,16),t=new Rn({color:0,transparent:!0,opacity:.35,depthWrite:!1,side:ti});this.ballShadow=new ce(e,t),this.ballShadow.position.z=.02,this.ballShadow.renderOrder=-1,this.scene.add(this.ballShadow)}updateBallShadow(e){if(!this.ballShadow)return;this.ballShadow.visible=!0,this.ballShadow.position.x=e.x,this.ballShadow.position.y=e.y;const t=Math.max(0,e.z),n=1+.15*t;this.ballShadow.scale.set(n,n,1),this.ballShadow.material.opacity=Math.max(.08,.35-.012*t)}removeBallShadow(){this.ballShadow&&(this.scene.remove(this.ballShadow),this.ballShadow.geometry.dispose(),this.ballShadow.material.dispose(),this.ballShadow=null)}hideBallShadow(){this.ballShadow&&(this.ballShadow.visible=!1)}update(e){for(let t=this.systems.length-1;t>=0;t--){const n=this.systems[t];if(!n.alive)continue;if(n.elapsed+=e,n.elapsed>=n.duration){this.scene.remove(n.points),n.points.geometry.dispose(),n.points.material.dispose(),n.alive=!1,this.systems.splice(t,1);continue}const i=n.points.geometry.attributes.position.array,r=i.length/3;for(let l=0;l<r;l++)n.lifetimes[l]+=e,i[3*l]+=n.velocities[3*l]*e,i[3*l+1]+=n.velocities[3*l+1]*e,i[3*l+2]+=n.velocities[3*l+2]*e,n.velocities[3*l+2]+=-9.8*e,n.velocities[3*l]*=.99,n.velocities[3*l+1]*=.99;n.points.geometry.attributes.position.needsUpdate=!0;const a=n.points.material,o=n.elapsed/n.duration;a.opacity=Math.max(0,1-o*o)}if(this.updateStreakAura(e),this.dustMotes){const t=this.dustMotes.geometry.attributes.position.array,n=t.length/3;for(let i=0;i<n;i++)t[3*i]+=.01*(Math.random()-.5),t[3*i+1]+=.003,t[3*i+2]+=.005*(Math.random()-.5),t[3*i+1]>35&&(t[3*i+1]=-5);this.dustMotes.geometry.attributes.position.needsUpdate=!0}}dispose(){this.stopTrail(),this.stopStreakAura(),this.removeBallShadow();for(const e of this.systems)this.scene.remove(e.points),e.points.geometry.dispose(),e.points.material.dispose();this.systems=[],this.dustMotes&&(this.scene.remove(this.dustMotes),this.dustMotes.geometry.dispose(),this.dustMotes.material.dispose(),this.dustMotes=null)}}const Up="https://blazesportsintel.com/api/college-baseball",Op=3e5,go={entry:null},nd=new Map;async function Fp(s){const e=nd.get(s);if(e&&Date.now()-e.ts<Op)return e.data;try{const t=await fetch(`${Up}/teams/${s}`,{signal:AbortSignal.timeout(5e3)});if(!t.ok)throw new Error(`HTTP ${t.status}`);const n=_f(await t.json(),s),i={...n,batters:n.batters.map(r=>({...r,stats:{...r.stats},gameplay:{...r.gameplay}}))};return nd.set(s,{data:i,ts:Date.now()}),i}catch{return jn({id:s})}}function Nc(s){const e=Number(s.avg??.25),t=Number(s.obp??.32),n=Number(s.slg??.42),i=Number(s.bb??0),r=Number(s.k??0),a=Number(s.sb??0),o=Number(s.gp??1),l=.7*(t-e)+.3*Math.max(0,Math.min(1,i/Math.max(r,1)));return{contactRating:Math.round(Math.max(35,Math.min(90,35+(e-.22)/.12*55))),powerRating:Math.round(Math.max(35,Math.min(90,35+(n-.32)/.3*55))),disciplineRating:Math.round(Math.max(35,Math.min(90,35+(l-.05)/.13*55))),speedRating:Math.round(Math.max(40,Math.min(90,40+(a/Math.max(o,1)-0)/1.2*50)))}}function dx(s){return{pitchingRating:Number(s.pitchingRating??55),pitchMixProfile:[...s.pitchMixProfile??["Fastball","Slider","Change-up"]],pitchSpeedBand:{min:Number(s.pitchSpeedBand?.min??86),max:Number(s.pitchSpeedBand?.max??91)},pitchWeights:[...s.pitchWeights??[40,8,24,20,8]],speedMultiplier:Number(s.speedMultiplier??1),movementMultiplier:Number(s.movementMultiplier??1),zoneBias:s.zoneBias??"balanced"}}const px=[{id:"126",name:"Texas Longhorns",abbreviation:"TEX",conference:"SEC",logoUrl:"",primaryColor:"#BF5700",secondaryColor:"#FFFFFF"},{id:"344",name:"Texas A&M Aggies",abbreviation:"TAMU",conference:"SEC",logoUrl:"",primaryColor:"#500000",secondaryColor:"#FFFFFF"},{id:"99",name:"LSU Tigers",abbreviation:"LSU",conference:"SEC",logoUrl:"",primaryColor:"#461D7C",secondaryColor:"#FDD023"},{id:"2633",name:"Vanderbilt Commodores",abbreviation:"VAN",conference:"SEC",logoUrl:"",primaryColor:"#866D4B",secondaryColor:"#000000"},{id:"2",name:"Florida Gators",abbreviation:"FLA",conference:"SEC",logoUrl:"",primaryColor:"#0021A5",secondaryColor:"#FA4616"},{id:"2483",name:"Ole Miss Rebels",abbreviation:"MISS",conference:"SEC",logoUrl:"",primaryColor:"#CE1126",secondaryColor:"#14213D"},{id:"2579",name:"Tennessee Volunteers",abbreviation:"TENN",conference:"SEC",logoUrl:"",primaryColor:"#FF8200",secondaryColor:"#FFFFFF"},{id:"2032",name:"Arkansas Razorbacks",abbreviation:"ARK",conference:"SEC",logoUrl:"",primaryColor:"#9D2235",secondaryColor:"#FFFFFF"},{id:"30",name:"Oregon State Beavers",abbreviation:"ORST",conference:"Pac-12",logoUrl:"",primaryColor:"#DC4405",secondaryColor:"#000000"},{id:"2305",name:"Wake Forest Demon Deacons",abbreviation:"WAKE",conference:"ACC",logoUrl:"",primaryColor:"#9E7E38",secondaryColor:"#000000"},{id:"228",name:"Clemson Tigers",abbreviation:"CLEM",conference:"ACC",logoUrl:"",primaryColor:"#F56600",secondaryColor:"#522D80"},{id:"2116",name:"Virginia Cavaliers",abbreviation:"UVA",conference:"ACC",logoUrl:"",primaryColor:"#232D4B",secondaryColor:"#F84C1E"}];function Kr(s){const e=(s.currentIndex+1)%s.order.length,t=s.order[e];return{...s,currentIndex:e,modifiers:t.gameplay??Nc(t.stats)}}function zi(s,e,t=0){const n=[...s.boxScores],i={...n[s.currentIndex]};switch(e){case"hit":i.atBats++,i.hits++,i.rbi+=t;break;case"homeRun":i.atBats++,i.hits++,i.homeRuns++,i.rbi+=t;break;case"out":i.atBats++;break;case"strikeout":i.atBats++,i.strikeouts++;break;case"walk":i.walks++,i.rbi+=t;break;case"sacFly":i.rbi+=t}return n[s.currentIndex]=i,{...s,boxScores:n}}function vo(s){return{...s,strikes:s.strikes+1}}function fx(s){return s.strikes>=3?"strikeout":s.balls>=4?"walk":Sf(s)?"gameOver":"playing"}const xo=[{name:"Fastball",speedMultiplier:1.15,minMph:88,maxMph:97,trailColor:16739125,breakX:.02,breakZ:.05},{name:"Curve",speedMultiplier:.82,minMph:72,maxMph:82,trailColor:4491519,breakX:.12,breakZ:-.15},{name:"Slider",speedMultiplier:.95,minMph:80,maxMph:88,trailColor:11158783,breakX:.2,breakZ:-.06},{name:"Change-up",speedMultiplier:.85,minMph:76,maxMph:85,trailColor:4508808,breakX:.04,breakZ:-.12},{name:"Cutter",speedMultiplier:1.05,minMph:84,maxMph:92,trailColor:16777215,breakX:.09,breakZ:.01}],mx=["MID_MID","IN_MID","OUT_MID","MID_HIGH","MID_LOW","IN_HIGH","IN_LOW","OUT_HIGH","OUT_LOW"],ns=1.5;function gx(s){const{canvas:e,glbUrl:t,mode:n,difficulty:i="medium",teamRoster:r,opponentRoster:a,sessionSeed:o=br(),onPhaseChange:l,onGameUpdate:c,onGameOver:h,onLineupChange:u,onHitResult:d,onPitchDelivered:p,onContactFeedback:f}=s,g=bd(i),m=g.pitchSpeedMultiplier,_=g.breakScaleMultiplier,x=new Qd({canvas:e,antialias:!0,powerPreference:"high-performance"});x.setPixelRatio(Math.min(window.devicePixelRatio,2)),x.setSize(e.clientWidth,e.clientHeight),x.outputColorSpace=Ut,x.toneMapping=Zf,x.toneMappingExposure=1.1,x.shadowMap.enabled=!0,x.shadowMap.type=Lf;const v=new u0;v.background=new Ue(3824266),v.fog=new h0(6982320,.005);const y=new Zv(e.clientWidth/e.clientHeight),I=r??jn(),S=a??jn(n==="teamMode"?{id:"opponent",name:"Road Pitchers"}:{id:"house",name:"House Pitchers"}),w=n==="quickPlay"||n==="teamMode"?wf({playerPrevention:n==="teamMode"?I.pitchingRating:jn().pitchingRating,opponentOffense:n==="teamMode"?S.targetOffenseRating:jn({id:"arcade-opp"}).targetOffenseRating,difficulty:i,seed:o}):null;let L=null,b=yf({mode:n,teamId:I?.team?.id??null,opponentTeamId:S?.team?.id??null,difficulty:i,sessionSeed:o,targetRuns:w}),C="loading",U=!1,A=!1,O=0,F=null,j=null,J=null,W=null,k=0,$=Date.now(),N=null,Q=null,ve=0,R=!1,T=!1,G=!1;const Z=new nx(()=>(function(){const re=new ln(.037,16,12),Pe=new Ie({color:16119280,roughness:.6,metalness:0}),de=new ce(re,Pe);de.castShadow=!0;const te=new jc(.037,.003,8,24),pe=new Ie({color:13369344,roughness:.8}),X=new ce(te,pe);X.rotation.x=Math.PI/2,de.add(X);const ue=new ce(te,pe);return ue.rotation.z=Math.PI/2,de.add(ue),de})());let D=65,K=null,B=0,V=0,q="",oe=[],ae=1,E=!1,Y=null,z=(function(re,Pe){const de=re.batters.slice(0,9),te=de[0],pe=de.map(X=>({player:X,atBats:0,hits:0,homeRuns:0,rbi:0,strikeouts:0,walks:0}));return{roster:re,order:de,currentIndex:0,boxScores:pe,modifiers:te.gameplay??Nc(te.stats),pitchMods:dx(Pe.pitcher)}})(I,S),H=null,he=0,fe=null,Se=!1,Ee=0;const De=new Js(.2,0,-.5),Te=new Js(.25,0,-.7),Ae=new Js(.2,0,1.1),$e=new Js(.15,.1,1.5);let ht="waggle",Re=0,et=.2,Ze=null,zt=null,Zn=0,Ci=!1,tn=.4,it=null,Pn=!1,ne=0,Vn=null,cn=null,Ft=!1,fs=0;const ms=new M,gs=new M;function Ln(){L&&(function(re,Pe){const de=re.nodes.get("SYB_ScoreboardCanvas");if(!de)return;const te=de._canvas,pe=de._texture;if(!te||!pe)return;const X=te.getContext("2d");if(X){if(X.fillStyle="#0a1a0a",X.fillRect(0,0,512,256),X.fillStyle="#FFD700",X.font="bold 28px monospace",X.textAlign="center",X.fillText(Pe.teamName??"SANDLOT SLUGGERS",256,40),X.fillStyle="#BF5700",X.fillRect(80,52,352,2),X.fillStyle="rgba(255,255,255,0.5)",X.font="14px monospace",X.fillText("RUNS",128,85),X.fillText("HITS",256,85),X.fillText("HR",384,85),X.fillStyle="#33cc33",X.font="bold 48px monospace",X.fillText(String(Pe.runs),128,140),X.fillText(String(Pe.hits),256,140),X.fillText(String(Pe.homeRuns),384,140),X.fillStyle="rgba(255,255,255,0.4)",X.font="16px monospace",X.fillText(`INN ${Pe.inning}  |  ${Pe.outs} OUT`,256,185),Pe.lastPitchMph){X.fillStyle="#FF6B35",X.font="bold 20px monospace";const ue=Pe.lastPitchName?`${Pe.lastPitchName} ${Pe.lastPitchMph} MPH`:`${Pe.lastPitchMph} MPH`;X.fillText(ue,256,212)}X.fillStyle="#BF5700",X.font="12px monospace",X.fillText("BLAZE SPORTS INTEL",256,240),pe.needsUpdate=!0}})(L,{runs:b.stats.runs,hits:b.stats.hits,homeRuns:b.stats.homeRuns,inning:b.inning,outs:b.outs,teamName:r?.team.name,lastPitchMph:V||void 0,lastPitchName:q||void 0})}let vn=null,vs=0,Tr=g.readyDelayMs,xs=g.readyDelayMs;function Jn(re=g.readyDelayMs){vn&&(clearTimeout(vn),vn=null),Tr=re,xs=re,vs=performance.now(),vn=setTimeout(()=>{C==="ready"&&U&&!A&&nt.startNextPitch(),vn=null},re)}function Ar(re=!1){vn&&(re&&(xs=Math.max(0,Tr-(performance.now()-vs))),clearTimeout(vn),vn=null)}function hn(re){if(C!==re)switch(C=re,l?.(C),Ar(!1),C==="ready"&&U&&!A&&Jn(g.readyDelayMs),C){case"ready":case"pitching":y.switchTo(mn.atBat);break;case"fielding":y.switchTo(mn.fieldPlay);break;case"result":break;case"gameOver":y.switchTo(mn.homeRun)}}const _s=["IN_HIGH","IN_LOW","OUT_HIGH","OUT_LOW"],ba=["MID_MID","IN_MID","OUT_MID","MID_HIGH","MID_LOW"];let Ki=null;function Ma(re){if(!j||j.swingTriggered)return;if(Ft=!0,ht==="loading"&&(ht="relaxing",Re=0),F?.stop(),N?.stopPitchWhoosh(),b.mode==="hrDerby")return b=Br(b,{type:"out"}),c?.(b),Ln(),k=ns,void hn("result");var Pe;N?.playGlovePop(),re.isInZone?(b=vo(b),setTimeout(()=>N?.playStrike(),80),N?.setTension(b.strikes)):(Pe=b,b={...Pe,balls:Pe.balls+1},setTimeout(()=>N?.playBall(),80)),Y&&Y.spawnPitchMarker(re.position,re.isInZone),c?.(b),Ln(),b.balls===3&&b.strikes===2&&N?.playFullCountClap();const de=b.strikes>=3?"strikeout":b.balls>=4?"walk":"playing";if(de==="strikeout"||de==="walk"){if(de==="strikeout"){b=Fr(b,{type:"strikeout"}),d?.("strikeout"),N?.playUmpireOut(),N?.crowdReact("strikeout"),N?.setTension(0),N?.setRallyMode(!1),it?.triggerCatcherPump();const pe=L?.anchors.get("SYB_Anchor_Batter"),X=pe?.position.clone()??new M(-.5,-.3,.05);y.strikeoutSnap(X),z&&(z=zi(z,"strikeout"),z=Kr(z),u?.(z),N?.playWalkUp())}else b=Fr(b,{type:"walk"}),d?.("walk"),z&&(z=zi(z,"walk",Math.max(0,b.stats.runs-(Pe?.stats?.runs??0))),z=Kr(z),u?.(z));it?.updateRunners(b.bases),b.inning>ae&&(N?.playInningTransition(),oe=[],ae=b.inning);const te=b.bases[0]&&b.bases[1]&&b.bases[2];te&&!E&&N?.playBasesLoaded(),E=te,c?.(b),Ln()}k=ns,hn("result")}function Er(){if(!F||!j||!L)return;Ft=!0;const re=F.lastCross;if(!re){if(b.mode==="hrDerby")b=Br(b,{type:"out"});else if(b=vo(b),b.strikes>=3){b=Fr(b,{type:"strikeout"}),d?.("strikeoutSwinging"),N?.playWhiff(),N?.crowdReact("strikeout"),N?.setTension(0),N?.setRallyMode(!1);const ue=L.anchors.get("SYB_Anchor_Batter"),ye=ue?.position.clone()??new M(-.5,-.3,.05);y.strikeoutSnap(ye),z&&(z=zi(z,"strikeout"),z=Kr(z),u?.(z),N?.playWalkUp())}return c?.(b),Ln(),k=ns,void hn("result")}const Pe=z?.modifiers??Nc(z?.order?.[z?.currentIndex]?.stats??{}),de=Tf({swingTimeMs:j.swingStartTime,strikeTimeMs:re.timing,contactPoint:{x:re.position.x,z:re.position.z},isInZone:re.isInZone,hitterRatings:Pe,pitchSpeedMph:V||D,difficulty:i}),te=Af(de.tier);if(W=de,de.tier==="whiff")return N?.playWhiff(),b.mode==="hrDerby"?b=Br(b,{type:"out"}):(b=vo(b),b.strikes>=3&&(b=Fr(b,{type:"strikeout"}),d?.("strikeoutSwinging"),z&&(z=zi(z,"strikeout"),z=Kr(z),u?.(z),N?.playWalkUp()))),c?.(b),Ln(),k=ns,void hn("result");if(de.tier==="foul")return P("foul"),N?.playCrack("foul"),N?.playFoulTick(),N?.crowdReact("foul"),y.shakeCamera(.04,10),b.mode==="hrDerby"?b=Br(b,{type:"foul"}):b.strikes<2&&(b=vo(b)),(function(ue){ie=Z.acquire(),ie.position.copy(ue),v.add(ie),Ge=!0,qe=0;const ye=$%2==0?1:-1;we.set(ye*(8+6*Math.random()),-(4+4*Math.random()),6+5*Math.random())})(re.position),F.stop(),c?.(b),Ln(),d?.("foul"),k=ns,void hn("result");N&&N.playCrack(te);const pe=j.swingStartTime-re.timing,X=Math.max(.62,de.exitVelocityMph/92)*(D/65);if(J=rx(te,Math.abs(de.timingDeltaMs),re,$,0,X,pe,D),f&&de.tier!=="whiff"&&de.tier!=="foul"&&f({quality:te,contactTier:de.tier,timingLabel:de.timingLabel.toUpperCase(),exitVelocityMph:Math.round(de.exitVelocityMph),distanceFt:Math.round(de.distanceFt),launchAngleDeg:Math.round(de.launchAngleDeg)}),!Y||te!=="perfect"&&te!=="good"&&te!=="weak"||Y.spawnContactRing(re.position,te),P(te),te==="perfect"?(y.shakeCamera(.15,4),y.fovPunch(8,.15)):te==="good"?(y.shakeCamera(.08,6),y.fovPunch(5,.12)):y.shakeCamera(.03,10),fs=te==="perfect"?.083:te==="good"?.05:.017,N?.stopPitchWhoosh(),te==="perfect"){const ue=x.getClearColor(new Ue);x.setClearColor(16777215),requestAnimationFrame(()=>{x.setClearColor(ue)})}if(Y){const ue=te==="perfect"?"perfect":te==="good"?"good":"default";Y.spawnImpact(re.position,ue),Y.startTrail(ue)}(function(){if(J){if(H=Z.acquire(),J.flightSampleCount>0){const ue=J.flightPositions;H.position.set(ue[0],ue[1],ue[2])}v.add(H),he=0,Y?.createBallShadow(),Y&&H&&Y.updateBallShadow(H.position),H&&gs.copy(H.position)}})(),it&&J&&J.flightSampleCount>0&&it.startPursuit(J.landingPos),it?.startBatterRun(),F.stop(),hn("fielding")}function P(re){if(Se=!0,Ee=0,ht="swinging",Re=0,Ze=re??null,et=re==="perfect"?.22:re==="good"?.18:.12,!fe&&L&&(fe=L.nodes.get("SYB_Bat")??null),Y&&L){const Pe=L.anchors.get("SYB_Anchor_Home"),de=Pe?.position.clone()??new M(0,0,0);Y.spawnSwingArc(de)}it?.startBatterSwing()}let ee=-1;function le(){H&&(H.scale.set(1,1,1),v.remove(H),Z.release(H),H=null),Y?.stopTrail(),Y?.hideBallShadow(),he=0}function me(){if(!J||!L)return;Y&&J.flightSampleCount>0&&Y.spawnImpact(J.landingPos,"default");const re=(function(){const pe=Ef(b,W??{tier:"weak",distanceFt:Math.round(5.5*J.distance),launchAngleDeg:J.launchAngle,exitVelocityMph:Math.round(60+55*J.exitVelocity)},$);return{...pe,basesAdvanced:pe.type==="homeRun"?"homeRun":pe.type==="triple"?3:pe.type==="double"?2:1,isOut:pe.type==="out"||pe.type==="doublePlay"||pe.type==="sacFly",isSacFly:pe.type==="sacFly"}})(),Pe=b.stats.runs;b.mode==="hrDerby"?b=Br(b,{type:re.type==="homeRun"?"homeRun":"out",contactTier:re.contactTier,distanceFt:re.distanceFt}):b=Fr(b,{type:re.type,contactTier:re.contactTier,distanceFt:re.distanceFt});const de=b.stats.runs-Pe;if(z&&(z=re.type==="homeRun"?zi(z,"homeRun",de):re.type==="sacFly"?zi(z,"sacFly",de):re.isOut?zi(z,"out"):zi(z,"hit",de),z=Kr(z),u?.(z),N?.playWalkUp()),re.type==="doublePlay"?d?.("doublePlay"):re.type==="sacFly"?d?.("sacFly"):re.isOut?d?.("out"):re.basesAdvanced==="homeRun"?d?.("homeRun"):re.basesAdvanced===3?d?.("triple"):re.basesAdvanced===2?d?.("double"):d?.("single"),N?.setTension(0),!re.isOut){const pe=re.basesAdvanced==="homeRun"?"homeRun":re.basesAdvanced===3?"triple":re.basesAdvanced===2?"double":"single";if(N?.playCrowdForHit(pe),N?.crowdReact(pe==="homeRun"?"homerun":"hit"),b.stats.currentStreak>=3&&N?.setRallyMode(!0),b.stats.currentStreak>2&&N?.playCrowdForStreak(b.stats.currentStreak),b.stats.currentStreak>=3&&Y){const X=L.anchors.get("SYB_Anchor_Batter"),ue=X?.position.clone()??new M(-.5,-.3,.05);Y.startStreakAura(ue),fe&&fe.traverse(ye=>{ye instanceof de&&ye.material instanceof Ie&&(ye.material.emissive=new Ue(16766720),ye.material.emissiveIntensity=.3)})}}if(re.isOut&&(N?.setRallyMode(!1),Y?.stopStreakAura(),fe&&fe.traverse(pe=>{pe instanceof de&&pe.material instanceof Ie&&(pe.material.emissiveIntensity=0)})),L){const pe=b.stats.runs;pe>B&&((function(X){const ue=X.nodes.get("SYB_ScoreboardCanvas");if(!(ue&&ue instanceof de))return;const ye=ue,ge=ye.material;if(!ge)return;ge.emissive=new Ue(16766720),ge.emissiveIntensity=.4,ge.needsUpdate=!0;const be=ye.scale.clone(),_e=performance.now();requestAnimationFrame(function ze(){const Ne=performance.now()-_e,We=Math.min(Ne/600,1);ge.emissiveIntensity=.4*(1-We*We),ge.needsUpdate=!0;const je=Math.sin(We*Math.PI*2.5)*Math.exp(4*-We),mt=1+(1.08-1)*Math.max(0,je);ye.scale.set(be.x*mt,be.y*mt,be.z*mt),We<1?requestAnimationFrame(ze):(ge.emissiveIntensity=0,ye.scale.copy(be))})})(L),B=pe)}if(re.basesAdvanced==="homeRun"){if(ve++,N?.playHomeRunHorn(),N?.playOrganRiff(),(function(){if(!K)return;const ue=1.4;K.intensity=3,K.color.set(16777184);const ye=performance.now(),ge=800;function be(){const _e=performance.now()-ye,ze=Math.min(_e/ge,1),Ne=1-Math.pow(1-ze,2);K.intensity=3-(3-ue)*Ne;const We=1+(1.0035654105392158-1)*Ne,je=1+(232/255-1)*Ne,mt=.88+(192/255-.88)*Ne;K.color.setRGB(Math.min(We,1),Math.min(je,1),Math.min(mt,1)),ze<1?requestAnimationFrame(be):K.color.set(16771264)}requestAnimationFrame(be)})(),Y){const ue=L.nodes.get("SYB_Scoreboard"),ye=ue?.position.clone()??new M(0,74,5);Y.spawnFireworks(ye),J&&J.flightSampleCount>0&&Y.spawnFenceFlash(J.landingPos)}ve>=3&&!R&&(function(){R||T||!L||(R=!0,G=!1,new bp().load(Cc("/assets/blaze_mascot.glb"),ue=>{const ye=ue.scene;ye.scale.setScalar(1.5),v.add(ye);const ge=L,be=[ge.anchors.get("SYB_Anchor_Home")?.position.clone()??new M(0,0,0),ge.anchors.get("SYB_Anchor_1B")?.position.clone()??new M(19,0,19),ge.anchors.get("SYB_Anchor_2B")?.position.clone()??new M(0,0,27),ge.anchors.get("SYB_Anchor_3B")?.position.clone()??new M(-19,0,19)];let _e=0,ze=0;const Ne=1,We=300,je=new rt,mt=new Float32Array(3*We),Tt=new Float32Array(3*We),Bt=[];for(let vt=0;vt<We;vt++)mt[3*vt]=10*(Math.random()-.5),mt[3*vt+1]=15*Math.random()+5,mt[3*vt+2]=10*(Math.random()-.5),Tt[3*vt]=Math.random(),Tt[3*vt+1]=Math.random(),Tt[3*vt+2]=Math.random(),Bt.push(new M(2*(Math.random()-.5),-2-3*Math.random(),2*(Math.random()-.5)));je.setAttribute("position",new st(mt,3)),je.setAttribute("color",new st(Tt,3));const At=new Qt({size:.15,vertexColors:!0,transparent:!0,opacity:1}),Nt=new an(je,At);Nt.position.copy(be[0]),v.add(Nt);const Mt=performance.now();function Lt(){if(G)return v.remove(ye),v.remove(Nt),je.dispose(),At.dispose(),void(R=!1);const vt=(performance.now()-Mt)/1e3;if(vt>4*Ne+1)return v.remove(ye),v.remove(Nt),je.dispose(),At.dispose(),void(R=!1);const Xe=Math.min(vt,4*Ne);_e=Math.min(Math.floor(Xe/Ne),3),ze=Xe/Ne-_e,ze=Math.min(ze,1);const Ht=be[_e],Et=be[(_e+1)%4];ye.position.lerpVectors(Ht,Et,ze),ye.position.y=1*Math.abs(Math.sin(ze*Math.PI));const kt=new M().subVectors(Et,Ht).normalize();kt.lengthSq()>0&&ye.lookAt(ye.position.clone().add(kt));const $t=je.attributes.position.array;for(let ut=0;ut<We;ut++)$t[3*ut]+=.016*Bt[ut].x,$t[3*ut+1]+=.016*Bt[ut].y,$t[3*ut+2]+=.016*Bt[ut].z;je.attributes.position.needsUpdate=!0,vt>4*Ne&&(At.opacity=Math.max(0,1-(vt-4*Ne))),requestAnimationFrame(Lt)}requestAnimationFrame(Lt)},void 0,ue=>{T=!0,R=!1}))})();const pe=L.anchors.get("SYB_Anchor_Home"),X=pe?.position.clone()??new M(0,0,0);y.triggerSlowMo(1.5),y.startHRCelebration(X)}else re.isOut&&(N?.playGroan(),Y&&J&&J.flightSampleCount>0&&Y.spawnCatchFlash(J.landingPos),J&&J.launchAngle>=15&&it?.triggerCatchAnimation());if(re.basesAdvanced!=="homeRun"&&J&&J.flightSampleCount>0){const{landingPos:pe}=J;Math.sqrt(pe.x*pe.x+pe.y*pe.y)>=D-8&&(N?.playWallBounce(),Y?.spawnWallImpact(pe))}if(it?.resolveBatterRun(re.basesAdvanced,re.isOut),it?.updateRunners(b.bases),re.isOut||re.basesAdvanced==="homeRun")it?.endPursuit();else{const pe=re.basesAdvanced===1?"2B":re.basesAdvanced===2?"3B":"HOME";it?.endPursuit(pe)}b.inning>ae&&(N?.playInningTransition(),oe=[],ae=b.inning);const te=b.bases[0]&&b.bases[1]&&b.bases[2];te&&!E&&N?.playBasesLoaded(),E=te,c?.(b),Ln(),J=null,k=ns,hn("result")}let ie=null,we=new M,Ge=!1,qe=0;function Je(re){if(y.update(re),Y?.update(re),it?.update(re),(function(de){if(fe){if(ht==="loading"){Re+=de;const te=.15,pe=Math.min(Re/te,1),X=pe*pe;return void fe.rotation.set(De.x+(Te.x-De.x)*X,De.y+(Te.y-De.y)*X,De.z+(Te.z-De.z)*X)}if(ht==="swinging"){if(!Se)return;Ee+=de;const te=Math.min(Ee/.12,1),pe=1-Math.pow(1-te,3);return fe.rotation.set(Te.x+(Ae.x-Te.x)*pe,Te.y+(Ae.y-Te.y)*pe,Te.z+(Ae.z-Te.z)*pe),void(te>=1&&(ht="followThrough",Re=0,Se=!1))}if(ht==="followThrough"){Re+=de;const te=Math.min(Re/et,1),pe=1-Math.pow(1-te,2),X=Ze==="perfect"?1:Ze==="good"?.7:.4;return fe.rotation.set(Ae.x+($e.x-Ae.x)*pe*X,Ae.y+($e.y-Ae.y)*pe*X,Ae.z+($e.z-Ae.z)*pe*X),void(te>=1&&(C==="fielding"&&fe?(Pn=!0,ne=0,Vn=fe.position.clone(),ht="waggle"):(ht="relaxing",Re=0)))}if(ht==="relaxing"){Re+=de;const te=.15,pe=Math.min(Re/te,1),X=pe*(2-pe),ue=fe.rotation.x,ye=fe.rotation.y,ge=fe.rotation.z;fe.rotation.set(ue+(De.x-ue)*X,ye+(De.y-ye)*X,ge+(De.z-ge)*X),pe>=1&&(fe.rotation.copy(De),ht="waggle",Re=0,Ze=null)}}})(re),(function(de){if(!Pn||!fe)return;ne+=de;const te=Math.min(ne/.3,1);fe.rotation.set(Ae.x+.5*te,Ae.y,Ae.z+1.5*te),Vn&&(fe.position.z=Vn.z*(1-.8*te)),te>=1&&(Pn=!1)})(re),(function(de){if(!Ci||!zt||!L)return;Zn+=de;const te=Math.min(Zn/tn,1),pe=L.anchors.get("SYB_Anchor_Mound"),X=pe?.position.clone()??new M(0,14,.3);if(te<.15)zt.visible=!1,zt.position.set(X.x,X.y,X.z+.5);else if(te<.55){const ue=(te-.15)/.4,ye=ue*ue;zt.visible=!1,zt.position.set(X.x,X.y+.3*ye,X.z+.5+.8*ye)}else if(te<.75){const ue=(te-.55)/.2,ye=1-Math.pow(1-ue,2);zt.visible=!0,zt.position.set(X.x,X.y-1.4*ye,X.z+1.3-.2*ye)}else zt.visible=!0,zt.position.set(X.x,X.y-1.4,X.z+1.1);te>=1&&(v.remove(zt),Z.release(zt),zt=null,Ci=!1)})(re),(function(de){Ge&&ie&&(qe+=de,ie.position.x+=we.x*de,ie.position.y+=we.y*de,ie.position.z+=we.z*de,we.z-=15*de,ie.rotation.x+=18*de,ie.rotation.z+=10*de,(qe>1.5||ie.position.z<-1)&&(v.remove(ie),Z.release(ie),ie=null,Ge=!1))})(re),Ft&&cn&&(function(te,pe){const X=te._edgesMat,ue=te._fillMat;return!X||!ue||(X.opacity=Math.max(0,X.opacity-1.5*pe),ue.opacity=Math.max(0,ue.opacity-.2*pe),X.opacity<=0&&(te.visible=!1,!0))})(cn,re)&&(Ft=!1),C==="ready"&&it?.updatePitcherIdle(re),fe&&!Se&&!Pn&&(C==="ready"||C==="pitching")&&ht==="waggle")if(C==="pitching"&&F?.active&&!j?.swingTriggered)ht="loading",Re=0;else{let de=.004,te=.03;b.strikes===2?(de=.007,te=.05):b.balls===3&&b.strikes===2?(de=.008,te=.06):b.balls>=3&&b.strikes<2&&(de=.003,te=.02);const pe=Math.sin(performance.now()*de)*te;fe.rotation.z=De.z+pe}switch(C){case"pitching":F?.active?(F.update(re),j?.swingTriggered&&!j.contactProcessed&&(performance.now()-j.swingStartTime)/1e3>=.15&&(j.contactProcessed=!0,Er())):F&&!F.active&&(j?.swingTriggered&&!j.contactProcessed?(j.contactProcessed=!0,Er()):(F.stop(),C==="pitching"&&(k=ns,hn("result"))));break;case"fielding":J&&H?(function(de){if(!H||!J)return;he+=de;const te=Math.min(he/J.flightDuration,1),pe=J.flightPositions,X=te*(J.flightSampleCount-1),ue=Math.floor(X),ye=Math.min(ue+1,J.flightSampleCount-1),ge=X-ue;H.position.set(pe[3*ue]+(pe[3*ye]-pe[3*ue])*ge,pe[3*ue+1]+(pe[3*ye+1]-pe[3*ue+1])*ge,pe[3*ue+2]+(pe[3*ye+2]-pe[3*ue+2])*ge),Y&&J.launchAngle<10&&ue!==ee&&(H.position.z<.08&&ee>0&&Y.spawnDirtKick(H.position),ee=ue),J.launchAngle<10?(H.rotation.x+=20*de,H.rotation.z+=3*de):(H.rotation.x+=12*de,H.rotation.z+=6*de),Y?.updateBallShadow(H.position),ms.copy(H.position).sub(gs);const be=ms.length()/Math.max(de,.001);if(be>.5){const ze=Math.min(1+.012*be,1.35),Ne=1/Math.sqrt(ze);H.scale.set(Ne,Ne,ze);const We=H.position.clone().add(ms.normalize());H.lookAt(We)}else H.scale.set(1,1,1);gs.copy(H.position),Y?.updateTrail(H.position);const _e=J.launchAngle<10;y.followBall(H.position,_e),te>=1&&(ee=-1,le(),me())})(re):J&&!H&&(k+=re,k>=.8&&(me(),k=0));break;case"result":if(k-=re,k<=0)if(fx(b)==="gameOver"){hn("gameOver"),y.stopOrbit(),y.stopFollow(),y.stopHRCelebration(),y.stopSlowMo();const de=L?.anchors.get("SYB_Anchor_Home"),te=de?.position.clone()??new M(0,0,0);y.startGameOverSweep(te),h?.(b)}else{Pe=b,b={...Pe,strikes:0,balls:0},c?.(b),Ln(),it?.resetBatter(!0),it?.resetCatcher(),it?.standInfielders(),y.stopOrbit(),y.stopFollow(),y.stopHRCelebration(),y.stopSlowMo(),fe&&(Pn=!1,ne=0,ht="waggle",Re=0,Ze=null,fe.rotation.copy(De),Vn&&(fe.position.copy(Vn),Vn=null));const de=L?.anchors.get("SYB_Anchor_Batter"),te=de?.position.clone()??new M(-.5,-.3,.05);y.batterIntro(te),b.outs===2&&N?.playTwoOutTension(),hn("ready")}}var Pe}function Qe(re){if(!U)return;const Pe=Math.min((re-O)/1e3,.1);O=re,fs>0?(fs-=Pe,y.update(Pe)):Je(Pe),Q?Q.render(Pe):x.render(v,y.threeCamera),requestAnimationFrame(Qe)}const nt={async start(){(function(){const de=new Z0(16773344,.5);v.add(de);const te=new Rc(16771264,1.4);K=te,te.position.set(25,-15,35),te.castShadow=!0,te.shadow.mapSize.width=4096,te.shadow.mapSize.height=4096,te.shadow.camera.left=-70,te.shadow.camera.right=70,te.shadow.camera.top=80,te.shadow.camera.bottom=-20,te.shadow.camera.near=.5,te.shadow.camera.far=200,te.shadow.bias=-5e-4,v.add(te);const pe=new Rc(12638463,.25);pe.position.set(-15,10,8),v.add(pe);const X=new X0(6982320,2976286,.45);v.add(X)})(),N=new hx,await N.unlock(),N.startAmbient();const re=t??Cc("/assets/sandlot_field.glb");try{const de=await Yv(re);v.add(de.scene),L=de.index,Kv(L).valid,(function(X){const ue=new ln(200,32,32),ye=document.createElement("canvas");ye.width=1,ye.height=256;const ge=ye.getContext("2d"),be=ge.createLinearGradient(0,0,0,256);be.addColorStop(0,"#1a2a4a"),be.addColorStop(.4,"#3a5a8a"),be.addColorStop(.7,"#c89040"),be.addColorStop(1,"#f0c060"),ge.fillStyle=be,ge.fillRect(0,0,1,256);const _e=new vi(ye),ze=new Rn({map:_e,side:uc,fog:!1}),Ne=new ce(ue,ze);X.add(Ne)})(v),(function(X,ue){const ye=ue.anchors.get(Ye.MOUND),ge=Xu();ye?ge.position.copy(ye.position):ge.position.set(0,20,.15),X.add(ge),ue.nodes.set(ge.name,ge);const be=ue.anchors.get(Ye.BATTER),_e=Wu();be?(_e.position.copy(be.position),_e.position.z+=.6):_e.position.set(.6,-.5,.6),X.add(_e),ue.nodes.set(_e.name,_e)})(v,L),(function(X,ue){const ye=ue.nodes.get("Wall_Segment_5"),ge=ye?Math.sqrt(ye.position.x**2+ye.position.y**2):65,be=[];X.traverse(Be=>{Be.name&&Be.name.startsWith("Wall_Segment_")&&Be.isMesh&&be.push(Be)}),be.forEach(Be=>{Be.parent?.remove(Be),Be.geometry&&Be.geometry.dispose()});const _e=48,ze=Math.PI/4,Ne=3*Math.PI/4,We=Ne-ze,je=ge-.6,mt=[],Tt=[],Bt=[];for(let Be=0;Be<=_e;Be++){const ke=ze+Be/_e*We,Oe=Math.cos(ke),ot=Math.sin(ke);mt.push(ge*Oe,ge*ot,0),Tt.push(-Oe,-ot,0),mt.push(ge*Oe,ge*ot,3),Tt.push(-Oe,-ot,0),mt.push(je*Oe,je*ot,0),Tt.push(Oe,ot,0),mt.push(je*Oe,je*ot,3),Tt.push(Oe,ot,0)}for(let Be=0;Be<_e;Be++){const ke=4*Be,Oe=4*(Be+1);Bt.push(ke,Oe,Oe+1,ke,Oe+1,ke+1),Bt.push(ke+2,ke+3,Oe+3,ke+2,Oe+3,Oe+2),Bt.push(ke+1,Oe+1,Oe+3,ke+1,Oe+3,ke+3)}const At=new rt;At.setIndex(Bt),At.setAttribute("position",new dt(mt,3)),At.setAttribute("normal",new dt(Tt,3)),At.computeVertexNormals(),At.computeBoundingSphere();const Nt=new Ie({color:1722906,roughness:.8,side:ti}),Mt=new ce(At,Nt);Mt.name="SYB_OutfieldWall",Mt.castShadow=!0,Mt.receiveShadow=!0,X.add(Mt),ue.nodes.set(Mt.name,Mt);const Lt=[],vt=[];for(let Be=0;Be<=_e;Be++){const ke=ze+Be/_e*We,Oe=Math.cos(ke),ot=Math.sin(ke);Lt.push(ge*Oe,ge*ot,3),Lt.push(ge*Oe,ge*ot,3.2),Lt.push(je*Oe,je*ot,3),Lt.push(je*Oe,je*ot,3.2)}for(let Be=0;Be<_e;Be++){const ke=4*Be,Oe=4*(Be+1);vt.push(ke,Oe,Oe+1,ke,Oe+1,ke+1),vt.push(ke+2,ke+3,Oe+3,ke+2,Oe+3,Oe+2),vt.push(ke+1,Oe+1,Oe+3,ke+1,Oe+3,ke+3)}const Xe=new rt;Xe.setIndex(vt),Xe.setAttribute("position",new dt(Lt,3)),Xe.computeVertexNormals(),Xe.computeBoundingSphere();const Ht=new Ie({color:994831,roughness:.7,side:ti});X.add(new ce(Xe,Ht));const Et=new Ie({color:16766720,metalness:.3,roughness:.5}),kt=new kn(.08,.08,10,8),$t=ge*Math.cos(ze),ut=ge*Math.sin(ze),un=ge*Math.cos(Ne),pt=ge*Math.sin(Ne),gt=new ce(kt,Et);gt.position.set($t,ut,5),gt.castShadow=!0,X.add(gt);const It=new ce(kt,Et);It.position.set(un,pt,5),It.castShadow=!0,X.add(It);for(let Be=0;Be<20;Be++){const ke=ze+(Be+.5)/20*We,Oe=ue.nodes.get(`Wall_Segment_${Be}`);if(Oe)Oe.position.set(ge*Math.cos(ke),ge*Math.sin(ke),1.5);else{const ot=new yt;ot.name=`Wall_Segment_${Be}`,ot.position.set(ge*Math.cos(ke),ge*Math.sin(ke),1.5),X.add(ot),ue.nodes.set(ot.name,ot)}}})(v,L),(function(X,ue){const ye=ue.anchors.get("SYB_Anchor_Home"),ge=ye?.position.clone()??new M(0,0,0),be=ue.anchors.get("SYB_Anchor_Mound"),_e=be?.position.clone()??new M(0,14,0),ze=ue.anchors.get("SYB_Anchor_1B"),Ne=ue.anchors.get("SYB_Anchor_2B"),We=ue.anchors.get("SYB_Anchor_3B"),je=[ge,ze?.position.clone()??new M(12.9381,12.9381,0),Ne?.position.clone()??new M(0,25.8762,0),We?.position.clone()??new M(-12.9381,12.9381,0)],mt=new Ie({color:12887412,roughness:.95});for(let It=0;It<4;It++){const Be=je[It],ke=je[(It+1)%4],Oe=ke.x-Be.x,ot=ke.y-Be.y,xn=Math.sqrt(Oe*Oe+ot*ot),wt=Math.atan2(ot,Oe),_n=(Be.x+ke.x)/2,Pi=(Be.y+ke.y)/2,Sn=new Ke(xn,1.2,.02),Gt=new ce(Sn,mt);Gt.position.set(_n,Pi,.012),Gt.rotation.z=wt,Gt.receiveShadow=!0,X.add(Gt)}const Tt=new kn(1.5,2.5,.4,24),Bt=new Ie({color:12887933,roughness:.9}),At=new ce(Tt,Bt);At.position.set(_e.x,_e.y,.2),At.castShadow=!0,X.add(At);const Nt=new Ke(.61,.03,.15),Mt=new Ie({color:16777215,roughness:.4}),Lt=new ce(Nt,Mt);Lt.position.set(_e.x,_e.y,.42),X.add(Lt);const vt=new Ie({color:16777215}),Xe=new Ke(.08,.01,80),Ht=new ce(Xe,vt);Ht.position.set(-20,30,.01),Ht.rotation.y=Math.PI/4,X.add(Ht);const Et=new ce(Xe,vt);Et.position.set(20,30,.01),Et.rotation.y=-Math.PI/4,X.add(Et);const kt=new Ie({color:16777215,roughness:.5});function $t(It){const Be=new Ke(.04,.01,1.8),ke=new Ke(1.2,.01,.04),Oe=new ce(Be,kt);Oe.position.set(ge.x+It-.6,ge.y-.1,.005),X.add(Oe);const ot=new ce(Be,kt);ot.position.set(ge.x+It+.6,ge.y-.1,.005),X.add(ot);const xn=new ce(ke,kt);xn.position.set(ge.x+It,ge.y-.1,.905),X.add(xn);const wt=new ce(ke,kt);wt.position.set(ge.x+It,ge.y-.1,-.895),X.add(wt)}$t(-.9),$t(.9);const ut=new tr(.8,.85,24),un=new Ie({color:16777215,roughness:.5,side:ti}),pt=new ce(ut,un);pt.rotation.x=-Math.PI/2,pt.position.set(ge.x+5,ge.y-4,.015),X.add(pt);const gt=new ce(ut,un);gt.rotation.x=-Math.PI/2,gt.position.set(ge.x-5,ge.y-4,.015),X.add(gt)})(v,L),(function(X,ue){const ye=ue.nodes.get("Wall_Segment_5"),ge=ye?Math.sqrt(ye.position.x**2+ye.position.y**2):65,be=Math.PI/4,_e=3*Math.PI/4,ze=new tr(ge-15,ge-2,64,1,.35*-Math.PI,.7*Math.PI),Ne=new Ie({color:12096874,roughness:.95}),We=new ce(ze,Ne);We.rotation.x=-Math.PI/2,We.rotation.z=Math.PI/2+.35*Math.PI/2,We.position.set(0,45,.015),We.receiveShadow=!0,X.add(We);const je=ge*Math.cos(be),mt=ge*Math.sin(be),Tt=ge*Math.cos(_e),Bt=ge*Math.sin(_e);function At(wt,_n,Pi,Sn){const Gt=document.createElement("canvas");Gt.width=64,Gt.height=32;const In=Gt.getContext("2d");In.fillStyle="#FFD700",In.font="bold 22px monospace",In.textAlign="center",In.textBaseline="middle",In.fillText(wt,32,16);const Li=new vi(Gt),Ii=new bc({map:Li}),Rr=new du(Ii);Rr.position.set(_n,Pi,Sn),Rr.scale.set(2.5,1.25,1),X.add(Rr)}At("330",je,mt,3.8),At("400",0,ge,3.8),At("330",Tt,Bt,3.8);const Nt=document.createElement("canvas");Nt.width=256,Nt.height=256;const Mt=Nt.getContext("2d");for(let wt=0;wt<8;wt++)Mt.fillStyle=wt%2==0?"#2d6a1e":"#247518",Mt.fillRect(0,32*wt,256,32);const Lt=new vi(Nt);Lt.wrapS=On,Lt.wrapT=On,Lt.repeat.set(5,5);const vt=new Ie({map:Lt,roughness:.75,metalness:.02}),Xe=new yi(100,60),Ht=new ce(Xe,vt);Ht.rotation.x=-Math.PI/2,Ht.position.set(0,35,.02),Ht.receiveShadow=!0,X.add(Ht);const Et=new Ie({color:5592422,roughness:.85}),kt=new Ke(30,1,3);for(let wt=0;wt<5;wt++){const _n=new ce(kt,Et);_n.position.set(0,-4-2.5*wt,.5+1.8*wt),_n.receiveShadow=!0,X.add(_n)}const $t=[13382451,3368652,13421619,3381555,13395507];for(let wt=0;wt<5;wt++)for(let _n=0;_n<12;_n++){const Pi=new Ke(.6,.8,.4),Sn=new Ie({color:$t[(12*wt+_n)%$t.length],roughness:.9}),Gt=new ce(Pi,Sn);Gt.position.set(1.4*_n-8+.3*(Math.random()-.5),-4-2.5*wt+.5,1+1.8*wt),X.add(Gt)}const ut=new Ke(32,12,.5),un=new ce(ut,Et);un.position.set(0,-16,5),X.add(un);const pt=new Ie({color:2763312,roughness:.9}),gt=new Ke(8,2,2.5),It=new Ke(9,2.5,.15),Be=new Ie({color:4473936,roughness:.7}),ke=new ce(gt,pt);ke.position.set(15,-3,1),ke.rotation.y=-.2,X.add(ke);const Oe=new ce(It,Be);Oe.position.set(15,-3,2.4),Oe.rotation.y=-.2,X.add(Oe);const ot=new ce(gt,pt);ot.position.set(-15,-3,1),ot.rotation.y=.2,X.add(ot);const xn=new ce(It,Be);xn.position.set(-15,-3,2.4),xn.rotation.y=.2,X.add(xn)})(v,L);const te=r?.team.primaryColor?parseInt(r.team.primaryColor.replace("#",""),16):void 0;it=new td(v,L,te,X=>{Y?.spawnBaseDust(X)}),D=(function(X){const ue=X.anchors.get(Ye.HOME),ye=ue?.position??new M(0,0,0),ge=X.nodes.get("Wall_Segment_5");if(ge){const _e=ge.position.y-ye.y,ze=ge.position.x-ye.x;return Math.sqrt(ze*ze+_e*_e)}let be=65;for(let _e=0;_e<=19;_e++){const ze=X.nodes.get(`Wall_Segment_${_e}`);if(ze){const Ne=ze.position.y-ye.y,We=ze.position.x-ye.x,je=Math.sqrt(We*We+Ne*Ne);je>be&&(be=je)}}return be})(L);const pe=L.nodes.get("Wall_Segment_5");(function(X,ue,ye){const ge=new Ke(12,6,.3),be=new Ie({color:1718810,roughness:.8}),_e=new ce(ge,be);_e.name="SYB_Scoreboard",_e.position.set(0,ye+4,5),_e.castShadow=!0,X.add(_e),ue.nodes.set(_e.name,_e);const ze=document.createElement("canvas");ze.width=512,ze.height=256;const Ne=ze.getContext("2d");Ne.fillStyle="#0a1a0a",Ne.fillRect(0,0,512,256),Ne.fillStyle="#FFD700",Ne.font="bold 36px monospace",Ne.textAlign="center",Ne.fillText("SANDLOT SLUGGERS",256,60),Ne.fillStyle="#BF5700",Ne.font="20px monospace",Ne.fillText("BLAZE SPORTS INTEL",256,100),Ne.fillStyle="#33cc33",Ne.font="bold 48px monospace",Ne.fillText("PLAY BALL!",256,180);const We=new vi(ze),je=new ce(new yi(11.5,5.5),new Ie({map:We,roughness:.5}));je.position.set(0,ye+4,5.16),X.add(je),ue.nodes.set("SYB_ScoreboardCanvas",je),je._canvas=ze,je._texture=We})(v,L,pe?.position.y??87),y.bindIndex(L)}catch{L=(function(te){const pe=new Map,X=new Map,ue=new Map,ye=new Map,ge=new ln(200,32,32),be=document.createElement("canvas");be.width=1,be.height=256;const _e=be.getContext("2d"),ze=_e.createLinearGradient(0,0,0,256);ze.addColorStop(0,"#1a2a4a"),ze.addColorStop(.4,"#3a5a8a"),ze.addColorStop(.7,"#c89040"),ze.addColorStop(1,"#f0c060"),_e.fillStyle=ze,_e.fillRect(0,0,1,256);const Ne=new vi(be),We=new Rn({map:Ne,side:uc,fog:!1}),je=new ce(ge,We);te.add(je);const mt=new yi(150,150),Tt=new Ie({color:2976286,roughness:.75,metalness:.02}),Bt=new ce(mt,Tt);Bt.rotation.x=-Math.PI/2,Bt.receiveShadow=!0,te.add(Bt);const At=new rt,Nt=new Float32Array(600);for(let Le=0;Le<200;Le++)Nt[3*Le]=2*(Math.random()-.5),Nt[3*Le+1]=.5*Math.random(),Nt[3*Le+2]=2*(Math.random()-.5);At.setAttribute("position",new st(Nt,3));const Mt=new Qt({color:12887933,size:.02,transparent:!0,opacity:.4}),Lt=new an(At,Mt);Lt.name="SYB_DustParticles",te.add(Lt);const vt=document.createElement("canvas");vt.width=128,vt.height=128;const Xe=vt.getContext("2d");Xe.fillStyle="#c4a77d",Xe.fillRect(0,0,128,128);for(let Le=0;Le<800;Le++){const Fe=128*Math.random(),Ce=128*Math.random(),ft=Math.random()>.5?"rgba(180,140,100,0.3)":"rgba(210,180,140,0.2)";Xe.fillStyle=ft,Xe.fillRect(Fe,Ce,2,2)}const Ht=new vi(vt);Ht.wrapS=On,Ht.wrapT=On,Ht.repeat.set(3,3);const Et=new Xc(25,48),kt=new Ie({map:Ht,color:12887933,roughness:.95}),$t=new ce(Et,kt);$t.rotation.x=-Math.PI/2,$t.position.y=.01,te.add($t);const ut=new Rt;ut.name=Kc,te.add(ut),pe.set(ut.name,ut);const un=18.3,pt=14;function gt(Le,Fe){const Ce=new yt;return Ce.name=Le,Ce.position.copy(Fe),ut.add(Ce),pe.set(Le,Ce),ue.set(Le,Ce),Ce}function It(Le,Fe){const Ce=gt(Le,Fe),ft=new Ke(.38,.03,.38),Yt=new Ie({color:16777215,roughness:.4,metalness:0}),nn=new ce(ft,Yt);return nn.rotation.y=Math.PI/4,nn.castShadow=!0,Ce.add(nn),Ce}(function(){const Le=gt(Ye.HOME,new M(0,0,0)),Fe=new pp,Ce=.215,ft=.215;Fe.moveTo(-Ce,0),Fe.lineTo(-Ce,ft),Fe.lineTo(0,ft+.12),Fe.lineTo(Ce,ft),Fe.lineTo(Ce,0),Fe.lineTo(-Ce,0);const Yt=new qc(Fe,{depth:.02,bevelEnabled:!1}),nn=new Ie({color:16777215,roughness:.3}),Qn=new ce(Yt,nn);Qn.rotation.x=-Math.PI/2,Qn.position.y=-.12,Le.add(Qn)})(),It(Ye.FIRST_BASE,new M(12.9381,12.9381,0)),It(Ye.SECOND_BASE,new M(0,25.8762,0)),It(Ye.THIRD_BASE,new M(-12.9381,12.9381,0));const Be=new Ie({color:12887412,roughness:.95}),ke=[new M(0,0,0),new M(12.9381,12.9381,0),new M(0,25.8762,0),new M(-12.9381,12.9381,0)];for(let Le=0;Le<4;Le++){const Fe=ke[Le],Ce=ke[(Le+1)%4],ft=Ce.x-Fe.x,Yt=Ce.y-Fe.y,nn=Math.sqrt(ft*ft+Yt*Yt),Qn=Math.atan2(Yt,ft),fl=(Fe.x+Ce.x)/2,Or=(Fe.y+Ce.y)/2,rf=new Ke(nn,1.2,.02),La=new ce(rf,Be);La.position.set(fl,Or,.012),La.rotation.z=Qn,La.receiveShadow=!0,te.add(La)}const Oe=new kn(1.5,2.5,.4,24),ot=new Ie({color:12887933,roughness:.9}),xn=new ce(Oe,ot);xn.position.set(0,pt,.2),xn.castShadow=!0,te.add(xn);const wt=new Ke(.61,.03,.15),_n=new Ie({color:16777215,roughness:.4}),Pi=new ce(wt,_n);Pi.position.set(0,pt,.42),te.add(Pi),gt(Ye.MOUND,new M(0,pt,.45)),gt(Ye.BATTER,new M(.6,-.5,0)),gt(Ye.CATCHER,new M(0,-1.5,.3)),gt(Ye.FIRST_BASEMAN,new M(.9*un,9.15,0)),gt(Ye.SECOND_BASEMAN,new M(5.49,1.1*un,0)),gt(Ye.SHORTSTOP,new M(-5.49,1.1*un,0)),gt(Ye.THIRD_BASEMAN,new M(.9*-18.3,9.15,0)),gt(Ye.LEFT_FIELD,new M(-36,48,0)),gt(Ye.CENTER_FIELD,new M(0,60,0)),gt(Ye.RIGHT_FIELD,new M(36,48,0));const Sn=new yt;Sn.name=Ic.STRIKE_ZONE,Sn.position.set(0,0,.8),ut.add(Sn),pe.set(Sn.name,Sn),ye.set(Sn.name,Sn);const Gt=new yt;Gt.name=Ic.MOUND,Gt.position.set(0,pt,1.2),ut.add(Gt),pe.set(Gt.name,Gt),ye.set(Gt.name,Gt);const In=new yt;In.name=or.BEHIND_BATTER,In.position.set(0,-3,1.8),In.lookAt(0,pt,.8),ut.add(In),pe.set(In.name,In);const Li=new yt;Li.name=or.STRIKE_ZONE_HIGH,Li.position.set(0,-2,2.5),Li.lookAt(0,0,.8),ut.add(Li),pe.set(Li.name,Li);const Ii=new yt;Ii.name=or.ISOMETRIC,Ii.position.set(25,-25,20),Ii.lookAt(0,15,0),ut.add(Ii),pe.set(Ii.name,Ii);const Rr=new tr(50,55,64,1,.35*-Math.PI,.7*Math.PI),Yp=new Ie({color:12096874,roughness:.95}),Cr=new ce(Rr,Yp);Cr.rotation.x=-Math.PI/2,Cr.rotation.z=Math.PI/2+.35*Math.PI/2,Cr.position.set(0,45,.015),Cr.receiveShadow=!0,te.add(Cr);const dn=65,ys=48,bs=Math.PI/4,tl=3*Math.PI/4,nl=tl-bs,Ni=64.4,Pr=[],Lr=[],Sa=[];for(let Le=0;Le<=ys;Le++){const Fe=bs+Le/ys*nl,Ce=Math.cos(Fe),ft=Math.sin(Fe);Pr.push(dn*Ce,dn*ft,0),Lr.push(-Ce,-ft,0),Pr.push(dn*Ce,dn*ft,3),Lr.push(-Ce,-ft,0),Pr.push(Ni*Ce,Ni*ft,0),Lr.push(Ce,ft,0),Pr.push(Ni*Ce,Ni*ft,3),Lr.push(Ce,ft,0)}for(let Le=0;Le<ys;Le++){const Fe=4*Le,Ce=4*(Le+1);Sa.push(Fe+0,Ce+0,Ce+1,Fe+0,Ce+1,Fe+1),Sa.push(Fe+2,Fe+3,Ce+3,Fe+2,Ce+3,Ce+2),Sa.push(Fe+1,Ce+1,Ce+3,Fe+1,Ce+3,Fe+3)}const Ms=new rt;Ms.setIndex(Sa),Ms.setAttribute("position",new dt(Pr,3)),Ms.setAttribute("normal",new dt(Lr,3)),Ms.computeVertexNormals(),Ms.computeBoundingSphere();const Kp=new Ie({color:1722906,roughness:.8,side:ti}),Ss=new ce(Ms,Kp);Ss.name="SYB_OutfieldWall",Ss.castShadow=!0,Ss.receiveShadow=!0,te.add(Ss),pe.set(Ss.name,Ss);const Ir=[],wa=[];for(let Le=0;Le<=ys;Le++){const Fe=bs+Le/ys*nl,Ce=Math.cos(Fe),ft=Math.sin(Fe);Ir.push(dn*Ce,dn*ft,3),Ir.push(dn*Ce,dn*ft,3.2),Ir.push(Ni*Ce,Ni*ft,3),Ir.push(Ni*Ce,Ni*ft,3.2)}for(let Le=0;Le<ys;Le++){const Fe=4*Le,Ce=4*(Le+1);wa.push(Fe,Ce,Ce+1,Fe,Ce+1,Fe+1),wa.push(Fe+2,Fe+3,Ce+3,Fe+2,Ce+3,Ce+2),wa.push(Fe+1,Ce+1,Ce+3,Fe+1,Ce+3,Fe+3)}const Nr=new rt;Nr.setIndex(wa),Nr.setAttribute("position",new dt(Ir,3)),Nr.computeVertexNormals(),Nr.computeBoundingSphere();const Zp=new Ie({color:994831,roughness:.7,side:ti});te.add(new ce(Nr,Zp));for(let Le=0;Le<20;Le++){const Fe=bs+(Le+.5)/20*nl,Ce=new yt;Ce.name=`Wall_Segment_${Le}`,Ce.position.set(dn*Math.cos(Fe),dn*Math.sin(Fe),1.5),te.add(Ce),pe.set(Ce.name,Ce)}const eh=new Ie({color:16766720,metalness:.3,roughness:.5}),th=new kn(.08,.08,10,8),nh=dn*Math.cos(bs),ih=dn*Math.sin(bs),sh=dn*Math.cos(tl),rh=dn*Math.sin(tl),il=new ce(th,eh);il.position.set(nh,ih,5),il.castShadow=!0,te.add(il);const sl=new ce(th,eh);function rl(Le,Fe,Ce,ft){const Yt=document.createElement("canvas");Yt.width=64,Yt.height=32;const nn=Yt.getContext("2d");nn.fillStyle="#FFD700",nn.font="bold 22px monospace",nn.textAlign="center",nn.textBaseline="middle",nn.fillText(Le,32,16);const Qn=new vi(Yt),fl=new bc({map:Qn}),Or=new du(fl);Or.position.set(Fe,Ce,ft),Or.scale.set(2.5,1.25,1),te.add(Or)}sl.position.set(sh,rh,5),sl.castShadow=!0,te.add(sl),rl("330",nh,ih,3.8),rl("400",0,dn,3.8),rl("330",sh,rh,3.8);const Ta=Wu();Ta.position.set(.6,-.5,.6),te.add(Ta),pe.set(Ta.name,Ta);const Aa=Xu();Aa.position.set(0,pt,.42),te.add(Aa),pe.set(Aa.name,Aa);const Jp=new Ke(12,6,.3),Qp=new Ie({color:1718810,roughness:.8}),ws=new ce(Jp,Qp);ws.name="SYB_Scoreboard",ws.position.set(0,69,5),ws.castShadow=!0,te.add(ws),pe.set(ws.name,ws);const Dr=document.createElement("canvas");Dr.width=512,Dr.height=256;const Nn=Dr.getContext("2d");Nn.fillStyle="#0a1a0a",Nn.fillRect(0,0,512,256),Nn.fillStyle="#FFD700",Nn.font="bold 36px monospace",Nn.textAlign="center",Nn.fillText("SANDLOT SLUGGERS",256,60),Nn.fillStyle="#BF5700",Nn.font="20px monospace",Nn.fillText("BLAZE SPORTS INTEL",256,100),Nn.fillStyle="#33cc33",Nn.font="bold 48px monospace",Nn.fillText("PLAY BALL!",256,180);const ah=new vi(Dr),Ur=new ce(new yi(11.5,5.5),new Ie({map:ah,roughness:.5}));Ur.position.set(0,69,5.16),te.add(Ur);const oh=new Ie({color:16777215}),lh=new Ke(.08,.01,80),al=new ce(lh,oh);al.position.set(-20,30,.01),al.rotation.y=Math.PI/4,te.add(al);const ol=new ce(lh,oh);ol.position.set(20,30,.01),ol.rotation.y=-Math.PI/4,te.add(ol);const Ea=new Ie({color:16777215,roughness:.5});function ch(Le){const Fe=new Ke(.04,.01,1.8),Ce=new Ke(1.2,.01,.04),ft=new ce(Fe,Ea);ft.position.set(Le-.6,-.1,.005),te.add(ft);const Yt=new ce(Fe,Ea);Yt.position.set(Le+.6,-.1,.005),te.add(Yt);const nn=new ce(Ce,Ea);nn.position.set(Le,-.1,.905),te.add(nn);const Qn=new ce(Ce,Ea);Qn.position.set(Le,-.1,-.895),te.add(Qn)}ch(-.9),ch(.9);const hh=new tr(.8,.85,24),uh=new Ie({color:16777215,roughness:.5,side:ti}),ll=new ce(hh,uh);ll.rotation.x=-Math.PI/2,ll.position.set(5,-4,.015),te.add(ll);const cl=new ce(hh,uh);cl.rotation.x=-Math.PI/2,cl.position.set(-5,-4,.015),te.add(cl);const dh=new Ie({color:5592422,roughness:.85}),ef=new Ke(30,1,3);for(let Le=0;Le<5;Le++){const Fe=new ce(ef,dh);Fe.position.set(0,-4-2.5*Le,.5+1.8*Le),Fe.receiveShadow=!0,te.add(Fe)}const ph=[13382451,3368652,13421619,3381555,13395507];for(let Le=0;Le<5;Le++)for(let Fe=0;Fe<12;Fe++){const Ce=new Ke(.6,.8,.4),ft=new Ie({color:ph[(12*Le+Fe)%ph.length],roughness:.9}),Yt=new ce(Ce,ft);Yt.position.set(1.4*Fe-8+.3*(Math.random()-.5),-4-2.5*Le+.5,1+1.8*Le),te.add(Yt)}const tf=new Ke(32,12,.5),fh=new ce(tf,dh);fh.position.set(0,-16,5),te.add(fh);const mh=new Ie({color:2763312,roughness:.9}),gh=new Ke(8,2,2.5),hl=new ce(gh,mh);hl.position.set(15,-3,1),hl.rotation.y=-.2,te.add(hl);const ul=new ce(gh,mh);ul.position.set(-15,-3,1),ul.rotation.y=.2,te.add(ul);const vh=new Ke(9,2.5,.15),xh=new Ie({color:4473936,roughness:.7}),dl=new ce(vh,xh);dl.position.set(15,-3,2.4),dl.rotation.y=-.2,te.add(dl);const pl=new ce(vh,xh);pl.position.set(-15,-3,2.4),pl.rotation.y=.2,te.add(pl);const Ra=document.createElement("canvas");Ra.width=256,Ra.height=256;const _h=Ra.getContext("2d");for(let Le=0;Le<8;Le++)_h.fillStyle=Le%2==0?"#2d6a1e":"#247518",_h.fillRect(0,32*Le,256,32);const Ca=new vi(Ra);Ca.wrapS=On,Ca.wrapT=On,Ca.repeat.set(5,5);const nf=new Ie({map:Ca,roughness:.75,metalness:.02}),sf=new yi(100,60),Pa=new ce(sf,nf);return Pa.rotation.x=-Math.PI/2,Pa.position.set(0,35,.02),Pa.receiveShadow=!0,te.add(Pa),pe.set("SYB_ScoreboardCanvas",Ur),Ur._canvas=Dr,Ur._texture=ah,{gltf:{scene:ut,scenes:[ut],cameras:[],animations:[],asset:{version:"2.0"},parser:null,userData:{}},root:ut,nodes:pe,cameras:X,anchors:ue,aimTargets:ye}})(v),it=new td(v,L,void 0,te=>{Y?.spawnBaseDust(te)})}r&&L&&(function(de,te){const pe=new Ue(te),X=de.nodes.get("SYB_OutfieldWall");if(X&&X.isMesh){const ue=X.material;ue.isMeshStandardMaterial&&(ue.emissive=pe,ue.emissiveIntensity=.15,ue.needsUpdate=!0)}})(L,r.team.primaryColor),Ln(),Y=new ux(v),Y.startDustMotes(),fe=L.nodes.get("SYB_Bat")??null,cn=(function(de){const te=de.anchors.get("SYB_Anchor_Home"),pe=te?.position.clone()??new M(0,0,0),X=new Rt;X.name="SYB_StrikeZone";const ue=new Ke(.44,.02,.6),ye=new Ko({color:16777215,transparent:!0,opacity:.35,depthTest:!0,depthWrite:!1}),ge=new ap(new b0(ue),ye),be=new yi(.44,.6),_e=new Rn({color:16777215,transparent:!0,opacity:.04,side:ti,depthWrite:!1}),ze=new ce(be,_e);return X.add(ge),X.add(ze),X.position.set(pe.x,pe.y+.3,.8),X.visible=!1,X._edgesMat=ye,X._fillMat=_e,X})(L),v.add(cn),Q=new cv(x),Q.addPass(new hv(v,y.threeCamera));const Pe=new _r(new xe(e.clientWidth,e.clientHeight),.3,.4,.85);Q.addPass(Pe),U=!0,O=performance.now(),hn("ready"),requestAnimationFrame(Qe)},stop(){U=!1,vn&&(clearTimeout(vn),vn=null),F?.stop(),le(),Y?.dispose(),Y=null,it?.dispose(),it=null,G=!0,cn&&(v.remove(cn),cn=null),y.stopOrbit(),y.stopSweep(),y.stopHRCelebration(),y.stopSlowMo(),ie&&(v.remove(ie),Z.release(ie),ie=null,Ge=!1),N?.dispose(),N=null},pause(){U&&!A&&(A=!0,U=!1,Ar(!0))},resume(){A&&(A=!1,U=!0,O=performance.now(),requestAnimationFrame(Qe),C==="ready"&&Jn(Math.max(xs,Math.min(250,g.readyDelayMs))))},isPaused:()=>A,triggerSwing(){C==="pitching"&&j&&!j.swingTriggered&&(j.swingTriggered=!0,j.swingStartTime=performance.now())},startNextPitch(){if(C!=="ready"||!L)return;var re;re=b,b={...re,stats:{...re.stats,pitchCount:re.stats.pitchCount+1}},c?.(b);const Pe=(function(){let Ne;$=1103515245*$+12345>>>0,Ne=b.strikes>=2&&b.balls<3?_s:b.balls>=2&&b.strikes<2?ba:mx;let We=Ne[$%Ne.length];return We===Ki&&Ne.length>1&&($=1103515245*$+12345>>>0,We=Ne[$%Ne.length]),Ki=We,We})();j={swingTriggered:!1,swingStartTime:0,contactProcessed:!1};const de=(function(Ne,We,je,mt=[]){let Tt;if(Tt=We>Ne&&We>=2?[20,35,25,15,5]:Ne>We&&Ne>=2?[55,5,10,10,20]:Ne===3&&We===2?[35,15,20,10,20]:[30,20,20,15,15],mt.length>=1&&(Tt[mt[mt.length-1]]=0),mt.length>=2){const Mt=mt[mt.length-2];Tt[Mt]=Math.floor(.5*Tt[Mt])}const Bt=Tt.reduce((Mt,Lt)=>Mt+Lt,0);if(Bt===0)return xo[0];const At=je%Bt;let Nt=0;for(let Mt=0;Mt<Tt.length;Mt++)if(Nt+=Tt[Mt],At<Nt)return xo[Mt];return xo[0]})(b.balls,b.strikes,$,oe),te=xo.indexOf(de);oe.push(te),oe.length>3&&oe.shift();const pe=Math.floor(de.minMph+7*$%100/100*(de.maxMph-de.minMph)),X=.05*(b.inning-1),ue=Math.min(.02*b.stats.currentStreak,.1),ye=Math.max(.88,1-.002*b.stats.pitchCount),ge=de.speedMultiplier*(1+X+ue)*ye*m,be=Math.round(pe*ye),_e="#"+de.trailColor.toString(16).padStart(6,"0");V=be,q=de.name,p?.(de.name,be,_e),cn&&((function(Ne){{Ne.visible=!0;const We=Ne._edgesMat,je=Ne._fillMat;We&&(We.opacity=.35),je&&(je.opacity=.04)}})(cn),Ft=!1),tn=.4/ye,(function(){if(!L)return;const Ne=L.anchors.get("SYB_Anchor_Mound"),We=Ne?.position.clone()??new M(0,14,.3);zt=Z.acquire(),zt.position.set(We.x,We.y,We.z+.5),zt.visible=!1,v.add(zt),Zn=0,Ci=!0,it?.startPitcherDelivery(tn)})();const ze=Np[Pe];it?.shiftCatcher(ze.x),it?.crouchInfielders(),it?.adjustForSituation(b.balls,b.strikes,b.outs,b.bases),F=ix({index:L,scene:v,lane:Pe,seed:$++,ballPool:Z,speed:ge,breakScale:_,trailColor:de.trailColor,pitchTypeName:de.name,pitchMph:be,onStrikeCross:Ma}),N?.startPitchWhoosh(be),hn("pitching")},getPhase:()=>C,getGameState:()=>b,getLineup:()=>z,resize(re,Pe){x.setSize(re,Pe),y.setAspect(re/Pe)},toggleMute:()=>N?.toggleMute()??!1,setCrowdEnergy(re,Pe,de){N?.setCrowdEnergy(re,Pe,de)},playInningTransition(){N?.playInningTransition()},playBigInning(){N?.playBigInning()},playClutchHit(){N?.playClutchHit()},renderToText:()=>({phase:C,gameState:{mode:b.mode,difficulty:b.difficulty,inning:b.inning,outs:b.outs,strikes:b.strikes,balls:b.balls,bases:b.bases,targetRuns:b.targetRuns,result:b.result,suddenDeath:b.suddenDeath,stats:b.stats},lastPitch:F?{type:q,mph:V}:null}),advanceTime(re){Je(re/1e3)}};return nt}const is="#BF5700",ei="#FFD700",vx=`
  .syb-hud {
    position: absolute;
    inset: 0;
    pointer-events: none;
    font-family: 'Oswald', 'Segoe UI', system-ui, sans-serif;
    z-index: 50;
    user-select: none;
  }

  .syb-hud * {
    pointer-events: none;
  }

  /* ── 1. SCOREBOARD TOP BAR ── */

  .syb-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: 10px 16px;
    gap: 6px;
  }

  .syb-panel {
    background: linear-gradient(180deg, rgba(13, 13, 13, 0.88) 0%, rgba(26, 26, 26, 0.82) 100%);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-top: 2px solid ${is};
    border-radius: 4px;
    padding: 8px 14px;
    position: relative;
  }

  /* Subtle inner light along the top edge */
  .syb-panel::after {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(191, 87, 0, 0.3), transparent);
  }

  /* ── 2. SCORE / RUNS / HITS ── */

  .syb-score {
    font-size: 32px;
    font-weight: 700;
    color: ${ei};
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .syb-score-label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 2px;
  }

  .syb-hits {
    font-size: 20px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .syb-hits-label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 2px;
  }

  .syb-score-group {
    display: flex;
    gap: 16px;
    align-items: flex-end;
  }

  /* Vertical divider between R and H columns */
  .syb-score-divider {
    width: 1px;
    align-self: stretch;
    background: rgba(255, 255, 255, 0.1);
    margin: 2px 0;
  }

  /* ── COUNT DOTS (B/S/O) ── */

  .syb-count {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .syb-count-group {
    text-align: center;
  }

  .syb-count-dots {
    display: flex;
    gap: 5px;
    justify-content: center;
    margin-bottom: 3px;
  }

  .syb-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    transition: background 0.15s, border-color 0.15s, box-shadow 0.2s;
    background: rgba(255, 255, 255, 0.04);
  }

  .syb-dot.active {
    border-color: transparent;
  }

  .syb-dot.strike {
    background: #ff4444;
    border-color: #ff4444;
    box-shadow: 0 0 4px 1px rgba(255, 68, 68, 0.25);
  }

  .syb-dot.strike.flash {
    box-shadow: 0 0 10px 3px rgba(255, 68, 68, 0.7);
  }

  .syb-dot.ball {
    background: #44bb44;
    border-color: #44bb44;
    box-shadow: 0 0 4px 1px rgba(68, 187, 68, 0.25);
  }

  .syb-dot.ball.flash {
    box-shadow: 0 0 10px 3px rgba(68, 187, 68, 0.7);
  }

  .syb-dot.out {
    background: ${is};
    border-color: ${is};
    box-shadow: 0 0 4px 1px rgba(191, 87, 0, 0.25);
  }

  .syb-dot.out.flash {
    box-shadow: 0 0 10px 3px rgba(191, 87, 0, 0.7);
  }

  .syb-count-label {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 600;
  }

  /* Count separator lines between B / S / O */
  .syb-count-sep {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.08);
  }

  /* ── INNING PANEL ── */

  .syb-inning {
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .syb-inning-label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 2px;
  }

  /* ── STREAK ── */

  .syb-streak {
    position: absolute;
    top: 104px;
    right: 16px;
    font-size: 14px;
    font-weight: 700;
    color: ${ei};
    opacity: 0;
    transition: opacity 0.3s, transform 0.2s, font-size 0.2s;
    text-shadow: 0 1px 6px rgba(255, 215, 0, 0.4);
  }

  .syb-streak.visible {
    opacity: 1;
  }

  .syb-streak.hot {
    font-size: 16px;
    color: #ff8c00;
    text-shadow: 0 0 8px rgba(255, 140, 0, 0.6);
    animation: streak-pulse 0.6s ease-in-out infinite;
  }

  .syb-streak.fire {
    font-size: 18px;
    color: #ff4500;
    text-shadow: 0 0 12px rgba(255, 69, 0, 0.7), 0 0 24px rgba(255, 69, 0, 0.3);
    animation: streak-pulse 0.4s ease-in-out infinite;
  }

  @keyframes streak-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  /* ── SWING BUTTON ── */

  .syb-swing-btn {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid ${is};
    background: rgba(191, 87, 0, 0.2);
    color: white;
    font-family: 'Oswald', sans-serif;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    pointer-events: auto !important;
    touch-action: manipulation;
    transition: transform 0.1s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .syb-swing-btn:active {
    transform: translateX(-50%) scale(0.92);
    background: rgba(191, 87, 0, 0.5);
  }

  .syb-phase-hint {
    position: absolute;
    bottom: 124px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    font-family: 'Cormorant Garamond', 'Georgia', serif;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.45);
    text-align: center;
    transition: opacity 0.3s;
    white-space: nowrap;
    letter-spacing: 0.5px;
  }

  /* ── CENTER MESSAGES ── */

  .syb-message {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%) scale(1);
    font-size: 36px;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.2s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    text-align: center;
    white-space: nowrap;
  }

  .syb-message.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  .syb-message.pop {
    transform: translate(-50%, -50%) scale(1.15);
  }

  .syb-message.msg-hr {
    color: ${ei};
    font-size: 44px;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 2px 12px rgba(0, 0, 0, 0.6);
  }

  .syb-message.msg-hit {
    color: #33dd55;
  }

  .syb-message.msg-out {
    color: #ff5555;
  }

  .syb-message.msg-walk {
    color: #55bbff;
  }

  .syb-message.msg-inning {
    font-size: 28px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* ── RUNS SCORED TOAST ── */

  .syb-runs-toast {
    position: absolute;
    top: 38%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 20px;
    font-weight: 700;
    color: ${ei};
    text-shadow: 0 0 12px rgba(255, 215, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.25s, transform 0.3s;
    pointer-events: none;
    letter-spacing: 2px;
  }

  .syb-runs-toast.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(-6px);
  }

  /* v2: Team color accent on panels */
  .syb-panel.team-accent {
    border-top-color: var(--syb-team-color, ${is});
  }

  /* v2: Team logo in score panel */
  .syb-team-logo {
    width: 22px;
    height: 22px;
    object-fit: contain;
    margin-right: 8px;
    vertical-align: middle;
    display: none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
  }

  .syb-team-logo.visible {
    display: inline-block;
  }

  /* v2: Batter info strip */
  .syb-batter-strip {
    position: absolute;
    top: 62px;
    left: 16px;
    right: 16px;
    text-align: center;
    font-family: 'Cormorant Garamond', 'Georgia', serif;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.5px;
    opacity: 0;
    transition: opacity 0.4s;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  }

  .syb-batter-strip.visible {
    opacity: 1;
  }

  .syb-batter-name {
    color: ${ei};
    font-family: 'Oswald', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 1px;
  }

  .syb-batter-stat {
    font-family: 'JetBrains Mono', monospace;
    color: rgba(255, 255, 255, 0.45);
    font-size: 10px;
    letter-spacing: 0.5px;
  }

  /* v2: Base runner diamond */
  .syb-diamond {
    position: absolute;
    top: 62px;
    right: 16px;
    width: 36px;
    height: 36px;
  }

  .syb-base {
    position: absolute;
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    transition: background 0.2s, border-color 0.2s;
  }

  .syb-base.occupied {
    background: ${ei};
    border-color: ${ei};
  }

  .syb-base.just-occupied {
    animation: base-arrive 0.5s ease-out;
  }

  @keyframes base-arrive {
    0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.8); transform: rotate(45deg) scale(1.3); }
    50% { box-shadow: 0 0 10px 4px rgba(255, 215, 0, 0.4); }
    100% { box-shadow: none; transform: rotate(45deg) scale(1); }
  }

  .syb-base-1 { bottom: 4px; right: 0; }
  .syb-base-2 { top: 0; left: 13px; }
  .syb-base-3 { bottom: 4px; left: 0; }

  /* v2: Wider mobile swing zone */
  @media (max-width: 768px) {
    .syb-swing-btn {
      width: 85%;
      max-width: 360px;
      height: 60px;
      border-radius: 12px;
      bottom: 20px;
      font-size: 15px;
      letter-spacing: 2px;
    }
  }

  .syb-swing-btn.pulse {
    animation: swing-pulse 0.8s ease-in-out infinite;
    border-color: ${ei};
    background: rgba(255, 215, 0, 0.15);
  }

  @keyframes swing-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
  }

  /* Desktop: hide swing button, show keyboard hints */
  @media (min-width: 769px) {
    .syb-swing-btn {
      display: none;
    }
  }

  /* Mobile: compact panels */
  @media (max-width: 768px) {
    .syb-score { font-size: 24px; }
    .syb-hits { font-size: 16px; }
    .syb-panel { padding: 6px 10px; }
    .syb-message { font-size: 28px; }
    .syb-phase-hint { bottom: 94px; font-size: 11px; }
    .syb-batter-strip { top: 56px; font-size: 11px; }
  }

  @media (max-width: 400px) {
    .syb-top-bar { padding: 8px 10px; }
    .syb-score { font-size: 20px; }
    .syb-hits { font-size: 14px; }
    .syb-dot { width: 9px; height: 9px; }
    .syb-batter-strip { top: 50px; font-size: 10px; }
  }

  /* Score pop on change */
  .syb-score.score-change {
    animation: score-pop 0.35s ease-out;
  }

  @keyframes score-pop {
    0% { transform: scale(1.35); color: #fff; }
    60% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }

  /* ── 5. INNING TRANSITION BANNER ── */

  .syb-inning-banner {
    position: absolute;
    top: 36%;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(180deg,
      transparent,
      rgba(13, 13, 13, 0.7) 15%,
      rgba(13, 13, 13, 0.85) 50%,
      rgba(13, 13, 13, 0.7) 85%,
      transparent
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    transform: scaleX(0);
    opacity: 0;
    transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s;
    pointer-events: none;
  }

  .syb-inning-banner.active {
    transform: scaleX(1);
    opacity: 1;
  }

  .syb-inning-banner-rule {
    width: 120px;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${is}, transparent);
  }

  .syb-inning-banner-text {
    font-size: 22px;
    font-weight: 700;
    color: ${ei};
    letter-spacing: 8px;
    text-transform: uppercase;
    text-shadow: 0 0 24px rgba(255, 215, 0, 0.4), 0 0 60px rgba(191, 87, 0, 0.15);
    padding: 6px 0;
  }

  /* Out emphasis vignette -- red edges flash on outs */
  .syb-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(255, 50, 50, 0.25) 100%);
    opacity: 0;
    transition: opacity 0.12s ease-in;
    pointer-events: none;
  }

  .syb-vignette.active {
    opacity: 1;
    transition: opacity 0.05s;
  }

  /* Strikeout K stamp -- big dramatic letter */
  .syb-message.msg-strikeout {
    color: #ff4444;
    font-size: 80px;
    font-weight: 900;
    animation: k-stamp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
    text-shadow: 0 0 40px rgba(255, 68, 68, 0.5), 0 4px 20px rgba(0, 0, 0, 0.6);
    letter-spacing: 4px;
  }

  @keyframes k-stamp {
    0% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(0.85); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }

  /* Swinging strikeout -- backward K (mirrored horizontally) */
  .syb-message.msg-strikeout.swinging {
    transform: translate(-50%, -50%) scaleX(-1);
    animation: k-stamp-swing 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  @keyframes k-stamp-swing {
    0% { transform: translate(-50%, -50%) scaleX(-1) scale(3); opacity: 0; }
    50% { transform: translate(-50%, -50%) scaleX(-1) scale(0.85); opacity: 1; }
    100% { transform: translate(-50%, -50%) scaleX(-1) scale(1); opacity: 1; }
  }

  /* ── 4. TIMING TOAST + STAT LINE ── */

  .syb-timing-toast {
    position: absolute;
    top: 52%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    opacity: 0;
    transition: opacity 0.15s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
    padding: 4px 16px;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .syb-timing-toast.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }

  .syb-timing-toast.timing-perfect {
    color: ${ei};
    border-color: rgba(255, 215, 0, 0.3);
    background: rgba(255, 215, 0, 0.12);
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
  }
  .syb-timing-toast.timing-good {
    color: #33dd55;
    border-color: rgba(51, 221, 85, 0.25);
    background: rgba(51, 221, 85, 0.1);
  }
  .syb-timing-toast.timing-early {
    color: #55aaff;
    border-color: rgba(85, 170, 255, 0.2);
    background: rgba(85, 170, 255, 0.08);
  }
  .syb-timing-toast.timing-late {
    color: #ff8c00;
    border-color: rgba(255, 140, 0, 0.25);
    background: rgba(255, 140, 0, 0.1);
  }

  /* Exit velocity / distance stat line */
  .syb-stat-line {
    position: absolute;
    top: 58%;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: 1px;
    opacity: 0;
    transition: opacity 0.25s;
    pointer-events: none;
    white-space: nowrap;
    padding: 2px 10px;
    border-left: 2px solid ${is};
  }

  .syb-stat-line.visible { opacity: 1; }

  /* Character bark speech bubble */
  .syb-bark-toast {
    position: absolute;
    bottom: 32%;
    left: 50%;
    transform: translateX(-50%) scale(0.8);
    font-family: 'Oswald', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #fff;
    background: rgba(26, 26, 26, 0.75);
    border: 1px solid rgba(191, 87, 0, 0.4);
    border-radius: 6px;
    padding: 5px 14px;
    opacity: 0;
    transition: opacity 0.2s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
    white-space: nowrap;
    backdrop-filter: blur(4px);
  }
  .syb-bark-toast.visible {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }

  /* Enhanced timing toast — scale bounce on appear */
  .syb-timing-toast.visible.timing-perfect {
    animation: timing-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes timing-pop {
    0% { transform: translateX(-50%) scale(0.6); }
    60% { transform: translateX(-50%) translateY(-6px) scale(1.15); }
    100% { transform: translateX(-50%) translateY(-4px) scale(1); }
  }

  /* ── 3. TUTORIAL HINT ── */

  .syb-tutorial {
    position: absolute;
    bottom: 160px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Cormorant Garamond', 'Georgia', serif;
    font-size: 16px;
    font-weight: 600;
    font-style: italic;
    color: rgba(255, 255, 255, 0.65);
    text-align: center;
    letter-spacing: 0.5px;
    opacity: 0;
    transition: opacity 0.5s;
    pointer-events: none;
    padding: 6px 20px;
    border-top: 1px solid rgba(191, 87, 0, 0.25);
    border-bottom: 1px solid rgba(191, 87, 0, 0.25);
  }

  .syb-tutorial.visible {
    opacity: 1;
    animation: tutorial-glow 2.5s ease-in-out infinite;
  }

  @keyframes tutorial-glow {
    0%, 100% { text-shadow: 0 0 0 transparent; border-color: rgba(191, 87, 0, 0.25); }
    50% { text-shadow: 0 0 12px rgba(255, 215, 0, 0.3); border-color: rgba(191, 87, 0, 0.45); }
  }

  @media (max-width: 768px) {
    .syb-timing-toast { font-size: 12px; letter-spacing: 3px; padding: 3px 12px; }
    .syb-stat-line { font-size: 10px; }
    .syb-tutorial { bottom: 130px; font-size: 14px; }
  }

  /* Clutch hit -- gold flash for final-inning heroics */
  .syb-message.msg-clutch {
    color: #FFD700;
    font-size: 40px;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 2px 12px rgba(0, 0, 0, 0.6);
    letter-spacing: 3px;
    animation: clutch-flash 0.5s ease-out;
  }

  @keyframes clutch-flash {
    0% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    40% { transform: translate(-50%, -50%) scale(0.9); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }

  /* Extra-base hit / big inning screen flash overlay */
  .syb-hit-flash {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.15s ease-out;
    pointer-events: none;
  }

  .syb-hit-flash.active {
    opacity: 1;
    transition: opacity 0.05s;
  }

  .syb-hit-flash.flash-double {
    background: radial-gradient(ellipse at center, transparent 30%, rgba(51, 221, 85, 0.15) 100%);
  }

  .syb-hit-flash.flash-triple {
    background: radial-gradient(ellipse at center, transparent 25%, rgba(85, 170, 255, 0.2) 100%);
  }

  .syb-hit-flash.flash-big-inning {
    background: radial-gradient(ellipse at center, transparent 20%, rgba(255, 215, 0, 0.2) 100%);
  }

  /* Pitch info toast -- positioned below top bar, left-center */
  .syb-pitch-info {
    position: absolute;
    top: 64px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 1px;
    opacity: 0;
    transition: opacity 0.15s, transform 0.2s;
    pointer-events: none;
    white-space: nowrap;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  }

  .syb-pitch-info.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(-2px);
  }

  .syb-pitch-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .syb-pitch-speed {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 768px) {
    .syb-pitch-info { top: 58px; font-size: 11px; }
  }

  /* Two-strike danger glow on count panel */
  .syb-panel.danger {
    border-top-color: #ff4444;
    box-shadow: 0 0 8px 1px rgba(255, 68, 68, 0.15), inset 0 0 6px rgba(255, 68, 68, 0.06);
    transition: border-color 0.3s, box-shadow 0.3s;
  }

  /* Three-ball hitter's count glow */
  .syb-panel.hitter-count {
    border-top-color: #44bb44;
    box-shadow: 0 0 8px 1px rgba(68, 187, 68, 0.15), inset 0 0 6px rgba(68, 187, 68, 0.06);
    transition: border-color 0.3s, box-shadow 0.3s;
  }
`;function xx(s){if((function(){if(document.querySelector("link[data-syb-font]"))return;const B=document.createElement("link");B.rel="stylesheet",B.href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=JetBrains+Mono:wght@400;700&family=Oswald:wght@400;600;700&display=swap",B.dataset.sybFont="1",document.head.appendChild(B)})(),!document.querySelector("style[data-syb-hud]")){const B=document.createElement("style");B.dataset.sybHud="1",B.textContent=vx,document.head.appendChild(B)}const e=document.createElement("div");e.className="syb-hud";const t=document.createElement("div");t.className="syb-top-bar";const n=document.createElement("div");n.className="syb-panel";const i=document.createElement("img");i.className="syb-team-logo",i.alt="";const r=document.createElement("div");r.className="syb-score-group";const a=document.createElement("div"),o=document.createElement("div");o.className="syb-score",o.textContent="0";const l=document.createElement("div");l.className="syb-score-label",l.textContent="Runs",a.appendChild(o),a.appendChild(l);const c=document.createElement("div"),h=document.createElement("div");h.className="syb-hits",h.textContent="0";const u=document.createElement("div");u.className="syb-hits-label",u.textContent="Hits",c.appendChild(h),c.appendChild(u);const d=document.createElement("div");d.className="syb-score-divider",r.appendChild(a),r.appendChild(d),r.appendChild(c),n.appendChild(i),n.appendChild(r);const p=document.createElement("div");p.className="syb-panel";const f=document.createElement("div");f.className="syb-count";const g=ic("B",4,"ball"),m=ic("S",3,"strike"),_=ic("O",3,"out"),x=document.createElement("div");x.className="syb-count-sep";const v=document.createElement("div");v.className="syb-count-sep",f.appendChild(g.container),f.appendChild(x),f.appendChild(m.container),f.appendChild(v),f.appendChild(_.container),p.appendChild(f);const y=document.createElement("div");y.className="syb-panel";const I=document.createElement("div");I.className="syb-inning",I.textContent="1";const S=document.createElement("div");S.className="syb-inning-label",S.textContent="Inning",y.appendChild(I),y.appendChild(S),t.appendChild(n),t.appendChild(p),t.appendChild(y);const w=document.createElement("div");w.className="syb-streak";const L=document.createElement("button");L.className="syb-swing-btn",L.textContent="SWING",L.addEventListener("touchstart",B=>{B.preventDefault(),s.onSwing()},{passive:!1}),L.addEventListener("click",B=>{B.preventDefault(),s.onSwing()});const b=document.createElement("div");b.className="syb-phase-hint",b.textContent="Tap or press Space";const C=document.createElement("div");C.className="syb-message";const U=document.createElement("div");U.className="syb-runs-toast";const A=document.createElement("div");A.className="syb-batter-strip";const O=document.createElement("div");O.className="syb-target-chip",O.style.cssText="position:absolute;top:94px;left:50%;transform:translateX(-50%);padding:5px 14px;border-radius:999px;border:1px solid rgba(255,215,0,0.22);background:rgba(13,13,13,0.72);backdrop-filter:blur(8px);font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#FFD700;opacity:0;transition:opacity .25s;pointer-events:none;white-space:nowrap;";const F=document.createElement("div");F.className="syb-diamond";const j=document.createElement("div");j.className="syb-base syb-base-1";const J=document.createElement("div");J.className="syb-base syb-base-2";const W=document.createElement("div");W.className="syb-base syb-base-3",F.appendChild(j),F.appendChild(J),F.appendChild(W);const k=document.createElement("div");k.className="syb-inning-banner";const $=document.createElement("div");$.className="syb-inning-banner-rule";const N=document.createElement("div");N.className="syb-inning-banner-text";const Q=document.createElement("div");Q.className="syb-inning-banner-rule",k.appendChild($),k.appendChild(N),k.appendChild(Q);const ve=document.createElement("div");ve.className="syb-vignette";const R=document.createElement("div");R.className="syb-timing-toast";const T=document.createElement("div");T.className="syb-stat-line";const G=document.createElement("div");G.className="syb-tutorial",G.textContent="Press Space or tap to swing";const Z=document.createElement("div");Z.className="syb-hit-flash";const D=document.createElement("div");D.className="syb-pitch-info",e.appendChild(t),e.appendChild(A),e.appendChild(O),e.appendChild(F),e.appendChild(w),e.appendChild(b),e.appendChild(L),e.appendChild(C),e.appendChild(U),e.appendChild(k),e.appendChild(ve),e.appendChild(R),e.appendChild(T),e.appendChild(G),e.appendChild(Z),e.appendChild(D);const K=document.createElement("div");return K.className="syb-bark-toast",e.appendChild(K),s.parent.appendChild(e),f._ballDots=g.dots,f._strikeDots=m.dots,f._outDots=_.dots,{container:e,scoreDisplay:o,scoreLabel:l,countDisplay:f,outsDisplay:_.container,inningDisplay:I,inningLabel:S,streakDisplay:w,swingButton:L,messageOverlay:C,phaseHint:b,batterStrip:A,targetChip:O,teamLogo:i,panels:[n,p,y],bases:[j,J,W],runsToast:U,inningBanner:k,vignette:ve,timingToast:R,statLine:T,tutorialHint:G,hitFlash:Z,pitchInfo:D,hitsDisplay:h,hitsLabel:u,barkToast:K}}function ic(s,e,t){const n=document.createElement("div");n.className="syb-count-group";const i=document.createElement("div");i.className="syb-count-dots";const r=[];for(let o=0;o<e;o++){const l=document.createElement("div");l.className="syb-dot",l.dataset.type=t,i.appendChild(l),r.push(l)}const a=document.createElement("div");return a.className="syb-count-label",a.textContent=s,n.appendChild(i),n.appendChild(a),{container:n,dots:r}}function Zc(s,e,t){const n=e.mode==="hrDerby"?e.stats.homeRuns:e.stats.runs;if(e.mode==="hrDerby"?(s.scoreDisplay.textContent=String(e.stats.homeRuns),s.scoreLabel.textContent="HRs",s.hitsDisplay.textContent=String(e.stats.hits)):(s.scoreDisplay.textContent=String(e.stats.runs),s.scoreLabel.textContent="Runs",s.hitsDisplay.textContent=String(e.stats.hits)),n!==rd&&n>0&&(s.scoreDisplay.classList.remove("score-change"),s.scoreDisplay.offsetWidth,s.scoreDisplay.classList.add("score-change")),rd=n,!Dc){const i=s.countDisplay;sc(i._ballDots,e.balls,"ball"),sc(i._strikeDots,e.strikes,"strike"),sc(i._outDots,e.outs,"out")}e.mode==="hrDerby"?(s.inningDisplay.textContent=`${e.stats.derbyOuts}/${e.maxDerbyOuts}`,s.inningLabel.textContent="Outs"):e.mode==="practice"?(s.inningDisplay.textContent=String(e.stats.pitchCount),s.inningLabel.textContent="Pitches"):(s.inningDisplay.textContent=String(e.inning),s.inningLabel.textContent=e.suddenDeath?"Sudden":"Inning"),s.streakDisplay.classList.remove("visible","hot","fire"),e.stats.currentStreak>=2&&(s.streakDisplay.textContent=`${e.stats.currentStreak}x Streak!`,s.streakDisplay.classList.add("visible"),e.stats.currentStreak>=5?s.streakDisplay.classList.add("fire"):e.stats.currentStreak>=3&&s.streakDisplay.classList.add("hot")),e.mode==="quickPlay"||e.mode==="teamMode"?(s.targetChip.textContent=`Target ${e.targetRuns??0} Runs`,s.targetChip.style.opacity="1"):s.targetChip.style.opacity="0";for(let i=0;i<3;i++){const r=!!e.bases[i];r?(s.bases[i].classList.add("occupied"),sd[i]||(s.bases[i].classList.add("just-occupied"),setTimeout(()=>s.bases[i].classList.remove("just-occupied"),500))):s.bases[i].classList.remove("occupied","just-occupied"),sd[i]=r}switch(t){case"ready":s.phaseHint.textContent="Next pitch incoming...",s.phaseHint.style.opacity="0.6";break;case"pitching":s.phaseHint.textContent="Swing!",s.phaseHint.style.opacity="1";break;default:s.phaseHint.style.opacity="0"}}const id={ball:0,strike:0,out:0},sd=[!1,!1,!1];let rd=0;function sc(s,e,t){const n=id[t]??0;id[t]=e;for(let i=0;i<s.length;i++)i<e?(s[i].classList.add("active",t),i>=n&&(s[i].classList.add("flash"),setTimeout(()=>s[i].classList.remove("flash"),400))):s[i].classList.remove("active",t,"flash")}let Dc=!1,_o=null,Zr=null;function ad(s,e){if(!e)return void s.batterStrip.classList.remove("visible");const t=(function(a){return a.order[a.currentIndex]})(e),n=t.position||"UT",i=e.currentIndex+1,r=t.stats.avg>0?t.stats.avg.toFixed(3).replace(/^0/,""):".000";s.batterStrip.innerHTML=`<span class="syb-batter-name">${t.name}</span>  <span class="syb-batter-stat">#${i} ${n} · ${r} AVG</span>`,s.batterStrip.classList.add("visible")}const od=["msg-hr","msg-hit","msg-out","msg-walk","msg-inning","msg-strikeout","msg-clutch","pop","swinging"];function qn(s,e,t,n){Zr&&(clearTimeout(Zr),Zr=null),s.messageOverlay.classList.remove("visible",...od),s.messageOverlay.textContent=e,n&&n!=="default"&&s.messageOverlay.classList.add(`msg-${n}`),n!=="hr"&&n!=="hit"||(s.messageOverlay.classList.add("pop"),requestAnimationFrame(()=>{requestAnimationFrame(()=>{s.messageOverlay.classList.remove("pop")})})),s.messageOverlay.classList.add("visible"),t>0&&(Zr=setTimeout(()=>{s.messageOverlay.classList.remove("visible",...od),Zr=null},t))}let Jr=null;function _x(s,e){e?s.swingButton.classList.add("pulse"):s.swingButton.classList.remove("pulse")}const ld=["timing-perfect","timing-good","timing-early","timing-late"];let Qr=null,ea=null;function Uc(s,e){ea&&(clearTimeout(ea),ea=null),s.statLine.textContent=e,s.statLine.classList.add("visible"),ea=setTimeout(()=>{s.statLine.classList.remove("visible"),ea=null},1500)}const cd=["flash-double","flash-triple","flash-big-inning"];let ta=null;function ra(s,e,t=300){s.hitFlash.classList.remove("active",...cd),s.hitFlash.classList.add(`flash-${e}`),s.hitFlash.offsetWidth,s.hitFlash.classList.add("active"),setTimeout(()=>s.hitFlash.classList.remove("active",...cd),t)}const yx={homeRun:["Crushed it.","See ya!","Gone. Just gone.","Outta here!","Moonshot."],strikeout:["Sit down!","Paint.","Too nasty.","Next."],bigHit:["Roped!","Hard contact.","Right on the barrel.","Line drive!"],divingCatch:["Not today.","Robbed!","Web gem!","What a snag!"],rally:["Here we go!","Rally time!","Keep it rolling!"],blownLead:["That stings.","Big trouble.","Need an answer."],walkOff:["Walk it off!","Ballgame!","That’s how you end it!"],walk:["Take your base.","Free pass."]};let na=null;function yo(s,e,t=!1){if(!t&&Math.random()>.6)return;const n=yx[e];if(!n||n.length===0)return;const i=n[Math.floor(Math.random()*n.length)];na&&(clearTimeout(na),na=null),s.barkToast.classList.remove("visible"),s.barkToast.textContent=i,s.barkToast.offsetWidth,s.barkToast.classList.add("visible"),na=setTimeout(()=>{s.barkToast.classList.remove("visible"),na=null},1800)}function Bp(s){if(!document.querySelector("style[data-ts-styles]")){const C=document.createElement("style");C.dataset.tsStyles="1",C.textContent=`
  /* ── Overlay ── */
  .ts-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg,
      rgba(10,10,26,.98) 0%,
      rgba(20,12,8,.97) 40%,
      rgba(30,15,5,.96) 70%,
      rgba(191,87,0,.08) 100%);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 210;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 28px 20px 40px;
    transition: opacity .4s ease-out;
    font-family: 'Oswald', 'Segoe UI', system-ui, sans-serif;
    scrollbar-width: thin;
    scrollbar-color: rgba(191,87,0,.3) transparent;
  }
  .ts-overlay::-webkit-scrollbar { width: 6px; }
  .ts-overlay::-webkit-scrollbar-track { background: transparent; }
  .ts-overlay::-webkit-scrollbar-thumb { background: rgba(191,87,0,.3); border-radius: 3px; }
  .ts-overlay.hidden {
    opacity: 0;
    pointer-events: none;
  }

  /* ── Header ── */
  .ts-header {
    text-align: center;
    margin-bottom: 20px;
  }
  .ts-title {
    font-size: 40px;
    font-weight: 800;
    background: linear-gradient(135deg, #FFD700 0%, #BF5700 60%, #FF6B35 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-transform: uppercase;
    letter-spacing: 2px;
    line-height: 1.1;
  }
  .ts-subtitle {
    color: rgba(255,255,255,.35);
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-top: 6px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
  }

  /* ── Search bar ── */
  .ts-search-wrap {
    position: relative;
    width: 100%;
    max-width: 460px;
    margin-bottom: 16px;
  }
  .ts-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,.25);
    font-size: 14px;
    pointer-events: none;
    transition: color .2s;
  }
  .ts-search-wrap:focus-within .ts-search-icon {
    color: #FFD700;
  }
  .ts-search {
    width: 100%;
    padding: 12px 40px 12px 38px;
    border: 2px solid rgba(191,87,0,.25);
    border-radius: 10px;
    background: rgba(10,10,26,.7);
    color: #e0e0e0;
    font-family: 'Oswald', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color .25s, box-shadow .25s;
    box-sizing: border-box;
  }
  .ts-search:focus {
    border-color: #FFD700;
    box-shadow: 0 0 20px rgba(255,215,0,.12);
  }
  .ts-search::placeholder {
    color: rgba(255,255,255,.2);
    font-style: italic;
  }
  .ts-search-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.4);
    font-size: 14px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    transition: background .2s, color .2s;
    line-height: 1;
    padding: 0;
  }
  .ts-search-clear.visible { display: flex; }
  .ts-search-clear:hover {
    background: rgba(191,87,0,.3);
    color: #fff;
  }

  /* ── Match count ── */
  .ts-match-count {
    font-size: 11px;
    color: rgba(255,255,255,.25);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 14px;
    transition: color .2s;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
  }
  .ts-match-count.has-filter {
    color: rgba(255,215,0,.5);
  }

  /* ── Conference tabs ── */
  .ts-conf-tabs {
    display: flex;
    gap: 6px;
    width: 100%;
    max-width: 700px;
    overflow-x: auto;
    padding: 0 4px 12px;
    margin-bottom: 8px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  .ts-conf-tabs::-webkit-scrollbar { display: none; }
  .ts-conf-tab {
    flex-shrink: 0;
    padding: 7px 16px;
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 20px;
    background: rgba(255,255,255,.03);
    color: rgba(255,255,255,.45);
    font-family: 'Oswald', sans-serif;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    cursor: pointer;
    transition: all .2s;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }
  .ts-conf-tab:hover {
    border-color: rgba(191,87,0,.4);
    color: rgba(255,255,255,.7);
    background: rgba(191,87,0,.08);
  }
  .ts-conf-tab.active {
    border-color: #BF5700;
    color: #FFD700;
    background: rgba(191,87,0,.15);
    box-shadow: 0 0 12px rgba(191,87,0,.2);
  }

  /* ── Grid ── */
  .ts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
    width: 100%;
    max-width: 700px;
    margin-bottom: 24px;
  }

  /* ── Conference group header inside grid ── */
  .ts-conf-header {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0 2px;
    margin-top: 8px;
  }
  .ts-conf-header:first-child { margin-top: 0; }
  .ts-conf-header-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(191,87,0,.7);
    text-transform: uppercase;
    letter-spacing: 3px;
    white-space: nowrap;
    font-family: 'Oswald', sans-serif;
  }
  .ts-conf-header-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(191,87,0,.25) 0%, transparent 100%);
  }
  .ts-conf-header-count {
    font-size: 10px;
    color: rgba(255,255,255,.2);
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Team card ── */
  .ts-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 10px 14px;
    border: 2px solid rgba(255,255,255,.06);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%);
    cursor: pointer;
    transition: all .25s cubic-bezier(.4,0,.2,1);
    gap: 8px;
    overflow: hidden;
  }
  .ts-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    opacity: 0;
    transition: opacity .3s;
    pointer-events: none;
  }
  .ts-card:hover {
    border-color: rgba(255,215,0,.5);
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 8px 24px rgba(0,0,0,.3), 0 0 20px rgba(255,215,0,.08);
  }
  .ts-card:hover::before {
    opacity: 1;
  }
  .ts-card:active {
    transform: translateY(-1px) scale(1.01);
    transition-duration: .1s;
  }

  /* ── Card color accent (top border glow via gradient stripe) ── */
  .ts-card-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 12px 12px 0 0;
    opacity: 0.6;
    transition: opacity .25s;
  }
  .ts-card:hover .ts-card-accent {
    opacity: 1;
  }

  /* ── Logo ── */
  .ts-logo-wrap {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255,255,255,.04);
    transition: background .25s, box-shadow .25s;
    flex-shrink: 0;
  }
  .ts-card:hover .ts-logo-wrap {
    background: rgba(255,255,255,.08);
    box-shadow: 0 0 16px rgba(255,215,0,.1);
  }
  .ts-logo {
    width: 42px;
    height: 42px;
    object-fit: contain;
  }
  .ts-logo-placeholder {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Card text ── */
  .ts-team-name {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,255,255,.85);
    text-align: center;
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color .2s;
  }
  .ts-card:hover .ts-team-name {
    color: #FFD700;
  }
  .ts-team-conf {
    font-size: 9px;
    color: rgba(255,255,255,.25);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-family: 'JetBrains Mono', monospace;
  }
  .ts-team-abbr {
    font-size: 9px;
    color: rgba(255,255,255,.15);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 2px;
  }

  /* ── Skip button ── */
  .ts-skip {
    font-family: 'Oswald', sans-serif;
    padding: 12px 32px;
    border: 1.5px solid rgba(255,255,255,.1);
    border-radius: 10px;
    background: transparent;
    color: rgba(255,255,255,.35);
    font-size: 13px;
    cursor: pointer;
    transition: all .25s;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .ts-skip:hover {
    color: rgba(255,255,255,.65);
    border-color: rgba(255,255,255,.25);
    background: rgba(255,255,255,.03);
  }

  /* ── States ── */
  .ts-loading {
    color: rgba(255,255,255,.3);
    font-size: 14px;
    margin: 40px 0;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .ts-loading-dot {
    display: inline-block;
    animation: ts-dot-pulse 1.4s infinite ease-in-out both;
  }
  .ts-loading-dot:nth-child(2) { animation-delay: .16s; }
  .ts-loading-dot:nth-child(3) { animation-delay: .32s; }

  @keyframes ts-dot-pulse {
    0%, 80%, 100% { opacity: .2; }
    40% { opacity: 1; }
  }

  .ts-empty {
    grid-column: 1 / -1;
    color: rgba(255,255,255,.2);
    font-size: 13px;
    margin: 24px 0;
    text-align: center;
    letter-spacing: 1px;
  }

  /* ── Highlight match in search ── */
  .ts-highlight {
    color: #FFD700;
    background: rgba(255,215,0,.1);
    border-radius: 2px;
    padding: 0 1px;
  }

  /* ── Entrance animation ── */
  @keyframes ts-card-enter {
    from {
      opacity: 0;
      transform: translateY(12px) scale(.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .ts-overlay { padding: 20px 12px 32px; }
    .ts-title { font-size: 30px; letter-spacing: 1px; }
    .ts-grid {
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 8px;
    }
    .ts-card { padding: 12px 8px 10px; }
    .ts-logo-wrap { width: 44px; height: 44px; }
    .ts-logo, .ts-logo-placeholder { width: 32px; height: 32px; font-size: 12px; }
    .ts-team-name { font-size: 10px; }
    .ts-conf-tab { padding: 6px 12px; font-size: 10px; }
    .ts-search-wrap { max-width: 100%; }
  }
  @media (max-width: 400px) {
    .ts-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .ts-card { padding: 10px 6px 8px; gap: 6px; }
    .ts-logo-wrap { width: 38px; height: 38px; }
    .ts-logo, .ts-logo-placeholder { width: 28px; height: 28px; font-size: 11px; }
    .ts-team-name { font-size: 9px; }
  }
`,document.head.appendChild(C)}const e=document.createElement("div");e.className="ts-overlay hidden";const t=document.createElement("div");t.className="ts-header";const n=document.createElement("div");n.className="ts-title",n.textContent=s.title??"Pick Your Squad",t.appendChild(n);const i=document.createElement("div");i.className="ts-subtitle",i.textContent=s.subtitle??"Real College Baseball Rosters",t.appendChild(i),e.appendChild(t);const r=document.createElement("div");r.className="ts-search-wrap";const a=document.createElement("span");a.className="ts-search-icon",a.innerHTML="&#x1F50D;",a.setAttribute("aria-hidden","true"),r.appendChild(a);const o=document.createElement("input");o.className="ts-search",o.type="text",o.placeholder="Search teams or conferences...",o.setAttribute("autocomplete","off"),o.setAttribute("spellcheck","false"),r.appendChild(o);const l=document.createElement("button");l.className="ts-search-clear",l.innerHTML="&#x2715;",l.title="Clear search",l.addEventListener("click",()=>{o.value="",l.classList.remove("visible"),w(),o.focus()}),r.appendChild(l),e.appendChild(r);const c=document.createElement("div");c.className="ts-match-count",e.appendChild(c);const h=document.createElement("div");h.className="ts-conf-tabs",h.setAttribute("role","tablist"),e.appendChild(h);const u=document.createElement("div");u.className="ts-grid",e.appendChild(u);const d=document.createElement("button");d.className="ts-skip",d.textContent=s.skipLabel??"Play Without Team",d.addEventListener("click",()=>{b(),s.onSkip()}),e.appendChild(d);const p=document.createElement("div");p.className="ts-loading",p.innerHTML='Loading Teams<span class="ts-loading-dot">.</span><span class="ts-loading-dot">.</span><span class="ts-loading-dot">.</span>',s.container.appendChild(e);let f=[],g="";function m(){h.querySelectorAll(".ts-conf-tab").forEach(C=>{const U=C,A=g===""?!U.dataset.conf:U.dataset.conf===g;U.classList.toggle("active",A)})}function _(C){u.innerHTML="";const U=o.value.toLowerCase().trim(),A=!!U||!!g;if(c.textContent=A?`${C.length} team${C.length!==1?"s":""} found`:`${C.length} teams available`,c.classList.toggle("has-filter",A),C.length===0){const J=document.createElement("div");return J.className="ts-empty",J.textContent=U?`No teams matching "${o.value.trim()}"`:"No teams found",void u.appendChild(J)}const O=(function(J){const W=new Map;for(const k of J){const $=k.conference||"Independent";W.has($)||W.set($,[]),W.get($).push(k)}return Array.from(W.entries()).sort(([k],[$])=>k.localeCompare($)).map(([k,$])=>({conference:k,teams:$}))})(C),F=O.length>1&&!g;let j=0;for(const J of O){if(F){const W=document.createElement("div");W.className="ts-conf-header";const k=document.createElement("span");k.className="ts-conf-header-label",k.textContent=J.conference;const $=document.createElement("div");$.className="ts-conf-header-line";const N=document.createElement("span");N.className="ts-conf-header-count",N.textContent=String(J.teams.length),W.appendChild(k),W.appendChild($),W.appendChild(N),u.appendChild(W)}for(const W of J.teams){const k=x(W,U,j);u.appendChild(k),j++}}}function x(C,U,A){const O=document.createElement("div");O.className="ts-card";const F=Math.min(25*A,2e3);O.style.animation=`ts-card-enter .35s ${F}ms cubic-bezier(.4,0,.2,1) both`,O.style.setProperty("--team-color",C.primaryColor),O.querySelector("::before"),O.style.cssText+=`; --team-color: ${C.primaryColor};`,O.addEventListener("mouseenter",()=>{O.style.background=`linear-gradient(180deg, ${S(C.primaryColor,.1)} 0%, rgba(255,255,255,.02) 100%)`}),O.addEventListener("mouseleave",()=>{O.style.background="linear-gradient(180deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%)"});const j=document.createElement("div");j.className="ts-card-accent",j.style.background=`linear-gradient(90deg, ${C.primaryColor}, ${C.secondaryColor})`,O.appendChild(j);const J=document.createElement("div");if(J.className="ts-logo-wrap",C.logoUrl){const k=document.createElement("img");k.className="ts-logo",k.src=C.logoUrl,k.alt=C.name,k.loading="lazy",k.onerror=()=>{k.replaceWith(v(C))},J.appendChild(k)}else J.appendChild(v(C));O.appendChild(J);const W=document.createElement("div");if(W.className="ts-team-name",U?W.innerHTML=y(C.name,U):W.textContent=C.name,O.appendChild(W),C.conference){const k=document.createElement("div");k.className="ts-team-conf",U&&C.conference.toLowerCase().includes(U)?k.innerHTML=y(C.conference,U):k.textContent=C.conference,O.appendChild(k)}return O.addEventListener("click",()=>{O.style.borderColor="#FFD700",O.style.boxShadow=`0 0 30px ${S(C.primaryColor,.4)}, 0 0 60px rgba(255,215,0,.15)`,O.style.transform="scale(1.06)",setTimeout(()=>{b(),s.onSelect(C)},150)}),O}function v(C){const U=document.createElement("div");return U.className="ts-logo-placeholder",U.style.background=`linear-gradient(135deg, ${C.primaryColor}, ${C.secondaryColor||C.primaryColor})`,U.textContent=C.abbreviation.slice(0,3)||C.name.charAt(0),U}function y(C,U){if(!U)return I(C);const A=C.toLowerCase().indexOf(U);if(A===-1)return I(C);const O=C.slice(0,A),F=C.slice(A,A+U.length),j=C.slice(A+U.length);return I(O)+'<span class="ts-highlight">'+I(F)+"</span>"+I(j)}function I(C){return C.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function S(C,U){const A=C.replace("#","");return`rgba(${parseInt(A.substring(0,2),16)||0},${parseInt(A.substring(2,4),16)||0},${parseInt(A.substring(4,6),16)||0},${U})`}function w(){const C=o.value.toLowerCase().trim(),U=g;l.classList.toggle("visible",o.value.length>0);let A=f;U&&(A=A.filter(O=>O.conference===U)),C&&(A=A.filter(O=>O.name.toLowerCase().includes(C)||O.abbreviation.toLowerCase().includes(C)||O.conference.toLowerCase().includes(C))),_(A)}async function L(){u.innerHTML="",u.appendChild(p),c.textContent="",f=await(async function(){if(go.entry&&Date.now()-go.entry.ts<Op)return go.entry.data;try{const C=await fetch(`${Up}/teams/all`,{signal:AbortSignal.timeout(5e3)});if(!C.ok)throw new Error(`HTTP ${C.status}`);const U=await C.json(),A=U.teams??U??[];if(!Array.isArray(A))throw new Error("Unexpected team list response shape");const O=A.map(F=>({id:String(F.id??F.teamId??F.slug),name:F.name??F.displayName??"",abbreviation:F.abbreviation??F.abbr??"",conference:F.conference??F.conf??"",logoUrl:F.logoUrl??F.logo??"",primaryColor:F.primaryColor??F.color??"#BF5700",secondaryColor:F.secondaryColor??F.altColor??"#FFD700"}));return go.entry={data:O,ts:Date.now()},O}catch{return px}})(),(function(C){h.innerHTML="";const U=document.createElement("button");U.className="ts-conf-tab active",U.textContent="All",U.setAttribute("role","tab"),U.addEventListener("click",()=>{g="",m(),w()}),h.appendChild(U);for(const A of C){const O=document.createElement("button");O.className="ts-conf-tab",O.textContent=A,O.setAttribute("role","tab"),O.dataset.conf=A,O.addEventListener("click",()=>{g=A,m(),w(),O.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})}),h.appendChild(O)}})((function(C){const U=new Set(C.map(A=>A.conference).filter(Boolean));return Array.from(U).sort()})(f)),_(f)}function b(){e.classList.add("hidden")}return o.addEventListener("input",w),{show:function(){e.classList.remove("hidden"),o.value="",g="",l.classList.remove("visible"),L(),setTimeout(()=>o.focus(),150)},hide:b,destroy:function(){e.remove()}}}const Ro="https://blazecraft.app/api/mini-games/leaderboard",kp="sandlot-sluggers";function zp(){try{const s=localStorage.getItem("bsi-career");if(s)return JSON.parse(s)}catch{}return{games:0,totalRuns:0,totalHits:0,totalHRs:0,totalABs:0,bestEV:0,bestDistance:0}}function ya(s){for(;s.firstChild;)s.removeChild(s.firstChild)}function $n(s,e,t){const n=document.createElement(s);return e&&(n.className=e),t&&(n.textContent=t),n}const bt=s=>document.getElementById(s),Ti=bt("loading-screen"),hd=bt("loading-fill"),ud=bt("loading-stage"),qi=bt("mode-select"),Mi=bt("game-over"),bx=bt("go-stats"),rc=bt("go-box-score"),dd=bt("go-leaderboard"),Mx=bt("go-restart"),Sx=bt("go-menu"),An=bt("go-share"),Jc=bt("team-select-container"),qs=bt("sound-toggle"),ia=bt("go-team-logo"),sa=bt("go-team-name"),Co=bt("name-prompt"),bo=bt("name-input"),pd=bt("name-submit"),Mo=bt("go-rating"),So=bt("go-rating-fill"),ac=bt("go-rating-value"),nr=bt("go-lb-card"),lr=bt("menu-btn"),Qo=bt("pause-menu"),wx=bt("pause-resume"),Tx=bt("pause-quit"),fd=bt("diff-row"),oc=bt("career-stats"),lc=bt("career-grid");function Ys(s,e){hd&&(hd.style.width=`${Math.min(s,100)}%`),ud&&(ud.textContent=e)}function Vp(){Qo?.classList.remove("active"),Rx()}localStorage.getItem("bsi_arcade_muted")==="1"&&qs&&(qs.textContent="🔇",qs.classList.add("muted")),qs?.addEventListener("click",()=>{if(!He)return;const s=He.toggleMute();qs.textContent=s?"🔇":"🔊",qs.classList.toggle("muted",s),localStorage.setItem("bsi_arcade_muted",s?"1":"0")}),lr?.addEventListener("click",()=>{He&&He.stop(),Vt=null,ai=null,yr=null,ji=null,Si=null,lr.classList.remove("visible"),Vo()}),wx?.addEventListener("click",Vp),Tx?.addEventListener("click",()=>{Qo?.classList.remove("active"),He&&(He.isPaused()&&He.resume(),He.stop()),Vt=null,ai=null,yr=null,ji=null,Si=null,lr?.classList.remove("visible"),Vo()}),fd?.querySelectorAll(".diff-btn").forEach(s=>{s.addEventListener("click",()=>{fd.querySelectorAll(".diff-btn").forEach(e=>e.classList.remove("active")),s.classList.add("active"),Gp=s.dataset.diff})});let He=null,Ve=null,Hp="quickPlay",Gp="medium",Vt=null,ai=null,Si=null,yr=null,ji=null,Qc=En.BOOT,md=br(),Wp=0;function Xp(s){switch(s){case"ready":return En.PITCH_READY;case"pitching":return En.PITCH_FLIGHT;case"fielding":return En.BALL_IN_PLAY;case"result":return En.PLATE_RESULT;case"gameOver":return En.GAME_OVER;default:return Qc}}function Ri(s){Qc=s}function qp(){return!!Jc?.querySelector(".ts-overlay:not(.hidden)")}function Ax(){return!qi.classList.contains("hidden")||!Mi.classList.contains("hidden")||!Co.classList.contains("hidden")||qp()||!!Qo?.classList.contains("active")}function Ex(s){He&&!He.isPaused()&&He.pause(),Ri(s)}function Rx(){He&&He.isPaused()&&He.resume(),He&&Ri(Xp(He.getPhase()))}function Vo(){Mi.classList.add("hidden"),lr?.classList.remove("visible"),qi.classList.add("hidden");const s=qi.querySelectorAll(".mode-title, .mode-sub, .mode-grid .mode-btn, .mode-btn-featured");s.forEach(e=>{e.style.animation="none"}),qi.offsetHeight,s.forEach(e=>{e.style.animation=""}),qi.classList.remove("hidden"),Ri(En.HOME),(function(){if(!oc||!lc)return;const e=zp();if(e.games===0)return void(oc.style.display="none");oc.style.display="";const t=e.totalABs>0?(e.totalHits/e.totalABs).toFixed(3):".000",n=[{label:"Games",value:String(e.games)},{label:"Home Runs",value:String(e.totalHRs)},{label:"Career AVG",value:t}];ya(lc);for(const i of n){const r=$n("div",void 0);r.style.cssText="text-align:center";const a=$n("div",void 0,i.value);a.style.cssText="font-size:18px;font-weight:700;color:#FFD700;font-family:Oswald,sans-serif";const o=$n("div",void 0,i.label);o.style.cssText="font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px",r.appendChild(a),r.appendChild(o),lc.appendChild(r)}})()}function gd(){qi.classList.add("hidden")}qi.querySelectorAll(".mode-btn").forEach(s=>{s.addEventListener("click",()=>{const e=s.dataset.mode;e&&(e==="teamMode"?(gd(),jp()):(yr=null,ji=null,gd(),Vt=null,ai=null,el(e)))})});let Fn=null;function vd(){Ti.classList.add("hidden"),el("teamMode")}function xd(){Fn&&Fn.destroy(),Fn=Bp({container:Jc,title:"Pick The Opponent",subtitle:"Choose The Staff You'll Face",skipLabel:"Use House Pitcher",onSelect:async s=>{yr=s,Fn?.hide(),Ti.classList.remove("hidden"),Ti.classList.add("loading-screen-minimal");try{ji=await Fp(s.id)}catch{ji=jn({id:"house",name:"House Pitchers",abbreviation:"HSE",conference:"Sandlot League",primaryColor:"#243447",secondaryColor:"#9FB3C8"})}vd()},onSkip:()=>{ji=jn({id:"house",name:"House Pitchers",abbreviation:"HSE",conference:"Sandlot League",primaryColor:"#243447",secondaryColor:"#9FB3C8"}),yr=ji.team,Fn?.hide(),vd()}}),Fn.show(),Ri(En.TEAM_SELECT)}function jp(){Fn&&Fn.destroy(),Fn=Bp({container:Jc,title:"Pick Your Squad",subtitle:"Real College Baseball Rosters",skipLabel:"Use Sandlot Squad",onSelect:async s=>{Vt=s,Fn?.hide(),Ti.classList.remove("hidden"),Ti.classList.add("loading-screen-minimal");try{ai=await Fp(s.id)}catch{ai=jn(),Vt=ai.team}Ti.classList.add("hidden"),xd()},onSkip:()=>{ai=jn(),Vt=ai.team,Fn?.hide(),xd()}}),Fn.show(),Ri(En.TEAM_SELECT)}function $p(s){if(s.mode==="quickPlay"||s.mode==="teamMode")return s.result==="win"?{text:"TARGET CLEARED",color:"#FFD700"}:s.result==="loss"?{text:"SHORT OF TARGET",color:"#ff4444"}:{text:"FINAL",color:"rgba(255,255,255,.7)"};if(s.mode==="hrDerby")return s.stats.homeRuns>=5?{text:"SLUGGER!",color:"#FFD700"}:s.stats.homeRuns>=2?{text:"FINAL",color:"#FFD700"}:{text:"GAME OVER",color:"#ff4444"};const e=s.stats.atBats>0?s.stats.hits/s.stats.atBats:0;return s.stats.runs>=8?{text:"BLOWOUT!",color:"#FFD700"}:s.stats.runs>=4?{text:"GREAT GAME!",color:"#33dd55"}:e>=.3?{text:"FINAL",color:"#FFD700"}:s.stats.runs===0?{text:"SHUTOUT",color:"#ff4444"}:{text:"FINAL",color:"rgba(255,255,255,.7)"}}function Cx(s,e){ya(s),e.forEach(t=>{const n=$n("div",t.highlight?"go-stat highlight":"go-stat"),i=$n("div","go-stat-val","0");n.appendChild(i),n.appendChild($n("div","go-stat-label",t.label)),s.appendChild(n);const r=typeof t.value=="number"?t.value:parseFloat(t.value),a=typeof t.value=="string"&&t.value.includes(".");if(!isNaN(r)&&r>0){const l=performance.now(),c=h=>{const u=Math.min((h-l)/800,1),d=1-Math.pow(1-u,3),p=r*d;i.textContent=a?p.toFixed(3):String(Math.round(p)),u<1?requestAnimationFrame(c):i.textContent=String(t.value)};setTimeout(()=>requestAnimationFrame(c),300)}else i.textContent=String(t.value)})}function Px(s,e){ya(s),s.appendChild($n("div","bs-title",`${e.roster.team.name} Box Score`));const t=document.createElement("table"),n=document.createElement("thead"),i=document.createElement("tr");for(const f of["Player","AB","H","HR","RBI","K","BB","AVG"]){const g=document.createElement("th");g.textContent=f,i.appendChild(g)}n.appendChild(i),t.appendChild(n);const r=document.createElement("tbody"),a=e.boxScores.map(f=>({name:f.player.name,position:f.player.position,ab:f.atBats,h:f.hits,hr:f.homeRuns,rbi:f.rbi,k:f.strikeouts,bb:f.walks,avg:f.atBats>0?(f.hits/f.atBats).toFixed(3):".000"}));let o=0,l=-1;for(let f=0;f<a.length;f++){const g=100*a[f].rbi+50*a[f].hr+10*a[f].h;g>l&&(l=g,o=f)}const c=Math.max(...a.map(f=>f.h),1),h=Math.max(...a.map(f=>f.rbi),1);for(let f=0;f<a.length;f++){const g=y[f],m=document.createElement("tr");f===o&&l>0&&(m.className="mvp-row");const _=document.createElement("td");_.textContent=`${g.name} ${g.position}`,m.appendChild(_);const x=document.createElement("td");x.textContent=String(g.ab),m.appendChild(x);const v=document.createElement("td");v.textContent=String(g.h),g.h===c&&g.h>0?v.className="heat-high":g.h>0&&(v.className="heat-med"),m.appendChild(v);const y=document.createElement("td");y.textContent=String(g.hr),g.hr>0&&(y.className="heat-hr"),m.appendChild(y);const I=document.createElement("td");I.textContent=String(g.rbi),g.rbi===h&&g.rbi>0?I.className="heat-high":g.rbi>0&&(I.className="heat-med"),m.appendChild(I);const S=document.createElement("td");S.textContent=String(g.k),g.k===0&&(S.className="heat-low"),m.appendChild(S);const w=document.createElement("td");w.textContent=String(g.bb),g.bb===0&&(w.className="heat-low"),m.appendChild(w);const L=document.createElement("td");L.textContent=g.avg;const b=parseFloat(g.avg);b>=.4?L.className="heat-hr":b>=.3?L.className="heat-high":b>=.2?L.className="heat-med":g.ab>0&&(L.className="heat-low"),m.appendChild(L),v.appendChild(m)}const u=e.boxScores.reduce((f,g)=>({ab:f.ab+g.atBats,h:f.h+g.hits,hr:f.hr+g.homeRuns,rbi:f.rbi+g.rbi,k:f.k+g.strikeouts,bb:f.bb+g.walks}),{ab:0,h:0,hr:0,rbi:0,k:0,bb:0}),d=document.createElement("tr"),p=document.createElement("td");p.textContent="TOTAL",d.appendChild(p);for(const f of[u.ab,u.h,u.hr,u.rbi,u.k,u.bb,u.ab>0?(u.h/u.ab).toFixed(3):".000"]){const g=document.createElement("td");g.textContent=String(f),d.appendChild(g)}r.appendChild(d),t.appendChild(r),s.appendChild(t)}function Lx(){const s=new Date,e=s.toISOString().slice(0,10),t=new Date(s.getTime()-864e5).toISOString().slice(0,10);try{const n=JSON.parse(localStorage.getItem("bsi-daily-streak")??"{}"),i=n.lastPlayed===e?Math.max(1,Number(n.streak??1)):n.lastPlayed===t?Math.max(1,Number(n.streak??0)+1):1;return localStorage.setItem("bsi-daily-streak",JSON.stringify({lastPlayed:e,streak:i})),i}catch{return 1}}function Ix(s){try{localStorage.setItem("bsi-career",JSON.stringify(s))}catch{}}async function Nx(s,e,t){try{const n=localStorage.getItem("bsi-player-name")||"Anonymous";if(!(await fetch(`${Ro}/submit`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({gameId:kp,playerName:n,score:s,metadata:e})})).ok)return!1;try{const r=localStorage.getItem("bsi-device-id")??`device-${Math.random().toString(36).slice(2,10)}`;localStorage.setItem("bsi-device-id",r),await fetch(`${Ro.replace("/leaderboard","")}/economy/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:r})}).catch(()=>null),await fetch(`${Ro.replace("/leaderboard","")}/economy/earn`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:r,unitsKilled:0,buildingsDestroyed:0,resourcesGathered:Math.min(5e4,500*Math.max(1,Math.floor(t/5))),matchDurationSec:Math.max(0,e.durationSeconds??0),victory:e.result==="win"})}).catch(()=>null)}catch{}return!0}catch{return!1}}async function Dx(s=10,e=null,t=null){try{const n=new URL(`${Ro}/${kp}`);n.searchParams.set("limit",String(s)),e&&n.searchParams.set("mode",e),t&&n.searchParams.set("difficulty",t);const i=await fetch(n.toString());if(!i.ok)return[];const r=await i.json();return r.entries??r??[]}catch{return[]}}function Ux(s,e,t){if(ya(s),e.length===0)return void(nr&&(nr.style.display="none"));s.appendChild($n("div","go-lb-title","Leaderboard")),e.forEach((n,i)=>{const r=$n("div","go-lb-row"+(n.score===t?" you":""));r.appendChild($n("span",void 0,`#${i+1} ${n.player_name??n.playerName}`)),r.appendChild($n("span",void 0,String(n.score))),s.appendChild(r)}),nr&&(nr.style.display="block")}function Ox(s){Ex(En.GAME_OVER),lr?.classList.remove("visible");const e=$p(s),t=Mi.querySelector(".go-title");t&&(t.textContent=e.text,t.style.color=e.color,t.style.textShadow=e.color==="#FFD700"||e.color==="#33dd55"?`0 0 40px ${e.color}33`:"0 0 40px rgba(255,68,68,.2)");const n=[];if(s.mode==="hrDerby")n.push({label:"Home Runs",value:s.stats.homeRuns,highlight:s.stats.homeRuns>=3},{label:"Best Streak",value:s.stats.longestStreak,highlight:s.stats.longestStreak>=3},{label:"Outs",value:s.stats.derbyOuts},{label:"Pitches",value:s.stats.pitchCount});else{const f=s.stats.atBats>0?(s.stats.hits/s.stats.atBats).toFixed(3):".000";n.push({label:"Runs",value:s.stats.runs,highlight:s.stats.runs>=4},{label:"Hits",value:s.stats.hits,highlight:s.stats.hits>=4},{label:"Home Runs",value:s.stats.homeRuns,highlight:s.stats.homeRuns>=2},{label:"Batting Avg",value:f,highlight:parseFloat(f)>=.3}),Hi>0&&n.push({label:"Best EV",value:`${Hi}`,highlight:Hi>=105}),Gi>0&&n.push({label:"Longest Hit",value:`${Gi}`,highlight:Gi>=400})}if(Cx(bx,n),s.mode!=="hrDerby"&&Mo&&So&&ac){Mo.style.display="block";const f=s.stats.atBats>0?s.stats.hits/s.stats.atBats:0,g=100*Math.min(f/.5,1);let m="#ff4444",_="COLD";f>=.4?(m="#FFD700",_="ELITE"):f>=.3?(m="#33dd55",_="GREAT"):f>=.25?(m="#BF5700",_="SOLID"):f>=.2&&(m="#ff8c00",_="FAIR"),So.style.background=`linear-gradient(90deg, ${m}88, ${m})`,ac.textContent=_,ac.style.color=m,So.style.width="0%",setTimeout(()=>{So.style.width=`${g}%`},400)}else Mo&&(Mo.style.display="none");Vt&&ia&&sa?(ia.src=Vt.logoUrl,ia.style.display="block",sa.textContent=Vt.name,sa.style.display="block"):(ia&&(ia.style.display="none"),sa&&(sa.style.display="none")),s.mode==="teamMode"&&Si?(Px(rc,Si),rc.style.display="block"):rc.style.display="none";const i=Rf(s),r=`bsi-best-${s.mode}-${s.difficulty??"medium"}`,a=parseInt(localStorage.getItem(r)??"0",10),o=i>a&&i>0,l=Mi.querySelector(".go-best-banner");o&&localStorage.setItem(r,String(i)),l&&(o?(l.textContent="NEW PERSONAL BEST!",l.style.display="block",l.style.color="#ffd700",l.style.textShadow="0 0 16px rgba(255,215,0,.4)",l.style.fontSize="14px"):a>0?(l.textContent=`Best: ${a}`,l.style.display="block",l.style.color="rgba(255,255,255,0.3)",l.style.textShadow="none",l.style.fontSize="12px"):l.style.display="none");const c=Lx(),h=Cf({finalScore:i,win:s.result==="win",currentDailyStreak:c,mode:s.mode}),u=Math.max(1,Math.round((performance.now()-Math.max(Wp,0))/1e3)),d={...Pf(s,{durationSeconds:u,coinsEarned:h}),runs:s.stats.runs,hits:s.stats.hits,homeRuns:s.stats.homeRuns,innings:s.inning,teamName:Vt?.name??null,opponentTeamName:yr?.name??null},p=zp();p.games+=1,p.totalRuns+=s.stats.runs,p.totalHits+=s.stats.hits,p.totalHRs+=s.stats.homeRuns,p.totalABs+=s.stats.atBats,Hi>p.bestEV&&(p.bestEV=Hi),Gi>p.bestDistance&&(p.bestDistance=Gi),Ix(p),s.mode!=="practice"?Nx(i,d,h).finally(()=>{Dx(10,d.mode,d.difficulty).then(f=>{Ux(dd,f,i)})}):(ya(dd),nr&&(nr.style.display="none")),Mi.scrollTop=0,Mi.classList.remove("hidden")}async function Fx(s){const e=await(function(r){return new Promise((a,o)=>{const h=document.createElement("canvas");h.width=600,h.height=340;const u=h.getContext("2d");if(!u)return void o(new Error("No 2d context"));const d=Vt?.name??"Sandlot Sluggers",p=Vt?.primaryColor??"#BF5700",f=r.mode==="hrDerby",g=$p(r);u.fillStyle="#0a0a1a",u.fillRect(0,0,600,340),u.save(),u.globalAlpha=.04,u.strokeStyle="#FFD700",u.lineWidth=40;for(let S=-340;S<940;S+=80)u.beginPath(),u.moveTo(S,0),u.lineTo(S+340,340),u.stroke();u.restore();const m=u.createLinearGradient(0,0,600,0);m.addColorStop(0,"#BF5700"),m.addColorStop(1,"#FFD700"),u.fillStyle=m,u.fillRect(0,0,600,4),u.fillStyle=p,u.beginPath(),u.arc(30,36,10,0,2*Math.PI),u.fill(),u.fillStyle="#e0e0e0",u.font="600 22px Oswald, sans-serif",u.textAlign="left",u.textBaseline="middle",u.fillText(d,50,36),u.fillStyle=g.color,u.font="700 26px Oswald, sans-serif",u.textAlign="right",u.fillText(g.text,576,36),u.fillStyle="rgba(255,255,255,0.06)",u.fillRect(24,58,552,1);const _=r.stats.atBats>0?(r.stats.hits/r.stats.atBats).toFixed(3):".000",x=f?[{label:"HOME RUNS",value:String(r.stats.homeRuns),accent:!0},{label:"BEST STREAK",value:String(r.stats.longestStreak)},{label:"OUTS",value:String(r.stats.derbyOuts)},{label:"PITCHES",value:String(r.stats.pitchCount)}]:[{label:"RUNS",value:String(r.stats.runs),accent:!0},{label:"HITS",value:String(r.stats.hits)},{label:"HOME RUNS",value:String(r.stats.homeRuns)},{label:"AVG",value:_}],v=552/x.length;for(let S=0;S<x.length;S++){const w=x[S],L=24+v*S+v/2;u.fillStyle=w.accent?"#FFD700":"#e0e0e0",u.font="700 42px Oswald, sans-serif",u.textAlign="center",u.textBaseline="middle",u.fillText(w.value,L,106),u.fillStyle="rgba(255,255,255,0.35)",u.font="400 11px Oswald, sans-serif",u.letterSpacing="1.5px",u.fillText(w.label,L,140)}if(!f){u.fillStyle="rgba(255,255,255,0.06)",u.fillRect(24,168,552,1);const w=r.inning-1,L=w===1?"inning":"innings";u.fillStyle="rgba(255,255,255,0.3)",u.font="400 13px Oswald, sans-serif",u.textAlign="center",u.fillText(`${w} ${L} played`,300,188)}const y={quickPlay:"QUICK PLAY",teamMode:"TEAM MODE",hrDerby:"HR DERBY",practice:"PRACTICE"}[r.mode]??"";if(y){const S=f?168:198;u.fillStyle="rgba(191,87,0,0.15)";const w=u.measureText(y).width+20;(function(L,b,C,U,A,O){L.beginPath(),L.moveTo(b+O,C),L.lineTo(b+U-O,C),L.quadraticCurveTo(b+U,C,b+U,C+O),L.lineTo(b+U,C+A-O),L.quadraticCurveTo(b+U,C+A,b+U-O,C+A),L.lineTo(b+O,C+A),L.quadraticCurveTo(b,C+A,b,C+A-O),L.lineTo(b,C+O),L.quadraticCurveTo(b,C,b+O,C),L.closePath()})(u,300-w/2,S,w,22,4),u.fill(),u.fillStyle="#BF5700",u.font="600 10px Oswald, sans-serif",u.textAlign="center",u.fillText(y,300,S+12)}u.fillStyle="rgba(255,255,255,0.06)",u.fillRect(24,284,552,1);const I=u.createLinearGradient(24,0,200,0);I.addColorStop(0,"#FFD700"),I.addColorStop(1,"#BF5700"),u.fillStyle=I,u.font="700 16px Oswald, sans-serif",u.textAlign="left",u.fillText("SANDLOT SLUGGERS",24,310),u.fillStyle="rgba(255,255,255,0.25)",u.font="400 11px Oswald, sans-serif",u.textAlign="right",u.fillText("arcade.blazesportsintel.com",576,304),u.fillStyle="rgba(255,255,255,0.15)",u.font="400 9px Oswald, sans-serif",u.fillText("BLAZE SPORTS INTEL",576,318),u.fillStyle=m,u.fillRect(0,336,600,4),h.toBlob(S=>{S?a(S):o(new Error("Canvas toBlob failed"))},"image/png")})})(s);if(!Vt?.logoUrl)return e;const t=await(n=Vt.logoUrl,n?new Promise(r=>{const a=new Image;a.crossOrigin="anonymous",a.onload=()=>r(a),a.onerror=()=>r(null),a.src=n,setTimeout(()=>r(null),2e3)}):Promise.resolve(null));var n;if(!t)return e;const i=new Image;return new Promise((r,a)=>{i.onload=()=>{const o=document.createElement("canvas");o.width=600,o.height=340;const l=o.getContext("2d");if(!l)return void a(new Error("No 2d context"));l.drawImage(i,0,0),l.drawImage(t,19,25,22,22),o.toBlob(c=>{r(c||e)},"image/png")},i.onerror=()=>r(e),i.src=URL.createObjectURL(e)})}function Bx(){window.addEventListener("keydown",e=>{e.code!=="Space"&&e.key!==" "||(e.preventDefault(),Po()),e.key==="Escape"&&qi.classList.contains("hidden")&&Mi.classList.contains("hidden")&&!qp()&&He&&(He.isPaused()?Vp():He&&!He.isPaused()&&(He.pause(),Qo?.classList.add("active"),Ri(En.PAUSED)))});const s=document.getElementById("game-canvas");s&&(s.addEventListener("click",Po),s.addEventListener("touchstart",e=>{e.preventDefault(),Po()},{passive:!1}))}function Po(){He&&(Ax()||He.isPaused()||He.getPhase()==="pitching"&&He.triggerSwing())}async function el(s){const e=document.getElementById("game-canvas"),t=document.getElementById("game-container");if(!e||!t)return;const n=t.getBoundingClientRect();e.width=n.width,e.height=n.height,Hp=s,Si=null,Oc=1,Lo=0,Ho=0,Go=!1,Hi=0,Gi=0,Wo=0,Ks=[!1,!1,!1],Zs={single:!1,double:!1,triple:!1,homeRun:!1},Bc=!1,md=br(),lr?.classList.add("visible"),He&&He.stop(),Ve&&Ve.container.remove(),Ri(En.PREGAME),Ti.classList.remove("hidden","loading-screen-minimal"),Ys(0,"Preparing field..."),Ys(10,"Setting up field..."),Ve=xx({parent:t,onSwing:Po}),Vt&&(function(i,r,a){i.container.style.setProperty("--syb-team-color",a);for(const o of i.panels)o.classList.add("team-accent");r&&(i.teamLogo.src=r,i.teamLogo.classList.add("visible"))})(Ve,Vt.logoUrl,Vt.primaryColor),Ys(25,"Loading 3D assets..."),He=gx({canvas:e,glbUrl:Cc("/assets/sandlot_field.glb"),mode:s,difficulty:Gp,teamRoster:ai??void 0,opponentRoster:ji??void 0,sessionSeed:md,onPhaseChange:kx,onGameUpdate:Vx,onGameOver:i=>Ox(i),onLineupChange:i=>{Si=i,Ve&&ad(Ve,i)},onHitResult:Wx,onPitchDelivered:zx,onContactFeedback:Hx}),window.render_game_to_text=()=>JSON.stringify({sessionPhase:Qc,engine:He.renderToText()},null,2),window.advanceTime=i=>He.advanceTime(i),window.triggerSwing=()=>He.triggerSwing(),Ys(50,"Building the ballpark...");try{await He.start(),Wp=performance.now(),localStorage.getItem("bsi_arcade_muted")==="1"&&He.toggleMute(),Ys(100,"Play ball!"),await new Promise(r=>setTimeout(r,400)),Ti.classList.add("hidden");const i=Vt?Vt.name:"Ready!";qn(Ve,i,1500),Zc(Ve,He.getGameState(),He.getPhase()),localStorage.getItem("bsi-tutorial-seen")||(Fc=!0,Ve.tutorialHint.classList.add("visible")),He.getLineup()&&(Si=He.getLineup(),ad(Ve,Si))}catch{qn(Ve,"Failed to load",0)}}Mx.addEventListener("click",()=>{Mi.classList.add("hidden"),el(Hp)}),Sx.addEventListener("click",()=>{Mi.classList.add("hidden"),He&&He.stop(),Vt=null,ai=null,Si=null,Vo()}),An?.addEventListener("click",async()=>{if(!He)return;const s=He.getGameState(),e=(function(t){const n=Vt?.name??"Sandlot",i=t.stats.atBats>0?(t.stats.hits/t.stats.atBats).toFixed(3):".000";return[`Sandlot Sluggers | ${n}`,`${t.stats.runs} R | ${t.stats.hits} H | ${t.stats.homeRuns} HR | ${i} AVG`,t.inning-1+" innings played","","arcade.blazesportsintel.com/sandlot-sluggers"].join(`
`)})(s);try{const t=await Fx(s),n=new File([t],"sandlot-sluggers-result.png",{type:"image/png"});if(navigator.share&&navigator.canShare?.({files:[n]}))return void await navigator.share({text:e,files:[n]});if(navigator.clipboard&&typeof ClipboardItem<"u")try{return await navigator.clipboard.write([new ClipboardItem({"image/png":t})]),An&&(An.textContent="Image Copied!"),void setTimeout(()=>{An&&(An.textContent="Share")},2e3)}catch{}const i=URL.createObjectURL(t),r=document.createElement("a");r.href=i,r.download="sandlot-sluggers-result.png",r.click(),URL.revokeObjectURL(i),An&&(An.textContent="Saved!"),setTimeout(()=>{An&&(An.textContent="Share")},2e3)}catch{navigator.share?navigator.share({text:e}).catch(n=>{}):navigator.clipboard&&navigator.clipboard.writeText(e).then(()=>{An&&(An.textContent="Copied!"),setTimeout(()=>{An&&(An.textContent="Share")},1500)}).catch(n=>{})}});let Oc=1,Lo=0,Fc=!1,Ho=0,Go=!1,Hi=0,Gi=0,Ks=[!1,!1,!1],Wo=0,Zs={single:!1,double:!1,triple:!1,homeRun:!1},Bc=!1,os=null;function kx(s){if(!Ve||!He)return;Ri(Xp(s));const e=He.getGameState();if(Zc(Ve,e,s),_x(Ve,s==="pitching"),s==="ready"&&e.inning>Oc){Oc=e.inning;const t=e.stats.runs-Ho,n=t>0?`${t} run${t>1?"s":""} scored`:"",i=e.mode==="quickPlay"||e.mode==="teamMode"?e.suddenDeath?`Sudden Death · Target ${e.targetRuns}`:`Inning ${e.inning} of ${e.maxInnings}`:`Inning ${e.inning}`;(function(r,a,o=2e3){const l=r.inningBanner.querySelector(".syb-inning-banner-text");l&&(l.textContent=a),r.inningBanner.classList.add("active"),setTimeout(()=>r.inningBanner.classList.remove("active"),o)})(Ve,i,2200),n&&Ve&&setTimeout(()=>Uc(Ve,n),600),He?.playInningTransition(),Ho=e.stats.runs,Go=!1}}function zx(s,e,t){Ve&&(function(n,i,r,a){ta&&(clearTimeout(ta),ta=null);const o=a??"#FF6B35";n.pitchInfo.innerHTML=`<span class="syb-pitch-dot" style="background:${o}"></span>${i} <span class="syb-pitch-speed">${r}</span>`,n.pitchInfo.classList.add("visible"),ta=setTimeout(()=>{n.pitchInfo.classList.remove("visible"),ta=null},1200)})(Ve,s,e,t)}function Vx(s){if(!Ve||!He)return;if(Zc(Ve,s,He.getPhase()),s.stats.runs>Lo){const i=s.stats.runs-Lo;e=Ve,(t=i)<=0||(Jr&&(clearTimeout(Jr),Jr=null),e.runsToast.textContent=`+${t} run${t>1?"s":""}`,e.runsToast.classList.add("visible"),Jr=setTimeout(()=>{e.runsToast.classList.remove("visible"),Jr=null},1400))}var e,t;Lo=s.stats.runs,He?.setCrowdEnergy(s.stats.runs,s.inning,s.stats.currentStreak),(function(i,r,a){const o=i.panels[1];o&&(o.classList.remove("danger","hitter-count"),r>=2&&a<3?o.classList.add("danger"):a>=3&&r<2&&o.classList.add("hitter-count"))})(Ve,s.strikes,s.balls);const n=[...s.bases];(n[0]!==Ks[0]||n[1]!==Ks[1]||n[2]!==Ks[2])&&(n[0]&&n[1]&&n[2]?setTimeout(()=>{Ve&&qn(Ve,"BASES LOADED!",1200,"inning")},1300):n[2]&&!Ks[2]&&setTimeout(()=>{Ve&&qn(Ve,"Runner on Third!",1e3,"inning")},1300)),Ks=n,!Go&&s.stats.runs-Ho>=3&&(Go=!0,He?.playBigInning(),ra(Ve,"big-inning",500),setTimeout(()=>{Ve&&qn(Ve,"BIG INNING!",1600,"clutch")},800)),(s.strikes>=3||s.balls>=4)&&(function(i=600){Dc=!0,_o&&clearTimeout(_o),_o=setTimeout(()=>{Dc=!1,_o=null},i)})(700),s.strikes===2&&s.balls===3?qn(Ve,"Full Count!",1e3,"inning"):s.strikes>0&&s.strikes<3&&s.balls===0?qn(Ve,`Strike ${s.strikes}!`,800,"out"):s.balls>0&&s.balls<4&&s.strikes===0&&qn(Ve,`Ball ${s.balls}`,800,"walk")}function Hx(s){var e,t;Ve&&(e=Ve,t=s.timingLabel,Qr&&(clearTimeout(Qr),Qr=null),e.timingToast.classList.remove("visible",...ld),e.timingToast.textContent=t,e.timingToast.classList.add(`timing-${t.toLowerCase()}`),e.timingToast.offsetWidth,e.timingToast.classList.add("visible"),Qr=setTimeout(()=>{e.timingToast.classList.remove("visible",...ld),Qr=null},1e3),os={contactTier:(s.contactTier??s.quality??"weak").toUpperCase(),exitVelocityMph:s.exitVelocityMph,launchAngleDeg:s.launchAngleDeg??null,distanceFt:s.distanceFt},s.exitVelocityMph>Hi&&(Hi=s.exitVelocityMph),s.distanceFt>Gi&&(Gi=s.distanceFt),Wo=s.distanceFt,Fc&&((function(n){n.tutorialHint.classList.remove("visible")})(Ve),Fc=!1,localStorage.setItem("bsi-tutorial-seen","1")))}const Gx={single:{text:"SINGLE!",duration:1e3,style:"hit"},double:{text:"DOUBLE!",duration:1200,style:"hit"},triple:{text:"TRIPLE!",duration:1400,style:"hit"},homeRun:{text:"HOME RUN!",duration:1800,style:"hr"},out:{text:"Out",duration:800,style:"out"},doublePlay:{text:"DOUBLE PLAY!",duration:1400,style:"out"},sacFly:{text:"SAC FLY!",duration:1200,style:"hit"},strikeout:{text:"K",duration:1200,style:"strikeout"},strikeoutSwinging:{text:"K",duration:1200,style:"strikeout"},walk:{text:"Walk!",duration:1e3,style:"walk"},foul:{text:"Foul Ball!",duration:900,style:"out"}};function Wx(s){if(!Ve||!He)return;const e=He.getGameState();if(os){const n=s==="homeRun"?"HOME RUN":s==="triple"?"TRIPLE":s==="double"?"DOUBLE":s==="single"?"SINGLE":s==="doublePlay"?"DOUBLE PLAY":s==="sacFly"?"SAC FLY":s==="foul"?"FOUL":s==="out"?"OUT":s.toUpperCase();Uc(Ve,`${os.contactTier} · ${os.exitVelocityMph} MPH · ${os.launchAngleDeg??0}° · ${os.distanceFt} FT · ${n}`),os=null}if(s!=="single"&&s!=="double"&&s!=="triple"&&s!=="homeRun"||(Zs[s]=!0),s==="homeRun"&&Wo>0){const n=`${Wo} FT BOMB!`;setTimeout(()=>{Ve&&Uc(Ve,n)},1200)}const t=(e.mode==="quickPlay"||e.mode==="teamMode")&&e.inning>=e.maxInnings&&e.outs===2&&(s==="single"||s==="double"||s==="triple"||s==="homeRun");if(t){const n=s==="homeRun"?"CLUTCH HR!":`CLUTCH ${s.toUpperCase()}!`;qn(Ve,n,1800,"clutch"),He.playClutchHit(),ra(Ve,"big-inning",400)}else{const n=Gx[s];qn(Ve,n.text,n.duration,n.style),s==="strikeoutSwinging"&&Ve.messageOverlay.classList.add("swinging")}!Bc&&Zs.single&&Zs.double&&Zs.triple&&Zs.homeRun&&(Bc=!0,setTimeout(()=>{Ve&&(qn(Ve,"HIT FOR THE CYCLE!",2500,"clutch"),ra(Ve,"big-inning",600),He?.playClutchHit())},2e3)),s!=="out"&&s!=="doublePlay"&&s!=="strikeout"&&s!=="strikeoutSwinging"||(function(n,i=350){n.vignette.classList.add("active"),setTimeout(()=>n.vignette.classList.remove("active"),i)})(Ve),s==="homeRun"?yo(Ve,t&&s==="homeRun"?"walkOff":"homeRun",!0):s==="strikeout"||s==="strikeoutSwinging"?yo(Ve,"strikeout"):s==="double"||s==="triple"?yo(Ve,"bigHit"):s==="walk"&&yo(Ve,"walk"),t||(s==="double"&&ra(Ve,"double"),s==="triple"&&ra(Ve,"triple",400))}function _d(){Bx();const s=new URLSearchParams(window.location.search).get("mode");if(Ys(100,"Ready"),setTimeout(()=>Ti.classList.add("hidden"),300),!localStorage.getItem("bsi-player-name")&&Co&&bo&&pd){Co.classList.remove("hidden"),Ri(En.IDENTITY),bo.focus();const e=()=>{(function(t){const n=t.trim()||"Anonymous";localStorage.setItem("bsi-player-name",n)})(bo.value),Co.classList.add("hidden"),yd(s)};return pd.addEventListener("click",e),void bo.addEventListener("keydown",t=>{t.key==="Enter"&&e()})}yd(s)}function yd(s){s==="teamMode"?jp():s&&["practice","quickPlay","hrDerby"].includes(s)?el(s):Vo()}window.addEventListener("resize",()=>{const s=document.getElementById("game-container"),e=document.getElementById("game-canvas");if(!s||!e||!He)return;const t=s.getBoundingClientRect();e.width=t.width,e.height=t.height,He.resize(t.width,t.height)}),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_d):_d();
//# sourceMappingURL=index-xjGE1Qsq.js.map
