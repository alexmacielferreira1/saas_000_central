import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { createPermission, createProfile } from '@/api/access';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NewPermissionDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({ code: '', resource: '', action: '', scope: 'tenant', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await createPermission(form); onCreated?.(); onOpenChange(false); setForm({ code: '', resource: '', action: '', scope: 'tenant', description: '' }); }
    catch (reason) { setError(reason?.message || 'Não foi possível criar a permissão.'); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Nova permissão</DialogTitle><DialogDescription>Cadastre uma ação reutilizável por perfis e políticas.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-3"><Label>Código<Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="saas.read" required /></Label><div className="grid grid-cols-2 gap-3"><Label>Recurso<Input value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })} required /></Label><Label>Ação<Input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} required /></Label></div><Label>Escopo<select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="mt-1 h-9 w-full rounded-md border px-3"><option value="global">Global</option><option value="tenant">Tenant</option><option value="product">Produto</option><option value="own">Próprio</option></select></Label><Label>Descrição<Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Label>{error && <p className="text-sm text-rose-600">{error}</p>}<DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function NewProfileDialog({ open, onOpenChange, onCreated, permissions }) {
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await createProfile(form); onCreated?.(); onOpenChange(false); setForm({ name: '', description: '', permissions: [] }); }
    catch (reason) { setError(reason?.message || 'Não foi possível criar o perfil.'); }
    finally { setSaving(false); }
  };
  const toggle = (code) => setForm((current) => ({ ...current, permissions: current.permissions.includes(code) ? current.permissions.filter((item) => item !== code) : [...current.permissions, code] }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Novo perfil de acesso</DialogTitle><DialogDescription>Monte um pacote versionado usando o catálogo de permissões.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-3"><Label>Nome<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Label><Label>Descrição<Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Label><div><p className="mb-2 text-sm font-medium">Permissões</p><div className="max-h-52 space-y-2 overflow-auto rounded-lg border p-3">{permissions.length ? permissions.map((permission) => <label key={permission.code} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.permissions.includes(permission.code)} onChange={() => toggle(permission.code)} /><span><strong>{permission.code}</strong><span className="block text-xs text-slate-500">{permission.description || `${permission.resource} · ${permission.action}`}</span></span></label>) : <p className="text-sm text-slate-500">Cadastre permissões antes de criar o perfil.</p>}</div></div>{error && <p className="text-sm text-rose-600">{error}</p>}<DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={saving || !permissions.length}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar perfil</Button></DialogFooter></form></DialogContent></Dialog>;
}
