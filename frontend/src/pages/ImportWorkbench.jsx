import React, { useMemo, useState } from 'react';
import { DatabaseZap, Download, FileSpreadsheet, Replace, ShieldCheck, Upload } from 'lucide-react';

import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardBody, EmptyState, KpiCard } from '@/components/ui-primitives';
import { parseDelimited, replaceValues, serializeCsv, updateCell, validateRows } from '@/lib/importWorkbench';

export default function ImportWorkbench() {
  const [fileName, setFileName] = useState('');
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [required, setRequired] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [search, setSearch] = useState('');
  const [replacement, setReplacement] = useState('');
  const errors = useMemo(() => validateRows(rows, required), [rows, required]);

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = parseDelimited(await file.text());
    setFileName(file.name);
    setColumns(parsed.columns);
    setRows(parsed.rows);
    setRequired([]);
    setSelectedColumn(parsed.columns[0] || '');
  };

  const download = () => {
    const blob = new Blob([serializeCsv(columns, rows)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName.replace(/\.[^.]+$/, '') || 'dados'}-tratado.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div>
      <PageHeader title="PowerQuery de importação" description="Carregue CSV, revise e corrija os dados antes da importação definitiva." icon={DatabaseZap} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Linhas" value={rows.length} icon={FileSpreadsheet} tone="indigo" />
        <KpiCard label="Colunas" value={columns.length} icon={DatabaseZap} tone="sky" />
        <KpiCard label="Erros" value={errors.length} icon={ShieldCheck} tone={errors.length ? 'rose' : 'emerald'} />
        <KpiCard label="Arquivo" value={fileName || '—'} icon={Upload} tone="amber" />
      </div>
      <Card className="mb-4"><CardBody>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Arquivo CSV</span><input type="file" accept=".csv,text/csv" onChange={loadFile} className="block text-sm" /></label>
          {columns.length > 0 && <>
            <label><span className="mb-1 block text-xs font-medium text-slate-600">Coluna</span><select value={selectedColumn} onChange={(e) => setSelectedColumn(e.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-sm">{columns.map((column) => <option key={column}>{column}</option>)}</select></label>
            <label><span className="mb-1 block text-xs font-medium text-slate-600">Localizar</span><input value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-sm" /></label>
            <label><span className="mb-1 block text-xs font-medium text-slate-600">Substituir por</span><input value={replacement} onChange={(e) => setReplacement(e.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-sm" /></label>
            <Button variant="outline" onClick={() => setRows(replaceValues(rows, selectedColumn, search, replacement))} disabled={!search}><Replace className="mr-2 h-4 w-4" />Substituir</Button>
            <Button onClick={download}><Download className="mr-2 h-4 w-4" />Exportar tratado</Button>
          </>}
        </div>
        {columns.length > 0 && <div className="mt-4 flex flex-wrap gap-2"><span className="text-xs font-medium text-slate-500">Obrigatórias:</span>{columns.map((column) => <label key={column} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={required.includes(column)} onChange={(e) => setRequired((items) => e.target.checked ? [...items, column] : items.filter((item) => item !== column))} />{column}</label>)}</div>}
      </CardBody></Card>
      {!columns.length ? <Card><EmptyState icon={Upload} title="Selecione um CSV" description="A prévia editável aparecerá aqui; nenhum dado é gravado antes da sua confirmação." /></Card> : <Card><div className="overflow-auto"><table className="min-w-full text-sm"><thead className="sticky top-0 bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs text-slate-500">#</th>{columns.map((column) => <th key={column} className="px-3 py-2 text-left text-xs text-slate-500">{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => { const invalid = errors.find((error) => error.row === rowIndex + 1); return <tr key={rowIndex} className={invalid ? 'bg-rose-50' : 'border-t border-slate-100'}><td className="px-3 py-2 text-xs text-slate-400">{rowIndex + 1}</td>{columns.map((column) => <td key={column} className="p-1"><input aria-label={`${column} linha ${rowIndex + 1}`} value={row[column]} onChange={(e) => setRows(updateCell(rows, rowIndex, column, e.target.value))} className={`min-w-32 rounded border px-2 py-1.5 ${invalid?.fields.includes(column) ? 'border-rose-400' : 'border-transparent hover:border-slate-200 focus:border-indigo-400'}`} /></td>)}</tr>; })}</tbody></table></div></Card>}
    </div>
  );
}
