function Dl(i,{navigation:t,onShow:e=()=>{},onHide:n=()=>{}}){let s=new AbortController,r=[...i.querySelectorAll("[data-graph-overlay]")],a=[...i.querySelectorAll("[data-graph-toggle]")],o=null,l=null,c=(p,y,f)=>p.addEventListener(y,f,{signal:s.signal});function d({restore:p=!0}={}){if(!o)return!1;n(o.dataset.graphOverlay),o.hidden=!0,o=null;for(let y of a)y.setAttribute("aria-expanded","false");return p&&(l?.isConnected&&!l.closest("[hidden]")&&i.contains(l)?l:t()).focus({preventScroll:!0}),l=null,!0}function m(p,y=document.activeElement){let f=r.find(v=>v.dataset.graphOverlay===p);if(!f)return;if(o===f){d();return}let u=o?.contains(y)?l:y;d({restore:!1}),o=f,l=u,o.hidden=!1;for(let v of a)v.setAttribute("aria-expanded",String(v.dataset.graphToggle===p));e(p),(o.querySelector("[data-graph-find]")||o.querySelector("[data-graph-dismiss]")||o).focus({preventScroll:!0})}for(let p of r){p.hidden=!0;for(let y of p.querySelectorAll("[data-graph-dismiss]"))c(y,"click",()=>d())}for(let p of a)c(p,"click",()=>m(p.dataset.graphToggle,p));function h(){let p=i.querySelector("[data-graph-panel]")||i,y=p.getBoundingClientRect(),f=window.visualViewport,u=f?.offsetTop||0,v=u+(f?.height||innerHeight);p.style.setProperty("--graph-keyboard-inset",`${Math.max(0,y.bottom-v)}px`),p.style.setProperty("--graph-sheet-height",`${Math.max(80,Math.min(y.height,v-Math.max(y.top,u))-76)}px`)}window.visualViewport&&(c(window.visualViewport,"resize",h),c(window.visualViewport,"scroll",h));let g=new ResizeObserver(h);return g.observe(i.querySelector("[data-graph-panel]")||i),c(window,"resize",h),h(),{show:m,close:d,get active(){return o?.dataset.graphOverlay||null},destroy(){d({restore:!1}),g.disconnect(),s.abort()}}}var rc=0,Po=1,ac=2;var _s=1,oc=2,Li=3,bn=0,Le=1,He=2,un=0,Qn=1,Lo=2,Do=3,No=4,lc=5;var Fn=100,cc=101,hc=102,uc=103,dc=104,fc=200,pc=201,mc=202,gc=203,rr=204,ar=205,xc=206,_c=207,yc=208,vc=209,Mc=210,Sc=211,bc=212,wc=213,Tc=214,or=0,lr=1,cr=2,ti=3,hr=4,ur=5,dr=6,fr=7,Uo=0,Ac=1,Ec=2,Qe=0,Fo=1,Oo=2,Bo=3,zo=4,ko=5,Vo=6,Go=7;var Ho=300,Gn=301,ni=302,Gr=303,Hr=304,ys=306,pr=1e3,rn=1001,mr=1002,ye=1003,Cc=1004;var vs=1005;var Se=1006,Wr=1007;var Hn=1008;var We=1009,Wo=1010,Xo=1011,Di=1012,Xr=1013,tn=1014,qe=1015,dn=1016,qr=1017,Yr=1018,Ni=1020,qo=35902,Yo=35899,$o=1021,Zo=1022,Ye=1023,an=1026,Wn=1027,$r=1028,Zr=1029,ii=1030,Jr=1031;var Kr=1033,Ms=33776,Ss=33777,bs=33778,ws=33779,jr=35840,Qr=35841,ta=35842,ea=35843,na=36196,ia=37492,sa=37496,ra=37488,aa=37489,oa=37490,la=37491,ca=37808,ha=37809,ua=37810,da=37811,fa=37812,pa=37813,ma=37814,ga=37815,xa=37816,_a=37817,ya=37818,va=37819,Ma=37820,Sa=37821,ba=36492,wa=36494,Ta=36495,Aa=36283,Ea=36284,Ca=36285,Ra=36286;var Zi=2300,gr=2301,sr=2302,bo=2303,wo=2400,To=2401,Ao=2402;var Rc=3200;var Ic=0,Pc=1,An="",Ie="srgb",ei="srgb-linear",Ji="linear",ee="srgb";var jn=7680;var Eo=519,Lc=512,Dc=513,Nc=514,Ia=515,Uc=516,Fc=517,Pa=518,Oc=519,Co=35044,Ts=35048;var Jo="300 es",je=2e3,Ki=2001;function Fh(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Oh(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function ji(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Bc(){let i=ji("canvas");return i.style.display="block",i}var Nl={},Ai=null;function Ko(...i){let t="THREE."+i.shift();Ai?Ai("log",t,...i):console.log(t,...i)}function zc(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Pt(...i){i=zc(i);let t="THREE."+i.shift();if(Ai)Ai("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Dt(...i){i=zc(i);let t="THREE."+i.shift();if(Ai)Ai("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Qi(...i){let t=i.join(" ");t in Nl||(Nl[t]=!0,Pt(...i))}function kc(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var Vc={[or]:lr,[cr]:dr,[hr]:fr,[ti]:ur,[lr]:or,[dr]:cr,[fr]:hr,[ur]:ti},wn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Te=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var ja=Math.PI/180,xr=180/Math.PI;function As(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Te[i&255]+Te[i>>8&255]+Te[i>>16&255]+Te[i>>24&255]+"-"+Te[t&255]+Te[t>>8&255]+"-"+Te[t>>16&15|64]+Te[t>>24&255]+"-"+Te[e&63|128]+Te[e>>8&255]+"-"+Te[e>>16&255]+Te[e>>24&255]+Te[n&255]+Te[n>>8&255]+Te[n>>16&255]+Te[n>>24&255]).toLowerCase()}function qt(i,t,e){return Math.max(t,Math.min(e,i))}function Bh(i,t){return(i%t+t)%t}function Qa(i,t,e){return(1-e)*i+e*t}function Vi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Ne(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Qt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=qt(this.x,t.x,e.x),this.y=qt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=qt(this.x,t,e),this.y=qt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},on=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],d=n[s+2],m=n[s+3],h=r[a+0],g=r[a+1],p=r[a+2],y=r[a+3];if(m!==y||l!==h||c!==g||d!==p){let f=l*h+c*g+d*p+m*y;f<0&&(h=-h,g=-g,p=-p,y=-y,f=-f);let u=1-o;if(f<.9995){let v=Math.acos(f),b=Math.sin(v);u=Math.sin(u*v)/b,o=Math.sin(o*v)/b,l=l*u+h*o,c=c*u+g*o,d=d*u+p*o,m=m*u+y*o}else{l=l*u+h*o,c=c*u+g*o,d=d*u+p*o,m=m*u+y*o;let v=1/Math.sqrt(l*l+c*c+d*d+m*m);l*=v,c*=v,d*=v,m*=v}}t[e]=l,t[e+1]=c,t[e+2]=d,t[e+3]=m}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],d=n[s+3],m=r[a],h=r[a+1],g=r[a+2],p=r[a+3];return t[e]=o*p+d*m+l*g-c*h,t[e+1]=l*p+d*h+c*m-o*g,t[e+2]=c*p+d*g+o*h-l*m,t[e+3]=d*p-o*m-l*h-c*g,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),d=o(s/2),m=o(r/2),h=l(n/2),g=l(s/2),p=l(r/2);switch(a){case"XYZ":this._x=h*d*m+c*g*p,this._y=c*g*m-h*d*p,this._z=c*d*p+h*g*m,this._w=c*d*m-h*g*p;break;case"YXZ":this._x=h*d*m+c*g*p,this._y=c*g*m-h*d*p,this._z=c*d*p-h*g*m,this._w=c*d*m+h*g*p;break;case"ZXY":this._x=h*d*m-c*g*p,this._y=c*g*m+h*d*p,this._z=c*d*p+h*g*m,this._w=c*d*m-h*g*p;break;case"ZYX":this._x=h*d*m-c*g*p,this._y=c*g*m+h*d*p,this._z=c*d*p-h*g*m,this._w=c*d*m+h*g*p;break;case"YZX":this._x=h*d*m+c*g*p,this._y=c*g*m+h*d*p,this._z=c*d*p-h*g*m,this._w=c*d*m-h*g*p;break;case"XZY":this._x=h*d*m-c*g*p,this._y=c*g*m-h*d*p,this._z=c*d*p+h*g*m,this._w=c*d*m+h*g*p;break;default:Pt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],d=e[6],m=e[10],h=n+o+m;if(h>0){let g=.5/Math.sqrt(h+1);this._w=.25/g,this._x=(d-l)*g,this._y=(r-c)*g,this._z=(a-s)*g}else if(n>o&&n>m){let g=2*Math.sqrt(1+n-o-m);this._w=(d-l)/g,this._x=.25*g,this._y=(s+a)/g,this._z=(r+c)/g}else if(o>m){let g=2*Math.sqrt(1+o-n-m);this._w=(r-c)/g,this._x=(s+a)/g,this._y=.25*g,this._z=(l+d)/g}else{let g=2*Math.sqrt(1+m-n-o);this._w=(a-s)/g,this._x=(r+c)/g,this._y=(l+d)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(qt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,d=e._w;return this._x=n*d+a*o+s*c-r*l,this._y=s*d+a*l+r*o-n*c,this._z=r*d+a*c+n*l-s*o,this._w=a*d-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let c=Math.acos(o),d=Math.sin(c);l=Math.sin(l*c)/d,e=Math.sin(e*c)/d,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},z=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Ul.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Ul.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),d=2*(o*e-r*s),m=2*(r*n-a*e);return this.x=e+l*c+a*m-o*d,this.y=n+l*d+o*c-r*m,this.z=s+l*m+r*d-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=qt(this.x,t.x,e.x),this.y=qt(this.y,t.y,e.y),this.z=qt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=qt(this.x,t,e),this.y=qt(this.y,t,e),this.z=qt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return to.copy(this).projectOnVector(t),this.sub(to)}reflect(t){return this.sub(to.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},to=new z,Ul=new on,Ot=class i{constructor(t,e,n,s,r,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let d=this.elements;return d[0]=t,d[1]=s,d[2]=o,d[3]=e,d[4]=r,d[5]=l,d[6]=n,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],d=n[4],m=n[7],h=n[2],g=n[5],p=n[8],y=s[0],f=s[3],u=s[6],v=s[1],b=s[4],S=s[7],C=s[2],T=s[5],E=s[8];return r[0]=a*y+o*v+l*C,r[3]=a*f+o*b+l*T,r[6]=a*u+o*S+l*E,r[1]=c*y+d*v+m*C,r[4]=c*f+d*b+m*T,r[7]=c*u+d*S+m*E,r[2]=h*y+g*v+p*C,r[5]=h*f+g*b+p*T,r[8]=h*u+g*S+p*E,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],d=t[8];return e*a*d-e*o*c-n*r*d+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],d=t[8],m=d*a-o*c,h=o*l-d*r,g=c*r-a*l,p=e*m+n*h+s*g;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/p;return t[0]=m*y,t[1]=(s*c-d*n)*y,t[2]=(o*n-s*a)*y,t[3]=h*y,t[4]=(d*e-s*l)*y,t[5]=(s*r-o*e)*y,t[6]=g*y,t[7]=(n*l-c*e)*y,t[8]=(a*e-n*r)*y,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(eo.makeScale(t,e)),this}rotate(t){return this.premultiply(eo.makeRotation(-t)),this}translate(t,e){return this.premultiply(eo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},eo=new Ot,Fl=new Ot().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ol=new Ot().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function zh(){let i={enabled:!0,workingColorSpace:ei,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===ee&&(s.r=Sn(s.r),s.g=Sn(s.g),s.b=Sn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ee&&(s.r=Ti(s.r),s.g=Ti(s.g),s.b=Ti(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===An?Ji:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Qi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Qi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[ei]:{primaries:t,whitePoint:n,transfer:Ji,toXYZ:Fl,fromXYZ:Ol,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ie},outputColorSpaceConfig:{drawingBufferColorSpace:Ie}},[Ie]:{primaries:t,whitePoint:n,transfer:ee,toXYZ:Fl,fromXYZ:Ol,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ie}}}),i}var $t=zh();function Sn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ti(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var di,_r=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{di===void 0&&(di=ji("canvas")),di.width=t.width,di.height=t.height;let s=di.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=di}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=ji("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Sn(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Sn(e[n]/255)*255):e[n]=Sn(e[n]);return{data:e,width:t.width,height:t.height}}else return Pt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},kh=0,Ei=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:kh++}),this.uuid=As(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayHeight,e.displayWidth,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(no(s[a].image)):r.push(no(s[a]))}else r=no(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function no(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?_r.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Pt("Texture: Unable to serialize Texture."),{})}var Vh=0,io=new z,Ue=class i extends wn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=rn,s=rn,r=Se,a=Hn,o=Ye,l=We,c=i.DEFAULT_ANISOTROPY,d=An){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Vh++}),this.uuid=As(),this.name="",this.source=new Ei(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Qt(0,0),this.repeat=new Qt(1,1),this.center=new Qt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ot,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(io).x}get height(){return this.source.getSize(io).y}get depth(){return this.source.getSize(io).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Pt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Pt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Ho)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case pr:t.x=t.x-Math.floor(t.x);break;case rn:t.x=t.x<0?0:1;break;case mr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case pr:t.y=t.y-Math.floor(t.y);break;case rn:t.y=t.y<0?0:1;break;case mr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ue.DEFAULT_IMAGE=null;Ue.DEFAULT_MAPPING=Ho;Ue.DEFAULT_ANISOTROPY=1;var ue=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],d=l[4],m=l[8],h=l[1],g=l[5],p=l[9],y=l[2],f=l[6],u=l[10];if(Math.abs(d-h)<.01&&Math.abs(m-y)<.01&&Math.abs(p-f)<.01){if(Math.abs(d+h)<.1&&Math.abs(m+y)<.1&&Math.abs(p+f)<.1&&Math.abs(c+g+u-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let b=(c+1)/2,S=(g+1)/2,C=(u+1)/2,T=(d+h)/4,E=(m+y)/4,x=(p+f)/4;return b>S&&b>C?b<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(b),s=T/n,r=E/n):S>C?S<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(S),n=T/s,r=x/s):C<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(C),n=E/r,s=x/r),this.set(n,s,r,e),this}let v=Math.sqrt((f-p)*(f-p)+(m-y)*(m-y)+(h-d)*(h-d));return Math.abs(v)<.001&&(v=1),this.x=(f-p)/v,this.y=(m-y)/v,this.z=(h-d)/v,this.w=Math.acos((c+g+u-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=qt(this.x,t.x,e.x),this.y=qt(this.y,t.y,e.y),this.z=qt(this.z,t.z,e.z),this.w=qt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=qt(this.x,t,e),this.y=qt(this.y,t,e),this.z=qt(this.z,t,e),this.w=qt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},yr=class extends wn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Se,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ue(0,0,t,e),this.scissorTest=!1,this.viewport=new ue(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},r=new Ue(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){let e={minFilter:Se,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new Ei(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ve=class extends yr{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},ts=class extends Ue{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var vr=class extends Ue{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var re=class i{constructor(t,e,n,s,r,a,o,l,c,d,m,h,g,p,y,f){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,d,m,h,g,p,y,f)}set(t,e,n,s,r,a,o,l,c,d,m,h,g,p,y,f){let u=this.elements;return u[0]=t,u[4]=e,u[8]=n,u[12]=s,u[1]=r,u[5]=a,u[9]=o,u[13]=l,u[2]=c,u[6]=d,u[10]=m,u[14]=h,u[3]=g,u[7]=p,u[11]=y,u[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinant()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinant()===0)return this.identity();let e=this.elements,n=t.elements,s=1/fi.setFromMatrixColumn(t,0).length(),r=1/fi.setFromMatrixColumn(t,1).length(),a=1/fi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),d=Math.cos(r),m=Math.sin(r);if(t.order==="XYZ"){let h=a*d,g=a*m,p=o*d,y=o*m;e[0]=l*d,e[4]=-l*m,e[8]=c,e[1]=g+p*c,e[5]=h-y*c,e[9]=-o*l,e[2]=y-h*c,e[6]=p+g*c,e[10]=a*l}else if(t.order==="YXZ"){let h=l*d,g=l*m,p=c*d,y=c*m;e[0]=h+y*o,e[4]=p*o-g,e[8]=a*c,e[1]=a*m,e[5]=a*d,e[9]=-o,e[2]=g*o-p,e[6]=y+h*o,e[10]=a*l}else if(t.order==="ZXY"){let h=l*d,g=l*m,p=c*d,y=c*m;e[0]=h-y*o,e[4]=-a*m,e[8]=p+g*o,e[1]=g+p*o,e[5]=a*d,e[9]=y-h*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let h=a*d,g=a*m,p=o*d,y=o*m;e[0]=l*d,e[4]=p*c-g,e[8]=h*c+y,e[1]=l*m,e[5]=y*c+h,e[9]=g*c-p,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let h=a*l,g=a*c,p=o*l,y=o*c;e[0]=l*d,e[4]=y-h*m,e[8]=p*m+g,e[1]=m,e[5]=a*d,e[9]=-o*d,e[2]=-c*d,e[6]=g*m+p,e[10]=h-y*m}else if(t.order==="XZY"){let h=a*l,g=a*c,p=o*l,y=o*c;e[0]=l*d,e[4]=-m,e[8]=c*d,e[1]=h*m+y,e[5]=a*d,e[9]=g*m-p,e[2]=p*m-g,e[6]=o*d,e[10]=y*m+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Gh,t,Hh)}lookAt(t,e,n){let s=this.elements;return ze.subVectors(t,e),ze.lengthSq()===0&&(ze.z=1),ze.normalize(),Rn.crossVectors(n,ze),Rn.lengthSq()===0&&(Math.abs(n.z)===1?ze.x+=1e-4:ze.z+=1e-4,ze.normalize(),Rn.crossVectors(n,ze)),Rn.normalize(),Ds.crossVectors(ze,Rn),s[0]=Rn.x,s[4]=Ds.x,s[8]=ze.x,s[1]=Rn.y,s[5]=Ds.y,s[9]=ze.y,s[2]=Rn.z,s[6]=Ds.z,s[10]=ze.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],d=n[1],m=n[5],h=n[9],g=n[13],p=n[2],y=n[6],f=n[10],u=n[14],v=n[3],b=n[7],S=n[11],C=n[15],T=s[0],E=s[4],x=s[8],M=s[12],B=s[1],R=s[5],O=s[9],k=s[13],F=s[2],H=s[6],V=s[10],D=s[14],st=s[3],tt=s[7],ht=s[11],gt=s[15];return r[0]=a*T+o*B+l*F+c*st,r[4]=a*E+o*R+l*H+c*tt,r[8]=a*x+o*O+l*V+c*ht,r[12]=a*M+o*k+l*D+c*gt,r[1]=d*T+m*B+h*F+g*st,r[5]=d*E+m*R+h*H+g*tt,r[9]=d*x+m*O+h*V+g*ht,r[13]=d*M+m*k+h*D+g*gt,r[2]=p*T+y*B+f*F+u*st,r[6]=p*E+y*R+f*H+u*tt,r[10]=p*x+y*O+f*V+u*ht,r[14]=p*M+y*k+f*D+u*gt,r[3]=v*T+b*B+S*F+C*st,r[7]=v*E+b*R+S*H+C*tt,r[11]=v*x+b*O+S*V+C*ht,r[15]=v*M+b*k+S*D+C*gt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],d=t[2],m=t[6],h=t[10],g=t[14],p=t[3],y=t[7],f=t[11],u=t[15],v=l*g-c*h,b=o*g-c*m,S=o*h-l*m,C=a*g-c*d,T=a*h-l*d,E=a*m-o*d;return e*(y*v-f*b+u*S)-n*(p*v-f*C+u*T)+s*(p*b-y*C+u*E)-r*(p*S-y*T+f*E)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],d=t[8],m=t[9],h=t[10],g=t[11],p=t[12],y=t[13],f=t[14],u=t[15],v=e*o-n*a,b=e*l-s*a,S=e*c-r*a,C=n*l-s*o,T=n*c-r*o,E=s*c-r*l,x=d*y-m*p,M=d*f-h*p,B=d*u-g*p,R=m*f-h*y,O=m*u-g*y,k=h*u-g*f,F=v*k-b*O+S*R+C*B-T*M+E*x;if(F===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let H=1/F;return t[0]=(o*k-l*O+c*R)*H,t[1]=(s*O-n*k-r*R)*H,t[2]=(y*E-f*T+u*C)*H,t[3]=(h*T-m*E-g*C)*H,t[4]=(l*B-a*k-c*M)*H,t[5]=(e*k-s*B+r*M)*H,t[6]=(f*S-p*E-u*b)*H,t[7]=(d*E-h*S+g*b)*H,t[8]=(a*O-o*B+c*x)*H,t[9]=(n*B-e*O-r*x)*H,t[10]=(p*T-y*S+u*v)*H,t[11]=(m*S-d*T-g*v)*H,t[12]=(o*M-a*R-l*x)*H,t[13]=(e*R-n*M+s*x)*H,t[14]=(y*b-p*C-f*v)*H,t[15]=(d*C-m*b+h*v)*H,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,d=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,d*o+n,d*l-s*a,0,c*l-s*o,d*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,d=a+a,m=o+o,h=r*c,g=r*d,p=r*m,y=a*d,f=a*m,u=o*m,v=l*c,b=l*d,S=l*m,C=n.x,T=n.y,E=n.z;return s[0]=(1-(y+u))*C,s[1]=(g+S)*C,s[2]=(p-b)*C,s[3]=0,s[4]=(g-S)*T,s[5]=(1-(h+u))*T,s[6]=(f+v)*T,s[7]=0,s[8]=(p+b)*E,s[9]=(f-v)*E,s[10]=(1-(h+y))*E,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinant();if(r===0)return n.set(1,1,1),e.identity(),this;let a=fi.set(s[0],s[1],s[2]).length(),o=fi.set(s[4],s[5],s[6]).length(),l=fi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Ze.copy(this);let c=1/a,d=1/o,m=1/l;return Ze.elements[0]*=c,Ze.elements[1]*=c,Ze.elements[2]*=c,Ze.elements[4]*=d,Ze.elements[5]*=d,Ze.elements[6]*=d,Ze.elements[8]*=m,Ze.elements[9]*=m,Ze.elements[10]*=m,e.setFromRotationMatrix(Ze),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=je,l=!1){let c=this.elements,d=2*r/(e-t),m=2*r/(n-s),h=(e+t)/(e-t),g=(n+s)/(n-s),p,y;if(l)p=r/(a-r),y=a*r/(a-r);else if(o===je)p=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===Ki)p=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=m,c[9]=g,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=je,l=!1){let c=this.elements,d=2/(e-t),m=2/(n-s),h=-(e+t)/(e-t),g=-(n+s)/(n-s),p,y;if(l)p=1/(a-r),y=a/(a-r);else if(o===je)p=-2/(a-r),y=-(a+r)/(a-r);else if(o===Ki)p=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=m,c[9]=0,c[13]=g,c[2]=0,c[6]=0,c[10]=p,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},fi=new z,Ze=new re,Gh=new z(0,0,0),Hh=new z(1,1,1),Rn=new z,Ds=new z,ze=new z,Bl=new re,zl=new on,ln=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],d=s[9],m=s[2],h=s[6],g=s[10];switch(e){case"XYZ":this._y=Math.asin(qt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,g),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-qt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,g),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-m,r),this._z=0);break;case"ZXY":this._x=Math.asin(qt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-m,g),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-qt(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(h,g),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(qt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-m,r)):(this._x=0,this._y=Math.atan2(o,g));break;case"XZY":this._z=Math.asin(-qt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-d,g),this._y=0);break;default:Pt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Bl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Bl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return zl.setFromEuler(this),this.setFromQuaternion(zl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ln.DEFAULT_ORDER="XYZ";var es=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Wh=0,kl=new z,pi=new on,gn=new re,Ns=new z,Gi=new z,Xh=new z,qh=new on,Vl=new z(1,0,0),Gl=new z(0,1,0),Hl=new z(0,0,1),Wl={type:"added"},Yh={type:"removed"},mi={type:"childadded",child:null},so={type:"childremoved",child:null},Fe=class i extends wn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Wh++}),this.uuid=As(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new z,e=new ln,n=new on,s=new z(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new re},normalMatrix:{value:new Ot}}),this.matrix=new re,this.matrixWorld=new re,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new es,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return pi.setFromAxisAngle(t,e),this.quaternion.multiply(pi),this}rotateOnWorldAxis(t,e){return pi.setFromAxisAngle(t,e),this.quaternion.premultiply(pi),this}rotateX(t){return this.rotateOnAxis(Vl,t)}rotateY(t){return this.rotateOnAxis(Gl,t)}rotateZ(t){return this.rotateOnAxis(Hl,t)}translateOnAxis(t,e){return kl.copy(t).applyQuaternion(this.quaternion),this.position.add(kl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Vl,t)}translateY(t){return this.translateOnAxis(Gl,t)}translateZ(t){return this.translateOnAxis(Hl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(gn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ns.copy(t):Ns.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Gi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?gn.lookAt(Gi,Ns,this.up):gn.lookAt(Ns,Gi,this.up),this.quaternion.setFromRotationMatrix(gn),s&&(gn.extractRotation(s.matrixWorld),pi.setFromRotationMatrix(gn),this.quaternion.premultiply(pi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Dt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Wl),mi.child=t,this.dispatchEvent(mi),mi.child=null):Dt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Yh),so.child=t,this.dispatchEvent(so),so.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),gn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),gn.multiply(t.parent.matrixWorld)),t.applyMatrix4(gn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Wl),mi.child=t,this.dispatchEvent(mi),mi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Gi,t,Xh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Gi,qh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){let m=l[c];r(t.shapes,m)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),d=a(t.images),m=a(t.shapes),h=a(t.skeletons),g=a(t.animations),p=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),d.length>0&&(n.images=d),m.length>0&&(n.shapes=m),h.length>0&&(n.skeletons=h),g.length>0&&(n.animations=g),p.length>0&&(n.nodes=p)}return n.object=s,n;function a(o){let l=[];for(let c in o){let d=o[c];delete d.metadata,l.push(d)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),t.pivot!==null&&(this.pivot=t.pivot.clone()),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Fe.DEFAULT_UP=new z(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Mn=class extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}},$h={type:"move"},Ci=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Mn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Mn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Mn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let y of t.hand.values()){let f=e.getJointPose(y,n),u=this._getHandJoint(c,y);f!==null&&(u.matrix.fromArray(f.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=f.radius),u.visible=f!==null}let d=c.joints["index-finger-tip"],m=c.joints["thumb-tip"],h=d.position.distanceTo(m.position),g=.02,p=.005;c.inputState.pinching&&h>g+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=g-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent($h)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new Mn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Gc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},In={h:0,s:0,l:0},Us={h:0,s:0,l:0};function ro(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Yt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ie){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,$t.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=$t.workingColorSpace){return this.r=t,this.g=e,this.b=n,$t.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=$t.workingColorSpace){if(t=Bh(t,1),e=qt(e,0,1),n=qt(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=ro(a,r,t+1/3),this.g=ro(a,r,t),this.b=ro(a,r,t-1/3)}return $t.colorSpaceToWorking(this,s),this}setStyle(t,e=Ie){function n(r){r!==void 0&&parseFloat(r)<1&&Pt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Pt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Pt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ie){let n=Gc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Pt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Sn(t.r),this.g=Sn(t.g),this.b=Sn(t.b),this}copyLinearToSRGB(t){return this.r=Ti(t.r),this.g=Ti(t.g),this.b=Ti(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ie){return $t.workingToColorSpace(Ae.copy(this),t),Math.round(qt(Ae.r*255,0,255))*65536+Math.round(qt(Ae.g*255,0,255))*256+Math.round(qt(Ae.b*255,0,255))}getHexString(t=Ie){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=$t.workingColorSpace){$t.workingToColorSpace(Ae.copy(this),e);let n=Ae.r,s=Ae.g,r=Ae.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,d=(o+a)/2;if(o===a)l=0,c=0;else{let m=a-o;switch(c=d<=.5?m/(a+o):m/(2-a-o),a){case n:l=(s-r)/m+(s<r?6:0);break;case s:l=(r-n)/m+2;break;case r:l=(n-s)/m+4;break}l/=6}return t.h=l,t.s=c,t.l=d,t}getRGB(t,e=$t.workingColorSpace){return $t.workingToColorSpace(Ae.copy(this),e),t.r=Ae.r,t.g=Ae.g,t.b=Ae.b,t}getStyle(t=Ie){$t.workingToColorSpace(Ae.copy(this),t);let e=Ae.r,n=Ae.g,s=Ae.b;return t!==Ie?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(In),this.setHSL(In.h+t,In.s+e,In.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(In),t.getHSL(Us);let n=Qa(In.h,Us.h,e),s=Qa(In.s,Us.s,e),r=Qa(In.l,Us.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ae=new Yt;Yt.NAMES=Gc;var ns=class extends Fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ln,this.environmentIntensity=1,this.environmentRotation=new ln,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}},Je=new z,xn=new z,ao=new z,_n=new z,gi=new z,xi=new z,Xl=new z,oo=new z,lo=new z,co=new z,ho=new ue,uo=new ue,fo=new ue,Un=class i{constructor(t=new z,e=new z,n=new z){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Je.subVectors(t,e),s.cross(Je);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Je.subVectors(s,e),xn.subVectors(n,e),ao.subVectors(t,e);let a=Je.dot(Je),o=Je.dot(xn),l=Je.dot(ao),c=xn.dot(xn),d=xn.dot(ao),m=a*c-o*o;if(m===0)return r.set(0,0,0),null;let h=1/m,g=(c*l-o*d)*h,p=(a*d-o*l)*h;return r.set(1-g-p,p,g)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,_n)===null?!1:_n.x>=0&&_n.y>=0&&_n.x+_n.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,_n)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,_n.x),l.addScaledVector(a,_n.y),l.addScaledVector(o,_n.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return ho.setScalar(0),uo.setScalar(0),fo.setScalar(0),ho.fromBufferAttribute(t,e),uo.fromBufferAttribute(t,n),fo.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(ho,r.x),a.addScaledVector(uo,r.y),a.addScaledVector(fo,r.z),a}static isFrontFacing(t,e,n,s){return Je.subVectors(n,e),xn.subVectors(t,e),Je.cross(xn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Je.subVectors(this.c,this.b),xn.subVectors(this.a,this.b),Je.cross(xn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;gi.subVectors(s,n),xi.subVectors(r,n),oo.subVectors(t,n);let l=gi.dot(oo),c=xi.dot(oo);if(l<=0&&c<=0)return e.copy(n);lo.subVectors(t,s);let d=gi.dot(lo),m=xi.dot(lo);if(d>=0&&m<=d)return e.copy(s);let h=l*m-d*c;if(h<=0&&l>=0&&d<=0)return a=l/(l-d),e.copy(n).addScaledVector(gi,a);co.subVectors(t,r);let g=gi.dot(co),p=xi.dot(co);if(p>=0&&g<=p)return e.copy(r);let y=g*c-l*p;if(y<=0&&c>=0&&p<=0)return o=c/(c-p),e.copy(n).addScaledVector(xi,o);let f=d*p-g*m;if(f<=0&&m-d>=0&&g-p>=0)return Xl.subVectors(r,s),o=(m-d)/(m-d+(g-p)),e.copy(s).addScaledVector(Xl,o);let u=1/(f+y+h);return a=y*u,o=h*u,e.copy(n).addScaledVector(gi,a).addScaledVector(xi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},cn=class{constructor(t=new z(1/0,1/0,1/0),e=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Ke.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Ke.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Ke.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Ke):Ke.fromBufferAttribute(r,a),Ke.applyMatrix4(t.matrixWorld),this.expandByPoint(Ke);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Fs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Fs.copy(n.boundingBox)),Fs.applyMatrix4(t.matrixWorld),this.union(Fs)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ke),Ke.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Hi),Os.subVectors(this.max,Hi),_i.subVectors(t.a,Hi),yi.subVectors(t.b,Hi),vi.subVectors(t.c,Hi),Pn.subVectors(yi,_i),Ln.subVectors(vi,yi),$n.subVectors(_i,vi);let e=[0,-Pn.z,Pn.y,0,-Ln.z,Ln.y,0,-$n.z,$n.y,Pn.z,0,-Pn.x,Ln.z,0,-Ln.x,$n.z,0,-$n.x,-Pn.y,Pn.x,0,-Ln.y,Ln.x,0,-$n.y,$n.x,0];return!po(e,_i,yi,vi,Os)||(e=[1,0,0,0,1,0,0,0,1],!po(e,_i,yi,vi,Os))?!1:(Bs.crossVectors(Pn,Ln),e=[Bs.x,Bs.y,Bs.z],po(e,_i,yi,vi,Os))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ke).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ke).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(yn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),yn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),yn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),yn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),yn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),yn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),yn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),yn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(yn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},yn=[new z,new z,new z,new z,new z,new z,new z,new z],Ke=new z,Fs=new cn,_i=new z,yi=new z,vi=new z,Pn=new z,Ln=new z,$n=new z,Hi=new z,Os=new z,Bs=new z,Zn=new z;function po(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Zn.fromArray(i,r);let o=s.x*Math.abs(Zn.x)+s.y*Math.abs(Zn.y)+s.z*Math.abs(Zn.z),l=t.dot(Zn),c=e.dot(Zn),d=n.dot(Zn);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}var fe=new z,zs=new Qt,Zh=0,pe=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Zh++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Co,this.updateRanges=[],this.gpuType=qe,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)zs.fromBufferAttribute(this,e),zs.applyMatrix3(t),this.setXY(e,zs.x,zs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix3(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix4(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyNormalMatrix(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.transformDirection(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Vi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ne(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Vi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Vi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Vi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Vi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ne(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ne(e,this.array),n=Ne(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Ne(e,this.array),n=Ne(n,this.array),s=Ne(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Ne(e,this.array),n=Ne(n,this.array),s=Ne(s,this.array),r=Ne(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Co&&(t.usage=this.usage),t}};var is=class extends pe{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var ss=class extends pe{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Me=class extends pe{constructor(t,e,n){super(new Float32Array(t),e,n)}},Jh=new cn,Wi=new z,mo=new z,hn=class{constructor(t=new z,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Jh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Wi.subVectors(t,this.center);let e=Wi.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Wi,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(mo.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Wi.copy(t.center).add(mo)),this.expandByPoint(Wi.copy(t.center).sub(mo))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Kh=0,Xe=new re,go=new Fe,Mi=new z,ke=new cn,Xi=new cn,_e=new z,Pe=class i extends wn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Kh++}),this.uuid=As(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Fh(t)?ss:is)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ot().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Xe.makeRotationFromQuaternion(t),this.applyMatrix4(Xe),this}rotateX(t){return Xe.makeRotationX(t),this.applyMatrix4(Xe),this}rotateY(t){return Xe.makeRotationY(t),this.applyMatrix4(Xe),this}rotateZ(t){return Xe.makeRotationZ(t),this.applyMatrix4(Xe),this}translate(t,e,n){return Xe.makeTranslation(t,e,n),this.applyMatrix4(Xe),this}scale(t,e,n){return Xe.makeScale(t,e,n),this.applyMatrix4(Xe),this}lookAt(t){return go.lookAt(t),go.updateMatrix(),this.applyMatrix4(go.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Mi).negate(),this.translate(Mi.x,Mi.y,Mi.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Me(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Pt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new cn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Dt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];ke.setFromBufferAttribute(r),this.morphTargetsRelative?(_e.addVectors(this.boundingBox.min,ke.min),this.boundingBox.expandByPoint(_e),_e.addVectors(this.boundingBox.max,ke.max),this.boundingBox.expandByPoint(_e)):(this.boundingBox.expandByPoint(ke.min),this.boundingBox.expandByPoint(ke.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Dt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new hn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Dt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(t){let n=this.boundingSphere.center;if(ke.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Xi.setFromBufferAttribute(o),this.morphTargetsRelative?(_e.addVectors(ke.min,Xi.min),ke.expandByPoint(_e),_e.addVectors(ke.max,Xi.max),ke.expandByPoint(_e)):(ke.expandByPoint(Xi.min),ke.expandByPoint(Xi.max))}ke.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)_e.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(_e));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)_e.fromBufferAttribute(o,c),l&&(Mi.fromBufferAttribute(t,c),_e.add(Mi)),s=Math.max(s,n.distanceToSquared(_e))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Dt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Dt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new pe(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let x=0;x<n.count;x++)o[x]=new z,l[x]=new z;let c=new z,d=new z,m=new z,h=new Qt,g=new Qt,p=new Qt,y=new z,f=new z;function u(x,M,B){c.fromBufferAttribute(n,x),d.fromBufferAttribute(n,M),m.fromBufferAttribute(n,B),h.fromBufferAttribute(r,x),g.fromBufferAttribute(r,M),p.fromBufferAttribute(r,B),d.sub(c),m.sub(c),g.sub(h),p.sub(h);let R=1/(g.x*p.y-p.x*g.y);isFinite(R)&&(y.copy(d).multiplyScalar(p.y).addScaledVector(m,-g.y).multiplyScalar(R),f.copy(m).multiplyScalar(g.x).addScaledVector(d,-p.x).multiplyScalar(R),o[x].add(y),o[M].add(y),o[B].add(y),l[x].add(f),l[M].add(f),l[B].add(f))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let x=0,M=v.length;x<M;++x){let B=v[x],R=B.start,O=B.count;for(let k=R,F=R+O;k<F;k+=3)u(t.getX(k+0),t.getX(k+1),t.getX(k+2))}let b=new z,S=new z,C=new z,T=new z;function E(x){C.fromBufferAttribute(s,x),T.copy(C);let M=o[x];b.copy(M),b.sub(C.multiplyScalar(C.dot(M))).normalize(),S.crossVectors(T,M);let R=S.dot(l[x])<0?-1:1;a.setXYZW(x,b.x,b.y,b.z,R)}for(let x=0,M=v.length;x<M;++x){let B=v[x],R=B.start,O=B.count;for(let k=R,F=R+O;k<F;k+=3)E(t.getX(k+0)),E(t.getX(k+1)),E(t.getX(k+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new pe(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,g=n.count;h<g;h++)n.setXYZ(h,0,0,0);let s=new z,r=new z,a=new z,o=new z,l=new z,c=new z,d=new z,m=new z;if(t)for(let h=0,g=t.count;h<g;h+=3){let p=t.getX(h+0),y=t.getX(h+1),f=t.getX(h+2);s.fromBufferAttribute(e,p),r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,f),d.subVectors(a,r),m.subVectors(s,r),d.cross(m),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,y),c.fromBufferAttribute(n,f),o.add(d),l.add(d),c.add(d),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(y,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let h=0,g=e.count;h<g;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),d.subVectors(a,r),m.subVectors(s,r),d.cross(m),n.setXYZ(h+0,d.x,d.y,d.z),n.setXYZ(h+1,d.x,d.y,d.z),n.setXYZ(h+2,d.x,d.y,d.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)_e.fromBufferAttribute(t,e),_e.normalize(),t.setXYZ(e,_e.x,_e.y,_e.z)}toNonIndexed(){function t(o,l){let c=o.array,d=o.itemSize,m=o.normalized,h=new c.constructor(l.length*d),g=0,p=0;for(let y=0,f=l.length;y<f;y++){o.isInterleavedBufferAttribute?g=l[y]*o.data.stride+o.offset:g=l[y]*d;for(let u=0;u<d;u++)h[p++]=c[g++]}return new pe(h,d,m)}if(this.index===null)return Pt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let d=0,m=c.length;d<m;d++){let h=c[d],g=t(h,n);l.push(g)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],d=[];for(let m=0,h=c.length;m<h;m++){let g=c[m];d.push(g.toJSON(t.data))}d.length>0&&(s[l]=d,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let c in s){let d=s[c];this.setAttribute(c,d.clone(e))}let r=t.morphAttributes;for(let c in r){let d=[],m=r[c];for(let h=0,g=m.length;h<g;h++)d.push(m[h].clone(e));this.morphAttributes[c]=d}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,d=a.length;c<d;c++){let m=a[c];this.addGroup(m.start,m.count,m.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}};var jh=0,Tn=class extends wn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:jh++}),this.uuid=As(),this.name="",this.type="Material",this.blending=Qn,this.side=bn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=rr,this.blendDst=ar,this.blendEquation=Fn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Yt(0,0,0),this.blendAlpha=0,this.depthFunc=ti,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Eo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=jn,this.stencilZFail=jn,this.stencilZPass=jn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Pt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Pt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Qn&&(n.blending=this.blending),this.side!==bn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==rr&&(n.blendSrc=this.blendSrc),this.blendDst!==ar&&(n.blendDst=this.blendDst),this.blendEquation!==Fn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ti&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Eo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==jn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==jn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==jn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var vn=new z,xo=new z,ks=new z,Dn=new z,_o=new z,Vs=new z,yo=new z,Ri=class{constructor(t=new z,e=new z(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,vn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=vn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(vn.copy(this.origin).addScaledVector(this.direction,e),vn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){xo.copy(t).add(e).multiplyScalar(.5),ks.copy(e).sub(t).normalize(),Dn.copy(this.origin).sub(xo);let r=t.distanceTo(e)*.5,a=-this.direction.dot(ks),o=Dn.dot(this.direction),l=-Dn.dot(ks),c=Dn.lengthSq(),d=Math.abs(1-a*a),m,h,g,p;if(d>0)if(m=a*l-o,h=a*o-l,p=r*d,m>=0)if(h>=-p)if(h<=p){let y=1/d;m*=y,h*=y,g=m*(m+a*h+2*o)+h*(a*m+h+2*l)+c}else h=r,m=Math.max(0,-(a*h+o)),g=-m*m+h*(h+2*l)+c;else h=-r,m=Math.max(0,-(a*h+o)),g=-m*m+h*(h+2*l)+c;else h<=-p?(m=Math.max(0,-(-a*r+o)),h=m>0?-r:Math.min(Math.max(-r,-l),r),g=-m*m+h*(h+2*l)+c):h<=p?(m=0,h=Math.min(Math.max(-r,-l),r),g=h*(h+2*l)+c):(m=Math.max(0,-(a*r+o)),h=m>0?r:Math.min(Math.max(-r,-l),r),g=-m*m+h*(h+2*l)+c);else h=a>0?-r:r,m=Math.max(0,-(a*h+o)),g=-m*m+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,m),s&&s.copy(xo).addScaledVector(ks,h),g}intersectSphere(t,e){vn.subVectors(t.center,this.origin);let n=vn.dot(this.direction),s=vn.dot(vn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,d=1/this.direction.y,m=1/this.direction.z,h=this.origin;return c>=0?(n=(t.min.x-h.x)*c,s=(t.max.x-h.x)*c):(n=(t.max.x-h.x)*c,s=(t.min.x-h.x)*c),d>=0?(r=(t.min.y-h.y)*d,a=(t.max.y-h.y)*d):(r=(t.max.y-h.y)*d,a=(t.min.y-h.y)*d),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),m>=0?(o=(t.min.z-h.z)*m,l=(t.max.z-h.z)*m):(o=(t.max.z-h.z)*m,l=(t.min.z-h.z)*m),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,vn)!==null}intersectTriangle(t,e,n,s,r){_o.subVectors(e,t),Vs.subVectors(n,t),yo.crossVectors(_o,Vs);let a=this.direction.dot(yo),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Dn.subVectors(this.origin,t);let l=o*this.direction.dot(Vs.crossVectors(Dn,Vs));if(l<0)return null;let c=o*this.direction.dot(_o.cross(Dn));if(c<0||l+c>a)return null;let d=-o*Dn.dot(yo);return d<0?null:this.at(d/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},On=class extends Tn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Yt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.combine=Uo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},ql=new re,Jn=new Ri,Gs=new hn,Yl=new z,Hs=new z,Ws=new z,Xs=new z,vo=new z,qs=new z,$l=new z,Ys=new z,be=class extends Fe{constructor(t=new Pe,e=new On){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){qs.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let d=o[l],m=r[l];d!==0&&(vo.fromBufferAttribute(m,t),a?qs.addScaledVector(vo,d):qs.addScaledVector(vo.sub(e),d))}e.add(qs)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Gs.copy(n.boundingSphere),Gs.applyMatrix4(r),Jn.copy(t.ray).recast(t.near),!(Gs.containsPoint(Jn.origin)===!1&&(Jn.intersectSphere(Gs,Yl)===null||Jn.origin.distanceToSquared(Yl)>(t.far-t.near)**2))&&(ql.copy(r).invert(),Jn.copy(t.ray).applyMatrix4(ql),!(n.boundingBox!==null&&Jn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Jn)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,d=r.attributes.uv1,m=r.attributes.normal,h=r.groups,g=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,y=h.length;p<y;p++){let f=h[p],u=a[f.materialIndex],v=Math.max(f.start,g.start),b=Math.min(o.count,Math.min(f.start+f.count,g.start+g.count));for(let S=v,C=b;S<C;S+=3){let T=o.getX(S),E=o.getX(S+1),x=o.getX(S+2);s=$s(this,u,t,n,c,d,m,T,E,x),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{let p=Math.max(0,g.start),y=Math.min(o.count,g.start+g.count);for(let f=p,u=y;f<u;f+=3){let v=o.getX(f),b=o.getX(f+1),S=o.getX(f+2);s=$s(this,a,t,n,c,d,m,v,b,S),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,y=h.length;p<y;p++){let f=h[p],u=a[f.materialIndex],v=Math.max(f.start,g.start),b=Math.min(l.count,Math.min(f.start+f.count,g.start+g.count));for(let S=v,C=b;S<C;S+=3){let T=S,E=S+1,x=S+2;s=$s(this,u,t,n,c,d,m,T,E,x),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=f.materialIndex,e.push(s))}}else{let p=Math.max(0,g.start),y=Math.min(l.count,g.start+g.count);for(let f=p,u=y;f<u;f+=3){let v=f,b=f+1,S=f+2;s=$s(this,a,t,n,c,d,m,v,b,S),s&&(s.faceIndex=Math.floor(f/3),e.push(s))}}}};function Qh(i,t,e,n,s,r,a,o){let l;if(t.side===Le?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===bn,o),l===null)return null;Ys.copy(o),Ys.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Ys);return c<e.near||c>e.far?null:{distance:c,point:Ys.clone(),object:i}}function $s(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Hs),i.getVertexPosition(l,Ws),i.getVertexPosition(c,Xs);let d=Qh(i,t,e,n,Hs,Ws,Xs,$l);if(d){let m=new z;Un.getBarycoord($l,Hs,Ws,Xs,m),s&&(d.uv=Un.getInterpolatedAttribute(s,o,l,c,m,new Qt)),r&&(d.uv1=Un.getInterpolatedAttribute(r,o,l,c,m,new Qt)),a&&(d.normal=Un.getInterpolatedAttribute(a,o,l,c,m,new z),d.normal.dot(n.direction)>0&&d.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new z,materialIndex:0};Un.getNormal(Hs,Ws,Xs,h.normal),d.face=h,d.barycoord=m}return d}var rs=class extends Ue{constructor(t=null,e=1,n=1,s,r,a,o,l,c=ye,d=ye,m,h){super(null,a,o,l,c,d,s,r,m,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var as=class extends pe{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Si=new re,Zl=new re,Zs=[],Jl=new cn,tu=new re,qi=new be,Yi=new hn,os=class extends be{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new as(new Float32Array(n*16),16),this.previousInstanceMatrix=null,this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,tu)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new cn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Si),Jl.copy(t.boundingBox).applyMatrix4(Si),this.boundingBox.union(Jl)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new hn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Si),Yi.copy(t.boundingSphere).applyMatrix4(Si),this.boundingSphere.union(Yi)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.previousInstanceMatrix!==null&&(this.previousInstanceMatrix=t.previousInstanceMatrix.clone()),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(qi.geometry=this.geometry,qi.material=this.material,qi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Yi.copy(this.boundingSphere),Yi.applyMatrix4(n),t.ray.intersectsSphere(Yi)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Si),Zl.multiplyMatrices(n,Si),qi.matrixWorld=Zl,qi.raycast(t,Zs);for(let a=0,o=Zs.length;a<o;a++){let l=Zs[a];l.instanceId=r,l.object=this,e.push(l)}Zs.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new as(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new rs(new Float32Array(s*this.count),s,this.count,$r,qe));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Mo=new z,eu=new z,nu=new Ot,sn=class{constructor(t=new z(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Mo.subVectors(n,e).cross(eu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(Mo),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||nu.getNormalMatrix(t),s=this.coplanarPoint(Mo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Kn=new hn,iu=new Qt(.5,.5),Js=new z,ls=class{constructor(t=new sn,e=new sn,n=new sn,s=new sn,r=new sn,a=new sn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=je,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],d=r[4],m=r[5],h=r[6],g=r[7],p=r[8],y=r[9],f=r[10],u=r[11],v=r[12],b=r[13],S=r[14],C=r[15];if(s[0].setComponents(c-a,g-d,u-p,C-v).normalize(),s[1].setComponents(c+a,g+d,u+p,C+v).normalize(),s[2].setComponents(c+o,g+m,u+y,C+b).normalize(),s[3].setComponents(c-o,g-m,u-y,C-b).normalize(),n)s[4].setComponents(l,h,f,S).normalize(),s[5].setComponents(c-l,g-h,u-f,C-S).normalize();else if(s[4].setComponents(c-l,g-h,u-f,C-S).normalize(),e===je)s[5].setComponents(c+l,g+h,u+f,C+S).normalize();else if(e===Ki)s[5].setComponents(l,h,f,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Kn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Kn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Kn)}intersectsSprite(t){Kn.center.set(0,0,0);let e=iu.distanceTo(t.center);return Kn.radius=.7071067811865476+e,Kn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Kn)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Js.x=s.normal.x>0?t.max.x:t.min.x,Js.y=s.normal.y>0?t.max.y:t.min.y,Js.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Js)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ii=class extends Tn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Yt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},Mr=new z,Sr=new z,Kl=new re,$i=new Ri,Ks=new hn,So=new z,jl=new z,br=class extends Fe{constructor(t=new Pe,e=new Ii){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Mr.fromBufferAttribute(e,s-1),Sr.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Mr.distanceTo(Sr);t.setAttribute("lineDistance",new Me(n,1))}else Pt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ks.copy(n.boundingSphere),Ks.applyMatrix4(s),Ks.radius+=r,t.ray.intersectsSphere(Ks)===!1)return;Kl.copy(s).invert(),$i.copy(t.ray).applyMatrix4(Kl);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,d=n.index,h=n.attributes.position;if(d!==null){let g=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let y=g,f=p-1;y<f;y+=c){let u=d.getX(y),v=d.getX(y+1),b=js(this,t,$i,l,u,v,y);b&&e.push(b)}if(this.isLineLoop){let y=d.getX(p-1),f=d.getX(g),u=js(this,t,$i,l,y,f,p-1);u&&e.push(u)}}else{let g=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let y=g,f=p-1;y<f;y+=c){let u=js(this,t,$i,l,y,y+1,y);u&&e.push(u)}if(this.isLineLoop){let y=js(this,t,$i,l,p-1,g,p-1);y&&e.push(y)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function js(i,t,e,n,s,r,a){let o=i.geometry.attributes.position;if(Mr.fromBufferAttribute(o,s),Sr.fromBufferAttribute(o,r),e.distanceSqToSegment(Mr,Sr,So,jl)>n)return;So.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(So);if(!(c<t.near||c>t.far))return{distance:c,point:jl.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}var Ql=new z,tc=new z,cs=class extends br{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Ql.fromBufferAttribute(e,s),tc.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Ql.distanceTo(tc);t.setAttribute("lineDistance",new Me(n,1))}else Pt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var wr=class extends Tn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Yt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},ec=new re,Ro=new Ri,Qs=new hn,tr=new z,hs=class extends Fe{constructor(t=new Pe,e=new wr){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Qs.copy(n.boundingSphere),Qs.applyMatrix4(s),Qs.radius+=r,t.ray.intersectsSphere(Qs)===!1)return;ec.copy(s).invert(),Ro.copy(t.ray).applyMatrix4(ec);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,m=n.attributes.position;if(c!==null){let h=Math.max(0,a.start),g=Math.min(c.count,a.start+a.count);for(let p=h,y=g;p<y;p++){let f=c.getX(p);tr.fromBufferAttribute(m,f),nc(tr,f,l,s,t,e,this)}}else{let h=Math.max(0,a.start),g=Math.min(m.count,a.start+a.count);for(let p=h,y=g;p<y;p++)tr.fromBufferAttribute(m,p),nc(tr,p,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function nc(i,t,e,n,s,r,a){let o=Ro.distanceSqToPoint(i);if(o<e){let l=new z;Ro.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}var us=class extends Ue{constructor(t=[],e=Gn,n,s,r,a,o,l,c,d){super(t,e,n,s,r,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}};var Bn=class extends Ue{constructor(t,e,n=tn,s,r,a,o=ye,l=ye,c,d=an,m=1){if(d!==an&&d!==Wn)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:t,height:e,depth:m};super(h,s,r,a,o,l,d,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ei(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Tr=class extends Bn{constructor(t,e=tn,n=Gn,s,r,a=ye,o=ye,l,c=an){let d={width:t,height:t,depth:1},m=[d,d,d,d,d,d];super(t,t,e,n,s,r,a,o,l,c),this.image=m,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},ds=class extends Ue{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Pi=class i extends Pe{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],d=[],m=[],h=0,g=0;p("z","y","x",-1,-1,n,e,t,a,r,0),p("z","y","x",1,-1,n,e,-t,a,r,1),p("x","z","y",1,1,t,n,e,s,a,2),p("x","z","y",1,-1,t,n,-e,s,a,3),p("x","y","z",1,-1,t,e,n,s,r,4),p("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Me(c,3)),this.setAttribute("normal",new Me(d,3)),this.setAttribute("uv",new Me(m,2));function p(y,f,u,v,b,S,C,T,E,x,M){let B=S/E,R=C/x,O=S/2,k=C/2,F=T/2,H=E+1,V=x+1,D=0,st=0,tt=new z;for(let ht=0;ht<V;ht++){let gt=ht*R-k;for(let j=0;j<H;j++){let _t=j*B-O;tt[y]=_t*v,tt[f]=gt*b,tt[u]=F,c.push(tt.x,tt.y,tt.z),tt[y]=0,tt[f]=0,tt[u]=T>0?1:-1,d.push(tt.x,tt.y,tt.z),m.push(j/E),m.push(1-ht/x),D+=1}}for(let ht=0;ht<x;ht++)for(let gt=0;gt<E;gt++){let j=h+gt+H*ht,_t=h+gt+H*(ht+1),Ht=h+(gt+1)+H*(ht+1),zt=h+(gt+1)+H*ht;l.push(j,_t,zt),l.push(_t,Ht,zt),st+=6}o.addGroup(g,st,M),g+=st,h+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Ar=class i extends Pe{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],a=[];o(s),c(n),d(),this.setAttribute("position",new Me(r,3)),this.setAttribute("normal",new Me(r.slice(),3)),this.setAttribute("uv",new Me(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(v){let b=new z,S=new z,C=new z;for(let T=0;T<e.length;T+=3)g(e[T+0],b),g(e[T+1],S),g(e[T+2],C),l(b,S,C,v)}function l(v,b,S,C){let T=C+1,E=[];for(let x=0;x<=T;x++){E[x]=[];let M=v.clone().lerp(S,x/T),B=b.clone().lerp(S,x/T),R=T-x;for(let O=0;O<=R;O++)O===0&&x===T?E[x][O]=M:E[x][O]=M.clone().lerp(B,O/R)}for(let x=0;x<T;x++)for(let M=0;M<2*(T-x)-1;M++){let B=Math.floor(M/2);M%2===0?(h(E[x][B+1]),h(E[x+1][B]),h(E[x][B])):(h(E[x][B+1]),h(E[x+1][B+1]),h(E[x+1][B]))}}function c(v){let b=new z;for(let S=0;S<r.length;S+=3)b.x=r[S+0],b.y=r[S+1],b.z=r[S+2],b.normalize().multiplyScalar(v),r[S+0]=b.x,r[S+1]=b.y,r[S+2]=b.z}function d(){let v=new z;for(let b=0;b<r.length;b+=3){v.x=r[b+0],v.y=r[b+1],v.z=r[b+2];let S=f(v)/2/Math.PI+.5,C=u(v)/Math.PI+.5;a.push(S,1-C)}p(),m()}function m(){for(let v=0;v<a.length;v+=6){let b=a[v+0],S=a[v+2],C=a[v+4],T=Math.max(b,S,C),E=Math.min(b,S,C);T>.9&&E<.1&&(b<.2&&(a[v+0]+=1),S<.2&&(a[v+2]+=1),C<.2&&(a[v+4]+=1))}}function h(v){r.push(v.x,v.y,v.z)}function g(v,b){let S=v*3;b.x=t[S+0],b.y=t[S+1],b.z=t[S+2]}function p(){let v=new z,b=new z,S=new z,C=new z,T=new Qt,E=new Qt,x=new Qt;for(let M=0,B=0;M<r.length;M+=9,B+=6){v.set(r[M+0],r[M+1],r[M+2]),b.set(r[M+3],r[M+4],r[M+5]),S.set(r[M+6],r[M+7],r[M+8]),T.set(a[B+0],a[B+1]),E.set(a[B+2],a[B+3]),x.set(a[B+4],a[B+5]),C.copy(v).add(b).add(S).divideScalar(3);let R=f(C);y(T,B+0,v,R),y(E,B+2,b,R),y(x,B+4,S,R)}}function y(v,b,S,C){C<0&&v.x===1&&(a[b]=v.x-1),S.x===0&&S.z===0&&(a[b]=C/2/Math.PI+.5)}function f(v){return Math.atan2(v.z,-v.x)}function u(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.detail)}};var fs=class i extends Ar{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var ps=class i extends Pe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,d=l+1,m=t/o,h=e/l,g=[],p=[],y=[],f=[];for(let u=0;u<d;u++){let v=u*h-a;for(let b=0;b<c;b++){let S=b*m-r;p.push(S,-v,0),y.push(0,0,1),f.push(b/o),f.push(1-u/l)}}for(let u=0;u<l;u++)for(let v=0;v<o;v++){let b=v+c*u,S=v+c*(u+1),C=v+1+c*(u+1),T=v+1+c*u;g.push(b,S,T),g.push(S,C,T)}this.setIndex(g),this.setAttribute("position",new Me(p,3)),this.setAttribute("normal",new Me(y,3)),this.setAttribute("uv",new Me(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};function si(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(Pt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Re(i){let t={};for(let e=0;e<i.length;e++){let n=si(i[e]);for(let s in n)t[s]=n[s]}return t}function su(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function jo(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:$t.workingColorSpace}var Hc={clone:si,merge:Re},ru=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,au=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ce=class extends Tn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ru,this.fragmentShader=au,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=si(t.uniforms),this.uniformsGroups=su(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},Er=class extends Ce{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Cr=class extends Tn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Rc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Rr=class extends Tn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function er(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}var zn=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ir=class extends zn{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:wo,endingEnd:wo}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case To:r=t,o=2*e-n;break;case Ao:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case To:a=t,l=2*n-e;break;case Ao:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,d=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*d,this._offsetNext=a*d}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,d=this._offsetPrev,m=this._offsetNext,h=this._weightPrev,g=this._weightNext,p=(n-e)/(s-e),y=p*p,f=y*p,u=-h*f+2*h*y-h*p,v=(1+h)*f+(-1.5-2*h)*y+(-.5+h)*p+1,b=(-1-g)*f+(1.5+g)*y+.5*p,S=g*f-g*y;for(let C=0;C!==o;++C)r[C]=u*a[d+C]+v*a[c+C]+b*a[l+C]+S*a[m+C];return r}},Pr=class extends zn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,d=(n-e)/(s-e),m=1-d;for(let h=0;h!==o;++h)r[h]=a[c+h]*m+a[l+h]*d;return r}},Lr=class extends zn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Dr=class extends zn{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,d=this.settings||this.DefaultSettings_,m=d.inTangents,h=d.outTangents;if(!m||!h){let y=(n-e)/(s-e),f=1-y;for(let u=0;u!==o;++u)r[u]=a[c+u]*f+a[l+u]*y;return r}let g=o*2,p=t-1;for(let y=0;y!==o;++y){let f=a[c+y],u=a[l+y],v=p*g+y*2,b=h[v],S=h[v+1],C=t*g+y*2,T=m[C],E=m[C+1],x=(n-e)/(s-e),M,B,R,O,k;for(let F=0;F<8;F++){M=x*x,B=M*x,R=1-x,O=R*R,k=O*R;let V=k*e+3*O*x*b+3*R*M*T+B*s-n;if(Math.abs(V)<1e-10)break;let D=3*O*(b-e)+6*R*x*(T-b)+3*M*(s-T);if(Math.abs(D)<1e-10)break;x=x-V/D,x=Math.max(0,Math.min(1,x))}r[y]=k*f+3*O*x*S+3*R*M*E+B*u}return r}},Ge=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=er(e,this.TimeBufferType),this.values=er(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:er(t.times,Array),values:er(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Lr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Pr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ir(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Dr(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.settings=this.settings),e}setInterpolation(t){let e;switch(t){case Zi:e=this.InterpolantFactoryMethodDiscrete;break;case gr:e=this.InterpolantFactoryMethodLinear;break;case sr:e=this.InterpolantFactoryMethodSmooth;break;case bo:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Pt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Zi;case this.InterpolantFactoryMethodLinear:return gr;case this.InterpolantFactoryMethodSmooth:return sr;case this.InterpolantFactoryMethodBezier:return bo}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Dt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Dt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Dt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Dt("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&Oh(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Dt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===sr,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],d=t[o+1];if(c!==d&&(o!==1||c!==t[0]))if(s)l=!0;else{let m=o*n,h=m-n,g=m+n;for(let p=0;p!==n;++p){let y=e[m+p];if(y!==e[h+p]||y!==e[g+p]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let m=o*n,h=a*n;for(let g=0;g!==n;++g)e[h+g]=e[m+g]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};Ge.prototype.ValueTypeName="";Ge.prototype.TimeBufferType=Float32Array;Ge.prototype.ValueBufferType=Float32Array;Ge.prototype.DefaultInterpolation=gr;var kn=class extends Ge{constructor(t,e,n){super(t,e,n)}};kn.prototype.ValueTypeName="bool";kn.prototype.ValueBufferType=Array;kn.prototype.DefaultInterpolation=Zi;kn.prototype.InterpolantFactoryMethodLinear=void 0;kn.prototype.InterpolantFactoryMethodSmooth=void 0;var Nr=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}};Nr.prototype.ValueTypeName="color";var Ur=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}};Ur.prototype.ValueTypeName="number";var Fr=class extends zn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let d=c+o;c!==d;c+=4)on.slerpFlat(r,0,a,c-o,a,c,l);return r}},ms=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new Fr(this.times,this.values,this.getValueSize(),t)}};ms.prototype.ValueTypeName="quaternion";ms.prototype.InterpolantFactoryMethodSmooth=void 0;var Vn=class extends Ge{constructor(t,e,n){super(t,e,n)}};Vn.prototype.ValueTypeName="string";Vn.prototype.ValueBufferType=Array;Vn.prototype.DefaultInterpolation=Zi;Vn.prototype.InterpolantFactoryMethodLinear=void 0;Vn.prototype.InterpolantFactoryMethodSmooth=void 0;var Or=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}};Or.prototype.ValueTypeName="vector";var Br=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(d){o++,r===!1&&s.onStart!==void 0&&s.onStart(d,a,o),r=!0},this.itemEnd=function(d){a++,s.onProgress!==void 0&&s.onProgress(d,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(d){s.onError!==void 0&&s.onError(d)},this.resolveURL=function(d){return l?l(d):d},this.setURLModifier=function(d){return l=d,this},this.addHandler=function(d,m){return c.push(d,m),this},this.removeHandler=function(d){let m=c.indexOf(d);return m!==-1&&c.splice(m,2),this},this.getHandler=function(d){for(let m=0,h=c.length;m<h;m+=2){let g=c[m],p=c[m+1];if(g.global&&(g.lastIndex=0),g.test(d))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Wc=new Br,zr=class{constructor(t){this.manager=t!==void 0?t:Wc,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};zr.DEFAULT_MATERIAL_NAME="__DEFAULT";var nr=new z,ir=new on,nn=new z,gs=class extends Fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new re,this.projectionMatrix=new re,this.projectionMatrixInverse=new re,this.coordinateSystem=je,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(nr,ir,nn),nn.x===1&&nn.y===1&&nn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(nr,ir,nn.set(1,1,1)).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorld.decompose(nr,ir,nn),nn.x===1&&nn.y===1&&nn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(nr,ir,nn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Nn=new z,ic=new Qt,sc=new Qt,Ee=class extends gs{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=xr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(ja*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return xr*2*Math.atan(Math.tan(ja*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Nn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Nn.x,Nn.y).multiplyScalar(-t/Nn.z),Nn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Nn.x,Nn.y).multiplyScalar(-t/Nn.z)}getViewSize(t,e){return this.getViewBounds(t,ic,sc),e.subVectors(sc,ic)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(ja*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var xs=class extends gs{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}};var bi=-90,wi=1,kr=class extends Fe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ee(bi,wi,t,e);s.layers=this.layers,this.add(s);let r=new Ee(bi,wi,t,e);r.layers=this.layers,this.add(r);let a=new Ee(bi,wi,t,e);a.layers=this.layers,this.add(a);let o=new Ee(bi,wi,t,e);o.layers=this.layers,this.add(o);let l=new Ee(bi,wi,t,e);l.layers=this.layers,this.add(l);let c=new Ee(bi,wi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===je)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Ki)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,d]=this.children,m=t.getRenderTarget(),h=t.getActiveCubeFace(),g=t.getActiveMipmapLevel(),p=t.xr.enabled;t.xr.enabled=!1;let y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let f=!1;t.isWebGLRenderer===!0?f=t.state.buffers.depth.getReversed():f=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),f&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),f&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),f&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),f&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),f&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,s),f&&t.autoClear===!1&&t.clearDepth(),t.render(e,d),t.setRenderTarget(m,h,g),t.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Vr=class extends Ee{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var Qo="\\[\\]\\.:\\/",ou=new RegExp("["+Qo+"]","g"),tl="[^"+Qo+"]",lu="[^"+Qo.replace("\\.","")+"]",cu=/((?:WC+[\/:])*)/.source.replace("WC",tl),hu=/(WCOD+)?/.source.replace("WCOD",lu),uu=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",tl),du=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",tl),fu=new RegExp("^"+cu+hu+uu+du+"$"),pu=["material","materials","bones","map"],Io=class{constructor(t,e,n){let s=n||oe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},oe=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(ou,"")}static parseTrackName(t){let e=fu.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);pu.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Pt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Dt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Dt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Dt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let d=0;d<t.length;d++)if(t[d].name===c){c=d;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Dt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Dt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Dt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Dt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;Dt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Dt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Dt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};oe.Composite=Io;oe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};oe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};oe.prototype.GetterByBindingType=[oe.prototype._getValue_direct,oe.prototype._getValue_array,oe.prototype._getValue_arrayElement,oe.prototype._getValue_toArray];oe.prototype.SetterByBindingTypeAndVersioning=[[oe.prototype._setValue_direct,oe.prototype._setValue_direct_setNeedsUpdate,oe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_array,oe.prototype._setValue_array_setNeedsUpdate,oe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_arrayElement,oe.prototype._setValue_arrayElement_setNeedsUpdate,oe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_fromArray,oe.prototype._setValue_fromArray_setNeedsUpdate,oe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var pg=new Float32Array(1);function el(i,t,e,n){let s=mu(n);switch(e){case $o:return i*t;case $r:return i*t/s.components*s.byteLength;case Zr:return i*t/s.components*s.byteLength;case ii:return i*t*2/s.components*s.byteLength;case Jr:return i*t*2/s.components*s.byteLength;case Zo:return i*t*3/s.components*s.byteLength;case Ye:return i*t*4/s.components*s.byteLength;case Kr:return i*t*4/s.components*s.byteLength;case Ms:case Ss:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case bs:case ws:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Qr:case ea:return Math.max(i,16)*Math.max(t,8)/4;case jr:case ta:return Math.max(i,8)*Math.max(t,8)/2;case na:case ia:case ra:case aa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case sa:case oa:case la:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ca:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ha:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ua:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case da:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case fa:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case pa:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case ma:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ga:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case xa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case _a:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ya:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case va:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Ma:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Sa:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case ba:case wa:case Ta:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Aa:case Ea:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Ca:case Ra:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function mu(i){switch(i){case We:case Wo:return{byteLength:1,components:1};case Di:case Xo:case dn:return{byteLength:2,components:1};case qr:case Yr:return{byteLength:2,components:4};case tn:case Xr:case qe:return{byteLength:4,components:1};case qo:case Yo:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"183"}}));typeof window<"u"&&(window.__THREE__?Pt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="183");function fh(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function xu(i){let t=new WeakMap;function e(o,l){let c=o.array,d=o.usage,m=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,d),o.onUploadCallback();let g;if(c instanceof Float32Array)g=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)g=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?g=i.HALF_FLOAT:g=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)g=i.SHORT;else if(c instanceof Uint32Array)g=i.UNSIGNED_INT;else if(c instanceof Int32Array)g=i.INT;else if(c instanceof Int8Array)g=i.BYTE;else if(c instanceof Uint8Array)g=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)g=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:g,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:m}}function n(o,l,c){let d=l.array,m=l.updateRanges;if(i.bindBuffer(c,o),m.length===0)i.bufferSubData(c,0,d);else{m.sort((g,p)=>g.start-p.start);let h=0;for(let g=1;g<m.length;g++){let p=m[h],y=m[g];y.start<=p.start+p.count+1?p.count=Math.max(p.count,y.start+y.count-p.start):(++h,m[h]=y)}m.length=h+1;for(let g=0,p=m.length;g<p;g++){let y=m[g];i.bufferSubData(c,y.start*d.BYTES_PER_ELEMENT,d,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let d=t.get(o);(!d||d.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var _u=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,yu=`#ifdef USE_ALPHAHASH
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
#endif`,vu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Mu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Su=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,bu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,wu=`#ifdef USE_AOMAP
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
#endif`,Tu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Au=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
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
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Eu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Cu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ru=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Iu=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Pu=`#ifdef USE_IRIDESCENCE
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
#endif`,Lu=`#ifdef USE_BUMPMAP
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
#endif`,Du=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
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
	#endif
#endif`,Nu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Uu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Fu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ou=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Bu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,zu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,ku=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Vu=`#define PI 3.141592653589793
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
} // validated`,Gu=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Hu=`vec3 transformedNormal = objectNormal;
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
#endif`,Wu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Xu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,qu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Yu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,$u="gl_FragColor = linearToOutputTexel( gl_FragColor );",Zu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ju=`#ifdef USE_ENVMAP
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
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Ku=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,ju=`#ifdef USE_ENVMAP
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
#endif`,Qu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,td=`#ifdef USE_ENVMAP
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
#endif`,ed=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,nd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,id=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,sd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,rd=`#ifdef USE_GRADIENTMAP
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
}`,ad=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,od=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ld=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,cd=`uniform bool receiveShadow;
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
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
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
#endif`,hd=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
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
#endif`,ud=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,dd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,fd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,pd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,md=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
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
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
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
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
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
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
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
#endif`,gd=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
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
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
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
		return v;
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
	vec3 f0 = material.specularColorBlended;
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
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
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
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
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
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
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
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
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
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,xd=`
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
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
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
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
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
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
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
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
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
#endif`,_d=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
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
#endif`,yd=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,vd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Md=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Sd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,bd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,wd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Td=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ad=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Ed=`#if defined( USE_POINTS_UV )
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
#endif`,Cd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Rd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Id=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Pd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ld=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Dd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Nd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ud=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Fd=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Od=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Bd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,zd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,kd=`#ifdef USE_NORMALMAP
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
#endif`,Vd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Gd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Hd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Wd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Xd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,qd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Yd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,$d=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Zd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Jd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Kd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,jd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Qd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,tf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
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
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,ef=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,nf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,sf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,rf=`#ifdef USE_SKINNING
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
#endif`,af=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,of=`#ifdef USE_SKINNING
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
#endif`,lf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,cf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,hf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,uf=`#ifndef saturate
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
vec3 CineonToneMapping( vec3 color ) {
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
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,df=`#ifdef USE_TRANSMISSION
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
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,ff=`#ifdef USE_TRANSMISSION
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
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,pf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,mf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,gf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,xf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,_f=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,yf=`uniform sampler2D t2D;
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
}`,vf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Mf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wf=`#include <common>
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
	#include <morphinstance_vertex>
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
}`,Tf=`#if DEPTH_PACKING == 3200
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
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Af=`#define DISTANCE
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
	#include <morphinstance_vertex>
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
}`,Ef=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Cf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Rf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,If=`uniform float scale;
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
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Pf=`uniform vec3 diffuse;
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Lf=`#include <common>
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
	#include <morphinstance_vertex>
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
}`,Df=`uniform vec3 diffuse;
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
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
}`,Nf=`#define LAMBERT
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
	#include <morphinstance_vertex>
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
}`,Uf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
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
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
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
}`,Ff=`#define MATCAP
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
	#include <morphinstance_vertex>
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
}`,Of=`#define MATCAP
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
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
}`,Bf=`#define NORMAL
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
	#include <morphinstance_vertex>
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
}`,zf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,kf=`#define PHONG
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
	#include <morphinstance_vertex>
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
}`,Vf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
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
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
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
}`,Gf=`#define STANDARD
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
	#include <morphinstance_vertex>
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
}`,Hf=`#define STANDARD
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
#ifdef USE_DISPERSION
	uniform float dispersion;
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
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
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
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
}`,Wf=`#define TOON
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
	#include <morphinstance_vertex>
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
}`,Xf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
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
}`,qf=`uniform float size;
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
	#include <morphinstance_vertex>
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
}`,Yf=`uniform vec3 diffuse;
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
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
}`,$f=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
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
}`,Zf=`uniform vec3 color;
uniform float opacity;
#include <common>
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
	#include <premultiplied_alpha_fragment>
}`,Jf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
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
}`,Kf=`uniform vec3 diffuse;
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
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
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
}`,Bt={alphahash_fragment:_u,alphahash_pars_fragment:yu,alphamap_fragment:vu,alphamap_pars_fragment:Mu,alphatest_fragment:Su,alphatest_pars_fragment:bu,aomap_fragment:wu,aomap_pars_fragment:Tu,batching_pars_vertex:Au,batching_vertex:Eu,begin_vertex:Cu,beginnormal_vertex:Ru,bsdfs:Iu,iridescence_fragment:Pu,bumpmap_pars_fragment:Lu,clipping_planes_fragment:Du,clipping_planes_pars_fragment:Nu,clipping_planes_pars_vertex:Uu,clipping_planes_vertex:Fu,color_fragment:Ou,color_pars_fragment:Bu,color_pars_vertex:zu,color_vertex:ku,common:Vu,cube_uv_reflection_fragment:Gu,defaultnormal_vertex:Hu,displacementmap_pars_vertex:Wu,displacementmap_vertex:Xu,emissivemap_fragment:qu,emissivemap_pars_fragment:Yu,colorspace_fragment:$u,colorspace_pars_fragment:Zu,envmap_fragment:Ju,envmap_common_pars_fragment:Ku,envmap_pars_fragment:ju,envmap_pars_vertex:Qu,envmap_physical_pars_fragment:hd,envmap_vertex:td,fog_vertex:ed,fog_pars_vertex:nd,fog_fragment:id,fog_pars_fragment:sd,gradientmap_pars_fragment:rd,lightmap_pars_fragment:ad,lights_lambert_fragment:od,lights_lambert_pars_fragment:ld,lights_pars_begin:cd,lights_toon_fragment:ud,lights_toon_pars_fragment:dd,lights_phong_fragment:fd,lights_phong_pars_fragment:pd,lights_physical_fragment:md,lights_physical_pars_fragment:gd,lights_fragment_begin:xd,lights_fragment_maps:_d,lights_fragment_end:yd,logdepthbuf_fragment:vd,logdepthbuf_pars_fragment:Md,logdepthbuf_pars_vertex:Sd,logdepthbuf_vertex:bd,map_fragment:wd,map_pars_fragment:Td,map_particle_fragment:Ad,map_particle_pars_fragment:Ed,metalnessmap_fragment:Cd,metalnessmap_pars_fragment:Rd,morphinstance_vertex:Id,morphcolor_vertex:Pd,morphnormal_vertex:Ld,morphtarget_pars_vertex:Dd,morphtarget_vertex:Nd,normal_fragment_begin:Ud,normal_fragment_maps:Fd,normal_pars_fragment:Od,normal_pars_vertex:Bd,normal_vertex:zd,normalmap_pars_fragment:kd,clearcoat_normal_fragment_begin:Vd,clearcoat_normal_fragment_maps:Gd,clearcoat_pars_fragment:Hd,iridescence_pars_fragment:Wd,opaque_fragment:Xd,packing:qd,premultiplied_alpha_fragment:Yd,project_vertex:$d,dithering_fragment:Zd,dithering_pars_fragment:Jd,roughnessmap_fragment:Kd,roughnessmap_pars_fragment:jd,shadowmap_pars_fragment:Qd,shadowmap_pars_vertex:tf,shadowmap_vertex:ef,shadowmask_pars_fragment:nf,skinbase_vertex:sf,skinning_pars_vertex:rf,skinning_vertex:af,skinnormal_vertex:of,specularmap_fragment:lf,specularmap_pars_fragment:cf,tonemapping_fragment:hf,tonemapping_pars_fragment:uf,transmission_fragment:df,transmission_pars_fragment:ff,uv_pars_fragment:pf,uv_pars_vertex:mf,uv_vertex:gf,worldpos_vertex:xf,background_vert:_f,background_frag:yf,backgroundCube_vert:vf,backgroundCube_frag:Mf,cube_vert:Sf,cube_frag:bf,depth_vert:wf,depth_frag:Tf,distance_vert:Af,distance_frag:Ef,equirect_vert:Cf,equirect_frag:Rf,linedashed_vert:If,linedashed_frag:Pf,meshbasic_vert:Lf,meshbasic_frag:Df,meshlambert_vert:Nf,meshlambert_frag:Uf,meshmatcap_vert:Ff,meshmatcap_frag:Of,meshnormal_vert:Bf,meshnormal_frag:zf,meshphong_vert:kf,meshphong_frag:Vf,meshphysical_vert:Gf,meshphysical_frag:Hf,meshtoon_vert:Wf,meshtoon_frag:Xf,points_vert:qf,points_frag:Yf,shadow_vert:$f,shadow_frag:Zf,sprite_vert:Jf,sprite_frag:Kf},ft={common:{diffuse:{value:new Yt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ot},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ot}},envmap:{envMap:{value:null},envMapRotation:{value:new Ot},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ot}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ot}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ot},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ot},normalScale:{value:new Qt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ot},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ot}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ot}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ot}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Yt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Yt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0},uvTransform:{value:new Ot}},sprite:{diffuse:{value:new Yt(16777215)},opacity:{value:1},center:{value:new Qt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ot},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0}}},pn={basic:{uniforms:Re([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.fog]),vertexShader:Bt.meshbasic_vert,fragmentShader:Bt.meshbasic_frag},lambert:{uniforms:Re([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new Yt(0)},envMapIntensity:{value:1}}]),vertexShader:Bt.meshlambert_vert,fragmentShader:Bt.meshlambert_frag},phong:{uniforms:Re([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new Yt(0)},specular:{value:new Yt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Bt.meshphong_vert,fragmentShader:Bt.meshphong_frag},standard:{uniforms:Re([ft.common,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.roughnessmap,ft.metalnessmap,ft.fog,ft.lights,{emissive:{value:new Yt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag},toon:{uniforms:Re([ft.common,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.gradientmap,ft.fog,ft.lights,{emissive:{value:new Yt(0)}}]),vertexShader:Bt.meshtoon_vert,fragmentShader:Bt.meshtoon_frag},matcap:{uniforms:Re([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,{matcap:{value:null}}]),vertexShader:Bt.meshmatcap_vert,fragmentShader:Bt.meshmatcap_frag},points:{uniforms:Re([ft.points,ft.fog]),vertexShader:Bt.points_vert,fragmentShader:Bt.points_frag},dashed:{uniforms:Re([ft.common,ft.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Bt.linedashed_vert,fragmentShader:Bt.linedashed_frag},depth:{uniforms:Re([ft.common,ft.displacementmap]),vertexShader:Bt.depth_vert,fragmentShader:Bt.depth_frag},normal:{uniforms:Re([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,{opacity:{value:1}}]),vertexShader:Bt.meshnormal_vert,fragmentShader:Bt.meshnormal_frag},sprite:{uniforms:Re([ft.sprite,ft.fog]),vertexShader:Bt.sprite_vert,fragmentShader:Bt.sprite_frag},background:{uniforms:{uvTransform:{value:new Ot},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Bt.background_vert,fragmentShader:Bt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ot}},vertexShader:Bt.backgroundCube_vert,fragmentShader:Bt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Bt.cube_vert,fragmentShader:Bt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Bt.equirect_vert,fragmentShader:Bt.equirect_frag},distance:{uniforms:Re([ft.common,ft.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Bt.distance_vert,fragmentShader:Bt.distance_frag},shadow:{uniforms:Re([ft.lights,ft.fog,{color:{value:new Yt(0)},opacity:{value:1}}]),vertexShader:Bt.shadow_vert,fragmentShader:Bt.shadow_frag}};pn.physical={uniforms:Re([pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ot},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ot},clearcoatNormalScale:{value:new Qt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ot},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ot},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ot},sheen:{value:0},sheenColor:{value:new Yt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ot},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ot},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ot},transmissionSamplerSize:{value:new Qt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ot},attenuationDistance:{value:0},attenuationColor:{value:new Yt(0)},specularColor:{value:new Yt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ot},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ot},anisotropyVector:{value:new Qt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ot}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag};var La={r:0,b:0,g:0},ri=new ln,jf=new re;function Qf(i,t,e,n,s,r){let a=new Yt(0),o=s===!0?0:1,l,c,d=null,m=0,h=null;function g(v){let b=v.isScene===!0?v.background:null;if(b&&b.isTexture){let S=v.backgroundBlurriness>0;b=t.get(b,S)}return b}function p(v){let b=!1,S=g(v);S===null?f(a,o):S&&S.isColor&&(f(S,1),b=!0);let C=i.xr.getEnvironmentBlendMode();C==="additive"?e.buffers.color.setClear(0,0,0,1,r):C==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||b)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function y(v,b){let S=g(b);S&&(S.isCubeTexture||S.mapping===ys)?(c===void 0&&(c=new be(new Pi(1,1,1),new Ce({name:"BackgroundCubeMaterial",uniforms:si(pn.backgroundCube.uniforms),vertexShader:pn.backgroundCube.vertexShader,fragmentShader:pn.backgroundCube.fragmentShader,side:Le,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(C,T,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),ri.copy(b.backgroundRotation),ri.x*=-1,ri.y*=-1,ri.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(ri.y*=-1,ri.z*=-1),c.material.uniforms.envMap.value=S,c.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(jf.makeRotationFromEuler(ri)),c.material.toneMapped=$t.getTransfer(S.colorSpace)!==ee,(d!==S||m!==S.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,d=S,m=S.version,h=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new be(new ps(2,2),new Ce({name:"BackgroundMaterial",uniforms:si(pn.background.uniforms),vertexShader:pn.background.vertexShader,fragmentShader:pn.background.fragmentShader,side:bn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,l.material.toneMapped=$t.getTransfer(S.colorSpace)!==ee,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(d!==S||m!==S.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,d=S,m=S.version,h=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function f(v,b){v.getRGB(La,jo(i)),e.buffers.color.setClear(La.r,La.g,La.b,b,r)}function u(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,b=1){a.set(v),o=b,f(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,f(a,o)},render:p,addToRenderList:y,dispose:u}}function tp(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null),r=s,a=!1;function o(R,O,k,F,H){let V=!1,D=m(R,F,k,O);r!==D&&(r=D,c(r.object)),V=g(R,F,k,H),V&&p(R,F,k,H),H!==null&&t.update(H,i.ELEMENT_ARRAY_BUFFER),(V||a)&&(a=!1,S(R,O,k,F),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}function l(){return i.createVertexArray()}function c(R){return i.bindVertexArray(R)}function d(R){return i.deleteVertexArray(R)}function m(R,O,k,F){let H=F.wireframe===!0,V=n[O.id];V===void 0&&(V={},n[O.id]=V);let D=R.isInstancedMesh===!0?R.id:0,st=V[D];st===void 0&&(st={},V[D]=st);let tt=st[k.id];tt===void 0&&(tt={},st[k.id]=tt);let ht=tt[H];return ht===void 0&&(ht=h(l()),tt[H]=ht),ht}function h(R){let O=[],k=[],F=[];for(let H=0;H<e;H++)O[H]=0,k[H]=0,F[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:k,attributeDivisors:F,object:R,attributes:{},index:null}}function g(R,O,k,F){let H=r.attributes,V=O.attributes,D=0,st=k.getAttributes();for(let tt in st)if(st[tt].location>=0){let gt=H[tt],j=V[tt];if(j===void 0&&(tt==="instanceMatrix"&&R.instanceMatrix&&(j=R.instanceMatrix),tt==="instanceColor"&&R.instanceColor&&(j=R.instanceColor)),gt===void 0||gt.attribute!==j||j&&gt.data!==j.data)return!0;D++}return r.attributesNum!==D||r.index!==F}function p(R,O,k,F){let H={},V=O.attributes,D=0,st=k.getAttributes();for(let tt in st)if(st[tt].location>=0){let gt=V[tt];gt===void 0&&(tt==="instanceMatrix"&&R.instanceMatrix&&(gt=R.instanceMatrix),tt==="instanceColor"&&R.instanceColor&&(gt=R.instanceColor));let j={};j.attribute=gt,gt&&gt.data&&(j.data=gt.data),H[tt]=j,D++}r.attributes=H,r.attributesNum=D,r.index=F}function y(){let R=r.newAttributes;for(let O=0,k=R.length;O<k;O++)R[O]=0}function f(R){u(R,0)}function u(R,O){let k=r.newAttributes,F=r.enabledAttributes,H=r.attributeDivisors;k[R]=1,F[R]===0&&(i.enableVertexAttribArray(R),F[R]=1),H[R]!==O&&(i.vertexAttribDivisor(R,O),H[R]=O)}function v(){let R=r.newAttributes,O=r.enabledAttributes;for(let k=0,F=O.length;k<F;k++)O[k]!==R[k]&&(i.disableVertexAttribArray(k),O[k]=0)}function b(R,O,k,F,H,V,D){D===!0?i.vertexAttribIPointer(R,O,k,H,V):i.vertexAttribPointer(R,O,k,F,H,V)}function S(R,O,k,F){y();let H=F.attributes,V=k.getAttributes(),D=O.defaultAttributeValues;for(let st in V){let tt=V[st];if(tt.location>=0){let ht=H[st];if(ht===void 0&&(st==="instanceMatrix"&&R.instanceMatrix&&(ht=R.instanceMatrix),st==="instanceColor"&&R.instanceColor&&(ht=R.instanceColor)),ht!==void 0){let gt=ht.normalized,j=ht.itemSize,_t=t.get(ht);if(_t===void 0)continue;let Ht=_t.buffer,zt=_t.type,J=_t.bytesPerElement,it=zt===i.INT||zt===i.UNSIGNED_INT||ht.gpuType===Xr;if(ht.isInterleavedBufferAttribute){let rt=ht.data,It=rt.stride,Et=ht.offset;if(rt.isInstancedInterleavedBuffer){for(let wt=0;wt<tt.locationSize;wt++)u(tt.location+wt,rt.meshPerAttribute);R.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let wt=0;wt<tt.locationSize;wt++)f(tt.location+wt);i.bindBuffer(i.ARRAY_BUFFER,Ht);for(let wt=0;wt<tt.locationSize;wt++)b(tt.location+wt,j/tt.locationSize,zt,gt,It*J,(Et+j/tt.locationSize*wt)*J,it)}else{if(ht.isInstancedBufferAttribute){for(let rt=0;rt<tt.locationSize;rt++)u(tt.location+rt,ht.meshPerAttribute);R.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=ht.meshPerAttribute*ht.count)}else for(let rt=0;rt<tt.locationSize;rt++)f(tt.location+rt);i.bindBuffer(i.ARRAY_BUFFER,Ht);for(let rt=0;rt<tt.locationSize;rt++)b(tt.location+rt,j/tt.locationSize,zt,gt,j*J,j/tt.locationSize*rt*J,it)}}else if(D!==void 0){let gt=D[st];if(gt!==void 0)switch(gt.length){case 2:i.vertexAttrib2fv(tt.location,gt);break;case 3:i.vertexAttrib3fv(tt.location,gt);break;case 4:i.vertexAttrib4fv(tt.location,gt);break;default:i.vertexAttrib1fv(tt.location,gt)}}}}v()}function C(){M();for(let R in n){let O=n[R];for(let k in O){let F=O[k];for(let H in F){let V=F[H];for(let D in V)d(V[D].object),delete V[D];delete F[H]}}delete n[R]}}function T(R){if(n[R.id]===void 0)return;let O=n[R.id];for(let k in O){let F=O[k];for(let H in F){let V=F[H];for(let D in V)d(V[D].object),delete V[D];delete F[H]}}delete n[R.id]}function E(R){for(let O in n){let k=n[O];for(let F in k){let H=k[F];if(H[R.id]===void 0)continue;let V=H[R.id];for(let D in V)d(V[D].object),delete V[D];delete H[R.id]}}}function x(R){for(let O in n){let k=n[O],F=R.isInstancedMesh===!0?R.id:0,H=k[F];if(H!==void 0){for(let V in H){let D=H[V];for(let st in D)d(D[st].object),delete D[st];delete H[V]}delete k[F],Object.keys(k).length===0&&delete n[O]}}}function M(){B(),a=!0,r!==s&&(r=s,c(r.object))}function B(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:M,resetDefaultState:B,dispose:C,releaseStatesOfGeometry:T,releaseStatesOfObject:x,releaseStatesOfProgram:E,initAttributes:y,enableAttribute:f,disableUnusedAttributes:v}}function ep(i,t,e){let n;function s(c){n=c}function r(c,d){i.drawArrays(n,c,d),e.update(d,n,1)}function a(c,d,m){m!==0&&(i.drawArraysInstanced(n,c,d,m),e.update(d,n,m))}function o(c,d,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,d,0,m);let g=0;for(let p=0;p<m;p++)g+=d[p];e.update(g,n,1)}function l(c,d,m,h){if(m===0)return;let g=t.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<c.length;p++)a(c[p],d[p],h[p]);else{g.multiDrawArraysInstancedWEBGL(n,c,0,d,0,h,0,m);let p=0;for(let y=0;y<m;y++)p+=d[y]*h[y];e.update(p,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function np(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let E=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(E){return!(E!==Ye&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(E){let x=E===dn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(E!==We&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==qe&&!x)}function l(E){if(E==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",d=l(c);d!==c&&(Pt("WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);let m=e.logarithmicDepthBuffer===!0,h=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),g=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),f=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),u=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),b=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),C=i.getParameter(i.MAX_SAMPLES),T=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:m,reversedDepthBuffer:h,maxTextures:g,maxVertexTextures:p,maxTextureSize:y,maxCubemapSize:f,maxAttributes:u,maxVertexUniforms:v,maxVaryings:b,maxFragmentUniforms:S,maxSamples:C,samples:T}}function ip(i){let t=this,e=null,n=0,s=!1,r=!1,a=new sn,o=new Ot,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(m,h){let g=m.length!==0||h||n!==0||s;return s=h,n=m.length,g},this.beginShadows=function(){r=!0,d(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(m,h){e=d(m,h,0)},this.setState=function(m,h,g){let p=m.clippingPlanes,y=m.clipIntersection,f=m.clipShadows,u=i.get(m);if(!s||p===null||p.length===0||r&&!f)r?d(null):c();else{let v=r?0:n,b=v*4,S=u.clippingState||null;l.value=S,S=d(p,h,b,g);for(let C=0;C!==b;++C)S[C]=e[C];u.clippingState=S,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function d(m,h,g,p){let y=m!==null?m.length:0,f=null;if(y!==0){if(f=l.value,p!==!0||f===null){let u=g+y*4,v=h.matrixWorldInverse;o.getNormalMatrix(v),(f===null||f.length<u)&&(f=new Float32Array(u));for(let b=0,S=g;b!==y;++b,S+=4)a.copy(m[b]).applyMatrix4(v,o),a.normal.toArray(f,S),f[S+3]=a.constant}l.value=f,l.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,f}}var Xn=4,Xc=[.125,.215,.35,.446,.526,.582],oi=20,sp=256,Es=new xs,qc=new Yt,nl=null,il=0,sl=0,rl=!1,rp=new z,Na=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=rp}=r;nl=this._renderer.getRenderTarget(),il=this._renderer.getActiveCubeFace(),sl=this._renderer.getActiveMipmapLevel(),rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Zc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=$c(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(nl,il,sl),this._renderer.xr.enabled=rl,t.scissorTest=!1,Ui(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Gn||t.mapping===ni?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),nl=this._renderer.getRenderTarget(),il=this._renderer.getActiveCubeFace(),sl=this._renderer.getActiveMipmapLevel(),rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Se,minFilter:Se,generateMipmaps:!1,type:dn,format:Ye,colorSpace:ei,depthBuffer:!1},s=Yc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Yc(t,e,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=ap(r)),this._blurMaterial=lp(r,t,e),this._ggxMaterial=op(r,t,e)}return s}_compileMaterial(t){let e=new be(new Pe,t);this._renderer.compile(e,Es)}_sceneToCubeUV(t,e,n,s,r){let l=new Ee(90,1,e,n),c=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],m=this._renderer,h=m.autoClear,g=m.toneMapping;m.getClearColor(qc),m.toneMapping=Qe,m.autoClear=!1,m.state.buffers.depth.getReversed()&&(m.setRenderTarget(s),m.clearDepth(),m.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new be(new Pi,new On({name:"PMREM.Background",side:Le,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,f=y.material,u=!1,v=t.background;v?v.isColor&&(f.color.copy(v),t.background=null,u=!0):(f.color.copy(qc),u=!0);for(let b=0;b<6;b++){let S=b%3;S===0?(l.up.set(0,c[b],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+d[b],r.y,r.z)):S===1?(l.up.set(0,0,c[b]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+d[b],r.z)):(l.up.set(0,c[b],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+d[b]));let C=this._cubeSize;Ui(s,S*C,b>2?C:0,C,C),m.setRenderTarget(s),u&&m.render(y,l),m.render(t,l)}m.toneMapping=g,m.autoClear=h,t.background=v}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Gn||t.mapping===ni;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Zc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=$c());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;Ui(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Es)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),d=e/(this._lodMeshes.length-1),m=Math.sqrt(c*c-d*d),h=0+c*1.25,g=m*h,{_lodMax:p}=this,y=this._sizeLods[n],f=3*y*(n>p-Xn?n-p+Xn:0),u=4*(this._cubeSize-y);l.envMap.value=t.texture,l.roughness.value=g,l.mipInt.value=p-e,Ui(r,f,u,3*y,2*y),s.setRenderTarget(r),s.render(o,Es),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=p-n,Ui(t,f,u,3*y,2*y),s.setRenderTarget(t),s.render(o,Es)}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Dt("blur direction must be either latitudinal or longitudinal!");let d=3,m=this._lodMeshes[s];m.material=c;let h=c.uniforms,g=this._sizeLods[n]-1,p=isFinite(r)?Math.PI/(2*g):2*Math.PI/(2*oi-1),y=r/p,f=isFinite(r)?1+Math.floor(d*y):oi;f>oi&&Pt(`sigmaRadians, ${r}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${oi}`);let u=[],v=0;for(let E=0;E<oi;++E){let x=E/y,M=Math.exp(-x*x/2);u.push(M),E===0?v+=M:E<f&&(v+=2*M)}for(let E=0;E<u.length;E++)u[E]=u[E]/v;h.envMap.value=t.texture,h.samples.value=f,h.weights.value=u,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);let{_lodMax:b}=this;h.dTheta.value=p,h.mipInt.value=b-n;let S=this._sizeLods[s],C=3*S*(s>b-Xn?s-b+Xn:0),T=4*(this._cubeSize-S);Ui(e,C,T,3*S,2*S),l.setRenderTarget(e),l.render(m,Es)}};function ap(i){let t=[],e=[],n=[],s=i,r=i-Xn+1+Xc.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-Xn?l=Xc[a-i+Xn-1]:a===0&&(l=0),e.push(l);let c=1/(o-2),d=-c,m=1+c,h=[d,d,m,d,m,m,d,d,m,m,d,m],g=6,p=6,y=3,f=2,u=1,v=new Float32Array(y*p*g),b=new Float32Array(f*p*g),S=new Float32Array(u*p*g);for(let T=0;T<g;T++){let E=T%3*2/3-1,x=T>2?0:-1,M=[E,x,0,E+2/3,x,0,E+2/3,x+1,0,E,x,0,E+2/3,x+1,0,E,x+1,0];v.set(M,y*p*T),b.set(h,f*p*T);let B=[T,T,T,T,T,T];S.set(B,u*p*T)}let C=new Pe;C.setAttribute("position",new pe(v,y)),C.setAttribute("uv",new pe(b,f)),C.setAttribute("faceIndex",new pe(S,u)),n.push(new be(C,null)),s>Xn&&s--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function Yc(i,t,e){let n=new Ve(i,t,e);return n.texture.mapping=ys,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ui(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function op(i,t,e){return new Ce({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:sp,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Oa(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function lp(i,t,e){let n=new Float32Array(oi),s=new z(0,1,0);return new Ce({name:"SphericalGaussianBlur",defines:{n:oi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Oa(),fragmentShader:`

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
		`,blending:un,depthTest:!1,depthWrite:!1})}function $c(){return new Ce({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Oa(),fragmentShader:`

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
		`,blending:un,depthTest:!1,depthWrite:!1})}function Zc(){return new Ce({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Oa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function Oa(){return`

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
	`}var Ua=class extends Ve{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new us(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Pi(5,5,5),r=new Ce({name:"CubemapFromEquirect",uniforms:si(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Le,blending:un});r.uniforms.tEquirect.value=e;let a=new be(s,r),o=e.minFilter;return e.minFilter===Hn&&(e.minFilter=Se),new kr(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}};function cp(i){let t=new WeakMap,e=new WeakMap,n=null;function s(h,g=!1){return h==null?null:g?a(h):r(h)}function r(h){if(h&&h.isTexture){let g=h.mapping;if(g===Gr||g===Hr)if(t.has(h)){let p=t.get(h).texture;return o(p,h.mapping)}else{let p=h.image;if(p&&p.height>0){let y=new Ua(p.height);return y.fromEquirectangularTexture(i,h),t.set(h,y),h.addEventListener("dispose",c),o(y.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){let g=h.mapping,p=g===Gr||g===Hr,y=g===Gn||g===ni;if(p||y){let f=e.get(h),u=f!==void 0?f.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==u)return n===null&&(n=new Na(i)),f=p?n.fromEquirectangular(h,f):n.fromCubemap(h,f),f.texture.pmremVersion=h.pmremVersion,e.set(h,f),f.texture;if(f!==void 0)return f.texture;{let v=h.image;return p&&v&&v.height>0||y&&v&&l(v)?(n===null&&(n=new Na(i)),f=p?n.fromEquirectangular(h):n.fromCubemap(h),f.texture.pmremVersion=h.pmremVersion,e.set(h,f),h.addEventListener("dispose",d),f.texture):null}}}return h}function o(h,g){return g===Gr?h.mapping=Gn:g===Hr&&(h.mapping=ni),h}function l(h){let g=0,p=6;for(let y=0;y<p;y++)h[y]!==void 0&&g++;return g===p}function c(h){let g=h.target;g.removeEventListener("dispose",c);let p=t.get(g);p!==void 0&&(t.delete(g),p.dispose())}function d(h){let g=h.target;g.removeEventListener("dispose",d);let p=e.get(g);p!==void 0&&(e.delete(g),p.dispose())}function m(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:m}}function hp(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Qi("WebGLRenderer: "+n+" extension not supported."),s}}}function up(i,t,e,n){let s={},r=new WeakMap;function a(m){let h=m.target;h.index!==null&&t.remove(h.index);for(let p in h.attributes)t.remove(h.attributes[p]);h.removeEventListener("dispose",a),delete s[h.id];let g=r.get(h);g&&(t.remove(g),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(m,h){return s[h.id]===!0||(h.addEventListener("dispose",a),s[h.id]=!0,e.memory.geometries++),h}function l(m){let h=m.attributes;for(let g in h)t.update(h[g],i.ARRAY_BUFFER)}function c(m){let h=[],g=m.index,p=m.attributes.position,y=0;if(p===void 0)return;if(g!==null){let v=g.array;y=g.version;for(let b=0,S=v.length;b<S;b+=3){let C=v[b+0],T=v[b+1],E=v[b+2];h.push(C,T,T,E,E,C)}}else{let v=p.array;y=p.version;for(let b=0,S=v.length/3-1;b<S;b+=3){let C=b+0,T=b+1,E=b+2;h.push(C,T,T,E,E,C)}}let f=new(p.count>=65535?ss:is)(h,1);f.version=y;let u=r.get(m);u&&t.remove(u),r.set(m,f)}function d(m){let h=r.get(m);if(h){let g=m.index;g!==null&&h.version<g.version&&c(m)}else c(m);return r.get(m)}return{get:o,update:l,getWireframeAttribute:d}}function dp(i,t,e){let n;function s(h){n=h}let r,a;function o(h){r=h.type,a=h.bytesPerElement}function l(h,g){i.drawElements(n,g,r,h*a),e.update(g,n,1)}function c(h,g,p){p!==0&&(i.drawElementsInstanced(n,g,r,h*a,p),e.update(g,n,p))}function d(h,g,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,g,0,r,h,0,p);let f=0;for(let u=0;u<p;u++)f+=g[u];e.update(f,n,1)}function m(h,g,p,y){if(p===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let u=0;u<h.length;u++)c(h[u]/a,g[u],y[u]);else{f.multiDrawElementsInstancedWEBGL(n,g,0,r,h,0,y,0,p);let u=0;for(let v=0;v<p;v++)u+=g[v]*y[v];e.update(u,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d,this.renderMultiDrawInstances=m}function fp(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Dt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function pp(i,t,e){let n=new WeakMap,s=new ue;function r(a,o,l){let c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,m=d!==void 0?d.length:0,h=n.get(o);if(h===void 0||h.count!==m){let M=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",M)};h!==void 0&&h.texture.dispose();let g=o.morphAttributes.position!==void 0,p=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],u=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],b=0;g===!0&&(b=1),p===!0&&(b=2),y===!0&&(b=3);let S=o.attributes.position.count*b,C=1;S>t.maxTextureSize&&(C=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);let T=new Float32Array(S*C*4*m),E=new ts(T,S,C,m);E.type=qe,E.needsUpdate=!0;let x=b*4;for(let B=0;B<m;B++){let R=f[B],O=u[B],k=v[B],F=S*C*4*B;for(let H=0;H<R.count;H++){let V=H*x;g===!0&&(s.fromBufferAttribute(R,H),T[F+V+0]=s.x,T[F+V+1]=s.y,T[F+V+2]=s.z,T[F+V+3]=0),p===!0&&(s.fromBufferAttribute(O,H),T[F+V+4]=s.x,T[F+V+5]=s.y,T[F+V+6]=s.z,T[F+V+7]=0),y===!0&&(s.fromBufferAttribute(k,H),T[F+V+8]=s.x,T[F+V+9]=s.y,T[F+V+10]=s.z,T[F+V+11]=k.itemSize===4?s.w:1)}}h={count:m,texture:E,size:new Qt(S,C)},n.set(o,h),o.addEventListener("dispose",M)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let g=0;for(let y=0;y<c.length;y++)g+=c[y];let p=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(i,"morphTargetBaseInfluence",p),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function mp(i,t,e,n,s){let r=new WeakMap;function a(c){let d=s.render.frame,m=c.geometry,h=t.get(c,m);if(r.get(h)!==d&&(t.update(h),r.set(h,d)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==d&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,d))),c.isSkinnedMesh){let g=c.skeleton;r.get(g)!==d&&(g.update(),r.set(g,d))}return h}function o(){r=new WeakMap}function l(c){let d=c.target;d.removeEventListener("dispose",l),n.releaseStatesOfObject(d),e.remove(d.instanceMatrix),d.instanceColor!==null&&e.remove(d.instanceColor)}return{update:a,dispose:o}}var gp={[Fo]:"LINEAR_TONE_MAPPING",[Oo]:"REINHARD_TONE_MAPPING",[Bo]:"CINEON_TONE_MAPPING",[zo]:"ACES_FILMIC_TONE_MAPPING",[Vo]:"AGX_TONE_MAPPING",[Go]:"NEUTRAL_TONE_MAPPING",[ko]:"CUSTOM_TONE_MAPPING"};function xp(i,t,e,n,s){let r=new Ve(t,e,{type:i,depthBuffer:n,stencilBuffer:s}),a=new Ve(t,e,{type:dn,depthBuffer:!1,stencilBuffer:!1}),o=new Pe;o.setAttribute("position",new Me([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new Me([0,2,0,0,2,0],2));let l=new Er({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),c=new be(o,l),d=new xs(-1,1,1,-1,0,1),m=null,h=null,g=!1,p,y=null,f=[],u=!1;this.setSize=function(v,b){r.setSize(v,b),a.setSize(v,b);for(let S=0;S<f.length;S++){let C=f[S];C.setSize&&C.setSize(v,b)}},this.setEffects=function(v){f=v,u=f.length>0&&f[0].isRenderPass===!0;let b=r.width,S=r.height;for(let C=0;C<f.length;C++){let T=f[C];T.setSize&&T.setSize(b,S)}},this.begin=function(v,b){if(g||v.toneMapping===Qe&&f.length===0)return!1;if(y=b,b!==null){let S=b.width,C=b.height;(r.width!==S||r.height!==C)&&this.setSize(S,C)}return u===!1&&v.setRenderTarget(r),p=v.toneMapping,v.toneMapping=Qe,!0},this.hasRenderPass=function(){return u},this.end=function(v,b){v.toneMapping=p,g=!0;let S=r,C=a;for(let T=0;T<f.length;T++){let E=f[T];if(E.enabled!==!1&&(E.render(v,C,S,b),E.needsSwap!==!1)){let x=S;S=C,C=x}}if(m!==v.outputColorSpace||h!==v.toneMapping){m=v.outputColorSpace,h=v.toneMapping,l.defines={},$t.getTransfer(m)===ee&&(l.defines.SRGB_TRANSFER="");let T=gp[h];T&&(l.defines[T]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=S.texture,v.setRenderTarget(y),v.render(c,d),y=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){r.dispose(),a.dispose(),o.dispose(),l.dispose()}}var ph=new Ue,ll=new Bn(1,1),mh=new ts,gh=new vr,xh=new us,Jc=[],Kc=[],jc=new Float32Array(16),Qc=new Float32Array(9),th=new Float32Array(4);function Oi(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Jc[s];if(r===void 0&&(r=new Float32Array(s),Jc[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function me(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ge(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Ba(i,t){let e=Kc[t];e===void 0&&(e=new Int32Array(t),Kc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function _p(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function yp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(me(e,t))return;i.uniform2fv(this.addr,t),ge(e,t)}}function vp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(me(e,t))return;i.uniform3fv(this.addr,t),ge(e,t)}}function Mp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(me(e,t))return;i.uniform4fv(this.addr,t),ge(e,t)}}function Sp(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(me(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ge(e,t)}else{if(me(e,n))return;th.set(n),i.uniformMatrix2fv(this.addr,!1,th),ge(e,n)}}function bp(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(me(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ge(e,t)}else{if(me(e,n))return;Qc.set(n),i.uniformMatrix3fv(this.addr,!1,Qc),ge(e,n)}}function wp(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(me(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ge(e,t)}else{if(me(e,n))return;jc.set(n),i.uniformMatrix4fv(this.addr,!1,jc),ge(e,n)}}function Tp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Ap(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(me(e,t))return;i.uniform2iv(this.addr,t),ge(e,t)}}function Ep(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(me(e,t))return;i.uniform3iv(this.addr,t),ge(e,t)}}function Cp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(me(e,t))return;i.uniform4iv(this.addr,t),ge(e,t)}}function Rp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Ip(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(me(e,t))return;i.uniform2uiv(this.addr,t),ge(e,t)}}function Pp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(me(e,t))return;i.uniform3uiv(this.addr,t),ge(e,t)}}function Lp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(me(e,t))return;i.uniform4uiv(this.addr,t),ge(e,t)}}function Dp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(ll.compareFunction=e.isReversedDepthBuffer()?Pa:Ia,r=ll):r=ph,e.setTexture2D(t||r,s)}function Np(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||gh,s)}function Up(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||xh,s)}function Fp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||mh,s)}function Op(i){switch(i){case 5126:return _p;case 35664:return yp;case 35665:return vp;case 35666:return Mp;case 35674:return Sp;case 35675:return bp;case 35676:return wp;case 5124:case 35670:return Tp;case 35667:case 35671:return Ap;case 35668:case 35672:return Ep;case 35669:case 35673:return Cp;case 5125:return Rp;case 36294:return Ip;case 36295:return Pp;case 36296:return Lp;case 35678:case 36198:case 36298:case 36306:case 35682:return Dp;case 35679:case 36299:case 36307:return Np;case 35680:case 36300:case 36308:case 36293:return Up;case 36289:case 36303:case 36311:case 36292:return Fp}}function Bp(i,t){i.uniform1fv(this.addr,t)}function zp(i,t){let e=Oi(t,this.size,2);i.uniform2fv(this.addr,e)}function kp(i,t){let e=Oi(t,this.size,3);i.uniform3fv(this.addr,e)}function Vp(i,t){let e=Oi(t,this.size,4);i.uniform4fv(this.addr,e)}function Gp(i,t){let e=Oi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Hp(i,t){let e=Oi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Wp(i,t){let e=Oi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Xp(i,t){i.uniform1iv(this.addr,t)}function qp(i,t){i.uniform2iv(this.addr,t)}function Yp(i,t){i.uniform3iv(this.addr,t)}function $p(i,t){i.uniform4iv(this.addr,t)}function Zp(i,t){i.uniform1uiv(this.addr,t)}function Jp(i,t){i.uniform2uiv(this.addr,t)}function Kp(i,t){i.uniform3uiv(this.addr,t)}function jp(i,t){i.uniform4uiv(this.addr,t)}function Qp(i,t,e){let n=this.cache,s=t.length,r=Ba(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=ll:a=ph;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function tm(i,t,e){let n=this.cache,s=t.length,r=Ba(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||gh,r[a])}function em(i,t,e){let n=this.cache,s=t.length,r=Ba(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||xh,r[a])}function nm(i,t,e){let n=this.cache,s=t.length,r=Ba(e,s);me(n,r)||(i.uniform1iv(this.addr,r),ge(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||mh,r[a])}function im(i){switch(i){case 5126:return Bp;case 35664:return zp;case 35665:return kp;case 35666:return Vp;case 35674:return Gp;case 35675:return Hp;case 35676:return Wp;case 5124:case 35670:return Xp;case 35667:case 35671:return qp;case 35668:case 35672:return Yp;case 35669:case 35673:return $p;case 5125:return Zp;case 36294:return Jp;case 36295:return Kp;case 36296:return jp;case 35678:case 36198:case 36298:case 36306:case 35682:return Qp;case 35679:case 36299:case 36307:return tm;case 35680:case 36300:case 36308:case 36293:return em;case 36289:case 36303:case 36311:case 36292:return nm}}var cl=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Op(e.type)}},hl=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=im(e.type)}},ul=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},al=/(\w+)(\])?(\[|\.)?/g;function eh(i,t){i.seq.push(t),i.map[t.id]=t}function sm(i,t,e){let n=i.name,s=n.length;for(al.lastIndex=0;;){let r=al.exec(n),a=al.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){eh(e,c===void 0?new cl(o,i,t):new hl(o,i,t));break}else{let m=e.map[o];m===void 0&&(m=new ul(o),eh(e,m)),e=m}}}var Fi=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);sm(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function nh(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var rm=37297,am=0;function om(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var ih=new Ot;function lm(i){$t._getMatrix(ih,$t.workingColorSpace,i);let t=`mat3( ${ih.elements.map(e=>e.toFixed(4))} )`;switch($t.getTransfer(i)){case Ji:return[t,"LinearTransferOETF"];case ee:return[t,"sRGBTransferOETF"];default:return Pt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function sh(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+om(i.getShaderSource(t),o)}else return r}function cm(i,t){let e=lm(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var hm={[Fo]:"Linear",[Oo]:"Reinhard",[Bo]:"Cineon",[zo]:"ACESFilmic",[Vo]:"AgX",[Go]:"Neutral",[ko]:"Custom"};function um(i,t){let e=hm[t];return e===void 0?(Pt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Da=new z;function dm(){$t.getLuminanceCoefficients(Da);let i=Da.x.toFixed(4),t=Da.y.toFixed(4),e=Da.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function fm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Rs).join(`
`)}function pm(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function mm(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function Rs(i){return i!==""}function rh(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ah(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var gm=/^[ \t]*#include +<([\w\d./]+)>/gm;function dl(i){return i.replace(gm,_m)}var xm=new Map;function _m(i,t){let e=Bt[t];if(e===void 0){let n=xm.get(t);if(n!==void 0)e=Bt[n],Pt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return dl(e)}var ym=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function oh(i){return i.replace(ym,vm)}function vm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function lh(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var Mm={[_s]:"SHADOWMAP_TYPE_PCF",[Li]:"SHADOWMAP_TYPE_VSM"};function Sm(i){return Mm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var bm={[Gn]:"ENVMAP_TYPE_CUBE",[ni]:"ENVMAP_TYPE_CUBE",[ys]:"ENVMAP_TYPE_CUBE_UV"};function wm(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":bm[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var Tm={[ni]:"ENVMAP_MODE_REFRACTION"};function Am(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Tm[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Em={[Uo]:"ENVMAP_BLENDING_MULTIPLY",[Ac]:"ENVMAP_BLENDING_MIX",[Ec]:"ENVMAP_BLENDING_ADD"};function Cm(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Em[i.combine]||"ENVMAP_BLENDING_NONE"}function Rm(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Im(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=Sm(e),c=wm(e),d=Am(e),m=Cm(e),h=Rm(e),g=fm(e),p=pm(r),y=s.createProgram(),f,u,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(Rs).join(`
`),f.length>0&&(f+=`
`),u=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(Rs).join(`
`),u.length>0&&(u+=`
`)):(f=[lh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+d:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Rs).join(`
`),u=[lh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+d:"",e.envMap?"#define "+m:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Qe?"#define TONE_MAPPING":"",e.toneMapping!==Qe?Bt.tonemapping_pars_fragment:"",e.toneMapping!==Qe?um("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Bt.colorspace_pars_fragment,cm("linearToOutputTexel",e.outputColorSpace),dm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Rs).join(`
`)),a=dl(a),a=rh(a,e),a=ah(a,e),o=dl(o),o=rh(o,e),o=ah(o,e),a=oh(a),o=oh(o),e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,f=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,u=["#define varying in",e.glslVersion===Jo?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Jo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);let b=v+f+a,S=v+u+o,C=nh(s,s.VERTEX_SHADER,b),T=nh(s,s.FRAGMENT_SHADER,S);s.attachShader(y,C),s.attachShader(y,T),e.index0AttributeName!==void 0?s.bindAttribLocation(y,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function E(R){if(i.debug.checkShaderErrors){let O=s.getProgramInfoLog(y)||"",k=s.getShaderInfoLog(C)||"",F=s.getShaderInfoLog(T)||"",H=O.trim(),V=k.trim(),D=F.trim(),st=!0,tt=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(st=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,y,C,T);else{let ht=sh(s,C,"vertex"),gt=sh(s,T,"fragment");Dt("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+H+`
`+ht+`
`+gt)}else H!==""?Pt("WebGLProgram: Program Info Log:",H):(V===""||D==="")&&(tt=!1);tt&&(R.diagnostics={runnable:st,programLog:H,vertexShader:{log:V,prefix:f},fragmentShader:{log:D,prefix:u}})}s.deleteShader(C),s.deleteShader(T),x=new Fi(s,y),M=mm(s,y)}let x;this.getUniforms=function(){return x===void 0&&E(this),x};let M;this.getAttributes=function(){return M===void 0&&E(this),M};let B=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return B===!1&&(B=s.getProgramParameter(y,rm)),B},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=am++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=C,this.fragmentShader=T,this}var Pm=0,fl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new pl(t),e.set(t,n)),n}},pl=class{constructor(t){this.id=Pm++,this.code=t,this.usedTimes=0}};function Lm(i,t,e,n,s,r){let a=new es,o=new fl,l=new Set,c=[],d=new Map,m=n.logarithmicDepthBuffer,h=n.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(x){return l.add(x),x===0?"uv":`uv${x}`}function y(x,M,B,R,O){let k=R.fog,F=O.geometry,H=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?R.environment:null,V=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,D=t.get(x.envMap||H,V),st=D&&D.mapping===ys?D.image.height:null,tt=g[x.type];x.precision!==null&&(h=n.getMaxPrecision(x.precision),h!==x.precision&&Pt("WebGLProgram.getParameters:",x.precision,"not supported, using",h,"instead."));let ht=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,gt=ht!==void 0?ht.length:0,j=0;F.morphAttributes.position!==void 0&&(j=1),F.morphAttributes.normal!==void 0&&(j=2),F.morphAttributes.color!==void 0&&(j=3);let _t,Ht,zt,J;if(tt){let Jt=pn[tt];_t=Jt.vertexShader,Ht=Jt.fragmentShader}else _t=x.vertexShader,Ht=x.fragmentShader,o.update(x),zt=o.getVertexShaderID(x),J=o.getFragmentShaderID(x);let it=i.getRenderTarget(),rt=i.state.buffers.depth.getReversed(),It=O.isInstancedMesh===!0,Et=O.isBatchedMesh===!0,wt=!!x.map,ce=!!x.matcap,Wt=!!D,Kt=!!x.aoMap,te=!!x.lightMap,Nt=!!x.bumpMap,le=!!x.normalMap,P=!!x.displacementMap,ae=!!x.emissiveMap,Ut=!!x.metalnessMap,Xt=!!x.roughnessMap,xt=x.anisotropy>0,A=x.clearcoat>0,_=x.dispersion>0,N=x.iridescence>0,K=x.sheen>0,et=x.transmission>0,Z=xt&&!!x.anisotropyMap,yt=A&&!!x.clearcoatMap,lt=A&&!!x.clearcoatNormalMap,Mt=A&&!!x.clearcoatRoughnessMap,Rt=N&&!!x.iridescenceMap,at=N&&!!x.iridescenceThicknessMap,ot=K&&!!x.sheenColorMap,St=K&&!!x.sheenRoughnessMap,L=!!x.specularMap,q=!!x.specularColorMap,ut=!!x.specularIntensityMap,I=et&&!!x.transmissionMap,$=et&&!!x.thicknessMap,Q=!!x.gradientMap,ct=!!x.alphaMap,nt=x.alphaTest>0,X=!!x.alphaHash,dt=!!x.extensions,Lt=Qe;x.toneMapped&&(it===null||it.isXRRenderTarget===!0)&&(Lt=i.toneMapping);let Gt={shaderID:tt,shaderType:x.type,shaderName:x.name,vertexShader:_t,fragmentShader:Ht,defines:x.defines,customVertexShaderID:zt,customFragmentShaderID:J,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:h,batching:Et,batchingColor:Et&&O._colorsTexture!==null,instancing:It,instancingColor:It&&O.instanceColor!==null,instancingMorph:It&&O.morphTexture!==null,outputColorSpace:it===null?i.outputColorSpace:it.isXRRenderTarget===!0?it.texture.colorSpace:ei,alphaToCoverage:!!x.alphaToCoverage,map:wt,matcap:ce,envMap:Wt,envMapMode:Wt&&D.mapping,envMapCubeUVHeight:st,aoMap:Kt,lightMap:te,bumpMap:Nt,normalMap:le,displacementMap:P,emissiveMap:ae,normalMapObjectSpace:le&&x.normalMapType===Pc,normalMapTangentSpace:le&&x.normalMapType===Ic,metalnessMap:Ut,roughnessMap:Xt,anisotropy:xt,anisotropyMap:Z,clearcoat:A,clearcoatMap:yt,clearcoatNormalMap:lt,clearcoatRoughnessMap:Mt,dispersion:_,iridescence:N,iridescenceMap:Rt,iridescenceThicknessMap:at,sheen:K,sheenColorMap:ot,sheenRoughnessMap:St,specularMap:L,specularColorMap:q,specularIntensityMap:ut,transmission:et,transmissionMap:I,thicknessMap:$,gradientMap:Q,opaque:x.transparent===!1&&x.blending===Qn&&x.alphaToCoverage===!1,alphaMap:ct,alphaTest:nt,alphaHash:X,combine:x.combine,mapUv:wt&&p(x.map.channel),aoMapUv:Kt&&p(x.aoMap.channel),lightMapUv:te&&p(x.lightMap.channel),bumpMapUv:Nt&&p(x.bumpMap.channel),normalMapUv:le&&p(x.normalMap.channel),displacementMapUv:P&&p(x.displacementMap.channel),emissiveMapUv:ae&&p(x.emissiveMap.channel),metalnessMapUv:Ut&&p(x.metalnessMap.channel),roughnessMapUv:Xt&&p(x.roughnessMap.channel),anisotropyMapUv:Z&&p(x.anisotropyMap.channel),clearcoatMapUv:yt&&p(x.clearcoatMap.channel),clearcoatNormalMapUv:lt&&p(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Mt&&p(x.clearcoatRoughnessMap.channel),iridescenceMapUv:Rt&&p(x.iridescenceMap.channel),iridescenceThicknessMapUv:at&&p(x.iridescenceThicknessMap.channel),sheenColorMapUv:ot&&p(x.sheenColorMap.channel),sheenRoughnessMapUv:St&&p(x.sheenRoughnessMap.channel),specularMapUv:L&&p(x.specularMap.channel),specularColorMapUv:q&&p(x.specularColorMap.channel),specularIntensityMapUv:ut&&p(x.specularIntensityMap.channel),transmissionMapUv:I&&p(x.transmissionMap.channel),thicknessMapUv:$&&p(x.thicknessMap.channel),alphaMapUv:ct&&p(x.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(le||xt),vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!F.attributes.uv&&(wt||ct),fog:!!k,useFog:x.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||F.attributes.normal===void 0&&le===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:m,reversedDepthBuffer:rt,skinning:O.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:gt,morphTextureStride:j,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&B.length>0,shadowMapType:i.shadowMap.type,toneMapping:Lt,decodeVideoTexture:wt&&x.map.isVideoTexture===!0&&$t.getTransfer(x.map.colorSpace)===ee,decodeVideoTextureEmissive:ae&&x.emissiveMap.isVideoTexture===!0&&$t.getTransfer(x.emissiveMap.colorSpace)===ee,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===He,flipSided:x.side===Le,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:dt&&x.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(dt&&x.extensions.multiDraw===!0||Et)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Gt.vertexUv1s=l.has(1),Gt.vertexUv2s=l.has(2),Gt.vertexUv3s=l.has(3),l.clear(),Gt}function f(x){let M=[];if(x.shaderID?M.push(x.shaderID):(M.push(x.customVertexShaderID),M.push(x.customFragmentShaderID)),x.defines!==void 0)for(let B in x.defines)M.push(B),M.push(x.defines[B]);return x.isRawShaderMaterial===!1&&(u(M,x),v(M,x),M.push(i.outputColorSpace)),M.push(x.customProgramCacheKey),M.join()}function u(x,M){x.push(M.precision),x.push(M.outputColorSpace),x.push(M.envMapMode),x.push(M.envMapCubeUVHeight),x.push(M.mapUv),x.push(M.alphaMapUv),x.push(M.lightMapUv),x.push(M.aoMapUv),x.push(M.bumpMapUv),x.push(M.normalMapUv),x.push(M.displacementMapUv),x.push(M.emissiveMapUv),x.push(M.metalnessMapUv),x.push(M.roughnessMapUv),x.push(M.anisotropyMapUv),x.push(M.clearcoatMapUv),x.push(M.clearcoatNormalMapUv),x.push(M.clearcoatRoughnessMapUv),x.push(M.iridescenceMapUv),x.push(M.iridescenceThicknessMapUv),x.push(M.sheenColorMapUv),x.push(M.sheenRoughnessMapUv),x.push(M.specularMapUv),x.push(M.specularColorMapUv),x.push(M.specularIntensityMapUv),x.push(M.transmissionMapUv),x.push(M.thicknessMapUv),x.push(M.combine),x.push(M.fogExp2),x.push(M.sizeAttenuation),x.push(M.morphTargetsCount),x.push(M.morphAttributeCount),x.push(M.numDirLights),x.push(M.numPointLights),x.push(M.numSpotLights),x.push(M.numSpotLightMaps),x.push(M.numHemiLights),x.push(M.numRectAreaLights),x.push(M.numDirLightShadows),x.push(M.numPointLightShadows),x.push(M.numSpotLightShadows),x.push(M.numSpotLightShadowsWithMaps),x.push(M.numLightProbes),x.push(M.shadowMapType),x.push(M.toneMapping),x.push(M.numClippingPlanes),x.push(M.numClipIntersection),x.push(M.depthPacking)}function v(x,M){a.disableAll(),M.instancing&&a.enable(0),M.instancingColor&&a.enable(1),M.instancingMorph&&a.enable(2),M.matcap&&a.enable(3),M.envMap&&a.enable(4),M.normalMapObjectSpace&&a.enable(5),M.normalMapTangentSpace&&a.enable(6),M.clearcoat&&a.enable(7),M.iridescence&&a.enable(8),M.alphaTest&&a.enable(9),M.vertexColors&&a.enable(10),M.vertexAlphas&&a.enable(11),M.vertexUv1s&&a.enable(12),M.vertexUv2s&&a.enable(13),M.vertexUv3s&&a.enable(14),M.vertexTangents&&a.enable(15),M.anisotropy&&a.enable(16),M.alphaHash&&a.enable(17),M.batching&&a.enable(18),M.dispersion&&a.enable(19),M.batchingColor&&a.enable(20),M.gradientMap&&a.enable(21),x.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reversedDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),x.push(a.mask)}function b(x){let M=g[x.type],B;if(M){let R=pn[M];B=Hc.clone(R.uniforms)}else B=x.uniforms;return B}function S(x,M){let B=d.get(M);return B!==void 0?++B.usedTimes:(B=new Im(i,M,x,s),c.push(B),d.set(M,B)),B}function C(x){if(--x.usedTimes===0){let M=c.indexOf(x);c[M]=c[c.length-1],c.pop(),d.delete(x.cacheKey),x.destroy()}}function T(x){o.remove(x)}function E(){o.dispose()}return{getParameters:y,getProgramCacheKey:f,getUniforms:b,acquireProgram:S,releaseProgram:C,releaseShaderCache:T,programs:c,dispose:E}}function Dm(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Nm(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function ch(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function hh(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(h){let g=0;return h.isInstancedMesh&&(g+=2),h.isSkinnedMesh&&(g+=1),g}function o(h,g,p,y,f,u){let v=i[t];return v===void 0?(v={id:h.id,object:h,geometry:g,material:p,materialVariant:a(h),groupOrder:y,renderOrder:h.renderOrder,z:f,group:u},i[t]=v):(v.id=h.id,v.object=h,v.geometry=g,v.material=p,v.materialVariant=a(h),v.groupOrder=y,v.renderOrder=h.renderOrder,v.z=f,v.group=u),t++,v}function l(h,g,p,y,f,u){let v=o(h,g,p,y,f,u);p.transmission>0?n.push(v):p.transparent===!0?s.push(v):e.push(v)}function c(h,g,p,y,f,u){let v=o(h,g,p,y,f,u);p.transmission>0?n.unshift(v):p.transparent===!0?s.unshift(v):e.unshift(v)}function d(h,g){e.length>1&&e.sort(h||Nm),n.length>1&&n.sort(g||ch),s.length>1&&s.sort(g||ch)}function m(){for(let h=t,g=i.length;h<g;h++){let p=i[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:m,sort:d}}function Um(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new hh,i.set(n,[a])):s>=r.length?(a=new hh,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Fm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new z,color:new Yt};break;case"SpotLight":e={position:new z,direction:new z,color:new Yt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new z,color:new Yt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new z,skyColor:new Yt,groundColor:new Yt};break;case"RectAreaLight":e={color:new Yt,position:new z,halfWidth:new z,halfHeight:new z};break}return i[t.id]=e,e}}}function Om(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Bm=0;function zm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function km(i){let t=new Fm,e=Om(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new z);let s=new z,r=new re,a=new re;function o(c){let d=0,m=0,h=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let g=0,p=0,y=0,f=0,u=0,v=0,b=0,S=0,C=0,T=0,E=0;c.sort(zm);for(let M=0,B=c.length;M<B;M++){let R=c[M],O=R.color,k=R.intensity,F=R.distance,H=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===ii?H=R.shadow.map.texture:H=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)d+=O.r*k,m+=O.g*k,h+=O.b*k;else if(R.isLightProbe){for(let V=0;V<9;V++)n.probe[V].addScaledVector(R.sh.coefficients[V],k);E++}else if(R.isDirectionalLight){let V=t.get(R);if(V.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let D=R.shadow,st=e.get(R);st.shadowIntensity=D.intensity,st.shadowBias=D.bias,st.shadowNormalBias=D.normalBias,st.shadowRadius=D.radius,st.shadowMapSize=D.mapSize,n.directionalShadow[g]=st,n.directionalShadowMap[g]=H,n.directionalShadowMatrix[g]=R.shadow.matrix,v++}n.directional[g]=V,g++}else if(R.isSpotLight){let V=t.get(R);V.position.setFromMatrixPosition(R.matrixWorld),V.color.copy(O).multiplyScalar(k),V.distance=F,V.coneCos=Math.cos(R.angle),V.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),V.decay=R.decay,n.spot[y]=V;let D=R.shadow;if(R.map&&(n.spotLightMap[C]=R.map,C++,D.updateMatrices(R),R.castShadow&&T++),n.spotLightMatrix[y]=D.matrix,R.castShadow){let st=e.get(R);st.shadowIntensity=D.intensity,st.shadowBias=D.bias,st.shadowNormalBias=D.normalBias,st.shadowRadius=D.radius,st.shadowMapSize=D.mapSize,n.spotShadow[y]=st,n.spotShadowMap[y]=H,S++}y++}else if(R.isRectAreaLight){let V=t.get(R);V.color.copy(O).multiplyScalar(k),V.halfWidth.set(R.width*.5,0,0),V.halfHeight.set(0,R.height*.5,0),n.rectArea[f]=V,f++}else if(R.isPointLight){let V=t.get(R);if(V.color.copy(R.color).multiplyScalar(R.intensity),V.distance=R.distance,V.decay=R.decay,R.castShadow){let D=R.shadow,st=e.get(R);st.shadowIntensity=D.intensity,st.shadowBias=D.bias,st.shadowNormalBias=D.normalBias,st.shadowRadius=D.radius,st.shadowMapSize=D.mapSize,st.shadowCameraNear=D.camera.near,st.shadowCameraFar=D.camera.far,n.pointShadow[p]=st,n.pointShadowMap[p]=H,n.pointShadowMatrix[p]=R.shadow.matrix,b++}n.point[p]=V,p++}else if(R.isHemisphereLight){let V=t.get(R);V.skyColor.copy(R.color).multiplyScalar(k),V.groundColor.copy(R.groundColor).multiplyScalar(k),n.hemi[u]=V,u++}}f>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ft.LTC_FLOAT_1,n.rectAreaLTC2=ft.LTC_FLOAT_2):(n.rectAreaLTC1=ft.LTC_HALF_1,n.rectAreaLTC2=ft.LTC_HALF_2)),n.ambient[0]=d,n.ambient[1]=m,n.ambient[2]=h;let x=n.hash;(x.directionalLength!==g||x.pointLength!==p||x.spotLength!==y||x.rectAreaLength!==f||x.hemiLength!==u||x.numDirectionalShadows!==v||x.numPointShadows!==b||x.numSpotShadows!==S||x.numSpotMaps!==C||x.numLightProbes!==E)&&(n.directional.length=g,n.spot.length=y,n.rectArea.length=f,n.point.length=p,n.hemi.length=u,n.directionalShadow.length=v,n.directionalShadowMap.length=v,n.pointShadow.length=b,n.pointShadowMap.length=b,n.spotShadow.length=S,n.spotShadowMap.length=S,n.directionalShadowMatrix.length=v,n.pointShadowMatrix.length=b,n.spotLightMatrix.length=S+C-T,n.spotLightMap.length=C,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=E,x.directionalLength=g,x.pointLength=p,x.spotLength=y,x.rectAreaLength=f,x.hemiLength=u,x.numDirectionalShadows=v,x.numPointShadows=b,x.numSpotShadows=S,x.numSpotMaps=C,x.numLightProbes=E,n.version=Bm++)}function l(c,d){let m=0,h=0,g=0,p=0,y=0,f=d.matrixWorldInverse;for(let u=0,v=c.length;u<v;u++){let b=c[u];if(b.isDirectionalLight){let S=n.directional[m];S.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),S.direction.sub(s),S.direction.transformDirection(f),m++}else if(b.isSpotLight){let S=n.spot[g];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(f),S.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),S.direction.sub(s),S.direction.transformDirection(f),g++}else if(b.isRectAreaLight){let S=n.rectArea[p];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(f),a.identity(),r.copy(b.matrixWorld),r.premultiply(f),a.extractRotation(r),S.halfWidth.set(b.width*.5,0,0),S.halfHeight.set(0,b.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),p++}else if(b.isPointLight){let S=n.point[h];S.position.setFromMatrixPosition(b.matrixWorld),S.position.applyMatrix4(f),h++}else if(b.isHemisphereLight){let S=n.hemi[y];S.direction.setFromMatrixPosition(b.matrixWorld),S.direction.transformDirection(f),y++}}}return{setup:o,setupView:l,state:n}}function uh(i){let t=new km(i),e=[],n=[];function s(d){c.camera=d,e.length=0,n.length=0}function r(d){e.push(d)}function a(d){n.push(d)}function o(){t.setup(e)}function l(d){t.setupView(e,d)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function Vm(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new uh(i),t.set(s,[o])):r>=a.length?(o=new uh(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var Gm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Hm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Wm=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],Xm=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],dh=new re,Cs=new z,ol=new z;function qm(i,t,e){let n=new ls,s=new Qt,r=new Qt,a=new ue,o=new Cr,l=new Rr,c={},d=e.maxTextureSize,m={[bn]:Le,[Le]:bn,[He]:He},h=new Ce({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Qt},radius:{value:4}},vertexShader:Gm,fragmentShader:Hm}),g=h.clone();g.defines.HORIZONTAL_PASS=1;let p=new Pe;p.setAttribute("position",new pe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new be(p,h),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=_s;let u=this.type;this.render=function(T,E,x){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||T.length===0)return;this.type===oc&&(Pt("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=_s);let M=i.getRenderTarget(),B=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),O=i.state;O.setBlending(un),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let k=u!==this.type;k&&E.traverse(function(F){F.material&&(Array.isArray(F.material)?F.material.forEach(H=>H.needsUpdate=!0):F.material.needsUpdate=!0)});for(let F=0,H=T.length;F<H;F++){let V=T[F],D=V.shadow;if(D===void 0){Pt("WebGLShadowMap:",V,"has no shadow.");continue}if(D.autoUpdate===!1&&D.needsUpdate===!1)continue;s.copy(D.mapSize);let st=D.getFrameExtents();s.multiply(st),r.copy(D.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(r.x=Math.floor(d/st.x),s.x=r.x*st.x,D.mapSize.x=r.x),s.y>d&&(r.y=Math.floor(d/st.y),s.y=r.y*st.y,D.mapSize.y=r.y));let tt=i.state.buffers.depth.getReversed();if(D.camera._reversedDepth=tt,D.map===null||k===!0){if(D.map!==null&&(D.map.depthTexture!==null&&(D.map.depthTexture.dispose(),D.map.depthTexture=null),D.map.dispose()),this.type===Li){if(V.isPointLight){Pt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}D.map=new Ve(s.x,s.y,{format:ii,type:dn,minFilter:Se,magFilter:Se,generateMipmaps:!1}),D.map.texture.name=V.name+".shadowMap",D.map.depthTexture=new Bn(s.x,s.y,qe),D.map.depthTexture.name=V.name+".shadowMapDepth",D.map.depthTexture.format=an,D.map.depthTexture.compareFunction=null,D.map.depthTexture.minFilter=ye,D.map.depthTexture.magFilter=ye}else V.isPointLight?(D.map=new Ua(s.x),D.map.depthTexture=new Tr(s.x,tn)):(D.map=new Ve(s.x,s.y),D.map.depthTexture=new Bn(s.x,s.y,tn)),D.map.depthTexture.name=V.name+".shadowMap",D.map.depthTexture.format=an,this.type===_s?(D.map.depthTexture.compareFunction=tt?Pa:Ia,D.map.depthTexture.minFilter=Se,D.map.depthTexture.magFilter=Se):(D.map.depthTexture.compareFunction=null,D.map.depthTexture.minFilter=ye,D.map.depthTexture.magFilter=ye);D.camera.updateProjectionMatrix()}let ht=D.map.isWebGLCubeRenderTarget?6:1;for(let gt=0;gt<ht;gt++){if(D.map.isWebGLCubeRenderTarget)i.setRenderTarget(D.map,gt),i.clear();else{gt===0&&(i.setRenderTarget(D.map),i.clear());let j=D.getViewport(gt);a.set(r.x*j.x,r.y*j.y,r.x*j.z,r.y*j.w),O.viewport(a)}if(V.isPointLight){let j=D.camera,_t=D.matrix,Ht=V.distance||j.far;Ht!==j.far&&(j.far=Ht,j.updateProjectionMatrix()),Cs.setFromMatrixPosition(V.matrixWorld),j.position.copy(Cs),ol.copy(j.position),ol.add(Wm[gt]),j.up.copy(Xm[gt]),j.lookAt(ol),j.updateMatrixWorld(),_t.makeTranslation(-Cs.x,-Cs.y,-Cs.z),dh.multiplyMatrices(j.projectionMatrix,j.matrixWorldInverse),D._frustum.setFromProjectionMatrix(dh,j.coordinateSystem,j.reversedDepth)}else D.updateMatrices(V);n=D.getFrustum(),S(E,x,D.camera,V,this.type)}D.isPointLightShadow!==!0&&this.type===Li&&v(D,x),D.needsUpdate=!1}u=this.type,f.needsUpdate=!1,i.setRenderTarget(M,B,R)};function v(T,E){let x=t.update(y);h.defines.VSM_SAMPLES!==T.blurSamples&&(h.defines.VSM_SAMPLES=T.blurSamples,g.defines.VSM_SAMPLES=T.blurSamples,h.needsUpdate=!0,g.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Ve(s.x,s.y,{format:ii,type:dn})),h.uniforms.shadow_pass.value=T.map.depthTexture,h.uniforms.resolution.value=T.mapSize,h.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(E,null,x,h,y,null),g.uniforms.shadow_pass.value=T.mapPass.texture,g.uniforms.resolution.value=T.mapSize,g.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(E,null,x,g,y,null)}function b(T,E,x,M){let B=null,R=x.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(R!==void 0)B=R;else if(B=x.isPointLight===!0?l:o,i.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0||E.alphaToCoverage===!0){let O=B.uuid,k=E.uuid,F=c[O];F===void 0&&(F={},c[O]=F);let H=F[k];H===void 0&&(H=B.clone(),F[k]=H,E.addEventListener("dispose",C)),B=H}if(B.visible=E.visible,B.wireframe=E.wireframe,M===Li?B.side=E.shadowSide!==null?E.shadowSide:E.side:B.side=E.shadowSide!==null?E.shadowSide:m[E.side],B.alphaMap=E.alphaMap,B.alphaTest=E.alphaToCoverage===!0?.5:E.alphaTest,B.map=E.map,B.clipShadows=E.clipShadows,B.clippingPlanes=E.clippingPlanes,B.clipIntersection=E.clipIntersection,B.displacementMap=E.displacementMap,B.displacementScale=E.displacementScale,B.displacementBias=E.displacementBias,B.wireframeLinewidth=E.wireframeLinewidth,B.linewidth=E.linewidth,x.isPointLight===!0&&B.isMeshDistanceMaterial===!0){let O=i.properties.get(B);O.light=x}return B}function S(T,E,x,M,B){if(T.visible===!1)return;if(T.layers.test(E.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&B===Li)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,T.matrixWorld);let k=t.update(T),F=T.material;if(Array.isArray(F)){let H=k.groups;for(let V=0,D=H.length;V<D;V++){let st=H[V],tt=F[st.materialIndex];if(tt&&tt.visible){let ht=b(T,tt,M,B);T.onBeforeShadow(i,T,E,x,k,ht,st),i.renderBufferDirect(x,null,k,ht,T,st),T.onAfterShadow(i,T,E,x,k,ht,st)}}}else if(F.visible){let H=b(T,F,M,B);T.onBeforeShadow(i,T,E,x,k,H,null),i.renderBufferDirect(x,null,k,H,T,null),T.onAfterShadow(i,T,E,x,k,H,null)}}let O=T.children;for(let k=0,F=O.length;k<F;k++)S(O[k],E,x,M,B)}function C(T){T.target.removeEventListener("dispose",C);for(let x in c){let M=c[x],B=T.target.uuid;B in M&&(M[B].dispose(),delete M[B])}}}function Ym(i,t){function e(){let I=!1,$=new ue,Q=null,ct=new ue(0,0,0,0);return{setMask:function(nt){Q!==nt&&!I&&(i.colorMask(nt,nt,nt,nt),Q=nt)},setLocked:function(nt){I=nt},setClear:function(nt,X,dt,Lt,Gt){Gt===!0&&(nt*=Lt,X*=Lt,dt*=Lt),$.set(nt,X,dt,Lt),ct.equals($)===!1&&(i.clearColor(nt,X,dt,Lt),ct.copy($))},reset:function(){I=!1,Q=null,ct.set(-1,0,0,0)}}}function n(){let I=!1,$=!1,Q=null,ct=null,nt=null;return{setReversed:function(X){if($!==X){let dt=t.get("EXT_clip_control");X?dt.clipControlEXT(dt.LOWER_LEFT_EXT,dt.ZERO_TO_ONE_EXT):dt.clipControlEXT(dt.LOWER_LEFT_EXT,dt.NEGATIVE_ONE_TO_ONE_EXT),$=X;let Lt=nt;nt=null,this.setClear(Lt)}},getReversed:function(){return $},setTest:function(X){X?it(i.DEPTH_TEST):rt(i.DEPTH_TEST)},setMask:function(X){Q!==X&&!I&&(i.depthMask(X),Q=X)},setFunc:function(X){if($&&(X=Vc[X]),ct!==X){switch(X){case or:i.depthFunc(i.NEVER);break;case lr:i.depthFunc(i.ALWAYS);break;case cr:i.depthFunc(i.LESS);break;case ti:i.depthFunc(i.LEQUAL);break;case hr:i.depthFunc(i.EQUAL);break;case ur:i.depthFunc(i.GEQUAL);break;case dr:i.depthFunc(i.GREATER);break;case fr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ct=X}},setLocked:function(X){I=X},setClear:function(X){nt!==X&&(nt=X,$&&(X=1-X),i.clearDepth(X))},reset:function(){I=!1,Q=null,ct=null,nt=null,$=!1}}}function s(){let I=!1,$=null,Q=null,ct=null,nt=null,X=null,dt=null,Lt=null,Gt=null;return{setTest:function(Jt){I||(Jt?it(i.STENCIL_TEST):rt(i.STENCIL_TEST))},setMask:function(Jt){$!==Jt&&!I&&(i.stencilMask(Jt),$=Jt)},setFunc:function(Jt,Oe,De){(Q!==Jt||ct!==Oe||nt!==De)&&(i.stencilFunc(Jt,Oe,De),Q=Jt,ct=Oe,nt=De)},setOp:function(Jt,Oe,De){(X!==Jt||dt!==Oe||Lt!==De)&&(i.stencilOp(Jt,Oe,De),X=Jt,dt=Oe,Lt=De)},setLocked:function(Jt){I=Jt},setClear:function(Jt){Gt!==Jt&&(i.clearStencil(Jt),Gt=Jt)},reset:function(){I=!1,$=null,Q=null,ct=null,nt=null,X=null,dt=null,Lt=null,Gt=null}}}let r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap,d={},m={},h=new WeakMap,g=[],p=null,y=!1,f=null,u=null,v=null,b=null,S=null,C=null,T=null,E=new Yt(0,0,0),x=0,M=!1,B=null,R=null,O=null,k=null,F=null,H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,D=0,st=i.getParameter(i.VERSION);st.indexOf("WebGL")!==-1?(D=parseFloat(/^WebGL (\d)/.exec(st)[1]),V=D>=1):st.indexOf("OpenGL ES")!==-1&&(D=parseFloat(/^OpenGL ES (\d)/.exec(st)[1]),V=D>=2);let tt=null,ht={},gt=i.getParameter(i.SCISSOR_BOX),j=i.getParameter(i.VIEWPORT),_t=new ue().fromArray(gt),Ht=new ue().fromArray(j);function zt(I,$,Q,ct){let nt=new Uint8Array(4),X=i.createTexture();i.bindTexture(I,X),i.texParameteri(I,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(I,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let dt=0;dt<Q;dt++)I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY?i.texImage3D($,0,i.RGBA,1,1,ct,0,i.RGBA,i.UNSIGNED_BYTE,nt):i.texImage2D($+dt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,nt);return X}let J={};J[i.TEXTURE_2D]=zt(i.TEXTURE_2D,i.TEXTURE_2D,1),J[i.TEXTURE_CUBE_MAP]=zt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),J[i.TEXTURE_2D_ARRAY]=zt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),J[i.TEXTURE_3D]=zt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),it(i.DEPTH_TEST),a.setFunc(ti),Nt(!1),le(Po),it(i.CULL_FACE),Kt(un);function it(I){d[I]!==!0&&(i.enable(I),d[I]=!0)}function rt(I){d[I]!==!1&&(i.disable(I),d[I]=!1)}function It(I,$){return m[I]!==$?(i.bindFramebuffer(I,$),m[I]=$,I===i.DRAW_FRAMEBUFFER&&(m[i.FRAMEBUFFER]=$),I===i.FRAMEBUFFER&&(m[i.DRAW_FRAMEBUFFER]=$),!0):!1}function Et(I,$){let Q=g,ct=!1;if(I){Q=h.get($),Q===void 0&&(Q=[],h.set($,Q));let nt=I.textures;if(Q.length!==nt.length||Q[0]!==i.COLOR_ATTACHMENT0){for(let X=0,dt=nt.length;X<dt;X++)Q[X]=i.COLOR_ATTACHMENT0+X;Q.length=nt.length,ct=!0}}else Q[0]!==i.BACK&&(Q[0]=i.BACK,ct=!0);ct&&i.drawBuffers(Q)}function wt(I){return p!==I?(i.useProgram(I),p=I,!0):!1}let ce={[Fn]:i.FUNC_ADD,[cc]:i.FUNC_SUBTRACT,[hc]:i.FUNC_REVERSE_SUBTRACT};ce[uc]=i.MIN,ce[dc]=i.MAX;let Wt={[fc]:i.ZERO,[pc]:i.ONE,[mc]:i.SRC_COLOR,[rr]:i.SRC_ALPHA,[Mc]:i.SRC_ALPHA_SATURATE,[yc]:i.DST_COLOR,[xc]:i.DST_ALPHA,[gc]:i.ONE_MINUS_SRC_COLOR,[ar]:i.ONE_MINUS_SRC_ALPHA,[vc]:i.ONE_MINUS_DST_COLOR,[_c]:i.ONE_MINUS_DST_ALPHA,[Sc]:i.CONSTANT_COLOR,[bc]:i.ONE_MINUS_CONSTANT_COLOR,[wc]:i.CONSTANT_ALPHA,[Tc]:i.ONE_MINUS_CONSTANT_ALPHA};function Kt(I,$,Q,ct,nt,X,dt,Lt,Gt,Jt){if(I===un){y===!0&&(rt(i.BLEND),y=!1);return}if(y===!1&&(it(i.BLEND),y=!0),I!==lc){if(I!==f||Jt!==M){if((u!==Fn||S!==Fn)&&(i.blendEquation(i.FUNC_ADD),u=Fn,S=Fn),Jt)switch(I){case Qn:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Lo:i.blendFunc(i.ONE,i.ONE);break;case Do:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case No:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Dt("WebGLState: Invalid blending: ",I);break}else switch(I){case Qn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Lo:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Do:Dt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case No:Dt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Dt("WebGLState: Invalid blending: ",I);break}v=null,b=null,C=null,T=null,E.set(0,0,0),x=0,f=I,M=Jt}return}nt=nt||$,X=X||Q,dt=dt||ct,($!==u||nt!==S)&&(i.blendEquationSeparate(ce[$],ce[nt]),u=$,S=nt),(Q!==v||ct!==b||X!==C||dt!==T)&&(i.blendFuncSeparate(Wt[Q],Wt[ct],Wt[X],Wt[dt]),v=Q,b=ct,C=X,T=dt),(Lt.equals(E)===!1||Gt!==x)&&(i.blendColor(Lt.r,Lt.g,Lt.b,Gt),E.copy(Lt),x=Gt),f=I,M=!1}function te(I,$){I.side===He?rt(i.CULL_FACE):it(i.CULL_FACE);let Q=I.side===Le;$&&(Q=!Q),Nt(Q),I.blending===Qn&&I.transparent===!1?Kt(un):Kt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),a.setFunc(I.depthFunc),a.setTest(I.depthTest),a.setMask(I.depthWrite),r.setMask(I.colorWrite);let ct=I.stencilWrite;o.setTest(ct),ct&&(o.setMask(I.stencilWriteMask),o.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),o.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),ae(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?it(i.SAMPLE_ALPHA_TO_COVERAGE):rt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Nt(I){B!==I&&(I?i.frontFace(i.CW):i.frontFace(i.CCW),B=I)}function le(I){I!==rc?(it(i.CULL_FACE),I!==R&&(I===Po?i.cullFace(i.BACK):I===ac?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):rt(i.CULL_FACE),R=I}function P(I){I!==O&&(V&&i.lineWidth(I),O=I)}function ae(I,$,Q){I?(it(i.POLYGON_OFFSET_FILL),(k!==$||F!==Q)&&(k=$,F=Q,a.getReversed()&&($=-$),i.polygonOffset($,Q))):rt(i.POLYGON_OFFSET_FILL)}function Ut(I){I?it(i.SCISSOR_TEST):rt(i.SCISSOR_TEST)}function Xt(I){I===void 0&&(I=i.TEXTURE0+H-1),tt!==I&&(i.activeTexture(I),tt=I)}function xt(I,$,Q){Q===void 0&&(tt===null?Q=i.TEXTURE0+H-1:Q=tt);let ct=ht[Q];ct===void 0&&(ct={type:void 0,texture:void 0},ht[Q]=ct),(ct.type!==I||ct.texture!==$)&&(tt!==Q&&(i.activeTexture(Q),tt=Q),i.bindTexture(I,$||J[I]),ct.type=I,ct.texture=$)}function A(){let I=ht[tt];I!==void 0&&I.type!==void 0&&(i.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function _(){try{i.compressedTexImage2D(...arguments)}catch(I){Dt("WebGLState:",I)}}function N(){try{i.compressedTexImage3D(...arguments)}catch(I){Dt("WebGLState:",I)}}function K(){try{i.texSubImage2D(...arguments)}catch(I){Dt("WebGLState:",I)}}function et(){try{i.texSubImage3D(...arguments)}catch(I){Dt("WebGLState:",I)}}function Z(){try{i.compressedTexSubImage2D(...arguments)}catch(I){Dt("WebGLState:",I)}}function yt(){try{i.compressedTexSubImage3D(...arguments)}catch(I){Dt("WebGLState:",I)}}function lt(){try{i.texStorage2D(...arguments)}catch(I){Dt("WebGLState:",I)}}function Mt(){try{i.texStorage3D(...arguments)}catch(I){Dt("WebGLState:",I)}}function Rt(){try{i.texImage2D(...arguments)}catch(I){Dt("WebGLState:",I)}}function at(){try{i.texImage3D(...arguments)}catch(I){Dt("WebGLState:",I)}}function ot(I){_t.equals(I)===!1&&(i.scissor(I.x,I.y,I.z,I.w),_t.copy(I))}function St(I){Ht.equals(I)===!1&&(i.viewport(I.x,I.y,I.z,I.w),Ht.copy(I))}function L(I,$){let Q=c.get($);Q===void 0&&(Q=new WeakMap,c.set($,Q));let ct=Q.get(I);ct===void 0&&(ct=i.getUniformBlockIndex($,I.name),Q.set(I,ct))}function q(I,$){let ct=c.get($).get(I);l.get($)!==ct&&(i.uniformBlockBinding($,ct,I.__bindingPointIndex),l.set($,ct))}function ut(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),d={},tt=null,ht={},m={},h=new WeakMap,g=[],p=null,y=!1,f=null,u=null,v=null,b=null,S=null,C=null,T=null,E=new Yt(0,0,0),x=0,M=!1,B=null,R=null,O=null,k=null,F=null,_t.set(0,0,i.canvas.width,i.canvas.height),Ht.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:it,disable:rt,bindFramebuffer:It,drawBuffers:Et,useProgram:wt,setBlending:Kt,setMaterial:te,setFlipSided:Nt,setCullFace:le,setLineWidth:P,setPolygonOffset:ae,setScissorTest:Ut,activeTexture:Xt,bindTexture:xt,unbindTexture:A,compressedTexImage2D:_,compressedTexImage3D:N,texImage2D:Rt,texImage3D:at,updateUBOMapping:L,uniformBlockBinding:q,texStorage2D:lt,texStorage3D:Mt,texSubImage2D:K,texSubImage3D:et,compressedTexSubImage2D:Z,compressedTexSubImage3D:yt,scissor:ot,viewport:St,reset:ut}}function $m(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Qt,d=new WeakMap,m,h=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function p(A,_){return g?new OffscreenCanvas(A,_):ji("canvas")}function y(A,_,N){let K=1,et=xt(A);if((et.width>N||et.height>N)&&(K=N/Math.max(et.width,et.height)),K<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let Z=Math.floor(K*et.width),yt=Math.floor(K*et.height);m===void 0&&(m=p(Z,yt));let lt=_?p(Z,yt):m;return lt.width=Z,lt.height=yt,lt.getContext("2d").drawImage(A,0,0,Z,yt),Pt("WebGLRenderer: Texture has been resized from ("+et.width+"x"+et.height+") to ("+Z+"x"+yt+")."),lt}else return"data"in A&&Pt("WebGLRenderer: Image in DataTexture is too big ("+et.width+"x"+et.height+")."),A;return A}function f(A){return A.generateMipmaps}function u(A){i.generateMipmap(A)}function v(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function b(A,_,N,K,et=!1){if(A!==null){if(i[A]!==void 0)return i[A];Pt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let Z=_;if(_===i.RED&&(N===i.FLOAT&&(Z=i.R32F),N===i.HALF_FLOAT&&(Z=i.R16F),N===i.UNSIGNED_BYTE&&(Z=i.R8)),_===i.RED_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.R8UI),N===i.UNSIGNED_SHORT&&(Z=i.R16UI),N===i.UNSIGNED_INT&&(Z=i.R32UI),N===i.BYTE&&(Z=i.R8I),N===i.SHORT&&(Z=i.R16I),N===i.INT&&(Z=i.R32I)),_===i.RG&&(N===i.FLOAT&&(Z=i.RG32F),N===i.HALF_FLOAT&&(Z=i.RG16F),N===i.UNSIGNED_BYTE&&(Z=i.RG8)),_===i.RG_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.RG8UI),N===i.UNSIGNED_SHORT&&(Z=i.RG16UI),N===i.UNSIGNED_INT&&(Z=i.RG32UI),N===i.BYTE&&(Z=i.RG8I),N===i.SHORT&&(Z=i.RG16I),N===i.INT&&(Z=i.RG32I)),_===i.RGB_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.RGB8UI),N===i.UNSIGNED_SHORT&&(Z=i.RGB16UI),N===i.UNSIGNED_INT&&(Z=i.RGB32UI),N===i.BYTE&&(Z=i.RGB8I),N===i.SHORT&&(Z=i.RGB16I),N===i.INT&&(Z=i.RGB32I)),_===i.RGBA_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.RGBA8UI),N===i.UNSIGNED_SHORT&&(Z=i.RGBA16UI),N===i.UNSIGNED_INT&&(Z=i.RGBA32UI),N===i.BYTE&&(Z=i.RGBA8I),N===i.SHORT&&(Z=i.RGBA16I),N===i.INT&&(Z=i.RGBA32I)),_===i.RGB&&(N===i.UNSIGNED_INT_5_9_9_9_REV&&(Z=i.RGB9_E5),N===i.UNSIGNED_INT_10F_11F_11F_REV&&(Z=i.R11F_G11F_B10F)),_===i.RGBA){let yt=et?Ji:$t.getTransfer(K);N===i.FLOAT&&(Z=i.RGBA32F),N===i.HALF_FLOAT&&(Z=i.RGBA16F),N===i.UNSIGNED_BYTE&&(Z=yt===ee?i.SRGB8_ALPHA8:i.RGBA8),N===i.UNSIGNED_SHORT_4_4_4_4&&(Z=i.RGBA4),N===i.UNSIGNED_SHORT_5_5_5_1&&(Z=i.RGB5_A1)}return(Z===i.R16F||Z===i.R32F||Z===i.RG16F||Z===i.RG32F||Z===i.RGBA16F||Z===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Z}function S(A,_){let N;return A?_===null||_===tn||_===Ni?N=i.DEPTH24_STENCIL8:_===qe?N=i.DEPTH32F_STENCIL8:_===Di&&(N=i.DEPTH24_STENCIL8,Pt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===tn||_===Ni?N=i.DEPTH_COMPONENT24:_===qe?N=i.DEPTH_COMPONENT32F:_===Di&&(N=i.DEPTH_COMPONENT16),N}function C(A,_){return f(A)===!0||A.isFramebufferTexture&&A.minFilter!==ye&&A.minFilter!==Se?Math.log2(Math.max(_.width,_.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?_.mipmaps.length:1}function T(A){let _=A.target;_.removeEventListener("dispose",T),x(_),_.isVideoTexture&&d.delete(_)}function E(A){let _=A.target;_.removeEventListener("dispose",E),B(_)}function x(A){let _=n.get(A);if(_.__webglInit===void 0)return;let N=A.source,K=h.get(N);if(K){let et=K[_.__cacheKey];et.usedTimes--,et.usedTimes===0&&M(A),Object.keys(K).length===0&&h.delete(N)}n.remove(A)}function M(A){let _=n.get(A);i.deleteTexture(_.__webglTexture);let N=A.source,K=h.get(N);delete K[_.__cacheKey],a.memory.textures--}function B(A){let _=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(_.__webglFramebuffer[K]))for(let et=0;et<_.__webglFramebuffer[K].length;et++)i.deleteFramebuffer(_.__webglFramebuffer[K][et]);else i.deleteFramebuffer(_.__webglFramebuffer[K]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[K])}else{if(Array.isArray(_.__webglFramebuffer))for(let K=0;K<_.__webglFramebuffer.length;K++)i.deleteFramebuffer(_.__webglFramebuffer[K]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let K=0;K<_.__webglColorRenderbuffer.length;K++)_.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[K]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let N=A.textures;for(let K=0,et=N.length;K<et;K++){let Z=n.get(N[K]);Z.__webglTexture&&(i.deleteTexture(Z.__webglTexture),a.memory.textures--),n.remove(N[K])}n.remove(A)}let R=0;function O(){R=0}function k(){let A=R;return A>=s.maxTextures&&Pt("WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+s.maxTextures),R+=1,A}function F(A){let _=[];return _.push(A.wrapS),_.push(A.wrapT),_.push(A.wrapR||0),_.push(A.magFilter),_.push(A.minFilter),_.push(A.anisotropy),_.push(A.internalFormat),_.push(A.format),_.push(A.type),_.push(A.generateMipmaps),_.push(A.premultiplyAlpha),_.push(A.flipY),_.push(A.unpackAlignment),_.push(A.colorSpace),_.join()}function H(A,_){let N=n.get(A);if(A.isVideoTexture&&Ut(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&N.__version!==A.version){let K=A.image;if(K===null)Pt("WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)Pt("WebGLRenderer: Texture marked for update but image is incomplete");else{J(N,A,_);return}}else A.isExternalTexture&&(N.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,N.__webglTexture,i.TEXTURE0+_)}function V(A,_){let N=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&N.__version!==A.version){J(N,A,_);return}else A.isExternalTexture&&(N.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,N.__webglTexture,i.TEXTURE0+_)}function D(A,_){let N=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&N.__version!==A.version){J(N,A,_);return}e.bindTexture(i.TEXTURE_3D,N.__webglTexture,i.TEXTURE0+_)}function st(A,_){let N=n.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&N.__version!==A.version){it(N,A,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,N.__webglTexture,i.TEXTURE0+_)}let tt={[pr]:i.REPEAT,[rn]:i.CLAMP_TO_EDGE,[mr]:i.MIRRORED_REPEAT},ht={[ye]:i.NEAREST,[Cc]:i.NEAREST_MIPMAP_NEAREST,[vs]:i.NEAREST_MIPMAP_LINEAR,[Se]:i.LINEAR,[Wr]:i.LINEAR_MIPMAP_NEAREST,[Hn]:i.LINEAR_MIPMAP_LINEAR},gt={[Lc]:i.NEVER,[Oc]:i.ALWAYS,[Dc]:i.LESS,[Ia]:i.LEQUAL,[Nc]:i.EQUAL,[Pa]:i.GEQUAL,[Uc]:i.GREATER,[Fc]:i.NOTEQUAL};function j(A,_){if(_.type===qe&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Se||_.magFilter===Wr||_.magFilter===vs||_.magFilter===Hn||_.minFilter===Se||_.minFilter===Wr||_.minFilter===vs||_.minFilter===Hn)&&Pt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,tt[_.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,tt[_.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,tt[_.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,ht[_.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,ht[_.minFilter]),_.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,gt[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===ye||_.minFilter!==vs&&_.minFilter!==Hn||_.type===qe&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let N=t.get("EXT_texture_filter_anisotropic");i.texParameterf(A,N.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function _t(A,_){let N=!1;A.__webglInit===void 0&&(A.__webglInit=!0,_.addEventListener("dispose",T));let K=_.source,et=h.get(K);et===void 0&&(et={},h.set(K,et));let Z=F(_);if(Z!==A.__cacheKey){et[Z]===void 0&&(et[Z]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,N=!0),et[Z].usedTimes++;let yt=et[A.__cacheKey];yt!==void 0&&(et[A.__cacheKey].usedTimes--,yt.usedTimes===0&&M(_)),A.__cacheKey=Z,A.__webglTexture=et[Z].texture}return N}function Ht(A,_,N){return Math.floor(Math.floor(A/N)/_)}function zt(A,_,N,K){let Z=A.updateRanges;if(Z.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,N,K,_.data);else{Z.sort((at,ot)=>at.start-ot.start);let yt=0;for(let at=1;at<Z.length;at++){let ot=Z[yt],St=Z[at],L=ot.start+ot.count,q=Ht(St.start,_.width,4),ut=Ht(ot.start,_.width,4);St.start<=L+1&&q===ut&&Ht(St.start+St.count-1,_.width,4)===q?ot.count=Math.max(ot.count,St.start+St.count-ot.start):(++yt,Z[yt]=St)}Z.length=yt+1;let lt=i.getParameter(i.UNPACK_ROW_LENGTH),Mt=i.getParameter(i.UNPACK_SKIP_PIXELS),Rt=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let at=0,ot=Z.length;at<ot;at++){let St=Z[at],L=Math.floor(St.start/4),q=Math.ceil(St.count/4),ut=L%_.width,I=Math.floor(L/_.width),$=q,Q=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,ut),i.pixelStorei(i.UNPACK_SKIP_ROWS,I),e.texSubImage2D(i.TEXTURE_2D,0,ut,I,$,Q,N,K,_.data)}A.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,lt),i.pixelStorei(i.UNPACK_SKIP_PIXELS,Mt),i.pixelStorei(i.UNPACK_SKIP_ROWS,Rt)}}function J(A,_,N){let K=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(K=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(K=i.TEXTURE_3D);let et=_t(A,_),Z=_.source;e.bindTexture(K,A.__webglTexture,i.TEXTURE0+N);let yt=n.get(Z);if(Z.version!==yt.__version||et===!0){e.activeTexture(i.TEXTURE0+N);let lt=$t.getPrimaries($t.workingColorSpace),Mt=_.colorSpace===An?null:$t.getPrimaries(_.colorSpace),Rt=_.colorSpace===An||lt===Mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Rt);let at=y(_.image,!1,s.maxTextureSize);at=Xt(_,at);let ot=r.convert(_.format,_.colorSpace),St=r.convert(_.type),L=b(_.internalFormat,ot,St,_.colorSpace,_.isVideoTexture);j(K,_);let q,ut=_.mipmaps,I=_.isVideoTexture!==!0,$=yt.__version===void 0||et===!0,Q=Z.dataReady,ct=C(_,at);if(_.isDepthTexture)L=S(_.format===Wn,_.type),$&&(I?e.texStorage2D(i.TEXTURE_2D,1,L,at.width,at.height):e.texImage2D(i.TEXTURE_2D,0,L,at.width,at.height,0,ot,St,null));else if(_.isDataTexture)if(ut.length>0){I&&$&&e.texStorage2D(i.TEXTURE_2D,ct,L,ut[0].width,ut[0].height);for(let nt=0,X=ut.length;nt<X;nt++)q=ut[nt],I?Q&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,q.width,q.height,ot,St,q.data):e.texImage2D(i.TEXTURE_2D,nt,L,q.width,q.height,0,ot,St,q.data);_.generateMipmaps=!1}else I?($&&e.texStorage2D(i.TEXTURE_2D,ct,L,at.width,at.height),Q&&zt(_,at,ot,St)):e.texImage2D(i.TEXTURE_2D,0,L,at.width,at.height,0,ot,St,at.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){I&&$&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ct,L,ut[0].width,ut[0].height,at.depth);for(let nt=0,X=ut.length;nt<X;nt++)if(q=ut[nt],_.format!==Ye)if(ot!==null)if(I){if(Q)if(_.layerUpdates.size>0){let dt=el(q.width,q.height,_.format,_.type);for(let Lt of _.layerUpdates){let Gt=q.data.subarray(Lt*dt/q.data.BYTES_PER_ELEMENT,(Lt+1)*dt/q.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,Lt,q.width,q.height,1,ot,Gt)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,q.width,q.height,at.depth,ot,q.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,nt,L,q.width,q.height,at.depth,0,q.data,0,0);else Pt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else I?Q&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,q.width,q.height,at.depth,ot,St,q.data):e.texImage3D(i.TEXTURE_2D_ARRAY,nt,L,q.width,q.height,at.depth,0,ot,St,q.data)}else{I&&$&&e.texStorage2D(i.TEXTURE_2D,ct,L,ut[0].width,ut[0].height);for(let nt=0,X=ut.length;nt<X;nt++)q=ut[nt],_.format!==Ye?ot!==null?I?Q&&e.compressedTexSubImage2D(i.TEXTURE_2D,nt,0,0,q.width,q.height,ot,q.data):e.compressedTexImage2D(i.TEXTURE_2D,nt,L,q.width,q.height,0,q.data):Pt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):I?Q&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,q.width,q.height,ot,St,q.data):e.texImage2D(i.TEXTURE_2D,nt,L,q.width,q.height,0,ot,St,q.data)}else if(_.isDataArrayTexture)if(I){if($&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ct,L,at.width,at.height,at.depth),Q)if(_.layerUpdates.size>0){let nt=el(at.width,at.height,_.format,_.type);for(let X of _.layerUpdates){let dt=at.data.subarray(X*nt/at.data.BYTES_PER_ELEMENT,(X+1)*nt/at.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,X,at.width,at.height,1,ot,St,dt)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,at.width,at.height,at.depth,ot,St,at.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,L,at.width,at.height,at.depth,0,ot,St,at.data);else if(_.isData3DTexture)I?($&&e.texStorage3D(i.TEXTURE_3D,ct,L,at.width,at.height,at.depth),Q&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,at.width,at.height,at.depth,ot,St,at.data)):e.texImage3D(i.TEXTURE_3D,0,L,at.width,at.height,at.depth,0,ot,St,at.data);else if(_.isFramebufferTexture){if($)if(I)e.texStorage2D(i.TEXTURE_2D,ct,L,at.width,at.height);else{let nt=at.width,X=at.height;for(let dt=0;dt<ct;dt++)e.texImage2D(i.TEXTURE_2D,dt,L,nt,X,0,ot,St,null),nt>>=1,X>>=1}}else if(ut.length>0){if(I&&$){let nt=xt(ut[0]);e.texStorage2D(i.TEXTURE_2D,ct,L,nt.width,nt.height)}for(let nt=0,X=ut.length;nt<X;nt++)q=ut[nt],I?Q&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,ot,St,q):e.texImage2D(i.TEXTURE_2D,nt,L,ot,St,q);_.generateMipmaps=!1}else if(I){if($){let nt=xt(at);e.texStorage2D(i.TEXTURE_2D,ct,L,nt.width,nt.height)}Q&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ot,St,at)}else e.texImage2D(i.TEXTURE_2D,0,L,ot,St,at);f(_)&&u(K),yt.__version=Z.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function it(A,_,N){if(_.image.length!==6)return;let K=_t(A,_),et=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+N);let Z=n.get(et);if(et.version!==Z.__version||K===!0){e.activeTexture(i.TEXTURE0+N);let yt=$t.getPrimaries($t.workingColorSpace),lt=_.colorSpace===An?null:$t.getPrimaries(_.colorSpace),Mt=_.colorSpace===An||yt===lt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Mt);let Rt=_.isCompressedTexture||_.image[0].isCompressedTexture,at=_.image[0]&&_.image[0].isDataTexture,ot=[];for(let X=0;X<6;X++)!Rt&&!at?ot[X]=y(_.image[X],!0,s.maxCubemapSize):ot[X]=at?_.image[X].image:_.image[X],ot[X]=Xt(_,ot[X]);let St=ot[0],L=r.convert(_.format,_.colorSpace),q=r.convert(_.type),ut=b(_.internalFormat,L,q,_.colorSpace),I=_.isVideoTexture!==!0,$=Z.__version===void 0||K===!0,Q=et.dataReady,ct=C(_,St);j(i.TEXTURE_CUBE_MAP,_);let nt;if(Rt){I&&$&&e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,ut,St.width,St.height);for(let X=0;X<6;X++){nt=ot[X].mipmaps;for(let dt=0;dt<nt.length;dt++){let Lt=nt[dt];_.format!==Ye?L!==null?I?Q&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt,0,0,Lt.width,Lt.height,L,Lt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt,ut,Lt.width,Lt.height,0,Lt.data):Pt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):I?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt,0,0,Lt.width,Lt.height,L,q,Lt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt,ut,Lt.width,Lt.height,0,L,q,Lt.data)}}}else{if(nt=_.mipmaps,I&&$){nt.length>0&&ct++;let X=xt(ot[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,ut,X.width,X.height)}for(let X=0;X<6;X++)if(at){I?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,ot[X].width,ot[X].height,L,q,ot[X].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,ut,ot[X].width,ot[X].height,0,L,q,ot[X].data);for(let dt=0;dt<nt.length;dt++){let Gt=nt[dt].image[X].image;I?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt+1,0,0,Gt.width,Gt.height,L,q,Gt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt+1,ut,Gt.width,Gt.height,0,L,q,Gt.data)}}else{I?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,L,q,ot[X]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,ut,L,q,ot[X]);for(let dt=0;dt<nt.length;dt++){let Lt=nt[dt];I?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt+1,0,0,L,q,Lt.image[X]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,dt+1,ut,L,q,Lt.image[X])}}}f(_)&&u(i.TEXTURE_CUBE_MAP),Z.__version=et.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function rt(A,_,N,K,et,Z){let yt=r.convert(N.format,N.colorSpace),lt=r.convert(N.type),Mt=b(N.internalFormat,yt,lt,N.colorSpace),Rt=n.get(_),at=n.get(N);if(at.__renderTarget=_,!Rt.__hasExternalTextures){let ot=Math.max(1,_.width>>Z),St=Math.max(1,_.height>>Z);et===i.TEXTURE_3D||et===i.TEXTURE_2D_ARRAY?e.texImage3D(et,Z,Mt,ot,St,_.depth,0,yt,lt,null):e.texImage2D(et,Z,Mt,ot,St,0,yt,lt,null)}e.bindFramebuffer(i.FRAMEBUFFER,A),ae(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,et,at.__webglTexture,0,P(_)):(et===i.TEXTURE_2D||et>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&et<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,K,et,at.__webglTexture,Z),e.bindFramebuffer(i.FRAMEBUFFER,null)}function It(A,_,N){if(i.bindRenderbuffer(i.RENDERBUFFER,A),_.depthBuffer){let K=_.depthTexture,et=K&&K.isDepthTexture?K.type:null,Z=S(_.stencilBuffer,et),yt=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ae(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,P(_),Z,_.width,_.height):N?i.renderbufferStorageMultisample(i.RENDERBUFFER,P(_),Z,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,Z,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,yt,i.RENDERBUFFER,A)}else{let K=_.textures;for(let et=0;et<K.length;et++){let Z=K[et],yt=r.convert(Z.format,Z.colorSpace),lt=r.convert(Z.type),Mt=b(Z.internalFormat,yt,lt,Z.colorSpace);ae(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,P(_),Mt,_.width,_.height):N?i.renderbufferStorageMultisample(i.RENDERBUFFER,P(_),Mt,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,Mt,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Et(A,_,N){let K=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,A),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let et=n.get(_.depthTexture);if(et.__renderTarget=_,(!et.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),K){if(et.__webglInit===void 0&&(et.__webglInit=!0,_.depthTexture.addEventListener("dispose",T)),et.__webglTexture===void 0){et.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,et.__webglTexture),j(i.TEXTURE_CUBE_MAP,_.depthTexture);let Rt=r.convert(_.depthTexture.format),at=r.convert(_.depthTexture.type),ot;_.depthTexture.format===an?ot=i.DEPTH_COMPONENT24:_.depthTexture.format===Wn&&(ot=i.DEPTH24_STENCIL8);for(let St=0;St<6;St++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+St,0,ot,_.width,_.height,0,Rt,at,null)}}else H(_.depthTexture,0);let Z=et.__webglTexture,yt=P(_),lt=K?i.TEXTURE_CUBE_MAP_POSITIVE_X+N:i.TEXTURE_2D,Mt=_.depthTexture.format===Wn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===an)ae(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Mt,lt,Z,0,yt):i.framebufferTexture2D(i.FRAMEBUFFER,Mt,lt,Z,0);else if(_.depthTexture.format===Wn)ae(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Mt,lt,Z,0,yt):i.framebufferTexture2D(i.FRAMEBUFFER,Mt,lt,Z,0);else throw new Error("Unknown depthTexture format")}function wt(A){let _=n.get(A),N=A.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==A.depthTexture){let K=A.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),K){let et=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,K.removeEventListener("dispose",et)};K.addEventListener("dispose",et),_.__depthDisposeCallback=et}_.__boundDepthTexture=K}if(A.depthTexture&&!_.__autoAllocateDepthBuffer)if(N)for(let K=0;K<6;K++)Et(_.__webglFramebuffer[K],A,K);else{let K=A.texture.mipmaps;K&&K.length>0?Et(_.__webglFramebuffer[0],A,0):Et(_.__webglFramebuffer,A,0)}else if(N){_.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[K]),_.__webglDepthbuffer[K]===void 0)_.__webglDepthbuffer[K]=i.createRenderbuffer(),It(_.__webglDepthbuffer[K],A,!1);else{let et=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=_.__webglDepthbuffer[K];i.bindRenderbuffer(i.RENDERBUFFER,Z),i.framebufferRenderbuffer(i.FRAMEBUFFER,et,i.RENDERBUFFER,Z)}}else{let K=A.texture.mipmaps;if(K&&K.length>0?e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),It(_.__webglDepthbuffer,A,!1);else{let et=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Z),i.framebufferRenderbuffer(i.FRAMEBUFFER,et,i.RENDERBUFFER,Z)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function ce(A,_,N){let K=n.get(A);_!==void 0&&rt(K.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),N!==void 0&&wt(A)}function Wt(A){let _=A.texture,N=n.get(A),K=n.get(_);A.addEventListener("dispose",E);let et=A.textures,Z=A.isWebGLCubeRenderTarget===!0,yt=et.length>1;if(yt||(K.__webglTexture===void 0&&(K.__webglTexture=i.createTexture()),K.__version=_.version,a.memory.textures++),Z){N.__webglFramebuffer=[];for(let lt=0;lt<6;lt++)if(_.mipmaps&&_.mipmaps.length>0){N.__webglFramebuffer[lt]=[];for(let Mt=0;Mt<_.mipmaps.length;Mt++)N.__webglFramebuffer[lt][Mt]=i.createFramebuffer()}else N.__webglFramebuffer[lt]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){N.__webglFramebuffer=[];for(let lt=0;lt<_.mipmaps.length;lt++)N.__webglFramebuffer[lt]=i.createFramebuffer()}else N.__webglFramebuffer=i.createFramebuffer();if(yt)for(let lt=0,Mt=et.length;lt<Mt;lt++){let Rt=n.get(et[lt]);Rt.__webglTexture===void 0&&(Rt.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&ae(A)===!1){N.__webglMultisampledFramebuffer=i.createFramebuffer(),N.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,N.__webglMultisampledFramebuffer);for(let lt=0;lt<et.length;lt++){let Mt=et[lt];N.__webglColorRenderbuffer[lt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,N.__webglColorRenderbuffer[lt]);let Rt=r.convert(Mt.format,Mt.colorSpace),at=r.convert(Mt.type),ot=b(Mt.internalFormat,Rt,at,Mt.colorSpace,A.isXRRenderTarget===!0),St=P(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,St,ot,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.RENDERBUFFER,N.__webglColorRenderbuffer[lt])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(N.__webglDepthRenderbuffer=i.createRenderbuffer(),It(N.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Z){e.bindTexture(i.TEXTURE_CUBE_MAP,K.__webglTexture),j(i.TEXTURE_CUBE_MAP,_);for(let lt=0;lt<6;lt++)if(_.mipmaps&&_.mipmaps.length>0)for(let Mt=0;Mt<_.mipmaps.length;Mt++)rt(N.__webglFramebuffer[lt][Mt],A,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,Mt);else rt(N.__webglFramebuffer[lt],A,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0);f(_)&&u(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(yt){for(let lt=0,Mt=et.length;lt<Mt;lt++){let Rt=et[lt],at=n.get(Rt),ot=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ot=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ot,at.__webglTexture),j(ot,Rt),rt(N.__webglFramebuffer,A,Rt,i.COLOR_ATTACHMENT0+lt,ot,0),f(Rt)&&u(ot)}e.unbindTexture()}else{let lt=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(lt=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(lt,K.__webglTexture),j(lt,_),_.mipmaps&&_.mipmaps.length>0)for(let Mt=0;Mt<_.mipmaps.length;Mt++)rt(N.__webglFramebuffer[Mt],A,_,i.COLOR_ATTACHMENT0,lt,Mt);else rt(N.__webglFramebuffer,A,_,i.COLOR_ATTACHMENT0,lt,0);f(_)&&u(lt),e.unbindTexture()}A.depthBuffer&&wt(A)}function Kt(A){let _=A.textures;for(let N=0,K=_.length;N<K;N++){let et=_[N];if(f(et)){let Z=v(A),yt=n.get(et).__webglTexture;e.bindTexture(Z,yt),u(Z),e.unbindTexture()}}}let te=[],Nt=[];function le(A){if(A.samples>0){if(ae(A)===!1){let _=A.textures,N=A.width,K=A.height,et=i.COLOR_BUFFER_BIT,Z=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,yt=n.get(A),lt=_.length>1;if(lt)for(let Rt=0;Rt<_.length;Rt++)e.bindFramebuffer(i.FRAMEBUFFER,yt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,yt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,yt.__webglMultisampledFramebuffer);let Mt=A.texture.mipmaps;Mt&&Mt.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,yt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,yt.__webglFramebuffer);for(let Rt=0;Rt<_.length;Rt++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(et|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(et|=i.STENCIL_BUFFER_BIT)),lt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,yt.__webglColorRenderbuffer[Rt]);let at=n.get(_[Rt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,at,0)}i.blitFramebuffer(0,0,N,K,0,0,N,K,et,i.NEAREST),l===!0&&(te.length=0,Nt.length=0,te.push(i.COLOR_ATTACHMENT0+Rt),A.depthBuffer&&A.resolveDepthBuffer===!1&&(te.push(Z),Nt.push(Z),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Nt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,te))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),lt)for(let Rt=0;Rt<_.length;Rt++){e.bindFramebuffer(i.FRAMEBUFFER,yt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.RENDERBUFFER,yt.__webglColorRenderbuffer[Rt]);let at=n.get(_[Rt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,yt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.TEXTURE_2D,at,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,yt.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){let _=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function P(A){return Math.min(s.maxSamples,A.samples)}function ae(A){let _=n.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function Ut(A){let _=a.render.frame;d.get(A)!==_&&(d.set(A,_),A.update())}function Xt(A,_){let N=A.colorSpace,K=A.format,et=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||N!==ei&&N!==An&&($t.getTransfer(N)===ee?(K!==Ye||et!==We)&&Pt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Dt("WebGLTextures: Unsupported texture color space:",N)),_}function xt(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=k,this.resetTextureUnits=O,this.setTexture2D=H,this.setTexture2DArray=V,this.setTexture3D=D,this.setTextureCube=st,this.rebindTextures=ce,this.setupRenderTarget=Wt,this.updateRenderTargetMipmap=Kt,this.updateMultisampleRenderTarget=le,this.setupDepthRenderbuffer=wt,this.setupFrameBufferTexture=rt,this.useMultisampledRTT=ae,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Zm(i,t){function e(n,s=An){let r,a=$t.getTransfer(s);if(n===We)return i.UNSIGNED_BYTE;if(n===qr)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Yr)return i.UNSIGNED_SHORT_5_5_5_1;if(n===qo)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Yo)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Wo)return i.BYTE;if(n===Xo)return i.SHORT;if(n===Di)return i.UNSIGNED_SHORT;if(n===Xr)return i.INT;if(n===tn)return i.UNSIGNED_INT;if(n===qe)return i.FLOAT;if(n===dn)return i.HALF_FLOAT;if(n===$o)return i.ALPHA;if(n===Zo)return i.RGB;if(n===Ye)return i.RGBA;if(n===an)return i.DEPTH_COMPONENT;if(n===Wn)return i.DEPTH_STENCIL;if(n===$r)return i.RED;if(n===Zr)return i.RED_INTEGER;if(n===ii)return i.RG;if(n===Jr)return i.RG_INTEGER;if(n===Kr)return i.RGBA_INTEGER;if(n===Ms||n===Ss||n===bs||n===ws)if(a===ee)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ms)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ss)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===bs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===ws)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ms)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ss)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===bs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===ws)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===jr||n===Qr||n===ta||n===ea)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===jr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Qr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ta)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ea)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===na||n===ia||n===sa||n===ra||n===aa||n===oa||n===la)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===na||n===ia)return a===ee?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===sa)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===ra)return r.COMPRESSED_R11_EAC;if(n===aa)return r.COMPRESSED_SIGNED_R11_EAC;if(n===oa)return r.COMPRESSED_RG11_EAC;if(n===la)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===ca||n===ha||n===ua||n===da||n===fa||n===pa||n===ma||n===ga||n===xa||n===_a||n===ya||n===va||n===Ma||n===Sa)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ca)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ha)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ua)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===da)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===fa)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===pa)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ma)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ga)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===xa)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===_a)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ya)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===va)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ma)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Sa)return a===ee?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ba||n===wa||n===Ta)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===ba)return a===ee?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===wa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ta)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Aa||n===Ea||n===Ca||n===Ra)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Aa)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ea)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ca)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ra)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ni?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Jm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Km=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,ml=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new ds(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Ce({vertexShader:Jm,fragmentShader:Km,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new be(new ps(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},gl=class extends wn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,d=null,m=null,h=null,g=null,p=null,y=typeof XRWebGLBinding<"u",f=new ml,u={},v=e.getContextAttributes(),b=null,S=null,C=[],T=[],E=new Qt,x=null,M=new Ee;M.viewport=new ue;let B=new Ee;B.viewport=new ue;let R=[M,B],O=new Vr,k=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let it=C[J];return it===void 0&&(it=new Ci,C[J]=it),it.getTargetRaySpace()},this.getControllerGrip=function(J){let it=C[J];return it===void 0&&(it=new Ci,C[J]=it),it.getGripSpace()},this.getHand=function(J){let it=C[J];return it===void 0&&(it=new Ci,C[J]=it),it.getHandSpace()};function H(J){let it=T.indexOf(J.inputSource);if(it===-1)return;let rt=C[it];rt!==void 0&&(rt.update(J.inputSource,J.frame,c||a),rt.dispatchEvent({type:J.type,data:J.inputSource}))}function V(){s.removeEventListener("select",H),s.removeEventListener("selectstart",H),s.removeEventListener("selectend",H),s.removeEventListener("squeeze",H),s.removeEventListener("squeezestart",H),s.removeEventListener("squeezeend",H),s.removeEventListener("end",V),s.removeEventListener("inputsourceschange",D);for(let J=0;J<C.length;J++){let it=T[J];it!==null&&(T[J]=null,C[J].disconnect(it))}k=null,F=null,f.reset();for(let J in u)delete u[J];t.setRenderTarget(b),g=null,h=null,m=null,s=null,S=null,zt.stop(),n.isPresenting=!1,t.setPixelRatio(x),t.setSize(E.width,E.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){r=J,n.isPresenting===!0&&Pt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,n.isPresenting===!0&&Pt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(J){c=J},this.getBaseLayer=function(){return h!==null?h:g},this.getBinding=function(){return m===null&&y&&(m=new XRWebGLBinding(s,e)),m},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(b=t.getRenderTarget(),s.addEventListener("select",H),s.addEventListener("selectstart",H),s.addEventListener("selectend",H),s.addEventListener("squeeze",H),s.addEventListener("squeezestart",H),s.addEventListener("squeezeend",H),s.addEventListener("end",V),s.addEventListener("inputsourceschange",D),v.xrCompatible!==!0&&await e.makeXRCompatible(),x=t.getPixelRatio(),t.getSize(E),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let rt=null,It=null,Et=null;v.depth&&(Et=v.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,rt=v.stencil?Wn:an,It=v.stencil?Ni:tn);let wt={colorFormat:e.RGBA8,depthFormat:Et,scaleFactor:r};m=this.getBinding(),h=m.createProjectionLayer(wt),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),S=new Ve(h.textureWidth,h.textureHeight,{format:Ye,type:We,depthTexture:new Bn(h.textureWidth,h.textureHeight,It,void 0,void 0,void 0,void 0,void 0,void 0,rt),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{let rt={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};g=new XRWebGLLayer(s,e,rt),s.updateRenderState({baseLayer:g}),t.setPixelRatio(1),t.setSize(g.framebufferWidth,g.framebufferHeight,!1),S=new Ve(g.framebufferWidth,g.framebufferHeight,{format:Ye,type:We,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),zt.setContext(s),zt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return f.getDepthTexture()};function D(J){for(let it=0;it<J.removed.length;it++){let rt=J.removed[it],It=T.indexOf(rt);It>=0&&(T[It]=null,C[It].disconnect(rt))}for(let it=0;it<J.added.length;it++){let rt=J.added[it],It=T.indexOf(rt);if(It===-1){for(let wt=0;wt<C.length;wt++)if(wt>=T.length){T.push(rt),It=wt;break}else if(T[wt]===null){T[wt]=rt,It=wt;break}if(It===-1)break}let Et=C[It];Et&&Et.connect(rt)}}let st=new z,tt=new z;function ht(J,it,rt){st.setFromMatrixPosition(it.matrixWorld),tt.setFromMatrixPosition(rt.matrixWorld);let It=st.distanceTo(tt),Et=it.projectionMatrix.elements,wt=rt.projectionMatrix.elements,ce=Et[14]/(Et[10]-1),Wt=Et[14]/(Et[10]+1),Kt=(Et[9]+1)/Et[5],te=(Et[9]-1)/Et[5],Nt=(Et[8]-1)/Et[0],le=(wt[8]+1)/wt[0],P=ce*Nt,ae=ce*le,Ut=It/(-Nt+le),Xt=Ut*-Nt;if(it.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX(Xt),J.translateZ(Ut),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),Et[10]===-1)J.projectionMatrix.copy(it.projectionMatrix),J.projectionMatrixInverse.copy(it.projectionMatrixInverse);else{let xt=ce+Ut,A=Wt+Ut,_=P-Xt,N=ae+(It-Xt),K=Kt*Wt/A*xt,et=te*Wt/A*xt;J.projectionMatrix.makePerspective(_,N,K,et,xt,A),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function gt(J,it){it===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(it.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let it=J.near,rt=J.far;f.texture!==null&&(f.depthNear>0&&(it=f.depthNear),f.depthFar>0&&(rt=f.depthFar)),O.near=B.near=M.near=it,O.far=B.far=M.far=rt,(k!==O.near||F!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,F=O.far),O.layers.mask=J.layers.mask|6,M.layers.mask=O.layers.mask&-5,B.layers.mask=O.layers.mask&-3;let It=J.parent,Et=O.cameras;gt(O,It);for(let wt=0;wt<Et.length;wt++)gt(Et[wt],It);Et.length===2?ht(O,M,B):O.projectionMatrix.copy(M.projectionMatrix),j(J,O,It)};function j(J,it,rt){rt===null?J.matrix.copy(it.matrixWorld):(J.matrix.copy(rt.matrixWorld),J.matrix.invert(),J.matrix.multiply(it.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(it.projectionMatrix),J.projectionMatrixInverse.copy(it.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=xr*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(h===null&&g===null))return l},this.setFoveation=function(J){l=J,h!==null&&(h.fixedFoveation=J),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=J)},this.hasDepthSensing=function(){return f.texture!==null},this.getDepthSensingMesh=function(){return f.getMesh(O)},this.getCameraTexture=function(J){return u[J]};let _t=null;function Ht(J,it){if(d=it.getViewerPose(c||a),p=it,d!==null){let rt=d.views;g!==null&&(t.setRenderTargetFramebuffer(S,g.framebuffer),t.setRenderTarget(S));let It=!1;rt.length!==O.cameras.length&&(O.cameras.length=0,It=!0);for(let Wt=0;Wt<rt.length;Wt++){let Kt=rt[Wt],te=null;if(g!==null)te=g.getViewport(Kt);else{let le=m.getViewSubImage(h,Kt);te=le.viewport,Wt===0&&(t.setRenderTargetTextures(S,le.colorTexture,le.depthStencilTexture),t.setRenderTarget(S))}let Nt=R[Wt];Nt===void 0&&(Nt=new Ee,Nt.layers.enable(Wt),Nt.viewport=new ue,R[Wt]=Nt),Nt.matrix.fromArray(Kt.transform.matrix),Nt.matrix.decompose(Nt.position,Nt.quaternion,Nt.scale),Nt.projectionMatrix.fromArray(Kt.projectionMatrix),Nt.projectionMatrixInverse.copy(Nt.projectionMatrix).invert(),Nt.viewport.set(te.x,te.y,te.width,te.height),Wt===0&&(O.matrix.copy(Nt.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),It===!0&&O.cameras.push(Nt)}let Et=s.enabledFeatures;if(Et&&Et.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){m=n.getBinding();let Wt=m.getDepthInformation(rt[0]);Wt&&Wt.isValid&&Wt.texture&&f.init(Wt,s.renderState)}if(Et&&Et.includes("camera-access")&&y){t.state.unbindTexture(),m=n.getBinding();for(let Wt=0;Wt<rt.length;Wt++){let Kt=rt[Wt].camera;if(Kt){let te=u[Kt];te||(te=new ds,u[Kt]=te);let Nt=m.getCameraImage(Kt);te.sourceTexture=Nt}}}}for(let rt=0;rt<C.length;rt++){let It=T[rt],Et=C[rt];It!==null&&Et!==void 0&&Et.update(It,it,c||a)}_t&&_t(J,it),it.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:it}),p=null}let zt=new fh;zt.setAnimationLoop(Ht),this.setAnimationLoop=function(J){_t=J},this.dispose=function(){}}},ai=new ln,jm=new re;function Qm(i,t){function e(f,u){f.matrixAutoUpdate===!0&&f.updateMatrix(),u.value.copy(f.matrix)}function n(f,u){u.color.getRGB(f.fogColor.value,jo(i)),u.isFog?(f.fogNear.value=u.near,f.fogFar.value=u.far):u.isFogExp2&&(f.fogDensity.value=u.density)}function s(f,u,v,b,S){u.isMeshBasicMaterial?r(f,u):u.isMeshLambertMaterial?(r(f,u),u.envMap&&(f.envMapIntensity.value=u.envMapIntensity)):u.isMeshToonMaterial?(r(f,u),m(f,u)):u.isMeshPhongMaterial?(r(f,u),d(f,u),u.envMap&&(f.envMapIntensity.value=u.envMapIntensity)):u.isMeshStandardMaterial?(r(f,u),h(f,u),u.isMeshPhysicalMaterial&&g(f,u,S)):u.isMeshMatcapMaterial?(r(f,u),p(f,u)):u.isMeshDepthMaterial?r(f,u):u.isMeshDistanceMaterial?(r(f,u),y(f,u)):u.isMeshNormalMaterial?r(f,u):u.isLineBasicMaterial?(a(f,u),u.isLineDashedMaterial&&o(f,u)):u.isPointsMaterial?l(f,u,v,b):u.isSpriteMaterial?c(f,u):u.isShadowMaterial?(f.color.value.copy(u.color),f.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function r(f,u){f.opacity.value=u.opacity,u.color&&f.diffuse.value.copy(u.color),u.emissive&&f.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(f.map.value=u.map,e(u.map,f.mapTransform)),u.alphaMap&&(f.alphaMap.value=u.alphaMap,e(u.alphaMap,f.alphaMapTransform)),u.bumpMap&&(f.bumpMap.value=u.bumpMap,e(u.bumpMap,f.bumpMapTransform),f.bumpScale.value=u.bumpScale,u.side===Le&&(f.bumpScale.value*=-1)),u.normalMap&&(f.normalMap.value=u.normalMap,e(u.normalMap,f.normalMapTransform),f.normalScale.value.copy(u.normalScale),u.side===Le&&f.normalScale.value.negate()),u.displacementMap&&(f.displacementMap.value=u.displacementMap,e(u.displacementMap,f.displacementMapTransform),f.displacementScale.value=u.displacementScale,f.displacementBias.value=u.displacementBias),u.emissiveMap&&(f.emissiveMap.value=u.emissiveMap,e(u.emissiveMap,f.emissiveMapTransform)),u.specularMap&&(f.specularMap.value=u.specularMap,e(u.specularMap,f.specularMapTransform)),u.alphaTest>0&&(f.alphaTest.value=u.alphaTest);let v=t.get(u),b=v.envMap,S=v.envMapRotation;b&&(f.envMap.value=b,ai.copy(S),ai.x*=-1,ai.y*=-1,ai.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(ai.y*=-1,ai.z*=-1),f.envMapRotation.value.setFromMatrix4(jm.makeRotationFromEuler(ai)),f.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=u.reflectivity,f.ior.value=u.ior,f.refractionRatio.value=u.refractionRatio),u.lightMap&&(f.lightMap.value=u.lightMap,f.lightMapIntensity.value=u.lightMapIntensity,e(u.lightMap,f.lightMapTransform)),u.aoMap&&(f.aoMap.value=u.aoMap,f.aoMapIntensity.value=u.aoMapIntensity,e(u.aoMap,f.aoMapTransform))}function a(f,u){f.diffuse.value.copy(u.color),f.opacity.value=u.opacity,u.map&&(f.map.value=u.map,e(u.map,f.mapTransform))}function o(f,u){f.dashSize.value=u.dashSize,f.totalSize.value=u.dashSize+u.gapSize,f.scale.value=u.scale}function l(f,u,v,b){f.diffuse.value.copy(u.color),f.opacity.value=u.opacity,f.size.value=u.size*v,f.scale.value=b*.5,u.map&&(f.map.value=u.map,e(u.map,f.uvTransform)),u.alphaMap&&(f.alphaMap.value=u.alphaMap,e(u.alphaMap,f.alphaMapTransform)),u.alphaTest>0&&(f.alphaTest.value=u.alphaTest)}function c(f,u){f.diffuse.value.copy(u.color),f.opacity.value=u.opacity,f.rotation.value=u.rotation,u.map&&(f.map.value=u.map,e(u.map,f.mapTransform)),u.alphaMap&&(f.alphaMap.value=u.alphaMap,e(u.alphaMap,f.alphaMapTransform)),u.alphaTest>0&&(f.alphaTest.value=u.alphaTest)}function d(f,u){f.specular.value.copy(u.specular),f.shininess.value=Math.max(u.shininess,1e-4)}function m(f,u){u.gradientMap&&(f.gradientMap.value=u.gradientMap)}function h(f,u){f.metalness.value=u.metalness,u.metalnessMap&&(f.metalnessMap.value=u.metalnessMap,e(u.metalnessMap,f.metalnessMapTransform)),f.roughness.value=u.roughness,u.roughnessMap&&(f.roughnessMap.value=u.roughnessMap,e(u.roughnessMap,f.roughnessMapTransform)),u.envMap&&(f.envMapIntensity.value=u.envMapIntensity)}function g(f,u,v){f.ior.value=u.ior,u.sheen>0&&(f.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),f.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(f.sheenColorMap.value=u.sheenColorMap,e(u.sheenColorMap,f.sheenColorMapTransform)),u.sheenRoughnessMap&&(f.sheenRoughnessMap.value=u.sheenRoughnessMap,e(u.sheenRoughnessMap,f.sheenRoughnessMapTransform))),u.clearcoat>0&&(f.clearcoat.value=u.clearcoat,f.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(f.clearcoatMap.value=u.clearcoatMap,e(u.clearcoatMap,f.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,e(u.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(f.clearcoatNormalMap.value=u.clearcoatNormalMap,e(u.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===Le&&f.clearcoatNormalScale.value.negate())),u.dispersion>0&&(f.dispersion.value=u.dispersion),u.iridescence>0&&(f.iridescence.value=u.iridescence,f.iridescenceIOR.value=u.iridescenceIOR,f.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(f.iridescenceMap.value=u.iridescenceMap,e(u.iridescenceMap,f.iridescenceMapTransform)),u.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=u.iridescenceThicknessMap,e(u.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),u.transmission>0&&(f.transmission.value=u.transmission,f.transmissionSamplerMap.value=v.texture,f.transmissionSamplerSize.value.set(v.width,v.height),u.transmissionMap&&(f.transmissionMap.value=u.transmissionMap,e(u.transmissionMap,f.transmissionMapTransform)),f.thickness.value=u.thickness,u.thicknessMap&&(f.thicknessMap.value=u.thicknessMap,e(u.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=u.attenuationDistance,f.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(f.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(f.anisotropyMap.value=u.anisotropyMap,e(u.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=u.specularIntensity,f.specularColor.value.copy(u.specularColor),u.specularColorMap&&(f.specularColorMap.value=u.specularColorMap,e(u.specularColorMap,f.specularColorMapTransform)),u.specularIntensityMap&&(f.specularIntensityMap.value=u.specularIntensityMap,e(u.specularIntensityMap,f.specularIntensityMapTransform))}function p(f,u){u.matcap&&(f.matcap.value=u.matcap)}function y(f,u){let v=t.get(u).light;f.referencePosition.value.setFromMatrixPosition(v.matrixWorld),f.nearDistance.value=v.shadow.camera.near,f.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function tg(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,b){let S=b.program;n.uniformBlockBinding(v,S)}function c(v,b){let S=s[v.id];S===void 0&&(p(v),S=d(v),s[v.id]=S,v.addEventListener("dispose",f));let C=b.program;n.updateUBOMapping(v,C);let T=t.render.frame;r[v.id]!==T&&(h(v),r[v.id]=T)}function d(v){let b=m();v.__bindingPointIndex=b;let S=i.createBuffer(),C=v.__size,T=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,S),i.bufferData(i.UNIFORM_BUFFER,C,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,b,S),S}function m(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return Dt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(v){let b=s[v.id],S=v.uniforms,C=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,b);for(let T=0,E=S.length;T<E;T++){let x=Array.isArray(S[T])?S[T]:[S[T]];for(let M=0,B=x.length;M<B;M++){let R=x[M];if(g(R,T,M,C)===!0){let O=R.__offset,k=Array.isArray(R.value)?R.value:[R.value],F=0;for(let H=0;H<k.length;H++){let V=k[H],D=y(V);typeof V=="number"||typeof V=="boolean"?(R.__data[0]=V,i.bufferSubData(i.UNIFORM_BUFFER,O+F,R.__data)):V.isMatrix3?(R.__data[0]=V.elements[0],R.__data[1]=V.elements[1],R.__data[2]=V.elements[2],R.__data[3]=0,R.__data[4]=V.elements[3],R.__data[5]=V.elements[4],R.__data[6]=V.elements[5],R.__data[7]=0,R.__data[8]=V.elements[6],R.__data[9]=V.elements[7],R.__data[10]=V.elements[8],R.__data[11]=0):(V.toArray(R.__data,F),F+=D.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,O,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function g(v,b,S,C){let T=v.value,E=b+"_"+S;if(C[E]===void 0)return typeof T=="number"||typeof T=="boolean"?C[E]=T:C[E]=T.clone(),!0;{let x=C[E];if(typeof T=="number"||typeof T=="boolean"){if(x!==T)return C[E]=T,!0}else if(x.equals(T)===!1)return x.copy(T),!0}return!1}function p(v){let b=v.uniforms,S=0,C=16;for(let E=0,x=b.length;E<x;E++){let M=Array.isArray(b[E])?b[E]:[b[E]];for(let B=0,R=M.length;B<R;B++){let O=M[B],k=Array.isArray(O.value)?O.value:[O.value];for(let F=0,H=k.length;F<H;F++){let V=k[F],D=y(V),st=S%C,tt=st%D.boundary,ht=st+tt;S+=tt,ht!==0&&C-ht<D.storage&&(S+=C-ht),O.__data=new Float32Array(D.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=S,S+=D.storage}}}let T=S%C;return T>0&&(S+=C-T),v.__size=S,v.__cache={},this}function y(v){let b={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(b.boundary=4,b.storage=4):v.isVector2?(b.boundary=8,b.storage=8):v.isVector3||v.isColor?(b.boundary=16,b.storage=12):v.isVector4?(b.boundary=16,b.storage=16):v.isMatrix3?(b.boundary=48,b.storage=48):v.isMatrix4?(b.boundary=64,b.storage=64):v.isTexture?Pt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):Pt("WebGLRenderer: Unsupported uniform value type.",v),b}function f(v){let b=v.target;b.removeEventListener("dispose",f);let S=a.indexOf(b.__bindingPointIndex);a.splice(S,1),i.deleteBuffer(s[b.id]),delete s[b.id],delete r[b.id]}function u(){for(let v in s)i.deleteBuffer(s[v]);a=[],s={},r={}}return{bind:l,update:c,dispose:u}}var eg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),fn=null;function ng(){return fn===null&&(fn=new rs(eg,16,16,ii,dn),fn.name="DFG_LUT",fn.minFilter=Se,fn.magFilter=Se,fn.wrapS=rn,fn.wrapT=rn,fn.generateMipmaps=!1,fn.needsUpdate=!0),fn}var Fa=class{constructor(t={}){let{canvas:e=Bc(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:m=!1,reversedDepthBuffer:h=!1,outputBufferType:g=We}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;let y=g,f=new Set([Kr,Jr,Zr]),u=new Set([We,tn,Di,Ni,qr,Yr]),v=new Uint32Array(4),b=new Int32Array(4),S=null,C=null,T=[],E=[],x=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Qe,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let M=this,B=!1;this._outputColorSpace=Ie;let R=0,O=0,k=null,F=-1,H=null,V=new ue,D=new ue,st=null,tt=new Yt(0),ht=0,gt=e.width,j=e.height,_t=1,Ht=null,zt=null,J=new ue(0,0,gt,j),it=new ue(0,0,gt,j),rt=!1,It=new ls,Et=!1,wt=!1,ce=new re,Wt=new z,Kt=new ue,te={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Nt=!1;function le(){return k===null?_t:1}let P=n;function ae(w,U){return e.getContext(w,U)}try{let w={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:m};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"183"}`),e.addEventListener("webglcontextlost",dt,!1),e.addEventListener("webglcontextrestored",Lt,!1),e.addEventListener("webglcontextcreationerror",Gt,!1),P===null){let U="webgl2";if(P=ae(U,w),P===null)throw ae(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(w){throw Dt("WebGLRenderer: "+w.message),w}let Ut,Xt,xt,A,_,N,K,et,Z,yt,lt,Mt,Rt,at,ot,St,L,q,ut,I,$,Q,ct;function nt(){Ut=new hp(P),Ut.init(),$=new Zm(P,Ut),Xt=new np(P,Ut,t,$),xt=new Ym(P,Ut),Xt.reversedDepthBuffer&&h&&xt.buffers.depth.setReversed(!0),A=new fp(P),_=new Dm,N=new $m(P,Ut,xt,_,Xt,$,A),K=new cp(M),et=new xu(P),Q=new tp(P,et),Z=new up(P,et,A,Q),yt=new mp(P,Z,et,Q,A),q=new pp(P,Xt,N),ot=new ip(_),lt=new Lm(M,K,Ut,Xt,Q,ot),Mt=new Qm(M,_),Rt=new Um,at=new Vm(Ut),L=new Qf(M,K,xt,yt,p,l),St=new qm(M,yt,Xt),ct=new tg(P,A,Xt,xt),ut=new ep(P,Ut,A),I=new dp(P,Ut,A),A.programs=lt.programs,M.capabilities=Xt,M.extensions=Ut,M.properties=_,M.renderLists=Rt,M.shadowMap=St,M.state=xt,M.info=A}nt(),y!==We&&(x=new xp(y,e.width,e.height,s,r));let X=new gl(M,P);this.xr=X,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let w=Ut.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){let w=Ut.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return _t},this.setPixelRatio=function(w){w!==void 0&&(_t=w,this.setSize(gt,j,!1))},this.getSize=function(w){return w.set(gt,j)},this.setSize=function(w,U,Y=!0){if(X.isPresenting){Pt("WebGLRenderer: Can't change size while VR device is presenting.");return}gt=w,j=U,e.width=Math.floor(w*_t),e.height=Math.floor(U*_t),Y===!0&&(e.style.width=w+"px",e.style.height=U+"px"),x!==null&&x.setSize(e.width,e.height),this.setViewport(0,0,w,U)},this.getDrawingBufferSize=function(w){return w.set(gt*_t,j*_t).floor()},this.setDrawingBufferSize=function(w,U,Y){gt=w,j=U,_t=Y,e.width=Math.floor(w*Y),e.height=Math.floor(U*Y),this.setViewport(0,0,w,U)},this.setEffects=function(w){if(y===We){console.error("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(w){for(let U=0;U<w.length;U++)if(w[U].isOutputPass===!0){console.warn("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}x.setEffects(w||[])},this.getCurrentViewport=function(w){return w.copy(V)},this.getViewport=function(w){return w.copy(J)},this.setViewport=function(w,U,Y,W){w.isVector4?J.set(w.x,w.y,w.z,w.w):J.set(w,U,Y,W),xt.viewport(V.copy(J).multiplyScalar(_t).round())},this.getScissor=function(w){return w.copy(it)},this.setScissor=function(w,U,Y,W){w.isVector4?it.set(w.x,w.y,w.z,w.w):it.set(w,U,Y,W),xt.scissor(D.copy(it).multiplyScalar(_t).round())},this.getScissorTest=function(){return rt},this.setScissorTest=function(w){xt.setScissorTest(rt=w)},this.setOpaqueSort=function(w){Ht=w},this.setTransparentSort=function(w){zt=w},this.getClearColor=function(w){return w.copy(L.getClearColor())},this.setClearColor=function(){L.setClearColor(...arguments)},this.getClearAlpha=function(){return L.getClearAlpha()},this.setClearAlpha=function(){L.setClearAlpha(...arguments)},this.clear=function(w=!0,U=!0,Y=!0){let W=0;if(w){let G=!1;if(k!==null){let pt=k.texture.format;G=f.has(pt)}if(G){let pt=k.texture.type,vt=u.has(pt),mt=L.getClearColor(),bt=L.getClearAlpha(),At=mt.r,Ft=mt.g,kt=mt.b;vt?(v[0]=At,v[1]=Ft,v[2]=kt,v[3]=bt,P.clearBufferuiv(P.COLOR,0,v)):(b[0]=At,b[1]=Ft,b[2]=kt,b[3]=bt,P.clearBufferiv(P.COLOR,0,b))}else W|=P.COLOR_BUFFER_BIT}U&&(W|=P.DEPTH_BUFFER_BIT),Y&&(W|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),W!==0&&P.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",dt,!1),e.removeEventListener("webglcontextrestored",Lt,!1),e.removeEventListener("webglcontextcreationerror",Gt,!1),L.dispose(),Rt.dispose(),at.dispose(),_.dispose(),K.dispose(),yt.dispose(),Q.dispose(),ct.dispose(),lt.dispose(),X.dispose(),X.removeEventListener("sessionstart",Tl),X.removeEventListener("sessionend",Al),qn.stop()};function dt(w){w.preventDefault(),Ko("WebGLRenderer: Context Lost."),B=!0}function Lt(){Ko("WebGLRenderer: Context Restored."),B=!1;let w=A.autoReset,U=St.enabled,Y=St.autoUpdate,W=St.needsUpdate,G=St.type;nt(),A.autoReset=w,St.enabled=U,St.autoUpdate=Y,St.needsUpdate=W,St.type=G}function Gt(w){Dt("WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function Jt(w){let U=w.target;U.removeEventListener("dispose",Jt),Oe(U)}function Oe(w){De(w),_.remove(w)}function De(w){let U=_.get(w).programs;U!==void 0&&(U.forEach(function(Y){lt.releaseProgram(Y)}),w.isShaderMaterial&&lt.releaseShaderCache(w))}this.renderBufferDirect=function(w,U,Y,W,G,pt){U===null&&(U=te);let vt=G.isMesh&&G.matrixWorld.determinant()<0,mt=Ih(w,U,Y,W,G);xt.setMaterial(W,vt);let bt=Y.index,At=1;if(W.wireframe===!0){if(bt=Z.getWireframeAttribute(Y),bt===void 0)return;At=2}let Ft=Y.drawRange,kt=Y.attributes.position,Ct=Ft.start*At,ne=(Ft.start+Ft.count)*At;pt!==null&&(Ct=Math.max(Ct,pt.start*At),ne=Math.min(ne,(pt.start+pt.count)*At)),bt!==null?(Ct=Math.max(Ct,0),ne=Math.min(ne,bt.count)):kt!=null&&(Ct=Math.max(Ct,0),ne=Math.min(ne,kt.count));let de=ne-Ct;if(de<0||de===1/0)return;Q.setup(G,W,mt,Y,bt);let he,ie=ut;if(bt!==null&&(he=et.get(bt),ie=I,ie.setIndex(he)),G.isMesh)W.wireframe===!0?(xt.setLineWidth(W.wireframeLinewidth*le()),ie.setMode(P.LINES)):ie.setMode(P.TRIANGLES);else if(G.isLine){let we=W.linewidth;we===void 0&&(we=1),xt.setLineWidth(we*le()),G.isLineSegments?ie.setMode(P.LINES):G.isLineLoop?ie.setMode(P.LINE_LOOP):ie.setMode(P.LINE_STRIP)}else G.isPoints?ie.setMode(P.POINTS):G.isSprite&&ie.setMode(P.TRIANGLES);if(G.isBatchedMesh)if(G._multiDrawInstances!==null)Qi("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ie.renderMultiDrawInstances(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount,G._multiDrawInstances);else if(Ut.get("WEBGL_multi_draw"))ie.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{let we=G._multiDrawStarts,Tt=G._multiDrawCounts,Be=G._multiDrawCount,jt=bt?et.get(bt).bytesPerElement:1,$e=_.get(W).currentProgram.getUniforms();for(let en=0;en<Be;en++)$e.setValue(P,"_gl_DrawID",en),ie.render(we[en]/jt,Tt[en])}else if(G.isInstancedMesh)ie.renderInstances(Ct,de,G.count);else if(Y.isInstancedBufferGeometry){let we=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Tt=Math.min(Y.instanceCount,we);ie.renderInstances(Ct,de,Tt)}else ie.render(Ct,de)};function ki(w,U,Y){w.transparent===!0&&w.side===He&&w.forceSinglePass===!1?(w.side=Le,w.needsUpdate=!0,Ls(w,U,Y),w.side=bn,w.needsUpdate=!0,Ls(w,U,Y),w.side=He):Ls(w,U,Y)}this.compile=function(w,U,Y=null){Y===null&&(Y=w),C=at.get(Y),C.init(U),E.push(C),Y.traverseVisible(function(G){G.isLight&&G.layers.test(U.layers)&&(C.pushLight(G),G.castShadow&&C.pushShadow(G))}),w!==Y&&w.traverseVisible(function(G){G.isLight&&G.layers.test(U.layers)&&(C.pushLight(G),G.castShadow&&C.pushShadow(G))}),C.setupLights();let W=new Set;return w.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;let pt=G.material;if(pt)if(Array.isArray(pt))for(let vt=0;vt<pt.length;vt++){let mt=pt[vt];ki(mt,Y,G),W.add(mt)}else ki(pt,Y,G),W.add(pt)}),C=E.pop(),W},this.compileAsync=function(w,U,Y=null){let W=this.compile(w,U,Y);return new Promise(G=>{function pt(){if(W.forEach(function(vt){_.get(vt).currentProgram.isReady()&&W.delete(vt)}),W.size===0){G(w);return}setTimeout(pt,10)}Ut.get("KHR_parallel_shader_compile")!==null?pt():setTimeout(pt,10)})};let Ja=null;function Rh(w){Ja&&Ja(w)}function Tl(){qn.stop()}function Al(){qn.start()}let qn=new fh;qn.setAnimationLoop(Rh),typeof self<"u"&&qn.setContext(self),this.setAnimationLoop=function(w){Ja=w,X.setAnimationLoop(w),w===null?qn.stop():qn.start()},X.addEventListener("sessionstart",Tl),X.addEventListener("sessionend",Al),this.render=function(w,U){if(U!==void 0&&U.isCamera!==!0){Dt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(B===!0)return;let Y=X.enabled===!0&&X.isPresenting===!0,W=x!==null&&(k===null||Y)&&x.begin(M,k);if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),X.enabled===!0&&X.isPresenting===!0&&(x===null||x.isCompositing()===!1)&&(X.cameraAutoUpdate===!0&&X.updateCamera(U),U=X.getCamera()),w.isScene===!0&&w.onBeforeRender(M,w,U,k),C=at.get(w,E.length),C.init(U),E.push(C),ce.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),It.setFromProjectionMatrix(ce,je,U.reversedDepth),wt=this.localClippingEnabled,Et=ot.init(this.clippingPlanes,wt),S=Rt.get(w,T.length),S.init(),T.push(S),X.enabled===!0&&X.isPresenting===!0){let vt=M.xr.getDepthSensingMesh();vt!==null&&Ka(vt,U,-1/0,M.sortObjects)}Ka(w,U,0,M.sortObjects),S.finish(),M.sortObjects===!0&&S.sort(Ht,zt),Nt=X.enabled===!1||X.isPresenting===!1||X.hasDepthSensing()===!1,Nt&&L.addToRenderList(S,w),this.info.render.frame++,Et===!0&&ot.beginShadows();let G=C.state.shadowsArray;if(St.render(G,w,U),Et===!0&&ot.endShadows(),this.info.autoReset===!0&&this.info.reset(),(W&&x.hasRenderPass())===!1){let vt=S.opaque,mt=S.transmissive;if(C.setupLights(),U.isArrayCamera){let bt=U.cameras;if(mt.length>0)for(let At=0,Ft=bt.length;At<Ft;At++){let kt=bt[At];Cl(vt,mt,w,kt)}Nt&&L.render(w);for(let At=0,Ft=bt.length;At<Ft;At++){let kt=bt[At];El(S,w,kt,kt.viewport)}}else mt.length>0&&Cl(vt,mt,w,U),Nt&&L.render(w),El(S,w,U)}k!==null&&O===0&&(N.updateMultisampleRenderTarget(k),N.updateRenderTargetMipmap(k)),W&&x.end(M),w.isScene===!0&&w.onAfterRender(M,w,U),Q.resetDefaultState(),F=-1,H=null,E.pop(),E.length>0?(C=E[E.length-1],Et===!0&&ot.setGlobalState(M.clippingPlanes,C.state.camera)):C=null,T.pop(),T.length>0?S=T[T.length-1]:S=null};function Ka(w,U,Y,W){if(w.visible===!1)return;if(w.layers.test(U.layers)){if(w.isGroup)Y=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(U);else if(w.isLight)C.pushLight(w),w.castShadow&&C.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||It.intersectsSprite(w)){W&&Kt.setFromMatrixPosition(w.matrixWorld).applyMatrix4(ce);let vt=yt.update(w),mt=w.material;mt.visible&&S.push(w,vt,mt,Y,Kt.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||It.intersectsObject(w))){let vt=yt.update(w),mt=w.material;if(W&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Kt.copy(w.boundingSphere.center)):(vt.boundingSphere===null&&vt.computeBoundingSphere(),Kt.copy(vt.boundingSphere.center)),Kt.applyMatrix4(w.matrixWorld).applyMatrix4(ce)),Array.isArray(mt)){let bt=vt.groups;for(let At=0,Ft=bt.length;At<Ft;At++){let kt=bt[At],Ct=mt[kt.materialIndex];Ct&&Ct.visible&&S.push(w,vt,Ct,Y,Kt.z,kt)}}else mt.visible&&S.push(w,vt,mt,Y,Kt.z,null)}}let pt=w.children;for(let vt=0,mt=pt.length;vt<mt;vt++)Ka(pt[vt],U,Y,W)}function El(w,U,Y,W){let{opaque:G,transmissive:pt,transparent:vt}=w;C.setupLightsView(Y),Et===!0&&ot.setGlobalState(M.clippingPlanes,Y),W&&xt.viewport(V.copy(W)),G.length>0&&Ps(G,U,Y),pt.length>0&&Ps(pt,U,Y),vt.length>0&&Ps(vt,U,Y),xt.buffers.depth.setTest(!0),xt.buffers.depth.setMask(!0),xt.buffers.color.setMask(!0),xt.setPolygonOffset(!1)}function Cl(w,U,Y,W){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(C.state.transmissionRenderTarget[W.id]===void 0){let Ct=Ut.has("EXT_color_buffer_half_float")||Ut.has("EXT_color_buffer_float");C.state.transmissionRenderTarget[W.id]=new Ve(1,1,{generateMipmaps:!0,type:Ct?dn:We,minFilter:Hn,samples:Math.max(4,Xt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:$t.workingColorSpace})}let pt=C.state.transmissionRenderTarget[W.id],vt=W.viewport||V;pt.setSize(vt.z*M.transmissionResolutionScale,vt.w*M.transmissionResolutionScale);let mt=M.getRenderTarget(),bt=M.getActiveCubeFace(),At=M.getActiveMipmapLevel();M.setRenderTarget(pt),M.getClearColor(tt),ht=M.getClearAlpha(),ht<1&&M.setClearColor(16777215,.5),M.clear(),Nt&&L.render(Y);let Ft=M.toneMapping;M.toneMapping=Qe;let kt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),C.setupLightsView(W),Et===!0&&ot.setGlobalState(M.clippingPlanes,W),Ps(w,Y,W),N.updateMultisampleRenderTarget(pt),N.updateRenderTargetMipmap(pt),Ut.has("WEBGL_multisampled_render_to_texture")===!1){let Ct=!1;for(let ne=0,de=U.length;ne<de;ne++){let he=U[ne],{object:ie,geometry:we,material:Tt,group:Be}=he;if(Tt.side===He&&ie.layers.test(W.layers)){let jt=Tt.side;Tt.side=Le,Tt.needsUpdate=!0,Rl(ie,Y,W,we,Tt,Be),Tt.side=jt,Tt.needsUpdate=!0,Ct=!0}}Ct===!0&&(N.updateMultisampleRenderTarget(pt),N.updateRenderTargetMipmap(pt))}M.setRenderTarget(mt,bt,At),M.setClearColor(tt,ht),kt!==void 0&&(W.viewport=kt),M.toneMapping=Ft}function Ps(w,U,Y){let W=U.isScene===!0?U.overrideMaterial:null;for(let G=0,pt=w.length;G<pt;G++){let vt=w[G],{object:mt,geometry:bt,group:At}=vt,Ft=vt.material;Ft.allowOverride===!0&&W!==null&&(Ft=W),mt.layers.test(Y.layers)&&Rl(mt,U,Y,bt,Ft,At)}}function Rl(w,U,Y,W,G,pt){w.onBeforeRender(M,U,Y,W,G,pt),w.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),G.onBeforeRender(M,U,Y,W,w,pt),G.transparent===!0&&G.side===He&&G.forceSinglePass===!1?(G.side=Le,G.needsUpdate=!0,M.renderBufferDirect(Y,U,W,G,w,pt),G.side=bn,G.needsUpdate=!0,M.renderBufferDirect(Y,U,W,G,w,pt),G.side=He):M.renderBufferDirect(Y,U,W,G,w,pt),w.onAfterRender(M,U,Y,W,G,pt)}function Ls(w,U,Y){U.isScene!==!0&&(U=te);let W=_.get(w),G=C.state.lights,pt=C.state.shadowsArray,vt=G.state.version,mt=lt.getParameters(w,G.state,pt,U,Y),bt=lt.getProgramCacheKey(mt),At=W.programs;W.environment=w.isMeshStandardMaterial||w.isMeshLambertMaterial||w.isMeshPhongMaterial?U.environment:null,W.fog=U.fog;let Ft=w.isMeshStandardMaterial||w.isMeshLambertMaterial&&!w.envMap||w.isMeshPhongMaterial&&!w.envMap;W.envMap=K.get(w.envMap||W.environment,Ft),W.envMapRotation=W.environment!==null&&w.envMap===null?U.environmentRotation:w.envMapRotation,At===void 0&&(w.addEventListener("dispose",Jt),At=new Map,W.programs=At);let kt=At.get(bt);if(kt!==void 0){if(W.currentProgram===kt&&W.lightsStateVersion===vt)return Pl(w,mt),kt}else mt.uniforms=lt.getUniforms(w),w.onBeforeCompile(mt,M),kt=lt.acquireProgram(mt,bt),At.set(bt,kt),W.uniforms=mt.uniforms;let Ct=W.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Ct.clippingPlanes=ot.uniform),Pl(w,mt),W.needsLights=Lh(w),W.lightsStateVersion=vt,W.needsLights&&(Ct.ambientLightColor.value=G.state.ambient,Ct.lightProbe.value=G.state.probe,Ct.directionalLights.value=G.state.directional,Ct.directionalLightShadows.value=G.state.directionalShadow,Ct.spotLights.value=G.state.spot,Ct.spotLightShadows.value=G.state.spotShadow,Ct.rectAreaLights.value=G.state.rectArea,Ct.ltc_1.value=G.state.rectAreaLTC1,Ct.ltc_2.value=G.state.rectAreaLTC2,Ct.pointLights.value=G.state.point,Ct.pointLightShadows.value=G.state.pointShadow,Ct.hemisphereLights.value=G.state.hemi,Ct.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Ct.spotLightMatrix.value=G.state.spotLightMatrix,Ct.spotLightMap.value=G.state.spotLightMap,Ct.pointShadowMatrix.value=G.state.pointShadowMatrix),W.currentProgram=kt,W.uniformsList=null,kt}function Il(w){if(w.uniformsList===null){let U=w.currentProgram.getUniforms();w.uniformsList=Fi.seqWithValue(U.seq,w.uniforms)}return w.uniformsList}function Pl(w,U){let Y=_.get(w);Y.outputColorSpace=U.outputColorSpace,Y.batching=U.batching,Y.batchingColor=U.batchingColor,Y.instancing=U.instancing,Y.instancingColor=U.instancingColor,Y.instancingMorph=U.instancingMorph,Y.skinning=U.skinning,Y.morphTargets=U.morphTargets,Y.morphNormals=U.morphNormals,Y.morphColors=U.morphColors,Y.morphTargetsCount=U.morphTargetsCount,Y.numClippingPlanes=U.numClippingPlanes,Y.numIntersection=U.numClipIntersection,Y.vertexAlphas=U.vertexAlphas,Y.vertexTangents=U.vertexTangents,Y.toneMapping=U.toneMapping}function Ih(w,U,Y,W,G){U.isScene!==!0&&(U=te),N.resetTextureUnits();let pt=U.fog,vt=W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial?U.environment:null,mt=k===null?M.outputColorSpace:k.isXRRenderTarget===!0?k.texture.colorSpace:ei,bt=W.isMeshStandardMaterial||W.isMeshLambertMaterial&&!W.envMap||W.isMeshPhongMaterial&&!W.envMap,At=K.get(W.envMap||vt,bt),Ft=W.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,kt=!!Y.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Ct=!!Y.morphAttributes.position,ne=!!Y.morphAttributes.normal,de=!!Y.morphAttributes.color,he=Qe;W.toneMapped&&(k===null||k.isXRRenderTarget===!0)&&(he=M.toneMapping);let ie=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,we=ie!==void 0?ie.length:0,Tt=_.get(W),Be=C.state.lights;if(Et===!0&&(wt===!0||w!==H)){let xe=w===H&&W.id===F;ot.setState(W,w,xe)}let jt=!1;W.version===Tt.__version?(Tt.needsLights&&Tt.lightsStateVersion!==Be.state.version||Tt.outputColorSpace!==mt||G.isBatchedMesh&&Tt.batching===!1||!G.isBatchedMesh&&Tt.batching===!0||G.isBatchedMesh&&Tt.batchingColor===!0&&G.colorTexture===null||G.isBatchedMesh&&Tt.batchingColor===!1&&G.colorTexture!==null||G.isInstancedMesh&&Tt.instancing===!1||!G.isInstancedMesh&&Tt.instancing===!0||G.isSkinnedMesh&&Tt.skinning===!1||!G.isSkinnedMesh&&Tt.skinning===!0||G.isInstancedMesh&&Tt.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&Tt.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&Tt.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&Tt.instancingMorph===!1&&G.morphTexture!==null||Tt.envMap!==At||W.fog===!0&&Tt.fog!==pt||Tt.numClippingPlanes!==void 0&&(Tt.numClippingPlanes!==ot.numPlanes||Tt.numIntersection!==ot.numIntersection)||Tt.vertexAlphas!==Ft||Tt.vertexTangents!==kt||Tt.morphTargets!==Ct||Tt.morphNormals!==ne||Tt.morphColors!==de||Tt.toneMapping!==he||Tt.morphTargetsCount!==we)&&(jt=!0):(jt=!0,Tt.__version=W.version);let $e=Tt.currentProgram;jt===!0&&($e=Ls(W,U,G));let en=!1,Yn=!1,hi=!1,se=$e.getUniforms(),ve=Tt.uniforms;if(xt.useProgram($e.program)&&(en=!0,Yn=!0,hi=!0),W.id!==F&&(F=W.id,Yn=!0),en||H!==w){xt.buffers.depth.getReversed()&&w.reversedDepth!==!0&&(w._reversedDepth=!0,w.updateProjectionMatrix()),se.setValue(P,"projectionMatrix",w.projectionMatrix),se.setValue(P,"viewMatrix",w.matrixWorldInverse);let Cn=se.map.cameraPosition;Cn!==void 0&&Cn.setValue(P,Wt.setFromMatrixPosition(w.matrixWorld)),Xt.logarithmicDepthBuffer&&se.setValue(P,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&se.setValue(P,"isOrthographic",w.isOrthographicCamera===!0),H!==w&&(H=w,Yn=!0,hi=!0)}if(Tt.needsLights&&(Be.state.directionalShadowMap.length>0&&se.setValue(P,"directionalShadowMap",Be.state.directionalShadowMap,N),Be.state.spotShadowMap.length>0&&se.setValue(P,"spotShadowMap",Be.state.spotShadowMap,N),Be.state.pointShadowMap.length>0&&se.setValue(P,"pointShadowMap",Be.state.pointShadowMap,N)),G.isSkinnedMesh){se.setOptional(P,G,"bindMatrix"),se.setOptional(P,G,"bindMatrixInverse");let xe=G.skeleton;xe&&(xe.boneTexture===null&&xe.computeBoneTexture(),se.setValue(P,"boneTexture",xe.boneTexture,N))}G.isBatchedMesh&&(se.setOptional(P,G,"batchingTexture"),se.setValue(P,"batchingTexture",G._matricesTexture,N),se.setOptional(P,G,"batchingIdTexture"),se.setValue(P,"batchingIdTexture",G._indirectTexture,N),se.setOptional(P,G,"batchingColorTexture"),G._colorsTexture!==null&&se.setValue(P,"batchingColorTexture",G._colorsTexture,N));let En=Y.morphAttributes;if((En.position!==void 0||En.normal!==void 0||En.color!==void 0)&&q.update(G,Y,$e),(Yn||Tt.receiveShadow!==G.receiveShadow)&&(Tt.receiveShadow=G.receiveShadow,se.setValue(P,"receiveShadow",G.receiveShadow)),(W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial)&&W.envMap===null&&U.environment!==null&&(ve.envMapIntensity.value=U.environmentIntensity),ve.dfgLUT!==void 0&&(ve.dfgLUT.value=ng()),Yn&&(se.setValue(P,"toneMappingExposure",M.toneMappingExposure),Tt.needsLights&&Ph(ve,hi),pt&&W.fog===!0&&Mt.refreshFogUniforms(ve,pt),Mt.refreshMaterialUniforms(ve,W,_t,j,C.state.transmissionRenderTarget[w.id]),Fi.upload(P,Il(Tt),ve,N)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Fi.upload(P,Il(Tt),ve,N),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&se.setValue(P,"center",G.center),se.setValue(P,"modelViewMatrix",G.modelViewMatrix),se.setValue(P,"normalMatrix",G.normalMatrix),se.setValue(P,"modelMatrix",G.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let xe=W.uniformsGroups;for(let Cn=0,ui=xe.length;Cn<ui;Cn++){let Ll=xe[Cn];ct.update(Ll,$e),ct.bind(Ll,$e)}}return $e}function Ph(w,U){w.ambientLightColor.needsUpdate=U,w.lightProbe.needsUpdate=U,w.directionalLights.needsUpdate=U,w.directionalLightShadows.needsUpdate=U,w.pointLights.needsUpdate=U,w.pointLightShadows.needsUpdate=U,w.spotLights.needsUpdate=U,w.spotLightShadows.needsUpdate=U,w.rectAreaLights.needsUpdate=U,w.hemisphereLights.needsUpdate=U}function Lh(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return O},this.getRenderTarget=function(){return k},this.setRenderTargetTextures=function(w,U,Y){let W=_.get(w);W.__autoAllocateDepthBuffer=w.resolveDepthBuffer===!1,W.__autoAllocateDepthBuffer===!1&&(W.__useRenderToTexture=!1),_.get(w.texture).__webglTexture=U,_.get(w.depthTexture).__webglTexture=W.__autoAllocateDepthBuffer?void 0:Y,W.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(w,U){let Y=_.get(w);Y.__webglFramebuffer=U,Y.__useDefaultFramebuffer=U===void 0};let Dh=P.createFramebuffer();this.setRenderTarget=function(w,U=0,Y=0){k=w,R=U,O=Y;let W=null,G=!1,pt=!1;if(w){let mt=_.get(w);if(mt.__useDefaultFramebuffer!==void 0){xt.bindFramebuffer(P.FRAMEBUFFER,mt.__webglFramebuffer),V.copy(w.viewport),D.copy(w.scissor),st=w.scissorTest,xt.viewport(V),xt.scissor(D),xt.setScissorTest(st),F=-1;return}else if(mt.__webglFramebuffer===void 0)N.setupRenderTarget(w);else if(mt.__hasExternalTextures)N.rebindTextures(w,_.get(w.texture).__webglTexture,_.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){let Ft=w.depthTexture;if(mt.__boundDepthTexture!==Ft){if(Ft!==null&&_.has(Ft)&&(w.width!==Ft.image.width||w.height!==Ft.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");N.setupDepthRenderbuffer(w)}}let bt=w.texture;(bt.isData3DTexture||bt.isDataArrayTexture||bt.isCompressedArrayTexture)&&(pt=!0);let At=_.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(At[U])?W=At[U][Y]:W=At[U],G=!0):w.samples>0&&N.useMultisampledRTT(w)===!1?W=_.get(w).__webglMultisampledFramebuffer:Array.isArray(At)?W=At[Y]:W=At,V.copy(w.viewport),D.copy(w.scissor),st=w.scissorTest}else V.copy(J).multiplyScalar(_t).floor(),D.copy(it).multiplyScalar(_t).floor(),st=rt;if(Y!==0&&(W=Dh),xt.bindFramebuffer(P.FRAMEBUFFER,W)&&xt.drawBuffers(w,W),xt.viewport(V),xt.scissor(D),xt.setScissorTest(st),G){let mt=_.get(w.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+U,mt.__webglTexture,Y)}else if(pt){let mt=U;for(let bt=0;bt<w.textures.length;bt++){let At=_.get(w.textures[bt]);P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0+bt,At.__webglTexture,Y,mt)}}else if(w!==null&&Y!==0){let mt=_.get(w.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,mt.__webglTexture,Y)}F=-1},this.readRenderTargetPixels=function(w,U,Y,W,G,pt,vt,mt=0){if(!(w&&w.isWebGLRenderTarget)){Dt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=_.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&vt!==void 0&&(bt=bt[vt]),bt){xt.bindFramebuffer(P.FRAMEBUFFER,bt);try{let At=w.textures[mt],Ft=At.format,kt=At.type;if(w.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+mt),!Xt.textureFormatReadable(Ft)){Dt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Xt.textureTypeReadable(kt)){Dt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=w.width-W&&Y>=0&&Y<=w.height-G&&P.readPixels(U,Y,W,G,$.convert(Ft),$.convert(kt),pt)}finally{let At=k!==null?_.get(k).__webglFramebuffer:null;xt.bindFramebuffer(P.FRAMEBUFFER,At)}}},this.readRenderTargetPixelsAsync=async function(w,U,Y,W,G,pt,vt,mt=0){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=_.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&vt!==void 0&&(bt=bt[vt]),bt)if(U>=0&&U<=w.width-W&&Y>=0&&Y<=w.height-G){xt.bindFramebuffer(P.FRAMEBUFFER,bt);let At=w.textures[mt],Ft=At.format,kt=At.type;if(w.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+mt),!Xt.textureFormatReadable(Ft))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Xt.textureTypeReadable(kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ct=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,Ct),P.bufferData(P.PIXEL_PACK_BUFFER,pt.byteLength,P.STREAM_READ),P.readPixels(U,Y,W,G,$.convert(Ft),$.convert(kt),0);let ne=k!==null?_.get(k).__webglFramebuffer:null;xt.bindFramebuffer(P.FRAMEBUFFER,ne);let de=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await kc(P,de,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,Ct),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,pt),P.deleteBuffer(Ct),P.deleteSync(de),pt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(w,U=null,Y=0){let W=Math.pow(2,-Y),G=Math.floor(w.image.width*W),pt=Math.floor(w.image.height*W),vt=U!==null?U.x:0,mt=U!==null?U.y:0;N.setTexture2D(w,0),P.copyTexSubImage2D(P.TEXTURE_2D,Y,0,0,vt,mt,G,pt),xt.unbindTexture()};let Nh=P.createFramebuffer(),Uh=P.createFramebuffer();this.copyTextureToTexture=function(w,U,Y=null,W=null,G=0,pt=0){let vt,mt,bt,At,Ft,kt,Ct,ne,de,he=w.isCompressedTexture?w.mipmaps[pt]:w.image;if(Y!==null)vt=Y.max.x-Y.min.x,mt=Y.max.y-Y.min.y,bt=Y.isBox3?Y.max.z-Y.min.z:1,At=Y.min.x,Ft=Y.min.y,kt=Y.isBox3?Y.min.z:0;else{let ve=Math.pow(2,-G);vt=Math.floor(he.width*ve),mt=Math.floor(he.height*ve),w.isDataArrayTexture?bt=he.depth:w.isData3DTexture?bt=Math.floor(he.depth*ve):bt=1,At=0,Ft=0,kt=0}W!==null?(Ct=W.x,ne=W.y,de=W.z):(Ct=0,ne=0,de=0);let ie=$.convert(U.format),we=$.convert(U.type),Tt;U.isData3DTexture?(N.setTexture3D(U,0),Tt=P.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(N.setTexture2DArray(U,0),Tt=P.TEXTURE_2D_ARRAY):(N.setTexture2D(U,0),Tt=P.TEXTURE_2D),P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,U.flipY),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),P.pixelStorei(P.UNPACK_ALIGNMENT,U.unpackAlignment);let Be=P.getParameter(P.UNPACK_ROW_LENGTH),jt=P.getParameter(P.UNPACK_IMAGE_HEIGHT),$e=P.getParameter(P.UNPACK_SKIP_PIXELS),en=P.getParameter(P.UNPACK_SKIP_ROWS),Yn=P.getParameter(P.UNPACK_SKIP_IMAGES);P.pixelStorei(P.UNPACK_ROW_LENGTH,he.width),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,he.height),P.pixelStorei(P.UNPACK_SKIP_PIXELS,At),P.pixelStorei(P.UNPACK_SKIP_ROWS,Ft),P.pixelStorei(P.UNPACK_SKIP_IMAGES,kt);let hi=w.isDataArrayTexture||w.isData3DTexture,se=U.isDataArrayTexture||U.isData3DTexture;if(w.isDepthTexture){let ve=_.get(w),En=_.get(U),xe=_.get(ve.__renderTarget),Cn=_.get(En.__renderTarget);xt.bindFramebuffer(P.READ_FRAMEBUFFER,xe.__webglFramebuffer),xt.bindFramebuffer(P.DRAW_FRAMEBUFFER,Cn.__webglFramebuffer);for(let ui=0;ui<bt;ui++)hi&&(P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,_.get(w).__webglTexture,G,kt+ui),P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,_.get(U).__webglTexture,pt,de+ui)),P.blitFramebuffer(At,Ft,vt,mt,Ct,ne,vt,mt,P.DEPTH_BUFFER_BIT,P.NEAREST);xt.bindFramebuffer(P.READ_FRAMEBUFFER,null),xt.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else if(G!==0||w.isRenderTargetTexture||_.has(w)){let ve=_.get(w),En=_.get(U);xt.bindFramebuffer(P.READ_FRAMEBUFFER,Nh),xt.bindFramebuffer(P.DRAW_FRAMEBUFFER,Uh);for(let xe=0;xe<bt;xe++)hi?P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,ve.__webglTexture,G,kt+xe):P.framebufferTexture2D(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,ve.__webglTexture,G),se?P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,En.__webglTexture,pt,de+xe):P.framebufferTexture2D(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,En.__webglTexture,pt),G!==0?P.blitFramebuffer(At,Ft,vt,mt,Ct,ne,vt,mt,P.COLOR_BUFFER_BIT,P.NEAREST):se?P.copyTexSubImage3D(Tt,pt,Ct,ne,de+xe,At,Ft,vt,mt):P.copyTexSubImage2D(Tt,pt,Ct,ne,At,Ft,vt,mt);xt.bindFramebuffer(P.READ_FRAMEBUFFER,null),xt.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else se?w.isDataTexture||w.isData3DTexture?P.texSubImage3D(Tt,pt,Ct,ne,de,vt,mt,bt,ie,we,he.data):U.isCompressedArrayTexture?P.compressedTexSubImage3D(Tt,pt,Ct,ne,de,vt,mt,bt,ie,he.data):P.texSubImage3D(Tt,pt,Ct,ne,de,vt,mt,bt,ie,we,he):w.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,pt,Ct,ne,vt,mt,ie,we,he.data):w.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,pt,Ct,ne,he.width,he.height,ie,he.data):P.texSubImage2D(P.TEXTURE_2D,pt,Ct,ne,vt,mt,ie,we,he);P.pixelStorei(P.UNPACK_ROW_LENGTH,Be),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,jt),P.pixelStorei(P.UNPACK_SKIP_PIXELS,$e),P.pixelStorei(P.UNPACK_SKIP_ROWS,en),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Yn),pt===0&&U.generateMipmaps&&P.generateMipmap(Tt),xt.unbindTexture()},this.initRenderTarget=function(w){_.get(w).__webglFramebuffer===void 0&&N.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?N.setTextureCube(w,0):w.isData3DTexture?N.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?N.setTexture2DArray(w,0):N.setTexture2D(w,0),xt.unbindTexture()},this.resetState=function(){R=0,O=0,k=null,xt.reset(),Q.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return je}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=$t._getDrawingBufferColorSpace(t),e.unpackColorSpace=$t._getUnpackColorSpace()}};var _h="backstory.graph.forces.v1",Bi=Object.freeze({spring:1,repulsion:1,gravity:1});function za(i){return Object.fromEntries(Object.entries(Bi).map(([t,e])=>{let n=i?.[t];return[t,typeof n=="number"&&Number.isFinite(n)&&n>=.25&&n<=4?Math.round(n*4)/4:e]}))}function yh(i){try{let t=JSON.parse(i?.getItem(_h)||"null");if(t?.version===1)return za(t)}catch{}return{...Bi}}function xl(i,t){try{i?.setItem(_h,JSON.stringify({version:1,...za(t)}))}catch{}}var Zt=Object.freeze({step:1/60,catchUp:4,restLength:90,stiffness:8,repulsion:12e5,softening:144,forceCap:300,collisionRadius:22,collisionStrength:20,center:.04,damping:4.8,speedCap:600,maxSteps:720,restSpeed:2,restSteps:45,visits:192,chunkSize:64,frameMilliseconds:6});function vh(i){let t=2166136261;for(let e of i)t=Math.imul(t^e.codePointAt(0),16777619);return t>>>0}function _l(i){let t=vh(i),e=t/4294967296*Math.PI*2,n=vh(i+"\0z")/4294967296*2-1,s=60+t%240;return{x:Math.cos(e)*Math.sqrt(1-n*n)*s,y:Math.sin(e)*Math.sqrt(1-n*n)*s,z:n*s}}function*sg(i){let t=1,e=0;for(let s of i)t=Math.max(t,Math.abs(s.x),Math.abs(s.y),Math.abs(s.z)),++e%Zt.chunkSize===0&&(yield);let n={x:0,y:0,z:0,radius:t+1,count:0,sx:0,sy:0,sz:0};for(let s of i){let r=n;for(let a=0;r.count++,r.sx+=s.x,r.sy+=s.y,r.sz+=s.z,!(a===16||r.radius<.1);a++){r.children||=Array(8);let o=(s.x>=r.x?1:0)|(s.y>=r.y?2:0)|(s.z>=r.z?4:0),l=r.radius/2;r=r.children[o]||={x:r.x+(o&1?l:-l),y:r.y+(o&2?l:-l),z:r.z+(o&4?l:-l),radius:l,count:0,sx:0,sy:0,sz:0}}++e%Zt.chunkSize===0&&(yield)}return n}var ka=class{constructor(t=[],e=[],n=null){this.positionVersion=0,this.version=0,this.staged=new Float64Array(0),this.nodes=new Map,this.forces={...Bi},this.root=n,this.selected=n,this.setGraph(t,e)}setGraph(t,e){let n=this.nodes;this.nodes=new Map(t.map(s=>[s.path,n.get(s.path)||{path:s.path,..._l(s.path),vx:0,vy:0,vz:0,pinned:!1}])),this.outgoing=new Map([...this.nodes.keys()].map(s=>[s,new Set]));for(let s of e){let r=this.nodes.get(s.source),a=this.nodes.get(s.destination);if(!(!r||!a||r===a)){this.outgoing.get(s.source).add(s.destination);for(let[o,l]of[[r,a],[a,r]])if(!n.has(o.path)&&n.has(l.path)){let c=_l(o.path);o.x=l.x+c.x*.3,o.y=l.y+c.y*.3,o.z=l.z+c.z*.3}}}this.all=[...this.nodes.values()],this.all.length?this.staged.length<this.all.length*6&&(this.staged=new Float64Array(this.all.length*6)):(this.staged.fill(0),this.staged=new Float64Array(0)),this.positionVersion++,this.updateSprings(),this.reheat()}setSelection(t){t!==this.selected&&(this.selected=t)}setRoot(t){t!==this.root&&(this.root=t,this.updateSprings(),this.reheat())}updateSprings(){this.depths=new Map([...this.nodes.keys()].map(e=>[e,1/0]));let t=[];this.nodes.has(this.root)&&(this.depths.set(this.root,0),t.push(this.root));for(let e=0;e<t.length;e++){let n=t[e],s=this.depths.get(n)+1;for(let r of this.outgoing.get(n))this.depths.get(r)===1/0&&(this.depths.set(r,s),t.push(r))}this.springs=[];for(let e of t)for(let n of this.outgoing.get(e))this.isSpringEdge(e,n)&&this.springs.push([this.nodes.get(e),this.nodes.get(n)])}isSpringEdge(t,e){let n=this.depths.get(t);return Number.isFinite(n)&&this.depths.get(e)===n+1}setForces(t){this.forces=za(t),this.reheat()}cancelPending(){this.version++,this.pendingStep=null,this.accumulator=0}pause(){this.cancelPending(),this.active=!1;let t=!1;for(let e of this.all)t||=e.vx!==0||e.vy!==0||e.vz!==0,e.vx=e.vy=e.vz=0;t&&this.positionVersion++}reheat(){this.cancelPending(),this.active=!0,this.steps=0,this.quiet=0,this.accumulator=0,this.limitReached=!1}pin(t,e,n,s=this.nodes.get(t)?.z??0){let r=this.nodes.get(t);!r||![e,n,s].every(Number.isFinite)||(Object.assign(r,{x:e,y:n,z:s,vx:0,vy:0,vz:0,pinned:!0}),this.positionVersion++,this.reheat())}unpin(t){let e=this.nodes.get(t);e&&(e.pinned=!1,e.vx=e.vy=e.vz=0,this.positionVersion++,this.reheat())}releaseAll(){this.cancelPending();let t=!1;for(let e of this.all)t||=e.pinned,e.pinned=!1;t&&this.positionVersion++}step(){if(!this.active)return;let t=this.pendingStep||this.stepWork();for(;!t.next().done;);this.pendingStep=null}stepWork(){return this.integrateStep(this.version)}*integrateStep(t){if(t!==this.version)return;let e=this.all,n=this.staged;this.interactions=0;let s=0;for(let p of e)if(p.fx=-p.x*Zt.center*this.forces.gravity,p.fy=-p.y*Zt.center*this.forces.gravity,p.fz=-p.z*Zt.center*this.forces.gravity,++s%Zt.chunkSize===0&&(yield,t!==this.version))return;let r=(p,y,f,u,v,b)=>{let S=y-p.x,C=f-p.y,T=u-p.z,E=Math.hypot(S,C,T);if(E<.01){let M=_l(p.path+"\0"+b);S=M.x,C=M.y,T=M.z,E=Math.hypot(S,C,T)}let x=Math.min(Zt.forceCap*Math.sqrt(v),Zt.repulsion*this.forces.repulsion*v/(E*E+Zt.softening))+Math.max(0,Zt.collisionRadius*2-E)*Zt.collisionStrength;p.fx-=S/E*x,p.fy-=C/E*x,p.fz-=T/E*x,this.interactions++};if(e.length<=256)for(let p=0;p<e.length;p++)for(let y=p+1;y<e.length;y++){let f=e[p],u=e[y],v=f.fx,b=f.fy,S=f.fz;if(r(f,u.x,u.y,u.z,1,u.path),u.fx-=f.fx-v,u.fy-=f.fy-b,u.fz-=f.fz-S,++s%Zt.chunkSize===0&&(yield,t!==this.version))return}else{let p=sg(e),y;for(;!(y=p.next()).done;)if(yield,t!==this.version)return;let f=y.value;for(let u of e){let v=[f],b=0;for(;v.length;){let S=v.pop();b++;let C=Math.abs(u.x-S.x)<=S.radius&&Math.abs(u.y-S.y)<=S.radius&&Math.abs(u.z-S.z)<=S.radius,T=S.count-(C?1:0);if(T<=0)continue;let E=(S.sx-(C?u.x:0))/T,x=(S.sy-(C?u.y:0))/T,M=(S.sz-(C?u.z:0))/T;if(S.children&&b+v.length+8<Zt.visits&&(C||S.radius*2/Math.max(1,Math.hypot(E-u.x,x-u.y,M-u.z))>.9))for(let B of S.children)B&&v.push(B);else r(u,E,x,M,T,"cell")}if(++s%Zt.chunkSize===0&&(yield,t!==this.version))return}}for(let[p,y]of this.springs){let f=y.x-p.x,u=y.y-p.y,v=y.z-p.z,b=Math.max(.01,Math.hypot(f,u,v)),S=Zt.stiffness*this.forces.spring*(b-Zt.restLength)/b;if(p.fx+=f*S,p.fy+=u*S,p.fz+=v*S,y.fx-=f*S,y.fy-=u*S,y.fz-=v*S,++s%Zt.chunkSize===0&&(yield,t!==this.version))return}let a=0,o=!1,l=Zt.step,c=Math.exp(-Zt.damping*l),d=Math.max(.08,1-this.steps/Zt.maxSteps);for(let p=0;p<e.length;p++){let y=e[p],f=p*6,u=y.vx,v=y.vy,b=y.vz;if(y.pinned)o=!0;else{u=(u+y.fx*l*d)*c,v=(v+y.fy*l*d)*c,b=(b+y.fz*l*d)*c;let S=Math.hypot(u,v,b),C=Math.min(1,Zt.speedCap/Math.max(1,S));u*=C,v*=C,b*=C,a=Math.max(a,Math.min(S,Zt.speedCap))}if(n[f]=y.x+(y.pinned?0:u*l),n[f+1]=y.y+(y.pinned?0:v*l),n[f+2]=y.z+(y.pinned?0:b*l),n[f+3]=u,n[f+4]=v,n[f+5]=b,++s%Zt.chunkSize===0&&(yield,t!==this.version))return}let m=this.steps+1,h=a<Zt.restSpeed&&!o?this.quiet+1:0,g=m>=Zt.maxSteps||h>=Zt.restSteps||!e.length;if(t===this.version){for(let p=0;p<e.length;p++){let y=e[p],f=p*6;y.x=n[f],y.y=n[f+1],y.z=n[f+2],y.vx=g?0:n[f+3],y.vy=g?0:n[f+4],y.vz=g?0:n[f+5]}this.steps=m,this.quiet=h,this.positionVersion++,g&&(this.limitReached=m>=Zt.maxSteps,this.active=!1)}}advance(t){if(!Number.isFinite(t)||t<=0||!this.active)return this.active;this.accumulator=Math.min(Zt.step*Zt.catchUp,this.accumulator+t);let e=performance.now()+Zt.frameMilliseconds,n=0;for(;this.active&&n<Zt.catchUp&&(this.pendingStep||this.accumulator>=Zt.step)&&(this.pendingStep||=this.stepWork(),this.pendingStep.next().done&&(this.pendingStep=null,this.accumulator=Math.max(0,this.accumulator-Zt.step),n++),!(performance.now()>=e)););return this.active}settle(t=240){this.cancelPending();for(let e=0;e<Math.min(t,Zt.maxSteps)&&this.active;e++)this.step();this.pause(),this.releaseAll();for(let e of this.all)e.vx=e.vy=e.vz=0;this.positionVersion++}destroy(){this.pause(),this.releaseAll(),this.staged.fill(0),this.staged=new Float64Array(0),this.positionVersion++,this.nodes.clear(),this.outgoing.clear(),this.depths.clear(),this.all=[],this.springs=[]}};var Va=class{constructor(t=960,e=600){this.width=t,this.height=e,this.x=this.y=this.z=this.targetX=this.targetY=this.targetZ=0,this.yaw=this.pitch=this.targetYaw=this.targetPitch=0,this.distance=this.targetDistance=900,this.fov=Math.PI/4}get focal(){return this.height/(2*Math.tan(this.fov/2))}get scale(){return this.focal/this.distance}basis(){let t=Math.cos(this.yaw),e=Math.sin(this.yaw),n=Math.cos(this.pitch),s=Math.sin(this.pitch);return{right:{x:t,y:0,z:-e},up:{x:e*s,y:-n,z:t*s},back:{x:e*n,y:s,z:t*n}}}eye(t=this.basis()){let e=t.back;return{x:this.x+e.x*this.distance,y:this.y+e.y*this.distance,z:this.z+e.z*this.distance}}world(t,e={x:this.x,y:this.y,z:this.z}){let{right:n,up:s,back:r}=this.basis(),a=this.distance-((e.x-this.x)*r.x+(e.y-this.y)*r.y+((e.z??0)-this.z)*r.z),o=(t.x-this.width/2)*a/this.focal,l=(t.y-this.height/2)*a/this.focal,c=this.distance-a;return{x:this.x+r.x*c+n.x*o+s.x*l,y:this.y+r.y*c+n.y*o+s.y*l,z:this.z+r.z*c+n.z*o+s.z*l}}screen(t,e={},n=this.basis()){let{right:s,up:r,back:a}=n,o=t.x-this.x,l=t.y-this.y,c=(t.z??0)-this.z,d=this.distance-(o*a.x+l*a.y+c*a.z),m=this.focal/Math.max(.01,d);return e.x=this.width/2+(o*s.x+l*s.y+c*s.z)*m,e.y=this.height/2+(o*r.x+l*r.y+c*r.z)*m,e.depth=d,e.scale=m,e.visible=d>1&&d<1e6,e}snap(){for(let t of["x","y","z","yaw","pitch","distance"])this[t]=this["target"+t[0].toUpperCase()+t.slice(1)]}zoom(t,e={x:this.width/2,y:this.height/2},n=!1){let s=this.world(e),r=Math.min(2e5,Math.max(35,this.targetDistance/t))/this.distance;this.targetDistance=this.distance*r,this.targetX=s.x+(this.x-s.x)*r,this.targetY=s.y+(this.y-s.y)*r,this.targetZ=s.z+(this.z-s.z)*r,n&&this.snap()}pan(t,e,n=!1){let{right:s,up:r}=this.basis();this.targetX+=(s.x*t+r.x*e)/this.scale,this.targetY+=(s.y*t+r.y*e)/this.scale,this.targetZ+=(s.z*t+r.z*e)/this.scale,n&&this.snap()}orbit(t,e,n=!1){this.targetYaw+=t,this.targetPitch=Math.max(-1.45,Math.min(1.45,this.targetPitch+e)),n&&this.snap()}resetOrientation(t=!1){this.targetYaw=this.targetPitch=0,t&&this.snap()}fit(t,e=!1){let n=[...t.values()];if(!n.length)return;let s=1/0,r=1/0,a=1/0,o=-1/0,l=-1/0,c=-1/0;for(let h of n)s=Math.min(s,h.x),r=Math.min(r,h.y),a=Math.min(a,h.z??0),o=Math.max(o,h.x),l=Math.max(l,h.y),c=Math.max(c,h.z??0);this.targetX=(s+o)/2,this.targetY=(r+l)/2,this.targetZ=(a+c)/2;let d=Math.max(60,Math.hypot(o-s,l-r,c-a)/2+35),m=Math.min(this.fov/2,Math.atan(Math.tan(this.fov/2)*this.width/this.height));this.targetDistance=Math.max(150,d/Math.sin(m)*1.12),e&&this.snap()}tick(t,e=!1){e&&this.snap();let n=1-Math.exp(-12*Math.min(.067,Math.max(0,t))),s=0,r=!1;for(let a of["x","y","z","yaw","pitch","distance"]){let o=this["target"+a[0].toUpperCase()+a.slice(1)],l=this[a];this[a]+=(o-this[a])*n,s+=Math.abs(o-this[a]),r||=l!==this[a]}return s<=5e-4&&this.snap(),r||s>5e-4}};var li="asdfghjkl",zi=(i,t)=>new Set(i.filter(e=>e.source===t&&e.destination!==t).map(e=>e.destination));function yl({nodes:i,edges:t,selected:e,projected:n,width:s,height:r,visibleOnly:a=!0}){let o=zi(t,e),l=i.filter(g=>{if(!a)return!0;let p=n.get(g.path);return p?.visible&&p.x>=0&&p.x<=s&&p.y>=0&&p.y<=r});if(l.sort((g,p)=>Number(o.has(p.path))-Number(o.has(g.path))||g.path.localeCompare(p.path)),!l.length)return[];let c=[[],[...li]],d=li.length,m=1;for(;d<l.length;){if(!c[m].length){m++;continue}let g=c[m].pop();(c[m+1]||=[]).push(...[...li].map(p=>g+p)),d+=li.length-1}let h=c.flat();return h.sort((g,p)=>g.length-p.length||[...g].reduce((y,f,u)=>y||li.indexOf(f)-li.indexOf(p[u]),0)),l.map((g,p)=>({path:g.path,title:g.title,code:h[p]}))}var Ga=class{constructor(){this.assignments=[],this.active=!1,this.prefix=""}begin(t){let{projected:e,width:n,height:s}=t;this.assignments=t.assignments?t.assignments.filter(r=>{let a=e.get(r.path);return a?.visible&&a.x>=0&&a.x<=n&&a.y>=0&&a.y<=s}):yl(t),this.active=this.assignments.length>0,this.prefix=""}cancel(){this.active=!1,this.assignments=[],this.prefix=""}key(t){if(!this.active)return{};if(t==="Escape")return this.cancel(),{cancelled:!0};if(t==="Backspace")return this.prefix=this.prefix.slice(0,-1),{};if(t.length!==1||!li.includes(t.toLowerCase()))return{invalid:!0};let e=this.prefix+t.toLowerCase();if(!this.assignments.some(s=>s.code.startsWith(e)))return{invalid:!0};this.prefix=e;let n=this.assignments.find(s=>s.code===e);return n?(this.cancel(),{path:n.path}):{}}};var Mh=(i,t)=>i.x<t.x+t.w&&i.x+i.w>t.x&&i.y<t.y+t.h&&i.y+i.h>t.y,mn=4,ci=20,Ha=48;function vl({nodes:i,projected:t,width:e,height:n,selected:s,focused:r,current:a,measure:o,maximum:l=48,previous:c=new Map,edges:d=[],hintMode:m=!1}){if(e<40||n<28||l<=0)return[];let h=zi(d,s),g=T=>T===s?5:T===r?4:h.has(T)?3:T===a?2:m?1:0,p=T=>T?.visible&&T.x>=0&&T.x<=e&&T.y>=0&&T.y<=n,y=new Map,f=T=>{let E=[];for(let x=Math.floor(T.x/Ha);x<=Math.floor((T.x+T.w)/Ha);x++)for(let M=Math.floor(T.y/Ha);M<=Math.floor((T.y+T.h)/Ha);M++)E.push(`${x},${M}`);return E};for(let[T,E]of t){if(!p(E))continue;let x=Math.max(E.radius||0,g(T)>=4||T===a?19:8),M={x:E.x-x,y:E.y-x,w:x*2,h:x*2};for(let B of f(M))y.has(B)||y.set(B,[]),y.get(B).push(M)}let u=[...t.values()].filter(p).length;m||(l=Math.min(l,Math.max(3,Math.floor(e*n/(3500+u*50)))));let v=i.filter(T=>m||T.path===s||h.has(T.path)).sort((T,E)=>g(E.path)-g(T.path)),b=[],S=[],C=T=>T.x>=mn&&T.y>=mn&&T.x+T.w<=e-mn&&T.y+T.h<=n-mn&&!S.some(E=>Mh(T,E))&&!f(T).some(E=>y.get(E)?.some(x=>Mh(T,x)));for(let T of v){if(b.length>=l)break;let E=t.get(T.path);if(!p(E))continue;let x=Array.from(String(T.title||T.path)),M=!g(T.path),B=Math.min(240,(e-mn*2)*.58),R=[...x],O=R.join("");for(;o(O,M)+8>B&&R.length>1;)R.pop(),O=R.join("")+"\u2026";let k=Math.min(e-mn*2,o(O,M)+8),F=[];for(let j of[22,42,66,88])F.push({slot:`r${j}`,x:E.x+j,y:E.y-ci/2},{slot:`l${j}`,x:E.x-j-k,y:E.y-ci/2},{slot:`u${j}`,x:Math.max(mn,Math.min(e-mn-k,E.x-k/2)),y:E.y-j-ci},{slot:`d${j}`,x:Math.max(mn,Math.min(e-mn-k,E.x-k/2)),y:E.y+j},{slot:`ur${j}`,x:E.x+j,y:E.y-j-ci},{slot:`ul${j}`,x:E.x-j-k,y:E.y-j-ci},{slot:`dr${j}`,x:E.x+j,y:E.y+j},{slot:`dl${j}`,x:E.x-j-k,y:E.y+j});let H=c.get(T.path),V=F.findIndex(j=>j.slot===H);V>0&&F.unshift(F.splice(V,1)[0]);let D=j=>({x:Math.max(j.x,Math.min(j.x+j.w,E.x)),y:Math.max(j.y,Math.min(j.y+j.h,E.y))}),st=(j,_t,Ht,zt)=>{let J=(it,rt,It)=>(rt.x-it.x)*(It.y-it.y)-(rt.y-it.y)*(It.x-it.x);return J(j,_t,Ht)*J(j,_t,zt)<0&&J(Ht,zt,j)*J(Ht,zt,_t)<0},tt=F.find(j=>{let _t={x:j.x,y:j.y,w:k,h:ci},Ht=D(_t);return!C(_t)||Math.hypot(E.x-Ht.x,E.y-Ht.y)>100?!1:!b.some(zt=>{let J=t.get(zt.path),it=zt.rect,rt=[{x:it.x,y:it.y},{x:it.x+it.w,y:it.y},{x:it.x+it.w,y:it.y+it.h},{x:it.x,y:it.y+it.h}],It=[{x:_t.x,y:_t.y},{x:_t.x+_t.w,y:_t.y},{x:_t.x+_t.w,y:_t.y+_t.h},{x:_t.x,y:_t.y+_t.h}];return st(E,Ht,J,zt.anchor)||rt.some((Et,wt)=>st(E,Ht,Et,rt[(wt+1)%4]))||It.some((Et,wt)=>st(J,zt.anchor,Et,It[(wt+1)%4]))})});if(!tt)continue;let ht={x:tt.x,y:tt.y,w:k,h:ci},gt={x:Math.max(ht.x,Math.min(ht.x+ht.w,E.x)),y:Math.max(ht.y,Math.min(ht.y+ht.h,E.y))};b.push({path:T.path,text:O,rect:ht,anchor:gt,slot:tt.slot,priority:g(T.path),secondary:M}),S.push(ht)}return b}var Wa=(i,t)=>i===t?7:5;function Ml(){let i=[0,0,0],t=[0,0,0],e=[0,0,0],n=[0,0,0],s=[0,0,0];return{start:i,tip:t,arrow:[t,[0,0,0],[0,0,0]],halo:[e,n,s,s,n,[0,0,0]]}}function Sh(i,t,e,n,{right:s,back:r},a=Ml()){let o=t.x-i.x,l=t.y-i.y,c=t.z-i.z,d=Math.max(.01,Math.hypot(o,l,c)),m=o/d,h=l/d,g=c/d,p=Math.min(d*.3,e),y=Math.min(d*.3,n),f=Math.min(d*.25,6),u=l*r.z-c*r.y,v=c*r.x-o*r.z,b=o*r.y-l*r.x,S=Math.hypot(u,v,b);S<.001&&(u=s.x,v=s.y,b=s.z,S=1),u/=S,v/=S,b/=S;let{start:C,tip:T,arrow:E,halo:x}=a;for(let M=0;M<3;M++){let B=M===0?m:M===1?h:g,R=M===0?u:M===1?v:b;C[M]=(M===0?i.x:M===1?i.y:i.z)+B*p,T[M]=(M===0?t.x:M===1?t.y:t.z)-B*y;let O=T[M]-B*f;E[1][M]=O+R*f*.5,E[2][M]=O-R*f*.5,x[0][M]=C[M]+R*3,x[1][M]=C[M]-R*3,x[2][M]=T[M]+R*3,x[5][M]=T[M]-R*3}return a}function bh(i,t,e){let n=new Map(i.map(a=>[a.path,1/0])),s=new Map(i.map(a=>[a.path,new Set]));for(let{source:a,destination:o}of t)!s.has(a)||!s.has(o)||(s.get(a).add(o),s.get(o).add(a));let r=[];n.has(e)&&(n.set(e,0),r.push(e));for(let a=0;a<r.length;a++){let o=r[a];for(let l of s.get(o))n.get(l)===1/0&&(n.set(l,n.get(o)+1),r.push(l))}return{nodes:n,edges:t.map(a=>Math.max(n.get(a.source)??1/0,n.get(a.destination)??1/0))}}var Sl=2,bl=4,wl=(i,t=Sl)=>t===0?0:Math.min(bl,Math.max(0,t))*(Number.isFinite(i)?.12+.65*.52**i:.08);function wh(i,t,e){let n=i.get(t);if(!n)return[...i.keys()].sort()[0]||null;let s={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]},[r,a]=s[e],o=t,l=1/0;for(let[c,d]of[...i].sort(([m],[h])=>m<h?-1:m>h?1:0)){let m=d.x-n.x,h=d.y-n.y;if(m*r+h*a<=0)continue;let p=Math.hypot(m,h)+Math.abs(m*a-h*r)*2;p<l&&(o=c,l=p)}return o}var Xa=class{constructor(){this.level=0,this.slow=0,this.good=0}sample(t){if(!Number.isFinite(t)||t<=0)return!1;let e=this.level;return t>.04?(this.slow++,this.good=0):t<.025?(this.good++,this.slow=0):this.good=this.slow=0,this.slow>=6&&(this.level=Math.min(2,this.level+1),this.slow=0),this.good>=90&&(this.level=Math.max(0,this.level-1),this.good=0),e!==this.level}bloom(t,e=!1){return e?0:t*[1,.5,0][this.level]}get labels(){return[48,28,12][this.level]}get dpr(){return[1.5,1.25,1][this.level]}};function qa(i,t=!1,e=!1){let n=new Pe;return n.setAttribute("position",new pe(new Float32Array(i*3),3).setUsage(Ts)),t&&n.setAttribute("color",new pe(new Float32Array(i*(e?4:3)),e?4:3).setUsage(Ts)),n}function rg(i,t){let e=new Mn,n=new os(new fs(1,1),new On({color:16777215}),i.length);n.instanceMatrix.setUsage(Ts);let s=new cs(qa(t.length*2,!0,!0),new Ii({vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1})),r=new be(qa(t.length*3,!0,!0),new On({vertexColors:!0,transparent:!0,opacity:.85,depthWrite:!1,side:He,forceSinglePass:!0})),a=new Ce({transparent:!0,depthWrite:!1,uniforms:{viewportHeight:{value:1}},vertexShader:"attribute vec3 color; attribute float diameter; varying vec3 glow; uniform float viewportHeight; void main(){ glow=color; vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_PointSize=diameter*projectionMatrix[1][1]*viewportHeight/(2.*max(.01,-p.z)); }",fragmentShader:`varying vec3 glow; void main(){ float r=length(gl_PointCoord-vec2(.5))*2.; if(r>1.) discard; float a=pow(1.-r,2.)*.6; gl_FragColor=vec4(glow,a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}`}),o=new hs(qa(i.length,!0),a);o.geometry.setAttribute("diameter",new pe(new Float32Array(i.length),1));let l=qa(t.length*6,!0,!0),c=new Float32Array(t.length*12);for(let m=0;m<t.length;m++)c.set([0,0,0,1,1,0,1,0,0,1,1,1],m*12);l.setAttribute("uv",new pe(c,2));let d=new be(l,new Ce({transparent:!0,depthWrite:!1,side:He,forceSinglePass:!0,vertexShader:"attribute vec4 color; varying vec4 glow; varying vec2 strip; void main(){ glow=color; strip=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",fragmentShader:`varying vec4 glow; varying vec2 strip; void main(){ float a=pow(1.-abs(strip.y*2.-1.),2.)*.28; gl_FragColor=vec4(glow.rgb,a*glow.a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}`}));for(let m of[d,o,s,r,n])m.frustumCulled=!1,e.add(m);return{group:e,nodes:n,edges:s,arrows:r,halos:o,edgeHalos:d,dispose(){for(let m of e.children)m.geometry.dispose(),m.material.dispose(),m.dispose?.();e.clear()}}}var Ya=class{constructor(t,e={}){this.container=t,this.actions=e,this.life=new AbortController,this.simulation=new ka,this.camera=new Va,this.quality=new Xa,this.data={nodes:[],edges:[]},this.selected=this.focused=null,this.frame=null,this.destroyed=!1,this.intensity=Sl,this.pointers=new Map,this.projected=new Map,this.reduced=matchMedia("(prefers-reduced-motion: reduce)"),this.forced=matchMedia("(forced-colors: active)"),this.paused=this.reduced.matches,this.canvas=document.createElement("canvas"),this.canvas.setAttribute("aria-hidden","true"),this.labels=document.createElement("canvas"),this.labels.setAttribute("aria-hidden","true"),this.labelContext=this.labels.getContext("2d"),this.swatch=document.createElement("canvas"),this.swatch.width=this.swatch.height=1,this.swatchContext=this.swatch.getContext("2d",{willReadFrequently:!0}),this.hints=new Ga,this.hintButtons=new Map,this.hintLayer=document.createElement("div"),this.hintLayer.className="graph-hints",this.hintLayer.setAttribute("role","group"),this.hintLayer.setAttribute("aria-label","Node selection hints"),this.hintLayer.hidden=!0,t.replaceChildren(this.canvas,this.labels,this.hintLayer),t.graphView=this,this.scene=new ns,this.renderCamera=new Ee(45,1,1,1e6),this.matrix=new re,this.color=new Yt;let n=(s,r,a,o={})=>s.addEventListener(r,a,{...o,signal:this.life.signal});n(this.canvas,"webglcontextlost",s=>{s.preventDefault(),this.unavailable=!0,this.release(null,!0),this.stop(),this.container.dataset.renderer="lost",this.actions.onUnavailable?.("The 3D map lost its graphics context. Your loaded notes remain available in the list.")}),n(this.canvas,"webglcontextrestored",()=>queueMicrotask(()=>{this.destroyed||(this.unavailable=!1,this.container.dataset.renderer="webgl",this.syncSize(),this.themeDirty=!0,this.draw(),this.wake(),this.actions.onRestored?.())}));try{this.renderer=new Fa({canvas:this.canvas,antialias:!1,alpha:!1,powerPreference:"low-power"}),this.renderer.outputColorSpace=Ie,this.container.dataset.renderer="webgl"}catch{this.unavailable=!0,this.container.dataset.renderer="unavailable",queueMicrotask(()=>{this.destroyed||this.actions.onUnavailable?.("WebGL is unavailable. Your loaded notes remain available in the list.")})}this.resize=new ResizeObserver(()=>{this.syncSize()&&(!this.sized&&this.loaded&&!this.cameraControlled&&this.camera.width>0&&this.camera.fit(this.simulation.nodes,!0),this.sized=!0,this.draw())}),this.resize.observe(t),this.syncSize(),this.themeObserver=new MutationObserver(()=>{this.updateTheme(),this.draw()}),this.themeObserver.observe(document.documentElement,{attributes:!0,attributeFilter:["class","style","data-color-scheme","data-theme"]}),this.updateTheme(),n(t,"keydown",s=>this.keydown(s)),n(t,"focusout",s=>{t.contains(s.relatedTarget)||this.cancelHints()}),n(t,"pointerdown",s=>this.pointerDown(s)),n(t,"pointermove",s=>this.pointerMove(s)),n(t,"pointerup",s=>this.release(s,!1));for(let s of["pointercancel","lostpointercapture"])n(t,s,r=>this.release(r,!0));n(t,"wheel",s=>{s.ctrlKey||s.metaKey||s.altKey||(s.preventDefault(),this.zoom(s.deltaY<0?1.12:1/1.12,this.point(s)))},{passive:!1}),n(document,"visibilitychange",()=>{document.hidden?(this.release(null,!0),this.stop()):this.wake()}),n(this.reduced,"change",()=>{this.paused=this.reduced.matches,this.paused?(this.simulation.pause(),this.camera.snap(),this.stop()):this.simulation.reheat(),this.actions.onPause?.(this.paused),this.draw(),this.wake()}),n(this.forced,"change",()=>{this.updateTheme(),this.draw()})}get available(){return!this.unavailable}updateTheme(){let t=getComputedStyle(this.container),e=this.swatchContext;this.fontFamily=t.fontFamily||"sans-serif";let n=(s,r)=>{let a=t.getPropertyValue(s).trim()||r;if(!e)return r;e.clearRect(0,0,1,1),e.fillStyle=r,e.fillStyle=a,e.fillRect(0,0,1,1);let o=e.getImageData(0,0,1,1).data;return`rgb(${o[0]},${o[1]},${o[2]})`};if(this.theme={background:n("--surface","#141820"),node:n("--graph-node","#8ab4f8"),edge:n("--graph-edge","#8a919d"),destination:n("--graph-destination","#81c995"),highlight:n("--graph-highlight","#c5a5ff"),bloom:n("--graph-bloom","#8ab4f8"),label:n("--foreground","#e8e8e8"),focus:n("--focus","#f4c95d")},this.forced.matches&&e){let s=document.createElement("span");s.style.color="CanvasText",this.container.append(s),this.theme.node=this.theme.edge=this.theme.label=getComputedStyle(s).color,s.style.color="Highlight",this.theme.destination=this.theme.highlight=this.theme.focus=getComputedStyle(s).color,s.style.color="Canvas",this.theme.background=getComputedStyle(s).color,s.remove()}this.themeDirty=!0}syncSize(){let t=this.container.getBoundingClientRect();return!t.width||!t.height?!1:(this.camera.width=t.width,this.camera.height=t.height,this.pixelRatio=Math.min(window.devicePixelRatio||1,this.quality.dpr),this.renderer&&!this.unavailable&&(this.renderer.setPixelRatio(this.pixelRatio),this.renderer.setSize(t.width,t.height,!1)),this.labels.width=Math.round(t.width*this.pixelRatio),this.labels.height=Math.round(t.height*this.pixelRatio),!0)}setGraph(t,e,n=e){let s=JSON.stringify([t.nodes.map(a=>a.path),t.edges.map(a=>[a.source,a.destination])]),r=s!==this.topology;if(t.nodes.length||this.cancelHints(),this.data=t,this.current=e,this.root=n,!r){this.simulation.setRoot(n),this.paused&&this.simulation.pause(),this.themeDirty=!0,this.draw();return}this.topology=s,this.release(null,!0),this.projected?.clear(),this.pickGrid?.clear();for(let a of this.pickBuckets||[])a.length=0;t.nodes.length||(this.pickBuckets=[],this.edgeGeometry=null),this.drawnBatch=null,this.simulation.setGraph(t.nodes,t.edges),this.simulation.setRoot(n),!this.loaded&&t.nodes.length&&(this.cameraControlled||this.camera.fit(this.simulation.nodes,!0),this.loaded=!0),this.paused&&this.simulation.pause(),this.batch&&(this.scene.remove(this.batch.group),this.batch.dispose()),this.batch=rg(t.nodes,t.edges),this.scene.add(this.batch.group),this.container.dataset.nodeCount=String(t.nodes.length),this.container.dataset.edgeCount=String(t.edges.length),this.setSelection(this.selected,this.focused),this.wake()}setSelection(t,e){this.selected=t,this.focused=e,this.simulation.setSelection(t),this.root===null&&this.simulation.setRoot(t),this.paused&&this.simulation.pause(),this.tiers=bh(this.data.nodes,this.data.edges,t),this.destinations=zi(this.data.edges,t),this.refreshShortcuts(),this.themeDirty=!0,this.container.dataset.root=this.root||"",this.container.dataset.selected=t||"",this.container.dataset.focused=e||"";let n=[["Current note",this.current],["Selected note",t],["Keyboard focus",e],["Opening root",this.root]].filter(([,s])=>s).map(([s,r])=>`${s}: ${r}`).join(" \xB7 ");this.container.setAttribute("aria-label",`3D note relationship map \xB7 ${n}`),this.draw(),this.wake()}setForces(t){this.simulation.setForces(t),this.paused&&this.simulation.pause(),this.draw(),this.wake()}setBloom(t){this.intensity=Math.min(bl,Math.max(0,Number(t)||0)),this.container.dataset.bloom=String(this.intensity),this.themeDirty=!0,this.draw()}setPaused(t){this.paused=!!t||this.reduced.matches,this.release(null,!0),this.paused?(this.simulation.pause(),this.camera.snap(),this.stop()):(this.simulation.reheat(),this.wake()),this.actions.onPause?.(this.paused),this.draw()}fit(){this.simulation.nodes.size&&(this.cameraControlled=!0,this.camera.fit(this.simulation.nodes,this.paused),this.draw(),this.wake())}resetOrientation(){this.cameraControlled=!0,this.camera.resetOrientation(this.paused),this.draw(),this.wake()}orbit(t,e){this.cameraControlled=!0,this.camera.orbit(t,e,this.paused),this.draw(),this.wake()}zoom(t,e){this.cameraControlled=!0,this.camera.zoom(t,e,this.paused),this.draw(),this.wake()}pan(t,e){this.cameraControlled=!0,this.camera.pan(t,e,this.paused),this.draw(),this.wake()}refreshShortcuts(){let t=JSON.stringify([this.selected,this.data.nodes.map(e=>[e.path,e.title]),this.data.edges.map(e=>[e.source,e.destination])]);t!==this.shortcutKey&&(this.shortcutKey=t,this.shortcutAssignments=yl({...this.data,selected:this.selected,visibleOnly:!1}),this.shortcutCodes=new Map(this.shortcutAssignments.map(e=>[e.path,e.code])))}beginHints(){if(!(this.unavailable||this.container.hidden)){this.refreshShortcuts(),this.hints.begin({...this.data,assignments:this.shortcutAssignments,selected:this.selected,projected:this.projected,width:this.camera.width,height:this.camera.height}),this.hintButtons.clear(),this.hintLayer.replaceChildren();for(let t of this.hints.assignments){let e=document.createElement("button");e.type="button",e.tabIndex=-1,e.textContent=t.code,e.dataset.graphHint=t.code,e.setAttribute("aria-label",`${t.code}: Select ${t.title}, ${t.path}`),e.addEventListener("click",()=>this.completeHint(t.path)),this.hintLayer.append(e),this.hintButtons.set(t.path,e)}this.container.focus({preventScroll:!0}),this.actions.onHint?.(this.hints.active?"Node hints: type a code to select and expand. Escape cancels; Backspace edits.":"No nodes are visible for hints."),this.draw()}}cancelHints(t=!1){!this.hints?.active&&!this.hintButtons?.size||(this.hints.cancel(),this.hintButtons.clear(),this.hintLayer.replaceChildren(),this.hintLayer.hidden=!0,this.container.dataset.hintMode="false",t&&(this.actions.onHint?.("Node hints cancelled."),this.draw()))}completeHint(t){this.cancelHints(),this.container.focus({preventScroll:!0}),this.data.nodes.some(e=>e.path===t)?this.actions.onSelect?.(t,!0):this.actions.onHint?.("That node is no longer available. Enter hint mode again."),this.draw()}drawHints(){if(!this.hints?.active){this.hintLayer&&(this.hintLayer.hidden=!0);return}this.hintLayer.hidden=!1,this.container.dataset.hintMode="true";let t=new Set(this.data.nodes.map(r=>r.path)),e=this.hints.assignments.filter(r=>r.code.startsWith(this.hints.prefix)&&t.has(r.path)),n=new Map(e.map(r=>[r.path,r])),s=vl({nodes:e.map(r=>({path:r.path,title:r.code})),projected:this.projected,width:this.camera.width,height:this.camera.height,measure:r=>Math.max(16,r.length*9),maximum:e.length,hintMode:!0,previous:this.hintSlots});this.hintSlots=new Map(s.map(r=>[r.path,r.slot]));for(let r of this.hintButtons.values())r.hidden=!0;for(let r of s){let a=this.hintButtons.get(r.path);if(!a)continue;a.hidden=!1,a.style.width=`${r.rect.w}px`,a.style.left=`${r.rect.x}px`,a.style.top=`${r.rect.y}px`;let o=n.get(r.path);a.textContent=o.code;let l=this.projected.get(r.path),c=this.labelContext;c&&(c.strokeStyle=this.theme.focus,c.lineWidth=1,c.beginPath(),c.moveTo(l.x,l.y),c.lineTo(r.anchor.x,r.anchor.y),c.stroke())}}keydown(t){if(t.target!==this.container||t.isComposing||t.altKey||t.metaKey||t.ctrlKey||t.getModifierState?.("AltGraph"))return;if(this.hints?.active){if(t.key==="Tab"){this.cancelHints(!0);return}t.preventDefault(),t.stopPropagation();let n=this.hints.key(t.key);if(n.path){this.completeHint(n.path);return}n.cancelled?(this.cancelHints(!0),this.actions.onHint?.("Node hints cancelled.")):this.actions.onHint?.(n.invalid?"No matching hint. Backspace edits; Escape cancels.":`Node hints: ${this.hints.prefix||"type a code"}`),this.draw();return}if(t.key==="f"){t.preventDefault(),t.stopPropagation(),this.beginHints();return}let e={ArrowLeft:"left",h:"left",ArrowRight:"right",l:"right",ArrowUp:"up",k:"up",ArrowDown:"down",j:"down"}[t.key];if(e){let n=new Map([...this.projected].filter(([r,a])=>r===this.focused||a.visible&&a.x>=0&&a.x<=this.camera.width&&a.y>=0&&a.y<=this.camera.height)),s=wh(n,this.focused,e);s&&this.actions.onSelect?.(s,!0)}else if(t.key==="Enter")this.actions.onOpen?.(this.focused);else if(t.key===" ")this.actions.onCenter?.(this.focused);else if(t.key==="/")this.actions.onSearch?.();else if(t.key==="?")this.actions.onHelp?.();else if(t.key==="Escape")this.actions.onEscape?.();else if(t.key==="+"||t.key==="=")this.zoom(1.25);else if(t.key==="-")this.zoom(.8);else return;t.preventDefault(),t.stopPropagation()}point(t){let e=this.canvas.getBoundingClientRect();return{x:t.clientX-e.left,y:t.clientY-e.top}}pick(t){let e=Math.floor(t.x/36),n=Math.floor(t.y/36),s=null,r=22;for(let a=-1;a<=1;a++)for(let o=-1;o<=1;o++)for(let l of this.pickGrid?.get(`${e+a},${n+o}`)||[]){let c=this.projected.get(l),d=Math.hypot(t.x-c.x,t.y-c.y);d<r&&(s=l,r=d)}return s}pointerDown(t){if(this.cameraControlled=!0,t.target.closest?.(".graph-hints")||t.button!==0||t.ctrlKey||t.metaKey||t.altKey||this.unavailable)return;this.cancelHints();let e=this.point(t);if(this.pointers.set(t.pointerId,e),this.container.focus({preventScroll:!0}),this.container.setPointerCapture(t.pointerId),this.pointers.size>1){this.drag?.path&&this.simulation.unpin(this.drag.path),this.drag=null,this.gesture=this.gestureState();return}this.drag={pointer:t.pointerId,path:this.pick(e),start:e,previous:e,moved:!1,pan:t.shiftKey||t.pointerType==="pen"}}gestureState(){let[t,e]=[...this.pointers.values()];return t&&e?{x:(t.x+e.x)/2,y:(t.y+e.y)/2,distance:Math.max(1,Math.hypot(t.x-e.x,t.y-e.y))}:null}pointerMove(t){if(!this.pointers.has(t.pointerId))return;let e=this.point(t);if(this.pointers.set(t.pointerId,e),this.pointers.size>1){let s=this.gestureState(),r=this.gesture;r&&(this.camera.pan(r.x-s.x,r.y-s.y,!0),this.camera.zoom(s.distance/r.distance,s,!0)),this.gesture=s,this.draw();return}let n=this.drag;if(n&&(Math.hypot(e.x-n.start.x,e.y-n.start.y)>5&&(n.moved=!0),!!n.moved)){if(n.path){let s=this.camera.world(e,this.simulation.nodes.get(n.path));this.simulation.pin(n.path,s.x,s.y,s.z),this.container.dataset.pinned="true"}else n.pan?this.camera.pan(n.previous.x-e.x,n.previous.y-e.y,!0):this.camera.orbit((n.previous.x-e.x)*.006,(e.y-n.previous.y)*.006,!0);n.previous=e,this.draw(),this.wake()}}release(t,e){if(t)this.pointers.delete(t.pointerId),this.container.hasPointerCapture(t.pointerId)&&this.container.releasePointerCapture(t.pointerId);else{for(let s of this.pointers.keys())this.container.hasPointerCapture(s)&&this.container.releasePointerCapture(s);this.pointers.clear()}let n=this.drag;n&&(!t||n.pointer===t.pointerId)&&(this.drag=null,n.path&&this.simulation.unpin(n.path),!e&&!n.moved&&n.path&&this.actions.onSelect?.(n.path,!0)),this.gesture=null,this.container.dataset.pinned="false",this.paused||this.wake()}applyColors(t){let e=this.batch;this.data.nodes.forEach((n,s)=>{let r=n.path===this.selected,a=n.path===this.focused,o=this.destinations?.has(n.path),l=this.theme.destination||this.theme.focus;e.nodes.setColorAt(s,this.color.set(r?this.theme.highlight:o?l:a?this.theme.focus:this.theme.node)),this.color.set(r?this.theme.highlight:o?l:this.theme.bloom).multiplyScalar(wl(this.tiers.nodes.get(n.path),t)),this.color.toArray(e.halos.geometry.attributes.color.array,s*3)}),this.data.edges.forEach((n,s)=>{let r=this.simulation.isSpringEdge(n.source,n.destination),a=n.source===this.selected&&n.destination!==this.selected,o=this.forced.matches||r||a?1:.12;this.color.set(a?this.theme.destination||this.theme.focus:this.tiers.edges[s]<=1?this.theme.highlight:this.theme.edge);for(let[l,c]of[[e.edges,2],[e.arrows,3]])for(let d=0;d<c;d++)l.geometry.attributes.color.setXYZW(s*c+d,this.color.r,this.color.g,this.color.b,o);this.color.set(this.theme.bloom).multiplyScalar(wl(this.tiers.edges[s],r?t:Math.min(1,t)));for(let l=0;l<6;l++)e.edgeHalos.geometry.attributes.color.setXYZW(s*6+l,this.color.r,this.color.g,this.color.b,o)}),e.nodes.instanceColor&&(e.nodes.instanceColor.needsUpdate=!0);for(let n of[e.halos,e.edges,e.arrows,e.edgeHalos])n.geometry.attributes.color.needsUpdate=!0;this.themeDirty=!1}draw({positionsChanged:t=!0}={}){if(this.destroyed||this.unavailable||!this.renderer||!this.batch||document.hidden||this.container.hidden)return;let e=this.batch,n=this.camera,s=n.basis(),r=n.eye(s),a=["x","y","z","yaw","pitch","distance","width","height"],o=this.drawnCamera,l=!o||a.some(h=>o[h]!==n[h]),c=t||this.drawnBatch!==e||this.drawnSelection!==this.selected,d=c||l;this.renderCamera.aspect=n.width/n.height,this.renderCamera.position.set(r.x,r.y,r.z),this.renderCamera.lookAt(n.x,n.y,n.z),this.renderCamera.updateProjectionMatrix(),this.renderCamera.updateMatrixWorld();let m=this.quality.bloom(this.intensity,this.forced.matches);if(e.halos.visible=e.edgeHalos.visible=m>0,e.halos.material.uniforms.viewportHeight.value=n.height*this.pixelRatio,this.themeDirty&&this.applyColors(m),this.renderer.setClearColor(this.theme.background),d){this.pickGrid||=new Map,this.pickGrid.clear(),this.pickBuckets||=[];let h=0;if(this.drawnBatch!==e)for(let g of this.projected.keys())this.simulation.nodes.has(g)||this.projected.delete(g);this.compareDepth||=(g,p)=>this.projected.get(g).depth-this.projected.get(p).depth;for(let g=0;g<this.data.nodes.length;g++){let p=this.data.nodes[g],y=this.simulation.nodes.get(p.path),f=n.screen(y,this.projected.get(p.path),s),u=Wa(p.path,this.selected);if(f.radius=u*f.scale,this.projected.set(p.path,f),c&&(this.matrix.makeScale(u,u,u),this.matrix.setPosition(y.x,y.y,y.z),e.nodes.setMatrixAt(g,this.matrix),e.halos.geometry.attributes.position.setXYZ(g,y.x,y.y,y.z),e.halos.geometry.attributes.diameter.setX(g,u*9.6)),f.visible&&f.x>-36&&f.x<n.width+36&&f.y>-36&&f.y<n.height+36){let v=`${Math.floor(f.x/36)},${Math.floor(f.y/36)}`,b=this.pickGrid.get(v);b||(b=this.pickBuckets[h]||=[],h++,b.length=0,this.pickGrid.set(v,b)),b.push(p.path),b.sort(this.compareDepth),b.length>32&&(b.length=32)}}for(let g=h;g<this.pickBuckets.length;g++)this.pickBuckets[g].length=0}if(d||m>0&&!this.drawnBloom){this.edgeGeometry||=Ml();let h=e.edges.geometry.attributes.position,g=e.arrows.geometry.attributes.position,p=e.edgeHalos.geometry.attributes.position;for(let y=0;y<this.data.edges.length;y++){let f=this.data.edges[y],u=this.simulation.nodes.get(f.source),v=this.simulation.nodes.get(f.destination);if(!u||!v)continue;let b=Sh(u,v,Wa(f.source,this.selected),Wa(f.destination,this.selected),s,this.edgeGeometry);h.setXYZ(y*2,b.start[0],b.start[1],b.start[2]),h.setXYZ(y*2+1,b.tip[0],b.tip[1],b.tip[2]);for(let S=0;S<3;S++){let C=b.arrow[S];g.setXYZ(y*3+S,C[0],C[1],C[2])}if(m>0)for(let S=0;S<6;S++){let C=b.halo[S];p.setXYZ(y*6+S,C[0],C[1],C[2])}}h.needsUpdate=g.needsUpdate=!0,m>0&&(p.needsUpdate=!0)}c&&(e.nodes.instanceMatrix.needsUpdate=!0,e.halos.geometry.attributes.diameter.needsUpdate=!0,e.halos.geometry.attributes.position.needsUpdate=!0),this.drawnCamera||={};for(let h of a)this.drawnCamera[h]=n[h];this.drawnBatch=e,this.drawnSelection=this.selected,this.drawnBloom=m,this.renderer.render(this.scene,this.renderCamera),this.drawLabels(),this.drawHints(),Object.assign(this.container.dataset,{motion:this.paused?"paused":this.simulation.active?"moving":"settled",lowWork:String(this.quality.level>0),quality:String(this.quality.level),cameraYaw:String(n.yaw),cameraPitch:String(n.pitch),bloomEffective:String(m)})}drawLabels(){let t=this.labelContext;if(!t)return;let e=this.camera;t.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0),t.clearRect(0,0,e.width,e.height),t.font=`12px ${this.fontFamily}`,t.lineJoin="round",t.lineWidth=4;let n=this.destinations||zi(this.data.edges||[],this.selected),s=this.data.nodes.map(a=>n.has(a.path)&&this.shortcutCodes?.has(a.path)?{...a,title:`f ${this.shortcutCodes.get(a.path)} \xB7 ${a.title}`}:a),r=vl({nodes:s,projected:this.projected,width:e.width,height:e.height,selected:this.selected,focused:this.focused,current:this.current,edges:this.data.edges,measure:(a,o)=>(t.font=`${o?11:12}px ${this.fontFamily}`,t.measureText(a).width),maximum:this.hints?.active?0:this.quality.labels,previous:this.labelSlots});this.labelSlots=new Map(r.map(a=>[a.path,a.slot])),this.labelPlacements=r;for(let a of r){let o=this.projected.get(a.path),{rect:l,anchor:c}=a;t.globalAlpha=a.secondary?.78:1,t.strokeStyle=a.path===this.selected?this.theme.highlight:n.has(a.path)?this.theme.destination||this.theme.focus:this.theme.label,t.lineWidth=1,t.beginPath(),t.moveTo(o.x,o.y),t.lineTo(c.x,c.y),t.stroke()}for(let a of r){let{rect:o}=a;t.font=`${a.secondary?11:12}px ${this.fontFamily}`,t.globalAlpha=a.secondary?.78:1,t.fillStyle=this.theme.background,t.fillRect(o.x,o.y,o.w,o.h),t.strokeStyle=this.theme.background,t.fillStyle=n.has(a.path)?this.theme.destination||this.theme.focus:this.theme.label,t.lineWidth=3,t.strokeText(a.text,o.x+4,o.y+14),t.fillText(a.text,o.x+4,o.y+14)}t.globalAlpha=1;for(let a of n){let o=this.projected.get(a);!o?.visible||o.x<0||o.x>e.width||o.y<0||o.y>e.height||[this.current,this.selected,this.focused,this.root].includes(a)||(t.strokeStyle=this.theme.destination||this.theme.focus,t.lineWidth=1.5,t.beginPath(),t.arc(o.x,o.y,Math.max(5,o.radius||5)+3,0,Math.PI*2),t.stroke())}for(let a of new Set([this.current,this.selected,this.focused,this.root])){let o=this.projected.get(a);if(!o?.visible||o.x<0||o.x>e.width||o.y<0||o.y>e.height)continue;let l=a===this.selected,c=a===this.current,d=a===this.focused;t.lineWidth=2,t.strokeStyle=l?this.theme.highlight:c?this.theme.label:this.theme.focus,d&&t.setLineDash([4,3]),l?(t.beginPath(),t.moveTo(o.x,o.y-13),t.lineTo(o.x+13,o.y),t.lineTo(o.x,o.y+13),t.lineTo(o.x-13,o.y),t.closePath(),t.stroke()):c||d?t.strokeRect(o.x-10,o.y-10,20,20):(t.beginPath(),t.arc(o.x,o.y,10,0,Math.PI*2),t.stroke()),t.setLineDash([]),c&&l&&(t.strokeStyle=this.theme.label,t.beginPath(),t.moveTo(o.x-4,o.y+7),t.lineTo(o.x-4,o.y+3),t.lineTo(o.x,o.y+3),t.stroke()),a===this.root&&(t.fillStyle=this.theme.label,t.fillRect(o.x-2,o.y-15,4,4))}}snapshot(){return{renderer:this.container.dataset.renderer,nodes:this.data.nodes.length,edges:this.data.edges.length,selected:this.selected,focused:this.focused,camera:{x:this.camera.x,y:this.camera.y,z:this.camera.z,yaw:this.camera.yaw,pitch:this.camera.pitch,distance:this.camera.distance},projected:[...this.projected].map(([t,e])=>({path:t,...e}))}}wake(){this.destroyed||this.unavailable||document.hidden||this.container.hidden||this.frame!==null||this.paused||(this.lastTime=performance.now(),this.frame=requestAnimationFrame(t=>this.tick(t)))}tick(t){if(this.frame=null,this.destroyed||this.unavailable||document.hidden||this.container.hidden||this.paused)return;let e=Math.max(0,(t-this.lastTime)/1e3);this.lastTime=t,this.quality.sample(e)&&(this.themeDirty=!0,this.syncSize());let n=this.simulation.positionVersion;this.simulation.advance(e);let s=this.simulation.positionVersion!==n,r=this.camera.tick(e);(s||r||this.themeDirty)&&this.draw({positionsChanged:s}),this.simulation.active||r?this.frame=requestAnimationFrame(a=>this.tick(a)):this.simulation.limitReached&&this.actions.onLimit?.()}stop(){this.frame!==null&&cancelAnimationFrame(this.frame),this.frame=null,this.simulation.cancelPending?.()}destroy(){this.cancelHints(),this.release(null,!0),this.destroyed=!0,this.stop(),this.life.abort(),this.resize.disconnect(),this.themeObserver.disconnect(),this.batch?.dispose(),this.renderer?.dispose(),this.simulation.destroy(),this.projected.clear(),this.pickGrid?.clear(),this.pickBuckets=[],this.edgeGeometry=null,this.drawnCamera=this.drawnBatch=null,this.container.graphView===this&&delete this.container.graphView,this.container.replaceChildren()}};var $a=class{constructor(t){this.origin=t,this.clear()}clear(){this.scope=null,this.root=null,this.seeds=new Set,this.visiblePaths=[],this.suspend()}suspend(){this.data=null,this.nodes=new Map,this.outgoing=new Map,this.incoming=new Map}accept(t){try{if(!t||t.schema_version!==1||t.untrusted_content!==!0||t.authoritative!==!1||typeof t.scope!="string"||!t.scope||t.scope.length>4096||typeof t.snapshot_id!="string"||!t.snapshot_id||t.snapshot_id.length>4096||t.next_cursor!==null||!t.freshness||typeof t.freshness.state!="string"||typeof t.projection_complete!="boolean"||!Array.isArray(t.limiting_reasons)||!t.limiting_reasons.every(o=>typeof o=="string")||!Array.isArray(t.nodes)||!Array.isArray(t.edges))throw new Error("invalid_response");let e=new Map,n=new Map,s=new Map,r=new Set;for(let o of t.nodes){if(!o||typeof o.path!="string"||!o.path||typeof o.title!="string"||typeof o.revision!="string"||typeof o.href!="string"||e.has(o.path))throw new Error("invalid_response");let l=new URL(o.href,this.origin);if(l.origin!==this.origin||!l.pathname.startsWith("/notes/")||decodeURIComponent(l.pathname.slice(7))!==o.path||l.search||l.hash||l.username||l.password)throw new Error("invalid_response");e.set(o.path,o),n.set(o.path,[]),s.set(o.path,[])}for(let o of t.edges){if(!o||!e.has(o.source)||!e.has(o.destination)||!Number.isSafeInteger(o.occurrence_count)||o.occurrence_count<=0)throw new Error("invalid_response");let l=JSON.stringify([o.source,o.destination]);if(r.has(l))throw new Error("invalid_response");r.add(l),n.get(o.source).push(o),s.get(o.destination).push(o)}let a=this.scope===t.scope;if(!a)this.seeds.clear(),this.visiblePaths=[];else for(let o of this.seeds)e.has(o)||this.seeds.delete(o);return this.scope=t.scope,this.data=t,this.nodes=e,this.outgoing=n,this.incoming=s,a}catch{throw this.clear(),new Error("invalid_response")}}get complete(){return!!(this.data?.projection_complete&&!this.data.limiting_reasons.length)}expand(t){this.nodes.has(t)&&this.seeds.add(t)}explore(t,e=2){if(!this.data)return null;if(t=t||null,t!==this.root&&(this.seeds.clear(),this.visiblePaths=[],this.root=t),!t)return this.data;this.expand(t);let n=Math.max(1,Math.min(8,Number(e)||1)),s=new Map([...this.seeds].filter(l=>this.nodes.has(l)).map(l=>[l,0])),r=[...s.keys()];for(let l=0;l<r.length;l++){let c=r[l],d=s.get(c);if(!(d>=n))for(let m of this.outgoing.get(c))s.has(m.destination)||(s.set(m.destination,d+1),r.push(m.destination))}let a=this.visiblePaths.filter(l=>s.has(l)),o=new Set(a);for(let l of this.data.nodes)s.has(l.path)&&!o.has(l.path)&&a.push(l.path);return this.visiblePaths=a,{...this.data,nodes:a.map(l=>this.nodes.get(l)),edges:this.data.edges.filter(l=>s.has(l.source)&&s.has(l.destination))}}connections(t){return{incoming:this.incoming.get(t)||[],outgoing:this.outgoing.get(t)||[]}}};var ag={idle:"Idle",discover:"Discovering changes",validate:"Validating notes",dependencies:"Checking dependencies",relations:"Projecting relationships",priority:"Processing changed paths",backoff:"Waiting to retry",ready:"Ready"},og={ready:"Ready",partial:"Updating",stale:"Changes pending",backoff:"Waiting to retry",unavailable:"Storage unavailable"},lg={native:"native notifications",poll:"polling",polling:"polling",disabled:"polling",starting:"starting",unknown:"unknown"},cg={healthy:"healthy",ready:"healthy",starting:"starting",degraded:"reconciliation required",unavailable:"unavailable",polling:"polling",stopped:"stopped",disabled:"disabled",unknown:"unknown"},hg={polling_configured:"Polling-only mode",watch_unavailable:"Notifications unavailable",overflow:"Notification overflow",directory_changed:"Directory coverage changed",watcher_unavailable:"Notifications unavailable",watcher_overflow:"Notification overflow",queue_overflow:"Queue overflow",watcher_restart:"Watcher restart",storage_changed:"Storage identity changed",watch_limit:"Watch limit reached",watcher_failed:"Watcher failed",coverage_uncertain:"Coverage uncertain",polling_only:"Polling-only mode"},Za=i=>Number.isSafeInteger(i)&&i>=0?i.toLocaleString("en-US"):"0",Th=i=>{let t=new Date(Number(i)*1e3);return Number.isFinite(i)&&i>0&&Number.isFinite(t.getTime())?t.toISOString().replace("T"," ").replace(".000Z"," UTC"):"not yet completed"};function Ah(i){return`${og[i.state]||"Unknown"} \xB7 ${ag[i.phase]||"Unknown phase"}. ${Za(i.metadata_checked)} metadata entries checked \xB7 ${Za(i.parsed_notes)} changed notes parsed \xB7 ${Za(i.dependencies_checked)} dependencies checked \xB7 ${Za(i.pending_jobs)} queued changes. Last reconciliation: ${Th(i.last_completed)}. Last content verification: ${Th(i.last_verified)}. Watcher: ${lg[i.watcher_mode]||"unknown"} \xB7 ${cg[i.watcher_health]||"unknown"}.${i.fallback_reason?` Fallback: ${hg[i.fallback_reason]||"Reconciliation required"}.`:""}`}var Eh=!1,Ch=i=>"/notes/"+i.split("/").map(encodeURIComponent).join("/"),Vt=(i,t,e={})=>{let n=document.createElement(i);t!==void 0&&(n.textContent=t);for(let[s,r]of Object.entries(e))n.setAttribute(s,String(r));return n};async function ug(i,t){let e=await fetch(i,{credentials:"same-origin",cache:"no-store",redirect:"error",signal:t,headers:{Accept:"application/json"}});if(e.redirected||new URL(e.url).origin!==location.origin||!e.headers.get("content-type")?.startsWith("application/json"))throw new Error("invalid_response");let n=await e.json();if(!e.ok)throw new Error(e.status===401?"authentication_required":n.restart?"restart_required":n.reason_code||"graph_unavailable");if(n.untrusted_content!==!0)throw new Error("invalid_response");if(n.state==="unavailable"||n.freshness?.state==="unavailable")throw new Error(n.reason_code||"storage_unavailable");return n}function dg(i,{currentPath:t="",onClose:e=()=>{}}={}){let n=L=>i.querySelector(L),s=n("[data-graph-panel]")||i,r=n("[data-graph-filters]"),a=L=>r.elements.namedItem(L),o=n("[data-graph-status]"),l=n("[data-graph-details]"),c=n("[data-graph-index-status]"),d=n("[data-graph-index-progress]");c&&(c.open=!1),d&&(d.textContent="Open for current indexing progress.");let m,h,g=()=>{clearTimeout(m),h?.abort(),h=null};async function p(){if(g(),!c?.open||S||rt.active!=="evidence")return;let L=new AbortController;h=L;try{let q=await fetch("/index/status/",{credentials:"same-origin",cache:"no-store",redirect:"error",signal:L.signal,headers:{Accept:"application/json"}});if(!q.ok||q.redirected||new URL(q.url).origin!==location.origin||!q.headers.get("content-type")?.startsWith("application/json"))throw new Error("status_unavailable");let ut=await q.json();!L.signal.aborted&&c.open&&!S&&(d.textContent=Ah(ut))}catch{L.signal.aborted||(d.textContent="Index progress is unavailable. Refresh or sign in again to try.")}finally{h===L&&(h=null,c.open&&!S&&rt.active==="evidence"&&(m=setTimeout(p,2e3)))}}let y=n("[data-graph-map]"),f=new AbortController,u=(L,q,ut,I={})=>L.addEventListener(q,ut,{...I,signal:f.signal}),v=L=>{o.textContent!==L&&(o.textContent=L)},b=new $a(location.origin),S=!1,C=0,T=null,E=null,x=null,M=t||null,B=t||null,R=Eh,O=!0,k=[],F=null,H=null,V=null,D=null,st=!1,tt=!1,ht="",gt;try{gt=window.localStorage}catch{}let j=yh(gt),_t=()=>{clearTimeout(E),E=null},Ht=()=>!F?.path,zt=L=>JSON.stringify(["folder","tag","query"].map(q=>L?.[q]||"")),J=()=>{_t(),!S&&!document.hidden&&(E=setTimeout(()=>{E=null,Mt()},15e3))};c&&u(c,"toggle",()=>{c.open?p():g()}),n("[data-graph-filter-options]").open=!1,n("[data-graph-map-options]").open=!1,n("[data-graph-settings]").open=!1,n("[data-graph-forces]").open=!1,n("[data-graph-control-options]").open=!0;let it=()=>R?n("[data-graph-list-toggle]"):y,rt=Dl(i,{navigation:it,onShow:L=>{D?.cancelHints(),L==="find"&&ce(),L==="evidence"&&c?.open&&p()},onHide:L=>{L==="evidence"&&g()}}),It=()=>{rt.active!=="find"?rt.show("find",it()):n("[data-graph-find]").focus({preventScroll:!0})},Et=()=>{let L={...Object.fromEntries(new FormData(r)),depth:a("depth").value};return L.path||delete L.path,L},wt=()=>({...F||Et()});function ce(){let L=document.activeElement?.dataset.graphFindPath,q=n("[data-graph-find]").value.trim().toLocaleLowerCase(),ut=n("[data-graph-find-results]");ut.replaceChildren();let I=[...b.nodes.values()].filter($=>!q||`${$.title} ${$.path}`.toLocaleLowerCase().includes(q));n("[data-graph-find-scope]").textContent=`Find in the loaded${["query","folder","tag"].some($=>F?.[$]?.trim())?" filtered":""} snapshot${b.complete?"":" \xB7 Incomplete evidence"}. Selecting expands the exploration; the opening root stays fixed.`,n("[data-graph-find-count]").textContent=`${I.length} matching notes${I.length>50?" \xB7 First 50 shown; refine your search":""}`;for(let $ of I.slice(0,50)){let Q=Vt("button",$.title,{type:"button","aria-label":`Select ${$.title}`,"data-graph-find-path":$.path});Q.append(Vt("small",$.path)),Q.addEventListener("click",()=>{b.nodes.has($.path)&&(F.path&&b.expand($.path),Z(),yt($.path,!0),rt.close({restore:!1}),it().focus({preventScroll:!0}))});let ct=Vt("li");ct.append(Q),ut.append(ct)}I.length||ut.append(Vt("li",T?"Loading notes\u2026":"No matching notes in this snapshot. Change explicit filters to search another scope.")),L&&rt.active==="find"&&([...ut.querySelectorAll("button")].find($=>$.dataset.graphFindPath===L)||n("[data-graph-find]")).focus({preventScroll:!0})}u(n("[data-graph-find]"),"input",ce);let Wt=L=>{if(!L||!x?.nodes.some(ut=>ut.path===L))return;let q=Vt("a","",{href:Ch(L),hidden:""});s.append(q);try{q.click()}finally{q.remove()}},Kt=()=>rt.show("help"),te=()=>{rt.close()||e()},Nt=()=>{O=!1,R=!0,P(),tt||v("Map unavailable. Use the connection list, or retry the map."),n("[data-graph-graphics-retry]").hidden=!1};function le(){try{D=new Ya(y,{onSelect:(L,q)=>yt(L,q),onOpen:Wt,onCenter:L=>Rt(L),onSearch:It,onEscape:te,onHelp:Kt,onHint:v,onPause:L=>{n("[data-graph-pause]").setAttribute("aria-pressed",String(L))},onUnavailable:Nt,onRestored:()=>{O=!0,n("[data-graph-graphics-retry]").hidden=!0,v("Map ready. Switch to the map to continue.")},onLimit:()=>{}}),D.setForces(j),O=D.available!==!1,O||Nt()}catch{Nt()}}function P(){s.classList.toggle("graph-list-mode",R),n("[data-graph-list]").hidden=!R,y.hidden=R,R?D?.stop():(D?.draw(),D?.wake()),n("[data-graph-list-toggle]").setAttribute("aria-pressed",String(R)),n("[data-graph-hints]").disabled=R||!O}function ae(){let L=Ht(),q=Number(F?.depth||a("depth").value),ut=["query","folder","tag"].filter(Q=>(F?.[Q]||"").trim());n("[data-graph-cancel]").hidden=st||tt||!T,n("[data-graph-resume]").hidden=!st||tt,n("[data-graph-restart]").hidden=!tt,n("[data-graph-depth-controls]").hidden=L,a("depth").disabled=L,n("[data-graph-depth-down]").disabled=q<=1,n("[data-graph-depth-up]").disabled=q>=8,n("[data-graph-depth-value]").textContent=`${q} hop${q===1?"":"s"}`,n("[data-graph-local]").setAttribute("aria-pressed",String(!L)),n("[data-graph-global]").setAttribute("aria-pressed",String(L));let I=b.nodes.get(M);n("[data-graph-selection]").textContent=I?`Selected \xB7 ${I.title}`:"",n("[data-graph-scope]").textContent=`${L?"Whole wiki":`Local \xB7 ${q} hop${q===1?"":"s"} \xB7 ${F?.path||a("path").value}`}${ut.length?` \xB7 Filtered by ${ut.map(Q=>`${Q}: ${F[Q]}`).join(", ")}`:""}`;let $=tt?"Partial \u2014 loading stopped":st?"Loading paused \xB7 Partial":T?"Loading\u2026":b.complete?"Complete":x?.limiting_reasons?.includes("index_updating")||x?.freshness?.state==="partial"?"Loaded available results \xB7 Index updating":"Loaded available results \xB7 Incomplete evidence";n("[data-graph-summary]").textContent=x?`${x.nodes.length} notes \xB7 ${x.edges.length} directed links \xB7 ${$}${x.boundary_connections?" \xB7 Some connections are outside your filters":""}`:""}let Ut=250,Xt=0,xt=0;function A(L,q,ut){let I=n(`[data-graph-${L}-navigation]`),$=I.contains(document.activeElement),Q=document.activeElement===I.lastElementChild;if(I.replaceChildren(),I.hidden=q<=Ut,I.hidden)return;let ct=Vt("button",`Previous ${L}`,{type:"button"}),nt=Vt("button",`Next ${L}`,{type:"button"});ct.disabled=ut===0,nt.disabled=ut+Ut>=q;let X=dt=>{L==="notes"?Xt=Math.max(0,Xt+dt):xt=Math.max(0,xt+dt),_()};if(ct.addEventListener("click",()=>X(-Ut)),nt.addEventListener("click",()=>X(Ut)),I.append(ct,Vt("span",`${ut+1}\u2013${Math.min(ut+Ut,q)} of ${q} loaded ${L}`),nt),$){let dt=Q?nt:ct;(dt.disabled?Q?ct:nt:dt).focus({preventScroll:!0})}}function _(){let L=document.activeElement?.dataset.graphInspect,q=n("[data-graph-nodes]");q.replaceChildren();let ut=[...x?.nodes||[]].sort(($,Q)=>$.path.localeCompare(Q.path));Xt=Math.min(Xt,Math.max(0,Math.floor((ut.length-1)/Ut)*Ut)),xt=Math.min(xt,Math.max(0,Math.floor(((x?.edges.length||0)-1)/Ut)*Ut)),A("notes",ut.length,Xt),A("links",x?.edges.length||0,xt);for(let $ of ut.slice(Xt,Xt+Ut)){let Q=Vt("li"),ct=Vt("button",`Inspect ${$.title}`,{type:"button","data-graph-inspect":$.path,"aria-pressed":String($.path===M)});ct.addEventListener("click",()=>{yt($.path,!1),rt.show("evidence",document.activeElement)});let nt=Vt("a",`Open ${$.path}`,{href:$.href});$.path===t&&nt.setAttribute("aria-current","page"),Q.append(Vt("strong",$.title),Vt("div",$.path),ct,nt),q.append(Q),L===$.path&&ct.focus({preventScroll:!0})}x?.nodes.length||q.append(Vt("li",tt?ht==="graph_query_limited"?"The graph query limit was reached. Try fewer hops or narrower filters.":"Loading stopped. Check the graph status for recovery options.":T?"Loading connections\u2026":x&&b.complete?"No notes match this scope.":"Loaded available results. Relationships are still updating."));let I=n("[data-graph-edges]");I.replaceChildren();for(let $ of(x?.edges||[]).slice(xt,xt+Ut))I.append(Vt("li",`${$.source} \u2192 ${$.destination} \xB7 ${$.occurrence_count} occurrence${$.occurrence_count===1?"":"s"}`))}function N({suspend:L=!1}={}){L?b.suspend():(b.clear(),H=V=null),x=null,M=B=null,Xt=xt=0,L&&(y.hidden=!0),delete l.dataset.path,l.replaceChildren(Vt("h2","Selected note"),Vt("p","Select a note to see its connections.")),n("[data-graph-diagnostics]").textContent="",D?.setGraph({nodes:[],edges:[]},t,F?.path||null),D?.setSelection(null,null),_(),ae(),ce()}function K(){x&&D&&(H=new Map(D.simulation.nodes),V={selected:M,focused:B,navigationFocus:y.contains(document.activeElement)}),N({suspend:!0})}function et(L){let q=b.nodes.get(L),ut=l.dataset.path===L,I=new Set(ut?[...l.querySelectorAll("details[open]")].map(X=>X.dataset.graphDisclosure):[]),$=ut&&l.contains(document.activeElement)?document.activeElement.dataset.graphDetailFocus:null;if(l.replaceChildren(Vt("h2","Selected note")),l.dataset.path=L||"",!q){l.append(Vt("p","Select a note to see its connections."));return}l.append(Vt("h3",q.title),Vt("p",L),Vt("a","Open selected note",{href:q.href,"data-graph-detail-focus":"open"}));let Q=Vt("button","Expand selected note",{type:"button","data-graph-detail-focus":"expand"});Q.addEventListener("click",()=>Rt(L)),l.append(Q),l.append(Vt("p",b.complete?"Saved connections":"Updating saved connections"));let ct=b.connections(L);for(let[X,dt]of[["incoming","Incoming"],["outgoing","Outgoing and references"]]){let Lt=Vt("ul");l.append(Vt("h3",dt),Lt);for(let Gt of ct[X]){let Jt=X==="incoming"?Gt.source:Gt.destination,Oe=JSON.stringify([X,Jt]),De=Vt("li",void 0,{class:"graph-connection"});De.append(Vt("span",Jt,{class:"graph-connection-path"}),Vt("span",`${Gt.occurrence_count} occurrence${Gt.occurrence_count===1?"":"s"}`,{class:"graph-connection-count"})),De.append(Vt("a",X==="incoming"?"Open source":"Open destination",{href:b.nodes.get(Jt).href,"data-graph-detail-focus":Oe+":open"}));let ki=Vt("details",void 0,{"data-graph-disclosure":Oe});ki.append(Vt("summary","Source evidence",{"data-graph-detail-focus":Oe+":source"}),Vt("p",`${Gt.source} \xB7 ${Gt.position_precision||"advisory"} line ${Gt.position?.[0]||"?"}, column ${Gt.position?.[1]||"?"}`),Vt("code",Gt.source_revision||"")),De.append(ki),Lt.append(De)}ct[X].length||Lt.append(Vt("li",b.complete?"No saved connections.":"Connections are still updating."))}let nt=Vt("details",void 0,{"data-graph-disclosure":"technical"});nt.append(Vt("summary","Technical evidence",{"data-graph-detail-focus":"technical"}),Vt("p",`Indexed revision ${q.revision} \xB7 relation epoch ${x.relation_epoch} \xB7 observed ${x.observed_at}. Source locations are advisory; fragments are unchecked. Snapshot contains resolved note connections.`)),l.append(nt);for(let X of l.querySelectorAll("details"))X.open=I.has(X.dataset.graphDisclosure);$&&[...l.querySelectorAll("[data-graph-detail-focus]")].find(X=>X.dataset.graphDetailFocus===$)?.focus({preventScroll:!0})}function Z({fit:L=!1}={}){if(x=b.explore(F.path||null,F.depth),!x)return;x.nodes.some(ut=>ut.path===M)||(M=x.nodes.some(ut=>ut.path===F.path)?F.path:null),x.nodes.some(ut=>ut.path===B)||(B=M||x.nodes[0]?.path||null);let q=!1;try{D?.setGraph(x,t,F.path||null),D?.setSelection(M,B)}catch{q=!0,Nt()}L&&x.nodes.length&&!q&&!D?.cameraControlled&&D?.fit(),_(),et(M),P(),ae(),rt.active==="find"&&ce(),n("[data-graph-diagnostics]").textContent=`Index ${x.freshness.state} \xB7 relation epoch ${x.relation_epoch} \xB7 observed ${x.observed_at}. ${x.limiting_reasons.join(", ")} Indexed saved content, not a disk snapshot. Hops refer to loaded edges; unsaved edits are excluded.`,D?.hints?.active||v(q?"Map resource limit reached. All loaded records remain available in the connection list.":"")}function yt(L,q){x?.nodes.some(ut=>ut.path===L)&&(M=L,q&&(B=L),F.path&&b.expand(L),Z(),v(`Selected ${L}. Enter on the map opens it.`))}function lt({fit:L=!1,params:q=wt()}={}){if(!b.data||zt(q)!==zt(F)){Mt({fit:L,params:q});return}F=q,Z({fit:L})}async function Mt({fit:L=!1,params:q=wt()}={}){if(S||document.hidden)return;_t();let ut=++C;T?.abort();let I=new AbortController;T=I,st=!1,tt=!1,ht="",F&&zt(q)!==zt(F)&&N(),F=q,v(x?"Updating connections\u2026":"Loading connections\u2026"),ae();try{let $=new URLSearchParams;for(let dt of["folder","tag","query"])q[dt]?.trim()&&$.set(dt,q[dt]);let Q=await ug("/tools/graph/snapshot/?"+$,I.signal);if(S||document.hidden||I.signal.aborted||ut!==C)return;let ct=b.scope!==null,nt=b.accept(Q),X=nt&&V?.navigationFocus;if(!nt&&ct&&(H=V=null,M=B=null,D?.setGraph({nodes:[],edges:[]},t,F.path||null)),nt&&H&&D){for(let dt of Q.nodes)H.has(dt.path)&&D.simulation.nodes.set(dt.path,H.get(dt.path));M=V?.selected||M,B=V?.focused||B}H=V=null,F=wt(),Z({fit:L}),X&&!R&&y.focus({preventScroll:!0})}catch($){!S&&ut===C&&!I.signal.aborted&&(tt=!0,ht=$.message,N(),v($.message==="authentication_required"?"Session expired. Sign in again to load the graph.":$.message==="restart_required"?"Connections changed. Restart loading to revalidate this view.":$.message==="graph_query_limited"?"The graph query limit was reached. Try narrower filters or restart loading.":$.message==="graph_database_error"?"Connections could not load because of a database error. Refresh to try again.":"Unable to load connections. Restart loading to try again."))}finally{ut===C&&(T=null,ae(),J())}}function Rt(L){if(L){if(F?.path){yt(L,!0);return}a("path").value=t||L,st=!1,lt({fit:!0,params:{...wt(),path:a("path").value}})}}u(r,"submit",L=>{L.preventDefault(),st=!1,Mt({fit:!0,params:Et()})});function at(L){if(!F?.path){v("Hop depth applies to a local neighborhood. Choose Local first.");return}let q=Number(F.depth)+L;if(q<1||q>8){v(q<1?"Minimum local depth is one hop.":"Maximum local depth is eight hops; query resource limits may make the view partial.");return}a("depth").value=String(q),lt({params:{...wt(),depth:String(q)}})}u(n("[data-graph-depth-down]"),"click",()=>at(-1)),u(n("[data-graph-depth-up]"),"click",()=>at(1)),u(i,"keydown",L=>{!["[","]"].includes(L.key)||L.isComposing||L.ctrlKey||L.altKey||L.metaKey||L.target.closest("input, textarea, select, [contenteditable], [role=textbox]")||L.target!==y&&L.target!==n("[data-graph-list-toggle]")||(L.preventDefault(),L.stopPropagation(),at(L.key==="["?-1:1))}),u(i,"keydown",L=>{if(!(L.isComposing||L.ctrlKey||L.altKey||L.metaKey)){if(L.key==="Escape"&&rt.active){L.preventDefault(),L.stopImmediatePropagation(),rt.close();return}if(L.target===y&&!D?.hints?.active&&["o","e"].includes(L.key)){L.preventDefault(),L.stopImmediatePropagation(),rt.show(L.key==="o"?"controls":"evidence");return}L.key==="Escape"&&L.target!==y&&(L.preventDefault(),L.stopImmediatePropagation(),te())}},{capture:!0}),u(n("[data-graph-clear]"),"click",()=>{for(let L of["query","folder","tag"])a(L).value="";Mt({params:{...wt(),query:"",folder:"",tag:""}})}),u(n("[data-graph-local]"),"click",()=>{F?.path||Rt(t||M)}),u(n("[data-graph-global]"),"click",()=>{a("path").value="",a("depth").disabled=!1;let L=wt();delete L.path,lt({fit:!0,params:L})}),u(n("[data-graph-back]"),"click",()=>{st=!1,a("path").value=k.pop()||t,n("[data-graph-back]").disabled=!k.length,lt({fit:!0,params:{...wt(),path:a("path").value}})}),u(n("[data-graph-list-toggle]"),"click",()=>{rt.close({restore:!1}),D?.cancelHints(),R=!R||!O,O&&(Eh=R),P()}),u(n("[data-graph-hints]"),"click",()=>D?.hints?.active?D.cancelHints(!0):D?.beginHints()),u(n("[data-graph-fit]"),"click",()=>D?.fit()),u(n("[data-graph-reset]"),"click",()=>D?.resetOrientation());for(let L of i.querySelectorAll("[data-graph-orbit]"))u(L,"click",()=>D?.orbit(Number(L.dataset.graphOrbit),0));for(let L of i.querySelectorAll("[data-graph-zoom]"))u(L,"click",()=>D?.zoom(Number(L.dataset.graphZoom)));let ot={left:[-80,0],right:[80,0],up:[0,-80],down:[0,80]};for(let L of i.querySelectorAll("[data-graph-pan]"))u(L,"click",()=>D?.pan(...ot[L.dataset.graphPan]));u(n("[data-graph-pause]"),"click",()=>D?.setPaused(!D.paused)),u(n("[data-graph-bloom]"),"input",L=>{D?.setBloom(L.target.value);let q=["Off","Default","High"][Number(L.target.value)/2];L.target.setAttribute("aria-valuetext",q),n("[data-graph-bloom-value]").textContent=q}),u(n("[data-graph-refresh]"),"click",()=>{st=!1,Mt()}),u(n("[data-graph-cancel]"),"click",()=>{st=!0,C++,_t(),T?.abort(),T=null,N(),ae(),v("Loading paused. Resume loading to continue. Motion is unchanged.")}),u(n("[data-graph-resume]"),"click",()=>{st=!1,Mt()}),u(n("[data-graph-restart]"),"click",()=>{st=!1,Mt()}),u(n("[data-graph-graphics-retry]"),"click",()=>{D?.destroy(),D=null,le(),O&&(n("[data-graph-graphics-retry]").hidden=!0,R=!1,x&&(D.setGraph(x,t,F?.path||null),D.setSelection(M,B),D.fit()),P())});let St=()=>{for(let L of i.querySelectorAll("[data-graph-force]")){let q=L.dataset.graphForce;L.value=String(j[q]),L.setAttribute("aria-valuetext",`${j[q]} times default`),n(`[data-graph-force-value="${q}"]`).textContent=`${j[q]}\xD7`}};for(let L of i.querySelectorAll("[data-graph-force]"))u(L,"input",()=>{j={...j,[L.dataset.graphForce]:Number(L.value)},xl(gt,j),St(),D?.setForces(j)});return u(n("[data-graph-forces-reset]"),"click",()=>{j={...Bi},xl(gt,j),St(),D?.setForces(j)}),St(),u(n("[data-graph-help-toggle]"),"click",Kt),u(document,"visibilitychange",()=>{document.hidden?(g(),C++,_t(),T?.abort(),T=null,K()):S||(c?.open&&p(),Mt())}),u(window,"pagehide",()=>{g(),C++,_t(),T?.abort(),T=null,K(),D?.stop()}),u(window,"pageshow",L=>{L.persisted&&!S&&Mt()}),n("[data-graph-hints]").hidden=!1,n("[data-graph-controls]").hidden=!1,n("[data-graph-clear]").hidden=!1,n("[data-graph-list-toggle]").hidden=!1,i.matches("[data-graph-page]")&&i.classList.add("graph-enhanced"),le(),n("[data-graph-pause]").setAttribute("aria-pressed",String(D?.paused||!1)),D?.setBloom(n("[data-graph-bloom]").value),P(),F=wt(),Mt({fit:!0}),{focusSearch:It,dismissLayer:()=>rt.close(),focusNavigation(){R?n("[data-graph-list-toggle]").focus({preventScroll:!0}):y.focus({preventScroll:!0})},destroy(){S=!0,g(),C++,_t(),T?.abort(),rt.destroy(),f.abort(),D?.destroy(),H=V=null,b.clear(),x=null,M=B=null,n("[data-graph-nodes]").replaceChildren(),n("[data-graph-edges]").replaceChildren();for(let L of["notes","links"]){let q=n(`[data-graph-${L}-navigation]`);q.replaceChildren(),q.hidden=!0}for(let L of["nodeCount","edgeCount"])y.dataset[L]="0";for(let L of["root","selected","focused"])delete y.dataset[L];y.setAttribute("aria-label","3D note relationship map"),n("[data-graph-find-results]").replaceChildren(),n("[data-graph-find]").value="",n("[data-graph-find-count]").textContent="",delete l.dataset.path,n("[data-graph-selection]").textContent="",l.replaceChildren(),n("[data-graph-summary]").textContent="",n("[data-graph-diagnostics]").textContent="",v("")}}}var Is=document.querySelector("[data-graph-page]");if(Is)try{dg(Is,{currentPath:Is.dataset.graphPath,onClose:()=>{let i=Is.dataset.graphPath;location.assign(i?Ch(i):"/")}}),Is.querySelector("[data-graph-server-list]")?.remove(),document.querySelector("#graph-initial-data")?.remove(),document.querySelector("#graph-initial-params")?.remove()}catch{}export{dg as mountGraph};
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
