import * as THREE from 'three';
import { GraphPhysics } from './graph-physics.js';
import { GraphCamera } from './graph-camera.js';
import { hopTiers, emission, nearestNode, AdaptiveQuality } from './graph-layout.js';

function geometry(count, color = false) {
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
  if (color) result.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
  return result;
}
// Five draw batches regardless of graph size. No node owns a scene object or DOM
// element. Directed arrow triangles have their own shared position/color buffers.
export function createGraphBatches(nodes, edges) {
  const group = new THREE.Group();
  const marks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), nodes.length);
  marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const lines = new THREE.LineSegments(geometry(edges.length * 2, true), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .62 }));
  const arrows = new THREE.Mesh(geometry(edges.length * 3, true), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .85, side: THREE.DoubleSide, forceSinglePass: true }));
  const haloMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { dpr: { value: 1 } },
    vertexShader: 'attribute vec3 color; varying vec3 glow; uniform float dpr; void main(){ glow=color; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize=48.*dpr; }',
    fragmentShader: `varying vec3 glow; void main(){ float r=length(gl_PointCoord-vec2(.5))*2.; if(r>1.) discard; float a=pow(1.-r,2.)*.6; gl_FragColor=vec4(glow,a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}` });
  const halos = new THREE.Points(geometry(nodes.length, true), haloMaterial);
  const strips = geometry(edges.length * 6, true);
  const uv = new Float32Array(edges.length * 12);
  for (let i = 0; i < edges.length; i++) uv.set([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1], i * 12);
  strips.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const edgeHalos = new THREE.Mesh(strips, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    vertexShader: 'attribute vec3 color; varying vec3 glow; varying vec2 strip; void main(){ glow=color; strip=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 glow; varying vec2 strip; void main(){ float a=pow(1.-abs(strip.y*2.-1.),2.)*.28; gl_FragColor=vec4(glow,a*max(max(glow.r,glow.g),glow.b));
#include <colorspace_fragment>
}` }));
  for (const object of [edgeHalos, halos, lines, arrows, marks]) { object.frustumCulled = false; group.add(object); }
  return { group, nodes: marks, edges: lines, arrows, halos, edgeHalos,
    dispose() { for (const object of group.children) { object.geometry.dispose(); object.material.dispose(); object.dispose?.(); } group.clear(); } };
}

export class GraphView {
  constructor(container, actions = {}) {
    this.container = container; this.actions = actions; this.life = new AbortController();
    this.simulation = new GraphPhysics(); this.camera = new GraphCamera(); this.quality = new AdaptiveQuality();
    this.data = { nodes: [], edges: [] }; this.selected = this.focused = null;
    this.frame = null; this.destroyed = false; this.intensity = 1; this.pointers = new Map(); this.projected = new Map();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)'); this.forced = matchMedia('(forced-colors: active)');
    this.paused = this.reduced.matches;
    this.canvas = document.createElement('canvas'); this.canvas.setAttribute('aria-hidden', 'true');
    this.labels = document.createElement('canvas'); this.labels.setAttribute('aria-hidden', 'true'); this.labelContext = this.labels.getContext('2d');
    this.swatch = document.createElement('canvas'); this.swatch.width = this.swatch.height = 1; this.swatchContext = this.swatch.getContext('2d', { willReadFrequently: true });
    container.replaceChildren(this.canvas, this.labels); container.graphView = this;
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
      this.unavailable = true; this.container.dataset.renderer = 'unavailable';
      queueMicrotask(() => { if (!this.destroyed) this.actions.onUnavailable?.('WebGL is unavailable. Your loaded notes remain available in the list.'); });
    }
    this.resize = new ResizeObserver(() => { if (!this.syncSize()) return; if (!this.sized && this.loaded && this.camera.width > 0) this.camera.fit(this.simulation.nodes, true); this.sized = true; this.draw(); });
    this.resize.observe(container); this.syncSize();
    this.themeObserver = new MutationObserver(() => { this.updateTheme(); this.draw(); });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-color-scheme', 'data-theme'] });
    this.updateTheme();
    listen(container, 'keydown', event => this.keydown(event));
    listen(container, 'pointerdown', event => this.pointerDown(event));
    listen(container, 'pointermove', event => this.pointerMove(event));
    listen(container, 'pointerup', event => this.release(event, false));
    for (const name of ['pointercancel', 'lostpointercapture']) listen(container, name, event => this.release(event, true));
    listen(container, 'wheel', event => { if (event.ctrlKey || event.metaKey || event.altKey) return; event.preventDefault(); this.zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12, this.point(event)); }, { passive: false });
    listen(document, 'visibilitychange', () => { if (document.hidden) { this.release(null, true); this.stop(); } else this.wake(); });
    listen(this.reduced, 'change', () => { this.paused = this.reduced.matches; if (this.paused) { this.simulation.settle(0); this.camera.snap(); this.stop(); } else this.simulation.reheat(); this.actions.onPause?.(this.paused); this.draw(); this.wake(); });
    listen(this.forced, 'change', () => { this.updateTheme(); this.draw(); });
  }
  get available() { return !this.unavailable; }
  updateTheme() {
    const style = getComputedStyle(this.container), ctx = this.swatchContext;
    this.fontFamily = style.fontFamily || 'sans-serif';
    const read = (token, fallback) => {
      const value = style.getPropertyValue(token).trim() || fallback;
      if (!ctx) return fallback;
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = fallback; ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
      const rgb = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    };
    this.theme = { background: read('--surface', '#141820'), node: read('--graph-node', '#8ab4f8'), edge: read('--graph-edge', '#8a919d'),
      highlight: read('--graph-highlight', '#c5a5ff'), bloom: read('--graph-bloom', '#8ab4f8'), label: read('--foreground', '#e8e8e8'), focus: read('--focus', '#f4c95d') };
    // System colors resolve through CSS; Canvas ensures WebGL itself does not
    // suppress the user's forced palette or leave faint halos behind.
    if (this.forced.matches && ctx) {
      const probe = document.createElement('span'); probe.style.color = 'CanvasText'; this.container.append(probe);
      this.theme.node = this.theme.edge = this.theme.label = getComputedStyle(probe).color;
      probe.style.color = 'Highlight'; this.theme.highlight = this.theme.focus = getComputedStyle(probe).color;
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
  setGraph(data, current) {
    this.release(null, true); this.data = data; this.current = current;
    this.simulation.setGraph(data.nodes, data.edges);
    if (!this.loaded) {
      for (let i = 0; i < (data.nodes.length > 256 ? 2 : 12); i++) this.simulation.step();
      this.camera.fit(this.simulation.nodes, true); this.loaded = true;
    }
    if (this.paused) this.simulation.settle(0);
    if (this.batch) { this.scene.remove(this.batch.group); this.batch.dispose(); }
    this.batch = createGraphBatches(data.nodes, data.edges); this.scene.add(this.batch.group);
    this.container.dataset.nodeCount = String(data.nodes.length); this.container.dataset.edgeCount = String(data.edges.length);
    this.setSelection(this.selected, this.focused); this.wake();
  }
  setSelection(selected, focused) {
    this.selected = selected; this.focused = focused;
    this.tiers = hopTiers(this.data.nodes, this.data.edges, selected); this.themeDirty = true;
    this.container.dataset.selected = selected || ''; this.container.dataset.focused = focused || '';
    const node = this.data.nodes.find(n => n.path === focused);
    this.container.setAttribute('aria-label', `3D note relationship map${node ? ` · Focused ${node.title}, ${node.path}` : ''}`);
    this.draw();
  }
  setForces(value) {
    this.simulation.setForces(value);
    // Updating presentation never overrides deliberate pause or reduced motion.
    if (this.paused) this.simulation.settle(0);
    this.draw(); this.wake();
  }
  setBloom(value) { this.intensity = Math.min(2, Math.max(0, Number(value) || 0)); this.container.dataset.bloom = String(this.intensity); this.themeDirty = true; this.draw(); }
  setPaused(value) {
    this.paused = !!value || this.reduced.matches; this.release(null, true);
    if (this.paused) { this.simulation.settle(0); this.camera.snap(); this.stop(); } else { this.simulation.reheat(); this.wake(); }
    this.actions.onPause?.(this.paused); this.draw();
  }
  fit() { this.camera.fit(this.simulation.nodes, this.paused); this.draw(); this.wake(); }
  resetOrientation() { this.camera.resetOrientation(this.paused); this.draw(); this.wake(); }
  orbit(dx, dy) { this.camera.orbit(dx, dy, this.paused); this.draw(); this.wake(); }
  zoom(factor, point) { this.camera.zoom(factor, point, this.paused); this.draw(); this.wake(); }
  pan(dx, dy) { this.camera.pan(dx, dy, this.paused); this.draw(); this.wake(); }
  keydown(event) {
    if (event.target !== this.container || event.isComposing || event.altKey || event.metaKey || event.ctrlKey || event.getModifierState?.('AltGraph')) return;
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
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || this.unavailable) return;
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
      const highlighted = node.path === this.selected, focused = node.path === this.focused;
      batch.nodes.setColorAt(i, this.color.set(highlighted ? this.theme.highlight : focused ? this.theme.focus : this.theme.node));
      this.color.set(highlighted ? this.theme.highlight : this.theme.bloom).multiplyScalar(emission(this.tiers.nodes.get(node.path), bloom));
      this.color.toArray(batch.halos.geometry.attributes.color.array, i * 3);
    });
    this.data.edges.forEach((edge, i) => {
      this.color.set(this.tiers.edges[i] <= 1 ? this.theme.highlight : this.theme.edge);
      for (let v = 0; v < 2; v++) this.color.toArray(batch.edges.geometry.attributes.color.array, (i * 2 + v) * 3);
      for (let v = 0; v < 3; v++) this.color.toArray(batch.arrows.geometry.attributes.color.array, (i * 3 + v) * 3);
      this.color.set(this.theme.bloom).multiplyScalar(emission(this.tiers.edges[i], bloom));
      for (let v = 0; v < 6; v++) this.color.toArray(batch.edgeHalos.geometry.attributes.color.array, (i * 6 + v) * 3);
    });
    if (batch.nodes.instanceColor) batch.nodes.instanceColor.needsUpdate = true;
    for (const o of [batch.halos, batch.edges, batch.arrows, batch.edgeHalos]) o.geometry.attributes.color.needsUpdate = true;
    this.themeDirty = false;
  }
  draw() {
    if (this.destroyed || this.unavailable || !this.renderer || !this.batch || document.hidden || this.container.hidden) return;
    const batch = this.batch, camera = this.camera, eye = camera.eye(), { right, back: view } = camera.basis();
    this.renderCamera.aspect = camera.width / camera.height; this.renderCamera.position.set(eye.x, eye.y, eye.z); this.renderCamera.lookAt(camera.x, camera.y, camera.z); this.renderCamera.updateProjectionMatrix(); this.renderCamera.updateMatrixWorld();
    const bloom = this.quality.bloom(this.intensity, this.forced.matches);
    batch.halos.visible = batch.edgeHalos.visible = bloom > 0; batch.halos.material.uniforms.dpr.value = this.pixelRatio;
    if (this.themeDirty) this.applyColors(bloom);
    this.renderer.setClearColor(this.theme.background);
    this.projected.clear(); this.pickGrid = new Map();
    this.data.nodes.forEach((node, index) => {
      const n = this.simulation.nodes.get(node.path), p = camera.screen(n); this.projected.set(node.path, p);
      const radius = (node.path === this.selected ? 7 : 5) / Math.max(.0001, p.scale);
      this.matrix.makeScale(radius, radius, radius); this.matrix.setPosition(n.x, n.y, n.z); batch.nodes.setMatrixAt(index, this.matrix);
      batch.halos.geometry.attributes.position.setXYZ(index, n.x, n.y, n.z);
      if (p.visible && p.x > -36 && p.x < camera.width + 36 && p.y > -36 && p.y < camera.height + 36) {
        const key = `${Math.floor(p.x / 36)},${Math.floor(p.y / 36)}`; let bucket = this.pickGrid.get(key);
        if (!bucket) this.pickGrid.set(key, bucket = []);
        // Nearer points remain pickable in very dense projected clusters.
        bucket.push(node.path); bucket.sort((a, b) => this.projected.get(a).depth - this.projected.get(b).depth); if (bucket.length > 32) bucket.length = 32;
      }
    });
    this.data.edges.forEach((edge, index) => {
      const a = this.simulation.nodes.get(edge.source), b = this.simulation.nodes.get(edge.destination); if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, length = Math.max(.01, Math.hypot(dx, dy, dz));
      const scale = Math.max(.0001, this.projected.get(edge.destination).scale), inset = Math.min(length * .3, 9 / scale);
      const tip = [b.x - dx / length * inset, b.y - dy / length * inset, b.z - dz / length * inset];
      batch.edges.geometry.attributes.position.setXYZ(index * 2, a.x, a.y, a.z); batch.edges.geometry.attributes.position.setXYZ(index * 2 + 1, ...tip);
      const size = Math.min(length * .25, 6 / scale), back = [tip[0] - dx / length * size, tip[1] - dy / length * size, tip[2] - dz / length * size];
      // A camera-facing perpendicular gives arrowheads visible in every orbit.
      let sx = dy * view.z - dz * view.y, sy = dz * view.x - dx * view.z, sz = dx * view.y - dy * view.x;
      const side = Math.hypot(sx, sy, sz); if (side < .001) { sx = right.x; sy = right.y; sz = right.z; }
      const magnitude = Math.max(.001, Math.hypot(sx, sy, sz));
      if (bloom > 0) {
        const startWidth = 7 / Math.max(.0001, this.projected.get(edge.source).scale) / magnitude;
        const endWidth = 7 / scale / magnitude;
        const corners = [[a.x + sx * startWidth, a.y + sy * startWidth, a.z + sz * startWidth],
          [a.x - sx * startWidth, a.y - sy * startWidth, a.z - sz * startWidth],
          [tip[0] + sx * endWidth, tip[1] + sy * endWidth, tip[2] + sz * endWidth],
          [tip[0] - sx * endWidth, tip[1] - sy * endWidth, tip[2] - sz * endWidth]];
        for (const [v, c] of [0, 1, 2, 2, 1, 3].entries()) batch.edgeHalos.geometry.attributes.position.setXYZ(index * 6 + v, ...corners[c]);
      }
      const width = size * .5 / magnitude;
      batch.arrows.geometry.attributes.position.setXYZ(index * 3, ...tip);
      batch.arrows.geometry.attributes.position.setXYZ(index * 3 + 1, back[0] + sx * width, back[1] + sy * width, back[2] + sz * width);
      batch.arrows.geometry.attributes.position.setXYZ(index * 3 + 2, back[0] - sx * width, back[1] - sy * width, back[2] - sz * width);
    });
    batch.nodes.instanceMatrix.needsUpdate = true;
    for (const object of [batch.halos, batch.edges, batch.edgeHalos, batch.arrows]) object.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.renderCamera); this.drawLabels();
    Object.assign(this.container.dataset, { motion: this.paused ? 'paused' : this.simulation.active ? 'moving' : 'settled', lowWork: String(this.quality.level > 0), quality: String(this.quality.level), cameraYaw: String(camera.yaw), cameraPitch: String(camera.pitch), bloomEffective: String(bloom) });
  }
  drawLabels() {
    const ctx = this.labelContext; if (!ctx) return;
    const camera = this.camera; ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0); ctx.clearRect(0, 0, camera.width, camera.height);
    ctx.font = `12px ${this.fontFamily}`; ctx.lineJoin = 'round'; ctx.lineWidth = 4;
    const priority = path => path === this.selected ? 3 : path === this.focused ? 2 : path === this.current ? 1 : 0;
    // Sort only the bounded candidates; mandatory labels enter first. The rest
    // use input order, stable across accumulated pages.
    const mandatory = this.data.nodes.filter(n => priority(n.path)).sort((a, b) => priority(b.path) - priority(a.path));
    const candidates = [...mandatory, ...this.data.nodes.filter(n => !priority(n.path))];
    const occupied = []; let count = 0;
    for (const node of candidates) {
      if (count >= this.quality.labels) break;
      const p = this.projected.get(node.path); if (!p?.visible || p.x < 0 || p.x > camera.width || p.y < 0 || p.y > camera.height) continue;
      const maximum = Math.max(10, Math.min(38, Math.floor((camera.width - 48) / 7.4))), title = String(node.title || node.path);
      const text = title.length > maximum ? title.slice(0, maximum - 1) + '…' : title, width = ctx.measureText(text).width;
      const left = p.x + 14 + width > camera.width, x = Math.max(4, Math.min(camera.width - width - 4, p.x + (left ? -14 - width : 14))), y = Math.max(14, Math.min(camera.height - 4, p.y + 4));
      const rect = { x, y: y - 13, w: width, h: 18 };
      if (!priority(node.path) && occupied.some(r => rect.x < r.x + r.w && rect.x + rect.w > r.x && rect.y < r.y + r.h && rect.y + rect.h > r.y)) continue;
      occupied.push(rect); count++; ctx.strokeStyle = this.theme.background; ctx.fillStyle = this.theme.label; ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
      if (node.path === this.current) { ctx.strokeStyle = this.theme.label; ctx.strokeRect(p.x - 9, p.y - 9, 18, 18); }
      if (node.path === this.selected) { ctx.strokeStyle = this.theme.highlight; ctx.beginPath(); ctx.moveTo(p.x, p.y - 13); ctx.lineTo(p.x + 13, p.y); ctx.lineTo(p.x, p.y + 13); ctx.lineTo(p.x - 13, p.y); ctx.closePath(); ctx.stroke(); }
      if (node.path === this.focused) { ctx.strokeStyle = this.theme.focus; ctx.setLineDash([5, 5]); ctx.strokeRect(p.x - 16, p.y - 16, 32, 32); ctx.setLineDash([]); }
    }
  }
  snapshot() { return { renderer: this.container.dataset.renderer, nodes: this.data.nodes.length, edges: this.data.edges.length, selected: this.selected, focused: this.focused, camera: { x: this.camera.x, y: this.camera.y, z: this.camera.z, yaw: this.camera.yaw, pitch: this.camera.pitch, distance: this.camera.distance }, projected: [...this.projected].map(([path, p]) => ({ path, ...p })) }; }
  wake() {
    if (this.destroyed || this.unavailable || document.hidden || this.container.hidden || this.frame !== null || this.paused) return;
    this.lastTime = performance.now(); this.frame = requestAnimationFrame(time => this.tick(time));
  }
  tick(time) {
    this.frame = null; if (this.destroyed || this.unavailable || document.hidden || this.container.hidden || this.paused) return;
    const elapsed = Math.max(0, (time - this.lastTime) / 1000); this.lastTime = time;
    if (this.quality.sample(elapsed)) { this.themeDirty = true; this.syncSize(); }
    // Large layouts get one bounded spatial step per frame; small ones retain
    // fixed-time catch-up. No elapsed pause produces unbounded work.
    this.simulation.advance(this.data.nodes.length > 256 ? Math.min(elapsed, 1 / 60) : elapsed);
    const moving = this.camera.tick(elapsed); this.draw();
    if (this.simulation.active || moving) this.frame = requestAnimationFrame(next => this.tick(next));
    else if (this.simulation.limitReached) this.actions.onLimit?.();
  }
  stop() { if (this.frame !== null) cancelAnimationFrame(this.frame); this.frame = null; }
  destroy() {
    this.release(null, true); this.destroyed = true; this.stop(); this.life.abort(); this.resize.disconnect(); this.themeObserver.disconnect();
    this.batch?.dispose(); this.renderer?.dispose(); this.simulation.destroy(); this.projected.clear(); this.pickGrid?.clear();
    if (this.container.graphView === this) delete this.container.graphView; this.container.replaceChildren();
  }
}
