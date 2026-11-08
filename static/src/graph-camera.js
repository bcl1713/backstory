// Perspective camera independent of the renderer, so projection, picking and
// keyboard navigation share the same view coordinates.
export class GraphCamera {
  constructor(width = 960, height = 600) {
    this.width = width; this.height = height;
    this.x = this.y = this.z = this.targetX = this.targetY = this.targetZ = 0;
    this.yaw = this.pitch = this.targetYaw = this.targetPitch = 0;
    this.distance = this.targetDistance = 900; this.fov = Math.PI / 4;
  }
  get focal() { return this.height / (2 * Math.tan(this.fov / 2)); }
  get scale() { return this.focal / this.distance; }
  basis() {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    return { right: { x: cy, y: 0, z: -sy }, up: { x: sy * sp, y: -cp, z: cy * sp }, back: { x: sy * cp, y: sp, z: cy * cp } };
  }
  eye(basis = this.basis()) { const b = basis.back; return { x: this.x + b.x * this.distance, y: this.y + b.y * this.distance, z: this.z + b.z * this.distance }; }
  world(point, plane = { x: this.x, y: this.y, z: this.z }) {
    const { right, up, back } = this.basis();
    const depth = this.distance - ((plane.x - this.x) * back.x + (plane.y - this.y) * back.y + ((plane.z ?? 0) - this.z) * back.z);
    const u = (point.x - this.width / 2) * depth / this.focal, v = (point.y - this.height / 2) * depth / this.focal;
    const centerDepth = this.distance - depth;
    return { x: this.x + back.x * centerDepth + right.x * u + up.x * v,
      y: this.y + back.y * centerDepth + right.y * u + up.y * v,
      z: this.z + back.z * centerDepth + right.z * u + up.z * v };
  }
  screen(point, result = {}, basis = this.basis()) {
    const { right, up, back } = basis, x = point.x - this.x, y = point.y - this.y, z = (point.z ?? 0) - this.z;
    const depth = this.distance - (x * back.x + y * back.y + z * back.z), scale = this.focal / Math.max(.01, depth);
    result.x = this.width / 2 + (x * right.x + y * right.y + z * right.z) * scale;
    result.y = this.height / 2 + (x * up.x + y * up.y + z * up.z) * scale;
    result.depth = depth; result.scale = scale; result.visible = depth > 1 && depth < 1000000;
    return result;
  }
  snap() { for (const key of ['x', 'y', 'z', 'yaw', 'pitch', 'distance']) this[key] = this['target' + key[0].toUpperCase() + key.slice(1)]; }
  zoom(factor, point = { x: this.width / 2, y: this.height / 2 }, immediate = false) {
    const anchor = this.world(point), ratio = Math.min(200000, Math.max(35, this.targetDistance / factor)) / this.distance;
    this.targetDistance = this.distance * ratio;
    this.targetX = anchor.x + (this.x - anchor.x) * ratio;
    this.targetY = anchor.y + (this.y - anchor.y) * ratio;
    this.targetZ = anchor.z + (this.z - anchor.z) * ratio;
    if (immediate) this.snap();
  }
  pan(dx, dy, immediate = false) {
    const { right, up } = this.basis();
    this.targetX += (right.x * dx + up.x * dy) / this.scale;
    this.targetY += (right.y * dx + up.y * dy) / this.scale;
    this.targetZ += (right.z * dx + up.z * dy) / this.scale;
    if (immediate) this.snap();
  }
  orbit(dx, dy, immediate = false) {
    this.targetYaw += dx; this.targetPitch = Math.max(-1.45, Math.min(1.45, this.targetPitch + dy));
    if (immediate) this.snap();
  }
  resetOrientation(immediate = false) { this.targetYaw = this.targetPitch = 0; if (immediate) this.snap(); }
  fit(nodes, immediate = false) {
    const all = [...nodes.values()]; if (!all.length) return;
    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const n of all) { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); minZ = Math.min(minZ, n.z ?? 0); maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y); maxZ = Math.max(maxZ, n.z ?? 0); }
    this.targetX = (minX + maxX) / 2; this.targetY = (minY + maxY) / 2; this.targetZ = (minZ + maxZ) / 2;
    const radius = Math.max(60, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 + 35);
    const half = Math.min(this.fov / 2, Math.atan(Math.tan(this.fov / 2) * this.width / this.height));
    this.targetDistance = Math.max(150, radius / Math.sin(half) * 1.12);
    if (immediate) this.snap();
  }
  tick(elapsed, immediate = false) {
    if (immediate) this.snap();
    const weight = 1 - Math.exp(-12 * Math.min(.067, Math.max(0, elapsed))); let delta = 0, changed = false;
    for (const key of ['x', 'y', 'z', 'yaw', 'pitch', 'distance']) { const target = this['target' + key[0].toUpperCase() + key.slice(1)], previous = this[key]; this[key] += (target - this[key]) * weight; delta += Math.abs(target - this[key]); changed ||= previous !== this[key]; }
    if (delta <= .0005) this.snap(); return changed || delta > .0005;
  }
}
