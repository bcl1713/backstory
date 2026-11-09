function Fl(i,{navigation:t,onShow:e=()=>{},onHide:n=()=>{}}){let s=new AbortController,r=[...i.querySelectorAll("[data-graph-overlay]")],a=[...i.querySelectorAll("[data-graph-toggle]")],o=null,l=null,c=(g,y,p)=>g.addEventListener(y,p,{signal:s.signal});function u({restore:g=!0}={}){if(!o)return!1;n(o.dataset.graphOverlay),o.hidden=!0,o=null;for(let p of a)p.setAttribute("aria-expanded","false");let y=typeof l=="function"?l():l;return g&&(y?.isConnected&&!y.closest("[hidden]")&&i.contains(y)?y:t()).focus({preventScroll:!0}),l=null,!0}function m(g,y=document.activeElement){let p=r.find(v=>v.dataset.graphOverlay===g);if(!p)return;if(o===p){u();return}let d=typeof y!="function"&&o?.contains(y)?l:y;u({restore:!1}),o=p,l=d,o.hidden=!1;for(let v of a)v.setAttribute("aria-expanded",String(v.dataset.graphToggle===g));e(g),(o.querySelector("[data-graph-find]")||o.querySelector("[data-graph-dismiss]")||o).focus({preventScroll:!0})}for(let g of r){g.hidden=!0;for(let y of g.querySelectorAll("[data-graph-dismiss]"))c(y,"click",()=>u())}for(let g of a)c(g,"click",()=>m(g.dataset.graphToggle,g));function h(){let g=i.querySelector("[data-graph-panel]")||i,y=g.getBoundingClientRect(),p=window.visualViewport,d=p?.offsetTop||0,v=d+(p?.height||innerHeight);g.style.setProperty("--graph-keyboard-inset",`${Math.max(0,y.bottom-v)}px`),g.style.setProperty("--graph-sheet-height",`${Math.max(80,Math.min(y.height,v-Math.max(y.top,d))-76)}px`)}window.visualViewport&&(c(window.visualViewport,"resize",h),c(window.visualViewport,"scroll",h));let f=new ResizeObserver(h);return f.observe(i.querySelector("[data-graph-panel]")||i),c(window,"resize",h),h(),{show:m,close:u,get active(){return o?.dataset.graphOverlay||null},destroy(){u({restore:!1}),f.disconnect(),s.abort()}}}var lc=0,Uo=1,cc=2;var vs=1,hc=2,Ni=3,bn=0,De=1,He=2,un=0,ti=1,No=2,Fo=3,Oo=4,uc=5;var On=100,dc=101,fc=102,pc=103,mc=104,gc=200,xc=201,_c=202,yc=203,cr=204,hr=205,vc=206,Mc=207,Sc=208,bc=209,wc=210,Ac=211,Tc=212,Ec=213,Cc=214,ur=0,dr=1,fr=2,ei=3,pr=4,mr=5,gr=6,xr=7,Bo=0,Rc=1,Ic=2,Qe=0,zo=1,ko=2,Vo=3,Go=4,Ho=5,Wo=6,Xo=7;var qo=300,Hn=301,ii=302,qr=303,Yr=304,Ms=306,_r=1e3,rn=1001,yr=1002,ve=1003,Pc=1004;var Ss=1005;var be=1006,$r=1007;var Wn=1008;var We=1009,Yo=1010,$o=1011,Fi=1012,Zr=1013,tn=1014,qe=1015,dn=1016,Jr=1017,Kr=1018,Oi=1020,Zo=35902,Jo=35899,Ko=1021,jo=1022,Ye=1023,an=1026,Xn=1027,jr=1028,Qr=1029,si=1030,ta=1031;var ea=1033,bs=33776,ws=33777,As=33778,Ts=33779,na=35840,ia=35841,sa=35842,ra=35843,aa=36196,oa=37492,la=37496,ca=37488,ha=37489,ua=37490,da=37491,fa=37808,pa=37809,ma=37810,ga=37811,xa=37812,_a=37813,ya=37814,va=37815,Ma=37816,Sa=37817,ba=37818,wa=37819,Aa=37820,Ta=37821,Ea=36492,Ca=36494,Ra=36495,Ia=36283,Pa=36284,La=36285,Da=36286;var Ki=2300,vr=2301,lr=2302,To=2303,Eo=2400,Co=2401,Ro=2402;var Lc=3200;var Dc=0,Uc=1,Tn="",Pe="srgb",ni="srgb-linear",ji="linear",te="srgb";var Qn=7680;var Io=519,Nc=512,Fc=513,Oc=514,Ua=515,Bc=516,zc=517,Na=518,kc=519,Po=35044,Es=35048;var Qo="300 es",je=2e3,Qi=2001;function zh(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function kh(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function ts(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Vc(){let i=ts("canvas");return i.style.display="block",i}var Ol={},Ri=null;function tl(...i){let t="THREE."+i.shift();Ri?Ri("log",t,...i):console.log(t,...i)}function Gc(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Lt(...i){i=Gc(i);let t="THREE."+i.shift();if(Ri)Ri("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Dt(...i){i=Gc(i);let t="THREE."+i.shift();if(Ri)Ri("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function es(...i){let t=i.join(" ");t in Ol||(Ol[t]=!0,Lt(...i))}function Hc(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var Wc={[ur]:dr,[fr]:gr,[pr]:xr,[ei]:mr,[dr]:ur,[gr]:fr,[xr]:pr,[mr]:ei},wn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Te=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var eo=Math.PI/180,Mr=180/Math.PI;function Cs(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Te[i&255]+Te[i>>8&255]+Te[i>>16&255]+Te[i>>24&255]+"-"+Te[t&255]+Te[t>>8&255]+"-"+Te[t>>16&15|64]+Te[t>>24&255]+"-"+Te[e&63|128]+Te[e>>8&255]+"-"+Te[e>>16&255]+Te[e>>24&255]+Te[n&255]+Te[n>>8&255]+Te[n>>16&255]+Te[n>>24&255]).toLowerCase()}function qt(i,t,e){return Math.max(t,Math.min(e,i))}function Vh(i,t){return(i%t+t)%t}function no(i,t,e){return(1-e)*i+e*t}function Hi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Ue(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Qt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=qt(this.x,t.x,e.x),this.y=qt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=qt(this.x,t,e),this.y=qt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},on=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],u=n[s+2],m=n[s+3],h=r[a+0],f=r[a+1],g=r[a+2],y=r[a+3];if(m!==y||l!==h||c!==f||u!==g){let p=l*h+c*f+u*g+m*y;p<0&&(h=-h,f=-f,g=-g,y=-y,p=-p);let d=1-o;if(p<.9995){let v=Math.acos(p),M=Math.sin(v);d=Math.sin(d*v)/M,o=Math.sin(o*v)/M,l=l*d+h*o,c=c*d+f*o,u=u*d+g*o,m=m*d+y*o}else{l=l*d+h*o,c=c*d+f*o,u=u*d+g*o,m=m*d+y*o;let v=1/Math.sqrt(l*l+c*c+u*u+m*m);l*=v,c*=v,u*=v,m*=v}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=m}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],u=n[s+3],m=r[a],h=r[a+1],f=r[a+2],g=r[a+3];return t[e]=o*g+u*m+l*f-c*h,t[e+1]=l*g+u*h+c*m-o*f,t[e+2]=c*g+u*f+o*h-l*m,t[e+3]=u*g-o*m-l*h-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(s/2),m=o(r/2),h=l(n/2),f=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=h*u*m+c*f*g,this._y=c*f*m-h*u*g,this._z=c*u*g+h*f*m,this._w=c*u*m-h*f*g;break;case"YXZ":this._x=h*u*m+c*f*g,this._y=c*f*m-h*u*g,this._z=c*u*g-h*f*m,this._w=c*u*m+h*f*g;break;case"ZXY":this._x=h*u*m-c*f*g,this._y=c*f*m+h*u*g,this._z=c*u*g+h*f*m,this._w=c*u*m-h*f*g;break;case"ZYX":this._x=h*u*m-c*f*g,this._y=c*f*m+h*u*g,this._z=c*u*g-h*f*m,this._w=c*u*m+h*f*g;break;case"YZX":this._x=h*u*m+c*f*g,this._y=c*f*m+h*u*g,this._z=c*u*g-h*f*m,this._w=c*u*m-h*f*g;break;case"XZY":this._x=h*u*m-c*f*g,this._y=c*f*m-h*u*g,this._z=c*u*g+h*f*m,this._w=c*u*m+h*f*g;break;default:Lt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],m=e[10],h=n+o+m;if(h>0){let f=.5/Math.sqrt(h+1);this._w=.25/f,this._x=(u-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(n>o&&n>m){let f=2*Math.sqrt(1+n-o-m);this._w=(u-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>m){let f=2*Math.sqrt(1+o-n-m);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+u)/f}else{let f=2*Math.sqrt(1+m-n-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(qt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+a*o+s*c-r*l,this._y=s*u+a*l+r*o-n*c,this._z=r*u+a*c+n*l-s*o,this._w=a*u-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,e=Math.sin(e*c)/u,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},z=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Bl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Bl.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),u=2*(o*e-r*s),m=2*(r*n-a*e);return this.x=e+l*c+a*m-o*u,this.y=n+l*u+o*c-r*m,this.z=s+l*m+r*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=qt(this.x,t.x,e.x),this.y=qt(this.y,t.y,e.y),this.z=qt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=qt(this.x,t,e),this.y=qt(this.y,t,e),this.z=qt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return io.copy(this).projectOnVector(t),this.sub(io)}reflect(t){return this.sub(io.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},io=new z,Bl=new on,zt=class i{constructor(t,e,n,s,r,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],m=n[7],h=n[2],f=n[5],g=n[8],y=s[0],p=s[3],d=s[6],v=s[1],M=s[4],w=s[7],E=s[2],A=s[5],R=s[8];return r[0]=a*y+o*v+l*E,r[3]=a*p+o*M+l*A,r[6]=a*d+o*w+l*R,r[1]=c*y+u*v+m*E,r[4]=c*p+u*M+m*A,r[7]=c*d+u*w+m*R,r[2]=h*y+f*v+g*E,r[5]=h*p+f*M+g*A,r[8]=h*d+f*w+g*R,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-n*r*u+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],m=u*a-o*c,h=o*l-u*r,f=c*r-a*l,g=e*m+n*h+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/g;return t[0]=m*y,t[1]=(s*c-u*n)*y,t[2]=(o*n-s*a)*y,t[3]=h*y,t[4]=(u*e-s*l)*y,t[5]=(s*r-o*e)*y,t[6]=f*y,t[7]=(n*l-c*e)*y,t[8]=(a*e-n*r)*y,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(so.makeScale(t,e)),this}rotate(t){return this.premultiply(so.makeRotation(-t)),this}translate(t,e){return this.premultiply(so.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},so=new zt,zl=new zt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),kl=new zt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Gh(){let i={enabled:!0,workingColorSpace:ni,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===te&&(s.r=Sn(s.r),s.g=Sn(s.g),s.b=Sn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===te&&(s.r=Ci(s.r),s.g=Ci(s.g),s.b=Ci(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Tn?ji:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return es("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return es("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[ni]:{primaries:t,whitePoint:n,transfer:ji,toXYZ:zl,fromXYZ:kl,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Pe},outputColorSpaceConfig:{drawingBufferColorSpace:Pe}},[Pe]:{primaries:t,whitePoint:n,transfer:te,toXYZ:zl,fromXYZ:kl,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Pe}}}),i}var Zt=Gh();function Sn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ci(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var mi,Sr=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{mi===void 0&&(mi=ts("canvas")),mi.width=t.width,mi.height=t.height;let s=mi.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=mi}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=ts("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Sn(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Sn(e[n]/255)*255):e[n]=Sn(e[n]);return{data:e,width:t.width,height:t.height}}else return Lt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Hh=0,Ii=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Hh++}),this.uuid=Cs(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayHeight,e.displayWidth,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(ro(s[a].image)):r.push(ro(s[a]))}else r=ro(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function ro(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Sr.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Lt("Texture: Unable to serialize Texture."),{})}var Wh=0,ao=new z,Ne=class i extends wn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=rn,s=rn,r=be,a=Wn,o=Ye,l=We,c=i.DEFAULT_ANISOTROPY,u=Tn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Wh++}),this.uuid=Cs(),this.name="",this.source=new Ii(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Qt(0,0),this.repeat=new Qt(1,1),this.center=new Qt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new zt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(ao).x}get height(){return this.source.getSize(ao).y}get depth(){return this.source.getSize(ao).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Lt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Lt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==qo)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case _r:t.x=t.x-Math.floor(t.x);break;case rn:t.x=t.x<0?0:1;break;case yr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case _r:t.y=t.y-Math.floor(t.y);break;case rn:t.y=t.y<0?0:1;break;case yr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ne.DEFAULT_IMAGE=null;Ne.DEFAULT_MAPPING=qo;Ne.DEFAULT_ANISOTROPY=1;var he=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],u=l[4],m=l[8],h=l[1],f=l[5],g=l[9],y=l[2],p=l[6],d=l[10];if(Math.abs(u-h)<.01&&Math.abs(m-y)<.01&&Math.abs(g-p)<.01){if(Math.abs(u+h)<.1&&Math.abs(m+y)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+d-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let M=(c+1)/2,w=(f+1)/2,E=(d+1)/2,A=(u+h)/4,R=(m+y)/4,_=(g+p)/4;return M>w&&M>E?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=A/n,r=R/n):w>E?w<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(w),n=A/s,r=_/s):E<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(E),n=R/r,s=_/r),this.set(n,s,r,e),this}let v=Math.sqrt((p-g)*(p-g)+(m-y)*(m-y)+(h-u)*(h-u));return Math.abs(v)<.001&&(v=1),this.x=(p-g)/v,this.y=(m-y)/v,this.z=(h-u)/v,this.w=Math.acos((c+f+d-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=qt(this.x,t.x,e.x),this.y=qt(this.y,t.y,e.y),this.z=qt(this.z,t.z,e.z),this.w=qt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=qt(this.x,t,e),this.y=qt(this.y,t,e),this.z=qt(this.z,t,e),this.w=qt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},br=class extends wn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:be,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new he(0,0,t,e),this.scissorTest=!1,this.viewport=new he(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},r=new Ne(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){let e={minFilter:be,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new Ii(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ve=class extends br{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},ns=class extends Ne{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ve,this.minFilter=ve,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var wr=class extends Ne{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ve,this.minFilter=ve,this.wrapR=rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var re=class i{constructor(t,e,n,s,r,a,o,l,c,u,m,h,f,g,y,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,u,m,h,f,g,y,p)}set(t,e,n,s,r,a,o,l,c,u,m,h,f,g,y,p){let d=this.elements;return d[0]=t,d[4]=e,d[8]=n,d[12]=s,d[1]=r,d[5]=a,d[9]=o,d[13]=l,d[2]=c,d[6]=u,d[10]=m,d[14]=h,d[3]=f,d[7]=g,d[11]=y,d[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinant()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinant()===0)return this.identity();let e=this.elements,n=t.elements,s=1/gi.setFromMatrixColumn(t,0).length(),r=1/gi.setFromMatrixColumn(t,1).length(),a=1/gi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),m=Math.sin(r);if(t.order==="XYZ"){let h=a*u,f=a*m,g=o*u,y=o*m;e[0]=l*u,e[4]=-l*m,e[8]=c,e[1]=f+g*c,e[5]=h-y*c,e[9]=-o*l,e[2]=y-h*c,e[6]=g+f*c,e[10]=a*l}else if(t.order==="YXZ"){let h=l*u,f=l*m,g=c*u,y=c*m;e[0]=h+y*o,e[4]=g*o-f,e[8]=a*c,e[1]=a*m,e[5]=a*u,e[9]=-o,e[2]=f*o-g,e[6]=y+h*o,e[10]=a*l}else if(t.order==="ZXY"){let h=l*u,f=l*m,g=c*u,y=c*m;e[0]=h-y*o,e[4]=-a*m,e[8]=g+f*o,e[1]=f+g*o,e[5]=a*u,e[9]=y-h*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let h=a*u,f=a*m,g=o*u,y=o*m;e[0]=l*u,e[4]=g*c-f,e[8]=h*c+y,e[1]=l*m,e[5]=y*c+h,e[9]=f*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let h=a*l,f=a*c,g=o*l,y=o*c;e[0]=l*u,e[4]=y-h*m,e[8]=g*m+f,e[1]=m,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=f*m+g,e[10]=h-y*m}else if(t.order==="XZY"){let h=a*l,f=a*c,g=o*l,y=o*c;e[0]=l*u,e[4]=-m,e[8]=c*u,e[1]=h*m+y,e[5]=a*u,e[9]=f*m-g,e[2]=g*m-f,e[6]=o*u,e[10]=y*m+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Xh,t,qh)}lookAt(t,e,n){let s=this.elements;return ze.subVectors(t,e),ze.lengthSq()===0&&(ze.z=1),ze.normalize(),In.crossVectors(n,ze),In.lengthSq()===0&&(Math.abs(n.z)===1?ze.x+=1e-4:ze.z+=1e-4,ze.normalize(),In.crossVectors(n,ze)),In.normalize(),Os.crossVectors(ze,In),s[0]=In.x,s[4]=Os.x,s[8]=ze.x,s[1]=In.y,s[5]=Os.y,s[9]=ze.y,s[2]=In.z,s[6]=Os.z,s[10]=ze.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],m=n[5],h=n[9],f=n[13],g=n[2],y=n[6],p=n[10],d=n[14],v=n[3],M=n[7],w=n[11],E=n[15],A=s[0],R=s[4],_=s[8],b=s[12],D=s[1],I=s[5],O=s[9],B=s[13],G=s[2],H=s[6],N=s[10],k=s[14],rt=s[3],q=s[7],at=s[11],dt=s[15];return r[0]=a*A+o*D+l*G+c*rt,r[4]=a*R+o*I+l*H+c*q,r[8]=a*_+o*O+l*N+c*at,r[12]=a*b+o*B+l*k+c*dt,r[1]=u*A+m*D+h*G+f*rt,r[5]=u*R+m*I+h*H+f*q,r[9]=u*_+m*O+h*N+f*at,r[13]=u*b+m*B+h*k+f*dt,r[2]=g*A+y*D+p*G+d*rt,r[6]=g*R+y*I+p*H+d*q,r[10]=g*_+y*O+p*N+d*at,r[14]=g*b+y*B+p*k+d*dt,r[3]=v*A+M*D+w*G+E*rt,r[7]=v*R+M*I+w*H+E*q,r[11]=v*_+M*O+w*N+E*at,r[15]=v*b+M*B+w*k+E*dt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],m=t[6],h=t[10],f=t[14],g=t[3],y=t[7],p=t[11],d=t[15],v=l*f-c*h,M=o*f-c*m,w=o*h-l*m,E=a*f-c*u,A=a*h-l*u,R=a*m-o*u;return e*(y*v-p*M+d*w)-n*(g*v-p*E+d*A)+s*(g*M-y*E+d*R)-r*(g*w-y*A+p*R)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],m=t[9],h=t[10],f=t[11],g=t[12],y=t[13],p=t[14],d=t[15],v=e*o-n*a,M=e*l-s*a,w=e*c-r*a,E=n*l-s*o,A=n*c-r*o,R=s*c-r*l,_=u*y-m*g,b=u*p-h*g,D=u*d-f*g,I=m*p-h*y,O=m*d-f*y,B=h*d-f*p,G=v*B-M*O+w*I+E*D-A*b+R*_;if(G===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let H=1/G;return t[0]=(o*B-l*O+c*I)*H,t[1]=(s*O-n*B-r*I)*H,t[2]=(y*R-p*A+d*E)*H,t[3]=(h*A-m*R-f*E)*H,t[4]=(l*D-a*B-c*b)*H,t[5]=(e*B-s*D+r*b)*H,t[6]=(p*w-g*R-d*M)*H,t[7]=(u*R-h*w+f*M)*H,t[8]=(a*O-o*D+c*_)*H,t[9]=(n*D-e*O-r*_)*H,t[10]=(g*A-y*w+d*v)*H,t[11]=(m*w-u*A-f*v)*H,t[12]=(o*b-a*I-l*_)*H,t[13]=(e*I-n*b+s*_)*H,t[14]=(y*M-g*E-p*v)*H,t[15]=(u*E-m*M+h*v)*H,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,u=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+n,u*l-s*a,0,c*l-s*o,u*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,u=a+a,m=o+o,h=r*c,f=r*u,g=r*m,y=a*u,p=a*m,d=o*m,v=l*c,M=l*u,w=l*m,E=n.x,A=n.y,R=n.z;return s[0]=(1-(y+d))*E,s[1]=(f+w)*E,s[2]=(g-M)*E,s[3]=0,s[4]=(f-w)*A,s[5]=(1-(h+d))*A,s[6]=(p+v)*A,s[7]=0,s[8]=(g+M)*R,s[9]=(p-v)*R,s[10]=(1-(h+y))*R,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinant();if(r===0)return n.set(1,1,1),e.identity(),this;let a=gi.set(s[0],s[1],s[2]).length(),o=gi.set(s[4],s[5],s[6]).length(),l=gi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Ze.copy(this);let c=1/a,u=1/o,m=1/l;return Ze.elements[0]*=c,Ze.elements[1]*=c,Ze.elements[2]*=c,Ze.elements[4]*=u,Ze.elements[5]*=u,Ze.elements[6]*=u,Ze.elements[8]*=m,Ze.elements[9]*=m,Ze.elements[10]*=m,e.setFromRotationMatrix(Ze),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=je,l=!1){let c=this.elements,u=2*r/(e-t),m=2*r/(n-s),h=(e+t)/(e-t),f=(n+s)/(n-s),g,y;if(l)g=r/(a-r),y=a*r/(a-r);else if(o===je)g=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===Qi)g=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=m,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=je,l=!1){let c=this.elements,u=2/(e-t),m=2/(n-s),h=-(e+t)/(e-t),f=-(n+s)/(n-s),g,y;if(l)g=1/(a-r),y=a/(a-r);else if(o===je)g=-2/(a-r),y=-(a+r)/(a-r);else if(o===Qi)g=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=m,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},gi=new z,Ze=new re,Xh=new z(0,0,0),qh=new z(1,1,1),In=new z,Os=new z,ze=new z,Vl=new re,Gl=new on,ln=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],u=s[9],m=s[2],h=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(qt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-qt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-m,r),this._z=0);break;case"ZXY":this._x=Math.asin(qt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-m,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-qt(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(h,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(qt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-m,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-qt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:Lt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Vl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Vl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Gl.setFromEuler(this),this.setFromQuaternion(Gl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ln.DEFAULT_ORDER="XYZ";var is=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Yh=0,Hl=new z,xi=new on,gn=new re,Bs=new z,Wi=new z,$h=new z,Zh=new on,Wl=new z(1,0,0),Xl=new z(0,1,0),ql=new z(0,0,1),Yl={type:"added"},Jh={type:"removed"},_i={type:"childadded",child:null},oo={type:"childremoved",child:null},Fe=class i extends wn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Yh++}),this.uuid=Cs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new z,e=new ln,n=new on,s=new z(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new re},normalMatrix:{value:new zt}}),this.matrix=new re,this.matrixWorld=new re,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new is,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return xi.setFromAxisAngle(t,e),this.quaternion.multiply(xi),this}rotateOnWorldAxis(t,e){return xi.setFromAxisAngle(t,e),this.quaternion.premultiply(xi),this}rotateX(t){return this.rotateOnAxis(Wl,t)}rotateY(t){return this.rotateOnAxis(Xl,t)}rotateZ(t){return this.rotateOnAxis(ql,t)}translateOnAxis(t,e){return Hl.copy(t).applyQuaternion(this.quaternion),this.position.add(Hl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Wl,t)}translateY(t){return this.translateOnAxis(Xl,t)}translateZ(t){return this.translateOnAxis(ql,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(gn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Bs.copy(t):Bs.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Wi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?gn.lookAt(Wi,Bs,this.up):gn.lookAt(Bs,Wi,this.up),this.quaternion.setFromRotationMatrix(gn),s&&(gn.extractRotation(s.matrixWorld),xi.setFromRotationMatrix(gn),this.quaternion.premultiply(xi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Dt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Yl),_i.child=t,this.dispatchEvent(_i),_i.child=null):Dt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Jh),oo.child=t,this.dispatchEvent(oo),oo.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),gn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),gn.multiply(t.parent.matrixWorld)),t.applyMatrix4(gn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Yl),_i.child=t,this.dispatchEvent(_i),_i.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wi,t,$h),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wi,Zh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let m=l[c];r(t.shapes,m)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),m=a(t.shapes),h=a(t.skeletons),f=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),m.length>0&&(n.shapes=m),h.length>0&&(n.skeletons=h),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),t.pivot!==null&&(this.pivot=t.pivot.clone()),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Fe.DEFAULT_UP=new z(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Mn=class extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}},Kh={type:"move"},Pi=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Mn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Mn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Mn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let y of t.hand.values()){let p=e.getJointPose(y,n),d=this._getHandJoint(c,y);p!==null&&(d.matrix.fromArray(p.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=p.radius),d.visible=p!==null}let u=c.joints["index-finger-tip"],m=c.joints["thumb-tip"],h=u.position.distanceTo(m.position),f=.02,g=.005;c.inputState.pinching&&h>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Kh)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new Mn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Xc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Pn={h:0,s:0,l:0},zs={h:0,s:0,l:0};function lo(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Yt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Pe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Zt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Zt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Zt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Zt.workingColorSpace){if(t=Vh(t,1),e=qt(e,0,1),n=qt(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=lo(a,r,t+1/3),this.g=lo(a,r,t),this.b=lo(a,r,t-1/3)}return Zt.colorSpaceToWorking(this,s),this}setStyle(t,e=Pe){function n(r){r!==void 0&&parseFloat(r)<1&&Lt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Lt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Lt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Pe){let n=Xc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Lt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Sn(t.r),this.g=Sn(t.g),this.b=Sn(t.b),this}copyLinearToSRGB(t){return this.r=Ci(t.r),this.g=Ci(t.g),this.b=Ci(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Pe){return Zt.workingToColorSpace(Ee.copy(this),t),Math.round(qt(Ee.r*255,0,255))*65536+Math.round(qt(Ee.g*255,0,255))*256+Math.round(qt(Ee.b*255,0,255))}getHexString(t=Pe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Zt.workingColorSpace){Zt.workingToColorSpace(Ee.copy(this),e);let n=Ee.r,s=Ee.g,r=Ee.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,u=(o+a)/2;if(o===a)l=0,c=0;else{let m=a-o;switch(c=u<=.5?m/(a+o):m/(2-a-o),a){case n:l=(s-r)/m+(s<r?6:0);break;case s:l=(r-n)/m+2;break;case r:l=(n-s)/m+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Zt.workingColorSpace){return Zt.workingToColorSpace(Ee.copy(this),e),t.r=Ee.r,t.g=Ee.g,t.b=Ee.b,t}getStyle(t=Pe){Zt.workingToColorSpace(Ee.copy(this),t);let e=Ee.r,n=Ee.g,s=Ee.b;return t!==Pe?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Pn),this.setHSL(Pn.h+t,Pn.s+e,Pn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Pn),t.getHSL(zs);let n=no(Pn.h,zs.h,e),s=no(Pn.s,zs.s,e),r=no(Pn.l,zs.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ee=new Yt;Yt.NAMES=Xc;var ss=class extends Fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ln,this.environmentIntensity=1,this.environmentRotation=new ln,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}},Je=new z,xn=new z,co=new z,_n=new z,yi=new z,vi=new z,$l=new z,ho=new z,uo=new z,fo=new z,po=new he,mo=new he,go=new he,Fn=class i{constructor(t=new z,e=new z,n=new z){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Je.subVectors(t,e),s.cross(Je);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Je.subVectors(s,e),xn.subVectors(n,e),co.subVectors(t,e);let a=Je.dot(Je),o=Je.dot(xn),l=Je.dot(co),c=xn.dot(xn),u=xn.dot(co),m=a*c-o*o;if(m===0)return r.set(0,0,0),null;let h=1/m,f=(c*l-o*u)*h,g=(a*u-o*l)*h;return r.set(1-f-g,g,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,_n)===null?!1:_n.x>=0&&_n.y>=0&&_n.x+_n.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,_n)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,_n.x),l.addScaledVector(a,_n.y),l.addScaledVector(o,_n.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return po.setScalar(0),mo.setScalar(0),go.setScalar(0),po.fromBufferAttribute(t,e),mo.fromBufferAttribute(t,n),go.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(po,r.x),a.addScaledVector(mo,r.y),a.addScaledVector(go,r.z),a}static isFrontFacing(t,e,n,s){return Je.subVectors(n,e),xn.subVectors(t,e),Je.cross(xn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Je.subVectors(this.c,this.b),xn.subVectors(this.a,this.b),Je.cross(xn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;yi.subVectors(s,n),vi.subVectors(r,n),ho.subVectors(t,n);let l=yi.dot(ho),c=vi.dot(ho);if(l<=0&&c<=0)return e.copy(n);uo.subVectors(t,s);let u=yi.dot(uo),m=vi.dot(uo);if(u>=0&&m<=u)return e.copy(s);let h=l*m-u*c;if(h<=0&&l>=0&&u<=0)return a=l/(l-u),e.copy(n).addScaledVector(yi,a);fo.subVectors(t,r);let f=yi.dot(fo),g=vi.dot(fo);if(g>=0&&f<=g)return e.copy(r);let y=f*c-l*g;if(y<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(vi,o);let p=u*g-f*m;if(p<=0&&m-u>=0&&f-g>=0)return $l.subVectors(r,s),o=(m-u)/(m-u+(f-g)),e.copy(s).addScaledVector($l,o);let d=1/(p+y+h);return a=y*d,o=h*d,e.copy(n).addScaledVector(yi,a).addScaledVector(vi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},cn=class{constructor(t=new z(1/0,1/0,1/0),e=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Ke.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Ke.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Ke.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Ke):Ke.fromBufferAttribute(r,a),Ke.applyMatrix4(t.matrixWorld),this.expandByPoint(Ke);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ks.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ks.copy(n.boundingBox)),ks.applyMatrix4(t.matrixWorld),this.union(ks)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ke),Ke.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Xi),Vs.subVectors(this.max,Xi),Mi.subVectors(t.a,Xi),Si.subVectors(t.b,Xi),bi.subVectors(t.c,Xi),Ln.subVectors(Si,Mi),Dn.subVectors(bi,Si),Zn.subVectors(Mi,bi);let e=[0,-Ln.z,Ln.y,0,-Dn.z,Dn.y,0,-Zn.z,Zn.y,Ln.z,0,-Ln.x,Dn.z,0,-Dn.x,Zn.z,0,-Zn.x,-Ln.y,Ln.x,0,-Dn.y,Dn.x,0,-Zn.y,Zn.x,0];return!xo(e,Mi,Si,bi,Vs)||(e=[1,0,0,0,1,0,0,0,1],!xo(e,Mi,Si,bi,Vs))?!1:(Gs.crossVectors(Ln,Dn),e=[Gs.x,Gs.y,Gs.z],xo(e,Mi,Si,bi,Vs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ke).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ke).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(yn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),yn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),yn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),yn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),yn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),yn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),yn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),yn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(yn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},yn=[new z,new z,new z,new z,new z,new z,new z,new z],Ke=new z,ks=new cn,Mi=new z,Si=new z,bi=new z,Ln=new z,Dn=new z,Zn=new z,Xi=new z,Vs=new z,Gs=new z,Jn=new z;function xo(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Jn.fromArray(i,r);let o=s.x*Math.abs(Jn.x)+s.y*Math.abs(Jn.y)+s.z*Math.abs(Jn.z),l=t.dot(Jn),c=e.dot(Jn),u=n.dot(Jn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var fe=new z,Hs=new Qt,jh=0,me=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:jh++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Po,this.updateRanges=[],this.gpuType=qe,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Hs.fromBufferAttribute(this,e),Hs.applyMatrix3(t),this.setXY(e,Hs.x,Hs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix3(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyMatrix4(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.applyNormalMatrix(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)fe.fromBufferAttribute(this,e),fe.transformDirection(t),this.setXYZ(e,fe.x,fe.y,fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Hi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ue(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Hi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Hi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Hi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Hi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ue(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ue(e,this.array),n=Ue(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Ue(e,this.array),n=Ue(n,this.array),s=Ue(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Ue(e,this.array),n=Ue(n,this.array),s=Ue(s,this.array),r=Ue(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Po&&(t.usage=this.usage),t}};var rs=class extends me{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var as=class extends me{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var Se=class extends me{constructor(t,e,n){super(new Float32Array(t),e,n)}},Qh=new cn,qi=new z,_o=new z,hn=class{constructor(t=new z,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Qh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;qi.subVectors(t,this.center);let e=qi.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(qi,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(_o.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(qi.copy(t.center).add(_o)),this.expandByPoint(qi.copy(t.center).sub(_o))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},tu=0,Xe=new re,yo=new Fe,wi=new z,ke=new cn,Yi=new cn,ye=new z,Le=class i extends wn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:tu++}),this.uuid=Cs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(zh(t)?as:rs)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new zt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Xe.makeRotationFromQuaternion(t),this.applyMatrix4(Xe),this}rotateX(t){return Xe.makeRotationX(t),this.applyMatrix4(Xe),this}rotateY(t){return Xe.makeRotationY(t),this.applyMatrix4(Xe),this}rotateZ(t){return Xe.makeRotationZ(t),this.applyMatrix4(Xe),this}translate(t,e,n){return Xe.makeTranslation(t,e,n),this.applyMatrix4(Xe),this}scale(t,e,n){return Xe.makeScale(t,e,n),this.applyMatrix4(Xe),this}lookAt(t){return yo.lookAt(t),yo.updateMatrix(),this.applyMatrix4(yo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(wi).negate(),this.translate(wi.x,wi.y,wi.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Se(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Lt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new cn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Dt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];ke.setFromBufferAttribute(r),this.morphTargetsRelative?(ye.addVectors(this.boundingBox.min,ke.min),this.boundingBox.expandByPoint(ye),ye.addVectors(this.boundingBox.max,ke.max),this.boundingBox.expandByPoint(ye)):(this.boundingBox.expandByPoint(ke.min),this.boundingBox.expandByPoint(ke.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Dt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new hn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Dt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(t){let n=this.boundingSphere.center;if(ke.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Yi.setFromBufferAttribute(o),this.morphTargetsRelative?(ye.addVectors(ke.min,Yi.min),ke.expandByPoint(ye),ye.addVectors(ke.max,Yi.max),ke.expandByPoint(ye)):(ke.expandByPoint(Yi.min),ke.expandByPoint(Yi.max))}ke.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)ye.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(ye));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)ye.fromBufferAttribute(o,c),l&&(wi.fromBufferAttribute(t,c),ye.add(wi)),s=Math.max(s,n.distanceToSquared(ye))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Dt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Dt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new me(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let _=0;_<n.count;_++)o[_]=new z,l[_]=new z;let c=new z,u=new z,m=new z,h=new Qt,f=new Qt,g=new Qt,y=new z,p=new z;function d(_,b,D){c.fromBufferAttribute(n,_),u.fromBufferAttribute(n,b),m.fromBufferAttribute(n,D),h.fromBufferAttribute(r,_),f.fromBufferAttribute(r,b),g.fromBufferAttribute(r,D),u.sub(c),m.sub(c),f.sub(h),g.sub(h);let I=1/(f.x*g.y-g.x*f.y);isFinite(I)&&(y.copy(u).multiplyScalar(g.y).addScaledVector(m,-f.y).multiplyScalar(I),p.copy(m).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(I),o[_].add(y),o[b].add(y),o[D].add(y),l[_].add(p),l[b].add(p),l[D].add(p))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let _=0,b=v.length;_<b;++_){let D=v[_],I=D.start,O=D.count;for(let B=I,G=I+O;B<G;B+=3)d(t.getX(B+0),t.getX(B+1),t.getX(B+2))}let M=new z,w=new z,E=new z,A=new z;function R(_){E.fromBufferAttribute(s,_),A.copy(E);let b=o[_];M.copy(b),M.sub(E.multiplyScalar(E.dot(b))).normalize(),w.crossVectors(A,b);let I=w.dot(l[_])<0?-1:1;a.setXYZW(_,M.x,M.y,M.z,I)}for(let _=0,b=v.length;_<b;++_){let D=v[_],I=D.start,O=D.count;for(let B=I,G=I+O;B<G;B+=3)R(t.getX(B+0)),R(t.getX(B+1)),R(t.getX(B+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new me(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,f=n.count;h<f;h++)n.setXYZ(h,0,0,0);let s=new z,r=new z,a=new z,o=new z,l=new z,c=new z,u=new z,m=new z;if(t)for(let h=0,f=t.count;h<f;h+=3){let g=t.getX(h+0),y=t.getX(h+1),p=t.getX(h+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,p),u.subVectors(a,r),m.subVectors(s,r),u.cross(m),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,y),c.fromBufferAttribute(n,p),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(y,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let h=0,f=e.count;h<f;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,r),m.subVectors(s,r),u.cross(m),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)ye.fromBufferAttribute(t,e),ye.normalize(),t.setXYZ(e,ye.x,ye.y,ye.z)}toNonIndexed(){function t(o,l){let c=o.array,u=o.itemSize,m=o.normalized,h=new c.constructor(l.length*u),f=0,g=0;for(let y=0,p=l.length;y<p;y++){o.isInterleavedBufferAttribute?f=l[y]*o.data.stride+o.offset:f=l[y]*u;for(let d=0;d<u;d++)h[g++]=c[f++]}return new me(h,u,m)}if(this.index===null)return Lt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let u=0,m=c.length;u<m;u++){let h=c[u],f=t(h,n);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let m=0,h=c.length;m<h;m++){let f=c[m];u.push(f.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(e))}let r=t.morphAttributes;for(let c in r){let u=[],m=r[c];for(let h=0,f=m.length;h<f;h++)u.push(m[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,u=a.length;c<u;c++){let m=a[c];this.addGroup(m.start,m.count,m.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}};var eu=0,An=class extends wn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:eu++}),this.uuid=Cs(),this.name="",this.type="Material",this.blending=ti,this.side=bn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=cr,this.blendDst=hr,this.blendEquation=On,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Yt(0,0,0),this.blendAlpha=0,this.depthFunc=ei,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Io,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Qn,this.stencilZFail=Qn,this.stencilZPass=Qn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Lt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Lt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ti&&(n.blending=this.blending),this.side!==bn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==cr&&(n.blendSrc=this.blendSrc),this.blendDst!==hr&&(n.blendDst=this.blendDst),this.blendEquation!==On&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ei&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Io&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Qn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Qn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Qn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var vn=new z,vo=new z,Ws=new z,Un=new z,Mo=new z,Xs=new z,So=new z,Li=class{constructor(t=new z,e=new z(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,vn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=vn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(vn.copy(this.origin).addScaledVector(this.direction,e),vn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){vo.copy(t).add(e).multiplyScalar(.5),Ws.copy(e).sub(t).normalize(),Un.copy(this.origin).sub(vo);let r=t.distanceTo(e)*.5,a=-this.direction.dot(Ws),o=Un.dot(this.direction),l=-Un.dot(Ws),c=Un.lengthSq(),u=Math.abs(1-a*a),m,h,f,g;if(u>0)if(m=a*l-o,h=a*o-l,g=r*u,m>=0)if(h>=-g)if(h<=g){let y=1/u;m*=y,h*=y,f=m*(m+a*h+2*o)+h*(a*m+h+2*l)+c}else h=r,m=Math.max(0,-(a*h+o)),f=-m*m+h*(h+2*l)+c;else h=-r,m=Math.max(0,-(a*h+o)),f=-m*m+h*(h+2*l)+c;else h<=-g?(m=Math.max(0,-(-a*r+o)),h=m>0?-r:Math.min(Math.max(-r,-l),r),f=-m*m+h*(h+2*l)+c):h<=g?(m=0,h=Math.min(Math.max(-r,-l),r),f=h*(h+2*l)+c):(m=Math.max(0,-(a*r+o)),h=m>0?r:Math.min(Math.max(-r,-l),r),f=-m*m+h*(h+2*l)+c);else h=a>0?-r:r,m=Math.max(0,-(a*h+o)),f=-m*m+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,m),s&&s.copy(vo).addScaledVector(Ws,h),f}intersectSphere(t,e){vn.subVectors(t.center,this.origin);let n=vn.dot(this.direction),s=vn.dot(vn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,u=1/this.direction.y,m=1/this.direction.z,h=this.origin;return c>=0?(n=(t.min.x-h.x)*c,s=(t.max.x-h.x)*c):(n=(t.max.x-h.x)*c,s=(t.min.x-h.x)*c),u>=0?(r=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),m>=0?(o=(t.min.z-h.z)*m,l=(t.max.z-h.z)*m):(o=(t.max.z-h.z)*m,l=(t.min.z-h.z)*m),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,vn)!==null}intersectTriangle(t,e,n,s,r){Mo.subVectors(e,t),Xs.subVectors(n,t),So.crossVectors(Mo,Xs);let a=this.direction.dot(So),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Un.subVectors(this.origin,t);let l=o*this.direction.dot(Xs.crossVectors(Un,Xs));if(l<0)return null;let c=o*this.direction.dot(Mo.cross(Un));if(c<0||l+c>a)return null;let u=-o*Un.dot(So);return u<0?null:this.at(u/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Bn=class extends An{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Yt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.combine=Bo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Zl=new re,Kn=new Li,qs=new hn,Jl=new z,Ys=new z,$s=new z,Zs=new z,bo=new z,Js=new z,Kl=new z,Ks=new z,we=class extends Fe{constructor(t=new Le,e=new Bn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Js.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=o[l],m=r[l];u!==0&&(bo.fromBufferAttribute(m,t),a?Js.addScaledVector(bo,u):Js.addScaledVector(bo.sub(e),u))}e.add(Js)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),qs.copy(n.boundingSphere),qs.applyMatrix4(r),Kn.copy(t.ray).recast(t.near),!(qs.containsPoint(Kn.origin)===!1&&(Kn.intersectSphere(qs,Jl)===null||Kn.origin.distanceToSquared(Jl)>(t.far-t.near)**2))&&(Zl.copy(r).invert(),Kn.copy(t.ray).applyMatrix4(Zl),!(n.boundingBox!==null&&Kn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Kn)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,m=r.attributes.normal,h=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,y=h.length;g<y;g++){let p=h[g],d=a[p.materialIndex],v=Math.max(p.start,f.start),M=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let w=v,E=M;w<E;w+=3){let A=o.getX(w),R=o.getX(w+1),_=o.getX(w+2);s=js(this,d,t,n,c,u,m,A,R,_),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,f.start),y=Math.min(o.count,f.start+f.count);for(let p=g,d=y;p<d;p+=3){let v=o.getX(p),M=o.getX(p+1),w=o.getX(p+2);s=js(this,a,t,n,c,u,m,v,M,w),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,y=h.length;g<y;g++){let p=h[g],d=a[p.materialIndex],v=Math.max(p.start,f.start),M=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let w=v,E=M;w<E;w+=3){let A=w,R=w+1,_=w+2;s=js(this,d,t,n,c,u,m,A,R,_),s&&(s.faceIndex=Math.floor(w/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,f.start),y=Math.min(l.count,f.start+f.count);for(let p=g,d=y;p<d;p+=3){let v=p,M=p+1,w=p+2;s=js(this,a,t,n,c,u,m,v,M,w),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}};function nu(i,t,e,n,s,r,a,o){let l;if(t.side===De?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===bn,o),l===null)return null;Ks.copy(o),Ks.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Ks);return c<e.near||c>e.far?null:{distance:c,point:Ks.clone(),object:i}}function js(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Ys),i.getVertexPosition(l,$s),i.getVertexPosition(c,Zs);let u=nu(i,t,e,n,Ys,$s,Zs,Kl);if(u){let m=new z;Fn.getBarycoord(Kl,Ys,$s,Zs,m),s&&(u.uv=Fn.getInterpolatedAttribute(s,o,l,c,m,new Qt)),r&&(u.uv1=Fn.getInterpolatedAttribute(r,o,l,c,m,new Qt)),a&&(u.normal=Fn.getInterpolatedAttribute(a,o,l,c,m,new z),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new z,materialIndex:0};Fn.getNormal(Ys,$s,Zs,h.normal),u.face=h,u.barycoord=m}return u}var os=class extends Ne{constructor(t=null,e=1,n=1,s,r,a,o,l,c=ve,u=ve,m,h){super(null,a,o,l,c,u,s,r,m,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ls=class extends me{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Ai=new re,jl=new re,Qs=[],Ql=new cn,iu=new re,$i=new we,Zi=new hn,cs=class extends we{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new ls(new Float32Array(n*16),16),this.previousInstanceMatrix=null,this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,iu)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new cn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ai),Ql.copy(t.boundingBox).applyMatrix4(Ai),this.boundingBox.union(Ql)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new hn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ai),Zi.copy(t.boundingSphere).applyMatrix4(Ai),this.boundingSphere.union(Zi)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.previousInstanceMatrix!==null&&(this.previousInstanceMatrix=t.previousInstanceMatrix.clone()),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){let n=this.matrixWorld,s=this.count;if($i.geometry=this.geometry,$i.material=this.material,$i.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Zi.copy(this.boundingSphere),Zi.applyMatrix4(n),t.ray.intersectsSphere(Zi)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ai),jl.multiplyMatrices(n,Ai),$i.matrixWorld=jl,$i.raycast(t,Qs);for(let a=0,o=Qs.length;a<o;a++){let l=Qs[a];l.instanceId=r,l.object=this,e.push(l)}Qs.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new ls(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new os(new Float32Array(s*this.count),s,this.count,jr,qe));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},wo=new z,su=new z,ru=new zt,sn=class{constructor(t=new z(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=wo.subVectors(n,e).cross(su.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(wo),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||ru.getNormalMatrix(t),s=this.coplanarPoint(wo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},jn=new hn,au=new Qt(.5,.5),tr=new z,hs=class{constructor(t=new sn,e=new sn,n=new sn,s=new sn,r=new sn,a=new sn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=je,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],u=r[4],m=r[5],h=r[6],f=r[7],g=r[8],y=r[9],p=r[10],d=r[11],v=r[12],M=r[13],w=r[14],E=r[15];if(s[0].setComponents(c-a,f-u,d-g,E-v).normalize(),s[1].setComponents(c+a,f+u,d+g,E+v).normalize(),s[2].setComponents(c+o,f+m,d+y,E+M).normalize(),s[3].setComponents(c-o,f-m,d-y,E-M).normalize(),n)s[4].setComponents(l,h,p,w).normalize(),s[5].setComponents(c-l,f-h,d-p,E-w).normalize();else if(s[4].setComponents(c-l,f-h,d-p,E-w).normalize(),e===je)s[5].setComponents(c+l,f+h,d+p,E+w).normalize();else if(e===Qi)s[5].setComponents(l,h,p,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),jn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),jn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(jn)}intersectsSprite(t){jn.center.set(0,0,0);let e=au.distanceTo(t.center);return jn.radius=.7071067811865476+e,jn.applyMatrix4(t.matrixWorld),this.intersectsSphere(jn)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(tr.x=s.normal.x>0?t.max.x:t.min.x,tr.y=s.normal.y>0?t.max.y:t.min.y,tr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(tr)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Di=class extends An{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Yt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},Ar=new z,Tr=new z,tc=new re,Ji=new Li,er=new hn,Ao=new z,ec=new z,Er=class extends Fe{constructor(t=new Le,e=new Di){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Ar.fromBufferAttribute(e,s-1),Tr.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Ar.distanceTo(Tr);t.setAttribute("lineDistance",new Se(n,1))}else Lt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),er.copy(n.boundingSphere),er.applyMatrix4(s),er.radius+=r,t.ray.intersectsSphere(er)===!1)return;tc.copy(s).invert(),Ji.copy(t.ray).applyMatrix4(tc);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,u=n.index,h=n.attributes.position;if(u!==null){let f=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let y=f,p=g-1;y<p;y+=c){let d=u.getX(y),v=u.getX(y+1),M=nr(this,t,Ji,l,d,v,y);M&&e.push(M)}if(this.isLineLoop){let y=u.getX(g-1),p=u.getX(f),d=nr(this,t,Ji,l,y,p,g-1);d&&e.push(d)}}else{let f=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let y=f,p=g-1;y<p;y+=c){let d=nr(this,t,Ji,l,y,y+1,y);d&&e.push(d)}if(this.isLineLoop){let y=nr(this,t,Ji,l,g-1,f,g-1);y&&e.push(y)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function nr(i,t,e,n,s,r,a){let o=i.geometry.attributes.position;if(Ar.fromBufferAttribute(o,s),Tr.fromBufferAttribute(o,r),e.distanceSqToSegment(Ar,Tr,Ao,ec)>n)return;Ao.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Ao);if(!(c<t.near||c>t.far))return{distance:c,point:ec.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}var nc=new z,ic=new z,us=class extends Er{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)nc.fromBufferAttribute(e,s),ic.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+nc.distanceTo(ic);t.setAttribute("lineDistance",new Se(n,1))}else Lt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Cr=class extends An{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Yt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},sc=new re,Lo=new Li,ir=new hn,sr=new z,ds=class extends Fe{constructor(t=new Le,e=new Cr){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ir.copy(n.boundingSphere),ir.applyMatrix4(s),ir.radius+=r,t.ray.intersectsSphere(ir)===!1)return;sc.copy(s).invert(),Lo.copy(t.ray).applyMatrix4(sc);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,m=n.attributes.position;if(c!==null){let h=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let g=h,y=f;g<y;g++){let p=c.getX(g);sr.fromBufferAttribute(m,p),rc(sr,p,l,s,t,e,this)}}else{let h=Math.max(0,a.start),f=Math.min(m.count,a.start+a.count);for(let g=h,y=f;g<y;g++)sr.fromBufferAttribute(m,g),rc(sr,g,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function rc(i,t,e,n,s,r,a){let o=Lo.distanceSqToPoint(i);if(o<e){let l=new z;Lo.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}var fs=class extends Ne{constructor(t=[],e=Hn,n,s,r,a,o,l,c,u){super(t,e,n,s,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}};var zn=class extends Ne{constructor(t,e,n=tn,s,r,a,o=ve,l=ve,c,u=an,m=1){if(u!==an&&u!==Xn)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:t,height:e,depth:m};super(h,s,r,a,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ii(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Rr=class extends zn{constructor(t,e=tn,n=Hn,s,r,a=ve,o=ve,l,c=an){let u={width:t,height:t,depth:1},m=[u,u,u,u,u,u];super(t,t,e,n,s,r,a,o,l,c),this.image=m,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},ps=class extends Ne{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Ui=class i extends Le{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],u=[],m=[],h=0,f=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,s,a,2),g("x","z","y",1,-1,t,n,-e,s,a,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Se(c,3)),this.setAttribute("normal",new Se(u,3)),this.setAttribute("uv",new Se(m,2));function g(y,p,d,v,M,w,E,A,R,_,b){let D=w/R,I=E/_,O=w/2,B=E/2,G=A/2,H=R+1,N=_+1,k=0,rt=0,q=new z;for(let at=0;at<N;at++){let dt=at*I-B;for(let nt=0;nt<H;nt++){let vt=nt*D-O;q[y]=vt*v,q[p]=dt*M,q[d]=G,c.push(q.x,q.y,q.z),q[y]=0,q[p]=0,q[d]=A>0?1:-1,u.push(q.x,q.y,q.z),m.push(nt/R),m.push(1-at/_),k+=1}}for(let at=0;at<_;at++)for(let dt=0;dt<R;dt++){let nt=h+dt+H*at,vt=h+dt+H*(at+1),Ut=h+(dt+1)+H*(at+1),kt=h+(dt+1)+H*at;l.push(nt,vt,kt),l.push(vt,Ut,kt),rt+=6}o.addGroup(f,rt,b),f+=rt,h+=k}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Ir=class i extends Le{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],a=[];o(s),c(n),u(),this.setAttribute("position",new Se(r,3)),this.setAttribute("normal",new Se(r.slice(),3)),this.setAttribute("uv",new Se(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(v){let M=new z,w=new z,E=new z;for(let A=0;A<e.length;A+=3)f(e[A+0],M),f(e[A+1],w),f(e[A+2],E),l(M,w,E,v)}function l(v,M,w,E){let A=E+1,R=[];for(let _=0;_<=A;_++){R[_]=[];let b=v.clone().lerp(w,_/A),D=M.clone().lerp(w,_/A),I=A-_;for(let O=0;O<=I;O++)O===0&&_===A?R[_][O]=b:R[_][O]=b.clone().lerp(D,O/I)}for(let _=0;_<A;_++)for(let b=0;b<2*(A-_)-1;b++){let D=Math.floor(b/2);b%2===0?(h(R[_][D+1]),h(R[_+1][D]),h(R[_][D])):(h(R[_][D+1]),h(R[_+1][D+1]),h(R[_+1][D]))}}function c(v){let M=new z;for(let w=0;w<r.length;w+=3)M.x=r[w+0],M.y=r[w+1],M.z=r[w+2],M.normalize().multiplyScalar(v),r[w+0]=M.x,r[w+1]=M.y,r[w+2]=M.z}function u(){let v=new z;for(let M=0;M<r.length;M+=3){v.x=r[M+0],v.y=r[M+1],v.z=r[M+2];let w=p(v)/2/Math.PI+.5,E=d(v)/Math.PI+.5;a.push(w,1-E)}g(),m()}function m(){for(let v=0;v<a.length;v+=6){let M=a[v+0],w=a[v+2],E=a[v+4],A=Math.max(M,w,E),R=Math.min(M,w,E);A>.9&&R<.1&&(M<.2&&(a[v+0]+=1),w<.2&&(a[v+2]+=1),E<.2&&(a[v+4]+=1))}}function h(v){r.push(v.x,v.y,v.z)}function f(v,M){let w=v*3;M.x=t[w+0],M.y=t[w+1],M.z=t[w+2]}function g(){let v=new z,M=new z,w=new z,E=new z,A=new Qt,R=new Qt,_=new Qt;for(let b=0,D=0;b<r.length;b+=9,D+=6){v.set(r[b+0],r[b+1],r[b+2]),M.set(r[b+3],r[b+4],r[b+5]),w.set(r[b+6],r[b+7],r[b+8]),A.set(a[D+0],a[D+1]),R.set(a[D+2],a[D+3]),_.set(a[D+4],a[D+5]),E.copy(v).add(M).add(w).divideScalar(3);let I=p(E);y(A,D+0,v,I),y(R,D+2,M,I),y(_,D+4,w,I)}}function y(v,M,w,E){E<0&&v.x===1&&(a[M]=v.x-1),w.x===0&&w.z===0&&(a[M]=E/2/Math.PI+.5)}function p(v){return Math.atan2(v.z,-v.x)}function d(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.detail)}};var ms=class i extends Ir{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var gs=class i extends Le{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,u=l+1,m=t/o,h=e/l,f=[],g=[],y=[],p=[];for(let d=0;d<u;d++){let v=d*h-a;for(let M=0;M<c;M++){let w=M*m-r;g.push(w,-v,0),y.push(0,0,1),p.push(M/o),p.push(1-d/l)}}for(let d=0;d<l;d++)for(let v=0;v<o;v++){let M=v+c*d,w=v+c*(d+1),E=v+1+c*(d+1),A=v+1+c*d;f.push(M,w,A),f.push(w,E,A)}this.setIndex(f),this.setAttribute("position",new Se(g,3)),this.setAttribute("normal",new Se(y,3)),this.setAttribute("uv",new Se(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};function ri(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(Lt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Ie(i){let t={};for(let e=0;e<i.length;e++){let n=ri(i[e]);for(let s in n)t[s]=n[s]}return t}function ou(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function el(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Zt.workingColorSpace}var qc={clone:ri,merge:Ie},lu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,cu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Re=class extends An{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=lu,this.fragmentShader=cu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ri(t.uniforms),this.uniformsGroups=ou(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},Pr=class extends Re{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Lr=class extends An{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Lc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Dr=class extends An{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function rr(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}var kn=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ur=class extends kn{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Eo,endingEnd:Eo}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Co:r=t,o=2*e-n;break;case Ro:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Co:a=t,l=2*n-e;break;case Ro:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,u=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=this._offsetPrev,m=this._offsetNext,h=this._weightPrev,f=this._weightNext,g=(n-e)/(s-e),y=g*g,p=y*g,d=-h*p+2*h*y-h*g,v=(1+h)*p+(-1.5-2*h)*y+(-.5+h)*g+1,M=(-1-f)*p+(1.5+f)*y+.5*g,w=f*p-f*y;for(let E=0;E!==o;++E)r[E]=d*a[u+E]+v*a[c+E]+M*a[l+E]+w*a[m+E];return r}},Nr=class extends kn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=(n-e)/(s-e),m=1-u;for(let h=0;h!==o;++h)r[h]=a[c+h]*m+a[l+h]*u;return r}},Fr=class extends kn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Or=class extends kn{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=this.settings||this.DefaultSettings_,m=u.inTangents,h=u.outTangents;if(!m||!h){let y=(n-e)/(s-e),p=1-y;for(let d=0;d!==o;++d)r[d]=a[c+d]*p+a[l+d]*y;return r}let f=o*2,g=t-1;for(let y=0;y!==o;++y){let p=a[c+y],d=a[l+y],v=g*f+y*2,M=h[v],w=h[v+1],E=t*f+y*2,A=m[E],R=m[E+1],_=(n-e)/(s-e),b,D,I,O,B;for(let G=0;G<8;G++){b=_*_,D=b*_,I=1-_,O=I*I,B=O*I;let N=B*e+3*O*_*M+3*I*b*A+D*s-n;if(Math.abs(N)<1e-10)break;let k=3*O*(M-e)+6*I*_*(A-M)+3*b*(s-A);if(Math.abs(k)<1e-10)break;_=_-N/k,_=Math.max(0,Math.min(1,_))}r[y]=B*p+3*O*_*w+3*I*b*R+D*d}return r}},Ge=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=rr(e,this.TimeBufferType),this.values=rr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:rr(t.times,Array),values:rr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Fr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Nr(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ur(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Or(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.settings=this.settings),e}setInterpolation(t){let e;switch(t){case Ki:e=this.InterpolantFactoryMethodDiscrete;break;case vr:e=this.InterpolantFactoryMethodLinear;break;case lr:e=this.InterpolantFactoryMethodSmooth;break;case To:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Lt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ki;case this.InterpolantFactoryMethodLinear:return vr;case this.InterpolantFactoryMethodSmooth:return lr;case this.InterpolantFactoryMethodBezier:return To}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Dt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Dt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Dt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Dt("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&kh(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Dt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===lr,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],u=t[o+1];if(c!==u&&(o!==1||c!==t[0]))if(s)l=!0;else{let m=o*n,h=m-n,f=m+n;for(let g=0;g!==n;++g){let y=e[m+g];if(y!==e[h+g]||y!==e[f+g]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let m=o*n,h=a*n;for(let f=0;f!==n;++f)e[h+f]=e[m+f]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};Ge.prototype.ValueTypeName="";Ge.prototype.TimeBufferType=Float32Array;Ge.prototype.ValueBufferType=Float32Array;Ge.prototype.DefaultInterpolation=vr;var Vn=class extends Ge{constructor(t,e,n){super(t,e,n)}};Vn.prototype.ValueTypeName="bool";Vn.prototype.ValueBufferType=Array;Vn.prototype.DefaultInterpolation=Ki;Vn.prototype.InterpolantFactoryMethodLinear=void 0;Vn.prototype.InterpolantFactoryMethodSmooth=void 0;var Br=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}};Br.prototype.ValueTypeName="color";var zr=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}};zr.prototype.ValueTypeName="number";var kr=class extends kn{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let u=c+o;c!==u;c+=4)on.slerpFlat(r,0,a,c-o,a,c,l);return r}},xs=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new kr(this.times,this.values,this.getValueSize(),t)}};xs.prototype.ValueTypeName="quaternion";xs.prototype.InterpolantFactoryMethodSmooth=void 0;var Gn=class extends Ge{constructor(t,e,n){super(t,e,n)}};Gn.prototype.ValueTypeName="string";Gn.prototype.ValueBufferType=Array;Gn.prototype.DefaultInterpolation=Ki;Gn.prototype.InterpolantFactoryMethodLinear=void 0;Gn.prototype.InterpolantFactoryMethodSmooth=void 0;var Vr=class extends Ge{constructor(t,e,n,s){super(t,e,n,s)}};Vr.prototype.ValueTypeName="vector";var Gr=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,m){return c.push(u,m),this},this.removeHandler=function(u){let m=c.indexOf(u);return m!==-1&&c.splice(m,2),this},this.getHandler=function(u){for(let m=0,h=c.length;m<h;m+=2){let f=c[m],g=c[m+1];if(f.global&&(f.lastIndex=0),f.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Yc=new Gr,Hr=class{constructor(t){this.manager=t!==void 0?t:Yc,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Hr.DEFAULT_MATERIAL_NAME="__DEFAULT";var ar=new z,or=new on,nn=new z,_s=class extends Fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new re,this.projectionMatrix=new re,this.projectionMatrixInverse=new re,this.coordinateSystem=je,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(ar,or,nn),nn.x===1&&nn.y===1&&nn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ar,or,nn.set(1,1,1)).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorld.decompose(ar,or,nn),nn.x===1&&nn.y===1&&nn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ar,or,nn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Nn=new z,ac=new Qt,oc=new Qt,Ce=class extends _s{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Mr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(eo*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Mr*2*Math.atan(Math.tan(eo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Nn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Nn.x,Nn.y).multiplyScalar(-t/Nn.z),Nn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Nn.x,Nn.y).multiplyScalar(-t/Nn.z)}getViewSize(t,e){return this.getViewBounds(t,ac,oc),e.subVectors(oc,ac)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(eo*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var ys=class extends _s{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}};var Ti=-90,Ei=1,Wr=class extends Fe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ce(Ti,Ei,t,e);s.layers=this.layers,this.add(s);let r=new Ce(Ti,Ei,t,e);r.layers=this.layers,this.add(r);let a=new Ce(Ti,Ei,t,e);a.layers=this.layers,this.add(a);let o=new Ce(Ti,Ei,t,e);o.layers=this.layers,this.add(o);let l=new Ce(Ti,Ei,t,e);l.layers=this.layers,this.add(l);let c=new Ce(Ti,Ei,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===je)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Qi)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,u]=this.children,m=t.getRenderTarget(),h=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let p=!1;t.isWebGLRenderer===!0?p=t.state.buffers.depth.getReversed():p=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(m,h,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Xr=class extends Ce{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var nl="\\[\\]\\.:\\/",hu=new RegExp("["+nl+"]","g"),il="[^"+nl+"]",uu="[^"+nl.replace("\\.","")+"]",du=/((?:WC+[\/:])*)/.source.replace("WC",il),fu=/(WCOD+)?/.source.replace("WCOD",uu),pu=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",il),mu=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",il),gu=new RegExp("^"+du+fu+pu+mu+"$"),xu=["material","materials","bones","map"],Do=class{constructor(t,e,n){let s=n||ae.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},ae=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(hu,"")}static parseTrackName(t){let e=gu.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);xu.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Lt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Dt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Dt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Dt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===c){c=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Dt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Dt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Dt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Dt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;Dt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Dt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Dt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ae.Composite=Do;ae.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ae.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ae.prototype.GetterByBindingType=[ae.prototype._getValue_direct,ae.prototype._getValue_array,ae.prototype._getValue_arrayElement,ae.prototype._getValue_toArray];ae.prototype.SetterByBindingTypeAndVersioning=[[ae.prototype._setValue_direct,ae.prototype._setValue_direct_setNeedsUpdate,ae.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ae.prototype._setValue_array,ae.prototype._setValue_array_setNeedsUpdate,ae.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ae.prototype._setValue_arrayElement,ae.prototype._setValue_arrayElement_setNeedsUpdate,ae.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ae.prototype._setValue_fromArray,ae.prototype._setValue_fromArray_setNeedsUpdate,ae.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var gg=new Float32Array(1);function sl(i,t,e,n){let s=_u(n);switch(e){case Ko:return i*t;case jr:return i*t/s.components*s.byteLength;case Qr:return i*t/s.components*s.byteLength;case si:return i*t*2/s.components*s.byteLength;case ta:return i*t*2/s.components*s.byteLength;case jo:return i*t*3/s.components*s.byteLength;case Ye:return i*t*4/s.components*s.byteLength;case ea:return i*t*4/s.components*s.byteLength;case bs:case ws:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case As:case Ts:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ia:case ra:return Math.max(i,16)*Math.max(t,8)/4;case na:case sa:return Math.max(i,8)*Math.max(t,8)/2;case aa:case oa:case ca:case ha:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case la:case ua:case da:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case fa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case pa:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ma:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ga:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case xa:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case _a:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case ya:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case va:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Ma:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Sa:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ba:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case wa:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Aa:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Ta:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Ea:case Ca:case Ra:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Ia:case Pa:return Math.ceil(i/4)*Math.ceil(t/4)*8;case La:case Da:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function _u(i){switch(i){case We:case Yo:return{byteLength:1,components:1};case Fi:case $o:case dn:return{byteLength:2,components:1};case Jr:case Kr:return{byteLength:2,components:4};case tn:case Zr:case qe:return{byteLength:4,components:1};case Zo:case Jo:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"183"}}));typeof window<"u"&&(window.__THREE__?Lt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="183");function gh(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function vu(i){let t=new WeakMap;function e(o,l){let c=o.array,u=o.usage,m=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:m}}function n(o,l,c){let u=l.array,m=l.updateRanges;if(i.bindBuffer(c,o),m.length===0)i.bufferSubData(c,0,u);else{m.sort((f,g)=>f.start-g.start);let h=0;for(let f=1;f<m.length;f++){let g=m[h],y=m[f];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++h,m[h]=y)}m.length=h+1;for(let f=0,g=m.length;f<g;f++){let y=m[f];i.bufferSubData(c,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Mu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Su=`#ifdef USE_ALPHAHASH
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
#endif`,bu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,wu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Au=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Tu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Eu=`#ifdef USE_AOMAP
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
#endif`,Cu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ru=`#ifdef USE_BATCHING
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
#endif`,Iu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Pu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Lu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Du=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Uu=`#ifdef USE_IRIDESCENCE
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
#endif`,Nu=`#ifdef USE_BUMPMAP
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
#endif`,Fu=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Ou=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Bu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,zu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ku=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Vu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Gu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Hu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Wu=`#define PI 3.141592653589793
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
} // validated`,Xu=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,qu=`vec3 transformedNormal = objectNormal;
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
#endif`,Yu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,$u=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Zu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ju=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ku="gl_FragColor = linearToOutputTexel( gl_FragColor );",ju=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Qu=`#ifdef USE_ENVMAP
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
#endif`,td=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,ed=`#ifdef USE_ENVMAP
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
#endif`,nd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,id=`#ifdef USE_ENVMAP
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
#endif`,sd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,rd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ad=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,od=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ld=`#ifdef USE_GRADIENTMAP
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
}`,cd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,hd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ud=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,dd=`uniform bool receiveShadow;
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
#endif`,fd=`#ifdef USE_ENVMAP
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
#endif`,pd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,md=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,gd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,xd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,_d=`PhysicalMaterial material;
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
#endif`,yd=`uniform sampler2D dfgLUT;
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
}`,vd=`
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
#endif`,Md=`#if defined( RE_IndirectDiffuse )
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
#endif`,Sd=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,bd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,wd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ad=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Td=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ed=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Cd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Rd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Id=`#if defined( USE_POINTS_UV )
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
#endif`,Pd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ld=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Dd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Ud=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Nd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Fd=`#ifdef USE_MORPHTARGETS
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
#endif`,Od=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Bd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,zd=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,kd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Hd=`#ifdef USE_NORMALMAP
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
#endif`,Wd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Xd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,qd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Yd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,$d=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Zd=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Jd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Kd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,jd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Qd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,tf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ef=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,nf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,sf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,rf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,af=`float getShadowMask() {
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
}`,of=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,lf=`#ifdef USE_SKINNING
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
#endif`,cf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,hf=`#ifdef USE_SKINNING
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
#endif`,uf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,df=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ff=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,pf=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,mf=`#ifdef USE_TRANSMISSION
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
#endif`,gf=`#ifdef USE_TRANSMISSION
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
#endif`,xf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,_f=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,yf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,vf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Mf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Sf=`uniform sampler2D t2D;
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
}`,bf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,wf=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Af=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Tf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ef=`#include <common>
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
}`,Cf=`#if DEPTH_PACKING == 3200
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
}`,Rf=`#define DISTANCE
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
}`,If=`#define DISTANCE
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
}`,Pf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Lf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Df=`uniform float scale;
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
}`,Uf=`uniform vec3 diffuse;
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
}`,Nf=`#include <common>
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
}`,Ff=`uniform vec3 diffuse;
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
}`,Of=`#define LAMBERT
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
}`,Bf=`#define LAMBERT
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
}`,zf=`#define MATCAP
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
}`,kf=`#define MATCAP
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
}`,Vf=`#define NORMAL
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
}`,Gf=`#define NORMAL
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
}`,Hf=`#define PHONG
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
}`,Wf=`#define PHONG
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
}`,Xf=`#define STANDARD
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
}`,qf=`#define STANDARD
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
}`,Yf=`#define TOON
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
}`,$f=`#define TOON
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
}`,Zf=`uniform float size;
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
}`,Jf=`uniform vec3 diffuse;
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
}`,Kf=`#include <common>
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
}`,jf=`uniform vec3 color;
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
}`,Qf=`uniform float rotation;
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
}`,tp=`uniform vec3 diffuse;
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
}`,Vt={alphahash_fragment:Mu,alphahash_pars_fragment:Su,alphamap_fragment:bu,alphamap_pars_fragment:wu,alphatest_fragment:Au,alphatest_pars_fragment:Tu,aomap_fragment:Eu,aomap_pars_fragment:Cu,batching_pars_vertex:Ru,batching_vertex:Iu,begin_vertex:Pu,beginnormal_vertex:Lu,bsdfs:Du,iridescence_fragment:Uu,bumpmap_pars_fragment:Nu,clipping_planes_fragment:Fu,clipping_planes_pars_fragment:Ou,clipping_planes_pars_vertex:Bu,clipping_planes_vertex:zu,color_fragment:ku,color_pars_fragment:Vu,color_pars_vertex:Gu,color_vertex:Hu,common:Wu,cube_uv_reflection_fragment:Xu,defaultnormal_vertex:qu,displacementmap_pars_vertex:Yu,displacementmap_vertex:$u,emissivemap_fragment:Zu,emissivemap_pars_fragment:Ju,colorspace_fragment:Ku,colorspace_pars_fragment:ju,envmap_fragment:Qu,envmap_common_pars_fragment:td,envmap_pars_fragment:ed,envmap_pars_vertex:nd,envmap_physical_pars_fragment:fd,envmap_vertex:id,fog_vertex:sd,fog_pars_vertex:rd,fog_fragment:ad,fog_pars_fragment:od,gradientmap_pars_fragment:ld,lightmap_pars_fragment:cd,lights_lambert_fragment:hd,lights_lambert_pars_fragment:ud,lights_pars_begin:dd,lights_toon_fragment:pd,lights_toon_pars_fragment:md,lights_phong_fragment:gd,lights_phong_pars_fragment:xd,lights_physical_fragment:_d,lights_physical_pars_fragment:yd,lights_fragment_begin:vd,lights_fragment_maps:Md,lights_fragment_end:Sd,logdepthbuf_fragment:bd,logdepthbuf_pars_fragment:wd,logdepthbuf_pars_vertex:Ad,logdepthbuf_vertex:Td,map_fragment:Ed,map_pars_fragment:Cd,map_particle_fragment:Rd,map_particle_pars_fragment:Id,metalnessmap_fragment:Pd,metalnessmap_pars_fragment:Ld,morphinstance_vertex:Dd,morphcolor_vertex:Ud,morphnormal_vertex:Nd,morphtarget_pars_vertex:Fd,morphtarget_vertex:Od,normal_fragment_begin:Bd,normal_fragment_maps:zd,normal_pars_fragment:kd,normal_pars_vertex:Vd,normal_vertex:Gd,normalmap_pars_fragment:Hd,clearcoat_normal_fragment_begin:Wd,clearcoat_normal_fragment_maps:Xd,clearcoat_pars_fragment:qd,iridescence_pars_fragment:Yd,opaque_fragment:$d,packing:Zd,premultiplied_alpha_fragment:Jd,project_vertex:Kd,dithering_fragment:jd,dithering_pars_fragment:Qd,roughnessmap_fragment:tf,roughnessmap_pars_fragment:ef,shadowmap_pars_fragment:nf,shadowmap_pars_vertex:sf,shadowmap_vertex:rf,shadowmask_pars_fragment:af,skinbase_vertex:of,skinning_pars_vertex:lf,skinning_vertex:cf,skinnormal_vertex:hf,specularmap_fragment:uf,specularmap_pars_fragment:df,tonemapping_fragment:ff,tonemapping_pars_fragment:pf,transmission_fragment:mf,transmission_pars_fragment:gf,uv_pars_fragment:xf,uv_pars_vertex:_f,uv_vertex:yf,worldpos_vertex:vf,background_vert:Mf,background_frag:Sf,backgroundCube_vert:bf,backgroundCube_frag:wf,cube_vert:Af,cube_frag:Tf,depth_vert:Ef,depth_frag:Cf,distance_vert:Rf,distance_frag:If,equirect_vert:Pf,equirect_frag:Lf,linedashed_vert:Df,linedashed_frag:Uf,meshbasic_vert:Nf,meshbasic_frag:Ff,meshlambert_vert:Of,meshlambert_frag:Bf,meshmatcap_vert:zf,meshmatcap_frag:kf,meshnormal_vert:Vf,meshnormal_frag:Gf,meshphong_vert:Hf,meshphong_frag:Wf,meshphysical_vert:Xf,meshphysical_frag:qf,meshtoon_vert:Yf,meshtoon_frag:$f,points_vert:Zf,points_frag:Jf,shadow_vert:Kf,shadow_frag:jf,sprite_vert:Qf,sprite_frag:tp},ut={common:{diffuse:{value:new Yt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new zt},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new zt}},envmap:{envMap:{value:null},envMapRotation:{value:new zt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new zt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new zt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new zt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new zt},normalScale:{value:new Qt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new zt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new zt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new zt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new zt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Yt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Yt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0},uvTransform:{value:new zt}},sprite:{diffuse:{value:new Yt(16777215)},opacity:{value:1},center:{value:new Qt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new zt},alphaMap:{value:null},alphaMapTransform:{value:new zt},alphaTest:{value:0}}},pn={basic:{uniforms:Ie([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:Vt.meshbasic_vert,fragmentShader:Vt.meshbasic_frag},lambert:{uniforms:Ie([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Yt(0)},envMapIntensity:{value:1}}]),vertexShader:Vt.meshlambert_vert,fragmentShader:Vt.meshlambert_frag},phong:{uniforms:Ie([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Yt(0)},specular:{value:new Yt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Vt.meshphong_vert,fragmentShader:Vt.meshphong_frag},standard:{uniforms:Ie([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new Yt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag},toon:{uniforms:Ie([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new Yt(0)}}]),vertexShader:Vt.meshtoon_vert,fragmentShader:Vt.meshtoon_frag},matcap:{uniforms:Ie([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:Vt.meshmatcap_vert,fragmentShader:Vt.meshmatcap_frag},points:{uniforms:Ie([ut.points,ut.fog]),vertexShader:Vt.points_vert,fragmentShader:Vt.points_frag},dashed:{uniforms:Ie([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Vt.linedashed_vert,fragmentShader:Vt.linedashed_frag},depth:{uniforms:Ie([ut.common,ut.displacementmap]),vertexShader:Vt.depth_vert,fragmentShader:Vt.depth_frag},normal:{uniforms:Ie([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:Vt.meshnormal_vert,fragmentShader:Vt.meshnormal_frag},sprite:{uniforms:Ie([ut.sprite,ut.fog]),vertexShader:Vt.sprite_vert,fragmentShader:Vt.sprite_frag},background:{uniforms:{uvTransform:{value:new zt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Vt.background_vert,fragmentShader:Vt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new zt}},vertexShader:Vt.backgroundCube_vert,fragmentShader:Vt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Vt.cube_vert,fragmentShader:Vt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Vt.equirect_vert,fragmentShader:Vt.equirect_frag},distance:{uniforms:Ie([ut.common,ut.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Vt.distance_vert,fragmentShader:Vt.distance_frag},shadow:{uniforms:Ie([ut.lights,ut.fog,{color:{value:new Yt(0)},opacity:{value:1}}]),vertexShader:Vt.shadow_vert,fragmentShader:Vt.shadow_frag}};pn.physical={uniforms:Ie([pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new zt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new zt},clearcoatNormalScale:{value:new Qt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new zt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new zt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new zt},sheen:{value:0},sheenColor:{value:new Yt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new zt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new zt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new zt},transmissionSamplerSize:{value:new Qt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new zt},attenuationDistance:{value:0},attenuationColor:{value:new Yt(0)},specularColor:{value:new Yt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new zt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new zt},anisotropyVector:{value:new Qt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new zt}}]),vertexShader:Vt.meshphysical_vert,fragmentShader:Vt.meshphysical_frag};var Fa={r:0,b:0,g:0},ai=new ln,ep=new re;function np(i,t,e,n,s,r){let a=new Yt(0),o=s===!0?0:1,l,c,u=null,m=0,h=null;function f(v){let M=v.isScene===!0?v.background:null;if(M&&M.isTexture){let w=v.backgroundBlurriness>0;M=t.get(M,w)}return M}function g(v){let M=!1,w=f(v);w===null?p(a,o):w&&w.isColor&&(p(w,1),M=!0);let E=i.xr.getEnvironmentBlendMode();E==="additive"?e.buffers.color.setClear(0,0,0,1,r):E==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||M)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function y(v,M){let w=f(M);w&&(w.isCubeTexture||w.mapping===Ms)?(c===void 0&&(c=new we(new Ui(1,1,1),new Re({name:"BackgroundCubeMaterial",uniforms:ri(pn.backgroundCube.uniforms),vertexShader:pn.backgroundCube.vertexShader,fragmentShader:pn.backgroundCube.fragmentShader,side:De,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(E,A,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),ai.copy(M.backgroundRotation),ai.x*=-1,ai.y*=-1,ai.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(ai.y*=-1,ai.z*=-1),c.material.uniforms.envMap.value=w,c.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(ep.makeRotationFromEuler(ai)),c.material.toneMapped=Zt.getTransfer(w.colorSpace)!==te,(u!==w||m!==w.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,u=w,m=w.version,h=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):w&&w.isTexture&&(l===void 0&&(l=new we(new gs(2,2),new Re({name:"BackgroundMaterial",uniforms:ri(pn.background.uniforms),vertexShader:pn.background.vertexShader,fragmentShader:pn.background.fragmentShader,side:bn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=w,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=Zt.getTransfer(w.colorSpace)!==te,w.matrixAutoUpdate===!0&&w.updateMatrix(),l.material.uniforms.uvTransform.value.copy(w.matrix),(u!==w||m!==w.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,u=w,m=w.version,h=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function p(v,M){v.getRGB(Fa,el(i)),e.buffers.color.setClear(Fa.r,Fa.g,Fa.b,M,r)}function d(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,M=1){a.set(v),o=M,p(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,p(a,o)},render:g,addToRenderList:y,dispose:d}}function ip(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null),r=s,a=!1;function o(I,O,B,G,H){let N=!1,k=m(I,G,B,O);r!==k&&(r=k,c(r.object)),N=f(I,G,B,H),N&&g(I,G,B,H),H!==null&&t.update(H,i.ELEMENT_ARRAY_BUFFER),(N||a)&&(a=!1,w(I,O,B,G),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(H).buffer))}function l(){return i.createVertexArray()}function c(I){return i.bindVertexArray(I)}function u(I){return i.deleteVertexArray(I)}function m(I,O,B,G){let H=G.wireframe===!0,N=n[O.id];N===void 0&&(N={},n[O.id]=N);let k=I.isInstancedMesh===!0?I.id:0,rt=N[k];rt===void 0&&(rt={},N[k]=rt);let q=rt[B.id];q===void 0&&(q={},rt[B.id]=q);let at=q[H];return at===void 0&&(at=h(l()),q[H]=at),at}function h(I){let O=[],B=[],G=[];for(let H=0;H<e;H++)O[H]=0,B[H]=0,G[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:B,attributeDivisors:G,object:I,attributes:{},index:null}}function f(I,O,B,G){let H=r.attributes,N=O.attributes,k=0,rt=B.getAttributes();for(let q in rt)if(rt[q].location>=0){let dt=H[q],nt=N[q];if(nt===void 0&&(q==="instanceMatrix"&&I.instanceMatrix&&(nt=I.instanceMatrix),q==="instanceColor"&&I.instanceColor&&(nt=I.instanceColor)),dt===void 0||dt.attribute!==nt||nt&&dt.data!==nt.data)return!0;k++}return r.attributesNum!==k||r.index!==G}function g(I,O,B,G){let H={},N=O.attributes,k=0,rt=B.getAttributes();for(let q in rt)if(rt[q].location>=0){let dt=N[q];dt===void 0&&(q==="instanceMatrix"&&I.instanceMatrix&&(dt=I.instanceMatrix),q==="instanceColor"&&I.instanceColor&&(dt=I.instanceColor));let nt={};nt.attribute=dt,dt&&dt.data&&(nt.data=dt.data),H[q]=nt,k++}r.attributes=H,r.attributesNum=k,r.index=G}function y(){let I=r.newAttributes;for(let O=0,B=I.length;O<B;O++)I[O]=0}function p(I){d(I,0)}function d(I,O){let B=r.newAttributes,G=r.enabledAttributes,H=r.attributeDivisors;B[I]=1,G[I]===0&&(i.enableVertexAttribArray(I),G[I]=1),H[I]!==O&&(i.vertexAttribDivisor(I,O),H[I]=O)}function v(){let I=r.newAttributes,O=r.enabledAttributes;for(let B=0,G=O.length;B<G;B++)O[B]!==I[B]&&(i.disableVertexAttribArray(B),O[B]=0)}function M(I,O,B,G,H,N,k){k===!0?i.vertexAttribIPointer(I,O,B,H,N):i.vertexAttribPointer(I,O,B,G,H,N)}function w(I,O,B,G){y();let H=G.attributes,N=B.getAttributes(),k=O.defaultAttributeValues;for(let rt in N){let q=N[rt];if(q.location>=0){let at=H[rt];if(at===void 0&&(rt==="instanceMatrix"&&I.instanceMatrix&&(at=I.instanceMatrix),rt==="instanceColor"&&I.instanceColor&&(at=I.instanceColor)),at!==void 0){let dt=at.normalized,nt=at.itemSize,vt=t.get(at);if(vt===void 0)continue;let Ut=vt.buffer,kt=vt.type,Z=vt.bytesPerElement,it=kt===i.INT||kt===i.UNSIGNED_INT||at.gpuType===Zr;if(at.isInterleavedBufferAttribute){let lt=at.data,Pt=lt.stride,xt=at.offset;if(lt.isInstancedInterleavedBuffer){for(let It=0;It<q.locationSize;It++)d(q.location+It,lt.meshPerAttribute);I.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=lt.meshPerAttribute*lt.count)}else for(let It=0;It<q.locationSize;It++)p(q.location+It);i.bindBuffer(i.ARRAY_BUFFER,Ut);for(let It=0;It<q.locationSize;It++)M(q.location+It,nt/q.locationSize,kt,dt,Pt*Z,(xt+nt/q.locationSize*It)*Z,it)}else{if(at.isInstancedBufferAttribute){for(let lt=0;lt<q.locationSize;lt++)d(q.location+lt,at.meshPerAttribute);I.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=at.meshPerAttribute*at.count)}else for(let lt=0;lt<q.locationSize;lt++)p(q.location+lt);i.bindBuffer(i.ARRAY_BUFFER,Ut);for(let lt=0;lt<q.locationSize;lt++)M(q.location+lt,nt/q.locationSize,kt,dt,nt*Z,nt/q.locationSize*lt*Z,it)}}else if(k!==void 0){let dt=k[rt];if(dt!==void 0)switch(dt.length){case 2:i.vertexAttrib2fv(q.location,dt);break;case 3:i.vertexAttrib3fv(q.location,dt);break;case 4:i.vertexAttrib4fv(q.location,dt);break;default:i.vertexAttrib1fv(q.location,dt)}}}}v()}function E(){b();for(let I in n){let O=n[I];for(let B in O){let G=O[B];for(let H in G){let N=G[H];for(let k in N)u(N[k].object),delete N[k];delete G[H]}}delete n[I]}}function A(I){if(n[I.id]===void 0)return;let O=n[I.id];for(let B in O){let G=O[B];for(let H in G){let N=G[H];for(let k in N)u(N[k].object),delete N[k];delete G[H]}}delete n[I.id]}function R(I){for(let O in n){let B=n[O];for(let G in B){let H=B[G];if(H[I.id]===void 0)continue;let N=H[I.id];for(let k in N)u(N[k].object),delete N[k];delete H[I.id]}}}function _(I){for(let O in n){let B=n[O],G=I.isInstancedMesh===!0?I.id:0,H=B[G];if(H!==void 0){for(let N in H){let k=H[N];for(let rt in k)u(k[rt].object),delete k[rt];delete H[N]}delete B[G],Object.keys(B).length===0&&delete n[O]}}}function b(){D(),a=!0,r!==s&&(r=s,c(r.object))}function D(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:b,resetDefaultState:D,dispose:E,releaseStatesOfGeometry:A,releaseStatesOfObject:_,releaseStatesOfProgram:R,initAttributes:y,enableAttribute:p,disableUnusedAttributes:v}}function sp(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function a(c,u,m){m!==0&&(i.drawArraysInstanced(n,c,u,m),e.update(u,n,m))}function o(c,u,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,m);let f=0;for(let g=0;g<m;g++)f+=u[g];e.update(f,n,1)}function l(c,u,m,h){if(m===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)a(c[g],u[g],h[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,u,0,h,0,m);let g=0;for(let y=0;y<m;y++)g+=u[y]*h[y];e.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function rp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let R=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(R){return!(R!==Ye&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){let _=R===dn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(R!==We&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==qe&&!_)}function l(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",u=l(c);u!==c&&(Lt("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let m=e.logarithmicDepthBuffer===!0,h=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),d=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),w=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),E=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:m,reversedDepthBuffer:h,maxTextures:f,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:p,maxAttributes:d,maxVertexUniforms:v,maxVaryings:M,maxFragmentUniforms:w,maxSamples:E,samples:A}}function ap(i){let t=this,e=null,n=0,s=!1,r=!1,a=new sn,o=new zt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(m,h){let f=m.length!==0||h||n!==0||s;return s=h,n=m.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(m,h){e=u(m,h,0)},this.setState=function(m,h,f){let g=m.clippingPlanes,y=m.clipIntersection,p=m.clipShadows,d=i.get(m);if(!s||g===null||g.length===0||r&&!p)r?u(null):c();else{let v=r?0:n,M=v*4,w=d.clippingState||null;l.value=w,w=u(g,h,M,f);for(let E=0;E!==M;++E)w[E]=e[E];d.clippingState=w,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(m,h,f,g){let y=m!==null?m.length:0,p=null;if(y!==0){if(p=l.value,g!==!0||p===null){let d=f+y*4,v=h.matrixWorldInverse;o.getNormalMatrix(v),(p===null||p.length<d)&&(p=new Float32Array(d));for(let M=0,w=f;M!==y;++M,w+=4)a.copy(m[M]).applyMatrix4(v,o),a.normal.toArray(p,w),p[w+3]=a.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,p}}var qn=4,$c=[.125,.215,.35,.446,.526,.582],li=20,op=256,Rs=new ys,Zc=new Yt,rl=null,al=0,ol=0,ll=!1,lp=new z,Ba=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=lp}=r;rl=this._renderer.getRenderTarget(),al=this._renderer.getActiveCubeFace(),ol=this._renderer.getActiveMipmapLevel(),ll=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=jc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Kc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(rl,al,ol),this._renderer.xr.enabled=ll,t.scissorTest=!1,Bi(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Hn||t.mapping===ii?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),rl=this._renderer.getRenderTarget(),al=this._renderer.getActiveCubeFace(),ol=this._renderer.getActiveMipmapLevel(),ll=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:be,minFilter:be,generateMipmaps:!1,type:dn,format:Ye,colorSpace:ni,depthBuffer:!1},s=Jc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Jc(t,e,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=cp(r)),this._blurMaterial=up(r,t,e),this._ggxMaterial=hp(r,t,e)}return s}_compileMaterial(t){let e=new we(new Le,t);this._renderer.compile(e,Rs)}_sceneToCubeUV(t,e,n,s,r){let l=new Ce(90,1,e,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],m=this._renderer,h=m.autoClear,f=m.toneMapping;m.getClearColor(Zc),m.toneMapping=Qe,m.autoClear=!1,m.state.buffers.depth.getReversed()&&(m.setRenderTarget(s),m.clearDepth(),m.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new we(new Ui,new Bn({name:"PMREM.Background",side:De,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,p=y.material,d=!1,v=t.background;v?v.isColor&&(p.color.copy(v),t.background=null,d=!0):(p.color.copy(Zc),d=!0);for(let M=0;M<6;M++){let w=M%3;w===0?(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[M],r.y,r.z)):w===1?(l.up.set(0,0,c[M]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[M],r.z)):(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[M]));let E=this._cubeSize;Bi(s,w*E,M>2?E:0,E,E),m.setRenderTarget(s),d&&m.render(y,l),m.render(t,l)}m.toneMapping=f,m.autoClear=h,t.background=v}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Hn||t.mapping===ii;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=jc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Kc());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;Bi(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Rs)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),u=e/(this._lodMeshes.length-1),m=Math.sqrt(c*c-u*u),h=0+c*1.25,f=m*h,{_lodMax:g}=this,y=this._sizeLods[n],p=3*y*(n>g-qn?n-g+qn:0),d=4*(this._cubeSize-y);l.envMap.value=t.texture,l.roughness.value=f,l.mipInt.value=g-e,Bi(r,p,d,3*y,2*y),s.setRenderTarget(r),s.render(o,Rs),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-n,Bi(t,p,d,3*y,2*y),s.setRenderTarget(t),s.render(o,Rs)}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Dt("blur direction must be either latitudinal or longitudinal!");let u=3,m=this._lodMeshes[s];m.material=c;let h=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*li-1),y=r/g,p=isFinite(r)?1+Math.floor(u*y):li;p>li&&Lt(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${li}`);let d=[],v=0;for(let R=0;R<li;++R){let _=R/y,b=Math.exp(-_*_/2);d.push(b),R===0?v+=b:R<p&&(v+=2*b)}for(let R=0;R<d.length;R++)d[R]=d[R]/v;h.envMap.value=t.texture,h.samples.value=p,h.weights.value=d,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);let{_lodMax:M}=this;h.dTheta.value=g,h.mipInt.value=M-n;let w=this._sizeLods[s],E=3*w*(s>M-qn?s-M+qn:0),A=4*(this._cubeSize-w);Bi(e,E,A,3*w,2*w),l.setRenderTarget(e),l.render(m,Rs)}};function cp(i){let t=[],e=[],n=[],s=i,r=i-qn+1+$c.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-qn?l=$c[a-i+qn-1]:a===0&&(l=0),e.push(l);let c=1/(o-2),u=-c,m=1+c,h=[u,u,m,u,m,m,u,u,m,m,u,m],f=6,g=6,y=3,p=2,d=1,v=new Float32Array(y*g*f),M=new Float32Array(p*g*f),w=new Float32Array(d*g*f);for(let A=0;A<f;A++){let R=A%3*2/3-1,_=A>2?0:-1,b=[R,_,0,R+2/3,_,0,R+2/3,_+1,0,R,_,0,R+2/3,_+1,0,R,_+1,0];v.set(b,y*g*A),M.set(h,p*g*A);let D=[A,A,A,A,A,A];w.set(D,d*g*A)}let E=new Le;E.setAttribute("position",new me(v,y)),E.setAttribute("uv",new me(M,p)),E.setAttribute("faceIndex",new me(w,d)),n.push(new we(E,null)),s>qn&&s--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function Jc(i,t,e){let n=new Ve(i,t,e);return n.texture.mapping=Ms,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Bi(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function hp(i,t,e){return new Re({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:op,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Va(),fragmentShader:`

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
		`,blending:un,depthTest:!1,depthWrite:!1})}function up(i,t,e){let n=new Float32Array(li),s=new z(0,1,0);return new Re({name:"SphericalGaussianBlur",defines:{n:li,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Va(),fragmentShader:`

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
		`,blending:un,depthTest:!1,depthWrite:!1})}function Kc(){return new Re({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Va(),fragmentShader:`

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
		`,blending:un,depthTest:!1,depthWrite:!1})}function jc(){return new Re({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Va(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function Va(){return`

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
	`}var za=class extends Ve{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new fs(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Ui(5,5,5),r=new Re({name:"CubemapFromEquirect",uniforms:ri(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:De,blending:un});r.uniforms.tEquirect.value=e;let a=new we(s,r),o=e.minFilter;return e.minFilter===Wn&&(e.minFilter=be),new Wr(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}};function dp(i){let t=new WeakMap,e=new WeakMap,n=null;function s(h,f=!1){return h==null?null:f?a(h):r(h)}function r(h){if(h&&h.isTexture){let f=h.mapping;if(f===qr||f===Yr)if(t.has(h)){let g=t.get(h).texture;return o(g,h.mapping)}else{let g=h.image;if(g&&g.height>0){let y=new za(g.height);return y.fromEquirectangularTexture(i,h),t.set(h,y),h.addEventListener("dispose",c),o(y.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){let f=h.mapping,g=f===qr||f===Yr,y=f===Hn||f===ii;if(g||y){let p=e.get(h),d=p!==void 0?p.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==d)return n===null&&(n=new Ba(i)),p=g?n.fromEquirectangular(h,p):n.fromCubemap(h,p),p.texture.pmremVersion=h.pmremVersion,e.set(h,p),p.texture;if(p!==void 0)return p.texture;{let v=h.image;return g&&v&&v.height>0||y&&v&&l(v)?(n===null&&(n=new Ba(i)),p=g?n.fromEquirectangular(h):n.fromCubemap(h),p.texture.pmremVersion=h.pmremVersion,e.set(h,p),h.addEventListener("dispose",u),p.texture):null}}}return h}function o(h,f){return f===qr?h.mapping=Hn:f===Yr&&(h.mapping=ii),h}function l(h){let f=0,g=6;for(let y=0;y<g;y++)h[y]!==void 0&&f++;return f===g}function c(h){let f=h.target;f.removeEventListener("dispose",c);let g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function u(h){let f=h.target;f.removeEventListener("dispose",u);let g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function m(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:m}}function fp(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&es("WebGLRenderer: "+n+" extension not supported."),s}}}function pp(i,t,e,n){let s={},r=new WeakMap;function a(m){let h=m.target;h.index!==null&&t.remove(h.index);for(let g in h.attributes)t.remove(h.attributes[g]);h.removeEventListener("dispose",a),delete s[h.id];let f=r.get(h);f&&(t.remove(f),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(m,h){return s[h.id]===!0||(h.addEventListener("dispose",a),s[h.id]=!0,e.memory.geometries++),h}function l(m){let h=m.attributes;for(let f in h)t.update(h[f],i.ARRAY_BUFFER)}function c(m){let h=[],f=m.index,g=m.attributes.position,y=0;if(g===void 0)return;if(f!==null){let v=f.array;y=f.version;for(let M=0,w=v.length;M<w;M+=3){let E=v[M+0],A=v[M+1],R=v[M+2];h.push(E,A,A,R,R,E)}}else{let v=g.array;y=g.version;for(let M=0,w=v.length/3-1;M<w;M+=3){let E=M+0,A=M+1,R=M+2;h.push(E,A,A,R,R,E)}}let p=new(g.count>=65535?as:rs)(h,1);p.version=y;let d=r.get(m);d&&t.remove(d),r.set(m,p)}function u(m){let h=r.get(m);if(h){let f=m.index;f!==null&&h.version<f.version&&c(m)}else c(m);return r.get(m)}return{get:o,update:l,getWireframeAttribute:u}}function mp(i,t,e){let n;function s(h){n=h}let r,a;function o(h){r=h.type,a=h.bytesPerElement}function l(h,f){i.drawElements(n,f,r,h*a),e.update(f,n,1)}function c(h,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,h*a,g),e.update(f,n,g))}function u(h,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,h,0,g);let p=0;for(let d=0;d<g;d++)p+=f[d];e.update(p,n,1)}function m(h,f,g,y){if(g===0)return;let p=t.get("WEBGL_multi_draw");if(p===null)for(let d=0;d<h.length;d++)c(h[d]/a,f[d],y[d]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,r,h,0,y,0,g);let d=0;for(let v=0;v<g;v++)d+=f[v]*y[v];e.update(d,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=m}function gp(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Dt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function xp(i,t,e){let n=new WeakMap,s=new he;function r(a,o,l){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,m=u!==void 0?u.length:0,h=n.get(o);if(h===void 0||h.count!==m){let b=function(){R.dispose(),n.delete(o),o.removeEventListener("dispose",b)};h!==void 0&&h.texture.dispose();let f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],M=0;f===!0&&(M=1),g===!0&&(M=2),y===!0&&(M=3);let w=o.attributes.position.count*M,E=1;w>t.maxTextureSize&&(E=Math.ceil(w/t.maxTextureSize),w=t.maxTextureSize);let A=new Float32Array(w*E*4*m),R=new ns(A,w,E,m);R.type=qe,R.needsUpdate=!0;let _=M*4;for(let D=0;D<m;D++){let I=p[D],O=d[D],B=v[D],G=w*E*4*D;for(let H=0;H<I.count;H++){let N=H*_;f===!0&&(s.fromBufferAttribute(I,H),A[G+N+0]=s.x,A[G+N+1]=s.y,A[G+N+2]=s.z,A[G+N+3]=0),g===!0&&(s.fromBufferAttribute(O,H),A[G+N+4]=s.x,A[G+N+5]=s.y,A[G+N+6]=s.z,A[G+N+7]=0),y===!0&&(s.fromBufferAttribute(B,H),A[G+N+8]=s.x,A[G+N+9]=s.y,A[G+N+10]=s.z,A[G+N+11]=B.itemSize===4?s.w:1)}}h={count:m,texture:R,size:new Qt(w,E)},n.set(o,h),o.addEventListener("dispose",b)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let f=0;for(let y=0;y<c.length;y++)f+=c[y];let g=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function _p(i,t,e,n,s){let r=new WeakMap;function a(c){let u=s.render.frame,m=c.geometry,h=t.get(c,m);if(r.get(h)!==u&&(t.update(h),r.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==u&&(f.update(),r.set(f,u))}return h}function o(){r=new WeakMap}function l(c){let u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}var yp={[zo]:"LINEAR_TONE_MAPPING",[ko]:"REINHARD_TONE_MAPPING",[Vo]:"CINEON_TONE_MAPPING",[Go]:"ACES_FILMIC_TONE_MAPPING",[Wo]:"AGX_TONE_MAPPING",[Xo]:"NEUTRAL_TONE_MAPPING",[Ho]:"CUSTOM_TONE_MAPPING"};function vp(i,t,e,n,s){let r=new Ve(t,e,{type:i,depthBuffer:n,stencilBuffer:s}),a=new Ve(t,e,{type:dn,depthBuffer:!1,stencilBuffer:!1}),o=new Le;o.setAttribute("position",new Se([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new Se([0,2,0,0,2,0],2));let l=new Pr({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),c=new we(o,l),u=new ys(-1,1,1,-1,0,1),m=null,h=null,f=!1,g,y=null,p=[],d=!1;this.setSize=function(v,M){r.setSize(v,M),a.setSize(v,M);for(let w=0;w<p.length;w++){let E=p[w];E.setSize&&E.setSize(v,M)}},this.setEffects=function(v){p=v,d=p.length>0&&p[0].isRenderPass===!0;let M=r.width,w=r.height;for(let E=0;E<p.length;E++){let A=p[E];A.setSize&&A.setSize(M,w)}},this.begin=function(v,M){if(f||v.toneMapping===Qe&&p.length===0)return!1;if(y=M,M!==null){let w=M.width,E=M.height;(r.width!==w||r.height!==E)&&this.setSize(w,E)}return d===!1&&v.setRenderTarget(r),g=v.toneMapping,v.toneMapping=Qe,!0},this.hasRenderPass=function(){return d},this.end=function(v,M){v.toneMapping=g,f=!0;let w=r,E=a;for(let A=0;A<p.length;A++){let R=p[A];if(R.enabled!==!1&&(R.render(v,E,w,M),R.needsSwap!==!1)){let _=w;w=E,E=_}}if(m!==v.outputColorSpace||h!==v.toneMapping){m=v.outputColorSpace,h=v.toneMapping,l.defines={},Zt.getTransfer(m)===te&&(l.defines.SRGB_TRANSFER="");let A=yp[h];A&&(l.defines[A]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=w.texture,v.setRenderTarget(y),v.render(c,u),y=null,f=!1},this.isCompositing=function(){return f},this.dispose=function(){r.dispose(),a.dispose(),o.dispose(),l.dispose()}}var xh=new Ne,ul=new zn(1,1),_h=new ns,yh=new wr,vh=new fs,Qc=[],th=[],eh=new Float32Array(16),nh=new Float32Array(9),ih=new Float32Array(4);function ki(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Qc[s];if(r===void 0&&(r=new Float32Array(s),Qc[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function ge(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function xe(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Ga(i,t){let e=th[t];e===void 0&&(e=new Int32Array(t),th[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Mp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Sp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2fv(this.addr,t),xe(e,t)}}function bp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ge(e,t))return;i.uniform3fv(this.addr,t),xe(e,t)}}function wp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4fv(this.addr,t),xe(e,t)}}function Ap(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),xe(e,t)}else{if(ge(e,n))return;ih.set(n),i.uniformMatrix2fv(this.addr,!1,ih),xe(e,n)}}function Tp(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),xe(e,t)}else{if(ge(e,n))return;nh.set(n),i.uniformMatrix3fv(this.addr,!1,nh),xe(e,n)}}function Ep(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ge(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),xe(e,t)}else{if(ge(e,n))return;eh.set(n),i.uniformMatrix4fv(this.addr,!1,eh),xe(e,n)}}function Cp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Rp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2iv(this.addr,t),xe(e,t)}}function Ip(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ge(e,t))return;i.uniform3iv(this.addr,t),xe(e,t)}}function Pp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4iv(this.addr,t),xe(e,t)}}function Lp(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Dp(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ge(e,t))return;i.uniform2uiv(this.addr,t),xe(e,t)}}function Up(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ge(e,t))return;i.uniform3uiv(this.addr,t),xe(e,t)}}function Np(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ge(e,t))return;i.uniform4uiv(this.addr,t),xe(e,t)}}function Fp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(ul.compareFunction=e.isReversedDepthBuffer()?Na:Ua,r=ul):r=xh,e.setTexture2D(t||r,s)}function Op(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||yh,s)}function Bp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||vh,s)}function zp(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||_h,s)}function kp(i){switch(i){case 5126:return Mp;case 35664:return Sp;case 35665:return bp;case 35666:return wp;case 35674:return Ap;case 35675:return Tp;case 35676:return Ep;case 5124:case 35670:return Cp;case 35667:case 35671:return Rp;case 35668:case 35672:return Ip;case 35669:case 35673:return Pp;case 5125:return Lp;case 36294:return Dp;case 36295:return Up;case 36296:return Np;case 35678:case 36198:case 36298:case 36306:case 35682:return Fp;case 35679:case 36299:case 36307:return Op;case 35680:case 36300:case 36308:case 36293:return Bp;case 36289:case 36303:case 36311:case 36292:return zp}}function Vp(i,t){i.uniform1fv(this.addr,t)}function Gp(i,t){let e=ki(t,this.size,2);i.uniform2fv(this.addr,e)}function Hp(i,t){let e=ki(t,this.size,3);i.uniform3fv(this.addr,e)}function Wp(i,t){let e=ki(t,this.size,4);i.uniform4fv(this.addr,e)}function Xp(i,t){let e=ki(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function qp(i,t){let e=ki(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Yp(i,t){let e=ki(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function $p(i,t){i.uniform1iv(this.addr,t)}function Zp(i,t){i.uniform2iv(this.addr,t)}function Jp(i,t){i.uniform3iv(this.addr,t)}function Kp(i,t){i.uniform4iv(this.addr,t)}function jp(i,t){i.uniform1uiv(this.addr,t)}function Qp(i,t){i.uniform2uiv(this.addr,t)}function tm(i,t){i.uniform3uiv(this.addr,t)}function em(i,t){i.uniform4uiv(this.addr,t)}function nm(i,t,e){let n=this.cache,s=t.length,r=Ga(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),xe(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=ul:a=xh;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function im(i,t,e){let n=this.cache,s=t.length,r=Ga(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),xe(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||yh,r[a])}function sm(i,t,e){let n=this.cache,s=t.length,r=Ga(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),xe(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||vh,r[a])}function rm(i,t,e){let n=this.cache,s=t.length,r=Ga(e,s);ge(n,r)||(i.uniform1iv(this.addr,r),xe(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||_h,r[a])}function am(i){switch(i){case 5126:return Vp;case 35664:return Gp;case 35665:return Hp;case 35666:return Wp;case 35674:return Xp;case 35675:return qp;case 35676:return Yp;case 5124:case 35670:return $p;case 35667:case 35671:return Zp;case 35668:case 35672:return Jp;case 35669:case 35673:return Kp;case 5125:return jp;case 36294:return Qp;case 36295:return tm;case 36296:return em;case 35678:case 36198:case 36298:case 36306:case 35682:return nm;case 35679:case 36299:case 36307:return im;case 35680:case 36300:case 36308:case 36293:return sm;case 36289:case 36303:case 36311:case 36292:return rm}}var dl=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=kp(e.type)}},fl=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=am(e.type)}},pl=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},cl=/(\w+)(\])?(\[|\.)?/g;function sh(i,t){i.seq.push(t),i.map[t.id]=t}function om(i,t,e){let n=i.name,s=n.length;for(cl.lastIndex=0;;){let r=cl.exec(n),a=cl.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){sh(e,c===void 0?new dl(o,i,t):new fl(o,i,t));break}else{let m=e.map[o];m===void 0&&(m=new pl(o),sh(e,m)),e=m}}}var zi=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);om(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function rh(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var lm=37297,cm=0;function hm(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var ah=new zt;function um(i){Zt._getMatrix(ah,Zt.workingColorSpace,i);let t=`mat3( ${ah.elements.map(e=>e.toFixed(4))} )`;switch(Zt.getTransfer(i)){case ji:return[t,"LinearTransferOETF"];case te:return[t,"sRGBTransferOETF"];default:return Lt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function oh(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+hm(i.getShaderSource(t),o)}else return r}function dm(i,t){let e=um(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var fm={[zo]:"Linear",[ko]:"Reinhard",[Vo]:"Cineon",[Go]:"ACESFilmic",[Wo]:"AgX",[Xo]:"Neutral",[Ho]:"Custom"};function pm(i,t){let e=fm[t];return e===void 0?(Lt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Oa=new z;function mm(){Zt.getLuminanceCoefficients(Oa);let i=Oa.x.toFixed(4),t=Oa.y.toFixed(4),e=Oa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function gm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ps).join(`
`)}function xm(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function _m(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function Ps(i){return i!==""}function lh(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ch(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var ym=/^[ \t]*#include +<([\w\d./]+)>/gm;function ml(i){return i.replace(ym,Mm)}var vm=new Map;function Mm(i,t){let e=Vt[t];if(e===void 0){let n=vm.get(t);if(n!==void 0)e=Vt[n],Lt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ml(e)}var Sm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function hh(i){return i.replace(Sm,bm)}function bm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function uh(i){let t=`precision ${i.precision} float;
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
#define LOW_PRECISION`),t}var wm={[vs]:"SHADOWMAP_TYPE_PCF",[Ni]:"SHADOWMAP_TYPE_VSM"};function Am(i){return wm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Tm={[Hn]:"ENVMAP_TYPE_CUBE",[ii]:"ENVMAP_TYPE_CUBE",[Ms]:"ENVMAP_TYPE_CUBE_UV"};function Em(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Tm[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var Cm={[ii]:"ENVMAP_MODE_REFRACTION"};function Rm(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Cm[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Im={[Bo]:"ENVMAP_BLENDING_MULTIPLY",[Rc]:"ENVMAP_BLENDING_MIX",[Ic]:"ENVMAP_BLENDING_ADD"};function Pm(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Im[i.combine]||"ENVMAP_BLENDING_NONE"}function Lm(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Dm(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=Am(e),c=Em(e),u=Rm(e),m=Pm(e),h=Lm(e),f=gm(e),g=xm(r),y=s.createProgram(),p,d,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ps).join(`
`),p.length>0&&(p+=`
`),d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ps).join(`
`),d.length>0&&(d+=`
`)):(p=[uh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ps).join(`
`),d=[uh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+m:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Qe?"#define TONE_MAPPING":"",e.toneMapping!==Qe?Vt.tonemapping_pars_fragment:"",e.toneMapping!==Qe?pm("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Vt.colorspace_pars_fragment,dm("linearToOutputTexel",e.outputColorSpace),mm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ps).join(`
`)),a=ml(a),a=lh(a,e),a=ch(a,e),o=ml(o),o=lh(o,e),o=ch(o,e),a=hh(a),o=hh(o),e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,d=["#define varying in",e.glslVersion===Qo?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Qo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let M=v+p+a,w=v+d+o,E=rh(s,s.VERTEX_SHADER,M),A=rh(s,s.FRAGMENT_SHADER,w);s.attachShader(y,E),s.attachShader(y,A),e.index0AttributeName!==void 0?s.bindAttribLocation(y,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function R(I){if(i.debug.checkShaderErrors){let O=s.getProgramInfoLog(y)||"",B=s.getShaderInfoLog(E)||"",G=s.getShaderInfoLog(A)||"",H=O.trim(),N=B.trim(),k=G.trim(),rt=!0,q=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(rt=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,y,E,A);else{let at=oh(s,E,"vertex"),dt=oh(s,A,"fragment");Dt("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+H+`
`+at+`
`+dt)}else H!==""?Lt("WebGLProgram: Program Info Log:",H):(N===""||k==="")&&(q=!1);q&&(I.diagnostics={runnable:rt,programLog:H,vertexShader:{log:N,prefix:p},fragmentShader:{log:k,prefix:d}})}s.deleteShader(E),s.deleteShader(A),_=new zi(s,y),b=_m(s,y)}let _;this.getUniforms=function(){return _===void 0&&R(this),_};let b;this.getAttributes=function(){return b===void 0&&R(this),b};let D=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=s.getProgramParameter(y,lm)),D},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=cm++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=E,this.fragmentShader=A,this}var Um=0,gl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new xl(t),e.set(t,n)),n}},xl=class{constructor(t){this.id=Um++,this.code=t,this.usedTimes=0}};function Nm(i,t,e,n,s,r){let a=new is,o=new gl,l=new Set,c=[],u=new Map,m=n.logarithmicDepthBuffer,h=n.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){return l.add(_),_===0?"uv":`uv${_}`}function y(_,b,D,I,O){let B=I.fog,G=O.geometry,H=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?I.environment:null,N=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,k=t.get(_.envMap||H,N),rt=k&&k.mapping===Ms?k.image.height:null,q=f[_.type];_.precision!==null&&(h=n.getMaxPrecision(_.precision),h!==_.precision&&Lt("WebGLProgram.getParameters:",_.precision,"not supported, using",h,"instead."));let at=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,dt=at!==void 0?at.length:0,nt=0;G.morphAttributes.position!==void 0&&(nt=1),G.morphAttributes.normal!==void 0&&(nt=2),G.morphAttributes.color!==void 0&&(nt=3);let vt,Ut,kt,Z;if(q){let Jt=pn[q];vt=Jt.vertexShader,Ut=Jt.fragmentShader}else vt=_.vertexShader,Ut=_.fragmentShader,o.update(_),kt=o.getVertexShaderID(_),Z=o.getFragmentShaderID(_);let it=i.getRenderTarget(),lt=i.state.buffers.depth.getReversed(),Pt=O.isInstancedMesh===!0,xt=O.isBatchedMesh===!0,It=!!_.map,ue=!!_.matcap,Nt=!!k,$t=!!_.aoMap,ee=!!_.lightMap,Ft=!!_.bumpMap,oe=!!_.normalMap,P=!!_.displacementMap,le=!!_.emissiveMap,Wt=!!_.metalnessMap,Kt=!!_.roughnessMap,gt=_.anisotropy>0,T=_.clearcoat>0,x=_.dispersion>0,U=_.iridescence>0,J=_.sheen>0,tt=_.transmission>0,$=gt&&!!_.anisotropyMap,St=T&&!!_.clearcoatMap,ct=T&&!!_.clearcoatNormalMap,At=T&&!!_.clearcoatRoughnessMap,Rt=U&&!!_.iridescenceMap,st=U&&!!_.iridescenceThicknessMap,ot=J&&!!_.sheenColorMap,yt=J&&!!_.sheenRoughnessMap,bt=!!_.specularMap,mt=!!_.specularColorMap,L=!!_.specularIntensityMap,C=tt&&!!_.transmissionMap,K=tt&&!!_.thicknessMap,Q=!!_.gradientMap,j=!!_.alphaMap,et=_.alphaTest>0,X=!!_.alphaHash,ht=!!_.extensions,Mt=Qe;_.toneMapped&&(it===null||it.isXRRenderTarget===!0)&&(Mt=i.toneMapping);let Ot={shaderID:q,shaderType:_.type,shaderName:_.name,vertexShader:vt,fragmentShader:Ut,defines:_.defines,customVertexShaderID:kt,customFragmentShaderID:Z,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:h,batching:xt,batchingColor:xt&&O._colorsTexture!==null,instancing:Pt,instancingColor:Pt&&O.instanceColor!==null,instancingMorph:Pt&&O.morphTexture!==null,outputColorSpace:it===null?i.outputColorSpace:it.isXRRenderTarget===!0?it.texture.colorSpace:ni,alphaToCoverage:!!_.alphaToCoverage,map:It,matcap:ue,envMap:Nt,envMapMode:Nt&&k.mapping,envMapCubeUVHeight:rt,aoMap:$t,lightMap:ee,bumpMap:Ft,normalMap:oe,displacementMap:P,emissiveMap:le,normalMapObjectSpace:oe&&_.normalMapType===Uc,normalMapTangentSpace:oe&&_.normalMapType===Dc,metalnessMap:Wt,roughnessMap:Kt,anisotropy:gt,anisotropyMap:$,clearcoat:T,clearcoatMap:St,clearcoatNormalMap:ct,clearcoatRoughnessMap:At,dispersion:x,iridescence:U,iridescenceMap:Rt,iridescenceThicknessMap:st,sheen:J,sheenColorMap:ot,sheenRoughnessMap:yt,specularMap:bt,specularColorMap:mt,specularIntensityMap:L,transmission:tt,transmissionMap:C,thicknessMap:K,gradientMap:Q,opaque:_.transparent===!1&&_.blending===ti&&_.alphaToCoverage===!1,alphaMap:j,alphaTest:et,alphaHash:X,combine:_.combine,mapUv:It&&g(_.map.channel),aoMapUv:$t&&g(_.aoMap.channel),lightMapUv:ee&&g(_.lightMap.channel),bumpMapUv:Ft&&g(_.bumpMap.channel),normalMapUv:oe&&g(_.normalMap.channel),displacementMapUv:P&&g(_.displacementMap.channel),emissiveMapUv:le&&g(_.emissiveMap.channel),metalnessMapUv:Wt&&g(_.metalnessMap.channel),roughnessMapUv:Kt&&g(_.roughnessMap.channel),anisotropyMapUv:$&&g(_.anisotropyMap.channel),clearcoatMapUv:St&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:ct&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:At&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:Rt&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:st&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:ot&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:yt&&g(_.sheenRoughnessMap.channel),specularMapUv:bt&&g(_.specularMap.channel),specularColorMapUv:mt&&g(_.specularColorMap.channel),specularIntensityMapUv:L&&g(_.specularIntensityMap.channel),transmissionMapUv:C&&g(_.transmissionMap.channel),thicknessMapUv:K&&g(_.thicknessMap.channel),alphaMapUv:j&&g(_.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(oe||gt),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!G.attributes.uv&&(It||j),fog:!!B,useFog:_.fog===!0,fogExp2:!!B&&B.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||G.attributes.normal===void 0&&oe===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:m,reversedDepthBuffer:lt,skinning:O.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:dt,morphTextureStride:nt,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:Mt,decodeVideoTexture:It&&_.map.isVideoTexture===!0&&Zt.getTransfer(_.map.colorSpace)===te,decodeVideoTextureEmissive:le&&_.emissiveMap.isVideoTexture===!0&&Zt.getTransfer(_.emissiveMap.colorSpace)===te,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===He,flipSided:_.side===De,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ht&&_.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ht&&_.extensions.multiDraw===!0||xt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Ot.vertexUv1s=l.has(1),Ot.vertexUv2s=l.has(2),Ot.vertexUv3s=l.has(3),l.clear(),Ot}function p(_){let b=[];if(_.shaderID?b.push(_.shaderID):(b.push(_.customVertexShaderID),b.push(_.customFragmentShaderID)),_.defines!==void 0)for(let D in _.defines)b.push(D),b.push(_.defines[D]);return _.isRawShaderMaterial===!1&&(d(b,_),v(b,_),b.push(i.outputColorSpace)),b.push(_.customProgramCacheKey),b.join()}function d(_,b){_.push(b.precision),_.push(b.outputColorSpace),_.push(b.envMapMode),_.push(b.envMapCubeUVHeight),_.push(b.mapUv),_.push(b.alphaMapUv),_.push(b.lightMapUv),_.push(b.aoMapUv),_.push(b.bumpMapUv),_.push(b.normalMapUv),_.push(b.displacementMapUv),_.push(b.emissiveMapUv),_.push(b.metalnessMapUv),_.push(b.roughnessMapUv),_.push(b.anisotropyMapUv),_.push(b.clearcoatMapUv),_.push(b.clearcoatNormalMapUv),_.push(b.clearcoatRoughnessMapUv),_.push(b.iridescenceMapUv),_.push(b.iridescenceThicknessMapUv),_.push(b.sheenColorMapUv),_.push(b.sheenRoughnessMapUv),_.push(b.specularMapUv),_.push(b.specularColorMapUv),_.push(b.specularIntensityMapUv),_.push(b.transmissionMapUv),_.push(b.thicknessMapUv),_.push(b.combine),_.push(b.fogExp2),_.push(b.sizeAttenuation),_.push(b.morphTargetsCount),_.push(b.morphAttributeCount),_.push(b.numDirLights),_.push(b.numPointLights),_.push(b.numSpotLights),_.push(b.numSpotLightMaps),_.push(b.numHemiLights),_.push(b.numRectAreaLights),_.push(b.numDirLightShadows),_.push(b.numPointLightShadows),_.push(b.numSpotLightShadows),_.push(b.numSpotLightShadowsWithMaps),_.push(b.numLightProbes),_.push(b.shadowMapType),_.push(b.toneMapping),_.push(b.numClippingPlanes),_.push(b.numClipIntersection),_.push(b.depthPacking)}function v(_,b){a.disableAll(),b.instancing&&a.enable(0),b.instancingColor&&a.enable(1),b.instancingMorph&&a.enable(2),b.matcap&&a.enable(3),b.envMap&&a.enable(4),b.normalMapObjectSpace&&a.enable(5),b.normalMapTangentSpace&&a.enable(6),b.clearcoat&&a.enable(7),b.iridescence&&a.enable(8),b.alphaTest&&a.enable(9),b.vertexColors&&a.enable(10),b.vertexAlphas&&a.enable(11),b.vertexUv1s&&a.enable(12),b.vertexUv2s&&a.enable(13),b.vertexUv3s&&a.enable(14),b.vertexTangents&&a.enable(15),b.anisotropy&&a.enable(16),b.alphaHash&&a.enable(17),b.batching&&a.enable(18),b.dispersion&&a.enable(19),b.batchingColor&&a.enable(20),b.gradientMap&&a.enable(21),_.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),_.push(a.mask)}function M(_){let b=f[_.type],D;if(b){let I=pn[b];D=qc.clone(I.uniforms)}else D=_.uniforms;return D}function w(_,b){let D=u.get(b);return D!==void 0?++D.usedTimes:(D=new Dm(i,b,_,s),c.push(D),u.set(b,D)),D}function E(_){if(--_.usedTimes===0){let b=c.indexOf(_);c[b]=c[c.length-1],c.pop(),u.delete(_.cacheKey),_.destroy()}}function A(_){o.remove(_)}function R(){o.dispose()}return{getParameters:y,getProgramCacheKey:p,getUniforms:M,acquireProgram:w,releaseProgram:E,releaseShaderCache:A,programs:c,dispose:R}}function Fm(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Om(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function dh(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function fh(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(h){let f=0;return h.isInstancedMesh&&(f+=2),h.isSkinnedMesh&&(f+=1),f}function o(h,f,g,y,p,d){let v=i[t];return v===void 0?(v={id:h.id,object:h,geometry:f,material:g,materialVariant:a(h),groupOrder:y,renderOrder:h.renderOrder,z:p,group:d},i[t]=v):(v.id=h.id,v.object=h,v.geometry=f,v.material=g,v.materialVariant=a(h),v.groupOrder=y,v.renderOrder=h.renderOrder,v.z=p,v.group=d),t++,v}function l(h,f,g,y,p,d){let v=o(h,f,g,y,p,d);g.transmission>0?n.push(v):g.transparent===!0?s.push(v):e.push(v)}function c(h,f,g,y,p,d){let v=o(h,f,g,y,p,d);g.transmission>0?n.unshift(v):g.transparent===!0?s.unshift(v):e.unshift(v)}function u(h,f){e.length>1&&e.sort(h||Om),n.length>1&&n.sort(f||dh),s.length>1&&s.sort(f||dh)}function m(){for(let h=t,f=i.length;h<f;h++){let g=i[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:m,sort:u}}function Bm(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new fh,i.set(n,[a])):s>=r.length?(a=new fh,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function zm(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new z,color:new Yt};break;case"SpotLight":e={position:new z,direction:new z,color:new Yt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new z,color:new Yt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new z,skyColor:new Yt,groundColor:new Yt};break;case"RectAreaLight":e={color:new Yt,position:new z,halfWidth:new z,halfHeight:new z};break}return i[t.id]=e,e}}}function km(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Qt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Vm=0;function Gm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Hm(i){let t=new zm,e=km(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new z);let s=new z,r=new re,a=new re;function o(c){let u=0,m=0,h=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let f=0,g=0,y=0,p=0,d=0,v=0,M=0,w=0,E=0,A=0,R=0;c.sort(Gm);for(let b=0,D=c.length;b<D;b++){let I=c[b],O=I.color,B=I.intensity,G=I.distance,H=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===si?H=I.shadow.map.texture:H=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)u+=O.r*B,m+=O.g*B,h+=O.b*B;else if(I.isLightProbe){for(let N=0;N<9;N++)n.probe[N].addScaledVector(I.sh.coefficients[N],B);R++}else if(I.isDirectionalLight){let N=t.get(I);if(N.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let k=I.shadow,rt=e.get(I);rt.shadowIntensity=k.intensity,rt.shadowBias=k.bias,rt.shadowNormalBias=k.normalBias,rt.shadowRadius=k.radius,rt.shadowMapSize=k.mapSize,n.directionalShadow[f]=rt,n.directionalShadowMap[f]=H,n.directionalShadowMatrix[f]=I.shadow.matrix,v++}n.directional[f]=N,f++}else if(I.isSpotLight){let N=t.get(I);N.position.setFromMatrixPosition(I.matrixWorld),N.color.copy(O).multiplyScalar(B),N.distance=G,N.coneCos=Math.cos(I.angle),N.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),N.decay=I.decay,n.spot[y]=N;let k=I.shadow;if(I.map&&(n.spotLightMap[E]=I.map,E++,k.updateMatrices(I),I.castShadow&&A++),n.spotLightMatrix[y]=k.matrix,I.castShadow){let rt=e.get(I);rt.shadowIntensity=k.intensity,rt.shadowBias=k.bias,rt.shadowNormalBias=k.normalBias,rt.shadowRadius=k.radius,rt.shadowMapSize=k.mapSize,n.spotShadow[y]=rt,n.spotShadowMap[y]=H,w++}y++}else if(I.isRectAreaLight){let N=t.get(I);N.color.copy(O).multiplyScalar(B),N.halfWidth.set(I.width*.5,0,0),N.halfHeight.set(0,I.height*.5,0),n.rectArea[p]=N,p++}else if(I.isPointLight){let N=t.get(I);if(N.color.copy(I.color).multiplyScalar(I.intensity),N.distance=I.distance,N.decay=I.decay,I.castShadow){let k=I.shadow,rt=e.get(I);rt.shadowIntensity=k.intensity,rt.shadowBias=k.bias,rt.shadowNormalBias=k.normalBias,rt.shadowRadius=k.radius,rt.shadowMapSize=k.mapSize,rt.shadowCameraNear=k.camera.near,rt.shadowCameraFar=k.camera.far,n.pointShadow[g]=rt,n.pointShadowMap[g]=H,n.pointShadowMatrix[g]=I.shadow.matrix,M++}n.point[g]=N,g++}else if(I.isHemisphereLight){let N=t.get(I);N.skyColor.copy(I.color).multiplyScalar(B),N.groundColor.copy(I.groundColor).multiplyScalar(B),n.hemi[d]=N,d++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ut.LTC_FLOAT_1,n.rectAreaLTC2=ut.LTC_FLOAT_2):(n.rectAreaLTC1=ut.LTC_HALF_1,n.rectAreaLTC2=ut.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=m,n.ambient[2]=h;let _=n.hash;(_.directionalLength!==f||_.pointLength!==g||_.spotLength!==y||_.rectAreaLength!==p||_.hemiLength!==d||_.numDirectionalShadows!==v||_.numPointShadows!==M||_.numSpotShadows!==w||_.numSpotMaps!==E||_.numLightProbes!==R)&&(n.directional.length=f,n.spot.length=y,n.rectArea.length=p,n.point.length=g,n.hemi.length=d,n.directionalShadow.length=v,n.directionalShadowMap.length=v,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=w,n.spotShadowMap.length=w,n.directionalShadowMatrix.length=v,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=w+E-A,n.spotLightMap.length=E,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=R,_.directionalLength=f,_.pointLength=g,_.spotLength=y,_.rectAreaLength=p,_.hemiLength=d,_.numDirectionalShadows=v,_.numPointShadows=M,_.numSpotShadows=w,_.numSpotMaps=E,_.numLightProbes=R,n.version=Vm++)}function l(c,u){let m=0,h=0,f=0,g=0,y=0,p=u.matrixWorldInverse;for(let d=0,v=c.length;d<v;d++){let M=c[d];if(M.isDirectionalLight){let w=n.directional[m];w.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(p),m++}else if(M.isSpotLight){let w=n.spot[f];w.position.setFromMatrixPosition(M.matrixWorld),w.position.applyMatrix4(p),w.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(p),f++}else if(M.isRectAreaLight){let w=n.rectArea[g];w.position.setFromMatrixPosition(M.matrixWorld),w.position.applyMatrix4(p),a.identity(),r.copy(M.matrixWorld),r.premultiply(p),a.extractRotation(r),w.halfWidth.set(M.width*.5,0,0),w.halfHeight.set(0,M.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),g++}else if(M.isPointLight){let w=n.point[h];w.position.setFromMatrixPosition(M.matrixWorld),w.position.applyMatrix4(p),h++}else if(M.isHemisphereLight){let w=n.hemi[y];w.direction.setFromMatrixPosition(M.matrixWorld),w.direction.transformDirection(p),y++}}}return{setup:o,setupView:l,state:n}}function ph(i){let t=new Hm(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function a(u){n.push(u)}function o(){t.setup(e)}function l(u){t.setupView(e,u)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function Wm(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new ph(i),t.set(s,[o])):r>=a.length?(o=new ph(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var Xm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,qm=`uniform sampler2D shadow_pass;
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
}`,Ym=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],$m=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],mh=new re,Is=new z,hl=new z;function Zm(i,t,e){let n=new hs,s=new Qt,r=new Qt,a=new he,o=new Lr,l=new Dr,c={},u=e.maxTextureSize,m={[bn]:De,[De]:bn,[He]:He},h=new Re({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Qt},radius:{value:4}},vertexShader:Xm,fragmentShader:qm}),f=h.clone();f.defines.HORIZONTAL_PASS=1;let g=new Le;g.setAttribute("position",new me(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new we(g,h),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=vs;let d=this.type;this.render=function(A,R,_){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;this.type===hc&&(Lt("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=vs);let b=i.getRenderTarget(),D=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),O=i.state;O.setBlending(un),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let B=d!==this.type;B&&R.traverse(function(G){G.material&&(Array.isArray(G.material)?G.material.forEach(H=>H.needsUpdate=!0):G.material.needsUpdate=!0)});for(let G=0,H=A.length;G<H;G++){let N=A[G],k=N.shadow;if(k===void 0){Lt("WebGLShadowMap:",N,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;s.copy(k.mapSize);let rt=k.getFrameExtents();s.multiply(rt),r.copy(k.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/rt.x),s.x=r.x*rt.x,k.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/rt.y),s.y=r.y*rt.y,k.mapSize.y=r.y));let q=i.state.buffers.depth.getReversed();if(k.camera._reversedDepth=q,k.map===null||B===!0){if(k.map!==null&&(k.map.depthTexture!==null&&(k.map.depthTexture.dispose(),k.map.depthTexture=null),k.map.dispose()),this.type===Ni){if(N.isPointLight){Lt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}k.map=new Ve(s.x,s.y,{format:si,type:dn,minFilter:be,magFilter:be,generateMipmaps:!1}),k.map.texture.name=N.name+".shadowMap",k.map.depthTexture=new zn(s.x,s.y,qe),k.map.depthTexture.name=N.name+".shadowMapDepth",k.map.depthTexture.format=an,k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=ve,k.map.depthTexture.magFilter=ve}else N.isPointLight?(k.map=new za(s.x),k.map.depthTexture=new Rr(s.x,tn)):(k.map=new Ve(s.x,s.y),k.map.depthTexture=new zn(s.x,s.y,tn)),k.map.depthTexture.name=N.name+".shadowMap",k.map.depthTexture.format=an,this.type===vs?(k.map.depthTexture.compareFunction=q?Na:Ua,k.map.depthTexture.minFilter=be,k.map.depthTexture.magFilter=be):(k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=ve,k.map.depthTexture.magFilter=ve);k.camera.updateProjectionMatrix()}let at=k.map.isWebGLCubeRenderTarget?6:1;for(let dt=0;dt<at;dt++){if(k.map.isWebGLCubeRenderTarget)i.setRenderTarget(k.map,dt),i.clear();else{dt===0&&(i.setRenderTarget(k.map),i.clear());let nt=k.getViewport(dt);a.set(r.x*nt.x,r.y*nt.y,r.x*nt.z,r.y*nt.w),O.viewport(a)}if(N.isPointLight){let nt=k.camera,vt=k.matrix,Ut=N.distance||nt.far;Ut!==nt.far&&(nt.far=Ut,nt.updateProjectionMatrix()),Is.setFromMatrixPosition(N.matrixWorld),nt.position.copy(Is),hl.copy(nt.position),hl.add(Ym[dt]),nt.up.copy($m[dt]),nt.lookAt(hl),nt.updateMatrixWorld(),vt.makeTranslation(-Is.x,-Is.y,-Is.z),mh.multiplyMatrices(nt.projectionMatrix,nt.matrixWorldInverse),k._frustum.setFromProjectionMatrix(mh,nt.coordinateSystem,nt.reversedDepth)}else k.updateMatrices(N);n=k.getFrustum(),w(R,_,k.camera,N,this.type)}k.isPointLightShadow!==!0&&this.type===Ni&&v(k,_),k.needsUpdate=!1}d=this.type,p.needsUpdate=!1,i.setRenderTarget(b,D,I)};function v(A,R){let _=t.update(y);h.defines.VSM_SAMPLES!==A.blurSamples&&(h.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,h.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Ve(s.x,s.y,{format:si,type:dn})),h.uniforms.shadow_pass.value=A.map.depthTexture,h.uniforms.resolution.value=A.mapSize,h.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(R,null,_,h,y,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(R,null,_,f,y,null)}function M(A,R,_,b){let D=null,I=_.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(I!==void 0)D=I;else if(D=_.isPointLight===!0?l:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let O=D.uuid,B=R.uuid,G=c[O];G===void 0&&(G={},c[O]=G);let H=G[B];H===void 0&&(H=D.clone(),G[B]=H,R.addEventListener("dispose",E)),D=H}if(D.visible=R.visible,D.wireframe=R.wireframe,b===Ni?D.side=R.shadowSide!==null?R.shadowSide:R.side:D.side=R.shadowSide!==null?R.shadowSide:m[R.side],D.alphaMap=R.alphaMap,D.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,D.map=R.map,D.clipShadows=R.clipShadows,D.clippingPlanes=R.clippingPlanes,D.clipIntersection=R.clipIntersection,D.displacementMap=R.displacementMap,D.displacementScale=R.displacementScale,D.displacementBias=R.displacementBias,D.wireframeLinewidth=R.wireframeLinewidth,D.linewidth=R.linewidth,_.isPointLight===!0&&D.isMeshDistanceMaterial===!0){let O=i.properties.get(D);O.light=_}return D}function w(A,R,_,b,D){if(A.visible===!1)return;if(A.layers.test(R.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&D===Ni)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,A.matrixWorld);let B=t.update(A),G=A.material;if(Array.isArray(G)){let H=B.groups;for(let N=0,k=H.length;N<k;N++){let rt=H[N],q=G[rt.materialIndex];if(q&&q.visible){let at=M(A,q,b,D);A.onBeforeShadow(i,A,R,_,B,at,rt),i.renderBufferDirect(_,null,B,at,A,rt),A.onAfterShadow(i,A,R,_,B,at,rt)}}}else if(G.visible){let H=M(A,G,b,D);A.onBeforeShadow(i,A,R,_,B,H,null),i.renderBufferDirect(_,null,B,H,A,null),A.onAfterShadow(i,A,R,_,B,H,null)}}let O=A.children;for(let B=0,G=O.length;B<G;B++)w(O[B],R,_,b,D)}function E(A){A.target.removeEventListener("dispose",E);for(let _ in c){let b=c[_],D=A.target.uuid;D in b&&(b[D].dispose(),delete b[D])}}}function Jm(i,t){function e(){let C=!1,K=new he,Q=null,j=new he(0,0,0,0);return{setMask:function(et){Q!==et&&!C&&(i.colorMask(et,et,et,et),Q=et)},setLocked:function(et){C=et},setClear:function(et,X,ht,Mt,Ot){Ot===!0&&(et*=Mt,X*=Mt,ht*=Mt),K.set(et,X,ht,Mt),j.equals(K)===!1&&(i.clearColor(et,X,ht,Mt),j.copy(K))},reset:function(){C=!1,Q=null,j.set(-1,0,0,0)}}}function n(){let C=!1,K=!1,Q=null,j=null,et=null;return{setReversed:function(X){if(K!==X){let ht=t.get("EXT_clip_control");X?ht.clipControlEXT(ht.LOWER_LEFT_EXT,ht.ZERO_TO_ONE_EXT):ht.clipControlEXT(ht.LOWER_LEFT_EXT,ht.NEGATIVE_ONE_TO_ONE_EXT),K=X;let Mt=et;et=null,this.setClear(Mt)}},getReversed:function(){return K},setTest:function(X){X?it(i.DEPTH_TEST):lt(i.DEPTH_TEST)},setMask:function(X){Q!==X&&!C&&(i.depthMask(X),Q=X)},setFunc:function(X){if(K&&(X=Wc[X]),j!==X){switch(X){case ur:i.depthFunc(i.NEVER);break;case dr:i.depthFunc(i.ALWAYS);break;case fr:i.depthFunc(i.LESS);break;case ei:i.depthFunc(i.LEQUAL);break;case pr:i.depthFunc(i.EQUAL);break;case mr:i.depthFunc(i.GEQUAL);break;case gr:i.depthFunc(i.GREATER);break;case xr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}j=X}},setLocked:function(X){C=X},setClear:function(X){et!==X&&(et=X,K&&(X=1-X),i.clearDepth(X))},reset:function(){C=!1,Q=null,j=null,et=null,K=!1}}}function s(){let C=!1,K=null,Q=null,j=null,et=null,X=null,ht=null,Mt=null,Ot=null;return{setTest:function(Jt){C||(Jt?it(i.STENCIL_TEST):lt(i.STENCIL_TEST))},setMask:function(Jt){K!==Jt&&!C&&(i.stencilMask(Jt),K=Jt)},setFunc:function(Jt,pe,Oe){(Q!==Jt||j!==pe||et!==Oe)&&(i.stencilFunc(Jt,pe,Oe),Q=Jt,j=pe,et=Oe)},setOp:function(Jt,pe,Oe){(X!==Jt||ht!==pe||Mt!==Oe)&&(i.stencilOp(Jt,pe,Oe),X=Jt,ht=pe,Mt=Oe)},setLocked:function(Jt){C=Jt},setClear:function(Jt){Ot!==Jt&&(i.clearStencil(Jt),Ot=Jt)},reset:function(){C=!1,K=null,Q=null,j=null,et=null,X=null,ht=null,Mt=null,Ot=null}}}let r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap,u={},m={},h=new WeakMap,f=[],g=null,y=!1,p=null,d=null,v=null,M=null,w=null,E=null,A=null,R=new Yt(0,0,0),_=0,b=!1,D=null,I=null,O=null,B=null,G=null,H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),N=!1,k=0,rt=i.getParameter(i.VERSION);rt.indexOf("WebGL")!==-1?(k=parseFloat(/^WebGL (\d)/.exec(rt)[1]),N=k>=1):rt.indexOf("OpenGL ES")!==-1&&(k=parseFloat(/^OpenGL ES (\d)/.exec(rt)[1]),N=k>=2);let q=null,at={},dt=i.getParameter(i.SCISSOR_BOX),nt=i.getParameter(i.VIEWPORT),vt=new he().fromArray(dt),Ut=new he().fromArray(nt);function kt(C,K,Q,j){let et=new Uint8Array(4),X=i.createTexture();i.bindTexture(C,X),i.texParameteri(C,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(C,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let ht=0;ht<Q;ht++)C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY?i.texImage3D(K,0,i.RGBA,1,1,j,0,i.RGBA,i.UNSIGNED_BYTE,et):i.texImage2D(K+ht,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,et);return X}let Z={};Z[i.TEXTURE_2D]=kt(i.TEXTURE_2D,i.TEXTURE_2D,1),Z[i.TEXTURE_CUBE_MAP]=kt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[i.TEXTURE_2D_ARRAY]=kt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Z[i.TEXTURE_3D]=kt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),it(i.DEPTH_TEST),a.setFunc(ei),Ft(!1),oe(Uo),it(i.CULL_FACE),$t(un);function it(C){u[C]!==!0&&(i.enable(C),u[C]=!0)}function lt(C){u[C]!==!1&&(i.disable(C),u[C]=!1)}function Pt(C,K){return m[C]!==K?(i.bindFramebuffer(C,K),m[C]=K,C===i.DRAW_FRAMEBUFFER&&(m[i.FRAMEBUFFER]=K),C===i.FRAMEBUFFER&&(m[i.DRAW_FRAMEBUFFER]=K),!0):!1}function xt(C,K){let Q=f,j=!1;if(C){Q=h.get(K),Q===void 0&&(Q=[],h.set(K,Q));let et=C.textures;if(Q.length!==et.length||Q[0]!==i.COLOR_ATTACHMENT0){for(let X=0,ht=et.length;X<ht;X++)Q[X]=i.COLOR_ATTACHMENT0+X;Q.length=et.length,j=!0}}else Q[0]!==i.BACK&&(Q[0]=i.BACK,j=!0);j&&i.drawBuffers(Q)}function It(C){return g!==C?(i.useProgram(C),g=C,!0):!1}let ue={[On]:i.FUNC_ADD,[dc]:i.FUNC_SUBTRACT,[fc]:i.FUNC_REVERSE_SUBTRACT};ue[pc]=i.MIN,ue[mc]=i.MAX;let Nt={[gc]:i.ZERO,[xc]:i.ONE,[_c]:i.SRC_COLOR,[cr]:i.SRC_ALPHA,[wc]:i.SRC_ALPHA_SATURATE,[Sc]:i.DST_COLOR,[vc]:i.DST_ALPHA,[yc]:i.ONE_MINUS_SRC_COLOR,[hr]:i.ONE_MINUS_SRC_ALPHA,[bc]:i.ONE_MINUS_DST_COLOR,[Mc]:i.ONE_MINUS_DST_ALPHA,[Ac]:i.CONSTANT_COLOR,[Tc]:i.ONE_MINUS_CONSTANT_COLOR,[Ec]:i.CONSTANT_ALPHA,[Cc]:i.ONE_MINUS_CONSTANT_ALPHA};function $t(C,K,Q,j,et,X,ht,Mt,Ot,Jt){if(C===un){y===!0&&(lt(i.BLEND),y=!1);return}if(y===!1&&(it(i.BLEND),y=!0),C!==uc){if(C!==p||Jt!==b){if((d!==On||w!==On)&&(i.blendEquation(i.FUNC_ADD),d=On,w=On),Jt)switch(C){case ti:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case No:i.blendFunc(i.ONE,i.ONE);break;case Fo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Oo:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Dt("WebGLState: Invalid blending: ",C);break}else switch(C){case ti:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case No:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Fo:Dt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Oo:Dt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Dt("WebGLState: Invalid blending: ",C);break}v=null,M=null,E=null,A=null,R.set(0,0,0),_=0,p=C,b=Jt}return}et=et||K,X=X||Q,ht=ht||j,(K!==d||et!==w)&&(i.blendEquationSeparate(ue[K],ue[et]),d=K,w=et),(Q!==v||j!==M||X!==E||ht!==A)&&(i.blendFuncSeparate(Nt[Q],Nt[j],Nt[X],Nt[ht]),v=Q,M=j,E=X,A=ht),(Mt.equals(R)===!1||Ot!==_)&&(i.blendColor(Mt.r,Mt.g,Mt.b,Ot),R.copy(Mt),_=Ot),p=C,b=!1}function ee(C,K){C.side===He?lt(i.CULL_FACE):it(i.CULL_FACE);let Q=C.side===De;K&&(Q=!Q),Ft(Q),C.blending===ti&&C.transparent===!1?$t(un):$t(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),a.setFunc(C.depthFunc),a.setTest(C.depthTest),a.setMask(C.depthWrite),r.setMask(C.colorWrite);let j=C.stencilWrite;o.setTest(j),j&&(o.setMask(C.stencilWriteMask),o.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),o.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),le(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?it(i.SAMPLE_ALPHA_TO_COVERAGE):lt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ft(C){D!==C&&(C?i.frontFace(i.CW):i.frontFace(i.CCW),D=C)}function oe(C){C!==lc?(it(i.CULL_FACE),C!==I&&(C===Uo?i.cullFace(i.BACK):C===cc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):lt(i.CULL_FACE),I=C}function P(C){C!==O&&(N&&i.lineWidth(C),O=C)}function le(C,K,Q){C?(it(i.POLYGON_OFFSET_FILL),(B!==K||G!==Q)&&(B=K,G=Q,a.getReversed()&&(K=-K),i.polygonOffset(K,Q))):lt(i.POLYGON_OFFSET_FILL)}function Wt(C){C?it(i.SCISSOR_TEST):lt(i.SCISSOR_TEST)}function Kt(C){C===void 0&&(C=i.TEXTURE0+H-1),q!==C&&(i.activeTexture(C),q=C)}function gt(C,K,Q){Q===void 0&&(q===null?Q=i.TEXTURE0+H-1:Q=q);let j=at[Q];j===void 0&&(j={type:void 0,texture:void 0},at[Q]=j),(j.type!==C||j.texture!==K)&&(q!==Q&&(i.activeTexture(Q),q=Q),i.bindTexture(C,K||Z[C]),j.type=C,j.texture=K)}function T(){let C=at[q];C!==void 0&&C.type!==void 0&&(i.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function x(){try{i.compressedTexImage2D(...arguments)}catch(C){Dt("WebGLState:",C)}}function U(){try{i.compressedTexImage3D(...arguments)}catch(C){Dt("WebGLState:",C)}}function J(){try{i.texSubImage2D(...arguments)}catch(C){Dt("WebGLState:",C)}}function tt(){try{i.texSubImage3D(...arguments)}catch(C){Dt("WebGLState:",C)}}function $(){try{i.compressedTexSubImage2D(...arguments)}catch(C){Dt("WebGLState:",C)}}function St(){try{i.compressedTexSubImage3D(...arguments)}catch(C){Dt("WebGLState:",C)}}function ct(){try{i.texStorage2D(...arguments)}catch(C){Dt("WebGLState:",C)}}function At(){try{i.texStorage3D(...arguments)}catch(C){Dt("WebGLState:",C)}}function Rt(){try{i.texImage2D(...arguments)}catch(C){Dt("WebGLState:",C)}}function st(){try{i.texImage3D(...arguments)}catch(C){Dt("WebGLState:",C)}}function ot(C){vt.equals(C)===!1&&(i.scissor(C.x,C.y,C.z,C.w),vt.copy(C))}function yt(C){Ut.equals(C)===!1&&(i.viewport(C.x,C.y,C.z,C.w),Ut.copy(C))}function bt(C,K){let Q=c.get(K);Q===void 0&&(Q=new WeakMap,c.set(K,Q));let j=Q.get(C);j===void 0&&(j=i.getUniformBlockIndex(K,C.name),Q.set(C,j))}function mt(C,K){let j=c.get(K).get(C);l.get(K)!==j&&(i.uniformBlockBinding(K,j,C.__bindingPointIndex),l.set(K,j))}function L(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},q=null,at={},m={},h=new WeakMap,f=[],g=null,y=!1,p=null,d=null,v=null,M=null,w=null,E=null,A=null,R=new Yt(0,0,0),_=0,b=!1,D=null,I=null,O=null,B=null,G=null,vt.set(0,0,i.canvas.width,i.canvas.height),Ut.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:it,disable:lt,bindFramebuffer:Pt,drawBuffers:xt,useProgram:It,setBlending:$t,setMaterial:ee,setFlipSided:Ft,setCullFace:oe,setLineWidth:P,setPolygonOffset:le,setScissorTest:Wt,activeTexture:Kt,bindTexture:gt,unbindTexture:T,compressedTexImage2D:x,compressedTexImage3D:U,texImage2D:Rt,texImage3D:st,updateUBOMapping:bt,uniformBlockBinding:mt,texStorage2D:ct,texStorage3D:At,texSubImage2D:J,texSubImage3D:tt,compressedTexSubImage2D:$,compressedTexSubImage3D:St,scissor:ot,viewport:yt,reset:L}}function Km(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Qt,u=new WeakMap,m,h=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,x){return f?new OffscreenCanvas(T,x):ts("canvas")}function y(T,x,U){let J=1,tt=gt(T);if((tt.width>U||tt.height>U)&&(J=U/Math.max(tt.width,tt.height)),J<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let $=Math.floor(J*tt.width),St=Math.floor(J*tt.height);m===void 0&&(m=g($,St));let ct=x?g($,St):m;return ct.width=$,ct.height=St,ct.getContext("2d").drawImage(T,0,0,$,St),Lt("WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+$+"x"+St+")."),ct}else return"data"in T&&Lt("WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),T;return T}function p(T){return T.generateMipmaps}function d(T){i.generateMipmap(T)}function v(T){return T.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?i.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(T,x,U,J,tt=!1){if(T!==null){if(i[T]!==void 0)return i[T];Lt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let $=x;if(x===i.RED&&(U===i.FLOAT&&($=i.R32F),U===i.HALF_FLOAT&&($=i.R16F),U===i.UNSIGNED_BYTE&&($=i.R8)),x===i.RED_INTEGER&&(U===i.UNSIGNED_BYTE&&($=i.R8UI),U===i.UNSIGNED_SHORT&&($=i.R16UI),U===i.UNSIGNED_INT&&($=i.R32UI),U===i.BYTE&&($=i.R8I),U===i.SHORT&&($=i.R16I),U===i.INT&&($=i.R32I)),x===i.RG&&(U===i.FLOAT&&($=i.RG32F),U===i.HALF_FLOAT&&($=i.RG16F),U===i.UNSIGNED_BYTE&&($=i.RG8)),x===i.RG_INTEGER&&(U===i.UNSIGNED_BYTE&&($=i.RG8UI),U===i.UNSIGNED_SHORT&&($=i.RG16UI),U===i.UNSIGNED_INT&&($=i.RG32UI),U===i.BYTE&&($=i.RG8I),U===i.SHORT&&($=i.RG16I),U===i.INT&&($=i.RG32I)),x===i.RGB_INTEGER&&(U===i.UNSIGNED_BYTE&&($=i.RGB8UI),U===i.UNSIGNED_SHORT&&($=i.RGB16UI),U===i.UNSIGNED_INT&&($=i.RGB32UI),U===i.BYTE&&($=i.RGB8I),U===i.SHORT&&($=i.RGB16I),U===i.INT&&($=i.RGB32I)),x===i.RGBA_INTEGER&&(U===i.UNSIGNED_BYTE&&($=i.RGBA8UI),U===i.UNSIGNED_SHORT&&($=i.RGBA16UI),U===i.UNSIGNED_INT&&($=i.RGBA32UI),U===i.BYTE&&($=i.RGBA8I),U===i.SHORT&&($=i.RGBA16I),U===i.INT&&($=i.RGBA32I)),x===i.RGB&&(U===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),U===i.UNSIGNED_INT_10F_11F_11F_REV&&($=i.R11F_G11F_B10F)),x===i.RGBA){let St=tt?ji:Zt.getTransfer(J);U===i.FLOAT&&($=i.RGBA32F),U===i.HALF_FLOAT&&($=i.RGBA16F),U===i.UNSIGNED_BYTE&&($=St===te?i.SRGB8_ALPHA8:i.RGBA8),U===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),U===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&t.get("EXT_color_buffer_float"),$}function w(T,x){let U;return T?x===null||x===tn||x===Oi?U=i.DEPTH24_STENCIL8:x===qe?U=i.DEPTH32F_STENCIL8:x===Fi&&(U=i.DEPTH24_STENCIL8,Lt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===tn||x===Oi?U=i.DEPTH_COMPONENT24:x===qe?U=i.DEPTH_COMPONENT32F:x===Fi&&(U=i.DEPTH_COMPONENT16),U}function E(T,x){return p(T)===!0||T.isFramebufferTexture&&T.minFilter!==ve&&T.minFilter!==be?Math.log2(Math.max(x.width,x.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?x.mipmaps.length:1}function A(T){let x=T.target;x.removeEventListener("dispose",A),_(x),x.isVideoTexture&&u.delete(x)}function R(T){let x=T.target;x.removeEventListener("dispose",R),D(x)}function _(T){let x=n.get(T);if(x.__webglInit===void 0)return;let U=T.source,J=h.get(U);if(J){let tt=J[x.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&b(T),Object.keys(J).length===0&&h.delete(U)}n.remove(T)}function b(T){let x=n.get(T);i.deleteTexture(x.__webglTexture);let U=T.source,J=h.get(U);delete J[x.__cacheKey],a.memory.textures--}function D(T){let x=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(x.__webglFramebuffer[J]))for(let tt=0;tt<x.__webglFramebuffer[J].length;tt++)i.deleteFramebuffer(x.__webglFramebuffer[J][tt]);else i.deleteFramebuffer(x.__webglFramebuffer[J]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[J])}else{if(Array.isArray(x.__webglFramebuffer))for(let J=0;J<x.__webglFramebuffer.length;J++)i.deleteFramebuffer(x.__webglFramebuffer[J]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let J=0;J<x.__webglColorRenderbuffer.length;J++)x.__webglColorRenderbuffer[J]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[J]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let U=T.textures;for(let J=0,tt=U.length;J<tt;J++){let $=n.get(U[J]);$.__webglTexture&&(i.deleteTexture($.__webglTexture),a.memory.textures--),n.remove(U[J])}n.remove(T)}let I=0;function O(){I=0}function B(){let T=I;return T>=s.maxTextures&&Lt("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),I+=1,T}function G(T){let x=[];return x.push(T.wrapS),x.push(T.wrapT),x.push(T.wrapR||0),x.push(T.magFilter),x.push(T.minFilter),x.push(T.anisotropy),x.push(T.internalFormat),x.push(T.format),x.push(T.type),x.push(T.generateMipmaps),x.push(T.premultiplyAlpha),x.push(T.flipY),x.push(T.unpackAlignment),x.push(T.colorSpace),x.join()}function H(T,x){let U=n.get(T);if(T.isVideoTexture&&Wt(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&U.__version!==T.version){let J=T.image;if(J===null)Lt("WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)Lt("WebGLRenderer: Texture marked for update but image is incomplete");else{Z(U,T,x);return}}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,U.__webglTexture,i.TEXTURE0+x)}function N(T,x){let U=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Z(U,T,x);return}else T.isExternalTexture&&(U.__webglTexture=T.sourceTexture?T.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,U.__webglTexture,i.TEXTURE0+x)}function k(T,x){let U=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&U.__version!==T.version){Z(U,T,x);return}e.bindTexture(i.TEXTURE_3D,U.__webglTexture,i.TEXTURE0+x)}function rt(T,x){let U=n.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&U.__version!==T.version){it(U,T,x);return}e.bindTexture(i.TEXTURE_CUBE_MAP,U.__webglTexture,i.TEXTURE0+x)}let q={[_r]:i.REPEAT,[rn]:i.CLAMP_TO_EDGE,[yr]:i.MIRRORED_REPEAT},at={[ve]:i.NEAREST,[Pc]:i.NEAREST_MIPMAP_NEAREST,[Ss]:i.NEAREST_MIPMAP_LINEAR,[be]:i.LINEAR,[$r]:i.LINEAR_MIPMAP_NEAREST,[Wn]:i.LINEAR_MIPMAP_LINEAR},dt={[Nc]:i.NEVER,[kc]:i.ALWAYS,[Fc]:i.LESS,[Ua]:i.LEQUAL,[Oc]:i.EQUAL,[Na]:i.GEQUAL,[Bc]:i.GREATER,[zc]:i.NOTEQUAL};function nt(T,x){if(x.type===qe&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===be||x.magFilter===$r||x.magFilter===Ss||x.magFilter===Wn||x.minFilter===be||x.minFilter===$r||x.minFilter===Ss||x.minFilter===Wn)&&Lt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(T,i.TEXTURE_WRAP_S,q[x.wrapS]),i.texParameteri(T,i.TEXTURE_WRAP_T,q[x.wrapT]),(T===i.TEXTURE_3D||T===i.TEXTURE_2D_ARRAY)&&i.texParameteri(T,i.TEXTURE_WRAP_R,q[x.wrapR]),i.texParameteri(T,i.TEXTURE_MAG_FILTER,at[x.magFilter]),i.texParameteri(T,i.TEXTURE_MIN_FILTER,at[x.minFilter]),x.compareFunction&&(i.texParameteri(T,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(T,i.TEXTURE_COMPARE_FUNC,dt[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===ve||x.minFilter!==Ss&&x.minFilter!==Wn||x.type===qe&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){let U=t.get("EXT_texture_filter_anisotropic");i.texParameterf(T,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function vt(T,x){let U=!1;T.__webglInit===void 0&&(T.__webglInit=!0,x.addEventListener("dispose",A));let J=x.source,tt=h.get(J);tt===void 0&&(tt={},h.set(J,tt));let $=G(x);if($!==T.__cacheKey){tt[$]===void 0&&(tt[$]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,U=!0),tt[$].usedTimes++;let St=tt[T.__cacheKey];St!==void 0&&(tt[T.__cacheKey].usedTimes--,St.usedTimes===0&&b(x)),T.__cacheKey=$,T.__webglTexture=tt[$].texture}return U}function Ut(T,x,U){return Math.floor(Math.floor(T/U)/x)}function kt(T,x,U,J){let $=T.updateRanges;if($.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,x.width,x.height,U,J,x.data);else{$.sort((st,ot)=>st.start-ot.start);let St=0;for(let st=1;st<$.length;st++){let ot=$[St],yt=$[st],bt=ot.start+ot.count,mt=Ut(yt.start,x.width,4),L=Ut(ot.start,x.width,4);yt.start<=bt+1&&mt===L&&Ut(yt.start+yt.count-1,x.width,4)===mt?ot.count=Math.max(ot.count,yt.start+yt.count-ot.start):(++St,$[St]=yt)}$.length=St+1;let ct=i.getParameter(i.UNPACK_ROW_LENGTH),At=i.getParameter(i.UNPACK_SKIP_PIXELS),Rt=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,x.width);for(let st=0,ot=$.length;st<ot;st++){let yt=$[st],bt=Math.floor(yt.start/4),mt=Math.ceil(yt.count/4),L=bt%x.width,C=Math.floor(bt/x.width),K=mt,Q=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,L),i.pixelStorei(i.UNPACK_SKIP_ROWS,C),e.texSubImage2D(i.TEXTURE_2D,0,L,C,K,Q,U,J,x.data)}T.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,ct),i.pixelStorei(i.UNPACK_SKIP_PIXELS,At),i.pixelStorei(i.UNPACK_SKIP_ROWS,Rt)}}function Z(T,x,U){let J=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(J=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(J=i.TEXTURE_3D);let tt=vt(T,x),$=x.source;e.bindTexture(J,T.__webglTexture,i.TEXTURE0+U);let St=n.get($);if($.version!==St.__version||tt===!0){e.activeTexture(i.TEXTURE0+U);let ct=Zt.getPrimaries(Zt.workingColorSpace),At=x.colorSpace===Tn?null:Zt.getPrimaries(x.colorSpace),Rt=x.colorSpace===Tn||ct===At?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Rt);let st=y(x.image,!1,s.maxTextureSize);st=Kt(x,st);let ot=r.convert(x.format,x.colorSpace),yt=r.convert(x.type),bt=M(x.internalFormat,ot,yt,x.colorSpace,x.isVideoTexture);nt(J,x);let mt,L=x.mipmaps,C=x.isVideoTexture!==!0,K=St.__version===void 0||tt===!0,Q=$.dataReady,j=E(x,st);if(x.isDepthTexture)bt=w(x.format===Xn,x.type),K&&(C?e.texStorage2D(i.TEXTURE_2D,1,bt,st.width,st.height):e.texImage2D(i.TEXTURE_2D,0,bt,st.width,st.height,0,ot,yt,null));else if(x.isDataTexture)if(L.length>0){C&&K&&e.texStorage2D(i.TEXTURE_2D,j,bt,L[0].width,L[0].height);for(let et=0,X=L.length;et<X;et++)mt=L[et],C?Q&&e.texSubImage2D(i.TEXTURE_2D,et,0,0,mt.width,mt.height,ot,yt,mt.data):e.texImage2D(i.TEXTURE_2D,et,bt,mt.width,mt.height,0,ot,yt,mt.data);x.generateMipmaps=!1}else C?(K&&e.texStorage2D(i.TEXTURE_2D,j,bt,st.width,st.height),Q&&kt(x,st,ot,yt)):e.texImage2D(i.TEXTURE_2D,0,bt,st.width,st.height,0,ot,yt,st.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){C&&K&&e.texStorage3D(i.TEXTURE_2D_ARRAY,j,bt,L[0].width,L[0].height,st.depth);for(let et=0,X=L.length;et<X;et++)if(mt=L[et],x.format!==Ye)if(ot!==null)if(C){if(Q)if(x.layerUpdates.size>0){let ht=sl(mt.width,mt.height,x.format,x.type);for(let Mt of x.layerUpdates){let Ot=mt.data.subarray(Mt*ht/mt.data.BYTES_PER_ELEMENT,(Mt+1)*ht/mt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,et,0,0,Mt,mt.width,mt.height,1,ot,Ot)}x.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,et,0,0,0,mt.width,mt.height,st.depth,ot,mt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,et,bt,mt.width,mt.height,st.depth,0,mt.data,0,0);else Lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else C?Q&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,et,0,0,0,mt.width,mt.height,st.depth,ot,yt,mt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,et,bt,mt.width,mt.height,st.depth,0,ot,yt,mt.data)}else{C&&K&&e.texStorage2D(i.TEXTURE_2D,j,bt,L[0].width,L[0].height);for(let et=0,X=L.length;et<X;et++)mt=L[et],x.format!==Ye?ot!==null?C?Q&&e.compressedTexSubImage2D(i.TEXTURE_2D,et,0,0,mt.width,mt.height,ot,mt.data):e.compressedTexImage2D(i.TEXTURE_2D,et,bt,mt.width,mt.height,0,mt.data):Lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):C?Q&&e.texSubImage2D(i.TEXTURE_2D,et,0,0,mt.width,mt.height,ot,yt,mt.data):e.texImage2D(i.TEXTURE_2D,et,bt,mt.width,mt.height,0,ot,yt,mt.data)}else if(x.isDataArrayTexture)if(C){if(K&&e.texStorage3D(i.TEXTURE_2D_ARRAY,j,bt,st.width,st.height,st.depth),Q)if(x.layerUpdates.size>0){let et=sl(st.width,st.height,x.format,x.type);for(let X of x.layerUpdates){let ht=st.data.subarray(X*et/st.data.BYTES_PER_ELEMENT,(X+1)*et/st.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,X,st.width,st.height,1,ot,yt,ht)}x.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,st.width,st.height,st.depth,ot,yt,st.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,bt,st.width,st.height,st.depth,0,ot,yt,st.data);else if(x.isData3DTexture)C?(K&&e.texStorage3D(i.TEXTURE_3D,j,bt,st.width,st.height,st.depth),Q&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,st.width,st.height,st.depth,ot,yt,st.data)):e.texImage3D(i.TEXTURE_3D,0,bt,st.width,st.height,st.depth,0,ot,yt,st.data);else if(x.isFramebufferTexture){if(K)if(C)e.texStorage2D(i.TEXTURE_2D,j,bt,st.width,st.height);else{let et=st.width,X=st.height;for(let ht=0;ht<j;ht++)e.texImage2D(i.TEXTURE_2D,ht,bt,et,X,0,ot,yt,null),et>>=1,X>>=1}}else if(L.length>0){if(C&&K){let et=gt(L[0]);e.texStorage2D(i.TEXTURE_2D,j,bt,et.width,et.height)}for(let et=0,X=L.length;et<X;et++)mt=L[et],C?Q&&e.texSubImage2D(i.TEXTURE_2D,et,0,0,ot,yt,mt):e.texImage2D(i.TEXTURE_2D,et,bt,ot,yt,mt);x.generateMipmaps=!1}else if(C){if(K){let et=gt(st);e.texStorage2D(i.TEXTURE_2D,j,bt,et.width,et.height)}Q&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ot,yt,st)}else e.texImage2D(i.TEXTURE_2D,0,bt,ot,yt,st);p(x)&&d(J),St.__version=$.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function it(T,x,U){if(x.image.length!==6)return;let J=vt(T,x),tt=x.source;e.bindTexture(i.TEXTURE_CUBE_MAP,T.__webglTexture,i.TEXTURE0+U);let $=n.get(tt);if(tt.version!==$.__version||J===!0){e.activeTexture(i.TEXTURE0+U);let St=Zt.getPrimaries(Zt.workingColorSpace),ct=x.colorSpace===Tn?null:Zt.getPrimaries(x.colorSpace),At=x.colorSpace===Tn||St===ct?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,At);let Rt=x.isCompressedTexture||x.image[0].isCompressedTexture,st=x.image[0]&&x.image[0].isDataTexture,ot=[];for(let X=0;X<6;X++)!Rt&&!st?ot[X]=y(x.image[X],!0,s.maxCubemapSize):ot[X]=st?x.image[X].image:x.image[X],ot[X]=Kt(x,ot[X]);let yt=ot[0],bt=r.convert(x.format,x.colorSpace),mt=r.convert(x.type),L=M(x.internalFormat,bt,mt,x.colorSpace),C=x.isVideoTexture!==!0,K=$.__version===void 0||J===!0,Q=tt.dataReady,j=E(x,yt);nt(i.TEXTURE_CUBE_MAP,x);let et;if(Rt){C&&K&&e.texStorage2D(i.TEXTURE_CUBE_MAP,j,L,yt.width,yt.height);for(let X=0;X<6;X++){et=ot[X].mipmaps;for(let ht=0;ht<et.length;ht++){let Mt=et[ht];x.format!==Ye?bt!==null?C?Q&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht,0,0,Mt.width,Mt.height,bt,Mt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht,L,Mt.width,Mt.height,0,Mt.data):Lt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):C?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht,0,0,Mt.width,Mt.height,bt,mt,Mt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht,L,Mt.width,Mt.height,0,bt,mt,Mt.data)}}}else{if(et=x.mipmaps,C&&K){et.length>0&&j++;let X=gt(ot[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,j,L,X.width,X.height)}for(let X=0;X<6;X++)if(st){C?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,ot[X].width,ot[X].height,bt,mt,ot[X].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,L,ot[X].width,ot[X].height,0,bt,mt,ot[X].data);for(let ht=0;ht<et.length;ht++){let Ot=et[ht].image[X].image;C?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht+1,0,0,Ot.width,Ot.height,bt,mt,Ot.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht+1,L,Ot.width,Ot.height,0,bt,mt,Ot.data)}}else{C?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,0,0,bt,mt,ot[X]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0,L,bt,mt,ot[X]);for(let ht=0;ht<et.length;ht++){let Mt=et[ht];C?Q&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht+1,0,0,bt,mt,Mt.image[X]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+X,ht+1,L,bt,mt,Mt.image[X])}}}p(x)&&d(i.TEXTURE_CUBE_MAP),$.__version=tt.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function lt(T,x,U,J,tt,$){let St=r.convert(U.format,U.colorSpace),ct=r.convert(U.type),At=M(U.internalFormat,St,ct,U.colorSpace),Rt=n.get(x),st=n.get(U);if(st.__renderTarget=x,!Rt.__hasExternalTextures){let ot=Math.max(1,x.width>>$),yt=Math.max(1,x.height>>$);tt===i.TEXTURE_3D||tt===i.TEXTURE_2D_ARRAY?e.texImage3D(tt,$,At,ot,yt,x.depth,0,St,ct,null):e.texImage2D(tt,$,At,ot,yt,0,St,ct,null)}e.bindFramebuffer(i.FRAMEBUFFER,T),le(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,tt,st.__webglTexture,0,P(x)):(tt===i.TEXTURE_2D||tt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,J,tt,st.__webglTexture,$),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Pt(T,x,U){if(i.bindRenderbuffer(i.RENDERBUFFER,T),x.depthBuffer){let J=x.depthTexture,tt=J&&J.isDepthTexture?J.type:null,$=w(x.stencilBuffer,tt),St=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;le(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,P(x),$,x.width,x.height):U?i.renderbufferStorageMultisample(i.RENDERBUFFER,P(x),$,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,$,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,St,i.RENDERBUFFER,T)}else{let J=x.textures;for(let tt=0;tt<J.length;tt++){let $=J[tt],St=r.convert($.format,$.colorSpace),ct=r.convert($.type),At=M($.internalFormat,St,ct,$.colorSpace);le(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,P(x),At,x.width,x.height):U?i.renderbufferStorageMultisample(i.RENDERBUFFER,P(x),At,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,At,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function xt(T,x,U){let J=x.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,T),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let tt=n.get(x.depthTexture);if(tt.__renderTarget=x,(!tt.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),J){if(tt.__webglInit===void 0&&(tt.__webglInit=!0,x.depthTexture.addEventListener("dispose",A)),tt.__webglTexture===void 0){tt.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,tt.__webglTexture),nt(i.TEXTURE_CUBE_MAP,x.depthTexture);let Rt=r.convert(x.depthTexture.format),st=r.convert(x.depthTexture.type),ot;x.depthTexture.format===an?ot=i.DEPTH_COMPONENT24:x.depthTexture.format===Xn&&(ot=i.DEPTH24_STENCIL8);for(let yt=0;yt<6;yt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+yt,0,ot,x.width,x.height,0,Rt,st,null)}}else H(x.depthTexture,0);let $=tt.__webglTexture,St=P(x),ct=J?i.TEXTURE_CUBE_MAP_POSITIVE_X+U:i.TEXTURE_2D,At=x.depthTexture.format===Xn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(x.depthTexture.format===an)le(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,At,ct,$,0,St):i.framebufferTexture2D(i.FRAMEBUFFER,At,ct,$,0);else if(x.depthTexture.format===Xn)le(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,At,ct,$,0,St):i.framebufferTexture2D(i.FRAMEBUFFER,At,ct,$,0);else throw new Error("Unknown depthTexture format")}function It(T){let x=n.get(T),U=T.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==T.depthTexture){let J=T.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),J){let tt=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,J.removeEventListener("dispose",tt)};J.addEventListener("dispose",tt),x.__depthDisposeCallback=tt}x.__boundDepthTexture=J}if(T.depthTexture&&!x.__autoAllocateDepthBuffer)if(U)for(let J=0;J<6;J++)xt(x.__webglFramebuffer[J],T,J);else{let J=T.texture.mipmaps;J&&J.length>0?xt(x.__webglFramebuffer[0],T,0):xt(x.__webglFramebuffer,T,0)}else if(U){x.__webglDepthbuffer=[];for(let J=0;J<6;J++)if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[J]),x.__webglDepthbuffer[J]===void 0)x.__webglDepthbuffer[J]=i.createRenderbuffer(),Pt(x.__webglDepthbuffer[J],T,!1);else{let tt=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=x.__webglDepthbuffer[J];i.bindRenderbuffer(i.RENDERBUFFER,$),i.framebufferRenderbuffer(i.FRAMEBUFFER,tt,i.RENDERBUFFER,$)}}else{let J=T.texture.mipmaps;if(J&&J.length>0?e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),Pt(x.__webglDepthbuffer,T,!1);else{let tt=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,$),i.framebufferRenderbuffer(i.FRAMEBUFFER,tt,i.RENDERBUFFER,$)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function ue(T,x,U){let J=n.get(T);x!==void 0&&lt(J.__webglFramebuffer,T,T.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),U!==void 0&&It(T)}function Nt(T){let x=T.texture,U=n.get(T),J=n.get(x);T.addEventListener("dispose",R);let tt=T.textures,$=T.isWebGLCubeRenderTarget===!0,St=tt.length>1;if(St||(J.__webglTexture===void 0&&(J.__webglTexture=i.createTexture()),J.__version=x.version,a.memory.textures++),$){U.__webglFramebuffer=[];for(let ct=0;ct<6;ct++)if(x.mipmaps&&x.mipmaps.length>0){U.__webglFramebuffer[ct]=[];for(let At=0;At<x.mipmaps.length;At++)U.__webglFramebuffer[ct][At]=i.createFramebuffer()}else U.__webglFramebuffer[ct]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){U.__webglFramebuffer=[];for(let ct=0;ct<x.mipmaps.length;ct++)U.__webglFramebuffer[ct]=i.createFramebuffer()}else U.__webglFramebuffer=i.createFramebuffer();if(St)for(let ct=0,At=tt.length;ct<At;ct++){let Rt=n.get(tt[ct]);Rt.__webglTexture===void 0&&(Rt.__webglTexture=i.createTexture(),a.memory.textures++)}if(T.samples>0&&le(T)===!1){U.__webglMultisampledFramebuffer=i.createFramebuffer(),U.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let ct=0;ct<tt.length;ct++){let At=tt[ct];U.__webglColorRenderbuffer[ct]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,U.__webglColorRenderbuffer[ct]);let Rt=r.convert(At.format,At.colorSpace),st=r.convert(At.type),ot=M(At.internalFormat,Rt,st,At.colorSpace,T.isXRRenderTarget===!0),yt=P(T);i.renderbufferStorageMultisample(i.RENDERBUFFER,yt,ot,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,U.__webglColorRenderbuffer[ct])}i.bindRenderbuffer(i.RENDERBUFFER,null),T.depthBuffer&&(U.__webglDepthRenderbuffer=i.createRenderbuffer(),Pt(U.__webglDepthRenderbuffer,T,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if($){e.bindTexture(i.TEXTURE_CUBE_MAP,J.__webglTexture),nt(i.TEXTURE_CUBE_MAP,x);for(let ct=0;ct<6;ct++)if(x.mipmaps&&x.mipmaps.length>0)for(let At=0;At<x.mipmaps.length;At++)lt(U.__webglFramebuffer[ct][At],T,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,At);else lt(U.__webglFramebuffer[ct],T,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0);p(x)&&d(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(St){for(let ct=0,At=tt.length;ct<At;ct++){let Rt=tt[ct],st=n.get(Rt),ot=i.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ot=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ot,st.__webglTexture),nt(ot,Rt),lt(U.__webglFramebuffer,T,Rt,i.COLOR_ATTACHMENT0+ct,ot,0),p(Rt)&&d(ot)}e.unbindTexture()}else{let ct=i.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ct=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ct,J.__webglTexture),nt(ct,x),x.mipmaps&&x.mipmaps.length>0)for(let At=0;At<x.mipmaps.length;At++)lt(U.__webglFramebuffer[At],T,x,i.COLOR_ATTACHMENT0,ct,At);else lt(U.__webglFramebuffer,T,x,i.COLOR_ATTACHMENT0,ct,0);p(x)&&d(ct),e.unbindTexture()}T.depthBuffer&&It(T)}function $t(T){let x=T.textures;for(let U=0,J=x.length;U<J;U++){let tt=x[U];if(p(tt)){let $=v(T),St=n.get(tt).__webglTexture;e.bindTexture($,St),d($),e.unbindTexture()}}}let ee=[],Ft=[];function oe(T){if(T.samples>0){if(le(T)===!1){let x=T.textures,U=T.width,J=T.height,tt=i.COLOR_BUFFER_BIT,$=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,St=n.get(T),ct=x.length>1;if(ct)for(let Rt=0;Rt<x.length;Rt++)e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,St.__webglMultisampledFramebuffer);let At=T.texture.mipmaps;At&&At.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglFramebuffer);for(let Rt=0;Rt<x.length;Rt++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(tt|=i.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(tt|=i.STENCIL_BUFFER_BIT)),ct){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,St.__webglColorRenderbuffer[Rt]);let st=n.get(x[Rt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,st,0)}i.blitFramebuffer(0,0,U,J,0,0,U,J,tt,i.NEAREST),l===!0&&(ee.length=0,Ft.length=0,ee.push(i.COLOR_ATTACHMENT0+Rt),T.depthBuffer&&T.resolveDepthBuffer===!1&&(ee.push($),Ft.push($),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ft)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ee))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ct)for(let Rt=0;Rt<x.length;Rt++){e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.RENDERBUFFER,St.__webglColorRenderbuffer[Rt]);let st=n.get(x[Rt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Rt,i.TEXTURE_2D,st,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&l){let x=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function P(T){return Math.min(s.maxSamples,T.samples)}function le(T){let x=n.get(T);return T.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Wt(T){let x=a.render.frame;u.get(T)!==x&&(u.set(T,x),T.update())}function Kt(T,x){let U=T.colorSpace,J=T.format,tt=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||U!==ni&&U!==Tn&&(Zt.getTransfer(U)===te?(J!==Ye||tt!==We)&&Lt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Dt("WebGLTextures: Unsupported texture color space:",U)),x}function gt(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=B,this.resetTextureUnits=O,this.setTexture2D=H,this.setTexture2DArray=N,this.setTexture3D=k,this.setTextureCube=rt,this.rebindTextures=ue,this.setupRenderTarget=Nt,this.updateRenderTargetMipmap=$t,this.updateMultisampleRenderTarget=oe,this.setupDepthRenderbuffer=It,this.setupFrameBufferTexture=lt,this.useMultisampledRTT=le,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function jm(i,t){function e(n,s=Tn){let r,a=Zt.getTransfer(s);if(n===We)return i.UNSIGNED_BYTE;if(n===Jr)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Kr)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Zo)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Jo)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Yo)return i.BYTE;if(n===$o)return i.SHORT;if(n===Fi)return i.UNSIGNED_SHORT;if(n===Zr)return i.INT;if(n===tn)return i.UNSIGNED_INT;if(n===qe)return i.FLOAT;if(n===dn)return i.HALF_FLOAT;if(n===Ko)return i.ALPHA;if(n===jo)return i.RGB;if(n===Ye)return i.RGBA;if(n===an)return i.DEPTH_COMPONENT;if(n===Xn)return i.DEPTH_STENCIL;if(n===jr)return i.RED;if(n===Qr)return i.RED_INTEGER;if(n===si)return i.RG;if(n===ta)return i.RG_INTEGER;if(n===ea)return i.RGBA_INTEGER;if(n===bs||n===ws||n===As||n===Ts)if(a===te)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===bs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ws)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===As)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ts)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===bs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ws)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===As)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ts)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===na||n===ia||n===sa||n===ra)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===na)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ia)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===sa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ra)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===aa||n===oa||n===la||n===ca||n===ha||n===ua||n===da)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===aa||n===oa)return a===te?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===la)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===ca)return r.COMPRESSED_R11_EAC;if(n===ha)return r.COMPRESSED_SIGNED_R11_EAC;if(n===ua)return r.COMPRESSED_RG11_EAC;if(n===da)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===fa||n===pa||n===ma||n===ga||n===xa||n===_a||n===ya||n===va||n===Ma||n===Sa||n===ba||n===wa||n===Aa||n===Ta)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===fa)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===pa)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ma)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ga)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===xa)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===_a)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ya)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===va)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ma)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Sa)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ba)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===wa)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Aa)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Ta)return a===te?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ea||n===Ca||n===Ra)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Ea)return a===te?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ca)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ra)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ia||n===Pa||n===La||n===Da)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Ia)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Pa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===La)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Da)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Oi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Qm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,tg=`
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

}`,_l=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new ps(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Re({vertexShader:Qm,fragmentShader:tg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new we(new gs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},yl=class extends wn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,m=null,h=null,f=null,g=null,y=typeof XRWebGLBinding<"u",p=new _l,d={},v=e.getContextAttributes(),M=null,w=null,E=[],A=[],R=new Qt,_=null,b=new Ce;b.viewport=new he;let D=new Ce;D.viewport=new he;let I=[b,D],O=new Xr,B=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let it=E[Z];return it===void 0&&(it=new Pi,E[Z]=it),it.getTargetRaySpace()},this.getControllerGrip=function(Z){let it=E[Z];return it===void 0&&(it=new Pi,E[Z]=it),it.getGripSpace()},this.getHand=function(Z){let it=E[Z];return it===void 0&&(it=new Pi,E[Z]=it),it.getHandSpace()};function H(Z){let it=A.indexOf(Z.inputSource);if(it===-1)return;let lt=E[it];lt!==void 0&&(lt.update(Z.inputSource,Z.frame,c||a),lt.dispatchEvent({type:Z.type,data:Z.inputSource}))}function N(){s.removeEventListener("select",H),s.removeEventListener("selectstart",H),s.removeEventListener("selectend",H),s.removeEventListener("squeeze",H),s.removeEventListener("squeezestart",H),s.removeEventListener("squeezeend",H),s.removeEventListener("end",N),s.removeEventListener("inputsourceschange",k);for(let Z=0;Z<E.length;Z++){let it=A[Z];it!==null&&(A[Z]=null,E[Z].disconnect(it))}B=null,G=null,p.reset();for(let Z in d)delete d[Z];t.setRenderTarget(M),f=null,h=null,m=null,s=null,w=null,kt.stop(),n.isPresenting=!1,t.setPixelRatio(_),t.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,n.isPresenting===!0&&Lt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,n.isPresenting===!0&&Lt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){return m===null&&y&&(m=new XRWebGLBinding(s,e)),m},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Z){if(s=Z,s!==null){if(M=t.getRenderTarget(),s.addEventListener("select",H),s.addEventListener("selectstart",H),s.addEventListener("selectend",H),s.addEventListener("squeeze",H),s.addEventListener("squeezestart",H),s.addEventListener("squeezeend",H),s.addEventListener("end",N),s.addEventListener("inputsourceschange",k),v.xrCompatible!==!0&&await e.makeXRCompatible(),_=t.getPixelRatio(),t.getSize(R),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let lt=null,Pt=null,xt=null;v.depth&&(xt=v.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,lt=v.stencil?Xn:an,Pt=v.stencil?Oi:tn);let It={colorFormat:e.RGBA8,depthFormat:xt,scaleFactor:r};m=this.getBinding(),h=m.createProjectionLayer(It),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),w=new Ve(h.textureWidth,h.textureHeight,{format:Ye,type:We,depthTexture:new zn(h.textureWidth,h.textureHeight,Pt,void 0,void 0,void 0,void 0,void 0,void 0,lt),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{let lt={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,lt),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),w=new Ve(f.framebufferWidth,f.framebufferHeight,{format:Ye,type:We,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),kt.setContext(s),kt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function k(Z){for(let it=0;it<Z.removed.length;it++){let lt=Z.removed[it],Pt=A.indexOf(lt);Pt>=0&&(A[Pt]=null,E[Pt].disconnect(lt))}for(let it=0;it<Z.added.length;it++){let lt=Z.added[it],Pt=A.indexOf(lt);if(Pt===-1){for(let It=0;It<E.length;It++)if(It>=A.length){A.push(lt),Pt=It;break}else if(A[It]===null){A[It]=lt,Pt=It;break}if(Pt===-1)break}let xt=E[Pt];xt&&xt.connect(lt)}}let rt=new z,q=new z;function at(Z,it,lt){rt.setFromMatrixPosition(it.matrixWorld),q.setFromMatrixPosition(lt.matrixWorld);let Pt=rt.distanceTo(q),xt=it.projectionMatrix.elements,It=lt.projectionMatrix.elements,ue=xt[14]/(xt[10]-1),Nt=xt[14]/(xt[10]+1),$t=(xt[9]+1)/xt[5],ee=(xt[9]-1)/xt[5],Ft=(xt[8]-1)/xt[0],oe=(It[8]+1)/It[0],P=ue*Ft,le=ue*oe,Wt=Pt/(-Ft+oe),Kt=Wt*-Ft;if(it.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(Kt),Z.translateZ(Wt),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),xt[10]===-1)Z.projectionMatrix.copy(it.projectionMatrix),Z.projectionMatrixInverse.copy(it.projectionMatrixInverse);else{let gt=ue+Wt,T=Nt+Wt,x=P-Kt,U=le+(Pt-Kt),J=$t*Nt/T*gt,tt=ee*Nt/T*gt;Z.projectionMatrix.makePerspective(x,U,J,tt,gt,T),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function dt(Z,it){it===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(it.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(s===null)return;let it=Z.near,lt=Z.far;p.texture!==null&&(p.depthNear>0&&(it=p.depthNear),p.depthFar>0&&(lt=p.depthFar)),O.near=D.near=b.near=it,O.far=D.far=b.far=lt,(B!==O.near||G!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),B=O.near,G=O.far),O.layers.mask=Z.layers.mask|6,b.layers.mask=O.layers.mask&-5,D.layers.mask=O.layers.mask&-3;let Pt=Z.parent,xt=O.cameras;dt(O,Pt);for(let It=0;It<xt.length;It++)dt(xt[It],Pt);xt.length===2?at(O,b,D):O.projectionMatrix.copy(b.projectionMatrix),nt(Z,O,Pt)};function nt(Z,it,lt){lt===null?Z.matrix.copy(it.matrixWorld):(Z.matrix.copy(lt.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(it.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(it.projectionMatrix),Z.projectionMatrixInverse.copy(it.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Mr*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(h===null&&f===null))return l},this.setFoveation=function(Z){l=Z,h!==null&&(h.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(O)},this.getCameraTexture=function(Z){return d[Z]};let vt=null;function Ut(Z,it){if(u=it.getViewerPose(c||a),g=it,u!==null){let lt=u.views;f!==null&&(t.setRenderTargetFramebuffer(w,f.framebuffer),t.setRenderTarget(w));let Pt=!1;lt.length!==O.cameras.length&&(O.cameras.length=0,Pt=!0);for(let Nt=0;Nt<lt.length;Nt++){let $t=lt[Nt],ee=null;if(f!==null)ee=f.getViewport($t);else{let oe=m.getViewSubImage(h,$t);ee=oe.viewport,Nt===0&&(t.setRenderTargetTextures(w,oe.colorTexture,oe.depthStencilTexture),t.setRenderTarget(w))}let Ft=I[Nt];Ft===void 0&&(Ft=new Ce,Ft.layers.enable(Nt),Ft.viewport=new he,I[Nt]=Ft),Ft.matrix.fromArray($t.transform.matrix),Ft.matrix.decompose(Ft.position,Ft.quaternion,Ft.scale),Ft.projectionMatrix.fromArray($t.projectionMatrix),Ft.projectionMatrixInverse.copy(Ft.projectionMatrix).invert(),Ft.viewport.set(ee.x,ee.y,ee.width,ee.height),Nt===0&&(O.matrix.copy(Ft.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Pt===!0&&O.cameras.push(Ft)}let xt=s.enabledFeatures;if(xt&&xt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){m=n.getBinding();let Nt=m.getDepthInformation(lt[0]);Nt&&Nt.isValid&&Nt.texture&&p.init(Nt,s.renderState)}if(xt&&xt.includes("camera-access")&&y){t.state.unbindTexture(),m=n.getBinding();for(let Nt=0;Nt<lt.length;Nt++){let $t=lt[Nt].camera;if($t){let ee=d[$t];ee||(ee=new ps,d[$t]=ee);let Ft=m.getCameraImage($t);ee.sourceTexture=Ft}}}}for(let lt=0;lt<E.length;lt++){let Pt=A[lt],xt=E[lt];Pt!==null&&xt!==void 0&&xt.update(Pt,it,c||a)}vt&&vt(Z,it),it.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:it}),g=null}let kt=new gh;kt.setAnimationLoop(Ut),this.setAnimationLoop=function(Z){vt=Z},this.dispose=function(){}}},oi=new ln,eg=new re;function ng(i,t){function e(p,d){p.matrixAutoUpdate===!0&&p.updateMatrix(),d.value.copy(p.matrix)}function n(p,d){d.color.getRGB(p.fogColor.value,el(i)),d.isFog?(p.fogNear.value=d.near,p.fogFar.value=d.far):d.isFogExp2&&(p.fogDensity.value=d.density)}function s(p,d,v,M,w){d.isMeshBasicMaterial?r(p,d):d.isMeshLambertMaterial?(r(p,d),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(r(p,d),m(p,d)):d.isMeshPhongMaterial?(r(p,d),u(p,d),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(r(p,d),h(p,d),d.isMeshPhysicalMaterial&&f(p,d,w)):d.isMeshMatcapMaterial?(r(p,d),g(p,d)):d.isMeshDepthMaterial?r(p,d):d.isMeshDistanceMaterial?(r(p,d),y(p,d)):d.isMeshNormalMaterial?r(p,d):d.isLineBasicMaterial?(a(p,d),d.isLineDashedMaterial&&o(p,d)):d.isPointsMaterial?l(p,d,v,M):d.isSpriteMaterial?c(p,d):d.isShadowMaterial?(p.color.value.copy(d.color),p.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(p,d){p.opacity.value=d.opacity,d.color&&p.diffuse.value.copy(d.color),d.emissive&&p.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(p.map.value=d.map,e(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.bumpMap&&(p.bumpMap.value=d.bumpMap,e(d.bumpMap,p.bumpMapTransform),p.bumpScale.value=d.bumpScale,d.side===De&&(p.bumpScale.value*=-1)),d.normalMap&&(p.normalMap.value=d.normalMap,e(d.normalMap,p.normalMapTransform),p.normalScale.value.copy(d.normalScale),d.side===De&&p.normalScale.value.negate()),d.displacementMap&&(p.displacementMap.value=d.displacementMap,e(d.displacementMap,p.displacementMapTransform),p.displacementScale.value=d.displacementScale,p.displacementBias.value=d.displacementBias),d.emissiveMap&&(p.emissiveMap.value=d.emissiveMap,e(d.emissiveMap,p.emissiveMapTransform)),d.specularMap&&(p.specularMap.value=d.specularMap,e(d.specularMap,p.specularMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest);let v=t.get(d),M=v.envMap,w=v.envMapRotation;M&&(p.envMap.value=M,oi.copy(w),oi.x*=-1,oi.y*=-1,oi.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(oi.y*=-1,oi.z*=-1),p.envMapRotation.value.setFromMatrix4(eg.makeRotationFromEuler(oi)),p.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=d.reflectivity,p.ior.value=d.ior,p.refractionRatio.value=d.refractionRatio),d.lightMap&&(p.lightMap.value=d.lightMap,p.lightMapIntensity.value=d.lightMapIntensity,e(d.lightMap,p.lightMapTransform)),d.aoMap&&(p.aoMap.value=d.aoMap,p.aoMapIntensity.value=d.aoMapIntensity,e(d.aoMap,p.aoMapTransform))}function a(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,d.map&&(p.map.value=d.map,e(d.map,p.mapTransform))}function o(p,d){p.dashSize.value=d.dashSize,p.totalSize.value=d.dashSize+d.gapSize,p.scale.value=d.scale}function l(p,d,v,M){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.size.value=d.size*v,p.scale.value=M*.5,d.map&&(p.map.value=d.map,e(d.map,p.uvTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function c(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.rotation.value=d.rotation,d.map&&(p.map.value=d.map,e(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function u(p,d){p.specular.value.copy(d.specular),p.shininess.value=Math.max(d.shininess,1e-4)}function m(p,d){d.gradientMap&&(p.gradientMap.value=d.gradientMap)}function h(p,d){p.metalness.value=d.metalness,d.metalnessMap&&(p.metalnessMap.value=d.metalnessMap,e(d.metalnessMap,p.metalnessMapTransform)),p.roughness.value=d.roughness,d.roughnessMap&&(p.roughnessMap.value=d.roughnessMap,e(d.roughnessMap,p.roughnessMapTransform)),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)}function f(p,d,v){p.ior.value=d.ior,d.sheen>0&&(p.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),p.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(p.sheenColorMap.value=d.sheenColorMap,e(d.sheenColorMap,p.sheenColorMapTransform)),d.sheenRoughnessMap&&(p.sheenRoughnessMap.value=d.sheenRoughnessMap,e(d.sheenRoughnessMap,p.sheenRoughnessMapTransform))),d.clearcoat>0&&(p.clearcoat.value=d.clearcoat,p.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(p.clearcoatMap.value=d.clearcoatMap,e(d.clearcoatMap,p.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,e(d.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(p.clearcoatNormalMap.value=d.clearcoatNormalMap,e(d.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===De&&p.clearcoatNormalScale.value.negate())),d.dispersion>0&&(p.dispersion.value=d.dispersion),d.iridescence>0&&(p.iridescence.value=d.iridescence,p.iridescenceIOR.value=d.iridescenceIOR,p.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(p.iridescenceMap.value=d.iridescenceMap,e(d.iridescenceMap,p.iridescenceMapTransform)),d.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=d.iridescenceThicknessMap,e(d.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),d.transmission>0&&(p.transmission.value=d.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),d.transmissionMap&&(p.transmissionMap.value=d.transmissionMap,e(d.transmissionMap,p.transmissionMapTransform)),p.thickness.value=d.thickness,d.thicknessMap&&(p.thicknessMap.value=d.thicknessMap,e(d.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=d.attenuationDistance,p.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(p.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(p.anisotropyMap.value=d.anisotropyMap,e(d.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=d.specularIntensity,p.specularColor.value.copy(d.specularColor),d.specularColorMap&&(p.specularColorMap.value=d.specularColorMap,e(d.specularColorMap,p.specularColorMapTransform)),d.specularIntensityMap&&(p.specularIntensityMap.value=d.specularIntensityMap,e(d.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,d){d.matcap&&(p.matcap.value=d.matcap)}function y(p,d){let v=t.get(d).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function ig(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,M){let w=M.program;n.uniformBlockBinding(v,w)}function c(v,M){let w=s[v.id];w===void 0&&(g(v),w=u(v),s[v.id]=w,v.addEventListener("dispose",p));let E=M.program;n.updateUBOMapping(v,E);let A=t.render.frame;r[v.id]!==A&&(h(v),r[v.id]=A)}function u(v){let M=m();v.__bindingPointIndex=M;let w=i.createBuffer(),E=v.__size,A=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,E,A),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,w),w}function m(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return Dt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(v){let M=s[v.id],w=v.uniforms,E=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let A=0,R=w.length;A<R;A++){let _=Array.isArray(w[A])?w[A]:[w[A]];for(let b=0,D=_.length;b<D;b++){let I=_[b];if(f(I,A,b,E)===!0){let O=I.__offset,B=Array.isArray(I.value)?I.value:[I.value],G=0;for(let H=0;H<B.length;H++){let N=B[H],k=y(N);typeof N=="number"||typeof N=="boolean"?(I.__data[0]=N,i.bufferSubData(i.UNIFORM_BUFFER,O+G,I.__data)):N.isMatrix3?(I.__data[0]=N.elements[0],I.__data[1]=N.elements[1],I.__data[2]=N.elements[2],I.__data[3]=0,I.__data[4]=N.elements[3],I.__data[5]=N.elements[4],I.__data[6]=N.elements[5],I.__data[7]=0,I.__data[8]=N.elements[6],I.__data[9]=N.elements[7],I.__data[10]=N.elements[8],I.__data[11]=0):(N.toArray(I.__data,G),G+=k.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,O,I.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(v,M,w,E){let A=v.value,R=M+"_"+w;if(E[R]===void 0)return typeof A=="number"||typeof A=="boolean"?E[R]=A:E[R]=A.clone(),!0;{let _=E[R];if(typeof A=="number"||typeof A=="boolean"){if(_!==A)return E[R]=A,!0}else if(_.equals(A)===!1)return _.copy(A),!0}return!1}function g(v){let M=v.uniforms,w=0,E=16;for(let R=0,_=M.length;R<_;R++){let b=Array.isArray(M[R])?M[R]:[M[R]];for(let D=0,I=b.length;D<I;D++){let O=b[D],B=Array.isArray(O.value)?O.value:[O.value];for(let G=0,H=B.length;G<H;G++){let N=B[G],k=y(N),rt=w%E,q=rt%k.boundary,at=rt+q;w+=q,at!==0&&E-at<k.storage&&(w+=E-at),O.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=w,w+=k.storage}}}let A=w%E;return A>0&&(w+=E-A),v.__size=w,v.__cache={},this}function y(v){let M={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(M.boundary=4,M.storage=4):v.isVector2?(M.boundary=8,M.storage=8):v.isVector3||v.isColor?(M.boundary=16,M.storage=12):v.isVector4?(M.boundary=16,M.storage=16):v.isMatrix3?(M.boundary=48,M.storage=48):v.isMatrix4?(M.boundary=64,M.storage=64):v.isTexture?Lt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):Lt("WebGLRenderer: Unsupported uniform value type.",v),M}function p(v){let M=v.target;M.removeEventListener("dispose",p);let w=a.indexOf(M.__bindingPointIndex);a.splice(w,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function d(){for(let v in s)i.deleteBuffer(s[v]);a=[],s={},r={}}return{bind:l,update:c,dispose:d}}var sg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),fn=null;function rg(){return fn===null&&(fn=new os(sg,16,16,si,dn),fn.name="DFG_LUT",fn.minFilter=be,fn.magFilter=be,fn.wrapS=rn,fn.wrapT=rn,fn.generateMipmaps=!1,fn.needsUpdate=!0),fn}var ka=class{constructor(t={}){let{canvas:e=Vc(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:m=!1,reversedDepthBuffer:h=!1,outputBufferType:f=We}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;let y=f,p=new Set([ea,ta,Qr]),d=new Set([We,tn,Fi,Oi,Jr,Kr]),v=new Uint32Array(4),M=new Int32Array(4),w=null,E=null,A=[],R=[],_=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Qe,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let b=this,D=!1;this._outputColorSpace=Pe;let I=0,O=0,B=null,G=-1,H=null,N=new he,k=new he,rt=null,q=new Yt(0),at=0,dt=e.width,nt=e.height,vt=1,Ut=null,kt=null,Z=new he(0,0,dt,nt),it=new he(0,0,dt,nt),lt=!1,Pt=new hs,xt=!1,It=!1,ue=new re,Nt=new z,$t=new he,ee={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ft=!1;function oe(){return B===null?vt:1}let P=n;function le(S,F){return e.getContext(S,F)}try{let S={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:m};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"183"}`),e.addEventListener("webglcontextlost",ht,!1),e.addEventListener("webglcontextrestored",Mt,!1),e.addEventListener("webglcontextcreationerror",Ot,!1),P===null){let F="webgl2";if(P=le(F,S),P===null)throw le(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw Dt("WebGLRenderer: "+S.message),S}let Wt,Kt,gt,T,x,U,J,tt,$,St,ct,At,Rt,st,ot,yt,bt,mt,L,C,K,Q,j;function et(){Wt=new fp(P),Wt.init(),K=new jm(P,Wt),Kt=new rp(P,Wt,t,K),gt=new Jm(P,Wt),Kt.reversedDepthBuffer&&h&&gt.buffers.depth.setReversed(!0),T=new gp(P),x=new Fm,U=new Km(P,Wt,gt,x,Kt,K,T),J=new dp(b),tt=new vu(P),Q=new ip(P,tt),$=new pp(P,tt,T,Q),St=new _p(P,$,tt,Q,T),mt=new xp(P,Kt,U),ot=new ap(x),ct=new Nm(b,J,Wt,Kt,Q,ot),At=new ng(b,x),Rt=new Bm,st=new Wm(Wt),bt=new np(b,J,gt,St,g,l),yt=new Zm(b,St,Kt),j=new ig(P,T,Kt,gt),L=new sp(P,Wt,T),C=new mp(P,Wt,T),T.programs=ct.programs,b.capabilities=Kt,b.extensions=Wt,b.properties=x,b.renderLists=Rt,b.shadowMap=yt,b.state=gt,b.info=T}et(),y!==We&&(_=new vp(y,e.width,e.height,s,r));let X=new yl(b,P);this.xr=X,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let S=Wt.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Wt.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return vt},this.setPixelRatio=function(S){S!==void 0&&(vt=S,this.setSize(dt,nt,!1))},this.getSize=function(S){return S.set(dt,nt)},this.setSize=function(S,F,Y=!0){if(X.isPresenting){Lt("WebGLRenderer: Can't change size while VR device is presenting.");return}dt=S,nt=F,e.width=Math.floor(S*vt),e.height=Math.floor(F*vt),Y===!0&&(e.style.width=S+"px",e.style.height=F+"px"),_!==null&&_.setSize(e.width,e.height),this.setViewport(0,0,S,F)},this.getDrawingBufferSize=function(S){return S.set(dt*vt,nt*vt).floor()},this.setDrawingBufferSize=function(S,F,Y){dt=S,nt=F,vt=Y,e.width=Math.floor(S*Y),e.height=Math.floor(F*Y),this.setViewport(0,0,S,F)},this.setEffects=function(S){if(y===We){console.error("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(S){for(let F=0;F<S.length;F++)if(S[F].isOutputPass===!0){console.warn("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}_.setEffects(S||[])},this.getCurrentViewport=function(S){return S.copy(N)},this.getViewport=function(S){return S.copy(Z)},this.setViewport=function(S,F,Y,W){S.isVector4?Z.set(S.x,S.y,S.z,S.w):Z.set(S,F,Y,W),gt.viewport(N.copy(Z).multiplyScalar(vt).round())},this.getScissor=function(S){return S.copy(it)},this.setScissor=function(S,F,Y,W){S.isVector4?it.set(S.x,S.y,S.z,S.w):it.set(S,F,Y,W),gt.scissor(k.copy(it).multiplyScalar(vt).round())},this.getScissorTest=function(){return lt},this.setScissorTest=function(S){gt.setScissorTest(lt=S)},this.setOpaqueSort=function(S){Ut=S},this.setTransparentSort=function(S){kt=S},this.getClearColor=function(S){return S.copy(bt.getClearColor())},this.setClearColor=function(){bt.setClearColor(...arguments)},this.getClearAlpha=function(){return bt.getClearAlpha()},this.setClearAlpha=function(){bt.setClearAlpha(...arguments)},this.clear=function(S=!0,F=!0,Y=!0){let W=0;if(S){let V=!1;if(B!==null){let ft=B.texture.format;V=p.has(ft)}if(V){let ft=B.texture.type,_t=d.has(ft),pt=bt.getClearColor(),wt=bt.getClearAlpha(),Et=pt.r,Bt=pt.g,Gt=pt.b;_t?(v[0]=Et,v[1]=Bt,v[2]=Gt,v[3]=wt,P.clearBufferuiv(P.COLOR,0,v)):(M[0]=Et,M[1]=Bt,M[2]=Gt,M[3]=wt,P.clearBufferiv(P.COLOR,0,M))}else W|=P.COLOR_BUFFER_BIT}F&&(W|=P.DEPTH_BUFFER_BIT),Y&&(W|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),W!==0&&P.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",ht,!1),e.removeEventListener("webglcontextrestored",Mt,!1),e.removeEventListener("webglcontextcreationerror",Ot,!1),bt.dispose(),Rt.dispose(),st.dispose(),x.dispose(),J.dispose(),St.dispose(),Q.dispose(),j.dispose(),ct.dispose(),X.dispose(),X.removeEventListener("sessionstart",Cl),X.removeEventListener("sessionend",Rl),Yn.stop()};function ht(S){S.preventDefault(),tl("WebGLRenderer: Context Lost."),D=!0}function Mt(){tl("WebGLRenderer: Context Restored."),D=!1;let S=T.autoReset,F=yt.enabled,Y=yt.autoUpdate,W=yt.needsUpdate,V=yt.type;et(),T.autoReset=S,yt.enabled=F,yt.autoUpdate=Y,yt.needsUpdate=W,yt.type=V}function Ot(S){Dt("WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Jt(S){let F=S.target;F.removeEventListener("dispose",Jt),pe(F)}function pe(S){Oe(S),x.remove(S)}function Oe(S){let F=x.get(S).programs;F!==void 0&&(F.forEach(function(Y){ct.releaseProgram(Y)}),S.isShaderMaterial&&ct.releaseShaderCache(S))}this.renderBufferDirect=function(S,F,Y,W,V,ft){F===null&&(F=ee);let _t=V.isMesh&&V.matrixWorld.determinant()<0,pt=Dh(S,F,Y,W,V);gt.setMaterial(W,_t);let wt=Y.index,Et=1;if(W.wireframe===!0){if(wt=$.getWireframeAttribute(Y),wt===void 0)return;Et=2}let Bt=Y.drawRange,Gt=Y.attributes.position,Ct=Bt.start*Et,ne=(Bt.start+Bt.count)*Et;ft!==null&&(Ct=Math.max(Ct,ft.start*Et),ne=Math.min(ne,(ft.start+ft.count)*Et)),wt!==null?(Ct=Math.max(Ct,0),ne=Math.min(ne,wt.count)):Gt!=null&&(Ct=Math.max(Ct,0),ne=Math.min(ne,Gt.count));let de=ne-Ct;if(de<0||de===1/0)return;Q.setup(V,W,pt,Y,wt);let ce,ie=L;if(wt!==null&&(ce=tt.get(wt),ie=C,ie.setIndex(ce)),V.isMesh)W.wireframe===!0?(gt.setLineWidth(W.wireframeLinewidth*oe()),ie.setMode(P.LINES)):ie.setMode(P.TRIANGLES);else if(V.isLine){let Ae=W.linewidth;Ae===void 0&&(Ae=1),gt.setLineWidth(Ae*oe()),V.isLineSegments?ie.setMode(P.LINES):V.isLineLoop?ie.setMode(P.LINE_LOOP):ie.setMode(P.LINE_STRIP)}else V.isPoints?ie.setMode(P.POINTS):V.isSprite&&ie.setMode(P.TRIANGLES);if(V.isBatchedMesh)if(V._multiDrawInstances!==null)es("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ie.renderMultiDrawInstances(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount,V._multiDrawInstances);else if(Wt.get("WEBGL_multi_draw"))ie.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let Ae=V._multiDrawStarts,Tt=V._multiDrawCounts,Be=V._multiDrawCount,jt=wt?tt.get(wt).bytesPerElement:1,$e=x.get(W).currentProgram.getUniforms();for(let en=0;en<Be;en++)$e.setValue(P,"_gl_DrawID",en),ie.render(Ae[en]/jt,Tt[en])}else if(V.isInstancedMesh)ie.renderInstances(Ct,de,V.count);else if(Y.isInstancedBufferGeometry){let Ae=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Tt=Math.min(Y.instanceCount,Ae);ie.renderInstances(Ct,de,Tt)}else ie.render(Ct,de)};function di(S,F,Y){S.transparent===!0&&S.side===He&&S.forceSinglePass===!1?(S.side=De,S.needsUpdate=!0,Fs(S,F,Y),S.side=bn,S.needsUpdate=!0,Fs(S,F,Y),S.side=He):Fs(S,F,Y)}this.compile=function(S,F,Y=null){Y===null&&(Y=S),E=st.get(Y),E.init(F),R.push(E),Y.traverseVisible(function(V){V.isLight&&V.layers.test(F.layers)&&(E.pushLight(V),V.castShadow&&E.pushShadow(V))}),S!==Y&&S.traverseVisible(function(V){V.isLight&&V.layers.test(F.layers)&&(E.pushLight(V),V.castShadow&&E.pushShadow(V))}),E.setupLights();let W=new Set;return S.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let ft=V.material;if(ft)if(Array.isArray(ft))for(let _t=0;_t<ft.length;_t++){let pt=ft[_t];di(pt,Y,V),W.add(pt)}else di(ft,Y,V),W.add(ft)}),E=R.pop(),W},this.compileAsync=function(S,F,Y=null){let W=this.compile(S,F,Y);return new Promise(V=>{function ft(){if(W.forEach(function(_t){x.get(_t).currentProgram.isReady()&&W.delete(_t)}),W.size===0){V(S);return}setTimeout(ft,10)}Wt.get("KHR_parallel_shader_compile")!==null?ft():setTimeout(ft,10)})};let En=null;function Us(S){En&&En(S)}function Cl(){Yn.stop()}function Rl(){Yn.start()}let Yn=new gh;Yn.setAnimationLoop(Us),typeof self<"u"&&Yn.setContext(self),this.setAnimationLoop=function(S){En=S,X.setAnimationLoop(S),S===null?Yn.stop():Yn.start()},X.addEventListener("sessionstart",Cl),X.addEventListener("sessionend",Rl),this.render=function(S,F){if(F!==void 0&&F.isCamera!==!0){Dt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;let Y=X.enabled===!0&&X.isPresenting===!0,W=_!==null&&(B===null||Y)&&_.begin(b,B);if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),X.enabled===!0&&X.isPresenting===!0&&(_===null||_.isCompositing()===!1)&&(X.cameraAutoUpdate===!0&&X.updateCamera(F),F=X.getCamera()),S.isScene===!0&&S.onBeforeRender(b,S,F,B),E=st.get(S,R.length),E.init(F),R.push(E),ue.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),Pt.setFromProjectionMatrix(ue,je,F.reversedDepth),It=this.localClippingEnabled,xt=ot.init(this.clippingPlanes,It),w=Rt.get(S,A.length),w.init(),A.push(w),X.enabled===!0&&X.isPresenting===!0){let _t=b.xr.getDepthSensingMesh();_t!==null&&to(_t,F,-1/0,b.sortObjects)}to(S,F,0,b.sortObjects),w.finish(),b.sortObjects===!0&&w.sort(Ut,kt),Ft=X.enabled===!1||X.isPresenting===!1||X.hasDepthSensing()===!1,Ft&&bt.addToRenderList(w,S),this.info.render.frame++,xt===!0&&ot.beginShadows();let V=E.state.shadowsArray;if(yt.render(V,S,F),xt===!0&&ot.endShadows(),this.info.autoReset===!0&&this.info.reset(),(W&&_.hasRenderPass())===!1){let _t=w.opaque,pt=w.transmissive;if(E.setupLights(),F.isArrayCamera){let wt=F.cameras;if(pt.length>0)for(let Et=0,Bt=wt.length;Et<Bt;Et++){let Gt=wt[Et];Pl(_t,pt,S,Gt)}Ft&&bt.render(S);for(let Et=0,Bt=wt.length;Et<Bt;Et++){let Gt=wt[Et];Il(w,S,Gt,Gt.viewport)}}else pt.length>0&&Pl(_t,pt,S,F),Ft&&bt.render(S),Il(w,S,F)}B!==null&&O===0&&(U.updateMultisampleRenderTarget(B),U.updateRenderTargetMipmap(B)),W&&_.end(b),S.isScene===!0&&S.onAfterRender(b,S,F),Q.resetDefaultState(),G=-1,H=null,R.pop(),R.length>0?(E=R[R.length-1],xt===!0&&ot.setGlobalState(b.clippingPlanes,E.state.camera)):E=null,A.pop(),A.length>0?w=A[A.length-1]:w=null};function to(S,F,Y,W){if(S.visible===!1)return;if(S.layers.test(F.layers)){if(S.isGroup)Y=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(F);else if(S.isLight)E.pushLight(S),S.castShadow&&E.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||Pt.intersectsSprite(S)){W&&$t.setFromMatrixPosition(S.matrixWorld).applyMatrix4(ue);let _t=St.update(S),pt=S.material;pt.visible&&w.push(S,_t,pt,Y,$t.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||Pt.intersectsObject(S))){let _t=St.update(S),pt=S.material;if(W&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),$t.copy(S.boundingSphere.center)):(_t.boundingSphere===null&&_t.computeBoundingSphere(),$t.copy(_t.boundingSphere.center)),$t.applyMatrix4(S.matrixWorld).applyMatrix4(ue)),Array.isArray(pt)){let wt=_t.groups;for(let Et=0,Bt=wt.length;Et<Bt;Et++){let Gt=wt[Et],Ct=pt[Gt.materialIndex];Ct&&Ct.visible&&w.push(S,_t,Ct,Y,$t.z,Gt)}}else pt.visible&&w.push(S,_t,pt,Y,$t.z,null)}}let ft=S.children;for(let _t=0,pt=ft.length;_t<pt;_t++)to(ft[_t],F,Y,W)}function Il(S,F,Y,W){let{opaque:V,transmissive:ft,transparent:_t}=S;E.setupLightsView(Y),xt===!0&&ot.setGlobalState(b.clippingPlanes,Y),W&&gt.viewport(N.copy(W)),V.length>0&&Ns(V,F,Y),ft.length>0&&Ns(ft,F,Y),_t.length>0&&Ns(_t,F,Y),gt.buffers.depth.setTest(!0),gt.buffers.depth.setMask(!0),gt.buffers.color.setMask(!0),gt.setPolygonOffset(!1)}function Pl(S,F,Y,W){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[W.id]===void 0){let Ct=Wt.has("EXT_color_buffer_half_float")||Wt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[W.id]=new Ve(1,1,{generateMipmaps:!0,type:Ct?dn:We,minFilter:Wn,samples:Math.max(4,Kt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Zt.workingColorSpace})}let ft=E.state.transmissionRenderTarget[W.id],_t=W.viewport||N;ft.setSize(_t.z*b.transmissionResolutionScale,_t.w*b.transmissionResolutionScale);let pt=b.getRenderTarget(),wt=b.getActiveCubeFace(),Et=b.getActiveMipmapLevel();b.setRenderTarget(ft),b.getClearColor(q),at=b.getClearAlpha(),at<1&&b.setClearColor(16777215,.5),b.clear(),Ft&&bt.render(Y);let Bt=b.toneMapping;b.toneMapping=Qe;let Gt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),E.setupLightsView(W),xt===!0&&ot.setGlobalState(b.clippingPlanes,W),Ns(S,Y,W),U.updateMultisampleRenderTarget(ft),U.updateRenderTargetMipmap(ft),Wt.has("WEBGL_multisampled_render_to_texture")===!1){let Ct=!1;for(let ne=0,de=F.length;ne<de;ne++){let ce=F[ne],{object:ie,geometry:Ae,material:Tt,group:Be}=ce;if(Tt.side===He&&ie.layers.test(W.layers)){let jt=Tt.side;Tt.side=De,Tt.needsUpdate=!0,Ll(ie,Y,W,Ae,Tt,Be),Tt.side=jt,Tt.needsUpdate=!0,Ct=!0}}Ct===!0&&(U.updateMultisampleRenderTarget(ft),U.updateRenderTargetMipmap(ft))}b.setRenderTarget(pt,wt,Et),b.setClearColor(q,at),Gt!==void 0&&(W.viewport=Gt),b.toneMapping=Bt}function Ns(S,F,Y){let W=F.isScene===!0?F.overrideMaterial:null;for(let V=0,ft=S.length;V<ft;V++){let _t=S[V],{object:pt,geometry:wt,group:Et}=_t,Bt=_t.material;Bt.allowOverride===!0&&W!==null&&(Bt=W),pt.layers.test(Y.layers)&&Ll(pt,F,Y,wt,Bt,Et)}}function Ll(S,F,Y,W,V,ft){S.onBeforeRender(b,F,Y,W,V,ft),S.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),V.onBeforeRender(b,F,Y,W,S,ft),V.transparent===!0&&V.side===He&&V.forceSinglePass===!1?(V.side=De,V.needsUpdate=!0,b.renderBufferDirect(Y,F,W,V,S,ft),V.side=bn,V.needsUpdate=!0,b.renderBufferDirect(Y,F,W,V,S,ft),V.side=He):b.renderBufferDirect(Y,F,W,V,S,ft),S.onAfterRender(b,F,Y,W,V,ft)}function Fs(S,F,Y){F.isScene!==!0&&(F=ee);let W=x.get(S),V=E.state.lights,ft=E.state.shadowsArray,_t=V.state.version,pt=ct.getParameters(S,V.state,ft,F,Y),wt=ct.getProgramCacheKey(pt),Et=W.programs;W.environment=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?F.environment:null,W.fog=F.fog;let Bt=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap;W.envMap=J.get(S.envMap||W.environment,Bt),W.envMapRotation=W.environment!==null&&S.envMap===null?F.environmentRotation:S.envMapRotation,Et===void 0&&(S.addEventListener("dispose",Jt),Et=new Map,W.programs=Et);let Gt=Et.get(wt);if(Gt!==void 0){if(W.currentProgram===Gt&&W.lightsStateVersion===_t)return Ul(S,pt),Gt}else pt.uniforms=ct.getUniforms(S),S.onBeforeCompile(pt,b),Gt=ct.acquireProgram(pt,wt),Et.set(wt,Gt),W.uniforms=pt.uniforms;let Ct=W.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ct.clippingPlanes=ot.uniform),Ul(S,pt),W.needsLights=Nh(S),W.lightsStateVersion=_t,W.needsLights&&(Ct.ambientLightColor.value=V.state.ambient,Ct.lightProbe.value=V.state.probe,Ct.directionalLights.value=V.state.directional,Ct.directionalLightShadows.value=V.state.directionalShadow,Ct.spotLights.value=V.state.spot,Ct.spotLightShadows.value=V.state.spotShadow,Ct.rectAreaLights.value=V.state.rectArea,Ct.ltc_1.value=V.state.rectAreaLTC1,Ct.ltc_2.value=V.state.rectAreaLTC2,Ct.pointLights.value=V.state.point,Ct.pointLightShadows.value=V.state.pointShadow,Ct.hemisphereLights.value=V.state.hemi,Ct.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Ct.spotLightMatrix.value=V.state.spotLightMatrix,Ct.spotLightMap.value=V.state.spotLightMap,Ct.pointShadowMatrix.value=V.state.pointShadowMatrix),W.currentProgram=Gt,W.uniformsList=null,Gt}function Dl(S){if(S.uniformsList===null){let F=S.currentProgram.getUniforms();S.uniformsList=zi.seqWithValue(F.seq,S.uniforms)}return S.uniformsList}function Ul(S,F){let Y=x.get(S);Y.outputColorSpace=F.outputColorSpace,Y.batching=F.batching,Y.batchingColor=F.batchingColor,Y.instancing=F.instancing,Y.instancingColor=F.instancingColor,Y.instancingMorph=F.instancingMorph,Y.skinning=F.skinning,Y.morphTargets=F.morphTargets,Y.morphNormals=F.morphNormals,Y.morphColors=F.morphColors,Y.morphTargetsCount=F.morphTargetsCount,Y.numClippingPlanes=F.numClippingPlanes,Y.numIntersection=F.numClipIntersection,Y.vertexAlphas=F.vertexAlphas,Y.vertexTangents=F.vertexTangents,Y.toneMapping=F.toneMapping}function Dh(S,F,Y,W,V){F.isScene!==!0&&(F=ee),U.resetTextureUnits();let ft=F.fog,_t=W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial?F.environment:null,pt=B===null?b.outputColorSpace:B.isXRRenderTarget===!0?B.texture.colorSpace:ni,wt=W.isMeshStandardMaterial||W.isMeshLambertMaterial&&!W.envMap||W.isMeshPhongMaterial&&!W.envMap,Et=J.get(W.envMap||_t,wt),Bt=W.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,Gt=!!Y.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Ct=!!Y.morphAttributes.position,ne=!!Y.morphAttributes.normal,de=!!Y.morphAttributes.color,ce=Qe;W.toneMapped&&(B===null||B.isXRRenderTarget===!0)&&(ce=b.toneMapping);let ie=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Ae=ie!==void 0?ie.length:0,Tt=x.get(W),Be=E.state.lights;if(xt===!0&&(It===!0||S!==H)){let _e=S===H&&W.id===G;ot.setState(W,S,_e)}let jt=!1;W.version===Tt.__version?(Tt.needsLights&&Tt.lightsStateVersion!==Be.state.version||Tt.outputColorSpace!==pt||V.isBatchedMesh&&Tt.batching===!1||!V.isBatchedMesh&&Tt.batching===!0||V.isBatchedMesh&&Tt.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&Tt.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&Tt.instancing===!1||!V.isInstancedMesh&&Tt.instancing===!0||V.isSkinnedMesh&&Tt.skinning===!1||!V.isSkinnedMesh&&Tt.skinning===!0||V.isInstancedMesh&&Tt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Tt.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Tt.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Tt.instancingMorph===!1&&V.morphTexture!==null||Tt.envMap!==Et||W.fog===!0&&Tt.fog!==ft||Tt.numClippingPlanes!==void 0&&(Tt.numClippingPlanes!==ot.numPlanes||Tt.numIntersection!==ot.numIntersection)||Tt.vertexAlphas!==Bt||Tt.vertexTangents!==Gt||Tt.morphTargets!==Ct||Tt.morphNormals!==ne||Tt.morphColors!==de||Tt.toneMapping!==ce||Tt.morphTargetsCount!==Ae)&&(jt=!0):(jt=!0,Tt.__version=W.version);let $e=Tt.currentProgram;jt===!0&&($e=Fs(W,F,V));let en=!1,$n=!1,fi=!1,se=$e.getUniforms(),Me=Tt.uniforms;if(gt.useProgram($e.program)&&(en=!0,$n=!0,fi=!0),W.id!==G&&(G=W.id,$n=!0),en||H!==S){gt.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),se.setValue(P,"projectionMatrix",S.projectionMatrix),se.setValue(P,"viewMatrix",S.matrixWorldInverse);let Rn=se.map.cameraPosition;Rn!==void 0&&Rn.setValue(P,Nt.setFromMatrixPosition(S.matrixWorld)),Kt.logarithmicDepthBuffer&&se.setValue(P,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&se.setValue(P,"isOrthographic",S.isOrthographicCamera===!0),H!==S&&(H=S,$n=!0,fi=!0)}if(Tt.needsLights&&(Be.state.directionalShadowMap.length>0&&se.setValue(P,"directionalShadowMap",Be.state.directionalShadowMap,U),Be.state.spotShadowMap.length>0&&se.setValue(P,"spotShadowMap",Be.state.spotShadowMap,U),Be.state.pointShadowMap.length>0&&se.setValue(P,"pointShadowMap",Be.state.pointShadowMap,U)),V.isSkinnedMesh){se.setOptional(P,V,"bindMatrix"),se.setOptional(P,V,"bindMatrixInverse");let _e=V.skeleton;_e&&(_e.boneTexture===null&&_e.computeBoneTexture(),se.setValue(P,"boneTexture",_e.boneTexture,U))}V.isBatchedMesh&&(se.setOptional(P,V,"batchingTexture"),se.setValue(P,"batchingTexture",V._matricesTexture,U),se.setOptional(P,V,"batchingIdTexture"),se.setValue(P,"batchingIdTexture",V._indirectTexture,U),se.setOptional(P,V,"batchingColorTexture"),V._colorsTexture!==null&&se.setValue(P,"batchingColorTexture",V._colorsTexture,U));let Cn=Y.morphAttributes;if((Cn.position!==void 0||Cn.normal!==void 0||Cn.color!==void 0)&&mt.update(V,Y,$e),($n||Tt.receiveShadow!==V.receiveShadow)&&(Tt.receiveShadow=V.receiveShadow,se.setValue(P,"receiveShadow",V.receiveShadow)),(W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial)&&W.envMap===null&&F.environment!==null&&(Me.envMapIntensity.value=F.environmentIntensity),Me.dfgLUT!==void 0&&(Me.dfgLUT.value=rg()),$n&&(se.setValue(P,"toneMappingExposure",b.toneMappingExposure),Tt.needsLights&&Uh(Me,fi),ft&&W.fog===!0&&At.refreshFogUniforms(Me,ft),At.refreshMaterialUniforms(Me,W,vt,nt,E.state.transmissionRenderTarget[S.id]),zi.upload(P,Dl(Tt),Me,U)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(zi.upload(P,Dl(Tt),Me,U),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&se.setValue(P,"center",V.center),se.setValue(P,"modelViewMatrix",V.modelViewMatrix),se.setValue(P,"normalMatrix",V.normalMatrix),se.setValue(P,"modelMatrix",V.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){let _e=W.uniformsGroups;for(let Rn=0,pi=_e.length;Rn<pi;Rn++){let Nl=_e[Rn];j.update(Nl,$e),j.bind(Nl,$e)}}return $e}function Uh(S,F){S.ambientLightColor.needsUpdate=F,S.lightProbe.needsUpdate=F,S.directionalLights.needsUpdate=F,S.directionalLightShadows.needsUpdate=F,S.pointLights.needsUpdate=F,S.pointLightShadows.needsUpdate=F,S.spotLights.needsUpdate=F,S.spotLightShadows.needsUpdate=F,S.rectAreaLights.needsUpdate=F,S.hemisphereLights.needsUpdate=F}function Nh(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return I},this.getActiveMipmapLevel=function(){return O},this.getRenderTarget=function(){return B},this.setRenderTargetTextures=function(S,F,Y){let W=x.get(S);W.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,W.__autoAllocateDepthBuffer===!1&&(W.__useRenderToTexture=!1),x.get(S.texture).__webglTexture=F,x.get(S.depthTexture).__webglTexture=W.__autoAllocateDepthBuffer?void 0:Y,W.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,F){let Y=x.get(S);Y.__webglFramebuffer=F,Y.__useDefaultFramebuffer=F===void 0};let Fh=P.createFramebuffer();this.setRenderTarget=function(S,F=0,Y=0){B=S,I=F,O=Y;let W=null,V=!1,ft=!1;if(S){let pt=x.get(S);if(pt.__useDefaultFramebuffer!==void 0){gt.bindFramebuffer(P.FRAMEBUFFER,pt.__webglFramebuffer),N.copy(S.viewport),k.copy(S.scissor),rt=S.scissorTest,gt.viewport(N),gt.scissor(k),gt.setScissorTest(rt),G=-1;return}else if(pt.__webglFramebuffer===void 0)U.setupRenderTarget(S);else if(pt.__hasExternalTextures)U.rebindTextures(S,x.get(S.texture).__webglTexture,x.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Bt=S.depthTexture;if(pt.__boundDepthTexture!==Bt){if(Bt!==null&&x.has(Bt)&&(S.width!==Bt.image.width||S.height!==Bt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");U.setupDepthRenderbuffer(S)}}let wt=S.texture;(wt.isData3DTexture||wt.isDataArrayTexture||wt.isCompressedArrayTexture)&&(ft=!0);let Et=x.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Et[F])?W=Et[F][Y]:W=Et[F],V=!0):S.samples>0&&U.useMultisampledRTT(S)===!1?W=x.get(S).__webglMultisampledFramebuffer:Array.isArray(Et)?W=Et[Y]:W=Et,N.copy(S.viewport),k.copy(S.scissor),rt=S.scissorTest}else N.copy(Z).multiplyScalar(vt).floor(),k.copy(it).multiplyScalar(vt).floor(),rt=lt;if(Y!==0&&(W=Fh),gt.bindFramebuffer(P.FRAMEBUFFER,W)&&gt.drawBuffers(S,W),gt.viewport(N),gt.scissor(k),gt.setScissorTest(rt),V){let pt=x.get(S.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+F,pt.__webglTexture,Y)}else if(ft){let pt=F;for(let wt=0;wt<S.textures.length;wt++){let Et=x.get(S.textures[wt]);P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0+wt,Et.__webglTexture,Y,pt)}}else if(S!==null&&Y!==0){let pt=x.get(S.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,pt.__webglTexture,Y)}G=-1},this.readRenderTargetPixels=function(S,F,Y,W,V,ft,_t,pt=0){if(!(S&&S.isWebGLRenderTarget)){Dt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let wt=x.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&_t!==void 0&&(wt=wt[_t]),wt){gt.bindFramebuffer(P.FRAMEBUFFER,wt);try{let Et=S.textures[pt],Bt=Et.format,Gt=Et.type;if(S.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+pt),!Kt.textureFormatReadable(Bt)){Dt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Kt.textureTypeReadable(Gt)){Dt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=S.width-W&&Y>=0&&Y<=S.height-V&&P.readPixels(F,Y,W,V,K.convert(Bt),K.convert(Gt),ft)}finally{let Et=B!==null?x.get(B).__webglFramebuffer:null;gt.bindFramebuffer(P.FRAMEBUFFER,Et)}}},this.readRenderTargetPixelsAsync=async function(S,F,Y,W,V,ft,_t,pt=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let wt=x.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&_t!==void 0&&(wt=wt[_t]),wt)if(F>=0&&F<=S.width-W&&Y>=0&&Y<=S.height-V){gt.bindFramebuffer(P.FRAMEBUFFER,wt);let Et=S.textures[pt],Bt=Et.format,Gt=Et.type;if(S.textures.length>1&&P.readBuffer(P.COLOR_ATTACHMENT0+pt),!Kt.textureFormatReadable(Bt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Kt.textureTypeReadable(Gt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ct=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,Ct),P.bufferData(P.PIXEL_PACK_BUFFER,ft.byteLength,P.STREAM_READ),P.readPixels(F,Y,W,V,K.convert(Bt),K.convert(Gt),0);let ne=B!==null?x.get(B).__webglFramebuffer:null;gt.bindFramebuffer(P.FRAMEBUFFER,ne);let de=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await Hc(P,de,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,Ct),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,ft),P.deleteBuffer(Ct),P.deleteSync(de),ft}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,F=null,Y=0){let W=Math.pow(2,-Y),V=Math.floor(S.image.width*W),ft=Math.floor(S.image.height*W),_t=F!==null?F.x:0,pt=F!==null?F.y:0;U.setTexture2D(S,0),P.copyTexSubImage2D(P.TEXTURE_2D,Y,0,0,_t,pt,V,ft),gt.unbindTexture()};let Oh=P.createFramebuffer(),Bh=P.createFramebuffer();this.copyTextureToTexture=function(S,F,Y=null,W=null,V=0,ft=0){let _t,pt,wt,Et,Bt,Gt,Ct,ne,de,ce=S.isCompressedTexture?S.mipmaps[ft]:S.image;if(Y!==null)_t=Y.max.x-Y.min.x,pt=Y.max.y-Y.min.y,wt=Y.isBox3?Y.max.z-Y.min.z:1,Et=Y.min.x,Bt=Y.min.y,Gt=Y.isBox3?Y.min.z:0;else{let Me=Math.pow(2,-V);_t=Math.floor(ce.width*Me),pt=Math.floor(ce.height*Me),S.isDataArrayTexture?wt=ce.depth:S.isData3DTexture?wt=Math.floor(ce.depth*Me):wt=1,Et=0,Bt=0,Gt=0}W!==null?(Ct=W.x,ne=W.y,de=W.z):(Ct=0,ne=0,de=0);let ie=K.convert(F.format),Ae=K.convert(F.type),Tt;F.isData3DTexture?(U.setTexture3D(F,0),Tt=P.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(U.setTexture2DArray(F,0),Tt=P.TEXTURE_2D_ARRAY):(U.setTexture2D(F,0),Tt=P.TEXTURE_2D),P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,F.flipY),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),P.pixelStorei(P.UNPACK_ALIGNMENT,F.unpackAlignment);let Be=P.getParameter(P.UNPACK_ROW_LENGTH),jt=P.getParameter(P.UNPACK_IMAGE_HEIGHT),$e=P.getParameter(P.UNPACK_SKIP_PIXELS),en=P.getParameter(P.UNPACK_SKIP_ROWS),$n=P.getParameter(P.UNPACK_SKIP_IMAGES);P.pixelStorei(P.UNPACK_ROW_LENGTH,ce.width),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,ce.height),P.pixelStorei(P.UNPACK_SKIP_PIXELS,Et),P.pixelStorei(P.UNPACK_SKIP_ROWS,Bt),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Gt);let fi=S.isDataArrayTexture||S.isData3DTexture,se=F.isDataArrayTexture||F.isData3DTexture;if(S.isDepthTexture){let Me=x.get(S),Cn=x.get(F),_e=x.get(Me.__renderTarget),Rn=x.get(Cn.__renderTarget);gt.bindFramebuffer(P.READ_FRAMEBUFFER,_e.__webglFramebuffer),gt.bindFramebuffer(P.DRAW_FRAMEBUFFER,Rn.__webglFramebuffer);for(let pi=0;pi<wt;pi++)fi&&(P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,x.get(S).__webglTexture,V,Gt+pi),P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,x.get(F).__webglTexture,ft,de+pi)),P.blitFramebuffer(Et,Bt,_t,pt,Ct,ne,_t,pt,P.DEPTH_BUFFER_BIT,P.NEAREST);gt.bindFramebuffer(P.READ_FRAMEBUFFER,null),gt.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else if(V!==0||S.isRenderTargetTexture||x.has(S)){let Me=x.get(S),Cn=x.get(F);gt.bindFramebuffer(P.READ_FRAMEBUFFER,Oh),gt.bindFramebuffer(P.DRAW_FRAMEBUFFER,Bh);for(let _e=0;_e<wt;_e++)fi?P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,Me.__webglTexture,V,Gt+_e):P.framebufferTexture2D(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,Me.__webglTexture,V),se?P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,Cn.__webglTexture,ft,de+_e):P.framebufferTexture2D(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_2D,Cn.__webglTexture,ft),V!==0?P.blitFramebuffer(Et,Bt,_t,pt,Ct,ne,_t,pt,P.COLOR_BUFFER_BIT,P.NEAREST):se?P.copyTexSubImage3D(Tt,ft,Ct,ne,de+_e,Et,Bt,_t,pt):P.copyTexSubImage2D(Tt,ft,Ct,ne,Et,Bt,_t,pt);gt.bindFramebuffer(P.READ_FRAMEBUFFER,null),gt.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else se?S.isDataTexture||S.isData3DTexture?P.texSubImage3D(Tt,ft,Ct,ne,de,_t,pt,wt,ie,Ae,ce.data):F.isCompressedArrayTexture?P.compressedTexSubImage3D(Tt,ft,Ct,ne,de,_t,pt,wt,ie,ce.data):P.texSubImage3D(Tt,ft,Ct,ne,de,_t,pt,wt,ie,Ae,ce):S.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,ft,Ct,ne,_t,pt,ie,Ae,ce.data):S.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,ft,Ct,ne,ce.width,ce.height,ie,ce.data):P.texSubImage2D(P.TEXTURE_2D,ft,Ct,ne,_t,pt,ie,Ae,ce);P.pixelStorei(P.UNPACK_ROW_LENGTH,Be),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,jt),P.pixelStorei(P.UNPACK_SKIP_PIXELS,$e),P.pixelStorei(P.UNPACK_SKIP_ROWS,en),P.pixelStorei(P.UNPACK_SKIP_IMAGES,$n),ft===0&&F.generateMipmaps&&P.generateMipmap(Tt),gt.unbindTexture()},this.initRenderTarget=function(S){x.get(S).__webglFramebuffer===void 0&&U.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?U.setTextureCube(S,0):S.isData3DTexture?U.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?U.setTexture2DArray(S,0):U.setTexture2D(S,0),gt.unbindTexture()},this.resetState=function(){I=0,O=0,B=null,gt.reset(),Q.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return je}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=Zt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Zt._getUnpackColorSpace()}};var Mh="backstory.graph.forces.v1",Vi=Object.freeze({spring:1,repulsion:1,gravity:1});function Gi(i){return Object.fromEntries(Object.entries(Vi).map(([t,e])=>{let n=i?.[t];return[t,typeof n=="number"&&Number.isFinite(n)&&n>=.25&&n<=4?Math.round(n*4)/4:e]}))}function Sh(i){try{let t=JSON.parse(i?.getItem(Mh)||"null");if(t?.version===1)return Gi(t)}catch{}return{...Vi}}function vl(i,t){try{i?.setItem(Mh,JSON.stringify({version:1,...Gi(t)}))}catch{}}var Xt=Object.freeze({step:1/60,catchUp:4,restLength:90,stiffness:8,repulsion:12e5,softening:144,forceCap:300,collisionRadius:22,collisionStrength:20,center:.04,damping:4.8,speedCap:600,maxSteps:720,restSpeed:2,restSteps:45,visits:192,chunkSize:64,frameMilliseconds:6});function bh(i){let t=2166136261;for(let e of i)t=Math.imul(t^e.codePointAt(0),16777619);return t>>>0}function Ml(i){let t=bh(i),e=t/4294967296*Math.PI*2,n=bh(i+"\0z")/4294967296*2-1,s=60+t%240;return{x:Math.cos(e)*Math.sqrt(1-n*n)*s,y:Math.sin(e)*Math.sqrt(1-n*n)*s,z:n*s}}var Ls=class{constructor(){this.cells=[],this.stack=new Int32Array(Xt.visits)}cell(t,e,n,s){let r=this.used++,a=this.cells[r]||={children:new Int32Array(8)};return Object.assign(a,{x:t,y:e,z:n,radius:s,count:0,sx:0,sy:0,sz:0,point:-1,split:!1,childCount:0}),a.children.fill(-1),r}octant(t,e){return(t.x>=e.x?1:0)|(t.y>=e.y?2:0)|(t.z>=e.z?4:0)}insert(t,e,n,s){let r=t[e],a=this.cells[n];if(a.count++,a.sx+=r.x,a.sy+=r.y,a.sz+=r.z,a.count===1){a.point=e;return}s===16||a.radius<.1||(a.split||(a.split=!0,this.child(t,a.point,a,s),a.point=-1),this.child(t,e,a,s))}child(t,e,n,s){let r=this.octant(t[e],n),a=n.radius/2,o=n.children[r];o<0&&(o=n.children[r]=this.cell(n.x+(r&1?a:-a),n.y+(r&2?a:-a),n.z+(r&4?a:-a),a),n.childCount++),this.insert(t,e,o,s+1)}*build(t){let e=1,n=0;this.used=0;for(let s of t)e=Math.max(e,Math.abs(s.x),Math.abs(s.y),Math.abs(s.z)),++n%Xt.chunkSize===0&&(yield);this.cell(0,0,0,e+1);for(let s=0;s<t.length;s++)this.insert(t,s,0,0),++n%Xt.chunkSize===0&&(yield);for(let s=0;s<this.used;s++){let r=this.cells[s];r.mx=r.sx/r.count,r.my=r.sy/r.count,r.mz=r.sz/r.count,++n%Xt.chunkSize===0&&(yield)}}};function wh(i,t,e,n,s,r,a,o,l=null){if(r<1e-4){let g=Ml(t.path+"\0"+o);e=g.x,n=g.y,s=g.z,r=e*e+n*n+s*s}let c=Math.sqrt(r),u=(Math.min(Xt.forceCap*Math.sqrt(a),Xt.repulsion*i.forces.repulsion*a/(r+Xt.softening))+Math.max(0,Xt.collisionRadius*2-c)*Xt.collisionStrength)/c,m=e*u,h=n*u,f=s*u;t.fx-=m,t.fy-=h,t.fz-=f,l&&(l.fx+=m,l.fy+=h,l.fz+=f),i.interactions++}var Ha=class{constructor(t=[],e=[],n=null){this.tree=new Ls,this.positionVersion=0,this.version=0,this.staged=new Float64Array(0),this.nodes=new Map,this.forces={...Vi},this.root=n,this.selected=n,this.setGraph(t,e)}setGraph(t,e){let n=this.nodes;this.nodes=new Map(t.map(s=>[s.path,n.get(s.path)||{path:s.path,...Ml(s.path),vx:0,vy:0,vz:0,pinned:!1}])),this.outgoing=new Map([...this.nodes.keys()].map(s=>[s,new Set]));for(let s of e){let r=this.nodes.get(s.source),a=this.nodes.get(s.destination);if(!(!r||!a||r===a)){this.outgoing.get(s.source).add(s.destination);for(let[o,l]of[[r,a],[a,r]])if(!n.has(o.path)&&n.has(l.path)){let c=Ml(o.path);o.x=l.x+c.x*.3,o.y=l.y+c.y*.3,o.z=l.z+c.z*.3}}}this.all=[...this.nodes.values()],this.all.length?this.staged.length<this.all.length*6&&(this.staged=new Float64Array(this.all.length*6)):(this.staged.fill(0),this.staged=new Float64Array(0)),this.all.length||(this.tree=new Ls),this.positionVersion++,this.updateSprings(),this.reheat()}setSelection(t){t!==this.selected&&(this.selected=t)}setRoot(t){t!==this.root&&(this.root=t,this.updateSprings(),this.reheat())}updateSprings(){this.depths=new Map([...this.nodes.keys()].map(e=>[e,1/0]));let t=[];this.nodes.has(this.root)&&(this.depths.set(this.root,0),t.push(this.root));for(let e=0;e<t.length;e++){let n=t[e],s=this.depths.get(n)+1;for(let r of this.outgoing.get(n))this.depths.get(r)===1/0&&(this.depths.set(r,s),t.push(r))}this.springs=[];for(let e of t)for(let n of this.outgoing.get(e))this.isSpringEdge(e,n)&&this.springs.push([this.nodes.get(e),this.nodes.get(n)])}isSpringEdge(t,e){let n=this.depths.get(t);return Number.isFinite(n)&&this.depths.get(e)===n+1}setForces(t){this.forces=Gi(t),this.reheat()}cancelPending(){this.version++,this.pendingStep=null,this.accumulator=0}pause(){this.cancelPending(),this.active=!1;let t=!1;for(let e of this.all)t||=e.vx!==0||e.vy!==0||e.vz!==0,e.vx=e.vy=e.vz=0;t&&this.positionVersion++}reheat(){this.cancelPending(),this.active=!0,this.steps=0,this.quiet=0,this.accumulator=0,this.limitReached=!1}pin(t,e,n,s=this.nodes.get(t)?.z??0){let r=this.nodes.get(t);!r||![e,n,s].every(Number.isFinite)||(Object.assign(r,{x:e,y:n,z:s,vx:0,vy:0,vz:0,pinned:!0}),this.positionVersion++,this.reheat())}unpin(t){let e=this.nodes.get(t);e&&(e.pinned=!1,e.vx=e.vy=e.vz=0,this.positionVersion++,this.reheat())}releaseAll(){this.cancelPending();let t=!1;for(let e of this.all)t||=e.pinned,e.pinned=!1;t&&this.positionVersion++}step(){if(!this.active)return;let t=this.pendingStep||this.stepWork();for(;!t.next().done;);this.pendingStep=null}stepWork(){return this.integrateStep(this.version)}*integrateStep(t){if(t!==this.version)return;let e=this.all,n=this.staged;this.interactions=0;let s=0;for(let f of e)if(f.fx=-f.x*Xt.center*this.forces.gravity,f.fy=-f.y*Xt.center*this.forces.gravity,f.fz=-f.z*Xt.center*this.forces.gravity,++s%Xt.chunkSize===0&&(yield,t!==this.version))return;if(e.length<=64)for(let f=0;f<e.length;f++)for(let g=f+1;g<e.length;g++){let y=e[f],p=e[g],d=p.x-y.x,v=p.y-y.y,M=p.z-y.z;if(wh(this,y,d,v,M,d*d+v*v+M*M,1,p.path,p),++s%Xt.chunkSize===0&&(yield,t!==this.version))return}else{let f=this.tree,g=f.build(e);for(;!g.next().done;)if(yield,t!==this.version)return;for(let y of e){let p=f.stack,d=1,v=0;for(p[0]=1;d;){let M=p[--d],w=M>0,E=f.cells[Math.abs(M)-1];v++;let A=E.count-(w?1:0);if(A<=0)continue;let R=w?(E.sx-y.x)/A:E.mx,_=w?(E.sy-y.y)/A:E.my,b=w?(E.sz-y.z)/A:E.mz,D=R-y.x,I=_-y.y,O=b-y.z,B=D*D+I*I+O*O;if(E.split&&v+d+E.childCount<=Xt.visits&&(w||E.radius*E.radius*4>.81*Math.max(1,B))){let G=w?f.octant(y,E):-1;for(let H=0;H<8;H++)E.children[H]>=0&&(p[d++]=(E.children[H]+1)*(H===G?1:-1))}else wh(this,y,D,I,O,B,A,"cell")}if(++s%Xt.chunkSize===0&&(yield,t!==this.version))return}}for(let[f,g]of this.springs){let y=g.x-f.x,p=g.y-f.y,d=g.z-f.z,v=Math.max(.01,Math.hypot(y,p,d)),M=Xt.stiffness*this.forces.spring*(v-Xt.restLength)/v;if(f.fx+=y*M,f.fy+=p*M,f.fz+=d*M,g.fx-=y*M,g.fy-=p*M,g.fz-=d*M,++s%Xt.chunkSize===0&&(yield,t!==this.version))return}let r=0,a=!1,o=Xt.step,l=Math.exp(-Xt.damping*o),c=Math.max(.08,1-this.steps/Xt.maxSteps);for(let f=0;f<e.length;f++){let g=e[f],y=f*6,p=g.vx,d=g.vy,v=g.vz;if(g.pinned)a=!0;else{p=(p+g.fx*o*c)*l,d=(d+g.fy*o*c)*l,v=(v+g.fz*o*c)*l;let M=Math.hypot(p,d,v),w=Math.min(1,Xt.speedCap/Math.max(1,M));p*=w,d*=w,v*=w,r=Math.max(r,Math.min(M,Xt.speedCap))}if(n[y]=g.x+(g.pinned?0:p*o),n[y+1]=g.y+(g.pinned?0:d*o),n[y+2]=g.z+(g.pinned?0:v*o),n[y+3]=p,n[y+4]=d,n[y+5]=v,++s%Xt.chunkSize===0&&(yield,t!==this.version))return}let u=this.steps+1,m=r<Xt.restSpeed&&!a?this.quiet+1:0,h=u>=Xt.maxSteps||m>=Xt.restSteps||!e.length;if(t===this.version){for(let f=0;f<e.length;f++){let g=e[f],y=f*6;g.x=n[y],g.y=n[y+1],g.z=n[y+2],g.vx=h?0:n[y+3],g.vy=h?0:n[y+4],g.vz=h?0:n[y+5]}this.steps=u,this.quiet=m,this.positionVersion++,h&&(this.limitReached=u>=Xt.maxSteps,this.active=!1)}}advance(t){if(!Number.isFinite(t)||t<=0||!this.active)return this.active;this.accumulator=Math.min(Xt.step*Xt.catchUp,this.accumulator+t);let e=performance.now()+Xt.frameMilliseconds,n=0;for(;this.active&&n<Xt.catchUp&&(this.pendingStep||this.accumulator>=Xt.step)&&(this.pendingStep||=this.stepWork(),this.pendingStep.next().done&&(this.pendingStep=null,this.accumulator=Math.max(0,this.accumulator-Xt.step),n++),!(performance.now()>=e)););return this.active}settle(t=240){this.cancelPending();for(let e=0;e<Math.min(t,Xt.maxSteps)&&this.active;e++)this.step();this.pause(),this.releaseAll();for(let e of this.all)e.vx=e.vy=e.vz=0;this.positionVersion++}destroy(){this.pause(),this.releaseAll(),this.staged.fill(0),this.staged=new Float64Array(0),this.positionVersion++,this.tree=new Ls,this.nodes.clear(),this.outgoing.clear(),this.depths.clear(),this.all=[],this.springs=[]}};var Wa=class extends Ha{constructor(){super(),this.generation=0,this.epoch=0,this.pinSerial=0,this.command=0,this.overrides=new Map,this.pinUpdates=new Map;try{this.worker=new Worker(new URL("./graph-physics-worker.js",import.meta.url),{type:"module"}),this.worker.onmessage=t=>this.receive(t.data),this.worker.onerror=t=>{t.preventDefault(),this.fallback()},this.worker.onmessageerror=()=>this.fallback(),this.graphDirty=!0,this.changed()}catch{this.worker=null}}changed(t=!1,e=!1){this.worker&&(t&&(this.generation++,this.graphDirty=!0,this.overrides.clear(),this.pinUpdates.clear()),e&&this.epoch++,this.dirty=!0,this.flushQueued||(this.flushQueued=!0,queueMicrotask(()=>{this.flushQueued=!1,this.flush()})))}flush(){if(!this.worker||this.inFlight||!this.dirty)return;let t={type:"control",command:++this.command,generation:this.generation,epoch:this.epoch,heat:this.heat,serial:this.pinSerial,running:!this.suspended&&this.active,paused:!this.active,forces:this.forces,pins:[...this.pinUpdates.values()]},e=[];if(this.graphDirty){this.indices=new Map(this.all.map((a,o)=>[a.path,o]));let n=new Float64Array(this.all.length*3),s=new Uint8Array(this.all.length);this.all.forEach((a,o)=>{n.set([a.x,a.y,a.z],o*3),s[o]=Number(a.pinned)});let r=new Int32Array(this.springs.length*2);this.springs.forEach(([a,o],l)=>{r[l*2]=this.indices.get(a.path),r[l*2+1]=this.indices.get(o.path)}),t.graph={paths:this.all.map(a=>a.path),positions:n,pinned:s,springs:r},e.push(n.buffer,s.buffer,r.buffer),t.pins=[]}else t.pins=t.pins.map(n=>({...n,index:this.indices.get(n.path),path:void 0}));this.inFlight=t.command,this.dirty=this.graphDirty=!1,this.pinUpdates.clear();try{this.worker.postMessage(t,e)}catch{this.fallback()}}receive(t){this.worker&&(t.type==="ack"?t.command===this.inFlight&&(this.inFlight=null,this.flush()):t.type==="positions"&&(t.generation!==this.generation||t.epoch!==this.epoch||this.suspended||!this.active?this.recycle(t):this.snapshotPacket=t))}recycle(t){if(this.worker)try{this.worker.postMessage({type:"recycle",generation:t.generation,buffer:t.positions.buffer},[t.positions.buffer])}catch{this.fallback()}}fallback(){this.worker?.terminate(),this.worker=null,this.snapshotPacket=null,this.pinUpdates?.clear(),this.overrides?.clear(),this.indices?.clear(),this.inFlight=null,super.cancelPending()}setGraph(t,e){super.setGraph(t,e),this.changed(!0)}setRoot(t){t!==this.root&&(super.setRoot(t),this.changed(!0))}setForces(t){let e=Gi(t);Object.keys(e).every(n=>this.forces[n]===e[n])||(super.setForces(e),this.changed(!1,!0))}reheat(){super.reheat(),this.changingPin||(this.heat=(this.heat||0)+1,this.changed(!1,!0))}pause(){super.pause(),this.changed(!1,!0)}pin(t,e,n,s=this.nodes.get(t)?.z??0){!this.nodes.has(t)||![e,n,s].every(Number.isFinite)||(this.changingPin=!0,super.pin(t,e,n,s),this.changingPin=!1,this.recordPin(t))}unpin(t){this.changingPin=!0,super.unpin(t),this.changingPin=!1,this.recordPin(t)}recordPin(t){let e=this.nodes.get(t);if(!this.worker||!e)return;let n={path:t,x:e.x,y:e.y,z:e.z,pinned:e.pinned,serial:++this.pinSerial};this.overrides.set(t,n),this.pinUpdates.set(t,n),this.changed()}releaseAll(){if(super.releaseAll(),this.worker)for(let t of this.all)this.recordPin(t.path)}suspend(){this.suspended||(this.suspended=!0,this.changed(!1,!0),this.snapshotPacket&&(this.recycle(this.snapshotPacket),this.snapshotPacket=null))}resume(){this.suspended&&(this.suspended=!1,this.changed(!1,!0))}advance(t){if(!this.worker)return this.suspended?this.active:super.advance(t);let e=this.snapshotPacket;if(this.snapshotPacket=null,!e)return this.active;if(e.generation===this.generation&&e.epoch===this.epoch&&this.active&&!this.suspended){let n=e.positions;if(n.length!==this.all.length*3||!n.every(Number.isFinite))return this.fallback(),this.active;for(let s=0;s<this.all.length;s++){let r=this.all[s],a=this.overrides.get(r.path);a&&(a.pinned||a.serial>e.serial)||(this.overrides.delete(r.path),r.x=n[s*3],r.y=n[s*3+1],r.z=n[s*3+2])}this.steps=e.steps,this.limitReached=e.limitReached,e.serial>=this.pinSerial&&(this.active=e.active),this.positionVersion++}return this.recycle(e),this.active}destroy(){this.worker?.terminate(),this.worker=null,this.snapshotPacket=null,this.overrides?.clear(),this.pinUpdates?.clear(),this.indices?.clear(),super.destroy()}};var Xa=class{constructor(t=960,e=600){this.width=t,this.height=e,this.x=this.y=this.z=this.targetX=this.targetY=this.targetZ=0,this.yaw=this.pitch=this.targetYaw=this.targetPitch=0,this.distance=this.targetDistance=900,this.fov=Math.PI/4}get focal(){return this.height/(2*Math.tan(this.fov/2))}get scale(){return this.focal/this.distance}basis(){let t=Math.cos(this.yaw),e=Math.sin(this.yaw),n=Math.cos(this.pitch),s=Math.sin(this.pitch);return{right:{x:t,y:0,z:-e},up:{x:e*s,y:-n,z:t*s},back:{x:e*n,y:s,z:t*n}}}eye(t=this.basis()){let e=t.back;return{x:this.x+e.x*this.distance,y:this.y+e.y*this.distance,z:this.z+e.z*this.distance}}world(t,e={x:this.x,y:this.y,z:this.z}){let{right:n,up:s,back:r}=this.basis(),a=this.distance-((e.x-this.x)*r.x+(e.y-this.y)*r.y+((e.z??0)-this.z)*r.z),o=(t.x-this.width/2)*a/this.focal,l=(t.y-this.height/2)*a/this.focal,c=this.distance-a;return{x:this.x+r.x*c+n.x*o+s.x*l,y:this.y+r.y*c+n.y*o+s.y*l,z:this.z+r.z*c+n.z*o+s.z*l}}screen(t,e={},n=this.basis()){let{right:s,up:r,back:a}=n,o=t.x-this.x,l=t.y-this.y,c=(t.z??0)-this.z,u=this.distance-(o*a.x+l*a.y+c*a.z),m=this.focal/Math.max(.01,u);return e.x=this.width/2+(o*s.x+l*s.y+c*s.z)*m,e.y=this.height/2+(o*r.x+l*r.y+c*r.z)*m,e.depth=u,e.scale=m,e.visible=u>1&&u<1e6,e}snap(){for(let t of["x","y","z","yaw","pitch","distance"])this[t]=this["target"+t[0].toUpperCase()+t.slice(1)]}zoom(t,e={x:this.width/2,y:this.height/2},n=!1){let s=this.world(e),r=Math.min(2e5,Math.max(35,this.targetDistance/t))/this.distance;this.targetDistance=this.distance*r,this.targetX=s.x+(this.x-s.x)*r,this.targetY=s.y+(this.y-s.y)*r,this.targetZ=s.z+(this.z-s.z)*r,n&&this.snap()}pan(t,e,n=!1){let{right:s,up:r}=this.basis();this.targetX+=(s.x*t+r.x*e)/this.scale,this.targetY+=(s.y*t+r.y*e)/this.scale,this.targetZ+=(s.z*t+r.z*e)/this.scale,n&&this.snap()}orbit(t,e,n=!1){this.targetYaw+=t,this.targetPitch=Math.max(-1.45,Math.min(1.45,this.targetPitch+e)),n&&this.snap()}resetOrientation(t=!1){this.targetYaw=this.targetPitch=0,t&&this.snap()}fit(t,e=!1){let n=[...t.values()];if(!n.length)return;let s=1/0,r=1/0,a=1/0,o=-1/0,l=-1/0,c=-1/0;for(let h of n)s=Math.min(s,h.x),r=Math.min(r,h.y),a=Math.min(a,h.z??0),o=Math.max(o,h.x),l=Math.max(l,h.y),c=Math.max(c,h.z??0);this.targetX=(s+o)/2,this.targetY=(r+l)/2,this.targetZ=(a+c)/2;let u=Math.max(60,Math.hypot(o-s,l-r,c-a)/2+35),m=Math.min(this.fov/2,Math.atan(Math.tan(this.fov/2)*this.width/this.height));this.targetDistance=Math.max(150,u/Math.sin(m)*1.12),e&&this.snap()}tick(t,e=!1){e&&this.snap();let n=1-Math.exp(-12*Math.min(.067,Math.max(0,t))),s=0,r=!1;for(let a of["x","y","z","yaw","pitch","distance"]){let o=this["target"+a[0].toUpperCase()+a.slice(1)],l=this[a];this[a]+=(o-this[a])*n,s+=Math.abs(o-this[a]),r||=l!==this[a]}return s<=5e-4&&this.snap(),r||s>5e-4}};var ci="asdfghjkl",hi=(i,t)=>new Set(i.filter(e=>e.source===t&&e.destination!==t).map(e=>e.destination));function Sl({nodes:i,edges:t,selected:e,projected:n,width:s,height:r,visibleOnly:a=!0}){let o=hi(t,e),l=i.filter(f=>{if(!a)return!0;let g=n.get(f.path);return g?.visible&&g.x>=0&&g.x<=s&&g.y>=0&&g.y<=r});if(l.sort((f,g)=>Number(o.has(g.path))-Number(o.has(f.path))||f.path.localeCompare(g.path)),!l.length)return[];let c=[[],[...ci]],u=ci.length,m=1;for(;u<l.length;){if(!c[m].length){m++;continue}let f=c[m].pop();(c[m+1]||=[]).push(...[...ci].map(g=>f+g)),u+=ci.length-1}let h=c.flat();return h.sort((f,g)=>f.length-g.length||[...f].reduce((y,p,d)=>y||ci.indexOf(p)-ci.indexOf(g[d]),0)),l.map((f,g)=>({path:f.path,title:f.title,code:h[g]}))}var qa=class{constructor(){this.assignments=[],this.active=!1,this.prefix=""}begin(t){let{projected:e,width:n,height:s}=t;this.assignments=t.assignments?t.assignments.filter(r=>{let a=e.get(r.path);return a?.visible&&a.x>=0&&a.x<=n&&a.y>=0&&a.y<=s}):Sl(t),this.active=this.assignments.length>0,this.prefix=""}cancel(){this.active=!1,this.assignments=[],this.prefix=""}key(t){if(!this.active)return{};if(t==="Escape")return this.cancel(),{cancelled:!0};if(t==="Backspace")return this.prefix=this.prefix.slice(0,-1),{};if(t.length!==1||!ci.includes(t.toLowerCase()))return{invalid:!0};let e=this.prefix+t.toLowerCase();if(!this.assignments.some(s=>s.code.startsWith(e)))return{invalid:!0};this.prefix=e;let n=this.assignments.find(s=>s.code===e);return n?(this.cancel(),{path:n.path}):{}}};var Ah=(i,t)=>i.x<t.x+t.w&&i.x+i.w>t.x&&i.y<t.y+t.h&&i.y+i.h>t.y,mn=4,ui=20,Ya=48;function bl({nodes:i,projected:t,width:e,height:n,selected:s,focused:r,current:a,measure:o,maximum:l=48,previous:c=new Map,edges:u=[],neighbors:m=hi(u,s),hintMode:h=!1}){if(e<40||n<28||l<=0)return[];let f=A=>A===s?5:A===r?4:m.has(A)?3:A===a?2:h?1:0,g=A=>A?.visible&&A.x>=0&&A.x<=e&&A.y>=0&&A.y<=n,y=new Map,p=A=>{let R=[];for(let _=Math.floor(A.x/Ya);_<=Math.floor((A.x+A.w)/Ya);_++)for(let b=Math.floor(A.y/Ya);b<=Math.floor((A.y+A.h)/Ya);b++)R.push(`${_},${b}`);return R};for(let[A,R]of t){if(!g(R))continue;let _=Math.max(R.radius||0,f(A)>=4||A===a?19:8),b={x:R.x-_,y:R.y-_,w:_*2,h:_*2};for(let D of p(b))y.has(D)||y.set(D,[]),y.get(D).push(b)}let d=[...t.values()].filter(g).length;h||(l=Math.min(l,Math.max(3,Math.floor(e*n/(3500+d*50)))));let v=i.filter(A=>h||A.path===s||m.has(A.path)).sort((A,R)=>f(R.path)-f(A.path)),M=[],w=[],E=A=>A.x>=mn&&A.y>=mn&&A.x+A.w<=e-mn&&A.y+A.h<=n-mn&&!w.some(R=>Ah(A,R))&&!p(A).some(R=>y.get(R)?.some(_=>Ah(A,_)));for(let A of v){if(M.length>=l)break;let R=t.get(A.path);if(!g(R))continue;let _=Array.from(String(A.title||A.path)),b=!f(A.path),D=Math.min(240,(e-mn*2)*.58),I=[..._],O=I.join("");for(;o(O,b)+8>D&&I.length>1;)I.pop(),O=I.join("")+"\u2026";let B=Math.min(e-mn*2,o(O,b)+8),G=[];for(let nt of[22,42,66,88])G.push({slot:`r${nt}`,x:R.x+nt,y:R.y-ui/2},{slot:`l${nt}`,x:R.x-nt-B,y:R.y-ui/2},{slot:`u${nt}`,x:Math.max(mn,Math.min(e-mn-B,R.x-B/2)),y:R.y-nt-ui},{slot:`d${nt}`,x:Math.max(mn,Math.min(e-mn-B,R.x-B/2)),y:R.y+nt},{slot:`ur${nt}`,x:R.x+nt,y:R.y-nt-ui},{slot:`ul${nt}`,x:R.x-nt-B,y:R.y-nt-ui},{slot:`dr${nt}`,x:R.x+nt,y:R.y+nt},{slot:`dl${nt}`,x:R.x-nt-B,y:R.y+nt});let H=c.get(A.path),N=G.findIndex(nt=>nt.slot===H);N>0&&G.unshift(G.splice(N,1)[0]);let k=nt=>({x:Math.max(nt.x,Math.min(nt.x+nt.w,R.x)),y:Math.max(nt.y,Math.min(nt.y+nt.h,R.y))}),rt=(nt,vt,Ut,kt)=>{let Z=(it,lt,Pt)=>(lt.x-it.x)*(Pt.y-it.y)-(lt.y-it.y)*(Pt.x-it.x);return Z(nt,vt,Ut)*Z(nt,vt,kt)<0&&Z(Ut,kt,nt)*Z(Ut,kt,vt)<0},q=G.find(nt=>{let vt={x:nt.x,y:nt.y,w:B,h:ui},Ut=k(vt);return!E(vt)||Math.hypot(R.x-Ut.x,R.y-Ut.y)>100?!1:!M.some(kt=>{let Z=t.get(kt.path),it=kt.rect,lt=[{x:it.x,y:it.y},{x:it.x+it.w,y:it.y},{x:it.x+it.w,y:it.y+it.h},{x:it.x,y:it.y+it.h}],Pt=[{x:vt.x,y:vt.y},{x:vt.x+vt.w,y:vt.y},{x:vt.x+vt.w,y:vt.y+vt.h},{x:vt.x,y:vt.y+vt.h}];return rt(R,Ut,Z,kt.anchor)||lt.some((xt,It)=>rt(R,Ut,xt,lt[(It+1)%4]))||Pt.some((xt,It)=>rt(Z,kt.anchor,xt,Pt[(It+1)%4]))})});if(!q)continue;let at={x:q.x,y:q.y,w:B,h:ui},dt={x:Math.max(at.x,Math.min(at.x+at.w,R.x)),y:Math.max(at.y,Math.min(at.y+at.h,R.y))};M.push({path:A.path,text:O,rect:at,anchor:dt,slot:q.slot,priority:f(A.path),secondary:b}),w.push(at)}return M}var $a=(i,t)=>i===t?7:5;function wl(){let i=[0,0,0],t=[0,0,0],e=[0,0,0],n=[0,0,0],s=[0,0,0];return{start:i,tip:t,arrow:[t,[0,0,0],[0,0,0]],halo:[e,n,s,s,n,[0,0,0]]}}function Th(i,t,e,n,{right:s,back:r},a=wl()){let o=t.x-i.x,l=t.y-i.y,c=t.z-i.z,u=Math.max(.01,Math.hypot(o,l,c)),m=o/u,h=l/u,f=c/u,g=Math.min(u*.3,e),y=Math.min(u*.3,n),p=Math.min(u*.25,6),d=l*r.z-c*r.y,v=c*r.x-o*r.z,M=o*r.y-l*r.x,w=Math.hypot(d,v,M);w<.001&&(d=s.x,v=s.y,M=s.z,w=1),d/=w,v/=w,M/=w;let{start:E,tip:A,arrow:R,halo:_}=a;for(let b=0;b<3;b++){let D=b===0?m:b===1?h:f,I=b===0?d:b===1?v:M;E[b]=(b===0?i.x:b===1?i.y:i.z)+D*g,A[b]=(b===0?t.x:b===1?t.y:t.z)-D*y;let O=A[b]-D*p;R[1][b]=O+I*p*.5,R[2][b]=O-I*p*.5,_[0][b]=E[b]+I*3,_[1][b]=E[b]-I*3,_[2][b]=A[b]+I*3,_[5][b]=A[b]-I*3}return a}function Eh(i,t,e){let n=new Map(i.map(a=>[a.path,1/0])),s=new Map(i.map(a=>[a.path,new Set]));for(let{source:a,destination:o}of t)!s.has(a)||!s.has(o)||(s.get(a).add(o),s.get(o).add(a));let r=[];n.has(e)&&(n.set(e,0),r.push(e));for(let a=0;a<r.length;a++){let o=r[a];for(let l of s.get(o))n.get(l)===1/0&&(n.set(l,n.get(o)+1),r.push(l))}return{nodes:n,edges:t.map(a=>Math.max(n.get(a.source)??1/0,n.get(a.destination)??1/0))}}var Al=2,Tl=4,El=(i,t=Al)=>t===0?0:Math.min(Tl,Math.max(0,t))*(Number.isFinite(i)?.12+.65*.52**i:.08);function Ch(i,t,e){let n=i.get(t);if(!n)return[...i.keys()].sort()[0]||null;let s={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]},[r,a]=s[e],o=t,l=1/0;for(let[c,u]of[...i].sort(([m],[h])=>m<h?-1:m>h?1:0)){let m=u.x-n.x,h=u.y-n.y;if(m*r+h*a<=0)continue;let g=Math.hypot(m,h)+Math.abs(m*a-h*r)*2;g<l&&(o=c,l=g)}return o}var Za=class{constructor(){this.level=0,this.slow=0,this.good=0}sample(t){if(!Number.isFinite(t)||t<=0)return!1;let e=this.level;return t>.04?(this.slow++,this.good=0):t<.025?(this.good++,this.slow=0):this.good=this.slow=0,this.slow>=6&&(this.level=Math.min(2,this.level+1),this.slow=0),this.good>=90&&(this.level=Math.max(0,this.level-1),this.good=0),e!==this.level}bloom(t,e=!1){return e?0:t*[1,.5,0][this.level]}get labels(){return[48,28,12][this.level]}get dpr(){return[1.5,1.25,1][this.level]}};function Ja(i,t=!1,e=!1){let n=new Le;return n.setAttribute("position",new me(new Float32Array(i*3),3).setUsage(Es)),t&&n.setAttribute("color",new me(new Float32Array(i*(e?4:3)),e?4:3).setUsage(Es)),n}function og(i,t){let e=new Mn,n=new cs(new ms(1,1),new Bn({color:16777215}),i.length);n.instanceMatrix.setUsage(Es);let s=new us(Ja(t.length*2,!0,!0),new Di({vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1})),r=new we(Ja(t.length*3,!0,!0),new Bn({vertexColors:!0,transparent:!0,opacity:.85,depthWrite:!1,side:He,forceSinglePass:!0})),a=new Re({transparent:!0,depthWrite:!1,uniforms:{viewportHeight:{value:1}},vertexShader:"attribute vec3 color; attribute float diameter; varying vec3 glow; uniform float viewportHeight; void main(){ glow=color; vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_PointSize=diameter*projectionMatrix[1][1]*viewportHeight/(2.*max(.01,-p.z)); }",fragmentShader:`varying vec3 glow; void main(){ float r=length(gl_PointCoord-vec2(.5))*2.; if(r>1.) discard; float a=pow(1.-r,2.)*.6; gl_FragColor=vec4(glow,a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}`}),o=new ds(Ja(i.length,!0),a);o.geometry.setAttribute("diameter",new me(new Float32Array(i.length),1));let l=Ja(t.length*6,!0,!0),c=new Float32Array(t.length*12);for(let m=0;m<t.length;m++)c.set([0,0,0,1,1,0,1,0,0,1,1,1],m*12);l.setAttribute("uv",new me(c,2));let u=new we(l,new Re({transparent:!0,depthWrite:!1,side:He,forceSinglePass:!0,vertexShader:"attribute vec4 color; varying vec4 glow; varying vec2 strip; void main(){ glow=color; strip=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",fragmentShader:`varying vec4 glow; varying vec2 strip; void main(){ float a=pow(1.-abs(strip.y*2.-1.),2.)*.28; gl_FragColor=vec4(glow.rgb,a*glow.a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}`}));for(let m of[u,o,s,r,n])m.frustumCulled=!1,e.add(m);return{group:e,nodes:n,edges:s,arrows:r,halos:o,edgeHalos:u,dispose(){for(let m of e.children)m.geometry.dispose(),m.material.dispose(),m.dispose?.();e.clear()}}}var Ka=class{constructor(t,e={}){this.container=t,this.actions=e,this.life=new AbortController,this.simulation=new Wa,this.camera=new Xa,this.quality=new Za,this.data={nodes:[],edges:[]},this.selected=this.focused=null,this.frame=null,this.destroyed=!1,this.intensity=Al,this.pointers=new Map,this.projected=new Map,this.reduced=matchMedia("(prefers-reduced-motion: reduce)"),this.forced=matchMedia("(forced-colors: active)"),this.paused=this.reduced.matches,this.paused&&this.simulation.suspend(),this.canvas=document.createElement("canvas"),this.canvas.setAttribute("aria-hidden","true"),this.labels=document.createElement("canvas"),this.labels.setAttribute("aria-hidden","true"),this.labelContext=this.labels.getContext("2d"),this.swatch=document.createElement("canvas"),this.swatch.width=this.swatch.height=1,this.swatchContext=this.swatch.getContext("2d",{willReadFrequently:!0}),this.hints=new qa,this.hintButtons=new Map,this.hintLayer=document.createElement("div"),this.hintLayer.className="graph-hints",this.hintLayer.setAttribute("role","group"),this.hintLayer.setAttribute("aria-label","Node selection hints"),this.hintLayer.hidden=!0,t.replaceChildren(this.canvas,this.labels,this.hintLayer),t.graphView=this,this.scene=new ss,this.renderCamera=new Ce(45,1,1,1e6),this.matrix=new re,this.color=new Yt;let n=(s,r,a,o={})=>s.addEventListener(r,a,{...o,signal:this.life.signal});n(this.canvas,"webglcontextlost",s=>{s.preventDefault(),this.unavailable=!0,this.release(null,!0),this.stop(),this.container.dataset.renderer="lost",this.actions.onUnavailable?.("The 3D map lost its graphics context. Your loaded notes remain available in the list.")}),n(this.canvas,"webglcontextrestored",()=>queueMicrotask(()=>{this.destroyed||(this.unavailable=!1,this.container.dataset.renderer="webgl",this.syncSize(),this.themeDirty=!0,this.draw(),this.wake(),this.actions.onRestored?.())}));try{this.renderer=new ka({canvas:this.canvas,antialias:!1,alpha:!1,powerPreference:"low-power"}),this.renderer.outputColorSpace=Pe,this.container.dataset.renderer="webgl"}catch{this.unavailable=!0,this.simulation.suspend(),this.container.dataset.renderer="unavailable",queueMicrotask(()=>{this.destroyed||this.actions.onUnavailable?.("WebGL is unavailable. Your loaded notes remain available in the list.")})}this.resize=new ResizeObserver(()=>{this.syncSize()&&(!this.sized&&this.loaded&&!this.cameraControlled&&this.camera.width>0&&this.camera.fit(this.simulation.nodes,!0),this.sized=!0,this.draw())}),this.resize.observe(t),this.syncSize(),this.themeObserver=new MutationObserver(()=>{this.updateTheme(),this.draw()}),this.themeObserver.observe(document.documentElement,{attributes:!0,attributeFilter:["class","style","data-color-scheme","data-theme"]}),this.updateTheme(),n(t,"keydown",s=>this.keydown(s)),n(t,"focusout",s=>{t.contains(s.relatedTarget)||this.cancelHints()}),n(t,"pointerdown",s=>this.pointerDown(s)),n(t,"pointermove",s=>this.pointerMove(s)),n(t,"pointerup",s=>this.release(s,!1));for(let s of["pointercancel","lostpointercapture"])n(t,s,r=>this.release(r,!0));n(t,"wheel",s=>{s.ctrlKey||s.metaKey||s.altKey||(s.preventDefault(),this.zoom(s.deltaY<0?1.12:1/1.12,this.point(s)))},{passive:!1}),n(document,"visibilitychange",()=>{document.hidden?(this.release(null,!0),this.stop()):this.wake()}),n(this.reduced,"change",()=>{this.paused=this.reduced.matches,this.paused?(this.simulation.pause(),this.camera.snap(),this.stop()):this.simulation.reheat(),this.actions.onPause?.(this.paused),this.draw(),this.wake()}),n(this.forced,"change",()=>{this.updateTheme(),this.draw()}),document.fonts&&n(document.fonts,"loadingdone",()=>{this.labelMetrics?.clear(),this.draw()})}get available(){return!this.unavailable}updateTheme(){let t=getComputedStyle(this.container),e=this.swatchContext;this.labelMetrics?.clear(),this.fontFamily=t.fontFamily||"sans-serif";let n=(s,r)=>{let a=t.getPropertyValue(s).trim()||r;if(!e)return r;e.clearRect(0,0,1,1),e.fillStyle=r,e.fillStyle=a,e.fillRect(0,0,1,1);let o=e.getImageData(0,0,1,1).data;return`rgb(${o[0]},${o[1]},${o[2]})`};if(this.theme={background:n("--surface","#141820"),node:n("--graph-node","#8ab4f8"),edge:n("--graph-edge","#8a919d"),destination:n("--graph-destination","#81c995"),highlight:n("--graph-highlight","#c5a5ff"),bloom:n("--graph-bloom","#8ab4f8"),label:n("--foreground","#e8e8e8"),focus:n("--focus","#f4c95d")},this.forced.matches&&e){let s=document.createElement("span");s.style.color="CanvasText",this.container.append(s),this.theme.node=this.theme.edge=this.theme.label=getComputedStyle(s).color,s.style.color="Highlight",this.theme.destination=this.theme.highlight=this.theme.focus=getComputedStyle(s).color,s.style.color="Canvas",this.theme.background=getComputedStyle(s).color,s.remove()}this.themeDirty=!0}syncSize(){let t=this.container.getBoundingClientRect();return!t.width||!t.height?!1:(this.camera.width=t.width,this.camera.height=t.height,this.pixelRatio=Math.min(window.devicePixelRatio||1,this.quality.dpr),this.renderer&&!this.unavailable&&(this.renderer.setPixelRatio(this.pixelRatio),this.renderer.setSize(t.width,t.height,!1)),this.labels.width=Math.round(t.width*this.pixelRatio),this.labels.height=Math.round(t.height*this.pixelRatio),!0)}setGraph(t,e,n=e){let s=JSON.stringify([t.nodes.map(a=>a.path),t.edges.map(a=>[a.source,a.destination])]),r=s!==this.topology;if(t.nodes.length||this.cancelHints(),this.data=t,this.current=e,this.root=n,!r){this.refreshShortcuts(),this.simulation.setRoot(n),this.paused&&this.simulation.pause(),this.themeDirty=!0,this.draw();return}this.topology=s,this.release(null,!0),this.projected?.clear(),this.pickGrid?.clear();for(let a of this.pickBuckets||[])a.length=0;t.nodes.length||(this.pickBuckets=[],this.edgeGeometry=null),this.drawnBatch=null,this.simulation.setGraph(t.nodes,t.edges),this.simulation.setRoot(n),!this.loaded&&t.nodes.length&&(this.cameraControlled||this.camera.fit(this.simulation.nodes,!0),this.loaded=!0),this.paused&&this.simulation.pause(),this.batch&&(this.scene.remove(this.batch.group),this.batch.dispose()),this.batch=og(t.nodes,t.edges),this.scene.add(this.batch.group),this.container.dataset.nodeCount=String(t.nodes.length),this.container.dataset.edgeCount=String(t.edges.length),this.setSelection(this.selected,this.focused),this.wake()}setSelection(t,e){this.selected=t,this.focused=e,this.simulation.setSelection(t),this.root===null&&this.simulation.setRoot(t),this.paused&&this.simulation.pause(),this.tiers=Eh(this.data.nodes,this.data.edges,t),this.destinations=hi(this.data.edges,t),this.refreshShortcuts(),this.themeDirty=!0,this.container.dataset.root=this.root||"",this.container.dataset.selected=t||"",this.container.dataset.focused=e||"";let n=[["Current note",this.current],["Selected note",t],["Keyboard focus",e],["Opening root",this.root]].filter(([,s])=>s).map(([s,r])=>`${s}: ${r}`).join(" \xB7 ");this.container.setAttribute("aria-label",`3D note relationship map \xB7 ${n}`),this.draw(),this.wake()}setForces(t){this.simulation.setForces(t),this.paused&&this.simulation.pause(),this.draw(),this.wake()}setBloom(t){this.intensity=Math.min(Tl,Math.max(0,Number(t)||0)),this.container.dataset.bloom=String(this.intensity),this.themeDirty=!0,this.draw()}setPaused(t){this.paused=!!t||this.reduced.matches,this.release(null,!0),this.paused?(this.simulation.pause(),this.camera.snap(),this.stop()):(this.simulation.reheat(),this.wake()),this.actions.onPause?.(this.paused),this.draw()}fit(){this.simulation.nodes.size&&(this.cameraControlled=!0,this.camera.fit(this.simulation.nodes,this.paused),this.draw(),this.wake())}resetOrientation(){this.cameraControlled=!0,this.camera.resetOrientation(this.paused),this.draw(),this.wake()}orbit(t,e){this.cameraControlled=!0,this.camera.orbit(t,e,this.paused),this.draw(),this.wake()}zoom(t,e){this.cameraControlled=!0,this.camera.zoom(t,e,this.paused),this.draw(),this.wake()}pan(t,e){this.cameraControlled=!0,this.camera.pan(t,e,this.paused),this.draw(),this.wake()}refreshShortcuts(){let t=JSON.stringify([this.selected,this.data.nodes.map(n=>[n.path,n.title]),this.data.edges.map(n=>[n.source,n.destination])]);if(t===this.shortcutKey)return;this.shortcutKey=t,this.shortcutAssignments=Sl({...this.data,selected:this.selected,visibleOnly:!1}),this.shortcutCodes=new Map(this.shortcutAssignments.map(n=>[n.path,n.code]));let e=hi(this.data.edges,this.selected);this.labelCandidates=this.data.nodes.filter(n=>n.path===this.selected||e.has(n.path)).map(n=>e.has(n.path)&&this.shortcutCodes.has(n.path)?{...n,title:`f ${this.shortcutCodes.get(n.path)} \xB7 ${n.title}`}:n),this.labelMetrics=new Map}beginHints(){if(!(this.unavailable||this.container.hidden)){this.refreshShortcuts(),this.hints.begin({...this.data,assignments:this.shortcutAssignments,selected:this.selected,projected:this.projected,width:this.camera.width,height:this.camera.height}),this.hintButtons.clear(),this.hintLayer.replaceChildren();for(let t of this.hints.assignments){let e=document.createElement("button");e.type="button",e.tabIndex=-1,e.textContent=t.code,e.dataset.graphHint=t.code,e.setAttribute("aria-label",`${t.code}: Select ${t.title}, ${t.path}`),e.addEventListener("click",()=>this.completeHint(t.path)),this.hintLayer.append(e),this.hintButtons.set(t.path,e)}this.container.focus({preventScroll:!0}),this.actions.onHint?.(this.hints.active?"Node hints: type a code to select and expand. Escape cancels; Backspace edits.":"No nodes are visible for hints."),this.draw()}}cancelHints(t=!1){!this.hints?.active&&!this.hintButtons?.size||(this.hints.cancel(),this.hintButtons.clear(),this.hintLayer.replaceChildren(),this.hintLayer.hidden=!0,this.container.dataset.hintMode="false",t&&(this.actions.onHint?.("Node hints cancelled."),this.draw()))}completeHint(t){this.cancelHints(),this.container.focus({preventScroll:!0}),this.data.nodes.some(e=>e.path===t)?this.actions.onSelect?.(t,!0):this.actions.onHint?.("That node is no longer available. Enter hint mode again."),this.draw()}drawHints(){if(!this.hints?.active){this.hintLayer&&(this.hintLayer.hidden=!0);return}this.hintLayer.hidden=!1,this.container.dataset.hintMode="true";let t=new Set(this.data.nodes.map(r=>r.path)),e=this.hints.assignments.filter(r=>r.code.startsWith(this.hints.prefix)&&t.has(r.path)),n=new Map(e.map(r=>[r.path,r])),s=bl({nodes:e.map(r=>({path:r.path,title:r.code})),projected:this.projected,width:this.camera.width,height:this.camera.height,measure:r=>Math.max(16,r.length*9),maximum:e.length,hintMode:!0,previous:this.hintSlots});this.hintSlots=new Map(s.map(r=>[r.path,r.slot]));for(let r of this.hintButtons.values())r.hidden=!0;for(let r of s){let a=this.hintButtons.get(r.path);if(!a)continue;a.hidden=!1,a.style.width=`${r.rect.w}px`,a.style.left=`${r.rect.x}px`,a.style.top=`${r.rect.y}px`;let o=n.get(r.path);a.textContent=o.code;let l=this.projected.get(r.path),c=this.labelContext;c&&(c.strokeStyle=this.theme.focus,c.lineWidth=1,c.beginPath(),c.moveTo(l.x,l.y),c.lineTo(r.anchor.x,r.anchor.y),c.stroke())}}keydown(t){if(t.target!==this.container||t.isComposing||t.altKey||t.metaKey||t.ctrlKey||t.getModifierState?.("AltGraph"))return;if(this.hints?.active){if(t.key==="Tab"){this.cancelHints(!0);return}t.preventDefault(),t.stopPropagation();let n=this.hints.key(t.key);if(n.path){this.completeHint(n.path);return}n.cancelled?(this.cancelHints(!0),this.actions.onHint?.("Node hints cancelled.")):this.actions.onHint?.(n.invalid?"No matching hint. Backspace edits; Escape cancels.":`Node hints: ${this.hints.prefix||"type a code"}`),this.draw();return}if(t.key==="f"){t.preventDefault(),t.stopPropagation(),this.beginHints();return}let e={ArrowLeft:"left",h:"left",ArrowRight:"right",l:"right",ArrowUp:"up",k:"up",ArrowDown:"down",j:"down"}[t.key];if(e){let n=new Map([...this.projected].filter(([r,a])=>r===this.focused||a.visible&&a.x>=0&&a.x<=this.camera.width&&a.y>=0&&a.y<=this.camera.height)),s=Ch(n,this.focused,e);s&&this.actions.onSelect?.(s,!0)}else if(t.key==="Enter")this.actions.onOpen?.(this.focused);else if(t.key===" ")this.actions.onCenter?.(this.focused);else if(t.key==="/")this.actions.onSearch?.();else if(t.key==="?")this.actions.onHelp?.();else if(t.key==="Escape")this.actions.onEscape?.();else if(t.key==="+"||t.key==="=")this.zoom(1.25);else if(t.key==="-")this.zoom(.8);else return;t.preventDefault(),t.stopPropagation()}point(t){let e=this.canvas.getBoundingClientRect();return{x:t.clientX-e.left,y:t.clientY-e.top}}pick(t){let e=Math.floor(t.x/36),n=Math.floor(t.y/36),s=null,r=22;for(let a=-1;a<=1;a++)for(let o=-1;o<=1;o++)for(let l of this.pickGrid?.get(`${e+a},${n+o}`)||[]){let c=this.projected.get(l),u=Math.hypot(t.x-c.x,t.y-c.y);u<r&&(s=l,r=u)}return s}pointerDown(t){if(this.cameraControlled=!0,t.target.closest?.(".graph-hints")||t.button!==0||t.ctrlKey||t.metaKey||t.altKey||this.unavailable)return;this.cancelHints();let e=this.point(t);if(this.pointers.set(t.pointerId,e),this.container.focus({preventScroll:!0}),this.container.setPointerCapture(t.pointerId),this.pointers.size>1){this.drag?.path&&this.simulation.unpin(this.drag.path),this.drag=null,this.gesture=this.gestureState();return}this.drag={pointer:t.pointerId,path:this.pick(e),start:e,previous:e,moved:!1,pan:t.shiftKey||t.pointerType==="pen"}}gestureState(){let[t,e]=[...this.pointers.values()];return t&&e?{x:(t.x+e.x)/2,y:(t.y+e.y)/2,distance:Math.max(1,Math.hypot(t.x-e.x,t.y-e.y))}:null}pointerMove(t){if(!this.pointers.has(t.pointerId))return;let e=this.point(t);if(this.pointers.set(t.pointerId,e),this.pointers.size>1){let s=this.gestureState(),r=this.gesture;r&&(this.camera.pan(r.x-s.x,r.y-s.y,!0),this.camera.zoom(s.distance/r.distance,s,!0)),this.gesture=s,this.draw();return}let n=this.drag;if(n&&(Math.hypot(e.x-n.start.x,e.y-n.start.y)>5&&(n.moved=!0),!!n.moved)){if(n.path){let s=this.camera.world(e,this.simulation.nodes.get(n.path));this.simulation.pin(n.path,s.x,s.y,s.z),this.container.dataset.pinned="true"}else n.pan?this.camera.pan(n.previous.x-e.x,n.previous.y-e.y,!0):this.camera.orbit((n.previous.x-e.x)*.006,(e.y-n.previous.y)*.006,!0);n.previous=e,this.draw(),this.wake()}}release(t,e){if(t)this.pointers.delete(t.pointerId),this.container.hasPointerCapture(t.pointerId)&&this.container.releasePointerCapture(t.pointerId);else{for(let s of this.pointers.keys())this.container.hasPointerCapture(s)&&this.container.releasePointerCapture(s);this.pointers.clear()}let n=this.drag;n&&(!t||n.pointer===t.pointerId)&&(this.drag=null,n.path&&this.simulation.unpin(n.path),!e&&!n.moved&&n.path&&this.actions.onSelect?.(n.path,!0)),this.gesture=null,this.container.dataset.pinned="false",this.paused||this.wake()}applyColors(t){let e=this.batch;this.data.nodes.forEach((n,s)=>{let r=n.path===this.selected,a=n.path===this.focused,o=this.destinations?.has(n.path),l=this.theme.destination||this.theme.focus;e.nodes.setColorAt(s,this.color.set(r?this.theme.highlight:o?l:a?this.theme.focus:this.theme.node)),this.color.set(r?this.theme.highlight:o?l:this.theme.bloom).multiplyScalar(El(this.tiers.nodes.get(n.path),t)),this.color.toArray(e.halos.geometry.attributes.color.array,s*3)}),this.data.edges.forEach((n,s)=>{let r=this.simulation.isSpringEdge(n.source,n.destination),a=n.source===this.selected&&n.destination!==this.selected,o=this.forced.matches||r||a?1:.12;this.color.set(a?this.theme.destination||this.theme.focus:this.tiers.edges[s]<=1?this.theme.highlight:this.theme.edge);for(let[l,c]of[[e.edges,2],[e.arrows,3]])for(let u=0;u<c;u++)l.geometry.attributes.color.setXYZW(s*c+u,this.color.r,this.color.g,this.color.b,o);this.color.set(this.theme.bloom).multiplyScalar(El(this.tiers.edges[s],r?t:Math.min(1,t)));for(let l=0;l<6;l++)e.edgeHalos.geometry.attributes.color.setXYZW(s*6+l,this.color.r,this.color.g,this.color.b,o)}),e.nodes.instanceColor&&(e.nodes.instanceColor.needsUpdate=!0);for(let n of[e.halos,e.edges,e.arrows,e.edgeHalos])n.geometry.attributes.color.needsUpdate=!0;this.themeDirty=!1}draw({positionsChanged:t=!1}={}){if(this.destroyed||this.unavailable||!this.renderer||!this.batch||document.hidden||this.container.hidden)return;let e=this.batch,n=this.camera,s=n.basis(),r=n.eye(s),a=["x","y","z","yaw","pitch","distance","width","height"],o=this.drawnCamera,l=!o||a.some(h=>o[h]!==n[h]),c=t||this.drawnPositionVersion!==this.simulation.positionVersion||this.drawnBatch!==e||this.drawnSelection!==this.selected,u=c||l;this.renderCamera.aspect=n.width/n.height,this.renderCamera.position.set(r.x,r.y,r.z),this.renderCamera.lookAt(n.x,n.y,n.z),this.renderCamera.updateProjectionMatrix(),this.renderCamera.updateMatrixWorld();let m=this.quality.bloom(this.intensity,this.forced.matches);if(e.halos.visible=e.edgeHalos.visible=m>0,e.halos.material.uniforms.viewportHeight.value=n.height*this.pixelRatio,this.themeDirty&&this.applyColors(m),this.renderer.setClearColor(this.theme.background),u){this.pickGrid||=new Map,this.pickGrid.clear(),this.pickBuckets||=[];let h=0;if(this.drawnBatch!==e)for(let f of this.projected.keys())this.simulation.nodes.has(f)||this.projected.delete(f);this.compareDepth||=(f,g)=>this.projected.get(f).depth-this.projected.get(g).depth;for(let f=0;f<this.data.nodes.length;f++){let g=this.data.nodes[f],y=this.simulation.nodes.get(g.path),p=n.screen(y,this.projected.get(g.path),s),d=$a(g.path,this.selected);if(p.radius=d*p.scale,this.projected.set(g.path,p),c&&(this.matrix.makeScale(d,d,d),this.matrix.setPosition(y.x,y.y,y.z),e.nodes.setMatrixAt(f,this.matrix),e.halos.geometry.attributes.position.setXYZ(f,y.x,y.y,y.z),e.halos.geometry.attributes.diameter.setX(f,d*9.6)),p.visible&&p.x>-36&&p.x<n.width+36&&p.y>-36&&p.y<n.height+36){let v=`${Math.floor(p.x/36)},${Math.floor(p.y/36)}`,M=this.pickGrid.get(v);M||(M=this.pickBuckets[h]||=[],h++,M.length=0,this.pickGrid.set(v,M)),M.push(g.path),M.sort(this.compareDepth),M.length>32&&(M.length=32)}}for(let f=h;f<this.pickBuckets.length;f++)this.pickBuckets[f].length=0}if(u||m>0&&!this.drawnBloom){this.edgeGeometry||=wl();let h=e.edges.geometry.attributes.position,f=e.arrows.geometry.attributes.position,g=e.edgeHalos.geometry.attributes.position;for(let y=0;y<this.data.edges.length;y++){let p=this.data.edges[y],d=this.simulation.nodes.get(p.source),v=this.simulation.nodes.get(p.destination);if(!d||!v)continue;let M=Th(d,v,$a(p.source,this.selected),$a(p.destination,this.selected),s,this.edgeGeometry);h.setXYZ(y*2,M.start[0],M.start[1],M.start[2]),h.setXYZ(y*2+1,M.tip[0],M.tip[1],M.tip[2]);for(let w=0;w<3;w++){let E=M.arrow[w];f.setXYZ(y*3+w,E[0],E[1],E[2])}if(m>0)for(let w=0;w<6;w++){let E=M.halo[w];g.setXYZ(y*6+w,E[0],E[1],E[2])}}h.needsUpdate=f.needsUpdate=!0,m>0&&(g.needsUpdate=!0)}c&&(e.nodes.instanceMatrix.needsUpdate=!0,e.halos.geometry.attributes.diameter.needsUpdate=!0,e.halos.geometry.attributes.position.needsUpdate=!0),this.drawnCamera||={};for(let h of a)this.drawnCamera[h]=n[h];this.drawnPositionVersion=this.simulation.positionVersion,this.drawnBatch=e,this.drawnSelection=this.selected,this.drawnBloom=m,this.renderer.render(this.scene,this.renderCamera),this.drawLabels(),this.drawHints(),Object.assign(this.container.dataset,{motion:this.paused?"paused":this.simulation.active?"moving":"settled",lowWork:String(this.quality.level>0),quality:String(this.quality.level),cameraYaw:String(n.yaw),cameraPitch:String(n.pitch),bloomEffective:String(m)})}drawLabels(){let t=this.labelContext;if(!t)return;let e=this.camera;t.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0),t.clearRect(0,0,e.width,e.height),t.font=`12px ${this.fontFamily}`,t.lineJoin="round",t.lineWidth=4;let n=this.destinations||hi(this.data.edges||[],this.selected),s=bl({nodes:this.labelCandidates||this.data.nodes,projected:this.projected,width:e.width,height:e.height,selected:this.selected,focused:this.focused,current:this.current,edges:this.data.edges,neighbors:n,measure:(r,a)=>{this.labelMetrics||=new Map;let o=`${a}:${r}`;return this.labelMetrics.has(o)||(t.font=`${a?11:12}px ${this.fontFamily}`,this.labelMetrics.set(o,t.measureText(r).width)),this.labelMetrics.get(o)},maximum:this.hints?.active?0:this.quality.labels,previous:this.labelSlots});this.labelSlots=new Map(s.map(r=>[r.path,r.slot])),this.labelPlacements=s;for(let r of s){let a=this.projected.get(r.path),{rect:o,anchor:l}=r;t.globalAlpha=r.secondary?.78:1,t.strokeStyle=r.path===this.selected?this.theme.highlight:n.has(r.path)?this.theme.destination||this.theme.focus:this.theme.label,t.lineWidth=1,t.beginPath(),t.moveTo(a.x,a.y),t.lineTo(l.x,l.y),t.stroke()}for(let r of s){let{rect:a}=r;t.font=`${r.secondary?11:12}px ${this.fontFamily}`,t.globalAlpha=r.secondary?.78:1,t.fillStyle=this.theme.background,t.fillRect(a.x,a.y,a.w,a.h),t.strokeStyle=this.theme.background,t.fillStyle=n.has(r.path)?this.theme.destination||this.theme.focus:this.theme.label,t.lineWidth=3,t.strokeText(r.text,a.x+4,a.y+14),t.fillText(r.text,a.x+4,a.y+14)}t.globalAlpha=1;for(let r of n){let a=this.projected.get(r);!a?.visible||a.x<0||a.x>e.width||a.y<0||a.y>e.height||[this.current,this.selected,this.focused,this.root].includes(r)||(t.strokeStyle=this.theme.destination||this.theme.focus,t.lineWidth=1.5,t.beginPath(),t.arc(a.x,a.y,Math.max(5,a.radius||5)+3,0,Math.PI*2),t.stroke())}for(let r of new Set([this.current,this.selected,this.focused,this.root])){let a=this.projected.get(r);if(!a?.visible||a.x<0||a.x>e.width||a.y<0||a.y>e.height)continue;let o=r===this.selected,l=r===this.current,c=r===this.focused;t.lineWidth=2,t.strokeStyle=o?this.theme.highlight:l?this.theme.label:this.theme.focus,c&&t.setLineDash([4,3]),o?(t.beginPath(),t.moveTo(a.x,a.y-13),t.lineTo(a.x+13,a.y),t.lineTo(a.x,a.y+13),t.lineTo(a.x-13,a.y),t.closePath(),t.stroke()):l||c?t.strokeRect(a.x-10,a.y-10,20,20):(t.beginPath(),t.arc(a.x,a.y,10,0,Math.PI*2),t.stroke()),t.setLineDash([]),l&&o&&(t.strokeStyle=this.theme.label,t.beginPath(),t.moveTo(a.x-4,a.y+7),t.lineTo(a.x-4,a.y+3),t.lineTo(a.x,a.y+3),t.stroke()),r===this.root&&(t.fillStyle=this.theme.label,t.fillRect(a.x-2,a.y-15,4,4))}}snapshot(){return{renderer:this.container.dataset.renderer,nodes:this.data.nodes.length,edges:this.data.edges.length,selected:this.selected,focused:this.focused,camera:{x:this.camera.x,y:this.camera.y,z:this.camera.z,yaw:this.camera.yaw,pitch:this.camera.pitch,distance:this.camera.distance},projected:[...this.projected].map(([t,e])=>({path:t,...e}))}}wake(){this.destroyed||this.unavailable||document.hidden||this.container.hidden||this.frame!==null||this.paused||(this.simulation.resume?.(),this.lastTime=performance.now(),this.frame=requestAnimationFrame(t=>this.tick(t)))}tick(t){if(this.frame=null,this.destroyed||this.unavailable||document.hidden||this.container.hidden||this.paused)return;let e=Math.max(0,(t-this.lastTime)/1e3);this.lastTime=t,this.quality.sample(e)&&(this.themeDirty=!0,this.syncSize());let n=this.simulation.positionVersion;this.simulation.advance(e);let s=this.simulation.positionVersion!==n||this.drawnPositionVersion!=null&&this.drawnPositionVersion!==this.simulation.positionVersion,r=this.camera.tick(e);(s||r||this.themeDirty)&&this.draw({positionsChanged:s}),this.simulation.active||r?this.frame=requestAnimationFrame(a=>this.tick(a)):this.simulation.limitReached&&this.actions.onLimit?.()}stop(){this.frame!==null&&cancelAnimationFrame(this.frame),this.frame=null,this.simulation.suspend?.(),this.simulation.cancelPending?.()}destroy(){this.cancelHints(),this.release(null,!0),this.destroyed=!0,this.stop(),this.life.abort(),this.resize.disconnect(),this.themeObserver.disconnect(),this.labelCandidates=[],this.labelMetrics?.clear(),this.batch?.dispose(),this.renderer?.dispose(),this.simulation.destroy(),this.projected.clear(),this.pickGrid?.clear(),this.pickBuckets=[],this.edgeGeometry=null,this.drawnCamera=this.drawnBatch=null,this.container.graphView===this&&delete this.container.graphView,this.container.replaceChildren()}};var ja=class{constructor(t){this.origin=t,this.clear()}clear(){this.scope=null,this.root=null,this.seeds=new Set,this.visiblePaths=[],this.suspend()}suspend(){this.data=null,this.nodes=new Map,this.outgoing=new Map,this.incoming=new Map}accept(t){try{if(!t||t.schema_version!==1||t.untrusted_content!==!0||t.authoritative!==!1||typeof t.scope!="string"||!t.scope||t.scope.length>4096||typeof t.snapshot_id!="string"||!t.snapshot_id||t.snapshot_id.length>4096||t.next_cursor!==null||!t.freshness||typeof t.freshness.state!="string"||typeof t.projection_complete!="boolean"||!Array.isArray(t.limiting_reasons)||!t.limiting_reasons.every(o=>typeof o=="string")||!Array.isArray(t.nodes)||!Array.isArray(t.edges))throw new Error("invalid_response");let e=new Map,n=new Map,s=new Map,r=new Set;for(let o of t.nodes){if(!o||typeof o.path!="string"||!o.path||typeof o.title!="string"||typeof o.revision!="string"||typeof o.href!="string"||e.has(o.path))throw new Error("invalid_response");let l=new URL(o.href,this.origin);if(l.origin!==this.origin||!l.pathname.startsWith("/notes/")||decodeURIComponent(l.pathname.slice(7))!==o.path||l.search||l.hash||l.username||l.password)throw new Error("invalid_response");e.set(o.path,o),n.set(o.path,[]),s.set(o.path,[])}for(let o of t.edges){if(!o||!e.has(o.source)||!e.has(o.destination)||!Number.isSafeInteger(o.occurrence_count)||o.occurrence_count<=0)throw new Error("invalid_response");let l=JSON.stringify([o.source,o.destination]);if(r.has(l))throw new Error("invalid_response");r.add(l),n.get(o.source).push(o),s.get(o.destination).push(o)}let a=this.scope===t.scope;if(!a)this.seeds.clear(),this.visiblePaths=[];else for(let o of this.seeds)e.has(o)||this.seeds.delete(o);return this.scope=t.scope,this.data=t,this.nodes=e,this.outgoing=n,this.incoming=s,a}catch{throw this.clear(),new Error("invalid_response")}}get complete(){return!!(this.data?.projection_complete&&!this.data.limiting_reasons.length)}expand(t){this.nodes.has(t)&&this.seeds.add(t)}explore(t,e=2){if(!this.data)return null;if(t=t||null,t!==this.root&&(this.seeds.clear(),this.visiblePaths=[],this.root=t),!t)return this.data;this.expand(t);let n=Math.max(1,Math.min(8,Number(e)||1)),s=new Map([...this.seeds].filter(l=>this.nodes.has(l)).map(l=>[l,0])),r=[...s.keys()];for(let l=0;l<r.length;l++){let c=r[l],u=s.get(c);if(!(u>=n))for(let m of this.outgoing.get(c))s.has(m.destination)||(s.set(m.destination,u+1),r.push(m.destination))}let a=this.visiblePaths.filter(l=>s.has(l)),o=new Set(a);for(let l of this.data.nodes)s.has(l.path)&&!o.has(l.path)&&a.push(l.path);return this.visiblePaths=a,{...this.data,nodes:a.map(l=>this.nodes.get(l)),edges:this.data.edges.filter(l=>s.has(l.source)&&s.has(l.destination))}}connections(t){return{incoming:this.incoming.get(t)||[],outgoing:this.outgoing.get(t)||[]}}};var lg={idle:"Idle",discover:"Discovering changes",validate:"Validating notes",dependencies:"Checking dependencies",relations:"Projecting relationships",priority:"Processing changed paths",backoff:"Waiting to retry",ready:"Ready"},cg={ready:"Ready",partial:"Updating",stale:"Changes pending",backoff:"Waiting to retry",unavailable:"Storage unavailable"},hg={native:"native notifications",poll:"polling",polling:"polling",disabled:"polling",starting:"starting",unknown:"unknown"},ug={healthy:"healthy",ready:"healthy",starting:"starting",degraded:"reconciliation required",unavailable:"unavailable",polling:"polling",stopped:"stopped",disabled:"disabled",unknown:"unknown"},dg={polling_configured:"Polling-only mode",watch_unavailable:"Notifications unavailable",overflow:"Notification overflow",directory_changed:"Directory coverage changed",watcher_unavailable:"Notifications unavailable",watcher_overflow:"Notification overflow",queue_overflow:"Queue overflow",watcher_restart:"Watcher restart",storage_changed:"Storage identity changed",watch_limit:"Watch limit reached",watcher_failed:"Watcher failed",coverage_uncertain:"Coverage uncertain",polling_only:"Polling-only mode"},Qa=i=>Number.isSafeInteger(i)&&i>=0?i.toLocaleString("en-US"):"0",Rh=i=>{let t=new Date(Number(i)*1e3);return Number.isFinite(i)&&i>0&&Number.isFinite(t.getTime())?t.toISOString().replace("T"," ").replace(".000Z"," UTC"):"not yet completed"};function Ih(i){return`${cg[i.state]||"Unknown"} \xB7 ${lg[i.phase]||"Unknown phase"}. ${Qa(i.metadata_checked)} metadata entries checked \xB7 ${Qa(i.parsed_notes)} changed notes parsed \xB7 ${Qa(i.dependencies_checked)} dependencies checked \xB7 ${Qa(i.pending_jobs)} queued changes. Last reconciliation: ${Rh(i.last_completed)}. Last content verification: ${Rh(i.last_verified)}. Watcher: ${hg[i.watcher_mode]||"unknown"} \xB7 ${ug[i.watcher_health]||"unknown"}.${i.fallback_reason?` Fallback: ${dg[i.fallback_reason]||"Reconciliation required"}.`:""}`}var Ph=!1,Lh=i=>"/notes/"+i.split("/").map(encodeURIComponent).join("/"),Ht=(i,t,e={})=>{let n=document.createElement(i);t!==void 0&&(n.textContent=t);for(let[s,r]of Object.entries(e))n.setAttribute(s,String(r));return n};async function fg(i,t){let e=await fetch(i,{credentials:"same-origin",cache:"no-store",redirect:"error",signal:t,headers:{Accept:"application/json"}});if(e.redirected||new URL(e.url).origin!==location.origin||!e.headers.get("content-type")?.startsWith("application/json"))throw new Error("invalid_response");let n=await e.json();if(!e.ok)throw new Error(e.status===401?"authentication_required":n.restart?"restart_required":n.reason_code||"graph_unavailable");if(n.untrusted_content!==!0)throw new Error("invalid_response");if(n.state==="unavailable"||n.freshness?.state==="unavailable")throw new Error(n.reason_code||"storage_unavailable");return n}function pg(i,{currentPath:t="",onClose:e=()=>{}}={}){let n=L=>i.querySelector(L),s=n("[data-graph-panel]")||i,r=n("[data-graph-filters]"),a=L=>r.elements.namedItem(L),o=n("[data-graph-status]"),l=n("[data-graph-open-selected]");function c(L){n("[data-graph-selection]").textContent=L?`Selected \xB7 ${L.title}`:"",l.hidden=!L,L?(l.setAttribute("href",L.href),l.setAttribute("aria-label",`Open selected note: ${L.title}`)):(l.removeAttribute("href"),l.removeAttribute("aria-label"))}let u=n("[data-graph-details]"),m=n("[data-graph-index-status]"),h=n("[data-graph-index-progress]");m&&(m.open=!1),h&&(h.textContent="Open for current indexing progress.");let f,g,y=()=>{clearTimeout(f),g?.abort(),g=null};async function p(){if(y(),!m?.open||A||xt.active!=="evidence")return;let L=new AbortController;g=L;try{let C=await fetch("/index/status/",{credentials:"same-origin",cache:"no-store",redirect:"error",signal:L.signal,headers:{Accept:"application/json"}});if(!C.ok||C.redirected||new URL(C.url).origin!==location.origin||!C.headers.get("content-type")?.startsWith("application/json"))throw new Error("status_unavailable");let K=await C.json();!L.signal.aborted&&m.open&&!A&&(h.textContent=Ih(K))}catch{L.signal.aborted||(h.textContent="Index progress is unavailable. Refresh or sign in again to try.")}finally{g===L&&(g=null,m.open&&!A&&xt.active==="evidence"&&(f=setTimeout(p,2e3)))}}let d=n("[data-graph-map]"),v=new AbortController,M=(L,C,K,Q={})=>L.addEventListener(C,K,{...Q,signal:v.signal}),w=L=>{o.textContent!==L&&(o.textContent=L)},E=new ja(location.origin),A=!1,R=0,_=null,b=null,D=null,I=t||null,O=t||null,B=Ph,G=!0,H=[],N=null,k=null,rt=null,q=null,at=!1,dt=!1,nt="",vt;try{vt=window.localStorage}catch{}let Ut=Sh(vt),kt=()=>{clearTimeout(b),b=null},Z=()=>!N?.path,it=L=>JSON.stringify(["folder","tag","query"].map(C=>L?.[C]||"")),lt=()=>{kt(),!A&&!document.hidden&&(b=setTimeout(()=>{b=null,st()},15e3))};m&&M(m,"toggle",()=>{m.open?p():y()}),n("[data-graph-filter-options]").open=!1,n("[data-graph-map-options]").open=!1,n("[data-graph-settings]").open=!1,n("[data-graph-forces]").open=!1,n("[data-graph-control-options]").open=!0;let Pt=()=>B?n("[data-graph-list-toggle]"):d,xt=Fl(i,{navigation:Pt,onShow:L=>{q?.cancelHints(),L==="find"&&$t(),L==="evidence"&&m?.open&&p()},onHide:L=>{L==="evidence"&&y()}}),It=()=>{xt.active!=="find"?xt.show("find",Pt()):n("[data-graph-find]").focus({preventScroll:!0})},ue=()=>{let L={...Object.fromEntries(new FormData(r)),depth:a("depth").value};return L.path||delete L.path,L},Nt=()=>({...N||ue()});function $t(){let L=document.activeElement?.dataset.graphFindPath,C=n("[data-graph-find]").value.trim().toLocaleLowerCase(),K=n("[data-graph-find-results]");K.replaceChildren();let Q=[...E.nodes.values()].filter(j=>!C||`${j.title} ${j.path}`.toLocaleLowerCase().includes(C));n("[data-graph-find-scope]").textContent=`Find in the loaded${["query","folder","tag"].some(j=>N?.[j]?.trim())?" filtered":""} snapshot${E.complete?"":" \xB7 Incomplete evidence"}. Selecting expands the exploration; the opening root stays fixed.`,n("[data-graph-find-count]").textContent=`${Q.length} matching notes${Q.length>50?" \xB7 First 50 shown; refine your search":""}`;for(let j of Q.slice(0,50)){let et=Ht("button",j.title,{type:"button","aria-label":`Select ${j.title}`,"data-graph-find-path":j.path});et.append(Ht("small",j.path)),et.addEventListener("click",()=>{E.nodes.has(j.path)&&(N.path&&E.expand(j.path),ct(),At(j.path,!0),xt.close({restore:!1}),Pt().focus({preventScroll:!0}))});let X=Ht("li");X.append(et),K.append(X)}Q.length||K.append(Ht("li",_?"Loading notes\u2026":"No matching notes in this snapshot. Change explicit filters to search another scope.")),L&&xt.active==="find"&&([...K.querySelectorAll("button")].find(j=>j.dataset.graphFindPath===L)||n("[data-graph-find]")).focus({preventScroll:!0})}M(n("[data-graph-find]"),"input",$t);let ee=L=>{if(!L||!D?.nodes.some(K=>K.path===L))return;let C=Ht("a","",{href:Lh(L),hidden:""});s.append(C);try{C.click()}finally{C.remove()}},Ft=()=>xt.show("help"),oe=()=>{xt.close()||e()},P=()=>{G=!1,B=!0,Wt(),dt||w("Map unavailable. Use the connection list, or retry the map."),n("[data-graph-graphics-retry]").hidden=!1};function le(){try{q=new Ka(d,{onSelect:(L,C)=>At(L,C),onOpen:ee,onCenter:L=>ot(L),onSearch:It,onEscape:oe,onHelp:Ft,onHint:w,onPause:L=>{n("[data-graph-pause]").setAttribute("aria-pressed",String(L))},onUnavailable:P,onRestored:()=>{G=!0,n("[data-graph-graphics-retry]").hidden=!0,w("Map ready. Switch to the map to continue.")},onLimit:()=>{}}),q.setForces(Ut),G=q.available!==!1,G||P()}catch{P()}}function Wt(){s.classList.toggle("graph-list-mode",B),n("[data-graph-list]").hidden=!B,d.hidden=B,B?q?.stop():(q?.draw(),q?.wake()),n("[data-graph-list-toggle]").setAttribute("aria-pressed",String(B)),n("[data-graph-hints]").disabled=B||!G}function Kt(){let L=Z(),C=Number(N?.depth||a("depth").value),K=["query","folder","tag"].filter(j=>(N?.[j]||"").trim());n("[data-graph-cancel]").hidden=at||dt||!_,n("[data-graph-resume]").hidden=!at||dt,n("[data-graph-restart]").hidden=!dt,n("[data-graph-depth-controls]").hidden=L,a("depth").disabled=L,n("[data-graph-depth-down]").disabled=C<=1,n("[data-graph-depth-up]").disabled=C>=8,n("[data-graph-depth-value]").textContent=`${C} hop${C===1?"":"s"}`,n("[data-graph-local]").setAttribute("aria-pressed",String(!L)),n("[data-graph-global]").setAttribute("aria-pressed",String(L)),c(E.nodes.get(I)),n("[data-graph-scope]").textContent=`${L?"Whole wiki":`Local \xB7 ${C} hop${C===1?"":"s"} \xB7 ${N?.path||a("path").value}`}${K.length?` \xB7 Filtered by ${K.map(j=>`${j}: ${N[j]}`).join(", ")}`:""}`;let Q=dt?"Partial \u2014 loading stopped":at?"Loading paused \xB7 Partial":_?"Loading\u2026":E.complete?"Complete":D?.limiting_reasons?.includes("index_updating")||D?.freshness?.state==="partial"?"Loaded available results \xB7 Index updating":"Loaded available results \xB7 Incomplete evidence";n("[data-graph-summary]").textContent=D?`${D.nodes.length} notes \xB7 ${D.edges.length} directed links \xB7 ${Q}${D.boundary_connections?" \xB7 Some connections are outside your filters":""}`:""}let gt=250,T=0,x=0;function U(L,C,K){let Q=n(`[data-graph-${L}-navigation]`),j=Q.contains(document.activeElement),et=document.activeElement===Q.lastElementChild;if(Q.replaceChildren(),Q.hidden=C<=gt,Q.hidden)return;let X=Ht("button",`Previous ${L}`,{type:"button"}),ht=Ht("button",`Next ${L}`,{type:"button"});X.disabled=K===0,ht.disabled=K+gt>=C;let Mt=Ot=>{L==="notes"?T=Math.max(0,T+Ot):x=Math.max(0,x+Ot),J()};if(X.addEventListener("click",()=>Mt(-gt)),ht.addEventListener("click",()=>Mt(gt)),Q.append(X,Ht("span",`${K+1}\u2013${Math.min(K+gt,C)} of ${C} loaded ${L}`),ht),j){let Ot=et?ht:X;(Ot.disabled?et?X:ht:Ot).focus({preventScroll:!0})}}function J(){let L=document.activeElement?.dataset.graphInspect,C=n("[data-graph-nodes]");C.replaceChildren();let K=[...D?.nodes||[]].sort((j,et)=>j.path.localeCompare(et.path));T=Math.min(T,Math.max(0,Math.floor((K.length-1)/gt)*gt)),x=Math.min(x,Math.max(0,Math.floor(((D?.edges.length||0)-1)/gt)*gt)),U("notes",K.length,T),U("links",D?.edges.length||0,x);for(let j of K.slice(T,T+gt)){let et=Ht("li"),X=Ht("button",`Inspect ${j.title}`,{type:"button","data-graph-inspect":j.path,"aria-pressed":String(j.path===I)});X.addEventListener("click",()=>{At(j.path,!1),xt.show("evidence",()=>[...C.querySelectorAll("[data-graph-inspect]")].find(Mt=>Mt.dataset.graphInspect===j.path))});let ht=Ht("a",`Open ${j.path}`,{href:j.href});j.path===t&&ht.setAttribute("aria-current","page"),et.append(Ht("strong",j.title),Ht("div",j.path),X,ht),C.append(et),L===j.path&&X.focus({preventScroll:!0})}D?.nodes.length||C.append(Ht("li",dt?nt==="graph_query_limited"?"The graph query limit was reached. Try fewer hops or narrower filters.":"Loading stopped. Check the graph status for recovery options.":_?"Loading connections\u2026":D&&E.complete?"No notes match this scope.":"Loaded available results. Relationships are still updating."));let Q=n("[data-graph-edges]");Q.replaceChildren();for(let j of(D?.edges||[]).slice(x,x+gt))Q.append(Ht("li",`${j.source} \u2192 ${j.destination} \xB7 ${j.occurrence_count} occurrence${j.occurrence_count===1?"":"s"}`))}function tt({suspend:L=!1}={}){L?E.suspend():(E.clear(),k=rt=null),D=null,I=O=null,T=x=0,L&&(d.hidden=!0),delete u.dataset.path,u.replaceChildren(Ht("h2","Selected note"),Ht("p","Select a note to see its connections.")),n("[data-graph-diagnostics]").textContent="",q?.setGraph({nodes:[],edges:[]},t,N?.path||null),q?.setSelection(null,null),J(),Kt(),$t()}function $(){D&&q&&(k=new Map(q.simulation.nodes),rt={selected:I,focused:O,navigationFocus:d.contains(document.activeElement)}),tt({suspend:!0})}function St(L){let C=E.nodes.get(L),K=u.dataset.path===L,Q=new Set(K?[...u.querySelectorAll("details[open]")].map(Mt=>Mt.dataset.graphDisclosure):[]),j=K&&u.contains(document.activeElement)?document.activeElement.dataset.graphDetailFocus:null;if(u.replaceChildren(Ht("h2","Selected note")),u.dataset.path=L||"",!C){u.append(Ht("p","Select a note to see its connections."));return}u.append(Ht("h3",C.title),Ht("p",L),Ht("a","Open selected note",{href:C.href,"data-graph-detail-focus":"open"}));let et=Ht("button","Expand selected note",{type:"button","data-graph-detail-focus":"expand"});et.addEventListener("click",()=>ot(L)),u.append(et),u.append(Ht("p",E.complete?"Saved connections":"Updating saved connections"));let X=E.connections(L);for(let[Mt,Ot]of[["incoming","Incoming"],["outgoing","Outgoing and references"]]){let Jt=Ht("ul");u.append(Ht("h3",Ot),Jt);for(let pe of X[Mt]){let Oe=Mt==="incoming"?pe.source:pe.destination,di=JSON.stringify([Mt,Oe]),En=Ht("li",void 0,{class:"graph-connection"});En.append(Ht("span",Oe,{class:"graph-connection-path"}),Ht("span",`${pe.occurrence_count} occurrence${pe.occurrence_count===1?"":"s"}`,{class:"graph-connection-count"})),En.append(Ht("a",Mt==="incoming"?"Open source":"Open destination",{href:E.nodes.get(Oe).href,"data-graph-detail-focus":di+":open"}));let Us=Ht("details",void 0,{"data-graph-disclosure":di});Us.append(Ht("summary","Source evidence",{"data-graph-detail-focus":di+":source"}),Ht("p",`${pe.source} \xB7 ${pe.position_precision||"advisory"} line ${pe.position?.[0]||"?"}, column ${pe.position?.[1]||"?"}`),Ht("code",pe.source_revision||"")),En.append(Us),Jt.append(En)}X[Mt].length||Jt.append(Ht("li",E.complete?"No saved connections.":"Connections are still updating."))}let ht=Ht("details",void 0,{"data-graph-disclosure":"technical"});ht.append(Ht("summary","Technical evidence",{"data-graph-detail-focus":"technical"}),Ht("p",`Indexed revision ${C.revision} \xB7 relation epoch ${D.relation_epoch} \xB7 observed ${D.observed_at}. Source locations are advisory; fragments are unchecked. Snapshot contains resolved note connections.`)),u.append(ht);for(let Mt of u.querySelectorAll("details"))Mt.open=Q.has(Mt.dataset.graphDisclosure);j&&[...u.querySelectorAll("[data-graph-detail-focus]")].find(Mt=>Mt.dataset.graphDetailFocus===j)?.focus({preventScroll:!0})}function ct({fit:L=!1}={}){if(D=E.explore(N.path||null,N.depth),!D)return;D.nodes.some(K=>K.path===I)||(I=D.nodes.some(K=>K.path===N.path)?N.path:null),D.nodes.some(K=>K.path===O)||(O=I||D.nodes[0]?.path||null);let C=!1;try{q?.setGraph(D,t,N.path||null),q?.setSelection(I,O)}catch{C=!0,P()}L&&D.nodes.length&&!C&&!q?.cameraControlled&&q?.fit(),J(),St(I),Wt(),Kt(),xt.active==="find"&&$t(),n("[data-graph-diagnostics]").textContent=`Index ${D.freshness.state} \xB7 relation epoch ${D.relation_epoch} \xB7 observed ${D.observed_at}. ${D.limiting_reasons.join(", ")} Indexed saved content, not a disk snapshot. Hops refer to loaded edges; unsaved edits are excluded.`,q?.hints?.active||w(C?"Map resource limit reached. All loaded records remain available in the connection list.":"")}function At(L,C){D?.nodes.some(K=>K.path===L)&&(I=L,C&&(O=L),N.path&&E.expand(L),ct(),w(`Selected ${L}.`))}function Rt({fit:L=!1,params:C=Nt()}={}){if(!E.data||it(C)!==it(N)){st({fit:L,params:C});return}N=C,ct({fit:L})}async function st({fit:L=!1,params:C=Nt()}={}){if(A||document.hidden)return;kt();let K=++R;_?.abort();let Q=new AbortController;_=Q,at=!1,dt=!1,nt="",N&&it(C)!==it(N)&&tt(),N=C,w(D?"Updating connections\u2026":"Loading connections\u2026"),Kt();try{let j=new URLSearchParams;for(let Ot of["folder","tag","query"])C[Ot]?.trim()&&j.set(Ot,C[Ot]);let et=await fg("/tools/graph/snapshot/?"+j,Q.signal);if(A||document.hidden||Q.signal.aborted||K!==R)return;let X=E.scope!==null,ht=E.accept(et),Mt=ht&&rt?.navigationFocus;if(!ht&&X&&(k=rt=null,I=O=null,q?.setGraph({nodes:[],edges:[]},t,N.path||null)),ht&&k&&q){for(let Ot of et.nodes)k.has(Ot.path)&&q.simulation.nodes.set(Ot.path,k.get(Ot.path));I=rt?.selected||I,O=rt?.focused||O}k=rt=null,N=Nt(),ct({fit:L}),Mt&&!B&&d.focus({preventScroll:!0})}catch(j){!A&&K===R&&!Q.signal.aborted&&(dt=!0,nt=j.message,tt(),w(j.message==="authentication_required"?"Session expired. Sign in again to load the graph.":j.message==="restart_required"?"Connections changed. Restart loading to revalidate this view.":j.message==="graph_query_limited"?"The graph query limit was reached. Try narrower filters or restart loading.":j.message==="graph_database_error"?"Connections could not load because of a database error. Refresh to try again.":"Unable to load connections. Restart loading to try again."))}finally{K===R&&(_=null,Kt(),lt())}}function ot(L){if(L){if(N?.path){At(L,!0);return}a("path").value=t||L,at=!1,Rt({fit:!0,params:{...Nt(),path:a("path").value}})}}M(r,"submit",L=>{L.preventDefault(),at=!1,st({fit:!0,params:ue()})});function yt(L){if(!N?.path){w("Hop depth applies to a local neighborhood. Choose Local first.");return}let C=Number(N.depth)+L;if(C<1||C>8){w(C<1?"Minimum local depth is one hop.":"Maximum local depth is eight hops; query resource limits may make the view partial.");return}a("depth").value=String(C),Rt({params:{...Nt(),depth:String(C)}})}M(n("[data-graph-depth-down]"),"click",()=>yt(-1)),M(n("[data-graph-depth-up]"),"click",()=>yt(1)),M(i,"keydown",L=>{!["[","]"].includes(L.key)||L.isComposing||L.ctrlKey||L.altKey||L.metaKey||L.target.closest("input, textarea, select, [contenteditable], [role=textbox]")||L.target!==d&&L.target!==n("[data-graph-list-toggle]")||(L.preventDefault(),L.stopPropagation(),yt(L.key==="["?-1:1))}),M(i,"keydown",L=>{if(!(L.isComposing||L.ctrlKey||L.altKey||L.metaKey)){if(L.key==="Escape"&&xt.active){L.preventDefault(),L.stopImmediatePropagation(),xt.close();return}if(L.target===d&&!q?.hints?.active&&["o","e"].includes(L.key)){L.preventDefault(),L.stopImmediatePropagation(),xt.show(L.key==="o"?"controls":"evidence");return}L.key==="Escape"&&L.target!==d&&(L.preventDefault(),L.stopImmediatePropagation(),oe())}},{capture:!0}),M(n("[data-graph-clear]"),"click",()=>{for(let L of["query","folder","tag"])a(L).value="";st({params:{...Nt(),query:"",folder:"",tag:""}})}),M(n("[data-graph-local]"),"click",()=>{N?.path||ot(t||I)}),M(n("[data-graph-global]"),"click",()=>{a("path").value="",a("depth").disabled=!1;let L=Nt();delete L.path,Rt({fit:!0,params:L})}),M(n("[data-graph-back]"),"click",()=>{at=!1,a("path").value=H.pop()||t,n("[data-graph-back]").disabled=!H.length,Rt({fit:!0,params:{...Nt(),path:a("path").value}})}),M(n("[data-graph-list-toggle]"),"click",()=>{xt.close({restore:!1}),q?.cancelHints(),B=!B||!G,G&&(Ph=B),Wt()}),M(n("[data-graph-hints]"),"click",()=>q?.hints?.active?q.cancelHints(!0):q?.beginHints()),M(n("[data-graph-fit]"),"click",()=>q?.fit()),M(n("[data-graph-reset]"),"click",()=>q?.resetOrientation());for(let L of i.querySelectorAll("[data-graph-orbit]"))M(L,"click",()=>q?.orbit(Number(L.dataset.graphOrbit),0));for(let L of i.querySelectorAll("[data-graph-zoom]"))M(L,"click",()=>q?.zoom(Number(L.dataset.graphZoom)));let bt={left:[-80,0],right:[80,0],up:[0,-80],down:[0,80]};for(let L of i.querySelectorAll("[data-graph-pan]"))M(L,"click",()=>q?.pan(...bt[L.dataset.graphPan]));M(n("[data-graph-pause]"),"click",()=>q?.setPaused(!q.paused)),M(n("[data-graph-bloom]"),"input",L=>{q?.setBloom(L.target.value);let C=["Off","Default","High"][Number(L.target.value)/2];L.target.setAttribute("aria-valuetext",C),n("[data-graph-bloom-value]").textContent=C}),M(n("[data-graph-refresh]"),"click",()=>{at=!1,st()}),M(n("[data-graph-cancel]"),"click",()=>{at=!0,R++,kt(),_?.abort(),_=null,tt(),Kt(),w("Loading paused. Resume loading to continue. Motion is unchanged.")}),M(n("[data-graph-resume]"),"click",()=>{at=!1,st()}),M(n("[data-graph-restart]"),"click",()=>{at=!1,st()}),M(n("[data-graph-graphics-retry]"),"click",()=>{q?.destroy(),q=null,le(),G&&(n("[data-graph-graphics-retry]").hidden=!0,B=!1,D&&(q.setGraph(D,t,N?.path||null),q.setSelection(I,O),q.fit()),Wt())});let mt=()=>{for(let L of i.querySelectorAll("[data-graph-force]")){let C=L.dataset.graphForce;L.value=String(Ut[C]),L.setAttribute("aria-valuetext",`${Ut[C]} times default`),n(`[data-graph-force-value="${C}"]`).textContent=`${Ut[C]}\xD7`}};for(let L of i.querySelectorAll("[data-graph-force]"))M(L,"input",()=>{Ut={...Ut,[L.dataset.graphForce]:Number(L.value)},vl(vt,Ut),mt(),q?.setForces(Ut)});return M(n("[data-graph-forces-reset]"),"click",()=>{Ut={...Vi},vl(vt,Ut),mt(),q?.setForces(Ut)}),mt(),M(n("[data-graph-help-toggle]"),"click",Ft),M(document,"visibilitychange",()=>{document.hidden?(y(),R++,kt(),_?.abort(),_=null,$()):A||(m?.open&&p(),st())}),M(window,"pagehide",()=>{y(),R++,kt(),_?.abort(),_=null,$(),q?.stop()}),M(window,"pageshow",L=>{L.persisted&&!A&&st()}),n("[data-graph-hints]").hidden=!1,n("[data-graph-controls]").hidden=!1,n("[data-graph-clear]").hidden=!1,n("[data-graph-list-toggle]").hidden=!1,i.matches("[data-graph-page]")&&i.classList.add("graph-enhanced"),le(),n("[data-graph-pause]").setAttribute("aria-pressed",String(q?.paused||!1)),q?.setBloom(n("[data-graph-bloom]").value),Wt(),N=Nt(),st({fit:!0}),{focusSearch:It,dismissLayer:()=>xt.close(),focusNavigation(){B?n("[data-graph-list-toggle]").focus({preventScroll:!0}):d.focus({preventScroll:!0})},destroy(){A=!0,y(),R++,kt(),_?.abort(),xt.destroy(),v.abort(),q?.destroy(),k=rt=null,E.clear(),D=null,I=O=null,n("[data-graph-nodes]").replaceChildren(),n("[data-graph-edges]").replaceChildren();for(let L of["notes","links"]){let C=n(`[data-graph-${L}-navigation]`);C.replaceChildren(),C.hidden=!0}for(let L of["nodeCount","edgeCount"])d.dataset[L]="0";for(let L of["root","selected","focused"])delete d.dataset[L];d.setAttribute("aria-label","3D note relationship map"),n("[data-graph-find-results]").replaceChildren(),n("[data-graph-find]").value="",n("[data-graph-find-count]").textContent="",delete u.dataset.path,c(null),u.replaceChildren(),n("[data-graph-summary]").textContent="",n("[data-graph-diagnostics]").textContent="",w("")}}}var Ds=document.querySelector("[data-graph-page]");if(Ds)try{pg(Ds,{currentPath:Ds.dataset.graphPath,onClose:()=>{let i=Ds.dataset.graphPath;location.assign(i?Lh(i):"/")}}),Ds.querySelector("[data-graph-server-list]")?.remove(),document.querySelector("#graph-initial-data")?.remove(),document.querySelector("#graph-initial-params")?.remove()}catch{}export{pg as mountGraph};
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
