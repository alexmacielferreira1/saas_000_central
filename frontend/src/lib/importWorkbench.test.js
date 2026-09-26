import { describe, expect, it } from 'vitest';

import { parseDelimited, replaceValues, updateCell, validateRows } from './importWorkbench';

describe('import workbench', () => {
  it('parses quoted CSV into editable columns and rows', () => {
    expect(parseDelimited('nome,email\n"Alex, Maciel",alex@example.com')).toEqual({
      columns: ['nome', 'email'],
      rows: [{ nome: 'Alex, Maciel', email: 'alex@example.com' }],
    });
  });

  it('updates one cell without mutating the source rows', () => {
    const rows = [{ nome: 'Alex', status: 'ativo' }];
    const result = updateCell(rows, 0, 'status', 'inativo');
    expect(result[0].status).toBe('inativo');
    expect(rows[0].status).toBe('ativo');
  });

  it('replaces values in one column and validates required fields', () => {
    const rows = replaceValues(
      [{ email: '', status: 'sim' }, { email: 'a@b.com', status: 'sim' }],
      'status',
      'sim',
      'ativo',
    );
    expect(rows.map((row) => row.status)).toEqual(['ativo', 'ativo']);
    expect(validateRows(rows, ['email'])).toEqual([{ row: 1, fields: ['email'] }]);
  });
});
