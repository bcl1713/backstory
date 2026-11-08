import {outboundDestinations} from './graph-hints.js';
// Screen-space presentation only. Nodes, directed links and physics never change.
export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const PAD = 4, HEIGHT = 20, CELL = 48;

export function layoutLabels({ nodes, projected, width, height, selected, focused, current,
  measure, maximum = 48, previous = new Map(), edges = [], hintMode = false }) {
  if (width < 40 || height < 28 || maximum <= 0) return [];
  const neighbors = outboundDestinations(edges,selected);
  const priority = path => path === selected ? 5 : path === focused ? 4 : neighbors.has(path) ? 3 : path === current ? 2 : hintMode ? 1 : 0;
  const onScreen = p => p?.visible && p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height;
  // Spatial lookup includes *all* displayed marks, even nodes without a label.
  const grid = new Map();
  const cells = rect => {
    const keys = [];
    for (let x = Math.floor(rect.x / CELL); x <= Math.floor((rect.x + rect.w) / CELL); x++)
      for (let y = Math.floor(rect.y / CELL); y <= Math.floor((rect.y + rect.h) / CELL); y++) keys.push(`${x},${y}`);
    return keys;
  };
  for (const [path, p] of projected) {
    if (!onScreen(p)) continue;
    const radius = Math.max(p.radius || 0, priority(path) >= 4 || path === current ? 19 : 8), rect = { x: p.x - radius, y: p.y - radius, w: radius * 2, h: radius * 2 };
    for (const key of cells(rect)) { if (!grid.has(key)) grid.set(key, []); grid.get(key).push(rect); }
  }
  const visibleCount = [...projected.values()].filter(onScreen).length;
  if (!hintMode) maximum = Math.min(maximum, Math.max(3, Math.floor(width * height / (3500 + visibleCount * 50))));
  // Titles belong only to selection and outbound destinations. Hint mode may
  // still label every visible target by code, without revealing distant titles.
  const candidates = nodes.filter(n => hintMode || n.path === selected || neighbors.has(n.path))
    .sort((a,b) => priority(b.path)-priority(a.path));
  const placed = [], occupied = [];
  const clear = rect => rect.x >= PAD && rect.y >= PAD && rect.x + rect.w <= width-PAD && rect.y + rect.h <= height-PAD
    && !occupied.some(other => overlaps(rect, other))
    && !cells(rect).some(key => grid.get(key)?.some(mark => overlaps(rect, mark)));
  for (const node of candidates) {
    if (placed.length >= maximum) break;
    const p = projected.get(node.path); if (!onScreen(p)) continue;
    const title = Array.from(String(node.title || node.path));
    const secondary = !priority(node.path);
    const maxWidth = Math.min(240, (width - PAD * 2) * .58), shortened = [...title];
    let text = shortened.join('');
    while (measure(text, secondary) + 8 > maxWidth && shortened.length > 1) { shortened.pop(); text = shortened.join('') + '…'; }
    const w = Math.min(width-PAD*2, measure(text, secondary)+8);
    const positions = [];
    // Slot identities stay constant while orbiting/zooming. Keep the previous
    // valid slot before trying alternatives, so labels do not flip every frame.
    for (const distance of [22, 42, 66, 88]) {
      positions.push({ slot:`r${distance}`,x:p.x+distance,y:p.y-HEIGHT/2 },
        { slot:`l${distance}`,x:p.x-distance-w,y:p.y-HEIGHT/2 },
        { slot:`u${distance}`,x:Math.max(PAD,Math.min(width-PAD-w,p.x-w/2)),y:p.y-distance-HEIGHT },
        { slot:`d${distance}`,x:Math.max(PAD,Math.min(width-PAD-w,p.x-w/2)),y:p.y+distance },
        { slot:`ur${distance}`,x:p.x+distance,y:p.y-distance-HEIGHT },
        { slot:`ul${distance}`,x:p.x-distance-w,y:p.y-distance-HEIGHT },
        { slot:`dr${distance}`,x:p.x+distance,y:p.y+distance },
        { slot:`dl${distance}`,x:p.x-distance-w,y:p.y+distance });
    }
    const old = previous.get(node.path), index = positions.findIndex(s => s.slot === old);
    if (index > 0) positions.unshift(positions.splice(index,1)[0]);
    const anchorAt = rect => ({ x:Math.max(rect.x,Math.min(rect.x+rect.w,p.x)), y:Math.max(rect.y,Math.min(rect.y+rect.h,p.y)) });
    const crosses = (a,b,c,d) => {
      const side = (p,q,r) => (q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
      return side(a,b,c)*side(a,b,d)<0 && side(c,d,a)*side(c,d,b)<0;
    };
    const position = positions.find(s => {
      const rect = {x:s.x,y:s.y,w,h:HEIGHT}, anchor = anchorAt(rect);
      if (!clear(rect) || Math.hypot(p.x-anchor.x,p.y-anchor.y)>100) return false;
      // Keep leaders local and non-crossing. Omit a crowded secondary title
      // rather than send a line across the canvas to a viewport margin.
      return !placed.some(label => {
        const other = projected.get(label.path);
        const r = label.rect, corners = [{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x+r.w,y:r.y+r.h},{x:r.x,y:r.y+r.h}];
        const own = [{x:rect.x,y:rect.y},{x:rect.x+rect.w,y:rect.y},{x:rect.x+rect.w,y:rect.y+rect.h},{x:rect.x,y:rect.y+rect.h}];
        return crosses(p,anchor,other,label.anchor) || corners.some((c,i)=>crosses(p,anchor,c,corners[(i+1)%4])) || own.some((c,i)=>crosses(other,label.anchor,c,own[(i+1)%4]));
      });
    });
    if (!position) continue;
    const rect = { x:position.x,y:position.y,w,h:HEIGHT };
    const anchor = { x:Math.max(rect.x,Math.min(rect.x+rect.w,p.x)), y:Math.max(rect.y,Math.min(rect.y+rect.h,p.y)) };
    placed.push({ path:node.path,text,rect,anchor,slot:position.slot,priority:priority(node.path),secondary }); occupied.push(rect);
  }
  return placed;
}
