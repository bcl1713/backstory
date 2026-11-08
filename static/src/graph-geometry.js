// World-space units. Camera projection alone determines apparent mesh size.
export const nodeRadius = (path, selected) => path === selected ? 7 : 5;
export function connectionGeometry(a,b,startRadius,endRadius,{right,back:view}) {
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.max(.01,Math.hypot(dx,dy,dz));
  const unit=[dx/length,dy/length,dz/length];
  const start=[a.x+unit[0]*Math.min(length*.3,startRadius),a.y+unit[1]*Math.min(length*.3,startRadius),a.z+unit[2]*Math.min(length*.3,startRadius)];
  const inset=Math.min(length*.3,endRadius);
  const tip=[b.x-unit[0]*inset,b.y-unit[1]*inset,b.z-unit[2]*inset];
  const size=Math.min(length*.25,6),base=tip.map((v,i)=>v-unit[i]*size);
  let side=[dy*view.z-dz*view.y,dz*view.x-dx*view.z,dx*view.y-dy*view.x];
  let magnitude=Math.hypot(...side);
  if(magnitude<.001){side=[right.x,right.y,right.z];magnitude=1;}
  side=side.map(v=>v/magnitude);
  const arrow=[tip,base.map((v,i)=>v+side[i]*size*.5),base.map((v,i)=>v-side[i]*size*.5)];
  const corners=[start.map((v,i)=>v+side[i]*3),start.map((v,i)=>v-side[i]*3),tip.map((v,i)=>v+side[i]*3),tip.map((v,i)=>v-side[i]*3)];
  return {start,tip,arrow,halo:[0,1,2,2,1,3].map(i=>corners[i])};
}
