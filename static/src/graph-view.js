import { GraphPhysics } from './graph-physics.js';
import { GraphCamera } from './graph-camera.js';
import { hopTiers, emission, nearestNode } from './graph-layout.js';

const svgElement = (name, attrs = {}) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
};
let instance = 0;

export class GraphView {
  constructor(container, actions) {
    this.container = container; this.actions = actions;
    this.simulation = new GraphPhysics(); this.camera = new GraphCamera();
    this.life = new AbortController(); this.frame = null; this.destroyed = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.paused = this.reduced.matches; this.intensity = 1; this.drag = null;
    this.data = { nodes: [], edges: [] }; this.focused = this.selected = null;
    this.pixelRatio = 1;
    const id = `graph-arrow-${++instance}`;
    this.svg = svgElement('svg', { viewBox: '0 0 960 600', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' });
    const defs = svgElement('defs');
    const marker = svgElement('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse' });
    this.marker = marker;
    marker.append(svgElement('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'graph-arrow' }));
    const filter = svgElement('filter', { id: id + '-bloom', x: '-10%', y: '-10%', width: '120%', height: '120%' });
    this.blur = svgElement('feGaussianBlur', { stdDeviation: 3 }); filter.append(this.blur);
    defs.append(marker, filter); this.svg.append(defs);
    this.frameMarks = svgElement('path', { class: 'graph-frame' }); this.svg.append(this.frameMarks);
    this.world = svgElement('g', { class: 'graph-world' });
    this.halos = svgElement('g', { class: 'graph-bloom', filter: `url(#${id}-bloom)` });
    this.edgeLayer = svgElement('g'); this.nodeLayer = svgElement('g');
    this.world.append(this.halos, this.edgeLayer, this.nodeLayer); this.svg.append(this.world);
    this.arrow = `url(#${id})`;
    container.replaceChildren(this.svg);
    this.resize = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (!width || !height) return;
      this.pixelRatio = width / this.camera.width;
      this.viewportWidth = width;
      this.camera.height = this.camera.width * height / width;
      this.svg.setAttribute('viewBox', `0 0 ${this.camera.width} ${this.camera.height}`);
      if (!this.sized && this.loaded) this.camera.fit(this.simulation.nodes, true);
      this.sized = true; this.draw();
    });
    this.resize.observe(container);
    const listen = (el, type, fn, options = {}) => el.addEventListener(type, fn, { ...options, signal: this.life.signal });
    listen(container, 'keydown', event => this.keydown(event));
    listen(container, 'pointerdown', event => this.pointerDown(event));
    listen(container, 'pointermove', event => this.pointerMove(event));
    listen(container, 'pointerup', event => this.release(event, false));
    for (const name of ['pointercancel', 'lostpointercapture', 'pointerleave']) listen(container, name, event => this.release(event, true));
    listen(container, 'wheel', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault(); this.zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12, this.point(event));
    }, { passive: false });
    listen(document, 'visibilitychange', () => {
      if (document.hidden) { this.release(null, true); this.stop(); }
      else this.wake();
    });
    listen(this.reduced, 'change', () => {
      this.paused = this.reduced.matches; this.simulation.settle(); this.camera.snap();
      this.actions.onPause?.(this.paused); this.draw(); if (!this.paused) { this.simulation.reheat(); this.wake(); }
    });
  }
  setGraph(data, current) {
    this.release(null, true);
    this.data = data; this.current = current;
    this.simulation.setGraph(data.nodes, data.edges);
    if (this.paused || this.reduced.matches) this.simulation.settle();
    else if (!this.loaded) for (let i = 0; i < (data.nodes.length > 50 ? 90 : 12); i++) this.simulation.step();
    this.halos.replaceChildren(); this.edgeLayer.replaceChildren(); this.nodeLayer.replaceChildren();
    this.edgeElements = data.edges.map(edge => {
      const line = svgElement('line', { class: 'graph-edge', 'marker-end': this.arrow });
      const halo = svgElement('line', { class: 'graph-edge-halo' });
      this.edgeLayer.append(line); this.halos.append(halo);
      return { edge, line, halo };
    });
    this.nodeElements = new Map(data.nodes.map(node => {
      const group = svgElement('g', { 'data-node-path': node.path, class: 'graph-node' });
      const title = svgElement('title'); title.textContent = `${node.title} · ${node.path}`;
      const halo = svgElement('circle', { r: 19, class: 'graph-node-halo' });
      const circle = svgElement('circle', { r: 6, class: 'graph-node-mark' });
      const current = svgElement('rect', { x: -10, y: -10, width: 20, height: 20, class: 'graph-current' });
      const diamond = svgElement('path', { d: 'M 0 -13 L 13 0 L 0 13 L -13 0 Z', class: 'graph-selected' });
      const reticle = svgElement('path', { d: 'M -18 -9 V -18 H -9 M 9 -18 H 18 V -9 M -18 9 V 18 H -9 M 9 18 H 18 V 9', class: 'graph-reticle' });
      const hit = svgElement('circle', { r: 24, class: 'graph-hit' });
      const label = svgElement('text', { x: 17, y: 5, class: 'graph-label' });
      label.textContent = node.title.length > 38 ? node.title.slice(0, 37) + '…' : node.title;
      group.append(title, hit, circle, current, diamond, reticle, label);
      this.nodeLayer.append(group); this.halos.append(halo);
      return [node.path, { group, halo, label, title: node.title }];
    }));
    this.setSelection(this.selected, this.focused);
    if (!this.loaded) { this.camera.fit(this.simulation.nodes, true); this.loaded = true; }
    this.draw(); this.wake();
  }
  setSelection(selected, focused) {
    this.selected = selected; this.focused = focused;
    this.tiers = hopTiers(this.data.nodes, this.data.edges, selected);
    this.container.dataset.selected = selected || '';
    this.container.dataset.focused = focused || '';
    const node = this.data.nodes.find(node => node.path === focused);
    this.container.setAttribute('aria-label', `Note relationship map${node ? ` · Focused ${node.title}, ${node.path}` : ''}`);
    for (const [path, { group, halo }] of this.nodeElements || []) {
      group.classList.toggle('is-selected', path === selected);
      group.classList.toggle('is-focused', path === focused);
      group.classList.toggle('is-current', path === this.current);
      group.setAttribute('data-hop', String(this.tiers.nodes.get(path)));
      halo.setAttribute('data-hop', String(this.tiers.nodes.get(path)));
      halo.setAttribute('opacity', emission(this.tiers.nodes.get(path), this.intensity) * .4);
    }
    for (const [index, { line, halo }] of (this.edgeElements || []).entries()) {
      const tier = this.tiers.edges[index];
      line.setAttribute('data-hop', String(tier)); halo.setAttribute('opacity', emission(tier, this.intensity) * .28);
      line.classList.toggle('is-near', tier <= 1);
    }
    for (const path of [this.current, this.focused, this.selected]) {
      const group = this.nodeElements?.get(path)?.group;
      if (group) this.nodeLayer.append(group);
    }
    this.draw();
  }
  setBloom(value) {
    this.intensity = Math.min(2, Math.max(0, Number(value) || 0));
    this.container.dataset.bloom = String(this.intensity);
    this.setSelection(this.selected, this.focused);
  }
  setPaused(value) {
    this.paused = value || this.reduced.matches;
    this.release(null, true);
    if (this.paused) { this.simulation.active = false; this.camera.snap(); this.stop(); }
    else { this.simulation.reheat(); this.wake(); }
    this.actions.onPause?.(this.paused); this.draw();
  }
  fit() { this.camera.fit(this.simulation.nodes, this.paused); this.draw(); this.wake(); }
  zoom(factor, point) {
    const focused = this.simulation.nodes.get(this.focused);
    this.camera.zoom(factor, point || (focused ? this.camera.screen(focused) : undefined), this.paused);
    this.draw(); this.wake();
  }
  pan(dx, dy) { this.camera.pan(dx, dy, this.paused); this.draw(); this.wake(); }
  keydown(event) {
    if (event.target !== this.container || event.isComposing || event.altKey || event.metaKey || event.ctrlKey || event.getModifierState?.('AltGraph')) return;
    const directions = { ArrowLeft: 'left', h: 'left', ArrowRight: 'right', l: 'right', ArrowUp: 'up', k: 'up', ArrowDown: 'down', j: 'down' };
    const direction = directions[event.key];
    if (direction) {
      const visible = new Map([...this.simulation.nodes].filter(([path, position]) => {
        const point = this.camera.screen(position);
        return path === this.focused || point.x >= 0 && point.x <= this.camera.width && point.y >= 0 && point.y <= this.camera.height;
      }));
      const path = nearestNode(visible, this.focused, direction);
      if (path) this.actions.onSelect(path, true);
    } else if (event.key === 'Enter') this.actions.onOpen(this.focused);
    else if (event.key === ' ') this.actions.onCenter(this.focused);
    else if (event.key === '/') this.actions.onSearch();
    else if (event.key === '?') this.actions.onHelp();
    else if (event.key === 'Escape') this.actions.onEscape();
    else if (event.key === '+' || event.key === '=') this.zoom(1.25);
    else if (event.key === '-') this.zoom(.8);
    else return; // Tab and browser shortcuts retain their ordinary behavior.
    event.preventDefault(); event.stopPropagation();
  }
  point(event) {
    const bounds = this.svg.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * this.camera.width / bounds.width, y: (event.clientY - bounds.top) * this.camera.height / bounds.height };
  }
  pointerDown(event) {
    if (this.drag || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey) return;
    const point = this.point(event);
    let path = null, nearest = 24 / this.pixelRatio;
    for (const [candidate, position] of [...this.simulation.nodes].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
      const screen = this.camera.screen(position), distance = Math.hypot(point.x - screen.x, point.y - screen.y);
      if (distance < nearest) { nearest = distance; path = candidate; }
    }
    this.drag = { pointer: event.pointerId, path, start: point, previous: point, moved: false };
    this.container.focus({ preventScroll: true });
    this.container.setPointerCapture(event.pointerId);
    if (path) {
      const world = this.camera.world(point); this.simulation.pin(path, world.x, world.y);
      this.container.dataset.pinned = 'true';
      if (!this.paused) this.wake();
    }
  }
  pointerMove(event) {
    const drag = this.drag;
    if (!drag || drag.pointer !== event.pointerId) return;
    const point = this.point(event);
    if (Math.hypot(point.x - drag.start.x, point.y - drag.start.y) > 5 / this.pixelRatio) drag.moved = true;
    if (!drag.moved) return;
    if (drag.path) {
      const world = this.camera.world(point); this.simulation.pin(drag.path, world.x, world.y);
    } else {
      this.camera.pan(drag.previous.x - point.x, drag.previous.y - point.y, true);
    }
    drag.previous = point; this.draw(); if (!this.paused) this.wake();
  }
  release(event, cancelled) {
    const drag = this.drag;
    if (!drag || event && event.pointerId !== drag.pointer) return;
    this.drag = null;
    if (drag.path) this.simulation.unpin(drag.path);
    this.container.dataset.pinned = 'false';
    if (this.container.hasPointerCapture(drag.pointer)) this.container.releasePointerCapture(drag.pointer);
    if (!cancelled && !drag.moved && drag.path) this.actions.onSelect(drag.path, true);
    if (!this.paused) this.wake();
  }
  draw() {
    if (this.destroyed) return;
    const inverse = 1 / (this.camera.scale * this.pixelRatio);
    const maximum = Math.max(12, Math.min(38, Math.floor(((this.viewportWidth || 960) - 50) / 7.4)));
    this.marker.setAttribute('markerWidth', 7 * inverse); this.marker.setAttribute('markerHeight', 7 * inverse);
    this.blur.setAttribute('stdDeviation', Math.min(28, 3 * inverse));
    const height = this.camera.height;
    this.frameMarks.setAttribute('d', `M24 90 V24 H90 M870 24 H936 V90 M24 ${height - 90} V${height - 24} H90 M870 ${height - 24} H936 V${height - 90} M24 ${height / 2} H936`);
    this.world.setAttribute('transform', this.camera.transform());
    for (const { edge, line, halo } of this.edgeElements || []) {
      const a = this.simulation.nodes.get(edge.source), b = this.simulation.nodes.get(edge.destination);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy));
      const padding = Math.min(distance * .35, 12 * inverse);
      for (const el of [line, halo]) {
        el.setAttribute('x1', a.x + dx / distance * padding); el.setAttribute('y1', a.y + dy / distance * padding);
        el.setAttribute('x2', b.x - dx / distance * padding); el.setAttribute('y2', b.y - dy / distance * padding);
      }
    }
    const occupied = [];
    const priority = path => path === this.selected ? 3 : path === this.focused ? 2 : path === this.current ? 1 : 0;
    const entries = [...(this.nodeElements || [])].sort(([a], [b]) => priority(b) - priority(a));
    for (const [path, { group, halo, label, title }] of entries) {
      const node = this.simulation.nodes.get(path);
      group.setAttribute('transform', `translate(${node.x} ${node.y}) scale(${inverse})`);
      halo.setAttribute('cx', node.x); halo.setAttribute('cy', node.y);
      halo.setAttribute('r', 19 * inverse);
      const point = this.camera.screen(node);
      const text = title.length > maximum ? title.slice(0, maximum - 1) + '…' : title;
      if (label.textContent !== text) label.textContent = text;
      const width = text.length * 7.4 / this.pixelRatio;
      const left = point.x + 17 / this.pixelRatio + width > this.camera.width;
      label.setAttribute('text-anchor', left ? 'end' : 'start'); label.setAttribute('x', left ? -17 : 17);
      const rect = { x: point.x + (left ? -17 / this.pixelRatio - width : 17 / this.pixelRatio), y: point.y - 11 / this.pixelRatio, w: width, h: 20 / this.pixelRatio };
      const overlaps = occupied.some(r => rect.x < r.x + r.w && rect.x + rect.w > r.x && rect.y < r.y + r.h && rect.y + rect.h > r.y);
      label.classList.toggle('is-decluttered', overlaps && priority(path) === 0);
      if (!overlaps || priority(path)) occupied.push(rect);
    }
    this.container.dataset.motion = this.paused || this.reduced.matches ? 'paused' : this.simulation.active ? 'moving' : 'settled';
  }
  wake() {
    if (this.destroyed || document.hidden || this.container.hidden || this.frame !== null || this.paused) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(time => this.tick(time));
  }
  tick(time) {
    this.frame = null;
    if (this.destroyed || document.hidden || this.paused) return;
    const elapsed = Math.max(0, (time - this.lastTime) / 1000); this.lastTime = time;
    this.slow = elapsed > .04 ? (this.slow || 0) + 1 : 0;
    if (this.slow >= 4) this.container.dataset.lowWork = 'true';
    this.simulation.advance(this.container.dataset.lowWork === 'true' ? Math.min(elapsed, 2 / 60) : elapsed);
    const cameraMoving = this.camera.tick(elapsed);
    this.draw();
    if (this.simulation.active || cameraMoving) this.frame = requestAnimationFrame(next => this.tick(next));
    else if (this.simulation.limitReached) this.actions.onLimit?.();
  }
  stop() { if (this.frame !== null) cancelAnimationFrame(this.frame); this.frame = null; }
  destroy() { this.release(null, true); this.destroyed = true; this.stop(); this.life.abort(); this.resize.disconnect(); this.simulation.destroy(); this.container.replaceChildren(); }
}
