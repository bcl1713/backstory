import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as renderer from '../../static/src/graph-view.js';

test('renderer batches every eligible node and directed edge without per-node objects', () => {
  assert.equal(typeof renderer.createGraphBatches, 'function');
  const nodes = Array.from({ length: 10000 }, (_, i) => ({ path: `n${i}` }));
  const edges = Array.from({ length: 30000 }, (_, i) => ({ source: `n${i % 10000}`, destination: `n${(i + 1) % 10000}` }));
  const batch = renderer.createGraphBatches(nodes, edges);
  assert.ok(batch.nodes instanceof THREE.InstancedMesh);
  assert.equal(batch.nodes.count, 10000);
  assert.equal(batch.edges.geometry.attributes.position.count, 60000);
  assert.equal(batch.arrows.geometry.attributes.position.count, 90000);
  assert.equal(batch.halos.geometry.attributes.position.count, 10000);
  assert.equal(batch.group.children.length, 5);
  assert.equal(batch.edgeHalos.geometry.attributes.position.count, 180000);
  assert.equal(batch.edgeHalos.material.forceSinglePass, true);
  assert.equal(batch.arrows.material.forceSinglePass, true);
  let disposed = 0;
  batch.nodes.geometry.addEventListener('dispose', () => disposed++);
  batch.dispose();
  assert.equal(disposed, 1);
});
