// World-space units. Camera projection alone determines apparent mesh size.
export const nodeRadius = (path, selected) => path === selected ? 7 : 5;
// The tip and halo triangle corners are shared within each reusable output.
export function createConnectionGeometry() {
  const start=[0,0,0],tip=[0,0,0];
  const startLeft=[0,0,0],startRight=[0,0,0],tipLeft=[0,0,0],tipRight=[0,0,0];
  return {start,tip,arrow:[tip,[0,0,0],[0,0,0]],halo:[startLeft,startRight,tipLeft,tipLeft,startRight,tipRight]};
}

export function connectionGeometry(a,b,startRadius,endRadius,{right,back:view},output=createConnectionGeometry()) {
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.max(.01,Math.hypot(dx,dy,dz));
  const ux=dx/length,uy=dy/length,uz=dz/length;
  const startInset=Math.min(length*.3,startRadius);
  const inset=Math.min(length*.3,endRadius);
  const size=Math.min(length*.25,6);
  let sx=dy*view.z-dz*view.y,sy=dz*view.x-dx*view.z,sz=dx*view.y-dy*view.x;
  let magnitude=Math.hypot(sx,sy,sz);
  if(magnitude<.001){sx=right.x;sy=right.y;sz=right.z;magnitude=1;}
  sx/=magnitude;sy/=magnitude;sz/=magnitude;
  const {start,tip,arrow,halo}=output;
  for(let i=0;i<3;i++){
    const unit=i===0?ux:i===1?uy:uz,side=i===0?sx:i===1?sy:sz;
    start[i]=(i===0?a.x:i===1?a.y:a.z)+unit*startInset;
    tip[i]=(i===0?b.x:i===1?b.y:b.z)-unit*inset;
    const base=tip[i]-unit*size;
    arrow[1][i]=base+side*size*.5;
    arrow[2][i]=base-side*size*.5;
    halo[0][i]=start[i]+side*3;
    halo[1][i]=start[i]-side*3;
    halo[2][i]=tip[i]+side*3;
    halo[5][i]=tip[i]-side*3;
  }
  return output;
}
