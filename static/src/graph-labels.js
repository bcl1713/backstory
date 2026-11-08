// Screen-space presentation only. Nodes, directed links and physics never change.
export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const PAD = 4, HEIGHT = 20, CELL = 48;

export function layoutLabels({ nodes, projected, width, height, selected, focused, current,
  measure, maximum = 48, previous = new Map(), edges = [], hintMode = false }) {
  if (width < 40 || height < 28 || maximum <= 0) return [];
  const neighbors = new Set(edges.flatMap(e => e.source === selected ? [e.destination] : e.destination === selected ? [e.source] : []));
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
  const important = nodes.filter(n => priority(n.path)).sort((a,b) => priority(b.path)-priority(a.path));
  // Ordinary candidates have a fixed ceiling, independent of total graph size.
  const candidates = [...important, ...nodes.filter(n => !priority(n.path) && onScreen(projected.get(n.path))).slice(0, Math.max(128, maximum * 8))];
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
    for (const distance of [22, 42, 66]) {
      positions.push({ slot:`r${distance}`,x:p.x+distance,y:p.y-HEIGHT/2 },
        { slot:`l${distance}`,x:p.x-distance-w,y:p.y-HEIGHT/2 },
        { slot:`u${distance}`,x:p.x-w/2,y:p.y-distance-HEIGHT },
        { slot:`d${distance}`,x:p.x-w/2,y:p.y+distance },
        { slot:`ur${distance}`,x:p.x+distance,y:p.y-distance-HEIGHT },
        { slot:`ul${distance}`,x:p.x-distance-w,y:p.y-distance-HEIGHT },
        { slot:`dr${distance}`,x:p.x+distance,y:p.y+distance },
        { slot:`dl${distance}`,x:p.x-distance-w,y:p.y+distance });
    }
    if (priority(node.path)) {
      // Crowded important identities can move to clear viewport margins, with
      // a leader to their original node. Never paint them over one another.
      const margins = [];
      for (let y = PAD; y + HEIGHT <= height-PAD; y += HEIGHT + PAD) {
        margins.push({ slot:`left${y}`,x:PAD,y }, { slot:`right${y}`,x:width-PAD-w,y });
      }
      const distance = s => Math.hypot(Math.max(s.x-p.x,0,p.x-s.x-w), Math.max(s.y-p.y,0,p.y-s.y-HEIGHT));
      margins.sort((a,b) => distance(a)-distance(b)); positions.push(...margins);
    }
    const old = previous.get(node.path), index = positions.findIndex(s => s.slot === old);
    if (index > 0) positions.unshift(positions.splice(index,1)[0]);
    let position = positions.find(s => clear({ x:s.x,y:s.y,w,h:HEIGHT }));
    if (!position && priority(node.path)) {
      // Last resort for a viewport filled with marks: use a distinct backed
      // identity chip. Marks are still painted separately, above every label.
      position = positions.find(s => s.slot.startsWith('left') && !occupied.some(r => overlaps({ x:s.x,y:s.y,w,h:HEIGHT },r)));
    }
    if (!position) continue;
    const rect = { x:position.x,y:position.y,w,h:HEIGHT };
    const anchor = { x:Math.max(rect.x,Math.min(rect.x+rect.w,p.x)), y:Math.max(rect.y,Math.min(rect.y+rect.h,p.y)) };
    placed.push({ path:node.path,text,rect,anchor,slot:position.slot,priority:priority(node.path),secondary }); occupied.push(rect);
  }
  return placed;
}
