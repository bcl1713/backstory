import { expect } from '@playwright/test';
import { parse } from 'yaml';

export function expectCreatedMetadata(source, body, id) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n\n/);
  expect(match).not.toBeNull();
  const metadata = parse(match[1]);
  expect(Object.keys(metadata).sort()).toEqual(['created', 'id', 'modified']);
  expect(metadata.id).toBe(id);
  expect(metadata.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(metadata.modified).toBe(metadata.created);
  expect(source.slice(match[0].length)).toBe(body);
}
