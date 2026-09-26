function parseLine(line, delimiter) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) {
      values.push(value.trim());
      value = '';
    } else value += character;
  }
  values.push(value.trim());
  return values;
}

export function parseDelimited(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { columns: [], rows: [] };
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const columns = parseLine(lines[0], delimiter).map((column, index) => column || `coluna_${index + 1}`);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line, delimiter);
    return Object.fromEntries(columns.map((column, index) => [column, values[index] || '']));
  });
  return { columns, rows };
}

export function updateCell(rows, rowIndex, column, value) {
  return rows.map((row, index) => (index === rowIndex ? { ...row, [column]: value } : row));
}

export function replaceValues(rows, column, search, replacement) {
  return rows.map((row) => ({
    ...row,
    [column]: String(row[column] ?? '').split(search).join(replacement),
  }));
}

export function validateRows(rows, requiredColumns) {
  return rows.flatMap((row, index) => {
    const fields = requiredColumns.filter((column) => !String(row[column] ?? '').trim());
    return fields.length ? [{ row: index + 1, fields }] : [];
  });
}

export function serializeCsv(columns, rows) {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [columns.map(escape).join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
}
