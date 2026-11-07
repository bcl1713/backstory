export class GraphCamera {
  constructor(width = 960, height = 600) {
    this.width = width; this.height = height;
    this.x = this.y = this.targetX = this.targetY = 0;
    this.scale = this.targetScale = 1;
  }
  world(point) { return { x: this.x + (point.x - this.width / 2) / this.scale, y: this.y + (point.y - this.height / 2) / this.scale }; }
  screen(point) { return { x: (point.x - this.x) * this.scale + this.width / 2, y: (point.y - this.y) * this.scale + this.height / 2 }; }
  snap() { this.x = this.targetX; this.y = this.targetY; this.scale = this.targetScale; }
  zoom(factor, point = { x: this.width / 2, y: this.height / 2 }, immediate = false) {
    const anchor = this.world(point);
    this.targetScale = Math.min(4, Math.max(.15, this.targetScale * factor));
    this.targetX = anchor.x - (point.x - this.width / 2) / this.targetScale;
    this.targetY = anchor.y - (point.y - this.height / 2) / this.targetScale;
    if (immediate) this.snap();
  }
  pan(dx, dy, immediate = false) {
    this.targetX += dx / this.scale; this.targetY += dy / this.scale;
    if (immediate) this.snap();
  }
  fit(nodes, immediate = false) {
    const all = [...nodes.values()];
    if (!all.length) return;
    const xs = all.map(n => n.x), ys = all.map(n => n.y);
    const minX = Math.min(...xs) - 110, maxX = Math.max(...xs) + 110;
    const minY = Math.min(...ys) - 70, maxY = Math.max(...ys) + 70;
    this.targetX = (minX + maxX) / 2; this.targetY = (minY + maxY) / 2;
    this.targetScale = Math.min(2, Math.max(.15, Math.min(this.width / (maxX - minX), this.height / (maxY - minY)) * .85));
    if (immediate) this.snap();
  }
  tick(elapsed, immediate = false) {
    if (immediate) this.snap();
    const weight = 1 - Math.exp(-12 * Math.min(.067, Math.max(0, elapsed)));
    this.x += (this.targetX - this.x) * weight; this.y += (this.targetY - this.y) * weight;
    this.scale += (this.targetScale - this.scale) * weight;
    const moving = Math.abs(this.x - this.targetX) + Math.abs(this.y - this.targetY) + Math.abs(this.scale - this.targetScale) > .005;
    if (!moving) this.snap();
    return moving;
  }
  transform() { return `translate(${this.width / 2} ${this.height / 2}) scale(${this.scale}) translate(${-this.x} ${-this.y})`; }
}
