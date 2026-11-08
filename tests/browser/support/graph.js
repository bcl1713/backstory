export async function showGraphLayer(panel, name) {
  const toggle = panel.locator(`[data-graph-toggle="${name}"]`);
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
}
export async function closeGraphLayer(panel) {
  const sheet = panel.locator('[data-graph-overlay]:visible');
  if (await sheet.count()) await sheet.locator('[data-graph-dismiss]').click();
}
export async function graphControl(panel, name) {
  await showGraphLayer(panel, 'controls');
  await panel.locator('[data-graph-control-options]').evaluate(el=>el.open=true);
  await panel.getByRole('button', {name, exact:true}).click();
}
export async function applyGraphFilter(panel, value) {
  await showGraphLayer(panel, 'controls');
  const filters = panel.locator('[data-graph-filter-options]');
  if (!await filters.evaluate(el=>el.open)) await filters.locator(':scope > summary').click();
  await panel.getByRole('searchbox', {name:'Title/path filter',exact:true}).fill(value);
  await panel.getByRole('button', {name:'Apply filters',exact:true}).click();
}
