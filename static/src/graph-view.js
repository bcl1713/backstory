import * as THREE from 'three';
import { WorkerGraphPhysics } from './graph-physics-client.js';
import { GraphCamera } from './graph-camera.js';
import { layoutLabels } from './graph-labels.js';
import { GraphHints, hintAssignments, outboundDestinations } from './graph-hints.js';
import { nodeRadius, connectionGeometry, createConnectionGeometry } from './graph-geometry.js';
import { hopTiers, emission, nearestNode, AdaptiveQuality, BLOOM_DEFAULT, BLOOM_HIGH } from './graph-layout.js';

function geometry(count, color = false, alpha = false) {
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
  if (color) result.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * (alpha ? 4 : 3)), alpha ? 4 : 3).setUsage(THREE.DynamicDrawUsage));
  return result;
}
// Five draw batches regardless of graph size. No node owns a scene object or DOM
// element. Directed arrow triangles have their own shared position/color buffers.
export function createGraphBatches(nodes, edges) {
  const group = new THREE.Group();
  const marks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), nodes.length);
  marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const lines = new THREE.LineSegments(geometry(edges.length * 2, true, true), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .62, depthWrite: false }));
  const arrows = new THREE.Mesh(geometry(edges.length * 3, true, true), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .85, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }));
  const haloMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { viewportHeight: { value: 1 } },
    vertexShader: 'attribute vec3 color; attribute float diameter; varying vec3 glow; uniform float viewportHeight; void main(){ glow=color; vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_PointSize=diameter*projectionMatrix[1][1]*viewportHeight/(2.*max(.01,-p.z)); }',
    fragmentShader: `varying vec3 glow; void main(){ float r=length(gl_PointCoord-vec2(.5))*2.; if(r>1.) discard; float a=pow(1.-r,2.)*.6; gl_FragColor=vec4(glow,a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}` });
  const halos = new THREE.Points(geometry(nodes.length, true), haloMaterial);
  halos.geometry.setAttribute('diameter', new THREE.BufferAttribute(new Float32Array(nodes.length), 1));
  const strips = geometry(edges.length * 6, true, true);
  const uv = new Float32Array(edges.length * 12);
  for (let i = 0; i < edges.length; i++) uv.set([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1], i * 12);
  strips.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const edgeHalos = new THREE.Mesh(strips, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    vertexShader: 'attribute vec4 color; varying vec4 glow; varying vec2 strip; void main(){ glow=color; strip=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec4 glow; varying vec2 strip; void main(){ float a=pow(1.-abs(strip.y*2.-1.),2.)*.28; gl_FragColor=vec4(glow.rgb,a*glow.a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}` }));
  for (const object of [edgeHalos, halos, lines, arrows, marks]) { object.frustumCulled = false; group.add(object); }
  return { group, nodes: marks, edges: lines, arrows, halos, edgeHalos,
    dispose() { for (const object of group.children) { object.geometry.dispose(); object.material.dispose(); object.dispose?.(); } group.clear(); } };
}

