export const tableGeometryCases = [3, 12, 30].map(rows => {
  const before = Array.from({ length: 8 }, (_, i) => `Before paragraph ${i + 1}.`);
  const table = ['| Name | Value |', '| --- | --- |', ...Array.from({ length: rows }, (_, i) => `| Row ${i + 1} | A value with enough words to wrap on a narrow screen. |`)];
  const after = Array.from({ length: 14 }, (_, i) => `After paragraph ${i + 1}.`);
  return { rows, source: [...before, '', ...table, '', ...after].join('\n'), tableStart: before.length + 2, tableEnd: before.length + 1 + table.length };
});

const first = tableGeometryCases[0];
const prefix = first.source + '\n\n';
tableGeometryCases.push({ rows: 'multiple', source: prefix + first.source, tableStart: prefix.split('\n').length - 1 + first.tableStart, tableEnd: prefix.split('\n').length - 1 + first.tableEnd });