export class GraphView {
  constructor(container, actions = {}) {
    this.container = container; this.actions = actions; this.life = new AbortController();
    this.simulation = new WorkerGraphPhysics({ onStatus: mode => {
      this.container.dataset.physics = mode; this.actions.onPhysicsStatus?.(mode);
    } }); this.camera = new GraphCamera(); this.quality = new AdaptiveQuality();
    this.data = { nodes: [], edges: [] }; this.selected = this.focused = null;
    this.frame = null; this.destroyed = false; this.intensity = BLOOM_DEFAULT; this.pointers = new Map(); this.projected = new Map();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)'); this.forced = matchMedia('(forced-colors: active)');
    this.paused = this.reduced.matches;
    if (this.paused) this.simulation.suspend();
    this.canvas = document.createElement('canvas'); this.canvas.setAttribute('aria-hidden', 'true');
    this.labels = document.createElement('canvas'); this.labels.setAttribute('aria-hidden', 'true'); this.labelContext = this.labels.getContext('2d');
    this.swatch = document.createElement('canvas'); this.swatch.width = this.swatch.height = 1; this.swatchContext = this.swatch.getContext('2d', { willReadFrequently: true });
    this.hints = new GraphHints(); this.hintButtons = new Map();
    this.hintLayer = document.createElement('div'); this.hintLayer.className = 'graph-hints';
    this.hintLayer.setAttribute('role', 'group'); this.hintLayer.setAttribute('aria-label', 'Node selection hints');
    this.hintLayer.hidden = true;
    container.replaceChildren(this.canvas, this.labels, this.hintLayer); container.graphView = this;
    this.scene = new THREE.Scene(); this.renderCamera = new THREE.PerspectiveCamera(45, 1, 1, 1000000);
    this.matrix = new THREE.Matrix4(); this.color = new THREE.Color();
    const listen = (el, name, fn, options = {}) => el.addEventListener(name, fn, { ...options, signal: this.life.signal });
    // Register before WebGLRenderer so our state is paused throughout recovery.
    listen(this.canvas, 'webglcontextlost', event => { event.preventDefault(); this.unavailable = true; this.release(null, true); this.stop(); this.container.dataset.renderer = 'lost'; this.actions.onUnavailable?.('The 3D map lost its graphics context. Your loaded notes remain available in the list.'); });
    listen(this.canvas, 'webglcontextrestored', () => queueMicrotask(() => { if (this.destroyed) return; this.unavailable = false; this.container.dataset.renderer = 'webgl'; this.syncSize(); this.themeDirty = true; this.draw(); this.wake(); this.actions.onRestored?.(); }));
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.container.dataset.renderer = 'webgl';
    } catch {
      this.unavailable = true; this.simulation.suspend(); this.container.dataset.renderer = 'unavailable';
      queueMicrotask(() => { if (!this.destroyed) this.actions.onUnavailable?.('WebGL is unavailable. Your loaded notes remain available in the list.'); });
    }
    this.resize = new ResizeObserver(() => { if (!this.syncSize()) return; if (!this.sized && this.loaded && !this.cameraControlled && this.camera.width > 0) this.camera.fit(this.simulation.nodes, true); this.sized = true; this.draw(); });
    this.resize.observe(container); this.syncSize();
    this.themeObserver = new MutationObserver(() => { this.updateTheme(); this.draw(); });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-color-scheme', 'data-theme'] });
    this.updateTheme();
    listen(container, 'keydown', event => this.keydown(event));
    listen(container, 'focusout', event => { if (!container.contains(event.relatedTarget)) this.cancelHints(); });
    listen(container, 'pointerdown', event => this.pointerDown(event));
    listen(container, 'pointermove', event => this.pointerMove(event));
    listen(container, 'pointerup', event => this.release(event, false));
    for (const name of ['pointercancel', 'lostpointercapture']) listen(container, name, event => this.release(event, true));
    listen(container, 'wheel', event => { if (event.ctrlKey || event.metaKey || event.altKey) return; event.preventDefault(); this.zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12, this.point(event)); }, { passive: false });
    listen(document, 'visibilitychange', () => { if (document.hidden) { this.release(null, true); this.stop(); } else this.wake(); });
    listen(this.reduced, 'change', () => { this.paused = this.reduced.matches; if (this.paused) { this.simulation.pause(); this.camera.snap(); this.stop(); } else this.simulation.reheat(); this.actions.onPause?.(this.paused); this.draw(); this.wake(); });
    listen(this.forced, 'change', () => { this.updateTheme(); this.draw(); });
    if (document.fonts) listen(document.fonts, 'loadingdone', () => { this.labelMetrics?.clear(); this.draw(); });
  }
  get available() { return !this.unavailable; }
  updateTheme() {
    const style = getComputedStyle(this.container), ctx = this.swatchContext;
    this.labelMetrics?.clear();
    this.fontFamily = style.fontFamily || 'sans-serif';
    const read = (token, fallback) => {
      const value = style.getPropertyValue(token).trim() || fallback;
      if (!ctx) return fallback;
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = fallback; ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
      const rgb = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    };
    this.theme = { background: read('--surface', '#141820'), node: read('--graph-node', '#8ab4f8'), edge: read('--graph-edge', '#8a919d'),
      destination: read('--graph-destination', '#81c995'), highlight: read('--graph-highlight', '#c5a5ff'), bloom: read('--graph-bloom', '#8ab4f8'), label: read('--foreground', '#e8e8e8'), focus: read('--focus', '#f4c95d') };
    // System colors resolve through CSS; Canvas ensures WebGL itself does not
    // suppress the user's forced palette or leave faint halos behind.
    if (this.forced.matches && ctx) {
      const probe = document.createElement('span'); probe.style.color = 'CanvasText'; this.container.append(probe);
      this.theme.node = this.theme.edge = this.theme.label = getComputedStyle(probe).color;
      probe.style.color = 'Highlight'; this.theme.destination = this.theme.highlight = this.theme.focus = getComputedStyle(probe).color;
      probe.style.color = 'Canvas'; this.theme.background = getComputedStyle(probe).color; probe.remove();
    }
    this.themeDirty = true;
  }
  syncSize() {
    const bounds = this.container.getBoundingClientRect(); if (!bounds.width || !bounds.height) return false;
    this.camera.width = bounds.width; this.camera.height = bounds.height;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.quality.dpr);
    if (this.renderer && !this.unavailable) { this.renderer.setPixelRatio(this.pixelRatio); this.renderer.setSize(bounds.width, bounds.height, false); }
    this.labels.width = Math.round(bounds.width * this.pixelRatio); this.labels.height = Math.round(bounds.height * this.pixelRatio); return true;
  }
  setGraph(data, current, root = current) {
    const topology = JSON.stringify([data.nodes.map(node => node.path), data.edges.map(edge => [edge.source, edge.destination])]);
    const changed = topology !== this.topology;
    if (!data.nodes.length) this.cancelHints();
    this.data = data; this.current = current; this.root = root;
    if (!changed) { this.refreshShortcuts(); this.simulation.setRoot(root); if (this.paused) this.simulation.pause(); this.themeDirty = true; this.draw(); return; }
    this.topology = topology; this.release(null, true);
    // Drop derived identities immediately, including when a hidden map cannot draw.
    this.projected?.clear(); this.pickGrid?.clear();
    for (const bucket of this.pickBuckets || []) bucket.length = 0;
    if (!data.nodes.length) { this.pickBuckets = []; this.edgeGeometry = null; }
    this.drawnBatch = null;
    this.simulation.setGraph(data.nodes, data.edges);
    // Revalidated positions can be restored before their adjacency is rebuilt.
    // Install that adjacency before a changed root computes its BFS.
    this.simulation.setRoot(root);
    if (!this.loaded && data.nodes.length) {
      // Every layout starts from its stable seed and advances cooperatively.
      // Installation never spends multiple synchronous warmup steps on input.
      if (!this.cameraControlled) this.camera.fit(this.simulation.nodes, true);
      this.loaded = true;
    }
    if (this.paused) this.simulation.pause();
    if (this.batch) { this.scene.remove(this.batch.group); this.batch.dispose(); }
    this.batch = createGraphBatches(data.nodes, data.edges); this.scene.add(this.batch.group);
    this.container.dataset.nodeCount = String(data.nodes.length); this.container.dataset.edgeCount = String(data.edges.length);
    this.setSelection(this.selected, this.focused); this.wake();
  }
  setSelection(selected, focused) {
    this.selected = selected; this.focused = focused;
    this.simulation.setSelection(selected);
    if (this.root === null) this.simulation.setRoot(selected);
    if (this.paused) this.simulation.pause();
    this.tiers = hopTiers(this.data.nodes, this.data.edges, selected);
    this.destinations = outboundDestinations(this.data.edges,selected); this.refreshShortcuts(); this.themeDirty = true;
    this.container.dataset.root = this.root || '';
    this.container.dataset.selected = selected || ''; this.container.dataset.focused = focused || '';
    const roles = [['Current note',this.current],['Selected note',selected],['Keyboard focus',focused],['Opening root',this.root]].filter(([,path])=>path).map(([role,path])=>`${role}: ${path}`).join(' · ');
    this.container.setAttribute('aria-label', `3D note relationship map · ${roles}`);
    this.draw(); this.wake();
  }
  setForces(value) {
    this.simulation.setForces(value);
    // Updating presentation never overrides deliberate pause or reduced motion.
    if (this.paused) this.simulation.pause();
    this.draw(); this.wake();
  }
  setBloom(value) { this.intensity = Math.min(BLOOM_HIGH, Math.max(0, Number(value) || 0)); this.container.dataset.bloom = String(this.intensity); this.themeDirty = true; this.draw(); }
  setPaused(value) {
    this.paused = !!value || this.reduced.matches; this.release(null, true);
    if (this.paused) { this.simulation.pause(); this.camera.snap(); this.stop(); } else { this.simulation.reheat(); this.wake(); }
    this.actions.onPause?.(this.paused); this.draw();
  }
  fit() { if (!this.simulation.nodes.size) return; this.cameraControlled = true; this.camera.fit(this.simulation.nodes, this.paused); this.draw(); this.wake(); }
  resetOrientation() { this.cameraControlled = true; this.camera.resetOrientation(this.paused); this.draw(); this.wake(); }
  orbit(dx, dy) { this.cameraControlled = true; this.camera.orbit(dx, dy, this.paused); this.draw(); this.wake(); }
  zoom(factor, point) { this.cameraControlled = true; this.camera.zoom(factor, point, this.paused); this.draw(); this.wake(); }
  pan(dx, dy) { this.cameraControlled = true; this.camera.pan(dx, dy, this.paused); this.draw(); this.wake(); }
  refreshShortcuts() {
    const key = JSON.stringify([this.selected,this.data.nodes.map(n=>[n.path,n.title]),this.data.edges.map(e=>[e.source,e.destination])]);
    if (key === this.shortcutKey) return;
    this.shortcutKey=key;
    this.shortcutAssignments=hintAssignments({...this.data,selected:this.selected,visibleOnly:false});
    this.shortcutCodes=new Map(this.shortcutAssignments.map(h=>[h.path,h.code]));
    const destinations = outboundDestinations(this.data.edges, this.selected);
    this.labelCandidates = this.data.nodes.filter(n => n.path === this.selected || destinations.has(n.path)).map(node =>
      destinations.has(node.path) && this.shortcutCodes.has(node.path) ? {...node, title:`f ${this.shortcutCodes.get(node.path)} · ${node.title}`} : node);
    this.labelMetrics = new Map();
  }
  beginHints() {
    if (this.unavailable || this.container.hidden) return;
    this.refreshShortcuts();
    this.hints.begin({ ...this.data, assignments:this.shortcutAssignments, selected: this.selected, projected: this.projected, width: this.camera.width, height: this.camera.height });
    this.hintButtons.clear(); this.hintLayer.replaceChildren();
    for (const hint of this.hints.assignments) {
      const button = document.createElement('button'); button.type = 'button'; button.tabIndex = -1;
      button.textContent = hint.code; button.dataset.graphHint = hint.code;
      button.setAttribute('aria-label', `${hint.code}: Select ${hint.title}, ${hint.path}`);
      button.addEventListener('click', () => this.completeHint(hint.path));
      this.hintLayer.append(button); this.hintButtons.set(hint.path, button);
    }
    this.container.focus({ preventScroll: true });
    this.actions.onHint?.(this.hints.active ? 'Node hints: type a code to select and expand. Escape cancels; Backspace edits.' : 'No nodes are visible for hints.');
    this.draw();
  }
  cancelHints(announce = false) {
    if (!this.hints?.active && !this.hintButtons?.size) return;
    this.hints.cancel(); this.hintButtons.clear(); this.hintLayer.replaceChildren(); this.hintLayer.hidden = true;
    this.container.dataset.hintMode = 'false';
    if (announce) { this.actions.onHint?.('Node hints cancelled.'); this.draw(); }
  }
  completeHint(path) {
    this.cancelHints(); this.container.focus({ preventScroll: true });
    if (this.data.nodes.some(node => node.path === path)) this.actions.onSelect?.(path, true);
    else this.actions.onHint?.('That node is no longer available. Enter hint mode again.');
    this.draw();
  }
  drawHints() {
    if (!this.hints?.active) { if (this.hintLayer) this.hintLayer.hidden = true; return; }
    this.hintLayer.hidden = false; this.container.dataset.hintMode = 'true';
    const paths = new Set(this.data.nodes.map(n=>n.path));
    const assignments = this.hints.assignments.filter(h => h.code.startsWith(this.hints.prefix) && paths.has(h.path));
    const byPath = new Map(assignments.map(h=>[h.path,h]));
    const placements = layoutLabels({ nodes: assignments.map(h => ({path:h.path,title:h.code})),
      projected: this.projected, width: this.camera.width, height: this.camera.height,
      measure: text => Math.max(16,text.length * 9), maximum: assignments.length, hintMode:true, previous:this.hintSlots });
    this.hintSlots = new Map(placements.map(p => [p.path,p.slot]));
    for (const button of this.hintButtons.values()) button.hidden = true;
    for (const placement of placements) {
      const button = this.hintButtons.get(placement.path); if (!button) continue;
      button.hidden = false; button.style.width = `${placement.rect.w}px`; button.style.left = `${placement.rect.x}px`; button.style.top = `${placement.rect.y}px`;
      const hint = byPath.get(placement.path); button.textContent = hint.code;
      const p = this.projected.get(placement.path), ctx = this.labelContext;
      if (ctx) { ctx.strokeStyle=this.theme.focus; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(placement.anchor.x,placement.anchor.y);ctx.stroke(); }
    }
  }
  keydown(event) {
    if (event.target !== this.container || event.isComposing || event.altKey || event.metaKey || event.ctrlKey || event.getModifierState?.('AltGraph')) return;
    if (this.hints?.active) {
      if (event.key === 'Tab') { this.cancelHints(true); return; }
      event.preventDefault(); event.stopPropagation();
      const result = this.hints.key(event.key);
      if (result.path) { this.completeHint(result.path); return; }
      if (result.cancelled) { this.cancelHints(true); this.actions.onHint?.('Node hints cancelled.'); }
      else this.actions.onHint?.(result.invalid ? 'No matching hint. Backspace edits; Escape cancels.' : `Node hints: ${this.hints.prefix || 'type a code'}`);
      this.draw(); return;
    }
    if (event.key === 'f') { event.preventDefault(); event.stopPropagation(); this.beginHints(); return; }
    const direction = { ArrowLeft: 'left', h: 'left', ArrowRight: 'right', l: 'right', ArrowUp: 'up', k: 'up', ArrowDown: 'down', j: 'down' }[event.key];
    if (direction) {
      const visible = new Map([...this.projected].filter(([path, p]) => path === this.focused || p.visible && p.x >= 0 && p.x <= this.camera.width && p.y >= 0 && p.y <= this.camera.height));
      const path = nearestNode(visible, this.focused, direction); if (path) this.actions.onSelect?.(path, true);
    } else if (event.key === 'Enter') this.actions.onOpen?.(this.focused);
    else if (event.key === ' ') this.actions.onCenter?.(this.focused);
    else if (event.key === '/') this.actions.onSearch?.();
    else if (event.key === '?') this.actions.onHelp?.();
    else if (event.key === 'Escape') this.actions.onEscape?.();
    else if (event.key === '+' || event.key === '=') this.zoom(1.25);
    else if (event.key === '-') this.zoom(.8);
    else return;
    event.preventDefault(); event.stopPropagation();
  }
  point(event) { const r = this.canvas.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; }
  pick(point) {
    const x = Math.floor(point.x / 36), y = Math.floor(point.y / 36); let path = null, nearest = 22;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const candidate of this.pickGrid?.get(`${x + dx},${y + dy}`) || []) {
      const p = this.projected.get(candidate), distance = Math.hypot(point.x - p.x, point.y - p.y);
      if (distance < nearest) { path = candidate; nearest = distance; }
    }
    return path;
  }
  pointerDown(event) {
    this.cameraControlled = true;
    if (event.target.closest?.('.graph-hints')) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || this.unavailable) return;
    this.cancelHints();
    const point = this.point(event); this.pointers.set(event.pointerId, point);
    this.container.focus({ preventScroll: true }); this.container.setPointerCapture(event.pointerId);
    if (this.pointers.size > 1) { if (this.drag?.path) this.simulation.unpin(this.drag.path); this.drag = null; this.gesture = this.gestureState(); return; }
    this.drag = { pointer: event.pointerId, path: this.pick(point), start: point, previous: point, moved: false, pan: event.shiftKey || event.pointerType === 'pen' };
  }
  gestureState() { const [a, b] = [...this.pointers.values()]; return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) } : null; }
  pointerMove(event) {
    if (!this.pointers.has(event.pointerId)) return;
    const point = this.point(event); this.pointers.set(event.pointerId, point);
    if (this.pointers.size > 1) {
      const next = this.gestureState(), previous = this.gesture;
      if (previous) { this.camera.pan(previous.x - next.x, previous.y - next.y, true); this.camera.zoom(next.distance / previous.distance, next, true); }
      this.gesture = next; this.draw(); return;
    }
    const drag = this.drag; if (!drag) return;
    if (Math.hypot(point.x - drag.start.x, point.y - drag.start.y) > 5) drag.moved = true;
    if (!drag.moved) return;
    if (drag.path) {
      const world = this.camera.world(point, this.simulation.nodes.get(drag.path)); this.simulation.pin(drag.path, world.x, world.y, world.z); this.container.dataset.pinned = 'true';
    } else if (drag.pan) this.camera.pan(drag.previous.x - point.x, drag.previous.y - point.y, true);
    else this.camera.orbit((drag.previous.x - point.x) * .006, (point.y - drag.previous.y) * .006, true);
    drag.previous = point; this.draw(); this.wake();
  }
  release(event, cancelled) {
    if (!event) {
      for (const id of this.pointers.keys()) if (this.container.hasPointerCapture(id)) this.container.releasePointerCapture(id);
      this.pointers.clear();
    } else { this.pointers.delete(event.pointerId); if (this.container.hasPointerCapture(event.pointerId)) this.container.releasePointerCapture(event.pointerId); }
    const drag = this.drag;
    if (drag && (!event || drag.pointer === event.pointerId)) {
      this.drag = null; if (drag.path) this.simulation.unpin(drag.path);
      if (!cancelled && !drag.moved && drag.path) this.actions.onSelect?.(drag.path, true);
    }
    this.gesture = null; this.container.dataset.pinned = 'false';
    if (!this.paused) this.wake();
  }
  applyColors(bloom) {
    const batch = this.batch;
    this.data.nodes.forEach((node, i) => {
      const highlighted = node.path === this.selected, focused = node.path === this.focused, destination = this.destinations?.has(node.path);
      const accent = this.theme.destination || this.theme.focus;
      batch.nodes.setColorAt(i, this.color.set(highlighted ? this.theme.highlight : destination ? accent : focused ? this.theme.focus : this.theme.node));
      this.color.set(highlighted ? this.theme.highlight : destination ? accent : this.theme.bloom).multiplyScalar(emission(this.tiers.nodes.get(node.path), bloom));
      this.color.toArray(batch.halos.geometry.attributes.color.array, i * 3);
    });
    this.data.edges.forEach((edge, i) => {
      const spring = this.simulation.isSpringEdge(edge.source, edge.destination);
      const direct = edge.source === this.selected && edge.destination !== this.selected;
      const alpha = this.forced.matches || spring || direct ? 1 : .12;
      this.color.set(direct ? this.theme.destination || this.theme.focus : this.tiers.edges[i] <= 1 ? this.theme.highlight : this.theme.edge);
      for (const [object, vertices] of [[batch.edges, 2], [batch.arrows, 3]]) for (let v = 0; v < vertices; v++) {
        object.geometry.attributes.color.setXYZW(i * vertices + v, this.color.r, this.color.g, this.color.b, alpha);
      }
      // Quiet context cannot become a competing glow at the higher setting.
      this.color.set(this.theme.bloom).multiplyScalar(emission(this.tiers.edges[i], spring ? bloom : Math.min(1, bloom)));
      for (let v = 0; v < 6; v++) batch.edgeHalos.geometry.attributes.color.setXYZW(i * 6 + v, this.color.r, this.color.g, this.color.b, alpha);
    });
    if (batch.nodes.instanceColor) batch.nodes.instanceColor.needsUpdate = true;
    for (const o of [batch.halos, batch.edges, batch.arrows, batch.edgeHalos]) o.geometry.attributes.color.needsUpdate = true;
    this.themeDirty = false;
  }
  draw({ positionsChanged = false } = {}) {
    if (this.destroyed || this.unavailable || !this.renderer || !this.batch || document.hidden || this.container.hidden) return;
    const batch = this.batch, camera = this.camera, basis = camera.basis(), eye = camera.eye(basis);
    const fields = ['x', 'y', 'z', 'yaw', 'pitch', 'distance', 'width', 'height'];
    const previousCamera = this.drawnCamera;
    const cameraChanged = !previousCamera || fields.some(key => previousCamera[key] !== camera[key]);
    const worldChanged = positionsChanged || this.drawnPositionVersion !== this.simulation.positionVersion || this.drawnBatch !== batch || this.drawnSelection !== this.selected;
    const geometryChanged = worldChanged || cameraChanged;
    this.renderCamera.aspect = camera.width / camera.height; this.renderCamera.position.set(eye.x, eye.y, eye.z); this.renderCamera.lookAt(camera.x, camera.y, camera.z); this.renderCamera.updateProjectionMatrix(); this.renderCamera.updateMatrixWorld();
    const bloom = this.quality.bloom(this.intensity, this.forced.matches);
    batch.halos.visible = batch.edgeHalos.visible = bloom > 0; batch.halos.material.uniforms.viewportHeight.value = camera.height * this.pixelRatio;
    if (this.themeDirty) this.applyColors(bloom);
    this.renderer.setClearColor(this.theme.background);
    if (geometryChanged) {
      // Reuse projected records and picking buckets instead of allocating one
      // basis, point and bucket array for every node on every changed frame.
      this.pickGrid ||= new Map(); this.pickGrid.clear(); this.pickBuckets ||= [];
      let usedBuckets = 0;
      if (this.drawnBatch !== batch) for (const path of this.projected.keys()) if (!this.simulation.nodes.has(path)) this.projected.delete(path);
      this.compareDepth ||= (a, b) => this.projected.get(a).depth - this.projected.get(b).depth;
      for (let index = 0; index < this.data.nodes.length; index++) {
        const node = this.data.nodes[index], n = this.simulation.nodes.get(node.path);
        const projected = camera.screen(n, this.projected.get(node.path), basis);
        const radius = nodeRadius(node.path, this.selected); projected.radius = radius * projected.scale; this.projected.set(node.path, projected);
        if (worldChanged) {
          this.matrix.makeScale(radius, radius, radius); this.matrix.setPosition(n.x, n.y, n.z); batch.nodes.setMatrixAt(index, this.matrix);
          batch.halos.geometry.attributes.position.setXYZ(index, n.x, n.y, n.z);
          batch.halos.geometry.attributes.diameter.setX(index, radius * 9.6);
        }
        if (projected.visible && projected.x > -36 && projected.x < camera.width + 36 && projected.y > -36 && projected.y < camera.height + 36) {
          const key = `${Math.floor(projected.x / 36)},${Math.floor(projected.y / 36)}`;
          let bucket = this.pickGrid.get(key);
          if (!bucket) {
            bucket = this.pickBuckets[usedBuckets] ||= []; usedBuckets++; bucket.length = 0; this.pickGrid.set(key, bucket);
          }
          bucket.push(node.path); bucket.sort(this.compareDepth); if (bucket.length > 32) bucket.length = 32;
        }
      }
      for (let index = usedBuckets; index < this.pickBuckets.length; index++) this.pickBuckets[index].length = 0;
    }
    if (geometryChanged || bloom > 0 && !this.drawnBloom) {
      this.edgeGeometry ||= createConnectionGeometry();
      const lines = batch.edges.geometry.attributes.position, arrows = batch.arrows.geometry.attributes.position, halos = batch.edgeHalos.geometry.attributes.position;
      for (let index = 0; index < this.data.edges.length; index++) {
        const edge = this.data.edges[index], a = this.simulation.nodes.get(edge.source), b = this.simulation.nodes.get(edge.destination);
        if (!a || !b) continue;
        const shape = connectionGeometry(a, b, nodeRadius(edge.source, this.selected), nodeRadius(edge.destination, this.selected), basis, this.edgeGeometry);
        lines.setXYZ(index * 2, shape.start[0], shape.start[1], shape.start[2]);
        lines.setXYZ(index * 2 + 1, shape.tip[0], shape.tip[1], shape.tip[2]);
        for (let vertex = 0; vertex < 3; vertex++) { const point = shape.arrow[vertex]; arrows.setXYZ(index * 3 + vertex, point[0], point[1], point[2]); }
        if (bloom > 0) for (let vertex = 0; vertex < 6; vertex++) { const point = shape.halo[vertex]; halos.setXYZ(index * 6 + vertex, point[0], point[1], point[2]); }
      }
      lines.needsUpdate = arrows.needsUpdate = true;
      if (bloom > 0) halos.needsUpdate = true;
    }
    if (worldChanged) {
      batch.nodes.instanceMatrix.needsUpdate = true;
      batch.halos.geometry.attributes.diameter.needsUpdate = true;
      batch.halos.geometry.attributes.position.needsUpdate = true;
    }
    this.drawnCamera ||= {}; for (const key of fields) this.drawnCamera[key] = camera[key];
    this.drawnPositionVersion = this.simulation.positionVersion; this.drawnBatch = batch; this.drawnSelection = this.selected; this.drawnBloom = bloom;
    this.renderer.render(this.scene, this.renderCamera); this.drawLabels(); this.drawHints();
    Object.assign(this.container.dataset, { motion: this.paused ? 'paused' : this.simulation.active ? 'moving' : 'settled', lowWork: String(this.quality.level > 0), quality: String(this.quality.level), cameraYaw: String(camera.yaw), cameraPitch: String(camera.pitch), bloomEffective: String(bloom) });
  }
  drawLabels() {
    const ctx = this.labelContext; if (!ctx) return;
    const camera = this.camera; ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0); ctx.clearRect(0, 0, camera.width, camera.height);
    ctx.font = `12px ${this.fontFamily}`; ctx.lineJoin = 'round'; ctx.lineWidth = 4;
    const destinations = this.destinations || outboundDestinations(this.data.edges || [],this.selected);
    const labels = layoutLabels({ nodes: this.labelCandidates || this.data.nodes, projected: this.projected,
      width: camera.width, height: camera.height, selected: this.selected, focused: this.focused, current: this.current, edges: this.data.edges, neighbors: destinations,
      measure: (text,secondary) => {
        this.labelMetrics ||= new Map();
        const key = `${secondary}:${text}`;
        if (!this.labelMetrics.has(key)) { ctx.font = `${secondary ? 11 : 12}px ${this.fontFamily}`; this.labelMetrics.set(key, ctx.measureText(text).width); }
        return this.labelMetrics.get(key);
      }, maximum: this.hints?.active ? 0 : this.quality.labels, previous: this.labelSlots });
    this.labelSlots = new Map(labels.map(label => [label.path, label.slot]));
    this.labelPlacements = labels;
    // Short local leaders keep each backed identity tied to its node.
    for (const label of labels) {
      const p = this.projected.get(label.path), { rect, anchor } = label;
      ctx.globalAlpha = label.secondary ? .78 : 1;
      ctx.strokeStyle = label.path === this.selected ? this.theme.highlight : destinations.has(label.path) ? this.theme.destination || this.theme.focus : this.theme.label;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(anchor.x, anchor.y); ctx.stroke();
    }
    // All backed labels cover crossing leaders, including a later node's line.
    for (const label of labels) {
      const { rect } = label;
      ctx.font = `${label.secondary ? 11 : 12}px ${this.fontFamily}`; ctx.globalAlpha = label.secondary ? .78 : 1;
      ctx.fillStyle = this.theme.background; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = this.theme.background; ctx.fillStyle = destinations.has(label.path) ? this.theme.destination || this.theme.focus : this.theme.label; ctx.lineWidth = 3;
      ctx.strokeText(label.text, rect.x + 4, rect.y + 14); ctx.fillText(label.text, rect.x + 4, rect.y + 14);
    }
    ctx.globalAlpha = 1;
    // A ring identifies outbound destinations even in monochrome themes.
    for (const path of destinations) {
      const p=this.projected.get(path);
      if (!p?.visible || p.x<0 || p.x>camera.width || p.y<0 || p.y>camera.height || [this.current,this.selected,this.focused,this.root].includes(path)) continue;
      ctx.strokeStyle=this.theme.destination || this.theme.focus; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(5,p.radius || 5)+3,0,Math.PI*2); ctx.stroke();
    }
    // One primary outline per identity; dashed focus, a current-note corner,
    // and an opening-root dot combine without stacking redundant rings.
    for (const path of new Set([this.current, this.selected, this.focused, this.root])) {
      const p = this.projected.get(path);
      if (!p?.visible || p.x < 0 || p.x > camera.width || p.y < 0 || p.y > camera.height) continue;
      const selected = path === this.selected, current = path === this.current, focused = path === this.focused;
      ctx.lineWidth = 2; ctx.strokeStyle = selected ? this.theme.highlight : current ? this.theme.label : this.theme.focus;
      if (focused) ctx.setLineDash([4,3]);
      if (selected) { ctx.beginPath(); ctx.moveTo(p.x,p.y-13); ctx.lineTo(p.x+13,p.y); ctx.lineTo(p.x,p.y+13); ctx.lineTo(p.x-13,p.y); ctx.closePath(); ctx.stroke(); }
      else if (current || focused) ctx.strokeRect(p.x-10,p.y-10,20,20);
      else { ctx.beginPath(); ctx.arc(p.x,p.y,10,0,Math.PI*2); ctx.stroke(); }
      ctx.setLineDash([]);
      if (current && selected) { ctx.strokeStyle=this.theme.label; ctx.beginPath(); ctx.moveTo(p.x-4,p.y+7); ctx.lineTo(p.x-4,p.y+3); ctx.lineTo(p.x,p.y+3); ctx.stroke(); }
      if (path === this.root) { ctx.fillStyle=this.theme.label; ctx.fillRect(p.x-2,p.y-15,4,4); }
    }
  }

  snapshot() { return { renderer: this.container.dataset.renderer, nodes: this.data.nodes.length, edges: this.data.edges.length, selected: this.selected, focused: this.focused, camera: { x: this.camera.x, y: this.camera.y, z: this.camera.z, yaw: this.camera.yaw, pitch: this.camera.pitch, distance: this.camera.distance }, projected: [...this.projected].map(([path, p]) => ({ path, ...p })) }; }
  wake() {
    if (this.destroyed || this.unavailable || document.hidden || this.container.hidden || this.frame !== null || this.paused) return;
    this.simulation.resume?.(); this.lastTime = performance.now(); this.frame = requestAnimationFrame(time => this.tick(time));
  }
  tick(time) {
    this.frame = null; if (this.destroyed || this.unavailable || document.hidden || this.container.hidden || this.paused) return;
    const elapsed = Math.max(0, (time - this.lastTime) / 1000); this.lastTime = time;
    if (this.quality.sample(elapsed)) { this.themeDirty = true; this.syncSize(); }
    // A solver slice can make progress without publishing a complete step.
    // Keep camera input independent, and redraw only a coherent changed scene.
    const version = this.simulation.positionVersion;
    this.simulation.advance(elapsed);
    const positionsChanged = this.simulation.positionVersion !== version || this.drawnPositionVersion != null && this.drawnPositionVersion !== this.simulation.positionVersion;
    const moving = this.camera.tick(elapsed);
    if (positionsChanged || moving || this.themeDirty) this.draw({ positionsChanged });
    if (this.simulation.active || moving) this.frame = requestAnimationFrame(next => this.tick(next));
    else if (this.simulation.limitReached) this.actions.onLimit?.();
  }
  stop() { if (this.frame !== null) cancelAnimationFrame(this.frame); this.frame = null; this.simulation.suspend?.(); this.simulation.cancelPending?.(); }
  destroy() {
    this.cancelHints(); this.release(null, true); this.destroyed = true; this.stop(); this.life.abort(); this.resize.disconnect(); this.themeObserver.disconnect();
    this.labelCandidates = []; this.labelMetrics?.clear();
    this.batch?.dispose(); this.renderer?.dispose(); this.simulation.destroy(); this.projected.clear(); this.pickGrid?.clear(); this.pickBuckets = []; this.edgeGeometry = null; this.drawnCamera = this.drawnBatch = null;
    if (this.container.graphView === this) delete this.container.graphView; this.container.replaceChildren();
  }
}
